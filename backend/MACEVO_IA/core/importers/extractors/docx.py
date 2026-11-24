"""
MACEVO - DOCX Extractor
Version: 1.0.1

Extraction de documents Microsoft Word (.docx).
"""

from __future__ import annotations

from pathlib import Path

from core.importers.extractors.base import BaseExtractor
from core.importers.models import ImportedAsset, ImportedDocument, ImportFormat


class DOCXExtractor(BaseExtractor):
    """
    Extracteur DOCX basé sur python-docx.

    Extrait :
    - paragraphes
    - titres
    - tableaux
    - images embarquées
    - propriétés principales du document
    """

    format = ImportFormat.DOCX

    def extract(self, path: Path) -> ImportedDocument:
        self.validate_path(path)

        try:
            from docx import Document as WordDocument
        except ImportError as exc:
            raise RuntimeError(
                "python-docx est requis pour importer les fichiers DOCX."
            ) from exc

        try:
            document = WordDocument(str(path))
        except Exception as exc:
            raise RuntimeError(
                f"Impossible d'ouvrir le document DOCX : {exc}"
            ) from exc

        text_parts: list[str] = []
        sections: list[dict] = []
        tables: list[dict] = []
        figures: list[ImportedAsset] = []

        # ------------------------------------------------------------------
        # Paragraphes
        # ------------------------------------------------------------------

        for paragraph_index, paragraph in enumerate(
            document.paragraphs,
            start=1,
        ):
            text = paragraph.text.strip()

            if not text:
                continue

            style_name = ""
            try:
                style_name = paragraph.style.name or ""
            except Exception:
                pass

            style_lower = style_name.lower()

            level = None

            if "heading" in style_lower:
                try:
                    level = int(
                        style_lower.split("heading")[-1].strip()
                    )
                except (ValueError, TypeError):
                    level = 1

            block = {
                "type": "heading" if level is not None else "paragraph",
                "text": text,
                "index": paragraph_index,
                "style": style_name,
            }

            if level is not None:
                block["level"] = level

            sections.append(block)
            text_parts.append(text)

        # ------------------------------------------------------------------
        # Tableaux
        # ------------------------------------------------------------------

        for table_index, table in enumerate(
            document.tables,
            start=1,
        ):
            rows: list[list[str]] = []

            for row in table.rows:
                rows.append(
                    [
                        cell.text.strip()
                        for cell in row.cells
                    ]
                )

            columns = max(
                (len(row) for row in rows),
                default=0,
            )

            tables.append(
                {
                    "index": table_index,
                    "rows": rows,
                    "row_count": len(rows),
                    "column_count": columns,
                }
            )

        # ------------------------------------------------------------------
        # Images embarquées
        # ------------------------------------------------------------------

        try:
            relationships = document.part.rels.values()

            for relationship in relationships:
                if "image" not in relationship.reltype:
                    continue

                try:
                    image_part = relationship.target_part
                    image_data = image_part.blob
                    image_name = Path(
                        str(image_part.partname)
                    ).name

                    figures.append(
                        ImportedAsset(
                            asset_type="image",
                            name=image_name,
                            data=image_data,
                            metadata={
                                "relationship_id": relationship.rId,
                                "content_type": getattr(
                                    image_part,
                                    "content_type",
                                    None,
                                ),
                            },
                        )
                    )
                except Exception:
                    continue

        except Exception:
            pass

        # ------------------------------------------------------------------
        # Propriétés DOCX
        # ------------------------------------------------------------------

        properties = document.core_properties

        title = properties.title or path.stem
        author = properties.author or ""

        metadata = {
            "extension": path.suffix.lower(),
            "size_bytes": path.stat().st_size,
            "author": author,
            "subject": properties.subject or "",
            "keywords": properties.keywords or "",
            "comments": properties.comments or "",
            "last_modified_by": properties.last_modified_by or "",
            "created": (
                properties.created.isoformat()
                if properties.created
                else None
            ),
            "modified": (
                properties.modified.isoformat()
                if properties.modified
                else None
            ),
            "paragraph_count": len(document.paragraphs),
            "table_count": len(tables),
            "image_count": len(figures),
        }

        return ImportedDocument(
            source_path=str(path.resolve()),
            filename=path.name,
            format=self.format,
            title=title,
            text="\n\n".join(text_parts),
            metadata=metadata,
            sections=sections,
            tables=tables,
            figures=figures,
        )