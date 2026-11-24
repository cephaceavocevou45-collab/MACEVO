
"""
==========================================================
MACEVO IA
PowerPoint Importer
==========================================================

Importeur PowerPoint professionnel pour MACEVO.

Objectifs :
- importer les présentations .pptx ;
- conserver l'ordre des diapositives ;
- extraire les titres et textes ;
- extraire les tableaux ;
- détecter les images ;
- extraire les notes ;
- conserver les informations de structure ;
- calculer des statistiques ;
- préparer l'analyse scientifique ;
- préparer Vision et le Document IR.

L'importeur ne communique pas directement avec les
providers IA.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from .base_importer import BaseImporter


class PowerPointImporter(BaseImporter):
    """
    Importeur PowerPoint professionnel.
    """

    supported_extensions = (
        ".pptx",
    )

    importer_name = "powerpoint"

    # ======================================================
    # IMPORT PRINCIPAL
    # ======================================================

    def import_document(
        self,
        file_path,
    ):
        """
        Importe une présentation PowerPoint.

        Parameters
        ----------
        file_path : str | Path
            Chemin vers le fichier .pptx.

        Returns
        -------
        dict
            Résultat normalisé MACEVO.
        """

        if not file_path:
            raise ValueError(
                "Le chemin du fichier PowerPoint "
                "est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier PowerPoint introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension PowerPoint non supportée : "
                f"{path.suffix}"
            )

        try:
            # Charger python-pptx à la demande pour que l'API principale
            # reste démarrable lorsque lxml n'est pas compatible localement.
            from pptx import Presentation

            presentation = Presentation(
                str(path)
            )
        except Exception as exc:
            raise ValueError(
                f"Impossible d'ouvrir la présentation "
                f"{path.name} : {exc}"
            ) from exc

        # --------------------------------------------------
        # MÉTADONNÉES
        # --------------------------------------------------

        metadata = self._extract_metadata(
            presentation
        )

        # --------------------------------------------------
        # DIAPOSITIVES
        # --------------------------------------------------

        slides = []

        for index, slide in enumerate(
            presentation.slides,
            start=1,
        ):
            slides.append(
                self._extract_slide(
                    slide,
                    index,
                )
            )

        # --------------------------------------------------
        # CONTENU GLOBAL
        # --------------------------------------------------

        content = self._build_content(
            slides
        )

        # --------------------------------------------------
        # STATISTIQUES
        # --------------------------------------------------

        statistics = self._build_statistics(
            slides,
            content,
        )

        # --------------------------------------------------
        # STRUCTURE
        # --------------------------------------------------

        structure = {
            "slide_count": len(slides),

            "slides": [
                {
                    "number": slide["number"],
                    "title": slide["title"],
                    "text": slide["text"],
                    "tables": len(
                        slide["tables"]
                    ),
                    "images": len(
                        slide["images"]
                    ),
                    "notes": bool(
                        slide["notes"]
                    ),
                }
                for slide in slides
            ],
        }

        # --------------------------------------------------
        # RÉSULTAT
        # --------------------------------------------------

        return self.build_result(
            title=(
                metadata.get("title")
                or path.stem
            ),

            content=content,

            metadata={
                "format": "powerpoint",

                "source_file": path.name,

                "source_extension": path.suffix.lower(),

                "slides": len(slides),

                "author": metadata.get(
                    "author"
                ),

                "subject": metadata.get(
                    "subject"
                ),

                "keywords": metadata.get(
                    "keywords"
                ),

                "comments": metadata.get(
                    "comments"
                ),

                "last_modified_by": metadata.get(
                    "last_modified_by"
                ),

                "created": metadata.get(
                    "created"
                ),

                "modified": metadata.get(
                    "modified"
                ),

                "statistics": statistics,
            },

            source_path=path,

            source_format="powerpoint",

            slides=slides,

            structure=structure,

            presentation_metadata=metadata,

            statistics=statistics,

            vision={
                "available": True,

                "image_count": statistics[
                    "images"
                ],

                "slides_with_images": statistics[
                    "slides_with_images"
                ],
            },

            scientific_analysis={
                "text_available": bool(
                    content.strip()
                ),

                "table_content_available": (
                    statistics["tables"] > 0
                ),

                "visual_content_available": (
                    statistics["images"] > 0
                ),

                "scientific_content_candidate": (
                    self._looks_like_scientific_content(
                        content
                    )
                ),
            },
        )

    # ======================================================
    # MÉTADONNÉES
    # ======================================================

    @staticmethod
    def _extract_metadata(
        presentation,
    ) -> dict[str, Any]:
        """
        Extrait les propriétés principales du document.
        """

        try:
            properties = (
                presentation.core_properties
            )
        except Exception:
            return {}

        return {
            "title": getattr(
                properties,
                "title",
                "",
            ),

            "subject": getattr(
                properties,
                "subject",
                "",
            ),

            "author": getattr(
                properties,
                "author",
                "",
            ),

            "keywords": getattr(
                properties,
                "keywords",
                "",
            ),

            "comments": getattr(
                properties,
                "comments",
                "",
            ),

            "last_modified_by": getattr(
                properties,
                "last_modified_by",
                "",
            ),

            "created": str(
                getattr(
                    properties,
                    "created",
                    "",
                )
            ),

            "modified": str(
                getattr(
                    properties,
                    "modified",
                    "",
                )
            ),
        }

    # ======================================================
    # DIAPOSITIVE
    # ======================================================

    @classmethod
    def _extract_slide(
        cls,
        slide,
        slide_number: int,
    ) -> dict[str, Any]:
        """
        Extrait une diapositive complète.
        """

        title = cls._extract_title(
            slide
        )

        text_blocks = []

        tables = []

        images = []

        shapes = []

        for shape_index, shape in enumerate(
            slide.shapes,
            start=1,
        ):

            shape_data = {
                "index": shape_index,

                "shape_type": cls._shape_type(
                    shape
                ),

                "name": getattr(
                    shape,
                    "name",
                    "",
                ),

                "left": cls._emu_to_points(
                    getattr(
                        shape,
                        "left",
                        0,
                    )
                ),

                "top": cls._emu_to_points(
                    getattr(
                        shape,
                        "top",
                        0,
                    )
                ),

                "width": cls._emu_to_points(
                    getattr(
                        shape,
                        "width",
                        0,
                    )
                ),

                "height": cls._emu_to_points(
                    getattr(
                        shape,
                        "height",
                        0,
                    )
                ),
            }

            # ----------------------------------------------
            # TEXTE
            # ----------------------------------------------

            if getattr(
                shape,
                "has_text_frame",
                False,
            ):

                text = cls._extract_text_frame(
                    shape
                )

                if text:

                    text_blocks.append(
                        {
                            "index": shape_index,

                            "text": text,

                            "name": getattr(
                                shape,
                                "name",
                                "",
                            ),
                        }
                    )

                    shape_data["text"] = text

            # ----------------------------------------------
            # TABLEAU
            # ----------------------------------------------

            if getattr(
                shape,
                "has_table",
                False,
            ):

                table = cls._extract_table(
                    shape,
                    len(tables) + 1,
                )

                tables.append(
                    table
                )

                shape_data["table"] = table

            # ----------------------------------------------
            # IMAGE
            # ----------------------------------------------

            if cls._is_picture(shape):

                image = cls._extract_image(
                    shape,
                    len(images) + 1,
                )

                images.append(
                    image
                )

                shape_data["image"] = image

            shapes.append(
                shape_data
            )

        notes = cls._extract_notes(
            slide
        )

        text = "\n".join(
            item["text"]
            for item in text_blocks
        )

        return {
            "number": slide_number,

            "title": title,

            "text": cls.normalize_content(
                text
            ),

            "text_blocks": text_blocks,

            "tables": tables,

            "images": images,

            "notes": notes,

            "shapes": shapes,

            "word_count": cls.count_words(
                text
            ),

            "character_count": len(
                text
            ),
        }

    # ======================================================
    # TITRE
    # ======================================================

    @staticmethod
    def _extract_title(
        slide,
    ) -> str:
        """
        Extrait le titre de la diapositive.
        """

        try:
            title_shape = (
                slide.shapes.title
            )
        except Exception:
            title_shape = None

        if title_shape is not None:

            try:
                title = title_shape.text.strip()

                if title:
                    return title
            except Exception:
                pass

        # Fallback :
        # premier bloc de texte suffisamment court.
        for shape in slide.shapes:

            if not getattr(
                shape,
                "has_text_frame",
                False,
            ):
                continue

            try:
                text = shape.text.strip()
            except Exception:
                continue

            if not text:
                continue

            if len(text) <= 200:
                return text

        return ""

    # ======================================================
    # TEXTE
    # ======================================================

    @staticmethod
    def _extract_text_frame(
        shape,
    ) -> str:
        """
        Extrait le texte en conservant autant que possible
        les paragraphes et les lignes.
        """

        try:
            paragraphs = []

            for paragraph in shape.text_frame.paragraphs:

                text = "".join(
                    run.text
                    for run in paragraph.runs
                ).strip()

                if not text:
                    try:
                        text = (
                            paragraph.text
                            or ""
                        ).strip()
                    except Exception:
                        text = ""

                if text:
                    paragraphs.append(
                        text
                    )

            return "\n".join(
                paragraphs
            )

        except Exception:

            try:
                return shape.text.strip()
            except Exception:
                return ""

    # ======================================================
    # TABLEAU
    # ======================================================

    @classmethod
    def _extract_table(
        cls,
        shape,
        table_number: int,
    ) -> dict[str, Any]:
        """
        Extrait un tableau PowerPoint.
        """

        table = shape.table

        rows = []

        for row in table.rows:

            values = []

            for cell in row.cells:

                try:
                    value = (
                        cell.text
                        or ""
                    ).strip()
                except Exception:
                    value = ""

                values.append(
                    value
                )

            rows.append(
                values
            )

        headers = []

        data_rows = rows

        if rows:

            headers = rows[0]

            data_rows = rows[1:]

        return {
            "number": table_number,

            "headers": headers,

            "rows": data_rows,

            "raw_rows": rows,

            "row_count": len(rows),

            "column_count": (
                max(
                    (
                        len(row)
                        for row in rows
                    ),
                    default=0,
                )
            ),
        }

    # ======================================================
    # IMAGE
    # ======================================================

    @staticmethod
    def _is_picture(
        shape,
    ) -> bool:
        """
        Détermine si une forme correspond à une image.
        """

        try:
            return shape.shape_type == 13
        except Exception:
            return False

    @staticmethod
    def _extract_image(
        shape,
        image_number: int,
    ) -> dict[str, Any]:
        """
        Extrait les informations descriptives d'une image.

        Les octets de l'image ne sont pas copiés ici.
        Cette couche prépare simplement les données pour
        Vision / OCR / Document IR.
        """

        data = {
            "number": image_number,

            "name": getattr(
                shape,
                "name",
                "",
            ),

            "width": None,

            "height": None,

            "content_type": None,

            "extension": None,
        }

        try:
            image = shape.image

            data["content_type"] = getattr(
                image,
                "content_type",
                None,
            )

            data["extension"] = getattr(
                image,
                "ext",
                None,
            )

            data["width"] = getattr(
                image,
                "width",
                None,
            )

            data["height"] = getattr(
                image,
                "height",
                None,
            )

        except Exception:
            pass

        return data

    # ======================================================
    # NOTES
    # ======================================================

    @staticmethod
    def _extract_notes(
        slide,
    ) -> str:
        """
        Extrait les notes du présentateur lorsqu'elles sont
        disponibles.
        """

        try:
            notes_slide = slide.notes_slide

            text_parts = []

            for shape in notes_slide.shapes:

                if not getattr(
                    shape,
                    "has_text_frame",
                    False,
                ):
                    continue

                text = (
                    getattr(
                        shape,
                        "text",
                        "",
                    )
                    or ""
                ).strip()

                if text:
                    text_parts.append(
                        text
                    )

            return "\n".join(
                text_parts
            )

        except Exception:
            return ""

    # ======================================================
    # TYPE DE FORME
    # ======================================================

    @staticmethod
    def _shape_type(
        shape,
    ) -> str:
        """
        Retourne une représentation lisible du type de forme.
        """

        try:
            value = shape.shape_type

            return str(
                getattr(
                    value,
                    "name",
                    value,
                )
            )

        except Exception:
            return "unknown"

    # ======================================================
    # UNITÉS
    # ======================================================

    @staticmethod
    def _emu_to_points(
        value,
    ):
        """
        Convertit les EMU PowerPoint en points.
        """

        try:
            return round(
                float(value) / 12700,
                2,
            )
        except Exception:
            return 0

    # ======================================================
    # CONTENU GLOBAL
    # ======================================================

    @staticmethod
    def _build_content(
        slides,
    ) -> str:
        """
        Construit une représentation textuelle structurée
        de la présentation.
        """

        content = []

        for slide in slides:

            content.append(
                f"# Diapositive {slide['number']}"
            )

            if slide["title"]:
                content.append(
                    f"## {slide['title']}"
                )

            if slide["text"]:

                content.append(
                    slide["text"]
                )

            # ----------------------------------------------
            # TABLEAUX
            # ----------------------------------------------

            for table in slide["tables"]:

                content.append(
                    f"### Tableau "
                    f"{table['number']}"
                )

                rows = table["raw_rows"]

                for row in rows:

                    content.append(
                        " | ".join(row)
                    )

            # ----------------------------------------------
            # NOTES
            # ----------------------------------------------

            if slide["notes"]:

                content.append(
                    "### Notes du présentateur"
                )

                content.append(
                    slide["notes"]
                )

            content.append("")

        return "\n".join(
            content
        ).strip()

    # ======================================================
    # STATISTIQUES
    # ======================================================

    @staticmethod
    def _build_statistics(
        slides,
        content,
    ) -> dict[str, Any]:
        """
        Calcule les statistiques globales.
        """

        return {
            "slides": len(slides),

            "text_blocks": sum(
                len(slide["text_blocks"])
                for slide in slides
            ),

            "tables": sum(
                len(slide["tables"])
                for slide in slides
            ),

            "images": sum(
                len(slide["images"])
                for slide in slides
            ),

            "slides_with_images": sum(
                1
                for slide in slides
                if slide["images"]
            ),

            "slides_with_tables": sum(
                1
                for slide in slides
                if slide["tables"]
            ),

            "slides_with_notes": sum(
                1
                for slide in slides
                if slide["notes"]
            ),

            "characters": len(
                content
            ),

            "words": PowerPointImporter.count_words(
                content
            ),

            "lines": PowerPointImporter.count_lines(
                content
            ),
        }

    # ======================================================
    # ANALYSE SCIENTIFIQUE
    # ======================================================

    @staticmethod
    def _looks_like_scientific_content(
        text,
    ) -> bool:
        """
        Détection heuristique préliminaire.

        Ce n'est pas le moteur scientifique de MACEVO.
        """

        if not text:
            return False

        indicators = (
            "méthodologie",
            "methodology",
            "résultats",
            "results",
            "discussion",
            "conclusion",
            "références",
            "references",
            "bibliographie",
            "équation",
            "equation",
            "figure",
            "tableau",
            "théorème",
            "theorem",
            "hypothèse",
            "hypothesis",
            "expérience",
            "experiment",
            "analyse",
            "analysis",
        )

        lowered = text.lower()

        return any(
            indicator in lowered
            for indicator in indicators
        )

    # ======================================================
    # INFORMATIONS
    # ======================================================

    @classmethod
    def info(cls):
        """
        Informations publiques sur l'importeur.
        """

        data = super().info()

        data.update(
            {
                "description": (
                    "Importeur PowerPoint professionnel "
                    "pour MACEVO."
                ),

                "slide_extraction": True,

                "text_extraction": True,

                "table_extraction": True,

                "image_detection": True,

                "notes_extraction": True,

                "layout_coordinates": True,

                "scientific_analysis": True,

                "vision_ready": True,

                "document_ir_ready": True,
            }
        )

        return data
