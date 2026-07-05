from django.core.management.base import BaseCommand

from collab.models import Document


class Command(BaseCommand):
    help = (
        "Creates (or resets) the 'demo' Document row the collab layer expects to "
        "already exist (no CRUD endpoints exist yet). Run on every dev server "
        "start via scripts/dev.*, so local sessions always begin from a blank doc "
        "instead of carrying over whatever got typed into db.sqlite3 last time."
    )

    def handle(self, *args, **options):
        doc, created = Document.objects.update_or_create(
            id="demo",
            defaults={
                "title": "Demo",
                "content": {"type": "doc", "content": [{"type": "paragraph", "content": []}]},
                "version": 0,
            },
        )
        doc.steps.all().delete()
        if created:
            self.stdout.write(self.style.SUCCESS("Created demo document"))
        else:
            self.stdout.write(self.style.SUCCESS("Reset demo document to blank"))
