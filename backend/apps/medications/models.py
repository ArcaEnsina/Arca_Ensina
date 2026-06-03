from django.db import models


class Medication(models.Model):
    name = models.CharField(max_length=255)
    prescription = models.DecimalField(
        max_digits=12, decimal_places=4, null=True, blank=True
    )
    category = models.CharField(default="Outro", max_length=100)
    description = models.TextField(
        default="Nenhuma descrição disponível.", blank=True
    )
    frequency_hours = models.IntegerField(null=True, blank=True)
    # dose mínima segura em mg/kg/dia
    min_dose_mg_kg = models.DecimalField(
        max_digits=12, decimal_places=4, null=True, blank=True
    )
    # dose máxima segura em mg/kg/dia
    max_dose_mg_kg = models.DecimalField(
        max_digits=12, decimal_places=4, null=True, blank=True
    )
    # dose máxima absoluta em mg/dia, para medicamentos que tem
    # um limite máximo independente do peso
    max_absolute_dose_mg = models.DecimalField(
        max_digits=12, decimal_places=4, null=True, blank=True
    )
    # concentração do medicamento em mg
    concentration_mg = models.DecimalField(
        max_digits=12, decimal_places=4, null=True, blank=True
    )
    # concentração do medicamento em ml
    concentration_ml = models.DecimalField(
        max_digits=12, decimal_places=4, null=True, blank=True
    )
    # limites de dose por faixa etária, ex:
    # {"neonato": {"min": 10, "max": 20},
    #  "lactente": {"min": 15, "max": 25}}
    limits_by_age = models.JSONField(null=True, blank=True)
    # apresentações comerciais (forma/via/concentração/gotas)
    presentations = models.JSONField(null=True, blank=True)
    # regimes de dosagem (indicação, dose_basis, limites, frequência)
    regimens = models.JSONField(null=True, blank=True)
    # contraindicações que bloqueiam o cálculo (idade/peso/via/forma)
    contraindications = models.JSONField(null=True, blank=True)

    # Campos de monografia (apenas exibição, nunca calculados):
    # ajustes renal/hepático (orientação textual, sem mg/kg exato)
    adjustments = models.JSONField(null=True, blank=True)
    # preparo/administração (diluição, velocidade de infusão, volume IM)
    administration = models.JSONField(null=True, blank=True)
    # superdosagem (dose tóxica, sintomas, tratamento)
    overdose = models.JSONField(null=True, blank=True)
    # indicações (ANVISA/FDA/off-label)
    indications = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.name
