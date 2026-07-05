from django.db import transaction

from collab.domain.entities import DocSnapshot
from collab.domain.errors import DocumentNotFoundError
from collab.models import Document


class DocumentRepository:
    def get(self, doc_id: str) -> DocSnapshot:
        try:
            doc = Document.objects.get(pk=doc_id)
        except Document.DoesNotExist as exc:
            raise DocumentNotFoundError(doc_id) from exc
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

    @transaction.atomic
    def save_snapshot(self, doc_id: str, content: dict, version: int) -> None:
        Document.objects.filter(pk=doc_id).update(content=content, version=version)
