from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from core.document.ir import Document, Section


@dataclass
class ValidationIssue:
    """
    Problème détecté pendant la validation.
    """

    severity: str
    code: str
    message: str
    location: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "severity": self.severity,
            "code": self.code,
            "message": self.message,
            "location": self.location,
            "metadata": self.metadata,
        }


@dataclass
class ValidationResult:
    """
    Résultat complet d'une validation.
    """

    valid: bool = True
    issues: List[ValidationIssue] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def errors(self) -> List[ValidationIssue]:
        return [
            issue
            for issue in self.issues
            if issue.severity == "error"
        ]

    @property
    def warnings(self) -> List[ValidationIssue]:
        return [
            issue
            for issue in self.issues
            if issue.severity == "warning"
        ]

    def add_error(
        self,
        code: str,
        message: str,
        *,
        location: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.issues.append(
            ValidationIssue(
                severity="error",
                code=code,
                message=message,
                location=location,
                metadata=metadata or {},
            )
        )

        self.valid = False

    def add_warning(
        self,
        code: str,
        message: str,
        *,
        location: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.issues.append(
            ValidationIssue(
                severity="warning",
                code=code,
                message=message,
                location=location,
                metadata=metadata or {},
            )
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "valid": self.valid,
            "errors": [
                issue.to_dict()
                for issue in self.errors
            ],
            "warnings": [
                issue.to_dict()
                for issue in self.warnings
            ],
            "issues": [
                issue.to_dict()
                for issue in self.issues
            ],
            "metadata": self.metadata,
        }


class ValidationEngine:
    """
    Moteur central de validation MACEVO.

    La validation locale est déterministe et n'effectue aucun
    appel réseau.

    La vérification externe des références est disponible
    explicitement via validate_with_reference_verification().
    """

    def __init__(
        self,
        verification_engine=None,
    ) -> None:
        self.verification_engine = verification_engine

    # ==================================================================
    # API PUBLIQUE
    # ==================================================================

    def validate(
        self,
        document: Document,
    ) -> ValidationResult:
        """
        Effectue la validation locale complète du document.

        Aucun appel réseau n'est effectué.
        """

        self._ensure_document(document)

        result = ValidationResult(
            metadata={
                "document_id": document.id,
                "reference_verification_enabled": False,
            }
        )

        self._validate_metadata(
            document,
            result,
        )

        self._validate_structure(
            document,
            result,
        )

        self._validate_sections(
            document.sections,
            result,
            parent_path="",
        )

        self._validate_references(
            document,
            result,
        )

        self._finalize_metadata(
            document,
            result,
        )

        return result

    def validate_with_reference_verification(
        self,
        document: Document,
        verification_engine=None,
        provider: Optional[str] = None,
    ) -> ValidationResult:
        """
        Effectue :

        1. la validation locale complète ;
        2. la vérification externe des références ;
        3. la validation de l'état des références après vérification.

        La vérification externe est explicitement demandée.
        """

        self._ensure_document(document)

        result = ValidationResult(
            metadata={
                "document_id": document.id,
                "reference_verification_enabled": True,
            }
        )

        self._validate_metadata(
            document,
            result,
        )

        self._validate_structure(
            document,
            result,
        )

        self._validate_sections(
            document.sections,
            result,
            parent_path="",
        )

        active_verification_engine = (
            verification_engine
            or self.verification_engine
        )

        self._verify_references(
            document=document,
            result=result,
            verification_engine=active_verification_engine,
            provider=provider,
        )

        self._validate_references(
            document,
            result,
        )

        self._finalize_metadata(
            document,
            result,
        )

        return result

    def validate_structure(
        self,
        document: Document,
    ) -> ValidationResult:
        """
        Validation uniquement structurelle.
        """

        self._ensure_document(document)

        result = ValidationResult(
            metadata={
                "document_id": document.id,
            }
        )

        self._validate_metadata(
            document,
            result,
        )

        self._validate_structure(
            document,
            result,
        )

        self._validate_sections(
            document.sections,
            result,
            parent_path="",
        )

        self._finalize_metadata(
            document,
            result,
        )

        return result

    # ==================================================================
    # UTILITAIRES
    # ==================================================================

    @staticmethod
    def _ensure_document(
        document: Document,
    ) -> None:
        if not isinstance(document, Document):
            raise TypeError(
                "document doit être une instance de Document."
            )

    # ==================================================================
    # MÉTADONNÉES
    # ==================================================================

    def _validate_metadata(
        self,
        document: Document,
        result: ValidationResult,
    ) -> None:

        if not document.metadata.title.strip():
            result.add_warning(
                "MISSING_TITLE",
                "Le document ne possède pas de titre.",
                location="metadata.title",
            )

        if not document.metadata.author.strip():
            result.add_warning(
                "MISSING_AUTHOR",
                "Le document ne possède pas d'auteur.",
                location="metadata.author",
            )

        if not document.metadata.language.strip():
            result.add_error(
                "MISSING_LANGUAGE",
                "La langue du document est absente.",
                location="metadata.language",
            )

        if not document.metadata.document_type.strip():
            result.add_error(
                "MISSING_DOCUMENT_TYPE",
                "Le type du document est absent.",
                location="metadata.document_type",
            )

    # ==================================================================
    # STRUCTURE
    # ==================================================================

    def _validate_structure(
        self,
        document: Document,
        result: ValidationResult,
    ) -> None:

        if not document.sections:
            result.add_warning(
                "NO_SECTIONS",
                "Le document ne contient aucune section.",
                location="sections",
            )

        previous_level = 0

        for index, section in enumerate(
            document.sections,
            start=1,
        ):

            if section.level <= 0:
                result.add_error(
                    "INVALID_SECTION_LEVEL",
                    "Le niveau d'une section doit être supérieur à zéro.",
                    location=f"sections[{index}]",
                )

            if (
                previous_level > 0
                and section.level > previous_level + 1
            ):
                result.add_warning(
                    "SECTION_LEVEL_GAP",
                    "La hiérarchie des sections contient un saut de niveau.",
                    location=f"sections[{index}]",
                )

            previous_level = section.level

    # ==================================================================
    # SECTIONS
    # ==================================================================

    def _validate_sections(
        self,
        sections: List[Section],
        result: ValidationResult,
        *,
        parent_path: str,
    ) -> None:

        for index, section in enumerate(
            sections,
            start=1,
        ):

            path = (
                f"{parent_path}.sections[{index}]"
                if parent_path
                else f"sections[{index}]"
            )

            if not section.title.strip():
                result.add_error(
                    "EMPTY_SECTION_TITLE",
                    "Une section possède un titre vide.",
                    location=path,
                )

            self._validate_paragraphs(
                section,
                result,
                path,
            )

            self._validate_equations(
                section,
                result,
                path,
            )

            self._validate_figures(
                section,
                result,
                path,
            )

            self._validate_tables(
                section,
                result,
                path,
            )

            self._validate_sections(
                section.sections,
                result,
                parent_path=path,
            )

    # ==================================================================
    # PARAGRAPHES
    # ==================================================================

    def _validate_paragraphs(
        self,
        section: Section,
        result: ValidationResult,
        path: str,
    ) -> None:

        for index, paragraph in enumerate(
            section.paragraphs,
            start=1,
        ):

            if not paragraph.content.strip():
                result.add_error(
                    "EMPTY_PARAGRAPH",
                    "Un paragraphe est vide.",
                    location=(
                        f"{path}.paragraphs[{index}]"
                    ),
                )

    # ==================================================================
    # ÉQUATIONS
    # ==================================================================

    def _validate_equations(
        self,
        section: Section,
        result: ValidationResult,
        path: str,
    ) -> None:

        for index, equation in enumerate(
            section.equations,
            start=1,
        ):

            location = (
                f"{path}.equations[{index}]"
            )

            if not equation.latex.strip():
                result.add_error(
                    "EMPTY_EQUATION",
                    "Une équation ne contient aucune expression LaTeX.",
                    location=location,
                )

            if equation.label is not None:
                label = equation.label.strip()

                if not label:
                    result.add_warning(
                        "EMPTY_EQUATION_LABEL",
                        "Une étiquette d'équation est vide.",
                        location=location,
                    )

    # ==================================================================
    # FIGURES
    # ==================================================================

    def _validate_figures(
        self,
        section: Section,
        result: ValidationResult,
        path: str,
    ) -> None:

        for index, figure in enumerate(
            section.figures,
            start=1,
        ):

            location = (
                f"{path}.figures[{index}]"
            )

            if not figure.source:
                result.add_warning(
                    "FIGURE_WITHOUT_SOURCE",
                    "Une figure ne possède pas de source.",
                    location=location,
                )

            if not figure.caption:
                result.add_warning(
                    "FIGURE_WITHOUT_CAPTION",
                    "Une figure ne possède pas de légende.",
                    location=location,
                )

    # ==================================================================
    # TABLEAUX
    # ==================================================================

    def _validate_tables(
        self,
        section: Section,
        result: ValidationResult,
        path: str,
    ) -> None:

        for index, table in enumerate(
            section.tables,
            start=1,
        ):

            location = (
                f"{path}.tables[{index}]"
            )

            column_count = len(
                table.columns
            )

            if table.rows and column_count == 0:
                result.add_error(
                    "TABLE_WITHOUT_COLUMNS",
                    "Un tableau possède des lignes mais aucune colonne.",
                    location=location,
                )
                continue

            for row_index, row in enumerate(
                table.rows,
                start=1,
            ):

                if len(row) != column_count:
                    result.add_error(
                        "TABLE_COLUMN_MISMATCH",
                        (
                            "Le nombre de cellules d'une ligne "
                            "ne correspond pas au nombre de colonnes."
                        ),
                        location=(
                            f"{location}.rows[{row_index}]"
                        ),
                        metadata={
                            "expected": column_count,
                            "actual": len(row),
                        },
                    )

            if not table.caption:
                result.add_warning(
                    "TABLE_WITHOUT_CAPTION",
                    "Un tableau ne possède pas de légende.",
                    location=location,
                )

    # ==================================================================
    # VÉRIFICATION EXTERNE DES RÉFÉRENCES
    # ==================================================================

    def _verify_references(
        self,
        *,
        document: Document,
        result: ValidationResult,
        verification_engine=None,
        provider: Optional[str] = None,
    ) -> None:
        """
        Vérifie les références auprès du moteur externe.

        Important :

        - absence de DOI = vérification externe impossible ;
        - not_found = avertissement, pas une preuve d'invalidité ;
        - mismatch = avertissement ;
        - invalid = erreur explicite ;
        - error = avertissement technique.
        """

        statistics = {
            "references_verified_externally": 0,
            "references_not_found": 0,
            "references_with_mismatch": 0,
            "reference_verification_errors": 0,
            "references_verification_skipped": 0,
        }

        if verification_engine is None:
            result.add_warning(
                "REFERENCE_VERIFICATION_ENGINE_UNAVAILABLE",
                (
                    "Le moteur de vérification des références "
                    "n'est pas disponible."
                ),
                location="references",
            )

            result.metadata.update(
                statistics
            )

            return

        for index, reference in enumerate(
            document.references,
            start=1,
        ):

            location = (
                f"references[{index}]"
            )

            metadata = self._get_reference_metadata(
                reference
            )

            # ----------------------------------------------------------
            # Référence déjà vérifiée
            # ----------------------------------------------------------

            verification_status = str(
                metadata.get(
                    "verification_status",
                    "",
                )
            ).strip().lower()

            already_verified = (
                metadata.get("verified") is True
                or verification_status == "verified"
            )

            force_verification = bool(
                metadata.get(
                    "force_verification",
                    False,
                )
                or metadata.get(
                    "requires_reverification",
                    False,
                )
            )

            if already_verified and not force_verification:
                statistics[
                    "references_verified_externally"
                ] += 1

                continue

            # ----------------------------------------------------------
            # DOI obligatoire pour Crossref
            # ----------------------------------------------------------

            doi = getattr(
                reference,
                "doi",
                None,
            )

            if not doi:
                statistics[
                    "references_verification_skipped"
                ] += 1

                if metadata.get(
                    "requires_verification"
                ) is True:

                    result.add_warning(
                        "REFERENCE_VERIFICATION_SKIPPED",
                        (
                            "La référence nécessite une vérification, "
                            "mais aucun DOI n'est disponible."
                        ),
                        location=location,
                    )

                continue

            # ----------------------------------------------------------
            # Appel du moteur de vérification
            # ----------------------------------------------------------

            try:
                verification_result = (
                    verification_engine.verify(
                        reference,
                        provider=provider,
                    )
                )

            except Exception as exc:

                statistics[
                    "reference_verification_errors"
                ] += 1

                result.add_warning(
                    "REFERENCE_VERIFICATION_ERROR",
                    (
                        "Une erreur est survenue pendant la "
                        f"vérification de la référence : {exc}"
                    ),
                    location=location,
                )

                continue

            status = getattr(
                verification_result,
                "status",
                None,
            )

            if hasattr(
                status,
                "value",
            ):
                status = status.value

            status = str(
                status or ""
            ).strip().lower()

            verified = bool(
                getattr(
                    verification_result,
                    "verified",
                    False,
                )
            )

            # ----------------------------------------------------------
            # VERIFIED
            # ----------------------------------------------------------

            if (
                verified
                or status == "verified"
            ):
                statistics[
                    "references_verified_externally"
                ] += 1

            # ----------------------------------------------------------
            # NOT FOUND
            # ----------------------------------------------------------

            elif status == "not_found":

                statistics[
                    "references_not_found"
                ] += 1

                result.add_warning(
                    "REFERENCE_NOT_FOUND",
                    (
                        "La référence n'a pas été trouvée "
                        "par le fournisseur de vérification externe."
                    ),
                    location=location,
                )

            # ----------------------------------------------------------
            # MISMATCH
            # ----------------------------------------------------------

            elif status == "mismatch":

                statistics[
                    "references_with_mismatch"
                ] += 1

                result.add_warning(
                    "REFERENCE_METADATA_MISMATCH",
                    (
                        "Les métadonnées de la référence ne correspondent "
                        "pas suffisamment aux données retournées par le "
                        "fournisseur externe."
                    ),
                    location=location,
                )

            # ----------------------------------------------------------
            # INVALID
            # ----------------------------------------------------------

            elif status == "invalid":

                statistics[
                    "reference_verification_errors"
                ] += 1

                result.add_error(
                    "REFERENCE_VERIFICATION_INVALID",
                    (
                        "Le fournisseur externe a indiqué que "
                        "la référence est invalide."
                    ),
                    location=location,
                )

            # ----------------------------------------------------------
            # ERROR
            # ----------------------------------------------------------

            elif status == "error":

                statistics[
                    "reference_verification_errors"
                ] += 1

                result.add_warning(
                    "REFERENCE_VERIFICATION_ERROR",
                    (
                        "Le fournisseur externe a rencontré "
                        "une erreur pendant la vérification."
                    ),
                    location=location,
                )

        result.metadata.update(
            statistics
        )

    # ==================================================================
    # VALIDATION DES RÉFÉRENCES
    # ==================================================================

    def _validate_references(
        self,
        document: Document,
        result: ValidationResult,
    ) -> None:
        """
        Valide l'intégrité bibliographique locale.

        Une référence non vérifiée n'est PAS automatiquement invalide.

        Une référence explicitement invalide produit une erreur.
        """

        verified_count = 0
        unverified_count = 0
        verification_required_count = 0
        invalid_count = 0

        for index, reference in enumerate(
            document.references,
            start=1,
        ):

            location = (
                f"references[{index}]"
            )

            metadata = self._get_reference_metadata(
                reference
            )

            title = self._get_reference_text(
                reference,
                "title",
            )

            authors = getattr(
                reference,
                "authors",
                None,
            )

            # ----------------------------------------------------------
            # Titre
            # ----------------------------------------------------------

            if not title:
                result.add_error(
                    "EMPTY_REFERENCE_TITLE",
                    "Une référence possède un titre vide.",
                    location=location,
                )

                invalid_count += 1

            # ----------------------------------------------------------
            # Auteurs
            # ----------------------------------------------------------

            if not authors:
                result.add_warning(
                    "REFERENCE_WITHOUT_AUTHORS",
                    "Une référence ne possède aucun auteur.",
                    location=location,
                )

            # ----------------------------------------------------------
            # Année
            # ----------------------------------------------------------

            year = getattr(
                reference,
                "year",
                None,
            )

            if year is not None:

                try:
                    numeric_year = int(
                        year
                    )

                    if (
                        numeric_year < 0
                        or numeric_year > 9999
                    ):
                        result.add_error(
                            "INVALID_REFERENCE_YEAR",
                            "L'année d'une référence est invalide.",
                            location=location,
                            metadata={
                                "year": year,
                            },
                        )

                        invalid_count += 1

                except (
                    TypeError,
                    ValueError,
                ):

                    result.add_error(
                        "INVALID_REFERENCE_YEAR",
                        (
                            "L'année d'une référence doit être "
                            "une valeur numérique valide."
                        ),
                        location=location,
                        metadata={
                            "year": year,
                        },
                    )

                    invalid_count += 1

            # ----------------------------------------------------------
            # État de vérification
            # ----------------------------------------------------------

            verification_required = (
                self._reference_requires_verification(
                    reference,
                    metadata,
                )
            )

            verified = (
                self._reference_is_verified(
                    reference,
                    metadata,
                )
            )

            verification_status = str(
                metadata.get(
                    "verification_status",
                    "",
                )
            ).strip().lower()

            if verification_required:
                verification_required_count += 1

            if verified or verification_status == "verified":
                verified_count += 1
            else:
                unverified_count += 1

            # ----------------------------------------------------------
            # Référence explicitement invalide
            # ----------------------------------------------------------

            explicit_invalid = (
                self._reference_is_explicitly_invalid(
                    reference,
                    metadata,
                )
            )

            if explicit_invalid:

                result.add_error(
                    "INVALID_REFERENCE_STATUS",
                    (
                        "Cette référence est explicitement "
                        "marquée comme invalide."
                    ),
                    location=location,
                    metadata={
                        "verified": verified,
                        "requires_verification": (
                            verification_required
                        ),
                        "verification_status": (
                            verification_status
                        ),
                    },
                )

                invalid_count += 1

            # ----------------------------------------------------------
            # Référence nécessitant une vérification
            # ----------------------------------------------------------

            elif verification_required and not verified:

                result.add_warning(
                    "REFERENCE_REQUIRES_VERIFICATION",
                    (
                        "Cette référence nécessite une vérification "
                        "avant de pouvoir être considérée comme une "
                        "source scientifique confirmée."
                    ),
                    location=location,
                    metadata={
                        "verified": verified,
                        "requires_verification": True,
                        "source": self._reference_source(
                            reference,
                            metadata,
                        ),
                    },
                )

            # ----------------------------------------------------------
            # Référence non vérifiée
            # ----------------------------------------------------------

            elif (
                not verified
                and verification_status
                not in {
                    "",
                    "verified",
                    "not_found",
                    "mismatch",
                }
            ):

                result.add_warning(
                    "REFERENCE_NOT_VERIFIED",
                    (
                        "Cette référence possède des informations "
                        "bibliographiques mais n'est pas marquée "
                        "comme vérifiée."
                    ),
                    location=location,
                    metadata={
                        "verified": False,
                        "requires_verification": False,
                        "verification_status": (
                            verification_status
                        ),
                        "source": self._reference_source(
                            reference,
                            metadata,
                        ),
                    },
                )

        result.metadata.update(
            {
                "verified_reference_count": (
                    verified_count
                ),
                "unverified_reference_count": (
                    unverified_count
                ),
                "references_requiring_verification": (
                    verification_required_count
                ),
                "invalid_reference_count": (
                    invalid_count
                ),
            }
        )

    # ==================================================================
    # OUTILS RÉFÉRENCES
    # ==================================================================

    @staticmethod
    def _get_reference_metadata(
        reference: Any,
    ) -> Dict[str, Any]:
        """
        Retourne les métadonnées de la référence.
        """

        metadata = getattr(
            reference,
            "metadata",
            None,
        )

        if isinstance(
            metadata,
            dict,
        ):
            return metadata

        return {}

    @staticmethod
    def _get_reference_text(
        reference: Any,
        attribute: str,
    ) -> str:
        """
        Retourne proprement une valeur textuelle.
        """

        value = getattr(
            reference,
            attribute,
            "",
        )

        if value is None:
            return ""

        return str(
            value
        ).strip()

    @staticmethod
    def _reference_requires_verification(
        reference: Any,
        metadata: Dict[str, Any],
    ) -> bool:
        """
        Détermine si une référence nécessite une vérification.

        La propriété directe de la référence est prioritaire.
        """

        direct_value = getattr(
            reference,
            "requires_verification",
            None,
        )

        if direct_value is not None:
            return bool(
                direct_value
            )

        metadata_value = metadata.get(
            "requires_verification"
        )

        if metadata_value is not None:
            return bool(
                metadata_value
            )

        return False

    @staticmethod
    def _reference_is_verified(
        reference: Any,
        metadata: Dict[str, Any],
    ) -> bool:
        """
        Détermine si une référence est explicitement vérifiée.
        """

        direct_value = getattr(
            reference,
            "verified",
            None,
        )

        if direct_value is not None:
            return bool(
                direct_value
            )

        metadata_value = metadata.get(
            "verified"
        )

        if metadata_value is not None:
            return bool(
                metadata_value
            )

        return False

    @staticmethod
    def _reference_is_explicitly_invalid(
        reference: Any,
        metadata: Dict[str, Any],
    ) -> bool:
        """
        Détermine si une référence est explicitement invalide.

        IMPORTANT :

        'not_found' n'est PAS considéré comme invalide.

        L'absence d'une référence dans Crossref ne constitue pas
        une preuve suffisante pour déclarer scientifiquement la
        référence fausse.
        """

        direct_value = getattr(
            reference,
            "invalid",
            None,
        )

        if direct_value is not None:
            return bool(
                direct_value
            )

        status = metadata.get(
            "verification_status"
        )

        if isinstance(
            status,
            str,
        ):

            normalized = status.strip().lower()

            if normalized in {
                "invalid",
                "rejected",
                "failed",
            }:
                return True

        metadata_invalid = metadata.get(
            "invalid"
        )

        if metadata_invalid is not None:
            return bool(
                metadata_invalid
            )

        return False

    @staticmethod
    def _reference_source(
        reference: Any,
        metadata: Dict[str, Any],
    ) -> str:
        """
        Détermine la provenance déclarée de la référence.
        """

        direct_source = getattr(
            reference,
            "source",
            None,
        )

        if direct_source:
            return str(
                direct_source
            )

        metadata_source = metadata.get(
            "source"
        )

        if metadata_source:
            return str(
                metadata_source
            )

        generated_by = metadata.get(
            "generated_by"
        )

        if generated_by:
            return str(
                generated_by
            )

        return "unknown"

    # ==================================================================
    # FINALISATION
    # ==================================================================

    def _finalize_metadata(
        self,
        document: Document,
        result: ValidationResult,
    ) -> None:

        result.metadata.update(
            {
                "document_id": document.id,
                "section_count": self._count_sections(
                    document.sections
                ),
                "reference_count": len(
                    document.references
                ),
                "error_count": len(
                    result.errors
                ),
                "warning_count": len(
                    result.warnings
                ),
            }
        )

        # Une validation est valide uniquement s'il n'existe
        # aucune erreur. Les avertissements ne rendent pas
        # automatiquement le document invalide.
        result.valid = (
            len(result.errors) == 0
        )

    # ==================================================================
    # COMPTAGE DES SECTIONS
    # ==================================================================

    @staticmethod
    def _count_sections(
        sections: List[Section],
    ) -> int:

        total = 0

        for section in sections:

            total += 1

            total += ValidationEngine._count_sections(
                section.sections
            )

        return total