from __future__ import annotations

from typing import Any, Dict, Optional

from core.ai.contracts.request import AIRequest
from core.ai.contracts.result import AIResult, ResultStatus
from core.ai.models.task import AITask, TaskStatus


class WorkflowRunner:
    """
    Moteur d'exécution des workflows MACEVO_IA.

    Responsabilités :
    - exécuter automatiquement les tâches d'un TaskPlan ;
    - respecter les dépendances ;
    - transmettre les résultats précédents ;
    - gérer les échecs et les retries ;
    - bloquer proprement les tâches dépendantes ;
    - maintenir un contexte d'exécution cohérent ;
    - laisser l'AIOrchestrator construire le résultat final.
    """

    def __init__(self, executor: Any):
        if executor is None:
            raise ValueError(
                "Un TaskExecutor est obligatoire."
            )

        self.executor = executor

    # ------------------------------------------------------------------
    # EXECUTION PRINCIPALE
    # ------------------------------------------------------------------

    def run(
        self,
        plan: Any,
        execution_context: Dict[str, Any],
    ) -> None:
        """
        Exécute le workflow contenu dans le TaskPlan.

        Le Runner travaille directement avec le contexte créé
        par AIOrchestrator.

        Il maintient notamment :
        - results ;
        - previous_results ;
        - execution_order ;
        - current_task.
        """

        if plan is None:
            raise ValueError(
                "Le TaskPlan est obligatoire."
            )

        if not isinstance(execution_context, dict):
            raise TypeError(
                "execution_context doit être un dictionnaire."
            )

        request = execution_context.get("request")

        if not isinstance(request, AIRequest):
            raise TypeError(
                "execution_context['request'] doit être "
                "une instance de AIRequest."
            )

        self._prepare_execution_context(
            plan,
            execution_context,
        )

        self._prepare_plan(plan)

        while not self._is_finished(plan):

            ready_tasks = self._get_ready_tasks(
                plan,
            )

            if ready_tasks:

                for task in ready_tasks:

                    if task.is_terminal:
                        continue

                    result = self._execute_task(
                        task,
                        execution_context,
                    )

                    task_id = task.id
                    task_key = str(task_id)

                    execution_context[
                        "results"
                    ][task_id] = result

                    execution_context[
                        "previous_results"
                    ][task_key] = result

                    execution_context[
                        "execution_order"
                    ].append(task_id)

                    # --------------------------------------------------
                    # ÉCHEC
                    # --------------------------------------------------

                    if result.failed:

                        if self._retry_task(task):

                            execution_context[
                                "results"
                            ].pop(
                                task_id,
                                None,
                            )

                            execution_context[
                                "previous_results"
                            ].pop(
                                task_key,
                                None,
                            )

                            if execution_context[
                                "execution_order"
                            ]:

                                execution_context[
                                    "execution_order"
                                ].pop()

                            continue

                        self._mark_blocked_tasks(
                            plan,
                        )

                        continue

                    # --------------------------------------------------
                    # ANNULATION
                    # --------------------------------------------------

                    if result.status == ResultStatus.CANCELLED:

                        task.cancel(
                            reason=(
                                result.message
                                or "Tâche annulée."
                            )
                        )

                        continue

                    # --------------------------------------------------
                    # SUCCÈS
                    # --------------------------------------------------

                    task.complete(
                        output=result.data
                    )

                continue

            # ----------------------------------------------------------
            # Aucune tâche prête.
            # On tente d'abord de propager les blocages.
            # ----------------------------------------------------------

            if self._mark_blocked_tasks(plan):
                continue

            # ----------------------------------------------------------
            # Aucune progression possible.
            # Protection contre les dépendances circulaires,
            # inexistantes ou incohérentes.
            # ----------------------------------------------------------

            self._mark_unresolvable_tasks(
                plan,
            )

            break

    # ------------------------------------------------------------------
    # CONTEXTE D'EXÉCUTION
    # ------------------------------------------------------------------

    def _prepare_execution_context(
        self,
        plan: Any,
        execution_context: Dict[str, Any],
    ) -> None:
        """
        Normalise le contexte partagé avec AIOrchestrator.
        """

        execution_context["plan"] = plan

        if not isinstance(
            execution_context.get("results"),
            dict,
        ):
            execution_context["results"] = {}

        if not isinstance(
            execution_context.get("previous_results"),
            dict,
        ):
            execution_context["previous_results"] = {}

        if not isinstance(
            execution_context.get("execution_order"),
            list,
        ):
            execution_context["execution_order"] = []

        execution_context.setdefault(
            "current_task",
            None,
        )

    # ------------------------------------------------------------------
    # TÂCHES PRÊTES
    # ------------------------------------------------------------------

    def _get_ready_tasks(
        self,
        plan: Any,
    ) -> list[AITask]:
        """
        Retourne les tâches pouvant être exécutées maintenant.
        """

        ready: list[AITask] = []

        for task in plan.tasks:

            if task.is_terminal:
                continue

            if self._dependencies_satisfied(
                task,
                plan,
            ):
                ready.append(task)

        return ready

    # ------------------------------------------------------------------
    # EXECUTION D'UNE TÂCHE
    # ------------------------------------------------------------------

    def _execute_task(
        self,
        task: AITask,
        execution_context: Dict[str, Any],
    ) -> AIResult:
        """
        Exécute une tâche individuelle via TaskExecutor.
        """

        request = execution_context.get(
            "request"
        )

        if task.is_terminal:
            return AIResult.failure_result(
                message="La tâche est déjà terminée.",
                request_id=self._request_id(
                    request
                ),
                errors=[
                    f"La tâche '{task.name}' "
                    "est déjà dans un état terminal."
                ],
            )

        execution_context[
            "current_task"
        ] = task

        task.start()

        # --------------------------------------------------------------
        # Les résultats précédents sont exposés au TaskExecutor.
        #
        # results utilise les UUID comme clés.
        # previous_results utilise les identifiants sous forme de chaînes.
        # --------------------------------------------------------------

        execution_context[
            "previous_results"
        ] = {
            str(key): value
            for key, value in execution_context[
                "results"
            ].items()
        }

        try:

            result = self.executor.execute(
                task,
                execution_context,
            )

        except Exception as exc:

            task.fail(
                str(exc)
            )

            return AIResult.failure_result(
                message=(
                    f"La tâche '{task.name}' "
                    "a échoué pendant son exécution."
                ),
                request_id=self._request_id(
                    request
                ),
                errors=[
                    str(exc)
                ],
                metadata={
                    "task": task.name,
                    "task_type": task.task_type.value,
                    "execution": "runner",
                    "exception": exc.__class__.__name__,
                },
            )

        finally:

            execution_context[
                "current_task"
            ] = None

        if not isinstance(
            result,
            AIResult,
        ):

            result = AIResult.success_result(
                data=result,
                request_id=self._request_id(
                    request
                ),
                message="Tâche exécutée.",
                metadata={
                    "task": task.name,
                    "task_type": task.task_type.value,
                    "execution": "runner",
                },
            )

        if result.failed:

            task.fail(
                result.message
                or "La tâche a échoué."
            )

        return result

    # ------------------------------------------------------------------
    # RETRY
    # ------------------------------------------------------------------

    def _retry_task(
        self,
        task: AITask,
    ) -> bool:
        """
        Relance une tâche lorsque son budget de retry
        le permet.
        """

        if not task.can_retry:
            return False

        task.retry()

        return True

    # ------------------------------------------------------------------
    # DÉPENDANCES
    # ------------------------------------------------------------------

    def _dependencies_satisfied(
        self,
        task: AITask,
        plan: Any,
    ) -> bool:
        """
        Vérifie que toutes les dépendances sont terminées
        avec succès.
        """

        if not task.dependencies:
            return True

        for dependency_id in task.dependencies:

            dependency = self._get_task(
                plan,
                dependency_id,
            )

            if dependency is None:
                return False

            if dependency.status != TaskStatus.COMPLETED:
                return False

        return True

    # ------------------------------------------------------------------
    # PROPAGATION DES BLOCAGES
    # ------------------------------------------------------------------

    def _mark_blocked_tasks(
        self,
        plan: Any,
    ) -> bool:
        """
        Annule les tâches dépendant d'une tâche échouée
        ou annulée.

        Fonctionne également avec plusieurs niveaux
        de dépendances.

        Retourne True si au moins une tâche a été bloquée.
        """

        changed = False

        while True:

            iteration_changed = False

            for task in plan.tasks:

                if task.is_terminal:
                    continue

                for dependency_id in task.dependencies:

                    dependency = self._get_task(
                        plan,
                        dependency_id,
                    )

                    if dependency is None:
                        continue

                    if dependency.status in {
                        TaskStatus.FAILED,
                        TaskStatus.CANCELLED,
                    }:

                        task.cancel(
                            reason=(
                                "Tâche bloquée : "
                                f"la dépendance "
                                f"'{dependency.name}' "
                                "a échoué ou a été annulée."
                            )
                        )

                        iteration_changed = True
                        changed = True

                        break

            if not iteration_changed:
                break

        return changed

    # ------------------------------------------------------------------
    # WORKFLOW IRRÉSOLVABLE
    # ------------------------------------------------------------------

    def _mark_unresolvable_tasks(
        self,
        plan: Any,
    ) -> None:
        """
        Annule les tâches restantes lorsqu'aucune progression
        n'est possible.

        Cela protège notamment contre :
        - les dépendances circulaires ;
        - les dépendances inexistantes ;
        - les états incohérents.
        """

        for task in plan.tasks:

            if task.is_terminal:
                continue

            task.cancel(
                reason=(
                    "Tâche non exécutable : "
                    "les dépendances du workflow "
                    "ne peuvent pas être satisfaites."
                )
            )

    # ------------------------------------------------------------------
    # RECHERCHE DE TÂCHE
    # ------------------------------------------------------------------

    def _get_task(
        self,
        plan: Any,
        task_id: Any,
    ) -> Optional[AITask]:
        """
        Recherche une tâche dans le TaskPlan.
        """

        if task_id is None:
            return None

        if hasattr(
            plan,
            "get_task",
        ):

            try:

                task = plan.get_task(
                    task_id
                )

                if task is not None:
                    return task

            except (
                KeyError,
                ValueError,
                TypeError,
            ):
                pass

        target_id = str(task_id)

        for task in plan.tasks:

            if str(task.id) == target_id:
                return task

        return None

    # ------------------------------------------------------------------
    # ÉTAT DU WORKFLOW
    # ------------------------------------------------------------------

    def _is_finished(
        self,
        plan: Any,
    ) -> bool:

        if hasattr(
            plan,
            "is_finished",
        ):
            return bool(
                plan.is_finished()
            )

        return all(
            task.is_terminal
            for task in plan.tasks
        )

    # ------------------------------------------------------------------
    # PRÉPARATION DU PLAN
    # ------------------------------------------------------------------

    def _prepare_plan(
        self,
        plan: Any,
    ) -> None:
        """
        Prépare un plan avant exécution.

        Une tâche restée RUNNING après une exécution interrompue
        revient à l'état PENDING.
        """

        for task in plan.tasks:

            if task.status == TaskStatus.RUNNING:

                task.status = (
                    TaskStatus.PENDING
                )

                task.started_at = None

    # ------------------------------------------------------------------
    # SÉRIALISATION
    # ------------------------------------------------------------------

    def _serialize_tasks(
        self,
        plan: Any,
    ) -> list:
        """
        Sérialise les tâches du plan.
        """

        return [
            task.to_dict()
            for task in plan.tasks
        ]

    # ------------------------------------------------------------------
    # IDENTIFIANT DE REQUÊTE
    # ------------------------------------------------------------------

    @staticmethod
    def _request_id(
        request: Any,
    ) -> Optional[str]:

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

    # ------------------------------------------------------------------
    # REPRESENTATION
    # ------------------------------------------------------------------

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"executor={self.executor!r}"
            f")"
        )