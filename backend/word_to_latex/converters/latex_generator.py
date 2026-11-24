from __future__ import annotations

import posixpath
import re
import zipfile
import hashlib
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set
from xml.etree import ElementTree as ET

from docx import Document
from docx.document import Document as _Document
from docx.oxml.ns import qn
from docx.table import Table, _Cell
from docx.text.paragraph import Paragraph

try:
    from .paragraph_converter import ParagraphConverter
    from .table_converter import TableConverter
    from .image_extractor import ImageExtractor, ExtractedImage
    from .equation_converter import EquationConverter
    from .latex_symbols import replace_latex_symbols
except ImportError:
    from paragraph_converter import ParagraphConverter
    from table_converter import TableConverter
    from image_extractor import ImageExtractor, ExtractedImage
    from equation_converter import EquationConverter
    from latex_symbols import replace_latex_symbols


class LatexGenerator:
    """
    Generate a scientific LaTeX document from a DOCX source.

    The generator preserves, as far as the DOCX structure allows:

    - paragraphs;
    - headings;
    - inline/display equations;
    - tables;
    - images;
    - figures and captions;
    - hyperlinks;
    - footnotes;
    - comments;
    - endnotes;
    - embedded bibliography files;
    - Word bibliography sources;
    - metadata;
    - table of contents;
    - document class;
    - language;
    - bibliography package/style;
    - basic Word character formatting.

    Generated files are stored under:

        <output_directory>/document.tex
        <output_directory>/images/
        <output_directory>/references.bib

    The exact output directory can be supplied by the conversion object
    through ``latex_directory`` or ``conversion_directory``.
    """

    WORD_NS = (
        "http://schemas.openxmlformats.org/"
        "wordprocessingml/2006/main"
    )

    DRAWING_NS = (
        "http://schemas.openxmlformats.org/"
        "drawingml/2006/main"
    )

    REL_NS = (
        "http://schemas.openxmlformats.org/"
        "officeDocument/2006/relationships"
    )

    PACKAGE_REL_NS = (
        "http://schemas.openxmlformats.org/"
        "package/2006/relationships"
    )

    IMAGE_REL_TYPE = (
        "http://schemas.openxmlformats.org/"
        "officeDocument/2006/relationships/image"
    )

    SAFE_IMAGE_EXTENSIONS = {
        ".png",
        ".jpg",
        ".jpeg",
        ".pdf",
    }

    HEADING_RE = re.compile(
        r"^(?:Heading|Titre)\s+([1-9][0-9]*)$",
        re.IGNORECASE,
    )

    BIB_FIELD_NAMES = {
        "Tag",
        "TagValue",
        "Author",
        "Title",
        "Year",
        "Month",
        "Day",
        "JournalName",
        "Publisher",
        "Url",
        "DOI",
        "Pages",
        "Volume",
        "Issue",
        "BookTitle",
        "Edition",
        "Institution",
        "School",
        "Type",
        "Comments",
    }

    BIBLATEX_STYLES = {
        "apa",
        "numeric",
        "authoryear",
        "alphabetic",
        "verbose",
        "ieee",
        "mla",
        "chicago-authordate",
        "chicago-notes",
    }

    BIBTEX_STYLES = {
        "plain",
        "abbrv",
        "alpha",
        "unsrt",
        "acm",
        "ieeetr",
        "apalike",
    }

    # ------------------------------------------------------------------
    # Construction
    # ------------------------------------------------------------------

    def __init__(
        self,
        conversion,
        equation_converter: Optional[EquationConverter] = None,
    ):
        self.conversion = conversion

        original_file = self._get_conversion_value(
            "original_file",
            "",
        )

        self.document_path = self._resolve_document_path(
            original_file
        )

        self.output_directory = (
            self._build_output_directory()
        )

        self.images_directory = (
            self.output_directory / "images"
        )

        self.document: Optional[_Document] = None

        self.equation_converter = (
            equation_converter
            or EquationConverter()
        )

        self.paragraph_converter = (
            ParagraphConverter(
                equation_converter=self.equation_converter,
            )
        )

        self.table_converter = TableConverter(
            paragraph_converter=self.paragraph_converter,
            equation_converter=self.equation_converter,
            detect_complex_tables=self._get_bool_option(
                "detect_complex_tables",
                True,
            ),
        )

        self.image_extractor: Optional[
            ImageExtractor
        ] = None

        self.extracted_images: List[
            ExtractedImage
        ] = []

        self._image_by_relationship: Dict[
            str,
            ExtractedImage,
        ] = {}

        self._document_relationships: Dict[
            str,
            str,
        ] = {}

        self._footnotes: Dict[
            str,
            str,
        ] = {}

        self._comments: Dict[
            str,
            str,
        ] = {}

        self._endnotes: Dict[
            str,
            str,
        ] = {}

        self._embedded_bib_files: List[
            Path
        ] = []

        self._generated_bib_file: Optional[
            Path
        ] = None

        self._rendered_image_relationships: Set[
            str
        ] = set()

        self._rendered_image_paths: Set[
            str
        ] = set()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(self) -> str:
        """
        Generate and persist the complete LaTeX source.

        Returns:
            Generated LaTeX source.
        """
        self._validate_source()

        self.output_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.images_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.document = Document(
            str(self.document_path)
        )

        self._load_document_relationships()
        self._load_notes()
        self._extract_images()
        self._extract_bibliography_files()

        parts: List[str] = []

        title_block = self._build_title_block()
        toc = self._build_table_of_contents()

        parts.append(
            self._build_preamble()
        )

        parts.append(
            self._build_document_start()
        )

        if toc:
            parts.append(r"\pagenumbering{roman}")

        if title_block:
            parts.append(title_block)

        if toc and not title_block:
            parts.append(r"\pagenumbering{roman}")

        if toc:
            parts.append(toc)

        body = self._build_document_body()

        if body:
            parts.append(body)

        bibliography = self._build_bibliography()

        if bibliography:
            parts.append(bibliography)

        parts.append(
            r"\end{document}"
        )

        latex = "\n\n".join(
            part.strip()
            for part in parts
            if part and part.strip()
        )

        latex = self._clean_generated_latex(
            latex
        )

        self._write_latex_file(
            latex
        )

        self._update_conversion_statistics(
            latex
        )

        return latex

    def generate_latex(self) -> str:
        """Compatibility alias."""
        return self.generate()

    def build(self) -> str:
        """Compatibility alias."""
        return self.generate()

    def get_generated_latex_path(self) -> Path:
        """Return the generated document.tex path."""
        return (
            self.output_directory
            / "document.tex"
        )

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    def _validate_source(self) -> None:
        if not self.document_path:
            raise ValueError(
                "No original DOCX file was provided."
            )

        if not self.document_path.exists():
            raise FileNotFoundError(
                f"DOCX file not found: {self.document_path}"
            )

        if not self.document_path.is_file():
            raise ValueError(
                "The document path is not a file: "
                f"{self.document_path}"
            )

        if self.document_path.stat().st_size <= 0:
            raise ValueError(
                "The DOCX file is empty."
            )

        if self.document_path.suffix.lower() != ".docx":
            raise ValueError(
                "LatexGenerator requires a .docx source file."
            )

        try:
            with zipfile.ZipFile(
                self.document_path,
                "r",
            ) as archive:
                names = set(
                    archive.namelist()
                )

                if "word/document.xml" not in names:
                    raise ValueError(
                        "Invalid DOCX package: "
                        "word/document.xml is missing."
                    )

        except zipfile.BadZipFile as exc:
            raise ValueError(
                "The supplied file is not a valid DOCX archive."
            ) from exc

    @staticmethod
    def _resolve_document_path(
        original_file,
    ) -> Path:
        """
        Resolve Django FileField-like values and ordinary filesystem paths.
        """
        if original_file is None:
            return Path("")

        if isinstance(
            original_file,
            Path,
        ):
            return original_file

        path = getattr(
            original_file,
            "path",
            None,
        )

        if path:
            return Path(path)

        name = getattr(
            original_file,
            "name",
            None,
        )

        if name:
            return Path(name)

        return Path(
            str(original_file)
        )

    # ------------------------------------------------------------------
    # Output directory
    # ------------------------------------------------------------------

    def _build_output_directory(self) -> Path:
        latex_directory = self._get_conversion_value(
            "latex_directory",
            None,
        )

        if latex_directory:
            return Path(
                latex_directory
            )

        conversion_directory = (
            self._get_conversion_value(
                "conversion_directory",
                None,
            )
        )

        if conversion_directory:
            return (
                Path(conversion_directory)
                / "latex"
            )

        conversion_id = str(
            self._get_conversion_value(
                "id",
                "conversion",
            )
        )

        return (
            Path.cwd()
            / "media"
            / "conversions"
            / conversion_id
            / "latex"
        )

    # ------------------------------------------------------------------
    # Preamble
    # ------------------------------------------------------------------

    def _build_preamble(self) -> str:
        document_class = (
            self._sanitize_document_class(
                self._get_option(
                    "document_class",
                    "report",
                )
            )
        )

        font_size = (
            self._sanitize_font_size(
                self._get_option(
                    "font_size",
                    "11pt",
                )
            )
        )

        language = str(
            self._get_option(
                "language",
                "french",
            )
        ).strip().lower()

        bibliography_package = str(
            self._get_option(
                "bibliography_package",
                "biblatex",
            )
        ).strip().lower()

        bibliography_style = (
            self._sanitize_bibliography_style(
                self._get_option(
                    "bibliography_style",
                    "apa",
                )
            )
        )

        margins = self._sanitize_margin(
            self._get_option(
                "margins",
                "2.5cm",
            )
        )

        lines = [
            rf"\documentclass[{font_size}]"
            rf"{{{document_class}}}",
            "",
            r"% --------------------------------------------------",
            r"% MACEVO - Generated scientific LaTeX document",
            r"% --------------------------------------------------",
            "",
            r"\usepackage[utf8]{inputenc}",
            r"\usepackage[T1]{fontenc}",
            self._build_babel_package(
                language
            ),
            "",
            r"\usepackage{amsmath}",
            r"\usepackage{amssymb}",
            r"\usepackage{amsfonts}",
            r"\usepackage{textcomp}",
            r"\usepackage{mathtools}",
            "",
            r"\usepackage{graphicx}",
            r"\usepackage{float}",
            r"\usepackage{caption}",
            r"\usepackage{subcaption}",
            "",
            r"\usepackage{array}",
            r"\usepackage{booktabs}",
            r"\usepackage{longtable}",
            r"\usepackage{multirow}",
            r"\usepackage{tabularx}",
            "",
            r"\usepackage{geometry}",
            r"\usepackage{xcolor}",
            r"\usepackage[normalem]{ulem}",
            r"\usepackage{hyperref}",
            r"\usepackage{url}",
            r"\usepackage[protrusion=true,expansion=false]{microtype}",
            "",
            r"\setlength{\parindent}{0pt}",
            r"\setlength{\parskip}{0.5em}",
            "",
            r"\graphicspath{{images/}}",
            r"\DeclareGraphicsExtensions{.pdf,.png,.jpg,.jpeg}",
            "",
            rf"\geometry{{margin={margins}}}",
            "",
            r"\hypersetup{",
            r"  colorlinks=true,",
            r"  linkcolor=blue,",
            r"  citecolor=blue,",
            r"  urlcolor=blue,",
            r"  bookmarksopen=true",
            r"}",
        ]

        has_bibliography_source = self._has_bibliography_source()

        if bibliography_package == "biblatex" and has_bibliography_source:
            lines.extend(
                [
                    "",
                    rf"\usepackage[backend=biber,"
                    rf"style={bibliography_style}]"
                    r"{biblatex}",
                ]
            )

            lines.append(
                r"\addbibresource{references.bib}"
            )

        elif bibliography_package == "bibtex" and has_bibliography_source:
            bibtex_style = (
                self._sanitize_bibtex_style(
                    bibliography_style
                )
            )

            lines.extend(
                [
                    "",
                    rf"\bibliographystyle{{{bibtex_style}}}",
                ]
            )

        return "\n".join(lines)

    def _build_babel_package(
        self,
        language: str,
    ) -> str:
        mapping = {
            "french": "french",
            "english": "english",
            "spanish": "spanish",
            "german": "ngerman",
        }

        value = mapping.get(
            language,
            "english",
        )

        return (
            rf"\usepackage[{value}]{{babel}}"
        )

    # ------------------------------------------------------------------
    # Document start / title
    # ------------------------------------------------------------------

    def _build_document_start(self) -> str:
        return r"\begin{document}"

    def _build_title_block(self) -> str:
        if not self._get_bool_option("metadata", False):
            return ""

        title = (
            self._get_conversion_value(
                "document_title",
                "",
            )
            or ""
        )

        author = (
            self._get_conversion_value(
                "document_author",
                "",
            )
            or ""
        )

        if self.document is not None:
            if not title:
                title = (
                    self.document
                    .core_properties
                    .title
                    or ""
                )

            if not author:
                author = (
                    self.document
                    .core_properties
                    .author
                    or ""
                )

        title = str(title).strip()
        author = str(author).strip()

        if not title and not author:
            return ""

        lines: List[str] = []

        if title:
            lines.append(
                rf"\title{{{self._escape_latex(title)}}}"
            )
        elif author:
            # LaTeX's \maketitle requires \title to have been declared,
            # even when the source document only has author metadata.
            lines.append(r"\title{}")

        if author:
            lines.append(
                rf"\author{{{self._escape_latex(author)}}}"
            )

        lines.append(
            r"\date{}"
        )

        lines.append(
            r"\hypersetup{pageanchor=false}"
        )

        lines.append(
            r"\maketitle"
        )

        lines.append(
            r"\hypersetup{pageanchor=true}"
        )

        return "\n".join(lines)

    def _build_table_of_contents(self) -> str:
        if not self._get_bool_option(
            "table_of_contents",
            True,
        ):
            return ""

        if self.document is None or not any(
            isinstance(block, Paragraph)
            and self._get_heading_level(block)
            for block in self._iter_block_items(self.document)
        ):
            return ""

        return "\n".join(
            [
                r"\tableofcontents",
                r"\clearpage",
                r"\pagenumbering{arabic}",
            ]
        )

    # ------------------------------------------------------------------
    # Document body
    # ------------------------------------------------------------------

    def _build_document_body(self) -> str:
        if self.document is None:
            return ""

        blocks: List[str] = []

        for block in self._iter_block_items(
            self.document
        ):
            converted = ""

            if isinstance(
                block,
                Paragraph,
            ):
                converted = self._convert_paragraph(
                    block
                )

            elif isinstance(
                block,
                Table,
            ):
                converted = self._convert_table(
                    block
                )

            if converted and converted.strip():
                blocks.append(
                    converted.strip()
                )

        return "\n\n".join(
            blocks
        )

    # ------------------------------------------------------------------
    # Paragraph conversion
    # ------------------------------------------------------------------

    def _convert_paragraph(
        self,
        paragraph: Paragraph,
    ) -> str:
        # Use the structure-aware converter for every paragraph. The
        # simpler paragraph converter skips drawing/pict runs, which drops
        # inline images from ordinary paragraphs and makes the .tex source
        # differ from the complete project ZIP.
        return self._convert_paragraph_with_structure(paragraph)

    def _convert_paragraph_with_structure(
        self,
        paragraph: Paragraph,
    ) -> str:
        element = paragraph._p

        pieces: List[str] = []

        for child in list(element):
            local_name = self._local_name(
                child.tag
            )

            if local_name == "pPr":
                continue

            if local_name == "oMathPara":
                equation = (
                    self.equation_converter
                    .convert_paragraph(
                        child,
                        display=True,
                    )
                )

                if equation:
                    pieces.append(
                        equation
                    )

                continue

            if local_name == "oMath":
                equation = (
                    self.equation_converter
                    .convert(
                        child,
                        display=False,
                    )
                )

                if equation:
                    pieces.append(
                        equation
                    )

                continue

            converted = (
                self._convert_xml_paragraph_child(
                    child
                )
            )

            if converted:
                pieces.append(
                    converted
                )

        content = "".join(
            pieces
        ).strip()

        if not content:
            return ""

        heading_level = (
            self._get_heading_level(
                paragraph
            )
        )

        if heading_level:
            return self._build_heading(
                heading_level,
                content,
            )

        if self._is_caption_paragraph(
            paragraph
        ):
            return self._build_caption(
                content
            )

        return content

    def _convert_xml_paragraph_child(
        self,
        element: ET.Element,
    ) -> str:
        local_name = self._local_name(
            element.tag
        )

        if local_name == "r":
            return self._convert_word_run(
                element
            )

        if local_name == "hyperlink":
            return self._convert_hyperlink(
                element
            )

        if local_name in {
            "bookmarkStart",
            "bookmarkEnd",
        }:
            return ""

        if local_name == "fldSimple":
            return self._convert_field(
                element
            )

        if local_name == "smartTag":
            return self._convert_children_structure(
                element
            )

        if local_name in {
            "sdt",
            "customXml",
        }:
            return self._convert_children_structure(
                element
            )

        return ""

    def _convert_children_structure(
        self,
        element: ET.Element,
    ) -> str:
        pieces: List[str] = []

        for child in list(element):
            local_name = self._local_name(
                child.tag
            )

            if local_name == "r":
                pieces.append(
                    self._convert_word_run(
                        child
                    )
                )

            elif local_name == "hyperlink":
                pieces.append(
                    self._convert_hyperlink(
                        child
                    )
                )

            elif local_name == "oMath":
                pieces.append(
                    self.equation_converter.convert(
                        child,
                        display=False,
                    )
                )

            elif local_name == "oMathPara":
                pieces.append(
                    self.equation_converter.convert_paragraph(
                        child,
                        display=True,
                    )
                )

            elif local_name not in {
                "pPr",
                "rPr",
                "sdtPr",
                "sdtEndPr",
            }:
                pieces.append(
                    self._convert_children_structure(
                        child
                    )
                )

        return "".join(pieces)

    # ------------------------------------------------------------------
    # Word runs
    # ------------------------------------------------------------------

    def _convert_word_run(
        self,
        run_element: ET.Element,
    ) -> str:
        pieces: List[str] = []

        for child in list(run_element):
            local_name = self._local_name(
                child.tag
            )

            if local_name == "rPr":
                continue

            if local_name == "t":
                pieces.append(
                    self._convert_run_text(
                        child.text or ""
                    )
                )

            elif local_name == "tab":
                pieces.append(
                    r"\quad{}"
                )

            elif local_name == "br":
                break_type = child.get(
                    qn("w:type")
                )

                if break_type == "page":
                    pieces.append(
                        r"\newpage"
                    )
                else:
                    pieces.append(
                        r"\newline{}"
                    )

            elif local_name == "cr":
                pieces.append(
                    r"\newline{}"
                )

            elif local_name == "footnoteReference":
                note_id = child.get(
                    qn("w:id")
                )

                if note_id is not None:
                    pieces.append(
                        self._build_footnote_reference(
                            note_id
                        )
                    )

            elif local_name == "endnoteReference":
                note_id = child.get(
                    qn("w:id")
                )

                if note_id is not None:
                    pieces.append(
                        self._build_endnote_reference(
                            note_id
                        )
                    )

            elif local_name == "commentReference":
                comment_id = child.get(
                    qn("w:id")
                )

                if (
                    comment_id is not None
                    and self._get_bool_option(
                        "include_comments",
                        False,
                    )
                ):
                    pieces.append(
                        self._build_comment_reference(
                            comment_id
                        )
                    )

            elif local_name in {
                "drawing",
                "pict",
                "object",
                "AlternateContent",
            }:
                for image in self._find_images_for_element(child):
                    image_block = self._build_image_block(image)
                    if image_block:
                        pieces.append(image_block)

        text = "".join(pieces)

        return self._apply_run_formatting(
            run_element,
            text,
        )

    def _convert_run_text(
        self,
        text: str,
    ) -> str:
        return self._escape_latex(
            text
        )

    # ------------------------------------------------------------------
    # Hyperlinks / fields
    # ------------------------------------------------------------------

    def _convert_hyperlink(
        self,
        element: ET.Element,
    ) -> str:
        text = "".join(
            self._extract_all_text(
                element
            )
        ).strip()

        if not text:
            return ""

        relationship_id = (
            self._get_relationship_attribute(
                element,
                "id",
            )
            or self._get_relationship_attribute(
                element,
                "embed",
            )
        )

        url = None

        if relationship_id:
            url = (
                self._document_relationships.get(
                    relationship_id
                )
            )

        if (
            url
            and self._is_external_url(url)
        ):
            return (
                rf"\href{{{self._escape_url(url)}}}"
                rf"{{{self._escape_latex(text)}}}"
            )

        return self._escape_latex(
            text
        )

    def _convert_field(
        self,
        element: ET.Element,
    ) -> str:
        text = "".join(
            self._extract_all_text(
                element
            )
        ).strip()

        if not text:
            return ""

        return self._escape_latex(
            text
        )

    # ------------------------------------------------------------------
    # Headings
    # ------------------------------------------------------------------

    def _get_heading_level(
        self,
        paragraph: Paragraph,
    ) -> Optional[int]:
        style_name = ""

        if paragraph.style is not None:
            style_name = (
                paragraph.style.name
                or ""
            )

        match = self.HEADING_RE.match(
            style_name.strip()
        )

        if match:
            return max(
                1,
                min(
                    int(match.group(1)),
                    6,
                ),
            )

        ppr = paragraph._p.pPr

        if ppr is not None:
            outline = ppr.find(
                qn("w:outlineLvl")
            )

            if outline is not None:
                value = outline.get(
                    qn("w:val")
                )

                try:
                    level = int(value) + 1

                    return max(
                        1,
                        min(level, 6),
                    )

                except (
                    TypeError,
                    ValueError,
                ):
                    pass

        return None

    def _build_heading(
        self,
        level: int,
        content: str,
    ) -> str:
        # ParagraphConverter appends paragraph spacing to normal text.
        # A paragraph break inside \section{...} terminates the command
        # argument and makes the generated document fail to compile.
        content = content.strip()
        level = max(
            1,
            min(level, 6),
        )

        commands = {
            1: r"\section",
            2: r"\subsection",
            3: r"\subsubsection",
            4: r"\paragraph",
            5: r"\subparagraph",
            6: r"\textbf",
        }

        command = commands[level]

        if level == 6:
            return (
                r"\textbf{"
                + content
                + "}"
            )

        return (
            command
            + "{"
            + content
            + "}"
        )

    # ------------------------------------------------------------------
    # Tables
    # ------------------------------------------------------------------

    def _convert_table(
        self,
        table: Table,
    ) -> str:
        try:
            converted = self.table_converter.convert(
                table
            )

            if converted:
                return converted

        except Exception:
            pass

        return self._fallback_table(
            table
        )

    def _fallback_table(
        self,
        table: Table,
    ) -> str:
        rows: List[str] = []

        column_count = 0

        for row in table.rows:
            column_count = max(
                column_count,
                len(row.cells),
            )

        if column_count <= 0:
            return ""

        alignment = "|".join(
            ["l"] * column_count
        )

        rows.append(
            rf"\begin{{tabular}}{{|{alignment}|}}"
        )

        rows.append(
            r"\hline"
        )

        for row in table.rows:
            cells: List[str] = []

            for cell in row.cells:
                value = (
                    cell.text
                    .strip()
                )

                cells.append(
                    self._escape_latex(
                        value
                    )
                )

            while len(cells) < column_count:
                cells.append("")

            rows.append(
                " & ".join(cells)
                + r" \\"
            )

            rows.append(
                r"\hline"
            )

        rows.append(
            r"\end{tabular}"
        )

        return "\n".join(rows)

    # ------------------------------------------------------------------
    # Images
    # ------------------------------------------------------------------

    def _extract_images(self) -> None:
        self.image_extractor = ImageExtractor(
            document_path=self.document_path,
            output_directory=self.output_directory,
            optimize_images=self._get_bool_option(
                "optimize_images",
                True,
            ),
        )

        self.extracted_images = (
            self.image_extractor.extract_images()
        )

        self._image_by_relationship = {
            image.relationship_id: image
            for image in self.extracted_images
            if image.relationship_id
        }

    def _find_image_for_element(
        self,
        element: ET.Element,
    ) -> Optional[ExtractedImage]:
        images = self._find_images_for_element(element)
        return images[0] if images else None

    def _find_images_for_element(
        self,
        element: ET.Element,
    ) -> List[ExtractedImage]:
        relationship_id: Optional[str] = None
        found: List[ExtractedImage] = []
        seen_relationships: Set[str] = set()
        seen_image_contents: Set[str] = set()

        for descendant in element.iter():
            relationship_id = None
            local_name = self._local_name(
                descendant.tag
            )

            if local_name == "blip":
                relationship_id = (
                    self._get_relationship_attribute(
                        descendant,
                        "embed",
                    )
                )

            elif local_name == "imagedata":
                relationship_id = (
                    self._get_relationship_attribute(
                        descendant,
                        "id",
                    )
                )

            if not relationship_id or relationship_id in seen_relationships:
                continue
            seen_relationships.add(relationship_id)
            image = self._image_by_relationship.get(relationship_id)
            if image is not None:
                try:
                    image_bytes = Path(image.output_path).read_bytes()
                    fingerprint = hashlib.sha256(image_bytes).hexdigest()
                except OSError:
                    fingerprint = relationship_id
                if fingerprint in seen_image_contents:
                    continue
                seen_image_contents.add(fingerprint)
                found.append(image)

        return found

    def _build_image_block(
        self,
        image: ExtractedImage,
    ) -> str:
        image_handling = str(
            self._get_option(
                "image_handling",
                "copy",
            )
        ).strip().lower()

        if image_handling == "ignore":
            return ""

        extension = str(
            image.extension or ""
        ).lower()

        if extension not in self.SAFE_IMAGE_EXTENSIONS:
            return (
                "% Unsupported image format "
                f"extracted from DOCX: {image.filename}"
            )

        relationship_id = (
            image.relationship_id
            or ""
        )

        if relationship_id in self._rendered_image_relationships:
            return ""

        if image_handling == "reference":
            return (
                rf"\texttt{{"
                rf"{self._escape_latex(image.filename)}"
                rf"}}"
            )

        latex_path = str(
            image.latex_path or ""
        ).strip()

        if not latex_path:
            return ""

        latex_path = (
            latex_path
            .replace("\\", "/")
        )

        latex_path = self._normalize_latex_image_path(
            latex_path
        )

        if not latex_path:
            return ""

        self._rendered_image_relationships.add(
            relationship_id
        )

        self._rendered_image_paths.add(
            latex_path
        )

        graphics_path = self._escape_graphics_path(latex_path)
        include_graphic = (
            rf"\includegraphics[width=\textwidth,height=0.75\textheight,"
            rf"keepaspectratio]"
            rf"{{{graphics_path}}}"
        )
        missing_graphic = (
            r"\fbox{\parbox{0.9\textwidth}{\centering "
            r"Image non incluse dans le fichier .tex seul. "
            r"Importez le ZIP Overleaf complet pour afficher ce media.}}"
        )

        lines = [
            r"\begin{figure}[H]",
            r"\centering",
            rf"\IfFileExists{{{graphics_path}}}"
            rf"{{{include_graphic}}}"
            rf"{{{missing_graphic}}}",
        ]

        caption = self._extract_image_caption(
            image
        )

        if caption:
            lines.append(
                rf"\caption{{{self._escape_latex(caption)}}}"
            )
        elif image.alt_text:
            lines.append(
                rf"\caption{{{self._escape_latex(image.alt_text)}}}"
            )

        label = self._build_image_label(
            image
        )

        if label:
            lines.append(
                rf"\label{{{label}}}"
            )

        lines.append(
            r"\end{figure}"
        )

        return "\n".join(lines)

    def _normalize_latex_image_path(
        self,
        value: str,
    ) -> str:
        value = str(
            value or ""
        ).replace(
            "\\",
            "/",
        ).strip()

        if not value:
            return ""

        normalized = posixpath.normpath(
            value
        )

        while normalized.startswith(
            "../"
        ):
            normalized = normalized[3:]

        normalized = normalized.lstrip(
            "/"
        )

        if normalized == ".":
            return ""

        if normalized.startswith(
            "images/"
        ):
            return normalized

        if "/" not in normalized:
            return (
                f"images/{normalized}"
            )

        return normalized

    def _extract_image_caption(
        self,
        image: ExtractedImage,
    ) -> str:
        """
        Use explicit image caption metadata if the extractor exposes it.

        Different versions of ImageExtractor may expose different fields,
        so this remains deliberately defensive.
        """
        for attribute in (
            "caption",
            "figure_caption",
            "title",
        ):
            value = getattr(
                image,
                attribute,
                None,
            )

            if value:
                return str(value).strip()

        return ""

    def _build_image_label(
        self,
        image: ExtractedImage,
    ) -> str:
        stem = Path(
            image.filename
        ).stem

        stem = re.sub(
            r"[^A-Za-z0-9:_-]+",
            "-",
            stem,
        )

        stem = stem.strip(
            "-_:"
        )

        if not stem:
            return ""

        return (
            "fig:"
            + stem[:120]
        )

    @staticmethod
    def _escape_graphics_path(
        value: str,
    ) -> str:
        return (
            str(value)
            .replace("\\", "/")
            .replace("%", r"\%")
            .replace("#", r"\#")
            .replace("&", r"\&")
            .replace("{", r"\{")
            .replace("}", r"\}")
            .replace(" ", r"\ ")
        )

    # ------------------------------------------------------------------
    # Captions
    # ------------------------------------------------------------------

    def _is_caption_paragraph(
        self,
        paragraph: Paragraph,
    ) -> bool:
        style_name = ""

        if paragraph.style is not None:
            style_name = (
                paragraph.style.name
                or ""
            ).lower()

        return (
            "caption" in style_name
            or "légende" in style_name
            or "legende" in style_name
        )

    def _build_caption(
        self,
        content: str,
    ) -> str:
        return "\n".join(
            [
                r"\begin{center}",
                content,
                r"\end{center}",
            ]
        )

    # ------------------------------------------------------------------
    # Footnotes / comments / endnotes
    # ------------------------------------------------------------------

    def _load_notes(self) -> None:
        self._footnotes = {}
        self._comments = {}
        self._endnotes = {}

        try:
            with zipfile.ZipFile(
                self.document_path,
                "r",
            ) as archive:
                self._footnotes = (
                    self._parse_notes_part(
                        archive,
                        "word/footnotes.xml",
                        "footnote",
                    )
                )

                self._comments = (
                    self._parse_notes_part(
                        archive,
                        "word/comments.xml",
                        "comment",
                    )
                )

                self._endnotes = (
                    self._parse_notes_part(
                        archive,
                        "word/endnotes.xml",
                        "endnote",
                    )
                )

        except (
            zipfile.BadZipFile,
            OSError,
        ):
            return

    def _parse_notes_part(
        self,
        archive: zipfile.ZipFile,
        filename: str,
        element_name: str,
    ) -> Dict[str, str]:
        result: Dict[str, str] = {}

        if filename not in archive.namelist():
            return result

        try:
            root = ET.fromstring(
                archive.read(filename)
            )

        except ET.ParseError:
            return result

        for element in root.iter():
            if self._local_name(
                element.tag
            ) != element_name:
                continue

            note_id = None

            for key, value in (
                element.attrib.items()
            ):
                if self._local_name(
                    key
                ) == "id":
                    note_id = value
                    break

            if note_id is None:
                continue

            if str(note_id) in {
                "-1",
                "0",
            }:
                continue

            text = "".join(
                self._extract_all_text(
                    element
                )
            ).strip()

            if text:
                result[str(note_id)] = text

        return result

    def _build_footnote_reference(
        self,
        note_id: str,
    ) -> str:
        if not self._get_bool_option(
            "include_footnotes",
            True,
        ):
            return ""

        content = self._footnotes.get(
            str(note_id),
            "",
        )

        if not content:
            return ""

        return (
            rf"\footnote{{"
            rf"{self._escape_latex(content)}"
            rf"}}"
        )

    def _build_endnote_reference(
        self,
        note_id: str,
    ) -> str:
        if not self._get_bool_option(
            "include_footnotes",
            True,
        ):
            return ""

        content = self._endnotes.get(
            str(note_id),
            "",
        )

        if not content:
            return ""

        return (
            rf"\footnote{{"
            rf"{self._escape_latex(content)}"
            rf"}}"
        )

    def _build_comment_reference(
        self,
        comment_id: str,
    ) -> str:
        content = self._comments.get(
            str(comment_id),
            "",
        )

        if not content:
            return ""

        return (
            rf"\footnote{{"
            rf"Commentaire : "
            rf"{self._escape_latex(content)}"
            rf"}}"
        )

    # ------------------------------------------------------------------
    # Bibliography
    # ------------------------------------------------------------------

    def _has_bibliography_source(self) -> bool:
        return bool(
            self._embedded_bib_files
            or self._detect_word_bibliography_sources()
        )

    def _build_bibliography(self) -> str:
        package = str(
            self._get_option(
                "bibliography_package",
                "biblatex",
            )
        ).strip().lower()

        if package == "none":
            return ""

        bib_content = (
            self._collect_bibliography_content()
        )

        if not bib_content.strip():
            return ""

        bib_file = (
            self.output_directory
            / "references.bib"
        )

        bib_file.write_text(
            bib_content,
            encoding="utf-8",
        )

        self._generated_bib_file = bib_file

        if package == "biblatex":
            return "\n".join(
                [
                    r"\clearpage",
                    r"\printbibliography",
                ]
            )

        if package == "bibtex":
            return "\n".join(
                [
                    r"\clearpage",
                    r"\bibliography{references}",
                ]
            )

        return ""

    def _collect_bibliography_content(
        self,
    ) -> str:
        parts: List[str] = []

        for bib_file in self._embedded_bib_files:
            try:
                content = bib_file.read_text(
                    encoding="utf-8",
                    errors="ignore",
                )

            except OSError:
                continue

            if content.strip():
                parts.append(
                    content.strip()
                )

        generated_entries = (
            self._extract_word_bibliography_entries()
        )

        if generated_entries:
            parts.append(
                generated_entries
            )

        if not parts:
            return ""

        return "\n\n".join(
            self._deduplicate_preserve_order(
                parts
            )
        )

    def _detect_word_bibliography_sources(
        self,
    ) -> bool:
        try:
            with zipfile.ZipFile(
                self.document_path,
                "r",
            ) as archive:
                for filename in archive.namelist():
                    lowered = filename.lower()

                    if (
                        "bibliography" in lowered
                        or lowered.endswith(
                            "sources.xml"
                        )
                    ):
                        return True

        except (
            zipfile.BadZipFile,
            OSError,
        ):
            return False

        return False

    def _extract_word_bibliography_entries(
        self,
    ) -> str:
        entries: List[str] = []

        try:
            with zipfile.ZipFile(
                self.document_path,
                "r",
            ) as archive:
                candidate_files = [
                    name
                    for name in archive.namelist()
                    if (
                        "customxml" in name.lower()
                        or "bibliography" in name.lower()
                        or name.lower().endswith(
                            "sources.xml"
                        )
                    )
                ]

                for filename in candidate_files:
                    try:
                        root = ET.fromstring(
                            archive.read(filename)
                        )

                    except (
                        ET.ParseError,
                        KeyError,
                    ):
                        continue

                    entries.extend(
                        self._bibliography_entries_from_xml(
                            root
                        )
                    )

        except (
            zipfile.BadZipFile,
            OSError,
        ):
            return ""

        return "\n\n".join(
            self._deduplicate_preserve_order(
                entries
            )
        )

    def _bibliography_entries_from_xml(
        self,
        root: ET.Element,
    ) -> List[str]:
        entries: List[str] = []

        source_nodes = [
            node
            for node in root.iter()
            if self._local_name(
                node.tag
            ).lower()
            == "source"
        ]

        if not source_nodes:
            source_nodes = [
                node
                for node in root.iter()
                if self._local_name(
                    node.tag
                ).lower()
                == "bibliography"
            ]

        for source in source_nodes:
            fields: Dict[str, str] = {}

            for node in source.iter():
                node_name = self._local_name(
                    node.tag
                )

                if (
                    node_name not in self.BIB_FIELD_NAMES
                    or not node.text
                ):
                    continue

                value = node.text.strip()

                if not value:
                    continue

                fields.setdefault(
                    node_name,
                    value,
                )

            if not fields:
                continue

            entry = self._build_bibtex_entry(
                fields
            )

            if entry:
                entries.append(
                    entry
                )

        return entries

    def _build_bibtex_entry(
        self,
        fields: Dict[str, str],
    ) -> str:
        key = (
            fields.get("Tag")
            or fields.get("TagValue")
            or self._make_bibtex_key(
                fields
            )
        )

        key = self._sanitize_bibtex_key(
            key
        )

        title = fields.get(
            "Title",
            "",
        )

        author = fields.get(
            "Author",
            "",
        )

        year = fields.get(
            "Year",
            "",
        )

        journal = fields.get(
            "JournalName",
            "",
        )

        publisher = fields.get(
            "Publisher",
            "",
        )

        url = fields.get(
            "Url",
            "",
        )

        doi = fields.get(
            "DOI",
            "",
        )

        pages = fields.get(
            "Pages",
            "",
        )

        volume = fields.get(
            "Volume",
            "",
        )

        issue = fields.get(
            "Issue",
            "",
        )

        book_title = fields.get(
            "BookTitle",
            "",
        )

        edition = fields.get(
            "Edition",
            "",
        )

        institution = fields.get(
            "Institution",
            "",
        )

        school = fields.get(
            "School",
            "",
        )

        source_type = (
            fields.get(
                "Type",
                "",
            )
            .lower()
            .replace(
                " ",
                "",
            )
        )

        if source_type in {
            "journalarticle",
            "article",
        } or journal:
            entry_type = "article"

        elif (
            source_type in {
                "booksection",
                "incollection",
            }
            or book_title
        ):
            entry_type = "incollection"

        elif (
            source_type in {
                "report",
                "techreport",
            }
            or institution
        ):
            entry_type = "techreport"

        elif (
            source_type in {
                "phdthesis",
                "thesis",
            }
            or school
        ):
            entry_type = "phdthesis"

        else:
            entry_type = "book"

        lines = [
            f"@{entry_type}{{{key},",
        ]

        self._append_bib_field(
            lines,
            "author",
            author,
        )

        self._append_bib_field(
            lines,
            "title",
            title,
        )

        self._append_bib_field(
            lines,
            "journal",
            journal,
        )

        self._append_bib_field(
            lines,
            "booktitle",
            book_title,
        )

        self._append_bib_field(
            lines,
            "publisher",
            publisher,
        )

        self._append_bib_field(
            lines,
            "institution",
            institution,
        )

        self._append_bib_field(
            lines,
            "school",
            school,
        )

        self._append_bib_field(
            lines,
            "year",
            year,
        )

        self._append_bib_field(
            lines,
            "edition",
            edition,
        )

        self._append_bib_field(
            lines,
            "volume",
            volume,
        )

        self._append_bib_field(
            lines,
            "number",
            issue,
        )

        self._append_bib_field(
            lines,
            "pages",
            pages,
        )

        self._append_bib_field(
            lines,
            "doi",
            doi,
        )

        self._append_bib_field(
            lines,
            "url",
            url,
        )

        lines.append(
            "}"
        )

        return "\n".join(lines)

    @staticmethod
    def _append_bib_field(
        lines: List[str],
        name: str,
        value: str,
    ) -> None:
        if not value:
            return

        cleaned = (
            str(value)
            .replace("\\", " ")
            .replace("{", "")
            .replace("}", "")
            .replace("\n", " ")
            .replace("\r", " ")
        )

        lines.append(
            f"  {name} = {{{cleaned}}},"
        )

    def _make_bibtex_key(
        self,
        fields: Dict[str, str],
    ) -> str:
        author = fields.get(
            "Author",
            "reference",
        )

        year = fields.get(
            "Year",
            "",
        )

        first_part = (
            author.split(",")[0]
            if author
            else "reference"
        )

        first_word = re.sub(
            r"[^A-Za-z0-9]+",
            "",
            first_part,
        )

        first_word = (
            first_word
            or "reference"
        )

        return (
            first_word[:30]
            + (
                year[:10]
                if year
                else ""
            )
        )

    @staticmethod
    def _sanitize_bibtex_key(
        value: str,
    ) -> str:
        value = re.sub(
            r"[^A-Za-z0-9:_-]+",
            "_",
            str(value),
        )

        return (
            value.strip("_")
            or "reference"
        )

    @classmethod
    def _sanitize_bibliography_style(
        cls,
        value: str,
    ) -> str:
        value = str(
            value or "apa"
        ).strip().lower()

        if value in cls.BIBLATEX_STYLES:
            return value

        value = re.sub(
            r"[^a-z0-9_-]+",
            "",
            value,
        )

        return (
            value
            if value in cls.BIBLATEX_STYLES
            else "apa"
        )

    @classmethod
    def _sanitize_bibtex_style(
        cls,
        value: str,
    ) -> str:
        value = str(
            value or "plain"
        ).strip().lower()

        if value in cls.BIBTEX_STYLES:
            return value

        return "plain"

    # ------------------------------------------------------------------
    # Relationships
    # ------------------------------------------------------------------

    def _load_document_relationships(
        self,
    ) -> None:
        self._document_relationships = {}

        try:
            with zipfile.ZipFile(
                self.document_path,
                "r",
            ) as archive:
                filename = (
                    "word/_rels/document.xml.rels"
                )

                if filename not in archive.namelist():
                    return

                root = ET.fromstring(
                    archive.read(filename)
                )

                for relationship in root:
                    if self._local_name(
                        relationship.tag
                    ) != "Relationship":
                        continue

                    relationship_id = (
                        relationship.get("Id")
                    )

                    target = (
                        relationship.get("Target")
                    )

                    target_mode = (
                        relationship.get("TargetMode")
                    )

                    if (
                        not relationship_id
                        or not target
                    ):
                        continue

                    if (
                        target_mode
                        and target_mode.lower()
                        == "external"
                    ):
                        self._document_relationships[
                            relationship_id
                        ] = target

                        continue

                    try:
                        resolved = (
                            self._resolve_relationship_target(
                                target
                            )
                        )

                    except ValueError:
                        continue

                    self._document_relationships[
                        relationship_id
                    ] = resolved

        except (
            zipfile.BadZipFile,
            ET.ParseError,
            OSError,
        ):
            return

    def _resolve_relationship_target(
        self,
        target: str,
    ) -> str:
        target = str(
            target or ""
        ).replace(
            "\\",
            "/",
        )

        if target.startswith("/"):
            normalized = posixpath.normpath(
                target.lstrip("/")
            )
        else:
            normalized = posixpath.normpath(
                posixpath.join(
                    "word",
                    target,
                )
            )

        normalized = normalized.lstrip("/")

        if (
            normalized == ".."
            or normalized.startswith("../")
        ):
            raise ValueError(
                "Unsafe DOCX relationship target."
            )

        return normalized

    # ------------------------------------------------------------------
    # XML / block iteration
    # ------------------------------------------------------------------

    def _iter_block_items(
        self,
        parent,
    ) -> Iterable:
        if isinstance(
            parent,
            _Document,
        ):
            parent_elm = (
                parent.element.body
            )

        elif isinstance(
            parent,
            _Cell,
        ):
            parent_elm = parent._tc

        else:
            parent_elm = parent

        for child in parent_elm.iterchildren():
            local_name = self._local_name(
                child.tag
            )

            if local_name == "p":
                yield Paragraph(
                    child,
                    parent,
                )

            elif local_name == "tbl":
                yield Table(
                    child,
                    parent,
                )

    def _contains_display_equation(
        self,
        element: ET.Element,
    ) -> bool:
        for child in element.iter():
            if (
                self._local_name(
                    child.tag
                )
                == "oMathPara"
            ):
                return True

        return False

    # ------------------------------------------------------------------
    # Formatting
    # ------------------------------------------------------------------

    def _apply_run_formatting(
        self,
        run_element: ET.Element,
        text: str,
    ) -> str:
        if not text:
            return ""

        rpr = None

        for child in list(
            run_element
        ):
            if (
                self._local_name(
                    child.tag
                )
                == "rPr"
            ):
                rpr = child
                break

        if rpr is None:
            return text

        if self._has_property(
            rpr,
            "b",
        ):
            text = (
                r"\textbf{"
                + text
                + "}"
            )

        if self._has_property(
            rpr,
            "i",
        ):
            text = (
                r"\textit{"
                + text
                + "}"
            )

        if self._has_property(
            rpr,
            "strike",
        ):
            text = (
                r"\sout{"
                + text
                + "}"
            )

        if self._has_property(
            rpr,
            "u",
        ):
            text = (
                r"\underline{"
                + text
                + "}"
            )

        if self._has_property(
            rpr,
            "smallCaps",
        ):
            text = (
                r"\textsc{"
                + text
                + "}"
            )

        vertical = self._get_property_value(
            rpr,
            "vertAlign",
        )

        if vertical == "superscript":
            text = (
                r"\textsuperscript{"
                + text
                + "}"
            )

        elif vertical == "subscript":
            text = (
                r"\textsubscript{"
                + text
                + "}"
            )

        return text

    # ------------------------------------------------------------------
    # Text / XML helpers
    # ------------------------------------------------------------------

    def _extract_all_text(
        self,
        element: ET.Element,
    ) -> List[str]:
        result: List[str] = []

        for node in element.iter():
            if (
                self._local_name(
                    node.tag
                )
                == "t"
            ):
                if node.text:
                    result.append(
                        node.text
                    )

        return result

    def _convert_children_textual(
        self,
        element: ET.Element,
    ) -> str:
        return self._escape_latex(
            "".join(
                self._extract_all_text(
                    element
                )
            )
        )

    def _has_property(
        self,
        parent: ET.Element,
        local_name: str,
    ) -> bool:
        for child in list(parent):
            if (
                self._local_name(
                    child.tag
                )
                != local_name
            ):
                continue

            value = self._get_property_value(
                parent,
                local_name,
            )

            if value in {
                None,
                "",
                "1",
                "true",
                "on",
            }:
                return True

            if str(value).lower() in {
                "true",
                "on",
                "yes",
                "1",
            }:
                return True

        return False

    def _get_property_value(
        self,
        parent: Optional[ET.Element],
        local_name: str,
    ) -> Optional[str]:
        if parent is None:
            return None

        for child in parent.iter():
            if (
                self._local_name(
                    child.tag
                )
                != local_name
            ):
                continue

            for key, value in child.attrib.items():
                if (
                    self._local_name(
                        key
                    )
                    == "val"
                ):
                    return value

            return child.text

        return None

    def _get_relationship_attribute(
        self,
        element: ET.Element,
        local_name: str,
    ) -> Optional[str]:
        direct = element.get(
            f"{{{self.REL_NS}}}{local_name}"
        )

        if direct:
            return direct

        direct = element.get(
            local_name
        )

        if direct:
            return direct

        for key, value in element.attrib.items():
            if (
                self._local_name(key)
                == local_name
            ):
                return value

        return None

    # ------------------------------------------------------------------
    # Conversion options
    # ------------------------------------------------------------------

    def _get_option(
        self,
        name: str,
        default,
    ):
        direct = self._get_conversion_value(
            name,
            None,
        )

        if direct is not None:
            return direct

        options = self._get_conversion_value(
            "options",
            None,
        )

        if isinstance(
            options,
            dict,
        ):
            return options.get(
                name,
                default,
            )

        return default

    def _get_bool_option(
        self,
        name: str,
        default: bool,
    ) -> bool:
        value = self._get_option(
            name,
            default,
        )

        if isinstance(
            value,
            bool,
        ):
            return value

        if isinstance(
            value,
            str,
        ):
            return (
                value.strip().lower()
                in {
                    "1",
                    "true",
                    "yes",
                    "on",
                }
            )

        return bool(value)

    def _get_conversion_value(
        self,
        name: str,
        default,
    ):
        if self.conversion is None:
            return default

        if isinstance(
            self.conversion,
            dict,
        ):
            return self.conversion.get(
                name,
                default,
            )

        value = getattr(
            self.conversion,
            name,
            None,
        )

        if value is not None:
            return value

        options = getattr(
            self.conversion,
            "options",
            None,
        )

        if isinstance(
            options,
            dict,
        ):
            return options.get(
                name,
                default,
            )

        return default

    # ------------------------------------------------------------------
    # LaTeX escaping
    # ------------------------------------------------------------------

    @staticmethod
    def _escape_latex(
        value: str,
    ) -> str:
        if value is None:
            return ""

        value = str(value)

        if not value:
            return ""

        replacements = {
            "\\": r"\textbackslash{}",
            "&": r"\&",
            "%": r"\%",
            "$": r"\$",
            "#": r"\#",
            "_": r"\_",
            "{": r"\{",
            "}": r"\}",
            "~": r"\textasciitilde{}",
            "^": r"\textasciicircum{}",
        }

        return replace_latex_symbols("".join(
            replacements.get(
                char,
                char,
            )
            for char in value
        ))

    @staticmethod
    def _escape_url(
        value: str,
    ) -> str:
        if not value:
            return ""

        value = str(value)

        value = (
            value.replace(
                "\\",
                r"\textbackslash{}",
            )
            .replace(
                "{",
                r"\{",
            )
            .replace(
                "}",
                r"\}",
            )
            .replace(
                " ",
                "%20",
            )
            .replace(
                "#",
                r"\#",
            )
        )

        return value

    # ------------------------------------------------------------------
    # Option sanitization
    # ------------------------------------------------------------------

    @staticmethod
    def _sanitize_document_class(
        value: str,
    ) -> str:
        value = str(
            value or "report"
        ).strip().lower()

        allowed = {
            "article",
            "report",
            "book",
        }

        return (
            value
            if value in allowed
            else "report"
        )

    @staticmethod
    def _sanitize_font_size(
        value: str,
    ) -> str:
        value = str(
            value or "11pt"
        ).strip().lower()

        allowed = {
            "10pt",
            "11pt",
            "12pt",
        }

        return (
            value
            if value in allowed
            else "11pt"
        )

    @staticmethod
    def _sanitize_margin(
        value: str,
    ) -> str:
        value = str(
            value or "2.5cm"
        ).strip()

        if re.fullmatch(
            r"\d+(?:\.\d+)?"
            r"(?:cm|mm|in|pt|em|ex)",
            value,
            re.IGNORECASE,
        ):
            return value

        return "2.5cm"

    @staticmethod
    def _safe_output_filename(
        filename: str,
        default_extension: str = "",
    ) -> str:
        name = Path(
            str(filename)
        ).name

        if not name:
            name = "file"

        name = re.sub(
            r"[^A-Za-z0-9._-]+",
            "_",
            name,
        )

        if (
            default_extension
            and not Path(name).suffix
        ):
            name += default_extension

        return name

    @staticmethod
    def _is_external_url(
        value: str,
    ) -> bool:
        value = str(
            value or ""
        ).strip().lower()

        return (
            value.startswith("http://")
            or value.startswith("https://")
            or value.startswith("mailto:")
            or value.startswith("ftp://")
        )

    # ------------------------------------------------------------------
    # File output
    # ------------------------------------------------------------------

    def _write_latex_file(
        self,
        latex: str,
    ) -> None:
        output = (
            self.output_directory
            / "document.tex"
        )

        output.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        output.write_text(
            latex,
            encoding="utf-8",
        )

    def _update_conversion_statistics(
        self,
        latex: str,
    ) -> None:
        if self.conversion is None:
            return

        try:
            self.conversion.latex_code = latex

            self.conversion.latex_lines_count = (
                len(
                    latex.splitlines()
                )
            )

            if hasattr(
                self.conversion,
                "save",
            ):
                self.conversion.save(
                    update_fields=[
                        "latex_code",
                        "latex_lines_count",
                    ]
                )

        except Exception:
            return

    # ------------------------------------------------------------------
    # Cleanup / normalization
    # ------------------------------------------------------------------

    @staticmethod
    def _clean_generated_latex(
        latex: str,
    ) -> str:
        latex = latex.replace(
            "\r\n",
            "\n",
        )

        latex = latex.replace(
            "\r",
            "\n",
        )

        # Remove only accidental Markdown emphasis markers.
        # Do not attempt aggressive LaTeX rewriting here.
        latex = latex.replace(
            "**",
            "",
        )

        latex = re.sub(
            r"[ \t]+\n",
            "\n",
            latex,
        )

        latex = re.sub(
            r"\n{4,}",
            "\n\n\n",
            latex,
        )

        return latex.strip()

    # ------------------------------------------------------------------
    # Utility helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _local_name(
        tag: str,
    ) -> str:
        if not tag:
            return ""

        if "}" in tag:
            return tag.rsplit(
                "}",
                1,
            )[-1]

        if ":" in tag:
            return tag.rsplit(
                ":",
                1,
            )[-1]

        return tag

    @staticmethod
    def _deduplicate_preserve_order(
        values: List[str],
    ) -> List[str]:
        seen = set()
        result: List[str] = []

        for value in values:
            normalized = str(
                value
            ).strip()

            if not normalized:
                continue

            if normalized in seen:
                continue

            seen.add(
                normalized
            )

            result.append(
                normalized
            )

        return result

    # ------------------------------------------------------------------
    # Compatibility / bibliography helpers
    # ------------------------------------------------------------------

    def _extract_bibliography_files(
        self,
    ) -> None:
        self._embedded_bib_files = []

        try:
            with zipfile.ZipFile(
                self.document_path,
                "r",
            ) as archive:
                used_names: Set[str] = set()

                for filename in archive.namelist():
                    if not filename.lower().endswith(
                        ".bib"
                    ):
                        continue

                    try:
                        data = archive.read(
                            filename
                        )

                    except KeyError:
                        continue

                    base_name = Path(
                        filename
                    ).name

                    safe_name = (
                        self._safe_output_filename(
                            base_name,
                            ".bib",
                        )
                    )

                    stem = Path(
                        safe_name
                    ).stem

                    suffix = Path(
                        safe_name
                    ).suffix

                    candidate = safe_name
                    index = 2

                    while candidate in used_names:
                        candidate = (
                            f"{stem}_{index}"
                            f"{suffix}"
                        )
                        index += 1

                    used_names.add(
                        candidate
                    )

                    output = (
                        self.output_directory
                        / candidate
                    )

                    output.write_bytes(
                        data
                    )

                    self._embedded_bib_files.append(
                        output
                    )

        except (
            zipfile.BadZipFile,
            OSError,
        ):
            return
