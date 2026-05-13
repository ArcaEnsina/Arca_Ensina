from django.db import models


class Calculator(models.Model):
    # campo para identificar o paciente, pode ser um ID ou outro
    # identificador, por enquanto é um inteiro, mas pode ser alterado
    # para uma relação com um modelo de paciente no futuro
    patient = models.IntegerField()
    # relaciona com o modelo de medicamento
    medication = models.ForeignKey("medications.Medication", on_delete=models.PROTECT)
    # peso em kg
    weight = models.DecimalField(max_digits=12, decimal_places=4)
    # altura em cm, opcional
    height = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    # idade em dias, opcional
    age_days = models.IntegerField(null=True, blank=True)
    # frequência em horas, ex: a cada 6h -> 6
    frequency_hours = models.IntegerField()
    # dose total calculada em mg
    dose_total_mg = models.DecimalField(max_digits=12, decimal_places=4)
    # dose por dose calculada em mg
    dose_per_dose_mg = models.DecimalField(max_digits=12, decimal_places=4)
    # volume em ml, opcional, calculado com base na concentração
    # do medicamento
    volume_ml = models.DecimalField(
        max_digits=12, decimal_places=4, null=True, blank=True
    )
    # aviso sobre a dose calculada, ex:
    # "Dose acima do limite seguro para a idade do paciente"
    warnings = models.JSONField(default=list)
    # data e hora da criação do registro
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        date_str = self.created_at.strftime("%d/%m/%Y %H:%M")
        return f"Cálculo {self.medication} - Paciente {self.patient} - {date_str}"
