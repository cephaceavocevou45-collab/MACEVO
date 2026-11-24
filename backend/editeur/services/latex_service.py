"""
MACEVO — Service central de génération et d'export LaTeX.

Responsabilités :

- transformer un Report en document LaTeX ;
- construire le préambule scientifique ;
- générer couverture, chapitres, sections et blocs ;
- gérer tableaux, figures, images et équations ;
- gérer références et annexes ;
- créer un projet LaTeX autonome ;
- copier les assets du document ;
- créer une archive ZIP ;
- compiler en PDF avec XeLaTeX, LuaLaTeX ou pdfLaTeX.

Source documentaire canonique :
    reports.Report

La normalisation documentaire est réalisée par :
    ReportDocumentBuilder

La résolution des packages est réalisée par :
    LatexPackageResolver
"""

from __future__ import annotations

import html
import logging
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import uuid
import zipfile
from typing import Any

from django.conf import settings

from .document_service import ReportDocumentBuilder
from .package_service import LatexPackageResolver


logger = logging.getLogger(__name__)


class LatexServiceError(Exception):
    """Erreur générale du service LaTeX."""


class LatexGenerationError(LatexServiceError):
    """Erreur pendant la génération du document."""


class LatexCompilationError(LatexServiceError):
    """Erreur pendant la compilation LaTeX."""


class LatexService:
    """
    Service professionnel central de génération LaTeX MACEVO.
    """

    DEFAULT_ENGINE = "xelatex"

    SUPPORTED_ENGINES = {
        "xelatex": "xelatex",
        "lualatex": "lualatex",
        "pdflatex": "pdflatex",
    }

    DEFAULT_DOCUMENT_CLASS = "article"

    # ------------------------------------------------------------------
    # API PUBLIQUE
    # ------------------------------------------------------------------

    def __init__(
        self,
        engine: str | None = None,
    ) -> None:
        self.engine = self._normalize_engine(engine)

    def generate(
        self,
        report,
    ) -> str:
        """
        Génère le document LaTeX complet.
        """

        try:
            document = ReportDocumentBuilder(
                report
            ).build()

            packages = LatexPackageResolver().resolve(
                document
            )

            preamble = self._build_preamble(
                document,
                packages,
            )

            body = self._build_body(
                document
            )

            return "\n".join(
                [
                    preamble,
                    "",
                    r"\begin{document}",
                    "",
                    body,
                    "",
                    r"\end{document}",
                    "",
                ]
            )

        except LatexServiceError:
            raise

        except Exception as exc:
            logger.exception(
                "Erreur génération LaTeX du rapport %s",
                getattr(report, "pk", None),
            )

            raise LatexGenerationError(
                "Impossible de générer le document LaTeX."
            ) from exc

    def build_tex(
        self,
        report,
    ) -> str:
        """
        Alias de compatibilité historique.
        """

        return self.generate(report)

    def write_tex(
        self,
        report,
        output_path: str | Path,
    ) -> Path:
        """
        Génère un fichier .tex.
        """

        path = Path(output_path)

        path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        content = self.generate(report)

        path.write_text(
            content,
            encoding="utf-8",
        )

        return path

    def create_project(
        self,
        report,
        output_dir: str | Path | None = None,
    ) -> Path:
        """
        Crée un projet LaTeX autonome.

        Structure :

            project/
                main.tex
                README.txt
                assets/
        """

        root = self._get_output_root(
            output_dir
        )

        project_name = self._safe_project_name(
            getattr(
                report,
                "title",
                "",
            )
        )

        project_dir = (
            root
            / f"{project_name}-{uuid.uuid4().hex[:10]}"
        )

        project_dir.mkdir(
            parents=True,
            exist_ok=False,
        )

        assets_dir = (
            project_dir
            / "assets"
        )

        assets_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.write_tex(
            report,
            project_dir / "main.tex",
        )

        self._write_assets(
            report,
            assets_dir,
        )

        self._write_readme(
            report,
            project_dir / "README.txt",
        )

        return project_dir

    def create_zip(
        self,
        report,
        output_path: str | Path | None = None,
    ) -> Path:
        """
        Crée une archive ZIP contenant le projet LaTeX.
        """

        project_dir = self.create_project(
            report
        )

        if output_path is None:
            root = self._get_output_root()

            filename = (
                f"{self._safe_project_name(report.title)}"
                f"-{uuid.uuid4().hex[:10]}.zip"
            )

            output_path = root / filename

        output_path = Path(output_path)

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        if output_path.exists():
            output_path.unlink()

        try:
            with zipfile.ZipFile(
                output_path,
                mode="w",
                compression=zipfile.ZIP_DEFLATED,
            ) as archive:

                for file_path in project_dir.rglob("*"):
                    if not file_path.is_file():
                        continue

                    archive.write(
                        file_path,
                        file_path.relative_to(
                            project_dir
                        ),
                    )

        except OSError as exc:
            logger.exception(
                "Erreur création ZIP LaTeX du rapport %s",
                getattr(report, "pk", None),
            )

            raise LatexGenerationError(
                "Impossible de créer l'archive LaTeX."
            ) from exc

        return output_path

    def compile_pdf(
        self,
        report,
        output_dir: str | Path | None = None,
        engine: str | None = None,
    ) -> Path:
        """
        Génère puis compile le document en PDF.

        La compilation est effectuée deux fois afin de permettre
        la résolution de la table des matières et des références
        croisées.
        """

        selected_engine = self._normalize_engine(
            engine
        )

        project_dir = self.create_project(
            report,
            output_dir=output_dir,
        )

        compiler = self._find_compiler(
            selected_engine
        )

        command = [
            compiler,
            "-interaction=nonstopmode",
            "-halt-on-error",
            "-file-line-error",
            "-no-shell-escape",
            "main.tex",
        ]

        self._run_compiler(
            command,
            project_dir,
            report,
        )

        self._run_compiler(
            command,
            project_dir,
            report,
        )

        pdf_path = (
            project_dir
            / "main.pdf"
        )

        if not pdf_path.exists():
            raise LatexCompilationError(
                "La compilation LaTeX n'a pas produit de fichier PDF."
            )

        if not pdf_path.is_file():
            raise LatexCompilationError(
                "Le fichier PDF généré est invalide."
            )

        return pdf_path

    # ------------------------------------------------------------------
    # NORMALISATION
    # ------------------------------------------------------------------

    @classmethod
    def _normalize_engine(
        cls,
        engine: str | None,
    ) -> str:
        value = (
            engine
            or cls.DEFAULT_ENGINE
        ).strip().lower()

        if value not in cls.SUPPORTED_ENGINES:
            raise LatexGenerationError(
                f"Moteur LaTeX non supporté : {value}"
            )

        return value

    @staticmethod
    def _get_output_root(
        output_dir: str | Path | None = None,
    ) -> Path:
        if output_dir:
            root = Path(output_dir)

        else:
            media_root = getattr(
                settings,
                "MEDIA_ROOT",
                "",
            )

            if media_root:
                root = (
                    Path(media_root)
                    / "latex"
                )

            else:
                root = (
                    Path(tempfile.gettempdir())
                    / "macevo-latex"
                )

        root.mkdir(
            parents=True,
            exist_ok=True,
        )

        return root

    @staticmethod
    def _safe_project_name(
        value: Any,
    ) -> str:
        name = str(
            value
            or "macevo-document"
        ).strip()

        name = re.sub(
            r"[^\w\s-]",
            "",
            name,
            flags=re.UNICODE,
        )

        name = re.sub(
            r"\s+",
            "-",
            name,
        )

        name = re.sub(
            r"-+",
            "-",
            name,
        )

        name = name.strip(
            "-."
        )

        if not name:
            name = "macevo-document"

        reserved = {
            "CON",
            "PRN",
            "AUX",
            "NUL",
            "COM1",
            "COM2",
            "COM3",
            "COM4",
            "COM5",
            "COM6",
            "COM7",
            "COM8",
            "COM9",
            "LPT1",
            "LPT2",
            "LPT3",
            "LPT4",
            "LPT5",
            "LPT6",
            "LPT7",
            "LPT8",
            "LPT9",
        }

        if name.upper() in reserved:
            name = f"macevo-{name}"

        return name[:80]

    # ------------------------------------------------------------------
    # PRÉAMBULE
    # ------------------------------------------------------------------

    def _build_preamble(
        self,
        document: dict[str, Any],
        packages: list[str],
    ) -> str:
        metadata = document.get(
            "metadata",
            {},
        )

        package_lines = LatexPackageResolver.render(
            packages
        )

        engine_packages = self._build_engine_packages()

        title = self._escape_latex(
            metadata.get(
                "title",
                "Titre du rapport",
            )
        )

        author = self._escape_latex(
            metadata.get(
                "author",
                "Non renseigné",
            )
        )

        lines = [
            "% =========================================================",
            "% MACEVO — Document scientifique généré automatiquement",
            "% =========================================================",
            "",
            f"\\documentclass[12pt,a4paper]{{{self.DEFAULT_DOCUMENT_CLASS}}}",
            "",
            package_lines,
            "",
            engine_packages,
            "",
            r"\geometry{top=2.5cm,bottom=2.5cm,left=3cm,right=2.5cm}",
            r"\setstretch{1.5}",
            r"\setlength{\parindent}{0pt}",
            r"\setlength{\parskip}{8pt}",
            "",
            r"\hypersetup{",
            r"    colorlinks=true,",
            r"    linkcolor=blue,",
            r"    citecolor=blue,",
            r"    urlcolor=blue,",
            r"    pdftitle={" + title + r"},",
            r"    pdfauthor={" + author + r"}",
            r"}",
            "",
            r"\title{" + title + r"}",
            r"\author{" + author + r"}",
            r"\date{}",
            "",
        ]

        return "\n".join(lines)

    def _build_engine_packages(self) -> str:
        if self.engine in {
            "xelatex",
            "lualatex",
        }:
            return "\n".join(
                [
                    r"\usepackage{fontspec}",
                    r"\usepackage{polyglossia}",
                    r"\setmainlanguage{french}",
                    r"\setotherlanguage{english}",
                    r"\setmainfont{Latin Modern Roman}",
                ]
            )

        return "\n".join(
            [
                r"\usepackage[T1]{fontenc}",
                r"\usepackage[utf8]{inputenc}",
                r"\usepackage[french,english]{babel}",
                r"\usepackage{lmodern}",
            ]
        )

    # ------------------------------------------------------------------
    # CORPS DU DOCUMENT
    # ------------------------------------------------------------------

    def _build_body(
        self,
        document: dict[str, Any],
    ) -> str:
        blocks = document.get(
            "blocks",
            [],
        )

        if not blocks:
            return r"\null"

        sections: list[str] = []

        cover = self._build_cover(
            document
        )

        if cover:
            sections.append(
                cover
            )

        metadata = document.get(
            "metadata",
            {},
        )

        if metadata.get(
            "generate_toc"
        ):
            sections.append(
                r"\tableofcontents"
            )

        has_chapters = any(
            self._is_heading_block(block)
            for block in blocks
        )

        if has_chapters:
            sections.append(
                self._build_structured_body(
                    blocks
                )
            )

        else:
            sections.append(
                self._build_flat_body(
                    blocks
                )
            )

        references = document.get(
            "references",
            [],
        )

        if references:
            sections.append(
                self._references_to_latex(
                    references
                )
            )

        return "\n\n".join(
            section
            for section in sections
            if section
        )

    def _build_cover(
        self,
        document: dict[str, Any],
    ) -> str:
        metadata = document.get(
            "metadata",
            {},
        )

        title = self._escape_latex(
            metadata.get(
                "title",
                "Titre du rapport",
            )
        )

        author = self._escape_latex(
            metadata.get(
                "author",
                "Non renseigné",
            )
        )

        institution = self._escape_latex(
            metadata.get(
                "institution",
                "",
            )
        )

        department = self._escape_latex(
            metadata.get(
                "department",
                "",
            )
        )

        supervisor = self._escape_latex(
            metadata.get(
                "supervisor",
                "",
            )
        )

        academic_year = self._escape_latex(
            metadata.get(
                "academic_year",
                "",
            )
        )

        field = self._escape_latex(
            metadata.get(
                "scientific_field",
                "",
            )
        )

        lines = [
            r"\begin{titlepage}",
            r"\centering",
            "",
            r"\vspace*{2cm}",
            "",
            r"{\Large\textbf{MACEVO}}\\[1cm]",
            r"{\large ÉDITION SCIENTIFIQUE ET ACADÉMIQUE}\\[2cm]",
            "",
            r"{\Huge\bfseries " + title + r"}\\[1.5cm]",
        ]

        if institution:
            lines.append(
                r"{\Large " + institution + r"}\\[0.5cm]"
            )

        if department:
            lines.append(
                r"{\large " + department + r"}\\[1cm]"
            )

        if field:
            lines.append(
                r"{\large Domaine scientifique : "
                + field
                + r"}\\[1cm]"
            )

        lines.extend(
            [
                r"\vfill",
                "",
                r"\begin{tabular}{rl}",
                r"\textbf{Auteur :} & "
                + author
                + r"\\",
            ]
        )

        if supervisor:
            lines.append(
                r"\textbf{Encadreur :} & "
                + supervisor
                + r"\\"
            )

        if academic_year:
            lines.append(
                r"\textbf{Année académique :} & "
                + academic_year
                + r"\\"
            )

        lines.extend(
            [
                r"\end{tabular}",
                "",
                r"\vfill",
                "",
                r"{\small Document généré avec MACEVO}",
                "",
                r"\end{titlepage}",
                "",
                r"\clearpage",
            ]
        )

        return "\n".join(lines)

    # ------------------------------------------------------------------
    # STRUCTURE
    # ------------------------------------------------------------------

    def _build_structured_body(
        self,
        blocks: list[dict[str, Any]],
    ) -> str:
        output: list[str] = []

        current_section: list[str] = []

        def flush_section() -> None:
            if current_section:
                output.append(
                    "\n".join(
                        current_section
                    )
                )
                current_section.clear()

        for block in blocks:
            if self._is_heading_block(
                block
            ):
                level = self._heading_level(
                    block
                )

                text = self._block_inline_latex(
                    block
                )

                if level <= 1:
                    flush_section()

                    current_section.append(
                        r"\section{" + text + r"}"
                    )

                elif level == 2:
                    current_section.append(
                        r"\subsection{" + text + r"}"
                    )

                elif level == 3:
                    current_section.append(
                        r"\subsubsection{" + text + r"}"
                    )

                elif level == 4:
                    current_section.append(
                        r"\paragraph{" + text + r"}"
                    )

                else:
                    current_section.append(
                        r"\subparagraph{" + text + r"}"
                    )

                continue

            rendered = self._block_to_latex(
                block
            )

            if rendered:
                current_section.append(
                    rendered
                )

        flush_section()

        return "\n\n".join(
            output
        )

    def _build_flat_body(
        self,
        blocks: list[dict[str, Any]],
    ) -> str:
        rendered: list[str] = []

        for block in blocks:
            latex = self._block_to_latex(
                block
            )

            if latex:
                rendered.append(
                    latex
                )

        return "\n\n".join(
            rendered
        )

    @staticmethod
    def _is_heading_block(
        block: dict[str, Any],
    ) -> bool:
        tag = str(
            block.get(
                "tag",
                "",
            )
        ).lower()

        return tag in {
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
        }

    @staticmethod
    def _heading_level(
        block: dict[str, Any],
    ) -> int:
        tag = str(
            block.get(
                "tag",
                "h1",
            )
        ).lower()

        try:
            return int(tag[1])

        except (
            ValueError,
            IndexError,
        ):
            return 1

    # ------------------------------------------------------------------
    # BLOCS
    # ------------------------------------------------------------------

    def _block_to_latex(
        self,
        block: dict[str, Any],
    ) -> str:
        block_type = block.get(
            "type"
        )

        if block_type == "paragraph":
            return self._paragraph_to_latex(
                block
            )

        if block_type == "blockquote":
            return self._quote_to_latex(
                block
            )

        if block_type == "pre":
            return self._code_to_latex(
                block
            )

        if block_type == "list":
            return self._list_to_latex(
                block
            )

        if block_type == "table":
            return self._table_to_latex(
                block
            )

        if block_type == "figure":
            return self._figure_to_latex(
                block
            )

        if block_type == "scientific_shape":
            return self._shape_to_latex(
                block
            )

        if self._is_heading_block(
            block
        ):
            level = self._heading_level(
                block
            )

            text = self._block_inline_latex(
                block
            )

            if level <= 1:
                return r"\section{" + text + r"}"

            if level == 2:
                return r"\subsection{" + text + r"}"

            if level == 3:
                return r"\subsubsection{" + text + r"}"

            if level == 4:
                return r"\paragraph{" + text + r"}"

            return r"\subparagraph{" + text + r"}"

        return self._block_inline_latex(
            block
        )

    def _paragraph_to_latex(
        self,
        block: dict[str, Any],
    ) -> str:
        return self._block_inline_latex(
            block
        )

    def _quote_to_latex(
        self,
        block: dict[str, Any],
    ) -> str:
        text = self._block_inline_latex(
            block
        )

        if not text:
            return ""

        return "\n".join(
            [
                r"\begin{quote}",
                text,
                r"\end{quote}",
            ]
        )

    def _code_to_latex(
        self,
        block: dict[str, Any],
    ) -> str:
        text = str(
            block.get(
                "text",
                "",
            )
            or ""
        )

        text = text.replace(
            r"\end{verbatim}",
            r"\textbackslash end\{verbatim\}",
        )

        return "\n".join(
            [
                r"\begin{verbatim}",
                text,
                r"\end{verbatim}",
            ]
        )

    # ------------------------------------------------------------------
    # LISTES
    # ------------------------------------------------------------------

    def _list_to_latex(
        self,
        block: dict[str, Any],
    ) -> str:
        ordered = bool(
            block.get(
                "ordered",
                False,
            )
        )

        environment = (
            "enumerate"
            if ordered
            else "itemize"
        )

        items = block.get(
            "items_detail"
        )

        if not items:
            items = [
                {
                    "text": item,
                    "inline_nodes": [],
                }
                for item in block.get(
                    "items",
                    [],
                )
            ]

        lines = [
            rf"\begin{{{environment}}}"
        ]

        for item in items:
            if not isinstance(
                item,
                dict,
            ):
                item = {
                    "text": str(item),
                    "inline_nodes": [],
                }

            text = self._item_inline_latex(
                item
            )

            if text:
                lines.append(
                    r"\item " + text
                )

        lines.append(
            rf"\end{{{environment}}}"
        )

        return "\n".join(
            lines
        )

    def _item_inline_latex(
        self,
        item: dict[str, Any],
    ) -> str:
        nodes = item.get(
            "inline_nodes",
            [],
        )

        text = str(
            item.get(
                "text",
                "",
            )
            or ""
        )

        return self._render_inline_nodes(
            text,
            nodes,
        )

    # ------------------------------------------------------------------
    # TABLEAUX
    # ------------------------------------------------------------------

    def _table_to_latex(
        self,
        block: dict[str, Any],
    ) -> str:
        rows = block.get(
            "rows",
            [],
        )

        if not rows:
            return ""

        normalized_rows: list[list[str]] = []

        for row in rows:
            if not isinstance(
                row,
                list,
            ):
                continue

            cells: list[str] = []

            for cell in row:
                if isinstance(
                    cell,
                    dict,
                ):
                    value = cell.get(
                        "text",
                        "",
                    )

                    tag = str(
                        cell.get(
                            "tag",
                            "td",
                        )
                    ).lower()

                    value = self._escape_latex(
                        str(value)
                    )

                    if tag == "th":
                        value = (
                            r"\textbf{"
                            + value
                            + r"}"
                        )

                else:
                    value = self._escape_latex(
                        str(cell)
                    )

                value = value.replace(
                    "\n",
                    " ",
                )

                cells.append(
                    value
                )

            if cells:
                normalized_rows.append(
                    cells
                )

        if not normalized_rows:
            return ""

        column_count = max(
            len(row)
            for row in normalized_rows
        )

        if column_count <= 0:
            return ""

        column_spec = "X" * column_count

        lines = [
            r"\begin{table}[H]",
            r"\centering",
            rf"\begin{{tabularx}}{{\textwidth}}{{{column_spec}}}",
            r"\toprule",
        ]

        for index, row in enumerate(
            normalized_rows
        ):
            padded = (
                row
                + [""] * (
                    column_count
                    - len(row)
                )
            )

            lines.append(
                " & ".join(
                    padded
                )
                + r" \\"
            )

            if index == 0:
                lines.append(
                    r"\midrule"
                )

        lines.extend(
            [
                r"\bottomrule",
                r"\end{tabularx}",
                r"\end{table}",
            ]
        )

        return "\n".join(
            lines
        )

    # ------------------------------------------------------------------
    # FIGURES / IMAGES
    # ------------------------------------------------------------------

    def _figure_to_latex(
        self,
        block: dict[str, Any],
    ) -> str:
        images = block.get(
            "images",
            [],
        )

        if not images:
            return ""

        lines = [
            r"\begin{figure}[H]",
            r"\centering",
        ]

        rendered_image = False

        for image in images:
            path = self._latex_image_path(
                image
            )

            if not path:
                continue

            lines.append(
                rf"\includegraphics[width=0.9\textwidth]{{{path}}}"
            )

            rendered_image = True

        caption = self._escape_latex(
            block.get(
                "caption",
                "",
            )
        )

        if caption:
            lines.append(
                rf"\caption{{{caption}}}"
            )

        lines.append(
            r"\end{figure}"
        )

        if not rendered_image:
            return ""

        return "\n".join(
            lines
        )

    def _shape_to_latex(
        self,
        block: dict[str, Any],
    ) -> str:
        attrs = block.get(
            "attrs",
            {},
        )

        shape_type = str(
            attrs.get(
                "shape",
                attrs.get(
                    "shape-type",
                    "scientific",
                ),
            )
        )

        text = self._escape_latex(
            block.get(
                "text",
                "",
            )
        )

        if not text:
            return ""

        label = self._escape_latex(
            shape_type
        )

        return "\n".join(
            [
                r"\begin{center}",
                (
                    r"\fbox{\begin{minipage}{0.9\textwidth}"
                    r"\textbf{"
                    + label
                    + r"}\\[4pt]"
                    + text
                    + r"\end{minipage}}"
                ),
                r"\end{center}",
            ]
        )

    def _latex_image_path(
        self,
        image: dict[str, Any],
    ) -> str:
        src = str(
            image.get(
                "src",
                "",
            )
            or ""
        ).strip()

        if not src:
            src = str(
                image.get(
                    "data-src",
                    "",
                )
                or ""
            ).strip()

        if not src:
            return ""

        filename = Path(
            src.split("?")[0]
        ).name

        if not filename:
            return ""

        return (
            "assets/"
            + self._latex_filename(
                filename
            )
        )

    # ------------------------------------------------------------------
    # INLINE — PARTIE IMPORTANTE
    # ------------------------------------------------------------------

    def _block_inline_latex(
        self,
        block: dict[str, Any],
    ) -> str:
        text = str(
            block.get(
                "text",
                "",
            )
            or ""
        )

        nodes = block.get(
            "inline_nodes",
            [],
        )

        return self._render_inline_nodes(
            text,
            nodes,
        )

    def _render_inline_nodes(
        self,
        text: str,
        nodes: list[dict[str, Any]],
    ) -> str:
        """
        Rend correctement les nœuds inline issus du document_service.

        Point essentiel :

        Un MathNode doit être rendu depuis ses données structurées,
        et non recherché dans le texte aplati.

        Exemple :

            {
                "type": "math",
                "latex": "E = mc^2"
            }

        devient :

            \\(E = mc^2\\)
        """

        if not nodes:
            return self._latex_inline(
                text
            )

        parts: list[str] = []

        for node in nodes:
            if not isinstance(
                node,
                dict,
            ):
                continue

            node_type = node.get(
                "type"
            )

            if node_type == "math":
                latex = (
                    node.get("latex")
                    or node.get("data-latex")
                    or node.get("equation")
                    or ""
                )

                latex = str(
                    latex
                ).strip()

                if latex:
                    parts.append(
                        rf"\({latex}\)"
                    )

                continue

            if node_type == "link":
                label = str(
                    node.get(
                        "text",
                        "",
                    )
                    or ""
                )

                href = str(
                    node.get(
                        "href",
                        "",
                    )
                    or ""
                ).strip()

                if label:
                    label_latex = self._latex_inline(
                        label
                    )

                    if href:
                        parts.append(
                            rf"\href{{{self._escape_url(href)}}}{{{label_latex}}}"
                        )
                    else:
                        parts.append(
                            label_latex
                        )

                continue

            if node_type == "text":
                node_text = str(
                    node.get(
                        "text",
                        "",
                    )
                    or ""
                )

                if not node_text:
                    continue

                marks = node.get(
                    "marks",
                    [],
                )

                rendered = self._latex_inline(
                    node_text
                )

                rendered = self._apply_marks(
                    rendered,
                    marks,
                )

                parts.append(
                    rendered
                )

                continue

            # Compatibilité avec des nœuds inconnus contenant du texte.
            node_text = node.get(
                "text"
            )

            if node_text:
                parts.append(
                    self._latex_inline(
                        str(node_text)
                    )
                )

        # ------------------------------------------------------------------
        # Si le parser a fourni des nœuds structurés, ils sont prioritaires.
        #
        # Cependant certains documents contiennent encore du texte ordinaire
        # autour des nœuds. On récupère les portions de texte qui n'ont pas
        # été représentées par les nœuds.
        # ------------------------------------------------------------------

        if parts:
            structured_text = "".join(
                parts
            )

            # Cas classique du test MathNode :
            #
            # text = "Une équation :"
            # nodes = [{"type": "math", "latex": "E = mc^2"}]
            #
            # Le texte doit être conservé avant l'équation.
            if text:
                plain_text = self._remove_structured_node_text(
                    text,
                    nodes,
                )

                if plain_text.strip():
                    plain_latex = self._latex_inline(
                        plain_text
                    )

                    # Pour conserver l'ordre naturel, on utilise le texte
                    # aplati comme préfixe lorsque le parser n'a pas fourni
                    # de positions explicites.
                    return (
                        plain_latex
                        + structured_text
                    )

            return structured_text

        return self._latex_inline(
            text
        )

    @staticmethod
    def _remove_structured_node_text(
        text: str,
        nodes: list[dict[str, Any]],
    ) -> str:
        """
        Retire du texte aplati les contenus déjà représentés
        par les nœuds structurés.

        Les expressions mathématiques ne sont généralement pas présentes
        dans `text`, donc elles sont naturellement conservées comme nœuds.
        """

        value = str(
            text
            or ""
        )

        for node in nodes:
            if not isinstance(
                node,
                dict,
            ):
                continue

            node_type = node.get(
                "type"
            )

            if node_type == "text":
                node_text = str(
                    node.get(
                        "text",
                        "",
                    )
                    or ""
                )

                if node_text:
                    value = value.replace(
                        node_text,
                        "",
                        1,
                    )

            elif node_type == "link":
                node_text = str(
                    node.get(
                        "text",
                        "",
                    )
                    or ""
                )

                if node_text:
                    value = value.replace(
                        node_text,
                        "",
                        1,
                    )

        return value

    def _apply_marks(
        self,
        text: str,
        marks: Any,
    ) -> str:
        if not marks:
            return text

        if not isinstance(
            marks,
            list,
        ):
            marks = [
                marks
            ]

        result = text

        for mark in marks:
            if isinstance(
                mark,
                dict,
            ):
                mark_type = mark.get(
                    "type"
                )
            else:
                mark_type = str(
                    mark
                )

            if mark_type in {
                "bold",
                "strong",
            }:
                result = (
                    r"\textbf{"
                    + result
                    + r"}"
                )

            elif mark_type in {
                "italic",
                "em",
            }:
                result = (
                    r"\textit{"
                    + result
                    + r"}"
                )

            elif mark_type in {
                "underline",
                "u",
            }:
                result = (
                    r"\underline{"
                    + result
                    + r"}"
                )

        return result

    def _latex_inline(
        self,
        text: str,
    ) -> str:
        """
        Convertit du HTML inline vers LaTeX.

        Les expressions mathématiques présentes directement dans le HTML
        sont protégées avant l'échappement.
        """

        if not text:
            return ""

        value = html.unescape(
            str(text)
        )

        math_store: dict[str, str] = {}

        def protect_math(
            match: re.Match,
        ) -> str:
            key = (
                "__MACEVO_MATH_"
                + uuid.uuid4().hex[:8]
                + "__"
            )

            math_store[key] = match.group(
                0
            )

            return key

        # $$ ... $$
        value = re.sub(
            r"\$\$(.+?)\$\$",
            protect_math,
            value,
            flags=re.DOTALL,
        )

        # \[ ... \]
        value = re.sub(
            r"\\\[(.+?)\\\]",
            protect_math,
            value,
            flags=re.DOTALL,
        )

        # \( ... \)
        value = re.sub(
            r"\\\((.+?)\\\)",
            protect_math,
            value,
            flags=re.DOTALL,
        )

        # $ ... $
        value = re.sub(
            r"(?<!\\)\$(?!\$)(.+?)(?<!\\)\$",
            protect_math,
            value,
            flags=re.DOTALL,
        )

        value = re.sub(
            r"<br\s*/?>",
            "\n",
            value,
            flags=re.IGNORECASE,
        )

        value = re.sub(
            r"<strong>(.*?)</strong>",
            lambda m: (
                r"\textbf{"
                + self._latex_inline(
                    m.group(1)
                )
                + r"}"
            ),
            value,
            flags=re.IGNORECASE | re.DOTALL,
        )

        value = re.sub(
            r"<b>(.*?)</b>",
            lambda m: (
                r"\textbf{"
                + self._latex_inline(
                    m.group(1)
                )
                + r"}"
            ),
            value,
            flags=re.IGNORECASE | re.DOTALL,
        )

        value = re.sub(
            r"<em>(.*?)</em>",
            lambda m: (
                r"\textit{"
                + self._latex_inline(
                    m.group(1)
                )
                + r"}"
            ),
            value,
            flags=re.IGNORECASE | re.DOTALL,
        )

        value = re.sub(
            r"<i>(.*?)</i>",
            lambda m: (
                r"\textit{"
                + self._latex_inline(
                    m.group(1)
                )
                + r"}"
            ),
            value,
            flags=re.IGNORECASE | re.DOTALL,
        )

        value = re.sub(
            r"<u>(.*?)</u>",
            lambda m: (
                r"\underline{"
                + self._latex_inline(
                    m.group(1)
                )
                + r"}"
            ),
            value,
            flags=re.IGNORECASE | re.DOTALL,
        )

        value = re.sub(
            r"<sup>(.*?)</sup>",
            lambda m: (
                r"\textsuperscript{"
                + self._latex_inline(
                    m.group(1)
                )
                + r"}"
            ),
            value,
            flags=re.IGNORECASE | re.DOTALL,
        )

        value = re.sub(
            r"<sub>(.*?)</sub>",
            lambda m: (
                r"\textsubscript{"
                + self._latex_inline(
                    m.group(1)
                )
                + r"}"
            ),
            value,
            flags=re.IGNORECASE | re.DOTALL,
        )

        value = re.sub(
            r"<code>(.*?)</code>",
            lambda m: (
                r"\texttt{"
                + self._escape_latex(
                    re.sub(
                        r"<[^>]+>",
                        "",
                        m.group(1),
                    )
                )
                + r"}"
            ),
            value,
            flags=re.IGNORECASE | re.DOTALL,
        )

        def replace_link(
            match: re.Match,
        ) -> str:
            href = self._escape_url(
                match.group(1)
            )

            label = self._latex_inline(
                match.group(2)
            )

            if not href:
                return label

            return (
                rf"\href{{{href}}}{{{label}}}"
            )

        value = re.sub(
            r'<a[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',
            replace_link,
            value,
            flags=re.IGNORECASE | re.DOTALL,
        )

        value = re.sub(
            r"<[^>]+>",
            "",
            value,
        )

        value = self._escape_latex(
            value
        )

        for key, expression in math_store.items():
            value = value.replace(
                self._escape_latex(key),
                expression,
            )

            value = value.replace(
                key,
                expression,
            )

        return value.strip()

    # ------------------------------------------------------------------
    # RÉFÉRENCES
    # ------------------------------------------------------------------

    def _references_to_latex(
        self,
        references: list[Any],
    ) -> str:
        lines = [
            r"\begin{thebibliography}{99}",
        ]

        for index, reference in enumerate(
            references,
            start=1,
        ):
            if isinstance(
                reference,
                dict,
            ):
                text = (
                    reference.get("text")
                    or reference.get("citation")
                    or reference.get("title")
                    or ""
                )
            else:
                text = str(
                    reference
                )

            text = self._escape_latex(
                text
            )

            if not text:
                continue

            lines.append(
                rf"\bibitem{{ref{index}}} {text}"
            )

        lines.append(
            r"\end{thebibliography}"
        )

        return "\n".join(
            lines
        )

    # ------------------------------------------------------------------
    # ESCAPEMENT
    # ------------------------------------------------------------------

    @staticmethod
    def _escape_latex(
        value: Any,
    ) -> str:
        if value is None:
            return ""

        text = str(
            value
        )

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
            replacements.get(
                char,
                char,
            )
            for char in text
        )

    @staticmethod
    def _escape_url(
        value: Any,
    ) -> str:
        if value is None:
            return ""

        text = str(
            value
        ).strip()

        if not text:
            return ""

        return (
            text
            .replace(
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
                "%",
                r"\%",
            )
            .replace(
                " ",
                "%20",
            )
        )

    @staticmethod
    def _latex_filename(
        value: str,
    ) -> str:
        filename = Path(
            value
        ).name

        filename = re.sub(
            r"[^\w.\-]",
            "_",
            filename,
            flags=re.UNICODE,
        )

        return filename

    # ------------------------------------------------------------------
    # ASSETS
    # ------------------------------------------------------------------

    def _write_assets(
        self,
        report,
        assets_dir: Path,
    ) -> None:
        try:
            assets = list(
                report.editor_assets.all()
            )

        except AttributeError:
            assets = []

        used_names: set[str] = set()

        for asset in assets:
            file_field = getattr(
                asset,
                "file",
                None,
            )

            if not file_field:
                continue

            try:
                source_path = Path(
                    file_field.path
                )

            except (
                AttributeError,
                NotImplementedError,
                OSError,
            ):
                continue

            if not source_path.exists():
                logger.warning(
                    "Asset introuvable pour le rapport %s : %s",
                    getattr(
                        report,
                        "pk",
                        None,
                    ),
                    source_path,
                )
                continue

            if not source_path.is_file():
                continue

            filename = self._unique_asset_name(
                source_path.name,
                used_names,
            )

            destination = (
                assets_dir
                / filename
            )

            try:
                shutil.copy2(
                    source_path,
                    destination,
                )

            except OSError:
                logger.exception(
                    "Impossible de copier l'asset %s",
                    source_path,
                )

    @staticmethod
    def _unique_asset_name(
        filename: str,
        used_names: set[str],
    ) -> str:
        safe = re.sub(
            r"[^\w.\-]",
            "_",
            Path(filename).name,
            flags=re.UNICODE,
        )

        if not safe:
            safe = "asset"

        candidate = safe

        if candidate not in used_names:
            used_names.add(
                candidate
            )
            return candidate

        path = Path(
            safe
        )

        stem = path.stem
        suffix = path.suffix

        counter = 2

        while True:
            candidate = (
                f"{stem}-{counter}{suffix}"
            )

            if candidate not in used_names:
                used_names.add(
                    candidate
                )
                return candidate

            counter += 1

    # ------------------------------------------------------------------
    # README
    # ------------------------------------------------------------------

    def _write_readme(
        self,
        report,
        path: Path,
    ) -> None:
        author_name = ""

        try:
            author = report.author

            if author:
                author_name = (
                    f"{getattr(author, 'first_name', '')} "
                    f"{getattr(author, 'last_name', '')}"
                ).strip()

        except AttributeError:
            pass

        content = "\n".join(
            [
                "MACEVO — Projet LaTeX scientifique",
                "",
                f"Titre : {getattr(report, 'title', '')}",
                f"Auteur : {author_name or 'Non renseigné'}",
                (
                    "Niveau académique : "
                    f"{getattr(report, 'academic_level', '') or 'Non renseigné'}"
                ),
                (
                    "Domaine scientifique : "
                    f"{getattr(report, 'scientific_field', '') or 'Non renseigné'}"
                ),
                f"Moteur recommandé : {self.engine}",
                "",
                "Fichier principal : main.tex",
                "Assets : assets/",
                "",
                "Compilation recommandée :",
                (
                    f"    {self.engine} "
                    "-interaction=nonstopmode "
                    "-halt-on-error "
                    "-no-shell-escape "
                    "main.tex"
                ),
                "",
                "Projet généré automatiquement par MACEVO.",
            ]
        )

        path.write_text(
            content,
            encoding="utf-8",
        )

    # ------------------------------------------------------------------
    # COMPILATION
    # ------------------------------------------------------------------

    def _find_compiler(
        self,
        engine: str,
    ) -> str:
        executable = self.SUPPORTED_ENGINES[
            engine
        ]

        compiler = shutil.which(
            executable
        )

        if compiler:
            return compiler

        raise LatexCompilationError(
            f"Le moteur LaTeX '{executable}' est introuvable sur le système."
        )

    def _run_compiler(
        self,
        command: list[str],
        cwd: Path,
        report,
    ) -> None:
        logger.info(
            "Compilation LaTeX du rapport %s avec %s",
            getattr(
                report,
                "pk",
                None,
            ),
            self.engine,
        )

        try:
            completed = subprocess.run(
                command,
                cwd=str(cwd),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=120,
                check=False,
            )

        except subprocess.TimeoutExpired as exc:
            logger.error(
                "Timeout compilation LaTeX rapport %s",
                getattr(
                    report,
                    "pk",
                    None,
                ),
            )

            raise LatexCompilationError(
                "La compilation LaTeX a dépassé le délai autorisé."
            ) from exc

        except OSError as exc:
            logger.exception(
                "Erreur système pendant compilation LaTeX rapport %s",
                getattr(
                    report,
                    "pk",
                    None,
                ),
            )

            raise LatexCompilationError(
                "Impossible d'exécuter le moteur LaTeX."
            ) from exc

        output = (
            completed.stdout
            or ""
        )

        logger.info(
            "Sortie compilation LaTeX rapport %s :\n%s",
            getattr(
                report,
                "pk",
                None,
            ),
            output[-6000:],
        )

        if completed.returncode != 0:
            raise LatexCompilationError(
                self._build_compilation_error(
                    output
                )
            )

    @staticmethod
    def _build_compilation_error(
        output: str,
    ) -> str:
        lines = [
            line.strip()
            for line in (
                output or ""
            ).splitlines()
            if line.strip()
        ]

        relevant: list[str] = []

        for line in lines:
            lowered = line.lower()

            if (
                "error" in lowered
                or "fatal" in lowered
                or "emergency stop" in lowered
                or "undefined control sequence" in lowered
            ):
                relevant.append(
                    line
                )

        if relevant:
            message = " ".join(
                relevant[-5:]
            )

            return (
                "La compilation LaTeX a échoué : "
                + message[:1500]
            )

        return (
            "La compilation LaTeX a échoué. "
            "Consultez les journaux de compilation."
        )