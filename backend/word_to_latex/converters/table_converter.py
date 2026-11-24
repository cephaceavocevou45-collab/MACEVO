from __future__ import annotations

import re
from typing import Any, Optional

from docx.table import Table, _Cell
from docx.text.paragraph import Paragraph
from docx.oxml.ns import qn
try:
    from .latex_symbols import replace_latex_symbols
except ImportError:
    from latex_symbols import replace_latex_symbols


class TableConverter:
    """
    Conversion des tableaux Word vers LaTeX.

    Prise en charge :
    - tableaux simples ;
    - plusieurs paragraphes par cellule ;
    - gras / italique / souligné via ParagraphConverter ;
    - équations OMML dans les cellules ;
    - cellules vides ;
    - alignements ;
    - tableaux avec un nombre variable de colonnes ;
    - tableaux longs via longtable ;
    - tableaux complexes via tabularx ;
    - échappement correct du texte LaTeX.

    Les fusions complexes (rowspan/colspan) sont détectées au niveau
    XML et traitées avec les commandes LaTeX disponibles lorsque
    l'information est suffisamment fiable.
    """

    WORD_NS = (
        "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    )

    def __init__(
        self,
        paragraph_converter: Optional[Any] = None,
        equation_converter: Optional[Any] = None,
        detect_complex_tables: bool = True,
    ):
        self.paragraph_converter = paragraph_converter
        self.equation_converter = equation_converter
        self.detect_complex_tables = detect_complex_tables

    # ------------------------------------------------------------------
    # API principale
    # ------------------------------------------------------------------

    def convert(
        self,
        table: Table,
        caption: Optional[str] = None,
        label: Optional[str] = None,
    ) -> str:
        """
        Convertit un tableau Word complet en LaTeX.
        """

        if table is None:
            return ""

        rows = list(table.rows)

        if not rows:
            return ""

        matrix = self.build_matrix(table)

        if not matrix:
            return ""

        column_count = self._get_column_count(
            matrix
        )

        if column_count <= 0:
            return ""

        complex_table = (
            self.detect_complex_tables
            and self.is_complex_table(table)
        )

        use_longtable = len(rows) >= 20

        if use_longtable:
            latex = self._build_longtable(
                matrix,
                column_count,
            )
        elif complex_table:
            latex = self._build_tabularx(
                matrix,
                column_count,
            )
        else:
            latex = self._build_tabular(
                matrix,
                column_count,
            )

        if caption and use_longtable:
            # longtable cannot be nested in a floating table environment.
            # Its caption and label belong inside the longtable itself.
            opening_end = latex.find("\n") + 1
            caption_block = "\\caption{" + self.escape_latex(caption) + "}"
            if label:
                caption_block += "\\label{" + self.sanitize_label(label) + "}"
            caption_block += r"\\" + "\n\\hline\n"
            latex = (
                latex[:opening_end]
                + caption_block
                + latex[opening_end:].replace("\\hline\n", "", 1)
            )
            return latex + "\n"

        if caption:
            latex = (
                "\\begin{table}[H]\n"
                "\\centering\n"
                + latex
            )

            latex += (
                "\\caption{"
                + self.escape_latex(caption)
                + "}\n"
            )

            if label:
                latex += (
                    "\\label{"
                    + self.sanitize_label(label)
                    + "}\n"
                )

            latex += "\\end{table}\n\n"

            return latex

        return latex + "\n"

    # ------------------------------------------------------------------
    # Construction de la matrice
    # ------------------------------------------------------------------

    def build_matrix(
        self,
        table: Table,
    ) -> list[list[dict[str, Any]]]:
        """
        Construit une représentation intermédiaire du tableau.

        Chaque cellule contient notamment :
            {
                "text": "...",
                "latex": "...",
                "row": ...,
                "column": ...,
                "rowspan": 1,
                "colspan": 1,
            }
        """

        rows = list(table.rows)

        if not rows:
            return []

        column_count = self._get_xml_column_count(table)

        if column_count <= 0:
            column_count = max(
                len(row.cells)
                for row in rows
            )

        matrix: list[list[dict[str, Any]]] = []

        for row_index, row in enumerate(rows):
            current_row: list[dict[str, Any]] = []

            xml_cells = self._get_row_cells(row)

            for column_index, cell in enumerate(row.cells):
                xml_cell = (
                    xml_cells[column_index]
                    if column_index < len(xml_cells)
                    else None
                )

                cell_info = self._convert_cell(
                    cell=cell,
                    row_index=row_index,
                    column_index=column_index,
                    xml_cell=xml_cell,
                )

                current_row.append(cell_info)

            while len(current_row) < column_count:
                current_row.append(
                    self._empty_cell(
                        row_index=row_index,
                        column_index=len(current_row),
                    )
                )

            matrix.append(current_row)

        return matrix

    # ------------------------------------------------------------------
    # Cellules
    # ------------------------------------------------------------------

    def _convert_cell(
        self,
        cell: _Cell,
        row_index: int,
        column_index: int,
        xml_cell: Any = None,
    ) -> dict[str, Any]:
        paragraphs = list(cell.paragraphs)

        paragraph_latex = []

        for paragraph in paragraphs:
            converted = self._convert_paragraph(
                paragraph
            )

            converted = converted.strip()

            if converted:
                paragraph_latex.append(
                    converted
                )

        latex = r"\newline{} ".join(
            paragraph_latex
        )

        if not latex:
            latex = ""

        colspan = self._get_colspan(
            xml_cell
        )

        rowspan = self._get_rowspan(
            xml_cell
        )

        return {
            "text": self._cell_plain_text(cell),
            "latex": latex,
            "row": row_index,
            "column": column_index,
            "rowspan": rowspan,
            "colspan": colspan,
            "is_empty": not bool(latex.strip()),
        }

    def _empty_cell(
        self,
        row_index: int,
        column_index: int,
    ) -> dict[str, Any]:
        return {
            "text": "",
            "latex": "",
            "row": row_index,
            "column": column_index,
            "rowspan": 1,
            "colspan": 1,
            "is_empty": True,
        }

    def _cell_plain_text(
        self,
        cell: _Cell,
    ) -> str:
        parts = []

        for paragraph in cell.paragraphs:
            text = paragraph.text or ""

            if text.strip():
                parts.append(
                    text.strip()
                )

            if self._paragraph_has_math(
                paragraph
            ):
                parts.append("math")

        return " ".join(parts).strip()

    # ------------------------------------------------------------------
    # Paragraphes des cellules
    # ------------------------------------------------------------------

    def _convert_paragraph(
        self,
        paragraph: Paragraph,
    ) -> str:
        if self.paragraph_converter is not None:
            converter = self.paragraph_converter

            method = getattr(
                converter,
                "convert",
                None,
            )

            if callable(method):
                try:
                    result = method(
                        paragraph
                    )

                    if result:
                        return str(result).strip()
                except Exception:
                    pass

            method = getattr(
                converter,
                "convert_paragraph_element",
                None,
            )

            if callable(method):
                try:
                    result = method(
                        paragraph._p
                    )

                    if result:
                        return str(result).strip()
                except Exception:
                    pass

        return self._fallback_convert_paragraph(
            paragraph
        )

    def _fallback_convert_paragraph(
        self,
        paragraph: Paragraph,
    ) -> str:
        """
        Fallback lorsque ParagraphConverter n'est pas disponible.
        """

        p_element = paragraph._p

        parts = []

        for child in p_element.iterchildren():
            local_name = self._local_name(
                child.tag
            )

            if local_name == "r":
                parts.append(
                    self._fallback_convert_run(
                        child
                    )
                )

            elif local_name == "hyperlink":
                parts.append(
                    self.escape_latex(
                        self._element_text(child)
                    )
                )

            elif local_name == "oMath":
                parts.append(
                    self._convert_math(
                        child,
                        display=False,
                    )
                )

            elif local_name == "oMathPara":
                parts.append(
                    self._convert_math(
                        child,
                        display=True,
                    )
                )

        return "".join(parts).strip()

    def _fallback_convert_run(
        self,
        run_element: Any,
    ) -> str:
        text = []

        for child in run_element.iterchildren():
            local_name = self._local_name(
                child.tag
            )

            if local_name == "t":
                text.append(
                    self.escape_latex(
                        child.text or ""
                    )
                )

            elif local_name == "tab":
                text.append(
                    r"\hspace{0.5cm}"
                )

            elif local_name == "br":
                text.append(
                    r"\newline{}"
                )

        value = "".join(text)

        r_pr = run_element.find(
            qn("w:rPr")
        )

        if r_pr is None or not value:
            return value

        if r_pr.find(qn("w:b")) is not None:
            value = (
                r"\textbf{"
                + value
                + "}"
            )

        if r_pr.find(qn("w:i")) is not None:
            value = (
                r"\textit{"
                + value
                + "}"
            )

        underline = r_pr.find(qn("w:u"))

        if underline is not None:
            underline_value = underline.get(
                qn("w:val")
            )

            if underline_value not in {
                "none",
                "0",
            }:
                value = (
                    r"\underline{"
                    + value
                    + "}"
                )

        return value

    # ------------------------------------------------------------------
    # Équations dans les cellules
    # ------------------------------------------------------------------

    def _paragraph_has_math(
        self,
        paragraph: Paragraph,
    ) -> bool:
        for element in paragraph._p.iter():
            local_name = self._local_name(
                element.tag
            )

            if local_name in {
                "oMath",
                "oMathPara",
            }:
                return True

        return False

    def _convert_math(
        self,
        element: Any,
        display: bool = False,
    ) -> str:
        if element is None:
            return ""

        if self.equation_converter is not None:
            converter = self.equation_converter

            method = getattr(
                converter,
                "convert",
                None,
            )

            if callable(method):
                try:
                    result = method(
                        element,
                        display=display,
                    )

                    if result:
                        return str(result)
                except TypeError:
                    try:
                        result = method(
                            element
                        )

                        if result:
                            return self._wrap_math(
                                str(result),
                                display,
                            )
                    except Exception:
                        pass
                except Exception:
                    pass

            method = getattr(
                converter,
                "convert_element",
                None,
            )

            if callable(method):
                try:
                    result = method(
                        element
                    )

                    if result:
                        return self._wrap_math(
                            str(result),
                            display,
                        )
                except Exception:
                    pass

        return self._wrap_math(
            self._fallback_math(
                element
            ),
            display,
        )

    def _fallback_math(
        self,
        element: Any,
    ) -> str:
        local_name = self._local_name(
            element.tag
        )

        if local_name == "t":
            return self._escape_math_text(
                element.text or ""
            )

        if local_name == "f":
            numerator = ""
            denominator = ""

            for child in element.iterchildren():
                child_name = self._local_name(
                    child.tag
                )

                if child_name == "num":
                    numerator = "".join(
                        self._fallback_math(c)
                        for c in child.iterchildren()
                    )

                elif child_name == "den":
                    denominator = "".join(
                        self._fallback_math(c)
                        for c in child.iterchildren()
                    )

            return (
                r"\frac{"
                + numerator
                + "}{"
                + denominator
                + "}"
            )

        if local_name == "sSub":
            base = ""
            sub = ""

            for child in element.iterchildren():
                name = self._local_name(
                    child.tag
                )

                if name == "e":
                    base = "".join(
                        self._fallback_math(c)
                        for c in child.iterchildren()
                    )

                elif name == "sub":
                    sub = "".join(
                        self._fallback_math(c)
                        for c in child.iterchildren()
                    )

            return (
                base
                + "_{"
                + sub
                + "}"
            )

        if local_name == "sSup":
            base = ""
            sup = ""

            for child in element.iterchildren():
                name = self._local_name(
                    child.tag
                )

                if name == "e":
                    base = "".join(
                        self._fallback_math(c)
                        for c in child.iterchildren()
                    )

                elif name == "sup":
                    sup = "".join(
                        self._fallback_math(c)
                        for c in child.iterchildren()
                    )

            return (
                base
                + "^{"
                + sup
                + "}"
            )

        if local_name == "sSubSup":
            base = ""
            sub = ""
            sup = ""

            for child in element.iterchildren():
                name = self._local_name(
                    child.tag
                )

                if name == "e":
                    base = "".join(
                        self._fallback_math(c)
                        for c in child.iterchildren()
                    )

                elif name == "sub":
                    sub = "".join(
                        self._fallback_math(c)
                        for c in child.iterchildren()
                    )

                elif name == "sup":
                    sup = "".join(
                        self._fallback_math(c)
                        for c in child.iterchildren()
                    )

            return (
                base
                + "_{"
                + sub
                + "}"
                + "^{"
                + sup
                + "}"
            )

        if local_name == "rad":
            content = "".join(
                self._fallback_math(c)
                for c in element.iterchildren()
            )

            return (
                r"\sqrt{"
                + content
                + "}"
            )

        return "".join(
            self._fallback_math(c)
            for c in element.iterchildren()
        )

    @staticmethod
    def _wrap_math(
        value: str,
        display: bool,
    ) -> str:
        value = (value or "").strip()

        if not value:
            return ""

        if (
            value.startswith(r"\(")
            and value.endswith(r"\)")
        ):
            return value

        if (
            value.startswith(r"\[")
            and value.endswith(r"\]")
        ):
            return value

        if r"\begin{equation}" in value:
            return value

        if display:
            return (
                "\\[\n"
                + value
                + "\n\\]"
            )

        return (
            "\\("
            + value
            + "\\)"
        )

    # ------------------------------------------------------------------
    # Génération tabular
    # ------------------------------------------------------------------

    def _build_tabular(
        self,
        matrix: list[list[dict[str, Any]]],
        column_count: int,
    ) -> str:
        specification = (
            "|"
            + "|".join(
                "l"
                for _ in range(column_count)
            )
            + "|"
        )

        lines = [
            r"\begin{tabular}{" + specification + "}",
            r"\hline",
        ]

        for row_index, row in enumerate(matrix):
            cells = []

            for cell in row:
                cells.append(
                    self._render_cell(cell)
                )

            while len(cells) < column_count:
                cells.append("")

            lines.append(
                " & ".join(cells)
                + r" \\"
            )

            lines.append(
                r"\hline"
            )

        lines.append(
            r"\end{tabular}"
        )

        return "\n".join(lines) + "\n"

    # ------------------------------------------------------------------
    # tabularx
    # ------------------------------------------------------------------

    def _build_tabularx(
        self,
        matrix: list[list[dict[str, Any]]],
        column_count: int,
    ) -> str:
        specification = (
            "|"
            + "|".join(
                "X"
                for _ in range(column_count)
            )
            + "|"
        )

        lines = [
            r"\begin{tabularx}{\textwidth}{"
            + specification
            + "}",
            r"\hline",
        ]

        for row in matrix:
            cells = [
                self._render_cell(cell)
                for cell in row
            ]

            while len(cells) < column_count:
                cells.append("")

            lines.append(
                " & ".join(cells)
                + r" \\"
            )

            lines.append(
                r"\hline"
            )

        lines.append(
            r"\end{tabularx}"
        )

        return "\n".join(lines) + "\n"

    # ------------------------------------------------------------------
    # longtable
    # ------------------------------------------------------------------

    def _build_longtable(
        self,
        matrix: list[list[dict[str, Any]]],
        column_count: int,
    ) -> str:
        specification = (
            "|"
            + "|".join(
                "p{"
                + f"{max(0.05, 0.95 / column_count):.3f}\\textwidth"
                + "}"
                for _ in range(column_count)
            )
            + "|"
        )

        lines = [
            r"\begin{longtable}{"
            + specification
            + "}",
            r"\hline",
        ]

        for row in matrix:
            cells = [
                self._render_cell(cell)
                for cell in row
            ]

            while len(cells) < column_count:
                cells.append("")

            lines.append(
                " & ".join(cells)
                + r" \\"
            )

            lines.append(
                r"\hline"
            )

        lines.append(
            r"\end{longtable}"
        )

        return "\n".join(lines) + "\n"

    # ------------------------------------------------------------------
    # Cell rendering
    # ------------------------------------------------------------------

    def _render_cell(
        self,
        cell: dict[str, Any],
    ) -> str:
        content = (
            cell.get("latex")
            or ""
        ).strip()

        rowspan = max(
            1,
            int(
                cell.get(
                    "rowspan",
                    1,
                )
                or 1
            ),
        )

        colspan = max(
            1,
            int(
                cell.get(
                    "colspan",
                    1,
                )
                or 1
            ),
        )

        if not content:
            content = r"\mbox{}"

        if colspan > 1:
            content = (
                r"\multicolumn{"
                + str(colspan)
                + "}{|l|}{"
                + content
                + "}"
            )

        if rowspan > 1:
            content = (
                r"\multirow{"
                + str(rowspan)
                + "}{*}{"
                + content
                + "}"
            )

        return content

    # ------------------------------------------------------------------
    # Détection des tableaux complexes
    # ------------------------------------------------------------------

    def is_complex_table(
        self,
        table: Table,
    ) -> bool:
        if table is None:
            return False

        rows = list(table.rows)

        if not rows:
            return False

        if len(rows) >= 8:
            return True

        for row in rows:
            if len(row.cells) >= 6:
                return True

            for cell in row.cells:
                if len(cell.paragraphs) > 1:
                    return True

                if self._paragraph_has_math_in_cell(
                    cell
                ):
                    return True

        if self._has_merged_cells(table):
            return True

        return False

    def _paragraph_has_math_in_cell(
        self,
        cell: _Cell,
    ) -> bool:
        for paragraph in cell.paragraphs:
            if self._paragraph_has_math(
                paragraph
            ):
                return True

        return False

    # ------------------------------------------------------------------
    # Fusions
    # ------------------------------------------------------------------

    def _has_merged_cells(
        self,
        table: Table,
    ) -> bool:
        for row in table.rows:
            xml_cells = self._get_row_cells(
                row
            )

            for cell in xml_cells:
                colspan = self._get_colspan(
                    cell
                )

                rowspan = self._get_rowspan(
                    cell
                )

                if colspan > 1 or rowspan > 1:
                    return True

        return False

    def _get_colspan(
        self,
        xml_cell: Any,
    ) -> int:
        if xml_cell is None:
            return 1

        tc_pr = xml_cell.find(
            qn("w:tcPr")
        )

        if tc_pr is None:
            return 1

        grid_span = tc_pr.find(
            qn("w:gridSpan")
        )

        if grid_span is None:
            return 1

        value = grid_span.get(
            qn("w:val")
        )

        try:
            return max(
                1,
                int(value),
            )
        except (
            TypeError,
            ValueError,
        ):
            return 1

    def _get_rowspan(
        self,
        xml_cell: Any,
    ) -> int:
        """
        Détermine approximativement le rowspan.

        Word encode verticalement les cellules fusionnées avec vMerge.
        Le calcul complet nécessite de regarder les lignes suivantes ;
        cette méthode retourne donc 1 lorsque le niveau local ne permet
        pas de déterminer la hauteur.
        """

        if xml_cell is None:
            return 1

        tc_pr = xml_cell.find(
            qn("w:tcPr")
        )

        if tc_pr is None:
            return 1

        v_merge = tc_pr.find(
            qn("w:vMerge")
        )

        if v_merge is None:
            return 1

        value = v_merge.get(
            qn("w:val")
        )

        if value == "restart":
            return 2

        if value is None:
            return 1

        return 1

    # ------------------------------------------------------------------
    # Structure XML
    # ------------------------------------------------------------------

    def _get_row_cells(
        self,
        row: Any,
    ) -> list[Any]:
        tr = row._tr

        return [
            child
            for child in tr.iterchildren()
            if self._local_name(
                child.tag
            ) == "tc"
        ]

    def _get_xml_column_count(
        self,
        table: Table,
    ) -> int:
        tbl = table._tbl

        tbl_grid = tbl.find(
            qn("w:tblGrid")
        )

        if tbl_grid is not None:
            grid_columns = [
                child
                for child in tbl_grid.iterchildren()
                if self._local_name(
                    child.tag
                ) == "gridCol"
            ]

            if grid_columns:
                return len(
                    grid_columns
                )

        count = 0

        for row in table.rows:
            current = 0

            for cell in self._get_row_cells(row):
                current += self._get_colspan(
                    cell
                )

            count = max(
                count,
                current,
            )

        return count

    def _get_column_count(
        self,
        matrix: list[list[dict[str, Any]]],
    ) -> int:
        if not matrix:
            return 0

        return max(
            len(row)
            for row in matrix
        )

    # ------------------------------------------------------------------
    # Échappement
    # ------------------------------------------------------------------

    def escape_latex(
        self,
        text: str,
    ) -> str:
        if text is None:
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

        result = []

        for char in str(text):
            result.append(
                replacements.get(
                    char,
                    char,
                )
            )

        return replace_latex_symbols("".join(result))

    def _escape_math_text(
        self,
        text: str,
    ) -> str:
        if not text:
            return ""

        result = str(text)

        replacements = {
            "\\": r"\backslash ",
            "{": r"\{",
            "}": r"\}",
            "%": r"\%",
            "&": r"\&",
            "#": r"\#",
            "_": r"\_",
        }

        for source, target in replacements.items():
            result = result.replace(
                source,
                target,
            )

        return result

    # ------------------------------------------------------------------
    # Labels
    # ------------------------------------------------------------------

    def sanitize_label(
        self,
        label: str,
    ) -> str:
        value = str(label or "").strip()

        value = re.sub(
            r"[^A-Za-z0-9:_-]+",
            "-",
            value,
        )

        value = value.strip("-")

        if not value:
            value = "tab:table"

        if not value.startswith(
            "tab:"
        ):
            value = "tab:" + value

        return value

    # ------------------------------------------------------------------
    # XML utilities
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
    def _element_text(
        element: Any,
    ) -> str:
        if element is None:
            return ""

        return "".join(
            text
            for text in element.itertext()
            if text
        )


__all__ = [
    "TableConverter",
]
