from django.db import models

class Calculator(models.Model):
    patient = models.IntegerField() #campo para identificar o paciente, pode ser um ID ou outro identificador, por enquanto é um inteiro, mas pode ser alterado para uma relação com um modelo de paciente no futuro
    medication = models.ForeignKey('medications.Medication', on_delete=models.PROTECT) #relaciona com o modelo de medicamento
    weight = models.DecimalField(max_digits=12, decimal_places=4) #peso em kg
    height = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True) #altura em cm, opcional
    age_days = models.IntegerField(null=True, blank=True) #idade em dias, opcional
    frequency_hours = models.IntegerField() #frequência em horas, ex: a cada 6h -> 6
    dose_total_mg = models.DecimalField(max_digits=12, decimal_places=4) #dose total calculada em mg
    dose_per_dose_mg = models.DecimalField(max_digits=12, decimal_places=4) #dose por dose calculada em mg
    volume_ml = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True) #volume em ml, opcional, calculado com base na concentração do medicamento
    warnings = models.JSONField(default=list) #aviso sobre a dose calculada, ex: "Dose acima do limite seguro para a idade do paciente"
    created_at = models.DateTimeField(auto_now_add=True) #data e hora da criação do registro
    
    def __str__(self):
        return f"Cálculo {self.medication} - Paciente {self.patient} - {self.created_at.strftime('%d/%m/%Y %H:%M')}"