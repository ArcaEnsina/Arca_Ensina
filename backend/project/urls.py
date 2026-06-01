import os

from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.views import (
    InvitationCheckView,
    LogoutView,
    RegisterView,
    UserMeView,
)


def frontend_redirect(request):
    url = os.environ.get("FRONTEND_URL", "https://arcaapp.lat/")
    return HttpResponseRedirect(url)


V = "api/<str:version>"

urlpatterns = [
    path("", frontend_redirect),
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(f"{V}/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path(f"{V}/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path(f"{V}/auth/register/", RegisterView.as_view(), name="register"),
    path(
        f"{V}/auth/invite/<str:token>/",
        InvitationCheckView.as_view(),
        name="invite_check",
    ),
    path(f"{V}/auth/user/", UserMeView.as_view(), name="user_me"),
    path(f"{V}/auth/logout/", LogoutView.as_view(), name="logout"),
    path(f"{V}/", include("apps.audit.urls")),
    path(f"{V}/calculator/", include("apps.calculator.urls")),
    path(f"{V}/", include("apps.pacientes.urls")),
    path(f"{V}/", include("apps.protocols.urls")),
    path(f"{V}/medications/", include("apps.medications.urls")),
    path(f"{V}/", include("apps.research.urls")),
    path(f"{V}/", include("apps.sedation.urls")),
]
