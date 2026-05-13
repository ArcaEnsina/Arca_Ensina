from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.mixins import AuditableMixin
from apps.audit.utils import log_audit

from . import services
from .serializers import CalculatorSerializer


class CalculatorView(AuditableMixin, APIView):
    audit_resource_type = "calculator"

    def post(self, request, version=None):
        # verificar a entrada:
        serializer = CalculatorSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # buscar informações validadas:
        weight = serializer.validated_data.get("weight")
        height = serializer.validated_data.get("height")
        age_days = serializer.validated_data.get("age_days")
        medication = serializer.validated_data.get("medication_id")

        # Lógica para criar um novo cálculo de dose

        # 1-calculo
        if height:
            dosage = services.calculate_dosage_mg(
                medication.prescription, weight, height
            )
        else:
            dosage = services.calculate_dosage_mg(medication.prescription, weight)

        frequency_per_day = services.prescription_to_frequency(
            medication.frequency_hours
        )
        dosage_per_dose = services.calculate_dosage_per_dose(dosage, frequency_per_day)

        # 2-validação
        if age_days is not None:
            if medication.limits_by_age:
                warning, _ = services.validate_dosage_per_age(
                    dosage,
                    age_days,
                    medication.limits_by_age,
                    weight,
                )
            else:
                warning, _ = services.validate_dosage(
                    dosage,
                    weight,
                    medication.min_dose_mg_kg,
                    medication.max_dose_mg_kg,
                    medication.max_absolute_dose_mg,
                )
        else:
            warning, _ = services.validate_dosage(
                dosage,
                weight,
                medication.min_dose_mg_kg,
                medication.max_dose_mg_kg,
                medication.max_absolute_dose_mg,
            )

        # 3-conversao
        conc_mg = medication.concentration_mg
        conc_ml = medication.concentration_ml
        if conc_mg is not None and conc_ml is not None:
            volume_ml = services.convert_dosage_to_ml(dosage_per_dose, conc_mg, conc_ml)
        else:
            volume_ml = None

        # Audit log para registro de calculos feitos
        audit_payload = {
            "medication_id": str(medication.pk),
            "weight": str(weight),
            "warnings": warning,
        }
        if height is not None:
            audit_payload["height"] = str(height)
        if age_days is not None:
            audit_payload["age_days"] = str(age_days)

        log_audit(
            user=request.user if request.user.is_authenticated else None,
            action="calculate",
            resource_type="calculator",
            resource_id="",
            ip=self.get_client_ip(request),
            payload=audit_payload,
        )

        return Response(
            {
                "dosage_mg": dosage,
                "dosage_per_dose": dosage_per_dose,
                "frequency_per_day": frequency_per_day,
                "volume_ml": volume_ml,
                "warnings": warning,
            },
            status=200,
        )
