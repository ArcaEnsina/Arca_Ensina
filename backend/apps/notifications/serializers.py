from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    protocol_id = serializers.IntegerField(
        source="protocol_version.protocol_id",
        read_only=True,
    )
    protocol_title = serializers.CharField(
        source="protocol_version.protocol.title",
        read_only=True,
    )
    protocol_version_label = serializers.IntegerField(
        source="protocol_version.version_number",
        read_only=True,
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "protocol_id",
            "protocol_title",
            "protocol_version_label",
            "is_read",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "protocol_id",
            "protocol_title",
            "protocol_version_label",
            "created_at",
        ]