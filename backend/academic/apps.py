from django.apps import AppConfig


class AcademicConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'academic'

    def ready(self):
        from django.conf import settings
        target_media = '/home1/headwayc/poe.headwaycollege.ac.ke/media'
        if os.path.exists('/home1/headwayc/poe.headwaycollege.ac.ke') and not os.path.lexists(target_media):
            try:
                os.symlink(settings.MEDIA_ROOT, target_media)
            except Exception:
                pass
