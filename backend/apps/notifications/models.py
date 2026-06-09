import uuid

from django.conf import settings
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

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
        null=True,
        blank=True,
    )
    verb = models.CharField(max_length=255, default="")
    description = models.TextField(blank=True, default="")
    
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    target_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )
    target_object_id = models.CharField(max_length=255, null=True, blank=True)
    target = GenericForeignKey("target_content_type", "target_object_id")

    class Meta:
        ordering = ["-created_at"]
        unique_together = [("recipient", "target_content_type", "target_object_id", "verb")]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return (
            f"{self.recipient} - {self.verb} "
            f"({'lida' if self.is_read else 'não lida'})"
        )