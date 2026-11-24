from __future__ import annotations

from typing import Any, Dict, Iterable, Iterator, Optional

from core.ai.contracts.request import AIRequest
from core.ai.contracts.response import AIResponse
from core.ai.contracts.result import AIResult
from core.ai.models.task import AITask
from core.ai.routing.router import ModelRouter
from core.ai.tools.executor import ToolExecutor


class TaskExecutor:
    """
    Exécuteur central des tâches IA de MACEVO.

    Deux familles de tâches sont distinguées :

    1. Tâches IA
       → ModelRouter
       → Provider
       → génération / streaming

    2. Tâches TOOL
       → ToolExecutor
       → ToolRegistry
       → outil réel

    Cette séparation évite de mélanger la logique des providers IA
    avec celle des outils locaux ou scientifiques.
    """

    def __init__(
        self,
        router: Optional[ModelRouter] = None,
        tool_executor: Optional[ToolExecutor] = None,
    ):
        self.router = router or ModelRouter()
        self.tool_executor = tool_executor or ToolExecutor()

    # ------------------------------------------------------------------
    # EXECUTION PRINCIPALE
    # ------------------------------------------------------------------

    def execute(
        self,
        task: AITask,
        execution_context: Optional[Dict[str, Any]] = None,
    ) -> AIResult:
        """
        Exécute une tâche planifiée.

        Les tâches de type TOOL sont automatiquement dirigées vers
        ToolExecutor.

        Les autres tâches utilisent le dispatch IA classique.
        """

        execution_context = execution_context or {}

        if not isinstance(task, AITask):
            return AIResult.failure_result(
                message="La tâche fournie est invalide.",
                errors=[
                    "task doit être une instance de AITask."
                ],
            )

        if task.is_terminal:
            return AIResult.failure_result(
                message="La tâche est déjà terminée.",
                errors=[
                    f"La tâche '{task.id}' possède déjà le statut "
                    f"'{task.status.value}'."
                ],
            )

        try:
            task.start()

            handler = self._resolve_handler(task)

            result = handler(
                task,
                execution_context,
            )

            if not isinstance(result, AIResult):
                result = AIResult.success_result(
                    data=result,
                    request_id=self._request_id(
                        execution_context
                    ),
                )

            if result.failed:
                task.fail(
                    "; ".join(result.errors)
                    if result.errors
                    else (
                        result.message
                        or "La tâche a échoué."
                    )
                )
            else:
                task.complete(
                    result.to_dict()
                )

            return result

        except Exception as exc:
            try:
                task.fail(str(exc))
            except Exception:
                pass

            return AIResult.failure_result(
                message="L'exécution de la tâche a échoué.",
                request_id=self._request_id(
                    execution_context
                ),
                errors=[str(exc)],
                metadata={
                    "task_id": str(task.id),
                    "task_name": task.name,
                    "task_type": task.task_type.value,
                },
            )

    # ------------------------------------------------------------------
    # HANDLER RESOLUTION
    # ------------------------------------------------------------------

    def _resolve_handler(self, task: AITask):
        """
        Résout le handler réel d'une tâche.

        Priorité :

        1. tâche TOOL
        2. nom fonctionnel
        3. TaskType
        4. fallback
        """

        # --------------------------------------------------------------
        # OUTIL
        # --------------------------------------------------------------

        if self._is_tool_task(task):
            return self._execute_tool

        # --------------------------------------------------------------
        # NOM FONCTIONNEL
        # --------------------------------------------------------------

        task_name = str(
            getattr(task, "name", "") or ""
        ).strip()

        if task_name:
            handler_name = f"_execute_{task_name}"

            handler = getattr(
                self,
                handler_name,
                None,
            )

            if handler is not None:
                return handler

        # --------------------------------------------------------------
        # TYPE GÉNÉRIQUE
        # --------------------------------------------------------------

        task_type = getattr(
            task,
            "task_type",
            None,
        )

        if task_type is not None:
            type_name = getattr(
                task_type,
                "value",
                str(task_type),
            )

            handler_name = f"_execute_{type_name}"

            handler = getattr(
                self,
                handler_name,
                None,
            )

            if handler is not None:
                return handler

        return self._execute_fallback

    # ------------------------------------------------------------------
    # TOOL TASK DETECTION
    # ------------------------------------------------------------------

    @staticmethod
    def _is_tool_task(
        task: AITask,
    ) -> bool:
        """
        Détermine si une tâche doit être exécutée comme un outil.
        """

        task_type = getattr(
            task,
            "task_type",
            None,
        )

        type_value = getattr(
            task_type,
            "value",
            task_type,
        )

        if str(type_value).lower() == "tool":
            return True

        task_name = str(
            getattr(task, "name", "") or ""
        ).strip().lower()

        return (
            task_name.startswith("tool:")
            or task_name.startswith("tool_")
        )

    # ------------------------------------------------------------------
    # TOOL EXECUTION
    # ------------------------------------------------------------------

    def _execute_tool(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:
        """
        Exécute une tâche TOOL via ToolExecutor.

        Format recommandé de task.input_data :

        {
            "tool_name": "calculator",
            "arguments": {
                "a": 12,
                "b": 30
            }
        }

        Le nom peut également être fourni sous la forme :

        {
            "tool": "calculator"
        }
        """

        input_data = dict(
            getattr(task, "input_data", {})
            or {}
        )

        tool_name = (
            input_data.get("tool_name")
            or input_data.get("tool")
        )

        if not tool_name:
            # Compatibilité avec les tâches nommées tool:calculator
            task_name = str(
                getattr(task, "name", "") or ""
            ).strip()

            if task_name.lower().startswith("tool:"):
                tool_name = task_name.split(
                    ":",
                    1,
                )[1].strip()

            elif task_name.lower().startswith("tool_"):
                tool_name = task_name[5:].strip()

        if not tool_name:
            return AIResult.failure_result(
                message="Aucun outil n'a été spécifié.",
                request_id=self._request_id(
                    execution_context
                ),
                errors=[
                    "task.input_data doit contenir "
                    "'tool_name' ou 'tool'."
                ],
                metadata={
                    "task_id": str(task.id),
                    "task_name": task.name,
                    "task_type": task.task_type.value,
                },
            )

        arguments = input_data.get(
            "arguments",
            input_data.get(
                "kwargs",
                {},
            ),
        )

        if arguments is None:
            arguments = {}

        if not isinstance(arguments, dict):
            return AIResult.failure_result(
                message="Les arguments de l'outil sont invalides.",
                request_id=self._request_id(
                    execution_context
                ),
                errors=[
                    "Les arguments doivent être un dictionnaire."
                ],
                metadata={
                    "tool_name": str(tool_name),
                    "task_id": str(task.id),
                },
            )

        tool_metadata = {
            "task_id": str(task.id),
            "task_name": task.name,
            "task_type": task.task_type.value,
            "source": "TaskExecutor",
        }

        result = self.tool_executor.execute(
            str(tool_name),
            arguments=arguments,
            metadata=tool_metadata,
        )

        ai_result = self.tool_executor.to_ai_result(
            result,
            request_id=self._request_id(
                execution_context
            ),
        )

        # --------------------------------------------------------------
        # CONTEXTE
        # --------------------------------------------------------------

        execution_context.setdefault(
            "tool_results",
            {},
        )[str(task.id)] = result.to_dict()

        return ai_result

    # ------------------------------------------------------------------
    # STREAMING DIRECT - COMPATIBILITÉ
    # ------------------------------------------------------------------

    def stream(
        self,
        request: AIRequest,
        context: Any = None,
    ) -> Iterable[Dict[str, Any]]:
        """
        Ancienne interface de streaming conservée pour compatibilité.
        """

        if not isinstance(request, AIRequest):
            yield {
                "type": "error",
                "error": "La requête IA est invalide.",
            }
            return

        try:
            request.validate()

            if not request.stream:
                raise ValueError(
                    "La requête doit avoir stream=True."
                )

            decision = self.router.route(
                request
            )

            provider = self.router.create_provider(
                decision
            )

            messages = self._build_provider_messages(
                request,
                context,
            )

            for chunk in provider.stream(
                messages=messages,
                model=decision.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                tools=request.tools or None,
            ):
                event = self._normalize_stream_chunk(
                    chunk
                )

                if event is not None:
                    yield event

        except Exception as exc:
            yield {
                "type": "error",
                "error": str(exc),
            }

    # ------------------------------------------------------------------
    # STREAMING D'UNE TACHE
    # ------------------------------------------------------------------

    def stream_task(
        self,
        task: AITask,
        execution_context: Optional[Dict[str, Any]] = None,
    ) -> Iterator[Dict[str, Any]]:
        """
        Exécute une tâche IA en streaming.

        Les tâches TOOL ne sont volontairement pas streamées par cette
        méthode. Elles doivent passer par execute() et ToolExecutor.
        """

        execution_context = (
            execution_context or {}
        )

        if self._is_tool_task(task):
            yield {
                "type": "error",
                "task_id": str(task.id),
                "task_name": task.name,
                "error": (
                    "Une tâche TOOL ne peut pas être exécutée "
                    "avec stream_task(). Utilisez execute()."
                ),
            }
            return

        if not isinstance(task, AITask):
            yield {
                "type": "error",
                "error": (
                    "task doit être une instance de AITask."
                ),
            }
            return

        if task.is_terminal:
            yield {
                "type": "error",
                "error": (
                    f"La tâche '{task.id}' est déjà terminée "
                    f"avec le statut '{task.status.value}'."
                ),
            }
            return

        request = execution_context.get(
            "request"
        )

        context = execution_context.get(
            "context"
        )

        if not isinstance(request, AIRequest):
            try:
                task.fail(
                    "AIRequest absent du contexte d'exécution."
                )
            except Exception:
                pass

            yield {
                "type": "error",
                "error": (
                    "AIRequest absent du contexte d'exécution."
                ),
            }
            return

        if not request.stream:
            try:
                task.fail(
                    "La requête n'est pas configurée en streaming."
                )
            except Exception:
                pass

            yield {
                "type": "error",
                "error": (
                    "La requête doit avoir stream=True."
                ),
            }
            return

        accumulated_content = ""
        accumulated_thinking = ""
        usage: Dict[str, Any] = {}
        provider_name: Optional[str] = None
        model_name: Optional[str] = None
        tool_calls: list[Any] = []

        try:
            request.validate()

            task.start()

            decision = self.router.route(
                request
            )

            provider = self.router.create_provider(
                decision
            )

            provider_name = decision.provider
            model_name = decision.model

            messages = self._build_provider_messages(
                request,
                context,
            )

            task_name = str(
                getattr(task, "name", "")
                or "generation"
            ).strip()

            prompt = self._build_task_prompt(
                task,
                request,
                execution_context,
                task_name,
            )

            if prompt:
                messages = list(messages)

                messages.append(
                    {
                        "role": "user",
                        "content": prompt,
                    }
                )

            yield {
                "type": "task_start",
                "task_id": str(task.id),
                "task_name": task.name,
                "task_type": task.task_type.value,
                "provider": provider_name,
                "model": model_name,
            }

            for chunk in provider.stream(
                messages=messages,
                model=model_name,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                tools=request.tools or None,
            ):
                event = self._normalize_stream_chunk(
                    chunk
                )

                if event is None:
                    continue

                if event.get("type") == "content":
                    content = event.get(
                        "content",
                        "",
                    )

                    if isinstance(
                        content,
                        str,
                    ):
                        accumulated_content += content

                elif event.get("type") == "thinking":
                    thinking = event.get(
                        "thinking",
                        "",
                    )

                    if isinstance(
                        thinking,
                        str,
                    ):
                        accumulated_thinking += thinking

                if event.get("type") == "tool_call":
                    if event.get("tool_calls"):
                        tool_calls.extend(
                            event["tool_calls"]
                        )
                    elif event.get("tool_call"):
                        tool_calls.append(
                            event["tool_call"]
                        )

                event_usage = event.get(
                    "usage"
                )

                if isinstance(
                    event_usage,
                    dict,
                ):
                    usage.update(
                        event_usage
                    )

                if event.get("provider"):
                    provider_name = event[
                        "provider"
                    ]

                if event.get("model"):
                    model_name = event[
                        "model"
                    ]

                yield event

                if event.get("type") == "error":
                    raise RuntimeError(
                        str(
                            event.get(
                                "error",
                                "Erreur du provider.",
                            )
                        )
                    )

            result_metadata: Dict[str, Any] = {
                "provider": provider_name,
                "model": model_name,
                "task_id": str(task.id),
                "task_name": task.name,
                "task_type": task.task_type.value,
                "execution": "provider_stream",
                "streaming": True,
            }

            if usage:
                result_metadata["usage"] = usage

            if accumulated_thinking:
                result_metadata["thinking"] = (
                    accumulated_thinking
                )

            result_data: Dict[str, Any] = {
                "content": accumulated_content,
                "task": task_name,
                "provider": provider_name,
                "model": model_name,
            }

            if usage:
                result_data["usage"] = usage

            if accumulated_thinking:
                result_data["thinking"] = (
                    accumulated_thinking
                )

            if tool_calls:
                result_data["tool_calls"] = tool_calls

            result = AIResult.success_result(
                data=result_data,
                request_id=request.id,
                message=(
                    accumulated_content
                    or "Streaming terminé."
                ),
                metadata=result_metadata,
            )

            execution_context.setdefault(
                "results",
                {},
            )[task.id] = result

            execution_context.setdefault(
                "previous_results",
                {},
            )[str(task.id)] = result.to_dict()

            execution_order = execution_context.setdefault(
                "execution_order",
                [],
            )

            if task.id not in execution_order:
                execution_order.append(
                    task.id
                )

            task.complete(
                result.to_dict()
            )

            yield {
                "type": "task_done",
                "task_id": str(task.id),
                "task_name": task.name,
                "provider": provider_name,
                "model": model_name,
                "usage": usage or None,
            }

        except Exception as exc:
            try:
                task.fail(str(exc))
            except Exception:
                pass

            failed_result = AIResult.failure_result(
                message="La génération streaming a échoué.",
                request_id=self._request_id(
                    execution_context
                ),
                errors=[str(exc)],
                metadata={
                    "task_id": str(task.id),
                    "task_name": task.name,
                    "task_type": task.task_type.value,
                    "provider": provider_name,
                    "model": model_name,
                    "streaming": True,
                },
            )

            execution_context.setdefault(
                "results",
                {},
            )[task.id] = failed_result

            execution_context.setdefault(
                "previous_results",
                {},
            )[str(task.id)] = failed_result.to_dict()

            yield {
                "type": "error",
                "task_id": str(task.id),
                "task_name": task.name,
                "provider": provider_name,
                "model": model_name,
                "error": str(exc),
            }

    # ------------------------------------------------------------------
    # ANALYSE DE REQUÊTE
    # ------------------------------------------------------------------

    def _execute_analyze_request(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:

        request = execution_context.get(
            "request"
        )

        if not isinstance(request, AIRequest):
            return AIResult.failure_result(
                message="Impossible d'analyser la requête.",
                errors=[
                    "AIRequest absent du contexte d'exécution."
                ],
            )

        text = self._request_text(
            request
        )

        return AIResult.success_result(
            data={
                "request_id": str(request.id),
                "text": text,
                "has_document": bool(
                    request.document_id
                ),
                "has_tools": bool(
                    request.tools
                ),
                "instructions": list(
                    request.instructions
                ),
                "provider": request.provider,
                "model": request.model,
            },
            request_id=request.id,
            message="Requête analysée.",
            metadata={
                "task": "analyze_request",
                "execution": "local",
            },
        )

    # ------------------------------------------------------------------
    # ANALYSE SCIENTIFIQUE
    # ------------------------------------------------------------------

    def _execute_scientific_analysis(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:

        request = execution_context.get(
            "request"
        )

        if not isinstance(request, AIRequest):
            return AIResult.failure_result(
                message=(
                    "Impossible d'effectuer "
                    "l'analyse scientifique."
                ),
                errors=[
                    "AIRequest absent du contexte."
                ],
            )

        text = self._request_text(
            request
        )

        return AIResult.success_result(
            data={
                "type": "scientific_analysis",
                "input": text,
                "document_id": (
                    str(request.document_id)
                    if request.document_id
                    else None
                ),
                "analysis": {
                    "scientific": True,
                    "ready_for_generation": True,
                },
            },
            request_id=self._request_id(
                execution_context
            ),
            message="Analyse scientifique préparée.",
            metadata={
                "task": "scientific_analysis",
                "execution": "local",
            },
        )

    # ------------------------------------------------------------------
    # ANALYSE DOCUMENT
    # ------------------------------------------------------------------

    def _execute_document_analysis(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:

        request = execution_context.get(
            "request"
        )

        if not isinstance(request, AIRequest):
            return AIResult.failure_result(
                message="Impossible d'analyser le document.",
                errors=[
                    "AIRequest absent du contexte."
                ],
            )

        document_type = self._detect_document_type(
            request
        )

        return AIResult.success_result(
            data={
                "type": "document_analysis",
                "document_type": document_type,
                "document_id": (
                    str(request.document_id)
                    if request.document_id
                    else None
                ),
            },
            request_id=self._request_id(
                execution_context
            ),
            message="Document analysé.",
            metadata={
                "task": "document_analysis",
                "execution": "local",
            },
        )

    # ------------------------------------------------------------------
    # ANALYSE MATHÉMATIQUE
    # ------------------------------------------------------------------

    def _execute_mathematical_analysis(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:

        request = execution_context.get(
            "request"
        )

        if not isinstance(request, AIRequest):
            return AIResult.failure_result(
                message=(
                    "Impossible d'effectuer "
                    "l'analyse mathématique."
                ),
                errors=[
                    "AIRequest absent du contexte."
                ],
            )

        return AIResult.success_result(
            data={
                "type": "mathematical_analysis",
                "input": self._request_text(
                    request
                ),
                "ready_for_generation": True,
            },
            request_id=self._request_id(
                execution_context
            ),
            message="Analyse mathématique préparée.",
            metadata={
                "task": "mathematical_analysis",
                "execution": "local",
            },
        )

    # ------------------------------------------------------------------
    # GÉNÉRATIONS
    # ------------------------------------------------------------------

    def _execute_equation_generation(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:
        return self._execute_provider_generation(
            task,
            execution_context,
            task_name="equation_generation",
        )

    def _execute_figure_generation(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:
        return self._execute_provider_generation(
            task,
            execution_context,
            task_name="figure_generation",
        )

    def _execute_table_generation(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:
        return self._execute_provider_generation(
            task,
            execution_context,
            task_name="table_generation",
        )

    def _execute_bibliography_generation(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:
        return self._execute_provider_generation(
            task,
            execution_context,
            task_name="bibliography_generation",
        )

    def _execute_latex_generation(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:
        return self._execute_provider_generation(
            task,
            execution_context,
            task_name="latex_generation",
        )

    # ------------------------------------------------------------------
    # VALIDATION
    # ------------------------------------------------------------------

    def _execute_validate_result(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:

        previous_results = execution_context.get(
            "previous_results",
            {},
        )

        return AIResult.success_result(
            data={
                "validated": True,
                "results_count": len(
                    previous_results
                ),
            },
            request_id=self._request_id(
                execution_context
            ),
            message="Résultat validé.",
            metadata={
                "task": "validate_result",
                "execution": "local",
            },
        )

    # ------------------------------------------------------------------
    # GÉNÉRATION DE RÉPONSE
    # ------------------------------------------------------------------

    def _execute_generate_response(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:
        return self._execute_provider_generation(
            task,
            execution_context,
            task_name="generate_response",
        )

    # ------------------------------------------------------------------
    # GÉNÉRATION PROVIDER
    # ------------------------------------------------------------------

    def _execute_provider_generation(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
        task_name: str = "generation",
    ) -> AIResult:

        request = execution_context.get(
            "request"
        )

        context = execution_context.get(
            "context"
        )

        if not isinstance(request, AIRequest):
            return AIResult.failure_result(
                message="Impossible de lancer la génération IA.",
                errors=[
                    "AIRequest absent du contexte."
                ],
            )

        try:
            request.validate()

            decision = self.router.route(
                request
            )

            provider = self.router.create_provider(
                decision
            )

            messages = self._build_provider_messages(
                request,
                context,
            )

            prompt = self._build_task_prompt(
                task,
                request,
                execution_context,
                task_name,
            )

            if prompt:
                messages = list(messages)

                messages.append(
                    {
                        "role": "user",
                        "content": prompt,
                    }
                )

            provider_response = provider.generate(
                messages=messages,
                model=decision.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                tools=request.tools or None,
            )

            content = self._extract_provider_content(
                provider_response
            )

            if content is None:
                return AIResult.failure_result(
                    message=(
                        "Le provider n'a retourné "
                        "aucun contenu."
                    ),
                    request_id=request.id,
                    errors=[
                        "Réponse provider vide ou non reconnue."
                    ],
                    metadata={
                        "provider": decision.provider,
                        "model": decision.model,
                        "task": task_name,
                    },
                )

            return AIResult.success_result(
                data={
                    "content": content,
                    "task": task_name,
                    "provider": decision.provider,
                    "model": decision.model,
                    "raw": provider_response,
                },
                request_id=request.id,
                message=content,
                metadata={
                    "provider": decision.provider,
                    "model": decision.model,
                    "task_type": task.task_type.value,
                    "task_name": task.name,
                    "execution": "provider",
                },
            )

        except Exception as exc:
            return AIResult.failure_result(
                message="La génération IA a échoué.",
                request_id=request.id,
                errors=[str(exc)],
                metadata={
                    "provider": getattr(
                        request,
                        "provider",
                        None,
                    ),
                    "model": getattr(
                        request,
                        "model",
                        None,
                    ),
                    "task": task_name,
                },
            )

    # ------------------------------------------------------------------
    # FALLBACK
    # ------------------------------------------------------------------

    def _execute_fallback(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:

        return AIResult.failure_result(
            message="Type de tâche non pris en charge.",
            request_id=self._request_id(
                execution_context
            ),
            errors=[
                f"Aucun handler disponible pour la tâche "
                f"'{task.name}' "
                f"(type='{task.task_type.value}')."
            ],
            metadata={
                "task_id": str(task.id),
                "task_name": task.name,
                "task_type": task.task_type.value,
            },
        )

    # ------------------------------------------------------------------
    # CONTEXTE / MESSAGES PROVIDER
    # ------------------------------------------------------------------

    @staticmethod
    def _build_provider_messages(
        request: AIRequest,
        context: Any,
    ) -> list:

        if context is not None:
            try:
                messages = context.build_provider_messages()

                if messages:
                    return list(messages)

            except AttributeError:
                pass

        return request.to_provider_messages()

    # ------------------------------------------------------------------
    # PROMPTS
    # ------------------------------------------------------------------

    def _build_task_prompt(
        self,
        task: AITask,
        request: AIRequest,
        execution_context: Dict[str, Any],
        task_name: str,
    ) -> str:

        base_text = self._request_text(
            request
        )

        instructions = list(
            getattr(
                request,
                "instructions",
                [],
            )
            or []
        )

        instruction_text = ""

        if instructions:
            instruction_text = (
                "\n\nInstructions supplémentaires :\n"
                + "\n".join(
                    f"- {instruction}"
                    for instruction in instructions
                )
            )

        if task_name == "generate_response":
            return (
                "Réponds directement à la demande de l'utilisateur "
                "avec une réponse claire, précise et structurée."
                "\n\nDemande :\n"
                f"{base_text}"
                f"{instruction_text}"
            )

        if task_name == "scientific_analysis":
            return (
                "Effectue une analyse scientifique rigoureuse "
                "de la demande suivante."
                "\n\n"
                f"{base_text}"
                f"{instruction_text}"
            )

        if task_name == "equation_generation":
            return (
                "Génère les équations mathématiques pertinentes "
                "pour la demande suivante. "
                "Utilise une notation scientifique rigoureuse."
                "\n\n"
                f"{base_text}"
                f"{instruction_text}"
            )

        if task_name == "figure_generation":
            return (
                "Décris ou génère une structure de figure "
                "scientifique adaptée à la demande suivante."
                "\n\n"
                f"{base_text}"
                f"{instruction_text}"
            )

        if task_name == "table_generation":
            return (
                "Construis une table scientifique structurée "
                "à partir de la demande suivante."
                "\n\n"
                f"{base_text}"
                f"{instruction_text}"
            )

        if task_name == "bibliography_generation":
            return (
                "Prépare les références bibliographiques pertinentes "
                "pour la demande suivante."
                "\n\n"
                f"{base_text}"
                f"{instruction_text}"
            )

        if task_name == "latex_generation":
            return (
                "Génère du code LaTeX propre, structuré et compilable "
                "pour la demande suivante."
                "\n\n"
                f"{base_text}"
                f"{instruction_text}"
            )

        if task_name == "generation":
            return (
                "Génère le contenu demandé de manière structurée."
                "\n\n"
                f"{base_text}"
                f"{instruction_text}"
            )

        return (
            f"Exécute la tâche '{task_name}' "
            "à partir de la demande suivante."
            "\n\n"
            f"{base_text}"
            f"{instruction_text}"
        )

    # ------------------------------------------------------------------
    # REQUEST HELPERS
    # ------------------------------------------------------------------

    @staticmethod
    def _request_text(
        request: Optional[AIRequest],
    ) -> str:

        if not isinstance(
            request,
            AIRequest,
        ):
            return ""

        user_message = request.user_message

        if user_message is not None:
            return str(
                getattr(
                    user_message,
                    "content",
                    "",
                )
                or ""
            )

        if request.messages:
            return str(
                getattr(
                    request.messages[-1],
                    "content",
                    "",
                )
                or ""
            )

        return ""

    @staticmethod
    def _detect_document_type(
        request: Optional[AIRequest],
    ) -> str:

        if not isinstance(
            request,
            AIRequest,
        ):
            return "unknown"

        metadata = getattr(
            request,
            "metadata",
            {},
        ) or {}

        document_type = metadata.get(
            "document_type"
        )

        if document_type:
            return str(document_type)

        text = TaskExecutor._request_text(
            request
        ).lower()

        if "thèse" in text or "these" in text:
            return "these"

        if "mémoire" in text or "memoire" in text:
            return "memoire"

        if "article scientifique" in text:
            return "article"

        if "rapport" in text:
            return "rapport"

        return "unknown"

    # ------------------------------------------------------------------
    # PROVIDER RESPONSE
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_provider_content(
        response: Any,
    ) -> Optional[str]:

        if response is None:
            return None

        if isinstance(
            response,
            str,
        ):
            return response

        if isinstance(
            response,
            AIResponse,
        ):
            return response.content

        if isinstance(
            response,
            dict,
        ):
            if "content" in response:
                return str(
                    response["content"]
                )

            message = response.get(
                "message"
            )

            if isinstance(
                message,
                dict,
            ):
                content = message.get(
                    "content"
                )

                if content is not None:
                    return str(content)

            if "response" in response:
                return str(
                    response["response"]
                )

            if "text" in response:
                return str(
                    response["text"]
                )

            choices = response.get(
                "choices"
            )

            if (
                isinstance(
                    choices,
                    list,
                )
                and choices
            ):
                first = choices[0]

                if isinstance(
                    first,
                    dict,
                ):
                    message = first.get(
                        "message"
                    )

                    if isinstance(
                        message,
                        dict,
                    ):
                        content = message.get(
                            "content"
                        )

                        if content is not None:
                            return str(content)

                    content = first.get(
                        "text"
                    )

                    if content is not None:
                        return str(content)

        return None

    # ------------------------------------------------------------------
    # STREAM NORMALIZATION
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_stream_chunk(
        chunk: Any,
    ) -> Optional[Dict[str, Any]]:

        if chunk is None:
            return None

        if isinstance(
            chunk,
            str,
        ):
            return {
                "type": "content",
                "content": chunk,
            }

        if not isinstance(
            chunk,
            dict,
        ):
            return {
                "type": "content",
                "content": str(chunk),
            }

        normalized: Dict[str, Any] = {}

        for key in (
            "provider",
            "model",
            "usage",
            "thinking",
            "done",
        ):
            if key in chunk:
                normalized[key] = chunk[key]

        if chunk.get("error"):
            normalized["type"] = "error"
            normalized["error"] = str(
                chunk["error"]
            )
            return normalized

        if chunk.get("tool_calls"):
            normalized["type"] = "tool_call"
            normalized["tool_calls"] = chunk[
                "tool_calls"
            ]

            if chunk.get("tool_call"):
                normalized["tool_call"] = chunk[
                    "tool_call"
                ]

            return normalized

        if chunk.get("tool_call"):
            normalized["type"] = "tool_call"
            normalized["tool_call"] = chunk[
                "tool_call"
            ]
            return normalized

        message = chunk.get(
            "message"
        )

        if isinstance(
            message,
            dict,
        ):
            message_content = message.get(
                "content"
            )

            message_thinking = message.get(
                "thinking"
            )

            message_tool_calls = message.get(
                "tool_calls"
            )

            if message_thinking:
                normalized["thinking"] = (
                    message_thinking
                )

            if message_tool_calls:
                normalized["type"] = "tool_call"
                normalized["tool_calls"] = (
                    message_tool_calls
                )
                return normalized

            if message_content is not None:
                normalized["type"] = "content"
                normalized["content"] = str(
                    message_content
                )
                return normalized

        if "content" in chunk:
            content = chunk.get(
                "content"
            )

            if content is None:
                content = ""

            normalized["type"] = "content"
            normalized["content"] = str(
                content
            )
            return normalized

        response = chunk.get(
            "response"
        )

        if response is not None:
            normalized["type"] = "content"
            normalized["content"] = str(
                response
            )
            return normalized

        choices = chunk.get(
            "choices"
        )

        if (
            isinstance(
                choices,
                list,
            )
            and choices
        ):
            first = choices[0]

            if isinstance(
                first,
                dict,
            ):
                delta = first.get(
                    "delta"
                )

                if isinstance(
                    delta,
                    dict,
                ):
                    delta_content = delta.get(
                        "content"
                    )

                    if delta_content is not None:
                        normalized["type"] = "content"
                        normalized["content"] = str(
                            delta_content
                        )
                        return normalized

                    delta_tool_calls = delta.get(
                        "tool_calls"
                    )

                    if delta_tool_calls:
                        normalized["type"] = "tool_call"
                        normalized["tool_calls"] = (
                            delta_tool_calls
                        )
                        return normalized

                first_text = first.get(
                    "text"
                )

                if first_text is not None:
                    normalized["type"] = "content"
                    normalized["content"] = str(
                        first_text
                    )
                    return normalized

        if chunk.get("done") is True:
            normalized["type"] = "done"
            normalized.setdefault(
                "content",
                "",
            )
            return normalized

        thinking = chunk.get(
            "thinking"
        )

        if thinking:
            normalized["type"] = "thinking"
            normalized["thinking"] = str(
                thinking
            )
            return normalized

        return None

    # ------------------------------------------------------------------
    # RESULT / RESPONSE
    # ------------------------------------------------------------------

    @staticmethod
    def _result_to_response(
        result: AIResult,
    ) -> AIResponse:

        if result.failed:
            return AIResponse.failure(
                error=(
                    result.message
                    or "; ".join(
                        result.errors
                    )
                ),
                request_id=result.request_id,
                metadata=result.metadata,
            )

        content = (
            TaskExecutor
            ._extract_content_from_result(
                result
            )
        )

        return AIResponse.success(
            content=content,
            request_id=result.request_id,
            metadata=result.metadata,
        )

    @staticmethod
    def _extract_content_from_result(
        result: AIResult,
    ) -> str:

        if not result.data:
            return result.message or ""

        if isinstance(
            result.data,
            str,
        ):
            return result.data

        if isinstance(
            result.data,
            dict,
        ):
            content = result.data.get(
                "content"
            )

            if content is not None:
                return str(content)

        return result.message or ""

    # ------------------------------------------------------------------
    # GENERAL HELPERS
    # ------------------------------------------------------------------

    @staticmethod
    def _request_id(
        execution_context: Dict[str, Any],
    ) -> Optional[str]:

        request = execution_context.get(
            "request"
        )

        if request is None:
            return None

        request_id = getattr(
            request,
            "id",
            None,
        )

        if request_id is None:
            return None

        return str(request_id)