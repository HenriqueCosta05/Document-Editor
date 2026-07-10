from django.db import transaction

from collab.domain.entities import DocSnapshot
from collab.domain.errors import DocumentNotFoundError
from collab.models import Document
from collab.services import content_cache


class DocumentRepository:
    def get(self, doc_id: str) -> DocSnapshot:
        try:
            doc = Document.objects.get(pk=doc_id)
        except Document.DoesNotExist as exc:
            raise DocumentNotFoundError(doc_id) from exc

        # Content may still be sitting in the write-behind cache (see
        # content_cache) rather than sqlite yet. version is always fresh in
        # the DB row, so a pending entry is only relevant if it's for that
        # same version — otherwise it's a stale entry for a version another
        # flush already superseded.
        pending = content_cache.get_pending(doc_id)
        if pending and pending["version"] == doc.version:
            return DocSnapshot(doc_id=doc.id, title=doc.title, content=pending["content"], version=doc.version)

        return DocSnapshot(
            doc_id=doc.id,
            title=doc.title,
            content=doc.content,
            version=doc.version,
        )

    def get_for_update(self, doc_id: str) -> Document:
        """Row-locked ORM instance for use inside an atomic block that
        also appends Steps, so concurrent submissions serialize."""
        return Document.objects.select_for_update().get(pk=doc_id)

    def bump_version(self, doc_id: str, version: int) -> None:
        """Durable, synchronous version bump — cheap, and must never lag
        since it's what the next submission's conflict check reads."""
        Document.objects.filter(pk=doc_id).update(version=version)

    @transaction.atomic
    def save_snapshot(self, doc_id: str, content: dict, version: int) -> None:
        Document.objects.filter(pk=doc_id).update(content=content, version=version)

    def flush_pending(self, doc_id: str) -> int | None:
        """Writes the cached content for doc_id to sqlite, if there still
        is one (a newer flush or a version rollback could have cleared it
        first). Returns the version written, or None if there was nothing
        to flush."""
        pending = content_cache.get_pending(doc_id)
        if pending is None:
            return None
        Document.objects.filter(pk=doc_id).update(content=pending["content"])
        content_cache.clear_pending(doc_id)
        return pending["version"]
