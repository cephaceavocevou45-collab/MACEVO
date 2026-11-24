"""
MACEVO - CSV Extractor
Version: 1.0.1

Extraction de fichiers CSV.
"""

from __future__ import annotations

import csv
from pathlib import Path

from core.importers.extractors.base import BaseExtractor
from core.importers.models import ImportedDocument, ImportFormat


class CSVExtractor(BaseExtractor):
    """
    Extracteur CSV.

    Le contenu est normalisé sous forme de tableau dans
    ImportedDocument.tables.
    """

    format = ImportFormat.CSV

    ENCODINGS = (
        "utf-8-sig",
        "utf-8",
        "cp1252",
        "latin-1",
    )

    DELIMITERS = (
        ",",
        ";",
        "\t",
        "|",
    )

    def _detect_encoding(self, path: Path) -> str:
        for encoding in self.ENCODINGS:
            try:
                path.read_text(encoding=encoding)
                return encoding
            except UnicodeDecodeError:
                continue

        return "latin-1"

    def _detect_delimiter(
        self,
        path: Path,
        encoding: str,
    ) -> str:
        sample = path.read_text(
            encoding=encoding,
            errors="replace",
        )[:8192]

        try:
            dialect = csv.Sniffer().sniff(
                sample,
                delimiters="".join(self.DELIMITERS),
            )
            return dialect.delimiter
        except csv.Error:
            # Fallback raisonnable pour les CSV francophones.
            if ";" in sample:
                return ";"

            return ","

    def extract(self, path: Path) -> ImportedDocument:
        self.validate_path(path)

        encoding = self._detect_encoding(path)
        delimiter = self._detect_delimiter(
            path,
            encoding,
        )

        rows: list[list[str]] = []

        with path.open(
            "r",
            encoding=encoding,
            errors="replace",
            newline="",
        ) as file:
            reader = csv.reader(
                file,
                delimiter=delimiter,
            )

            for row in reader:
                rows.append(
                    [
                        str(value).strip()
                        for value in row
                    ]
                )

        column_count = max(
            (len(row) for row in rows),
            default=0,
        )

        rendered_lines = [
            " | ".join(row)
            for row in rows
        ]

        text = "\n".join(rendered_lines)

        return ImportedDocument(
            source_path=str(path.resolve()),
            filename=path.name,
            format=self.format,
            title=path.stem,
            text=text,
            metadata={
                "extension": path.suffix.lower(),
                "size_bytes": path.stat().st_size,
                "encoding": encoding,
                "delimiter": delimiter,
                "row_count": len(rows),
                "column_count": column_count,
            },
            tables=[
                {
                    "name": path.stem,
                    "rows": rows,
                    "row_count": len(rows),
                    "column_count": column_count,
                }
            ],
        )