import logging
from decimal import Decimal

from django.db import transaction
from django.db.utils import IntegrityError
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import APIException, NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from apps.accounts.permissions import IsClinico
from apps.audit.utils import log_audit
from apps.protocols.models import ProtocolVersion

from .engine.converter import SedationConverter
from .models import SedationConversion
from .serializers import PanelCalculateSerializer, PanelConversionSerializer

logger = logging.getLogger(__name__)


class PanelViewSet(ViewSet):
    """ViewSet para cálculos de conversão de dose no painel de sedação."""

    permission_classes = [IsAuthenticated, IsClinico]

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
            raise ValidationError(detail=str(exc), code="calculation_error") from exc

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
                    str(data.get("client_uuid")) if data.get("client_uuid") else None
                ),
                "result": result,
            },
        )

        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="conversions")
    def convert(self, request, pk=None, version=None):
        """Registra conversão de dose (prescrição) com idempotência."""
        try:
            version = ProtocolVersion.objects.get(
                pk=pk, protocol_type="painel", is_current=True
            )
        except ProtocolVersion.DoesNotExist:
            raise NotFound(
                detail="Painel não encontrado.",
                code="panel_not_found",
            )

        serializer = PanelConversionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Re-calcula com SedationConverter para segurança (não confiar no frontend)
        converter = SedationConverter(version.panel_data)
        try:
            result = converter.calculate(
                origem=data["origem"],
                destino=data["destino"],
                dose=data["dose"],
                peso_kg=data["peso_kg"],
            )
        except ValueError as exc:
            raise ValidationError(detail=str(exc), code="calculation_error") from exc

        # Usa dose calculada pelo servidor
        server_converted_dose = Decimal(result["per_dose"]["value"])

        # Resolve patient
        patient = None
        patient_id = data.get("patient_id")
        if patient_id:
            from apps.pacientes.models import Paciente

            try:
                patient = Paciente.objects.get(pk=patient_id)
            except Paciente.DoesNotExist:
                raise ValidationError(
                    detail="Paciente não encontrado.",
                    code="patient_not_found",
                )

        # Idempotência: atomic insert + IntegrityError catch (no check-then-create race)
        try:
            with transaction.atomic():
                conversion = SedationConversion.objects.create(
                    physician=request.user,
                    panel_version=version,
                    patient=patient,
                    source_drug=data["origem"],
                    target_drug=data["destino"],
                    original_dose=data["dose"],
                    converted_dose=server_converted_dose,
                    converted_dose_unit=result["per_dose"]["unit"],
                    frequency=result["frequency"],
                    peso_kg=data["peso_kg"],
                    client_uuid=data["client_uuid"],
                )
        except IntegrityError:
            existing = SedationConversion.objects.get(client_uuid=data["client_uuid"])
            return Response(
                self._serialize_conversion(existing),
                status=status.HTTP_200_OK,
            )

        log_audit(
            user=request.user,
            action="PRESCRIBE",
            resource_type="sedation",
            resource_id=str(version.pk),
            ip=self._get_client_ip(request),
            payload={
                "client_uuid": str(data["client_uuid"]),
                "origem": data["origem"],
                "destino": data["destino"],
                "converted_dose": str(server_converted_dose),
                "frequency": result["frequency"],
            },
        )

        return Response(
            self._serialize_conversion(conversion),
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _serialize_conversion(obj):
        """Serializa SedationConversion para dict de resposta."""
        return {
            "id": obj.id,
            "physician_id": obj.physician_id,
            "panel_version_id": obj.panel_version_id,
            "patient_id": obj.patient_id,
            "source_drug": obj.source_drug,
            "target_drug": obj.target_drug,
            "original_dose": str(obj.original_dose),
            "converted_dose": str(obj.converted_dose),
            "converted_dose_unit": obj.converted_dose_unit,
            "frequency": obj.frequency,
            "peso_kg": str(obj.peso_kg),
            "client_uuid": str(obj.client_uuid),
            "created_at": obj.created_at.isoformat(),
        }

    @action(detail=True, methods=["get"], url_path="drugs")
    def drug_catalog(self, request, pk=None, version=None):
        """Lista catálogo de drogas disponíveis no painel."""
        try:
            version = ProtocolVersion.objects.get(
                pk=pk, protocol_type="painel", is_current=True
            )
        except ProtocolVersion.DoesNotExist:
            raise NotFound(
                detail="Painel não encontrado.",
                code="panel_not_found",
            )

        panel_data = version.panel_data or {}

        try:
            catalog = self._extract_drug_catalog(panel_data)
        except Exception:
            logger.exception("Erro ao extrair catalogo do panel_data")
            raise APIException(detail="Erro ao processar dados do painel.")

        return Response(catalog)

    @staticmethod
    def _extract_drug_catalog(panel_data):
        """Extrai catálogo de drogas do panel_data."""
        if not panel_data or not isinstance(panel_data, dict):
            return []

        sections = panel_data.get("sections") or []
        taper_schedules = panel_data.get("taper_schedules") or []

        if not isinstance(sections, list):
            sections = []
        if not isinstance(taper_schedules, list):
            taper_schedules = []

        # Build a map of source drugs to their destinations and metadata
        source_drugs = {}

        for section in sections:
            if not isinstance(section, dict):
                continue
            for row in section.get("rows") or []:
                if not isinstance(row, dict):
                    continue
                drug_a = row.get("drug_a")
                drug_b = row.get("drug_b")
                if not drug_a or not drug_b:
                    continue

                if drug_a not in source_drugs:
                    source_drugs[drug_a] = {
                        "id": drug_a,
                        "name": drug_a.split()[0] if drug_a else "",
                        "full_name": drug_a,
                        "destinations": [],
                        "route": row.get("route") or "",
                        "frequency": row.get("frequency") or "",
                        "output_unit": row.get("output_unit") or "",
                    }

                # Add destination if not already present
                dest_ids = [d.get("id") for d in source_drugs[drug_a]["destinations"]]
                if drug_b not in dest_ids:
                    source_drugs[drug_a]["destinations"].append(
                        {
                            "id": drug_b,
                            "name": drug_b.split()[0] if drug_b else "",
                            "full_name": drug_b,
                            "route": row.get("route") or "",
                        }
                    )

        # Infer taper type and scale from taper_schedules
        taper_map = {}
        for schedule in taper_schedules:
            if not isinstance(schedule, dict):
                continue
            schedule_id = schedule.get("id") or ""
            monitoring = schedule.get("monitoring") or {}
            scale = monitoring.get("scale") or ""

            # Map schedule IDs to source drug patterns
            if "morfina" in schedule_id or "metadona" in schedule_id:
                taper_map["morfina"] = {
                    "taper_type": "morfina",
                    "scale_type": "SOS" if "SOS" in scale else "RASS",
                }
            elif "midazolam" in schedule_id:
                taper_map["midaz"] = {
                    "taper_type": "midaz",
                    "scale_type": "RASS",
                }

        # Apply taper metadata to drugs
        for drug_id, drug in source_drugs.items():
            drug_lower = drug_id.lower()
            if any(k in drug_lower for k in ["morfina", "fentanil"]):
                drug.update(
                    taper_map.get(
                        "morfina", {"taper_type": "morfina", "scale_type": "SOS"}
                    )
                )
            else:
                drug.update(
                    taper_map.get(
                        "midaz", {"taper_type": "midaz", "scale_type": "RASS"}
                    )
                )

        return list(source_drugs.values())
