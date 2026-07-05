from collab.domain.entities import Identity
from collab.models import Identity as IdentityModel


class IdentityRepository:
    def get(self, identity_id: str) -> Identity | None:
        try:
            row = IdentityModel.objects.get(pk=identity_id)
        except IdentityModel.DoesNotExist:
            return None
        return Identity(id=row.id, display_name=row.display_name, color=row.color)

    def create(self, display_name: str) -> Identity:
        row = IdentityModel.objects.create(display_name=display_name)
        return Identity(id=row.id, display_name=row.display_name, color=row.color)

    def rename(self, identity_id: str, display_name: str) -> Identity:
        IdentityModel.objects.filter(pk=identity_id).update(display_name=display_name)
        row = IdentityModel.objects.get(pk=identity_id)
        return Identity(id=row.id, display_name=row.display_name, color=row.color)
