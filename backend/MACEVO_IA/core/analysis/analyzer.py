"""
MACEVO — Document Analyzer
Version: 1.1.0

Analyse déterministe de documents importés et conversion vers le
Document IR central de MACEVO.

Pipeline :

    ImportedDocument
        ↓
    StructureAnalyzer
        ↓
    Détection des éléments scientifiques
        ↓
    DocumentAnalysisResult
        ↓
    core.document.ir.Document
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Optional

from core.document.engine import DocumentEngine
from core.document.ir import Document

from .exceptions import (
    AnalysisConversionError,
    AnalysisInputError,
)
from .models import (
    AnalysisStatistics,
    DetectedSection,
    DocumentAnalysisResult,
)
from .structure import StructureAnalyzer


class DocumentAnalyzer:
    """
    Analyseur principal de documents MACEVO.

    Cette couche reste déterministe :
    - structure
    - métadonnées
    - citations
    - équations
    - références
    - tableaux
    - figures
    - statistiques
    - conversion vers le Document IR

    Une couche sémantique/IA avancée pourra être ajoutée au-dessus
    sans modifier ce contrat de base.
    """

    VERSION = "1.1.0"

    CITATION_PATTERN = re.compile(
        r"\[@(?P<key>[A-Za-z0-9_.:-]+)\]"
    )

    EQUATION_PATTERN = re.compile(
        r"(?:"
        r"^[A-Za-z]\w*\s*="
        r"|\\frac\b"
        r"|\\sum\b"
        r"|\\int\b"
        r"|\\sqrt\b"
        r"|\\alpha\b"
        r"|\\beta\b"
        r"|\\gamma\b"
        r"|\$\$"
        r"|\\\("
        r")"
    )

    def __init__(
        self,
        structure_analyzer: Optional[StructureAnalyzer] = None,
        document_engine: Optional[DocumentEngine] = None,
    ) -> None:
        self.structure_analyzer = (
            structure_analyzer
            if structure_analyzer is not None
            else StructureAnalyzer()
        )

        self.document_engine = (
            document_engine
            if document_engine is not None
            else DocumentEngine()
        )

    # ========================================================================
    # MAIN ANALYSIS
    # ========================================================================

    def analyze(
        self,
        imported_document: Any,
        *,
        build_document: bool = True,
    ) -> DocumentAnalysisResult:

        if imported_document is None:
            raise AnalysisInputError(
                "ImportedDocument est requis."
            )

        source_path = getattr(
            imported_document,
            "source_path",
            None,
        )

        filename = getattr(
            imported_document,
            "filename",
            None,
        )

        if not filename:
            filename = Path(
                str(source_path or "")
            ).name

        document_format = getattr(
            imported_document,
            "format",
            None,
        )

        document_format = getattr(
            document_format,
            "value",
            document_format,
        )

        metadata = dict(
            getattr(
                imported_document,
                "metadata",
                {},
            )
            or {}
        )

        result = DocumentAnalysisResult(
            source_path=(
                str(source_path)
                if source_path
                else None
            ),
            filename=str(filename),
            format=(
                str(document_format)
                if document_format
                else None
            ),
            metadata=metadata,
        )

        # --------------------------------------------------------------------
        # Diagnostics provenant de l'importeur
        # --------------------------------------------------------------------

        result.warnings.extend(
            str(value)
            for value in (
                getattr(
                    imported_document,
                    "warnings",
                    [],
                )
                or []
            )
        )

        result.errors.extend(
            str(value)
            for value in (
                getattr(
                    imported_document,
                    "errors",
                    [],
                )
                or []
            )
        )

        text = str(
            getattr(
                imported_document,
                "text",
                "",
            )
            or ""
        )

        # --------------------------------------------------------------------
        # STRUCTURE
        # --------------------------------------------------------------------

        result.sections = self.structure_analyzer.analyze(
            imported_document
        )

        # --------------------------------------------------------------------
        # METADATA
        # --------------------------------------------------------------------

        result.title = self._detect_title(
            imported_document,
            result.sections,
        )

        result.abstract = self._detect_abstract(
            result.sections
        )

        result.keywords = self._detect_keywords(
            text,
            result.metadata,
        )

        # --------------------------------------------------------------------
        # SCIENTIFIC ELEMENTS
        # --------------------------------------------------------------------

        result.citations = self._detect_citations(
            text
        )

        result.equations = self._detect_equations(
            text
        )

        result.references = self._detect_references(
            result.sections
        )

        # --------------------------------------------------------------------
        # IMPORTED ASSETS
        # --------------------------------------------------------------------

        result.tables = list(
            getattr(
                imported_document,
                "tables",
                [],
            )
            or []
        )

        result.figures = list(
            getattr(
                imported_document,
                "figures",
                [],
            )
            or []
        )

        # --------------------------------------------------------------------
        # STATISTICS
        # --------------------------------------------------------------------

        result.statistics = self._build_statistics(
            text,
            result,
        )

        # --------------------------------------------------------------------
        # DOCUMENT IR
        # --------------------------------------------------------------------

        if build_document:
            try:
                result.document = self.to_document_ir(
                    result
                )

            except Exception as exc:
                result.add_error(
                    "Conversion vers Document IR "
                    f"impossible : {exc}"
                )

        return result

    # ========================================================================
    # DOCUMENT IR
    # ========================================================================

    def to_document_ir(
        self,
        result: DocumentAnalysisResult,
    ) -> Document:

        if result is None:
            raise AnalysisConversionError(
                "DocumentAnalysisResult requis."
            )

        try:
            metadata = result.metadata or {}

            title = (
                result.title
                or metadata.get("title")
                or metadata.get("document_title")
                or result.filename
            )

            author = str(
                metadata.get("author")
                or metadata.get("auteur")
                or ""
            )

            institution = str(
                metadata.get("institution")
                or metadata.get("universite")
                or ""
            )

            department = str(
                metadata.get("department")
                or metadata.get("departement")
                or ""
            )

            supervisor = str(
                metadata.get("supervisor")
                or metadata.get("encadreur")
                or ""
            )

            year = self._safe_int(
                metadata.get("year")
                or metadata.get("annee")
            )

            language = str(
                metadata.get("language")
                or metadata.get("langue")
                or "fr"
            )

            document_type = str(
                metadata.get("document_type")
                or metadata.get("type")
                or "scientific"
            )

            document = self.document_engine.create(
                title=str(title),
                author=author,
                institution=institution,
                department=department,
                supervisor=supervisor,
                year=year,
                language=language,
                document_type=document_type,
                keywords=list(result.keywords),
                abstract=result.abstract or "",
            )

            # ----------------------------------------------------------------
            # SECTIONS
            # ----------------------------------------------------------------

            for detected_section in result.sections:
                self._add_section(
                    document,
                    detected_section,
                )

            # ----------------------------------------------------------------
            # ÉQUATIONS détectées hors sections
            # ----------------------------------------------------------------

            if result.equations and not result.sections:
                section = self.document_engine.add_section(
                    document,
                    "Éléments scientifiques",
                    level=1,
                )

                for equation in result.equations:
                    self.document_engine.add_equation(
                        section,
                        equation.get("latex", ""),
                        label=equation.get("id"),
                    )

            # ----------------------------------------------------------------
            # ASSETS : TABLEAUX
            # ----------------------------------------------------------------

            if result.tables and not result.sections:
                section = self.document_engine.add_section(
                    document,
                    "Tableaux",
                    level=1,
                )

                for table in result.tables:
                    self._add_imported_table(
                        section,
                        table,
                    )

            # ----------------------------------------------------------------
            # ASSETS : FIGURES
            # ----------------------------------------------------------------

            if result.figures and not result.sections:
                section = self.document_engine.add_section(
                    document,
                    "Figures",
                    level=1,
                )

                for figure in result.figures:
                    self._add_imported_figure(
                        section,
                        figure,
                    )

            # ----------------------------------------------------------------
            # REFERENCES
            # ----------------------------------------------------------------

            for item in result.references:
                self._add_reference(
                    document,
                    item,
                )

            return document

        except Exception as exc:
            raise AnalysisConversionError(
                str(exc)
            ) from exc

    # ========================================================================
    # SECTION → IR
    # ========================================================================

    def _add_section(
        self,
        document: Document,
        detected: DetectedSection,
        parent: Any = None,
    ) -> Any:

        section = self.document_engine.add_section(
            document,
            detected.title,
            level=max(1, int(detected.level or 1)),
            parent=parent,
        )

        # --------------------------------------------------------------------
        # Paragraphes
        # --------------------------------------------------------------------

        for paragraph in detected.paragraphs:

            if paragraph is None:
                continue

            content = str(paragraph).strip()

            if not content:
                continue

            paragraph_ir = self.document_engine.add_paragraph(
                section,
                content,
            )

            # ------------------------------------------------------------
            # Citations du paragraphe
            # ------------------------------------------------------------

            citations = self._detect_citations(
                content
            )

            for citation in citations:
                try:
                    self.document_engine.add_citation(
                        paragraph_ir,
                        citation["key"],
                        citation_type=citation.get(
                            "type",
                            "parenthetical",
                        ),
                    )
                except Exception:
                    # Une citation invalide ne doit jamais
                    # faire échouer toute la conversion.
                    continue

        # --------------------------------------------------------------------
        # Équations détectées dans le contenu de la section
        # --------------------------------------------------------------------

        section_text = "\n".join(
            str(value)
            for value in detected.paragraphs
            if value
        )

        for equation in self._detect_equations(
            section_text
        ):
            try:
                self.document_engine.add_equation(
                    section,
                    equation["latex"],
                    label=equation.get("id"),
                )
            except Exception:
                continue

        # --------------------------------------------------------------------
        # Sous-sections
        # --------------------------------------------------------------------

        for child in detected.children:
            self._add_section(
                document,
                child,
                parent=section,
            )

        return section

    # ========================================================================
    # IMPORTED TABLE
    # ========================================================================

    def _add_imported_table(
        self,
        target: Any,
        table: Any,
    ) -> Any:

        columns: list[str] = []
        rows: list[list[Any]] = []

        if isinstance(table, dict):
            columns = [
                str(value)
                for value in (
                    table.get("columns")
                    or []
                )
            ]

            raw_rows = (
                table.get("rows")
                or table.get("data")
                or []
            )

            rows = [
                list(row)
                if isinstance(row, (list, tuple))
                else [row]
                for row in raw_rows
            ]

            caption = table.get("caption")
            label = table.get("label")

        else:
            caption = None
            label = None

        return self.document_engine.add_table(
            target,
            columns=columns,
            rows=rows,
            caption=caption,
            label=label,
        )

    # ========================================================================
    # IMPORTED FIGURE
    # ========================================================================

    def _add_imported_figure(
        self,
        target: Any,
        figure: Any,
    ) -> Any:

        if isinstance(figure, dict):
            source = figure.get("source")
            caption = figure.get("caption")
            label = figure.get("label")
            alt_text = figure.get("alt_text")

        else:
            source = None
            caption = None
            label = None
            alt_text = None

        return self.document_engine.add_figure(
            target,
            source=source,
            caption=caption,
            label=label,
            alt_text=alt_text,
        )

    # ========================================================================
    # REFERENCE
    # ========================================================================

    def _add_reference(
        self,
        document: Document,
        item: dict[str, Any],
    ) -> Any:

        title = str(
            item.get(
                "title",
                "Référence",
            )
            or "Référence"
        )

        return self.document_engine.add_reference(
            document,
            title,
            authors=list(
                item.get(
                    "authors",
                    [],
                )
                or []
            ),
            year=self._safe_int(
                item.get("year")
            ),
            journal=item.get("journal"),
            publisher=item.get("publisher"),
            doi=item.get("doi"),
            url=item.get("url"),
            citation_key=item.get("citation_key"),
            metadata=item.get("metadata"),
        )

    # ========================================================================
    # TITLE
    # ========================================================================

    @staticmethod
    def _detect_title(
        imported_document: Any,
        sections: list[DetectedSection],
    ) -> Optional[str]:

        metadata = (
            getattr(
                imported_document,
                "metadata",
                {},
            )
            or {}
        )

        for key in (
            "title",
            "document_title",
        ):
            value = metadata.get(key)

            if value:
                return str(value).strip()

        if sections:
            first = (
                sections[0]
                .title
                .strip()
                .lower()
            )

            if first not in {
                "document",
                "résumé",
                "resume",
                "abstract",
            }:
                return sections[0].title

        return None

    # ========================================================================
    # ABSTRACT
    # ========================================================================

    @staticmethod
    def _detect_abstract(
        sections: list[DetectedSection],
    ) -> Optional[str]:

        for section in sections:

            title = (
                section.title
                .strip()
                .lower()
            )

            if title in {
                "résumé",
                "resume",
                "abstract",
            }:
                content = (
                    "\n\n".join(
                        section.paragraphs
                    )
                    .strip()
                )

                return content or None

        return None

    # ========================================================================
    # KEYWORDS
    # ========================================================================

    @staticmethod
    def _detect_keywords(
        text: str,
        metadata: dict[str, Any],
    ) -> list[str]:

        value = (
            metadata.get("keywords")
            or metadata.get("mots_cles")
            or metadata.get("mots-clés")
        )

        if isinstance(value, str):
            return [
                item.strip()
                for item in re.split(
                    r"[,;]",
                    value,
                )
                if item.strip()
            ]

        if isinstance(value, (list, tuple)):
            return [
                str(item).strip()
                for item in value
                if str(item).strip()
            ]

        match = re.search(
            r"(?:mots[- ]clés|mots[- ]cles|keywords)"
            r"\s*[:\-]\s*(.+)",
            text,
            re.IGNORECASE,
        )

        if not match:
            return []

        return [
            item.strip()
            for item in re.split(
                r"[,;]",
                match.group(1),
            )
            if item.strip()
        ]

    # ========================================================================
    # CITATIONS
    # ========================================================================

    @classmethod
    def _detect_citations(
        cls,
        text: str,
    ) -> list[dict[str, Any]]:

        citations: list[dict[str, Any]] = []

        seen: set[str] = set()

        for match in cls.CITATION_PATTERN.finditer(
            text
        ):
            key = match.group("key")

            if key in seen:
                continue

            seen.add(key)

            citations.append(
                {
                    "key": key,
                    "type": "parenthetical",
                    "raw": match.group(0),
                }
            )

        return citations

    # ========================================================================
    # EQUATIONS
    # ========================================================================

    @classmethod
    def _detect_equations(
        cls,
        text: str,
    ) -> list[dict[str, Any]]:

        equations: list[dict[str, Any]] = []

        for line_number, line in enumerate(
            text.splitlines(),
            start=1,
        ):
            stripped = line.strip()

            if not stripped:
                continue

            if cls.EQUATION_PATTERN.search(
                stripped
            ):
                equations.append(
                    {
                        "id": f"eq-{line_number}",
                        "latex": stripped,
                        "line": line_number,
                    }
                )

        return equations

    # ========================================================================
    # REFERENCES
    # ========================================================================

    @staticmethod
    def _detect_references(
        sections: list[DetectedSection],
    ) -> list[dict[str, Any]]:

        references: list[dict[str, Any]] = []

        reference_titles = {
            "références",
            "references",
            "bibliographie",
            "bibliography",
        }

        for section in sections:

            title = (
                section.title
                .strip()
                .lower()
            )

            if title not in reference_titles:
                continue

            for line in section.paragraphs:

                if not line.strip():
                    continue

                references.append(
                    {
                        "title": line.strip(),
                        "authors": [],
                        "year": None,
                        "citation_key": None,
                    }
                )

        return references

    # ========================================================================
    # STATISTICS
    # ========================================================================

    @staticmethod
    def _build_statistics(
        text: str,
        result: DocumentAnalysisResult,
    ) -> AnalysisStatistics:

        words = re.findall(
            r"\b[\wÀ-ÿ'-]+\b",
            text,
            flags=re.UNICODE,
        )

        paragraph_count = sum(
            len(section.paragraphs)
            for section in result.sections
        )

        return AnalysisStatistics(
            character_count=len(text),
            word_count=len(words),
            line_count=len(text.splitlines()),
            paragraph_count=paragraph_count,
            section_count=len(result.sections),
            table_count=len(result.tables),
            figure_count=len(result.figures),
            equation_count=len(result.equations),
            citation_count=len(result.citations),
            reference_count=len(result.references),
        )

    # ========================================================================
    # UTILITIES
    # ========================================================================

    @staticmethod
    def _safe_int(
        value: Any,
    ) -> Optional[int]:

        if value is None or value == "":
            return None

        try:
            return int(value)
        except (TypeError, ValueError):
            return None