"""
==========================================================
MACEVO IA
Word Exporter
==========================================================

Générateur professionnel de documents scientifiques Word.

Source unique :
    DocumentStructure

Fonctionnalités :
- Page de couverture
- Résumé
- Mots-clés
- Table des matières automatique
- Chapitres
- Sections
- Sous-sections
- Numérotation
- Paragraphes scientifiques
- Tableaux
- Figures / images
- Bibliographie
- Annexes
- En-têtes / pieds de page
- Pagination
- Mise en page académique
- Propriétés du document

Compatible avec :
    projects.services.export.document_structure
    projects.services.export.document_builder
"""

from pathlib import Path
import html
import logging
import re

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import (
    WD_CELL_VERTICAL_ALIGNMENT,
    WD_TABLE_ALIGNMENT,
)
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt


logger = logging.getLogger(__name__)


class WordExporter:
    """
    Export professionnel d'une DocumentStructure
    au format Microsoft Word (.docx).
    """

    FORMAT = "docx"
    EXTENSION = ".docx"

    def __init__(self, structure):
        if structure is None:
            raise ValueError(
                "DocumentStructure est obligatoire."
            )

        self.structure = structure

    # ==========================================================
    # UTILITAIRES
    # ==========================================================

    @staticmethod
    def _value(obj, name, default=None):
        """
        Récupère une propriété sur un objet ou dans un dictionnaire.
        """
        if obj is None:
            return default

        if isinstance(obj, dict):
            return obj.get(name, default)

        return getattr(obj, name, default)

    @staticmethod
    def _clean_text(value):
        """
        Nettoie une valeur destinée à Word.
        """
        if value is None:
            return ""

        text = str(value)

        # Décodage des entités HTML.
        text = html.unescape(text)

        # Suppression de quelques balises HTML simples.
        text = re.sub(
            r"<br\s*/?>",
            "\n",
            text,
            flags=re.IGNORECASE,
        )

        text = re.sub(
            r"</p\s*>",
            "\n\n",
            text,
            flags=re.IGNORECASE,
        )

        text = re.sub(
            r"<[^>]+>",
            "",
            text,
        )

        return text.strip()

    @classmethod
    def _split_paragraphs(cls, content):
        """
        Sépare un contenu en paragraphes.

        Les doubles retours à la ligne créent
        un nouveau paragraphe.
        """
        if content is None:
            return []

        text = cls._clean_text(content)

        if not text:
            return []

        parts = re.split(
            r"\n\s*\n+",
            text,
        )

        result = []

        for part in parts:
            cleaned = part.strip()

            if cleaned:
                result.append(cleaned)

        return result

    @classmethod
    def _as_list(cls, value):
        """
        Transforme une valeur en liste de chaînes.
        """
        if value is None:
            return []

        if isinstance(value, (list, tuple, set)):
            return [
                cls._clean_text(item)
                for item in value
                if cls._clean_text(item)
            ]

        text = cls._clean_text(value)

        if not text:
            return []

        return [
            item.strip()
            for item in re.split(
                r"[,;\n]",
                text,
            )
            if item.strip()
        ]

    # ==========================================================
    # STYLE WORD
    # ==========================================================

    @staticmethod
    def _set_run_font(run, size=12, bold=None, italic=None):
        """
        Applique la police académique à un run.
        """
        run.font.name = "Times New Roman"
        run.font.size = Pt(size)

        if bold is not None:
            run.bold = bold

        if italic is not None:
            run.italic = italic

        rpr = run._r.get_or_add_rPr()

        rfonts = rpr.rFonts

        if rfonts is None:
            rfonts = OxmlElement("w:rFonts")
            rpr.append(rfonts)

        rfonts.set(
            qn("w:ascii"),
            "Times New Roman",
        )

        rfonts.set(
            qn("w:hAnsi"),
            "Times New Roman",
        )

        rfonts.set(
            qn("w:eastAsia"),
            "Times New Roman",
        )

    def _configure_styles(self, document):
        """
        Configure les styles Word utilisés par MACEVO.
        """

        normal = document.styles["Normal"]

        normal.font.name = "Times New Roman"
        normal.font.size = Pt(12)

        normal.paragraph_format.line_spacing = 1.5
        normal.paragraph_format.space_after = Pt(6)

        # ------------------------------------------------------
        # Heading 1
        # ------------------------------------------------------

        heading1 = document.styles["Heading 1"]

        heading1.font.name = "Times New Roman"
        heading1.font.size = Pt(16)
        heading1.font.bold = True

        heading1.paragraph_format.space_before = Pt(18)
        heading1.paragraph_format.space_after = Pt(10)
        heading1.paragraph_format.keep_with_next = True

        # ------------------------------------------------------
        # Heading 2
        # ------------------------------------------------------

        heading2 = document.styles["Heading 2"]

        heading2.font.name = "Times New Roman"
        heading2.font.size = Pt(14)
        heading2.font.bold = True

        heading2.paragraph_format.space_before = Pt(14)
        heading2.paragraph_format.space_after = Pt(8)
        heading2.paragraph_format.keep_with_next = True

        # ------------------------------------------------------
        # Heading 3
        # ------------------------------------------------------

        heading3 = document.styles["Heading 3"]

        heading3.font.name = "Times New Roman"
        heading3.font.size = Pt(12)
        heading3.font.bold = True

        heading3.paragraph_format.space_before = Pt(10)
        heading3.paragraph_format.space_after = Pt(6)
        heading3.paragraph_format.keep_with_next = True

    def _configure_document(self, document):
        """
        Configure la page Word.
        """

        for section in document.sections:
            section.top_margin = Cm(2.5)
            section.bottom_margin = Cm(2.5)
            section.left_margin = Cm(2.5)
            section.right_margin = Cm(2.5)

            section.header_distance = Cm(1.2)
            section.footer_distance = Cm(1.2)

        self._configure_styles(document)

    # ==========================================================
    # EN-TÊTE / PIED DE PAGE
    # ==========================================================

    @staticmethod
    def _add_page_number(paragraph):
        """
        Ajoute le champ PAGE de Microsoft Word.
        """

        run = paragraph.add_run()

        fld_begin = OxmlElement("w:fldChar")
        fld_begin.set(
            qn("w:fldCharType"),
            "begin",
        )

        instr = OxmlElement("w:instrText")
        instr.set(
            qn("xml:space"),
            "preserve",
        )
        instr.text = "PAGE"

        fld_end = OxmlElement("w:fldChar")
        fld_end.set(
            qn("w:fldCharType"),
            "end",
        )

        run._r.append(fld_begin)
        run._r.append(instr)
        run._r.append(fld_end)

        WordExporter._set_run_font(
            run,
            size=8,
        )

    def _configure_header_footer(
        self,
        document,
        title,
    ):
        """
        Configure les en-têtes et pieds de page.
        """

        for section in document.sections:
            # --------------------------------------------------
            # En-tête
            # --------------------------------------------------

            header = section.header

            paragraph = header.paragraphs[0]
            paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT

            run = paragraph.add_run(
                "MACEVO IA"
            )

            self._set_run_font(
                run,
                size=8,
                bold=True,
            )

            if title:
                run = paragraph.add_run(
                    f"  —  {title}"
                )

                self._set_run_font(
                    run,
                    size=8,
                )

            # Ligne inférieure.
            ppr = paragraph._p.get_or_add_pPr()

            pbdr = OxmlElement("w:pBdr")

            bottom = OxmlElement("w:bottom")

            bottom.set(
                qn("w:val"),
                "single",
            )

            bottom.set(
                qn("w:sz"),
                "4",
            )

            bottom.set(
                qn("w:space"),
                "1",
            )

            bottom.set(
                qn("w:color"),
                "BFBFBF",
            )

            pbdr.append(bottom)
            ppr.append(pbdr)

            # --------------------------------------------------
            # Pied de page
            # --------------------------------------------------

            footer = section.footer

            footer_paragraph = footer.paragraphs[0]

            footer_paragraph.alignment = (
                WD_ALIGN_PARAGRAPH.CENTER
            )

            run = footer_paragraph.add_run(
                "MACEVO IA — Page "
            )

            self._set_run_font(
                run,
                size=8,
            )

            self._add_page_number(
                footer_paragraph
            )

    # ==========================================================
    # SAUT DE PAGE
    # ==========================================================

    @staticmethod
    def _page_break(document):
        document.add_page_break()

    # ==========================================================
    # PARAGRAPHE SCIENTIFIQUE
    # ==========================================================

    def _add_body_paragraph(
        self,
        document,
        text,
    ):
        """
        Ajoute un paragraphe scientifique justifié.
        """

        text = self._clean_text(text)

        if not text:
            return

        paragraph = document.add_paragraph()

        paragraph.alignment = (
            WD_ALIGN_PARAGRAPH.JUSTIFY
        )

        paragraph.paragraph_format.line_spacing = 1.5
        paragraph.paragraph_format.space_after = Pt(6)
        paragraph.paragraph_format.first_line_indent = Cm(0.5)

        run = paragraph.add_run(text)

        self._set_run_font(
            run,
            size=12,
        )

    # ==========================================================
    # TITRE
    # ==========================================================

    def _add_heading(
        self,
        document,
        title,
        level=1,
        page_break_before=False,
    ):
        """
        Ajoute un titre Word avec son niveau structurel.
        """

        title = self._clean_text(title)

        if not title:
            return None

        style = f"Heading {min(max(level, 1), 3)}"

        paragraph = document.add_paragraph(
            style=style
        )

        paragraph.paragraph_format.keep_with_next = True

        if page_break_before:
            paragraph.paragraph_format.page_break_before = True

        run = paragraph.add_run(title)

        if level == 1:
            self._set_run_font(
                run,
                size=16,
                bold=True,
            )
        elif level == 2:
            self._set_run_font(
                run,
                size=14,
                bold=True,
            )
        else:
            self._set_run_font(
                run,
                size=12,
                bold=True,
            )

        return paragraph

    # ==========================================================
    # COUVERTURE
    # ==========================================================

    def _build_cover(
        self,
        document,
    ):
        """
        Génère la couverture.
        """

        structure = self.structure

        metadata = self._value(
            structure,
            "metadata",
            {},
        ) or {}

        cover = self._value(
            structure,
            "cover",
            {},
        ) or {}

        if not isinstance(metadata, dict):
            metadata = {}

        if not isinstance(cover, dict):
            cover = {}

        for _ in range(4):
            document.add_paragraph()

        # ------------------------------------------------------
        # Marque
        # ------------------------------------------------------

        paragraph = document.add_paragraph()

        paragraph.alignment = (
            WD_ALIGN_PARAGRAPH.CENTER
        )

        run = paragraph.add_run(
            "MACEVO IA"
        )

        self._set_run_font(
            run,
            size=18,
            bold=True,
        )

        # ------------------------------------------------------
        # Ligne
        # ------------------------------------------------------

        paragraph = document.add_paragraph()

        paragraph.alignment = (
            WD_ALIGN_PARAGRAPH.CENTER
        )

        run = paragraph.add_run(
            "________________________________________________"
        )

        self._set_run_font(
            run,
            size=10,
        )

        # ------------------------------------------------------
        # Titre
        # ------------------------------------------------------

        title = (
            cover.get("title")
            or metadata.get("title")
            or "Document scientifique"
        )

        paragraph = document.add_paragraph()

        paragraph.alignment = (
            WD_ALIGN_PARAGRAPH.CENTER
        )

        paragraph.paragraph_format.space_before = Pt(20)
        paragraph.paragraph_format.space_after = Pt(20)

        run = paragraph.add_run(
            self._clean_text(title)
        )

        self._set_run_font(
            run,
            size=22,
            bold=True,
        )

        # ------------------------------------------------------
        # Sujet
        # ------------------------------------------------------

        subject = cover.get("subject")

        if subject:
            paragraph = document.add_paragraph()

            paragraph.alignment = (
                WD_ALIGN_PARAGRAPH.CENTER
            )

            run = paragraph.add_run(
                self._clean_text(subject)
            )

            self._set_run_font(
                run,
                size=13,
            )

        document.add_paragraph()
        document.add_paragraph()

        # ------------------------------------------------------
        # Informations
        # ------------------------------------------------------

        information = [
            ("Auteur", cover.get("author")),
            ("Niveau", cover.get("level")),
            ("Type de document", cover.get("project_type")),
            ("Institution", cover.get("institution")),
            ("Département", cover.get("department")),
            ("Encadreur", cover.get("supervisor")),
        ]

        for label, value in information:
            if not value:
                continue

            paragraph = document.add_paragraph()

            paragraph.alignment = (
                WD_ALIGN_PARAGRAPH.CENTER
            )

            run = paragraph.add_run(
                f"{label} : {self._clean_text(value)}"
            )

            self._set_run_font(
                run,
                size=12,
            )

        # ------------------------------------------------------
        # Année
        # ------------------------------------------------------

        academic_year = cover.get(
            "academic_year"
        )

        if academic_year:
            for _ in range(3):
                document.add_paragraph()

            paragraph = document.add_paragraph()

            paragraph.alignment = (
                WD_ALIGN_PARAGRAPH.CENTER
            )

            run = paragraph.add_run(
                self._clean_text(academic_year)
            )

            self._set_run_font(
                run,
                size=12,
                bold=True,
            )

        self._page_break(document)

    # ==========================================================
    # RÉSUMÉ
    # ==========================================================

    def _build_abstract(self, document):
        """
        Génère le résumé et les mots-clés.
        """

        abstract = self._value(
            self.structure,
            "abstract",
            "",
        )

        keywords = self._value(
            self.structure,
            "keywords",
            [],
        )

        if not abstract and not keywords:
            return

        self._add_heading(
            document,
            "RÉSUMÉ",
            level=1,
        )

        for text in self._split_paragraphs(
            abstract
        ):
            self._add_body_paragraph(
                document,
                text,
            )

        keywords = self._as_list(
            keywords
        )

        if keywords:
            paragraph = document.add_paragraph()

            paragraph.alignment = (
                WD_ALIGN_PARAGRAPH.JUSTIFY
            )

            run = paragraph.add_run(
                "Mots-clés : "
            )

            self._set_run_font(
                run,
                size=12,
                bold=True,
            )

            run = paragraph.add_run(
                ", ".join(keywords)
            )

            self._set_run_font(
                run,
                size=12,
            )

        self._page_break(document)

    # ==========================================================
    # TABLE DES MATIÈRES
    # ==========================================================

    @staticmethod
    def _add_toc_field(document):
        """
        Ajoute un champ TOC natif Word.
        """

        paragraph = document.add_paragraph()

        run = paragraph.add_run()

        begin = OxmlElement("w:fldChar")
        begin.set(
            qn("w:fldCharType"),
            "begin",
        )

        instr = OxmlElement("w:instrText")
        instr.set(
            qn("xml:space"),
            "preserve",
        )
        instr.text = r'TOC \o "1-3" \h \z \u'

        separate = OxmlElement("w:fldChar")
        separate.set(
            qn("w:fldCharType"),
            "separate",
        )

        text = OxmlElement("w:t")
        text.text = (
            "Table des matières — "
            "ouvrez le document dans Word "
            "et mettez à jour les champs."
        )

        end = OxmlElement("w:fldChar")
        end.set(
            qn("w:fldCharType"),
            "end",
        )

        run._r.append(begin)
        run._r.append(instr)
        run._r.append(separate)
        run._r.append(text)
        run._r.append(end)

        WordExporter._set_run_font(
            run,
            size=10,
        )

    def _build_toc(self, document):
        """
        Génère la table des matières automatique.
        """

        chapters = self._value(
            self.structure,
            "chapters",
            [],
        )

        if not chapters:
            return

        self._add_heading(
            document,
            "TABLE DES MATIÈRES",
            level=1,
        )

        self._add_toc_field(
            document
        )

        self._page_break(
            document
        )

    # ==========================================================
    # SECTIONS
    # ==========================================================

    def _build_section(
        self,
        document,
        section,
        chapter_number,
        section_index,
    ):
        """
        Génère une section et ses sous-sections.
        """

        number = self._value(
            section,
            "number",
        )

        if not number:
            number = f"{chapter_number}.{section_index}"

        title = self._value(
            section,
            "title",
            "Section",
        )

        heading = (
            f"{number} {self._clean_text(title)}"
        )

        self._add_heading(
            document,
            heading,
            level=2,
        )

        content = self._value(
            section,
            "content",
            "",
        )

        for text in self._split_paragraphs(
            content
        ):
            self._add_body_paragraph(
                document,
                text,
            )

        subsections = self._value(
            section,
            "subsections",
            [],
        ) or []

        for subsection_index, subsection in enumerate(
            subsections,
            start=1,
        ):
            sub_number = self._value(
                subsection,
                "number",
            )

            if not sub_number:
                sub_number = (
                    f"{number}.{subsection_index}"
                )

            sub_title = self._value(
                subsection,
                "title",
                "Sous-section",
            )

            heading = (
                f"{sub_number} "
                f"{self._clean_text(sub_title)}"
            )

            self._add_heading(
                document,
                heading,
                level=3,
            )

            sub_content = self._value(
                subsection,
                "content",
                "",
            )

            for text in self._split_paragraphs(
                sub_content
            ):
                self._add_body_paragraph(
                    document,
                    text,
                )

    # ==========================================================
    # CONTENU STRUCTURÉ
    # ==========================================================

    def _build_content(self, document):
        """
        Génère les chapitres, sections et sous-sections.
        """

        normalize = getattr(
            self.structure,
            "normalize_numbers",
            None,
        )

        if callable(normalize):
            normalize()

        chapters = self._value(
            self.structure,
            "chapters",
            [],
        ) or []

        for chapter_index, chapter in enumerate(
            chapters,
            start=1,
        ):
            chapter_number = self._value(
                chapter,
                "number",
            )

            if not chapter_number:
                chapter_number = chapter_index

            title = self._value(
                chapter,
                "title",
                "Chapitre",
            )

            chapter_title = (
                f"CHAPITRE {chapter_number} : "
                f"{self._clean_text(title)}"
            )

            self._add_heading(
                document,
                chapter_title,
                level=1,
                page_break_before=(
                    chapter_index > 1
                ),
            )

            content = self._value(
                chapter,
                "content",
                "",
            )

            for text in self._split_paragraphs(
                content
            ):
                self._add_body_paragraph(
                    document,
                    text,
                )

            sections = self._value(
                chapter,
                "sections",
                [],
            ) or []

            for section_index, section in enumerate(
                sections,
                start=1,
            ):
                self._build_section(
                    document,
                    section,
                    chapter_number,
                    section_index,
                )

    # ==========================================================
    # TABLEAUX
    # ==========================================================

    def _set_cell_text(
        self,
        cell,
        text,
        bold=False,
    ):
        """
        Définit proprement le contenu d'une cellule.
        """

        cell.text = ""

        paragraph = cell.paragraphs[0]

        paragraph.alignment = (
            WD_ALIGN_PARAGRAPH.CENTER
        )

        run = paragraph.add_run(
            self._clean_text(text)
        )

        self._set_run_font(
            run,
            size=10,
            bold=bold,
        )

        cell.vertical_alignment = (
            WD_CELL_VERTICAL_ALIGNMENT.CENTER
        )

    def _build_tables(self, document):
        """
        Génère les tableaux.
        """

        tables = self._value(
            self.structure,
            "tables",
            [],
        ) or []

        if not tables:
            return

        self._add_heading(
            document,
            "TABLEAUX",
            level=1,
            page_break_before=True,
        )

        for index, table_data in enumerate(
            tables,
            start=1,
        ):
            number = self._value(
                table_data,
                "number",
            ) or index

            title = self._value(
                table_data,
                "title",
                "Tableau",
            )

            headers = self._value(
                table_data,
                "headers",
                [],
            ) or []

            rows = self._value(
                table_data,
                "rows",
                [],
            ) or []

            if not headers and not rows:
                continue

            normalized_headers = [
                self._clean_text(value)
                for value in headers
            ]

            normalized_rows = []

            for row in rows:
                if isinstance(row, dict):
                    values = list(row.values())
                elif isinstance(row, (list, tuple)):
                    values = list(row)
                else:
                    values = [row]

                normalized_rows.append(
                    [
                        self._clean_text(value)
                        for value in values
                    ]
                )

            column_count = len(
                normalized_headers
            )

            if not column_count:
                column_count = max(
                    (
                        len(row)
                        for row in normalized_rows
                    ),
                    default=0,
                )

            if column_count == 0:
                continue

            table = document.add_table(
                rows=(
                    len(normalized_rows)
                    + (1 if normalized_headers else 0)
                ),
                cols=column_count,
            )

            table.alignment = (
                WD_TABLE_ALIGNMENT.CENTER
            )

            table.style = "Table Grid"

            current_row = 0

            if normalized_headers:
                for column_index in range(
                    column_count
                ):
                    value = ""

                    if column_index < len(
                        normalized_headers
                    ):
                        value = normalized_headers[
                            column_index
                        ]

                    self._set_cell_text(
                        table.cell(
                            current_row,
                            column_index,
                        ),
                        value,
                        bold=True,
                    )

                current_row += 1

            for row in normalized_rows:
                for column_index in range(
                    column_count
                ):
                    value = ""

                    if column_index < len(row):
                        value = row[column_index]

                    self._set_cell_text(
                        table.cell(
                            current_row,
                            column_index,
                        ),
                        value,
                    )

                current_row += 1

            paragraph = document.add_paragraph()

            paragraph.alignment = (
                WD_ALIGN_PARAGRAPH.CENTER
            )

            run = paragraph.add_run(
                f"Tableau {number} — "
                f"{self._clean_text(title)}"
            )

            self._set_run_font(
                run,
                size=10,
                bold=True,
            )

            document.add_paragraph()

    # ==========================================================
    # FIGURES
    # ==========================================================

    def _build_figures(self, document):
        """
        Génère les figures et images disponibles.
        """

        figures = self._value(
            self.structure,
            "figures",
            [],
        ) or []

        if not figures:
            return

        self._add_heading(
            document,
            "FIGURES",
            level=1,
            page_break_before=True,
        )

        for index, figure_data in enumerate(
            figures,
            start=1,
        ):
            image_path = self._value(
                figure_data,
                "path",
                "",
            )

            if not image_path:
                continue

            path = Path(
                str(image_path)
            )

            if not path.exists():
                logger.warning(
                    "Figure introuvable : %s",
                    path,
                )
                continue

            try:
                paragraph = document.add_paragraph()

                paragraph.alignment = (
                    WD_ALIGN_PARAGRAPH.CENTER
                )

                run = paragraph.add_run()

                run.add_picture(
                    str(path),
                    width=Cm(15),
                )

                number = self._value(
                    figure_data,
                    "number",
                ) or index

                caption = (
                    self._value(
                        figure_data,
                        "caption",
                    )
                    or self._value(
                        figure_data,
                        "title",
                    )
                    or ""
                )

                caption = self._clean_text(
                    caption
                )

                if caption:
                    paragraph = document.add_paragraph()

                    paragraph.alignment = (
                        WD_ALIGN_PARAGRAPH.CENTER
                    )

                    run = paragraph.add_run(
                        f"Figure {number} — {caption}"
                    )

                    self._set_run_font(
                        run,
                        size=10,
                        italic=True,
                    )

                document.add_paragraph()

            except Exception:
                logger.exception(
                    "Impossible d'ajouter la figure : %s",
                    path,
                )

    # ==========================================================
    # BIBLIOGRAPHIE
    # ==========================================================

    def _build_bibliography(self, document):
        """
        Génère la bibliographie.
        """

        references = self._value(
            self.structure,
            "references",
            [],
        ) or []

        if not references:
            return

        self._add_heading(
            document,
            "Bibliographie",
            level=1,
            page_break_before=True,
        )

        for index, reference in enumerate(
            references,
            start=1,
        ):
            author = self._value(
                reference,
                "author",
            )

            title = self._value(
                reference,
                "title",
            )

            year = self._value(
                reference,
                "year",
            )

            publisher = self._value(
                reference,
                "publisher",
            )

            doi = self._value(
                reference,
                "doi",
            )

            url = self._value(
                reference,
                "url",
            )

            parts = []

            if author:
                parts.append(
                    self._clean_text(author)
                )

            if year:
                parts.append(
                    f"({self._clean_text(year)})"
                )

            if title:
                parts.append(
                    self._clean_text(title)
                )

            if publisher:
                parts.append(
                    self._clean_text(publisher)
                )

            if doi:
                parts.append(
                    f"DOI : {self._clean_text(doi)}"
                )

            if url:
                parts.append(
                    self._clean_text(url)
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

            paragraph = document.add_paragraph()

            paragraph.paragraph_format.left_indent = Cm(0.5)
            paragraph.paragraph_format.first_line_indent = Cm(-0.5)
            paragraph.paragraph_format.line_spacing = 1.15
            paragraph.paragraph_format.space_after = Pt(6)

            run = paragraph.add_run(
                f"[{index}] {text}"
            )

            self._set_run_font(
                run,
                size=11,
            )

    # ==========================================================
    # ANNEXES
    # ==========================================================

    def _build_appendices(self, document):
        """
        Génère les annexes.
        """

        appendices = self._value(
            self.structure,
            "appendices",
            [],
        ) or []

        if not appendices:
            return

        self._add_heading(
            document,
            "ANNEXES",
            level=1,
            page_break_before=True,
        )

        for index, appendix in enumerate(
            appendices,
            start=1,
        ):
            title = self._value(
                appendix,
                "title",
                f"Annexe {index}",
            )

            self._add_heading(
                document,
                f"Annexe {index} — "
                f"{self._clean_text(title)}",
                level=1,
            )

            content = self._value(
                appendix,
                "content",
                "",
            )

            for text in self._split_paragraphs(
                content
            ):
                self._add_body_paragraph(
                    document,
                    text,
                )

            sections = self._value(
                appendix,
                "sections",
                [],
            ) or []

            for section_index, section in enumerate(
                sections,
                start=1,
            ):
                section_title = self._value(
                    section,
                    "title",
                    f"Section {section_index}",
                )

                self._add_heading(
                    document,
                    self._clean_text(
                        section_title
                    ),
                    level=2,
                )

                section_content = self._value(
                    section,
                    "content",
                    "",
                )

                for text in self._split_paragraphs(
                    section_content
                ):
                    self._add_body_paragraph(
                        document,
                        text,
                    )

    # ==========================================================
    # PROPRIÉTÉS
    # ==========================================================

    def _configure_properties(self, document):
        """
        Configure les propriétés du fichier Word.
        """

        metadata = self._value(
            self.structure,
            "metadata",
            {},
        ) or {}

        if not isinstance(metadata, dict):
            metadata = {}

        title = (
            metadata.get("title")
            or "Document scientifique"
        )

        core = document.core_properties

        core.title = self._clean_text(
            title
        )

        core.subject = self._clean_text(
            metadata.get(
                "subject",
                "",
            )
        )

        core.author = self._clean_text(
            metadata.get(
                "author",
                "",
            )
        )

        core.keywords = ", ".join(
            self._as_list(
                metadata.get(
                    "keywords",
                    "",
                )
            )
        )

        core.comments = (
            "Document scientifique généré "
            "par MACEVO IA."
        )

    # ==========================================================
    # EXPORT
    # ==========================================================

    def export(self, output_path=None):
        """
        Exporte la DocumentStructure vers Word.

        Parameters
        ----------
        output_path:
            Chemin du fichier .docx.

        Returns
        -------
        str
            Chemin du document généré.
        """

        if output_path is None:
            raise ValueError(
                "output_path est obligatoire."
            )

        output = Path(
            output_path
        )

        if output.suffix.lower() != self.EXTENSION:
            output = output.with_suffix(
                self.EXTENSION
            )

        output.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        logger.info(
            "Début export Word : %s",
            output,
        )

        document = Document()

        self._configure_document(
            document
        )

        metadata = self._value(
            self.structure,
            "metadata",
            {},
        ) or {}

        if not isinstance(metadata, dict):
            metadata = {}

        title = (
            metadata.get("title")
            or "Document scientifique"
        )

        self._configure_header_footer(
            document,
            self._clean_text(title),
        )

        # ------------------------------------------------------
        # 1. Couverture
        # ------------------------------------------------------

        self._build_cover(
            document
        )

        # ------------------------------------------------------
        # 2. Résumé
        # ------------------------------------------------------

        self._build_abstract(
            document
        )

        # ------------------------------------------------------
        # 3. Table des matières
        # ------------------------------------------------------

        self._build_toc(
            document
        )

        # ------------------------------------------------------
        # 4. Contenu scientifique
        # ------------------------------------------------------

        self._build_content(
            document
        )

        # ------------------------------------------------------
        # 5. Tableaux
        # ------------------------------------------------------

        self._build_tables(
            document
        )

        # ------------------------------------------------------
        # 6. Figures
        # ------------------------------------------------------

        self._build_figures(
            document
        )

        # ------------------------------------------------------
        # 7. Bibliographie
        # ------------------------------------------------------

        self._build_bibliography(
            document
        )

        # ------------------------------------------------------
        # 8. Annexes
        # ------------------------------------------------------

        self._build_appendices(
            document
        )

        # ------------------------------------------------------
        # 9. Propriétés
        # ------------------------------------------------------

        self._configure_properties(
            document
        )

        # ------------------------------------------------------
        # Sauvegarde
        # ------------------------------------------------------

        document.save(
            str(output)
        )

        logger.info(
            "Export Word terminé : %s",
            output,
        )

        return str(output)

    # ==========================================================
    # COMPATIBILITÉ
    # ==========================================================

    @classmethod
    def from_project(cls, project):
        """
        Compatibilité avec l'ancienne architecture.

        Construit une DocumentStructure à partir d'un projet.
        """

        if project is None:
            raise ValueError(
                "Le projet est obligatoire."
            )

        from .document_builder import DocumentBuilder

        structure = DocumentBuilder(
            project
        ).build()

        return cls(
            structure
        )