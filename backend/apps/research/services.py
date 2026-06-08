from django.db import transaction

from apps.audit.models import AuditLog
from apps.research.models import ResearchResponse


def pode_coletar_pesquisa(user) -> bool:
    """TODO: consultar ``ConsentLog`` do usuário.
    Stub sem implementação. Retorna True.
    """
    return True


def coletar_pesquisa_execucao(
    user,
    execution,
    dados_pesquisa: dict,
    client_uuid=None,
    ip: str = "",
) -> ResearchResponse:
    """Cria o ``AuditLog`` e o ``ResearchResponse``
    de uma execução por ``client_uuid``.
    """
    if client_uuid:
        existente = ResearchResponse.objects.filter(client_uuid=client_uuid).first()
        if existente is not None:
            return existente

    with transaction.atomic():
        log = AuditLog.objects.create(
            user=user,
            action="create.research_response",
            resource_type="protocol_execution",
            resource_id=str(execution.id),
            ip=ip or "",
            payload={
                "seguiu_protocolo_integralmente": dados_pesquisa.get(
                    "seguiu_protocolo_integralmente"
                ),
            },
        )

        return ResearchResponse.objects.create(
            audit_log=log,
            execution=execution,
            client_uuid=client_uuid,
            **dados_pesquisa,
        )


_TEXT_FIELDS = {
    "condicao_tratada_cid",
    "desfecho_esperado",
}
_BOOL_FIELDS = {"seguiu_protocolo_integralmente"}


def taxa_preenchimento_pesquisa() -> dict:
    qs = ResearchResponse.objects.all()
    total = qs.count()

    if total == 0:
        return {"total": 0, "campos": {}}

    resultado: dict = {"total": total, "campos": {}}

    for campo in _TEXT_FIELDS:
        preenchidos = (
            qs.exclude(**{f"{campo}__isnull": True})
            .exclude(**{f"{campo}__exact": ""})
            .count()
        )
        resultado["campos"][campo] = round(preenchidos / total * 100, 1)

    for campo in _BOOL_FIELDS:
        preenchidos = qs.exclude(**{f"{campo}__isnull": True}).count()
        resultado["campos"][campo] = round(preenchidos / total * 100, 1)

    return resultado
