from django.db.models import Q
from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        now = timezone.now()
        qs = Notification.objects.filter(recipient=self.request.user).select_related(
            "protocol_version__protocol", "target_content_type"
        )
        qs = qs.filter(Q(scheduled_for__isnull=True) | Q(scheduled_for__lte=now))
        is_read = self.request.query_params.get("is_read")
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() == "true")
        return qs

    @action(detail=False, methods=["post"], url_path="mark_all_read")
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({"ok": True})
