"""Validação de limites de dose com avisos estruturados.

Módulo puro Python (apenas Decimal), sem dependências do Django.

Os avisos seguem o mesmo formato de dicionário emitido por ``pipeline.py``
(``type``/``drug``/``current_dose``/``max_allowed``/``unit``/``message``),
acrescido de ``severity`` em {"BAIXO", "ALTO", "CRITICO"}, de forma que a
calculadora possa derivar o enum legado a partir de ``severity`` sem perder a
informação rica usada pela sedação.

A ordem dos avisos é sempre BAIXO -> ALTO -> CRITICO, preservando o contrato
histórico de ``calculator.services.validate_dosage``.
"""

from decimal import Decimal

# Limiares em dias para as faixas etárias pediátricas.
_NEONATAL_MAX = 28
_LACTENTE_MAX = 365
_CRIANCA_MAX = 365 * 12
_ADOLESCENTE_MAX = 365 * 18


def classify_age_band(age_days) -> str:
    """Classifica a idade (em dias) na faixa etária correspondente."""
    age_days = int(age_days)
    if age_days < _NEONATAL_MAX:
        return "neonatal"
    if age_days < _LACTENTE_MAX:
        return "lactente"
    if age_days < _CRIANCA_MAX:
        return "crianca"
    if age_days < _ADOLESCENTE_MAX:
        return "adolescente"
    return "adulto"


def _warning(severity, wtype, drug, current, limit, unit, message) -> dict:
    return {
        "type": wtype,
        "severity": severity,
        "drug": drug,
        "current_dose": str(current),
        "max_allowed": str(limit),
        "unit": unit,
        "message": message,
    }


def validate_dose_range(
    *,
    dose_per_kg,
    total_dose_mg,
    min_dose=None,
    max_dose=None,
    absolute_max=None,
    drug="",
) -> list[dict]:
    """Valida a dose contra min/max (mg/kg/dia) e teto absoluto (mg).

    ``dose_per_kg`` é a dose diária convertida para mg/kg/dia
    (dose total / peso) e é comparada com ``min_dose``/``max_dose``.
    ``total_dose_mg`` é a dose diária absoluta, comparada com ``absolute_max``.
    """
    warnings: list[dict] = []
    dose_per_kg = Decimal(str(dose_per_kg))
    total_dose_mg = Decimal(str(total_dose_mg))

    if min_dose is not None:
        min_dose = Decimal(str(min_dose))
        if dose_per_kg < min_dose:
            warnings.append(
                _warning(
                    "BAIXO",
                    "below_min_recommended",
                    drug,
                    dose_per_kg,
                    min_dose,
                    "mg/kg/dia",
                    (
                        f"Dose ({dose_per_kg} mg/kg/dia) abaixo do mínimo "
                        f"recomendado ({min_dose} mg/kg/dia)."
                    ),
                )
            )

    if max_dose is not None:
        max_dose = Decimal(str(max_dose))
        if dose_per_kg > max_dose:
            warnings.append(
                _warning(
                    "ALTO",
                    "above_max_recommended",
                    drug,
                    dose_per_kg,
                    max_dose,
                    "mg/kg/dia",
                    (
                        f"Dose ({dose_per_kg} mg/kg/dia) acima do máximo "
                        f"recomendado ({max_dose} mg/kg/dia)."
                    ),
                )
            )

    if absolute_max is not None:
        absolute_max = Decimal(str(absolute_max))
        if total_dose_mg > absolute_max:
            warnings.append(
                _warning(
                    "CRITICO",
                    "above_absolute_max",
                    drug,
                    total_dose_mg,
                    absolute_max,
                    "mg",
                    (
                        f"Dose total ({total_dose_mg} mg) acima do teto "
                        f"absoluto ({absolute_max} mg)."
                    ),
                )
            )

    return warnings


def validate_dose_range_by_age(
    *,
    dose_per_kg,
    total_dose_mg,
    age_days,
    limits_by_age,
    drug="",
) -> list[dict]:
    """Valida a dose contra os limites da faixa etária do paciente.

    ``limits_by_age`` é um dicionário no formato
    ``{"faixa": {"min": v, "max": v, "absolute_max": v}}``.
    """
    band = classify_age_band(age_days)
    if band not in limits_by_age:
        raise ValueError("Faixa etária não encontrada nos limites fornecidos.")
    band_limits = limits_by_age[band]
    return validate_dose_range(
        dose_per_kg=dose_per_kg,
        total_dose_mg=total_dose_mg,
        min_dose=band_limits.get("min"),
        max_dose=band_limits.get("max"),
        absolute_max=band_limits.get("absolute_max"),
        drug=drug,
    )
