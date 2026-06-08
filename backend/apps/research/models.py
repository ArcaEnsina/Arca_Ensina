import uuid

from django.core.exceptions import ValidationError
from django.db import models


class ResearchResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    audit_log = models.OneToOneField(
        "audit.AuditLog",
        on_delete=models.CASCADE,
        related_name="research_response",
    )
    execution = models.OneToOneField(
        "protocols.ProtocolExecution",
        on_delete=models.CASCADE,
        related_name="research_response",
    )
    client_uuid = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="UUID do cliente para idempotência de envios offline.",
    )

    condicao_tratada_cid = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Código CID-10 da condição tratada (ex: J45.9).",
    )
    seguiu_protocolo_integralmente = models.BooleanField(
        null=True,
        blank=True,
        help_text="Null = não respondeu; True/False = resposta explícita.",
    )
    desfecho_esperado = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Desfecho clínico esperado informado pelo profissional.",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["client_uuid"],
                condition=models.Q(client_uuid__isnull=False),
                name="unique_research_response_client_uuid",
            )
        ]

    def __str__(self) -> str:
        user = getattr(getattr(self, "audit_log", None), "user", None)
        return f"ResearchResponse({self.id}) — {user}"

    def save(self, *args, **kwargs) -> None:
        # bloqueia qualquer UPDATE de um registro já existente
        if self.pk and ResearchResponse.objects.filter(pk=self.pk).exists():
            raise ValidationError(
                "ResearchResponse é imutável e não pode ser alterado."
            )
        self.full_clean()
        super().save(*args, **kwargs)
