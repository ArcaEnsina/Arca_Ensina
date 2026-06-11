import logging

import django_filters
from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import IsAdmin
from apps.audit.mixins import AuditableMixin
from apps.pacientes.models import Paciente

from .engine.interpreter import GuidedProtocolInterpreter
from .models import Protocol, ProtocolExecution, ProtocolExecutionState, ProtocolVersion
from .serializers import (
    ProtocolExecutionAnswerSerializer,
    ProtocolExecutionSerializer,
    ProtocolExecutionStartSerializer,
    ProtocolExecutionSyncSerializer,
    ProtocolListSerializer,
    ProtocolSerializer,
    ProtocolVersionCreateSerializer,
    ProtocolVersionSerializer,
)
from .services import ProtocolExecutionEngine

logger = logging.getLogger(__name__)


class ProtocolFilter(django_filters.FilterSet):
    gender = django_filters.CharFilter(method="filter_gender")
    search = django_filters.CharFilter(method="filter_search")
    type = django_filters.CharFilter(method="filter_type")
    tag = django_filters.CharFilter(method="filter_tag")
    age_min = django_filters.NumberFilter(method="filter_age_min")
    age_max = django_filters.NumberFilter(method="filter_age_max")

    class Meta:
        model = Protocol
        fields = ["is_active", "specialty"]

    def filter_gender(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(gender_applicable=value) | Q(gender_applicable__isnull=True)
        )

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(title__icontains=value)
            | Q(specialty__icontains=value)
            | Q(cid__icontains=value)
            | Q(author__icontains=value)
            | Q(tags__contains=[value])
        )

    def filter_type(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            versions__is_current=True,
            versions__protocol_type=value,
        ).distinct()

    def filter_tag(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(tags__contains=[value])

    def filter_age_min(self, queryset, name, value):
        if value is None:
            return queryset
        return queryset.filter(
            Q(age_range_min__lte=value) | Q(age_range_min__isnull=True)
        )

    def filter_age_max(self, queryset, name, value):
        if value is None:
            return queryset
        return queryset.filter(
            Q(age_range_max__gte=value) | Q(age_range_max__isnull=True)
        )


class ProtocolViewSet(AuditableMixin, ModelViewSet):
    """ViewSet para protocolos clínicos."""

    audit_resource_type = "protocol"
    permission_classes = [IsAuthenticated]
    filterset_class = ProtocolFilter
    search_fields = ["title", "cid", "author", "tags"]
    ordering_fields = ["title", "created_at", "updated_at"]

    def get_queryset(self):
        return Protocol.objects.prefetch_related("versions").all()

    def get_serializer_class(self):
        if self.action == "list":
            return ProtocolListSerializer
        return ProtocolSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["get"], url_path="versions")
    def list_versions(self, request, pk=None, **kwargs):
        """Lista todas as versões do protocolo."""
        protocol = self.get_object()
        versions = protocol.versions.select_related("created_by").all()
        serializer = ProtocolVersionSerializer(versions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="diff")
    def version_diff(self, request, pk=None, **kwargs):
        """Retorna diff entre duas versões do protocolo."""
        protocol = self.get_object()
        from_version = request.query_params.get("from")
        to_version = request.query_params.get("to")

        if not from_version or not to_version:
            raise ValidationError("Parâmetros 'from' e 'to' são obrigatórios.")

        try:
            v_from = protocol.versions.get(version_number=int(from_version))
            v_to = protocol.versions.get(version_number=int(to_version))
        except ProtocolVersion.DoesNotExist:
            raise NotFound("Versão não encontrada.")

        return Response(
            {
                "from": ProtocolVersionSerializer(v_from).data,
                "to": ProtocolVersionSerializer(v_to).data,
            }
        )

    def _get_active_execution(self, protocol, user):
        return (
            ProtocolExecution.objects.filter(
                version__protocol=protocol,
                physician=user,
                status=ProtocolExecution.Status.EM_ANDAMENTO,
            )
            .order_by("-started_at")
            .first()
        )

    @action(detail=True, methods=["post"], url_path="execute")
    def execute_start(self, request, pk=None, **kwargs):
        protocol = self.get_object()
        version = protocol.versions.filter(is_current=True).first()
        if not version:
            raise NotFound("Nenhuma versão atual para este protocolo.")

        serializer = ProtocolExecutionStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client_uuid = serializer.validated_data.get("client_uuid")
        context = serializer.validated_data.get("context", {})

        # Idempotência
        if client_uuid:
            existing = ProtocolExecution.objects.filter(
                physician=request.user,
                client_uuid=client_uuid,
            ).first()
            if existing:
                return Response(
                    ProtocolExecutionSerializer(existing).data,
                    status=200,
                )

        # Vincula ao paciente (cada médico só vê os seus) para o histórico.
        patient = None
        patient_id = serializer.validated_data.get("patient_id")
        if patient_id:
            patient = Paciente.objects.filter(
                pk=patient_id, created_by=request.user
            ).first()
            if patient is None:
                raise NotFound("Paciente não encontrado.")

        execution = ProtocolExecution.objects.create(
            version=version,
            physician=request.user,
            patient=patient,
            patient_name=serializer.validated_data["patient_name"],
            client_uuid=client_uuid,
        )

        execution = ProtocolExecutionEngine().comecar(execution, context)

        return Response(
            ProtocolExecutionSerializer(execution).data,
            status=201,
        )

    @action(detail=True, methods=["get"], url_path="execute/step")
    def execute_step(self, request, pk=None, **kwargs):
        protocol = self.get_object()
        execution = self._get_active_execution(protocol, request.user)
        if not execution:
            raise NotFound("Nenhuma execução ativa para este protocolo.")

        interpreter = GuidedProtocolInterpreter(execution.version.steps_data)
        step = (
            interpreter.get_step(execution.current_step_key)
            if execution.current_step_key
            else None
        )

        # Evaluate gates fresh
        history = [
            {"step_key": s.step_key, "values": s.values}
            for s in execution.states.filter(step_key__isnull=False).order_by(
                "answered_at"
            )
        ]
        context = interpreter.build_context(history)
        warnings = (
            interpreter.evaluate_step_gates(execution.current_step_key, context)
            if execution.current_step_key
            else []
        )

        return Response(
            {
                "step": step,
                "gate_warnings": warnings,
            }
        )

    @action(detail=True, methods=["post"], url_path="execute/answer")
    def execute_answer(self, request, pk=None, **kwargs):
        protocol = self.get_object()
        execution = self._get_active_execution(protocol, request.user)
        if not execution:
            raise NotFound("Nenhuma execução ativa para este protocolo.")

        serializer = ProtocolExecutionAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ProtocolExecutionEngine().resposta_step_atual(
            execution,
            serializer.validated_data["values"],
        )

        execution.refresh_from_db()
        return Response(ProtocolExecutionSerializer(execution).data)

    @action(detail=True, methods=["post"], url_path="execute/next")
    def execute_next(self, request, pk=None, **kwargs):
        protocol = self.get_object()
        execution = self._get_active_execution(protocol, request.user)
        if not execution:
            raise NotFound("Nenhuma execução ativa para este protocolo.")

        engine = ProtocolExecutionEngine()
        engine.avancar_step(execution)
        execution.refresh_from_db()

        # Evaluate gates for new step
        interpreter = GuidedProtocolInterpreter(execution.version.steps_data)
        step = (
            interpreter.get_step(execution.current_step_key)
            if execution.current_step_key
            else None
        )
        history = [
            {"step_key": s.step_key, "values": s.values}
            for s in execution.states.filter(step_key__isnull=False).order_by(
                "answered_at"
            )
        ]
        context = interpreter.build_context(history)
        warnings = (
            interpreter.evaluate_step_gates(execution.current_step_key, context)
            if execution.current_step_key
            else []
        )

        if execution.status == execution.Status.CONCLUIDO:
            return Response(
                {
                    "step": None,
                    "gate_warnings": [],
                    "status": "concluido",
                }
            )

        return Response(
            {
                "step": step,
                "gate_warnings": warnings,
            }
        )

    @action(detail=True, methods=["post"], url_path="execute/back")
    def execute_back(self, request, pk=None, **kwargs):
        protocol = self.get_object()
        execution = self._get_active_execution(protocol, request.user)
        if not execution:
            raise NotFound("Nenhuma execução ativa para este protocolo.")

        engine = ProtocolExecutionEngine()
        engine.voltar_step(execution)
        execution.refresh_from_db()

        interpreter = GuidedProtocolInterpreter(execution.version.steps_data)
        step = (
            interpreter.get_step(execution.current_step_key)
            if execution.current_step_key
            else None
        )
        history = [
            {"step_key": s.step_key, "values": s.values}
            for s in execution.states.filter(step_key__isnull=False).order_by(
                "answered_at"
            )
        ]
        context = interpreter.build_context(history)
        warnings = (
            interpreter.evaluate_step_gates(execution.current_step_key, context)
            if execution.current_step_key
            else []
        )

        return Response(
            {
                "step": step,
                "gate_warnings": warnings,
            }
        )

    @action(detail=True, methods=["get"], url_path="execute/reminders")
    def execute_reminders(self, request, pk=None, **kwargs):
        protocol = self.get_object()
        execution = self._get_active_execution(protocol, request.user)
        if not execution:
            raise NotFound("Nenhuma execução ativa para este protocolo.")

        engine = ProtocolExecutionEngine()
        reminders = engine.get_reminders(execution)

        return Response({"reminders": reminders})


class ProtocolVersionViewSet(AuditableMixin, ModelViewSet):
    """ViewSet para versões de protocolo."""

    audit_resource_type = "protocol_version"
    permission_classes = [IsAuthenticated]
    serializer_class = ProtocolVersionSerializer
    http_method_names = ["get", "post", "head", "options"]
    filterset_fields = ["protocol_type", "is_current", "protocol"]
    ordering_fields = ["version_number", "created_at"]

    def get_queryset(self):
        return ProtocolVersion.objects.select_related("protocol", "created_by").all()

    def get_serializer_class(self):
        if self.action == "create":
            return ProtocolVersionCreateSerializer
        return ProtocolVersionSerializer

    def get_permissions(self):
        if self.action in (
            "create",
            "update",
            "partial_update",
            "destroy",
            "set_current",
        ):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="set-current")
    def set_current(self, request, pk=None, **kwargs):
        """Marca esta versão como atual."""
        version = self.get_object()
        ProtocolVersion.objects.filter(
            protocol=version.protocol, is_current=True
        ).exclude(pk=version.pk).update(is_current=False)
        ProtocolVersion.objects.filter(pk=version.pk).update(is_current=True)
        version.refresh_from_db()
        return Response(ProtocolVersionSerializer(version).data)


class ProtocolExecutionViewSet(AuditableMixin, ModelViewSet):
    audit_resource_type = "protocol_execution"
    permission_classes = [IsAuthenticated]
    serializer_class = ProtocolExecutionSerializer

    def get_queryset(self):
        return ProtocolExecution.objects.select_related(
            "version",
            "version__protocol",
            "physician",
            "current_step",
        ).filter(physician=self.request.user)

    @action(detail=False, methods=["post"], url_path="sync")
    def sync(self, request, **kwargs):
        """Execução "Upsert" + states a partir de um snapshot do cliente.

        Re-roda o interpretador Python sobre o histórico para detectardivergências.
        O estado do cliente é a fonte de verdade para os dados persistidos.
        """
        serializer = ProtocolExecutionSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Resolve version
        try:
            version = ProtocolVersion.objects.get(pk=data["protocol_version_id"])
        except ProtocolVersion.DoesNotExist:
            raise NotFound("ProtocolVersion não encontrada.")

        # Resolve patient (optional, scoped to physician)
        patient = None
        patient_id = data.get("patient_id")
        if patient_id:
            patient = Paciente.objects.filter(
                pk=patient_id, created_by=request.user
            ).first()
            if patient is None:
                raise NotFound("Paciente não encontrado.")

        client_uuid = data["client_uuid"]
        current_step_key = data.get("current_step_key") or None

        is_created = False
        execution = ProtocolExecution.objects.filter(
            physician=request.user,
            client_uuid=client_uuid,
        ).first()

        if execution:
            # Update existing
            execution.version = version
            execution.patient_name = data["patient_name"]
            execution.status = data["status"]
            execution.current_step_key = current_step_key
            execution.current_step = None
            if patient is not None:
                execution.patient = patient
            if (
                data["status"] == ProtocolExecution.Status.CONCLUIDO
                and not execution.finished_at
            ):
                execution.finished_at = timezone.now()
            execution.save()
        else:
            is_created = True
            execution = ProtocolExecution.objects.create(
                version=version,
                physician=request.user,
                patient=patient,
                patient_name=data["patient_name"],
                client_uuid=client_uuid,
                status=data["status"],
                current_step_key=current_step_key,
            )
            if data["status"] == ProtocolExecution.Status.CONCLUIDO:
                execution.finished_at = timezone.now()
                execution.save(update_fields=["finished_at"])

        # Upsert states — delete existing and recreate from snapshot
        execution.states.all().delete()
        states_data = data.get("states", [])
        state_objects = []
        provided_answered_at = []
        for s in states_data:
            answered_at = s.get("answered_at")
            provided_answered_at.append(answered_at)
            state_objects.append(
                ProtocolExecutionState(
                    execution=execution,
                    step_key=s.get("step_key"),
                    values=s.get("values", {}),
                    loop_count=s.get("loop_count", 0),
                    gate_warnings=s.get("gate_warnings", []),
                    answered_at=answered_at or timezone.now(),
                )
            )
        if state_objects:
            ProtocolExecutionState.objects.bulk_create(state_objects)
            # answered_at é auto_now_add, então bulk_create sobrescreve o valor
            # do cliente com "agora". Restaura o timestamp offline informado no
            # snapshot para que get_reminders calcule o due_at correto (e o
            # lembrete vencido offline apareça no sino ao reconectar).
            to_restore = [
                obj
                for obj, answered_at in zip(state_objects, provided_answered_at)
                if answered_at
            ]
            if to_restore:
                for obj, answered_at in zip(state_objects, provided_answered_at):
                    if answered_at:
                        obj.answered_at = answered_at
                ProtocolExecutionState.objects.bulk_update(to_restore, ["answered_at"])

        # Teste de paridade re-executa o interpretador
        if version.steps_data and version.steps_data.get("steps"):
            interpreter = GuidedProtocolInterpreter(version.steps_data)
            history = [
                {"step_key": s.step_key, "values": s.values, "loop_count": s.loop_count}
                for s in execution.states.filter(step_key__isnull=False).order_by(
                    "answered_at"
                )
            ]

            server_step_key = interpreter.get_first_step_id()
            for i, h in enumerate(history):
                resolved = interpreter.resolve_next_step_id(
                    h["step_key"],
                    h["values"],
                    {"loop_count": h["loop_count"]},
                )
                if resolved is not None:
                    server_step_key = resolved
                else:
                    # Protocol ended at this step
                    server_step_key = None
                    break

            if server_step_key != current_step_key:
                logger.critical(
                    "divergência detectada em paridade engine em produção: "
                    "client_uuid=%s execution_id=%s server_step=%s client_step=%s",
                    client_uuid,
                    execution.pk,
                    server_step_key,
                    current_step_key,
                )

        # Materializa a notificação durável de reavaliação (sino) a partir do
        # estado sincronizado
        ProtocolExecutionEngine().sync_reavaliacao_notifications(execution)

        # Audit log
        action_name = "sync.created" if is_created else "sync.updated"
        self._log(request, action_name, execution)

        status_code = 201 if is_created else 200
        return Response(
            ProtocolExecutionSerializer(execution).data,
            status=status_code,
        )
