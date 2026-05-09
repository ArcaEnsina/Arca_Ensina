from rest_framework import serializers
from .models import Paciente, Consulta, Alergia, Sintoma 

class AlergiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alergia
        fields = ['id', 'nome']

class SintomaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sintoma
        fields = ['id', 'nome']

class PacienteSerializer(serializers.ModelSerializer):
    alergias = AlergiaSerializer(many=True, read_only=True)    
    
    class Meta:
        model = Paciente
        fields = [
            'id', 'nome', 'cpf', 'data_nascimento', 'genero', 
            'nome_responsavel', 'cidade', 'telefone', 'alergias'
        ]

class ConsultaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consulta
        fields = ['id', 'paciente', 'data_atendimento', 'descricao']