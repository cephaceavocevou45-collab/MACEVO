
"""
==========================================================
MACEVO IA
Document Structure
==========================================================

Structure normalisée des documents scientifiques.

Cette structure constitue le modèle intermédiaire commun
aux différents systèmes d'export :

    DocumentStructure
        ├── PDF
        ├── Word
        ├── LaTeX
        └── HTML

Elle est volontairement indépendante :
- de Django
- de Tiptap
- des fournisseurs IA
- des moteurs PDF
- des moteurs Word
- de LaTeX

Elle constitue une couche de représentation intermédiaire
(IR - Intermediate Representation) du document scientifique.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


# ==========================================================
# SECTION
# ==========================================================


@dataclass
class DocumentSection:
    """
    Section d'un chapitre scientifique.

    level :
        2 = section
        3 = sous-section
        4 = sous-sous-section

    Une section peut contenir :
        - du texte
        - des sous-sections
        - un numéro
    """

    title: str
    content: str = ""
    level: int = 2
    number: Optional[str] = None

    subsections: list["DocumentSection"] = field(
        default_factory=list
    )

    # ======================================================
    # UTILITAIRES
    # ======================================================

    def has_content(self) -> bool:
        """Vérifie si la section possède du contenu textuel."""

        return bool(
            str(self.content or "").strip()
        )

    def has_subsections(self) -> bool:
        """Vérifie si la section possède des sous-sections."""

        return bool(self.subsections)

    def subsection_count(self) -> int:
        """Retourne le nombre de sous-sections directes."""

        return len(self.subsections)

    def total_subsection_count(self) -> int:
        """Retourne le nombre total de sous-sections récursives."""

        return sum(
            1 + subsection.total_subsection_count()
            for subsection in self.subsections
        )


# ==========================================================
# CHAPITRE
# ==========================================================


@dataclass
class DocumentChapter:
    """
    Chapitre d'un document scientifique.

    Un chapitre peut posséder :
        - un contenu direct
        - plusieurs sections
        - une numérotation
    """

    title: str
    content: str = ""
    number: Optional[int] = None

    sections: list[DocumentSection] = field(
        default_factory=list
    )

    # ======================================================
    # UTILITAIRES
    # ======================================================

    def has_content(self) -> bool:
        """Vérifie si le chapitre possède du contenu direct."""

        return bool(
            str(self.content or "").strip()
        )

    def has_sections(self) -> bool:
        """Vérifie si le chapitre possède des sections."""

        return bool(self.sections)

    def section_count(self) -> int:
        """Nombre de sections directes."""

        return len(self.sections)

    def total_section_count(self) -> int:
        """Nombre total de sections récursives."""

        return sum(
            1 + section.total_subsection_count()
            for section in self.sections
        )


# ==========================================================
# TABLEAU
# ==========================================================


@dataclass
class DocumentTable:
    """
    Tableau scientifique.

    headers :
        Liste des en-têtes de colonnes.

    rows :
        Données du tableau.

    title :
        Titre logique du tableau.

    caption :
        Légende complémentaire éventuelle.
    """

    title: str
    headers: list[str] = field(
        default_factory=list
    )
    rows: list[list[Any]] = field(
        default_factory=list
    )
    number: Optional[int] = None
    caption: str = ""

    # ======================================================
    # UTILITAIRES
    # ======================================================

    def row_count(self) -> int:
        """Nombre de lignes de données."""

        return len(self.rows)

    def column_count(self) -> int:
        """Nombre de colonnes."""

        if self.headers:
            return len(self.headers)

        if self.rows:
            return max(
                len(row)
                for row in self.rows
                if isinstance(row, (list, tuple))
            )

        return 0

    def is_empty(self) -> bool:
        """Vérifie si le tableau ne contient aucune donnée."""

        return not (
            self.headers
            or self.rows
        )


# ==========================================================
# FIGURE
# ==========================================================


@dataclass
class DocumentFigure:
    """
    Figure ou image scientifique.

    path :
        Chemin physique ou logique de l'image.

    caption :
        Légende de la figure.

    number :
        Numéro de figure.
    """

    title: str
    path: str = ""
    caption: str = ""
    number: Optional[int] = None

    # ======================================================
    # UTILITAIRES
    # ======================================================

    def exists(self) -> bool:
        """Vérifie si un chemin de figure est défini."""

        return bool(
            str(self.path or "").strip()
        )

    def has_caption(self) -> bool:
        """Vérifie si la figure possède une légende."""

        return bool(
            str(self.caption or "").strip()
        )


# ==========================================================
# RÉFÉRENCE
# ==========================================================


@dataclass
class DocumentReference:
    """
    Référence bibliographique.

    Cette structure reste volontairement générique afin de
    pouvoir être convertie ensuite vers :

        - APA
        - MLA
        - IEEE
        - Chicago
        - BibTeX
        - LaTeX
        - autres styles futurs
    """

    author: str = ""
    title: str = ""
    year: str = ""
    publisher: str = ""
    doi: str = ""
    url: str = ""
    citation_key: str = ""

    # ======================================================
    # UTILITAIRES
    # ======================================================

    def has_doi(self) -> bool:
        """Vérifie si un DOI est disponible."""

        return bool(
            str(self.doi or "").strip()
        )

    def has_url(self) -> bool:
        """Vérifie si une URL est disponible."""

        return bool(
            str(self.url or "").strip()
        )

    def has_citation_key(self) -> bool:
        """Vérifie si une clé de citation est disponible."""

        return bool(
            str(self.citation_key or "").strip()
        )

    def is_empty(self) -> bool:
        """Vérifie si la référence est complètement vide."""

        return not any(
            str(value or "").strip()
            for value in (
                self.author,
                self.title,
                self.year,
                self.publisher,
                self.doi,
                self.url,
                self.citation_key,
            )
        )


# ==========================================================
# DOCUMENT COMPLET
# ==========================================================


@dataclass
class DocumentStructure:
    """
    Structure complète d'un document scientifique.

    Il s'agit du modèle intermédiaire principal de MACEVO.

    Les composants peuvent ensuite être consommés par :
        - DocumentBuilder
        - PDFExporter
        - WordExporter
        - LaTeXExporter
        - HTMLExporter
        - moteur de validation scientifique
        - moteur IA
    """

    # ======================================================
    # MÉTADONNÉES
    # ======================================================

    metadata: dict[str, Any] = field(
        default_factory=dict
    )

    # ======================================================
    # COUVERTURE
    # ======================================================

    cover: dict[str, Any] = field(
        default_factory=dict
    )

    # ======================================================
    # RÉSUMÉ
    # ======================================================

    abstract: str = ""

    keywords: list[str] = field(
        default_factory=list
    )

    # ======================================================
    # CORPS SCIENTIFIQUE
    # ======================================================

    chapters: list[DocumentChapter] = field(
        default_factory=list
    )

    # ======================================================
    # TABLEAUX
    # ======================================================

    tables: list[DocumentTable] = field(
        default_factory=list
    )

    # ======================================================
    # FIGURES
    # ======================================================

    figures: list[DocumentFigure] = field(
        default_factory=list
    )

    # ======================================================
    # BIBLIOGRAPHIE
    # ======================================================

    references: list[DocumentReference] = field(
        default_factory=list
    )

    # ======================================================
    # ANNEXES
    # ======================================================

    appendices: list[DocumentChapter] = field(
        default_factory=list
    )

    # ======================================================
    # NUMÉROTATION
    # ======================================================

    def normalize_numbers(self) -> None:
        """
        Numérote automatiquement les chapitres, sections
        et sous-sections.

        Exemple :

            1 Introduction
                1.1 Contexte
                1.2 Problématique
                    1.2.1 Hypothèses

            2 Méthodologie
                2.1 Méthode

        La numérotation générée devient la référence
        canonique utilisée par les exporteurs.
        """

        for chapter_index, chapter in enumerate(
            self.chapters,
            start=1,
        ):
            chapter.number = chapter_index

            self._number_sections(
                chapter.sections,
                prefix=str(chapter_index),
            )

    def _number_sections(
        self,
        sections: list[DocumentSection],
        prefix: str,
    ) -> None:
        """
        Numérote récursivement les sections.
        """

        for index, section in enumerate(
            sections,
            start=1,
        ):
            number = f"{prefix}.{index}"

            section.number = number

            self._number_sections(
                section.subsections,
                prefix=number,
            )

    # ======================================================
    # CHAPITRES
    # ======================================================

    def chapter_count(self) -> int:
        """Nombre de chapitres."""

        return len(self.chapters)

    def has_chapters(self) -> bool:
        """Vérifie si le document possède des chapitres."""

        return bool(self.chapters)

    # ======================================================
    # SECTIONS
    # ======================================================

    def section_count(self) -> int:
        """
        Nombre total de sections,
        y compris les sous-sections.
        """

        return sum(
            self._count_sections(
                chapter.sections
            )
            for chapter in self.chapters
        )

    def _count_sections(
        self,
        sections: list[DocumentSection],
    ) -> int:
        """Compte récursivement les sections."""

        total = len(sections)

        for section in sections:
            total += self._count_sections(
                section.subsections
            )

        return total

    # ======================================================
    # TABLEAUX
    # ======================================================

    def table_count(self) -> int:
        """Nombre de tableaux."""

        return len(self.tables)

    def has_tables(self) -> bool:
        """Vérifie si le document possède des tableaux."""

        return bool(self.tables)

    # ======================================================
    # FIGURES
    # ======================================================

    def figure_count(self) -> int:
        """Nombre de figures."""

        return len(self.figures)

    def has_figures(self) -> bool:
        """Vérifie si le document possède des figures."""

        return bool(self.figures)

    # ======================================================
    # RÉFÉRENCES
    # ======================================================

    def reference_count(self) -> int:
        """Nombre de références."""

        return len(self.references)

    def has_references(self) -> bool:
        """Vérifie si le document possède des références."""

        return bool(self.references)

    # ======================================================
    # ANNEXES
    # ======================================================

    def appendix_count(self) -> int:
        """Nombre d'annexes."""

        return len(self.appendices)

    def has_appendices(self) -> bool:
        """Vérifie si le document possède des annexes."""

        return bool(self.appendices)

    # ======================================================
    # TABLE DES MATIÈRES
    # ======================================================

    def table_of_contents(
        self,
    ) -> list[dict[str, Any]]:
        """
        Construit une représentation simple de la table
        des matières.

        Retour :
            [
                {
                    "type": "chapter",
                    "number": 1,
                    "title": "Introduction",
                },
                {
                    "type": "section",
                    "number": "1.1",
                    "title": "Contexte",
                    "level": 2,
                },
            ]
        """

        self.normalize_numbers()

        result: list[dict[str, Any]] = []

        for chapter in self.chapters:
            result.append(
                {
                    "type": "chapter",
                    "number": chapter.number,
                    "title": chapter.title,
                }
            )

            self._toc_sections(
                chapter.sections,
                result,
            )

        return result

    def _toc_sections(
        self,
        sections: list[DocumentSection],
        result: list[dict[str, Any]],
    ) -> None:
        """Ajoute récursivement les sections au sommaire."""

        for section in sections:
            result.append(
                {
                    "type": "section",
                    "number": section.number,
                    "title": section.title,
                    "level": section.level,
                }
            )

            self._toc_sections(
                section.subsections,
                result,
            )

    # ======================================================
    # RECHERCHE
    # ======================================================

    def find_section(
        self,
        number: str,
    ) -> Optional[DocumentSection]:
        """
        Recherche une section par numéro.

        Exemple :
            document.find_section("2.1")
        """

        target = str(number).strip()

        for chapter in self.chapters:
            section = self._find_section_recursive(
                chapter.sections,
                target,
            )

            if section is not None:
                return section

        return None

    def _find_section_recursive(
        self,
        sections: list[DocumentSection],
        target: str,
    ) -> Optional[DocumentSection]:
        """Recherche récursive d'une section."""

        for section in sections:
            if section.number == target:
                return section

            result = self._find_section_recursive(
                section.subsections,
                target,
            )

            if result is not None:
                return result

        return None

    # ======================================================
    # DOCUMENT VIDE
    # ======================================================

    def is_empty(self) -> bool:
        """
        Vérifie si le document est vide.

        Les métadonnées seules ne sont pas considérées comme
        du contenu scientifique.
        """

        return not (
            self.abstract.strip()
            or self.chapters
            or self.tables
            or self.figures
            or self.references
            or self.appendices
        )

    # ======================================================
    # STATISTIQUES
    # ======================================================

    def statistics(self) -> dict[str, int]:
        """
        Retourne les statistiques structurelles du document.
        """

        return {
            "chapters": self.chapter_count(),
            "sections": self.section_count(),
            "tables": self.table_count(),
            "figures": self.figure_count(),
            "references": self.reference_count(),
            "appendices": self.appendix_count(),
        }

    # ======================================================
    # VALIDATION STRUCTURELLE
    # ======================================================

    def validate(self) -> list[str]:
        """
        Effectue une validation structurelle légère.

        Cette méthode ne juge pas la qualité scientifique.
        Elle vérifie uniquement la cohérence minimale de
        la structure.

        Retourne une liste d'erreurs.
        """

        errors: list[str] = []

        # --------------------------------------------------
        # Chapitres
        # --------------------------------------------------

        for index, chapter in enumerate(
            self.chapters,
            start=1,
        ):
            if not str(chapter.title or "").strip():
                errors.append(
                    f"Le chapitre {index} ne possède pas de titre."
                )

            errors.extend(
                self._validate_sections(
                    chapter.sections,
                    prefix=f"chapitre {index}",
                )
            )

        # --------------------------------------------------
        # Tableaux
        # --------------------------------------------------

        for index, table in enumerate(
            self.tables,
            start=1,
        ):
            if not str(table.title or "").strip():
                errors.append(
                    f"Le tableau {index} ne possède pas de titre."
                )

        # --------------------------------------------------
        # Figures
        # --------------------------------------------------

        for index, figure in enumerate(
            self.figures,
            start=1,
        ):
            if not str(figure.title or "").strip():
                errors.append(
                    f"La figure {index} ne possède pas de titre."
                )

        return errors

    def _validate_sections(
        self,
        sections: list[DocumentSection],
        prefix: str,
    ) -> list[str]:
        """Valide récursivement les sections."""

        errors: list[str] = []

        for index, section in enumerate(
            sections,
            start=1,
        ):
            location = f"{prefix}, section {index}"

            if not str(section.title or "").strip():
                errors.append(
                    f"{location} ne possède pas de titre."
                )

            if section.level < 2:
                errors.append(
                    f"{location} possède un niveau invalide."
                )

            errors.extend(
                self._validate_sections(
                    section.subsections,
                    location,
                )
            )

        return errors
