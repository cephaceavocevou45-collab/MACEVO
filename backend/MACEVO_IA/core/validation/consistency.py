"""
MACEVO IA — Validation de cohérence scientifique.

Vérifie les relations entre :
- citations et références bibliographiques ;
- équations et références d'équations ;
- figures et références de figures ;
- tableaux et références de tableaux ;
- labels et références internes.

Cette couche est volontairement non destructive :
elle détecte les incohérences mais ne modifie jamais le document.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

from core.document.ir import (
    Document,
    Equation,
    Figure,
    Paragraph,
    Section,
    Table,
)


class ConsistencySeverity(str, Enum):
    """Niveau de gravité d'une incohérence."""

    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


@dataclass
class ConsistencyIssue:
    """Une incohérence détectée dans le document."""

    code: str
    message: str
    severity: ConsistencySeverity

    element_type: Optional[str] = None
    element_id: Optional[str] = None
    label: Optional[str] = None

    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "code": self.code,
            "message": self.message,
            "severity": self.severity.value,
            "element_type": self.element_type,
            "element_id": self.element_id,
            "label": self.label,
            "metadata": self.metadata,
        }


@dataclass
class ConsistencyResult:
    """Résultat complet de la validation de cohérence."""

    valid: bool

    errors: List[ConsistencyIssue] = field(default_factory=list)
    warnings: List[ConsistencyIssue] = field(default_factory=list)
    infos: List[ConsistencyIssue] = field(default_factory=list)

    statistics: Dict[str, int] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def issues(self) -> List[ConsistencyIssue]:
        """Retourne toutes les incohérences détectées."""
        return self.errors + self.warnings + self.infos

    def to_dict(self) -> Dict[str, Any]:
        return {
            "valid": self.valid,
            "errors": [issue.to_dict() for issue in self.errors],
            "warnings": [issue.to_dict() for issue in self.warnings],
            "infos": [issue.to_dict() for issue in self.infos],
            "statistics": self.statistics,
            "metadata": self.metadata,
        }


class ScientificConsistencyValidator:
    """
    Validateur de cohérence interne d'un document scientifique.

    Le validateur ne juge pas la vérité scientifique d'une affirmation.
    Il vérifie uniquement la cohérence documentaire entre les objets
    et leurs références internes.
    """

    VERSION = "1.0"

    # ------------------------------------------------------------------
    # API publique
    # ------------------------------------------------------------------

    def validate(self, document: Document) -> ConsistencyResult:
        """
        Valide la cohérence globale du document.

        La validation est non destructive :
        aucune modification n'est apportée au document.
        """

        errors: List[ConsistencyIssue] = []
        warnings: List[ConsistencyIssue] = []
        infos: List[ConsistencyIssue] = []

        # --------------------------------------------------------------
        # Vérification du document
        # --------------------------------------------------------------

        if not isinstance(document, Document):
            errors.append(
                ConsistencyIssue(
                    code="INVALID_DOCUMENT",
                    message=(
                        "L'objet fourni n'est pas un Document "
                        "MACEVO valide."
                    ),
                    severity=ConsistencySeverity.ERROR,
                )
            )

            return ConsistencyResult(
                valid=False,
                errors=errors,
                warnings=warnings,
                infos=infos,
                statistics={
                    "errors": 1,
                    "warnings": 0,
                    "infos": 0,
                },
                metadata={
                    "validator": "scientific_consistency",
                    "version": self.VERSION,
                },
            )

        # --------------------------------------------------------------
        # Collecte des éléments
        # --------------------------------------------------------------

        sections = list(self._iter_sections(document))
        paragraphs = list(self._iter_paragraphs(document))
        equations = list(self._iter_equations(document))
        figures = list(self._iter_figures(document))
        tables = list(self._iter_tables(document))
        references = list(
            getattr(document, "references", []) or []
        )

        # --------------------------------------------------------------
        # Texte global du document
        # --------------------------------------------------------------

        all_text = "\n".join(
            paragraph.content
            for paragraph in paragraphs
            if isinstance(
                getattr(paragraph, "content", None),
                str,
            )
        )

        # --------------------------------------------------------------
        # Labels des éléments scientifiques
        # --------------------------------------------------------------

        equation_labels = self._collect_labels(
            equations,
            element_type="equation",
            errors=errors,
        )

        figure_labels = self._collect_labels(
            figures,
            element_type="figure",
            errors=errors,
        )

        table_labels = self._collect_labels(
            tables,
            element_type="table",
            errors=errors,
        )

        # --------------------------------------------------------------
        # Références internes
        # --------------------------------------------------------------

        equation_refs = self._extract_internal_refs(
            all_text,
            prefixes=("eq", "equation"),
        )

        figure_refs = self._extract_internal_refs(
            all_text,
            prefixes=("fig", "figure"),
        )

        table_refs = self._extract_internal_refs(
            all_text,
            prefixes=("tab", "table"),
        )

        # --------------------------------------------------------------
        # ÉQUATIONS
        # --------------------------------------------------------------

        self._validate_internal_references(
            references=equation_refs,
            labels=equation_labels,
            element_type="equation",
            errors=errors,
            warnings=warnings,
        )

        self._validate_orphan_labels(
            labels=equation_labels,
            references=equation_refs,
            element_type="equation",
            warnings=warnings,
        )

        # --------------------------------------------------------------
        # FIGURES
        # --------------------------------------------------------------

        self._validate_internal_references(
            references=figure_refs,
            labels=figure_labels,
            element_type="figure",
            errors=errors,
            warnings=warnings,
        )

        self._validate_orphan_labels(
            labels=figure_labels,
            references=figure_refs,
            element_type="figure",
            warnings=warnings,
        )

        # --------------------------------------------------------------
        # TABLEAUX
        # --------------------------------------------------------------

        self._validate_internal_references(
            references=table_refs,
            labels=table_labels,
            element_type="table",
            errors=errors,
            warnings=warnings,
        )

        self._validate_orphan_labels(
            labels=table_labels,
            references=table_refs,
            element_type="table",
            warnings=warnings,
        )

        # --------------------------------------------------------------
        # BIBLIOGRAPHIE
        # --------------------------------------------------------------

        citation_keys = self._collect_citation_keys(
            references
        )

        citations = self._extract_citations(
            all_text
        )

        self._validate_citations(
            citations=citations,
            citation_keys=citation_keys,
            errors=errors,
            warnings=warnings,
        )

        self._validate_uncited_references(
            references=references,
            citations=citations,
            warnings=warnings,
        )

        # --------------------------------------------------------------
        # COLLISIONS DE LABELS
        # --------------------------------------------------------------

        self._validate_global_label_collisions(
            equation_labels=equation_labels,
            figure_labels=figure_labels,
            table_labels=table_labels,
            errors=errors,
        )

        # --------------------------------------------------------------
        # Statistiques
        # --------------------------------------------------------------

        statistics = {
            "sections": len(sections),
            "paragraphs": len(paragraphs),
            "equations": len(equations),
            "figures": len(figures),
            "tables": len(tables),
            "references": len(references),

            "equation_labels": len(equation_labels),
            "figure_labels": len(figure_labels),
            "table_labels": len(table_labels),

            "equation_references": len(equation_refs),
            "figure_references": len(figure_refs),
            "table_references": len(table_refs),

            "citations": len(citations),

            "errors": len(errors),
            "warnings": len(warnings),
            "infos": len(infos),
        }

        return ConsistencyResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            infos=infos,
            statistics=statistics,
            metadata={
                "validator": "scientific_consistency",
                "version": self.VERSION,
                "document_id": str(document.id),
            },
        )

    # ------------------------------------------------------------------
    # Sections et éléments
    # ------------------------------------------------------------------

    def _iter_sections(
        self,
        document: Document,
    ) -> Iterable[Section]:
        """Parcourt récursivement toutes les sections."""

        for section in getattr(
            document,
            "sections",
            [],
        ) or []:
            yield from self._walk_sections(section)

    def _walk_sections(
        self,
        section: Section,
    ) -> Iterable[Section]:
        """Parcourt récursivement une section et ses enfants."""

        yield section

        for child in getattr(
            section,
            "sections",
            [],
        ) or []:
            yield from self._walk_sections(child)

    def _iter_paragraphs(
        self,
        document: Document,
    ) -> Iterable[Paragraph]:
        """Retourne tous les paragraphes du document."""

        for section in self._iter_sections(document):
            for paragraph in getattr(
                section,
                "paragraphs",
                [],
            ) or []:
                yield paragraph

    def _iter_equations(
        self,
        document: Document,
    ) -> Iterable[Equation]:
        """Retourne toutes les équations du document."""

        for section in self._iter_sections(document):
            for equation in getattr(
                section,
                "equations",
                [],
            ) or []:
                yield equation

    def _iter_figures(
        self,
        document: Document,
    ) -> Iterable[Figure]:
        """Retourne toutes les figures du document."""

        for section in self._iter_sections(document):
            for figure in getattr(
                section,
                "figures",
                [],
            ) or []:
                yield figure

    def _iter_tables(
        self,
        document: Document,
    ) -> Iterable[Table]:
        """Retourne tous les tableaux du document."""

        for section in self._iter_sections(document):
            for table in getattr(
                section,
                "tables",
                [],
            ) or []:
                yield table

    # ------------------------------------------------------------------
    # Labels
    # ------------------------------------------------------------------

    def _collect_labels(
        self,
        elements: Iterable[Any],
        *,
        element_type: str,
        errors: List[ConsistencyIssue],
    ) -> Dict[str, Any]:
        """
        Collecte les labels d'un type d'élément.

        Détecte également les doublons.
        """

        labels: Dict[str, Any] = {}

        for element in elements:
            label = getattr(
                element,
                "label",
                None,
            )

            if not label:
                continue

            normalized = str(label).strip()

            if not normalized:
                continue

            if normalized in labels:
                errors.append(
                    ConsistencyIssue(
                        code="DUPLICATE_LABEL",
                        message=(
                            f"Le label '{normalized}' est utilisé "
                            f"plusieurs fois pour des "
                            f"{element_type}s."
                        ),
                        severity=ConsistencySeverity.ERROR,
                        element_type=element_type,
                        element_id=str(
                            getattr(
                                element,
                                "id",
                                "",
                            )
                        ),
                        label=normalized,
                    )
                )

                continue

            labels[normalized] = element

        return labels

    def _validate_global_label_collisions(
        self,
        *,
        equation_labels: Dict[str, Any],
        figure_labels: Dict[str, Any],
        table_labels: Dict[str, Any],
        errors: List[ConsistencyIssue],
    ) -> None:
        """
        Détecte un même label utilisé par plusieurs catégories
        d'éléments scientifiques.
        """

        all_labels: Dict[str, str] = {}

        for element_type, labels in (
            ("equation", equation_labels),
            ("figure", figure_labels),
            ("table", table_labels),
        ):
            for label in labels:
                if label in all_labels:
                    errors.append(
                        ConsistencyIssue(
                            code="GLOBAL_LABEL_COLLISION",
                            message=(
                                f"Le label '{label}' est partagé "
                                f"entre {all_labels[label]} "
                                f"et {element_type}."
                            ),
                            severity=ConsistencySeverity.ERROR,
                            element_type=element_type,
                            label=label,
                            metadata={
                                "previous_element_type": (
                                    all_labels[label]
                                ),
                            },
                        )
                    )
                else:
                    all_labels[label] = element_type

    # ------------------------------------------------------------------
    # Références internes
    # ------------------------------------------------------------------

    def _extract_internal_refs(
        self,
        text: str,
        *,
        prefixes: Tuple[str, ...],
    ) -> Set[str]:
        """
        Extrait les références internes.

        Formats supportés :

        LaTeX :
            \\ref{eq:test}
            \\eqref{eq:test}

        Format textuel :
            eq:test
            fig:test
            tab:test
        """

        references: Set[str] = set()

        # --------------------------------------------------------------
        # Références LaTeX
        # --------------------------------------------------------------

        latex_pattern = re.compile(
            r"\\(?:eqref|ref)\{([^}]+)\}",
            re.IGNORECASE,
        )

        for match in latex_pattern.finditer(text):
            label = match.group(1).strip()

            if self._matches_prefix(
                label,
                prefixes,
            ):
                references.add(label)

        # --------------------------------------------------------------
        # Références textuelles
        # --------------------------------------------------------------

        prefix_pattern = "|".join(
            re.escape(prefix)
            for prefix in prefixes
        )

        textual_pattern = re.compile(
            rf"\b(?:{prefix_pattern})"
            rf"[:_-][A-Za-z0-9_.-]+\b",
            re.IGNORECASE,
        )

        for match in textual_pattern.finditer(text):
            references.add(
                match.group(0).strip()
            )

        return references

    def _matches_prefix(
        self,
        label: str,
        prefixes: Tuple[str, ...],
    ) -> bool:
        """Vérifie si un label possède un préfixe valide."""

        lowered = label.lower()

        return any(
            lowered.startswith(
                prefix.lower() + ":"
            )
            or lowered.startswith(
                prefix.lower() + "_"
            )
            or lowered.startswith(
                prefix.lower() + "-"
            )
            for prefix in prefixes
        )

    def _validate_internal_references(
        self,
        *,
        references: Set[str],
        labels: Dict[str, Any],
        element_type: str,
        errors: List[ConsistencyIssue],
        warnings: List[ConsistencyIssue],
    ) -> None:
        """
        Vérifie que chaque référence interne possède une cible.
        """

        target_names = {
            "equation": (
                "une équation",
                "inexistante",
            ),
            "figure": (
                "une figure",
                "inexistante",
            ),
            "table": (
                "un tableau",
                "inexistant",
            ),
        }

        target_name, adjective = target_names.get(
            element_type,
            (
                f"un élément de type {element_type}",
                "inexistant",
            ),
        )

        for reference in sorted(references):
            if reference in labels:
                continue

            errors.append(
                ConsistencyIssue(
                    code="MISSING_INTERNAL_TARGET",
                    message=(
                        f"La référence '{reference}' pointe vers "
                        f"{target_name} {adjective}."
                    ),
                    severity=ConsistencySeverity.ERROR,
                    element_type=element_type,
                    label=reference,
                )
            )

    def _validate_orphan_labels(
        self,
        *,
        labels: Dict[str, Any],
        references: Set[str],
        element_type: str,
        warnings: List[ConsistencyIssue],
    ) -> None:
        """
        Détecte les éléments possédant un label mais jamais référencés.
        """

        for label, element in labels.items():
            if label in references:
                continue

            warnings.append(
                ConsistencyIssue(
                    code="UNREFERENCED_ELEMENT",
                    message=(
                        f"Le {element_type} portant le label "
                        f"'{label}' n'est référencé dans aucun "
                        f"paragraphe."
                    ),
                    severity=ConsistencySeverity.WARNING,
                    element_type=element_type,
                    element_id=str(
                        getattr(
                            element,
                            "id",
                            "",
                        )
                    ),
                    label=label,
                )
            )

    # ------------------------------------------------------------------
    # Citations et bibliographie
    # ------------------------------------------------------------------

    def _collect_citation_keys(
        self,
        references: Iterable[Any],
    ) -> Dict[str, Any]:
        """Collecte les clés bibliographiques."""

        keys: Dict[str, Any] = {}

        for reference in references:
            key = getattr(
                reference,
                "citation_key",
                None,
            )

            if not key:
                continue

            normalized = str(key).strip()

            if normalized:
                keys[normalized] = reference

        return keys

    def _extract_citations(
        self,
        text: str,
    ) -> Set[str]:
        """
        Extrait les citations bibliographiques.

        Formats supportés :

        LaTeX :
            \\cite{dupont2025}
            \\citep{dupont2025}
            \\citet{dupont2025,smith2024}

        Markdown :
            [@dupont2025]
        """

        citations: Set[str] = set()

        # --------------------------------------------------------------
        # Citations LaTeX
        # --------------------------------------------------------------

        latex_pattern = re.compile(
            r"\\cite[a-zA-Z*]*\{([^}]+)\}",
            re.IGNORECASE,
        )

        for match in latex_pattern.finditer(text):
            content = match.group(1)

            for key in content.split(","):
                key = key.strip()

                if key:
                    citations.add(key)

        # --------------------------------------------------------------
        # Citations Markdown
        # --------------------------------------------------------------

        markdown_pattern = re.compile(
            r"\[@([A-Za-z0-9_.:-]+)\]",
            re.IGNORECASE,
        )

        for match in markdown_pattern.finditer(text):
            citations.add(
                match.group(1).strip()
            )

        return citations

    def _validate_citations(
        self,
        *,
        citations: Set[str],
        citation_keys: Dict[str, Any],
        errors: List[ConsistencyIssue],
        warnings: List[ConsistencyIssue],
    ) -> None:
        """Vérifie que chaque citation possède une référence."""

        if not citations:
            return

        for citation in sorted(citations):
            if citation in citation_keys:
                continue

            errors.append(
                ConsistencyIssue(
                    code="MISSING_BIBLIOGRAPHIC_REFERENCE",
                    message=(
                        f"La citation '{citation}' est utilisée "
                        f"dans le document mais aucune référence "
                        f"bibliographique correspondante "
                        f"n'existe."
                    ),
                    severity=ConsistencySeverity.ERROR,
                    element_type="reference",
                    label=citation,
                )
            )

    def _validate_uncited_references(
        self,
        *,
        references: Iterable[Any],
        citations: Set[str],
        warnings: List[ConsistencyIssue],
    ) -> None:
        """
        Détecte les références bibliographiques présentes mais
        jamais citées dans le document.
        """

        for reference in references:
            key = getattr(
                reference,
                "citation_key",
                None,
            )

            if not key:
                continue

            key = str(key).strip()

            if not key:
                continue

            if key in citations:
                continue

            warnings.append(
                ConsistencyIssue(
                    code="UNCITED_REFERENCE",
                    message=(
                        f"La référence bibliographique '{key}' "
                        f"existe mais n'est citée dans aucun "
                        f"paragraphe."
                    ),
                    severity=ConsistencySeverity.WARNING,
                    element_type="reference",
                    element_id=str(
                        getattr(
                            reference,
                            "id",
                            "",
                        )
                    ),
                    label=key,
                )
            )