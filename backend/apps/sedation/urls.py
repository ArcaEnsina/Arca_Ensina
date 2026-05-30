from rest_framework.routers import DefaultRouter

from .views import PanelViewSet

router = DefaultRouter()
router.register(r"panels", PanelViewSet, basename="panel")

urlpatterns = router.urls
