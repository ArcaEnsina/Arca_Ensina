from django.db import models

class Medication(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Nome do Medicamento")
    unit = models.CharField(max_length=50, verbose_name="Unidade de Medida") #Ex: "mg/ml", "mcg/kg/min", etc
    concentration = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Concentração") # Informações sobre a apresentação do medicamento

    def __str__(self):
        return self.name
