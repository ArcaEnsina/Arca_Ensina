from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from ..engine.interpreter import GuidedProtocolInterpreter
from ..models import (
    Protocol,
    ProtocolExecution,
    ProtocolExecutionState,
    ProtocolVersion,
)
from ..services import ProtocolExecutionEngine

User = get_user_model()


class TitrationLoopResolutionTest(TestCase):
    """Extended titration_loop: congestion gate + iniciar_outro/esperar_hct choice."""

    def setUp(self):
        self.step = {
            "id": "loop",
            "type": "titration_loop",
            "title": "Loop",
            "max_iterations": 3,
            "congestion_check": {"true_next": "stop_congest", "false_next": "fallback"},
            "loop_next": "timer",
            "stop_next": "hct",
            "max_reached_next": "maxed",
        }
        self.interp = GuidedProtocolInterpreter({"steps": [self.step]})

    def _resolve(self, values, loop_count=0):
        return self.interp.resolve_next_step_id("loop", values, {"loop_count": loop_count})

    def test_congestion_stops_loop(self):
        self.assertEqual(self._resolve({"congestion": True}), "stop_congest")

    def test_max_iterations_forces_exit(self):
        # loop_count 2 + 1 = 3 >= max_iterations
        self.assertEqual(
            self._resolve({"decision": "iniciar_outro"}, loop_count=2), "maxed"
        )

    def test_iniciar_outro_loops_back(self):
        self.assertEqual(self._resolve({"decision": "iniciar_outro"}), "timer")

    def test_esperar_hct_stops(self):
        self.assertEqual(self._resolve({"decision": "esperar_hct"}), "hct")

    def test_default_without_decision_stops(self):
        self.assertEqual(self._resolve({}), "hct")


class GetRemindersTimerTest(TestCase):
    """get_reminders covers wait_reassess and titration_loop in minutes."""

    def setUp(self):
        self.doctor = User.objects.create_user(
            email="timer_doc@test.com", password="x", profile="medico"
        )
        self.protocol = Protocol.objects.create(title="Timer Test")
        self.version = self.protocol.versions.first()
        ProtocolVersion.objects.filter(pk=self.version.pk).update(
            steps_data={
                "steps": [
                    {
                        "id": "wait",
                        "type": "wait_reassess",
                        "title": "Espera",
                        "duration_minutes": 20,
                        "reassess_fields": ["hematocrito"],
                    },
                    {
                        "id": "loop",
                        "type": "titration_loop",
                        "title": "Bolus",
                        "duration_minutes": 60,
                    },
                    {"id": "info", "type": "info", "title": "Sem timer"},
                ]
            }
        )
        self.version.refresh_from_db()
        self.execution = ProtocolExecution.objects.create(
            version=self.version,
            physician=self.doctor,
            patient_name="P",
            status=ProtocolExecution.Status.EM_ANDAMENTO,
        )
        self.engine = ProtocolExecutionEngine()

    def _state(self, step_key, minutes_ago):
        state = ProtocolExecutionState.objects.create(
            execution=self.execution, step_key=step_key, values={}
        )
        ProtocolExecutionState.objects.filter(pk=state.pk).update(
            answered_at=timezone.now() - timedelta(minutes=minutes_ago)
        )
        return state

    def test_reminders_for_wait_and_titration_in_minutes(self):
        self._state("wait", minutes_ago=5)  # 20min timer, still pending
        self._state("loop", minutes_ago=90)  # 60min timer, overdue
        self._state("info", minutes_ago=1)  # no timer → excluded

        reminders = self.engine.get_reminders(self.execution)
        by_id = {r["step_id"]: r for r in reminders}

        self.assertEqual(set(by_id), {"wait", "loop"})
        self.assertEqual(by_id["wait"]["duration_minutes"], 20)
        self.assertEqual(by_id["wait"]["status"], "pending")
        self.assertEqual(by_id["loop"]["duration_minutes"], 60)
        self.assertEqual(by_id["loop"]["status"], "overdue")
        self.assertIn("due_at", by_id["wait"])

    def test_single_reminder_per_step_key(self):
        # The loop step is upserted by (execution, step_key): one row, latest answered_at.
        self._state("loop", minutes_ago=90)
        reminders = self.engine.get_reminders(self.execution)
        loop_reminders = [r for r in reminders if r["step_id"] == "loop"]
        self.assertEqual(len(loop_reminders), 1)
