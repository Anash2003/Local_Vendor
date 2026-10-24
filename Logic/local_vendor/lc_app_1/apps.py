from django.apps import AppConfig


class LcApp1Config(AppConfig):
    name = 'lc_app_1'
    
    def ready(self):
        from . import signals

