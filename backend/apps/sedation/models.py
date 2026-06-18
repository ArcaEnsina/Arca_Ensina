from django.conf import settings
from django.db import models


class SedationConversion(models.Model):
    physician = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    panel_version = models.ForeignKey(
        "protocols.ProtocolVersion", on_delete=models.PROTECT
    )
    patient = models.ForeignKey(
        "pacientes.Paciente",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    source_drug = models.CharField(max_length=100)
    target_drug = models.CharField(max_length=100)
    original_dose = models.DecimalField(max_digits=12, decimal_places=4)
    converted_dose = models.DecimalField(max_digits=12, decimal_places=4)
    converted_dose_unit = models.CharField(max_length=20)
    frequency = models.CharField(max_length=20)
    peso_kg = models.DecimalField(max_digits=12, decimal_places=4)

    client_uuid = models.UUIDField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Conversão de Sedação"
        verbose_name_plural = "Conversões de Sedação"

    def __str__(self):
        return f"{self.source_drug} → {self.target_drug} ({self.client_uuid})"
