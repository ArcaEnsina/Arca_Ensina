from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Dose:
    value: Decimal
    mass_unit: str   # "mg", "mcg", "g"
    per_kg: bool = False
    per_minute: bool = False
    per_hour: bool = False
    per_24h: bool = False
    per_dose: bool = False

    def __post_init__(self) -> None:
        time_flags = [self.per_minute, self.per_hour, self.per_24h]
        if sum(time_flags) > 1:
            raise ValueError(
                "At most one time flag can be set: "
                "per_minute, per_hour, per_24h are mutually exclusive."
            )
        if self.per_dose and any(time_flags):
            raise ValueError(
                "per_dose and time flags (per_minute/per_hour/per_24h) "
                "are mutually exclusive."
            )

    def denominator_str(self) -> str:
        """Reconstruct denominator string from flags in canonical order."""
        parts = []
        if self.per_kg:
            parts.append("kg")
        if self.per_minute:
            parts.append("min")
        if self.per_hour:
            parts.append("h")
        if self.per_24h:
            parts.append("24h")
        if self.per_dose:
            parts.append("dose")
        return "/".join(parts)

    def is_per_kg(self) -> bool:
        return self.per_kg

    def is_per_time(self) -> bool:
        return self.per_minute or self.per_hour or self.per_24h

    def is_per_dose(self) -> bool:
        return self.per_dose

    def to_absolute(self, weight_kg: Decimal) -> "Dose":
        """Convert per-kg dose to absolute dose."""
        if not self.per_kg:
            return self
        return Dose(
            value=self.value * weight_kg,
            mass_unit=self.mass_unit,
            per_kg=False,
            per_minute=self.per_minute,
            per_hour=self.per_hour,
            per_24h=self.per_24h,
            per_dose=self.per_dose,
        )

    def to_24h(self) -> "Dose":
        """Convert per-hour dose to per-24h dose."""
        if not self.per_hour:
            return self
        return Dose(
            value=self.value * Decimal("24"),
            mass_unit=self.mass_unit,
            per_kg=self.per_kg,
            per_minute=self.per_minute,
            per_hour=False,
            per_24h=True,
            per_dose=self.per_dose,
        )

    def to_dose(self, doses_per_day: Decimal) -> "Dose":
        """Convert per-24h dose to per-dose."""
        if not self.per_24h:
            return self
        return Dose(
            value=self.value / doses_per_day,
            mass_unit=self.mass_unit,
            per_kg=self.per_kg,
            per_minute=self.per_minute,
            per_hour=self.per_hour,
            per_24h=False,
            per_dose=True,
        )

    def convert_mass(self, target_unit: str) -> "Dose":
        """Convert mass unit (mcg->mg->g)."""
        conversions = {
            ("mcg", "mg"): Decimal("0.001"),
            ("mg", "mcg"): Decimal("1000"),
            ("mg", "g"): Decimal("0.001"),
            ("g", "mg"): Decimal("1000"),
            ("mcg", "g"): Decimal("0.000001"),
            ("g", "mcg"): Decimal("1000000"),
        }
        if self.mass_unit == target_unit:
            return self
        key = (self.mass_unit, target_unit)
        if key not in conversions:
            raise ValueError(f"Cannot convert {self.mass_unit} to {target_unit}")
        return Dose(
            value=self.value * conversions[key],
            mass_unit=target_unit,
            per_kg=self.per_kg,
            per_minute=self.per_minute,
            per_hour=self.per_hour,
            per_24h=self.per_24h,
            per_dose=self.per_dose,
        )
