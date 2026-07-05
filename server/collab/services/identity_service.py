from collab.domain.entities import Identity
from collab.repositories.identity_repository import IdentityRepository


def resolve_or_create_identity(
    identity_repo: IdentityRepository,
    client_supplied_id: str | None,
    display_name: str,
) -> Identity:
    if client_supplied_id:
        existing = identity_repo.get(client_supplied_id)
        if existing is not None:
            if existing.display_name != display_name:
                return identity_repo.rename(client_supplied_id, display_name)
            return existing
    return identity_repo.create(display_name)
