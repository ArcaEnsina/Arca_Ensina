from django.urls import path

from .views import EmergencyView

urlpatterns = [
    path("emergency/", EmergencyView.as_view(), name="emergency"),
]
