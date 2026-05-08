from django.conf import settings
from django.db import models


class Protocol(models.Model):
    """Protocolo clínico base."""

    title = models.CharField(max_length=255)
    cid = models.CharField(max_length=20, blank=True, verbose_name="CID")
    specialty = models.CharField(
        max_length=100, blank=True, verbose_name="Especialidade"
    )
    author = models.CharField(max_length=255, blank=True, verbose_name="Autor")
    tags = models.JSONField(default=list, blank=True, verbose_name="Tags")
    age_range_min = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="Idade mínima (meses)"
    )
    age_range_max = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="Idade máxima (meses)"
    )

    class GenderApplicable(models.TextChoices):
        MASCULINO = "M", "Masculino"
        FEMININO = "F", "Feminino"

    gender_applicable = models.CharField(
        max_length=1,
        choices=GenderApplicable.choices,
        blank=True,
        null=True,
        default=None,
        verbose_name="Gênero aplicável",
    )
    is_active = models.BooleanField(default=True, verbose_name="Ativo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Protocolo"
        verbose_name_plural = "Protocolos"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.versions.exists():
            ProtocolVersion.objects.create(
                protocol=self,
                version_number=1,
                is_current=True,
            )


class ProtocolVersion(models.Model):
    """Versão de um protocolo clínico."""

    class ProtocolType(models.TextChoices):
        GUIADO = "guiado", "Guiado"
        PAINEL = "painel", "Painel"

    protocol = models.ForeignKey(
        Protocol,
        on_delete=models.CASCADE,
        related_name="versions",
        verbose_name="Protocolo",
    )
    version_number = models.PositiveIntegerField(verbose_name="Número da versão")
    protocol_type = models.CharField(
        max_length=10,
        choices=ProtocolType.choices,
        default=ProtocolType.GUIADO,
        db_index=True,
        verbose_name="Tipo de protocolo",
    )
    steps_data = models.JSONField(
        default=dict, blank=True, verbose_name="Dados de passos (guiado)"
    )
    panel_data = models.JSONField(
        default=dict, blank=True, verbose_name="Dados de painel"
    )
    metadata = models.JSONField(
        default=dict, blank=True, verbose_name="Metadados"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Criado por",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_current = models.BooleanField(
        default=False, db_index=True, verbose_name="Versão atual"
    )

    class Meta:
        ordering = ["-version_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["protocol", "version_number"],
                name="unique_protocol_version",
            ),
        ]
        verbose_name = "Versão do Protocolo"
        verbose_name_plural = "Versões do Protocolo"

    def __str__(self):
        return f"{self.protocol.title} v{self.version_number}"

    def save(self, *args, **kwargs):
        if self.is_current:
            ProtocolVersion.objects.filter(
                protocol=self.protocol, is_current=True
            ).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)
