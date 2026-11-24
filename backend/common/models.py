"""
==========================================================
MACEVO IA
Common Models
==========================================================

Tous les modèles du projet héritent de BaseModel.
"""

from django.db import models


class BaseModel(models.Model):
    """
    Modèle abstrait utilisé par toutes les tables.
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Créé le"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Dernière modification"
    )

    class Meta:
        abstract = True