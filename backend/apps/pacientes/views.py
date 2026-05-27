from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.protocols.models import ProtocolExecution
from apps.sedation.models import SedationConversion

from .models import Paciente, Sintoma
from .serializers import PacienteSerializer, SintomaSerializer


class PacienteViewSet(viewsets.ModelViewSet):
    serializer_class = PacienteSerializer
    pagination_class = None

    def get_queryset(self):
        # Cada médico só enxerga os pacientes que ele mesmo cadastrou.
        return Paciente.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class SintomaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Sintoma.objects.all()
    serializer_class = SintomaSerializer
    pagination_class = None


class PatientHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id, **kwargs):
        try:
            patient = Paciente.objects.get(pk=patient_id, created_by=request.user)
        except Paciente.DoesNotExist:
            return Response(
                {"detail": "Paciente não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        events = []

        # --- Guided protocol executions ---
        executions = (
            ProtocolExecution.objects.filter(
                patient=patient,
                physician=request.user,
                patient__isnull=False,
            )
            .select_related("version__protocol", "current_step")
            .order_by("-started_at")
        )
        for exec_ in executions:
            events.append(
                {
                    "id": f"exec_{exec_.pk}",
                    "type": "guided_protocol",
                    "timestamp": exec_.started_at.isoformat(),
                    "title": exec_.version.protocol.title,
                    "status": exec_.status,
                    "protocol_version": f"v{exec_.version.version_number}",
                    "details": {
                        "current_step": exec_.current_step_key or "",
                        "finished_at": (
                            exec_.finished_at.isoformat()
                            if exec_.finished_at
                            else None
                        ),
                    },
                }
            )

        # --- Sedation conversions ---
        conversions = (
            SedationConversion.objects.filter(
                patient=patient,
                physician=request.user,
                patient__isnull=False,
            )
            .order_by("-created_at")
        )
        for conv in conversions:
            events.append(
                {
                    "id": f"sed_{conv.pk}",
                    "type": "sedation_conversion",
                    "timestamp": conv.created_at.isoformat(),
                    "title": f"{conv.source_drug} → {conv.target_drug}",
                    "status": "completed",
                    "details": {
                        "original_dose": str(conv.original_dose),
                        "converted_dose": str(conv.converted_dose),
                        "unit": conv.converted_dose_unit,
                        "frequency": conv.frequency,
                        "peso_kg": str(conv.peso_kg),
                    },
                }
            )

        # Sort by timestamp descending
        events.sort(key=lambda e: e["timestamp"], reverse=True)

        return Response({"events": events})
