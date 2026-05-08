from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PacienteViewSet, VisitaViewSet

router = DefaultRouter()
router.register(r'pacientes', PacienteViewSet)
router.register(r'visitas', VisitaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]