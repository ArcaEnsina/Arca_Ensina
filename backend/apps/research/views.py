from rest_framework import mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from apps.accounts.permissions import IsResearcher

from .models import ResearchDataPoint
from .serializers import ResearchDataPointSerializer
from .services import taxa_preenchimento_pesquisa


class ResearchDataPointViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    GenericViewSet,
):
    serializer_class = ResearchDataPointSerializer
    permission_classes = [IsResearcher]
    filterset_fields = [
        "ajustou_dose_sugerida",
        "seguiu_protocolo_integralmente",
        "condicao_tratada_cid",
    ]
    search_fields = [
        "condicao_tratada_cid",
        "indicacao_clinica",
        "audit_log__user__email",
    ]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        return ResearchDataPoint.objects.all().select_related(
            "audit_log__user", "execution_state__execution"
        )

    @action(detail=False, methods=["get"], url_path="taxa")
    def taxa(self, request, **kwargs):
        return Response(taxa_preenchimento_pesquisa())
