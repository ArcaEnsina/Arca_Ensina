from django.urls import path

from .views import (
    MedicationBulkDetailView,
    MedicationDetailView,
    MedicationListView,
)

urlpatterns = [
    path("", MedicationListView.as_view(), name="medication-list"),
    path("all/", MedicationBulkDetailView.as_view(), name="medication-bulk-detail"),
    path("<int:pk>/", MedicationDetailView.as_view(), name="medication-detail"),
]
