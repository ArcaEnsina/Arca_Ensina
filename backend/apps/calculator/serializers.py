# valida entrada do frontend e a saida dos dados para json
from decimal import Decimal

from rest_framework import serializers

from project.drf_fields import CommaDecimalField


class CalculatorSerializer(serializers.Serializer):
    # peso em kg
    weight = CommaDecimalField(
        required=True,
        max_digits=12,
        decimal_places=4,
        min_value=Decimal("0.1"),
        max_value=Decimal("500.0"),
    )
    # altura em cm, opcional
    height = CommaDecimalField(
        required=False,
        max_digits=12,
        decimal_places=4,
        min_value=Decimal("1"),
        max_value=Decimal("300"),
        allow_null=True,
    )
    # idade em dias, opcional
    age_days = serializers.IntegerField(
        required=False,
        min_value=0,
        max_value=365 * 18,
        allow_null=True,
    )
    # id do medicamento, para buscar a concentração e unidade
    medication_id = serializers.IntegerField(required=True)

    # seleções do schema rico (opcionais; ignoradas por meds não migrados)
    # indicação clínica -> escolhe o regime de dosagem
    indication = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    # via de administração -> contraindicações por via
    route = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    # índice da apresentação escolhida (na lista do medicamento)
    presentation_index = serializers.IntegerField(
        required=False, allow_null=True, min_value=0
    )

    # uuid do cliente para idempotência do audit log (offline sync)
    client_uuid = serializers.UUIDField(required=False, allow_null=True)

    # validar se o medicamento existe no banco de dados
    def validate_medication_id(self, value):
        from apps.medications.models import Medication

        try:
            return Medication.objects.get(id=value)
        except Medication.DoesNotExist:
            raise serializers.ValidationError(
                "Medicamento com o ID fornecido não existe."
            )
