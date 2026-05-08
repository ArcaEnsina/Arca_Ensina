from rest_framework import serializers
from .models import Paciente, Visita

class PacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = ['id', 'nome', 'cpf', 'data_nascimento', 'sexo', 'alergias']

class VisitaSerializer(serializers.ModelSerializer):
    paciente_nome = serializers.ReadOnlyField(source='paciente.nome')

    class Meta:
        model = Visita
        fields = ['id', 'paciente', 'paciente_nome', 'criado_at', 'sintomas']