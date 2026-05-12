from django.db import models

class Medication(models.Model):
    name = models.CharField(max_length=255)
    prescription = models.FloatField() #dose (mg/kg/dia ou mg/m²/dia)
    category = models.CharField(default="Outro", max_length=100)
    description = models.TextField(default="Nenhuma descrição disponível.", blank=True)
    frequency_hours = models.IntegerField() #frequência em horas, ex: a cada 6h -> 6
    min_dose_mg_kg = models.FloatField(null=True, blank=True) #dose mínima segura em mg/kg/dia
    max_dose_mg_kg = models.FloatField(null=True, blank=True) #dose máxima segura em mg/kg/dia
    max_absolute_dose_mg = models.FloatField(null=True, blank=True) #dose máxima absoluta em mg/dia, para medicamentos que tem um limite máximo independente do peso
    concentration_mg = models.FloatField(null=True, blank=True) #concentração do medicamento em mg
    concentration_ml = models.FloatField(null=True, blank=True) #concentração do medicamento em ml
    limits_by_age = models.JSONField(null=True, blank=True) #limites de dose por faixa etária, ex: {"neonato": {"min": 10, "max": 20}, "lactente": {"min": 15, "max": 25}}
    
    def __str__(self):
        return self.name
    
