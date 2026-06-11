from datetime import date

from rest_framework import serializers

from apps.pacientes.models import Paciente, Sintoma


class EmergencySerializer(serializers.Serializer):
    peso = serializers.DecimalField(max_digits=5, decimal_places=2)
    idade_anos = serializers.IntegerField(min_value=0, max_value=120)
    sintomas = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list,
    )
    protocol_version_id = serializers.IntegerField(required=False, allow_null=True)

    def create_patient(self, validated_data, user):
        idade_anos = validated_data["idade_anos"]
        hoje = date.today()
        try:
            nascimento = hoje.replace(year=hoje.year - idade_anos)
        except ValueError:
            nascimento = hoje.replace(year=hoje.year - idade_anos, day=28)

        count = Paciente.objects.filter(nome__startswith="Emergência").count() + 1

        patient = Paciente.objects.create(
            nome=f"Emergência {count}",
            telefone="00000000000",
            data_nascimento=nascimento,
            genero="O",
            peso=validated_data["peso"],
            created_by=user,
        )

        sintomas_list = validated_data.get("sintomas", [])
        sintoma_objs = []
        for descricao in sintomas_list:
            descricao = descricao.strip()
            if descricao:
                obj, _ = Sintoma.objects.get_or_create(descricao=descricao)
                sintoma_objs.append(obj)
        patient.sintomas.set(sintoma_objs)

        return patient
