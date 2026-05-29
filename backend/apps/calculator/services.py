"""Adaptador fino da calculadora sobre o motor único (pharma_engine).

Toda a matemática de dosagem vive em ``apps.pharma_engine`` (motor único e
seguro). Este módulo apenas adapta as assinaturas históricas usadas pela view e
pelos testes da calculadora, e converte os avisos estruturados do motor para o
enum legado (``BAIXO``/``ALTO``/``CRITICO``) consumido pela UI atual.
"""

from decimal import Decimal

from apps.pharma_engine import medication as med_engine
from apps.pharma_engine.concentration import dose_to_volume_ml
from apps.pharma_engine.contraindications import evaluate_contraindications
from apps.pharma_engine.limits import (
    classify_age_band,
    validate_dose_range,
    validate_dose_range_by_age,
)


def _severities(structured_warnings) -> list[str]:
    """Deriva o enum legado a partir dos avisos estruturados do motor."""
    return [w["severity"] for w in structured_warnings]


# 1.1 - dose total em mg (por peso ou por superfície corporal)
def calculate_dosage_mg(prescription, weight, height=None):
    return med_engine.calculate_total_dose(prescription, weight, height)


# 1.2 - número de doses por dia a partir do intervalo em horas
def prescription_to_frequency(prescription_time):
    return med_engine.doses_per_day_from_hours(prescription_time)


# 1.3 - dose por administração
def calculate_dosage_per_dose(total_dosage_mg, frequency_per_day):
    return med_engine.divide_per_dose(total_dosage_mg, frequency_per_day)


# 2 - validação contra limites em mg/kg/dia + teto absoluto
def validate_dosage(total_dosage_mg, weight, min_dose, max_dose, max_absolute_dose):
    total = Decimal(str(total_dosage_mg))
    weight = Decimal(str(weight))
    structured = validate_dose_range(
        dose_per_kg=total / weight,
        total_dose_mg=total,
        min_dose=min_dose,
        max_dose=max_dose,
        absolute_max=max_absolute_dose,
    )
    return _severities(structured), total


# 2.1 - validação contra limites por faixa etária
def validate_dosage_per_age(total_dosage_mg, age_days, limits, weight):
    total = Decimal(str(total_dosage_mg))
    weight = Decimal(str(weight))
    structured = validate_dose_range_by_age(
        dose_per_kg=total / weight,
        total_dose_mg=total,
        age_days=age_days,
        limits_by_age=limits,
    )
    return _severities(structured), total


# 3 - conversão de dose (mg) para volume (mL)
def convert_dosage_to_ml(validated_dosage_mg, concentration_mg, concentration_ml):
    return dose_to_volume_ml(validated_dosage_mg, concentration_mg, concentration_ml)

# 4 - seleciona regime/apresentação, avalia contraindicações e chama o motor único.

def _select_regimen(regimens, indication):
    if indication:
        wanted = indication.strip().lower()
        for regimen in regimens:
            if regimen.get("indication", "").strip().lower() == wanted:
                return regimen
    return regimens[0]


def _select_presentation(presentations, regimen, presentation_index):
    if not presentations:
        return None
    if presentation_index is not None and 0 <= presentation_index < len(presentations):
        return presentations[presentation_index]
    routes = regimen.get("routes") if regimen else None
    if routes:
        for presentation in presentations:
            if presentation.get("route") in routes:
                return presentation
    return presentations[0]


# Rótulo (plural, exibição) das formas sólidas contáveis para o "hero" da UI.
_FORM_LABELS = {
    "comprimido": "comprimidos",
    "supositorio": "supositórios",
}


def _unit_label(presentation):
    if not presentation:
        return None # liquidos
    return _FORM_LABELS.get(presentation.get("form"))


def _empty_result(blocks, regimen, presentation):
    """Resultado de cálculo bloqueado por contraindicação."""
    return {
        "blocked": True,
        "dosage_mg": None,
        "dosage_per_dose": None,
        "frequency_per_day": None,
        "volume_ml": None,
        "drops": None,
        "units": None,
        "unit_label": None,
        "warnings": _severities(blocks),
        "warnings_detail": blocks,
        "regimen": regimen,
        "presentation": presentation,
    }

# TODO: atualmente ele calcula tanto o caminho legado quanto o novo (regimens) é preciso
# converter todos os medicamentos para regimens para refatorar a função
# para apenas um caso.
def calculate_for_medication(
    medication,
    *,
    weight,
    height=None,
    age_days=None,
    indication=None,
    route=None,
    presentation_index=None,
) -> dict:
    regimens = medication.regimens

    # Caminho legado: campos planos (medicamentos não migrados).
    if not regimens:
        result = med_engine.calculate_medication_dose(
            prescription=medication.prescription,
            weight=weight,
            frequency_hours=medication.frequency_hours,
            height=None,  # dosagem por peso
            age_days=age_days,
            min_dose=medication.min_dose_mg_kg,
            max_dose=medication.max_dose_mg_kg,
            absolute_max=medication.max_absolute_dose_mg,
            limits_by_age=medication.limits_by_age,
            concentration_mg=medication.concentration_mg,
            concentration_ml=medication.concentration_ml,
            drug=medication.name,
        )
        result["blocked"] = False
        result["warnings_detail"] = result["warnings"]
        result["warnings"] = _severities(result["warnings"])
        result["regimen"] = None
        result["presentation"] = None
        result["unit_label"] = None
        return result

    # Caminho rico: regime + apresentação.
    regimen = _select_regimen(regimens, indication)
    presentation = _select_presentation(
        medication.presentations, regimen, presentation_index
    )
    eff_route = route or (presentation.get("route") if presentation else None)
    eff_form = presentation.get("form") if presentation else None

    blocks = evaluate_contraindications(
        rules=medication.contraindications,
        age_days=age_days,
        weight=weight,
        route=eff_route,
        form=eff_form,
        drug=medication.name,
    )

    # Faixa etária explicitamente contraindicada no regime (banda null).
    limits_by_age = regimen.get("limits_by_age")
    if limits_by_age and age_days is not None:
        band = classify_age_band(age_days)
        if limits_by_age.get(band) is None:
            blocks.append(
                {
                    "type": "contraindicated",
                    "severity": "CRITICO",
                    "drug": medication.name,
                    "rule": "age_band_null",
                    "current_dose": "",
                    "max_allowed": "",
                    "unit": "",
                    "message": (
                        f"Contraindicado para a faixa etária '{band}'."
                    ),
                }
            )

    # Unidade de dose do regime: mg/kg (padrão) ou mg/m² (BSA, exige altura).
    dose_unit = regimen.get("dose_unit", "mg/kg")
    if dose_unit == "mg/m2" and not height:
        blocks.append(
            {
                "type": "missing_data",
                "severity": "CRITICO",
                "drug": medication.name,
                "rule": "height_required",
                "current_dose": "",
                "max_allowed": "",
                "unit": "",
                "message": (
                    "Esta indicação é dosada por superfície corporal (mg/m²) "
                    "e exige a altura do paciente."
                ),
            }
        )

    if blocks:
        return _empty_result(blocks, regimen, presentation)

    result = med_engine.calculate_medication_dose(
        prescription=regimen["dose_mg_kg"],
        weight=weight,
        frequency_hours=regimen["frequency_hours"],
        # altura só entra no cálculo para regimes mg/m²
        height=height if dose_unit == "mg/m2" else None,
        age_days=age_days,
        dose_basis=regimen.get("dose_basis", "per_day"),
        dose_unit=dose_unit,
        min_dose=regimen.get("min_dose_mg_kg"),
        max_dose=regimen.get("max_dose_mg_kg"),
        daily_max=regimen.get("daily_max_mg_kg"),
        absolute_max=regimen.get("absolute_max_mg"),
        limits_by_age=limits_by_age,
        presentation=presentation,
        drug=medication.name,
    )
    result["blocked"] = False
    result["warnings_detail"] = result["warnings"]
    result["warnings"] = _severities(result["warnings"])
    result["regimen"] = regimen
    result["presentation"] = presentation
    result["unit_label"] = _unit_label(presentation)
    return result
