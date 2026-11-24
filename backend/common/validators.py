"""
==========================================================
MACEVO IA
Validators
==========================================================
"""

from django.core.exceptions import ValidationError


def validate_not_empty(value):
    """
    Vérifie qu'une chaîne n'est pas vide.
    """

    if not value:
        raise ValidationError(
            "Cette valeur est obligatoire."
        )

    if not value.strip():
        raise ValidationError(
            "Cette valeur est vide."
        )