from django.core.management.base import BaseCommand

from collab.models import Document


class Command(BaseCommand):
    help = "Creates the 'demo' Document row the collab layer expects to already exist (no CRUD endpoints exist yet)."

    def handle(self, *args, **options):
        _, created = Document.objects.get_or_create(
            id="demo",
            defaults={
                "title": "Demo",
                "content": {"type": "doc", "content": [{"type": "paragraph", "content": []}]},
                "version": 0,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Created demo document"))
        else:
            self.stdout.write("Demo document already exists")
