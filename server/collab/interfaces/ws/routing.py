from django.urls import re_path

from .consumers import DocumentCollabConsumer

websocket_urlpatterns = [
    re_path(r"^ws/documents/(?P<doc_id>[\w-]+)/$", DocumentCollabConsumer.as_asgi()),
]
