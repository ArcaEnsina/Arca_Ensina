from rest_framework.routers import DefaultRouter

from .views import ResearchDataPointViewSet

router = DefaultRouter()
router.register(r"research/data", ResearchDataPointViewSet, basename="research-data")

urlpatterns = router.urls
