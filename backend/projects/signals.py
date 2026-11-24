
"""
==========================================================
MACEVO IA
Projects Signals
==========================================================

Signaux Django du module Projects.

Principe :
    - éviter la logique métier lourde dans les signals ;
    - éviter les sauvegardes récursives ;
    - laisser ProjectService gérer les opérations métier ;
    - conserver uniquement les signaux réellement nécessaires.
"""

from __future__ import annotations

import logging

from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils.text import slugify

from .models import ScientificProject


logger = logging.getLogger(__name__)


@receiver(pre_save, sender=ScientificProject)
def generate_project_slug(
    sender,
    instance: ScientificProject,
    **kwargs,
):
    """
    Génère automatiquement un slug lorsqu'il est absent.

    Le modèle ScientificProject possède également une protection
    au niveau de save(). Ce signal constitue donc une sécurité
    supplémentaire pour les créations/modifications effectuées
    directement via Django.
    """

    if instance.slug:
        return

    if not instance.title:
        return

    base_slug = slugify(instance.title)

    if not base_slug:
        return

    instance.slug = base_slug

    logger.debug(
        "Slug généré pour le projet %s : %s",
        instance.pk or "<nouveau>",
        instance.slug,
    )
