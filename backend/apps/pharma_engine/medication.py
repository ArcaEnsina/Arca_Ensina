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
from .concentration import dose_to_volume_ml
from .frequency import frequency_from_hours
from .limits import validate_dose_range, validate_dose_range_by_age

_CENT = Decimal("0.01")


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
    limits_by_age=None,
    concentration_mg=None,
    concentration_ml=None,
    drug="",
) -> dict:
    """Pipeline completo de dosagem do catálogo.

    Etapas: dose total -> frequência -> dose por dose -> validação de limites
    -> conversão para volume (se houver concentração).

    Returns:
        {
            "dosage_mg": Decimal,            # dose total diária
            "dosage_per_dose": Decimal,      # dose por administração
            "frequency_per_day": int,        # doses por dia
            "volume_ml": Decimal | None,     # volume por dose (se concentração)
            "warnings": list[dict],          # avisos estruturados (com severity)
        }
    """
    total = calculate_total_dose(prescription, weight, height)
    frequency_per_day = doses_per_day_from_hours(frequency_hours)
    per_dose = divide_per_dose(total, frequency_per_day)

    # Limites min/max estão em mg/kg/dia -> converte a dose total para mg/kg/dia.
    dose_per_kg = Decimal(str(total)) / Decimal(str(weight))

    if age_days is not None and limits_by_age:
        warnings = validate_dose_range_by_age(
            dose_per_kg=dose_per_kg,
            total_dose_mg=total,
            age_days=age_days,
            limits_by_age=limits_by_age,
            drug=drug,
        )
    else:
        warnings = validate_dose_range(
            dose_per_kg=dose_per_kg,
            total_dose_mg=total,
            min_dose=min_dose,
            max_dose=max_dose,
            absolute_max=absolute_max,
            drug=drug,
        )

    volume_ml = None
    if concentration_mg is not None and concentration_ml is not None:
        volume_ml = dose_to_volume_ml(per_dose, concentration_mg, concentration_ml)

    return {
        "dosage_mg": total,
        "dosage_per_dose": per_dose,
        "frequency_per_day": frequency_per_day,
        "volume_ml": volume_ml,
        "warnings": warnings,
    }
