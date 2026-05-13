from django.urls import path

from .views import CalculatorView

urlpatterns = [
    path("calculate/", CalculatorView.as_view(), name="calculator"),
]
