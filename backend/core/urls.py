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
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
import os

def serve_spa(request, path=''):
    # Path on production server where index.html is located
    index_path = '/home1/headwayc/poe.headwaycollege.ac.ke/index.html'
    if not os.path.exists(index_path):
        # Fallback to local or default if path doesn't exist
        return HttpResponse("SPA index.html not found.", status=404)
        
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return HttpResponse(content, content_type='text/html')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Prefixed paths (when running at root base URI)
    path('api/users/', include('users.urls')),
    path('api/poe/', include('poe_core.urls')),
    path('api/academic/', include('academic.urls')),
    path('api/notifications/', include('notifications.urls')),
    
    # Non-prefixed paths (when running at /api base URI where prefix is stripped)
    path('users/', include('users.urls')),
    path('poe/', include('poe_core.urls')),
    path('academic/', include('academic.urls')),
    path('notifications/', include('notifications.urls')),
    
    # Catch-all patterns to serve React SPA
    path('', serve_spa),
    re_path(r'^(?P<path>.*)$', serve_spa),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
