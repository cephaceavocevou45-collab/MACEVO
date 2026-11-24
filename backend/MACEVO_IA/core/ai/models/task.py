# analyse document
#        ↓
# création plan
#        ↓
# génération chapitre
#        ↓
# équations
#        ↓
# validation
#        ↓
# LaTeX

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import UUID, uuid4


class TaskStatus(str, Enum):
    PENDING = "pending"
    PLANNED = "planned"
    RUNNING = "running"
    WAITING = "waiting"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskType(str, Enum):
    CHAT = "chat"
    ANALYSIS = "analysis"
    GENERATION = "generation"
    DOCUMENT = "document"
    SCIENTIFIC = "scientific"
    TOOL = "tool"
    VALIDATION = "validation"
    EXPORT = "export"


@dataclass(slots=True)
class AITask:
    """
    Tâche exécutable par l'orchestrateur MACEVO_IA.

    Une tâche peut être autonome ou appartenir à un workflow
    composé de plusieurs étapes.
    """

    task_type: TaskType | str
    name: str

    id: UUID = field(default_factory=uuid4)

    description: str = ""

    status: TaskStatus = TaskStatus.PENDING

    parent_task_id: UUID | None = None

    dependencies: list[UUID] = field(default_factory=list)
    children: list[UUID] = field(default_factory=list)

    input_data: dict[str, Any] = field(default_factory=dict)
    output_data: Any = None

    metadata: dict[str, Any] = field(default_factory=dict)

    error: str | None = None

    created_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    started_at: datetime | None = None
    completed_at: datetime | None = None

    retry_count: int = 0
    max_retries: int = 2

    def __post_init__(self) -> None:
        if isinstance(self.task_type, str):
            self.task_type = TaskType(
                self.task_type.lower()
            )

        if isinstance(self.status, str):
            self.status = TaskStatus(
                self.status.lower()
            )

        self.name = self.name.strip()

        if not self.name:
            raise ValueError(
                "Une tâche doit avoir un nom."
            )

        self.dependencies = list(
            self.dependencies or []
        )

        self.children = list(
            self.children or []
        )

        self.input_data = dict(
            self.input_data or {}
        )

        self.metadata = dict(
            self.metadata or {}
        )

        if self.max_retries < 0:
            raise ValueError(
                "max_retries ne peut pas être négatif."
            )

    @property
    def is_terminal(self) -> bool:
        return self.status in {
            TaskStatus.COMPLETED,
            TaskStatus.FAILED,
            TaskStatus.CANCELLED,
        }

    @property
    def can_retry(self) -> bool:
        return (
            self.status == TaskStatus.FAILED
            and self.retry_count < self.max_retries
        )

    def start(self) -> None:
        if self.is_terminal:
            raise RuntimeError(
                "Une tâche terminée ne peut pas être démarrée."
            )

        self.status = TaskStatus.RUNNING
        self.started_at = datetime.now(timezone.utc)

    def complete(self, output: Any = None) -> None:
        self.status = TaskStatus.COMPLETED
        self.output_data = output
        self.completed_at = datetime.now(timezone.utc)
        self.error = None

    def fail(self, error: str) -> None:
        self.status = TaskStatus.FAILED
        self.error = str(error)
        self.completed_at = datetime.now(timezone.utc)

    def cancel(self, reason: str | None = None) -> None:
        self.status = TaskStatus.CANCELLED
        self.error = reason
        self.completed_at = datetime.now(timezone.utc)

    def retry(self) -> None:
        if not self.can_retry:
            raise RuntimeError(
                "Cette tâche ne peut pas être relancée."
            )

        self.retry_count += 1
        self.status = TaskStatus.PENDING
        self.error = None
        self.completed_at = None

    def add_dependency(self, task_id: UUID) -> None:
        if task_id == self.id:
            raise ValueError(
                "Une tâche ne peut pas dépendre d'elle-même."
            )

        if task_id not in self.dependencies:
            self.dependencies.append(task_id)

    def add_child(self, task_id: UUID) -> None:
        if task_id not in self.children:
            self.children.append(task_id)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": str(self.id),
            "task_type": self.task_type.value,
            "name": self.name,
            "description": self.description,
            "status": self.status.value,
            "parent_task_id": (
                str(self.parent_task_id)
                if self.parent_task_id
                else None
            ),
            "dependencies": [
                str(task_id)
                for task_id in self.dependencies
            ],
            "children": [
                str(task_id)
                for task_id in self.children
            ],
            "input_data": self.input_data,
            "output_data": self.output_data,
            "metadata": self.metadata,
            "error": self.error,
            "created_at": self.created_at.isoformat(),
            "started_at": (
                self.started_at.isoformat()
                if self.started_at
                else None
            ),
            "completed_at": (
                self.completed_at.isoformat()
                if self.completed_at
                else None
            ),
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
        }