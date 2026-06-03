import json
import os

from django.test import TestCase

from apps.calculator import services
from apps.medications.models import Medication

FIXTURES_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "..", "fixtures", "calculator"
)
CASES_PATH = os.path.join(FIXTURES_DIR, "cases.json")
EXPECTED_PATH = os.path.join(FIXTURES_DIR, "expected.json")


def normalize(result):
    """Canonical normalization — must match JS normalize() exactly."""

    def fmt(val, places):
        if val is None:
            return None
        return format(val, f".{places}f")

    return {
        "blocked": result["blocked"],
        "dosage_mg": fmt(result["dosage_mg"], 2),
        "dosage_per_dose": fmt(result["dosage_per_dose"], 2),
        "frequency_per_day": result["frequency_per_day"],
        "volume_ml": fmt(result["volume_ml"], 2),
        "drops": fmt(result["drops"], 0),
        "units": fmt(result["units"], 2),
        "unit_label": result["unit_label"],
        "warnings": result["warnings"],
        "warnings_detail": result["warnings_detail"],
        "regimen": result["regimen"],
        "presentation": result["presentation"],
    }


class CalculatorParityTests(TestCase):
    """generates expected.json from Python engine and asserts stability."""

    maxDiff = None

    def test_generate_expected_and_assert(self):
        with open(CASES_PATH, "r", encoding="utf-8") as f:
            cases = json.load(f)

        expected = []
        for case in cases:
            med_data = case["medication"]
            # Build in-memory Medication (no DB). Strip 'id' — auto field.
            med_fields = {k: v for k, v in med_data.items() if k != "id"}
            medication = Medication(**med_fields)

            inp = case["input"]
            result = services.calculate_for_medication(
                medication,
                weight=inp["weight"],
                height=inp.get("height") or None,
                age_days=inp.get("age_days"),
                indication=inp.get("indication"),
                route=inp.get("route"),
                presentation_index=inp.get("presentation_index"),
            )
            expected.append(
                {
                    "name": case["name"],
                    "result": normalize(result),
                }
            )

        with open(EXPECTED_PATH, "w", encoding="utf-8") as f:
            json.dump(expected, f, indent=2, ensure_ascii=False)

        with open(EXPECTED_PATH, "r", encoding="utf-8") as f:
            loaded = json.load(f)
        self.assertEqual(len(loaded), len(expected))
        for i, (a, b) in enumerate(zip(expected, loaded)):
            self.assertEqual(
                a,
                b,
                f"Mismatch at case {i}: {a['name']}",
            )
