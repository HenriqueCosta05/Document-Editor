import pytest

from collab.domain.entities import StepRecord
from collab.models import Document
from collab.repositories.document_repository import DocumentRepository
from collab.repositories.step_repository import StepRepository
from collab.services.collab_service import get_snapshot, submit_steps

pytestmark = pytest.mark.django_db


def _make_doc(doc_id="doc-1", version=0, content=None):
    return Document.objects.create(id=doc_id, content=content or {"type": "doc", "content": []}, version=version)


def test_get_snapshot_returns_current_state():
    _make_doc(version=3, content={"type": "doc", "content": ["x"]})

    snapshot = get_snapshot(DocumentRepository(), "doc-1")

    assert snapshot.doc_id == "doc-1"
    assert snapshot.version == 3
    assert snapshot.content == {"type": "doc", "content": ["x"]}


def test_submit_steps_accepted_advances_version_and_appends_steps():
    _make_doc(version=0)

    result = submit_steps(
        DocumentRepository(),
        StepRepository(),
        "doc-1",
        client_base_version=0,
        steps=[{"stepType": "replace"}, {"stepType": "replace"}],
        client_id="client-a",
        author_name="Alice",
        author_id="alice-id",
        author_color="#e03131",
        new_content={"type": "doc", "content": ["updated"]},
    )

    assert result.accepted is True
    assert result.new_version == 2
    assert len(result.records) == 2
    assert [r.version for r in result.records] == [1, 2]

    updated = Document.objects.get(pk="doc-1")
    assert updated.version == 2
    assert updated.content == {"type": "doc", "content": ["updated"]}
    assert updated.steps.count() == 2


def test_submit_steps_stale_base_version_rejected_with_missed_steps():
    _make_doc(version=2)
    step_repo = StepRepository()
    step_repo.append_many(
        "doc-1",
        [
            StepRecord(version=1, step={"a": 1}, client_id="c1", author_name="Bob", author_id="bob-id", author_color="#2f9e44"),
            StepRecord(version=2, step={"a": 2}, client_id="c1", author_name="Bob", author_id="bob-id", author_color="#2f9e44"),
        ],
    )

    result = submit_steps(
        DocumentRepository(),
        step_repo,
        "doc-1",
        client_base_version=0,
        steps=[{"stepType": "replace"}],
        client_id="client-b",
        author_name="Carol",
        author_id="carol-id",
        author_color="#1971c2",
        new_content={"type": "doc", "content": ["stale"]},
    )

    assert result.accepted is False
    assert [s.version for s in result.steps_since] == [1, 2]

    unchanged = Document.objects.get(pk="doc-1")
    assert unchanged.version == 2
