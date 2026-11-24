from __future__ import annotations

from threading import RLock
from typing import Dict, List, Optional

from core.ai.models.config import AIModelConfig


class ModelRegistry:
    """
    Registre central des modèles IA disponibles pour MACEVO IA.

    Le registre est volontairement indépendant du chargement des
    modèles par défaut afin d'éviter toute dépendance circulaire.

    Le chargement des modèles par défaut doit être déclenché par
    le module d'initialisation des modèles.
    """

    _models: Dict[str, AIModelConfig] = {}
    _lock = RLock()

    @classmethod
    def _key(cls, provider: str, model: str) -> str:
        provider = str(provider or "").strip().lower()
        model = str(model or "").strip()

        if not provider:
            raise ValueError("Le provider est obligatoire.")

        if not model:
            raise ValueError("Le modèle est obligatoire.")

        return f"{provider}:{model}"

    @classmethod
    def register(cls, config: AIModelConfig) -> AIModelConfig:
        """
        Enregistre ou remplace un modèle.
        """

        if not isinstance(config, AIModelConfig):
            raise TypeError(
                "config doit être une instance de AIModelConfig."
            )

        config.validate()

        key = cls._key(
            config.provider,
            config.model,
        )

        with cls._lock:
            cls._models[key] = config

        return config

    @classmethod
    def unregister(
        cls,
        provider: str,
        model: str,
    ) -> None:
        """
        Supprime un modèle du registre.
        """

        key = cls._key(provider, model)

        with cls._lock:
            cls._models.pop(key, None)

    @classmethod
    def get(
        cls,
        provider: str,
        model: str,
    ) -> Optional[AIModelConfig]:
        """
        Retourne la configuration exacte d'un modèle.
        """

        key = cls._key(provider, model)

        with cls._lock:
            return cls._models.get(key)

    @classmethod
    def get_by_model(
        cls,
        model: str,
    ) -> Optional[AIModelConfig]:
        """
        Recherche un modèle indépendamment de son provider.
        """

        model = str(model or "").strip()

        if not model:
            return None

        with cls._lock:
            for config in cls._models.values():
                if config.model == model:
                    return config

        return None

    @classmethod
    def get_by_provider(
        cls,
        provider: str,
    ) -> List[AIModelConfig]:
        """
        Retourne tous les modèles associés à un provider.
        """

        provider = str(provider or "").strip().lower()

        if not provider:
            return []

        with cls._lock:
            return [
                config
                for config in cls._models.values()
                if config.provider == provider
            ]

    @classmethod
    def exists(
        cls,
        provider: str,
        model: str,
    ) -> bool:
        """
        Vérifie si un modèle est enregistré.
        """

        return cls.get(provider, model) is not None

    @classmethod
    def list_models(
        cls,
        provider: Optional[str] = None,
    ) -> List[AIModelConfig]:
        """
        Liste les modèles enregistrés.

        Si provider est fourni, seuls les modèles de ce provider
        sont retournés.
        """

        with cls._lock:
            models = list(cls._models.values())

        if provider is not None:
            provider = str(provider).strip().lower()

            models = [
                config
                for config in models
                if config.provider == provider
            ]

        return sorted(
            models,
            key=lambda config: (
                config.provider,
                config.model,
            ),
        )

    @classmethod
    def providers(cls) -> List[str]:
        """
        Retourne la liste des providers actuellement enregistrés.
        """

        with cls._lock:
            return sorted(
                {
                    config.provider
                    for config in cls._models.values()
                }
            )

    @classmethod
    def all(cls) -> Dict[str, AIModelConfig]:
        """
        Retourne une copie du registre.
        """

        with cls._lock:
            return dict(cls._models)

    @classmethod
    def clear(cls) -> None:
        """
        Vide complètement le registre.
        """

        with cls._lock:
            cls._models.clear()

    @classmethod
    def count(cls) -> int:
        """
        Retourne le nombre de modèles enregistrés.
        """

        with cls._lock:
            return len(cls._models)