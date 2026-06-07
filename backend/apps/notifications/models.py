import uuid
from django.conf import settings
from django.db import models
from apps.protocols.models import ProtocolVersion

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    protocol_version = models.ForeignKey(
        ProtocolVersion,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [("recipient", "protocol_version")]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return (
            f"{self.recipient} ← {self.protocol_version} "
            f"({'lida' if self.is_read else 'não lida'})"
        )