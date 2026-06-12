"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
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
from django.conf import settings
from django.conf.urls.static import static

import os
from django.http import JsonResponse

def check_media_log(request):
    log_path = '/home1/headwayc/poe_backend/media_status.txt'
    if os.path.exists(log_path):
        with open(log_path, 'r') as f:
            return JsonResponse({"status": "exists", "log": f.read()})
    
    alt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'media_status.txt')
    if os.path.exists(alt_path):
        with open(alt_path, 'r') as f:
            return JsonResponse({"status": "exists_alt", "log": f.read()})
            
    return JsonResponse({
        "status": "not_found", 
        "cwd": os.getcwd(), 
        "files_in_cwd": os.listdir('.'),
        "parent_files": os.listdir('..') if os.path.exists('..') else []
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/poe/', include('poe_core.urls')),
    path('api/academic/', include('academic.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/check-media-log/', check_media_log),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
