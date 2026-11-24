"""
MACEVO - PDF Extractor
Version: 1.0.1
"""

from __future__ import annotations

from pathlib import Path

import fitz

from core.importers.extractors.base import BaseExtractor
from core.importers.models import ImportedDocument, ImportFormat


class PDFExtractor(BaseExtractor):
    """
    Extracteur PDF basé sur PyMuPDF.
    """

    format = ImportFormat.PDF

    def extract(self, path: Path) -> ImportedDocument:
        self.validate_path(path)

        try:
            pdf = fitz.open(str(path))
        except Exception as exc:
            raise RuntimeError(
                f"Impossible d'ouvrir le PDF : {exc}"
            ) from exc

        try:
            pages = []
            metadata = dict(pdf.metadata or {})

            for page_number, page in enumerate(pdf, start=1):
                page_text = page.get_text("text") or ""

                pages.append(
                    {
                        "page_number": page_number,
                        "text": page_text,
                    }
                )

            text = "\n\n".join(
                page["text"].strip()
                for page in pages
                if page["text"].strip()
            )

            title = metadata.get("title") or path.stem

            document = ImportedDocument(
                source_path=str(path.resolve()),
                filename=path.name,
                format=self.format,
                title=title,
                text=text,
                metadata={
                    "page_count": len(pdf),
                    "pdf_metadata": metadata,
                    "extension": path.suffix.lower(),
                    "size_bytes": path.stat().st_size,
                    "pages": pages,
                },
            )

            if not text.strip():
                document.add_warning(
                    "Aucun texte exploitable n'a été extrait du PDF. "
                    "Le document peut être numérisé ou contenir uniquement "
                    "des images."
                )

            return document

        finally:
            pdf.close()