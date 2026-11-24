from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
import re
from typing import Any, Dict, Iterable, List, Optional, Tuple

from core.document.ir import (
    Document,
    Equation,
    Figure,
    Paragraph,
    Section,
    Table,
)


class CorrectionSeverity(str, Enum):
    """
    Niveau d'une opération de correction.
    """

    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class CorrectionAction(str, Enum):
    """
    Type d'action réalisée par le correcteur.
    """

    RENAMED_LABEL = "renamed_label"
    UPDATED_REFERENCE = "updated_reference"
    UPDATED_CITATION = "updated_citation"
    UNRESOLVED_REFERENCE = "unresolved_reference"
    UNRESOLVED_CITATION = "unresolved_citation"
    ORPHAN_LABEL = "orphan_label"
    DUPLICATE_LABEL = "duplicate_label"
    SKIPPED = "skipped"


@dataclass
class ScientificCorrection:
    """
    Une correction ou anomalie produite par le moteur.
    """

    action: CorrectionAction
    severity: CorrectionSeverity
    message: str

    object_type: Optional[str] = None
    object_id: Optional[str] = None

    old_value: Optional[str] = None
    new_value: Optional[str] = None

    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "action": self.action.value,
            "severity": self.severity.value,
            "message": self.message,
            "object_type": self.object_type,
            "object_id": self.object_id,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "metadata": dict(self.metadata),
        }


@dataclass
class ScientificCorrectionResult:
    """
    Résultat complet d'une correction scientifique.
    """

    valid: bool = True

    corrections: List[ScientificCorrection] = field(
        default_factory=list
    )

    unresolved: List[ScientificCorrection] = field(
        default_factory=list
    )

    warnings: List[ScientificCorrection] = field(
        default_factory=list
    )

    statistics: Dict[str, int] = field(
        default_factory=dict
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    @property
    def correction_count(self) -> int:
        return len(self.corrections)

    @property
    def unresolved_count(self) -> int:
        return len(self.unresolved)

    @property
    def warning_count(self) -> int:
        return len(self.warnings)

    def add_correction(
        self,
        correction: ScientificCorrection,
    ) -> None:
        self.corrections.append(correction)

    def add_unresolved(
        self,
        correction: ScientificCorrection,
    ) -> None:
        self.unresolved.append(correction)
        self.valid = False

    def add_warning(
        self,
        correction: ScientificCorrection,
    ) -> None:
        self.warnings.append(correction)

    def finalize(self) -> "ScientificCorrectionResult":
        self.statistics = {
            "corrections": len(self.corrections),
            "unresolved": len(self.unresolved),
            "warnings": len(self.warnings),
            "renamed_labels": sum(
                1
                for item in self.corrections
                if item.action
                == CorrectionAction.RENAMED_LABEL
            ),
            "updated_references": sum(
                1
                for item in self.corrections
                if item.action
                == CorrectionAction.UPDATED_REFERENCE
            ),
            "updated_citations": sum(
                1
                for item in self.corrections
                if item.action
                == CorrectionAction.UPDATED_CITATION
            ),
        }

        self.valid = len(self.unresolved) == 0

        return self

    def to_dict(self) -> Dict[str, Any]:
        return {
            "valid": self.valid,
            "corrections": [
                item.to_dict()
                for item in self.corrections
            ],
            "unresolved": [
                item.to_dict()
                for item in self.unresolved
            ],
            "warnings": [
                item.to_dict()
                for item in self.warnings
            ],
            "statistics": dict(self.statistics),
            "metadata": dict(self.metadata),
        }


@dataclass
class _LabelInfo:
    """
    Index interne d'un label scientifique.
    """

    label: str
    object_type: str
    object_id: str
    section_id: str
    occurrence_index: int


class ScientificConsistencyCorrector:
    """
    Moteur de correction déterministe de la cohérence scientifique.

    Responsabilités :

    - corriger les labels dupliqués ;
    - conserver les préfixes scientifiques ;
    - mettre à jour les références internes ;
    - mettre à jour les citations bibliographiques lorsque
      la résolution est certaine ;
    - détecter les références internes impossibles à résoudre ;
    - détecter les citations bibliographiques impossibles à résoudre ;
    - ne jamais inventer de contenu scientifique ;
    - ne jamais inventer une référence bibliographique.

    Ce moteur travaille directement sur le Document IR.
    """

    VERSION = "1.0"

    LABEL_PREFIXES = {
        "equation": "eq",
        "figure": "fig",
        "table": "tab",
    }

    INTERNAL_REFERENCE_PATTERN = re.compile(
        r"\\(?:ref|autoref|eqref)\{([^{}]+)\}"
    )

    MARKDOWN_CITATION_PATTERN = re.compile(
        r"\[@([^\]]+)\]"
    )

    LATEX_CITATION_PATTERN = re.compile(
        r"\\cite(?:[a-zA-Z]*)?(?:\[[^\]]*\])?"
        r"\{([^{}]+)\}"
    )

    def __init__(
        self,
        *,
        rename_duplicates: bool = True,
        update_references: bool = True,
        update_citations: bool = True,
        preserve_orphan_labels: bool = True,
    ) -> None:
        self.rename_duplicates = rename_duplicates
        self.update_references = update_references
        self.update_citations = update_citations
        self.preserve_orphan_labels = preserve_orphan_labels

    # ------------------------------------------------------------------
    # API publique
    # ------------------------------------------------------------------

    def correct_document(
        self,
        document: Document,
    ) -> ScientificCorrectionResult:
        """
        Corrige la cohérence relationnelle d'un document.

        La méthode modifie le Document IR en place.

        Elle ne modifie pas :
        - le contenu scientifique d'une équation ;
        - les données d'une figure ;
        - les données d'un tableau ;
        - les métadonnées bibliographiques d'une référence.

        Elle intervient uniquement sur les relations sûres :
        labels, références internes et citations.
        """

        if not isinstance(document, Document):
            raise TypeError(
                "document doit être une instance de Document."
            )

        result = ScientificCorrectionResult()

        label_index = self._build_label_index(
            document,
            result,
        )

        if self.rename_duplicates:
            label_index = self._repair_duplicate_labels(
                document,
                label_index,
                result,
            )

        if self.update_references:
            self._repair_internal_references(
                document,
                label_index,
                result,
            )

        if self.update_citations:
            self._repair_bibliographic_citations(
                document,
                result,
            )

        self._detect_orphan_labels(
            document,
            label_index,
            result,
        )

        result.metadata = {
            "version": self.VERSION,
            "rename_duplicates": self.rename_duplicates,
            "update_references": self.update_references,
            "update_citations": self.update_citations,
            "preserve_orphan_labels": self.preserve_orphan_labels,
        }

        return result.finalize()

    # ------------------------------------------------------------------
    # Indexation
    # ------------------------------------------------------------------

    def _build_label_index(
        self,
        document: Document,
        result: ScientificCorrectionResult,
    ) -> Dict[str, List[_LabelInfo]]:
        """
        Construit un index label -> occurrences.
        """

        index: Dict[str, List[_LabelInfo]] = {}

        occurrence = 0

        for section in self._walk_sections(document):
            for equation in section.equations:
                if not equation.label:
                    continue

                occurrence += 1

                info = _LabelInfo(
                    label=equation.label,
                    object_type="equation",
                    object_id=equation.id,
                    section_id=section.id,
                    occurrence_index=occurrence,
                )

                index.setdefault(
                    equation.label,
                    [],
                ).append(info)

            for figure in section.figures:
                if not figure.label:
                    continue

                occurrence += 1

                info = _LabelInfo(
                    label=figure.label,
                    object_type="figure",
                    object_id=figure.id,
                    section_id=section.id,
                    occurrence_index=occurrence,
                )

                index.setdefault(
                    figure.label,
                    [],
                ).append(info)

            for table in section.tables:
                if not table.label:
                    continue

                occurrence += 1

                info = _LabelInfo(
                    label=table.label,
                    object_type="table",
                    object_id=table.id,
                    section_id=section.id,
                    occurrence_index=occurrence,
                )

                index.setdefault(
                    table.label,
                    [],
                ).append(info)

        return index

    # ------------------------------------------------------------------
    # Labels dupliqués
    # ------------------------------------------------------------------

    def _repair_duplicate_labels(
        self,
        document: Document,
        label_index: Dict[str, List[_LabelInfo]],
        result: ScientificCorrectionResult,
    ) -> Dict[str, List[_LabelInfo]]:
        """
        Renomme les labels dupliqués de manière déterministe.

        Exemple :

            fig:resultat
            fig:resultat

        devient :

            fig:resultat
            fig:resultat-2

        Les références existantes vers le premier objet restent
        inchangées.

        Les références ne peuvent être migrées vers une occurrence
        particulière d'un label dupliqué sans information
        supplémentaire. Le moteur conserve donc le premier label
        et renomme les suivants.
        """

        renamed_mapping: Dict[str, List[Tuple[str, str, str]]] = {}

        for label, occurrences in label_index.items():
            if len(occurrences) <= 1:
                continue

            prefix = self._extract_prefix(label)

            if prefix is None:
                prefix = self._guess_prefix(
                    occurrences[0].object_type
                )

            base = self._strip_prefix(
                label,
                prefix,
            )

            for index, occurrence in enumerate(
                occurrences[1:],
                start=2,
            ):
                new_label = self._generate_unique_label(
                    document=document,
                    prefix=prefix,
                    base=base,
                    starting_number=index,
                )

                changed = self._set_object_label(
                    document=document,
                    object_type=occurrence.object_type,
                    object_id=occurrence.object_id,
                    new_label=new_label,
                )

                if not changed:
                    result.add_warning(
                        ScientificCorrection(
                            action=CorrectionAction.SKIPPED,
                            severity=CorrectionSeverity.WARNING,
                            message=(
                                "Impossible de modifier le label "
                                f"'{label}' de l'objet "
                                f"{occurrence.object_id}."
                            ),
                            object_type=occurrence.object_type,
                            object_id=occurrence.object_id,
                            old_value=label,
                            new_value=new_label,
                        )
                    )
                    continue

                renamed_mapping.setdefault(
                    label,
                    [],
                ).append(
                    (
                        occurrence.object_type,
                        occurrence.object_id,
                        new_label,
                    )
                )

                result.add_correction(
                    ScientificCorrection(
                        action=CorrectionAction.RENAMED_LABEL,
                        severity=CorrectionSeverity.INFO,
                        message=(
                            f"Le label dupliqué '{label}' a été "
                            f"renommé en '{new_label}'."
                        ),
                        object_type=occurrence.object_type,
                        object_id=occurrence.object_id,
                        old_value=label,
                        new_value=new_label,
                    )
                )

                result.add_warning(
                    ScientificCorrection(
                        action=CorrectionAction.DUPLICATE_LABEL,
                        severity=CorrectionSeverity.WARNING,
                        message=(
                            f"Le label '{label}' était dupliqué. "
                            f"L'occurrence {occurrence.object_id} "
                            f"a reçu le label '{new_label}'."
                        ),
                        object_type=occurrence.object_type,
                        object_id=occurrence.object_id,
                        old_value=label,
                        new_value=new_label,
                    )
                )

        # Reconstruire l'index après modification.
        new_index = self._build_label_index(
            document,
            result,
        )

        return new_index

    # ------------------------------------------------------------------
    # Références internes
    # ------------------------------------------------------------------

    def _repair_internal_references(
        self,
        document: Document,
        label_index: Dict[str, List[_LabelInfo]],
        result: ScientificCorrectionResult,
    ) -> None:
        """
        Vérifie les \\ref{}, \\autoref{} et \\eqref{}.

        Une référence vers un label inexistant ne peut pas être
        inventée. Elle est donc signalée comme non résolue.

        Une référence vers un label désormais existant est conservée.
        """

        labels = set(label_index.keys())

        for section in self._walk_sections(document):
            for paragraph in section.paragraphs:
                paragraph.content = self._process_internal_references(
                    paragraph,
                    labels,
                    result,
                )

            for equation in section.equations:
                if equation.caption:
                    equation.caption = (
                        self._process_reference_text(
                            equation.caption,
                            labels,
                            result,
                            object_type="equation",
                            object_id=equation.id,
                        )
                    )

            for figure in section.figures:
                if figure.caption:
                    figure.caption = (
                        self._process_reference_text(
                            figure.caption,
                            labels,
                            result,
                            object_type="figure",
                            object_id=figure.id,
                        )
                    )

            for table in section.tables:
                if table.caption:
                    table.caption = (
                        self._process_reference_text(
                            table.caption,
                            labels,
                            result,
                            object_type="table",
                            object_id=table.id,
                        )
                    )

    def _process_internal_references(
        self,
        paragraph: Paragraph,
        labels: set[str],
        result: ScientificCorrectionResult,
    ) -> str:
        return self._process_reference_text(
            paragraph.content,
            labels,
            result,
            object_type="paragraph",
            object_id=paragraph.id,
        )

    def _process_reference_text(
        self,
        text: str,
        labels: set[str],
        result: ScientificCorrectionResult,
        *,
        object_type: str,
        object_id: str,
    ) -> str:
        if not text:
            return text

        def replace(
            match: re.Match[str],
        ) -> str:
            label = match.group(1)

            if label in labels:
                return match.group(0)

            result.add_unresolved(
                ScientificCorrection(
                    action=CorrectionAction.UNRESOLVED_REFERENCE,
                    severity=CorrectionSeverity.ERROR,
                    message=(
                        f"La référence interne '{label}' "
                        "ne peut pas être résolue automatiquement."
                    ),
                    object_type=object_type,
                    object_id=object_id,
                    old_value=label,
                )
            )

            return match.group(0)

        return self.INTERNAL_REFERENCE_PATTERN.sub(
            replace,
            text,
        )

    # ------------------------------------------------------------------
    # Citations bibliographiques
    # ------------------------------------------------------------------

    def _repair_bibliographic_citations(
        self,
        document: Document,
        result: ScientificCorrectionResult,
    ) -> None:
        """
        Vérifie les citations bibliographiques.

        Aucune nouvelle référence n'est créée automatiquement.

        Une citation est considérée comme résolue uniquement si sa clé
        existe déjà dans Document.references.
        """

        citation_keys = {
            reference.citation_key
            for reference in document.references
            if reference.citation_key
        }

        for section in self._walk_sections(document):
            for paragraph in section.paragraphs:
                paragraph.content = self._process_citations(
                    paragraph.content,
                    citation_keys,
                    result,
                    object_type="paragraph",
                    object_id=paragraph.id,
                )

            for equation in section.equations:
                if equation.caption:
                    equation.caption = self._process_citations(
                        equation.caption,
                        citation_keys,
                        result,
                        object_type="equation",
                        object_id=equation.id,
                    )

            for figure in section.figures:
                if figure.caption:
                    figure.caption = self._process_citations(
                        figure.caption,
                        citation_keys,
                        result,
                        object_type="figure",
                        object_id=figure.id,
                    )

            for table in section.tables:
                if table.caption:
                    table.caption = self._process_citations(
                        table.caption,
                        citation_keys,
                        result,
                        object_type="table",
                        object_id=table.id,
                    )

    def _process_citations(
        self,
        text: str,
        citation_keys: set[str],
        result: ScientificCorrectionResult,
        *,
        object_type: str,
        object_id: str,
    ) -> str:
        if not text:
            return text

        def latex_replace(
            match: re.Match[str],
        ) -> str:
            raw_keys = match.group(1)

            keys = [
                key.strip()
                for key in raw_keys.split(",")
                if key.strip()
            ]

            for key in keys:
                if key not in citation_keys:
                    result.add_unresolved(
                        ScientificCorrection(
                            action=(
                                CorrectionAction
                                .UNRESOLVED_CITATION
                            ),
                            severity=CorrectionSeverity.ERROR,
                            message=(
                                f"La citation bibliographique "
                                f"'{key}' ne correspond à aucune "
                                "référence existante."
                            ),
                            object_type=object_type,
                            object_id=object_id,
                            old_value=key,
                        )
                    )

            return match.group(0)

        text = self.LATEX_CITATION_PATTERN.sub(
            latex_replace,
            text,
        )

        def markdown_replace(
            match: re.Match[str],
        ) -> str:
            raw_keys = match.group(1)

            keys = [
                key.strip()
                for key in raw_keys.split(",")
                if key.strip()
            ]

            for key in keys:
                if key not in citation_keys:
                    result.add_unresolved(
                        ScientificCorrection(
                            action=(
                                CorrectionAction
                                .UNRESOLVED_CITATION
                            ),
                            severity=CorrectionSeverity.ERROR,
                            message=(
                                f"La citation bibliographique "
                                f"'{key}' ne correspond à aucune "
                                "référence existante."
                            ),
                            object_type=object_type,
                            object_id=object_id,
                            old_value=key,
                        )
                    )

            return match.group(0)

        return self.MARKDOWN_CITATION_PATTERN.sub(
            markdown_replace,
            text,
        )

    # ------------------------------------------------------------------
    # Labels orphelins
    # ------------------------------------------------------------------

    def _detect_orphan_labels(
        self,
        document: Document,
        label_index: Dict[str, List[_LabelInfo]],
        result: ScientificCorrectionResult,
    ) -> None:
        """
        Détecte les labels qui ne sont jamais référencés.

        Par défaut ils sont conservés : un label peut être utile à un
        export futur, à une génération LaTeX ou à une utilisation
        externe.
        """

        referenced_labels = self._collect_referenced_labels(
            document
        )

        for label, occurrences in label_index.items():
            if label in referenced_labels:
                continue

            for occurrence in occurrences:
                correction = ScientificCorrection(
                    action=CorrectionAction.ORPHAN_LABEL,
                    severity=CorrectionSeverity.WARNING,
                    message=(
                        f"Le label '{label}' n'est référencé "
                        "nulle part dans le document."
                    ),
                    object_type=occurrence.object_type,
                    object_id=occurrence.object_id,
                    old_value=label,
                )

                if self.preserve_orphan_labels:
                    result.add_warning(correction)
                else:
                    result.add_warning(correction)

    # ------------------------------------------------------------------
    # Collecte des références
    # ------------------------------------------------------------------

    def _collect_referenced_labels(
        self,
        document: Document,
    ) -> set[str]:
        labels: set[str] = set()

        for section in self._walk_sections(document):
            for paragraph in section.paragraphs:
                labels.update(
                    self._extract_internal_references(
                        paragraph.content
                    )
                )

            for equation in section.equations:
                if equation.caption:
                    labels.update(
                        self._extract_internal_references(
                            equation.caption
                        )
                    )

            for figure in section.figures:
                if figure.caption:
                    labels.update(
                        self._extract_internal_references(
                            figure.caption
                        )
                    )

            for table in section.tables:
                if table.caption:
                    labels.update(
                        self._extract_internal_references(
                            table.caption
                        )
                    )

        return labels

    def _extract_internal_references(
        self,
        text: str,
    ) -> set[str]:
        if not text:
            return set()

        return {
            match.group(1)
            for match in self.INTERNAL_REFERENCE_PATTERN.finditer(
                text
            )
        }

    # ------------------------------------------------------------------
    # Accès aux objets IR
    # ------------------------------------------------------------------

    def _set_object_label(
        self,
        document: Document,
        object_type: str,
        object_id: str,
        new_label: str,
    ) -> bool:
        for section in self._walk_sections(document):
            if object_type == "equation":
                for equation in section.equations:
                    if equation.id == object_id:
                        equation.label = new_label
                        return True

            elif object_type == "figure":
                for figure in section.figures:
                    if figure.id == object_id:
                        figure.label = new_label
                        return True

            elif object_type == "table":
                for table in section.tables:
                    if table.id == object_id:
                        table.label = new_label
                        return True

        return False

    # ------------------------------------------------------------------
    # Génération de labels
    # ------------------------------------------------------------------

    def _generate_unique_label(
        self,
        document: Document,
        prefix: str,
        base: str,
        starting_number: int,
    ) -> str:
        existing = self._all_labels(document)

        number = starting_number

        while True:
            candidate = (
                f"{prefix}:{base}-{number}"
            )

            if candidate not in existing:
                return candidate

            number += 1

    def _all_labels(
        self,
        document: Document,
    ) -> set[str]:
        labels: set[str] = set()

        for section in self._walk_sections(document):
            labels.update(
                equation.label
                for equation in section.equations
                if equation.label
            )

            labels.update(
                figure.label
                for figure in section.figures
                if figure.label
            )

            labels.update(
                table.label
                for table in section.tables
                if table.label
            )

        return labels

    def _extract_prefix(
        self,
        label: str,
    ) -> Optional[str]:
        if ":" not in label:
            return None

        prefix = label.split(
            ":",
            1,
        )[0].strip().lower()

        if prefix in self.LABEL_PREFIXES.values():
            return prefix

        return None

    def _strip_prefix(
        self,
        label: str,
        prefix: str,
    ) -> str:
        expected = f"{prefix}:"

        if label.startswith(expected):
            return label[len(expected):] or "item"

        return label

    def _guess_prefix(
        self,
        object_type: str,
    ) -> str:
        return self.LABEL_PREFIXES.get(
            object_type,
            "item",
        )

    # ------------------------------------------------------------------
    # Parcours
    # ------------------------------------------------------------------

    def _walk_sections(
        self,
        document: Document,
    ) -> Iterable[Section]:
        yield from self._walk_section_list(
            document.sections
        )

        yield from self._walk_section_list(
            document.annexes
        )

    def _walk_section_list(
        self,
        sections: Iterable[Section],
    ) -> Iterable[Section]:
        for section in sections:
            yield section

            yield from self._walk_section_list(
                section.sections
            )


__all__ = [
    "CorrectionSeverity",
    "CorrectionAction",
    "ScientificCorrection",
    "ScientificCorrectionResult",
    "ScientificConsistencyCorrector",
]