from rest_framework import serializers


class PanelCalculateSerializer(serializers.Serializer):
    origem = serializers.CharField()
    destino = serializers.CharField()
    dose = serializers.DecimalField(max_digits=12, decimal_places=4)
    peso_kg = serializers.DecimalField(max_digits=12, decimal_places=4)
    horario = serializers.CharField(required=False, allow_blank=True)
    client_uuid = serializers.UUIDField(required=False)

    def validate(self, attrs):
        if attrs["dose"] <= 0:
            raise serializers.ValidationError(
                {"detail": "Dose deve ser maior que zero.", "code": "invalid_dose"}
            )
        if attrs["peso_kg"] <= 0:
            raise serializers.ValidationError(
                {
                    "detail": "Peso deve ser maior que zero.",
                    "code": "invalid_peso",
                }
            )
        if attrs["origem"] == attrs["destino"]:
            raise serializers.ValidationError(
                {
                    "detail": "Origem e destino devem ser diferentes.",
                    "code": "same_drug",
                }
            )
        return attrs


class PanelConversionSerializer(serializers.Serializer):
    origem = serializers.CharField()
    destino = serializers.CharField()
    dose = serializers.DecimalField(max_digits=12, decimal_places=4)
    peso_kg = serializers.DecimalField(max_digits=12, decimal_places=4)
    converted_dose = serializers.DecimalField(max_digits=12, decimal_places=4)
    converted_dose_unit = serializers.CharField()
    frequency = serializers.CharField()
    patient_id = serializers.IntegerField(required=False, allow_null=True)
    client_uuid = serializers.UUIDField(required=True)

    def validate(self, attrs):
        if attrs["dose"] <= 0:
            raise serializers.ValidationError(
                {"detail": "Dose deve ser maior que zero.", "code": "invalid_dose"}
            )
        if attrs["peso_kg"] <= 0:
            raise serializers.ValidationError(
                {
                    "detail": "Peso deve ser maior que zero.",
                    "code": "invalid_peso",
                }
            )
        if attrs["origem"] == attrs["destino"]:
            raise serializers.ValidationError(
                {
                    "detail": "Origem e destino devem ser diferentes.",
                    "code": "same_drug",
                }
            )
        if attrs["converted_dose"] <= 0:
            raise serializers.ValidationError(
                {
                    "detail": "Dose convertida deve ser maior que zero.",
                    "code": "invalid_converted_dose",
                }
            )
        return attrs
