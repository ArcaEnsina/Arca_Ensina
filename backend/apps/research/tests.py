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
    ProtocolExecutionState,
    ProtocolVersion,
)
from apps.research.models import ResearchDataPoint
from apps.research.services import (
    finalizar_protocolo_com_pesquisa,
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


def make_execution_state(user):
    protocol, _ = Protocol.objects.get_or_create(title="__test_protocol__")
    version = ProtocolVersion.objects.create(
        protocol=protocol,
        version_number=next(_version_seq),
        steps_data={"steps": []},
    )
    execution = ProtocolExecution.objects.create(version=version, physician=user)
    return ProtocolExecutionState.objects.create(
        execution=execution,
        step_key="passo_1",
    )


def make_audit_log(user, state):
    return AuditLog.objects.create(
        user=user,
        action="FINALIZAR_PROTOCOLO",
        resource_type="protocol_execution_state",
        resource_id=str(state.id),
        ip="127.0.0.1",
        payload={},
    )


class ResearchDataPointModelTest(TestCase):
    def setUp(self):
        self.user = make_user()
        self.state = make_execution_state(self.user)

    def test_ajuste_sem_justificativa_levanta_validation_error(self):
        log = make_audit_log(self.user, self.state)
        ponto = ResearchDataPoint(
            audit_log=log,
            execution_state=self.state,
            ajustou_dose_sugerida=True,
            motivo_ajuste="",
        )
        with self.assertRaises(ValidationError) as ctx:
            ponto.full_clean()
        self.assertIn("motivo_ajuste", ctx.exception.message_dict)

    def test_ajuste_com_justificativa_salva_sem_erro(self):
        log = make_audit_log(self.user, self.state)
        ponto = ResearchDataPoint(
            audit_log=log,
            execution_state=self.state,
            ajustou_dose_sugerida=True,
            motivo_ajuste="Paciente apresentou intolerância gástrica.",
        )
        ponto.full_clean()

    def test_sem_ajuste_nao_exige_motivo(self):
        log = make_audit_log(self.user, self.state)
        ponto = ResearchDataPoint(
            audit_log=log,
            execution_state=self.state,
            ajustou_dose_sugerida=False,
        )
        ponto.full_clean()

    def test_campos_opcionais_aceitam_null(self):
        log = make_audit_log(self.user, self.state)
        ponto = ResearchDataPoint.objects.create(
            audit_log=log,
            execution_state=self.state,
        )
        self.assertIsNone(ponto.condicao_tratada_cid)
        self.assertIsNone(ponto.seguiu_protocolo_integralmente)
        self.assertIsNone(ponto.indicacao_clinica)


class FinalizarProtocoloServiceTest(TestCase):
    def setUp(self):
        self.user = make_user()
        self.state = make_execution_state(self.user)

    def test_retorna_audit_log(self):
        log = finalizar_protocolo_com_pesquisa(
            self.user,
            self.state,
            {"condicao_tratada_cid": "J45.9", "ajustou_dose_sugerida": False},
        )
        self.assertIsInstance(log, AuditLog)

    def test_cria_research_data_point_vinculado(self):
        log = finalizar_protocolo_com_pesquisa(
            self.user,
            self.state,
            {
                "condicao_tratada_cid": "J45.9",
                "ajustou_dose_sugerida": True,
                "motivo_ajuste": "Intolerância gástrica.",
            },
        )
        self.assertTrue(ResearchDataPoint.objects.filter(audit_log=log).exists())

    def test_dados_pesquisa_persistidos_corretamente(self):
        log = finalizar_protocolo_com_pesquisa(
            self.user,
            self.state,
            {
                "condicao_tratada_cid": "J45.9",
                "seguiu_protocolo_integralmente": False,
                "ajustou_dose_sugerida": True,
                "motivo_ajuste": "Peso acima da faixa do protocolo.",
            },
        )
        ponto = ResearchDataPoint.objects.get(audit_log=log)
        self.assertEqual(ponto.condicao_tratada_cid, "J45.9")
        self.assertFalse(ponto.seguiu_protocolo_integralmente)
        self.assertEqual(ponto.motivo_ajuste, "Peso acima da faixa do protocolo.")

    def test_falha_sem_motivo_nao_persiste_nada(self):
        before_logs = AuditLog.objects.count()
        with self.assertRaises(ValidationError):
            finalizar_protocolo_com_pesquisa(
                self.user,
                self.state,
                {"ajustou_dose_sugerida": True, "motivo_ajuste": ""},
            )
        self.assertEqual(AuditLog.objects.count(), before_logs)

    def test_log_vinculado_ao_usuario_correto(self):
        log = finalizar_protocolo_com_pesquisa(
            self.user, self.state, {"ajustou_dose_sugerida": False}
        )
        self.assertEqual(log.user, self.user)


class TaxaPreenchimentoTest(TestCase):
    def setUp(self):
        self.user = make_user()

    def test_retorna_zero_sem_registros(self):
        resultado = taxa_preenchimento_pesquisa()
        self.assertEqual(resultado["total"], 0)
        self.assertEqual(resultado["campos"], {})

    def test_calcula_percentual_corretamente(self):
        for i in range(4):
            state = make_execution_state(self.user)
            cid = "J45.9" if i < 3 else None
            finalizar_protocolo_com_pesquisa(
                self.user,
                state,
                {"condicao_tratada_cid": cid, "ajustou_dose_sugerida": False},
            )
        resultado = taxa_preenchimento_pesquisa()
        self.assertEqual(resultado["total"], 4)
        self.assertEqual(resultado["campos"]["condicao_tratada_cid"], 75.0)


class ResearchDataPointAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.researcher = make_user(profile="pesquisador")
        self.doctor = make_user(profile="medico")
        self.state = make_execution_state(self.researcher)
        finalizar_protocolo_com_pesquisa(
            self.researcher,
            self.state,
            {"condicao_tratada_cid": "J45.9", "ajustou_dose_sugerida": False},
        )

    def _auth(self, user):
        resp = self.client.post(
            "/api/v1/auth/login/",
            {"email": user.email, "password": "pass1234"},
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")

    def test_sem_autenticacao_retorna_401(self):
        resp = self.client.get("/api/v1/research/data/")
        self.assertEqual(resp.status_code, 401)

    def test_medico_nao_pode_listar(self):
        self._auth(self.doctor)
        resp = self.client.get("/api/v1/research/data/")
        self.assertEqual(resp.status_code, 403)

    def test_pesquisador_pode_listar(self):
        self._auth(self.researcher)
        resp = self.client.get("/api/v1/research/data/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("results", resp.data)

    def test_endpoint_taxa_retorna_percentuais(self):
        self._auth(self.researcher)
        resp = self.client.get("/api/v1/research/data/taxa/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("total", resp.data)
        self.assertIn("campos", resp.data)

    def test_filtro_por_ajuste_de_dose(self):
        self._auth(self.researcher)
        resp = self.client.get("/api/v1/research/data/?ajustou_dose_sugerida=false")
        self.assertEqual(resp.status_code, 200)
        for item in resp.data["results"]:
            self.assertFalse(item["ajustou_dose_sugerida"])


class TaxaServicoIsoladoTest(TestCase):
    def setUp(self):
        self.user = make_user(profile="pesquisador")

    def test_taxa_sem_dados(self):
        resultado = taxa_preenchimento_pesquisa()
        self.assertEqual(resultado["total"], 0)

    def test_taxa_com_dados(self):
        state = make_execution_state(self.user)
        finalizar_protocolo_com_pesquisa(
            self.user,
            state,
            {"condicao_tratada_cid": "J45.9", "ajustou_dose_sugerida": False},
        )
        resultado = taxa_preenchimento_pesquisa()
        self.assertGreater(resultado["total"], 0)
        self.assertIn("condicao_tratada_cid", resultado["campos"])

    def test_view_taxa_invocada_diretamente(self):
        import traceback as tb

        from django.test import RequestFactory
        from rest_framework_simplejwt.tokens import AccessToken

        from apps.research.views import ResearchDataPointViewSet

        factory = RequestFactory()
        request = factory.get("/api/v1/research/data/taxa/")
        token = AccessToken.for_user(self.user)
        request.META["HTTP_AUTHORIZATION"] = f"Bearer {str(token)}"

        request.user = self.user

        view = ResearchDataPointViewSet.as_view({"get": "taxa"})
        try:
            response = view(request)
            print("\n=== VIEW STATUS:", response.status_code)
            print("=== VIEW DATA:", response.data)
        except Exception as e:
            print("\n=== EXCEPTION:", type(e).__name__, str(e))
            tb.print_exc()
            raise
