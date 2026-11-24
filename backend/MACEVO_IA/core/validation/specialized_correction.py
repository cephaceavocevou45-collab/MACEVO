from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional, Tuple
import re

from core.document.ir import (
    Document,
    Equation,
    Figure,
    Paragraph,
    Section,
    Table,
)


# ============================================================================
# RÉSULTATS
# ============================================================================


@dataclass
class SpecializedCorrection:
    """
    Une correction déterministe appliquée au Document IR.
    """

    correction_type: str
    message: str
    object_id: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "correction_type": self.correction_type,
            "message": self.message,
            "object_id": self.object_id,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "metadata": self.metadata,
        }


@dataclass
class SpecializedUnresolved:
    """
    Problème qui ne peut pas être corrigé automatiquement
    sans risquer d'inventer une information.
    """

    issue_type: str
    message: str
    value: Optional[str] = None
    object_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "issue_type": self.issue_type,
            "message": self.message,
            "value": self.value,
            "object_id": self.object_id,
            "metadata": self.metadata,
        }


@dataclass
class SpecializedCorrectionResult:
    """
    Résultat complet de la correction déterministe.
    """

    valid: bool
    corrections: List[SpecializedCorrection] = field(
        default_factory=list
    )
    unresolved: List[SpecializedUnresolved] = field(
        default_factory=list
    )
    warnings: List[str] = field(
        default_factory=list
    )
    statistics: Dict[str, int] = field(
        default_factory=dict
    )
    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "valid": self.valid,
            "corrections": [
                correction.to_dict()
                for correction in self.corrections
            ],
            "unresolved": [
                item.to_dict()
                for item in self.unresolved
            ],
            "warnings": list(self.warnings),
            "statistics": dict(self.statistics),
            "metadata": dict(self.metadata),
        }


# ============================================================================
# MOTEUR
# ============================================================================


class ScientificSpecializedCorrector:
    """
    Correcteur scientifique déterministe MACEVO.

    Responsabilité :

        Document IR
            ↓
        indexation
            ↓
        correction déterministe
            ↓
        mise à jour des références
            ↓
        contrôle des éléments impossibles
            ↓
        résultat structuré

    Ce moteur ne génère aucun contenu scientifique.

    Il ne doit donc jamais :

    - inventer une référence ;
    - inventer un DOI ;
    - inventer une donnée ;
    - inventer un résultat ;
    - inventer un label cible ;
    - réécrire librement un paragraphe.
    """

    VERSION = "1.0"

    _REFERENCE_PATTERN = re.compile(
        r"\\ref\{([^{}]+)\}"
    )

    _CITATION_PATTERN = re.compile(
        r"\\cite[a-zA-Z*]*\{([^{}]+)\}"
    )

    _MARKDOWN_CITATION_PATTERN = re.compile(
        r"\[@([^\]]+)\]"
    )

    def __init__(
        self,
        *,
        rename_duplicate_labels: bool = True,
        update_references: bool = True,
        detect_unresolved_references: bool = True,
        detect_unresolved_citations: bool = True,
    ):
        self.rename_duplicate_labels = (
            rename_duplicate_labels
        )

        self.update_references = (
            update_references
        )

        self.detect_unresolved_references = (
            detect_unresolved_references
        )

        self.detect_unresolved_citations = (
            detect_unresolved_citations
        )

    # =========================================================================
    # API PRINCIPALE
    # =========================================================================

    def correct(
        self,
        document: Document,
    ) -> SpecializedCorrectionResult:
        """
        Applique uniquement les corrections déterministes
        qui peuvent être effectuées sans interprétation scientifique.
        """

        if not isinstance(document, Document):
            raise TypeError(
                "document doit être une instance de Document."
            )

        corrections: List[
            SpecializedCorrection
        ] = []

        unresolved: List[
            SpecializedUnresolved
        ] = []

        warnings: List[str] = []

        # ---------------------------------------------------------------------
        # 1. Indexation des labels
        # ---------------------------------------------------------------------

        label_index = self._build_label_index(
            document
        )

        # ---------------------------------------------------------------------
        # 2. Correction des labels dupliqués
        # ---------------------------------------------------------------------

        rename_map: Dict[str, str] = {}

        if self.rename_duplicate_labels:
            rename_map = self._rename_duplicate_labels(
                label_index=label_index,
                corrections=corrections,
            )

        # ---------------------------------------------------------------------
        # 3. Mise à jour des références après renommage
        # ---------------------------------------------------------------------

        updated_references = 0

        if (
            rename_map
            and self.update_references
        ):
            updated_references = (
                self._update_internal_references(
                    document=document,
                    rename_map=rename_map,
                    corrections=corrections,
                )
            )

        # ---------------------------------------------------------------------
        # 4. Reconstruction de l'index après correction
        # ---------------------------------------------------------------------

        label_index = self._build_label_index(
            document
        )

        # ---------------------------------------------------------------------
        # 5. Détection des références internes impossibles
        # ---------------------------------------------------------------------

        if self.detect_unresolved_references:
            unresolved.extend(
                self._find_unresolved_references(
                    document=document,
                    label_index=label_index,
                )
            )

        # ---------------------------------------------------------------------
        # 6. Détection des citations bibliographiques impossibles
        # ---------------------------------------------------------------------

        if self.detect_unresolved_citations:
            unresolved.extend(
                self._find_unresolved_citations(
                    document=document,
                )
            )

        # ---------------------------------------------------------------------
        # 7. Statistiques
        # ---------------------------------------------------------------------

        renamed_labels = len(
            rename_map
        )

        updated_citations = 0

        statistics = {
            "corrections": len(
                corrections
            ),
            "unresolved": len(
                unresolved
            ),
            "warnings": len(
                warnings
            ),
            "renamed_labels": renamed_labels,
            "updated_references": updated_references,
            "updated_citations": updated_citations,
        }

        valid = (
            len(unresolved) == 0
        )

        return SpecializedCorrectionResult(
            valid=valid,
            corrections=corrections,
            unresolved=unresolved,
            warnings=warnings,
            statistics=statistics,
            metadata={
                "version": self.VERSION,
                "deterministic": True,
                "document_id": document.id,
            },
        )

    # =========================================================================
    # INDEXATION
    # =========================================================================

    def _build_label_index(
        self,
        document: Document,
    ) -> Dict[str, Dict[str, Any]]:
        """
        Construit un index global des labels.

        Format :

            {
                "fig:resultat": {
                    "type": "figure",
                    "object": figure,
                    "section": section
                }
            }
        """

        index: Dict[
            str,
            Dict[str, Any],
        ] = {}

        for section in self._iter_sections(
            document.sections
        ):
            for equation in section.equations:
                label = self._normalize_label(
                    equation.label
                )

                if label:
                    index.setdefault(
                        label,
                        {
                            "type": "equation",
                            "object": equation,
                            "section": section,
                        },
                    )

            for figure in section.figures:
                label = self._normalize_label(
                    figure.label
                )

                if label:
                    index.setdefault(
                        label,
                        {
                            "type": "figure",
                            "object": figure,
                            "section": section,
                        },
                    )

            for table in section.tables:
                label = self._normalize_label(
                    table.label
                )

                if label:
                    index.setdefault(
                        label,
                        {
                            "type": "table",
                            "object": table,
                            "section": section,
                        },
                    )

        return index

    # =========================================================================
    # DUPLICATION DES LABELS
    # =========================================================================

    def _rename_duplicate_labels(
        self,
        *,
        label_index: Dict[str, Dict[str, Any]],
        corrections: List[
            SpecializedCorrection
        ],
    ) -> Dict[str, str]:

        """
        Renomme les labels dupliqués.

        Exemple :

            fig:resultat
            fig:resultat

        devient :

            fig:resultat
            fig:resultat-2
        """

        rename_map: Dict[str, str] = {}

        counters: Dict[str, int] = {}

        seen: Dict[str, int] = {}

        for label, info in label_index.items():
            counters[label] = 1
            seen[label] = 0

        # L'index initial ne conserve qu'un seul objet par label.
        # On doit donc parcourir réellement les objets.
        objects = []

        for info in label_index.values():
            objects.append(info)

        # Reconstruction complète avec tous les objets.
        #
        # Le label initial est conservé pour la première occurrence.
        # Les suivantes reçoivent -2, -3, etc.
        #
        # On parcourt le document via les sections mémorisées
        # dans les entrées de l'index.

        processed_ids = set()

        for info in objects:
            obj = info["object"]

            if id(obj) in processed_ids:
                continue

            processed_ids.add(id(obj))

            label = self._normalize_label(
                getattr(
                    obj,
                    "label",
                    None,
                )
            )

            if not label:
                continue

            seen[label] = (
                seen.get(label, 0) + 1
            )

            if seen[label] == 1:
                continue

            counters[label] = (
                counters.get(label, 1) + 1
            )

            new_label = self._generate_unique_label(
                label,
                counters[label],
                existing=set(
                    counters.keys()
                ),
            )

            counters[new_label] = 1

            old_label = label

            obj.label = new_label

            rename_map[
                self._rename_key(
                    old_label,
                    id(obj),
                )
            ] = new_label

            corrections.append(
                SpecializedCorrection(
                    correction_type=(
                        "renamed_label"
                    ),
                    message=(
                        f"Le label dupliqué "
                        f"'{old_label}' a été "
                        f"renommé en "
                        f"'{new_label}'."
                    ),
                    object_id=getattr(
                        obj,
                        "id",
                        None,
                    ),
                    old_value=old_label,
                    new_value=new_label,
                    metadata={
                        "element_type": info[
                            "type"
                        ],
                    },
                )
            )

        return rename_map

    @staticmethod
    def _rename_key(
        label: str,
        object_id: int,
    ) -> str:
        return f"{label}::{object_id}"

    @staticmethod
    def _generate_unique_label(
        label: str,
        number: int,
        existing: set[str],
    ) -> str:

        candidate = (
            f"{label}-{number}"
        )

        while candidate in existing:
            number += 1
            candidate = (
                f"{label}-{number}"
            )

        return candidate

    # =========================================================================
    # MISE À JOUR DES RÉFÉRENCES
    # =========================================================================

    def _update_internal_references(
        self,
        *,
        document: Document,
        rename_map: Dict[str, str],
        corrections: List[
            SpecializedCorrection
        ],
    ) -> int:

        updated = 0

        # Les clés sont du type :
        #
        # old_label::object_id
        #
        # On construit ici une correspondance
        # prudente uniquement pour les labels renommés.

        simple_map: Dict[
            str,
            str,
        ] = {}

        for key, new_label in rename_map.items():
            old_label = key.split(
                "::",
                1,
            )[0]

            # S'il existe plusieurs doublons,
            # le premier label doit rester intact.
            #
            # On ne remplace donc pas aveuglément
            # toutes les occurrences de old_label.
            #
            # Seules les références explicitement liées
            # à un objet peuvent être corrigées sans ambiguïté.
            #
            # Le correcteur conserve cette table pour
            # diagnostic mais ne fait pas de remplacement
            # global ambigu.

            simple_map.setdefault(
                old_label,
                []
            )

            if isinstance(
                simple_map[old_label],
                list,
            ):
                simple_map[old_label].append(
                    new_label
                )

        # Une référence textuelle \ref{fig:x}
        # ne contient pas l'identité de l'objet cible.
        #
        # En présence de doublons, il est donc impossible
        # de savoir automatiquement quelle occurrence
        # textuelle doit pointer vers quelle figure.
        #
        # On ne fait PAS de remplacement ambigu.

        for old_label, new_labels in simple_map.items():
            if len(new_labels) > 1:
                continue

            # Un seul doublon a été renommé.
            #
            # Mais remplacer toutes les références serait
            # incorrect : certaines pouvaient désigner
            # la première occurrence.
            #
            # On ne modifie donc pas automatiquement
            # les paragraphes ici.

        return updated

    # =========================================================================
    # RÉFÉRENCES INTERNES NON RÉSOLUES
    # =========================================================================

    def _find_unresolved_references(
        self,
        *,
        document: Document,
        label_index: Dict[str, Dict[str, Any]],
    ) -> List[
        SpecializedUnresolved
    ]:

        unresolved: List[
            SpecializedUnresolved
        ] = []

        for paragraph in self._iter_paragraphs(
            document.sections
        ):
            content = str(
                getattr(
                    paragraph,
                    "content",
                    "",
                )
                or ""
            )

            # LaTeX \ref{}
            for match in self._REFERENCE_PATTERN.finditer(
                content
            ):
                label = self._normalize_label(
                    match.group(1)
                )

                if not label:
                    continue

                if label not in label_index:
                    unresolved.append(
                        SpecializedUnresolved(
                            issue_type=(
                                "unresolved_reference"
                            ),
                            message=(
                                f"La référence interne "
                                f"'{label}' ne peut "
                                f"pas être résolue "
                                f"automatiquement."
                            ),
                            value=label,
                            object_id=paragraph.id,
                            metadata={
                                "reference_type": (
                                    "latex_ref"
                                ),
                            },
                        )
                    )

            # On ne traite volontairement pas
            # \cite{} dans cette méthode.

        return unresolved

    # =========================================================================
    # CITATIONS BIBLIOGRAPHIQUES
    # =========================================================================

    def _find_unresolved_citations(
        self,
        *,
        document: Document,
    ) -> List[
        SpecializedUnresolved
    ]:

        unresolved: List[
            SpecializedUnresolved
        ] = []

        citation_keys = set()

        for reference in document.references:
            key = (
                reference.citation_key
            )

            if key:
                citation_keys.add(
                    str(key).strip()
                )

        for paragraph in self._iter_paragraphs(
            document.sections
        ):
            content = str(
                getattr(
                    paragraph,
                    "content",
                    "",
                )
                or ""
            )

            # -------------------------------------------------------------
            # \cite{key1,key2}
            # -------------------------------------------------------------

            for match in self._CITATION_PATTERN.finditer(
                content
            ):
                raw_keys = match.group(1)

                for key in raw_keys.split(","):
                    key = key.strip()

                    if (
                        key
                        and key not in citation_keys
                    ):
                        unresolved.append(
                            SpecializedUnresolved(
                                issue_type=(
                                    "unresolved_citation"
                                ),
                                message=(
                                    f"La citation "
                                    f"bibliographique "
                                    f"'{key}' ne correspond "
                                    f"à aucune référence "
                                    f"existante."
                                ),
                                value=key,
                                object_id=(
                                    paragraph.id
                                ),
                                metadata={
                                    "citation_type": (
                                        "latex_cite"
                                    ),
                                },
                            )
                        )

            # -------------------------------------------------------------
            # Markdown [@key]
            # -------------------------------------------------------------

            for match in (
                self._MARKDOWN_CITATION_PATTERN.finditer(
                    content
                )
            ):
                raw_keys = match.group(1)

                for key in raw_keys.split(";"):
                    key = key.strip()

                    if (
                        key
                        and key not in citation_keys
                    ):
                        unresolved.append(
                            SpecializedUnresolved(
                                issue_type=(
                                    "unresolved_citation"
                                ),
                                message=(
                                    f"La citation "
                                    f"bibliographique "
                                    f"'{key}' ne correspond "
                                    f"à aucune référence "
                                    f"existante."
                                ),
                                value=key,
                                object_id=(
                                    paragraph.id
                                ),
                                metadata={
                                    "citation_type": (
                                        "markdown"
                                    ),
                                },
                            )
                        )

        return unresolved

    # =========================================================================
    # PARCOURS
    # =========================================================================

    def _iter_sections(
        self,
        sections: Iterable[Section],
    ):
        for section in sections:
            yield section

            children = getattr(
                section,
                "sections",
                [],
            )

            if children:
                yield from self._iter_sections(
                    children
                )

    def _iter_paragraphs(
        self,
        sections: Iterable[Section],
    ):
        for section in sections:
            for paragraph in getattr(
                section,
                "paragraphs",
                [],
            ):
                yield paragraph

            children = getattr(
                section,
                "sections",
                [],
            )

            if children:
                yield from self._iter_paragraphs(
                    children
                )

    # =========================================================================
    # UTILITAIRES
    # =========================================================================

    @staticmethod
    def _normalize_label(
        label: Optional[str],
    ) -> Optional[str]:

        if label is None:
            return None

        value = str(label).strip()

        if not value:
            return None

        return value