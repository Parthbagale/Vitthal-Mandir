"""
URL configuration for temple_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from .contact_views import contact_submit
from django.conf import settings
from django.conf.urls.static import static
from django.urls import re_path
from django.views.static import serve
from django.shortcuts import redirect

urlpatterns = [
    # Custom admin entry (UI)
    path('admin/', lambda request: redirect('/Admin_login.html')),

    # Keep Django admin accessible at a different URL
    path('dj-admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/booking/', include('booking.urls')),
    path('api/contact/', contact_submit),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/', include('crowd_prediction.urls')),
    path('', include('management.urls')),
    path('', include('web.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += [
        re_path(
            r'^(?P<path>(images/.*))$',
            serve,
            {'document_root': settings.BASE_DIR / 'Frontend' / 'static'},
        ),
        re_path(
            r'^(?P<path>(js/.*|data/.*|book/.*))$',
            serve,
            {'document_root': settings.BASE_DIR / 'Frontend' / 'static'},
        ),
        re_path(
            r'^(?P<path>(partials/.*))$',
            serve,
            {'document_root': settings.BASE_DIR / 'Frontend' / 'templates'},
        ),
        re_path(
            r'^styles\.css$',
            serve,
            {
                'document_root': settings.BASE_DIR / 'Frontend' / 'static' / 'css',
                'path': 'styles.css',
            },
        ),
        re_path(
            r'^(?P<path>(script_fixed\.js|script\.js|tailwind\.config\.js))$',
            serve,
            {'document_root': settings.BASE_DIR / 'Frontend' / 'static' / 'js'},
        )
    ]
