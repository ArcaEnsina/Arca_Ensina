from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="title", read_only=True)
    message = serializers.CharField(source="description", read_only=True)
    target_type = serializers.CharField(source="target_content_type.model", read_only=True)
    target_id = serializers.CharField(source="target_object_id", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "is_read",
            "created_at",
            "title",
            "message",
            "target_type",
            "target_id",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "title",
            "message",
            "target_type",
            "target_id",
        ]