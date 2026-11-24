
"""
==========================================================
MACEVO IA
PDF Exporter
==========================================================

Générateur professionnel de documents scientifiques PDF.

Source principale :
    DocumentStructure

Fonctionnalités :
    - page de couverture
    - résumé
    - mots-clés
    - table des matières automatique
    - chapitres
    - sections
    - sous-sections
    - numérotation
    - en-têtes / pieds de page
    - pagination
    - tableaux
    - figures / images
    - bibliographie
    - mise en page académique
    - export direct d'un DocumentStructure
    - compatibilité avec un ScientificProject

Architecture :
    ScientificProject
        ↓
    DocumentBuilder
        ↓
    DocumentStructure
        ↓
    PDFExporter
"""

from __future__ import annotations

import logging
import re
from html import escape
from pathlib import Path
from typing import Any, Iterable, Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


logger = logging.getLogger(__name__)


# ==========================================================
# DOCUMENT PDF PERSONNALISÉ
# ==========================================================


class ScientificPDFDocument(BaseDocTemplate):
    """
    Document PDF personnalisé MACEVO.

    Gère :
        - format A4 ;
        - marges ;
        - en-tête ;
        - pied de page ;
        - pagination ;
        - table des matières.
    """

    def __init__(
        self,
        filename: str,
        title: str = "",
        **kwargs: Any,
    ) -> None:
        super().__init__(
            filename,
            pagesize=A4,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=2.5 * cm,
            bottomMargin=2.3 * cm,
            **kwargs,
        )

        self.document_title = str(title or "").strip()

        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="normal",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )

        self.addPageTemplates(
            [
                PageTemplate(
                    id="scientific",
                    frames=frame,
                    onPage=self._draw_header_footer,
                )
            ]
        )

    # ======================================================
    # EN-TÊTE / PIED DE PAGE
    # ======================================================

    def _draw_header_footer(
        self,
        canvas,
        doc,
    ) -> None:
        canvas.saveState()

        # --------------------------------------------------
        # En-tête
        # --------------------------------------------------

        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#666666"))

        canvas.drawString(
            self.leftMargin,
            A4[1] - 1.25 * cm,
            "MACEVO IA",
        )

        header_title = self.document_title[:100]

        if header_title:
            canvas.drawRightString(
                A4[0] - self.rightMargin,
                A4[1] - 1.25 * cm,
                header_title,
            )

        canvas.setStrokeColor(
            colors.HexColor("#CCCCCC")
        )

        canvas.line(
            self.leftMargin,
            A4[1] - 1.42 * cm,
            A4[0] - self.rightMargin,
            A4[1] - 1.42 * cm,
        )

        # --------------------------------------------------
        # Pied de page
        # --------------------------------------------------

        canvas.line(
            self.leftMargin,
            1.8 * cm,
            A4[0] - self.rightMargin,
            1.8 * cm,
        )

        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#666666"))

        canvas.drawString(
            self.leftMargin,
            1.25 * cm,
            "Document scientifique généré par MACEVO IA",
        )

        canvas.drawRightString(
            A4[0] - self.rightMargin,
            1.25 * cm,
            f"Page {doc.page}",
        )

        canvas.restoreState()

    # ======================================================
    # TABLE DES MATIÈRES
    # ======================================================

    def afterFlowable(self, flowable) -> None:
        """
        Enregistre automatiquement les titres dans la TOC.
        """

        if not isinstance(flowable, Paragraph):
            return

        style_name = getattr(
            flowable.style,
            "name",
            "",
        )

        levels = {
            "Chapter": 0,
            "Section": 1,
            "Subsection": 2,
        }

        if style_name not in levels:
            return

        level = levels[style_name]

        text = flowable.getPlainText().strip()

        if not text:
            return

        key = (
            f"toc-{level}-"
            f"{self.page}-"
            f"{id(flowable)}"
        )

        try:
            self.canv.bookmarkPage(key)

            self.notify(
                "TOCEntry",
                (
                    level,
                    text,
                    self.page,
                    key,
                ),
            )
        except Exception:
            logger.exception(
                "Impossible d'enregistrer l'entrée TOC : %s",
                text,
            )


# ==========================================================
# PDF EXPORTER
# ==========================================================


class PDFExporter:
    """
    Exporteur PDF professionnel MACEVO IA.

    API principale :

        PDFExporter(document).export()

    ou :

        PDFExporter().export(document, output_path)

    ou, pour compatibilité avec l'ancien code :

        PDFExporter().export(project, output_path)

    où ``project`` est transformé par DocumentBuilder.
    """

    SUPPORTED_EXTENSION = ".pdf"

    def __init__(
        self,
        document=None,
        *,
        title: str = "",
    ) -> None:
        self.document = document
        self.title = title

        self.styles = getSampleStyleSheet()
        self._create_styles()

    # ======================================================
    # STYLES
    # ======================================================

    def _create_styles(self) -> None:

        # --------------------------------------------------
        # Couverture
        # --------------------------------------------------

        self.styles.add(
            ParagraphStyle(
                name="CoverTitle",
                parent=self.styles["Title"],
                fontName="Helvetica-Bold",
                fontSize=22,
                leading=28,
                alignment=TA_CENTER,
                spaceAfter=20,
            )
        )

        self.styles.add(
            ParagraphStyle(
                name="CoverInfo",
                parent=self.styles["Normal"],
                fontName="Helvetica",
                fontSize=11,
                leading=18,
                alignment=TA_CENTER,
                spaceAfter=4,
            )
        )

        # --------------------------------------------------
        # Résumé
        # --------------------------------------------------

        self.styles.add(
            ParagraphStyle(
                name="AbstractTitle",
                parent=self.styles["Heading1"],
                fontName="Helvetica-Bold",
                fontSize=16,
                leading=20,
                alignment=TA_CENTER,
                spaceAfter=15,
            )
        )

        # --------------------------------------------------
        # Corps scientifique
        # --------------------------------------------------

        self.styles.add(
            ParagraphStyle(
                name="BodyScientific",
                parent=self.styles["BodyText"],
                fontName="Helvetica",
                fontSize=10.5,
                leading=17,
                alignment=TA_JUSTIFY,
                spaceAfter=9,
                firstLineIndent=0.5 * cm,
            )
        )

        # --------------------------------------------------
        # Chapitre
        # --------------------------------------------------

        self.styles.add(
            ParagraphStyle(
                name="Chapter",
                parent=self.styles["Heading1"],
                fontName="Helvetica-Bold",
                fontSize=16,
                leading=21,
                alignment=TA_LEFT,
                spaceBefore=18,
                spaceAfter=14,
                keepWithNext=True,
            )
        )

        # --------------------------------------------------
        # Section
        # --------------------------------------------------

        self.styles.add(
            ParagraphStyle(
                name="Section",
                parent=self.styles["Heading2"],
                fontName="Helvetica-Bold",
                fontSize=13,
                leading=17,
                alignment=TA_LEFT,
                spaceBefore=12,
                spaceAfter=8,
                keepWithNext=True,
            )
        )

        # --------------------------------------------------
        # Sous-section
        # --------------------------------------------------

        self.styles.add(
            ParagraphStyle(
                name="Subsection",
                parent=self.styles["Heading3"],
                fontName="Helvetica-Bold",
                fontSize=11,
                leading=15,
                alignment=TA_LEFT,
                spaceBefore=8,
                spaceAfter=5,
                keepWithNext=True,
            )
        )

        # --------------------------------------------------
        # Table des matières
        # --------------------------------------------------

        self.styles.add(
            ParagraphStyle(
                name="TOCTitle",
                parent=self.styles["Heading1"],
                fontName="Helvetica-Bold",
                fontSize=18,
                leading=22,
                alignment=TA_CENTER,
                spaceAfter=20,
            )
        )

        # --------------------------------------------------
        # Références
        # --------------------------------------------------

        self.styles.add(
            ParagraphStyle(
                name="Reference",
                parent=self.styles["BodyText"],
                fontName="Helvetica",
                fontSize=9.5,
                leading=14,
                leftIndent=0.5 * cm,
                firstLineIndent=-0.5 * cm,
                spaceAfter=7,
            )
        )

        # --------------------------------------------------
        # Légendes
        # --------------------------------------------------

        self.styles.add(
            ParagraphStyle(
                name="Caption",
                parent=self.styles["BodyText"],
                fontName="Helvetica",
                fontSize=8.5,
                leading=11,
                alignment=TA_CENTER,
                textColor=colors.HexColor("#555555"),
                spaceAfter=10,
            )
        )

        self.styles.add(
            ParagraphStyle(
                name="TableCaption",
                parent=self.styles["Caption"],
                spaceBefore=5,
                spaceAfter=6,
            )
        )

    # ======================================================
    # UTILITAIRES
    # ======================================================

    @staticmethod
    def _escape(text: Any) -> str:
        """
        Échappe le texte pour ReportLab Paragraph.
        """
        if text is None:
            return ""

        return escape(
            str(text),
            quote=False,
        )

    @staticmethod
    def _clean_text(text: Any) -> str:
        """
        Nettoyage léger d'un contenu textuel.
        """
        if text is None:
            return ""

        value = str(text)

        value = value.replace("\r\n", "\n")
        value = value.replace("\r", "\n")

        return value.strip()

    @classmethod
    def _split_paragraphs(
        cls,
        content: Any,
    ) -> list[str]:
        """
        Découpe proprement un contenu en paragraphes.

        Les séparateurs acceptés sont :
            - double retour à la ligne ;
            - plusieurs lignes vides.
        """

        text = cls._clean_text(content)

        if not text:
            return []

        parts = re.split(
            r"\n\s*\n+",
            text,
        )

        return [
            part.strip()
            for part in parts
            if part.strip()
        ]

    @staticmethod
    def _as_list(value: Any) -> list[str]:
        """
        Transforme une valeur en liste de chaînes.
        """

        if value is None:
            return []

        if isinstance(value, (list, tuple, set)):
            return [
                str(item).strip()
                for item in value
                if str(item).strip()
            ]

        text = str(value).strip()

        if not text:
            return []

        return [
            item.strip()
            for item in text.split(",")
            if item.strip()
        ]

    @staticmethod
    def _get(
        obj: Any,
        key: str,
        default: Any = None,
    ) -> Any:
        """
        Accès compatible objet / dictionnaire.
        """

        if obj is None:
            return default

        if isinstance(obj, dict):
            return obj.get(key, default)

        return getattr(
            obj,
            key,
            default,
        )

    # ======================================================
    # COUVERTURE
    # ======================================================

    def _build_cover(
        self,
        document,
    ) -> list:
        metadata = self._get(
            document,
            "metadata",
            {},
        ) or {}

        cover = self._get(
            document,
            "cover",
            {},
        ) or {}

        story = [
            Spacer(
                1,
                3 * cm,
            ),
            Paragraph(
                "MACEVO IA",
                self.styles["CoverInfo"],
            ),
            Spacer(
                1,
                1.5 * cm,
            ),
            HRFlowable(
                width="70%",
                thickness=1,
                color=colors.HexColor("#333333"),
                hAlign="CENTER",
            ),
            Spacer(
                1,
                1.5 * cm,
            ),
        ]

        title = (
            self._get(cover, "title")
            or self._get(metadata, "title")
            or "Document scientifique"
        )

        story.append(
            Paragraph(
                self._escape(title),
                self.styles["CoverTitle"],
            )
        )

        story.append(
            Spacer(
                1,
                1 * cm,
            )
        )

        subject = self._get(
            cover,
            "subject",
        )

        if subject:
            story.append(
                Paragraph(
                    self._escape(subject),
                    self.styles["CoverInfo"],
                )
            )

        story.append(
            Spacer(
                1,
                1.5 * cm,
            )
        )

        author = self._get(
            cover,
            "author",
        )

        if author:
            story.append(
                Paragraph(
                    f"<b>Auteur :</b> "
                    f"{self._escape(author)}",
                    self.styles["CoverInfo"],
                )
            )

        level = self._get(
            cover,
            "level",
        )

        if level:
            story.append(
                Paragraph(
                    f"<b>Niveau :</b> "
                    f"{self._escape(level)}",
                    self.styles["CoverInfo"],
                )
            )

        project_type = self._get(
            cover,
            "project_type",
        )

        if project_type:
            story.append(
                Paragraph(
                    self._escape(project_type),
                    self.styles["CoverInfo"],
                )
            )

        institution = self._get(
            cover,
            "institution",
        )

        if institution:
            story.append(
                Spacer(
                    1,
                    0.8 * cm,
                )
            )

            story.append(
                Paragraph(
                    self._escape(institution),
                    self.styles["CoverInfo"],
                )
            )

        department = self._get(
            cover,
            "department",
        )

        if department:
            story.append(
                Paragraph(
                    self._escape(department),
                    self.styles["CoverInfo"],
                )
            )

        academic_year = (
            self._get(cover, "academic_year")
            or self._get(cover, "academicYear")
        )

        if academic_year:
            story.append(
                Spacer(
                    1,
                    3 * cm,
                )
            )

            story.append(
                Paragraph(
                    self._escape(academic_year),
                    self.styles["CoverInfo"],
                )
            )

        story.append(
            PageBreak()
        )

        return story

    # ======================================================
    # RÉSUMÉ
    # ======================================================

    def _build_abstract(
        self,
        document,
    ) -> list:
        content = self._get(
            document,
            "abstract",
            "",
        )

        keywords = self._get(
            document,
            "keywords",
            [],
        )

        if not content and not keywords:
            return []

        story = [
            Paragraph(
                "Résumé",
                self.styles["AbstractTitle"],
            ),
            HRFlowable(
                width="100%",
                thickness=0.5,
                color=colors.HexColor("#BBBBBB"),
            ),
            Spacer(
                1,
                0.5 * cm,
            ),
        ]

        for paragraph in self._split_paragraphs(content):
            story.append(
                Paragraph(
                    self._escape(paragraph),
                    self.styles["BodyScientific"],
                )
            )

        keyword_list = self._as_list(
            keywords
        )

        if keyword_list:
            story.extend(
                [
                    Spacer(
                        1,
                        0.3 * cm,
                    ),
                    Paragraph(
                        "<b>Mots-clés :</b> "
                        + self._escape(
                            ", ".join(keyword_list)
                        ),
                        self.styles["BodyScientific"],
                    ),
                ]
            )

        story.append(PageBreak())

        return story

    # ======================================================
    # TABLE DES MATIÈRES
    # ======================================================

    def _build_toc(self) -> list:
        toc = TableOfContents()

        toc.levelStyles = [
            ParagraphStyle(
                name="TOCChapter",
                fontName="Helvetica-Bold",
                fontSize=10,
                leading=14,
                leftIndent=0,
                firstLineIndent=0,
                spaceBefore=5,
            ),
            ParagraphStyle(
                name="TOCSection",
                fontName="Helvetica",
                fontSize=9,
                leading=13,
                leftIndent=15,
                firstLineIndent=0,
            ),
            ParagraphStyle(
                name="TOCSubsection",
                fontName="Helvetica",
                fontSize=8.5,
                leading=12,
                leftIndent=30,
                firstLineIndent=0,
            ),
        ]

        return [
            Paragraph(
                "Table des matières",
                self.styles["TOCTitle"],
            ),
            toc,
            PageBreak(),
        ]

    # ======================================================
    # PARAGRAPHES
    # ======================================================

    def _add_body_content(
        self,
        story: list,
        content: Any,
    ) -> None:
        """
        Ajoute du contenu textuel au document.
        """

        for paragraph in self._split_paragraphs(
            content
        ):
            story.append(
                Paragraph(
                    self._escape(paragraph).replace(
                        "\n",
                        "<br/>",
                    ),
                    self.styles["BodyScientific"],
                )
            )

    # ======================================================
    # CHAPITRES / SECTIONS
    # ======================================================

    def _build_content(
        self,
        document,
    ) -> list:
        story = []

        normalize = self._get(
            document,
            "normalize_numbers",
        )

        if callable(normalize):
            normalize()

        chapters = self._get(
            document,
            "chapters",
            [],
        ) or []

        for chapter_index, chapter in enumerate(
            chapters,
            start=1,
        ):
            chapter_number = (
                self._get(chapter, "number")
                or chapter_index
            )

            chapter_title = (
                self._get(chapter, "title")
                or f"Chapitre {chapter_number}"
            )

            story.append(
                Paragraph(
                    self._escape(
                        f"CHAPITRE {chapter_number} : "
                        f"{chapter_title}"
                    ),
                    self.styles["Chapter"],
                )
            )

            self._add_body_content(
                story,
                self._get(
                    chapter,
                    "content",
                    "",
                ),
            )

            sections = self._get(
                chapter,
                "sections",
                [],
            ) or []

            for section_index, section in enumerate(
                sections,
                start=1,
            ):
                section_number = (
                    self._get(
                        section,
                        "number",
                    )
                    or f"{chapter_number}.{section_index}"
                )

                section_title = (
                    self._get(
                        section,
                        "title",
                    )
                    or f"Section {section_number}"
                )

                story.append(
                    Paragraph(
                        self._escape(
                            f"{section_number} "
                            f"{section_title}"
                        ),
                        self.styles["Section"],
                    )
                )

                self._add_body_content(
                    story,
                    self._get(
                        section,
                        "content",
                        "",
                    ),
                )

                subsections = self._get(
                    section,
                    "subsections",
                    [],
                ) or []

                for subsection_index, subsection in enumerate(
                    subsections,
                    start=1,
                ):
                    subsection_number = (
                        self._get(
                            subsection,
                            "number",
                        )
                        or (
                            f"{section_number}."
                            f"{subsection_index}"
                        )
                    )

                    subsection_title = (
                        self._get(
                            subsection,
                            "title",
                        )
                        or (
                            f"Sous-section "
                            f"{subsection_number}"
                        )
                    )

                    story.append(
                        Paragraph(
                            self._escape(
                                f"{subsection_number} "
                                f"{subsection_title}"
                            ),
                            self.styles["Subsection"],
                        )
                    )

                    self._add_body_content(
                        story,
                        self._get(
                            subsection,
                            "content",
                            "",
                        ),
                    )

        story.extend(
            self._build_tables(document)
        )

        story.extend(
            self._build_figures(document)
        )

        return story

    # ======================================================
    # TABLEAUX
    # ======================================================

    def _build_tables(
        self,
        document,
    ) -> list:
        story = []

        tables = self._get(
            document,
            "tables",
            [],
        ) or []

        for index, table_data in enumerate(
            tables,
            start=1,
        ):
            number = (
                self._get(
                    table_data,
                    "number",
                )
                or index
            )

            title = (
                self._get(
                    table_data,
                    "title",
                )
                or "Tableau"
            )

            rows = []

            headers = self._get(
                table_data,
                "headers",
                [],
            ) or []

            raw_rows = self._get(
                table_data,
                "rows",
                [],
            ) or []

            if headers:
                rows.append(
                    [
                        Paragraph(
                            self._escape(cell),
                            self.styles["BodyScientific"],
                        )
                        for cell in headers
                    ]
                )

            for row in raw_rows:
                if row is None:
                    continue

                if not isinstance(
                    row,
                    (list, tuple),
                ):
                    row = [row]

                rows.append(
                    [
                        Paragraph(
                            self._escape(cell),
                            self.styles["BodyScientific"],
                        )
                        for cell in row
                    ]
                )

            if not rows:
                continue

            # --------------------------------------------------
            # Normalisation du nombre de colonnes
            # --------------------------------------------------

            column_count = max(
                len(row)
                for row in rows
            )

            for row in rows:
                while len(row) < column_count:
                    row.append("")

            story.append(
                Paragraph(
                    self._escape(
                        f"Tableau {number} — {title}"
                    ),
                    self.styles["TableCaption"],
                )
            )

            table = Table(
                rows,
                repeatRows=1 if headers else 0,
                hAlign="CENTER",
                splitByRow=1,
            )

            commands = [
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#AAAAAA"),
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
            ]

            if headers:
                commands.append(
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor("#EAEAEA"),
                    )
                )

            table.setStyle(
                TableStyle(commands)
            )

            story.append(table)

            caption = self._get(
                table_data,
                "caption",
            )

            if caption and caption != title:
                story.append(
                    Paragraph(
                        self._escape(caption),
                        self.styles["Caption"],
                    )
                )

            story.append(
                Spacer(
                    1,
                    0.5 * cm,
                )
            )

        return story

    # ======================================================
    # FIGURES
    # ======================================================

    def _build_figures(
        self,
        document,
    ) -> list:
        story = []

        figures = self._get(
            document,
            "figures",
            [],
        ) or []

        max_width = 15.5 * cm
        max_height = 10 * cm

        for index, figure_data in enumerate(
            figures,
            start=1,
        ):
            image_path = self._get(
                figure_data,
                "path",
            )

            if not image_path:
                logger.warning(
                    "Figure %s ignorée : chemin absent.",
                    index,
                )
                continue

            path = Path(str(image_path))

            if not path.exists():
                logger.warning(
                    "Figure %s introuvable : %s",
                    index,
                    path,
                )
                continue

            try:
                image = Image(
                    str(path),
                )

                # --------------------------------------------------
                # Conservation des proportions
                # --------------------------------------------------

                image._restrictSize(
                    max_width,
                    max_height,
                )

                number = (
                    self._get(
                        figure_data,
                        "number",
                    )
                    or index
                )

                caption = (
                    self._get(
                        figure_data,
                        "caption",
                    )
                    or self._get(
                        figure_data,
                        "title",
                    )
                    or "Figure"
                )

                story.append(
                    KeepTogether(
                        [
                            image,
                            Paragraph(
                                self._escape(
                                    f"Figure {number} — "
                                    f"{caption}"
                                ),
                                self.styles["Caption"],
                            ),
                        ]
                    )
                )

                story.append(
                    Spacer(
                        1,
                        0.3 * cm,
                    )
                )

            except Exception:
                logger.exception(
                    "Erreur lors de l'ajout de la figure : %s",
                    path,
                )

        return story

    # ======================================================
    # BIBLIOGRAPHIE
    # ======================================================

    def _build_bibliography(
        self,
        document,
    ) -> list:
        references = self._get(
            document,
            "references",
            [],
        ) or []

        if not references:
            return []

        story = [
            PageBreak(),
            Paragraph(
                "Bibliographie",
                self.styles["Chapter"],
            ),
        ]

        for index, reference in enumerate(
            references,
            start=1,
        ):
            parts = []

            author = self._get(
                reference,
                "author",
            )

            title = self._get(
                reference,
                "title",
            )

            year = self._get(
                reference,
                "year",
            )

            publisher = self._get(
                reference,
                "publisher",
            )

            doi = self._get(
                reference,
                "doi",
            )

            url = self._get(
                reference,
                "url",
            )

            if author:
                parts.append(
                    str(author).strip()
                )

            if title:
                parts.append(
                    str(title).strip()
                )

            if year:
                parts.append(
                    f"({year})"
                )

            if publisher:
                parts.append(
                    str(publisher).strip()
                )

            if doi:
                parts.append(
                    f"DOI : {doi}"
                )

            if url:
                parts.append(
                    str(url)
                )

            text = ". ".join(
                part
                for part in parts
                if part
            )

            if not text:
                text = (
                    "Référence bibliographique "
                    "sans informations."
                )

            story.append(
                Paragraph(
                    f"[{index}] "
                    f"{self._escape(text)}",
                    self.styles["Reference"],
                )
            )

        return story

    # ======================================================
    # CONSTRUCTION DU DOCUMENT
    # ======================================================

    def _resolve_document(
        self,
        source=None,
    ):
        """
        Résout la source d'export.

        Priorité :
            1. source explicitement fourni ;
            2. document du constructeur ;
            3. ScientificProject transformé par DocumentBuilder.
        """

        source = (
            source
            if source is not None
            else self.document
        )

        if source is None:
            raise ValueError(
                "Un DocumentStructure ou un "
                "ScientificProject est obligatoire."
            )

        # --------------------------------------------------
        # DocumentStructure déjà construit
        # --------------------------------------------------

        if hasattr(
            source,
            "chapters",
        ) and hasattr(
            source,
            "metadata",
        ):
            return source

        # --------------------------------------------------
        # Sinon : ScientificProject
        # --------------------------------------------------

        from .document_builder import DocumentBuilder

        document = DocumentBuilder(
            source
        ).build()

        if not hasattr(
            document,
            "metadata",
        ):
            raise TypeError(
                "DocumentBuilder.build() doit retourner "
                "un DocumentStructure."
            )

        return document

    # ======================================================
    # EXPORT
    # ======================================================

    def export(
        self,
        source=None,
        output_path=None,
    ) -> str:
        """
        Exporte un DocumentStructure ou un ScientificProject
        vers un fichier PDF.

        Exemples :

            PDFExporter(document).export(
                "/tmp/document.pdf"
            )

        ou :

            PDFExporter().export(
                document,
                "/tmp/document.pdf"
            )

        ou :

            PDFExporter().export(
                project,
                "/tmp/document.pdf"
            )
        """

        # --------------------------------------------------
        # Compatibilité :
        #
        # PDFExporter(document).export("/path/file.pdf")
        # --------------------------------------------------

        if (
            output_path is None
            and isinstance(
                source,
                (str, Path),
            )
        ):
            output_path = source
            source = None

        if output_path is None:
            raise ValueError(
                "Le chemin du fichier PDF est obligatoire."
            )

        document = self._resolve_document(
            source
        )

        output = Path(
            output_path
        )

        if output.suffix.lower() != ".pdf":
            output = output.with_suffix(".pdf")

        output.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        metadata = self._get(
            document,
            "metadata",
            {},
        ) or {}

        title = (
            self.title
            or self._get(
                metadata,
                "title",
            )
            or "Document scientifique"
        )

        pdf = ScientificPDFDocument(
            str(output),
            title=str(title),
        )

        story = []

        # --------------------------------------------------
        # 1. Couverture
        # --------------------------------------------------

        story.extend(
            self._build_cover(
                document
            )
        )

        # --------------------------------------------------
        # 2. Résumé
        # --------------------------------------------------

        story.extend(
            self._build_abstract(
                document
            )
        )

        # --------------------------------------------------
        # 3. Table des matières
        # --------------------------------------------------

        chapters = self._get(
            document,
            "chapters",
            [],
        ) or []

        if chapters:
            story.extend(
                self._build_toc()
            )

        # --------------------------------------------------
        # 4. Contenu
        # --------------------------------------------------

        story.extend(
            self._build_content(
                document
            )
        )

        # --------------------------------------------------
        # 5. Bibliographie
        # --------------------------------------------------

        story.extend(
            self._build_bibliography(
                document
            )
        )

        if not story:
            raise ValueError(
                "Le DocumentStructure ne contient "
                "aucun contenu exportable."
            )

        # --------------------------------------------------
        # Génération finale
        #
        # multiBuild est nécessaire pour que la TOC
        # soit calculée correctement.
        # --------------------------------------------------

        pdf.multiBuild(
            story
        )

        logger.info(
            "Export PDF terminé : %s",
            output,
        )

        return str(output)

    # ======================================================
    # COMPATIBILITÉ
    # ======================================================

    def render(
        self,
        source=None,
    ) -> list:
        """
        Construit le Story ReportLab sans écrire le PDF.

        Utile pour les tests ou extensions futures.
        """

        document = self._resolve_document(
            source
        )

        story = []

        story.extend(
            self._build_cover(document)
        )

        story.extend(
            self._build_abstract(document)
        )

        chapters = self._get(
            document,
            "chapters",
            [],
        ) or []

        if chapters:
            story.extend(
                self._build_toc()
            )

        story.extend(
            self._build_content(document)
        )

        story.extend(
            self._build_bibliography(document)
        )

        return story


# ==========================================================
# ALIAS DE COMPATIBILITÉ
# ==========================================================

PdfExporter = PDFExporter
