import pytest
from channels.testing import WebsocketCommunicator

from collab.interfaces.ws.consumers import DocumentCollabConsumer
from collab.models import Document

pytestmark = pytest.mark.django_db


@pytest.mark.asyncio
async def test_broadcast_reaches_other_client_in_same_document_group():
    await Document.objects.acreate(id="doc-1", content={"type": "doc", "content": []}, version=0)

    alice = WebsocketCommunicator(DocumentCollabConsumer.as_asgi(), "/ws/documents/doc-1/")
    alice.scope["url_route"] = {"kwargs": {"doc_id": "doc-1"}}
    bob = WebsocketCommunicator(DocumentCollabConsumer.as_asgi(), "/ws/documents/doc-1/")
    bob.scope["url_route"] = {"kwargs": {"doc_id": "doc-1"}}

    connected, _ = await alice.connect()
    assert connected
    connected, _ = await bob.connect()
    assert connected

    await alice.send_json_to({"type": "identify", "displayName": "Alice", "identityId": None})
    identified = await alice.receive_json_from()
    assert identified["type"] == "identified"

    await alice.send_json_to(
        {
            "type": "submit_steps",
            "version": 0,
            "steps": [{"stepType": "replace"}],
            "clientID": "alice-client",
            "docJSON": {"type": "doc", "content": ["hi"]},
        }
    )

    ack = await alice.receive_json_from()
    assert ack == {"type": "submit_ack", "version": 1}

    broadcast_to_alice = await alice.receive_json_from()
    broadcast_to_bob = await bob.receive_json_from()

    for msg in (broadcast_to_alice, broadcast_to_bob):
        assert msg["type"] == "new_steps"
        assert msg["version"] == 1
        assert msg["clientIDs"] == ["alice-client"]

    updated = await Document.objects.aget(pk="doc-1")
    assert updated.version == 1
    assert updated.content == {"type": "doc", "content": ["hi"]}

    await alice.disconnect()
    await bob.disconnect()
