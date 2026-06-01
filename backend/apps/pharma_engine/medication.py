"""Pipeline de dosagem baseado no catálogo de medicamentos.

Este é o caminho canônico de cálculo para a calculadora (dosagem por peso ou
superfície corporal a partir de um ``Medication``), análogo ao
``calculate_dose_pipeline`` (que cobre o caminho de conversão por fórmula usado
pela sedação). Ambos compartilham o mesmo núcleo (``models.Dose``, ``unit``,
``frequency``, ``limits``), garantindo um único motor de cálculo.

Módulo puro Python (apenas Decimal), sem dependências do Django.
"""

from decimal import ROUND_HALF_UP, Decimal

from .bsa import bsa_mosteller
from .concentration import dose_to_presentation, dose_to_volume_ml
from .frequency import frequency_from_hours
from .limits import validate_dose_range, validate_dose_range_by_age

_CENT = Decimal("0.01")

# Ordem canônica de severidade dos avisos (contrato BAIXO -> ALTO -> CRITICO).
_SEVERITY_ORDER = {"BAIXO": 0, "ALTO": 1, "CRITICO": 2}


def calculate_total_dose(prescription, weight, height=None) -> Decimal:
    """Dose total diária em mg.

    - Sem altura: por peso -> prescrição (mg/kg/dia) * peso (kg).
    - Com altura: por superfície -> prescrição (mg/m²/dia) * SC (Mosteller).
    """
    prescription = Decimal(str(prescription))
    weight = Decimal(str(weight))

    if height is not None:
        height = Decimal(str(height))
        if prescription <= 0 or height <= 0 or weight <= 0:
            raise ValueError("Prescrição, altura e peso devem ser maiores que zero.")
        bsa = bsa_mosteller(weight, height)
        return (prescription * bsa).quantize(_CENT, rounding=ROUND_HALF_UP)

    if prescription <= 0 or weight <= 0:
        raise ValueError("Prescrição e peso devem ser maiores que zero.")
    return (prescription * weight).quantize(_CENT, rounding=ROUND_HALF_UP)


def doses_per_day_from_hours(hours) -> int:
    """Número inteiro de doses por dia a partir do intervalo em horas.

    Arredonda para o inteiro mais próximo (ex: 24/6 = 4; 4.5 -> 5).
    """
    doses_per_day = frequency_from_hours(hours)["doses_per_day"]
    return int(doses_per_day.to_integral_value(rounding=ROUND_HALF_UP))


def divide_per_dose(total_dose_mg, doses_per_day) -> Decimal:
    """Dose por administração = dose total / número de doses por dia."""
    total = Decimal(str(total_dose_mg))
    doses = Decimal(str(doses_per_day))
    if total <= 0 or doses <= 0:
        raise ValueError("Dosagem e frequência por dia devem ser maiores que zero.")
    return (total / doses).quantize(_CENT, rounding=ROUND_HALF_UP)


# Aqui fica tudo que tem a ver com o pipeline de medicamentos
# TODO: Tem muita variavel solta, precisamos compactar essas variaveis
# (ou não só temos 2 semanas)
def _resolve_size_basis(prescription, weight, height, dose_unit, dose_basis):
    """Resolve a base de tamanho corporal (peso x superfície corporal).

    Retorna ``(base, size_divisor, per_unit_label)``, onde ``base`` é a dose
    de referência (mg) e ``size_divisor`` é o denominador da comparação de
    limites (peso para mg/kg, BSA para mg/m²).
    """
    if dose_unit == "mg/m2":
        if height is None:
            raise ValueError("dose_unit 'mg/m2' exige altura (height).")
        height = Decimal(str(height))
        base = calculate_total_dose(prescription, weight, height)
        size_divisor = bsa_mosteller(weight, height)
        per_unit_label = "mg/m²/dose" if dose_basis == "per_dose" else "mg/m²/dia"
        return base, size_divisor, per_unit_label

    # mg/kg: dosagem por peso (altura não entra no cálculo).
    base = calculate_total_dose(prescription, weight)
    per_unit_label = "mg/kg/dose" if dose_basis == "per_dose" else "mg/kg/dia"
    return base, weight, per_unit_label


def _split_dose(base, dose_basis, frequency_per_day, size_divisor):
    """Deriva ``(total_diário, dose_por_administração, valor_de_comparação)``.

    Em ``per_dose`` a ``base`` é a dose por administração; em ``per_day`` é o
    total diário. ``comparison_value`` é a grandeza comparada com min/max.
    """
    if dose_basis == "per_dose":
        per_dose = base
        total = (per_dose * Decimal(str(frequency_per_day))).quantize(
            _CENT, rounding=ROUND_HALF_UP
        )
        comparison_value = per_dose / size_divisor
    else:
        total = base
        per_dose = divide_per_dose(total, frequency_per_day)
        comparison_value = total / size_divisor
    return total, per_dose, comparison_value


def _daily_max_warning(total, weight, daily_max, drug):
    """Aviso de teto diário (mg/kg/dia) ou ``None`` se dentro do limite."""
    daily_per_kg = total / weight
    daily_max = Decimal(str(daily_max))
    if daily_per_kg <= daily_max:
        return None
    disp = daily_per_kg.quantize(_CENT, rounding=ROUND_HALF_UP)
    return {
        "type": "above_daily_max",
        "severity": "ALTO",
        "drug": drug,
        "current_dose": str(disp),
        "max_allowed": str(daily_max),
        "unit": "mg/kg/dia",
        "message": (
            f"Total diário ({disp} mg/kg/dia) acima do teto "
            f"diário recomendado ({daily_max} mg/kg/dia)."
        ),
    }


def _collect_warnings(
    *,
    comparison_value,
    total,
    weight,
    per_unit_label,
    age_days,
    limits_by_age,
    min_dose,
    max_dose,
    absolute_max,
    daily_max,
    drug,
):
    """Valida limites de faixa + teto diário e ordena BAIXO -> ALTO -> CRITICO."""
    if age_days is not None and limits_by_age:
        warnings = validate_dose_range_by_age(
            dose_per_kg=comparison_value,
            total_dose_mg=total,
            age_days=age_days,
            limits_by_age=limits_by_age,
            drug=drug,
            per_unit_label=per_unit_label,
        )
    else:
        warnings = validate_dose_range(
            dose_per_kg=comparison_value,
            total_dose_mg=total,
            min_dose=min_dose,
            max_dose=max_dose,
            absolute_max=absolute_max,
            drug=drug,
            per_unit_label=per_unit_label,
        )

    if daily_max is not None:
        daily_warning = _daily_max_warning(total, weight, daily_max, drug)
        if daily_warning is not None:
            warnings.append(daily_warning)

    warnings.sort(key=lambda w: _SEVERITY_ORDER.get(w["severity"], 99))
    return warnings


def _resolve_presentation(per_dose, presentation, concentration_mg, concentration_ml):
    """Converte a dose por administração em ``(volume_ml, drops, units)``.

    ``presentation`` tem prioridade; senão usa ``concentration_mg``/``_ml``.
    """
    if presentation is not None:
        conversion = dose_to_presentation(per_dose, presentation)
        return conversion["volume_ml"], conversion["drops"], conversion["units"]
    if concentration_mg is not None and concentration_ml is not None:
        volume_ml = dose_to_volume_ml(per_dose, concentration_mg, concentration_ml)
        return volume_ml, None, None
    return None, None, None


def calculate_medication_dose(
    *,
    prescription,
    weight,
    frequency_hours,
    height=None,
    age_days=None,
    min_dose=None,
    max_dose=None,
    absolute_max=None,
    daily_max=None,
    limits_by_age=None,
    dose_basis="per_day",
    dose_unit="mg/kg",
    concentration_mg=None,
    concentration_ml=None,
    presentation=None,
    drug="",
) -> dict:
    """Pipeline completo de dosagem do catálogo.

    Orquestra as etapas (cada uma num helper ``_`` próprio): base de tamanho
    corporal -> frequência -> dose por dose / total diário -> validação de
    limites -> conversão para volume/gotas/unidades.

    Returns:
        {
            "dosage_mg": Decimal,            # dose total diária
            "dosage_per_dose": Decimal,      # dose por administração
            "frequency_per_day": int,        # doses por dia
            "volume_ml": Decimal | None,     # volume por dose (se concentração)
            "drops": Decimal | None,         # gotas por dose (se apresentação gotas)
            "units": Decimal | None,         # nº de unidades (formas sólidas)
            "warnings": list[dict],          # avisos estruturados (com severity)
        }
    """
    if dose_basis not in ("per_day", "per_dose"):
        raise ValueError(f"dose_basis inválido: {dose_basis}")
    if dose_unit not in ("mg/kg", "mg/m2"):
        raise ValueError(f"dose_unit inválido: {dose_unit}")

    weight = Decimal(str(weight))

    base, size_divisor, per_unit_label = _resolve_size_basis(
        prescription, weight, height, dose_unit, dose_basis
    )

    frequency_per_day = doses_per_day_from_hours(frequency_hours)
    total, per_dose, comparison_value = _split_dose(
        base, dose_basis, frequency_per_day, size_divisor
    )

    warnings = _collect_warnings(
        comparison_value=comparison_value,
        total=total,
        weight=weight,
        per_unit_label=per_unit_label,
        age_days=age_days,
        limits_by_age=limits_by_age,
        min_dose=min_dose,
        max_dose=max_dose,
        absolute_max=absolute_max,
        daily_max=daily_max,
        drug=drug,
    )

    volume_ml, drops, units = _resolve_presentation(
        per_dose, presentation, concentration_mg, concentration_ml
    )

    return {
        "dosage_mg": total,
        "dosage_per_dose": per_dose,
        "frequency_per_day": frequency_per_day,
        "volume_ml": volume_ml,
        "drops": drops,
        "units": units,
        "warnings": warnings,
    }
