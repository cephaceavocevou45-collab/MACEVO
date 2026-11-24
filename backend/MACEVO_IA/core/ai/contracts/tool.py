from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable


class ToolExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass(slots=True)
class AITool:
    """
    Contrat générique d'un outil utilisable par MACEVO_IA.

    L'outil peut être une fonction locale, un service interne,
    un moteur mathématique, un compilateur LaTeX, etc.
    """

    name: str
    description: str

    function: Callable[..., Any] | None = None

    input_schema: dict[str, Any] = field(default_factory=dict)
    output_schema: dict[str, Any] = field(default_factory=dict)

    enabled: bool = True
    requires_confirmation: bool = False

    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.name = self.name.strip()

        if not self.name:
            raise ValueError("Un outil doit avoir un nom.")

        if not self.description.strip():
            raise ValueError(
                f"L'outil '{self.name}' doit avoir une description."
            )

        self.input_schema = dict(self.input_schema or {})
        self.output_schema = dict(self.output_schema or {})
        self.metadata = dict(self.metadata or {})

    def execute(self, **kwargs: Any) -> Any:
        if not self.enabled:
            raise RuntimeError(
                f"L'outil '{self.name}' est désactivé."
            )

        if self.function is None:
            raise RuntimeError(
                f"Aucune fonction n'est associée à l'outil "
                f"'{self.name}'."
            )

        return self.function(**kwargs)

    def to_definition(self) -> dict[str, Any]:
        """
        Format neutre pouvant être transformé vers le format
        propre à chaque provider.
        """

        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema,
        }

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema,
            "output_schema": self.output_schema,
            "enabled": self.enabled,
            "requires_confirmation": self.requires_confirmation,
            "metadata": self.metadata,
        }