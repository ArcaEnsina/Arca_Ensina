from django.contrib import admin
from .models import Paciente, Visita

@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cpf', 'sexo')
    search_fields = ('nome', 'cpf')

@admin.register(Visita)
class VisitaAdmin(admin.ModelAdmin):
    list_display = ('paciente', 'criado_at')
    list_filter = ('criado_at',)