import itertools
import uuid

from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.audit.models import AuditLog
from apps.protocols.models import (
    Protocol,
    ProtocolExecution,
    ProtocolVersion,
)
from apps.research.models import ResearchResponse
from apps.research.services import (
    coletar_pesquisa_execucao,
    pode_coletar_pesquisa,
    taxa_preenchimento_pesquisa,
)

_version_seq = itertools.count(start=1000)


def make_user(profile="medico"):
    uid = uuid.uuid4().hex[:8]
    return User.objects.create_user(
        email=f"{uid}@test.com",
        password="pass1234",
        profile=profile,
    )


def make_execution(user):
    protocol, _ = Protocol.objects.get_or_create(title="__test_protocol__")
    version = ProtocolVersion.objects.create(
        protocol=protocol,
        version_number=next(_version_seq),
        steps_data={"steps": []},
    )
    return ProtocolExecution.objects.create(
        version=version,
        physician=user,
        patient_name="Paciente Teste",
    )


class ResearchResponseModelTest(TestCase):
    def setUp(self):
        self.user = make_user()
        self.execution = make_execution(self.user)
        self.log = AuditLog.objects.create(
            user=self.user,
            action="create.research_response",
            resource_type="protocol_execution",
            resource_id=str(self.execution.id),
        )

    def test_campos_opcionais_aceitam_null(self):
        ponto = ResearchResponse.objects.create(
            audit_log=self.log,
            execution=self.execution,
        )
        self.assertIsNone(ponto.condicao_tratada_cid)
        self.assertIsNone(ponto.seguiu_protocolo_integralmente)
        self.assertIsNone(ponto.desfecho_esperado)

    def test_vinculado_a_execucao_inteira(self):
        ponto = ResearchResponse.objects.create(
            audit_log=self.log,
            execution=self.execution,
        )
        self.assertEqual(ponto.execution, self.execution)
        self.assertEqual(self.execution.research_response, ponto)

    def test_imutavel_nao_permite_update(self):
        ponto = ResearchResponse.objects.create(
            audit_log=self.log,
            execution=self.execution,
            condicao_tratada_cid="J45.9",
        )
        ponto.condicao_tratada_cid = "J20.9"
        with self.assertRaises(ValidationError):
            ponto.save()
        ponto.refresh_from_db()
        self.assertEqual(ponto.condicao_tratada_cid, "J45.9")


class ColetaServiceTest(TestCase):
    def setUp(self):
        self.user = make_user()
        self.execution = make_execution(self.user)

    def test_cria_audit_log_e_research_response(self):
        ponto = coletar_pesquisa_execucao(
            self.user,
            self.execution,
            {"condicao_tratada_cid": "J45.9", "seguiu_protocolo_integralmente": True},
        )
        self.assertIsInstance(ponto, ResearchResponse)
        self.assertIsInstance(ponto.audit_log, AuditLog)
        self.assertEqual(ponto.audit_log.user, self.user)
        self.assertEqual(ponto.execution, self.execution)

    def test_dados_persistidos_corretamente(self):
        ponto = coletar_pesquisa_execucao(
            self.user,
            self.execution,
            {
                "condicao_tratada_cid": "J45.9",
                "seguiu_protocolo_integralmente": False,
                "desfecho_esperado": "Melhora em 48h",
            },
        )
        self.assertEqual(ponto.condicao_tratada_cid, "J45.9")
        self.assertFalse(ponto.seguiu_protocolo_integralmente)
        self.assertEqual(ponto.desfecho_esperado, "Melhora em 48h")

    def test_idempotente_por_client_uuid(self):
        cu = uuid.uuid4()
        primeiro = coletar_pesquisa_execucao(
            self.user, self.execution, {"condicao_tratada_cid": "J45.9"}, client_uuid=cu
        )
        segundo = coletar_pesquisa_execucao(
            self.user, self.execution, {"condicao_tratada_cid": "J45.9"}, client_uuid=cu
        )
        self.assertEqual(primeiro.id, segundo.id)
        self.assertEqual(ResearchResponse.objects.count(), 1)

    def test_seam_de_consentimento_permite_por_padrao(self):
        self.assertTrue(pode_coletar_pesquisa(self.user))


class TaxaPreenchimentoTest(TestCase):
    def setUp(self):
        self.user = make_user()

    def test_retorna_zero_sem_registros(self):
        resultado = taxa_preenchimento_pesquisa()
        self.assertEqual(resultado["total"], 0)
        self.assertEqual(resultado["campos"], {})

    def test_calcula_percentual_corretamente(self):
        for i in range(4):
            execution = make_execution(self.user)
            cid = "J45.9" if i < 3 else None
            coletar_pesquisa_execucao(
                self.user, execution, {"condicao_tratada_cid": cid}
            )
        resultado = taxa_preenchimento_pesquisa()
        self.assertEqual(resultado["total"], 4)
        self.assertEqual(resultado["campos"]["condicao_tratada_cid"], 75.0)


class ResearchResponseAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.researcher = make_user(profile="pesquisador")
        self.doctor = make_user(profile="medico")
        self.execution = make_execution(self.doctor)
        # Um registro pré-existente para os testes de leitura.
        coletar_pesquisa_execucao(
            self.doctor,
            make_execution(self.doctor),
            {"condicao_tratada_cid": "J45.9"},
        )

    def _auth(self, user):
        resp = self.client.post(
            "/api/v1/auth/login/",
            {"email": user.email, "password": "pass1234"},
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")

    def test_sem_autenticacao_retorna_401(self):
        resp = self.client.get("/api/v1/research/responses/")
        self.assertEqual(resp.status_code, 401)

    def test_medico_nao_pode_listar(self):
        self._auth(self.doctor)
        resp = self.client.get("/api/v1/research/responses/")
        self.assertEqual(resp.status_code, 403)

    def test_pesquisador_pode_listar(self):
        self._auth(self.researcher)
        resp = self.client.get("/api/v1/research/responses/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("results", resp.data)

    def test_aggregate_retorna_percentuais(self):
        self._auth(self.researcher)
        resp = self.client.get("/api/v1/research/responses/aggregate/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("total", resp.data)
        self.assertIn("campos", resp.data)

    def test_medico_pode_coletar(self):
        self._auth(self.doctor)
        resp = self.client.post(
            "/api/v1/research/responses/",
            {
                "execution": self.execution.id,
                "condicao_tratada_cid": "J45.9",
                "seguiu_protocolo_integralmente": True,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(
            ResearchResponse.objects.filter(execution=self.execution).exists()
        )

    def test_pesquisador_nao_pode_coletar(self):
        self._auth(self.researcher)
        resp = self.client.post(
            "/api/v1/research/responses/",
            {"execution": self.execution.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_nao_pode_coletar_execucao_de_outro(self):
        outro_medico = make_user(profile="medico")
        self._auth(outro_medico)
        resp = self.client.post(
            "/api/v1/research/responses/",
            {"execution": self.execution.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_coleta_idempotente_via_client_uuid(self):
        self._auth(self.doctor)
        cu = str(uuid.uuid4())
        payload = {
            "execution": self.execution.id,
            "condicao_tratada_cid": "J45.9",
            "client_uuid": cu,
        }
        first = self.client.post("/api/v1/research/responses/", payload, format="json")
        second = self.client.post("/api/v1/research/responses/", payload, format="json")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(ResearchResponse.objects.filter(client_uuid=cu).count(), 1)
