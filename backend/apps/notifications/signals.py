from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.audit.models import AuditLog
from apps.protocols.models import Protocol, ProtocolVersion
from django.contrib.contenttypes.models import ContentType

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

    protocol = instance.protocol
    content_type = ContentType.objects.get_for_model(Protocol)
    Notification.objects.bulk_create(
        [
            Notification(
                recipient_id=uid,
                protocol_version=instance,
                target_content_type=content_type,
                target_object_id=str(protocol.pk),
                verb="Protocolo atualizado",
                description=f"O protocolo '{protocol.title}' foi atualizado para a versão {instance.version_number}.",
            )
            for uid in user_ids
        ],
        ignore_conflicts=True,
    )