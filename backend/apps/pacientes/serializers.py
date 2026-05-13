from rest_framework import serializers

from .models import Alergia, Paciente, Sintoma


class AlergiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alergia
        fields = ["id", "descricao"]


class SintomaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sintoma
        fields = ["id", "descricao"]


class PacienteSerializer(serializers.ModelSerializer):
    alergias = AlergiaSerializer(many=True, read_only=True)

    class Meta:
        model = Paciente
        fields = [
            "id",
            "nome",
            "data_nascimento",
            "genero",
            "peso",
            "altura",
            "nome_responsavel",
            "cidade",
            "telefone",
            "sintomas"
            "alergias",
        ]
