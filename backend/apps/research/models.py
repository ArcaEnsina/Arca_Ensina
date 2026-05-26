import uuid

from django.core.exceptions import ValidationError
from django.db import models


class ResearchDataPoint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    audit_log = models.OneToOneField(
        "audit.AuditLog",
        on_delete=models.CASCADE,
        related_name="research_data",
    )
    execution_state = models.OneToOneField(
        "protocols.ProtocolExecutionState",
        on_delete=models.CASCADE,
        related_name="research_data",
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

    indicacao_clinica = models.TextField(
        blank=True,
        null=True,
        help_text="Indicação clínica livre descrita ao usar a calculadora.",
    )
    ajustou_dose_sugerida = models.BooleanField(
        default=False,
        help_text="Profissional alterou a dose calculada pelo sistema.",
    )
    motivo_ajuste = models.TextField(
        blank=True,
        null=True,
        help_text="Obrigatório quando ajustou_dose_sugerida=True.",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        user = getattr(getattr(self, "audit_log", None), "user", None)
        return f"ResearchDataPoint({self.id}) — {user}"

    def clean(self) -> None:
        if self.ajustou_dose_sugerida and not self.motivo_ajuste:
            raise ValidationError(
                {
                    "motivo_ajuste": (
                        "Justificativa obrigatória quando a dose foi ajustada."
                    )
                }
            )

    def save(self, *args, **kwargs) -> None:
        self.full_clean()
        super().save(*args, **kwargs)
