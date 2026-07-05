from django.db import transaction

from collab.domain.entities import DocSnapshot, StepRecord, SubmitResult
from collab.repositories.document_repository import DocumentRepository
from collab.repositories.step_repository import StepRepository


def get_snapshot(doc_repo: DocumentRepository, doc_id: str) -> DocSnapshot:
    return doc_repo.get(doc_id)


@transaction.atomic
def submit_steps(
    doc_repo: DocumentRepository,
    step_repo: StepRepository,
    doc_id: str,
    client_base_version: int,
    steps: list[dict],
    client_id: str,
    author_name: str,
    author_id: str,
    author_color: str,
    new_content: dict,
) -> SubmitResult:
    """
    The server does not reconstruct/apply ProseMirror steps itself (that
    requires a JS Schema instance). Following ProseMirror's own reference
    collab server design, it only orders and stores steps, trusting the
    submitting client's own post-transaction `new_content` — that client
    already applied the transaction locally before sending.

    Conflict handling: if the client's baseVersion no longer matches the
    server's current version, reject and return the steps the client
    missed so it can rebase locally via receiveTransaction and resend.
    """
    current = doc_repo.get_for_update(doc_id)

    if client_base_version != current.version:
        return SubmitResult(
            accepted=False,
            steps_since=step_repo.steps_since(doc_id, client_base_version),
        )

    records = [
        StepRecord(
            version=current.version + i + 1,
            step=step,
            client_id=client_id,
            author_name=author_name,
            author_id=author_id,
            author_color=author_color,
        )
        for i, step in enumerate(steps)
    ]
    new_version = current.version + len(steps)

    doc_repo.save_snapshot(doc_id, new_content, new_version)
    step_repo.append_many(doc_id, records)

    return SubmitResult(accepted=True, new_version=new_version, records=records)
