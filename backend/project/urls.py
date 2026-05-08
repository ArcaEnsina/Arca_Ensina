from django.contrib import admin
from django.urls import path, include
from django.conf import settings

V = 'api/v1'

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth e Contas
    #path(f'{V}/auth/', include('apps.accounts.urls')),
    
    # Auditoria
    #path(f'{V}/audit/', include('apps.audit.urls')),
    
    path(f'{V}/', include('apps.pacientes.urls')), 
]

if settings.DEBUG:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
    urlpatterns += [
        path(f'{V}/schema/', SpectacularAPIView.as_view(), name='schema'),
        path(f'{V}/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    ]