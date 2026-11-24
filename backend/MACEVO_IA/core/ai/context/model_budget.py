from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional


@dataclass(slots=True)
class ModelContextLimits:
    """
    Limites de contexte connues pour un modèle.

    Cette classe reste indépendante du provider afin de pouvoir
    être utilisée par le moteur de contexte, le routeur et
    l'orchestrateur.
    """

    model: str
    provider: str = ""

    context_window: int = 8192
    default_output_tokens: int = 2048
    minimum_input_tokens: int = 256

    def __post_init__(self) -> None:
        self.model = str(self.model or "").strip()
        self.provider = str(self.provider or "").strip().lower()

        self.context_window = int(self.context_window)
        self.default_output_tokens = int(
            self.default_output_tokens
        )
        self.minimum_input_tokens = int(
            self.minimum_input_tokens
        )

        if not self.model:
            raise ValueError("Le modèle est obligatoire.")

        if self.context_window <= 0:
            raise ValueError(
                "context_window doit être supérieur à zéro."
            )

        if self.default_output_tokens < 0:
            raise ValueError(
                "default_output_tokens ne peut pas être négatif."
            )

        if self.minimum_input_tokens <= 0:
            raise ValueError(
                "minimum_input_tokens doit être supérieur à zéro."
            )

        if self.minimum_input_tokens > self.context_window:
            raise ValueError(
                "minimum_input_tokens ne peut pas dépasser "
                "context_window."
            )

        if self.default_output_tokens > self.context_window:
            raise ValueError(
                "default_output_tokens ne peut pas dépasser "
                "context_window."
            )

    def to_dict(self) -> dict[str, Any]:
        return {
            "model": self.model,
            "provider": self.provider,
            "context_window": self.context_window,
            "default_output_tokens": self.default_output_tokens,
            "minimum_input_tokens": self.minimum_input_tokens,
        }


class ModelContextBudgetResolver:
    """
    Résout dynamiquement le budget utilisable du contexte.

    Principe :

        fenêtre de contexte
            -
        tokens réservés à la sortie
            -
        marge de sécurité
            =
        budget d'entrée disponible

    Le budget de sortie explicitement demandé par AIRequest
    est prioritaire.

    Le résolveur ne force jamais le système à utiliser toute la
    fenêtre disponible. Il fournit seulement les limites au moteur
    de contexte.
    """

    # ------------------------------------------------------------
    # Valeurs par défaut
    # ------------------------------------------------------------

    DEFAULT_CONTEXT_WINDOW = 8192
    DEFAULT_OUTPUT_TOKENS = 2048
    DEFAULT_SAFETY_MARGIN = 256

    # ------------------------------------------------------------
    # Limites connues
    # ------------------------------------------------------------

    KNOWN_MODELS: dict[str, ModelContextLimits] = {
        # ========================================================
        # OLLAMA
        # ========================================================

        "ollama:qwen3:1.7b": ModelContextLimits(
            model="qwen3:1.7b",
            provider="ollama",
            context_window=8192,
            default_output_tokens=1024,
            minimum_input_tokens=256,
        ),

        "ollama:qwen3:latest": ModelContextLimits(
            model="qwen3:latest",
            provider="ollama",
            context_window=8192,
            default_output_tokens=1024,
            minimum_input_tokens=256,
        ),

        # ========================================================
        # OPENAI
        # ========================================================

        "openai:gpt-5.6-luna": ModelContextLimits(
            model="gpt-5.6-luna",
            provider="openai",
            context_window=1_050_000,
            default_output_tokens=4096,
            minimum_input_tokens=256,
        ),
    }

    def __init__(
        self,
        *,
        safety_margin_tokens: int = DEFAULT_SAFETY_MARGIN,
    ) -> None:
        self.safety_margin_tokens = int(
            safety_margin_tokens
        )

        if self.safety_margin_tokens < 0:
            raise ValueError(
                "safety_margin_tokens ne peut pas être négatif."
            )

    # ============================================================
    # LIMITES DU MODÈLE
    # ============================================================

    def resolve_limits(
        self,
        *,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        context_window: Optional[int] = None,
    ) -> ModelContextLimits:
        """
        Détermine les limites applicables au modèle.
        """

        model = str(model or "").strip()
        provider = str(provider or "").strip().lower()

        # --------------------------------------------------------
        # Fenêtre explicitement imposée
        # --------------------------------------------------------

        if context_window is not None:
            resolved_window = int(context_window)

            if resolved_window <= 0:
                raise ValueError(
                    "context_window doit être supérieur à zéro."
                )

            return ModelContextLimits(
                model=model or "custom",
                provider=provider,
                context_window=resolved_window,
                default_output_tokens=min(
                    self.DEFAULT_OUTPUT_TOKENS,
                    resolved_window,
                ),
            )

        # --------------------------------------------------------
        # Recherche exacte provider:model
        # --------------------------------------------------------

        if model:
            key = (
                f"{provider}:{model}"
                if provider
                else model
            )

            if key in self.KNOWN_MODELS:
                return self.KNOWN_MODELS[key]

            # ----------------------------------------------------
            # Recherche secondaire par nom de modèle
            # ----------------------------------------------------

            matches = [
                limits
                for limits in self.KNOWN_MODELS.values()
                if limits.model == model
            ]

            if len(matches) == 1:
                return matches[0]

            # ----------------------------------------------------
            # Si plusieurs providers possèdent le même modèle,
            # le provider demandé doit permettre de désambiguïser.
            # ----------------------------------------------------

            if provider:
                provider_matches = [
                    limits
                    for limits in matches
                    if limits.provider == provider
                ]

                if provider_matches:
                    return provider_matches[0]

        # --------------------------------------------------------
        # Modèle inconnu
        # --------------------------------------------------------

        return ModelContextLimits(
            model=model or "unknown",
            provider=provider,
            context_window=self.DEFAULT_CONTEXT_WINDOW,
            default_output_tokens=self.DEFAULT_OUTPUT_TOKENS,
        )

    # ============================================================
    # TOKENS DE SORTIE
    # ============================================================

    def resolve_output_tokens(
        self,
        *,
        request_max_tokens: Optional[int],
        limits: ModelContextLimits,
    ) -> int:
        """
        Détermine le nombre de tokens à réserver pour la sortie.
        """

        if request_max_tokens is None:
            requested = limits.default_output_tokens
        else:
            requested = int(request_max_tokens)

        if requested <= 0:
            raise ValueError(
                "max_tokens doit être supérieur à zéro."
            )

        maximum_allowed = max(
            1,
            limits.context_window
            - limits.minimum_input_tokens,
        )

        return min(
            requested,
            maximum_allowed,
        )

    # ============================================================
    # BUDGET GLOBAL
    # ============================================================

    def resolve_budget(
        self,
        *,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        request_max_tokens: Optional[int] = None,
        context_window: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Calcule le budget final disponible pour les entrées.
        """

        limits = self.resolve_limits(
            model=model,
            provider=provider,
            context_window=context_window,
        )

        output_tokens = self.resolve_output_tokens(
            request_max_tokens=request_max_tokens,
            limits=limits,
        )

        available_input = (
            limits.context_window
            - output_tokens
            - self.safety_margin_tokens
        )

        # Respect du minimum d'entrée.
        if available_input < limits.minimum_input_tokens:
            available_input = limits.minimum_input_tokens

        # Protection contre un dépassement de la fenêtre.
        available_input = min(
            available_input,
            limits.context_window,
        )

        return {
            "model": limits.model,
            "provider": limits.provider,
            "context_window": limits.context_window,
            "reserved_output_tokens": output_tokens,
            "safety_margin_tokens": self.safety_margin_tokens,
            "available_input_tokens": available_input,
            "minimum_input_tokens": limits.minimum_input_tokens,
        }