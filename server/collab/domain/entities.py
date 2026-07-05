"""
Plain-Python domain entities. No Django/Channels imports here so the
collab step-ordering rules stay testable without a DB or an ASGI server.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Identity:
    id: str
    display_name: str
    color: str


@dataclass(frozen=True)
class DocSnapshot:
    doc_id: str
    title: str
    content: dict
    version: int


@dataclass(frozen=True)
class StepRecord:
    version: int
    step: dict
    client_id: str
    author_name: str


@dataclass(frozen=True)
class SubmitResult:
    accepted: bool
    new_version: int | None = None
    records: list[StepRecord] | None = None
    steps_since: list[StepRecord] | None = None
