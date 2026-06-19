from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

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


class MedicationBulkDetailViewTests(TestCase):
    """Auto-download offline: /medications/all/ devolve todos com schema rico."""

    def setUp(self):
        self.url = reverse("medication-bulk-detail", kwargs={"version": "v1"})
        self.client = APIClient()
        Medication.objects.create(
            name="Dobutamina",
            presentations=[
                {
                    "form": "ampola",
                    "route": "IV",
                    "concentration_mg": 250,
                    "concentration_ml": 20,
                    "drops_per_ml": None,
                }
            ],
            regimens=[
                {
                    "indication": "Choque",
                    "dose_basis": "per_day",
                    "frequency_hours": 24,
                    "dose_mg_kg": 0.12,
                }
            ],
        )
        Medication.objects.create(
            name="Amoxicilina", prescription=50, frequency_hours=8
        )

    def test_requires_authentication(self):
        response = self.client.get(self.url)
        self.assertIn(response.status_code, (401, 403))

    def test_returns_all_medications_with_rich_schema(self):
        user = get_user_model().objects.create_user(
            email="medico@arca.test", password="senha-forte-123"
        )
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        # ordenado por nome
        self.assertEqual(response.data[0]["name"], "Amoxicilina")
        self.assertEqual(response.data[1]["name"], "Dobutamina")
        # schema rico presente no payload em lote
        self.assertIn("presentations", response.data[1])
        self.assertIn("regimens", response.data[1])
        self.assertEqual(response.data[1]["regimens"][0]["indication"], "Choque")
