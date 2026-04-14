from django.urls import path
from django.shortcuts import redirect

from . import views


urlpatterns = [
    path('Admin', lambda request: redirect('/Admin_login.html')),
    path('Admin/', lambda request: redirect('/Admin_login.html')),
    path('', lambda request: views.page(request, 'index.html'), name='home'),
    path('index.html', lambda request: views.page(request, 'index.html'), name='index'),
    path('login.html', lambda request: views.page(request, 'login.html'), name='login_page'),
    path('Events.html', lambda request: views.page(request, 'Events.html'), name='events'),
    path('About_temple.html', lambda request: views.page(request, 'About_temple.html'), name='about_temple'),
    path('E_library.html', lambda request: views.page(request, 'E_library.html'), name='e_library'),
    path('Gallery.html', lambda request: views.page(request, 'Gallery.html'), name='gallery'),
    path('Donations.html', lambda request: views.page(request, 'Donations.html'), name='donations'),
    path('Live_darshan.html', lambda request: views.page(request, 'Live_darshan.html'), name='live_darshan'),
    path('Pooja_services.html', lambda request: views.page(request, 'Pooja_services.html'), name='pooja_services'),
    path('Pass_booking.html', lambda request: views.page(request, 'Pass_booking.html'), name='pass_booking'),
    path('Bhakta_nivas.html', lambda request: views.page(request, 'Bhakta_nivas.html'), name='bhakta_nivas'),
    path('Bhakt_Nivas_Images.html', lambda request: views.page(request, 'Bhakt_Nivas_Images.html'), name='bhakt_nivas_images'),
    path('Contact.html', lambda request: views.page(request, 'Contact.html'), name='contact'),
    path('profile.html', lambda request: views.page(request, 'profile.html'), name='profile'),
    path('Admin_login.html', lambda request: views.page(request, 'Admin_login.html'), name='admin_login'),
    path('Admin_home.html', lambda request: views.page(request, 'Admin_home.html'), name='admin_home'),
    path('admin-navbar.html', lambda request: views.page(request, 'admin-navbar.html'), name='admin_navbar'),
    path('Verify_entry.html', lambda request: views.page(request, 'Verify_entry.html'), name='verify_entry'),
    path('Verify_pooja.html', lambda request: views.page(request, 'Verify_pooja.html'), name='verify_pooja'),
    path('Verify_bhaktnivas.html', lambda request: views.page(request, 'Verify_bhaktnivas.html'), name='verify_bhaktnivas'),
    path('test_register.html', lambda request: views.page(request, 'test_register.html'), name='test_register'),
    path('register.html', lambda request: views.page(request, 'register.html'), name='register'),
]
