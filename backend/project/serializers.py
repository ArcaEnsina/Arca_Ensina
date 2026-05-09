from rest_framework import serializers
from apps.pacientes.models import Paciente, Consulta, Alergia, Sintoma 
from django.utils import timezone

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
        fields = ['id', 'nome', 'cpf', 'alergias']

class ConsultaSerializer(serializers.ModelSerializer):
    paciente_nome = serializers.ReadOnlyField(source='paciente.nome')
    sintomas = SintomaSerializer(many=True, read_only=True)
    class Meta:
        model = Consulta
        fields = ['id', 'paciente', 'paciente_nome', 'criado_at', 'sintomas']
    def validate(self, data):
        paciente = data.get('paciente')
        data_consulta = data.get('criado_at')
        agora = timezone.now()

        if data_consulta:
            if data_consulta > agora:
                raise serializers.ValidationError({
                    "criado_at": "Não é possível nesta data ainda"
                })
            
            if paciente and data_consulta.date() < paciente.data_nascimento:
                raise serializers.ValidationError({
                    "criado_at": "Data Inválida!"
                })
                
        return data