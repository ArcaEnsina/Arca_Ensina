from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ConsultaViewSet, PacienteViewSet

router = DefaultRouter()
router.register(r'pacientes', PacienteViewSet)
router.register(r'consultas', ConsultaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]