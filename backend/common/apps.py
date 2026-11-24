"""
==========================================================
MACEVO IA
Application Common
==========================================================
"""

from django.apps import AppConfig


class CommonConfig(AppConfig):
    """
    Configuration de l'application Common.
    """

    default_auto_field = "django.db.models.BigAutoField"

    name = "common"

    verbose_name = "MACEVO Common"

    def ready(self):
        pass