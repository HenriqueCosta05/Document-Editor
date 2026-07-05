class DocumentNotFoundError(Exception):
    """Raised when a Document row doesn't exist for the given id."""


class VersionConflictError(Exception):
    """Raised when a client's baseVersion no longer matches server truth
    and cannot be trivially resolved (reserved; submit_steps currently
    resolves conflicts by returning steps_since instead of raising)."""


class InvalidStepError(Exception):
    """Reserved for future structural validation of submitted steps.
    The server does not semantically apply steps (see collab_service),
    so this is not raised by the current implementation."""
