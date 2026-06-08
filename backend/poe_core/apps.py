from django.apps import AppConfig


class PoeCoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'poe_core'

    def ready(self):
        import poe_core.signals
