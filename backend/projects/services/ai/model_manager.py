
"""
==========================================================
MACEVO IA
Model Manager
==========================================================

Gestionnaire central des providers et modèles IA.

Auteur : MACEVO
"""

import logging

from django.conf import settings

from projects.services.ai.providers import PROVIDERS

from projects.services.ai.exceptions import (
    ProviderNotFoundError,
)


logger = logging.getLogger(__name__)


class ModelManager:
    """
    Gestionnaire central des providers IA.

    Responsabilités :

    - sélectionner le provider configuré ;
    - créer son instance ;
    - conserver l'instance active ;
    - recharger le provider ;
    - exposer le provider et le modèle courant.

    Le choix détaillé du modèle et la sélection intelligente
    par tâche seront ajoutés progressivement sans casser
    cette architecture.
    """

    _instance = None

    # =====================================================
    # Provider
    # =====================================================

    @classmethod
    def provider(cls):
        """
        Retourne l'instance du provider actuellement configuré.

        Le provider est créé une seule fois puis réutilisé.
        """

        if cls._instance is not None:
            return cls._instance

        provider_name = getattr(
            settings,
            "AI_PROVIDER",
            "ollama",
        )

        if not provider_name:
            provider_name = "ollama"

        provider_name = str(
            provider_name
        ).strip().lower()

        provider_class = PROVIDERS.get(
            provider_name
        )

        if provider_class is None:

            raise ProviderNotFoundError(
                f"Provider '{provider_name}' introuvable."
            )

        try:

            cls._instance = provider_class()

        except Exception:

            logger.exception(
                "Impossible d'initialiser le provider '%s'.",
                provider_name,
            )

            raise

        logger.info(
            "Provider IA initialisé : %s",
            provider_name,
        )

        return cls._instance

    # =====================================================
    # Reload
    # =====================================================

    @classmethod
    def reload(cls):
        """
        Recharge le provider courant.

        Utile notamment lorsque la configuration du modèle
        ou du provider a changé.
        """

        cls._instance = None

        return cls.provider()

    # =====================================================
    # Current Provider
    # =====================================================

    @classmethod
    def current_provider(cls):
        """
        Retourne le nom du provider actuellement configuré.
        """

        provider_name = getattr(
            settings,
            "AI_PROVIDER",
            "ollama",
        )

        if not provider_name:
            return "ollama"

        return str(
            provider_name
        ).strip().lower()

    # =====================================================
    # Current Model
    # =====================================================

    @classmethod
    def current_model(cls):
        """
        Retourne le modèle actuellement utilisé.

        Compatibilité avec deux architectures :

        1. provider.current_model()
        2. provider.model
        """

        provider = cls.provider()

        current_model = getattr(
            provider,
            "current_model",
            None,
        )

        if callable(current_model):

            return current_model()

        return getattr(
            provider,
            "model",
            None,
        )

    # =====================================================
    # Reset
    # =====================================================

    @classmethod
    def reset(cls):
        """
        Réinitialise complètement le provider en mémoire.

        Contrairement à reload(), cette méthode ne recrée
        pas immédiatement le provider.

        Elle sera utile pour les tests et pour certaines
        opérations de configuration dynamique.
        """

        cls._instance = None

    # =====================================================
    # Information
    # =====================================================

    @classmethod
    def info(cls):
        """
        Retourne les informations essentielles du moteur IA.
        """

        provider = cls.provider()

        return {
            "provider": cls.current_provider(),
            "model": cls.current_model(),
            "provider_class": (
                provider.__class__.__name__
            ),
        }
