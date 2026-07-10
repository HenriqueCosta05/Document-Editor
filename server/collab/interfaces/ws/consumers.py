import asyncio
from collections import defaultdict

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from collab.repositories.document_repository import DocumentRepository
from collab.repositories.identity_repository import IdentityRepository
from collab.repositories.step_repository import StepRepository
from collab.services.collab_service import submit_steps
from collab.services.identity_service import resolve_or_create_identity

# DocumentRepository.get_for_update() uses select_for_update(), which SQLite
# silently ignores (no real row lock). Without this, two submit_steps calls
# for the same doc racing across connections can both read the same
# current.version, both pass the version check, and both write — corrupting
# the doc. This serializes submissions per doc_id within this process.
_document_locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

# How long a document must go without an accepted step before its cached
# content gets written to sqlite (see content_cache). A module-level
# constant, not a magic number inline, so tests can shrink it.
FLUSH_DEBOUNCE_SECONDS = 2.0

_flush_tasks: dict[str, asyncio.Task] = {}
_presence_counts: dict[str, int] = defaultdict(int)


def _schedule_flush(doc_id: str, group_name: str, channel_layer) -> None:
    existing = _flush_tasks.get(doc_id)
    if existing and not existing.done():
        existing.cancel()
    _flush_tasks[doc_id] = asyncio.create_task(_flush_after_delay(doc_id, group_name, channel_layer))


async def _flush_after_delay(doc_id: str, group_name: str, channel_layer) -> None:
    try:
        await asyncio.sleep(FLUSH_DEBOUNCE_SECONDS)
    except asyncio.CancelledError:
        return
    # Natural completion — drop our own entry (not via _flush_now's
    # cancel-and-pop, which would cancel the task currently running this
    # very function) before doing the write.
    _flush_tasks.pop(doc_id, None)
    await _write_and_broadcast(doc_id, group_name, channel_layer)


async def _flush_now(doc_id: str, group_name: str, channel_layer) -> None:
    """Flushes immediately, e.g. when the last tab on a doc disconnects
    and there's no reason to wait out the rest of the debounce."""
    task = _flush_tasks.pop(doc_id, None)
    if task and not task.done():
        task.cancel()
    await _write_and_broadcast(doc_id, group_name, channel_layer)


async def _write_and_broadcast(doc_id: str, group_name: str, channel_layer) -> None:
    # Shares _document_locks with _handle_submit_steps: flush_pending()
    # writes the same Document row that submit_steps's transaction does.
    # Without this lock the two can race under SQLite (no real row lock
    # from select_for_update there — see get_for_update's docstring),
    # and a flush landing mid-submit raises "database is locked", silently
    # dropping that step's ack/broadcast.
    async with _document_locks[doc_id]:
        version = await database_sync_to_async(DocumentRepository().flush_pending)(doc_id)
    if version is not None:
        await channel_layer.group_send(group_name, {"type": "broadcast_content_saved", "version": version})


def _author_payload(record):
    return {"id": record.author_id, "displayName": record.author_name, "color": record.author_color}


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
        _presence_counts[self.doc_id] += 1

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        if self.identity:
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "broadcast_cursor_left", "identity_id": self.identity.id},
            )

        _presence_counts[self.doc_id] -= 1
        if _presence_counts[self.doc_id] <= 0:
            # Last tab on this document closed — flush any debounced content
            # now rather than leaving it cached in-process until the next
            # editor for this doc happens to show up (or never, if the
            # process restarts first).
            del _presence_counts[self.doc_id]
            await _flush_now(self.doc_id, self.group_name, self.channel_layer)

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")
        if msg_type == "identify":
            await self._handle_identify(content)
        elif msg_type == "submit_steps":
            await self._handle_submit_steps(content)
        elif msg_type == "cursor":
            await self._handle_cursor(content)

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
        author_id = self.identity.id if self.identity else ""
        author_color = self.identity.color if self.identity else "#000000"
        async with _document_locks[self.doc_id]:
            result = await database_sync_to_async(submit_steps)(
                DocumentRepository(),
                StepRepository(),
                self.doc_id,
                content["version"],
                content["steps"],
                content["clientID"],
                author_name,
                author_id,
                author_color,
                content["docJSON"],
            )

        if result.accepted:
            _schedule_flush(self.doc_id, self.group_name, self.channel_layer)
            await self.send_json({"type": "submit_ack", "version": result.new_version})
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "broadcast_steps",
                    "steps": [r.step for r in result.records],
                    "client_ids": [r.client_id for r in result.records],
                    "authors": [_author_payload(r) for r in result.records],
                    "version": result.new_version,
                },
            )
        else:
            await self.send_json(
                {
                    "type": "rebase_required",
                    "steps": [r.step for r in result.steps_since],
                    "clientIDs": [r.client_id for r in result.steps_since],
                    "authors": [_author_payload(r) for r in result.steps_since],
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
                "authors": event["authors"],
                "version": event["version"],
            }
        )

    async def _handle_cursor(self, content):
        if not self.identity:
            return
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "broadcast_cursor",
                "identity": {
                    "id": self.identity.id,
                    "displayName": self.identity.display_name,
                    "color": self.identity.color,
                },
                "from": content["from"],
                "to": content["to"],
            },
        )

    async def broadcast_cursor(self, event):
        """Also echoed to the sender, like broadcast_steps — the client
        filters out its own identity id rather than the server excluding
        the sender's channel."""
        await self.send_json(
            {
                "type": "cursor_update",
                "identity": event["identity"],
                "from": event["from"],
                "to": event["to"],
            }
        )

    async def broadcast_cursor_left(self, event):
        await self.send_json({"type": "cursor_left", "identityId": event["identity_id"]})

    async def broadcast_content_saved(self, event):
        await self.send_json({"type": "content_saved", "version": event["version"]})
