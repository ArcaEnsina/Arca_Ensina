from django.db import models

class Paciente(models.Model):
    SEXO_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Feminino'),
        ('O', 'Outro'),
    ]

    nome = models.CharField(max_length=100)
    cpf = models.CharField(max_length=11, unique=True)
    data_nascimento = models.DateField()
    sexo = models.CharField(max_length=1, choices=SEXO_CHOICES, default='M')
    
    
    alergias = models.TextField(blank=True, help_text="Digite as alergias separadas por vírgula")

    def __str__(self):
        return self.nome

class Visita(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name='visitas')
    criado_at = models.DateTimeField(auto_now_add=True)
    
    sintomas = models.TextField(blank=True, help_text="Descreva os sintomas observados nesta visita")

    def __str__(self):
        return f"Visita: {self.paciente.nome} - {self.criado_at.strftime('%d/%m/%Y')}"