from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from .models import Notification

User = get_user_model()

class NotificationScheduleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="doctor@example.com",
            password="password123",
            profile="medico"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/notifications/"

    def test_scheduled_notifications_are_hidden_until_time(self):
        """Verifica se notificações agendadas para o futuro não aparecem na API."""
        future_time = timezone.now() + timedelta(hours=1)
        Notification.objects.create(
            recipient=self.user,
            title="Futura",
            description="Não deve aparecer agora",
            scheduled_for=future_time,
        )

        Notification.objects.create(
            recipient=self.user,
            title="Imediata",
            description="Deve aparecer agora",
        )

        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)

        data = resp.data["results"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["title"], "Imediata")

    def test_past_scheduled_notifications_are_visible(self):
        """Verifica se notificações agendadas para o passado aparecem na API."""
        past_time = timezone.now() - timedelta(minutes=5)
        Notification.objects.create(
            recipient=self.user,
            title="Atrasada",
            description="Deve aparecer porque o tempo já passou",
            scheduled_for=past_time,
        )

        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)

        data = resp.data["results"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["title"], "Atrasada")

    def test_notification_level_is_returned(self):
        """Verifica se o campo 'level' é enviado."""
        Notification.objects.create(
            recipient=self.user,
            title="Alerta",
            description="Crítico",
            level="warning",
        )

        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)

        data = resp.data["results"]
        self.assertEqual(data[0]["level"], "warning")

    def test_mark_all_read_affects_only_visible_notifications(self):
        """Verifica se o 'marcar todas como lidas' não afeta as que ainda estão escondidas."""
        future_time = timezone.now() + timedelta(hours=1)
        future_notif = Notification.objects.create(
            recipient=self.user,
            title="Escondida",
            scheduled_for=future_time
        )
        
        Notification.objects.create(recipient=self.user, title="Visível")

        # Marcar todas como lidas
        self.client.post(f"{self.url}mark_all_read/")

        # A escondida ainda deve estar como não lida no banco de dados
        future_notif.refresh_from_db()
        self.assertFalse(future_notif.is_read)
