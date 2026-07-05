from django.urls import path

from .views import CollabStateView

urlpatterns = [
    path("documents/<str:doc_id>/collab-state/", CollabStateView.as_view(), name="collab-state"),
]
