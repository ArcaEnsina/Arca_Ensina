"""Avaliação de contraindicações (bloqueios) antes do cálculo de dose.

Módulo puro Python (apenas Decimal), sem dependências do Django.

Diferente de ``limits.py`` (que emite avisos de dose fora da faixa), aqui o
resultado é um *bloqueio*: se uma regra casa com o paciente, a apresentação/via
escolhida não deve ser dosada. Os avisos seguem o mesmo formato estruturado dos
demais módulos, sempre com ``severity == "CRITICO"`` e ``type ==
"contraindicated"``.

Regras suportadas (ver docs/medication-schema.md):

- ``min_age_days``            -> idade mínima absoluta (em dias).
- ``min_weight_kg``           -> peso mínimo absoluto (em kg).
- ``form_min_age_days``       -> idade mínima para uma forma farmacêutica.
- ``route_min_age_days``      -> idade mínima para uma via.
- ``route_forbidden_age_range`` -> via proibida numa janela etária [min, max).
"""

from decimal import Decimal


def _block(message, *, drug="", rule="") -> dict:
    return {
        "type": "contraindicated",
        "severity": "CRITICO",
        "drug": drug,
        "rule": rule,
        "current_dose": "",
        "max_allowed": "",
        "unit": "",
        "message": message,
    }


def evaluate_contraindications(
    *,
    rules,
    age_days=None,
    weight=None,
    route=None,
    form=None,
    drug="",
) -> list[dict]:
    """Avalia as regras de contraindicação contra o paciente/seleção.

    Args:
        rules: lista de dicts (campo ``contraindications`` do catálogo).
        age_days: idade do paciente em dias (ou None se desconhecida).
        weight: peso em kg (ou None).
        route: via escolhida (ex: "IV"), quando aplicável.
        form: forma escolhida (ex: "supositorio"), quando aplicável.
        drug: nome do medicamento (para a mensagem).

    Returns:
        Lista de avisos de bloqueio (vazia se nenhuma regra casa).
    """
    if not rules:
        return []

    blocks: list[dict] = []

    for rule in rules:
        rtype = rule.get("rule")

        if rtype == "min_age_days":
            if age_days is not None and int(age_days) < int(rule["value"]):
                blocks.append(
                    _block(
                        f"Contraindicado: idade abaixo do mínimo "
                        f"({rule['value']} dias).",
                        drug=drug,
                        rule=rtype,
                    )
                )

        elif rtype == "min_weight_kg":
            if weight is not None and Decimal(str(weight)) < Decimal(
                str(rule["value"])
            ):
                blocks.append(
                    _block(
                        f"Contraindicado: peso abaixo do mínimo ({rule['value']} kg).",
                        drug=drug,
                        rule=rtype,
                    )
                )

        elif rtype == "form_min_age_days":
            if (
                form is not None
                and form == rule.get("form")
                and age_days is not None
                and int(age_days) < int(rule["value"])
            ):
                blocks.append(
                    _block(
                        f"Contraindicado: forma '{rule['form']}' abaixo da "
                        f"idade mínima ({rule['value']} dias).",
                        drug=drug,
                        rule=rtype,
                    )
                )

        elif rtype == "route_min_age_days":
            if (
                route is not None
                and route == rule.get("route")
                and age_days is not None
                and int(age_days) < int(rule["value"])
            ):
                blocks.append(
                    _block(
                        f"Contraindicado: via '{rule['route']}' abaixo da "
                        f"idade mínima ({rule['value']} dias).",
                        drug=drug,
                        rule=rtype,
                    )
                )

        elif rtype == "route_forbidden_age_range":
            if (
                route is not None
                and route == rule.get("route")
                and age_days is not None
                and int(rule["min_days"]) <= int(age_days) < int(rule["max_days"])
            ):
                blocks.append(
                    _block(
                        f"Contraindicado: via '{rule['route']}' nesta faixa "
                        f"etária ({rule['min_days']}-{rule['max_days']} dias).",
                        drug=drug,
                        rule=rtype,
                    )
                )

        else:
            raise ValueError(f"Regra de contraindicação desconhecida: {rtype}")

    return blocks
