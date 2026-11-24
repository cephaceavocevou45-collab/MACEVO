
"""
==========================================================
MACEVO IA
AI Providers Registry
==========================================================

Registre central des fournisseurs IA.

Ce module contient uniquement l'enregistrement des
providers disponibles.

La logique métier, scientifique et documentaire ne doit
pas être placée ici.

Auteur : MACEVO
"""

from projects.services.ai.ollama_service import OllamaService


# ==========================================================
# PROVIDERS REGISTRY
# ==========================================================

PROVIDERS = {
    "ollama": OllamaService,
}


def get_provider_class(provider_name):
    """
    Retourne la classe correspondant au provider demandé.

    Args:
        provider_name: nom du provider.

    Returns:
        Classe du provider.

    Raises:
        KeyError: si le provider n'existe pas.
    """

    if not provider_name:
        provider_name = "ollama"

    provider_name = str(
        provider_name
    ).strip().lower()

    return PROVIDERS[provider_name]


def available_providers():
    """
    Retourne la liste des providers disponibles.
    """

    return list(
        PROVIDERS.keys()
    )


def is_provider_available(provider_name):
    """
    Vérifie si un provider est enregistré.
    """

    if not provider_name:
        return False

    return str(
        provider_name
    ).strip().lower() in PROVIDERS
