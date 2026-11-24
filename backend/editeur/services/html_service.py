"""
MACEVO — Export HTML scientifique.

Le HTML est généré à partir du modèle documentaire canonique
produit par ``document_service.build_document()``.

Responsabilités :

    Report
       ↓
    ReportDocumentBuilder
       ↓
    HTMLService
       ↓
    fichier .html

Le service ne crée aucun nouveau modèle documentaire.
Il reste une capacité d'export du domaine ``editeur``.
"""

from __future__ import annotations

import html
import tempfile
import uuid
from pathlib import Path

from django.conf import settings

from reports.models import Report

from .document_service import build_document


class HTMLService:
    """
    Générateur HTML scientifique de MACEVO.

    Le résultat est un fichier HTML autonome contenant :

        - métadonnées du document ;
        - contenu scientifique ;
        - images ;
        - figures ;
        - tableaux ;
        - équations ;
        - styles d'impression ;
        - structure académique ;
        - informations documentaires.

    Le fichier retourné est toujours un ``Path``.
    """

    # ------------------------------------------------------------------
    # API publique
    # ------------------------------------------------------------------

    def export(
        self,
        report: Report,
    ) -> Path:
        """
        Exporte un rapport MACEVO en HTML.

        Parameters
        ----------
        report:
            Instance canonique de ``reports.Report``.

        Returns
        -------
        pathlib.Path
            Chemin du fichier HTML généré.
        """

        document = build_document(
            report
        )

        metadata = document.get(
            "metadata",
            {},
        )

        title = self._safe_metadata(
            metadata.get(
                "title",
                getattr(
                    report,
                    "title",
                    "Rapport MACEVO",
                ),
            )
        )

        content = document.get(
            "content_html",
            "",
        )

        content = self._prepare_content(
            content
        )

        output = self._build_html(
            document=document,
            title=title,
            content=content,
        )

        export_dir = (
            self._get_export_directory()
        )

        filename = (
            f"report_{report.pk}_"
            f"{uuid.uuid4().hex[:8]}.html"
        )

        path = export_dir / filename

        path.write_text(
            output,
            encoding="utf-8",
        )

        return path

    # ------------------------------------------------------------------
    # Construction HTML
    # ------------------------------------------------------------------

    def _build_html(
        self,
        document: dict,
        title: str,
        content: str,
    ) -> str:
        """
        Construit le document HTML complet.
        """

        metadata = document.get(
            "metadata",
            {},
        )

        author = self._safe_metadata(
            metadata.get(
                "author",
                "",
            )
        )

        institution = self._safe_metadata(
            metadata.get(
                "institution",
                "",
            )
        )

        department = self._safe_metadata(
            metadata.get(
                "department",
                "",
            )
        )

        supervisor = self._safe_metadata(
            metadata.get(
                "supervisor",
                "",
            )
        )

        academic_year = self._safe_metadata(
            metadata.get(
                "academic_year",
                "",
            )
        )

        language = self._safe_metadata(
            metadata.get(
                "language",
                "fr",
            )
        )

        keywords = document.get(
            "keywords",
            [],
        )

        keyword_html = (
            self._render_keywords(
                keywords
            )
        )

        metadata_html = (
            self._render_metadata(
                author=author,
                institution=institution,
                department=department,
                supervisor=supervisor,
                academic_year=academic_year,
            )
        )

        return f"""<!DOCTYPE html>
<html lang="{html.escape(language, quote=True)}">
<head>
<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<meta
    name="generator"
    content="MACEVO"
>

<meta
    name="description"
    content="{html.escape(title, quote=True)}"
>

{self._render_keyword_meta(keywords)}

<title>{html.escape(title)}</title>

<style>
/* ================================================================
   MACEVO — Scientific HTML Export
   ================================================================ */

:root {{
    --macevo-primary: #2563eb;
    --macevo-secondary: #64748b;
    --macevo-text: #1f2937;
    --macevo-muted: #64748b;
    --macevo-border: #e2e8f0;
    --macevo-surface: #ffffff;
    --macevo-background: #f3f4f6;
    --macevo-heading: #111827;
    --macevo-code: #f8fafc;
    --macevo-highlight: #eff6ff;
}}

* {{
    box-sizing: border-box;
}}

html {{
    scroll-behavior: smooth;
}}

body {{
    margin: 0;
    padding: 40px 24px;
    background: var(--macevo-background);
    color: var(--macevo-text);

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    font-size: 16px;
    line-height: 1.65;
}}

.document {{
    width: 100%;
    max-width: 980px;

    margin: 0 auto;
    padding: 72px 76px;

    background: var(--macevo-surface);

    box-shadow:
        0 10px 40px rgba(0, 0, 0, 0.08);
}}

.document-header {{
    margin-bottom: 48px;
    padding-bottom: 28px;

    border-bottom:
        2px solid var(--macevo-border);
}}

.document-title {{
    margin: 0 0 18px;

    color: var(--macevo-heading);

    font-size: 2.2rem;
    line-height: 1.2;
    font-weight: 700;
}}

.document-meta {{
    display: grid;
    grid-template-columns:
        repeat(
            auto-fit,
            minmax(220px, 1fr)
        );

    gap: 10px 28px;

    margin-top: 24px;

    color: var(--macevo-muted);
    font-size: 0.94rem;
}}

.document-meta-item {{
    margin: 0;
}}

.document-meta-label {{
    font-weight: 700;
    color: var(--macevo-text);
}}

.document-keywords {{
    margin-top: 24px;
    padding: 14px 18px;

    background: var(--macevo-highlight);

    border-left:
        4px solid var(--macevo-primary);

    border-radius: 4px;
}}

.document-keywords strong {{
    color: var(--macevo-heading);
}}

.document-content {{
    width: 100%;
}}

.document-content h1,
.document-content h2,
.document-content h3,
.document-content h4,
.document-content h5,
.document-content h6 {{
    color: var(--macevo-heading);

    line-height: 1.3;

    page-break-after: avoid;
    break-after: avoid-page;
}}

.document-content h1 {{
    margin-top: 2.5em;
    margin-bottom: 0.8em;

    font-size: 1.8rem;

    border-bottom:
        2px solid var(--macevo-border);

    padding-bottom: 8px;
}}

.document-content h2 {{
    margin-top: 2em;
    margin-bottom: 0.7em;

    font-size: 1.5rem;
}}

.document-content h3 {{
    margin-top: 1.7em;
    margin-bottom: 0.6em;

    font-size: 1.25rem;
}}

.document-content h4 {{
    margin-top: 1.4em;
    margin-bottom: 0.5em;

    font-size: 1.1rem;
}}

.document-content h5,
.document-content h6 {{
    margin-top: 1.2em;
    margin-bottom: 0.5em;

    font-size: 1rem;
}}

.document-content p {{
    margin-top: 0;
    margin-bottom: 1em;
}}

.document-content a {{
    color: var(--macevo-primary);
    text-decoration: underline;
    text-underline-offset: 2px;
}}

.document-content a:hover {{
    text-decoration-thickness: 2px;
}}

.document-content strong {{
    font-weight: 700;
}}

.document-content em {{
    font-style: italic;
}}

.document-content ul,
.document-content ol {{
    margin-top: 0.5em;
    margin-bottom: 1.2em;
    padding-left: 2em;
}}

.document-content li {{
    margin-bottom: 0.35em;
}}

.document-content blockquote {{
    margin: 1.5em 0;
    padding: 16px 20px;

    background: #f8fafc;

    border-left:
        4px solid var(--macevo-secondary);

    color: #475569;
}}

.document-content pre {{
    margin: 1.5em 0;
    padding: 18px;

    overflow-x: auto;

    background: var(--macevo-code);

    border:
        1px solid var(--macevo-border);

    border-radius: 6px;

    font-family:
        Consolas,
        "Courier New",
        monospace;

    font-size: 0.9rem;
    line-height: 1.5;

    white-space: pre-wrap;
}}

.document-content code {{
    font-family:
        Consolas,
        "Courier New",
        monospace;
}}

.document-content :not(pre) > code {{
    padding: 2px 5px;

    background: var(--macevo-code);

    border-radius: 4px;

    font-size: 0.9em;
}}

.document-content hr {{
    margin: 2em 0;

    border: 0;

    border-top:
        1px solid var(--macevo-border);
}}

.document-content img {{
    display: block;

    max-width: 100%;
    height: auto;

    margin: 1.5em auto;

    object-fit: contain;
}}

.document-content figure {{
    margin: 2em 0;

    text-align: center;

    page-break-inside: avoid;
    break-inside: avoid;
}}

.document-content figure img {{
    margin: 0 auto;
}}

.document-content figcaption {{
    margin-top: 10px;

    color: var(--macevo-muted);

    font-size: 0.92rem;
    line-height: 1.45;

    text-align: center;
}}

.document-content table {{
    width: 100%;

    margin: 1.8em 0;

    border-collapse: collapse;

    table-layout: auto;

    page-break-inside: auto;
}}

.document-content thead {{
    display: table-header-group;
}}

.document-content tr {{
    page-break-inside: avoid;
    break-inside: avoid;
}}

.document-content th,
.document-content td {{
    padding: 10px 12px;

    border:
        1px solid var(--macevo-border);

    vertical-align: top;

    text-align: left;
}}

.document-content th {{
    background: #f8fafc;

    color: var(--macevo-heading);

    font-weight: 700;
}}

.document-content tbody tr:nth-child(even) {{
    background: #fafafa;
}}

.document-content .math-node {{
    display: inline-block;

    margin: 0 2px;

    font-family:
        "Times New Roman",
        Times,
        serif;

    vertical-align: middle;
}}

.document-content .math-node[data-latex] {{
    white-space: nowrap;
}}

.document-content .scientific-shape {{
    margin: 1.5em auto;

    text-align: center;
}}

.document-content .scientific-shape svg,
.document-content .scientific-shape img {{
    max-width: 100%;
    height: auto;
}}

.document-content .scientific-figure {{
    margin: 2em auto;

    text-align: center;

    page-break-inside: avoid;
    break-inside: avoid;
}}

.document-content .scientific-figure .caption {{
    margin-top: 10px;

    color: var(--macevo-muted);

    font-size: 0.92rem;
}}

.document-footer {{
    margin-top: 64px;
    padding-top: 20px;

    border-top:
        1px solid var(--macevo-border);

    color: var(--macevo-muted);

    font-size: 0.85rem;

    text-align: center;
}}

@media (max-width: 800px) {{
    body {{
        padding: 0;
    }}

    .document {{
        padding: 40px 28px;

        box-shadow: none;
    }}

    .document-title {{
        font-size: 1.8rem;
    }}
}}

@media (max-width: 520px) {{
    .document {{
        padding: 28px 20px;
    }}

    .document-title {{
        font-size: 1.55rem;
    }}

    .document-content table {{
        display: block;
        overflow-x: auto;
    }}
}}

@media print {{
    @page {{
        size: A4;
        margin: 20mm;
    }}

    body {{
        padding: 0;

        background: white;

        font-size: 11pt;
    }}

    .document {{
        max-width: none;

        padding: 0;

        box-shadow: none;
    }}

    .document-header {{
        margin-bottom: 30px;
    }}

    .document-content h1 {{
        page-break-before: auto;
    }}

    .document-content h1,
    .document-content h2,
    .document-content h3,
    .document-content h4 {{
        page-break-after: avoid;
    }}

    .document-content figure,
    .document-content table,
    .document-content blockquote,
    .document-content pre {{
        page-break-inside: avoid;
    }}

    .document-footer {{
        margin-top: 40px;
    }}

    a {{
        color: inherit;
        text-decoration: none;
    }}
}}
</style>
</head>

<body>

<main class="document">

<header class="document-header">

<h1 class="document-title">
    {html.escape(title)}
</h1>

{metadata_html}

{keyword_html}

</header>

<section
    class="document-content"
    aria-label="Contenu du document"
>
{content}
</section>

<footer class="document-footer">
    Document généré par MACEVO — Éditeur scientifique
</footer>

</main>

</body>
</html>
"""

    # ------------------------------------------------------------------
    # Métadonnées
    # ------------------------------------------------------------------

    @staticmethod
    def _safe_metadata(
        value,
    ) -> str:
        """
        Prépare une valeur de métadonnée destinée à être placée
        dans le HTML.
        """

        if value is None:
            return ""

        return str(
            value
        ).strip()

    @staticmethod
    def _render_metadata(
        author: str,
        institution: str,
        department: str,
        supervisor: str,
        academic_year: str,
    ) -> str:
        """
        Rend les métadonnées académiques disponibles.
        """

        values = [
            (
                "Auteur",
                author,
            ),
            (
                "Institution",
                institution,
            ),
            (
                "Département",
                department,
            ),
            (
                "Encadreur",
                supervisor,
            ),
            (
                "Année académique",
                academic_year,
            ),
        ]

        items = []

        for label, value in values:
            if not value:
                continue

            items.append(
                f"""
<div class="document-meta-item">
    <span class="document-meta-label">
        {html.escape(label)} :
    </span>
    {html.escape(value)}
</div>
"""
            )

        if not items:
            return ""

        return (
            '<div class="document-meta">'
            + "".join(items)
            + "</div>"
        )

    @staticmethod
    def _render_keywords(
        keywords,
    ) -> str:
        """
        Rend les mots-clés du document.
        """

        if not keywords:
            return ""

        if isinstance(
            keywords,
            str,
        ):
            keywords = [
                item.strip()
                for item in keywords.split(",")
                if item.strip()
            ]

        if not keywords:
            return ""

        rendered = []

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
                rendered.append(
                    html.escape(keyword)
                )

        if not rendered:
            return ""

        return f"""
<div class="document-keywords">
    <strong>Mots-clés :</strong>
    {", ".join(rendered)}
</div>
"""

    @staticmethod
    def _render_keyword_meta(
        keywords,
    ) -> str:
        """
        Génère la balise meta keywords.
        """

        if not keywords:
            return ""

        if isinstance(
            keywords,
            str,
        ):
            values = [
                item.strip()
                for item in keywords.split(",")
                if item.strip()
            ]
        else:
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

        if not values:
            return ""

        value = html.escape(
            ", ".join(values),
            quote=True,
        )

        return (
            '<meta name="keywords" '
            f'content="{value}">'
        )

    # ------------------------------------------------------------------
    # Préparation du contenu
    # ------------------------------------------------------------------

    @staticmethod
    def _prepare_content(
        content: str,
    ) -> str:
        """
        Prépare le HTML fourni par le moteur documentaire.

        Le contenu scientifique est conservé autant que possible.
        """

        if content is None:
            return ""

        content = str(
            content
        ).strip()

        if not content:
            return ""

        content = content.replace(
            "\r\n",
            "\n",
        )

        content = content.replace(
            "\r",
            "\n",
        )

        return content

    # ------------------------------------------------------------------
    # Répertoire d'export
    # ------------------------------------------------------------------

    @staticmethod
    def _get_export_directory() -> Path:
        """
        Retourne le répertoire central des exports de l'éditeur.

        MEDIA_ROOT est utilisé lorsqu'il est configuré.
        Le répertoire temporaire système constitue le fallback.
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