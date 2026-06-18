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
    """
    Serializer com suporte de escrita para alergias e sintomas.

    - Escrita (POST/PATCH): aceita listas de strings.
      Ex: { "alergias": ["Dipirona", "Penicilina"], "sintomas": ["Febre"] }

    - Leitura (GET): retorna listas de strings (compatível com o frontend).
      Ex: { "alergias": ["Dipirona"], "sintomas": ["Febre"] }
    """

    # write-only: aceita lista de strings no POST/PATCH
    alergias = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list,
        write_only=True,
    )
    sintomas = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list,
        write_only=True,
    )

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
            "alergias",
            "sintomas",
            "status",
            "data_alta",
        ]
        # status/data_alta só mudam pela action de alta, nunca por POST/PATCH.
        read_only_fields = ["status", "data_alta"]

    def to_representation(self, instance):
        """Na leitura, serializa manualmente alergias/sintomas como lista de strings."""
        ret = {}
        for field in self._readable_fields:
            attribute = field.get_attribute(instance)
            if attribute is None:
                ret[field.field_name] = None
            else:
                ret[field.field_name] = field.to_representation(attribute)

        # Sobrescrever os campos M2M: retorna lista de strings
        ret["alergias"] = list(instance.alergias.values_list("descricao", flat=True))
        ret["sintomas"] = list(instance.sintomas.values_list("descricao", flat=True))
        return ret

    def _sync_m2m(self, instance, field_name, model_class, descricoes: list):
        """Cria objetos M2M se não existirem e associa ao paciente."""
        objs = []
        for descricao in descricoes:
            descricao = str(descricao).strip()
            if descricao:
                obj, _ = model_class.objects.get_or_create(descricao=descricao)
                objs.append(obj)
        getattr(instance, field_name).set(objs)

    def create(self, validated_data):
        alergias_list = validated_data.pop("alergias", [])
        sintomas_list = validated_data.pop("sintomas", [])

        instance = Paciente.objects.create(**validated_data)

        self._sync_m2m(instance, "alergias", Alergia, alergias_list)
        self._sync_m2m(instance, "sintomas", Sintoma, sintomas_list)

        return instance

    def update(self, instance, validated_data):
        alergias_list = validated_data.pop("alergias", None)
        sintomas_list = validated_data.pop("sintomas", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if alergias_list is not None:
            self._sync_m2m(instance, "alergias", Alergia, alergias_list)
        if sintomas_list is not None:
            self._sync_m2m(instance, "sintomas", Sintoma, sintomas_list)

        return instance
