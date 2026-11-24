from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional


@dataclass(slots=True)
class ContextBudget:
    """
    Budget concret utilisé pour une requête donnée.

    Contrairement à ModelContextLimits, cette classe représente
    le budget effectivement disponible après prise en compte
    de la sortie demandée et de la marge de sécurité.
    """

    max_context_tokens: int = 8192
    reserved_output_tokens: int = 2048
    safety_margin_tokens: int = 256

    model: Optional[str] = None
    provider: Optional[str] = None

    def __post_init__(self) -> None:
        self.max_context_tokens = int(
            self.max_context_tokens
        )
        self.reserved_output_tokens = int(
            self.reserved_output_tokens
        )
        self.safety_margin_tokens = int(
            self.safety_margin_tokens
        )

        if self.max_context_tokens <= 0:
            raise ValueError(
                "max_context_tokens doit être supérieur à zéro."
            )

        if self.reserved_output_tokens < 0:
            raise ValueError(
                "reserved_output_tokens ne peut pas être négatif."
            )

        if self.safety_margin_tokens < 0:
            raise ValueError(
                "safety_margin_tokens ne peut pas être négatif."
            )

        if self.available_input_tokens <= 0:
            raise ValueError(
                "Le budget disponible pour le contexte doit être positif."
            )

    @property
    def available_input_tokens(self) -> int:
        return max(
            1,
            self.max_context_tokens
            - self.reserved_output_tokens
            - self.safety_margin_tokens,
        )

    def fits(
        self,
        estimated_tokens: int,
    ) -> bool:
        return int(estimated_tokens) <= (
            self.available_input_tokens
        )

    def remaining(
        self,
        used_tokens: int,
    ) -> int:
        return max(
            0,
            self.available_input_tokens
            - int(used_tokens),
        )

    def clamp(
        self,
        requested_tokens: int,
    ) -> int:
        return max(
            1,
            min(
                int(requested_tokens),
                self.available_input_tokens,
            ),
        )

    @classmethod
    def from_resolved_budget(
        cls,
        budget: dict[str, Any],
    ) -> "ContextBudget":
        """
        Construit un ContextBudget à partir du résultat du resolver.
        """

        return cls(
            max_context_tokens=int(
                budget["context_window"]
            ),
            reserved_output_tokens=int(
                budget["reserved_output_tokens"]
            ),
            safety_margin_tokens=int(
                budget["safety_margin_tokens"]
            ),
            model=budget.get("model"),
            provider=budget.get("provider"),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "max_context_tokens": (
                self.max_context_tokens
            ),
            "reserved_output_tokens": (
                self.reserved_output_tokens
            ),
            "safety_margin_tokens": (
                self.safety_margin_tokens
            ),
            "available_input_tokens": (
                self.available_input_tokens
            ),
            "model": self.model,
            "provider": self.provider,
        }

    def __repr__(self) -> str:
        return (
            "ContextBudget("
            f"model={self.model!r}, "
            f"provider={self.provider!r}, "
            f"max_context_tokens="
            f"{self.max_context_tokens}, "
            f"reserved_output_tokens="
            f"{self.reserved_output_tokens}, "
            f"safety_margin_tokens="
            f"{self.safety_margin_tokens}, "
            f"available_input_tokens="
            f"{self.available_input_tokens}"
            ")"
        )