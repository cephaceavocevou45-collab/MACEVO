from __future__ import annotations

from threading import RLock
from typing import Dict, List, Optional, Type

from core.ai.providers.base import BaseAIProvider


class ProviderRegistry:
    """
    Registre central des providers IA disponibles dans MACEVO.

    Le registre contient uniquement les classes de providers.
    La création réelle des instances est effectuée à la demande.

    Cela permet à MACEVO de supporter plusieurs providers sans
    coupler le routeur directement à leurs implémentations.
    """

    _providers: Dict[str, Type[BaseAIProvider]] = {}
    _lock = RLock()

    # ------------------------------------------------------------------
    # NORMALISATION
    # ------------------------------------------------------------------

    @classmethod
    def _normalize_name(cls, provider: str) -> str:
        """
        Normalise le nom du provider.
        """

        provider = str(provider or "").strip().lower()

        if not provider:
            raise ValueError(
                "Le nom du provider est obligatoire."
            )

        return provider

    # ------------------------------------------------------------------
    # ENREGISTREMENT
    # ------------------------------------------------------------------

    @classmethod
    def register(
        cls,
        name: str,
        provider_class: Type[BaseAIProvider],
        *,
        overwrite: bool = True,
    ) -> Type[BaseAIProvider]:
        """
        Enregistre une classe de provider.
        """

        name = cls._normalize_name(name)

        if not isinstance(provider_class, type):
            raise TypeError(
                "provider_class doit être une classe."
            )

        if not issubclass(
            provider_class,
            BaseAIProvider,
        ):
            raise TypeError(
                "Le provider doit hériter de BaseAIProvider."
            )

        with cls._lock:

            if (
                not overwrite
                and name in cls._providers
            ):
                raise ValueError(
                    f"Le provider '{name}' est déjà enregistré."
                )

            cls._providers[name] = provider_class

        return provider_class

    # ------------------------------------------------------------------
    # SUPPRESSION
    # ------------------------------------------------------------------

    @classmethod
    def unregister(
        cls,
        name: str,
    ) -> None:
        """
        Supprime un provider du registre.
        """

        name = cls._normalize_name(name)

        with cls._lock:
            cls._providers.pop(name, None)

    # ------------------------------------------------------------------
    # EXISTENCE
    # ------------------------------------------------------------------

    @classmethod
    def exists(
        cls,
        name: str,
    ) -> bool:
        """
        Indique si un provider est enregistré.
        """

        name = cls._normalize_name(name)

        with cls._lock:
            return name in cls._providers

    # ------------------------------------------------------------------
    # RECUPERATION DE CLASSE
    # ------------------------------------------------------------------

    @classmethod
    def get_class(
        cls,
        name: str,
    ) -> Type[BaseAIProvider]:
        """
        Retourne la classe du provider demandé.
        """

        name = cls._normalize_name(name)

        with cls._lock:
            provider_class = cls._providers.get(name)

        if provider_class is None:
            raise ValueError(
                f"Le provider '{name}' n'est pas enregistré."
            )

        return provider_class

    # ------------------------------------------------------------------
    # CREATION D'INSTANCE
    # ------------------------------------------------------------------

    @classmethod
    def create(
        cls,
        provider: str,
        model: Optional[str] = None,
        **kwargs,
    ) -> BaseAIProvider:
        """
        Crée une instance du provider demandé.

        Le modèle est transmis directement au constructeur.

        Exemple :

            ProviderRegistry.create(
                "openai",
                model="gpt-5.6-luna",
            )
        """

        provider = cls._normalize_name(provider)

        provider_class = cls.get_class(
            provider,
        )

        if model is not None:
            kwargs["model"] = model

        return provider_class(
            **kwargs,
        )

    # ------------------------------------------------------------------
    # LISTE
    # ------------------------------------------------------------------

    @classmethod
    def list_providers(
        cls,
    ) -> List[str]:
        """
        Retourne la liste des providers enregistrés.
        """

        with cls._lock:
            return sorted(
                cls._providers.keys()
            )

    # ------------------------------------------------------------------
    # REGISTRE COMPLET
    # ------------------------------------------------------------------

    @classmethod
    def all(
        cls,
    ) -> Dict[str, Type[BaseAIProvider]]:
        """
        Retourne une copie du registre.
        """

        with cls._lock:
            return dict(
                cls._providers
            )

    # ------------------------------------------------------------------
    # NETTOYAGE
    # ------------------------------------------------------------------

    @classmethod
    def clear(
        cls,
    ) -> None:
        """
        Vide complètement le registre.

        Principalement utile pour les tests.
        """

        with cls._lock:
            cls._providers.clear()


# ==========================================================================
# PROVIDERS NATIFS MACEVO
# ==========================================================================

def _register_builtin_providers() -> None:
    """
    Enregistre les providers natifs actuellement disponibles.

    Les imports sont effectués à l'intérieur de la fonction afin de
    limiter les risques d'imports circulaires et de ne charger les
    implémentations qu'au moment de l'initialisation du registre.
    """

    from core.ai.providers.ollama import OllamaProvider
    from core.ai.providers.openai import OpenAIProvider

    # ------------------------------------------------------------------
    # Ollama
    # ------------------------------------------------------------------

    ProviderRegistry.register(
        "ollama",
        OllamaProvider,
    )

    # ------------------------------------------------------------------
    # OpenAI
    # ------------------------------------------------------------------

    ProviderRegistry.register(
        "openai",
        OpenAIProvider,
    )


# Initialisation automatique du registre.
_register_builtin_providers()