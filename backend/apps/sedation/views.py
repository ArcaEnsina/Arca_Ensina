from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from apps.accounts.permissions import IsDoctor
from apps.audit.utils import log_audit
from apps.protocols.models import ProtocolVersion

from .engine.converter import SedationConverter
from .serializers import PanelCalculateSerializer


class PanelViewSet(ViewSet):
    """ViewSet para cálculos de conversão de dose no painel de sedação."""

    permission_classes = [IsAuthenticated, IsDoctor]

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")

    @action(detail=True, methods=["post"], url_path="calculate")
    def calculate(self, request, pk=None, version=None):
        """Calcula conversão de dose entre fármacos."""
        try:
            version = ProtocolVersion.objects.get(
                pk=pk, protocol_type="painel", is_current=True
            )
        except ProtocolVersion.DoesNotExist:
            raise NotFound(
                detail="Painel não encontrado.",
                code="panel_not_found",
            )

        serializer = PanelCalculateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        converter = SedationConverter(version.panel_data)
        try:
            result = converter.calculate(
                origem=data["origem"],
                destino=data["destino"],
                dose=data["dose"],
                peso_kg=data["peso_kg"],
                horario=data.get("horario"),
            )
        except ValueError as exc:
            raise ValidationError(
                detail=str(exc), code="calculation_error"
            ) from exc

        log_audit(
            user=request.user,
            action="CALCULATE",
            resource_type="sedation",
            resource_id=str(version.pk),
            ip=self._get_client_ip(request),
            payload={
                "origem": data["origem"],
                "destino": data["destino"],
                "dose": str(data["dose"]),
                "peso_kg": str(data["peso_kg"]),
                "client_uuid": (
                    str(data.get("client_uuid"))
                    if data.get("client_uuid")
                    else None
                ),
                "result": result,
            },
        )

        return Response(result, status=status.HTTP_200_OK)
