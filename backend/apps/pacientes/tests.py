from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Paciente

User = get_user_model()


class PacienteLogicTest(TestCase):
    def setUp(self):
        Paciente.objects.create(
            nome="Rios Teste",
            data_nascimento="2000-01-01",
            telefone="5581999999999",
            peso=80.5,
            genero="M",
            cidade="Recife",
        )

    def test_paciente_dados_corretos(self):
        p = Paciente.objects.get(nome="Rios Teste")
        self.assertEqual(float(p.weight if hasattr(p, "weight") else p.peso), 80.5)


class PacienteAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="testerios@test.com", password="password123"
        )
        self.client.force_authenticate(user=self.user)

    def test_get_pacientes_list(self):
        url = reverse("paciente-list", kwargs={"version": "v1"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_only_own_patients(self):
        outro_medico = User.objects.create_user(
            email="outro@test.com", password="password123"
        )
        Paciente.objects.create(
            nome="Paciente do Outro",
            data_nascimento="2010-01-01",
            telefone="5581988888888",
            genero="M",
            cidade="Recife",
            created_by=outro_medico,
        )
        meu_paciente = Paciente.objects.create(
            nome="Meu Paciente",
            data_nascimento="2012-01-01",
            telefone="5581977777777",
            genero="F",
            cidade="Recife",
            created_by=self.user,
        )

        url = reverse("paciente-list", kwargs={"version": "v1"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [p["id"] for p in response.data]
        self.assertEqual(ids, [meu_paciente.id])

    def test_create_sets_created_by(self):
        url = reverse("paciente-list", kwargs={"version": "v1"})
        response = self.client.post(
            url,
            {
                "nome": "Novo Paciente",
                "data_nascimento": "2015-06-01",
                "telefone": "5581966666666",
                "genero": "M",
                "cidade": "Recife",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        paciente = Paciente.objects.get(id=response.data["id"])
        self.assertEqual(paciente.created_by, self.user)
        # Paciente nasce ativo.
        self.assertEqual(paciente.status, Paciente.Status.ATIVO)


class PacienteUpdateDeleteAltaTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="medico-crud@test.com", password="password123"
        )
        self.client.force_authenticate(user=self.user)
        self.paciente = Paciente.objects.create(
            nome="Ariel",
            data_nascimento="2014-03-02",
            telefone="5581999999999",
            genero="F",
            cidade="Recife",
            peso=20,
            created_by=self.user,
        )

    def _detail_url(self):
        return reverse(
            "paciente-detail", kwargs={"version": "v1", "pk": self.paciente.pk}
        )

    def test_patch_updates_fields_and_m2m(self):
        response = self.client.patch(
            self._detail_url(),
            {"nome": "Ariel Cavalcanti", "peso": "21.50", "alergias": ["Dipirona"]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.paciente.refresh_from_db()
        self.assertEqual(self.paciente.nome, "Ariel Cavalcanti")
        self.assertEqual(str(self.paciente.peso), "21.50")
        self.assertEqual(
            list(self.paciente.alergias.values_list("descricao", flat=True)),
            ["Dipirona"],
        )

    def test_cannot_patch_other_doctors_patient(self):
        outro = User.objects.create_user(
            email="outro-crud@test.com", password="password123"
        )
        alheio = Paciente.objects.create(
            nome="Alheio",
            data_nascimento="2010-01-01",
            telefone="5581988888888",
            genero="M",
            created_by=outro,
        )
        url = reverse("paciente-detail", kwargs={"version": "v1", "pk": alheio.pk})
        response = self.client.patch(url, {"nome": "Hackeado"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_patient_without_history(self):
        response = self.client.delete(self._detail_url())
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Paciente.objects.filter(pk=self.paciente.pk).exists())

    def test_delete_patient_with_history_preserves_records(self):
        from apps.protocols.models import Protocol, ProtocolExecution

        protocol = Protocol.objects.create(title="Dengue")
        version = protocol.versions.first()
        execution = ProtocolExecution.objects.create(
            version=version,
            physician=self.user,
            patient=self.paciente,
            patient_name=self.paciente.nome,
            status=ProtocolExecution.Status.CONCLUIDO,
        )

        response = self.client.delete(self._detail_url())
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Paciente.objects.filter(pk=self.paciente.pk).exists())

        # O registro de execução sobrevive, desvinculado, com o nome preservado.
        execution.refresh_from_db()
        self.assertIsNone(execution.patient_id)
        self.assertEqual(execution.patient_name, "Ariel")

    def test_alta_archives_patient(self):
        url = reverse("paciente-alta", kwargs={"version": "v1", "pk": self.paciente.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.paciente.refresh_from_db()
        self.assertEqual(self.paciente.status, Paciente.Status.ALTA)
        self.assertIsNotNone(self.paciente.data_alta)

    def test_alta_twice_returns_400(self):
        url = reverse("paciente-alta", kwargs={"version": "v1", "pk": self.paciente.pk})
        self.client.post(url)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
