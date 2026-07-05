from django.contrib import admin

from .models import Document, Identity, Step

admin.site.register(Document)
admin.site.register(Step)
admin.site.register(Identity)
