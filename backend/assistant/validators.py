
"""
==========================================================
MACEVO IA
Assistant Validators
==========================================================

Validation centralisée des données du module Assistant.

Les validators restent indépendants des vues, serializers et
services afin de pouvoir être réutilisés dans toute l'application.
"""

from django.core.exceptions import ValidationError


# ==========================================================
# LIMITES
# ==========================================================

MAX_CONVERSATION_TITLE_LENGTH = 255
MIN_CONVERSATION_TITLE_LENGTH = 3

MAX_MESSAGE_LENGTH = 50_000

MAX_SEARCH_QUERY_LENGTH = 255


# ==========================================================
# CONVERSATION
# ==========================================================

def validate_conversation_title(title):
    """
    Vérifie et normalise le titre d'une conversation.

    Retourne le titre nettoyé si la validation réussit.
    """

    if title is None:
        raise ValidationError(
            "Le titre de la conversation est obligatoire."
        )

    if not isinstance(title, str):
        raise ValidationError(
            "Le titre de la conversation doit être une chaîne de caractères."
        )

    title = title.strip()

    if not title:
        raise ValidationError(
            "Le titre ne peut pas être vide."
        )

    if len(title) < MIN_CONVERSATION_TITLE_LENGTH:
        raise ValidationError(
            f"Le titre doit contenir au moins "
            f"{MIN_CONVERSATION_TITLE_LENGTH} caractères."
        )

    if len(title) > MAX_CONVERSATION_TITLE_LENGTH:
        raise ValidationError(
            f"Le titre ne peut pas dépasser "
            f"{MAX_CONVERSATION_TITLE_LENGTH} caractères."
        )

    return title


# ==========================================================
# MESSAGE
# ==========================================================

def validate_message_content(content):
    """
    Vérifie et normalise le contenu d'un message.

    Retourne le contenu nettoyé si la validation réussit.
    """

    if content is None:
        raise ValidationError(
            "Le message est obligatoire."
        )

    if not isinstance(content, str):
        raise ValidationError(
            "Le message doit être une chaîne de caractères."
        )

    content = content.strip()

    if not content:
        raise ValidationError(
            "Le message ne peut pas être vide."
        )

    if len(content) > MAX_MESSAGE_LENGTH:
        raise ValidationError(
            "Le message dépasse la taille maximale autorisée "
            f"({MAX_MESSAGE_LENGTH} caractères)."
        )

    return content


# ==========================================================
# RECHERCHE
# ==========================================================

def validate_search_query(search):
    """
    Nettoie et valide une requête de recherche.

    Une recherche vide est autorisée et signifie qu'aucun filtre
    de recherche ne doit être appliqué.
    """

    if search is None:
        return ""

    if not isinstance(search, str):
        raise ValidationError(
            "La recherche doit être une chaîne de caractères."
        )

    search = search.strip()

    if not search:
        return ""

    if len(search) > MAX_SEARCH_QUERY_LENGTH:
        raise ValidationError(
            f"La recherche ne peut pas dépasser "
            f"{MAX_SEARCH_QUERY_LENGTH} caractères."
        )

    return search


# ==========================================================
# IDENTIFIANT DE CONVERSATION
# ==========================================================

def validate_conversation_id(conversation_id):
    """
    Vérifie un identifiant de conversation.

    Retourne l'identifiant sous forme d'entier.
    """

    if conversation_id is None:
        raise ValidationError(
            "L'identifiant de conversation est obligatoire."
        )

    try:
        conversation_id = int(conversation_id)
    except (TypeError, ValueError):
        raise ValidationError(
            "L'identifiant de conversation doit être un entier."
        )

    if conversation_id <= 0:
        raise ValidationError(
            "L'identifiant de conversation doit être positif."
        )

    return conversation_id
