"""Process-wide write-behind cache for `Document.content`.

`Document.version` is bumped in sqlite on every accepted step — it's a
cheap integer write and the single source of truth the optimistic-
concurrency check in collab_service.submit_steps reads against, so it can
never lag. The much larger `content` JSON blob is debounced instead: it's
cached here the instant a step is accepted (so reads always see the latest
state) and only written to sqlite after the document has been idle for
FLUSH_DEBOUNCE_SECONDS, so a burst of keystrokes doesn't turn into a sqlite
write per keystroke. See consumers.py for the debounce scheduling.
"""

_pending: dict[str, dict] = {}


def set_pending(doc_id: str, content: dict, version: int) -> None:
    _pending[doc_id] = {"content": content, "version": version}


def get_pending(doc_id: str) -> dict | None:
    return _pending.get(doc_id)


def clear_pending(doc_id: str) -> None:
    _pending.pop(doc_id, None)
