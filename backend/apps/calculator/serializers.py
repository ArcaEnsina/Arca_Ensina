#valida entrada do frontend e a saida dos dados para json
from rest_framework import serializers

class CalculatorSerializer(serializers.Serializer):
    weight = serializers.FloatField(required=True, min_value=0.1, max_value=500.0) #peso em kg
    height = serializers.FloatField(required=False, min_value=1, max_value=300, allow_null=True) #altura em cm, opcional
    age_days = serializers.IntegerField(required=False, min_value=0, max_value=365*18, allow_null=True) #idade em dias, opcional
    medication_id = serializers.IntegerField(required=True) #id do medicamento, para buscar a concentração e unidade
    
    def validate_medication_id(self, value): #validar se o medicamento existe no banco de dados
        from apps.medications.models import Medication
        try:
           return Medication.objects.get(id=value)
        except Medication.DoesNotExist:
            raise serializers.ValidationError("Medicamento com o ID fornecido não existe.")
        