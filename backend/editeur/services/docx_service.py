"""
MACEVO — Export DOCX scientifique.

Le DOCX est généré à partir du modèle documentaire canonique
produit par ``document_service.build_document()``.

Architecture :

    Report
       ↓
    ReportDocumentBuilder
       ↓
    DOCXService
       ↓
    fichier .docx

Responsabilités :

    - métadonnées académiques ;
    - titres et sections ;
    - paragraphes ;
    - listes ;
    - tableaux ;
    - figures ;
    - images ;
    - légendes ;
    - citations ;
    - blocs de code ;
    - équations et expressions LaTeX ;
    - annexes ;
    - mise en forme académique de base.

Le service ne crée aucun nouveau modèle documentaire.
Il utilise exclusivement ``reports.Report`` comme document canonique.
"""

from __future__ import annotations

import html
import logging
import re
import tempfile
import uuid
from pathlib import Path
from typing import Any

from django.conf import settings

from .document_service import build_document


logger = logging.getLogger(__name__)


class DOCXService:
    """
    Générateur DOCX scientifique de MACEVO.

    Le fichier retourné est toujours un ``Path``.
    """

    # ------------------------------------------------------------------
    # API PUBLIQUE
    # ------------------------------------------------------------------

    def export(self, report) -> Path:
        """
        Exporte un rapport MACEVO en DOCX.

        Parameters
        ----------
        report:
            Instance canonique de ``reports.Report``.

        Returns
        -------
        pathlib.Path
            Chemin absolu du fichier DOCX généré.
        """

        try:
            from docx import Document
            from docx.enum.section import WD_SECTION
            from docx.enum.text import WD_ALIGN_PARAGRAPH
            from docx.enum.table import WD_TABLE_ALIGNMENT
            from docx.shared import Cm, Pt
        except ImportError as exc:
            raise RuntimeError(
                "python-docx n'est pas installé."
            ) from exc

        document_data = build_document(report)

        doc = Document()

        self._configure_document(
            doc
        )

        self._configure_default_style(
            doc
        )

        metadata = document_data.get(
            "metadata",
            {},
        )

        self._add_document_header(
            doc,
            metadata,
        )

        keywords = document_data.get(
            "keywords",
            [],
        )

        self._add_keywords(
            doc,
            keywords,
        )

        blocks = document_data.get(
            "blocks",
            [],
        )

        assets = document_data.get(
            "images",
            [],
        )

        self._render_blocks(
            doc,
            blocks,
            assets,
        )

        self._add_references(
            doc,
            document_data.get(
                "references",
                [],
            ),
        )

        self._add_appendix(
            doc,
            document_data.get(
                "appendix",
                [],
            ),
        )

        export_dir = self._get_export_directory()

        filename = (
            f"report_{report.pk}_"
            f"{uuid.uuid4().hex[:8]}.docx"
        )

        path = (
            export_dir
            / filename
        )

        doc.save(
            path
        )

        return path

    # ------------------------------------------------------------------
    # CONFIGURATION DU DOCUMENT
    # ------------------------------------------------------------------

    @staticmethod
    def _configure_document(doc) -> None:
        """
        Configure la page DOCX sur une base A4 académique.
        """

        from docx.enum.section import WD_ORIENT
        from docx.shared import Cm

        for section in doc.sections:
            section.page_width = Cm(21)
            section.page_height = Cm(29.7)

            section.top_margin = Cm(2.2)
            section.bottom_margin = Cm(2.2)
            section.left_margin = Cm(2.5)
            section.right_margin = Cm(2.5)

            section.orientation = WD_ORIENT.PORTRAIT

    @staticmethod
    def _configure_default_style(doc) -> None:
        """
        Configure le style Normal et quelques styles académiques.
        """

        from docx.shared import Pt

        styles = doc.styles

        normal = styles["Normal"]

        normal.font.name = "Arial"
        normal.font.size = Pt(11)

        paragraph_format = normal.paragraph_format
        paragraph_format.space_after = Pt(8)
        paragraph_format.line_spacing = 1.5

        style_map = {
            "Title": 20,
            "Heading 1": 16,
            "Heading 2": 14,
            "Heading 3": 12,
            "Heading 4": 11,
            "Heading 5": 11,
            "Heading 6": 11,
        }

        for style_name, size in style_map.items():
            try:
                style = styles[style_name]
                style.font.name = "Arial"
                style.font.size = Pt(size)
                style.font.bold = True
            except KeyError:
                continue

    # ------------------------------------------------------------------
    # EN-TÊTE ACADÉMIQUE
    # ------------------------------------------------------------------

    def _add_document_header(
        self,
        doc,
        metadata: dict[str, Any],
    ) -> None:
        """
        Ajoute les métadonnées académiques principales.
        """

        from docx.enum.text import WD_ALIGN_PARAGRAPH
        from docx.shared import Pt

        title = self._safe_string(
            metadata.get(
                "title",
                "Rapport MACEVO",
            )
        )

        paragraph = doc.add_paragraph()

        paragraph.alignment = (
            WD_ALIGN_PARAGRAPH.CENTER
        )

        run = paragraph.add_run(
            title
        )

        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(20)

        metadata_values = [
            (
                "Auteur",
                metadata.get(
                    "author",
                    "",
                ),
            ),
            (
                "Institution",
                metadata.get(
                    "institution",
                    "",
                ),
            ),
            (
                "Département",
                metadata.get(
                    "department",
                    "",
                ),
            ),
            (
                "Encadreur",
                metadata.get(
                    "supervisor",
                    "",
                ),
            ),
            (
                "Année académique",
                metadata.get(
                    "academic_year",
                    "",
                ),
            ),
        ]

        for label, value in metadata_values:
            value = self._safe_string(
                value
            )

            if not value:
                continue

            paragraph = doc.add_paragraph()

            paragraph.alignment = (
                WD_ALIGN_PARAGRAPH.CENTER
            )

            run = paragraph.add_run(
                f"{label} : "
            )

            run.bold = True

            paragraph.add_run(
                value
            )

        doc.add_paragraph()

    # ------------------------------------------------------------------
    # MOTS-CLÉS
    # ------------------------------------------------------------------

    def _add_keywords(
        self,
        doc,
        keywords,
    ) -> None:
        """
        Ajoute les mots-clés académiques.
        """

        values = self._normalize_keywords(
            keywords
        )

        if not values:
            return

        paragraph = doc.add_paragraph()

        run = paragraph.add_run(
            "Mots-clés : "
        )

        run.bold = True

        paragraph.add_run(
            ", ".join(values)
        )

    @staticmethod
    def _normalize_keywords(
        keywords,
    ) -> list[str]:
        if not keywords:
            return []

        if isinstance(
            keywords,
            str,
        ):
            return [
                item.strip()
                for item in keywords.split(",")
                if item.strip()
            ]

        values = []

        for keyword in keywords:
            if isinstance(
                keyword,
                dict,
            ):
                keyword = (
                    keyword.get("keyword")
                    or keyword.get("text")
                    or ""
                )

            keyword = str(
                keyword
            ).strip()

            if keyword:
                values.append(
                    keyword
                )

        return values

    # ------------------------------------------------------------------
    # BLOCS DOCUMENTAIRES
    # ------------------------------------------------------------------

    def _render_blocks(
        self,
        doc,
        blocks,
        assets,
    ) -> None:
        """
        Rend tous les blocs du modèle documentaire.
        """

        for block in blocks:
            if not isinstance(
                block,
                dict,
            ):
                continue

            self._render_block(
                doc,
                block,
                assets,
            )

    def _render_block(
        self,
        doc,
        block: dict[str, Any],
        assets,
    ) -> None:
        """
        Rend un bloc documentaire individuel.
        """

        block_type = str(
            block.get(
                "type",
                "",
            )
        ).lower()

        tag = str(
            block.get(
                "tag",
                "",
            )
        ).lower()

        if tag in {
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
        }:
            self._render_heading(
                doc,
                block,
                tag,
            )
            return

        if block_type in {
            "heading",
        }:
            self._render_heading(
                doc,
                block,
                tag,
            )
            return

        if block_type == "paragraph":
            self._render_paragraph(
                doc,
                block,
            )
            return

        if block_type == "list":
            self._render_list(
                doc,
                block,
            )
            return

        if block_type == "table" or tag == "table":
            self._render_table(
                doc,
                block,
            )
            return

        if block_type == "figure" or tag == "figure":
            self._render_figure(
                doc,
                block,
                assets,
            )
            return

        if block_type == "image":
            self._render_image(
                doc,
                block,
                assets,
            )
            return

        if block_type in {
            "blockquote",
            "quote",
        }:
            self._render_quote(
                doc,
                block,
            )
            return

        if block_type in {
            "pre",
            "code",
        } or tag == "pre":
            self._render_code(
                doc,
                block,
            )
            return

        if block_type == "math":
            self._render_math(
                doc,
                block,
            )
            return

        if block_type == "scientific_shape":
            self._render_scientific_shape(
                doc,
                block,
            )
            return

        text = self._extract_block_text(
            block
        )

        if text:
            self._render_plain_text(
                doc,
                text,
            )

    # ------------------------------------------------------------------
    # TITRES
    # ------------------------------------------------------------------

    def _render_heading(
        self,
        doc,
        block: dict[str, Any],
        tag: str,
    ) -> None:
        text = self._extract_block_text(
            block
        )

        if not text:
            return

        level = self._heading_level(
            block,
            tag,
        )

        paragraph = doc.add_heading(
            text,
            level=level,
        )

        paragraph.paragraph_format.keep_with_next = True

    @staticmethod
    def _heading_level(
        block: dict[str, Any],
        tag: str,
    ) -> int:
        if tag in {
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
        }:
            try:
                return max(
                    1,
                    min(
                        int(tag[1]),
                        6,
                    ),
                )
            except (
                ValueError,
                IndexError,
            ):
                pass

        level = block.get(
            "level",
            1,
        )

        try:
            level = int(
                level
            )
        except (
            TypeError,
            ValueError,
        ):
            level = 1

        return max(
            1,
            min(
                level,
                6,
            ),
        )

    # ------------------------------------------------------------------
    # PARAGRAPHES
    # ------------------------------------------------------------------

    def _render_paragraph(
        self,
        doc,
        block: dict[str, Any],
    ) -> None:
        paragraph = doc.add_paragraph()

        self._render_inline_nodes(
            paragraph,
            block,
        )

        if not paragraph.text.strip():
            text = self._extract_block_text(
                block
            )

            if text:
                paragraph.add_run(
                    text
                )

    def _render_plain_text(
        self,
        doc,
        text: str,
    ) -> None:
        paragraph = doc.add_paragraph()

        paragraph.add_run(
            text
        )

    # ------------------------------------------------------------------
    # CONTENU INLINE
    # ------------------------------------------------------------------

    def _render_inline_nodes(
        self,
        paragraph,
        block: dict[str, Any],
    ) -> None:
        """
        Rend les nœuds inline issus du parser documentaire.
        """

        nodes = block.get(
            "inline_nodes",
            [],
        )

        if not nodes:
            text = self._extract_block_text(
                block
            )

            if text:
                paragraph.add_run(
                    text
                )

            return

        for node in nodes:
            if not isinstance(
                node,
                dict,
            ):
                continue

            node_type = str(
                node.get(
                    "type",
                    "",
                )
            ).lower()

            if node_type == "math":
                self._add_math_run(
                    paragraph,
                    node.get(
                        "latex",
                        "",
                    ),
                )
                continue

            if node_type == "link":
                self._add_link_text(
                    paragraph,
                    node,
                )
                continue

            text = self._node_text(
                node
            )

            if not text:
                continue

            run = paragraph.add_run(
                text
            )

            marks = node.get(
                "marks",
                [],
            )

            if isinstance(
                marks,
                list,
            ):
                self._apply_marks(
                    run,
                    marks,
                )

    @staticmethod
    def _node_text(
        node: dict[str, Any],
    ) -> str:
        text = node.get(
            "text",
            "",
        )

        if text:
            return str(
                text
            )

        return str(
            node.get(
                "content",
                "",
            )
            or ""
        )

    @staticmethod
    def _apply_marks(
        run,
        marks,
    ) -> None:
        """
        Applique les marques Tiptap principales.
        """

        for mark in marks:
            if isinstance(
                mark,
                str,
            ):
                mark_type = mark
                attrs = {}
            elif isinstance(
                mark,
                dict,
            ):
                mark_type = str(
                    mark.get(
                        "type",
                        "",
                    )
                ).lower()

                attrs = mark.get(
                    "attrs",
                    {},
                )
            else:
                continue

            if mark_type in {
                "bold",
                "strong",
            }:
                run.bold = True

            elif mark_type in {
                "italic",
                "em",
            }:
                run.italic = True

            elif mark_type in {
                "underline",
            }:
                run.underline = True

            elif mark_type in {
                "strike",
                "strikethrough",
            }:
                run.font.strike = True

            elif mark_type in {
                "superscript",
            }:
                run.font.superscript = True

            elif mark_type in {
                "subscript",
            }:
                run.font.subscript = True

            elif mark_type == "textStyle":
                if isinstance(
                    attrs,
                    dict,
                ):
                    color = attrs.get(
                        "color"
                    )

                    if color:
                        try:
                            from docx.shared import RGBColor

                            normalized = (
                                str(color)
                                .replace(
                                    "#",
                                    "",
                                )
                                .strip()
                            )

                            if len(
                                normalized
                            ) == 6:
                                run.font.color.rgb = (
                                    RGBColor.from_string(
                                        normalized.upper()
                                    )
                                )
                        except Exception:
                            pass

    # ------------------------------------------------------------------
    # LIENS
    # ------------------------------------------------------------------

    @staticmethod
    def _add_link_text(
        paragraph,
        node: dict[str, Any],
    ) -> None:
        """
        Ajoute un lien sous forme de texte.

        python-docx ne fournit pas directement une API haut niveau
        complète pour les hyperlinks ; le texte et l'URL sont donc
        conservés explicitement.
        """

        text = (
            node.get(
                "text"
            )
            or node.get(
                "content"
            )
            or node.get(
                "attrs",
                {},
            ).get(
                "href",
                "",
            )
        )

        attrs = node.get(
            "attrs",
            {},
        )

        href = ""

        if isinstance(
            attrs,
            dict,
        ):
            href = attrs.get(
                "href",
                "",
            )

        if text:
            run = paragraph.add_run(
                str(text)
            )

            run.underline = True

        if href:
            paragraph.add_run(
                f" ({href})"
            )

    # ------------------------------------------------------------------
    # LISTES
    # ------------------------------------------------------------------

    def _render_list(
        self,
        doc,
        block: dict[str, Any],
    ) -> None:
        ordered = bool(
            block.get(
                "ordered",
                False,
            )
        )

        style = (
            "List Number"
            if ordered
            else "List Bullet"
        )

        items = block.get(
            "items",
            [],
        )

        if not isinstance(
            items,
            list,
        ):
            return

        for item in items:
            if isinstance(
                item,
                dict,
            ):
                text = (
                    item.get("text")
                    or item.get("content")
                    or ""
                )
            else:
                text = str(
                    item
                )

            text = str(
                text
            ).strip()

            if not text:
                continue

            doc.add_paragraph(
                text,
                style=style,
            )

    # ------------------------------------------------------------------
    # TABLEAUX
    # ------------------------------------------------------------------

    def _render_table(
        self,
        doc,
        block: dict[str, Any],
    ) -> None:
        rows = block.get(
            "rows",
            [],
        )

        if not isinstance(
            rows,
            list,
        ) or not rows:
            return

        normalized_rows = []

        for row in rows:
            if isinstance(
                row,
                list,
            ):
                normalized_rows.append(
                    row
                )
            elif isinstance(
                row,
                dict,
            ):
                cells = row.get(
                    "cells",
                    [],
                )

                if isinstance(
                    cells,
                    list,
                ):
                    normalized_rows.append(
                        cells
                    )

        if not normalized_rows:
            return

        column_count = max(
            (
                len(row)
                for row in normalized_rows
            ),
            default=0,
        )

        if column_count <= 0:
            return

        table = doc.add_table(
            rows=len(
                normalized_rows
            ),
            cols=column_count,
        )

        table.style = "Table Grid"

        try:
            from docx.enum.table import WD_TABLE_ALIGNMENT

            table.alignment = (
                WD_TABLE_ALIGNMENT.CENTER
            )
        except Exception:
            pass

        for row_index, row in enumerate(
            normalized_rows
        ):
            for column_index in range(
                column_count
            ):
                if column_index >= len(
                    row
                ):
                    continue

                cell_data = row[
                    column_index
                ]

                text = self._cell_text(
                    cell_data
                )

                table.cell(
                    row_index,
                    column_index,
                ).text = text

                self._format_table_cell(
                    table.cell(
                        row_index,
                        column_index,
                    ),
                    cell_data,
                )

    @staticmethod
    def _cell_text(
        cell,
    ) -> str:
        if isinstance(
            cell,
            dict,
        ):
            return str(
                cell.get(
                    "text",
                    "",
                )
                or cell.get(
                    "content",
                    "",
                )
                or ""
            )

        return str(
            cell
            or ""
        )

    @staticmethod
    def _format_table_cell(
        cell,
        cell_data,
    ) -> None:
        """
        Met en évidence les cellules d'en-tête.
        """

        if not isinstance(
            cell_data,
            dict,
        ):
            return

        cell_type = str(
            cell_data.get(
                "type",
                "",
            )
        ).lower()

        if cell_type not in {
            "th",
            "header",
        }:
            return

        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.bold = True

    # ------------------------------------------------------------------
    # FIGURES
    # ------------------------------------------------------------------

    def _render_figure(
        self,
        doc,
        block: dict[str, Any],
        assets,
    ) -> None:
        """
        Rend une figure scientifique et sa légende.
        """

        images = block.get(
            "images",
            [],
        )

        rendered_image = False

        if isinstance(
            images,
            list,
        ):
            for image in images:
                if self._insert_image(
                    doc,
                    image,
                    assets,
                ):
                    rendered_image = True
                    break

        if not rendered_image:
            image = block.get(
                "image"
            )

            if image:
                rendered_image = (
                    self._insert_image(
                        doc,
                        image,
                        assets,
                    )
                )

        caption = self._safe_string(
            block.get(
                "caption",
                "",
            )
        )

        if caption:
            self._add_caption(
                doc,
                caption,
            )

    # ------------------------------------------------------------------
    # IMAGES
    # ------------------------------------------------------------------

    def _render_image(
        self,
        doc,
        block: dict[str, Any],
        assets,
    ) -> None:
        self._insert_image(
            doc,
            block,
            assets,
        )

        caption = self._safe_string(
            block.get(
                "caption",
                "",
            )
        )

        if caption:
            self._add_caption(
                doc,
                caption,
            )

    def _insert_image(
        self,
        doc,
        image,
        assets,
    ) -> bool:
        """
        Insère une image lorsqu'un chemin local exploitable existe.
        """

        image_path = self._resolve_image_path(
            image,
            assets,
        )

        if not image_path:
            return False

        if not image_path.exists():
            return False

        try:
            from docx.shared import Inches

            paragraph = doc.add_paragraph()

            paragraph.alignment = 1

            run = paragraph.add_run()

            run.add_picture(
                str(image_path),
                width=Inches(5.8),
            )

            return True

        except Exception as exc:
            logger.warning(
                "Impossible d'insérer l'image DOCX %s : %s",
                image_path,
                exc,
            )
            return False

    def _resolve_image_path(
        self,
        image,
        assets,
    ) -> Path | None:
        """
        Résout un chemin d'image à partir des structures
        produites par le document builder.
        """

        candidates = []

        if isinstance(
            image,
            str,
        ):
            candidates.append(
                image
            )

        elif isinstance(
            image,
            dict,
        ):
            for key in (
                "path",
                "file",
                "file_path",
                "src",
                "url",
            ):
                value = image.get(
                    key
                )

                if value:
                    candidates.append(
                        value
                    )

            asset_id = image.get(
                "id"
            )

            if asset_id and isinstance(
                assets,
                list,
            ):
                for asset in assets:
                    if not isinstance(
                        asset,
                        dict,
                    ):
                        continue

                    if str(
                        asset.get("id")
                    ) == str(
                        asset_id
                    ):
                        for key in (
                            "path",
                            "file",
                            "file_path",
                            "src",
                            "url",
                        ):
                            value = asset.get(
                                key
                            )

                            if value:
                                candidates.append(
                                    value
                                )

        for candidate in candidates:
            resolved = self._candidate_to_path(
                candidate
            )

            if resolved:
                return resolved

        return None

    @staticmethod
    def _candidate_to_path(
        candidate,
    ) -> Path | None:
        if not candidate:
            return None

        candidate = str(
            candidate
        ).strip()

        if not candidate:
            return None

        # URL absolue : elle n'est pas directement exploitable
        # par python-docx sans téléchargement préalable.
        if candidate.startswith(
            (
                "http://",
                "https://",
            )
        ):
            return None

        path = Path(
            candidate
        )

        if path.is_absolute():
            return path

        media_root = getattr(
            settings,
            "MEDIA_ROOT",
            None,
        )

        if media_root:
            media_path = (
                Path(media_root)
                / candidate.lstrip(
                    "/\\"
                )
            )

            if media_path.exists():
                return media_path

        project_path = (
            Path.cwd()
            / candidate
        )

        if project_path.exists():
            return project_path

        return path

    # ------------------------------------------------------------------
    # LÉGENDES
    # ------------------------------------------------------------------

    @staticmethod
    def _add_caption(
        doc,
        caption: str,
    ) -> None:
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        from docx.shared import Pt

        paragraph = doc.add_paragraph()

        paragraph.alignment = (
            WD_ALIGN_PARAGRAPH.CENTER
        )

        run = paragraph.add_run(
            caption
        )

        run.italic = True
        run.font.size = Pt(9)

    # ------------------------------------------------------------------
    # CITATIONS / BIBLIOGRAPHIE
    # ------------------------------------------------------------------

    def _add_references(
        self,
        doc,
        references,
    ) -> None:
        """
        Ajoute la bibliographie lorsque le document builder
        en fournit une.
        """

        if not references:
            return

        doc.add_page_break()

        doc.add_heading(
            "Références bibliographiques",
            level=1,
        )

        if isinstance(
            references,
            str,
        ):
            references = [
                references
            ]

        if not isinstance(
            references,
            list,
        ):
            return

        for reference in references:
            text = self._reference_text(
                reference
            )

            if text:
                doc.add_paragraph(
                    text,
                    style="List Number",
                )

    @staticmethod
    def _reference_text(
        reference,
    ) -> str:
        if isinstance(
            reference,
            str,
        ):
            return reference.strip()

        if not isinstance(
            reference,
            dict,
        ):
            return str(
                reference
            ).strip()

        return (
            reference.get(
                "text"
            )
            or reference.get(
                "citation"
            )
            or reference.get(
                "title"
            )
            or ""
        ).strip()

    # ------------------------------------------------------------------
    # ANNEXES
    # ------------------------------------------------------------------

    def _add_appendix(
        self,
        doc,
        appendix,
    ) -> None:
        """
        Ajoute les annexes si elles existent.
        """

        if not appendix:
            return

        doc.add_page_break()

        doc.add_heading(
            "Annexes",
            level=1,
        )

        if isinstance(
            appendix,
            str,
        ):
            appendix = [
                appendix
            ]

        if not isinstance(
            appendix,
            list,
        ):
            return

        for item in appendix:
            text = self._extract_generic_text(
                item
            )

            if text:
                doc.add_paragraph(
                    text
                )

    # ------------------------------------------------------------------
    # BLOCS DE CITATION
    # ------------------------------------------------------------------

    def _render_quote(
        self,
        doc,
        block: dict[str, Any],
    ) -> None:
        from docx.shared import Cm

        text = self._extract_block_text(
            block
        )

        if not text:
            return

        paragraph = doc.add_paragraph()

        paragraph.paragraph_format.left_indent = Cm(
            1
        )

        paragraph.paragraph_format.right_indent = Cm(
            1
        )

        run = paragraph.add_run(
            text
        )

        run.italic = True

    # ------------------------------------------------------------------
    # CODE
    # ------------------------------------------------------------------

    def _render_code(
        self,
        doc,
        block: dict[str, Any],
    ) -> None:
        from docx.shared import Pt

        text = (
            block.get(
                "text",
                "",
            )
            or block.get(
                "content",
                "",
            )
            or ""
        )

        text = str(
            text
        )

        if not text.strip():
            return

        paragraph = doc.add_paragraph()

        run = paragraph.add_run(
            text
        )

        run.font.name = (
            "Consolas"
        )

        run.font.size = Pt(9)

    # ------------------------------------------------------------------
    # MATHÉMATIQUES
    # ------------------------------------------------------------------

    def _render_math(
        self,
        doc,
        block: dict[str, Any],
    ) -> None:
        latex = self._safe_string(
            block.get(
                "latex",
                "",
            )
        )

        if not latex:
            latex = self._extract_block_text(
                block
            )

        if not latex:
            return

        self._add_math_paragraph(
            doc,
            latex,
        )

    def _add_math_run(
        self,
        paragraph,
        latex,
    ) -> None:
        latex = self._safe_string(
            latex
        )

        if not latex:
            return

        run = paragraph.add_run(
            f"[{latex}]"
        )

        run.italic = True

    def _add_math_paragraph(
        self,
        doc,
        latex: str,
    ) -> None:
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        from docx.shared import Pt

        paragraph = doc.add_paragraph()

        paragraph.alignment = (
            WD_ALIGN_PARAGRAPH.CENTER
        )

        run = paragraph.add_run(
            f"[{latex}]"
        )

        run.italic = True
        run.font.name = (
            "Cambria Math"
        )
        run.font.size = Pt(11)

    # ------------------------------------------------------------------
    # FORMES SCIENTIFIQUES
    # ------------------------------------------------------------------

    def _render_scientific_shape(
        self,
        doc,
        block: dict[str, Any],
    ) -> None:
        """
        Représentation textuelle de secours pour une forme
        scientifique lorsque celle-ci n'est pas exportable
        directement en image.
        """

        text = self._extract_block_text(
            block
        )

        attrs = block.get(
            "attrs",
            {},
        )

        shape_type = ""

        if isinstance(
            attrs,
            dict,
        ):
            shape_type = (
                attrs.get(
                    "shape"
                )
                or attrs.get(
                    "type"
                )
                or ""
            )

        if shape_type:
            label = (
                f"Figure scientifique "
                f"({shape_type})"
            )
        else:
            label = (
                "Figure scientifique"
            )

        paragraph = doc.add_paragraph()

        run = paragraph.add_run(
            label
        )

        run.bold = True

        if text:
            paragraph.add_run(
                f" — {text}"
            )

    # ------------------------------------------------------------------
    # TEXTE
    # ------------------------------------------------------------------

    def _extract_block_text(
        self,
        block: dict[str, Any],
    ) -> str:
        """
        Extrait proprement le texte d'un bloc.
        """

        text = block.get(
            "text",
            "",
        )

        if text:
            return self._clean_text(
                text
            )

        inline_nodes = block.get(
            "inline_nodes",
            [],
        )

        if isinstance(
            inline_nodes,
            list,
        ):
            values = []

            for node in inline_nodes:
                if not isinstance(
                    node,
                    dict,
                ):
                    continue

                node_type = str(
                    node.get(
                        "type",
                        "",
                    )
                ).lower()

                if node_type == "math":
                    latex = node.get(
                        "latex",
                        "",
                    )

                    if latex:
                        values.append(
                            f"[{latex}]"
                        )

                    continue

                value = (
                    node.get("text")
                    or node.get("content")
                    or ""
                )

                if value:
                    values.append(
                        str(value)
                    )

            if values:
                return self._clean_text(
                    "".join(values)
                )

        children = block.get(
            "children",
            [],
        )

        if isinstance(
            children,
            list,
        ):
            values = []

            for child in children:
                if isinstance(
                    child,
                    dict,
                ):
                    value = (
                        child.get("text")
                        or child.get("content")
                        or ""
                    )

                    if value:
                        values.append(
                            str(value)
                        )

            if values:
                return self._clean_text(
                    " ".join(values)
                )

        return ""

    @staticmethod
    def _extract_generic_text(
        value,
    ) -> str:
        if isinstance(
            value,
            str,
        ):
            return value.strip()

        if isinstance(
            value,
            dict,
        ):
            return str(
                value.get(
                    "text",
                    "",
                )
                or value.get(
                    "content",
                    "",
                )
                or value.get(
                    "title",
                    "",
                )
                or ""
            ).strip()

        return str(
            value
            or ""
        ).strip()

    @staticmethod
    def _clean_text(
        value,
    ) -> str:
        if value is None:
            return ""

        text = str(
            value
        )

        # Retire les balises HTML résiduelles.
        text = re.sub(
            r"<br\s*/?>",
            "\n",
            text,
            flags=re.IGNORECASE,
        )

        text = re.sub(
            r"<[^>]+>",
            "",
            text,
        )

        text = html.unescape(
            text
        )

        return text.strip()

    @staticmethod
    def _safe_string(
        value,
    ) -> str:
        if value is None:
            return ""

        return str(
            value
        ).strip()

    # ------------------------------------------------------------------
    # EXPORT DIRECTORY
    # ------------------------------------------------------------------

    @staticmethod
    def _get_export_directory() -> Path:
        """
        Retourne le répertoire central des exports MACEVO.
        """

        media_root = getattr(
            settings,
            "MEDIA_ROOT",
            None,
        )

        if media_root:
            base_directory = Path(
                media_root
            )
        else:
            base_directory = Path(
                tempfile.gettempdir()
            )

        export_dir = (
            base_directory
            / "editor_exports"
        )

        export_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        return export_dir