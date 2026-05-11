from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("", em_breve),
    path("admin/", admin.site.urls),
    path('api/v1/', include('apps.pacientes.urls')),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(f"{V}/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path(f"{V}/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path(f"{V}/auth/register/", RegisterView.as_view(), name="register"),
    path(f"{V}/auth/user/", UserMeView.as_view(), name="user_me"),
    path(f"{V}/auth/logout/", LogoutView.as_view(), name="logout"),
    path(f"{V}/", include("apps.audit.urls")),
    path(f"{V}/", include("apps.protocols.urls")),
]
