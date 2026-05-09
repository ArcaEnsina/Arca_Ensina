from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator

class Alergia(models.Model):
    descricao = models.CharField(max_length=100, unique=True)
    def __str__(self): return self.descricao

class Sintoma(models.Model):
    descricao = models.CharField(max_length=100, unique=True)
    def __str__(self): return self.descricao

class Paciente(models.Model):
    GENDER_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Feminino'),
        ('O', 'Outro'),
    ]
    nome = models.CharField(max_length=100)
    cpf_validator = RegexValidator(
        regex=r'^\d{11}$',
        message="O CPF deve conter exatamente 11 números."
    )
    cpf = models.CharField(max_length=11, unique=True, validators=[cpf_validator])
    telefone_validator = RegexValidator(
        regex=r'^\d{11,13}$',
        message="O telefone deve conter apenas números, incluindo o código do país e DDD (ex: 5581999999999)."
    )
    telefone = models.CharField(validators=[telefone_validator], max_length=13)
    data_nascimento = models.DateField(verbose_name="Data de Nascimento")
    genero = models.CharField(max_length=1, choices=GENDER_CHOICES, default='M')
    nome_responsavel = models.CharField(max_length=255, blank=True, null=True)
    cidade = models.CharField(max_length=100)
    alergias = models.ManyToManyField(Alergia, blank=True)
    def __str__(self): return self.nome

class Consulta(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    data_atendimento = models.DateTimeField(default=timezone.now)
    sintomas = models.ManyToManyField(Sintoma, blank=True)
    def __str__(self): return f"Consulta {self.paciente.nome} - {self.data_atendimento}"