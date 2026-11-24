"""
MACEVO - Import Models
Version: 1.0.1

Contrats de données utilisés par le moteur d'importation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional


class ImportFormat(str, Enum):
    TXT = "txt"
    PDF = "pdf"
    DOCX = "docx"
    CSV = "csv"
    XLSX = "xlsx"
    IMAGE = "image"


@dataclass
class ImportedAsset:
    """
    Ressource extraite pendant l'import.

    Exemple :
    - image extraite d'un PDF
    - tableau
    - fichier annexe
    """

    asset_type: str
    name: str
    data: Any = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ImportedDocument:
    """
    Résultat normalisé d'une opération d'import.
    """

    source_path: str
    filename: str
    format: ImportFormat

    title: Optional[str] = None
    text: str = ""

    metadata: Dict[str, Any] = field(default_factory=dict)

    sections: List[Dict[str, Any]] = field(default_factory=list)
    tables: List[Dict[str, Any]] = field(default_factory=list)
    figures: List[ImportedAsset] = field(default_factory=list)

    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)

    success: bool = True

    def add_warning(self, message: str) -> None:
        if message:
            self.warnings.append(str(message))

    def add_error(self, message: str) -> None:
        if message:
            self.errors.append(str(message))
            self.success = False

    @property
    def path(self) -> Path:
        return Path(self.source_path)

    @property
    def has_errors(self) -> bool:
        return bool(self.errors)

    @property
    def has_warnings(self) -> bool:
        return bool(self.warnings)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_path": self.source_path,
            "filename": self.filename,
            "format": self.format.value,
            "title": self.title,
            "text": self.text,
            "metadata": self.metadata,
            "sections": self.sections,
            "tables": self.tables,
            "figures": [
                {
                    "asset_type": figure.asset_type,
                    "name": figure.name,
                    "data": figure.data,
                    "metadata": figure.metadata,
                }
                for figure in self.figures
            ],
            "warnings": self.warnings,
            "errors": self.errors,
            "success": self.success,
        }