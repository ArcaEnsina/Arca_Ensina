import re
from decimal import Decimal

from .models import Dose

UNIT_PATTERN = re.compile(r"^([\d.]+)\s*(mcg|mg|g)(?:/([\w/]+))?$")

_TOKEN_TO_FLAG = {
    "kg": "per_kg",
    "min": "per_minute",
    "h": "per_hour",
    "24h": "per_24h",
    "dose": "per_dose",
}


def parse_unit_string(s: str) -> Dose:
    """Parse strings like '10 mg/dose', '5 mcg/kg/min', '162 mg/24h'."""
    s = s.strip().lower()
    match = UNIT_PATTERN.match(s)
    if not match:
        raise ValueError(f"Invalid unit string: {s}")
    value = Decimal(match.group(1))
    mass_unit = match.group(2)
    raw_denom = match.group(3) or ""

    flags: dict = {}
    if raw_denom:
        for token in raw_denom.split("/"):
            if not token:
                continue
            if token not in _TOKEN_TO_FLAG:
                raise ValueError(f"Unknown denominator token: {token}")
            flags[_TOKEN_TO_FLAG[token]] = True

    return Dose(value=value, mass_unit=mass_unit, **flags)


def normalize_to_mg(dose: Dose, weight_kg: Decimal | None = None) -> Dose:
    """Normalize any dose to mg absolute (or per-dose/per-24h as appropriate)."""
    result = dose
    if result.mass_unit != "mg":
        result = result.convert_mass("mg")
    if result.is_per_kg() and weight_kg is not None:
        result = result.to_absolute(weight_kg)
    return result
