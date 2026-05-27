from rest_framework import serializers

from project.serializers import BaseSerializer

from .models import ResearchDataPoint


class ResearchDataPointSerializer(BaseSerializer):
    class Meta:
        model = ResearchDataPoint
        fields = [
            "id",
            "condicao_tratada_cid",
            "seguiu_protocolo_integralmente",
            "desfecho_esperado",
            "indicacao_clinica",
            "ajustou_dose_sugerida",
            "motivo_ajuste",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, data: dict) -> dict:
        if data.get("ajustou_dose_sugerida") and not data.get("motivo_ajuste"):
            raise serializers.ValidationError(
                {
                    "motivo_ajuste": (
                        "Justificativa obrigatória quando a dose foi ajustada."
                    )
                }
            )
        return data
