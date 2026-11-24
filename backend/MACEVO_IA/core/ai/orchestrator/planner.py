from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from core.ai.capabilities.resolver import CapabilityResolver
from core.ai.contracts.request import AIRequest
from core.ai.models.task import AITask, TaskStatus, TaskType
from core.ai.tools import ToolRegistry


@dataclass
class TaskPlan:
    """
    Plan d'exécution d'une requête MACEVO IA.

    Un plan représente un graphe de tâches avec dépendances.

    Le plan peut contenir plusieurs types de tâches :

    - analyse
    - analyse scientifique
    - analyse documentaire
    - calcul / outil
    - génération
    - validation
    - export

    Le planner construit uniquement le plan.
    L'exécution est réalisée par WorkflowRunner / TaskExecutor.
    """

    id: str = field(
        default_factory=lambda: str(uuid4())
    )

    request_id: Optional[str] = None

    tasks: List[AITask] = field(
        default_factory=list
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    # ------------------------------------------------------------------
    # TASK MANAGEMENT
    # ------------------------------------------------------------------

    def add_task(
        self,
        task: AITask,
    ) -> AITask:
        """
        Ajoute une tâche au plan.
        """

        if not isinstance(task, AITask):
            raise TypeError(
                "task doit être une instance de AITask."
            )

        if self.get_task(task.id) is not None:
            raise ValueError(
                f"La tâche '{task.id}' existe déjà dans le plan."
            )

        self.tasks.append(task)

        return task

    def get_task(
        self,
        task_id: UUID | str,
    ) -> Optional[AITask]:
        """
        Recherche une tâche par identifiant.
        """

        for task in self.tasks:

            if task.id == task_id:
                return task

            if str(task.id) == str(task_id):
                return task

        return None

    # ------------------------------------------------------------------
    # PLAN STATE
    # ------------------------------------------------------------------

    def ready_tasks(self) -> List[AITask]:
        """
        Retourne les tâches actuellement exécutables.

        Une tâche est prête lorsque :

        - son état est PENDING ;
        - toutes ses dépendances existent ;
        - toutes ses dépendances sont COMPLETED.
        """

        completed_ids = {
            task.id
            for task in self.tasks
            if task.status == TaskStatus.COMPLETED
        }

        ready: List[AITask] = []

        for task in self.tasks:

            if task.status != TaskStatus.PENDING:
                continue

            if all(
                dependency in completed_ids
                for dependency in task.dependencies
            ):
                ready.append(task)

        return ready

    def is_completed(self) -> bool:
        """
        Indique si toutes les tâches ont été exécutées avec succès.
        """

        return bool(self.tasks) and all(
            task.status == TaskStatus.COMPLETED
            for task in self.tasks
        )

    def is_finished(self) -> bool:
        """
        Indique si toutes les tâches ont atteint un état terminal.
        """

        return bool(self.tasks) and all(
            task.is_terminal
            for task in self.tasks
        )

    def has_failed_tasks(self) -> bool:
        """
        Indique si au moins une tâche a échoué.
        """

        return any(
            task.status == TaskStatus.FAILED
            for task in self.tasks
        )

    def has_cancelled_tasks(self) -> bool:
        """
        Indique si au moins une tâche a été annulée.
        """

        return any(
            task.status == TaskStatus.CANCELLED
            for task in self.tasks
        )

    # ------------------------------------------------------------------
    # BLOCKED TASKS
    # ------------------------------------------------------------------

    def get_blocked_tasks(self) -> List[AITask]:
        """
        Retourne les tâches PENDING dont une dépendance est
        FAILED ou CANCELLED.
        """

        terminal_failure_ids = {
            task.id
            for task in self.tasks
            if task.status in {
                TaskStatus.FAILED,
                TaskStatus.CANCELLED,
            }
        }

        blocked: List[AITask] = []

        for task in self.tasks:

            if task.status != TaskStatus.PENDING:
                continue

            if any(
                dependency in terminal_failure_ids
                for dependency in task.dependencies
            ):
                blocked.append(task)

        return blocked

    def mark_blocked_tasks(
        self,
    ) -> List[AITask]:
        """
        Annule les tâches qui ne peuvent plus être exécutées
        parce qu'une de leurs dépendances a échoué ou a été annulée.
        """

        blocked_tasks = self.get_blocked_tasks()

        for task in blocked_tasks:

            failed_dependencies = [
                dependency
                for dependency in task.dependencies
                if (
                    self.get_task(dependency) is not None
                    and self.get_task(dependency).status
                    in {
                        TaskStatus.FAILED,
                        TaskStatus.CANCELLED,
                    }
                )
            ]

            task.cancel(
                reason=(
                    "Tâche bloquée par une dépendance "
                    "échouée ou annulée : "
                    f"{[str(dep) for dep in failed_dependencies]}"
                )
            )

        return blocked_tasks

    # ------------------------------------------------------------------
    # STATISTICS
    # ------------------------------------------------------------------

    def completed_tasks(self) -> List[AITask]:
        return [
            task
            for task in self.tasks
            if task.status == TaskStatus.COMPLETED
        ]

    def failed_tasks(self) -> List[AITask]:
        return [
            task
            for task in self.tasks
            if task.status == TaskStatus.FAILED
        ]

    def cancelled_tasks(self) -> List[AITask]:
        return [
            task
            for task in self.tasks
            if task.status == TaskStatus.CANCELLED
        ]

    def pending_tasks(self) -> List[AITask]:
        return [
            task
            for task in self.tasks
            if task.status == TaskStatus.PENDING
        ]

    def running_tasks(self) -> List[AITask]:
        return [
            task
            for task in self.tasks
            if task.status == TaskStatus.RUNNING
        ]

    # ------------------------------------------------------------------
    # SERIALIZATION
    # ------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "request_id": self.request_id,
            "tasks": [
                task.to_dict()
                for task in self.tasks
            ],
            "metadata": dict(self.metadata),
            "status": self.status,
            "is_completed": self.is_completed(),
            "is_finished": self.is_finished(),
            "has_failed_tasks": self.has_failed_tasks(),
            "has_cancelled_tasks": self.has_cancelled_tasks(),
        }

    @property
    def status(self) -> str:
        """
        Statut global calculé du plan.
        """

        if self.is_completed():
            return "completed"

        if self.has_failed_tasks():
            return "failed"

        if self.has_cancelled_tasks():
            return "cancelled"

        if self.running_tasks():
            return "running"

        if self.pending_tasks():
            return "pending"

        return "unknown"


class TaskPlanner:
    """
    Planificateur central de MACEVO IA.

    Il transforme une requête en graphe de tâches.

    Le planner :

    1. analyse les capacités requises ;
    2. construit les étapes principales ;
    3. recherche les outils disponibles ;
    4. ajoute automatiquement les tâches TOOL pertinentes ;
    5. relie les dépendances ;
    6. indique la tâche finale.

    Le planner ne réalise aucune tâche.
    """

    # Capacités pour lesquelles l'utilisation d'un outil externe/interne
    # peut être pertinente dans le graphe d'exécution.
    TOOL_CAPABILITIES = {
        "math",
        "vision",
        "scientific",
        "document",
        "equation",
        "figure",
        "table",
        "code",
        "latex",
        "bibliography",
        "validation",
        "analysis",
    }

    def __init__(
        self,
        capability_resolver: Optional[
            CapabilityResolver
        ] = None,
    ):
        self.capability_resolver = (
            capability_resolver
            or CapabilityResolver()
        )

    # ------------------------------------------------------------------
    # PLAN
    # ------------------------------------------------------------------

    def plan(
        self,
        request: AIRequest,
    ) -> TaskPlan:
        """
        Construit un plan à partir d'une requête.
        """

        if not isinstance(
            request,
            AIRequest,
        ):
            raise TypeError(
                "request doit être une instance de AIRequest."
            )

        request.validate()

        resolution = (
            self.capability_resolver.resolve(
                request
            )
        )

        capabilities = resolution.capabilities

        capability_names = {
            capability.name
            for capability in capabilities
        }

        plan = TaskPlan(
            request_id=request.id,
            metadata={
                "capabilities": sorted(
                    capability_names
                ),
                "model": request.model,
                "provider": request.provider,
                "tools": [],
            },
        )

        self._build_plan(
            plan=plan,
            request=request,
            capabilities=capability_names,
        )

        return plan

    # ------------------------------------------------------------------
    # PLAN CONSTRUCTION
    # ------------------------------------------------------------------

    def _build_plan(
        self,
        *,
        plan: TaskPlan,
        request: AIRequest,
        capabilities: set[str],
    ) -> None:
        """
        Construit le graphe de tâches.

        Les outils sont insérés immédiatement après l'analyse
        lorsque des outils compatibles sont disponibles.
        """

        analyze = self._add_task(
            plan,
            name="analyze_request",
            task_type=TaskType.ANALYSIS,
            input_data={
                "request_id": request.id,
            },
        )

        previous = analyze

        # --------------------------------------------------------------
        # AUTOMATIC TOOL RESOLUTION
        # --------------------------------------------------------------

        tool_tasks = self._add_tool_tasks(
            plan=plan,
            request=request,
            capabilities=capabilities,
            dependency=previous.id,
        )

        if tool_tasks:
            previous = tool_tasks[-1]

        # --------------------------------------------------------------
        # SCIENTIFIC
        # --------------------------------------------------------------

        if "scientific" in capabilities:

            scientific = self._add_task(
                plan,
                name="scientific_analysis",
                task_type=TaskType.SCIENTIFIC,
                dependencies=[
                    previous.id
                ],
                input_data={
                    "request_id": request.id,
                },
            )

            previous = scientific

        # --------------------------------------------------------------
        # DOCUMENT
        # --------------------------------------------------------------

        if "document" in capabilities:

            document = self._add_task(
                plan,
                name="document_analysis",
                task_type=TaskType.DOCUMENT,
                dependencies=[
                    previous.id
                ],
                input_data={
                    "request_id": request.id,
                },
            )

            previous = document

        # --------------------------------------------------------------
        # MATH
        # --------------------------------------------------------------

        if "math" in capabilities:

            math = self._add_task(
                plan,
                name="mathematical_analysis",
                task_type=TaskType.ANALYSIS,
                dependencies=[
                    previous.id
                ],
                input_data={
                    "request_id": request.id,
                },
            )

            previous = math

        # --------------------------------------------------------------
        # EQUATION
        # --------------------------------------------------------------

        if "equation" in capabilities:

            equation = self._add_task(
                plan,
                name="equation_generation",
                task_type=TaskType.GENERATION,
                dependencies=[
                    previous.id
                ],
                input_data={
                    "request_id": request.id,
                },
            )

            previous = equation

        # --------------------------------------------------------------
        # FIGURE
        # --------------------------------------------------------------

        if "figure" in capabilities:

            figure = self._add_task(
                plan,
                name="figure_generation",
                task_type=TaskType.GENERATION,
                dependencies=[
                    previous.id
                ],
                input_data={
                    "request_id": request.id,
                },
            )

            previous = figure

        # --------------------------------------------------------------
        # TABLE
        # --------------------------------------------------------------

        if "table" in capabilities:

            table = self._add_task(
                plan,
                name="table_generation",
                task_type=TaskType.GENERATION,
                dependencies=[
                    previous.id
                ],
                input_data={
                    "request_id": request.id,
                },
            )

            previous = table

        # --------------------------------------------------------------
        # BIBLIOGRAPHY
        # --------------------------------------------------------------

        if "bibliography" in capabilities:

            bibliography = self._add_task(
                plan,
                name="bibliography_generation",
                task_type=TaskType.GENERATION,
                dependencies=[
                    previous.id
                ],
                input_data={
                    "request_id": request.id,
                },
            )

            previous = bibliography

        # --------------------------------------------------------------
        # LATEX
        # --------------------------------------------------------------

        if "latex" in capabilities:

            latex = self._add_task(
                plan,
                name="latex_generation",
                task_type=TaskType.EXPORT,
                dependencies=[
                    previous.id
                ],
                input_data={
                    "request_id": request.id,
                },
            )

            previous = latex

        # --------------------------------------------------------------
        # VALIDATION
        # --------------------------------------------------------------

        if "validation" in capabilities:

            validation = self._add_task(
                plan,
                name="validate_result",
                task_type=TaskType.VALIDATION,
                dependencies=[
                    previous.id
                ],
                input_data={
                    "request_id": request.id,
                },
            )

            previous = validation

        # --------------------------------------------------------------
        # FINAL TEXT GENERATION
        # --------------------------------------------------------------

        if "text" in capabilities:

            generation = self._add_task(
                plan,
                name="generate_response",
                task_type=TaskType.GENERATION,
                dependencies=[
                    previous.id
                ],
                input_data={
                    "request_id": request.id,
                },
            )

            previous = generation

        plan.metadata["final_task_id"] = str(
            previous.id
        )

    # ------------------------------------------------------------------
    # AUTOMATIC TOOL PLANNING
    # ------------------------------------------------------------------

    def _add_tool_tasks(
        self,
        *,
        plan: TaskPlan,
        request: AIRequest,
        capabilities: set[str],
        dependency: UUID,
    ) -> List[AITask]:
        """
        Recherche automatiquement les outils compatibles avec
        les capacités détectées.

        Important :

        Le planner ne choisit pas arbitrairement un outil inexistant.
        Il interroge uniquement ToolRegistry.

        Lorsqu'un outil compatible est trouvé, une AITask de type TOOL
        est ajoutée au graphe.

        Les arguments explicites peuvent être fournis dans :

            request.metadata["tool_arguments"]

        et un outil explicite peut être demandé via :

            request.metadata["tool_name"]

        Exemple :

            metadata={
                "tool_name": "calculator",
                "tool_arguments": {
                    "a": 12,
                    "b": 30,
                },
            }
        """

        created_tasks: List[AITask] = []

        # Aucun outil enregistré : le planner continue normalement.
        if ToolRegistry.count() == 0:
            plan.metadata["tools_available"] = False
            plan.metadata["tool_tasks"] = []
            return created_tasks

        plan.metadata["tools_available"] = True

        explicit_tool_name = self._get_explicit_tool_name(
            request
        )

        explicit_arguments = self._get_tool_arguments(
            request
        )

        # Si un outil précis est demandé, il est prioritaire.
        if explicit_tool_name:
            tool = ToolRegistry.get_or_none(
                explicit_tool_name
            )

            if tool is not None and tool.enabled:
                task = self._create_tool_task(
                    plan=plan,
                    request=request,
                    tool=tool,
                    dependency=dependency,
                    arguments=explicit_arguments,
                )

                created_tasks.append(task)

                plan.metadata["tools"].append(
                    {
                        "name": tool.name,
                        "capabilities": list(
                            tool.capabilities
                        ),
                        "source": "explicit",
                    }
                )

                dependency = task.id

        # Ensuite, recherche des outils correspondant aux capacités.
        for capability in self._ordered_tool_capabilities(
            capabilities
        ):
            tools = ToolRegistry.find_by_capability(
                capability
            )

            if not tools:
                continue

            for tool in tools:

                # Un outil déjà ajouté ne doit pas être dupliqué.
                if any(
                    task.input_data.get("tool_name")
                    == tool.name
                    for task in created_tasks
                ):
                    continue

                task = self._create_tool_task(
                    plan=plan,
                    request=request,
                    tool=tool,
                    dependency=dependency,
                    arguments=explicit_arguments,
                )

                created_tasks.append(task)

                plan.metadata["tools"].append(
                    {
                        "name": tool.name,
                        "capabilities": list(
                            tool.capabilities
                        ),
                        "source": "capability",
                        "capability": capability,
                    }
                )

                dependency = task.id

                # Un seul outil automatique par capacité.
                break

        plan.metadata["tool_tasks"] = [
            str(task.id)
            for task in created_tasks
        ]

        return created_tasks

    def _create_tool_task(
        self,
        *,
        plan: TaskPlan,
        request: AIRequest,
        tool: Any,
        dependency: UUID,
        arguments: Dict[str, Any],
    ) -> AITask:
        """
        Crée une AITask TOOL compatible avec TaskExecutor.
        """

        task = self._add_task(
            plan,
            name=tool.name,
            task_type=TaskType.TOOL,
            dependencies=[
                dependency
            ],
            input_data={
                "tool_name": tool.name,
                "arguments": dict(
                    arguments
                ),
                "request_id": request.id,
                "capabilities": list(
                    tool.capabilities
                ),
            },
        )

        return task

    # ------------------------------------------------------------------
    # TOOL HELPERS
    # ------------------------------------------------------------------

    @staticmethod
    def _get_explicit_tool_name(
        request: AIRequest,
    ) -> Optional[str]:
        """
        Récupère un nom d'outil explicitement demandé.
        """

        metadata = request.metadata or {}

        tool_name = metadata.get(
            "tool_name"
        )

        if tool_name is None:
            tool_name = metadata.get(
                "requested_tool"
            )

        if not tool_name:
            return None

        return str(
            tool_name
        ).strip() or None

    @staticmethod
    def _get_tool_arguments(
        request: AIRequest,
    ) -> Dict[str, Any]:
        """
        Récupère les arguments explicites d'un outil.

        Les arguments automatiques complexes seront traités
        ultérieurement par la couche de tool-calling/argument
        resolution. Le planner ne tente pas de parser du langage
        naturel en arguments arbitraires.
        """

        metadata = request.metadata or {}

        arguments = metadata.get(
            "tool_arguments"
        )

        if arguments is None:
            arguments = metadata.get(
                "arguments"
            )

        if not isinstance(
            arguments,
            dict,
        ):
            return {}

        return dict(arguments)

    def _ordered_tool_capabilities(
        self,
        capabilities: set[str],
    ) -> List[str]:
        """
        Retourne les capacités dans un ordre déterministe.

        L'ordre est volontaire : les outils préparatoires sont
        exécutés avant les étapes de génération/validation.
        """

        priority = [
            "math",
            "vision",
            "scientific",
            "document",
            "equation",
            "figure",
            "table",
            "code",
            "bibliography",
            "latex",
            "validation",
            "analysis",
        ]

        ordered = [
            capability
            for capability in priority
            if (
                capability in capabilities
                and capability in self.TOOL_CAPABILITIES
            )
        ]

        return ordered

    # ------------------------------------------------------------------
    # TASK CREATION
    # ------------------------------------------------------------------

    @staticmethod
    def _add_task(
        plan: TaskPlan,
        *,
        name: str,
        task_type: TaskType,
        dependencies: Optional[
            List[UUID]
        ] = None,
        input_data: Optional[
            Dict[str, Any]
        ] = None,
    ) -> AITask:
        """
        Crée et ajoute une tâche au plan.
        """

        task = AITask(
            name=name,
            task_type=task_type,
            dependencies=list(
                dependencies or []
            ),
            input_data=dict(
                input_data or {}
            ),
        )

        plan.add_task(
            task
        )

        return task