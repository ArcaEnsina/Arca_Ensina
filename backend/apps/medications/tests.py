from decimal import Decimal

from django.test import TestCase

from apps.medications.models import Medication
from apps.medications.serializers import MedicationDetailSerializer


class MedicationDetailSerializerTests(TestCase):
    """EXP-002: campos legados (flat dosing) devem aparecer no detail."""

    def setUp(self):
        self.medication = Medication.objects.create(
            name="Amoxicilina",
            prescription=50,
            frequency_hours=8,
            min_dose_mg_kg=25,
            max_dose_mg_kg=90,
            max_absolute_dose_mg=3000,
            concentration_mg=250,
            concentration_ml=5,
            limits_by_age=None,
        )

    def test_legacy_fields_in_detail_serializer(self):
        data = MedicationDetailSerializer(self.medication).data

        # campos legados de dosagem plana
        self.assertIn("prescription", data)
        self.assertIn("frequency_hours", data)
        self.assertIn("min_dose_mg_kg", data)
        self.assertIn("max_dose_mg_kg", data)
        self.assertIn("max_absolute_dose_mg", data)
        self.assertIn("concentration_mg", data)
        self.assertIn("concentration_ml", data)
        self.assertIn("limits_by_age", data)

        # valores corretos
        self.assertEqual(Decimal(str(data["prescription"])), Decimal("50"))
        self.assertEqual(data["frequency_hours"], 8)
        self.assertEqual(Decimal(str(data["min_dose_mg_kg"])), Decimal("25"))
        self.assertEqual(Decimal(str(data["max_dose_mg_kg"])), Decimal("90"))
        self.assertEqual(Decimal(str(data["max_absolute_dose_mg"])), Decimal("3000"))
        self.assertEqual(Decimal(str(data["concentration_mg"])), Decimal("250"))
        self.assertEqual(Decimal(str(data["concentration_ml"])), Decimal("5"))
        self.assertIsNone(data["limits_by_age"])
