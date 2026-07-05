from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from collab.repositories.document_repository import DocumentRepository
from collab.repositories.identity_repository import IdentityRepository
from collab.repositories.step_repository import StepRepository
from collab.services.collab_service import submit_steps
from collab.services.identity_service import resolve_or_create_identity


class DocumentCollabConsumer(AsyncJsonWebsocketConsumer):
    """One consumer instance per WebSocket connection. Connections for the
    same doc_id join a shared channel group so accepted steps from any
    client broadcast to every tab editing that document."""

    async def connect(self):
        self.doc_id = self.scope["url_route"]["kwargs"]["doc_id"]
        self.group_name = f"doc.{self.doc_id}"
        self.identity = None
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")
        if msg_type == "identify":
            await self._handle_identify(content)
        elif msg_type == "submit_steps":
            await self._handle_submit_steps(content)

    async def _handle_identify(self, content):
        self.identity = await database_sync_to_async(resolve_or_create_identity)(
            IdentityRepository(),
            content.get("identityId"),
            content["displayName"],
        )
        await self.send_json(
            {
                "type": "identified",
                "identity": {
                    "id": self.identity.id,
                    "displayName": self.identity.display_name,
                    "color": self.identity.color,
                },
            }
        )

    async def _handle_submit_steps(self, content):
        author_name = self.identity.display_name if self.identity else "anonymous"
        result = await database_sync_to_async(submit_steps)(
            DocumentRepository(),
            StepRepository(),
            self.doc_id,
            content["version"],
            content["steps"],
            content["clientID"],
            author_name,
            content["docJSON"],
        )

        if result.accepted:
            await self.send_json({"type": "submit_ack", "version": result.new_version})
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "broadcast_steps",
                    "steps": [r.step for r in result.records],
                    "client_ids": [r.client_id for r in result.records],
                    "version": result.new_version,
                },
            )
        else:
            await self.send_json(
                {
                    "type": "rebase_required",
                    "steps": [r.step for r in result.steps_since],
                    "clientIDs": [r.client_id for r in result.steps_since],
                    "version": result.steps_since[-1].version if result.steps_since else content["version"],
                }
            )

    async def broadcast_steps(self, event):
        """Group event handler. Broadcasts to every member including the
        sender — prosemirror-collab's receiveTransaction(state, steps,
        clientIDs) recognizes the sender's own clientID and no-ops on it,
        which is simpler than excluding the sender's channel at this layer
        (Channels' group_send has no built-in exclusion)."""
        await self.send_json(
            {
                "type": "new_steps",
                "steps": event["steps"],
                "clientIDs": event["client_ids"],
                "version": event["version"],
            }
        )
