"""
==========================================================
MACEVO IA
Managers
==========================================================
"""

from django.db import models


class ActiveManager(models.Manager):
    """
    Manager de base.

    Il sera enrichi progressivement pour tous les modèles.
    """

    def active(self):
        return self.get_queryset()