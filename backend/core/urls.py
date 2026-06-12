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
    script_path = '/home1/headwayc/poe_backend/fix_htaccess.py'
    media_dir = '/home1/headwayc/poe_backend/media/evidence'
    
    script_content = "Not found"
    if os.path.exists(script_path):
        with open(script_path, 'r') as f:
            script_content = f.read()
            
    media_files = []
    if os.path.exists(media_dir):
        media_files = os.listdir(media_dir)
        
    log_content = ""
    if os.path.exists(log_path):
        with open(log_path, 'r') as f:
            log_content = f.read()
            
    return JsonResponse({
        "status": "success",
        "script_content": script_content,
        "media_dir_exists": os.path.exists(media_dir),
        "media_files": media_files,
        "log": log_content
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
