from rest_framework import serializers

from .models import Medication


class MedicationSerializer(serializers.ModelSerializer):
    """Listagem leve (catálogo)."""

    class Meta:
        model = Medication
        fields = ["id", "name", "category", "description"]


class MedicationDetailSerializer(serializers.ModelSerializer):
    """Detalhe com o schema rico, para a calculadora montar os seletores
    (apresentações, regimes/indicações) e exibir a monografia.
    """

    class Meta:
        model = Medication
        fields = [
            "id",
            "name",
            "category",
            "description",
            "presentations",
            "regimens",
            "contraindications",
            "adjustments",
            "administration",
            "overdose",
            "indications",
            "prescription",
            "frequency_hours",
            "min_dose_mg_kg",
            "max_dose_mg_kg",
            "max_absolute_dose_mg",
            "concentration_mg",
            "concentration_ml",
            "limits_by_age",
        ]
