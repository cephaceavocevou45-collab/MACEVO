from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any
from uuid import UUID, uuid4


class ResultStatus(str, Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass(slots=True)
class AIResult:
    """
    Résultat générique d'une opération du moteur.

    Permet de transporter aussi bien une réponse textuelle
    qu'un document, une structure scientifique, un appel outil
    ou une génération multi-étapes.
    """

    status: ResultStatus

    data: Any = None

    id: UUID = field(default_factory=uuid4)
    request_id: UUID | None = None

    message: str | None = None

    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if isinstance(self.status, str):
            self.status = ResultStatus(self.status)

        self.errors = [
            str(error)
            for error in (self.errors or [])
        ]

        self.warnings = [
            str(warning)
            for warning in (self.warnings or [])
        ]

        self.metadata = dict(self.metadata or {})

    @property
    def success(self) -> bool:
        return self.status == ResultStatus.SUCCESS

    @property
    def failed(self) -> bool:
        return self.status == ResultStatus.FAILED

    @property
    def partial(self) -> bool:
        return self.status == ResultStatus.PARTIAL

    def add_error(self, error: str) -> None:
        error = str(error).strip()

        if error:
            self.errors.append(error)

        if self.status == ResultStatus.SUCCESS:
            self.status = ResultStatus.FAILED

    def add_warning(self, warning: str) -> None:
        warning = str(warning).strip()

        if warning:
            self.warnings.append(warning)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": str(self.id),
            "request_id": (
                str(self.request_id)
                if self.request_id
                else None
            ),
            "status": self.status.value,
            "data": self.data,
            "message": self.message,
            "errors": self.errors,
            "warnings": self.warnings,
            "metadata": self.metadata,
        }

    @classmethod
    def success_result(
        cls,
        data: Any = None,
        *,
        request_id: UUID | None = None,
        message: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> "AIResult":
        return cls(
            status=ResultStatus.SUCCESS,
            data=data,
            request_id=request_id,
            message=message,
            metadata=dict(metadata or {}),
        )

    @classmethod
    def failure_result(
        cls,
        message: str,
        *,
        request_id: UUID | None = None,
        errors: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> "AIResult":
        return cls(
            status=ResultStatus.FAILED,
            request_id=request_id,
            message=message,
            errors=list(errors or [message]),
            metadata=dict(metadata or {}),
        )