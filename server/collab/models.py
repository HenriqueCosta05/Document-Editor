import secrets

from django.db import models


def _identity_id() -> str:
    return secrets.token_hex(16)


_IDENTITY_COLORS = [
    "#e03131", "#2f9e44", "#1971c2", "#f08c00",
    "#9c36b5", "#0c8599", "#e8590c", "#5c940d",
]


def _random_color() -> str:
    return secrets.choice(_IDENTITY_COLORS)


class Document(models.Model):
    """The authoritative snapshot. Assumed to already exist (created
    out-of-band) — this app does not expose create/list/delete for it."""

    id = models.CharField(primary_key=True, max_length=64)
    title = models.CharField(max_length=255, blank=True, default="")
    content = models.JSONField(default=dict)
    version = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Document({self.id}, v{self.version})"


class Step(models.Model):
    """Append-only log of accepted ProseMirror steps. The server trusts
    the submitting client's own step application (see collab_service) —
    `step` is stored opaquely."""

    document = models.ForeignKey(Document, related_name="steps", on_delete=models.CASCADE)
    version = models.PositiveIntegerField()
    step = models.JSONField()
    client_id = models.CharField(max_length=64)
    author_name = models.CharField(max_length=64)
    author_id = models.CharField(max_length=64, blank=True, default="")
    author_color = models.CharField(max_length=16, blank=True, default="#000000")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("document", "version")
        ordering = ["version"]

    def __str__(self) -> str:
        return f"Step(doc={self.document_id}, v{self.version})"


class Identity(models.Model):
    """Stand-in for auth: a display name + generated id, no password.
    Doubles as the ProseMirror clientID."""

    id = models.CharField(primary_key=True, max_length=64, default=_identity_id)
    display_name = models.CharField(max_length=64)
    color = models.CharField(max_length=16, default=_random_color)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Identity({self.id}, {self.display_name})"
