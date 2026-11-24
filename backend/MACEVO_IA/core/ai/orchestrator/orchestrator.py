from __future__ import annotations

from typing import Any, Dict, Iterator, Optional
from uuid import uuid4

from core.ai.capabilities.resolver import CapabilityResolver
from core.ai.context.engine import ContextEngine
from core.ai.contracts.message import AIMessage, MessageRole
from core.ai.contracts.request import AIRequest
from core.ai.contracts.result import AIResult, ResultStatus
from core.ai.orchestrator.executor import TaskExecutor
from core.ai.orchestrator.planner import TaskPlan, TaskPlanner
from core.ai.orchestrator.runner import WorkflowRunner
from core.ai.tools.executor import ToolExecutor


class AIOrchestrator:
    """
    Orchestrateur central de MACEVO IA.

    Architecture :

        AIRequest
            ↓
        Conversation
            ↓
        ContextEngine
            ↓
        CapabilityResolver
            ↓
        TaskPlanner
            ↓
        WorkflowRunner
            ↓
        TaskExecutor
            ├── tâches IA → ModelRouter → Provider
            └── tâches TOOL → ToolExecutor → ToolRegistry
            ↓
        Résultats
            ↓
        Validation
            ↓
        Persistance
            ↓
        AIResult
    """

    def __init__(
        self,
        *,
        context_engine: Optional[ContextEngine] = None,
        capability_resolver: Optional[CapabilityResolver] = None,
        planner: Optional[TaskPlanner] = None,
        executor: Optional[TaskExecutor] = None,
        runner: Optional[WorkflowRunner] = None,
        tool_executor: Optional[ToolExecutor] = None,
    ) -> None:

        self.context_engine = (
            context_engine
            or ContextEngine()
        )

        self.capability_resolver = (
            capability_resolver
            or CapabilityResolver()
        )

        self.planner = (
            planner
            or TaskPlanner(
                capability_resolver=self.capability_resolver
            )
        )

        self.tool_executor = (
            tool_executor
            or ToolExecutor()
        )

        self.executor = (
            executor
            or TaskExecutor(
                tool_executor=self.tool_executor
            )
        )

        self.runner = (
            runner
            or WorkflowRunner(
                executor=self.executor
            )
        )

    # ==================================================================
    # EXECUTION PRINCIPALE
    # ==================================================================

    def execute(
        self,
        request: AIRequest,
    ) -> AIResult:

        if not isinstance(
            request,
            AIRequest,
        ):
            return AIResult.failure_result(
                message="La requête IA est invalide.",
                errors=[
                    "request doit être une instance de AIRequest."
                ],
            )

        try:
            request.validate()

            conversation_id = (
                self._resolve_conversation(
                    request
                )
            )

            context = self.context_engine.build_context(
                request
            )

            capabilities = (
                self.capability_resolver.resolve(
                    request
                )
            )

            plan = self.planner.plan(
                request
            )

            execution_context: Dict[str, Any] = {
                "request": request,
                "context": context,
                "capabilities": capabilities,
                "plan": plan,
                "results": {},
                "previous_results": {},
                "tool_results": {},
                "execution_order": [],
                "conversation_id": conversation_id,
                "tool_executor": self.tool_executor,
            }

            self.runner.run(
                plan,
                execution_context,
            )

            result = self._build_final_result(
                request=request,
                plan=plan,
                execution_context=execution_context,
            )

            self._persist_conversation(
                request,
                result,
            )

            return result

        except Exception as exc:
            return AIResult.failure_result(
                message="L'exécution de la requête IA a échoué.",
                errors=[str(exc)],
                request_id=str(request.id),
                metadata={
                    "conversation_id": (
                        str(request.conversation_id)
                        if request.conversation_id
                        else None
                    )
                },
            )

    # ==================================================================
    # EXECUTION STREAMING
    # ==================================================================

    def execute_stream(
        self,
        request: AIRequest,
    ) -> Iterator[Dict[str, Any]]:

        if not isinstance(
            request,
            AIRequest,
        ):
            yield {
                "type": "error",
                "error": (
                    "request doit être une instance de AIRequest."
                ),
            }
            return

        try:
            request.validate()

            if not request.stream:
                raise ValueError(
                    "La requête doit avoir stream=True."
                )

            conversation_id = (
                self._resolve_conversation(
                    request
                )
            )

            context = self.context_engine.build_context(
                request
            )

            capabilities = (
                self.capability_resolver.resolve(
                    request
                )
            )

            plan = self.planner.plan(
                request
            )

            execution_context: Dict[str, Any] = {
                "request": request,
                "context": context,
                "capabilities": capabilities,
                "plan": plan,
                "results": {},
                "previous_results": {},
                "tool_results": {},
                "execution_order": [],
                "conversation_id": conversation_id,
                "streaming": True,
                "tool_executor": self.tool_executor,
            }

            yield {
                "type": "start",
                "request_id": str(request.id),
                "conversation_id": conversation_id,
                "status": "streaming",
            }

            task = self._resolve_stream_task(
                plan
            )

            if task is None:
                raise RuntimeError(
                    "Aucune tâche de génération compatible "
                    "avec le streaming n'a été trouvée dans le plan."
                )

            prerequisite_tasks = (
                self._resolve_stream_prerequisites(
                    plan,
                    task,
                )
            )

            execution_context[
                "stream_prerequisite_tasks"
            ] = prerequisite_tasks

            for prerequisite in prerequisite_tasks:

                execution_context[
                    "current_task"
                ] = prerequisite

                yield {
                    "type": "task_start",
                    "task_id": str(prerequisite.id),
                    "task_name": prerequisite.name,
                    "task_type": self._task_type_value(
                        prerequisite
                    ),
                    "streamed": False,
                }

                result = self.executor.execute(
                    prerequisite,
                    execution_context,
                )

                normalized_result = (
                    self._normalize_task_result(
                        result
                    )
                )

                execution_context[
                    "results"
                ][prerequisite.id] = normalized_result

                execution_context[
                    "previous_results"
                ][str(prerequisite.id)] = (
                    normalized_result
                )

                execution_context[
                    "execution_order"
                ].append(
                    prerequisite.id
                )

                if (
                    isinstance(
                        normalized_result,
                        AIResult,
                    )
                    and normalized_result.failed
                ):
                    yield {
                        "type": "task_error",
                        "task_id": str(
                            prerequisite.id
                        ),
                        "task_name": prerequisite.name,
                        "error": (
                            self._extract_result_error(
                                normalized_result
                            )
                            or "La tâche a échoué."
                        ),
                    }

                    raise RuntimeError(
                        f"La tâche préalable "
                        f"'{prerequisite.name}' a échoué."
                    )

                yield {
                    "type": "task_done",
                    "task_id": str(
                        prerequisite.id
                    ),
                    "task_name": prerequisite.name,
                    "task_type": self._task_type_value(
                        prerequisite
                    ),
                    "streamed": False,
                }

            execution_context[
                "current_task"
            ] = task

            execution_context[
                "streaming_task"
            ] = task

            missing_dependencies = (
                self._find_missing_dependency_results(
                    task,
                    execution_context,
                )
            )

            if missing_dependencies:

                dependency_names = [
                    dependency.name
                    for dependency in missing_dependencies
                ]

                raise RuntimeError(
                    "Des dépendances de la tâche "
                    f"'{task.name}' n'ont pas produit de résultat : "
                    + ", ".join(
                        dependency_names
                    )
                )

            stream_method = getattr(
                self.executor,
                "stream_task",
                None,
            )

            if not callable(stream_method):
                raise RuntimeError(
                    "TaskExecutor.stream_task() n'est pas disponible."
                )

            accumulated_content = ""
            final_metadata: Dict[str, Any] = {}

            for event in stream_method(
                task,
                execution_context,
            ):

                normalized_event = (
                    self._normalize_stream_event(
                        event
                    )
                )

                event_type = normalized_event.get(
                    "type"
                )

                if event_type == "content":

                    content = normalized_event.get(
                        "content",
                        "",
                    )

                    if isinstance(
                        content,
                        str,
                    ):
                        accumulated_content += content

                usage = normalized_event.get(
                    "usage"
                )

                if isinstance(
                    usage,
                    dict,
                ):
                    final_metadata[
                        "usage"
                    ] = usage

                provider = normalized_event.get(
                    "provider"
                )

                if provider:
                    final_metadata[
                        "provider"
                    ] = provider

                model = normalized_event.get(
                    "model"
                )

                if model:
                    final_metadata[
                        "model"
                    ] = model

                yield normalized_event

                if event_type == "error":
                    return

            final_content = (
                accumulated_content.strip()
            )

            final_result = AIResult.success_result(
                data=final_content,
                request_id=str(request.id),
                message=(
                    final_content
                    or "Exécution IA terminée."
                ),
                metadata={
                    "conversation_id": conversation_id,
                    "streaming": True,
                    "streaming_task": task.name,
                    "executed_prerequisites": [
                        prerequisite.name
                        for prerequisite in prerequisite_tasks
                    ],
                    **final_metadata,
                },
            )

            execution_context[
                "results"
            ][task.id] = final_result

            execution_context[
                "previous_results"
            ][str(task.id)] = final_result

            if task.id not in execution_context[
                "execution_order"
            ]:
                execution_context[
                    "execution_order"
                ].append(
                    task.id
                )

            self._persist_conversation(
                request,
                final_result,
            )

            yield {
                "type": "done",
                "request_id": str(request.id),
                "conversation_id": conversation_id,
                "task_id": str(task.id),
                "task_name": task.name,
                "content": accumulated_content,
                "provider": final_metadata.get(
                    "provider"
                ),
                "model": final_metadata.get(
                    "model"
                ),
                "usage": final_metadata.get(
                    "usage"
                ),
                "executed_prerequisites": [
                    prerequisite.name
                    for prerequisite in prerequisite_tasks
                ],
                "status": "completed",
            }

        except Exception as exc:

            yield {
                "type": "error",
                "request_id": str(request.id),
                "error": str(exc),
                "status": "failed",
            }

    # ==================================================================
    # RESOLUTION TÂCHE STREAMABLE
    # ==================================================================

    def _resolve_stream_task(
        self,
        plan: TaskPlan,
    ) -> Any:

        preferred_names = (
            "generate_response",
            "generation",
            "scientific_analysis",
            "equation_generation",
            "figure_generation",
            "table_generation",
            "bibliography_generation",
            "latex_generation",
        )

        for preferred_name in preferred_names:

            for task in plan.tasks:

                if task.name == preferred_name:
                    return task

        generation_types = {
            "generation",
            "scientific",
            "document",
            "analysis",
        }

        for task in reversed(plan.tasks):

            task_type = self._task_type_value(
                task
            )

            if task_type in generation_types:
                return task

        return None

    # ==================================================================
    # DÉPENDANCES STREAMING
    # ==================================================================

    def _resolve_stream_prerequisites(
        self,
        plan: TaskPlan,
        target_task: Any,
    ) -> list[Any]:

        task_by_id: Dict[str, Any] = {
            str(task.id): task
            for task in plan.tasks
        }

        ordered: list[Any] = []
        visited: set[str] = set()
        visiting: set[str] = set()

        def visit(task: Any) -> None:

            task_id = str(task.id)

            if task_id in visited:
                return

            if task_id in visiting:
                raise RuntimeError(
                    "Cycle de dépendances détecté dans le workflow "
                    f"autour de la tâche '{task.name}'."
                )

            visiting.add(task_id)

            dependencies = list(
                getattr(
                    task,
                    "dependencies",
                    [],
                )
                or []
            )

            for dependency_id in dependencies:

                dependency = task_by_id.get(
                    str(dependency_id)
                )

                if dependency is None:
                    raise RuntimeError(
                        f"La dépendance {dependency_id} "
                        f"de la tâche '{task.name}' "
                        "n'existe pas dans le plan."
                    )

                visit(dependency)

            visiting.remove(task_id)
            visited.add(task_id)

            if task_id != str(target_task.id):
                ordered.append(task)

        visit(target_task)

        return ordered

    # ==================================================================
    # VÉRIFICATION DÉPENDANCES
    # ==================================================================

    def _find_missing_dependency_results(
        self,
        task: Any,
        execution_context: Dict[str, Any],
    ) -> list[Any]:

        results = execution_context.get(
            "results",
            {},
        )

        plan = execution_context.get(
            "plan"
        )

        if plan is None:
            return []

        task_by_id = {
            str(candidate.id): candidate
            for candidate in plan.tasks
        }

        missing: list[Any] = []

        for dependency_id in (
            getattr(
                task,
                "dependencies",
                [],
            )
            or []
        ):

            dependency = task_by_id.get(
                str(dependency_id)
            )

            if dependency is None:
                missing.append(task)
                continue

            result = results.get(
                dependency.id
            )

            if result is None:
                result = results.get(
                    str(dependency.id)
                )

            if result is None:
                missing.append(dependency)
                continue

            if (
                isinstance(
                    result,
                    AIResult,
                )
                and result.failed
            ):
                missing.append(dependency)

        return missing

    # ==================================================================
    # NORMALISATION
    # ==================================================================

    def _normalize_task_result(
        self,
        result: Any,
    ) -> Any:

        if isinstance(
            result,
            AIResult,
        ):
            return result

        if isinstance(
            result,
            Exception,
        ):
            return AIResult.failure_result(
                message="La tâche a échoué.",
                errors=[str(result)],
            )

        if result is None:
            return AIResult.success_result(
                data=None,
                message="Tâche terminée.",
            )

        return result

    def _normalize_stream_event(
        self,
        event: Any,
    ) -> Dict[str, Any]:

        if event is None:
            return {
                "type": "content",
                "content": "",
            }

        if isinstance(
            event,
            str,
        ):
            return {
                "type": "content",
                "content": event,
            }

        if not isinstance(
            event,
            dict,
        ):
            return {
                "type": "content",
                "content": str(event),
            }

        normalized = dict(event)

        event_type = normalized.get(
            "type"
        )

        if event_type == "error":

            normalized["type"] = "error"

            normalized.setdefault(
                "error",
                normalized.get(
                    "message",
                    "Erreur de streaming.",
                ),
            )

            return normalized

        if (
            event_type == "tool_call"
            or "tool_call" in normalized
            or "tool_calls" in normalized
        ):

            normalized["type"] = "tool_call"

            return normalized

        if event_type in {
            "task_start",
            "task_done",
            "task_error",
        }:

            normalized["type"] = event_type

            return normalized

        if (
            event_type == "done"
            or normalized.get("done") is True
        ):

            normalized["type"] = "done"

            normalized.setdefault(
                "content",
                "",
            )

            return normalized

        thinking = normalized.get(
            "thinking"
        )

        if (
            isinstance(
                thinking,
                str,
            )
            and thinking
            and not normalized.get("content")
        ):

            normalized["type"] = "thinking"

            return normalized

        if "content" in normalized:

            normalized["type"] = "content"

            if normalized["content"] is None:
                normalized["content"] = ""

            if not isinstance(
                normalized["content"],
                str,
            ):
                normalized["content"] = str(
                    normalized["content"]
                )

            return normalized

        for key in (
            "text",
            "response",
            "message",
        ):

            value = normalized.get(
                key
            )

            if isinstance(
                value,
                str,
            ):

                return {
                    **normalized,
                    "type": "content",
                    "content": value,
                }

        normalized.setdefault(
            "type",
            "content",
        )

        normalized.setdefault(
            "content",
            "",
        )

        return normalized

    # ==================================================================
    # UTILITAIRES TÂCHES
    # ==================================================================

    @staticmethod
    def _task_type_value(
        task: Any,
    ) -> str:

        task_type = getattr(
            task,
            "task_type",
            "",
        )

        return str(
            getattr(
                task_type,
                "value",
                task_type,
            )
        )

    # ==================================================================
    # CONVERSATION
    # ==================================================================

    def _resolve_conversation(
        self,
        request: AIRequest,
    ) -> str:

        conversation_id = (
            str(
                request.conversation_id
            ).strip()
            if request.conversation_id
            else ""
        )

        if not conversation_id:

            conversation_id = str(
                uuid4()
            )

            request.conversation_id = (
                conversation_id
            )

        self.context_engine.ensure_conversation(
            conversation_id=conversation_id,
            user_id=request.user_id,
            model=request.model,
            provider=request.provider,
        )

        return conversation_id

    # ==================================================================
    # RUNNER
    # ==================================================================

    def _execute_plan(
        self,
        plan: TaskPlan,
        execution_context: Dict[str, Any],
    ) -> None:

        self.runner.run(
            plan,
            execution_context,
        )

    # ==================================================================
    # RESULTAT FINAL
    # ==================================================================

    def _build_final_result(
        self,
        *,
        request: AIRequest,
        plan: TaskPlan,
        execution_context: Dict[str, Any],
    ) -> AIResult:

        results = execution_context.get(
            "results",
            {},
        )

        errors = self._collect_task_errors(
            plan
        )

        cancellations = (
            self._collect_task_cancellations(
                plan
            )
        )

        if cancellations:
            errors.extend(cancellations)

        content = self._extract_assistant_content(
            plan,
            results,
        )

        serialized_results = (
            self._serialize_results(
                results
            )
        )

        metadata = {
            "conversation_id": (
                str(
                    request.conversation_id
                )
                if request.conversation_id
                else None
            ),
            "plan": plan.to_dict(),
            "results": serialized_results,
            "tool_results": execution_context.get(
                "tool_results",
                {},
            ),
            "execution_order": [
                str(task_id)
                for task_id in execution_context.get(
                    "execution_order",
                    [],
                )
            ],
        }

        if plan.has_failed_tasks():

            return AIResult.failure_result(
                message=(
                    "Le workflow IA a échoué "
                    "pendant son exécution."
                ),
                errors=errors or [
                    "Une ou plusieurs tâches ont échoué."
                ],
                request_id=str(request.id),
                metadata=metadata,
            )

        if plan.has_cancelled_tasks():

            return AIResult(
                status=ResultStatus.CANCELLED,
                data=content,
                request_id=str(request.id),
                message="Le workflow IA a été annulé.",
                errors=errors,
                metadata=metadata,
            )

        return AIResult.success_result(
            data=content,
            request_id=str(request.id),
            message=(
                content
                if content
                else "Exécution IA terminée."
            ),
            metadata=metadata,
        )

    # ==================================================================
    # EXTRACTION
    # ==================================================================

    def _extract_assistant_content(
        self,
        plan: TaskPlan,
        results: Dict[Any, Any],
    ) -> str:

        ordered_tasks = list(
            reversed(plan.tasks)
        )

        for task in ordered_tasks:

            task_result = results.get(
                task.id
            )

            if task_result is None:
                task_result = results.get(
                    str(task.id)
                )

            if task_result is None:
                continue

            content = (
                self._extract_content_from_result(
                    task_result
                )
            )

            if content:
                return content

        return ""

    def _extract_content_from_result(
        self,
        result: Any,
    ) -> str:

        if result is None:
            return ""

        if isinstance(
            result,
            AIResult,
        ):

            if result.data is not None:

                data = result.data

                if isinstance(
                    data,
                    str,
                ):
                    return data.strip()

                if isinstance(
                    data,
                    dict,
                ):

                    for key in (
                        "content",
                        "text",
                        "message",
                        "response",
                    ):

                        value = data.get(
                            key
                        )

                        if isinstance(
                            value,
                            str,
                        ):
                            return value.strip()

                if isinstance(
                    data,
                    AIMessage,
                ):
                    return data.content.strip()

            if result.message:
                return str(
                    result.message
                ).strip()

            return ""

        if isinstance(
            result,
            AIMessage,
        ):
            return result.content.strip()

        if isinstance(
            result,
            str,
        ):
            return result.strip()

        if isinstance(
            result,
            dict,
        ):

            for key in (
                "content",
                "text",
                "message",
                "response",
            ):

                value = result.get(
                    key
                )

                if isinstance(
                    value,
                    str,
                ):
                    return value.strip()

        return ""

    # ==================================================================
    # ERREURS
    # ==================================================================

    def _extract_result_error(
        self,
        result: Any,
    ) -> Optional[str]:

        if result is None:
            return None

        if isinstance(
            result,
            AIResult,
        ):

            if result.errors:
                return "; ".join(
                    str(error)
                    for error in result.errors
                )

            if result.failed:
                return (
                    result.message
                    or "La tâche a échoué."
                )

            return None

        if isinstance(
            result,
            Exception,
        ):
            return str(result)

        return None

    def _collect_task_errors(
        self,
        plan: TaskPlan,
    ) -> list[str]:

        errors: list[str] = []

        for task in plan.failed_tasks():

            if task.error:
                errors.append(
                    f"{task.name}: {task.error}"
                )
            else:
                errors.append(
                    f"{task.name}: échec inconnu."
                )

        return errors

    def _collect_task_cancellations(
        self,
        plan: TaskPlan,
    ) -> list[str]:

        cancellations: list[str] = []

        for task in plan.cancelled_tasks():

            if task.error:
                cancellations.append(
                    f"{task.name}: {task.error}"
                )

        return cancellations

    # ==================================================================
    # SERIALISATION
    # ==================================================================

    def _serialize_results(
        self,
        results: Dict[Any, Any],
    ) -> Dict[str, Any]:

        serialized: Dict[str, Any] = {}

        for task_id, result in results.items():

            serialized[str(task_id)] = (
                self._serialize_value(
                    result
                )
            )

        return serialized

    def _serialize_value(
        self,
        value: Any,
    ) -> Any:

        if value is None:
            return None

        if isinstance(
            value,
            AIResult,
        ):
            return value.to_dict()

        if isinstance(
            value,
            AIMessage,
        ):
            return value.to_dict()

        if hasattr(
            value,
            "to_dict",
        ):

            try:
                return value.to_dict()
            except Exception:
                pass

        if isinstance(
            value,
            dict,
        ):

            return {
                str(key): self._serialize_value(
                    item
                )
                for key, item in value.items()
            }

        if isinstance(
            value,
            (
                list,
                tuple,
                set,
            ),
        ):

            return [
                self._serialize_value(
                    item
                )
                for item in value
            ]

        if hasattr(
            value,
            "value",
        ):

            try:
                return value.value
            except Exception:
                pass

        if hasattr(
            value,
            "isoformat",
        ):

            try:
                return value.isoformat()
            except Exception:
                pass

        return value

    # ==================================================================
    # PERSISTANCE
    # ==================================================================

    def _persist_conversation(
        self,
        request: AIRequest,
        result: AIResult,
    ) -> None:

        conversation_id = (
            request.conversation_id
        )

        if not conversation_id:
            return

        try:

            self.context_engine.ensure_conversation(
                conversation_id=conversation_id,
                user_id=request.user_id,
                model=request.model,
                provider=request.provider,
            )

            user_message = request.user_message

            if user_message is not None:

                self.context_engine.add_message(
                    conversation_id=conversation_id,
                    message=user_message,
                )

            content = (
                self._extract_content_from_result(
                    result
                )
            )

            if content:

                assistant_message = AIMessage(
                    role=MessageRole.ASSISTANT,
                    content=content,
                    metadata={
                        "request_id": str(
                            request.id
                        ),
                        "status": (
                            result.status.value
                            if hasattr(
                                result.status,
                                "value",
                            )
                            else str(
                                result.status
                            )
                        ),
                        "provider": request.provider,
                        "model": request.model,
                    },
                )

                self.context_engine.add_message(
                    conversation_id=conversation_id,
                    message=assistant_message,
                )

        except Exception:
            return

    # ==================================================================
    # CONTEXTE PUBLIC
    # ==================================================================

    def build_context(
        self,
        request: AIRequest,
    ) -> Any:

        if not isinstance(
            request,
            AIRequest,
        ):
            raise TypeError(
                "request doit être une instance de AIRequest."
            )

        return self.context_engine.build_context(
            request
        )

    # ==================================================================
    # REPRESENTATION
    # ==================================================================

    def __repr__(self) -> str:

        return (
            "AIOrchestrator("
            f"context_engine={self.context_engine!r}, "
            f"capability_resolver={self.capability_resolver!r}, "
            f"planner={self.planner!r}, "
            f"executor={self.executor!r}, "
            f"tool_executor={self.tool_executor!r}, "
            f"runner={self.runner!r}"
            ")"
        )