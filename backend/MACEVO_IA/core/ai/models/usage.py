from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class AIUsage:
    """
    Statistiques d'utilisation d'une génération IA.

    Les champs sont volontairement compatibles avec différents
    fournisseurs et peuvent être enrichis sans modifier
    l'architecture générale.
    """

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    cached_tokens: int = 0
    reasoning_tokens: int = 0

    request_count: int = 1

    latency_ms: float | None = None

    estimated_cost: float | None = None
    currency: str | None = None

    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        numeric_fields = (
            "prompt_tokens",
            "completion_tokens",
            "total_tokens",
            "cached_tokens",
            "reasoning_tokens",
            "request_count",
        )

        for field_name in numeric_fields:
            value = getattr(self, field_name)

            if value < 0:
                raise ValueError(
                    f"{field_name} ne peut pas être négatif."
                )

        if self.latency_ms is not None and self.latency_ms < 0:
            raise ValueError(
                "latency_ms ne peut pas être négatif."
            )

        if self.estimated_cost is not None and self.estimated_cost < 0:
            raise ValueError(
                "estimated_cost ne peut pas être négatif."
            )

        if not self.total_tokens:
            self.total_tokens = (
                self.prompt_tokens
                + self.completion_tokens
            )

        self.metadata = dict(self.metadata or {})

    def add(self, other: "AIUsage") -> "AIUsage":
        if not isinstance(other, AIUsage):
            raise TypeError("other doit être un AIUsage.")

        latency = None

        if (
            self.latency_ms is not None
            or other.latency_ms is not None
        ):
            latency = (
                (self.latency_ms or 0)
                + (other.latency_ms or 0)
            )

        cost = None

        if (
            self.estimated_cost is not None
            or other.estimated_cost is not None
        ):
            cost = (
                (self.estimated_cost or 0)
                + (other.estimated_cost or 0)
            )

        return AIUsage(
            prompt_tokens=(
                self.prompt_tokens
                + other.prompt_tokens
            ),
            completion_tokens=(
                self.completion_tokens
                + other.completion_tokens
            ),
            total_tokens=(
                self.total_tokens
                + other.total_tokens
            ),
            cached_tokens=(
                self.cached_tokens
                + other.cached_tokens
            ),
            reasoning_tokens=(
                self.reasoning_tokens
                + other.reasoning_tokens
            ),
            request_count=(
                self.request_count
                + other.request_count
            ),
            latency_ms=latency,
            estimated_cost=cost,
            currency=self.currency or other.currency,
            metadata={
                **self.metadata,
                **other.metadata,
            },
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "cached_tokens": self.cached_tokens,
            "reasoning_tokens": self.reasoning_tokens,
            "request_count": self.request_count,
            "latency_ms": self.latency_ms,
            "estimated_cost": self.estimated_cost,
            "currency": self.currency,
            "metadata": self.metadata,
        }