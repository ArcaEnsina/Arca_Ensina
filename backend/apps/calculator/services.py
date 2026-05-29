"""Adaptador fino da calculadora sobre o motor único (pharma_engine).

Toda a matemática de dosagem vive em ``apps.pharma_engine`` (motor único e
seguro). Este módulo apenas adapta as assinaturas históricas usadas pela view e
pelos testes da calculadora, e converte os avisos estruturados do motor para o
enum legado (``BAIXO``/``ALTO``/``CRITICO``) consumido pela UI atual.
"""

from decimal import Decimal

from apps.pharma_engine import medication as med_engine
from apps.pharma_engine.concentration import dose_to_volume_ml
from apps.pharma_engine.limits import validate_dose_range, validate_dose_range_by_age


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
