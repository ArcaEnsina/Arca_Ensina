from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.mixins import AuditableMixin
from apps.audit.models import AuditLog
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
        indication = serializer.validated_data.get("indication")
        route = serializer.validated_data.get("route")
        presentation_index = serializer.validated_data.get("presentation_index")
        client_uuid = serializer.validated_data.get("client_uuid")

        # cálculo completo via orquestração (regime + apresentação +
        # contraindicações) sobre o motor único (pharma_engine).
        result = services.calculate_for_medication(
            medication,
            weight=weight,
            height=height if height else None,
            age_days=age_days,
            indication=indication,
            route=route,
            presentation_index=presentation_index,
        )

        # avisos: enum legado (para a UI atual) + payload estruturado
        legacy_warnings = result["warnings"]
        structured_warnings = result["warnings_detail"]

        # Audit log para registro de calculos feitos
        audit_payload = {
            "medication_id": str(medication.pk),
            "weight": str(weight),
            "warnings": legacy_warnings,
        }
        if height is not None:
            audit_payload["height"] = str(height)
        if age_days is not None:
            audit_payload["age_days"] = str(age_days)
        if client_uuid is not None:
            audit_payload["client_uuid"] = str(client_uuid)

        # Idempotência: se já existe audit log com mesmo client_uuid, pular log
        should_log = True
        if client_uuid is not None:
            if AuditLog.objects.filter(
                action="calculate",
                resource_type="calculator",
                payload__client_uuid=str(client_uuid),
            ).exists():
                should_log = False

        if should_log:
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
                "dosage_mg": result["dosage_mg"],
                "dosage_per_dose": result["dosage_per_dose"],
                "frequency_per_day": result["frequency_per_day"],
                "volume_ml": result["volume_ml"],
                "drops": result["drops"],
                "units": result["units"],
                "unit_label": result["unit_label"],
                "blocked": result["blocked"],
                "warnings": legacy_warnings,
                "warnings_detail": structured_warnings,
                "regimen": result["regimen"],
                "presentation": result["presentation"],
            },
            status=200,
        )
