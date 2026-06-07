from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.audit.models import AuditLog
from apps.protocols.models import ProtocolVersion

from .models import Notification


@receiver(post_save, sender=ProtocolVersion)
def notify_users_on_protocol_update(sender, instance, created, **kwargs):
    if not created or instance.version_number == 1:
        return

    user_ids = (
        AuditLog.objects.filter(
            resource_type="protocol",
            resource_id=str(instance.protocol_id),
        )
        .exclude(user=None)
        .values_list("user_id", flat=True)
        .distinct()
    )

    if not user_ids:
        return

    Notification.objects.bulk_create(
        [
            Notification(recipient_id=uid, protocol_version=instance)
            for uid in user_ids
        ],
        ignore_conflicts=True,  
    )