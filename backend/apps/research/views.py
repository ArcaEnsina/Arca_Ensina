from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from apps.accounts.permissions import IsClinico, IsResearcher

from .models import ResearchResponse
from .serializers import (
    ResearchResponseCreateSerializer,
    ResearchResponseSerializer,
)
from .services import (
    coletar_pesquisa_execucao,
    pode_coletar_pesquisa,
    taxa_preenchimento_pesquisa,
)


def _client_ip(request) -> str:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "") or ""


class ResearchResponseViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    GenericViewSet,
):
    filterset_fields = [
        "seguiu_protocolo_integralmente",
        "condicao_tratada_cid",
    ]
    search_fields = [
        "condicao_tratada_cid",
        "audit_log__user__email",
    ]
    ordering_fields = ["created_at"]

    def get_permissions(self):
        if self.action == "create":
            return [IsClinico()]
        return [IsResearcher()]

    def get_serializer_class(self):
        if self.action == "create":
            return ResearchResponseCreateSerializer
        return ResearchResponseSerializer

    def get_queryset(self):
        return ResearchResponse.objects.all().select_related(
            "audit_log__user", "execution"
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        execution = data.pop("execution")
        client_uuid = data.pop("client_uuid", None)

        # Só o profissional dono da execução pode anexar contexto a ela.
        if execution.physician_id != request.user.id:
            raise PermissionDenied(
                "Você só pode registrar contexto das suas próprias execuções."
            )

        # Coleta condicional ao consentimento de pesquisa. Sem
        # consentimento ativo: silenciosamente não coleta (sem erro).
        if not pode_coletar_pesquisa(request.user):
            return Response(status=status.HTTP_204_NO_CONTENT)

        existente = (
            ResearchResponse.objects.filter(client_uuid=client_uuid).first()
            if client_uuid
            else None
        )

        response = coletar_pesquisa_execucao(
            user=request.user,
            execution=execution,
            dados_pesquisa=data,
            client_uuid=client_uuid,
            ip=_client_ip(request),
        )

        out = ResearchResponseSerializer(response)
        code = status.HTTP_200_OK if existente else status.HTTP_201_CREATED
        return Response(out.data, status=code)

    @action(
        detail=False,
        methods=["get"],
        url_path="aggregate",
        permission_classes=[IsResearcher],
    )
    def aggregate(self, request, **kwargs):
        return Response(taxa_preenchimento_pesquisa())
