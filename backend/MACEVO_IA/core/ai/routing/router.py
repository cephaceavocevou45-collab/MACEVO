from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Optional

from core.ai.models.config import AIModelConfig
from core.ai.models.registry import ModelRegistry
from core.ai.providers.registry import ProviderRegistry


@dataclass(frozen=True)
class RoutingDecision:
    """
    Décision finale du routeur MACEVO IA.

    Cette structure contient tout ce qui est nécessaire à la couche
    supérieure pour créer le provider et utiliser le modèle choisi.
    """

    provider: str
    model: str
    config: AIModelConfig


class ModelRouter:
    """
    Routeur central des modèles MACEVO IA.

    Ordre de résolution :

    1. provider + modèle explicitement demandés
    2. modèle explicitement demandé
    3. provider explicitement demandé
    4. modèle par défaut
    5. premier modèle enregistré

    Le routeur ne communique jamais directement avec un fournisseur.
    Il produit uniquement une décision de routage.
    """

    DEFAULT_PROVIDER = os.getenv("AI_PROVIDER", "ollama").strip().lower() or "ollama"
    DEFAULT_MODEL = os.getenv("AI_MODEL", "").strip() or (
        os.getenv("OPENAI_MODEL", "gpt-5.6-luna").strip()
        if DEFAULT_PROVIDER == "openai"
        else os.getenv("OLLAMA_MODEL", "qwen3:1.7b").strip()
    )

    def __init__(
        self,
        model_registry: type[ModelRegistry] = ModelRegistry,
        provider_registry: type[ProviderRegistry] = ProviderRegistry,
    ):
        self.model_registry = model_registry
        self.provider_registry = provider_registry

    # ------------------------------------------------------------------
    # NORMALISATION
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_provider(
        provider: Optional[str],
    ) -> Optional[str]:
        """
        Normalise le nom du provider.
        """

        if provider is None:
            return None

        provider = str(provider).strip().lower()

        return provider or None

    @staticmethod
    def _normalize_model(
        model: Optional[str],
    ) -> Optional[str]:
        """
        Normalise le nom du modèle.
        """

        if model is None:
            return None

        model = str(model).strip()

        return model or None

    # ------------------------------------------------------------------
    # RESOLUTION
    # ------------------------------------------------------------------

    def resolve(
        self,
        *,
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> RoutingDecision:
        """
        Résout le provider et le modèle à utiliser.
        """

        provider = self._normalize_provider(provider)
        model = self._normalize_model(model)

        # --------------------------------------------------------------
        # 1. Provider + modèle explicitement demandés
        # --------------------------------------------------------------

        if provider and model:

            config = self.model_registry.get(
                provider,
                model,
            )

            if config is None:
                raise ValueError(
                    f"Le modèle '{model}' n'est pas enregistré "
                    f"pour le provider '{provider}'."
                )

            self._ensure_provider(provider)

            return RoutingDecision(
                provider=provider,
                model=model,
                config=config,
            )

        # --------------------------------------------------------------
        # 2. Modèle explicitement demandé
        # --------------------------------------------------------------

        if model:

            config = self.model_registry.get_by_model(
                model,
            )

            if config is None:
                raise ValueError(
                    f"Aucun modèle enregistré avec le nom '{model}'."
                )

            if provider and config.provider.lower() != provider:
                raise ValueError(
                    f"Le modèle '{model}' n'est pas disponible "
                    f"chez le provider '{provider}'."
                )

            resolved_provider = self._normalize_provider(
                config.provider,
            )

            if not resolved_provider:
                raise ValueError(
                    f"Le modèle '{model}' possède un provider invalide."
                )

            self._ensure_provider(
                resolved_provider,
            )

            return RoutingDecision(
                provider=resolved_provider,
                model=config.model,
                config=config,
            )

        # --------------------------------------------------------------
        # 3. Provider explicitement demandé
        # --------------------------------------------------------------

        if provider:

            candidates = self.model_registry.get_by_provider(
                provider,
            )

            if not candidates:
                raise ValueError(
                    f"Aucun modèle enregistré pour le provider "
                    f"'{provider}'."
                )

            config = candidates[0]

            self._ensure_provider(
                provider,
            )

            return RoutingDecision(
                provider=provider,
                model=config.model,
                config=config,
            )

        # --------------------------------------------------------------
        # 4. Modèle par défaut
        # --------------------------------------------------------------

        default_config = self.model_registry.get(
            self.DEFAULT_PROVIDER,
            self.DEFAULT_MODEL,
        )

        if default_config is not None:

            self._ensure_provider(
                self.DEFAULT_PROVIDER,
            )

            return RoutingDecision(
                provider=self.DEFAULT_PROVIDER,
                model=self.DEFAULT_MODEL,
                config=default_config,
            )

        # --------------------------------------------------------------
        # 5. Fallback : premier modèle enregistré
        # --------------------------------------------------------------

        models = self.model_registry.list_models()

        if not models:
            raise RuntimeError(
                "Aucun modèle IA n'est enregistré dans MACEVO IA."
            )

        config = models[0]

        resolved_provider = self._normalize_provider(
            config.provider,
        )

        if not resolved_provider:
            raise RuntimeError(
                "Le premier modèle enregistré possède un provider invalide."
            )

        self._ensure_provider(
            resolved_provider,
        )

        return RoutingDecision(
            provider=resolved_provider,
            model=config.model,
            config=config,
        )

    # ------------------------------------------------------------------
    # ROUTE
    # ------------------------------------------------------------------

    def route(
        self,
        request: Any = None,
        *,
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> RoutingDecision:
        """
        Point d'entrée principal du routeur.

        Compatible avec :

            router.route(
                provider="ollama",
                model="qwen3:1.7b",
            )

        ou :

            router.route(request)
        """

        # --------------------------------------------------------------
        # Aucun objet request
        # --------------------------------------------------------------

        if request is None:

            return self.resolve(
                provider=provider,
                model=model,
            )

        # --------------------------------------------------------------
        # Chaîne interprétée comme provider
        # --------------------------------------------------------------

        if isinstance(request, str):

            if provider is not None:
                raise ValueError(
                    "Le provider a été fourni deux fois."
                )

            provider = request

            return self.resolve(
                provider=provider,
                model=model,
            )

        # --------------------------------------------------------------
        # Extraction depuis AIRequest ou objet compatible
        # --------------------------------------------------------------

        request_provider = getattr(
            request,
            "provider",
            None,
        )

        request_model = getattr(
            request,
            "model",
            None,
        )

        # Les paramètres explicites de route() ont priorité.

        if provider is None:
            provider = request_provider

        if model is None:
            model = request_model

        return self.resolve(
            provider=provider,
            model=model,
        )

    # ------------------------------------------------------------------
    # CREATION DU PROVIDER
    # ------------------------------------------------------------------

    def create_provider(
        self,
        provider: str | RoutingDecision,
        *,
        model: Optional[str] = None,
        **kwargs: Any,
    ):
        """
        Crée une instance du provider correspondant.

        Accepte :

            router.create_provider(
                "ollama",
                model="qwen3:1.7b",
            )

        ou :

            router.create_provider(
                decision,
            )
        """

        # --------------------------------------------------------------
        # RoutingDecision fourni directement
        # --------------------------------------------------------------

        if isinstance(
            provider,
            RoutingDecision,
        ):
            decision = provider

            provider_name = decision.provider

            if model is None:
                model = decision.model

        else:
            provider_name = self._normalize_provider(
                provider,
            )

        if not provider_name:
            raise ValueError(
                "Le provider est obligatoire."
            )

        self._ensure_provider(
            provider_name,
        )

        return self.provider_registry.create(
            provider_name,
            model=model,
            **kwargs,
        )

    # ------------------------------------------------------------------
    # VALIDATION DU PROVIDER
    # ------------------------------------------------------------------

    def _ensure_provider(
        self,
        provider: str,
    ) -> None:
        """
        Vérifie que le provider demandé est enregistré.
        """

        provider = self._normalize_provider(
            provider,
        )

        if not provider:
            raise ValueError(
                "Le provider est obligatoire."
            )

        if not self.provider_registry.exists(
            provider,
        ):
            raise ValueError(
                f"Le provider '{provider}' n'est pas enregistré."
            )

    # ------------------------------------------------------------------
    # INFORMATIONS
    # ------------------------------------------------------------------

    def available_providers(self) -> list[str]:
        """
        Retourne la liste des providers disponibles.
        """

        return self.provider_registry.list_providers()

    def available_models(
        self,
        provider: Optional[str] = None,
    ) -> list[AIModelConfig]:
        """
        Retourne les modèles disponibles.

        Si provider est fourni, seuls les modèles de ce provider
        sont retournés.
        """

        return self.model_registry.list_models(
            provider=provider,
        )

    def has_model(
        self,
        provider: str,
        model: str,
    ) -> bool:
        """
        Vérifie l'existence d'un modèle pour un provider.
        """

        return self.model_registry.exists(
            provider,
            model,
        )

    def __repr__(self) -> str:
        return (
            "ModelRouter("
            f"default_provider={self.DEFAULT_PROVIDER!r}, "
            f"default_model={self.DEFAULT_MODEL!r}"
            ")"
        )