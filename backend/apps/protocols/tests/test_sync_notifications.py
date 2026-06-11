from uuid import uuid4

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.notifications.models import Notification

from ..models import Protocol, ProtocolExecution, ProtocolVersion

User = get_user_model()

TITLE = "Reavaliação necessária"


class SyncReavaliacaoNotificationTest(TestCase):
    """Sync-time creation of durable reevaluation notifications (bell)."""

    def setUp(self):
        self.client = APIClient()
        self.doctor = User.objects.create_user(
            email="sync_notif_doc@test.com",
            password="testpass123",
            profile="medico",
        )
        self.client.force_authenticate(user=self.doctor)

        self.protocol = Protocol.objects.create(title="Notif Protocol")
        self.version = self.protocol.versions.first()
        ProtocolVersion.objects.filter(pk=self.version.pk).update(
            steps_data={
                "steps": [
                    {
                        "id": "intro",
                        "type": "info",
                        "title": "Intro",
                        "next_step": "wait",
                    },
                    {
                        "id": "wait",
                        "type": "wait_reassess",
                        "title": "Espera",
                        "duration_minutes": 20,
                        "reassess_fields": ["hematocrito"],
                    },
                ]
            }
        )
        self.version.refresh_from_db()
        self.client_uuid = str(uuid4())

    def _payload(self, answered_at, **overrides):
        base = {
            "client_uuid": self.client_uuid,
            "protocol_version_id": self.version.pk,
            "patient_name": "Paciente Notif",
            "status": "em_andamento",
            "current_step_key": "wait",
            "states": [
                {
                    "step_key": "wait",
                    "values": {},
                    "answered_at": answered_at.isoformat(),
                },
            ],
        }
        base.update(overrides)
        return base

    def _sync(self, payload):
        return self.client.post(
            "/api/v1/protocol-executions/sync/", payload, format="json"
        )

    def _execution_notifications(self):
        execution = ProtocolExecution.objects.get(client_uuid=self.client_uuid)
        ct = ContentType.objects.get_for_model(execution)
        return Notification.objects.filter(
            recipient=self.doctor,
            target_content_type=ct,
            target_object_id=str(execution.pk),
            title=TITLE,
        )

    def test_sync_pending_creates_scheduled_notification(self):
        answered_at = timezone.now()
        response = self._sync(self._payload(answered_at))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        notifs = self._execution_notifications()
        self.assertEqual(notifs.count(), 1)
        notif = notifs.first()
        self.assertEqual(notif.level, "warning")
        self.assertFalse(notif.is_read)
        # scheduled_for = answered_at + 20min → still in the future.
        self.assertGreater(notif.scheduled_for, timezone.now())

    def test_resync_updates_scheduled_for_without_duplicating(self):
        first = timezone.now() - timezone.timedelta(minutes=5)
        self._sync(self._payload(first))
        original = self._execution_notifications().get()

        # Re-arm: the timer step is answered again, later.
        second = timezone.now()
        self._sync(self._payload(second))

        notifs = self._execution_notifications()
        self.assertEqual(notifs.count(), 1)
        updated = notifs.get()
        self.assertEqual(updated.pk, original.pk)
        self.assertGreater(updated.scheduled_for, original.scheduled_for)

    def test_overdue_reminder_surfaces_in_bell_immediately(self):
        # Timer (20min) elapsed while offline → due_at in the past.
        answered_at = timezone.now() - timezone.timedelta(minutes=30)
        self._sync(self._payload(answered_at))

        notif = self._execution_notifications().get()
        self.assertLessEqual(notif.scheduled_for, timezone.now())

        # The bell's scheduled_for <= now filter surfaces it right away.
        response = self.client.get(
            "/api/v1/notifications/", {"is_read": "false"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], TITLE)

    def test_concluding_execution_deletes_pending_notification(self):
        self._sync(self._payload(timezone.now()))
        self.assertEqual(self._execution_notifications().count(), 1)

        self._sync(self._payload(timezone.now(), status="concluido"))
        self.assertEqual(self._execution_notifications().count(), 0)
