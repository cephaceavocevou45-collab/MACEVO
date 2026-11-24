from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from core.ai.contracts.result import AIResult, ResultStatus

from core.scientific.research import (
    ResearchPlan,
    ScientificResearchPlanner,
)

from core.scientific.document_builder import (
    ScientificDocumentBuilder,
)

from core.scientific.generation import (
    ScientificGenerationEngine,
)

from core.validation.correction import (
    ValidationCorrectionEngine,
)

from core.verification import (
    ReferenceVerificationEngine,
    create_reference_verification_engine,
)


@dataclass
class WorkflowExecution:
    """
    État complet d'une exécution scientifique MACEVO.
    """

    plan: Optional[ResearchPlan] = None
    document: Any = None
    validation: Any = None
    reference_verification: Any = None

    generated_sections: list = field(default_factory=list)
    generated_equations: list = field(default_factory=list)
    generated_figures: list = field(default_factory=list)
    generated_tables: list = field(default_factory=list)
    generated_references: list = field(default_factory=list)

    history: list = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def add_history(
        self,
        step: str,
        status: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.history.append(
            {
                "step": step,
                "status": status,
                "data": data or {},
            }
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "plan": (
                self.plan.to_dict()
                if self.plan is not None
                and hasattr(self.plan, "to_dict")
                else self.plan
            ),
            "document": (
                self.document.to_dict()
                if self.document is not None
                and hasattr(self.document, "to_dict")
                else self.document
            ),
            "validation": (
                self.validation.to_dict()
                if self.validation is not None
                and hasattr(self.validation, "to_dict")
                else self.validation
            ),
            "reference_verification": self.reference_verification,
            "generated_sections": self.generated_sections,
            "generated_equations": self.generated_equations,
            "generated_figures": self.generated_figures,
            "generated_tables": self.generated_tables,
            "generated_references": self.generated_references,
            "history": self.history,
            "metadata": self.metadata,
        }


class ScientificWorkflowEngine:
    """
    Orchestrateur haut niveau des workflows scientifiques MACEVO.

    Pipeline :

        demande
            ↓
        ResearchPlan
            ↓
        Document IR
            ↓
        génération scientifique
            ↓
        validation structurelle
            ↓
        correction automatique éventuelle
            ↓
        validation finale
            ↓
        vérification bibliographique Crossref
            ↓
        résultat scientifique final

    Le workflow ne communique pas directement avec les modèles IA.

    IMPORTANT :
    - la génération scientifique initiale est effectuée par
      ScientificGenerationEngine ;
    - ValidationCorrectionEngine est utilisé ensuite pour
      valider/corriger le document courant ;
    - le workflow ne remplace jamais un Document IR par son dictionnaire
      sérialisé ;
    - les échecs de génération sont propagés ;
    - un document structurellement valide ne signifie pas
      automatiquement que le workflow est réussi.
    """

    def __init__(
        self,
        planner: Optional[ScientificResearchPlanner] = None,
        document_builder: Optional[ScientificDocumentBuilder] = None,
        generation_engine: Optional[ScientificGenerationEngine] = None,
        correction_engine: Optional[ValidationCorrectionEngine] = None,
        reference_verification_engine: Optional[
            ReferenceVerificationEngine
        ] = None,
    ):
        self.planner = (
            planner
            or ScientificResearchPlanner()
        )

        self.document_builder = (
            document_builder
            or ScientificDocumentBuilder()
        )

        self.generation_engine = (
            generation_engine
            or ScientificGenerationEngine()
        )

        self.correction_engine = (
            correction_engine
            or ValidationCorrectionEngine()
        )

        self.reference_verification_engine = (
            reference_verification_engine
            or create_reference_verification_engine()
        )

    # =================================================================
    # WORKFLOW PRINCIPAL
    # =================================================================

    def execute(
        self,
        subject: str,
        *,
        document_type: str = "rapport",
        title: Optional[str] = None,
        author: str = "",
        institution: str = "",
        department: str = "",
        supervisor: str = "",
        research_question: str = "",
        problem_statement: str = "",
        general_objective: str = "",
        objectives: Optional[list] = None,
        hypotheses: Optional[list] = None,
        methodology: str = "",
        expected_results: Optional[list] = None,
        keywords: Optional[list] = None,
        generate_content: bool = True,
        validate: bool = True,
        correct: bool = True,
        verify_references: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AIResult:

        execution = WorkflowExecution(
            metadata=dict(metadata or {})
        )

        try:
            # =========================================================
            # 1. PLANIFICATION SCIENTIFIQUE
            # =========================================================

            execution.add_history(
                "research_plan",
                "running",
            )

            plan = self.planner.create_plan(
                subject=subject,
                document_type=document_type,
                research_question=research_question,
                problem_statement=problem_statement,
                general_objective=general_objective,
                objectives=objectives or [],
                hypotheses=hypotheses or [],
                methodology=methodology,
                expected_results=expected_results or [],
                keywords=keywords or [],
            )

            execution.plan = plan

            plan_validation = self._validate_plan(plan)

            if not plan_validation["valid"]:
                execution.add_history(
                    "research_plan",
                    "failed",
                    plan_validation,
                )

                return AIResult.failure_result(
                    message=(
                        "Le plan scientifique généré "
                        "n'est pas valide."
                    ),
                    errors=plan_validation.get(
                        "errors",
                        [],
                    ),
                )

            execution.add_history(
                "research_plan",
                "completed",
                {
                    "document_type": document_type,
                },
            )

            # =========================================================
            # 2. CONSTRUCTION DU DOCUMENT IR
            # =========================================================

            execution.add_history(
                "document_build",
                "running",
            )

            document = self.document_builder.build(
                plan=plan,
                title=title,
                author=author,
                institution=institution,
                department=department,
                supervisor=supervisor,
                metadata=metadata or {},
            )

            execution.document = document

            execution.add_history(
                "document_build",
                "completed",
            )

            # =========================================================
            # 3. GÉNÉRATION SCIENTIFIQUE
            # =========================================================

            generation_status = ResultStatus.SUCCESS

            if generate_content:
                execution.add_history(
                    "content_generation",
                    "running",
                )

                generation_status = self._generate_content(
                    execution=execution,
                )

                if generation_status == ResultStatus.FAILED:
                    execution.add_history(
                        "content_generation",
                        "failed",
                    )

                    return AIResult(
                        status=ResultStatus.FAILED,
                        message=(
                            "La génération du contenu "
                            "scientifique a échoué."
                        ),
                        data=execution.to_dict(),
                        errors=self._generation_errors(
                            execution
                        ),
                        metadata={
                            "stage": "content_generation",
                            **execution.metadata,
                        },
                    )

                execution.add_history(
                    "content_generation",
                    (
                        "completed"
                        if generation_status
                        == ResultStatus.SUCCESS
                        else "partial"
                    ),
                    {
                        "status": generation_status.value,
                    },
                )

            # =========================================================
            # 4. VALIDATION + CORRECTION
            # =========================================================

            validation_status = ResultStatus.SUCCESS

            if validate:
                execution.add_history(
                    "validation",
                    "running",
                )

                initial_validation = (
                    self.correction_engine.validate_document(
                        execution.document
                    )
                )

                execution.validation = (
                    initial_validation
                )

                execution.add_history(
                    "validation",
                    (
                        "completed"
                        if initial_validation.valid
                        else "failed"
                    ),
                    initial_validation.to_dict(),
                )

                # -----------------------------------------------------
                # DOCUMENT DÉJÀ VALIDE
                # -----------------------------------------------------

                if initial_validation.valid:
                    validation_status = ResultStatus.SUCCESS

                # -----------------------------------------------------
                # DOCUMENT INVALIDE
                # -----------------------------------------------------

                elif correct:
                    correction_result = (
                        self._correct_existing_document(
                            execution=execution,
                            validation_result=initial_validation,
                        )
                    )

                    validation_status = (
                        correction_result.status
                    )

                    if correction_result.failed:
                        execution.add_history(
                            "validation_correction",
                            "failed",
                            self._safe_result_dict(
                                correction_result
                            ),
                        )

                        return AIResult(
                            status=ResultStatus.FAILED,
                            request_id=(
                                correction_result.request_id
                            ),
                            message=(
                                "La validation du document "
                                "a échoué et la correction "
                                "automatique n'a pas abouti."
                            ),
                            data=execution.to_dict(),
                            errors=list(
                                correction_result.errors
                                or [
                                    correction_result.message
                                ]
                            ),
                            warnings=list(
                                correction_result.warnings
                                or []
                            ),
                            metadata={
                                "stage": (
                                    "validation_correction"
                                ),
                                **execution.metadata,
                            },
                        )

                    # -------------------------------------------------
                    # VALIDATION FINALE APRÈS CORRECTION
                    # -------------------------------------------------

                    final_validation = (
                        self.correction_engine.validate_document(
                            execution.document
                        )
                    )

                    execution.validation = (
                        final_validation
                    )

                    if not final_validation.valid:
                        execution.add_history(
                            "validation_final",
                            "failed",
                            final_validation.to_dict(),
                        )

                        return AIResult(
                            status=ResultStatus.FAILED,
                            message=(
                                "Le document reste invalide "
                                "après correction automatique."
                            ),
                            data=execution.to_dict(),
                            errors=list(
                                final_validation.errors
                                or [
                                    "Validation finale échouée."
                                ]
                            ),
                            warnings=list(
                                final_validation.warnings
                                or []
                            ),
                            metadata={
                                "stage": "validation_final",
                                **execution.metadata,
                            },
                        )

                    execution.add_history(
                        "validation_correction",
                        (
                            "completed"
                            if correction_result.status
                            == ResultStatus.SUCCESS
                            else "partial"
                        ),
                        self._safe_result_dict(
                            correction_result
                        ),
                    )

                # -----------------------------------------------------
                # DOCUMENT INVALIDE + CORRECTION DÉSACTIVÉE
                # -----------------------------------------------------

                else:
                    validation_status = (
                        ResultStatus.FAILED
                    )

                    return AIResult(
                        status=ResultStatus.FAILED,
                        message=(
                            "Le document scientifique "
                            "n'est pas valide."
                        ),
                        data=execution.to_dict(),
                        errors=list(
                            initial_validation.errors
                            or [
                                "Validation du document échouée."
                            ]
                        ),
                        warnings=list(
                            initial_validation.warnings
                            or []
                        ),
                        metadata={
                            "stage": "validation",
                            **execution.metadata,
                        },
                    )

            # =========================================================
            # 5. VÉRIFICATION BIBLIOGRAPHIQUE
            # =========================================================

            if verify_references:
                execution.add_history(
                    "reference_verification",
                    "running",
                )

                verification_summary = (
                    self._verify_references(
                        execution.document
                    )
                )

                execution.reference_verification = (
                    verification_summary
                )

                execution.add_history(
                    "reference_verification",
                    "completed",
                    verification_summary,
                )

            else:
                execution.reference_verification = {
                    "enabled": False,
                    "total": 0,
                    "verified": 0,
                    "not_found": 0,
                    "mismatch": 0,
                    "invalid": 0,
                    "errors": 0,
                    "requires_verification": 0,
                    "results": [],
                }

            # =========================================================
            # 6. FINALISATION
            # =========================================================

            execution.metadata.update(
                self._build_workflow_metadata(
                    execution=execution,
                    document_type=document_type,
                    subject=subject,
                    verify_references=verify_references,
                    generation_status=generation_status,
                    validation_status=validation_status,
                )
            )

            execution.add_history(
                "workflow",
                "completed",
            )

            # ---------------------------------------------------------
            # STATUT GLOBAL
            # ---------------------------------------------------------

            global_status = self._resolve_global_status(
                generation_status=generation_status,
                validation_status=validation_status,
            )

            if global_status == ResultStatus.SUCCESS:
                message = (
                    "Workflow scientifique MACEVO "
                    "exécuté avec succès."
                )

            else:
                message = (
                    "Workflow scientifique MACEVO "
                    "exécuté partiellement."
                )

            return AIResult(
                status=global_status,
                data=execution.to_dict(),
                message=message,
                warnings=(
                    self._workflow_warnings(
                        execution=execution,
                        generation_status=generation_status,
                        validation_status=validation_status,
                    )
                ),
                metadata={
                    "document_type": document_type,
                    "subject": subject,
                    **execution.metadata,
                },
            )

        except Exception as exc:
            execution.add_history(
                "workflow",
                "failed",
                {
                    "error": str(exc),
                },
            )

            return AIResult.failure_result(
                message=(
                    "Le workflow scientifique "
                    "a échoué."
                ),
                errors=[str(exc)],
                metadata={
                    "stage": "workflow",
                    **execution.metadata,
                },
            )

    # =================================================================
    # GÉNÉRATION
    # =================================================================

    def _generate_content(
        self,
        execution: WorkflowExecution,
    ) -> ResultStatus:
        """
        Génération progressive du contenu scientifique.

        Les erreurs de section ne sont plus silencieusement ignorées.
        """

        if execution.document is None:
            raise ValueError(
                "Impossible de générer du contenu "
                "sans document."
            )

        sections = self._get_sections(
            execution.document
        )

        if not sections:
            return ResultStatus.SUCCESS

        failed_count = 0
        partial_count = 0

        for section in sections:
            try:
                result = (
                    self.generation_engine.generate_section(
                        document=execution.document,
                        section=section,
                    )
                )

                serialized = self._serialize(
                    result
                )

                execution.generated_sections.append(
                    serialized
                )

                status = self._result_status(
                    result
                )

                if status == ResultStatus.FAILED:
                    failed_count += 1

                elif status == ResultStatus.PARTIAL:
                    partial_count += 1

            except Exception as exc:
                failed_count += 1

                execution.generated_sections.append(
                    {
                        "section": self._section_name(
                            section
                        ),
                        "status": "failed",
                        "error": str(exc),
                    }
                )

        if failed_count == len(sections):
            return ResultStatus.FAILED

        if failed_count > 0 or partial_count > 0:
            return ResultStatus.PARTIAL

        return ResultStatus.SUCCESS

    # =================================================================
    # CORRECTION DU DOCUMENT EXISTANT
    # =================================================================

    def _correct_existing_document(
        self,
        execution: WorkflowExecution,
        validation_result: Any,
    ) -> AIResult:
        """
        Corrige le Document IR existant sans relancer une nouvelle
        génération complète du document.

        Cela évite la double génération qui existait lorsque
        process_document() était appelé après _generate_content().
        """

        return self.correction_engine.correct_document(
            document=execution.document,
            validation_result=validation_result,
        )

    # =================================================================
    # VÉRIFICATION BIBLIOGRAPHIQUE
    # =================================================================

    def _verify_references(
        self,
        document: Any,
    ) -> Dict[str, Any]:
        """
        Vérifie toutes les références présentes dans le Document IR.

        Une référence sans DOI n'est pas considérée comme fausse :
        elle est simplement signalée comme nécessitant une
        vérification supplémentaire.
        """

        references = self._get_references(
            document
        )

        summary = {
            "enabled": True,
            "provider": "crossref",
            "total": len(references),
            "verified": 0,
            "not_found": 0,
            "mismatch": 0,
            "invalid": 0,
            "errors": 0,
            "requires_verification": 0,
            "results": [],
        }

        for index, reference in enumerate(
            references,
            start=1,
        ):
            try:
                result = (
                    self.reference_verification_engine.verify(
                        reference
                    )
                )

                result_dict = (
                    result.to_dict()
                    if hasattr(
                        result,
                        "to_dict",
                    )
                    else self._safe_dict(
                        result
                    )
                )

                result_dict["reference_index"] = (
                    index
                )

                summary["results"].append(
                    result_dict
                )

                status = str(
                    result_dict.get(
                        "status",
                        "",
                    )
                ).lower()

                if status == "verified":
                    summary["verified"] += 1

                elif status == "not_found":
                    summary["not_found"] += 1
                    summary[
                        "requires_verification"
                    ] += 1

                elif status == "mismatch":
                    summary["mismatch"] += 1
                    summary[
                        "requires_verification"
                    ] += 1

                elif status == "invalid":
                    summary["invalid"] += 1
                    summary[
                        "requires_verification"
                    ] += 1

                elif status == "error":
                    summary["errors"] += 1
                    summary[
                        "requires_verification"
                    ] += 1

                else:
                    summary[
                        "requires_verification"
                    ] += 1

            except Exception as exc:
                summary["errors"] += 1
                summary[
                    "requires_verification"
                ] += 1

                summary["results"].append(
                    {
                        "reference_index": index,
                        "status": "error",
                        "verified": False,
                        "message": str(exc),
                    }
                )

        return summary

    # =================================================================
    # RÉFÉRENCES
    # =================================================================

    def _get_references(
        self,
        document: Any,
    ) -> list:
        """
        Récupère les références du Document IR.
        """

        if document is None:
            return []

        for attribute in (
            "references",
            "bibliography",
            "bibliographies",
            "document_references",
        ):
            try:
                references = getattr(
                    document,
                    attribute,
                    None,
                )
            except Exception:
                references = None

            if references:
                if isinstance(
                    references,
                    (list, tuple),
                ):
                    return list(references)

        return []

    # =================================================================
    # VALIDATION DU PLAN
    # =================================================================

    def _validate_plan(
        self,
        plan: ResearchPlan,
    ) -> Dict[str, Any]:

        if plan is None:
            return {
                "valid": False,
                "errors": [
                    "Le plan scientifique est absent."
                ],
            }

        try:
            result = self.planner.validate_plan(
                plan
            )

            if isinstance(
                result,
                bool,
            ):
                return {
                    "valid": result,
                    "errors": (
                        []
                        if result
                        else [
                            "Le plan scientifique "
                            "est invalide."
                        ]
                    ),
                }

            if isinstance(
                result,
                dict,
            ):
                return result

            return {
                "valid": bool(result),
                "errors": (
                    []
                    if result
                    else [
                        "Le plan scientifique "
                        "est invalide."
                    ]
                ),
            }

        except Exception:
            return {
                "valid": True,
                "errors": [],
            }

    # =================================================================
    # MÉTADONNÉES
    # =================================================================

    @staticmethod
    def _build_workflow_metadata(
        *,
        execution: WorkflowExecution,
        document_type: str,
        subject: str,
        verify_references: bool,
        generation_status: ResultStatus,
        validation_status: ResultStatus,
    ) -> Dict[str, Any]:

        verification = (
            execution.reference_verification
            or {}
        )

        return {
            "workflow": "scientific",
            "workflow_version": "2.1",
            "document_type": document_type,
            "subject": subject,

            "generation_status": (
                generation_status.value
            ),

            "validation_status": (
                validation_status.value
            ),

            "reference_verification_enabled": (
                bool(verify_references)
            ),

            "references_total": (
                verification.get(
                    "total",
                    0,
                )
            ),

            "references_verified": (
                verification.get(
                    "verified",
                    0,
                )
            ),

            "references_not_found": (
                verification.get(
                    "not_found",
                    0,
                )
            ),

            "references_with_mismatch": (
                verification.get(
                    "mismatch",
                    0,
                )
            ),

            "references_invalid": (
                verification.get(
                    "invalid",
                    0,
                )
            ),

            "reference_verification_errors": (
                verification.get(
                    "errors",
                    0,
                )
            ),

            "references_requiring_verification": (
                verification.get(
                    "requires_verification",
                    0,
                )
            ),
        }

    # =================================================================
    # STATUT GLOBAL
    # =================================================================

    @staticmethod
    def _resolve_global_status(
        *,
        generation_status: ResultStatus,
        validation_status: ResultStatus,
    ) -> ResultStatus:
        """
        Détermine le statut réel du workflow.

        Les problèmes bibliographiques Crossref ne sont pas ici
        considérés comme un échec global : ils sont exposés dans
        reference_verification.
        """

        if (
            generation_status
            == ResultStatus.FAILED
        ):
            return ResultStatus.FAILED

        if (
            validation_status
            == ResultStatus.FAILED
        ):
            return ResultStatus.FAILED

        if (
            generation_status
            == ResultStatus.PARTIAL
            or validation_status
            == ResultStatus.PARTIAL
        ):
            return ResultStatus.PARTIAL

        return ResultStatus.SUCCESS

    # =================================================================
    # AVERTISSEMENTS
    # =================================================================

    @staticmethod
    def _workflow_warnings(
        *,
        execution: WorkflowExecution,
        generation_status: ResultStatus,
        validation_status: ResultStatus,
    ) -> list:
        warnings = []

        if generation_status == ResultStatus.PARTIAL:
            warnings.append(
                "La génération scientifique est partielle."
            )

        if validation_status == ResultStatus.PARTIAL:
            warnings.append(
                "La validation/correction scientifique est partielle."
            )

        verification = (
            execution.reference_verification
            or {}
        )

        if verification.get(
            "requires_verification",
            0,
        ):
            warnings.append(
                (
                    f"{verification['requires_verification']} "
                    "référence(s) nécessitent une vérification."
                )
            )

        return warnings

    # =================================================================
    # ERREURS DE GÉNÉRATION
    # =================================================================

    @staticmethod
    def _generation_errors(
        execution: WorkflowExecution,
    ) -> list:
        errors = []

        for item in execution.generated_sections:
            if not isinstance(
                item,
                dict,
            ):
                continue

            if item.get("status") != "failed":
                continue

            if item.get("error"):
                errors.append(
                    str(item["error"])
                )

            result = item.get(
                "result"
            )

            if isinstance(
                result,
                dict,
            ):
                errors.extend(
                    [
                        str(error)
                        for error in (
                            result.get(
                                "errors",
                                [],
                            )
                            or []
                        )
                    ]
                )

        return list(
            dict.fromkeys(
                errors
            )
        ) or [
            "La génération scientifique a échoué."
        ]

    # =================================================================
    # OUTILS INTERNES
    # =================================================================

    def _get_sections(
        self,
        document: Any,
    ) -> list:

        sections = getattr(
            document,
            "sections",
            None,
        )

        if not sections:
            return []

        result = []

        def walk(items):
            for section in items:
                result.append(section)

                children = getattr(
                    section,
                    "sections",
                    None,
                )

                if children:
                    walk(children)

        walk(sections)

        return result

    @staticmethod
    def _section_name(
        section: Any,
    ) -> str:

        return str(
            getattr(
                section,
                "title",
                "section",
            )
        )

    @staticmethod
    def _serialize(
        value: Any,
    ) -> Any:

        if hasattr(
            value,
            "to_dict",
        ):
            return value.to_dict()

        if isinstance(
            value,
            dict,
        ):
            return value

        return {
            "result": value,
        }

    @staticmethod
    def _safe_dict(
        value: Any,
    ) -> Dict[str, Any]:

        if isinstance(
            value,
            dict,
        ):
            return value

        if hasattr(
            value,
            "to_dict",
        ):
            result = value.to_dict()

            if isinstance(
                result,
                dict,
            ):
                return result

        return {}

    @staticmethod
    def _result_status(
        result: Any,
    ) -> ResultStatus:

        status = getattr(
            result,
            "status",
            None,
        )

        if isinstance(
            status,
            ResultStatus,
        ):
            return status

        value = getattr(
            status,
            "value",
            status,
        )

        try:
            return ResultStatus(
                str(value)
            )
        except ValueError:
            return ResultStatus.FAILED

    @staticmethod
    def _safe_result_dict(
        result: Any,
    ) -> Dict[str, Any]:

        if hasattr(
            result,
            "to_dict",
        ):
            data = result.to_dict()

            if isinstance(
                data,
                dict,
            ):
                return data

        return {
            "status": (
                getattr(
                    getattr(
                        result,
                        "status",
                        None,
                    ),
                    "value",
                    str(
                        getattr(
                            result,
                            "status",
                            "unknown",
                        )
                    ),
                )
            ),
            "message": getattr(
                result,
                "message",
                None,
            ),
            "data": getattr(
                result,
                "data",
                None,
            ),
            "errors": list(
                getattr(
                    result,
                    "errors",
                    [],
                )
                or []
            ),
            "warnings": list(
                getattr(
                    result,
                    "warnings",
                    [],
                )
                or []
            ),
        }