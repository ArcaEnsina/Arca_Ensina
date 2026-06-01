from rest_framework import serializers

from apps.protocols.models import ProtocolExecution

from .models import ResearchResponse

# Campos de contexto clínico coletados pós-execução.
DATA_FIELDS = [
    "condicao_tratada_cid",
    "seguiu_protocolo_integralmente",
    "desfecho_esperado",
]


class ResearchResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchResponse
        fields = ["id", "execution", "client_uuid", *DATA_FIELDS, "created_at"]
        read_only_fields = fields


class ResearchResponseCreateSerializer(serializers.Serializer):
    execution = serializers.PrimaryKeyRelatedField(
        queryset=ProtocolExecution.objects.all()
    )
    client_uuid = serializers.UUIDField(required=False, allow_null=True)

    condicao_tratada_cid = serializers.CharField(
        max_length=20, required=False, allow_blank=True, allow_null=True
    )
    seguiu_protocolo_integralmente = serializers.BooleanField(
        required=False, allow_null=True
    )
    desfecho_esperado = serializers.CharField(
        max_length=200, required=False, allow_blank=True, allow_null=True
    )
