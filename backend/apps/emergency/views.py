from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.mixins import AuditableMixin
from apps.pacientes.serializers import PacienteSerializer
from apps.protocols.models import ProtocolExecution, ProtocolVersion
from apps.protocols.serializers import ProtocolExecutionSerializer
from apps.protocols.services import ProtocolExecutionEngine

from .serializers import EmergencySerializer


class EmergencyView(AuditableMixin, APIView):
    permission_classes = [IsAuthenticated]
    audit_resource_type = "emergency"

    def post(self, request, *args, **kwargs):
        serializer = EmergencySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # quase esqueci como faz comentário em python
        patient = serializer.create_patient(
            serializer.validated_data, request.user
        )  # criação do paciente de emergencia

        protocol_version_id = serializer.validated_data.get("protocol_version_id")
        if protocol_version_id:
            version = ProtocolVersion.objects.filter(
                pk=protocol_version_id,
                protocol_type="guiado",
            ).first()
        else:
            version = (
                ProtocolVersion.objects.filter(
                    is_current=True,
                    protocol_type="guiado",
                )
                .order_by("-created_at")
                .first()
            )

        if not version:
            return Response(
                {"detail": "Nenhum protocolo guiado ativo encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        execution = ProtocolExecution.objects.create(  # exec do protocolo
            version=version,
            physician=request.user,
            patient=patient,
            patient_name=patient.nome,
        )
        execution = ProtocolExecutionEngine().comecar(execution, {})

        return Response(
            {
                "patient": PacienteSerializer(patient).data,
                "execution": ProtocolExecutionSerializer(execution).data,
            },
            status=status.HTTP_201_CREATED,
        )
