from django.urls import path
from .views import MedicationListView, MedicationDetailView

urlpatterns = [
    path('', MedicationListView.as_view(), name='medication-list'),
    path('<int:pk>/', MedicationDetailView.as_view(), name='medication-detail'),
]