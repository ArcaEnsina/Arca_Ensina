from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.pacientes.views import PacienteViewSet, ConsultaViewSet 

router = DefaultRouter()
router.register(r'pacientes', PacienteViewSet)
router.register(r'consultas', ConsultaViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(router.urls)),
]