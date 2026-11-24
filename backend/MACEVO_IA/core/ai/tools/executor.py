from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from time import perf_counter
from typing import Any, Iterable
from uuid import UUID, uuid4

from core.ai.contracts.result import AIResult
from core.ai.contracts.tool import AITool, ToolExecutionStatus

from .registry import RegisteredTool, ToolRegistry


@dataclass(slots=True)
class ToolExecutionResult:
    """
    Résultat structuré d'une exécution d'outil MACEVO.

    Cette couche est volontairement indépendante du provider IA.
    Elle permet à l'orchestrateur de traiter uniformément les outils
    locaux, scientifiques, mathématiques, documentaires, LaTeX, etc.
    """

    execution_id: UUID = field(default_factory=uuid4)
    tool_name: str = ""
    status: ToolExecutionStatus = ToolExecutionStatus.PENDING

    output: Any = None
    error: str | None = None

    started_at: datetime | None = None
    completed_at: datetime | None = None
    duration_ms: float | None = None

    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.tool_name = str(self.tool_name or "").strip()

        if isinstance(self.status, str):
            self.status = ToolExecutionStatus(self.status.lower())

        self.metadata = dict(self.metadata or {})

    @property
    def success(self) -> bool:
        return self.status == ToolExecutionStatus.COMPLETED

    @property
    def failed(self) -> bool:
        return self.status == ToolExecutionStatus.FAILED

    @property
    def cancelled(self) -> bool:
        return self.status == ToolExecutionStatus.CANCELLED

    @property
    def finished(self) -> bool:
        return self.status in {
            ToolExecutionStatus.COMPLETED,
            ToolExecutionStatus.FAILED,
            ToolExecutionStatus.CANCELLED,
        }

    def to_dict(self) -> dict[str, Any]:
        return {
            "execution_id": str(self.execution_id),
            "tool_name": self.tool_name,
            "status": self.status.value,
            "output": self.output,
            "error": self.error,
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
            "duration_ms": self.duration_ms,
            "metadata": dict(self.metadata),
        }


class ToolExecutor:
    """
    Moteur central d'exécution des outils MACEVO.

    Responsabilités :
    - résoudre un outil depuis ToolRegistry ;
    - vérifier son état ;
    - exécuter avec des arguments structurés ;
    - mesurer la durée ;
    - capturer les erreurs ;
    - produire un résultat uniforme ;
    - permettre une résolution par capacité ;
    - préparer l'intégration future avec l'orchestrateur.

    Le Registry reste responsable de l'enregistrement.
    Le Executor reste responsable de l'exécution.
    """

    def __init__(
        self,
        registry: type[ToolRegistry] = ToolRegistry,
    ) -> None:
        self.registry = registry

    # ------------------------------------------------------------------
    # Résolution
    # ------------------------------------------------------------------

    def resolve(
        self,
        tool_name: str,
    ) -> RegisteredTool | None:
        """
        Retourne un outil enregistré ou None.
        """

        name = self._normalize_name(tool_name)

        if not name:
            return None

        return self.registry.get_or_none(name)

    def resolve_required(
        self,
        tool_name: str,
    ) -> RegisteredTool:
        """
        Retourne un outil ou lève une erreur explicite.
        """

        name = self._normalize_name(tool_name)

        if not name:
            raise ValueError("Le nom de l'outil est obligatoire.")

        tool = self.resolve(name)

        if tool is None:
            raise KeyError(
                f"L'outil '{name}' n'est pas enregistré dans MACEVO."
            )

        return tool

    def resolve_for_capability(
        self,
        capability: str,
    ) -> list[RegisteredTool]:
        """
        Retourne les outils compatibles avec une capacité.
        """

        return self.registry.find_by_capability(capability)

    def resolve_for_capabilities(
        self,
        capabilities: Iterable[str],
    ) -> list[RegisteredTool]:
        """
        Retourne les outils compatibles avec plusieurs capacités.

        Un outil compatible avec au moins une capacité est retenu.
        Les doublons sont supprimés.
        """

        resolved: list[RegisteredTool] = []
        seen: set[str] = set()

        for capability in capabilities:
            capability_name = str(capability or "").strip().lower()

            if not capability_name:
                continue

            for tool in self.resolve_for_capability(capability_name):
                if tool.name in seen:
                    continue

                seen.add(tool.name)
                resolved.append(tool)

        return resolved

    # ------------------------------------------------------------------
    # Exécution
    # ------------------------------------------------------------------

    def execute(
        self,
        tool_name: str,
        *,
        arguments: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> ToolExecutionResult:
        """
        Exécute un outil enregistré.

        Les arguments sont transmis sous forme de dictionnaire :
            executor.execute(
                "calculator",
                arguments={"a": 12, "b": 30},
            )
        """

        name = self._normalize_name(tool_name)

        execution = ToolExecutionResult(
            tool_name=name,
            metadata=dict(metadata or {}),
        )

        execution.metadata.setdefault(
            "executor",
            self.__class__.__name__,
        )

        execution.metadata.setdefault(
            "execution_started",
            datetime.now(timezone.utc).isoformat(),
        )

        try:
            tool = self.resolve_required(name)

            self._validate_registered_tool(tool)

            execution.status = ToolExecutionStatus.RUNNING
            execution.started_at = datetime.now(timezone.utc)

            started = perf_counter()

            result = self.registry.execute(
                name,
                **dict(arguments or {}),
            )

            elapsed = (perf_counter() - started) * 1000.0

            execution.output = result
            execution.status = ToolExecutionStatus.COMPLETED
            execution.completed_at = datetime.now(timezone.utc)
            execution.duration_ms = round(elapsed, 3)

            execution.metadata.update(
                {
                    "tool_enabled": tool.enabled,
                    "tool_version": getattr(tool, "version", "1.0"),
                    "capabilities": list(
                        getattr(tool, "capabilities", [])
                    ),
                }
            )

            return execution

        except Exception as exc:
            execution.status = ToolExecutionStatus.FAILED
            execution.error = str(exc)
            execution.completed_at = datetime.now(timezone.utc)

            if execution.started_at is not None:
                execution.duration_ms = round(
                    (
                        datetime.now(timezone.utc)
                        - execution.started_at
                    ).total_seconds()
                    * 1000.0,
                    3,
                )

            execution.metadata["exception_type"] = type(
                exc
            ).__name__

            return execution

    def execute_required(
        self,
        tool_name: str,
        *,
        arguments: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Any:
        """
        Exécute un outil et retourne directement son résultat.

        Une erreur d'exécution est propagée sous forme d'exception.
        """

        result = self.execute(
            tool_name,
            arguments=arguments,
            metadata=metadata,
        )

        if result.failed:
            raise RuntimeError(
                result.error
                or f"Échec de l'exécution de l'outil '{tool_name}'."
            )

        if result.cancelled:
            raise RuntimeError(
                f"L'exécution de l'outil '{tool_name}' a été annulée."
            )

        return result.output

    def execute_for_capability(
        self,
        capability: str,
        *,
        arguments: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> list[ToolExecutionResult]:
        """
        Exécute tous les outils disponibles pour une capacité.
        """

        results: list[ToolExecutionResult] = []

        for tool in self.resolve_for_capability(capability):
            results.append(
                self.execute(
                    tool.name,
                    arguments=arguments,
                    metadata={
                        **dict(metadata or {}),
                        "resolved_capability": capability,
                    },
                )
            )

        return results

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_registered_tool(
        tool: RegisteredTool,
    ) -> None:
        if not tool.enabled:
            raise RuntimeError(
                f"L'outil '{tool.name}' est désactivé."
            )

        handler = getattr(tool, "handler", None)

        if handler is None or not callable(handler):
            raise RuntimeError(
                f"L'outil '{tool.name}' ne possède pas de handler "
                "exécutable."
            )

    # ------------------------------------------------------------------
    # Compatibilité AITool
    # ------------------------------------------------------------------

    def execute_contract_tool(
        self,
        tool: AITool,
        *,
        arguments: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> ToolExecutionResult:
        """
        Exécute directement un AITool conforme au contrat central.

        Cette méthode permet d'utiliser des AITool qui ne sont pas
        encore enregistrés dans ToolRegistry.
        """

        if not isinstance(tool, AITool):
            raise TypeError(
                "tool doit être une instance de AITool."
            )

        execution = ToolExecutionResult(
            tool_name=tool.name,
            metadata={
                **dict(metadata or {}),
                "executor": self.__class__.__name__,
                "source": "AITool",
            },
        )

        execution.status = ToolExecutionStatus.RUNNING
        execution.started_at = datetime.now(timezone.utc)

        started = perf_counter()

        try:
            output = tool.execute(**dict(arguments or {}))

            execution.output = output
            execution.status = ToolExecutionStatus.COMPLETED

        except Exception as exc:
            execution.status = ToolExecutionStatus.FAILED
            execution.error = str(exc)
            execution.metadata["exception_type"] = type(
                exc
            ).__name__

        finally:
            execution.completed_at = datetime.now(timezone.utc)
            execution.duration_ms = round(
                (perf_counter() - started) * 1000.0,
                3,
            )

        return execution

    # ------------------------------------------------------------------
    # Conversion vers AIResult
    # ------------------------------------------------------------------

    def to_ai_result(
        self,
        execution: ToolExecutionResult,
        *,
        request_id: UUID | str | None = None,
    ) -> AIResult:
        """
        Transforme le résultat technique du ToolExecutor en AIResult.

        Cela permet à l'orchestrateur de manipuler les outils avec
        le même format de résultat que les autres étapes IA.
        """

        request_id_value = (
            str(request_id)
            if request_id is not None
            else None
        )

        metadata = {
            **execution.metadata,
            "tool_execution_id": str(
                execution.execution_id
            ),
            "tool_name": execution.tool_name,
            "duration_ms": execution.duration_ms,
        }

        if execution.success:
            return AIResult.success_result(
                data=execution.output,
                request_id=request_id_value,
                message=(
                    f"Outil '{execution.tool_name}' exécuté "
                    "avec succès."
                ),
                metadata=metadata,
            )

        return AIResult.failure_result(
            message=(
                execution.error
                or f"Échec de l'outil '{execution.tool_name}'."
            ),
            request_id=request_id_value,
            errors=[
                execution.error
                or f"Échec de l'outil '{execution.tool_name}'."
            ],
            metadata=metadata,
        )

    # ------------------------------------------------------------------
    # Utilitaires
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_name(tool_name: str) -> str:
        return str(tool_name or "").strip().lower()

    def describe(self) -> list[dict[str, Any]]:
        """
        Retourne la description de tous les outils enregistrés.
        """

        return self.registry.describe()

    def count(self) -> int:
        return self.registry.count()

    def __repr__(self) -> str:
        return (
            f"<ToolExecutor "
            f"tools={self.count()}>"
        )


__all__ = [
    "ToolExecutionResult",
    "ToolExecutor",
]