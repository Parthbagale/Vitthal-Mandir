from django.urls import path
from . import views

urlpatterns = [
    path('send-otp/', views.send_otp, name='send-otp'),
    path('verify-otp/', views.verify_otp_endpoint, name='verify-otp'),
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('google-login/', views.google_login, name='google-login'),
    path('google-code/', views.google_code_login, name='google-code-login'),
    path('admin-login/', views.admin_login, name='admin-login'),
    path('admin-verify/', views.admin_verify, name='admin-verify'),
    path('logout/', views.logout, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('profile/<int:user_id>/', views.profile_by_id, name='profile-by-id'),
]
