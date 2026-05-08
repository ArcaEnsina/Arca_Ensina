from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PacienteViewSet, ConsultaViewSet

router = DefaultRouter()
router.register(r'pacientes', PacienteViewSet)
router.register(r'visitas', ConsultaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]