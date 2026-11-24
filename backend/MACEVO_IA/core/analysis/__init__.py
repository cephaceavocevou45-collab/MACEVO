"""
MACEVO — Document Analysis Layer.

Couche d'analyse déterministe des documents importés.

Pipeline :

    ImportedDocument
        ↓
    DocumentAnalyzer
        ↓
    DocumentAnalysisResult
        ↓
    Document IR
"""

from .analyzer import DocumentAnalyzer
from .models import (
    AnalysisIssue,
    AnalysisSeverity,
    AnalysisStatistics,
    DetectedSection,
    DocumentAnalysisResult,
)

__all__ = [
    "DocumentAnalyzer",
    "AnalysisIssue",
    "AnalysisSeverity",
    "AnalysisStatistics",
    "DetectedSection",
    "DocumentAnalysisResult",
]