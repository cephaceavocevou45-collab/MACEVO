from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from .message import AIMessage


class ResponseStatus(str, Enum):
    COMPLETED = "completed"
    STREAMING = "streaming"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TOOL_CALL = "tool_call"


@dataclass(slots=True)
class AIResponse:
    """
    Réponse normalisée du moteur IA.

    Aucun composant applicatif ne doit dépendre directement
    du format de réponse d'un provider.
    """

    content: str = ""

    id: UUID = field(default_factory=uuid4)
    request_id: UUID | None = None

    status: ResponseStatus = ResponseStatus.COMPLETED

    model: str | None = None
    provider: str | None = None

    message: AIMessage | None = None

    tool_calls: list[dict[str, Any]] = field(default_factory=list)

    usage: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)

    error: str | None = None

    created_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    def __post_init__(self) -> None:
        if not isinstance(self.content, str):
            self.content = str(self.content)

        if isinstance(self.status, str):
            self.status = ResponseStatus(self.status)

        if not isinstance(self.tool_calls, list):
            self.tool_calls = list(self.tool_calls or [])

        if not isinstance(self.usage, dict):
            self.usage = dict(self.usage or {})

        if not isinstance(self.metadata, dict):
            self.metadata = dict(self.metadata or {})

    @property
    def is_success(self) -> bool:
        return (
            self.status == ResponseStatus.COMPLETED
            and not self.error
        )

    @property
    def is_failed(self) -> bool:
        return (
            self.status == ResponseStatus.FAILED
            or self.error is not None
        )

    @property
    def has_tool_calls(self) -> bool:
        return bool(self.tool_calls)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": str(self.id),
            "request_id": (
                str(self.request_id)
                if self.request_id
                else None
            ),
            "content": self.content,
            "status": self.status.value,
            "model": self.model,
            "provider": self.provider,
            "message": (
                self.message.to_dict()
                if self.message
                else None
            ),
            "tool_calls": self.tool_calls,
            "usage": self.usage,
            "metadata": self.metadata,
            "error": self.error,
            "created_at": self.created_at.isoformat(),
        }

    @classmethod
    def success(
        cls,
        content: str,
        *,
        request_id: UUID | None = None,
        model: str | None = None,
        provider: str | None = None,
        usage: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> "AIResponse":
        message = AIMessage(
            role="assistant",
            content=content,
        )

        return cls(
            content=content,
            request_id=request_id,
            status=ResponseStatus.COMPLETED,
            model=model,
            provider=provider,
            message=message,
            usage=dict(usage or {}),
            metadata=dict(metadata or {}),
        )

    @classmethod
    def failure(
        cls,
        error: str,
        *,
        request_id: UUID | None = None,
        model: str | None = None,
        provider: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> "AIResponse":
        return cls(
            request_id=request_id,
            status=ResponseStatus.FAILED,
            model=model,
            provider=provider,
            error=error,
            metadata=dict(metadata or {}),
        )