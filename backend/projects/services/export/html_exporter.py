
"""
==========================================================
MACEVO IA
HTML Exporter
==========================================================
Exportateur HTML scientifique basé sur DocumentStructure.

Le HTML constitue une représentation fidèle et autonome
de la structure scientifique MACEVO :
- page de garde
- résumé
- mots-clés
- chapitres
- sections
- tableaux
- figures
- références
- annexes
"""

from __future__ import annotations

import html
import logging
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


class HtmlExporter:
    """Export HTML scientifique."""

    format_name = "html"
    extension = ".html"

    def __init__(
        self,
        document: DocumentStructure,
        output_path: str | Path | None = None,
    ) -> None:
        if not isinstance(document, DocumentStructure):
            raise TypeError(
                "HtmlExporter attend un DocumentStructure."
            )

        self.document = document
        self.output_path = (
            Path(output_path)
            if output_path is not None
            else None
        )

    # ======================================================
    # PUBLIC API
    # ======================================================

    def export(
        self,
        output_path: str | Path | None = None,
    ) -> str:
        """
        Génère le fichier HTML.

        Retourne le chemin du fichier généré.
        """
        output = self._resolve_output_path(output_path)

        output.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        html_document = self.render()

        output.write_text(
            html_document,
            encoding="utf-8",
        )

        logger.info(
            "Export HTML terminé : %s",
            output,
        )

        return str(output)

    def render(self) -> str:
        """Retourne directement le document HTML sous forme de chaîne."""
        doc = self.document

        metadata = doc.metadata or {}
        cover = doc.cover or {}

        title = self._text(
            metadata.get("title")
            or cover.get("title")
            or "Document scientifique"
        )

        subject = self._text(
            metadata.get("subject")
            or metadata.get("subtitle")
            or cover.get("subject")
            or ""
        )

        author = self._text(
            metadata.get("author")
            or cover.get("author")
            or ""
        )

        language = self._language(
            metadata.get("language")
            or cover.get("language")
            or "fr"
        )

        return f"""<!DOCTYPE html>
<html lang="{self._escape(language)}">

<head>
<meta charset="UTF-8">
<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>{self._escape(title)}</title>

<style>
{self._css()}
</style>
</head>

<body>

<header class="cover">

    <div class="cover-inner">

        <div class="brand">MACEVO IA</div>

        <h1>{self._escape(title)}</h1>

        {self._optional_heading(subject, "subtitle")}

        <div class="meta">
            {self._meta_line("Auteur", author)}
            {self._metadata_lines(metadata)}
        </div>

    </div>

</header>

<main class="document">

    {self._render_abstract()}

    {self._render_keywords()}

    {self._render_chapters()}

    {self._render_tables()}

    {self._render_figures()}

    {self._render_references()}

    {self._render_appendices()}

</main>

<footer>
    <p>Document généré avec MACEVO IA.</p>
</footer>

</body>
</html>
"""

    # ======================================================
    # OUTPUT
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
            title = self.document.metadata.get(
                "title",
                "document",
            )

            filename = (
                self._slugify(str(title))
                + self.extension
            )

            path = Path(filename)

        if path.suffix.lower() != self.extension:
            path = path / (
                self._slugify(
                    str(
                        self.document.metadata.get(
                            "title",
                            "document",
                        )
                    )
                )
                + self.extension
            )

        return path

    # ======================================================
    # ABSTRACT / KEYWORDS
    # ======================================================

    def _render_abstract(self) -> str:
        abstract = self._text(
            self.document.abstract
        )

        if not abstract:
            return ""

        return f"""
<section class="preliminary abstract">
    <h2>Résumé</h2>
    <div class="section-content">
        {self._render_text(abstract)}
    </div>
</section>
"""

    def _render_keywords(self) -> str:
        keywords = self.document.keywords

        if not keywords:
            return ""

        if isinstance(keywords, (list, tuple, set)):
            items = [
                self._escape(self._text(item))
                for item in keywords
                if self._text(item)
            ]

            content = ", ".join(items)

        else:
            content = self._escape(
                self._text(keywords)
            )

        if not content:
            return ""

        return f"""
<section class="preliminary keywords">
    <h2>Mots-clés</h2>
    <p>{content}</p>
</section>
"""

    # ======================================================
    # CHAPTERS
    # ======================================================

    def _render_chapters(self) -> str:
        if not self.document.chapters:
            return ""

        parts: list[str] = []

        for chapter in self.document.chapters:
            parts.append(
                self._render_chapter(chapter)
            )

        return "\n".join(parts)

    def _render_chapter(
        self,
        chapter: DocumentChapter,
    ) -> str:
        number = self._text(
            getattr(chapter, "number", "")
        )

        title = self._text(
            getattr(chapter, "title", "")
        )

        heading = (
            f"{self._escape(number)}. "
            if number
            else ""
        )

        heading += self._escape(title)

        content = self._render_text(
            self._text(
                getattr(chapter, "content", "")
            )
        )

        sections = getattr(
            chapter,
            "sections",
            None,
        ) or []

        sections_html = "\n".join(
            self._render_section(section)
            for section in sections
        )

        return f"""
<section class="chapter">

    <h2 class="chapter-title">
        {heading}
    </h2>

    <div class="chapter-content">
        {content}
    </div>

    {sections_html}

</section>
"""

    def _render_section(
        self,
        section: DocumentSection,
    ) -> str:
        number = self._text(
            getattr(section, "number", "")
        )

        title = self._text(
            getattr(section, "title", "")
        )

        level = self._safe_int(
            getattr(section, "level", 2),
            default=2,
        )

        level = max(2, min(level + 1, 6))

        prefix = (
            f"{self._escape(number)}. "
            if number
            else ""
        )

        heading = (
            prefix + self._escape(title)
        )

        content = self._render_text(
            self._text(
                getattr(section, "content", "")
            )
        )

        subsections = getattr(
            section,
            "subsections",
            None,
        ) or []

        nested = "\n".join(
            self._render_section(subsection)
            for subsection in subsections
        )

        return f"""
<div class="section level-{level}">

    <h{level}>{heading}</h{level}>

    <div class="section-content">
        {content}
    </div>

    {nested}

</div>
"""

    # ======================================================
    # TABLES
    # ======================================================

    def _render_tables(self) -> str:
        if not self.document.tables:
            return ""

        parts = [
            '<section class="tables">',
            "<h2>Tableaux</h2>",
        ]

        for table in self.document.tables:
            parts.append(
                self._render_table(table)
            )

        parts.append("</section>")

        return "\n".join(parts)

    def _render_table(
        self,
        table: DocumentTable,
    ) -> str:
        title = self._text(
            getattr(table, "title", "")
        )

        caption = self._text(
            getattr(table, "caption", "")
        )

        number = self._text(
            getattr(table, "number", "")
        )

        headers = getattr(
            table,
            "headers",
            None,
        ) or []

        rows = getattr(
            table,
            "rows",
            None,
        ) or []

        header_html = ""

        if headers:
            header_html = (
                "<thead><tr>"
                + "".join(
                    f"<th>{self._escape(self._text(cell))}</th>"
                    for cell in headers
                )
                + "</tr></thead>"
            )

        row_html = []

        for row in rows:
            if not isinstance(row, (list, tuple)):
                row = [row]

            row_html.append(
                "<tr>"
                + "".join(
                    f"<td>{self._escape(self._text(cell))}</td>"
                    for cell in row
                )
                + "</tr>"
            )

        body_html = (
            "<tbody>"
            + "".join(row_html)
            + "</tbody>"
            if row_html
            else ""
        )

        label = (
            f"Tableau {self._escape(number)}"
            if number
            else "Tableau"
        )

        if title:
            label += (
                f" — {self._escape(title)}"
            )

        return f"""
<figure class="table-block">

    <figcaption>
        <strong>{label}</strong>
        {self._optional_caption(caption)}
    </figcaption>

    <div class="table-wrapper">
        <table>
            {header_html}
            {body_html}
        </table>
    </div>

</figure>
"""

    # ======================================================
    # FIGURES
    # ======================================================

    def _render_figures(self) -> str:
        if not self.document.figures:
            return ""

        parts = [
            '<section class="figures">',
            "<h2>Figures</h2>",
        ]

        for figure in self.document.figures:
            parts.append(
                self._render_figure(figure)
            )

        parts.append("</section>")

        return "\n".join(parts)

    def _render_figure(
        self,
        figure: DocumentFigure,
    ) -> str:
        title = self._text(
            getattr(figure, "title", "")
        )

        path = self._text(
            getattr(figure, "path", "")
        )

        caption = self._text(
            getattr(figure, "caption", "")
        )

        number = self._text(
            getattr(figure, "number", "")
        )

        label = (
            f"Figure {self._escape(number)}"
            if number
            else "Figure"
        )

        if title:
            label += (
                f" — {self._escape(title)}"
            )

        image_html = ""

        if path:
            image_html = f"""
<div class="figure-image">
    <img
        src="{self._escape(path)}"
        alt="{self._escape(title or 'Figure scientifique')}"
        loading="lazy"
    >
</div>
"""

        return f"""
<figure class="figure-block">

    {image_html}

    <figcaption>
        <strong>{label}</strong>
        {self._optional_caption(caption)}
    </figcaption>

</figure>
"""

    # ======================================================
    # REFERENCES
    # ======================================================

    def _render_references(self) -> str:
        if not self.document.references:
            return ""

        items = []

        for index, reference in enumerate(
            self.document.references,
            start=1,
        ):
            items.append(
                self._render_reference(
                    reference,
                    index,
                )
            )

        return f"""
<section class="references">

    <h2>Références bibliographiques</h2>

    <ol>
        {"".join(items)}
    </ol>

</section>
"""

    def _render_reference(
        self,
        reference: DocumentReference,
        index: int,
    ) -> str:
        author = self._text(
            getattr(reference, "author", "")
        )

        title = self._text(
            getattr(reference, "title", "")
        )

        year = self._text(
            getattr(reference, "year", "")
        )

        publisher = self._text(
            getattr(reference, "publisher", "")
        )

        doi = self._text(
            getattr(reference, "doi", "")
        )

        url = self._text(
            getattr(reference, "url", "")
        )

        parts = []

        if author:
            parts.append(
                self._escape(author)
            )

        if year:
            parts.append(
                f"({self._escape(year)})"
            )

        if title:
            parts.append(
                f"<em>{self._escape(title)}</em>"
            )

        if publisher:
            parts.append(
                self._escape(publisher)
            )

        if doi:
            parts.append(
                f"DOI : {self._escape(doi)}"
            )

        if url:
            safe_url = self._escape(url)

            parts.append(
                f'<a href="{safe_url}" '
                f'target="_blank" '
                f'rel="noopener noreferrer">'
                f'{safe_url}</a>'
            )

        if not parts:
            parts.append(
                "Référence bibliographique"
            )

        return (
            "<li>"
            + ". ".join(parts)
            + ".</li>"
        )

    # ======================================================
    # APPENDICES
    # ======================================================

    def _render_appendices(self) -> str:
        appendices = (
            self.document.appendices
            or []
        )

        if not appendices:
            return ""

        parts = [
            '<section class="appendices">',
            "<h2>Annexes</h2>",
        ]

        for index, appendix in enumerate(
            appendices,
            start=1,
        ):
            if isinstance(appendix, dict):
                title = self._text(
                    appendix.get("title")
                    or appendix.get("name")
                    or f"Annexe {index}"
                )

                content = self._text(
                    appendix.get("content")
                    or ""
                )

            else:
                title = self._text(
                    getattr(
                        appendix,
                        "title",
                        None,
                    )
                    or getattr(
                        appendix,
                        "name",
                        None,
                    )
                    or f"Annexe {index}"
                )

                content = self._text(
                    getattr(
                        appendix,
                        "content",
                        "",
                    )
                )

            parts.append(
                f"""
<article class="appendix">

    <h3>{self._escape(title)}</h3>

    <div>
        {self._render_text(content)}
    </div>

</article>
"""
            )

        parts.append("</section>")

        return "\n".join(parts)

    # ======================================================
    # TEXT
    # ======================================================

    def _render_text(self, value: str) -> str:
        """
        Rend du texte de manière sûre.

        Les textes provenant de DocumentStructure sont
        considérés comme du contenu textuel et sont donc
        échappés avant insertion dans le HTML.
        """
        if not value:
            return ""

        escaped = self._escape(value)

        paragraphs = escaped.split("\n\n")

        rendered = []

        for paragraph in paragraphs:
            paragraph = paragraph.strip()

            if not paragraph:
                continue

            paragraph = paragraph.replace(
                "\n",
                "<br>\n",
            )

            rendered.append(
                f"<p>{paragraph}</p>"
            )

        return "\n".join(rendered)

    # ======================================================
    # METADATA
    # ======================================================

    def _metadata_lines(
        self,
        metadata: dict[str, Any],
    ) -> str:
        excluded = {
            "title",
            "subject",
            "subtitle",
            "author",
            "language",
        }

        preferred = [
            "institution",
            "department",
            "supervisor",
            "academic_year",
            "level",
            "project_type",
        ]

        lines = []

        for key in preferred:
            if key in metadata:
                value = self._text(
                    metadata.get(key)
                )

                if value:
                    label = self._humanize_key(key)

                    lines.append(
                        self._meta_line(
                            label,
                            value,
                        )
                    )

        return "".join(lines)

    def _meta_line(
        self,
        label: str,
        value: str,
    ) -> str:
        if not value:
            return ""

        return f"""
<p>
    <strong>{self._escape(label)} :</strong>
    {self._escape(value)}
</p>
"""

    # ======================================================
    # HTML HELPERS
    # ======================================================

    @staticmethod
    def _escape(value: Any) -> str:
        return html.escape(
            str(value or ""),
            quote=True,
        )

    @staticmethod
    def _text(value: Any) -> str:
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
    def _safe_int(
        value: Any,
        default: int = 2,
    ) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _language(value: Any) -> str:
        language = str(value or "fr").strip().lower()

        if "-" in language:
            language = language.split("-", 1)[0]

        if "_" in language:
            language = language.split("_", 1)[0]

        return language or "fr"

    @staticmethod
    def _slugify(value: str) -> str:
        import re
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

    @staticmethod
    def _humanize_key(key: str) -> str:
        labels = {
            "institution": "Institution",
            "department": "Département",
            "supervisor": "Encadreur",
            "academic_year": "Année académique",
            "level": "Niveau",
            "project_type": "Type de projet",
        }

        return labels.get(
            key,
            key.replace("_", " ").capitalize(),
        )

    def _optional_heading(
        self,
        value: str,
        class_name: str,
    ) -> str:
        if not value:
            return ""

        return (
            f'<h2 class="{class_name}">'
            f'{self._escape(value)}'
            f"</h2>"
        )

    def _optional_caption(
        self,
        value: str,
    ) -> str:
        if not value:
            return ""

        return (
            f'<span class="caption-text">'
            f'{self._escape(value)}'
            f"</span>"
        )

    # ======================================================
    # CSS
    # ======================================================

    @staticmethod
    def _css() -> str:
        return r"""
:root {
    --text: #222;
    --muted: #666;
    --border: #ddd;
    --surface: #f7f7f7;
    --accent: #2563eb;
}

* {
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    margin: 0;
    padding: 0;

    font-family:
        Georgia,
        "Times New Roman",
        serif;

    line-height: 1.8;
    color: var(--text);
    background: #ffffff;
}

.cover {
    min-height: 90vh;

    display: flex;
    align-items: center;
    justify-content: center;

    text-align: center;

    padding: 70px 30px;

    border-bottom: 1px solid var(--border);
}

.cover-inner {
    width: 100%;
    max-width: 900px;
}

.brand {
    margin-bottom: 35px;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;

    color: var(--accent);
}

.cover h1 {
    margin: 0;

    font-size: clamp(32px, 5vw, 52px);

    line-height: 1.2;
}

.cover .subtitle {
    margin-top: 25px;

    font-size: 24px;
    font-weight: normal;

    color: var(--muted);
}

.meta {
    margin-top: 45px;

    color: var(--muted);

    font-size: 16px;
}

.meta p {
    margin: 6px 0;
}

.document {
    width: min(100% - 40px, 1000px);

    margin: 0 auto;

    padding: 50px 0 80px;
}

.document section {
    margin-bottom: 60px;
}

.document h2 {
    margin-top: 0;

    padding-bottom: 10px;

    border-bottom: 1px solid var(--border);

    font-size: 30px;
    line-height: 1.3;
}

.document h3,
.document h4,
.document h5,
.document h6 {
    line-height: 1.4;
}

.chapter {
    margin-top: 70px;
}

.chapter-title {
    color: var(--accent);
}

.section {
    margin-top: 30px;
}

.section-content p,
.chapter-content p {
    margin: 0 0 16px;
}

.preliminary {
    padding: 25px;

    background: var(--surface);

    border-radius: 6px;
}

.keywords p {
    font-style: italic;
}

.table-block,
.figure-block {
    margin: 35px auto;

    max-width: 100%;

    text-align: center;
}

.table-wrapper {
    overflow-x: auto;
}

table {
    width: 100%;

    border-collapse: collapse;

    margin: 20px 0;
}

th,
td {
    padding: 10px 12px;

    border: 1px solid var(--border);

    text-align: left;

    vertical-align: top;
}

th {
    font-weight: 700;
    background: var(--surface);
}

.figure-image img {
    display: block;

    max-width: 100%;
    height: auto;

    margin: 0 auto;
}

figcaption {
    margin-top: 12px;

    color: var(--muted);
}

.caption-text {
    margin-left: 5px;
}

.references ol {
    padding-left: 30px;
}

.references li {
    margin-bottom: 15px;
}

.references a {
    overflow-wrap: anywhere;
}

.appendix {
    margin-top: 35px;

    padding: 25px;

    border: 1px solid var(--border);
    border-radius: 6px;
}

footer {
    padding: 30px;

    border-top: 1px solid var(--border);

    text-align: center;

    color: var(--muted);

    font-size: 13px;
}

@media print {
    .cover {
        min-height: 100vh;
        page-break-after: always;
    }

    .chapter {
        page-break-before: always;
    }

    .table-block,
    .figure-block,
    .appendix {
        break-inside: avoid;
    }

    body {
        background: #ffffff;
    }
}

@media (max-width: 700px) {
    .cover {
        padding: 50px 20px;
    }

    .document {
        width: min(100% - 25px, 1000px);
    }

    .document h2 {
        font-size: 25px;
    }
}
"""


# Compatibilité avec d'anciens imports éventuels.
HTMLExporter = HtmlExporter
