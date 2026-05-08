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
    alergias = serializers.SlugRelatedField(
        many=True,
        queryset=Alergia.objects.all(),
        slug_field='nome'
    )

    class Meta:
        model = Paciente
        fields = ['id', 'nome', 'cpf', 'data_nascimento', 'sexo', 'alergias']

    def to_internal_value(self, data):
        if 'alergias' in data:
            for nome_alergia in data['alergias']:
                Alergia.objects.get_or_create(nome=nome_alergia)
        return super().to_internal_value(data)

class ConsultaSerializer(serializers.ModelSerializer):
    sintomas = serializers.SlugRelatedField(
        many=True,
        queryset=Sintoma.objects.all(),
        slug_field='nome'
    )
    paciente_nome = serializers.ReadOnlyField(source='paciente.nome')

    class Meta:
        model = Consulta
        fields = ['id', 'paciente', 'paciente_nome', 'criado_at', 'sintomas']

    def to_internal_value(self, data):
        if 'sintomas' in data:
            for nome_sintoma in data['sintomas']:
                Sintoma.objects.get_or_create(nome=nome_sintoma)
        return super().to_internal_value(data)