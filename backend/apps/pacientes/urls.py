from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PacienteViewSet, PatientHistoryView, SintomaViewSet

router = DefaultRouter()
router.register(r"pacientes", PacienteViewSet, basename="paciente")
router.register(r"symptoms", SintomaViewSet)

urlpatterns = [
    path(
        "pacientes/<int:patient_id>/historico/",
        PatientHistoryView.as_view(),
        name="patient-history",
    ),
    path("", include(router.urls)),
]
