import logging
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.pacientes.models import Paciente

from ..models import (
    Protocol,
    ProtocolExecution,
    ProtocolExecutionState,
    ProtocolVersion,
)

User = get_user_model()


class SyncEndpointTest(TestCase):
    """Tests for POST /api/v1/protocol-executions/sync/."""

    def setUp(self):
        self.client = APIClient()
        self.doctor = User.objects.create_user(
            email="sync_doctor@test.com",
            password="testpass123",
            profile="medico",
        )
        self.other_doctor = User.objects.create_user(
            email="sync_other@test.com",
            password="testpass123",
            profile="medico",
        )
        self.client.force_authenticate(user=self.doctor)

        self.protocol = Protocol.objects.create(title="Sync Test Protocol")
        self.version = self.protocol.versions.first()
        self.steps_data = {
            "steps": [
                {"id": "s1", "type": "info", "title": "Intro", "next_step": "s2"},
                {
                    "id": "s2",
                    "type": "yes_no",
                    "title": "Pergunta",
                    "true_next": "s3",
                    "false_next": "s4",
                },
                {"id": "s3", "type": "info", "title": "Sim", "next_step": None},
                {"id": "s4", "type": "info", "title": "Nao", "next_step": None},
            ]
        }
        ProtocolVersion.objects.filter(pk=self.version.pk).update(
            steps_data=self.steps_data
        )
        self.version.refresh_from_db()

        self.client_uuid = str(uuid4())

    def _payload(self, **overrides):
        base = {
            "client_uuid": self.client_uuid,
            "protocol_version_id": self.version.pk,
            "patient_name": "Paciente Sync",
            "status": "em_andamento",
            "current_step_key": "s2",
            "states": [
                {
                    "step_key": "s1",
                    "values": {"ack": True},
                },
            ],
        }
        base.update(overrides)
        return base

    def test_sync_creates_new_execution(self):
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["client_uuid"], self.client_uuid)
        self.assertEqual(response.data["current_step_key"], "s2")
        self.assertEqual(ProtocolExecution.objects.count(), 1)

    def test_sync_updates_existing_execution(self):
        # First sync → create
        self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(),
            format="json",
        )
        # Second sync → update (advance to s3)
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(
                current_step_key="s3",
                states=[
                    {"step_key": "s1", "values": {"ack": True}},
                    {"step_key": "s2", "values": {"answer": True}},
                ],
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["current_step_key"], "s3")
        self.assertEqual(ProtocolExecution.objects.count(), 1)
        self.assertEqual(
            ProtocolExecutionState.objects.filter(
                execution__client_uuid=self.client_uuid
            ).count(),
            2,
        )

    def test_sync_upserts_states_on_update(self):
        # First sync with 1 state
        self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(),
            format="json",
        )
        # Second sync with 2 states — old state replaced
        self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(
                current_step_key="s3",
                states=[
                    {"step_key": "s1", "values": {"ack": True}},
                    {"step_key": "s2", "values": {"answer": True}},
                ],
            ),
            format="json",
        )
        states = ProtocolExecutionState.objects.filter(
            execution__client_uuid=self.client_uuid
        )
        self.assertEqual(states.count(), 2)
        step_keys = set(states.values_list("step_key", flat=True))
        self.assertEqual(step_keys, {"s1", "s2"})

    def test_sync_rbac_physician_scoped(self):
        """Other physician cannot see or collide with this execution."""
        self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(),
            format="json",
        )

        # Other doctor syncs with same client_uuid — creates new execution
        self.client.force_authenticate(user=self.other_doctor)
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ProtocolExecution.objects.count(), 2)

    def test_sync_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_sync_validates_missing_fields(self):
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_sync_validates_invalid_status(self):
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(status="invalid_status"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_sync_version_not_found(self):
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(protocol_version_id=9999),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_sync_concluded_sets_finished_at(self):
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(
                status="concluido",
                current_step_key=None,
                states=[
                    {"step_key": "s1", "values": {"ack": True}},
                    {"step_key": "s2", "values": {"answer": True}},
                    {"step_key": "s3", "values": {"ack": True}},
                ],
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "concluido")
        self.assertIsNotNone(response.data["finished_at"])

    def test_sync_with_patient_link(self):
        patient = Paciente.objects.create(
            nome="Paciente Vinculado",
            created_by=self.doctor,
        )
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(patient_id=patient.pk),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        execution = ProtocolExecution.objects.get(client_uuid=self.client_uuid)
        self.assertEqual(execution.patient.pk, patient.pk)

    def test_sync_patient_not_found(self):
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(patient_id=9999),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_sync_patient_of_other_doctor_not_found(self):
        """Patient belongs to other_doctor; doctor cannot link it."""
        patient = Paciente.objects.create(
            nome="Paciente Outro",
            created_by=self.other_doctor,
        )
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(patient_id=patient.pk),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_sync_state_with_loop_count(self):
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(
                states=[
                    {
                        "step_key": "s1",
                        "values": {"ack": True},
                        "loop_count": 3,
                    },
                ],
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        state = ProtocolExecutionState.objects.get(
            execution__client_uuid=self.client_uuid, step_key="s1"
        )
        self.assertEqual(state.loop_count, 3)

    def test_sync_state_with_gate_warnings(self):
        warnings = [{"passed": False, "level": "warning", "message": "Peso baixo"}]
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(
                states=[
                    {
                        "step_key": "s1",
                        "values": {},
                        "gate_warnings": warnings,
                    },
                ],
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        state = ProtocolExecutionState.objects.get(
            execution__client_uuid=self.client_uuid, step_key="s1"
        )
        self.assertEqual(len(state.gate_warnings), 1)
        self.assertEqual(state.gate_warnings[0]["level"], "warning")

    def test_sync_audit_logging(self):
        """Verify that sync action writes audit log entries."""
        from apps.audit.models import AuditLog

        self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(),
            format="json",
        )
        self.assertTrue(
            AuditLog.objects.filter(
                user=self.doctor, action="sync.created"
            ).exists()
        )

        # Update
        self.client.post(
            "/api/v1/protocol-executions/sync/",
            self._payload(current_step_key="s3"),
            format="json",
        )
        self.assertTrue(
            AuditLog.objects.filter(
                user=self.doctor, action="sync.updated"
            ).exists()
        )


class SyncEndpointParityDivergenceTest(TestCase):
    """Tests that divergence is detected and logged at CRITICAL level."""

    def setUp(self):
        self.client = APIClient()
        self.doctor = User.objects.create_user(
            email="divergence@test.com",
            password="testpass123",
            profile="medico",
        )
        self.client.force_authenticate(user=self.doctor)

        self.protocol = Protocol.objects.create(title="Divergence Protocol")
        self.version = self.protocol.versions.first()
        self.steps_data = {
            "steps": [
                {"id": "s1", "type": "info", "title": "Intro", "next_step": "s2"},
                {
                    "id": "s2",
                    "type": "yes_no",
                    "title": "Pergunta",
                    "true_next": "s3",
                    "false_next": "s4",
                },
                {"id": "s3", "type": "info", "title": "Sim", "next_step": None},
                {"id": "s4", "type": "info", "title": "Nao", "next_step": None},
            ]
        }
        ProtocolVersion.objects.filter(pk=self.version.pk).update(
            steps_data=self.steps_data
        )
        self.version.refresh_from_db()
        self.client_uuid = str(uuid4())

    def test_divergence_logged_at_critical(self):
        """Client says s3 but engine resolves s4 — divergence logged."""
        with self.assertLogs("apps.protocols.views", level="CRITICAL") as cm:
            response = self.client.post(
                "/api/v1/protocol-executions/sync/",
                {
                    "client_uuid": self.client_uuid,
                    "protocol_version_id": self.version.pk,
                    "patient_name": "Divergence Patient",
                    "status": "em_andamento",
                    # Client claims s3 (true path) but submitted answer=False → s4
                    "current_step_key": "s3",
                    "states": [
                        {"step_key": "s1", "values": {"ack": True}},
                        {"step_key": "s2", "values": {"answer": False}},
                    ],
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Client step is persisted (client is source of truth)
        self.assertEqual(response.data["current_step_key"], "s3")
        # Divergence was logged
        self.assertTrue(
            any("divergência detectada" in msg for msg in cm.output)
        )

    def test_no_divergence_when_consistent(self):
        """Client says s3 and answer=True → engine resolves s3 → no divergence."""
        with self.assertLogs("apps.protocols.views", level="CRITICAL") as cm:
            response = self.client.post(
                "/api/v1/protocol-executions/sync/",
                {
                    "client_uuid": self.client_uuid,
                    "protocol_version_id": self.version.pk,
                    "patient_name": "Consistent Patient",
                    "status": "em_andamento",
                    "current_step_key": "s3",
                    "states": [
                        {"step_key": "s1", "values": {"ack": True}},
                        {"step_key": "s2", "values": {"answer": True}},
                    ],
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # No CRITICAL log about divergence
        divergence_logs = [
            msg for msg in cm.output if "divergência detectada" in msg
        ]
        self.assertEqual(len(divergence_logs), 0)


class SyncEndpointEmptyStatesTest(TestCase):
    """Sync with empty states list."""

    def setUp(self):
        self.client = APIClient()
        self.doctor = User.objects.create_user(
            email="empty@test.com",
            password="testpass123",
            profile="medico",
        )
        self.client.force_authenticate(user=self.doctor)
        self.protocol = Protocol.objects.create(title="Empty States Protocol")
        self.version = self.protocol.versions.first()
        ProtocolVersion.objects.filter(pk=self.version.pk).update(
            steps_data={
                "steps": [
                    {"id": "s1", "type": "info", "title": "Start", "next_step": None},
                ]
            }
        )
        self.version.refresh_from_db()

    def test_sync_with_empty_states(self):
        response = self.client.post(
            "/api/v1/protocol-executions/sync/",
            {
                "client_uuid": str(uuid4()),
                "protocol_version_id": self.version.pk,
                "patient_name": "No States",
                "status": "em_andamento",
                "current_step_key": "s1",
                "states": [],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            ProtocolExecutionState.objects.filter(
                execution__patient_name="No States"
            ).count(),
            0,
        )
