from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Dose:
    value: Decimal
    mass_unit: str   # "mg", "mcg", "g"
    denominator: str # "dose", "24h", "h", "min", "kg", ""

    def is_per_kg(self) -> bool:
        return self.denominator == "kg"

    def is_per_time(self) -> bool:
        return self.denominator in ("h", "min", "24h")

    def is_per_dose(self) -> bool:
        return self.denominator == "dose"

    def to_absolute(self, weight_kg: Decimal) -> "Dose":
        """Convert per-kg dose to absolute dose."""
        if not self.is_per_kg():
            return self
        return Dose(
            value=self.value * weight_kg,
            mass_unit=self.mass_unit,
            denominator="" if self.denominator == "kg" else self.denominator,
        )

    def to_24h(self, interval_hours: int) -> "Dose":
        """Convert per-hour dose to per-24h dose."""
        if self.denominator != "h":
            return self
        return Dose(
            value=self.value * Decimal("24"),
            mass_unit=self.mass_unit,
            denominator="24h",
        )

    def to_dose(self, doses_per_day: Decimal) -> "Dose":
        """Convert per-24h dose to per-dose."""
        if self.denominator != "24h":
            return self
        return Dose(
            value=self.value / doses_per_day,
            mass_unit=self.mass_unit,
            denominator="dose",
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
            denominator=self.denominator,
        )
