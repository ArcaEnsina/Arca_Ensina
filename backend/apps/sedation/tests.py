from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.protocols.models import Protocol, ProtocolVersion

from .engine.converter import SedationConverter

User = get_user_model()


class SedationConverterTests(TestCase):
    """Testes unitários do conversor de sedação."""

    def setUp(self):
        self.panel_data = {
            "sections": [
                {
                    "id": "equiv_midaz_diaz",
                    "title": "Midazolam → Diazepam",
                    "type": "equivalence_table",
                    "rows": [
                        {
                            "drug_a": "Midazolam IV contínua",
                            "drug_b": "Diazepam VO",
                            "formula": "dose * peso_kg * 0.6",
                            "route": "VO",
                            "frequency": "6/6h",
                        }
                    ],
                    "dose_limits": [
                        {
                            "drug": "Diazepam",
                            "type": "absolute",
                            "max_dose": "10 mg/dose",
                            "unit": "mg/dose",
                        }
                    ],
                },
                {
                    "id": "equiv_morfina_vo",
                    "title": "Opioides → Morfina VO",
                    "type": "equivalence_table",
                    "rows": [
                        {
                            "drug_a": "Morfina IV contínua",
                            "drug_b": "Morfina VO",
                            "formula": "dose * peso_kg * 0.072",
                            "route": "VO",
                            "frequency": "4/4h",
                        },
                        {
                            "drug_a": "Fentanil IV contínuo",
                            "drug_b": "Morfina VO",
                            "formula": "dose * peso_kg * 1.8",
                            "route": "VO",
                            "frequency": "4/4h",
                        },
                    ],
                    "dose_limits": [
                        {
                            "drug": "Morfina VO",
                            "type": "absolute",
                            "max_dose": "20 mg/dose",
                            "unit": "mg/dose",
                        }
                    ],
                },
                {
                    "id": "equiv_morfina_metadona",
                    "title": "Morfina → Metadona",
                    "type": "equivalence_table",
                    "rows": [
                        {
                            "drug_a": "Morfina IV contínua",
                            "drug_b": "Metadona VO",
                            "formula": "dose * peso_kg * 0.048",
                            "route": "VO",
                            "frequency": "8/8h",
                        }
                    ],
                    "dose_limits": [
                        {
                            "drug": "Metadona",
                            "type": "absolute",
                            "max_dose": "10 mg/dose",
                            "unit": "mg/dose",
                        }
                    ],
                },
                {
                    "id": "equiv_dexmed_clonidina",
                    "title": "Dexmedetomidina → Clonidina",
                    "type": "equivalence_table",
                    "rows": [
                        {
                            "drug_a": "Dexmedetomidina IV",
                            "drug_b": "Clonidina VO/SL",
                            "formula": "dose * peso_kg * 5",
                            "route": "VO/SL",
                            "frequency": "6/6h",
                        }
                    ],
                    "dose_limits": [
                        {
                            "drug": "Clonidina",
                            "type": "absolute",
                            "max_dose": "200 mcg",
                            "unit": "mcg",
                        }
                    ],
                },
                {
                    "id": "equiv_loraz_diaz",
                    "title": "Lorazepam → Diazepam VO",
                    "type": "equivalence_table",
                    "rows": [
                        {
                            "drug_a": "Lorazepam IV",
                            "drug_b": "Diazepam VO",
                            "formula": "dose * peso_kg * 5",
                            "route": "VO",
                            "frequency": "6/6h",
                        }
                    ],
                    "dose_limits": [
                        {
                            "drug": "Lorazepam",
                            "type": "absolute",
                            "max_dose": "4 mg/dose",
                            "unit": "mg/dose",
                        }
                    ],
                },
                {
                    "id": "equiv_fentanil_morfina_iv",
                    "title": "Fentanil IV → Morfina IV",
                    "type": "equivalence_table",
                    "rows": [
                        {
                            "drug_a": "Fentanil IV contínuo",
                            "drug_b": "Morfina IV contínua",
                            "formula": "dose * 5",
                            "route": "IV contínua",
                            "frequency": "contínua",
                        }
                    ],
                    "dose_limits": [],
                },
            ]
        }
        self.converter = SedationConverter(self.panel_data)

    # --- Conversões clínicas ---

    def test_midazolam_to_diazepam_10kg(self):
        result = self.converter.calculate(
            origem="Midazolam IV contínua",
            destino="Diazepam VO",
            dose=Decimal("2.5"),
            peso_kg=Decimal("10"),
        )
        self.assertEqual(Decimal(result["converted_dose"]), Decimal("15.0000"))
        self.assertEqual(result["route"], "VO")
        self.assertEqual(result["frequency"], "6/6h")

    def test_morphine_to_morphine_oral_15kg(self):
        result = self.converter.calculate(
            origem="Morfina IV contínua",
            destino="Morfina VO",
            dose=Decimal("12"),
            peso_kg=Decimal("15"),
        )
        self.assertEqual(Decimal(result["converted_dose"]), Decimal("12.9600"))

    def test_fentanyl_to_morphine_oral_10kg(self):
        result = self.converter.calculate(
            origem="Fentanil IV contínuo",
            destino="Morfina VO",
            dose=Decimal("1"),
            peso_kg=Decimal("10"),
        )
        self.assertEqual(Decimal(result["converted_dose"]), Decimal("18.0000"))

    def test_morphine_to_methadone_12kg(self):
        result = self.converter.calculate(
            origem="Morfina IV contínua",
            destino="Metadona VO",
            dose=Decimal("14"),
            peso_kg=Decimal("12"),
        )
        self.assertEqual(Decimal(result["converted_dose"]), Decimal("8.0640"))

    def test_dexmedetomidine_to_clonidine(self):
        result = self.converter.calculate(
            origem="Dexmedetomidina IV",
            destino="Clonidina VO/SL",
            dose=Decimal("0.7"),
            peso_kg=Decimal("1"),
        )
        self.assertEqual(Decimal(result["converted_dose"]), Decimal("3.5000"))

    def test_lorazepam_to_diazepam(self):
        result = self.converter.calculate(
            origem="Lorazepam IV",
            destino="Diazepam VO",
            dose=Decimal("1"),
            peso_kg=Decimal("1"),
        )
        self.assertEqual(Decimal(result["converted_dose"]), Decimal("5.0000"))

    def test_fentanyl_to_morphine_continuous(self):
        result = self.converter.calculate(
            origem="Fentanil IV contínuo",
            destino="Morfina IV contínua",
            dose=Decimal("2"),
            peso_kg=Decimal("10"),
        )
        self.assertEqual(Decimal(result["converted_dose"]), Decimal("10.0000"))

    # --- Warnings ---

    def test_absolute_max_warning(self):
        result = self.converter.calculate(
            origem="Midazolam IV contínua",
            destino="Diazepam VO",
            dose=Decimal("5"),
            peso_kg=Decimal("10"),
        )
        # 5 * 10 * 0.6 = 30 > 10 mg max
        self.assertEqual(Decimal(result["converted_dose"]), Decimal("30.0000"))
        self.assertEqual(len(result["warnings"]), 1)
        warning = result["warnings"][0]
        self.assertEqual(warning["type"], "above_max_recommended")
        self.assertEqual(warning["drug"], "Diazepam VO")
        self.assertEqual(Decimal(warning["current_dose"]), Decimal("30.0000"))
        self.assertEqual(Decimal(warning["max_allowed"]), Decimal("10"))
        self.assertEqual(warning["unit"], "mg/dose")

    def test_within_max_no_warning(self):
        result = self.converter.calculate(
            origem="Midazolam IV contínua",
            destino="Diazepam VO",
            dose=Decimal("1"),
            peso_kg=Decimal("10"),
        )
        # 1 * 10 * 0.6 = 6 <= 10 mg max
        self.assertEqual(Decimal(result["converted_dose"]), Decimal("6.0000"))
        self.assertEqual(len(result["warnings"]), 0)

    # --- Erros ---

    def test_invalid_pair_raises_validation_error(self):
        with self.assertRaises(ValueError):
            self.converter.calculate(
                origem="Midazolam IV contínua",
                destino="Metadona VO",
                dose=Decimal("1"),
                peso_kg=Decimal("10"),
            )

    def test_formula_with_peso_kg_variable(self):
        result = self.converter.calculate(
            origem="Midazolam IV contínua",
            destino="Diazepam VO",
            dose=Decimal("1.5"),
            peso_kg=Decimal("8"),
        )
        # 1.5 * 8 * 0.6 = 7.2000
        self.assertEqual(Decimal(result["converted_dose"]), Decimal("7.2000"))
        self.assertIn("dose * peso_kg * 0.6", result["formula_applied"])

    def test_formula_without_peso_kg(self):
        """Fórmula sem peso_kg deve funcionar."""
        converter = SedationConverter(
            {
                "sections": [
                    {
                        "id": "test",
                        "title": "Test",
                        "type": "test",
                        "rows": [
                            {
                                "drug_a": "A",
                                "drug_b": "B",
                                "formula": "dose * 5",
                            }
                        ],
                        "dose_limits": [],
                    }
                ]
            }
        )
        result = converter.calculate(
            origem="A",
            destino="B",
            dose=Decimal("2"),
            peso_kg=Decimal("1"),
        )
        self.assertEqual(Decimal(result["converted_dose"]), Decimal("10.0000"))

    def test_per_kg_dose_limit_warning(self):
        panel_data = {
            "sections": [
                {
                    "id": "test_per_kg",
                    "title": "Test per kg",
                    "type": "equivalence_table",
                    "rows": [
                        {
                            "drug_a": "TestDrugA",
                            "drug_b": "TestDrugB",
                            "formula": "dose * peso_kg * 2",
                            "route": "IV",
                            "frequency": "6/6h",
                        }
                    ],
                    "dose_limits": [
                        {
                            "drug": "TestDrugB",
                            "type": "per_kg",
                            "max_dose": "1 mg/kg",
                            "unit": "mg/kg",
                        }
                    ],
                }
            ]
        }
        converter = SedationConverter(panel_data)
        result = converter.calculate(
            "TestDrugA", "TestDrugB", Decimal("1"), Decimal("10")
        )
        # 1 * 10 * 2 = 20 > 1 * 10 = 10 max
        self.assertEqual(len(result["warnings"]), 1)
        self.assertEqual(result["warnings"][0]["type"], "above_max_recommended")
        self.assertEqual(Decimal(result["warnings"][0]["max_allowed"]), Decimal("10"))

    def test_negative_formula_result_raises_error(self):
        panel_data = {
            "sections": [
                {
                    "id": "test_neg",
                    "title": "Test negative",
                    "type": "equivalence_table",
                    "rows": [
                        {
                            "drug_a": "DrugA",
                            "drug_b": "DrugB",
                            "formula": "dose - 100",
                        }
                    ],
                    "dose_limits": [],
                }
            ]
        }
        converter = SedationConverter(panel_data)
        with self.assertRaises(ValueError):
            converter.calculate("DrugA", "DrugB", Decimal("1"), Decimal("10"))

    def test_division_by_zero_raises_error(self):
        panel_data = {
            "sections": [
                {
                    "id": "test_div0",
                    "title": "Test div0",
                    "type": "equivalence_table",
                    "rows": [
                        {
                            "drug_a": "DrugA",
                            "drug_b": "DrugB",
                            "formula": "dose / 0",
                        }
                    ],
                    "dose_limits": [],
                }
            ]
        }
        converter = SedationConverter(panel_data)
        with self.assertRaises(ValueError):
            converter.calculate("DrugA", "DrugB", Decimal("10"), Decimal("1"))


class PanelAPITests(TestCase):
    """Testes da API de painel de sedação."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="medico_test",
            email="medico@test.com",
            password="testpass123",
            profile="medico",
        )
        self.protocol = Protocol.objects.create(
            title="Painel de Sedação"
        )
        # Delete auto-created version (version_number=1) and create panel version
        self.protocol.versions.all().delete()
        self.panel_data = {
            "sections": [
                {
                    "id": "equiv_midaz_diaz",
                    "title": "Midazolam → Diazepam",
                    "type": "equivalence_table",
                    "rows": [
                        {
                            "drug_a": "Midazolam IV contínua",
                            "drug_b": "Diazepam VO",
                            "formula": "dose * peso_kg * 0.6",
                            "route": "VO",
                            "frequency": "6/6h",
                        }
                    ],
                    "dose_limits": [
                        {
                            "drug": "Diazepam",
                            "type": "absolute",
                            "max_dose": "10 mg/dose",
                            "unit": "mg/dose",
                        }
                    ],
                }
            ]
        }
        self.version = ProtocolVersion.objects.create(
            protocol=self.protocol,
            version_number=1,
            protocol_type="painel",
            panel_data=self.panel_data,
            is_current=True,
        )
        self.url = f"/api/v1/panels/{self.version.pk}/calculate/"

    def test_api_calculate_success(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.url,
            {
                "origem": "Midazolam IV contínua",
                "destino": "Diazepam VO",
                "dose": "2.5",
                "peso_kg": "10",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            Decimal(response.data["converted_dose"]), Decimal("15.0000")
        )
        self.assertEqual(response.data["route"], "VO")
        self.assertEqual(response.data["frequency"], "6/6h")
        self.assertEqual(response.data["formula_applied"], "dose * peso_kg * 0.6")

    def test_api_panel_not_found(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/panels/99999/calculate/",
            {
                "origem": "Midazolam IV contínua",
                "destino": "Diazepam VO",
                "dose": "1",
                "peso_kg": "10",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_api_wrong_protocol_type(self):
        """Protocolo guiado não deve ser acessível como painel."""
        guided_protocol = Protocol.objects.create(title="Protocolo Guiado")
        # Delete auto-created version and create guided version
        guided_protocol.versions.all().delete()
        guided_version = ProtocolVersion.objects.create(
            protocol=guided_protocol,
            version_number=1,
            protocol_type="guiado",
            steps_data={"steps": []},
            is_current=True,
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"/api/v1/panels/{guided_version.pk}/calculate/",
            {
                "origem": "Midazolam IV contínua",
                "destino": "Diazepam VO",
                "dose": "1",
                "peso_kg": "10",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_api_invalid_input_negative_dose(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.url,
            {
                "origem": "Midazolam IV contínua",
                "destino": "Diazepam VO",
                "dose": "-1",
                "peso_kg": "10",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_api_invalid_input_same_drug(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.url,
            {
                "origem": "Midazolam IV contínua",
                "destino": "Midazolam IV contínua",
                "dose": "1",
                "peso_kg": "10",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_api_requires_authentication(self):
        response = self.client.post(
            self.url,
            {
                "origem": "Midazolam IV contínua",
                "destino": "Diazepam VO",
                "dose": "1",
                "peso_kg": "10",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_api_invalid_drug_pair(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.url,
            {
                "origem": "Midazolam IV contínua",
                "destino": "Metadona VO",
                "dose": "1",
                "peso_kg": "10",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
