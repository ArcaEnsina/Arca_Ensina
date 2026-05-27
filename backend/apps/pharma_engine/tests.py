from decimal import Decimal

from django.test import TestCase

from .frequency import parse_frequency
from .models import Dose
from .pipeline import calculate_dose_pipeline
from .unit import normalize_to_mg, parse_unit_string


class DoseModelTest(TestCase):
    def test_parse_and_convert(self):
        dose = parse_unit_string("10 mg/dose")
        self.assertEqual(dose.value, Decimal("10"))
        self.assertEqual(dose.mass_unit, "mg")

    def test_mcg_to_mg(self):
        dose = Dose(Decimal("1000"), "mcg", "dose").convert_mass("mg")
        self.assertEqual(dose.value, Decimal("1"))

    def test_per_kg_to_absolute(self):
        dose = Dose(Decimal("0.5"), "mg", "kg").to_absolute(Decimal("20"))
        self.assertEqual(dose.value, Decimal("10"))

    def test_per_24h_to_per_dose(self):
        dose = Dose(Decimal("162"), "mg", "24h").to_dose(Decimal("4"))
        self.assertEqual(dose.value, Decimal("40.5"))


class FrequencyTest(TestCase):
    def test_6_6h(self):
        result = parse_frequency("6/6h")
        self.assertEqual(result["doses_per_day"], Decimal("4"))

    def test_continuous(self):
        result = parse_frequency("contínua")
        self.assertEqual(result["doses_per_day"], Decimal("1"))


class PipelineTest(TestCase):
    def test_midazolam_to_diazepam(self):
        result = calculate_dose_pipeline(
            formula_result=Decimal("162"),
            output_unit_str="mg/24h",
            frequency_str="6/6h",
            weight_kg=Decimal("54"),
            limit_dict={"max_dose": "10", "unit": "mg/dose", "type": "absolute", "drug": "Diazepam"},
            formula_applied="dose * peso_kg * 0.6",
        )
        self.assertEqual(result["per_dose"]["value"], "40.5000")
        self.assertEqual(result["doses_per_day"], 4)
        self.assertEqual(result["recommended"]["value"], "10.0000")  # capped at max
        self.assertEqual(len(result["warnings"]), 1)
        self.assertEqual(result["warnings"][0]["type"], "above_max_recommended")

    def test_limit_without_denominator_triggers_warning(self):
        """Limit with unit 'mcg' (no /dose) should still trigger warning."""
        result = calculate_dose_pipeline(
            formula_result=Decimal("3.5"),  # 3.5 mg = 3500 mcg
            output_unit_str="mg/24h",
            frequency_str="6/6h",
            weight_kg=Decimal("1"),
            limit_dict={"max_dose": "200", "unit": "mcg", "type": "absolute", "drug": "Clonidina"},
        )
        self.assertEqual(len(result["warnings"]), 1)
        self.assertEqual(result["warnings"][0]["type"], "above_max_recommended")
        self.assertEqual(result["recommended"]["value"], "0.2000")  # 200 mcg = 0.2 mg
