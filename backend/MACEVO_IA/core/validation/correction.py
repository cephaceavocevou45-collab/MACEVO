"""
MACEVO — Moteur de validation et de correction scientifique.

Pipeline :

    Génération
        ↓
    Validation structurelle
        ↓
    Validation scientifique
        ↓
    Validation de cohérence
        ↓
    Correction déterministe
        ↓
    Revalidation
        ↓
    Correction IA ciblée si nécessaire
        ↓
    Revalidation finale

Principe important :
- les corrections déterministes sont prioritaires ;
- l'IA ne doit pas inventer une référence, une figure, une équation
  ou une donnée scientifique inexistante ;
- les problèmes de cohérence scientifique non résolvables
  automatiquement restent explicitement non résolus ;
- toute correction est suivie d'une nouvelle validation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from core.ai.contracts.result import (
    AIResult,
    ResultStatus,
)

from core.scientific.generation import GenerationEngine
from core.validation.scientific import ScientificValidator
from core.validation.consistency import ScientificConsistencyValidator
from core.validation.scientific_correction import (
    ScientificConsistencyCorrector,
    ScientificCorrectionResult,
)

try:
    from core.document.ir import (
        Document,
        Section,
        Paragraph,
    )
except ImportError:
    Document = Any
    Section = Any
    Paragraph = Any


# ============================================================================
# RÉSULTAT GLOBAL
# ============================================================================

@dataclass
class ValidationCorrectionResult:
    """
    Résultat complet du processus de validation/correction.
    """

    status: ResultStatus
    document: Any = None

    generation_result: Optional[AIResult] = None
    structural_result: Optional[Any] = None
    scientific_result: Optional[Any] = None
    consistency_result: Optional[Any] = None

    correction_result: Optional[ScientificCorrectionResult] = None

    errors: List[Any] = field(default_factory=list)
    warnings: List[Any] = field(default_factory=list)
    history: List[Dict[str, Any]] = field(default_factory=list)

    attempts: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def success(self) -> bool:
        return self.status == ResultStatus.SUCCESS

    @property
    def partial(self) -> bool:
        return self.status == ResultStatus.PARTIAL

    @property
    def failed(self) -> bool:
        return self.status == ResultStatus.FAILED

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value
            if hasattr(self.status, "value")
            else str(self.status),
            "success": self.success,
            "partial": self.partial,
            "failed": self.failed,
            "attempts": self.attempts,
            "errors": self.errors,
            "warnings": self.warnings,
            "history": self.history,
            "metadata": self.metadata,
        }


# ============================================================================
# MOTEUR PRINCIPAL
# ============================================================================

class ValidationCorrectionEngine:
    """
    Moteur central de validation et de correction scientifique MACEVO.

    Responsabilités :

    1. générer le contenu ;
    2. effectuer les validations ;
    3. appliquer les corrections déterministes ;
    4. revalider ;
    5. utiliser l'IA uniquement lorsque la correction est sûre ;
    6. ne jamais inventer une information scientifique manquante.
    """

    VERSION = "2.0.0"

    def __init__(
        self,
        generation_engine: Optional[GenerationEngine] = None,
        validation_engine: Optional[Any] = None,
        scientific_validator: Optional[ScientificValidator] = None,
        consistency_validator: Optional[
            ScientificConsistencyValidator
        ] = None,
        consistency_corrector: Optional[
            ScientificConsistencyCorrector
        ] = None,
        max_attempts: int = 3,
    ):
        self.generation_engine = (
            generation_engine
            or GenerationEngine()
        )

        self.validation_engine = validation_engine

        self.scientific_validator = (
            scientific_validator
            or ScientificValidator()
        )

        self.consistency_validator = (
            consistency_validator
            or ScientificConsistencyValidator()
        )

        self.consistency_corrector = (
            consistency_corrector
            or ScientificConsistencyCorrector()
        )

        self.max_attempts = max(1, int(max_attempts))

    # ========================================================================
    # PROCESSUS PRINCIPAL
    # ========================================================================

    def process_document(
        self,
        document: Any,
        *,
        context: Optional[Dict[str, Any]] = None,
        generate: bool = True,
        validate: bool = True,
    ) -> ValidationCorrectionResult:
        """
        Exécute le pipeline complet.

        Les corrections déterministes sont toujours prioritaires.

        Si une incohérence scientifique reste non résolue mais qu'aucune
        correction sûre n'est possible, le document est retourné en PARTIAL
        plutôt que de laisser l'IA inventer une solution.
        """

        context = context or {}

        history: List[Dict[str, Any]] = []

        generation_result: Optional[AIResult] = None
        structural_result = None
        scientific_result = None
        consistency_result = None
        correction_result = None

        current_document = document

        for attempt in range(1, self.max_attempts + 1):

            # ----------------------------------------------------------------
            # 1. GÉNÉRATION
            # ----------------------------------------------------------------

            if generate:
                generation_result = self._generate(
                    current_document,
                    context=context,
                )

                history.append(
                    self._history_entry(
                        stage="generation",
                        attempt=attempt,
                        result=generation_result,
                    )
                )

                if generation_result.failed:
                    return ValidationCorrectionResult(
                        status=ResultStatus.FAILED,
                        document=current_document,
                        generation_result=generation_result,
                        errors=list(
                            getattr(
                                generation_result,
                                "errors",
                                [],
                            )
                            or []
                        ),
                        warnings=list(
                            getattr(
                                generation_result,
                                "warnings",
                                [],
                            )
                            or []
                        ),
                        history=history,
                        attempts=attempt,
                        metadata={
                            "engine_version": self.VERSION,
                            "failure_stage": "generation",
                        },
                    )

            # ----------------------------------------------------------------
            # 2. VALIDATION
            # ----------------------------------------------------------------

            if validate:
                (
                    structural_result,
                    scientific_result,
                    consistency_result,
                ) = self._validate_document(
                    current_document
                )

                history.append(
                    {
                        "stage": "validation",
                        "attempt": attempt,
                        "structural": self._safe_to_dict(
                            structural_result
                        ),
                        "scientific": self._safe_to_dict(
                            scientific_result
                        ),
                        "consistency": self._safe_to_dict(
                            consistency_result
                        ),
                    }
                )

                if self._all_valid(
                    structural_result,
                    scientific_result,
                    consistency_result,
                ):
                    return self._build_success_result(
                        document=current_document,
                        generation_result=generation_result,
                        structural_result=structural_result,
                        scientific_result=scientific_result,
                        consistency_result=consistency_result,
                        correction_result=correction_result,
                        history=history,
                        attempts=attempt,
                    )

            # ----------------------------------------------------------------
            # 3. CORRECTION DÉTERMINISTE
            # ----------------------------------------------------------------

            deterministic_result = (
                self._apply_deterministic_correction(
                    current_document,
                    consistency_result,
                )
            )

            if deterministic_result is not None:

                correction_result = deterministic_result

                history.append(
                    {
                        "stage": "deterministic_correction",
                        "attempt": attempt,
                        "result": self._safe_to_dict(
                            deterministic_result
                        ),
                    }
                )

                # ------------------------------------------------------------
                # 4. REVALIDATION APRÈS CORRECTION DÉTERMINISTE
                # ------------------------------------------------------------

                (
                    structural_result,
                    scientific_result,
                    consistency_result,
                ) = self._validate_document(
                    current_document
                )

                history.append(
                    {
                        "stage": "revalidation_after_deterministic_correction",
                        "attempt": attempt,
                        "structural": self._safe_to_dict(
                            structural_result
                        ),
                        "scientific": self._safe_to_dict(
                            scientific_result
                        ),
                        "consistency": self._safe_to_dict(
                            consistency_result
                        ),
                    }
                )

                if self._all_valid(
                    structural_result,
                    scientific_result,
                    consistency_result,
                ):
                    return self._build_success_result(
                        document=current_document,
                        generation_result=generation_result,
                        structural_result=structural_result,
                        scientific_result=scientific_result,
                        consistency_result=consistency_result,
                        correction_result=correction_result,
                        history=history,
                        attempts=attempt,
                    )

            # ----------------------------------------------------------------
            # 5. VÉRIFIER S'IL RESTE UNIQUEMENT DES PROBLÈMES
            #    DE COHÉRENCE NON CORRIGEABLES AUTOMATIQUEMENT
            # ----------------------------------------------------------------

            if (
                not self._has_structural_issues(
                    structural_result
                )
                and not self._is_valid(scientific_result)
                is False
            ):
                # Les erreurs scientifiques structurelles nécessitent
                # encore une tentative IA.
                pass

            if (
                not self._has_structural_issues(
                    structural_result
                )
                and self._has_unresolved_consistency(
                    consistency_result
                )
            ):
                return self._build_partial_result(
                    document=current_document,
                    generation_result=generation_result,
                    structural_result=structural_result,
                    scientific_result=scientific_result,
                    consistency_result=consistency_result,
                    correction_result=correction_result,
                    history=history,
                    attempts=attempt,
                    reason=(
                        "Des problèmes de cohérence scientifique "
                        "restent non résolus automatiquement. "
                        "Aucune information scientifique n'a été "
                        "inventée pour tenter de les masquer."
                    ),
                )

            # ----------------------------------------------------------------
            # 6. CORRECTION IA CIBLÉE
            # ----------------------------------------------------------------

            correction_ai_result = self.correct_document(
                current_document,
                structural_result=structural_result,
                scientific_result=scientific_result,
                consistency_result=consistency_result,
                context=context,
            )

            history.append(
                {
                    "stage": "ai_correction",
                    "attempt": attempt,
                    "result": self._safe_to_dict(
                        correction_ai_result
                    ),
                }
            )

            if correction_ai_result.failed:
                return self._build_partial_result(
                    document=current_document,
                    generation_result=generation_result,
                    structural_result=structural_result,
                    scientific_result=scientific_result,
                    consistency_result=consistency_result,
                    correction_result=correction_result,
                    history=history,
                    attempts=attempt,
                    reason=(
                        "La correction automatique n'a pas permis "
                        "de résoudre tous les problèmes."
                    ),
                )

            # Une correction IA peut avoir modifié le document.
            current_document = correction_ai_result.data.get(
                "document",
                current_document,
            )

        # ====================================================================
        # FIN DES TENTATIVES
        # ====================================================================

        (
            structural_result,
            scientific_result,
            consistency_result,
        ) = self._validate_document(
            current_document
        )

        history.append(
            {
                "stage": "final_validation",
                "attempt": self.max_attempts,
                "structural": self._safe_to_dict(
                    structural_result
                ),
                "scientific": self._safe_to_dict(
                    scientific_result
                ),
                "consistency": self._safe_to_dict(
                    consistency_result
                ),
            }
        )

        if self._all_valid(
            structural_result,
            scientific_result,
            consistency_result,
        ):
            return self._build_success_result(
                document=current_document,
                generation_result=generation_result,
                structural_result=structural_result,
                scientific_result=scientific_result,
                consistency_result=consistency_result,
                correction_result=correction_result,
                history=history,
                attempts=self.max_attempts,
            )

        return self._build_partial_result(
            document=current_document,
            generation_result=generation_result,
            structural_result=structural_result,
            scientific_result=scientific_result,
            consistency_result=consistency_result,
            correction_result=correction_result,
            history=history,
            attempts=self.max_attempts,
            reason=(
                "Le document reste partiellement non valide "
                "après toutes les tentatives de correction."
            ),
        )

    # ========================================================================
    # GÉNÉRATION
    # ========================================================================

    def _generate(
        self,
        document: Any,
        *,
        context: Dict[str, Any],
    ) -> AIResult:
        """
        Lance la génération scientifique.
        """

        try:
            result = self.generation_engine.generate(
                document=document,
                context=context,
            )

            if isinstance(result, AIResult):
                return result

            return AIResult(
                status=ResultStatus.SUCCESS,
                data={
                    "document": document,
                    "source_result": result,
                },
                message="Génération terminée.",
            )

        except Exception as exc:
            return AIResult(
                status=ResultStatus.FAILED,
                data={
                    "document": document,
                },
                message="Erreur pendant la génération.",
                errors=[str(exc)],
            )

    # ========================================================================
    # VALIDATION
    # ========================================================================

    def _validate_document(
        self,
        document: Any,
    ):
        """
        Exécute les différentes couches de validation.
        """

        structural_result = self._validate_structural(
            document
        )

        scientific_result = self._validate_scientific(
            document
        )

        consistency_result = self._validate_consistency(
            document
        )

        return (
            structural_result,
            scientific_result,
            consistency_result,
        )

    def _validate_structural(
        self,
        document: Any,
    ):
        """
        Validation structurelle générale.
        """

        if self.validation_engine is None:
            return self._valid_placeholder(
                "Validation structurelle non configurée."
            )

        try:
            if hasattr(
                self.validation_engine,
                "validate",
            ):
                return self.validation_engine.validate(
                    document
                )

            if hasattr(
                self.validation_engine,
                "validate_document",
            ):
                return self.validation_engine.validate_document(
                    document
                )

        except Exception as exc:
            return self._invalid_placeholder(
                str(exc)
            )

        return self._valid_placeholder(
            "Validation structurelle indisponible."
        )

    def _validate_scientific(
        self,
        document: Any,
    ):
        """
        Validation scientifique.
        """

        try:
            if hasattr(
                self.scientific_validator,
                "validate",
            ):
                return self.scientific_validator.validate(
                    document
                )

        except Exception as exc:
            return self._invalid_placeholder(
                str(exc)
            )

        return self._valid_placeholder(
            "Validation scientifique indisponible."
        )

    def _validate_consistency(
        self,
        document: Any,
    ):
        """
        Validation de cohérence scientifique.
        """

        try:
            if hasattr(
                self.consistency_validator,
                "validate",
            ):
                return self.consistency_validator.validate(
                    document
                )

        except Exception as exc:
            return self._invalid_placeholder(
                str(exc)
            )

        return self._valid_placeholder(
            "Validation de cohérence indisponible."
        )

    # ========================================================================
    # CORRECTION DÉTERMINISTE
    # ========================================================================

    def _apply_deterministic_correction(
        self,
        document: Any,
        consistency_result: Any,
    ) -> Optional[ScientificCorrectionResult]:
        """
        Applique le correcteur scientifique déterministe.

        Le correcteur est utilisé uniquement lorsque la cohérence
        est effectivement invalide.
        """

        if consistency_result is None:
            return None

        if self._is_valid(consistency_result):
            return None

        try:
            return self.consistency_corrector.correct_document(
                document
            )

        except Exception as exc:
            return ScientificCorrectionResult(
                valid=False,
                corrections=[],
                unresolved=[
                    {
                        "type": "correction_engine_error",
                        "message": str(exc),
                    }
                ],
                warnings=[],
                statistics={
                    "corrections": 0,
                    "unresolved": 1,
                    "warnings": 0,
                },
            )

    # ========================================================================
    # CORRECTION IA
    # ========================================================================

    def correct_document(
        self,
        document: Any,
        *,
        structural_result: Any = None,
        scientific_result: Any = None,
        consistency_result: Any = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> AIResult:
        """
        Effectue une correction IA ciblée.

        IMPORTANT :

        L'IA ne reçoit pas pour mission d'inventer :
        - une référence bibliographique ;
        - un DOI ;
        - une figure ;
        - une équation ;
        - une donnée expérimentale ;
        - une source absente.

        Les problèmes de cohérence bibliographique ou de références
        internes non résolus par le correcteur déterministe restent
        explicitement non résolus.
        """

        context = context or {}

        issues = self._extract_issues(
            structural_result
        )

        # ------------------------------------------------------------
        # Aucun problème structurel corrigeable par IA.
        # ------------------------------------------------------------

        if not issues:

            return AIResult(
                status=ResultStatus.PARTIAL,
                data={
                    "document": document,
                    "correction_applied": False,
                    "unresolved_consistency": (
                        self._extract_consistency_issues(
                            consistency_result
                        )
                    ),
                },
                message=(
                    "Aucune correction IA sûre n'est disponible "
                    "pour les problèmes restants."
                ),
                warnings=[
                    (
                        "Les incohérences scientifiques non résolues "
                        "n'ont pas été modifiées automatiquement."
                    )
                ],
            )

        corrected_document = document
        corrections = []
        unresolved = []

        # ------------------------------------------------------------
        # Correction ciblée des paragraphes.
        # ------------------------------------------------------------

        for issue in issues:

            paragraph = self._find_target_paragraph(
                corrected_document,
                issue,
            )

            if paragraph is None:
                unresolved.append(
                    {
                        "type": "paragraph_not_found",
                        "issue": issue,
                    }
                )
                continue

            result = self._correct_paragraph(
                paragraph,
                issue=issue,
                document=corrected_document,
                context=context,
            )

            if result.success:
                corrections.append(
                    {
                        "issue": issue,
                        "result": result.data,
                    }
                )
            else:
                unresolved.append(
                    {
                        "issue": issue,
                        "errors": result.errors,
                    }
                )

        # ------------------------------------------------------------
        # Résultat.
        # ------------------------------------------------------------

        if unresolved:
            return AIResult(
                status=ResultStatus.PARTIAL,
                data={
                    "document": corrected_document,
                    "corrections": corrections,
                    "unresolved": unresolved,
                },
                message=(
                    "Correction IA partiellement appliquée."
                ),
                warnings=[
                    (
                        "Certaines corrections n'ont pas pu être "
                        "appliquées automatiquement."
                    )
                ],
            )

        return AIResult(
            status=ResultStatus.SUCCESS,
            data={
                "document": corrected_document,
                "corrections": corrections,
                "unresolved": [],
            },
            message=(
                "Correction IA ciblée terminée."
            ),
        )

    # ========================================================================
    # CORRECTION D'UN PARAGRAPHE
    # ========================================================================

    def _correct_paragraph(
        self,
        paragraph: Any,
        *,
        issue: Dict[str, Any],
        document: Any,
        context: Dict[str, Any],
    ) -> AIResult:
        """
        Corrige uniquement le paragraphe concerné.
        """

        original_content = getattr(
            paragraph,
            "content",
            "",
        )

        prompt = self._build_correction_prompt(
            paragraph=paragraph,
            issue=issue,
            document=document,
            context=context,
        )

        try:
            result = self.generation_engine.generate_text(
                prompt
            )

            if not isinstance(result, AIResult):
                return AIResult(
                    status=ResultStatus.FAILED,
                    errors=[
                        "Le moteur de génération n'a pas retourné AIResult."
                    ],
                )

            if result.failed:
                return result

            content = self._extract_generated_content(
                result
            )

            if not content:
                return AIResult(
                    status=ResultStatus.FAILED,
                    errors=[
                        "La correction IA a retourné un contenu vide."
                    ],
                )

            paragraph.content = content

            return AIResult(
                status=ResultStatus.SUCCESS,
                data={
                    "paragraph_id": getattr(
                        paragraph,
                        "id",
                        None,
                    ),
                    "original_content": original_content,
                    "corrected_content": content,
                },
                message="Paragraphe corrigé.",
            )

        except Exception as exc:
            return AIResult(
                status=ResultStatus.FAILED,
                errors=[str(exc)],
            )

    # ========================================================================
    # PROMPT DE CORRECTION
    # ========================================================================

    def _build_correction_prompt(
        self,
        *,
        paragraph: Any,
        issue: Dict[str, Any],
        document: Any,
        context: Dict[str, Any],
    ) -> str:
        """
        Construit un prompt strict pour la correction ciblée.
        """

        title = ""

        metadata = getattr(
            document,
            "metadata",
            None,
        )

        if metadata is not None:
            title = getattr(
                metadata,
                "title",
                "",
            )

        paragraph_content = getattr(
            paragraph,
            "content",
            "",
        )

        return f"""
Tu es le moteur de correction scientifique de MACEVO.

DOCUMENT :
{title}

PROBLÈME IDENTIFIÉ :
{issue}

PARAGRAPHE À CORRIGER :
{paragraph_content}

INSTRUCTIONS STRICTES :

1. Corrige uniquement le problème identifié.
2. Conserve le sens scientifique du paragraphe.
3. Ne crée aucune nouvelle donnée.
4. N'invente aucune source.
5. N'invente aucun DOI.
6. N'invente aucune référence bibliographique.
7. N'invente aucune figure ou équation.
8. Ne supprime pas une information scientifique valide simplement
   parce qu'elle est difficile à corriger.
9. Si le problème ne peut pas être corrigé avec certitude à partir
   du contenu existant, conserve le passage concerné plutôt que
   d'inventer une solution.
10. Retourne uniquement le texte corrigé du paragraphe.
"""

    # ========================================================================
    # EXTRACTION DES PROBLÈMES
    # ========================================================================

    def _extract_issues(
        self,
        structural_result: Any,
    ) -> List[Dict[str, Any]]:
        """
        Extrait les problèmes structurels réellement corrigeables.
        """

        if structural_result is None:
            return []

        issues = getattr(
            structural_result,
            "errors",
            None,
        )

        if issues is None:
            issues = getattr(
                structural_result,
                "issues",
                None,
            )

        if issues is None:
            return []

        if not isinstance(issues, list):
            return []

        normalized = []

        for issue in issues:

            if isinstance(issue, dict):
                normalized.append(issue)
                continue

            normalized.append(
                {
                    "message": str(issue),
                }
            )

        return normalized

    def _extract_consistency_issues(
        self,
        consistency_result: Any,
    ) -> List[Any]:
        """
        Extrait les incohérences scientifiques non résolues.
        """

        if consistency_result is None:
            return []

        for attribute in (
            "errors",
            "unresolved",
            "issues",
        ):
            value = getattr(
                consistency_result,
                attribute,
                None,
            )

            if value:
                return list(value)

        return []

    # ========================================================================
    # RECHERCHE DU PARAGRAPHE
    # ========================================================================

    def _find_target_paragraph(
        self,
        document: Any,
        issue: Dict[str, Any],
    ) -> Optional[Any]:
        """
        Recherche le paragraphe ciblé à partir de son identifiant.
        """

        target_id = (
            issue.get("paragraph_id")
            or issue.get("object_id")
            or issue.get("id")
        )

        for paragraph in self._iter_paragraphs(
            document
        ):

            paragraph_id = getattr(
                paragraph,
                "id",
                None,
            )

            if target_id and paragraph_id == target_id:
                return paragraph

        # Certains validateurs peuvent fournir le texte.
        message = str(
            issue.get(
                "message",
                "",
            )
        )

        if message:
            for paragraph in self._iter_paragraphs(
                document
            ):
                content = getattr(
                    paragraph,
                    "content",
                    "",
                )

                if content and content in message:
                    return paragraph

        return None

    def _iter_paragraphs(
        self,
        document: Any,
    ):
        """
        Parcours récursif des paragraphes.
        """

        sections = getattr(
            document,
            "sections",
            [],
        )

        for section in sections or []:
            yield from self._iter_section_paragraphs(
                section
            )

    def _iter_section_paragraphs(
        self,
        section: Any,
    ):
        paragraphs = getattr(
            section,
            "paragraphs",
            [],
        )

        for paragraph in paragraphs or []:
            yield paragraph

        children = getattr(
            section,
            "sections",
            [],
        )

        for child in children or []:
            yield from self._iter_section_paragraphs(
                child
            )

    # ========================================================================
    # ÉTAT / VALIDATION
    # ========================================================================

    def _all_valid(
        self,
        structural_result: Any,
        scientific_result: Any,
        consistency_result: Any,
    ) -> bool:
        return (
            self._is_valid(structural_result)
            and self._is_valid(scientific_result)
            and self._is_valid(consistency_result)
        )

    def _is_valid(
        self,
        result: Any,
    ) -> bool:
        if result is None:
            return False

        value = getattr(
            result,
            "valid",
            None,
        )

        if value is not None:
            return bool(value)

        value = getattr(
            result,
            "success",
            None,
        )

        if value is not None:
            return bool(value)

        return False

    def _has_structural_issues(
        self,
        result: Any,
    ) -> bool:
        return bool(
            self._extract_issues(result)
        )

    def _has_unresolved_consistency(
        self,
        result: Any,
    ) -> bool:
        if result is None:
            return False

        if self._is_valid(result):
            return False

        return bool(
            self._extract_consistency_issues(result)
        )

    # ========================================================================
    # RÉSULTATS
    # ========================================================================

    def _build_success_result(
        self,
        *,
        document: Any,
        generation_result: Optional[AIResult],
        structural_result: Any,
        scientific_result: Any,
        consistency_result: Any,
        correction_result: Any,
        history: List[Dict[str, Any]],
        attempts: int,
    ) -> ValidationCorrectionResult:

        status = ResultStatus.SUCCESS

        if (
            generation_result is not None
            and generation_result.status
            == ResultStatus.PARTIAL
        ):
            status = ResultStatus.PARTIAL

        return ValidationCorrectionResult(
            status=status,
            document=document,
            generation_result=generation_result,
            structural_result=structural_result,
            scientific_result=scientific_result,
            consistency_result=consistency_result,
            correction_result=correction_result,
            history=history,
            attempts=attempts,
            metadata={
                "engine_version": self.VERSION,
                "validated": True,
                "correction_applied": (
                    correction_result is not None
                ),
            },
        )

    def _build_partial_result(
        self,
        *,
        document: Any,
        generation_result: Optional[AIResult],
        structural_result: Any,
        scientific_result: Any,
        consistency_result: Any,
        correction_result: Any,
        history: List[Dict[str, Any]],
        attempts: int,
        reason: str,
    ) -> ValidationCorrectionResult:

        errors = []

        for result in (
            structural_result,
            scientific_result,
            consistency_result,
        ):
            if result is None:
                continue

            errors.extend(
                list(
                    getattr(
                        result,
                        "errors",
                        [],
                    )
                    or []
                )
            )

        return ValidationCorrectionResult(
            status=ResultStatus.PARTIAL,
            document=document,
            generation_result=generation_result,
            structural_result=structural_result,
            scientific_result=scientific_result,
            consistency_result=consistency_result,
            correction_result=correction_result,
            errors=errors,
            history=history,
            attempts=attempts,
            metadata={
                "engine_version": self.VERSION,
                "validated": False,
                "reason": reason,
                "unresolved_consistency": (
                    self._extract_consistency_issues(
                        consistency_result
                    )
                ),
            },
        )

    # ========================================================================
    # UTILITAIRES
    # ========================================================================

    def _extract_generated_content(
        self,
        result: AIResult,
    ) -> str:
        """
        Extrait proprement le texte produit par GenerationEngine.
        """

        data = getattr(
            result,
            "data",
            None,
        )

        if isinstance(data, str):
            return data.strip()

        if isinstance(data, dict):

            for key in (
                "content",
                "text",
                "response",
                "generated_text",
            ):
                value = data.get(key)

                if isinstance(value, str):
                    return value.strip()

        message = getattr(
            result,
            "message",
            None,
        )

        if isinstance(message, str):
            return message.strip()

        return ""

    def _safe_to_dict(
        self,
        value: Any,
    ) -> Any:
        if value is None:
            return None

        if isinstance(value, dict):
            return value

        if hasattr(value, "to_dict"):
            try:
                return value.to_dict()
            except Exception:
                pass

        if hasattr(value, "__dict__"):
            try:
                return dict(value.__dict__)
            except Exception:
                pass

        return str(value)

    def _history_entry(
        self,
        *,
        stage: str,
        attempt: int,
        result: Any,
    ) -> Dict[str, Any]:
        return {
            "stage": stage,
            "attempt": attempt,
            "result": self._safe_to_dict(
                result
            ),
        }

    def _valid_placeholder(
        self,
        message: str,
    ):
        class Placeholder:
            valid = True
            errors = []
            warnings = []

            def __init__(self, message):
                self.message = message

            def to_dict(self):
                return {
                    "valid": True,
                    "errors": [],
                    "warnings": [],
                    "message": self.message,
                }

        return Placeholder(message)

    def _invalid_placeholder(
        self,
        message: str,
    ):
        class Placeholder:
            valid = False
            warnings = []

            def __init__(self, message):
                self.message = message
                self.errors = [message]

            def to_dict(self):
                return {
                    "valid": False,
                    "errors": self.errors,
                    "warnings": [],
                    "message": self.message,
                }

        return Placeholder(message)