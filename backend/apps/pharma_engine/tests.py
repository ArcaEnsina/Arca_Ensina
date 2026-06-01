from decimal import Decimal

from django.test import TestCase

from .bsa import bsa_mosteller
from .concentration import dose_to_drops, dose_to_presentation, dose_to_volume_ml
from .contraindications import evaluate_contraindications
from .frequency import frequency_from_hours, parse_frequency
from .limits import (
    classify_age_band,
    validate_dose_range,
    validate_dose_range_by_age,
)
from .medication import calculate_medication_dose, calculate_total_dose
from .models import Dose
from .pipeline import calculate_dose_pipeline
from .unit import parse_unit_string


class DoseModelTest(TestCase):
    def test_parse_and_convert(self):
        dose = parse_unit_string("10 mg/dose")
        self.assertEqual(dose.value, Decimal("10"))
        self.assertEqual(dose.mass_unit, "mg")

    def test_mcg_to_mg(self):
        dose = Dose(Decimal("1000"), "mcg", per_dose=True).convert_mass("mg")
        self.assertEqual(dose.value, Decimal("1"))

    def test_per_kg_to_absolute(self):
        dose = Dose(Decimal("0.5"), "mg", per_kg=True).to_absolute(Decimal("20"))
        self.assertEqual(dose.value, Decimal("10"))

    def test_per_24h_to_per_dose(self):
        dose = Dose(Decimal("162"), "mg", per_24h=True).to_dose(Decimal("4"))
        self.assertEqual(dose.value, Decimal("40.5"))

    def test_parse_mcg_kg_min(self):
        dose = parse_unit_string("5 mcg/kg/min")
        self.assertEqual(dose.value, Decimal("5"))
        self.assertEqual(dose.mass_unit, "mcg")
        self.assertTrue(dose.per_kg)
        self.assertTrue(dose.per_minute)
        self.assertFalse(dose.per_hour)
        self.assertFalse(dose.per_24h)
        self.assertFalse(dose.per_dose)

    def test_is_per_kg_and_time(self):
        dose = parse_unit_string("5 mcg/kg/min")
        self.assertTrue(dose.is_per_kg())
        self.assertTrue(dose.is_per_time())

    def test_to_absolute_preserves_time(self):
        dose = Dose(Decimal("5"), "mcg", per_kg=True, per_minute=True)
        result = dose.to_absolute(Decimal("10"))
        self.assertEqual(result.value, Decimal("50"))
        self.assertFalse(result.per_kg)
        self.assertTrue(result.per_minute)

    def test_denominator_str_mcg_kg_min(self):
        dose = Dose(Decimal("5"), "mcg", per_kg=True, per_minute=True)
        self.assertEqual(dose.denominator_str(), "kg/min")

    def test_denominator_str_24h(self):
        dose = Dose(Decimal("162"), "mg", per_24h=True)
        self.assertEqual(dose.denominator_str(), "24h")

    def test_denominator_str_empty(self):
        dose = Dose(Decimal("10"), "mg")
        self.assertEqual(dose.denominator_str(), "")


class FrequencyTest(TestCase):
    def test_6_6h(self):
        result = parse_frequency("6/6h")
        self.assertEqual(result["doses_per_day"], Decimal("4"))

    def test_continuous(self):
        result = parse_frequency("contínua")
        self.assertEqual(result["doses_per_day"], Decimal("1"))

    def test_frequency_from_hours(self):
        result = frequency_from_hours(6)
        self.assertEqual(result["doses_per_day"], Decimal("4"))
        self.assertEqual(result["interval_hours"], 6)

    def test_frequency_from_hours_invalid(self):
        with self.assertRaises(ValueError):
            frequency_from_hours(0)


class BsaTests(TestCase):
    def test_bsa_mosteller(self):
        # sqrt((100 * 16) / 3600) = sqrt(0.4444...) ~= 0.6667 m²
        bsa = bsa_mosteller(Decimal("16"), Decimal("100"))
        self.assertEqual(bsa.quantize(Decimal("0.0001")), Decimal("0.6667"))

    def test_bsa_invalid(self):
        with self.assertRaises(ValueError):
            bsa_mosteller(Decimal("0"), Decimal("100"))


class ConcentrationTests(TestCase):
    def test_dose_to_volume_ml(self):
        # 250 / (125 / 5) = 10 mL
        result = dose_to_volume_ml(Decimal("250"), Decimal("125"), Decimal("5"))
        self.assertEqual(result, Decimal("10.00"))

    def test_dose_to_volume_ml_invalid(self):
        with self.assertRaises(ValueError):
            dose_to_volume_ml(Decimal("250"), Decimal("0"), Decimal("5"))

    def test_dose_to_drops_dipirona(self):
        # gotas 500 mg/mL, 20 gotas/mL -> 1 gota = 25 mg; 100 mg = 4 gotas
        drops = dose_to_drops(Decimal("100"), Decimal("500"), Decimal("1"), 20)
        self.assertEqual(drops, Decimal("4"))

    def test_dose_to_presentation_gotas(self):
        presentation = {
            "form": "gotas",
            "concentration_mg": 500,
            "concentration_ml": 1,
            "drops_per_ml": 20,
        }
        result = dose_to_presentation(Decimal("100"), presentation)
        self.assertEqual(result["volume_ml"], Decimal("0.20"))
        self.assertEqual(result["drops"], Decimal("4"))

    def test_dose_to_presentation_solid_has_no_volume(self):
        presentation = {
            "form": "comprimido",
            "concentration_mg": 500,
            "concentration_ml": None,
        }
        result = dose_to_presentation(Decimal("500"), presentation)
        self.assertIsNone(result["volume_ml"])
        self.assertIsNone(result["drops"])


class ContraindicationsTests(TestCase):
    DIPIRONA_RULES = [
        {"rule": "min_age_days", "value": 90},
        {"rule": "min_weight_kg", "value": 5},
        {"rule": "form_min_age_days", "form": "supositorio", "value": 1460},
        {
            "rule": "route_forbidden_age_range",
            "route": "IV",
            "min_days": 90,
            "max_days": 365,
        },
    ]

    def test_below_min_age_blocks(self):
        blocks = evaluate_contraindications(
            rules=self.DIPIRONA_RULES, age_days=30, weight=4
        )
        # idade < 90 dias E peso < 5 kg -> dois bloqueios
        self.assertEqual(len(blocks), 2)
        self.assertTrue(all(b["severity"] == "CRITICO" for b in blocks))
        self.assertTrue(all(b["type"] == "contraindicated" for b in blocks))

    def test_iv_forbidden_in_window(self):
        blocks = evaluate_contraindications(
            rules=self.DIPIRONA_RULES, age_days=180, weight=8, route="IV"
        )
        self.assertEqual([b["rule"] for b in blocks], ["route_forbidden_age_range"])

    def test_iv_allowed_outside_window(self):
        blocks = evaluate_contraindications(
            rules=self.DIPIRONA_RULES, age_days=400, weight=8, route="IV"
        )
        self.assertEqual(blocks, [])

    def test_suppository_under_4y(self):
        blocks = evaluate_contraindications(
            rules=self.DIPIRONA_RULES, age_days=365 * 2, weight=14, form="supositorio"
        )
        self.assertEqual([b["rule"] for b in blocks], ["form_min_age_days"])

    def test_no_rules(self):
        self.assertEqual(evaluate_contraindications(rules=None, age_days=30), [])

    def test_unknown_rule_raises(self):
        with self.assertRaises(ValueError):
            evaluate_contraindications(rules=[{"rule": "bogus"}], age_days=100)


class LimitsTests(TestCase):
    def test_classify_age_bands(self):
        self.assertEqual(classify_age_band(10), "neonatal")
        self.assertEqual(classify_age_band(60), "lactente")
        self.assertEqual(classify_age_band(365 * 5), "crianca")
        self.assertEqual(classify_age_band(365 * 14), "adolescente")
        self.assertEqual(classify_age_band(365 * 30), "adulto")

    def test_within_limits_no_warning(self):
        warnings = validate_dose_range(
            dose_per_kg=Decimal("20"),
            total_dose_mg=Decimal("300"),
            min_dose=Decimal("10"),
            max_dose=Decimal("50"),
        )
        self.assertEqual(warnings, [])

    def test_below_minimum(self):
        warnings = validate_dose_range(
            dose_per_kg=Decimal("5"),
            total_dose_mg=Decimal("75"),
            min_dose=Decimal("10"),
            max_dose=Decimal("50"),
        )
        self.assertEqual([w["severity"] for w in warnings], ["BAIXO"])

    def test_above_max_and_absolute_order(self):
        # 80 mg/kg > 50 -> ALTO; total 1200 > 1000 -> CRITICO (nessa ordem)
        warnings = validate_dose_range(
            dose_per_kg=Decimal("80"),
            total_dose_mg=Decimal("1200"),
            min_dose=Decimal("10"),
            max_dose=Decimal("50"),
            absolute_max=Decimal("1000"),
        )
        self.assertEqual([w["severity"] for w in warnings], ["ALTO", "CRITICO"])

    def test_by_age_above_max(self):
        warnings = validate_dose_range_by_age(
            dose_per_kg=Decimal("40"),
            total_dose_mg=Decimal("200"),
            age_days=60,
            limits_by_age={"lactente": {"min": Decimal("10"), "max": Decimal("20")}},
        )
        self.assertEqual([w["severity"] for w in warnings], ["ALTO"])

    def test_by_age_unknown_band_raises(self):
        with self.assertRaises(ValueError):
            validate_dose_range_by_age(
                dose_per_kg=Decimal("40"),
                total_dose_mg=Decimal("200"),
                age_days=60,
                limits_by_age={"neonatal": {"min": Decimal("10")}},
            )


class MedicationPipelineTests(TestCase):
    def test_total_dose_weight_based(self):
        self.assertEqual(
            calculate_total_dose(Decimal("10"), Decimal("15")), Decimal("150.00")
        )

    def test_total_dose_bsa(self):
        # 100 mg/m² * 0.6667 m² = 66.67 mg
        self.assertEqual(
            calculate_total_dose(Decimal("100"), Decimal("16"), Decimal("100")),
            Decimal("66.67"),
        )

    def test_full_pipeline_matches_legacy_amoxicilina(self):
        # 50 mg/kg * 20 kg, q8h, 250 mg / 5 mL, limites 25-90 mg/kg
        result = calculate_medication_dose(
            prescription=Decimal("50"),
            weight=Decimal("20"),
            frequency_hours=8,
            min_dose=Decimal("25"),
            max_dose=Decimal("90"),
            concentration_mg=Decimal("250"),
            concentration_ml=Decimal("5"),
        )
        self.assertEqual(result["dosage_mg"], Decimal("1000.00"))
        self.assertEqual(result["frequency_per_day"], 3)
        self.assertEqual(result["dosage_per_dose"], Decimal("333.33"))
        self.assertEqual(result["volume_ml"], Decimal("6.67"))
        self.assertEqual(result["warnings"], [])

    def test_full_pipeline_with_age_band_warning(self):
        result = calculate_medication_dose(
            prescription=Decimal("50"),
            weight=Decimal("5"),
            frequency_hours=8,
            age_days=60,
            limits_by_age={"lactente": {"min": Decimal("10"), "max": Decimal("20")}},
        )
        # 50 mg/kg > 20 -> ALTO
        self.assertEqual([w["severity"] for w in result["warnings"]], ["ALTO"])

    def test_per_dose_basis_dipirona(self):
        # Dipirona: 12 mg/kg/dose, 20 kg, q6h (4x/dia)
        # por dose = 240 mg; total diário = 960 mg
        result = calculate_medication_dose(
            prescription=Decimal("12"),
            weight=Decimal("20"),
            frequency_hours=6,
            dose_basis="per_dose",
            min_dose=Decimal("10"),
            max_dose=Decimal("15"),
            daily_max=Decimal("100"),
            absolute_max=Decimal("4000"),
        )
        self.assertEqual(result["dosage_per_dose"], Decimal("240.00"))
        self.assertEqual(result["dosage_mg"], Decimal("960.00"))
        self.assertEqual(result["frequency_per_day"], 4)
        # 12 mg/kg/dose dentro de 10-15; diário 48 mg/kg/dia < 100; < 4000 mg
        self.assertEqual(result["warnings"], [])

    def test_per_dose_basis_daily_max_exceeded(self):
        # 15 mg/kg/dose (no limite por dose) mas q4h (6x) -> 90 mg/kg/dia < 100 ok;
        # forçamos estouro com daily_max baixo para checar o aviso de teto diário
        result = calculate_medication_dose(
            prescription=Decimal("15"),
            weight=Decimal("10"),
            frequency_hours=4,
            dose_basis="per_dose",
            min_dose=Decimal("10"),
            max_dose=Decimal("15"),
            daily_max=Decimal("80"),
        )
        # por dose 15 mg/kg ok; diário = 15*6 = 90 mg/kg/dia > 80 -> ALTO
        self.assertEqual([w["type"] for w in result["warnings"]], ["above_daily_max"])

    def test_per_dose_with_presentation_gotas(self):
        # por dose 240 mg em gotas 500 mg/mL (20 gotas/mL) -> 0,48 mL ~ 10 gotas
        result = calculate_medication_dose(
            prescription=Decimal("12"),
            weight=Decimal("20"),
            frequency_hours=6,
            dose_basis="per_dose",
            presentation={
                "form": "gotas",
                "concentration_mg": 500,
                "concentration_ml": 1,
                "drops_per_ml": 20,
            },
        )
        self.assertEqual(result["volume_ml"], Decimal("0.48"))
        self.assertEqual(result["drops"], Decimal("10"))

    def test_invalid_dose_basis_raises(self):
        with self.assertRaises(ValueError):
            calculate_medication_dose(
                prescription=Decimal("10"),
                weight=Decimal("10"),
                frequency_hours=6,
                dose_basis="bogus",
            )

    def test_mg_kg_ignores_height(self):
        # mg/kg não deve usar BSA mesmo recebendo altura.
        result = calculate_medication_dose(
            prescription=Decimal("15"),
            weight=Decimal("54"),
            height=Decimal("160"),
            frequency_hours=6,
            dose_basis="per_dose",
            dose_unit="mg/kg",
        )
        self.assertEqual(result["dosage_per_dose"], Decimal("810.00"))

    def test_mg_m2_uses_bsa(self):
        # 100 mg/m²/dia, peso 16 kg, altura 100 cm -> BSA 0.6667 m²
        # total = 100 * 0.6667 = 66.67 mg; comparação = 66.67 / 0.6667 ~ 100
        result = calculate_medication_dose(
            prescription=Decimal("100"),
            weight=Decimal("16"),
            height=Decimal("100"),
            frequency_hours=6,
            dose_basis="per_day",
            dose_unit="mg/m2",
            min_dose=Decimal("50"),
            max_dose=Decimal("150"),
        )
        self.assertEqual(result["dosage_mg"], Decimal("66.67"))
        self.assertEqual(result["warnings"], [])

    def test_mg_m2_requires_height(self):
        with self.assertRaises(ValueError):
            calculate_medication_dose(
                prescription=Decimal("100"),
                weight=Decimal("16"),
                frequency_hours=6,
                dose_unit="mg/m2",
            )

    def test_invalid_dose_unit_raises(self):
        with self.assertRaises(ValueError):
            calculate_medication_dose(
                prescription=Decimal("10"),
                weight=Decimal("10"),
                frequency_hours=6,
                dose_unit="bogus",
            )


class PipelineTest(TestCase):
    def test_midazolam_to_diazepam(self):
        result = calculate_dose_pipeline(
            formula_result=Decimal("162"),
            output_unit_str="mg/24h",
            frequency_str="6/6h",
            weight_kg=Decimal("54"),
            limit_dict={
                "max_dose": "10",
                "unit": "mg/dose",
                "type": "absolute",
                "drug": "Diazepam",
            },
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
            limit_dict={
                "max_dose": "200",
                "unit": "mcg",
                "type": "absolute",
                "drug": "Clonidina",
            },
        )
        self.assertEqual(len(result["warnings"]), 1)
        self.assertEqual(result["warnings"][0]["type"], "above_max_recommended")
        self.assertEqual(result["recommended"]["value"], "0.2000")  # 200 mcg = 0.2 mg
