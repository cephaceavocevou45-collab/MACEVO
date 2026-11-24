from django.apps import AppConfig


class AssistantConfig(AppConfig):
    """
    Configuration de l'application principale MACEVO IA.
    """

    default_auto_field = "django.db.models.BigAutoField"

    name = "apps.assistant"

    label = "assistant"

    verbose_name = "MACEVO Assistant"

    def ready(self):
        """
        Initialise les composants IA lorsque Django a terminé
        de charger les applications.
        """

        from core.ai.models.defaults import register_default_models

        register_default_models()