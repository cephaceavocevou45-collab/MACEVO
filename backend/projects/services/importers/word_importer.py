
"""
==========================================================
MACEVO IA
Word Importer
==========================================================

Importeur robuste des documents Microsoft Word (.docx).

Objectifs :
- préserver le texte et la structure du document ;
- extraire les titres et niveaux de sections ;
- extraire les listes ;
- extraire les tableaux ;
- détecter les images ;
- conserver les métadonnées Word ;
- produire une structure exploitable par l'IA scientifique ;
- rester compatible avec BaseImporter.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from .base_importer import BaseImporter


logger = logging.getLogger(__name__)


class WordImporter(BaseImporter):
    """
    Importeur des fichiers Microsoft Word (.docx).
    """

    supported_extensions = (
        ".docx",
    )

    importer_name = "word"

    # ---------------------------------------------------------
    # Helpers
    # ---------------------------------------------------------

    @staticmethod
    def _paragraph_style(paragraph) -> str:
        """
        Retourne le nom du style du paragraphe si disponible.
        """
        try:
            return (paragraph.style.name or "").strip()
        except Exception:
            return ""

    @staticmethod
    def _paragraph_level(paragraph) -> int | None:
        """
        Détermine le niveau d'un titre Word.

        Exemples :
        Heading 1 -> 1
        Heading 2 -> 2
        Heading 3 -> 3

        Retourne None pour les paragraphes normaux.
        """
        style_name = WordImporter._paragraph_style(paragraph)

        if not style_name:
            return None

        normalized = style_name.lower().strip()

        # Formats anglais
        if normalized.startswith("heading"):
            parts = normalized.split()

            if len(parts) >= 2:
                try:
                    return int(parts[1])
                except (ValueError, TypeError):
                    pass

        # Formats français courants
        if normalized.startswith("titre"):
            parts = normalized.split()

            if len(parts) >= 2:
                try:
                    return int(parts[1])
                except (ValueError, TypeError):
                    pass

        return None

    @staticmethod
    def _is_list_paragraph(paragraph) -> bool:
        """
        Détecte approximativement si un paragraphe appartient à une liste.
        """
        style_name = WordImporter._paragraph_style(paragraph).lower()

        list_keywords = (
            "list",
            "liste",
            "bullet",
            "puce",
            "number",
            "numéro",
        )

        return any(keyword in style_name for keyword in list_keywords)

    @staticmethod
    def _extract_paragraph(paragraph) -> dict[str, Any]:
        """
        Convertit un paragraphe Word en structure normalisée.
        """
        text = paragraph.text.strip()

        level = WordImporter._paragraph_level(paragraph)

        item: dict[str, Any] = {
            "text": text,
            "style": WordImporter._paragraph_style(paragraph),
            "level": level,
            "is_heading": level is not None,
            "is_list": WordImporter._is_list_paragraph(paragraph),
        }

        return item

    @staticmethod
    def _extract_tables(document) -> list[dict[str, Any]]:
        """
        Extrait les tableaux Word sous une forme structurée.
        """
        tables: list[dict[str, Any]] = []

        for table_index, table in enumerate(document.tables, start=1):
            rows: list[list[str]] = []

            for row in table.rows:
                cells: list[str] = []

                for cell in row.cells:
                    text = cell.text.strip()
                    cells.append(text)

                rows.append(cells)

            max_columns = max(
                (len(row) for row in rows),
                default=0,
            )

            tables.append(
                {
                    "index": table_index,
                    "rows": rows,
                    "row_count": len(rows),
                    "column_count": max_columns,
                }
            )

        return tables

    @staticmethod
    def _extract_images(document) -> list[dict[str, Any]]:
        """
        Détecte les images intégrées dans le DOCX.

        python-docx expose les relations du document. Nous conservons
        suffisamment d'informations pour permettre une analyse ultérieure
        par le moteur Vision ou le pipeline scientifique.
        """
        images: list[dict[str, Any]] = []

        try:
            relationships = document.part.rels.values()
        except Exception:
            return images

        index = 0

        for relationship in relationships:
            try:
                if relationship.reltype.endswith("/image"):
                    index += 1

                    target = relationship.target_part

                    image_info = {
                        "index": index,
                        "relationship_id": relationship.rId,
                        "content_type": getattr(
                            target,
                            "content_type",
                            None,
                        ),
                        "part_name": str(
                            getattr(
                                target,
                                "partname",
                                "",
                            )
                        ),
                    }

                    images.append(image_info)

            except Exception as exc:
                logger.debug(
                    "Impossible d'extraire une image Word : %s",
                    exc,
                )

        return images

    @staticmethod
    def _extract_metadata(document) -> dict[str, Any]:
        """
        Extrait les métadonnées principales du document Word.
        """
        properties = document.core_properties

        return {
            "title": properties.title or "",
            "subject": properties.subject or "",
            "author": properties.author or "",
            "keywords": properties.keywords or "",
            "comments": properties.comments or "",
            "category": properties.category or "",
            "language": properties.language or "",
            "last_modified_by": properties.last_modified_by or "",
            "created": (
                properties.created.isoformat()
                if properties.created
                else None
            ),
            "modified": (
                properties.modified.isoformat()
                if properties.modified
                else None)
        }

    # ---------------------------------------------------------
    # Main import
    # ---------------------------------------------------------

    def import_document(
        self,
        file_path,
    ):
        """
        Importe un document DOCX.

        Retourne un dictionnaire normalisé via BaseImporter.build_result().
        """

        path = Path(file_path)

        self.validate_file(path)

        if path.suffix.lower() not in self.supported_extensions:
            raise ValueError(
                f"Format Word non supporté : {path.suffix}"
            )

        logger.info(
            "Import du document Word : %s",
            path,
        )

        try:
            # Importer python-docx au moment de l'usage évite de bloquer
            # le démarrage de toute l'API si sa dépendance native lxml
            # est absente ou incompatible dans l'environnement local.
            from docx import Document

            document = Document(path)
        except Exception as exc:
            logger.exception(
                "Impossible d'ouvrir le document Word : %s",
                path,
            )

            raise ValueError(
                f"Impossible de lire le fichier Word : {path}"
            ) from exc

        # -----------------------------------------------------
        # Paragraphes
        # -----------------------------------------------------

        paragraphs: list[dict[str, Any]] = []

        for paragraph in document.paragraphs:
            item = self._extract_paragraph(paragraph)

            if item["text"]:
                paragraphs.append(item)

        # -----------------------------------------------------
        # Titres / structure
        # -----------------------------------------------------

        headings = [
            {
                "text": paragraph["text"],
                "level": paragraph["level"],
                "style": paragraph["style"],
            }
            for paragraph in paragraphs
            if paragraph["is_heading"]
        ]

        # -----------------------------------------------------
        # Listes
        # -----------------------------------------------------

        lists = [
            paragraph["text"]
            for paragraph in paragraphs
            if paragraph["is_list"]
        ]

        # -----------------------------------------------------
        # Tableaux
        # -----------------------------------------------------

        tables = self._extract_tables(document)

        # -----------------------------------------------------
        # Images
        # -----------------------------------------------------

        images = self._extract_images(document)

        # -----------------------------------------------------
        # Métadonnées
        # -----------------------------------------------------

        core_metadata = self._extract_metadata(document)

        # -----------------------------------------------------
        # Texte principal
        # -----------------------------------------------------

        content_parts: list[str] = []

        for paragraph in paragraphs:
            text = paragraph["text"]

            if paragraph["is_heading"]:
                level = paragraph["level"] or 1

                content_parts.append(
                    f"{'#' * level} {text}"
                )

            elif paragraph["is_list"]:
                content_parts.append(
                    f"- {text}"
                )

            else:
                content_parts.append(text)

        # -----------------------------------------------------
        # Ajouter les tableaux au contenu textuel
        # -----------------------------------------------------

        for table in tables:
            content_parts.append("")

            rows = table["rows"]

            for row in rows:
                content_parts.append(
                    " | ".join(row)
                )

        content = "\n\n".join(
            part
            for part in content_parts
            if part.strip()
        )

        # -----------------------------------------------------
        # Statistiques
        # -----------------------------------------------------

        word_count = self.count_words(content)
        character_count = len(content)
        line_count = len(content.splitlines())

        heading_count = len(headings)
        table_count = len(tables)
        image_count = len(images)
        list_count = len(lists)

        # -----------------------------------------------------
        # Structure scientifique prête pour l'IA
        # -----------------------------------------------------

        structure = {
            "type": "word_document",
            "paragraphs": paragraphs,
            "headings": headings,
            "lists": lists,
            "tables": tables,
            "images": images,
        }

        scientific_analysis = {
            "has_headings": heading_count > 0,
            "has_tables": table_count > 0,
            "has_images": image_count > 0,
            "has_lists": list_count > 0,
            "heading_count": heading_count,
            "table_count": table_count,
            "image_count": image_count,
            "list_count": list_count,
            "likely_scientific_document": (
                heading_count >= 2
                or table_count > 0
                or image_count > 0
            ),
        }

        # -----------------------------------------------------
        # Métadonnées finales
        # -----------------------------------------------------

        metadata = {
            "format": "docx",
            "extension": ".docx",
            "filename": path.name,
            "source": str(path),

            "paragraphs": len(document.paragraphs),
            "non_empty_paragraphs": len(paragraphs),

            "headings": heading_count,
            "lists": list_count,
            "tables": table_count,
            "images": image_count,

            "word_count": word_count,
            "character_count": character_count,
            "line_count": line_count,

            "core_properties": core_metadata,

            "structure": structure,

            "scientific_analysis": scientific_analysis,

            # Indique que le document peut être envoyé vers
            # un pipeline Vision ultérieur.
            "vision_ready": image_count > 0,
        }

        return self.build_result(
            title=(
                core_metadata.get("title")
                or path.stem
            ),
            content=content,
            metadata=metadata,

            # Informations supplémentaires utiles aux services
            # supérieurs de MACEVO.
            paragraphs=paragraphs,
            headings=headings,
            lists=lists,
            tables=tables,
            images=images,
            structure=structure,
            scientific_analysis=scientific_analysis,
            core_properties=core_metadata,
            source_format="docx",
            source_path=str(path),
        )

    # ---------------------------------------------------------
    # Information
    # ---------------------------------------------------------

    @classmethod
    def info(cls) -> dict[str, Any]:
        """
        Informations sur l'importeur Word.
        """
        return {
            "name": cls.importer_name,
            "format": "Microsoft Word",
            "extensions": list(cls.supported_extensions),
            "features": [
                "text",
                "paragraphs",
                "headings",
                "lists",
                "tables",
                "images",
                "metadata",
                "scientific_structure",
                "vision_detection",
            ],
        }
