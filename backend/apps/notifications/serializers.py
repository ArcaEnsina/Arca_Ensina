from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    message = serializers.CharField(source="description", read_only=True)
    target_type = serializers.SerializerMethodField()
    target_id = serializers.SerializerMethodField()

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
            "level",
            "scheduled_for",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "title",
            "message",
            "target_type",
            "target_id",
            "level",
            "scheduled_for",
        ]

    def get_target_type(self, obj):
        if obj.target_content_type:
            return obj.target_content_type.model
        return None

    def get_target_id(self, obj):
        if obj.target_object_id:
            return obj.target_object_id
        return None