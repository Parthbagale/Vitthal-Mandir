from django.urls import path
from .views import CrowdPredictionView, EkadashiDatesView

urlpatterns = [
    path('crowd-prediction/', CrowdPredictionView.as_view(), name='crowd-prediction'),
    path('crowd-prediction/dates/', EkadashiDatesView.as_view(), name='ekadashi-dates'),
]
