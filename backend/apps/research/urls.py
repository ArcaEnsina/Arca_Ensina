from rest_framework.routers import DefaultRouter

from .views import ResearchResponseViewSet

router = DefaultRouter()
router.register(
    r"research/responses", ResearchResponseViewSet, basename="research-response"
)

urlpatterns = router.urls
