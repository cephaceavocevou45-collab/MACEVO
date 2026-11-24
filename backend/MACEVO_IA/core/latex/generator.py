"""
MACEVO — Générateur LaTeX.

Transforme le Document IR de MACEVO en un document LaTeX
autonome, structuré et compilable.

Entrée :
    core.document.ir.Document

Sortie :
    chaîne LaTeX UTF-8

Le générateur ne compile pas le document.
La compilation sera gérée séparément par core/latex/compiler.py.
"""

from __future__ import annotations

import re
from typing import Any, Iterable, List, Optional


class LaTeXGenerationError(Exception):
    """Erreur pendant la génération LaTeX."""


class LaTeXGenerator:
    """
    Générateur LaTeX principal de MACEVO.

    Compatible avec le Document IR actuel :

        Document
        ├── metadata
        ├── abstract
        ├── keywords
        ├── sections
        ├── references
        └── annexes
    """

    VERSION = "1.1.0"

    def __init__(
        self,
        *,
        compiler: str = "xelatex",
        document_class: str = "report",
        language: str = "french",
        font_size: str = "12pt",
        geometry: str = "margin=2.5cm",
        bibliography_file: str = "references.bib",
    ):
        self.compiler = compiler
        self.document_class = document_class
        self.language = language
        self.font_size = font_size
        self.geometry = geometry
        self.bibliography_file = bibliography_file or "references.bib"

    # ======================================================================
    # API PUBLIQUE
    # ======================================================================

    def generate(self, document: Any) -> str:
        """
        Transforme un Document IR en code LaTeX complet.
        """

        if document is None:
            raise LaTeXGenerationError(
                "Le document fourni est vide."
            )

        try:
            parts: List[str] = []

            parts.append(self._build_preamble(document))
            parts.append(self._build_document_start())

            parts.append(self._build_cover(document))
            parts.append(self._build_front_matter(document))

            sections = getattr(
                document,
                "sections",
                [],
            ) or []

            if sections:
                parts.append(
                    self._build_sections(
                        sections
                    )
                )

            references = getattr(
                document,
                "references",
                [],
            ) or []

            if references:
                parts.append(
                    self._build_bibliography(
                        references
                    )
                )

            annexes = getattr(
                document,
                "annexes",
                [],
            ) or []

            if annexes:
                parts.append(
                    self._build_annexes(
                        annexes
                    )
                )

            parts.append(
                self._build_document_end()
            )

            latex = "\n".join(
                part
                for part in parts
                if part
            )

            return latex.strip() + "\n"

        except LaTeXGenerationError:
            raise

        except Exception as exc:
            raise LaTeXGenerationError(
                f"Erreur pendant la génération LaTeX : {exc}"
            ) from exc

    # ======================================================================
    # PRÉAMBULE
    # ======================================================================

    def _build_preamble(
        self,
        document: Any,
    ) -> str:
        metadata = getattr(
            document,
            "metadata",
            None,
        )

        language = (
            getattr(
                metadata,
                "language",
                None,
            )
            or self.language
        )

        return rf"""\documentclass[{self.font_size}]{{{self.document_class}}}

% ============================================================
% MACEVO — Préambule scientifique
% ============================================================

\usepackage{{fontspec}}
\usepackage{{polyglossia}}
\setmainlanguage{{{self._latex_language(language)}}}

\usepackage{{geometry}}
\geometry{{{self.geometry}}}

\usepackage{{amsmath}}
\usepackage{{amssymb}}
\usepackage{{mathtools}}

\usepackage{{graphicx}}
\usepackage{{float}}
\usepackage{{booktabs}}
\usepackage{{longtable}}
\usepackage{{array}}

\usepackage{{xcolor}}
\usepackage{{hyperref}}
\usepackage{{url}}
\usepackage{{microtype}}
\usepackage{{setspace}}
\usepackage{{caption}}
\usepackage{{enumitem}}

\usepackage{{fancyhdr}}
\usepackage{{titlesec}}

\usepackage{{csquotes}}

\usepackage[
    backend=biber,
    style=apa,
    sorting=nyt
]{{biblatex}}

\addbibresource{{{self._escape_bib_resource(self.bibliography_file)}}}

\usepackage{{bookmark}}

% ============================================================
% Configuration
% ============================================================

\hypersetup{{
    colorlinks=true,
    linkcolor=blue,
    citecolor=blue,
    urlcolor=blue,
    pdftitle={{{self._metadata_title(document)}}},
    pdfauthor={{{self._metadata_author(document)}}}
}}

\setstretch{{1.5}}

\setlength{{\parindent}}{{1.25cm}}
\setlength{{\parskip}}{{0.4em}}

\pagestyle{{fancy}}
\fancyhf{{}}
\fancyfoot[C]{{\thepage}}
\renewcommand{{\headrulewidth}}{{0pt}}

% ============================================================
% Commandes MACEVO
% ============================================================

\newcommand{{\MACEVOTitle}}{{{self._metadata_title(document)}}}
\newcommand{{\MACEVOAuthor}}{{{self._metadata_author(document)}}}
\newcommand{{\MACEVOInstitution}}{{{self._metadata_institution(document)}}}

\begin{{document}}
"""

    # ======================================================================
    # DÉBUT / FIN DOCUMENT
    # ======================================================================

    def _build_document_start(self) -> str:
        return r"""
% ============================================================
% Début du document MACEVO
% ============================================================
"""

    def _build_document_end(self) -> str:
        return r"""
% ============================================================
% Fin du document MACEVO
% ============================================================

\end{document}
"""

    # ======================================================================
    # PAGE DE GARDE
    # ======================================================================

    def _build_cover(
        self,
        document: Any,
    ) -> str:
        metadata = getattr(
            document,
            "metadata",
            None,
        )

        title = self._escape_latex(
            getattr(
                metadata,
                "title",
                "",
            )
            if metadata
            else ""
        )

        subtitle = self._escape_latex(
            getattr(
                metadata,
                "subtitle",
                "",
            )
            if metadata
            else ""
        )

        author = self._escape_latex(
            getattr(
                metadata,
                "author",
                "",
            )
            if metadata
            else ""
        )

        institution = self._escape_latex(
            getattr(
                metadata,
                "institution",
                "",
            )
            if metadata
            else ""
        )

        department = self._escape_latex(
            getattr(
                metadata,
                "department",
                "",
            )
            if metadata
            else ""
        )

        supervisor = self._escape_latex(
            getattr(
                metadata,
                "supervisor",
                "",
            )
            if metadata
            else ""
        )

        year = getattr(
            metadata,
            "year",
            None,
        ) if metadata else None

        lines = [
            r"\begin{titlepage}",
            r"\centering",
            "",
            r"\vspace*{2cm}",
        ]

        if institution:
            lines.extend(
                [
                    rf"{{\Large\bfseries {institution}\par}}",
                    r"\vspace{0.5cm}",
                ]
            )

        if department:
            lines.extend(
                [
                    rf"{{\large {department}\par}}",
                    r"\vspace{2cm}",
                ]
            )

        if title:
            lines.extend(
                [
                    rf"{{\Huge\bfseries {title}\par}}",
                    r"\vspace{1cm}",
                ]
            )

        if subtitle:
            lines.extend(
                [
                    rf"{{\Large {subtitle}\par}}",
                    r"\vspace{1.5cm}",
                ]
            )

        if author:
            lines.extend(
                [
                    rf"{{\large\textbf{{Auteur :}} {author}\par}}",
                    r"\vspace{0.5cm}",
                ]
            )

        if supervisor:
            lines.extend(
                [
                    rf"{{\large\textbf{{Encadreur :}} {supervisor}\par}}",
                    r"\vspace{1cm}",
                ]
            )

        if year:
            lines.extend(
                [
                    rf"{{\large {self._escape_latex(str(year))}\par}}",
                ]
            )

        lines.extend(
            [
                r"\vfill",
                r"{\large Document scientifique généré avec MACEVO\par}",
                r"\end{titlepage}",
                r"\cleardoublepage",
            ]
        )

        return "\n".join(lines)

    # ======================================================================
    # ÉLÉMENTS PRÉLIMINAIRES
    # ======================================================================

    def _build_front_matter(
        self,
        document: Any,
    ) -> str:
        parts: List[str] = []

        abstract = getattr(
            document,
            "abstract",
            "",
        )

        keywords = getattr(
            document,
            "keywords",
            [],
        ) or []

        if abstract:
            parts.extend(
                [
                    r"\begin{abstract}",
                    self._escape_latex(
                        abstract
                    ),
                    r"\end{abstract}",
                    "",
                ]
            )

        if keywords:
            keyword_text = ", ".join(
                self._escape_latex(
                    str(keyword)
                )
                for keyword in keywords
            )

            parts.extend(
                [
                    r"\noindent\textbf{Mots-clés :} "
                    + keyword_text,
                    "",
                ]
            )

        if abstract or keywords:
            parts.append(
                r"\cleardoublepage"
            )

        parts.extend(
            [
                r"\tableofcontents",
                r"\cleardoublepage",
            ]
        )

        return "\n".join(parts)

    # ======================================================================
    # SECTIONS
    # ======================================================================

    def _build_sections(
        self,
        sections: Iterable[Any],
    ) -> str:
        parts: List[str] = []

        for section in sections:
            parts.append(
                self._build_section(
                    section
                )
            )

        return "\n".join(parts)

    def _build_section(
        self,
        section: Any,
    ) -> str:
        parts: List[str] = []

        level = int(
            getattr(
                section,
                "level",
                1,
            )
            or 1
        )

        title = getattr(
            section,
            "title",
            "",
        )

        title = self._escape_latex(
            title
        )

        command = self._section_command(
            level
        )

        if title:
            parts.append(
                rf"\{command}{{{title}}}"
            )

        # --------------------------------------------------------------
        # Paragraphes
        # --------------------------------------------------------------

        paragraphs = getattr(
            section,
            "paragraphs",
            [],
        ) or []

        for paragraph in paragraphs:
            parts.append(
                self._build_paragraph(
                    paragraph
                )
            )

        # --------------------------------------------------------------
        # Équations
        # --------------------------------------------------------------

        equations = getattr(
            section,
            "equations",
            [],
        ) or []

        for equation in equations:
            parts.append(
                self._build_equation(
                    equation
                )
            )

        # --------------------------------------------------------------
        # Figures
        # --------------------------------------------------------------

        figures = getattr(
            section,
            "figures",
            [],
        ) or []

        for figure in figures:
            parts.append(
                self._build_figure(
                    figure
                )
            )

        # --------------------------------------------------------------
        # Tableaux
        # --------------------------------------------------------------

        tables = getattr(
            section,
            "tables",
            [],
        ) or []

        for table in tables:
            parts.append(
                self._build_table(
                    table
                )
            )

        # --------------------------------------------------------------
        # Sous-sections
        # --------------------------------------------------------------

        children = getattr(
            section,
            "sections",
            [],
        ) or []

        for child in children:
            parts.append(
                self._build_section(
                    child
                )
            )

        return "\n\n".join(
            part
            for part in parts
            if part
        )

    # ======================================================================
    # PARAGRAPHES
    # ======================================================================

    def _build_paragraph(
        self,
        paragraph: Any,
    ) -> str:
        content = getattr(
            paragraph,
            "content",
            "",
        )

        if not content:
            return ""

        style = getattr(
            paragraph,
            "style",
            "body",
        )

        # Le contenu peut déjà contenir du LaTeX.
        if style == "latex":
            rendered = str(content).strip()
        else:
            rendered = self._convert_inline_content(
                str(content)
            )

        # Les citations sont désormais des objets de première classe
        # dans le Document IR. Elles sont rendues ici afin de conserver
        # une séparation nette entre :
        #
        #   Paragraph.content
        #          ↓
        #   conversion inline
        #          ↓
        #   citations structurées
        #
        # Une citation déjà présente explicitement dans le contenu
        # n'est pas ajoutée une seconde fois.
        citation_latex = self._build_paragraph_citations(
            paragraph,
            existing_content=rendered,
        )

        if citation_latex:
            rendered = f"{rendered} {citation_latex}".strip()

        return rendered

    def _build_paragraph_citations(
        self,
        paragraph: Any,
        *,
        existing_content: str = "",
    ) -> str:
        """
        Génère les commandes biblatex correspondant aux citations
        structurées du paragraphe.

        Formats supportés :

        - parenthetical → \\parencite{key}
        - narrative     → \\textcite{key}
        - textual       → \\cite{key}

        locator, prefix et suffix sont transmis à biblatex lorsque
        présents.

        La méthode accepte également des dictionnaires afin de rester
        compatible avec des documents sérialisés ou des IR intermédiaires.
        """

        citations = getattr(
            paragraph,
            "citations",
            [],
        ) or []

        if not citations:
            return ""

        rendered: List[str] = []

        for citation in citations:
            if isinstance(citation, dict):
                citation_key = str(
                    citation.get(
                        "citation_key",
                        "",
                    )
                ).strip()

                citation_type = str(
                    citation.get(
                        "citation_type",
                        "parenthetical",
                    )
                ).strip().lower()

                locator = citation.get("locator")
                prefix = citation.get("prefix")
                suffix = citation.get("suffix")
            else:
                citation_key = str(
                    getattr(
                        citation,
                        "citation_key",
                        "",
                    )
                ).strip()

                citation_type = str(
                    getattr(
                        citation,
                        "citation_type",
                        "parenthetical",
                    )
                ).strip().lower()

                locator = getattr(
                    citation,
                    "locator",
                    None,
                )

                prefix = getattr(
                    citation,
                    "prefix",
                    None,
                )

                suffix = getattr(
                    citation,
                    "suffix",
                    None,
                )

            if not citation_key:
                continue

            safe_key = self._sanitize_citation_key(
                citation_key
            )

            if not safe_key:
                continue

            # Évite les doublons lorsqu'une commande de citation
            # a déjà été écrite directement dans le contenu.
            if self._citation_exists_in_content(
                existing_content,
                safe_key,
            ):
                continue

            if citation_type in {
                "narrative",
                "textual_narrative",
                "textcite",
            }:
                command = "textcite"
            elif citation_type in {
                "textual",
                "cite",
            }:
                command = "cite"
            else:
                command = "parencite"

            locator_value = (
                self._escape_latex(str(locator))
                if locator
                else None
            )

            prefix_value = (
                self._escape_latex(str(prefix))
                if prefix
                else None
            )

            suffix_value = (
                self._escape_latex(str(suffix))
                if suffix
                else None
            )

            if prefix_value and suffix_value:
                citation_command = (
                    rf"\\{command}"
                    rf"[{prefix_value}]"
                    rf"[{suffix_value}]"
                    rf"{{{safe_key}}}"
                )
            elif prefix_value:
                citation_command = (
                    rf"\\{command}"
                    rf"[{prefix_value}]"
                    rf"{{{safe_key}}}"
                )
            elif suffix_value:
                citation_command = (
                    rf"\\{command}"
                    rf"[][]"
                    rf"{{{safe_key}}}"
                )

                # Biblatex utilise deux arguments optionnels lorsque
                # l'on souhaite fournir un suffixe seul.
                citation_command = (
                    rf"\\{command}"
                    rf"[][]"
                    rf"{{{safe_key}}}"
                )

                # Le suffixe seul est mieux représenté directement
                # dans le second argument optionnel.
                citation_command = (
                    rf"\\{command}"
                    rf"[][{suffix_value}]"
                    rf"{{{safe_key}}}"
                )
            else:
                citation_command = (
                    rf"\\{command}"
                    rf"{{{safe_key}}}"
                )

            rendered.append(
                citation_command
            )

        if not rendered:
            return ""

        return " ".join(rendered)

    def _citation_exists_in_content(
        self,
        content: str,
        citation_key: str,
    ) -> bool:
        """
        Détecte les principales commandes biblatex/citation déjà
        présentes dans le contenu.
        """

        escaped_key = re.escape(
            citation_key
        )

        pattern = (
            rf"\\(?:cite|parencite|textcite|autocite)"
            rf"(?:\[[^\]]*\]){{0,2}}"
            rf"\{{[^}}]*{escaped_key}[^}}]*\}}"
        )

        return bool(
            re.search(
                pattern,
                content or "",
            )
        )

    def _sanitize_citation_key(
        self,
        citation_key: str,
    ) -> str:
        """
        Nettoie une clé BibTeX/BibLaTeX sans la transformer
        en texte LaTeX échappé.

        Les clés doivent rester compatibles avec references.bib.
        """

        value = str(
            citation_key or ""
        ).strip()

        value = re.sub(
            r"[^a-zA-Z0-9:_\-.]",
            "",
            value,
        )

        return value

    # ======================================================================
    # ÉQUATIONS
    # ======================================================================

    def _build_equation(
        self,
        equation: Any,
    ) -> str:
        latex = getattr(
            equation,
            "latex",
            "",
        )

        if not latex:
            return ""

        label = getattr(
            equation,
            "label",
            None,
        )

        caption = getattr(
            equation,
            "caption",
            None,
        )

        parts = [
            r"\begin{equation}",
            str(latex).strip(),
        ]

        if label:
            parts.append(
                rf"\label{{{self._sanitize_label(label)}}}"
            )

        parts.append(
            r"\end{equation}"
        )

        if caption:
            parts.extend(
                [
                    "",
                    rf"\noindent\textit{{{self._escape_latex(str(caption))}}}",
                ]
            )

        return "\n".join(parts)

    # ======================================================================
    # FIGURES
    # ======================================================================

    def _build_figure(
        self,
        figure: Any,
    ) -> str:
        source = getattr(
            figure,
            "source",
            "",
        )

        if not source:
            return ""

        source = str(source).replace(
            "\\",
            "/",
        )

        caption = getattr(
            figure,
            "caption",
            None,
        )

        label = getattr(
            figure,
            "label",
            None,
        )

        width = getattr(
            figure,
            "width",
            None,
        )

        width_option = (
            f"width={self._figure_width(width)}"
            if width
            else r"width=0.85\textwidth"
        )

        parts = [
            r"\begin{figure}[H]",
            r"\centering",
            rf"\includegraphics[{width_option}]{{{self._escape_path(source)}}}",
        ]

        if caption:
            parts.append(
                rf"\caption{{{self._escape_latex(str(caption))}}}"
            )

        if label:
            parts.append(
                rf"\label{{{self._sanitize_label(label)}}}"
            )

        parts.append(
            r"\end{figure}"
        )

        return "\n".join(parts)

    # ======================================================================
    # TABLEAUX
    # ======================================================================

    def _build_table(
        self,
        table: Any,
    ) -> str:
        columns = getattr(
            table,
            "columns",
            [],
        ) or []

        rows = getattr(
            table,
            "rows",
            [],
        ) or []

        caption = getattr(
            table,
            "caption",
            None,
        )

        label = getattr(
            table,
            "label",
            None,
        )

        if not columns:
            if rows:
                first = rows[0]

                if isinstance(first, dict):
                    columns = list(
                        first.keys()
                    )
                elif isinstance(first, (list, tuple)):
                    columns = [
                        f"Colonne {index + 1}"
                        for index in range(
                            len(first)
                        )
                    ]

        column_count = max(
            1,
            len(columns),
        )

        alignment = (
            " ".join(
                ["l"] * column_count
            )
        )

        parts = [
            r"\begin{table}[H]",
            r"\centering",
            rf"\begin{{tabular}}{{{alignment}}}",
            r"\toprule",
        ]

        if columns:
            parts.append(
                " & ".join(
                    self._escape_latex(
                        str(column)
                    )
                    for column in columns
                )
                + r" \\"
            )

            parts.append(
                r"\midrule"
            )

        for row in rows:
            values = self._normalize_row(
                row,
                columns,
            )

            values = [
                self._escape_latex(
                    str(value)
                )
                for value in values
            ]

            # Garantit le nombre de cellules.
            values = (
                values
                + [""] * column_count
            )[:column_count]

            parts.append(
                " & ".join(values)
                + r" \\"
            )

        parts.extend(
            [
                r"\bottomrule",
                r"\end{tabular}",
            ]
        )

        if caption:
            parts.append(
                rf"\caption{{{self._escape_latex(str(caption))}}}"
            )

        if label:
            parts.append(
                rf"\label{{{self._sanitize_label(label)}}}"
            )

        parts.append(
            r"\end{table}"
        )

        return "\n".join(parts)

    # ======================================================================
    # BIBLIOGRAPHIE
    # ======================================================================

    def _build_bibliography(
        self,
        references: Iterable[Any],
    ) -> str:
        """
        Termine le document par l'impression de la bibliographie gérée
        par biblatex/biber.

        Le fichier .bib est généré séparément par BibTeXGenerator.
        """

        references = list(
            references
        )

        if not references:
            return ""

        return "\n".join(
            [
                r"\cleardoublepage",
                r"\printbibliography",
            ]
        )

    # ======================================================================
    # ANNEXES
    # ======================================================================

    def _build_annexes(
        self,
        annexes: Iterable[Any],
    ) -> str:
        parts = [
            r"\appendix",
        ]

        for annex in annexes:
            title = ""

            if isinstance(
                annex,
                dict,
            ):
                title = annex.get(
                    "title",
                    "",
                )

                content = annex.get(
                    "content",
                    "",
                )

            else:
                title = getattr(
                    annex,
                    "title",
                    "",
                )

                content = getattr(
                    annex,
                    "content",
                    "",
                )

            if title:
                parts.append(
                    rf"\chapter{{{self._escape_latex(str(title))}}}"
                )

            if content:
                parts.append(
                    self._convert_inline_content(
                        str(content)
                    )
                )

        return "\n\n".join(parts)

    # ======================================================================
    # CONVERSION INLINE
    # ======================================================================

    def _convert_inline_content(
        self,
        content: str,
    ) -> str:
        """
        Préserve les commandes LaTeX déjà présentes tout en convertissant
        les éléments Markdown simples.
        """

        text = content.strip()

        if not text:
            return ""

        # Protection temporaire des commandes LaTeX.
        protected: List[str] = []

        def protect(match):
            protected.append(
                match.group(0)
            )

            return (
                f"@@MACEVO_LATEX_{len(protected)-1}@@"
            )

        text = re.sub(
            r"\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{[^{}]*\})?",
            protect,
            text,
        )

        # Références internes.
        text = re.sub(
            r"\[@([^\]]+)\]",
            lambda m: (
                rf"\cite{{{self._sanitize_label(m.group(1))}}}"
            ),
            text,
        )

        # Markdown gras.
        text = re.sub(
            r"\*\*(.+?)\*\*",
            lambda m: (
                rf"\textbf{{{self._escape_latex(m.group(1))}}}"
            ),
            text,
        )

        # Markdown italique.
        text = re.sub(
            r"(?<!\*)\*([^*]+?)\*(?!\*)",
            lambda m: (
                rf"\textit{{{self._escape_latex(m.group(1))}}}"
            ),
            text,
        )

        # Références LaTeX internes présentes explicitement.
        text = self._escape_plain_text_preserving_commands(
            text
        )

        # Restauration.
        for index, command in enumerate(
            protected
        ):
            text = text.replace(
                f"@@MACEVO_LATEX_{index}@@",
                command,
            )

        return text

    # ======================================================================
    # UTILITAIRES
    # ======================================================================

    def _escape_latex(
        self,
        value: str,
    ) -> str:
        """
        Échappe les caractères spéciaux LaTeX.
        """

        if value is None:
            return ""

        text = str(value)

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

        result = text

        # Le backslash doit être traité en premier.
        result = result.replace(
            "\\",
            replacements["\\"],
        )

        for char in (
            "&",
            "%",
            "$",
            "#",
            "_",
            "{",
            "}",
            "~",
            "^",
        ):
            result = result.replace(
                char,
                replacements[char],
            )

        return result

    def _escape_plain_text_preserving_commands(
        self,
        text: str,
    ) -> str:
        """
        Échappe le texte tout en conservant les commandes LaTeX
        déjà produites par le générateur.

        Les marqueurs temporaires utilisent uniquement des caractères
        alphanumériques afin qu'ils ne soient jamais transformés par
        _escape_latex().
        """

        protected: List[str] = []

        pattern = (
            r"(\\(?:textbf|textit|emph|cite|ref|"
            r"url|href|texttt|textsuperscript)"
            r"(?:\{[^{}]*\})+)"
        )

        def protect(match):
            protected.append(
                match.group(1)
            )

            return (
                f"MACEVOPROTECTEDCOMMAND"
                f"{len(protected) - 1}"
                f"MACEVOEND"
            )

        text = re.sub(
            pattern,
            protect,
            text,
        )

        text = self._escape_latex(
            text
        )

        for index, command in enumerate(
            protected
        ):
            text = text.replace(
                (
                    f"MACEVOPROTECTEDCOMMAND"
                    f"{index}"
                    f"MACEVOEND"
                ),
                command,
            )

        return text

    def _sanitize_label(
        self,
        label: str,
    ) -> str:
        """
        Nettoie un label LaTeX.
        """

        value = str(label).strip()

        value = re.sub(
            r"\s+",
            "-",
            value,
        )

        value = re.sub(
            r"[^a-zA-Z0-9:_\-\.]",
            "",
            value,
        )

        return value

    def _escape_path(
        self,
        path: str,
    ) -> str:
        """
        Échappe uniquement les caractères problématiques dans un chemin.
        """

        value = str(path)

        value = value.replace(
            "\\",
            "/",
        )

        value = value.replace(
            " ",
            r"\ ",
        )

        value = value.replace(
            "#",
            r"\#",
        )

        value = value.replace(
            "%",
            r"\%",
        )

        value = value.replace(
            "&",
            r"\&",
        )

        return value

    def _escape_url(
        self,
        url: str,
    ) -> str:
        return str(url).replace(
            " ",
            "%20",
        )

    def _escape_bib_resource(
        self,
        filename: str,
    ) -> str:
        """
        Prépare le nom du fichier .bib utilisé par biblatex.

        Le chemin reste relatif au fichier .tex afin que l'export LaTeX
        puisse être déplacé ou empaqueté dans un ZIP.
        """
        value = str(
            filename or "references.bib"
        ).strip()

        value = value.replace(
            "\\",
            "/",
        )

        value = value.replace(
            " ",
            r"\ ",
        )

        value = value.replace(
            "#",
            r"\#",
        )

        value = value.replace(
            "%",
            r"\%",
        )

        value = value.replace(
            "&",
            r"\&",
        )

        return value

    def _figure_width(
        self,
        width: Any,
    ) -> str:
        if width is None:
            return r"0.85\textwidth"

        if isinstance(
            width,
            (int, float),
        ):
            if width <= 1:
                return (
                    f"{float(width):.3f}"
                    r"\textwidth"
                )

            return (
                f"{float(width):.2f}cm"
            )

        value = str(
            width
        ).strip()

        if value.endswith(
            (
                r"\textwidth",
                "cm",
                "mm",
                "in",
                "pt",
            )
        ):
            return value

        try:
            number = float(
                value
            )

            if number <= 1:
                return (
                    f"{number:.3f}"
                    r"\textwidth"
                )

            return (
                f"{number:.2f}cm"
            )

        except ValueError:
            return r"0.85\textwidth"

    def _normalize_row(
        self,
        row: Any,
        columns: List[Any],
    ) -> List[Any]:

        if isinstance(
            row,
            dict,
        ):
            return [
                row.get(
                    column,
                    "",
                )
                for column in columns
            ]

        if isinstance(
            row,
            (list, tuple),
        ):
            return list(row)

        return [row]

    def _section_command(
        self,
        level: int,
    ) -> str:
        if level <= 1:
            return "chapter"

        if level == 2:
            return "section"

        if level == 3:
            return "subsection"

        if level == 4:
            return "subsubsection"

        return "paragraph"

    def _latex_language(
        self,
        language: str,
    ) -> str:
        language = str(
            language or "fr"
        ).lower()

        mapping = {
            "fr": "french",
            "fra": "french",
            "fr-fr": "french",
            "french": "french",
            "en": "english",
            "en-us": "english",
            "en-gb": "english",
            "english": "english",
        }

        return mapping.get(
            language,
            "french",
        )

    # ======================================================================
    # MÉTADONNÉES
    # ======================================================================

    def _metadata_title(
        self,
        document: Any,
    ) -> str:
        metadata = getattr(
            document,
            "metadata",
            None,
        )

        return self._escape_latex(
            getattr(
                metadata,
                "title",
                "",
            )
            if metadata
            else ""
        )

    def _metadata_author(
        self,
        document: Any,
    ) -> str:
        metadata = getattr(
            document,
            "metadata",
            None,
        )

        return self._escape_latex(
            getattr(
                metadata,
                "author",
                "",
            )
            if metadata
            else ""
        )

    def _metadata_institution(
        self,
        document: Any,
    ) -> str:
        metadata = getattr(
            document,
            "metadata",
            None,
        )

        return self._escape_latex(
            getattr(
                metadata,
                "institution",
                "",
            )
            if metadata
            else ""
        )


# ============================================================================
# FONCTION UTILITAIRE
# ============================================================================

def generate_latex(
    document: Any,
    **kwargs: Any,
) -> str:
    """
    Fonction pratique :

        latex = generate_latex(document)
    """

    generator = LaTeXGenerator(
        **kwargs
    )

    return generator.generate(
        document
    )