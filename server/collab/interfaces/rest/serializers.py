from rest_framework import serializers


class CollabStateSerializer(serializers.Serializer):
    id = serializers.CharField(source="doc_id")
    title = serializers.CharField()
    content = serializers.JSONField()
    version = serializers.IntegerField()
