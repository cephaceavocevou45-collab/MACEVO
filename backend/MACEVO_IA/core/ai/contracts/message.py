from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Mapping
from uuid import UUID, uuid4


class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


@dataclass(slots=True)
class AIMessage:
    """
    Message universel utilisé par MACEVO_IA.

    Il est volontairement indépendant d'un provider particulier
    (Ollama, OpenAI, Gemini, Anthropic, etc.).
    """

    role: MessageRole | str
    content: str = ""
    id: UUID = field(default_factory=uuid4)
    name: str | None = None
    tool_call_id: str | None = None
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    def __post_init__(self) -> None:
        if isinstance(self.role, str):
            try:
                self.role = MessageRole(self.role.lower())
            except ValueError as exc:
                raise ValueError(
                    f"Rôle de message non supporté : {self.role}"
                ) from exc

        if not isinstance(self.content, str):
            self.content = str(self.content)

        if not isinstance(self.tool_calls, list):
            self.tool_calls = list(self.tool_calls or [])

        if not isinstance(self.metadata, dict):
            self.metadata = dict(self.metadata or {})

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": str(self.id),
            "role": self.role.value,
            "content": self.content,
            "name": self.name,
            "tool_call_id": self.tool_call_id,
            "tool_calls": self.tool_calls,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
        }

    def to_provider_dict(self) -> dict[str, Any]:
        """
        Représentation minimale compatible avec la majorité
        des APIs de modèles conversationnels.
        """

        data: dict[str, Any] = {
            "role": self.role.value,
            "content": self.content,
        }

        if self.name:
            data["name"] = self.name

        if self.tool_call_id:
            data["tool_call_id"] = self.tool_call_id

        if self.tool_calls:
            data["tool_calls"] = self.tool_calls

        return data

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "AIMessage":
        if "role" not in data:
            raise ValueError("Un message doit contenir un rôle.")

        return cls(
            id=UUID(str(data["id"])) if data.get("id") else uuid4(),
            role=data["role"],
            content=data.get("content", ""),
            name=data.get("name"),
            tool_call_id=data.get("tool_call_id"),
            tool_calls=list(data.get("tool_calls") or []),
            metadata=dict(data.get("metadata") or {}),
            created_at=(
                datetime.fromisoformat(data["created_at"])
                if data.get("created_at")
                else datetime.now(timezone.utc)
            ),
        )

    def is_user(self) -> bool:
        return self.role == MessageRole.USER

    def is_assistant(self) -> bool:
        return self.role == MessageRole.ASSISTANT

    def is_system(self) -> bool:
        return self.role == MessageRole.SYSTEM

    def is_tool(self) -> bool:
        return self.role == MessageRole.TOOL