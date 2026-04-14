from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PassBookingViewSet, EntryVerificationViewSet, PoojaBookingViewSet, BhaktaNivasViewSet, send_booking_otp, verify_booking_otp, check_pass_availability


router = DefaultRouter()
router.register(r'passes', PassBookingViewSet, basename='pass-booking')
router.register(r'verifications', EntryVerificationViewSet, basename='entry-verification')
router.register(r'poojas', PoojaBookingViewSet, basename='pooja-booking')
router.register(r'bhaktnivas', BhaktaNivasViewSet, basename='bhakta-nivas')

urlpatterns = [
    path('', include(router.urls)),
    path('send-sms-otp/', send_booking_otp, name='send-booking-otp'),
    path('verify-sms-otp/', verify_booking_otp, name='verify-booking-otp'),
    path('passes/check-availability/', check_pass_availability, name='check-pass-availability'),
]
