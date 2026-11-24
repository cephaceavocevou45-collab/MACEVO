
"""
==========================================================
MACEVO IA
LaTeX Exporter
==========================================================

Générateur professionnel de documents scientifiques LaTeX.

Source unique :
    DocumentStructure

Fonctionnalités :
- Page de couverture
- Métadonnées
- Résumé
- Mots-clés
- Table des matières
- Chapitres
- Sections
- Sous-sections
- Paragraphes
- Tableaux
- Figures / images
- Légendes
- Bibliographie
- Annexes
- DOI / URL
- Échappement LaTeX
- UTF-8
- Document .tex autonome
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

from .document_structure import (
    DocumentChapter,
    DocumentFigure,
    DocumentReference,
    DocumentSection,
    DocumentStructure,
    DocumentTable,
)


logger = logging.getLogger(__name__)


class LatexExporter:
    """
    Exporte un DocumentStructure au format LaTeX.

    Le document produit est autonome et peut être compilé
    avec pdflatex, xelatex ou lualatex.
    """

    format_name = "latex"
    extension = ".tex"

    def __init__(
        self,
        document: DocumentStructure,
        output_path: str | Path | None = None,
    ) -> None:
        if not isinstance(document, DocumentStructure):
            raise TypeError(
                "LatexExporter attend un DocumentStructure."
            )

        self.document = document

        self.output_path = (
            Path(output_path)
            if output_path is not None
            else None
        )

    # ======================================================
    # UTILITAIRES
    # ======================================================

    @staticmethod
    def _text(value: Any) -> str:
        """Convertit une valeur en texte propre."""
        if value is None:
            return ""

        if isinstance(value, (list, tuple, set)):
            return ", ".join(
                str(item)
                for item in value
                if item is not None
            ).strip()

        return str(value).strip()

    @staticmethod
    def _escape(text: Any) -> str:
        """
        Protège le texte normal pour LaTeX.

        Cette méthode ne doit jamais être appliquée à du
        code LaTeX déjà généré.
        """
        if text is None:
            return ""

        text = str(text)

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

        return "".join(
            replacements.get(char, char)
            for char in text
        )

    @staticmethod
    def _escape_url(url: Any) -> str:
        """
        Prépare une URL pour utilisation avec \\url{}.
        """
        if not url:
            return ""

        return (
            str(url)
            .replace("\\", "/")
            .replace(" ", "%20")
        )

    @staticmethod
    def _split_paragraphs(
        content: Any,
    ) -> list[str]:
        """Sépare un contenu textuel en paragraphes."""
        if not content:
            return []

        return [
            paragraph.strip()
            for paragraph in re.split(
                r"\n\s*\n+",
                str(content),
            )
            if paragraph.strip()
        ]

    @staticmethod
    def _as_list(value: Any) -> list[str]:
        """Transforme les mots-clés en liste."""
        if value is None:
            return []

        if isinstance(value, (list, tuple, set)):
            return [
                str(item).strip()
                for item in value
                if str(item).strip()
            ]

        return [
            item.strip()
            for item in str(value).split(",")
            if item.strip()
        ]

    @staticmethod
    def _safe_int(
        value: Any,
        default: int = 1,
    ) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    # ======================================================
    # PRÉAMBULE
    # ======================================================

    def _build_preamble(
        self,
        document: DocumentStructure,
    ) -> str:
        metadata = document.metadata or {}

        title = self._escape(
            metadata.get(
                "title",
                "Document scientifique",
            )
        )

        author = self._escape(
            metadata.get(
                "author",
                "",
            )
        )

        language = str(
            metadata.get(
                "language",
                "fr",
            )
        ).lower().strip()

        if language.startswith("en"):
            babel_language = "english"
        else:
            babel_language = "french"

        lines = [
            r"\documentclass[12pt,a4paper]{report}",
            "",
            "% =====================================================",
            "% MACEVO IA - Préambule LaTeX",
            "% =====================================================",
            "",
            r"\usepackage[T1]{fontenc}",
            r"\usepackage[utf8]{inputenc}",
            r"\usepackage[french,english]{babel}",
            r"\usepackage{lmodern}",
            r"\usepackage{microtype}",
            r"\usepackage{geometry}",
            r"\usepackage{setspace}",
            r"\usepackage{graphicx}",
            r"\usepackage{float}",
            r"\usepackage{array}",
            r"\usepackage{longtable}",
            r"\usepackage{booktabs}",
            r"\usepackage{caption}",
            r"\usepackage{hyperref}",
            # `url` est fourni avec MiKTeX/TeX Live de base. `xurl`
            # n'est pas installé par défaut sur toutes les machines et
            # empêchait la compilation autonome des exports.
            r"\usepackage{url}",
            r"\usepackage{fancyhdr}",
            r"\usepackage{titlesec}",
            r"\usepackage{enumitem}",
            r"\usepackage{csquotes}",
            "",
            r"\geometry{",
            "    top=2.5cm,",
            "    bottom=2.3cm,",
            "    left=2.5cm,",
            "    right=2.5cm",
            "}",
            "",
            r"\onehalfspacing",
            "",
            r"\setlength{\parindent}{0.5cm}",
            r"\setlength{\parskip}{0.25em}",
            "",
            r"\captionsetup{font=small,labelfont=bf}",
            "",
            r"\hypersetup{",
            "    colorlinks=true,",
            "    linkcolor=black,",
            "    citecolor=black,",
            "    urlcolor=blue,",
            f"    pdftitle={{{title}}},",
            f"    pdfauthor={{{author}}}",
            "}",
            "",
            r"\pagestyle{fancy}",
            r"\fancyhf{}",
            r"\lhead{\small MACEVO IA}",
            r"\rhead{\small\leftmark}",
            r"\cfoot{\small\thepage}",
            r"\renewcommand{\headrulewidth}{0.4pt}",
            r"\renewcommand{\footrulewidth}{0pt}",
            "",
            r"\titleformat{\chapter}",
            r"  {\normalfont\bfseries\LARGE}",
            r"  {\thechapter}",
            r"  {1em}",
            r"  {}",
            "",
            r"\titleformat{\section}",
            r"  {\normalfont\bfseries\Large}",
            r"  {\thesection}",
            r"  {1em}",
            r"  {}",
            "",
            r"\titleformat{\subsection}",
            r"  {\normalfont\bfseries\normalsize}",
            r"  {\thesubsection}",
            r"  {1em}",
            r"  {}",
            "",
            rf"\selectlanguage{{{babel_language}}}",
            "",
        ]

        return "\n".join(lines)

    # ======================================================
    # COUVERTURE
    # ======================================================

    def _build_cover(
        self,
        document: DocumentStructure,
    ) -> str:
        metadata = document.metadata or {}
        cover = document.cover or {}

        title = (
            cover.get("title")
            or metadata.get("title")
            or "Document scientifique"
        )

        subject = (
            cover.get("subject")
            or metadata.get("subject")
            or ""
        )

        author = (
            cover.get("author")
            or metadata.get("author")
            or ""
        )

        level = (
            cover.get("level")
            or metadata.get("level")
            or ""
        )

        project_type = (
            cover.get("project_type")
            or metadata.get("project_type")
            or ""
        )

        institution = (
            cover.get("institution")
            or metadata.get("institution")
            or ""
        )

        department = (
            cover.get("department")
            or metadata.get("department")
            or ""
        )

        supervisor = (
            cover.get("supervisor")
            or metadata.get("supervisor")
            or ""
        )

        academic_year = (
            cover.get("academic_year")
            or metadata.get("academic_year")
            or ""
        )

        lines = [
            r"\begin{titlepage}",
            r"\centering",
            "",
            r"\vspace*{1.5cm}",
            "",
            r"{\Large\bfseries MACEVO IA\par}",
            "",
            r"\vspace{1.2cm}",
            "",
            r"\rule{0.7\textwidth}{0.5pt}",
            "",
            r"\vspace{1.2cm}",
            "",
            rf"{{\Huge\bfseries {self._escape(title)}\par}}",
            "",
        ]

        if subject:
            lines.extend(
                [
                    r"\vspace{0.8cm}",
                    rf"{{\Large {self._escape(subject)}\par}}",
                    "",
                ]
            )

        lines.extend(
            [
                r"\vfill",
            ]
        )

        metadata_rows = [
            ("Auteur", author),
            ("Niveau", level),
            ("Type", project_type),
            ("Institution", institution),
            ("Département", department),
            ("Encadreur", supervisor),
        ]

        for label, value in metadata_rows:
            if value:
                lines.extend(
                    [
                        rf"{{\large\textbf{{{self._escape(label)} :}} "
                        rf"{self._escape(value)}\par}}",
                        r"\vspace{0.25cm}",
                    ]
                )

        if academic_year:
            lines.extend(
                [
                    r"\vspace{0.5cm}",
                    rf"{{\large {self._escape(academic_year)}\par}}",
                ]
            )

        lines.extend(
            [
                "",
                r"\vfill",
                r"{\small Document scientifique généré par MACEVO IA\par}",
                "",
                r"\end{titlepage}",
                "",
            ]
        )

        return "\n".join(lines)

    # ======================================================
    # RÉSUMÉ
    # ======================================================

    def _build_abstract(
        self,
        document: DocumentStructure,
    ) -> str:
        abstract = self._text(
            document.abstract
        )

        keywords = self._as_list(
            document.keywords
        )

        lines = [
            r"\chapter*{Résumé}",
            r"\addcontentsline{toc}{chapter}{Résumé}",
            "",
        ]

        for paragraph in self._split_paragraphs(
            abstract
        ):
            lines.extend(
                [
                    self._escape(paragraph),
                    "",
                ]
            )

        if keywords:
            lines.extend(
                [
                    r"\vspace{0.5cm}",
                    r"\noindent\textbf{Mots-clés :} "
                    + self._escape(
                        ", ".join(keywords)
                    ),
                    "",
                ]
            )

        lines.extend(
            [
                r"\clearpage",
                "",
            ]
        )

        return "\n".join(lines)

    # ======================================================
    # TABLE DES MATIÈRES
    # ======================================================

    @staticmethod
    def _build_toc() -> str:
        return "\n".join(
            [
                r"\tableofcontents",
                r"\clearpage",
                "",
            ]
        )

    # ======================================================
    # PARAGRAPHES
    # ======================================================

    def _build_paragraphs(
        self,
        content: Any,
    ) -> str:
        if not content:
            return ""

        lines = []

        for paragraph in self._split_paragraphs(
            content
        ):
            lines.extend(
                [
                    self._escape(paragraph),
                    "",
                ]
            )

        return "\n".join(lines)

    # ======================================================
    # SECTIONS
    # ======================================================

    def _build_section(
        self,
        section: DocumentSection,
    ) -> str:
        lines = []

        title = self._text(
            getattr(section, "title", "")
        )

        if title:
            lines.extend(
                [
                    r"\section{"
                    + self._escape(title)
                    + r"}",
                    "",
                ]
            )

        content = self._text(
            getattr(section, "content", "")
        )

        if content:
            lines.append(
                self._build_paragraphs(content)
            )

        subsections = (
            getattr(section, "subsections", None)
            or []
        )

        for subsection in subsections:
            lines.append(
                self._build_subsection(
                    subsection
                )
            )

        return "\n".join(lines)

    # ======================================================
    # SOUS-SECTIONS
    # ======================================================

    def _build_subsection(
        self,
        subsection: DocumentSection,
    ) -> str:
        lines = []

        title = self._text(
            getattr(subsection, "title", "")
        )

        if title:
            lines.extend(
                [
                    r"\subsection{"
                    + self._escape(title)
                    + r"}",
                    "",
                ]
            )

        content = self._text(
            getattr(subsection, "content", "")
        )

        if content:
            lines.append(
                self._build_paragraphs(content)
            )

        children = (
            getattr(subsection, "subsections", None)
            or []
        )

        for child in children:
            lines.append(
                self._build_deep_section(
                    child,
                    level=3,
                )
            )

        return "\n".join(lines)

    def _build_deep_section(
        self,
        section: DocumentSection,
        level: int,
    ) -> str:
        commands = {
            3: r"\subsubsection",
            4: r"\paragraph",
            5: r"\subparagraph",
        }

        command = commands.get(
            min(level, 5),
            r"\subparagraph",
        )

        lines = []

        title = self._text(
            getattr(section, "title", "")
        )

        if title:
            lines.extend(
                [
                    command
                    + "{"
                    + self._escape(title)
                    + "}",
                    "",
                ]
            )

        content = self._text(
            getattr(section, "content", "")
        )

        if content:
            lines.append(
                self._build_paragraphs(content)
            )

        children = (
            getattr(section, "subsections", None)
            or []
        )

        for child in children:
            lines.append(
                self._build_deep_section(
                    child,
                    min(level + 1, 5),
                )
            )

        return "\n".join(lines)

    # ======================================================
    # CHAPITRES
    # ======================================================

    def _build_chapters(
        self,
        document: DocumentStructure,
    ) -> str:
        lines = []

        for index, chapter in enumerate(
            document.chapters or [],
            start=1,
        ):
            title = self._text(
                getattr(chapter, "title", "")
            )

            if not title:
                title = f"Chapitre {index}"

            lines.extend(
                [
                    r"\chapter{"
                    + self._escape(title)
                    + r"}",
                    "",
                ]
            )

            content = self._text(
                getattr(chapter, "content", "")
            )

            if content:
                lines.append(
                    self._build_paragraphs(
                        content
                    )
                )

            sections = (
                getattr(chapter, "sections", None)
                or []
            )

            for section in sections:
                lines.append(
                    self._build_section(
                        section
                    )
                )

            lines.append("")

        return "\n".join(lines)

    # ======================================================
    # TABLEAUX
    # ======================================================

    def _build_table(
        self,
        table_data: DocumentTable,
        index: int,
    ) -> str:
        headers = (
            getattr(table_data, "headers", None)
            or []
        )

        rows = (
            getattr(table_data, "rows", None)
            or []
        )

        if not headers and not rows:
            return ""

        normalized_rows = []

        for row in rows:
            if isinstance(row, (list, tuple)):
                normalized_rows.append(
                    list(row)
                )
            else:
                normalized_rows.append(
                    [row]
                )

        column_count = len(headers)

        if column_count == 0:
            column_count = max(
                (
                    len(row)
                    for row in normalized_rows
                    if row
                ),
                default=0,
            )

        if column_count <= 0:
            return ""

        title = (
            self._text(
                getattr(table_data, "title", "")
            )
            or f"Tableau {index}"
        )

        caption = self._text(
            getattr(table_data, "caption", "")
        )

        if caption:
            title = f"{title} — {caption}"

        # tabularx permet une meilleure gestion
        # des tableaux larges.
        column_spec = (
            r"|" + "|".join(
                r"p{0.9\textwidth/"
                + str(column_count)
                + "}"
                for _ in range(column_count)
            ) + "|"
        )

        # Le calcul précédent peut être trop restrictif
        # selon le moteur LaTeX. On utilise donc une
        # définition simple et robuste.
        column_spec = (
            "|" + "|".join(
                "l"
                for _ in range(column_count)
            ) + "|"
        )

        lines = [
            r"\begin{table}[H]",
            r"\centering",
            r"\caption{"
            + self._escape(title)
            + r"}",
            "",
            r"\begin{tabular}{"
            + column_spec
            + r"}",
            r"\hline",
        ]

        if headers:
            header_values = [
                self._escape(cell)
                for cell in headers
            ]

            header_values = (
                header_values[:column_count]
                + [""] * max(
                    0,
                    column_count - len(header_values),
                )
            )

            lines.append(
                " & ".join(header_values)
                + r" \\"
            )

            lines.append(
                r"\hline"
            )

        for row in normalized_rows:
            values = [
                self._escape(cell)
                for cell in row[:column_count]
            ]

            values += [
                ""
            ] * max(
                0,
                column_count - len(values),
            )

            lines.append(
                " & ".join(values)
                + r" \\"
            )

        lines.extend(
            [
                r"\hline",
                r"\end{tabular}",
                r"\end{table}",
                "",
            ]
        )

        return "\n".join(lines)

    def _build_tables(
        self,
        document: DocumentStructure,
    ) -> str:
        lines = []

        for index, table_data in enumerate(
            document.tables or [],
            start=1,
        ):
            table = self._build_table(
                table_data,
                index,
            )

            if table:
                lines.append(table)

        return "\n".join(lines)

    # ======================================================
    # FIGURES
    # ======================================================

    def _build_figure(
        self,
        figure_data: DocumentFigure,
        index: int,
    ) -> str:
        image_path = self._text(
            getattr(figure_data, "path", "")
        )

        if not image_path:
            return ""

        image_path = image_path.replace(
            "\\",
            "/",
        )

        title = (
            self._text(
                getattr(
                    figure_data,
                    "caption",
                    "",
                )
            )
            or self._text(
                getattr(
                    figure_data,
                    "title",
                    "",
                )
            )
            or f"Figure {index}"
        )

        return "\n".join(
            [
                r"\begin{figure}[H]",
                r"\centering",
                r"\includegraphics[width=0.85\textwidth]{"
                + image_path
                + r"}",
                r"\caption{"
                + self._escape(title)
                + r"}",
                r"\end{figure}",
                "",
            ]
        )

    def _build_figures(
        self,
        document: DocumentStructure,
    ) -> str:
        lines = []

        for index, figure_data in enumerate(
            document.figures or [],
            start=1,
        ):
            figure = self._build_figure(
                figure_data,
                index,
            )

            if figure:
                lines.append(figure)

        return "\n".join(lines)

    # ======================================================
    # BIBLIOGRAPHIE
    # ======================================================

    def _build_bibliography(
        self,
        document: DocumentStructure,
    ) -> str:
        references = (
            document.references
            or []
        )

        if not references:
            return ""

        lines = [
            r"\begin{thebibliography}{99}",
            "",
        ]

        for index, reference in enumerate(
            references,
            start=1,
        ):
            author = self._text(
                getattr(
                    reference,
                    "author",
                    "",
                )
            )

            title = self._text(
                getattr(
                    reference,
                    "title",
                    "",
                )
            )

            year = self._text(
                getattr(
                    reference,
                    "year",
                    "",
                )
            )

            publisher = self._text(
                getattr(
                    reference,
                    "publisher",
                    "",
                )
            )

            doi = self._text(
                getattr(
                    reference,
                    "doi",
                    "",
                )
            )

            url = self._text(
                getattr(
                    reference,
                    "url",
                    "",
                )
            )

            parts = []

            if author:
                parts.append(
                    self._escape(author)
                )

            if title:
                parts.append(
                    r"\textit{"
                    + self._escape(title)
                    + r"}"
                )

            if year:
                parts.append(
                    "("
                    + self._escape(year)
                    + ")"
                )

            if publisher:
                parts.append(
                    self._escape(publisher)
                )

            text = ". ".join(parts)

            if not text:
                text = (
                    "Référence bibliographique"
                )

            lines.append(
                rf"\bibitem{{ref{index}}} "
                + text
                + "."
            )

            if doi:
                lines.append(
                    r"\newline DOI : \url{"
                    + self._escape_url(doi)
                    + "}"
                )

            if url:
                lines.append(
                    r"\newline \url{"
                    + self._escape_url(url)
                    + "}"
                )

            lines.append("")

        lines.extend(
            [
                r"\end{thebibliography}",
                "",
            ]
        )

        return "\n".join(lines)

    # ======================================================
    # ANNEXES
    # ======================================================

    def _build_appendices(
        self,
        document: DocumentStructure,
    ) -> str:
        appendices = (
            document.appendices
            or []
        )

        if not appendices:
            return ""

        lines = [
            r"\appendix",
            "",
        ]

        for index, appendix in enumerate(
            appendices,
            start=1,
        ):
            title = self._text(
                getattr(
                    appendix,
                    "title",
                    "",
                )
            )

            if not title:
                title = f"Annexe {index}"

            lines.extend(
                [
                    r"\chapter{"
                    + self._escape(title)
                    + r"}",
                    "",
                ]
            )

            content = self._text(
                getattr(
                    appendix,
                    "content",
                    "",
                )
            )

            if content:
                lines.append(
                    self._build_paragraphs(
                        content
                    )
                )

            sections = (
                getattr(
                    appendix,
                    "sections",
                    None,
                )
                or []
            )

            for section in sections:
                lines.append(
                    self._build_section(
                        section
                    )
                )

        return "\n".join(lines)

    # ======================================================
    # DOCUMENT COMPLET
    # ======================================================

    def _build_document(
        self,
        document: DocumentStructure,
    ) -> str:
        metadata = (
            document.metadata
            or {}
        )

        title = (
            metadata.get(
                "title",
                "Document scientifique",
            )
        )

        author = (
            metadata.get(
                "author",
                "MACEVO IA",
            )
        )

        parts = [
            self._build_preamble(document),
            "",
            r"\begin{document}",
            "",
            r"\title{"
            + self._escape(title)
            + r"}",
            r"\author{"
            + self._escape(author)
            + r"}",
            r"\date{}",
            "",
            self._build_cover(document),
            self._build_abstract(document),
            self._build_toc(),
            self._build_chapters(document),
        ]

        tables = self._build_tables(
            document
        )

        if tables:
            parts.extend(
                [
                    r"\chapter*{Tableaux}",
                    r"\addcontentsline{toc}{chapter}{Tableaux}",
                    "",
                    tables,
                ]
            )

        figures = self._build_figures(
            document
        )

        if figures:
            parts.extend(
                [
                    r"\chapter*{Figures}",
                    r"\addcontentsline{toc}{chapter}{Figures}",
                    "",
                    figures,
                ]
            )

        bibliography = self._build_bibliography(
            document
        )

        if bibliography:
            parts.append(
                bibliography
            )

        appendices = self._build_appendices(
            document
        )

        if appendices:
            parts.append(
                appendices
            )

        parts.extend(
            [
                "",
                r"\end{document}",
                "",
            ]
        )

        return "\n".join(
            part
            for part in parts
            if part is not None
        )

    # ======================================================
    # EXPORT
    # ======================================================

    def _resolve_output_path(
        self,
        output_path: str | Path | None,
    ) -> Path:
        path = (
            Path(output_path)
            if output_path is not None
            else self.output_path
        )

        if path is None:
            title = self._text(
                self.document.metadata.get(
                    "title",
                    "document",
                )
            )

            path = Path(
                self._slugify(title)
                + self.extension
            )

        elif path.suffix.lower() != self.extension:
            if path.exists() and path.is_dir():
                title = self._text(
                    self.document.metadata.get(
                        "title",
                        "document",
                    )
                )

                path = path / (
                    self._slugify(title)
                    + self.extension
                )
            else:
                path = path.with_suffix(
                    self.extension
                )

        return path

    def export(
        self,
        output_path: str | Path | None = None,
    ) -> str:
        """
        Génère le fichier .tex.

        Compatible avec :

            LatexExporter(document).export()

        ou :

            LatexExporter(
                document,
                "rapport.tex"
            ).export()
        """
        output = self._resolve_output_path(
            output_path
        )

        output.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        latex_content = self._build_document(
            self.document
        )

        output.write_text(
            latex_content,
            encoding="utf-8",
            newline="\n",
        )

        logger.info(
            "Export LaTeX terminé : %s",
            output,
        )

        return str(output)

    def render(self) -> str:
        """Retourne le LaTeX sans écrire de fichier."""
        return self._build_document(
            self.document
        )

    # ======================================================
    # UTILITAIRES DE CLASSE
    # ======================================================

    @staticmethod
    def _slugify(value: str) -> str:
        import unicodedata

        value = unicodedata.normalize(
            "NFKD",
            value,
        )

        value = "".join(
            char
            for char in value
            if not unicodedata.combining(char)
        )

        value = value.lower()

        value = re.sub(
            r"[^a-z0-9]+",
            "-",
            value,
        )

        value = value.strip("-")

        return value or "document"


# ==========================================================
# COMPATIBILITÉ AVEC LES ANCIENS IMPORTS
# ==========================================================

LaTeXExporter = LatexExporter
