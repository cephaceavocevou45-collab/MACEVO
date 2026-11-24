"""
MACEVO - XLSX Extractor
Version: 1.0.1

Extraction de fichiers Excel (.xlsx / .xlsm).
"""

from __future__ import annotations

from pathlib import Path

from core.importers.extractors.base import BaseExtractor
from core.importers.models import ImportedDocument, ImportFormat


class XLSXExtractor(BaseExtractor):
    """
    Extracteur Excel basé sur openpyxl.

    Chaque feuille devient un tableau indépendant.
    """

    format = ImportFormat.XLSX

    def extract(self, path: Path) -> ImportedDocument:
        self.validate_path(path)

        try:
            import openpyxl
        except ImportError as exc:
            raise RuntimeError(
                "openpyxl est requis pour importer les fichiers Excel."
            ) from exc

        try:
            workbook = openpyxl.load_workbook(
                filename=str(path),
                data_only=True,
                read_only=True,
            )
        except Exception as exc:
            raise RuntimeError(
                f"Impossible d'ouvrir le fichier Excel : {exc}"
            ) from exc

        tables: list[dict] = []
        text_parts: list[str] = []

        try:
            for worksheet in workbook.worksheets:
                rows: list[list[str]] = []

                for row in worksheet.iter_rows(
                    values_only=True
                ):
                    normalized_row = [
                        "" if value is None else str(value)
                        for value in row
                    ]

                    # On conserve uniquement les lignes
                    # réellement exploitables.
                    if any(
                        value.strip()
                        for value in normalized_row
                    ):
                        rows.append(normalized_row)

                column_count = max(
                    (len(row) for row in rows),
                    default=0,
                )

                rendered = "\n".join(
                    " | ".join(row)
                    for row in rows
                )

                tables.append(
                    {
                        "name": worksheet.title,
                        "rows": rows,
                        "row_count": len(rows),
                        "column_count": column_count,
                    }
                )

                if rendered:
                    text_parts.append(
                        f"[Feuille : {worksheet.title}]\n"
                        f"{rendered}"
                    )

        finally:
            workbook.close()

        return ImportedDocument(
            source_path=str(path.resolve()),
            filename=path.name,
            format=self.format,
            title=path.stem,
            text="\n\n".join(text_parts),
            metadata={
                "extension": path.suffix.lower(),
                "size_bytes": path.stat().st_size,
                "sheet_count": len(tables),
                "sheet_names": [
                    table["name"]
                    for table in tables
                ],
            },
            tables=tables,
        )