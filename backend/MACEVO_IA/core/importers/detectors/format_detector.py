"""
MACEVO - Format Detector
Version: 1.0.1
"""

from __future__ import annotations

from pathlib import Path

from core.importers.models import ImportFormat


class FormatDetector:
    """
    Détermine le format d'un fichier à partir de son extension.
    """

    EXTENSIONS = {
        ".txt": ImportFormat.TXT,
        ".pdf": ImportFormat.PDF,
        ".docx": ImportFormat.DOCX,
        ".csv": ImportFormat.CSV,
        ".xlsx": ImportFormat.XLSX,
        ".xlsm": ImportFormat.XLSX,
        ".png": ImportFormat.IMAGE,
        ".jpg": ImportFormat.IMAGE,
        ".jpeg": ImportFormat.IMAGE,
        ".webp": ImportFormat.IMAGE,
        ".bmp": ImportFormat.IMAGE,
        ".tif": ImportFormat.IMAGE,
        ".tiff": ImportFormat.IMAGE,
    }

    def detect(self, path: Path) -> ImportFormat:
        extension = path.suffix.lower()

        try:
            return self.EXTENSIONS[extension]
        except KeyError as exc:
            raise ValueError(
                f"Format non supporté pour le fichier : {path.name}"
            ) from exc