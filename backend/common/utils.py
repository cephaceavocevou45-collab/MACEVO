"""
==========================================================
MACEVO IA
Fonctions utilitaires
==========================================================
"""

from django.utils.text import slugify


def generate_slug(text):
    """
    Génère un slug.
    """

    return slugify(text)


def count_words(text):
    """
    Compte le nombre de mots.
    """

    if not text:
        return 0

    return len(text.split())