from django.db import transaction

from apps.audit.models import AuditLog
from apps.research.models import ResearchDataPoint


def finalizar_protocolo_com_pesquisa(
    user,
    execution_state,
    dados_pesquisa: dict,
    ip: str = "",
) -> AuditLog:
    with transaction.atomic():
        log = AuditLog.objects.create(
            user=user,
            action="FINALIZAR_PROTOCOLO",
            resource_type="protocol_execution_state",
            resource_id=str(execution_state.id),
            ip=ip or "",
            payload={
                "step_key": execution_state.step_key,
                "ajustou_dose": dados_pesquisa.get("ajustou_dose_sugerida", False),
            },
        )

        ResearchDataPoint.objects.create(
            audit_log=log,
            execution_state=execution_state,
            **dados_pesquisa,
        )

        return log


_TEXT_FIELDS = {
    "condicao_tratada_cid",
    "desfecho_esperado",
    "indicacao_clinica",
    "motivo_ajuste",
}
_BOOL_FIELDS = {"seguiu_protocolo_integralmente"}


def taxa_preenchimento_pesquisa() -> dict:
    qs = ResearchDataPoint.objects.all()
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
