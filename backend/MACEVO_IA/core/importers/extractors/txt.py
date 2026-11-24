"""
MACEVO - TXT Extractor
Version: 1.0.1
"""

from __future__ import annotations

from pathlib import Path

from core.importers.extractors.base import BaseExtractor
from core.importers.models import ImportedDocument, ImportFormat


class TXTExtractor(BaseExtractor):
    """
    Extracteur de fichiers texte.
    """

    format = ImportFormat.TXT

    ENCODINGS = (
        "utf-8",
        "utf-8-sig",
        "cp1252",
        "latin-1",
    )

    def extract(self, path: Path) -> ImportedDocument:
        self.validate_path(path)

        text = None
        last_error = None

        for encoding in self.ENCODINGS:
            try:
                text = path.read_text(encoding=encoding)
                break
            except UnicodeDecodeError as exc:
                last_error = exc

        if text is None:
            raise UnicodeDecodeError(
                "unknown",
                b"",
                0,
                1,
                f"Impossible de décoder le fichier : {last_error}",
            )

        title = path.stem.strip() or None

        return ImportedDocument(
            source_path=str(path.resolve()),
            filename=path.name,
            format=self.format,
            title=title,
            text=text,
            metadata={
                "encoding": encoding,
                "extension": path.suffix.lower(),
                "size_bytes": path.stat().st_size,
            },
        )