from rest_framework.response import Response
from rest_framework.views import APIView

from collab.domain.errors import DocumentNotFoundError
from collab.repositories.document_repository import DocumentRepository
from collab.services.collab_service import get_snapshot

from .serializers import CollabStateSerializer


class CollabStateView(APIView):
    """Read-only bootstrap endpoint. Client fetches this once on mount to
    get the current doc + version before opening the collab websocket.
    Not document CRUD — assumes the Document row already exists."""

    def get(self, request, doc_id: str):
        try:
            snapshot = get_snapshot(DocumentRepository(), doc_id)
        except DocumentNotFoundError:
            return Response(status=404)
        response = Response(CollabStateSerializer(snapshot).data)
        response["Cache-Control"] = "no-store"
        return response
