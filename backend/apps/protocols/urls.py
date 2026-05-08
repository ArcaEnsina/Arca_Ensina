from rest_framework.routers import DefaultRouter

from .views import ProtocolVersionViewSet, ProtocolViewSet

router = DefaultRouter()
router.register(r"protocols", ProtocolViewSet, basename="protocol")
router.register(
    r"protocol-versions", ProtocolVersionViewSet, basename="protocol-version"
)

urlpatterns = router.urls
