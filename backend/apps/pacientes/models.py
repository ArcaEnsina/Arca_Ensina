from django.db import models
from django.utils import timezone

class Alergia(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.nome

class Sintoma(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.nome

class Paciente(models.Model):
    SEXO_CHOICES = [('M', 'Masculino'), ('F', 'Feminino'), ('O', 'Outro')]
    nome = models.CharField(max_length=100)
    cpf = models.CharField(max_length=11, unique=True)
    data_nascimento = models.DateField()
    sexo = models.CharField(max_length=1, choices=SEXO_CHOICES, default='M')
    alergias = models.ManyToManyField(Alergia, blank=True, related_name="pacientes")

    def __str__(self):
        return self.nome

class Consulta(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    criado_at = models.DateTimeField(default=timezone.now, verbose_name="Data da Consulta")
    sintomas = models.ManyToManyField(Sintoma, blank=True)

    def __str__(self):
        return f"Visita: {self.paciente.nome} - {self.criado_at.strftime('%d/%m/%Y')}"