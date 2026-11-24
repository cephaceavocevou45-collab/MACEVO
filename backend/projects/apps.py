
"""
==========================================================
MACEVO IA
Projects App
==========================================================

Configuration de l'application Django Projects.
"""

from __future__ import annotations

from django.apps import AppConfig


class ProjectsConfig(AppConfig):
    """
    Configuration de l'application Projects.
    """

    default_auto_field = "django.db.models.BigAutoField"

    name = "projects"

    verbose_name = "MACEVO Projects"

    def ready(self):
        """
        Initialise les composants nécessitant le chargement
        de l'application Django.

        Les signaux sont importés ici afin qu'ils soient
        enregistrés lorsque Django initialise l'application.
        """

        super().ready()

        import projects.signals  # noqa: F401
