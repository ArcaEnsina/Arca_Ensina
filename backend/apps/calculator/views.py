from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CalculatorSerializer
from .models import Calculator
from medications.models import Medication
from . import services

class CalculatorView(APIView):
    def post(self, request):
        #verificar a entrada:
        serializer = CalculatorSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        #buscar informações validadas:
        weight = serializer.validated_data.get("weight")
        age_days = serializer.validated_data.get("age_days")
        medication = serializer.validated_data.get("medication_id")
        
        # Lógica para criar um novo cálculo de dose
        if medication.is_per_m2 != True:
            #1-calculo
            dosage = services.calculate_dosage_mg(medication.prescription, weight)
            frequency_per_day = services.prescription_to_frequency(medication.frequency_hours)
            dosage_per_dose = services.calculate_dosage_per_dose(dosage, frequency_per_day)
            
            #2-validação
            if age_days != None:
                if medication.limits_by_age:
                    warning, dosage_per_dose = services.validate_dosage_per_age(dosage_per_dose, age_days, medication.limits_by_age, weight)
                else:
                    warning, dosage_per_dose = services.validate_dosage(dosage_per_dose, weight, medication.min_dose_mg_kg, medication.max_dose_mg_kg, medication.max_absolute_dose_mg)
            else:
                warning, dosage_per_dose = services.validate_dosage(dosage_per_dose, weight, medication.min_dose_mg_kg, medication.max_dose_mg_kg, medication.max_absolute_dose_mg)
                
            #3-conversao
            if medication.concentration_mg != None and medication.concentration_ml != None:
                volume_ml = services.convert_dosage_to_ml(dosage_per_dose, medication.concentration_mg, medication.concentration_ml)
            else:
                volume_ml = None

            return Response({"dosage_mg": dosage, "dosage_per_dose": dosage_per_dose, "frequency_per_day": frequency_per_day, "volume_ml": volume_ml, "warnings": warning}, status=200)
        else:
            #se tiver altura (ainda nao implementado)
            return Response(
            {"error": "Medicamento baseado em superfície corporal não suportado ainda."}, status=status.HTTP_400_BAD_REQUEST)