"""
MACEVO — Document Analysis Models.

Structures de données utilisées par la couche d'analyse documentaire.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional


# ============================================================================
# SEVERITY
# ============================================================================


class AnalysisSeverity(str, Enum):
    """Niveau de gravité d'un problème d'analyse."""

    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


# ============================================================================
# ISSUE
# ============================================================================


@dataclass
class AnalysisIssue:
    """Problème ou information produit pendant l'analyse."""

    message: str

    severity: AnalysisSeverity = AnalysisSeverity.WARNING

    code: str = "analysis.warning"

    location: Optional[str] = None

    metadata: dict[str, Any] = field(
        default_factory=dict
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "message": self.message,
            "severity": self.severity.value,
            "code": self.code,
            "location": self.location,
            "metadata": dict(self.metadata),
        }


# ============================================================================
# STATISTICS
# ============================================================================


@dataclass
class AnalysisStatistics:
    """Statistiques calculées sur le document."""

    character_count: int = 0

    word_count: int = 0

    line_count: int = 0

    paragraph_count: int = 0

    section_count: int = 0

    table_count: int = 0

    figure_count: int = 0

    equation_count: int = 0

    citation_count: int = 0

    reference_count: int = 0

    def to_dict(self) -> dict[str, int]:
        return {
            "character_count": self.character_count,
            "word_count": self.word_count,
            "line_count": self.line_count,
            "paragraph_count": self.paragraph_count,
            "section_count": self.section_count,
            "table_count": self.table_count,
            "figure_count": self.figure_count,
            "equation_count": self.equation_count,
            "citation_count": self.citation_count,
            "reference_count": self.reference_count,
        }


# ============================================================================
# DETECTED SECTION
# ============================================================================


@dataclass
class DetectedSection:
    """
    Section détectée dans un document.

    Elle constitue une structure intermédiaire avant conversion
    vers core.document.ir.Document.
    """

    title: str

    level: int = 1

    number: Optional[str] = None

    paragraphs: list[str] = field(
        default_factory=list
    )

    children: list["DetectedSection"] = field(
        default_factory=list
    )

    metadata: dict[str, Any] = field(
        default_factory=dict
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "level": self.level,
            "number": self.number,
            "paragraphs": list(self.paragraphs),
            "children": [
                child.to_dict()
                for child in self.children
            ],
            "metadata": dict(self.metadata),
        }


# ============================================================================
# ANALYSIS RESULT
# ============================================================================


@dataclass
class DocumentAnalysisResult:
    """
    Résultat complet de l'analyse d'un document.
    """

    source_path: Optional[str] = None

    filename: str = ""

    format: Optional[str] = None

    title: Optional[str] = None

    abstract: Optional[str] = None

    keywords: list[str] = field(
        default_factory=list
    )

    sections: list[DetectedSection] = field(
        default_factory=list
    )

    citations: list[dict[str, Any]] = field(
        default_factory=list
    )

    references: list[dict[str, Any]] = field(
        default_factory=list
    )

    tables: list[Any] = field(
        default_factory=list
    )

    figures: list[Any] = field(
        default_factory=list
    )

    equations: list[dict[str, Any]] = field(
        default_factory=list
    )

    statistics: AnalysisStatistics = field(
        default_factory=AnalysisStatistics
    )

    warnings: list[str] = field(
        default_factory=list
    )

    errors: list[str] = field(
        default_factory=list
    )

    metadata: dict[str, Any] = field(
        default_factory=dict
    )

    document: Any = None

    @property
    def success(self) -> bool:
        return not self.errors

    @property
    def failed(self) -> bool:
        return bool(self.errors)

    @property
    def has_warnings(self) -> bool:
        return bool(self.warnings)

    def add_warning(
        self,
        message: str,
    ) -> None:
        self.warnings.append(
            str(message)
        )

    def add_error(
        self,
        message: str,
    ) -> None:
        self.errors.append(
            str(message)
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "source_path": self.source_path,
            "filename": self.filename,
            "format": self.format,
            "title": self.title,
            "abstract": self.abstract,
            "keywords": list(self.keywords),
            "sections": [
                section.to_dict()
                for section in self.sections
            ],
            "citations": list(self.citations),
            "references": list(self.references),
            "tables": list(self.tables),
            "figures": list(self.figures),
            "equations": list(self.equations),
            "statistics": self.statistics.to_dict(),
            "warnings": list(self.warnings),
            "errors": list(self.errors),
            "metadata": dict(self.metadata),
        }