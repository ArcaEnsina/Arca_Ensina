from rest_framework import serializers
from project.serializers import BaseSerializer
from .models import Paciente, Sintoma, Visita

class SintomaSerializer(BaseSerializer):
    class Meta:
        model = Sintoma
        fields = ["id", "nome", "slug", "categoria", "created_at", "updated_at", "version"]

class VisitaSerializer(BaseSerializer):
    sintomas = SintomaSerializer(many=True, read_only=True)
    sintoma_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Sintoma.objects.all(), source="sintomas", write_only=True, required=False
    )

    class Meta:
        model = Visita
        fields = [
            "id", "data_hora_entrada", "peso_kg", "alergias", 
            "queixa_principal", "sintomas", "sintoma_ids", 
            "created_at", "updated_at", "version"
        ]

class PacienteSerializer(BaseSerializer):
    visitas = VisitaSerializer(many=True, read_only=True)

    class Meta:
        model = Paciente
        fields = [
            "id", "nome", "cpf", "data_nascimento", "sexo", "cidade",
            "nome_responsavel", "telefone_responsavel", "visitas", 
            "criado_por", "created_at", "updated_at", "version"
        ]