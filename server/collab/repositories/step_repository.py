from collab.domain.entities import StepRecord
from collab.models import Step


class StepRepository:
    def steps_since(self, doc_id: str, version: int) -> list[StepRecord]:
        qs = Step.objects.filter(document_id=doc_id, version__gt=version).order_by("version")
        return [
            StepRecord(
                version=s.version,
                step=s.step,
                client_id=s.client_id,
                author_name=s.author_name,
            )
            for s in qs
        ]

    def append_many(self, doc_id: str, records: list[StepRecord]) -> None:
        Step.objects.bulk_create(
            [
                Step(
                    document_id=doc_id,
                    version=r.version,
                    step=r.step,
                    client_id=r.client_id,
                    author_name=r.author_name,
                )
                for r in records
            ]
        )
