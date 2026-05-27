from decimal import Decimal

from .frequency import parse_frequency
from .models import Dose
from .unit import normalize_to_mg, parse_unit_string


def calculate_dose_pipeline(
    formula_result: Decimal,
    output_unit_str: str,
    frequency_str: str,
    weight_kg: Decimal,
    limit_dict: dict | None = None,
    formula_applied: str = "",
) -> dict:
    """Clinical dose calculation pipeline.

    Steps:
    1. Parse output_unit → Dose
    2. If output_unit is per-24h and frequency given → calculate per_dose
    3. Parse limit → Dose, compare in correct dimension
    4. Return structured result

    Returns:
        {
            "total_daily": {"value": str, "unit": str},
            "per_dose": {"value": str, "unit": str},
            "doses_per_day": int,
            "frequency": str,
            "recommended": {"value": str, "unit": str},
            "formula_applied": str,
            "warnings": list[dict],
        }
    """
    warnings = []

    # Step 1: Parse total daily dose
    total_daily = parse_unit_string(f"{formula_result} {output_unit_str}")
    total_daily_mg = normalize_to_mg(total_daily, weight_kg)

    # Step 2: Derive per-dose if applicable
    per_dose = total_daily
    doses_per_day = Decimal("1")

    if total_daily.per_24h and frequency_str:
        freq = parse_frequency(frequency_str)
        doses_per_day = freq["doses_per_day"]
        per_dose = total_daily.to_dose(doses_per_day)

    per_dose_mg = normalize_to_mg(per_dose, weight_kg)

    # Step 3: Apply limits
    recommended = per_dose_mg

    if limit_dict:
        max_dose_raw = str(limit_dict.get("max_dose", "0"))
        limit_type = limit_dict.get("type", "absolute")

        # max_dose may already include unit (e.g., "10 mg/dose")
        try:
            limit_dose = parse_unit_string(max_dose_raw)
        except ValueError:
            limit_unit_str = limit_dict.get("unit", "")
            limit_dose = parse_unit_string(f"{max_dose_raw} {limit_unit_str}")

        if limit_type == "per_kg":
            if not limit_dose.per_kg:
                limit_dose = Dose(
                    value=limit_dose.value,
                    mass_unit=limit_dose.mass_unit,
                    per_kg=True,
                    per_minute=limit_dose.per_minute,
                    per_hour=limit_dose.per_hour,
                    per_24h=limit_dose.per_24h,
                    per_dose=limit_dose.per_dose,
                )
            limit_dose = limit_dose.to_absolute(weight_kg)
        limit_mg = normalize_to_mg(limit_dose, weight_kg)

        # Compare in the same dimension
        if (limit_dose.per_dose or limit_dose.denominator_str() == "") and per_dose_mg.value > limit_mg.value:
            recommended = limit_mg
            warnings.append({
                "type": "above_max_recommended",
                "drug": limit_dict.get("drug", ""),
                "current_dose": str(per_dose_mg.value),
                "max_allowed": str(limit_mg.value),
                "unit": str(limit_dose.mass_unit),
                "message": (
                    f"Dose por administração ({per_dose_mg.value} {limit_dose.mass_unit}/dose) "
                    f"excede o máximo recomendado ({limit_mg.value} {limit_dose.mass_unit}/dose)."
                ),
            })
        elif limit_dose.per_24h and total_daily_mg.value > limit_mg.value:
            recommended = limit_mg
            warnings.append({
                "type": "above_max_recommended",
                "drug": limit_dict.get("drug", ""),
                "current_dose": str(total_daily_mg.value),
                "max_allowed": str(limit_mg.value),
                "unit": str(limit_dose.mass_unit),
                "message": (
                    f"Dose diária ({total_daily_mg.value} {limit_dose.mass_unit}/24h) "
                    f"excede o máximo recomendado ({limit_mg.value} {limit_dose.mass_unit}/24h)."
                ),
            })

    total_daily_denom = total_daily_mg.denominator_str()
    per_dose_denom = per_dose_mg.denominator_str()
    recommended_denom = recommended.denominator_str()
    return {
        "total_daily": {
            "value": str(total_daily_mg.value.quantize(Decimal("0.0001"))),
            "unit": f"{total_daily_mg.mass_unit}/{total_daily_denom}" if total_daily_denom else total_daily_mg.mass_unit,
        },
        "per_dose": {
            "value": str(per_dose_mg.value.quantize(Decimal("0.0001"))),
            "unit": f"{per_dose_mg.mass_unit}/{per_dose_denom}" if per_dose_denom else per_dose_mg.mass_unit,
        },
        "doses_per_day": int(doses_per_day.to_integral_value()),
        "frequency": frequency_str,
        "recommended": {
            "value": str(recommended.value.quantize(Decimal("0.0001"))),
            "unit": f"{recommended.mass_unit}/{recommended_denom}" if recommended_denom else recommended.mass_unit,
        },
        "formula_applied": formula_applied,
        "warnings": warnings,
    }
