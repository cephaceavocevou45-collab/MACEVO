"""
MACEVO — Normalisation des documents scientifiques.

Source canonique :

    reports.Report.content

Le contenu est généralement du HTML produit par Tiptap.

Ce service transforme le HTML Tiptap en une représentation
scientifique normalisée utilisée par :

- validation ;
- statistiques ;
- génération LaTeX ;
- export HTML ;
- export DOCX ;
- export PDF ;
- gestion des images et figures ;
- traitement des équations ;
- structure du document.

Le modèle Report reste le document canonique.
"""

from __future__ import annotations

from html import unescape
from html.parser import HTMLParser
import logging
import re
from typing import Any

from reports.models import Report


logger = logging.getLogger(__name__)


class ScientificHTMLParser(HTMLParser):
    """
    Parseur HTML spécialisé pour le contenu scientifique MACEVO.

    Il ne cherche pas à reproduire le DOM d'un navigateur.

    Il construit une représentation documentaire stable destinée
    aux services scientifiques et aux moteurs d'export.
    """

    BLOCK_TAGS = {
        "p",
        "div",
        "section",
        "article",
        "main",
        "blockquote",
        "pre",
        "figure",
        "table",
        "ul",
        "ol",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
    }

    HEADING_TAGS = {
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
    }

    INLINE_TAGS = {
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "strike",
        "del",
        "sup",
        "sub",
        "code",
        "span",
        "a",
    }

    VOID_TAGS = {
        "img",
        "br",
        "hr",
        "meta",
        "link",
        "input",
        "source",
        "area",
        "base",
        "col",
        "embed",
        "param",
        "track",
        "wbr",
    }

    def __init__(self) -> None:
        super().__init__(
            convert_charrefs=True,
        )

        self.blocks: list[dict[str, Any]] = []

        self.stack: list[str] = []

        self.current: dict[str, Any] | None = None
        self.current_text: list[str] = []

        self.inline_nodes: list[dict[str, Any]] = []
        self.inline_stack: list[dict[str, Any]] = []

        self.list_stack: list[dict[str, Any]] = []

        self.table_stack: list[dict[str, Any]] = []
        self.table_row: dict[str, Any] | None = None
        self.table_cell: dict[str, Any] | None = None
        self.table_cell_text: list[str] = []

        self.figure: dict[str, Any] | None = None
        self.current_image: dict[str, Any] | None = None

        self.in_figcaption = False
        self.figcaption_text: list[str] = []

        self.current_link: dict[str, Any] | None = None
        self.current_link_text: list[str] = []

        self.shape: dict[str, Any] | None = None
        self.shape_text: list[str] = []

        self.in_code_block = False

    # ------------------------------------------------------------------
    # Utilitaires
    # ------------------------------------------------------------------

    @staticmethod
    def _attrs_dict(attrs) -> dict[str, Any]:
        return {
            str(key).lower(): value
            for key, value in attrs
        }

    @staticmethod
    def _clean(value: Any) -> str:
        if value is None:
            return ""

        value = unescape(str(value))

        value = re.sub(
            r"\s+",
            " ",
            value,
        )

        return value.strip()

    @staticmethod
    def _normalize_text(value: str) -> str:
        if not value:
            return ""

        value = value.replace("\xa0", " ")

        value = re.sub(
            r"[ \t]+",
            " ",
            value,
        )

        return value

    def _active_marks(self) -> list[dict[str, Any]]:
        return [
            {
                "tag": mark.get("tag"),
                "attrs": dict(mark.get("attrs", {})),
            }
            for mark in self.inline_stack
        ]

    def _append_text_to_list_item(self, text: str) -> bool:
        if not self.list_stack:
            return False

        current_list = self.list_stack[-1]

        current_item = current_list.get("current_item")

        if current_item is None:
            return False

        current_list.setdefault(
            "current_item_text",
            [],
        ).append(text)

        marks = self._active_marks()

        if marks:
            current_item.setdefault(
                "inline_nodes",
                [],
            ).append(
                {
                    "type": "text",
                    "text": text,
                    "marks": marks,
                }
            )

        return True

    def _append_inline_text(self, text: str) -> None:
        if not text:
            return

        text = self._normalize_text(text)

        if not text:
            return

        if self.current_link is not None:
            self.current_link_text.append(text)
            return

        if self.table_cell is not None:
            self.table_cell_text.append(text)
            return

        if self.in_figcaption:
            self.figcaption_text.append(text)
            return

        if self.shape is not None:
            self.shape_text.append(text)
            return

        if self._append_text_to_list_item(text):
            return

        self.current_text.append(text)

        marks = self._active_marks()

        if marks and self.current is not None:
            self.inline_nodes.append(
                {
                    "type": "text",
                    "text": text,
                    "marks": marks,
                }
            )

    def _flush_text(self) -> None:
        if self.current is None:
            return

        text = "".join(
            self.current_text
        )

        if text:
            self.current["text"] += text

        self.current_text = []

    def _new_block(
        self,
        tag: str,
        attrs: dict[str, Any],
    ) -> None:
        self._flush_text()

        block_type = (
            "paragraph"
            if tag == "p"
            else tag
        )

        self.current = {
            "type": block_type,
            "tag": tag,
            "text": "",
            "attrs": dict(attrs),
            "children": [],
            "inline_nodes": [],
        }

        self.inline_nodes = []

    def _finish_current_block(self) -> None:
        if self.current is None:
            return

        self._flush_text()

        text = self._clean(
            self.current.get(
                "text",
                "",
            )
        )

        self.current["text"] = text

        if self.inline_nodes:
            self.current["inline_nodes"] = list(
                self.inline_nodes
            )

        tag = self.current.get("tag")

        if (
            text
            or self.current.get("inline_nodes")
            or self.current.get("images")
            or tag in {
                "figure",
                "table",
                "blockquote",
                "pre",
                "ul",
                "ol",
            }
        ):
            self.blocks.append(
                self.current
            )

        self.current = None
        self.inline_nodes = []
        self.current_text = []

    # ------------------------------------------------------------------
    # Listes
    # ------------------------------------------------------------------

    def _start_list(
        self,
        tag: str,
        attrs: dict[str, Any],
    ) -> None:
        self.list_stack.append(
            {
                "type": tag,
                "ordered": tag == "ol",
                "items": [],
                "attrs": dict(attrs),
                "current_item": None,
                "current_item_text": [],
                "depth": len(self.list_stack),
            }
        )

    def _start_list_item(self) -> None:
        if not self.list_stack:
            return

        current_list = self.list_stack[-1]

        current_list["current_item"] = {
            "text": "",
            "inline_nodes": [],
            "children": [],
        }

        current_list["current_item_text"] = []

    def _finish_list_item(self) -> None:
        if not self.list_stack:
            return

        current_list = self.list_stack[-1]

        item = current_list.get(
            "current_item"
        )

        if item is None:
            return

        text = "".join(
            current_list.get(
                "current_item_text",
                [],
            )
        )

        item["text"] = self._clean(
            text
        )

        if item["text"] or item.get("children"):
            current_list["items"].append(
                item
            )

        current_list["current_item"] = None
        current_list["current_item_text"] = []

    def _finish_list(self) -> None:
        if not self.list_stack:
            return

        self._finish_list_item()

        current_list = self.list_stack.pop()

        items = current_list.get(
            "items",
            [],
        )

        if not items:
            return

        block = {
            "type": "list",
            "tag": current_list["type"],
            "ordered": current_list["ordered"],
            "items": [
                item.get("text", "")
                for item in items
                if item.get("text")
            ],
            "items_detail": items,
            "attrs": current_list["attrs"],
            "depth": current_list["depth"],
        }

        self.blocks.append(block)

    # ------------------------------------------------------------------
    # Tableaux
    # ------------------------------------------------------------------

    def _start_table(
        self,
        attrs: dict[str, Any],
    ) -> None:
        self.table_stack.append(
            {
                "type": "table",
                "rows": [],
                "attrs": dict(attrs),
            }
        )

        self.table_row = None
        self.table_cell = None
        self.table_cell_text = []

    def _start_table_row(
        self,
        attrs: dict[str, Any],
    ) -> None:
        if not self.table_stack:
            return

        self.table_row = {
            "cells": [],
            "attrs": dict(attrs),
        }

    def _start_table_cell(
        self,
        tag: str,
        attrs: dict[str, Any],
    ) -> None:
        if self.table_row is None:
            return

        self.table_cell = {
            "type": tag,
            "tag": tag,
            "attrs": dict(attrs),
            "text": "",
        }

        self.table_cell_text = []

    def _finish_table_cell(self) -> None:
        if (
            self.table_row is None
            or self.table_cell is None
        ):
            return

        text = self._clean(
            "".join(
                self.table_cell_text
            )
        )

        self.table_cell["text"] = text

        self.table_row["cells"].append(
            self.table_cell
        )

        self.table_cell = None
        self.table_cell_text = []

    def _finish_table_row(self) -> None:
        if (
            not self.table_stack
            or self.table_row is None
        ):
            return

        self._finish_table_cell()

        self.table_stack[-1]["rows"].append(
            self.table_row["cells"]
        )

        self.table_row = None

    def _finish_table(self) -> None:
        if not self.table_stack:
            return

        self._finish_table_row()

        table = self.table_stack.pop()

        self.blocks.append(
            {
                "type": "table",
                "tag": "table",
                "rows": table["rows"],
                "attrs": table["attrs"],
            }
        )

        self.table_row = None
        self.table_cell = None
        self.table_cell_text = []

    # ------------------------------------------------------------------
    # Figures / images
    # ------------------------------------------------------------------

    def _start_figure(
        self,
        attrs: dict[str, Any],
    ) -> None:
        self.figure = {
            "type": "figure",
            "tag": "figure",
            "attrs": dict(attrs),
            "images": [],
            "caption": "",
        }

        self.figcaption_text = []

    def _finish_figure(self) -> None:
        if self.figure is None:
            return

        self.figure["caption"] = self._clean(
            "".join(
                self.figcaption_text
            )
        )

        self.blocks.append(
            self.figure
        )

        self.figure = None
        self.current_image = None
        self.in_figcaption = False
        self.figcaption_text = []

    # ------------------------------------------------------------------
    # ScientificShape
    # ------------------------------------------------------------------

    def _start_shape(
        self,
        attrs: dict[str, Any],
    ) -> None:
        self.shape = {
            "type": "scientific_shape",
            "tag": "div",
            "attrs": dict(attrs),
            "text": "",
        }

        self.shape_text = []

    def _finish_shape(self) -> None:
        if self.shape is None:
            return

        self.shape["text"] = self._clean(
            "".join(
                self.shape_text
            )
        )

        self.blocks.append(
            self.shape
        )

        self.shape = None
        self.shape_text = []

    # ------------------------------------------------------------------
    # HTML — ouverture
    # ------------------------------------------------------------------

    def handle_starttag(
        self,
        tag: str,
        attrs,
    ) -> None:
        tag = tag.lower()
        attrs_dict = self._attrs_dict(attrs)

        if tag not in self.VOID_TAGS:
            self.stack.append(tag)

        # --------------------------------------------------------------
        # MathNode Tiptap
        # --------------------------------------------------------------

        if tag == "span":
            latex = (
                attrs_dict.get("data-latex")
                or attrs_dict.get("data-equation")
            )

            if latex is not None:
                node = {
                    "type": "math",
                    "latex": unescape(
                        str(latex)
                    ).strip(),
                    "attrs": attrs_dict,
                }

                if self.current is not None:
                    self._flush_text()

                    self.current.setdefault(
                        "inline_nodes",
                        [],
                    ).append(node)

                    self.inline_nodes.append(
                        node
                    )

                elif self.list_stack:
                    current_list = self.list_stack[-1]
                    current_item = current_list.get(
                        "current_item"
                    )

                    if current_item is not None:
                        current_item.setdefault(
                            "inline_nodes",
                            [],
                        ).append(node)

                return

        # --------------------------------------------------------------
        # ScientificShape
        # --------------------------------------------------------------

        if (
            tag == "div"
            and attrs_dict.get("data-type")
            == "scientific-shape"
        ):
            self._start_shape(
                attrs_dict
            )
            return

        # --------------------------------------------------------------
        # Images
        # --------------------------------------------------------------

        if tag == "img":
            image = dict(attrs_dict)

            if self.figure is not None:
                self.figure["images"].append(
                    image
                )

                self.current_image = image
                return

            if self.current is None:
                self._new_block(
                    "figure",
                    {},
                )

            self.current.setdefault(
                "images",
                [],
            ).append(image)

            self.current_image = image
            return

        # --------------------------------------------------------------
        # Figure
        # --------------------------------------------------------------

        if tag == "figure":
            self._start_figure(
                attrs_dict
            )
            return

        if tag == "figcaption":
            self.in_figcaption = True
            self.figcaption_text = []
            return

        # --------------------------------------------------------------
        # Table
        # --------------------------------------------------------------

        if tag == "table":
            self._start_table(
                attrs_dict
            )
            return

        if tag == "tr":
            self._start_table_row(
                attrs_dict
            )
            return

        if tag in {"td", "th"}:
            self._start_table_cell(
                tag,
                attrs_dict,
            )
            return

        # --------------------------------------------------------------
        # Listes
        # --------------------------------------------------------------

        if tag in {"ul", "ol"}:
            self._start_list(
                tag,
                attrs_dict,
            )
            return

        if tag == "li":
            self._start_list_item()
            return

        # --------------------------------------------------------------
        # Liens
        # --------------------------------------------------------------

        if tag == "a":
            self.current_link = {
                "href": attrs_dict.get(
                    "href",
                    "",
                ),
                "attrs": attrs_dict,
            }

            self.current_link_text = []
            return

        # --------------------------------------------------------------
        # Code
        # --------------------------------------------------------------

        if tag == "pre":
            if self.current is not None:
                self._finish_current_block()

            self._new_block(
                "pre",
                attrs_dict,
            )

            self.in_code_block = True
            return

        # --------------------------------------------------------------
        # Balises de bloc
        # --------------------------------------------------------------

        if tag in self.BLOCK_TAGS:
            if tag in {
                "table",
                "ul",
                "ol",
                "figure",
                "pre",
            }:
                return

            if (
                self.table_cell is not None
                or self.current_link is not None
                or self.in_figcaption
                or self.shape is not None
                or self.list_stack
            ):
                return

            if self.current is not None:
                self._finish_current_block()

            self._new_block(
                tag,
                attrs_dict,
            )

            return

        # --------------------------------------------------------------
        # Formatage inline
        # --------------------------------------------------------------

        if tag in self.INLINE_TAGS:
            if tag != "span":
                self.inline_stack.append(
                    {
                        "tag": tag,
                        "attrs": attrs_dict,
                    }
                )

    # ------------------------------------------------------------------
    # HTML — fermeture
    # ------------------------------------------------------------------

    def handle_endtag(
        self,
        tag: str,
    ) -> None:
        tag = tag.lower()

        # --------------------------------------------------------------
        # MathNode
        # --------------------------------------------------------------

        if tag == "span":
            if (
                self.stack
                and self.stack[-1] == "span"
            ):
                self.stack.pop()

            return

        # --------------------------------------------------------------
        # ScientificShape
        # --------------------------------------------------------------

        if (
            tag == "div"
            and self.shape is not None
        ):
            self._finish_shape()

            if (
                self.stack
                and self.stack[-1] == "div"
            ):
                self.stack.pop()

            return

        # --------------------------------------------------------------
        # Image
        # --------------------------------------------------------------

        if tag == "img":
            self.current_image = None
            return

        # --------------------------------------------------------------
        # Figure
        # --------------------------------------------------------------

        if tag == "figcaption":
            self.in_figcaption = False

            if (
                self.stack
                and self.stack[-1] == "figcaption"
            ):
                self.stack.pop()

            return

        if tag == "figure":
            self._finish_figure()

            if (
                self.stack
                and self.stack[-1] == "figure"
            ):
                self.stack.pop()

            return

        # --------------------------------------------------------------
        # Table
        # --------------------------------------------------------------

        if tag in {"td", "th"}:
            self._finish_table_cell()

            if (
                self.stack
                and self.stack[-1] == tag
            ):
                self.stack.pop()

            return

        if tag == "tr":
            self._finish_table_row()

            if (
                self.stack
                and self.stack[-1] == "tr"
            ):
                self.stack.pop()

            return

        if tag == "table":
            self._finish_table()

            if (
                self.stack
                and self.stack[-1] == "table"
            ):
                self.stack.pop()

            return

        # --------------------------------------------------------------
        # Listes
        # --------------------------------------------------------------

        if tag == "li":
            self._finish_list_item()

            if (
                self.stack
                and self.stack[-1] == "li"
            ):
                self.stack.pop()

            return

        if tag in {"ul", "ol"}:
            self._finish_list()

            if (
                self.stack
                and self.stack[-1] == tag
            ):
                self.stack.pop()

            return

        # --------------------------------------------------------------
        # Lien
        # --------------------------------------------------------------

        if tag == "a":
            if self.current_link is not None:
                text = self._clean(
                    "".join(
                        self.current_link_text
                    )
                )

                if text:
                    node = {
                        "type": "link",
                        "href": self.current_link.get(
                            "href",
                            "",
                        ),
                        "text": text,
                    }

                    if self.current is not None:
                        self.current.setdefault(
                            "inline_nodes",
                            [],
                        ).append(node)

                        self.inline_nodes.append(
                            node
                        )

                self.current_link = None
                self.current_link_text = []

            if (
                self.stack
                and self.stack[-1] == "a"
            ):
                self.stack.pop()

            return

        # --------------------------------------------------------------
        # Code
        # --------------------------------------------------------------

        if tag == "pre":
            self.in_code_block = False

            if self.current is not None:
                self._finish_current_block()

            if (
                self.stack
                and self.stack[-1] == "pre"
            ):
                self.stack.pop()

            return

        # --------------------------------------------------------------
        # Formatage inline
        # --------------------------------------------------------------

        if tag in self.INLINE_TAGS:
            if tag != "span":
                for index in range(
                    len(self.inline_stack) - 1,
                    -1,
                    -1,
                ):
                    if (
                        self.inline_stack[index].get(
                            "tag"
                        )
                        == tag
                    ):
                        self.inline_stack.pop(index)
                        break

            if (
                self.stack
                and self.stack[-1] == tag
            ):
                self.stack.pop()

            return

        # --------------------------------------------------------------
        # Blocs
        # --------------------------------------------------------------

        if tag in self.BLOCK_TAGS:
            if self.current is not None:
                self._finish_current_block()

            if (
                self.stack
                and self.stack[-1] == tag
            ):
                self.stack.pop()

            return

        # --------------------------------------------------------------
        # Balise inconnue
        # --------------------------------------------------------------

        if (
            self.stack
            and self.stack[-1] == tag
        ):
            self.stack.pop()

    # ------------------------------------------------------------------
    # Texte
    # ------------------------------------------------------------------

    def handle_data(
        self,
        data: str,
    ) -> None:
        if not data:
            return

        if self.table_cell is not None:
            self.table_cell_text.append(
                data
            )
            return

        if self.current_link is not None:
            self.current_link_text.append(
                data
            )
            return

        if self.in_figcaption:
            self.figcaption_text.append(
                data
            )
            return

        if self.shape is not None:
            self.shape_text.append(
                data
            )
            return

        if self.list_stack:
            if self._append_text_to_list_item(
                data
            ):
                return

        self._append_inline_text(
            data
        )

    def handle_entityref(
        self,
        name: str,
    ) -> None:
        self.handle_data(
            unescape(
                f"&{name};"
            )
        )

    def handle_charref(
        self,
        name: str,
    ) -> None:
        self.handle_data(
            unescape(
                f"&#{name};"
            )
        )

    def close(self) -> None:
        """
        Termine proprement les structures éventuellement
        restées ouvertes dans un HTML imparfait.
        """

        try:
            super().close()

        finally:
            if self.current_link is not None:
                text = self._clean(
                    "".join(
                        self.current_link_text
                    )
                )

                if text and self.current is not None:
                    node = {
                        "type": "link",
                        "href": self.current_link.get(
                            "href",
                            "",
                        ),
                        "text": text,
                    }

                    self.current.setdefault(
                        "inline_nodes",
                        [],
                    ).append(node)

                    self.inline_nodes.append(
                        node
                    )

                self.current_link = None
                self.current_link_text = []

            if self.table_stack:
                self._finish_table()

            while self.list_stack:
                self._finish_list()

            if self.figure is not None:
                self._finish_figure()

            if self.shape is not None:
                self._finish_shape()

            if self.current is not None:
                self._finish_current_block()


class ReportDocumentBuilder:
    """
    Construit une représentation normalisée d'un Report.

    Cette représentation constitue le contrat documentaire central
    de MACEVO.

    Les services d'export ne doivent pas parser directement
    Report.content lorsqu'ils peuvent utiliser cette classe.
    """

    HEADING_TAGS = {
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
    }

    def __init__(
        self,
        report: Report,
    ) -> None:
        if not isinstance(report, Report):
            raise TypeError(
                "ReportDocumentBuilder attend une instance de reports.Report."
            )

        self.report = report

    # ------------------------------------------------------------------
    # Métadonnées
    # ------------------------------------------------------------------

    @staticmethod
    def _author_name(
        report: Report,
    ) -> str:
        author = report.author

        if not author:
            return "Non renseigné"

        full_name = (
            f"{getattr(author, 'first_name', '')} "
            f"{getattr(author, 'last_name', '')}"
        ).strip()

        return (
            full_name
            or getattr(
                author,
                "username",
                "",
            )
            or "Non renseigné"
        )

    @staticmethod
    def _clean_text(
        value: Any,
    ) -> str:
        if value is None:
            return ""

        value = unescape(
            str(value)
        )

        value = value.replace(
            "\xa0",
            " ",
        )

        value = re.sub(
            r"\s+",
            " ",
            value,
        )

        return value.strip()

    # ------------------------------------------------------------------
    # Parsing
    # ------------------------------------------------------------------

    def parse_content(self) -> list[dict[str, Any]]:
        html = self.report.content or ""

        if not html.strip():
            return []

        parser = ScientificHTMLParser()

        try:
            parser.feed(html)
            parser.close()

        except Exception:
            logger.exception(
                "Erreur pendant la normalisation HTML du rapport %s",
                self.report.pk,
            )
            return []

        return parser.blocks

    # ------------------------------------------------------------------
    # Math
    # ------------------------------------------------------------------

    def extract_math(
        self,
        html: str | None = None,
    ) -> list[str]:
        """
        Extrait les équations MathNode.

        La structure normalisée est prioritaire.
        Le HTML brut sert de fallback.
        """

        source_html = (
            self.report.content
            if html is None
            else html
        ) or ""

        blocks = self.parse_content()

        equations: list[str] = []

        def collect_nodes(
            nodes: Any,
        ) -> None:
            if not isinstance(nodes, list):
                return

            for node in nodes:
                if not isinstance(node, dict):
                    continue

                if node.get("type") == "math":
                    latex = str(
                        node.get(
                            "latex",
                            "",
                        )
                    ).strip()

                    if latex and latex not in equations:
                        equations.append(
                            latex
                        )

        for block in blocks:
            collect_nodes(
                block.get(
                    "inline_nodes",
                    [],
                )
            )

            for item in block.get(
                "items_detail",
                [],
            ):
                if isinstance(item, dict):
                    collect_nodes(
                        item.get(
                            "inline_nodes",
                            [],
                        )
                    )

        # Fallback HTML.
        if not equations and source_html:
            patterns = [
                re.compile(
                    r"""data-latex\s*=\s*(['"])(.*?)\1""",
                    flags=re.IGNORECASE | re.DOTALL,
                ),
                re.compile(
                    r"""data-equation\s*=\s*(['"])(.*?)\1""",
                    flags=re.IGNORECASE | re.DOTALL,
                ),
            ]

            for pattern in patterns:
                for match in pattern.finditer(
                    source_html
                ):
                    latex = unescape(
                        match.group(2)
                    ).strip()

                    if (
                        latex
                        and latex not in equations
                    ):
                        equations.append(
                            latex
                        )

        return equations

    # ------------------------------------------------------------------
    # Images
    # ------------------------------------------------------------------

    def extract_images(
        self,
        html: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Extrait les images du document.
        """

        source_html = (
            self.report.content
            if html is None
            else html
        ) or ""

        blocks = self.parse_content()

        images: list[dict[str, Any]] = []

        def add_image(
            image: Any,
        ) -> None:
            if not isinstance(image, dict):
                return

            normalized = {
                str(key).lower(): value
                for key, value in image.items()
            }

            src = str(
                normalized.get(
                    "src",
                    "",
                )
                or ""
            ).strip()

            asset_id = (
                normalized.get(
                    "data-asset-id"
                )
                or normalized.get(
                    "data-id"
                )
                or normalized.get(
                    "id"
                )
            )

            for existing in images:
                existing_src = str(
                    existing.get(
                        "src",
                        "",
                    )
                    or ""
                ).strip()

                existing_asset_id = (
                    existing.get(
                        "data-asset-id"
                    )
                    or existing.get(
                        "data-id"
                    )
                    or existing.get(
                        "id"
                    )
                )

                if (
                    asset_id
                    and existing_asset_id == asset_id
                ):
                    return

                if (
                    src
                    and existing_src == src
                ):
                    return

            images.append(
                normalized
            )

        for block in blocks:
            for image in block.get(
                "images",
                [],
            ):
                add_image(image)

            if block.get("type") == "figure":
                for image in block.get(
                    "images",
                    [],
                ):
                    add_image(image)

        if images:
            return images

        # Fallback HTML.
        image_pattern = re.compile(
            r"<img\b([^>]*)>",
            flags=re.IGNORECASE | re.DOTALL,
        )

        attribute_pattern = re.compile(
            r"""([:\w-]+)\s*=\s*(['"])(.*?)\2""",
            flags=re.DOTALL,
        )

        for match in image_pattern.finditer(
            source_html
        ):
            attrs: dict[str, Any] = {}

            for (
                key,
                _quote,
                value,
            ) in attribute_pattern.findall(
                match.group(1)
            ):
                attrs[
                    key.lower()
                ] = unescape(
                    value
                )

            add_image(attrs)

        return images

    # ------------------------------------------------------------------
    # Keywords / références
    # ------------------------------------------------------------------

    def _extract_keywords(
        self,
    ) -> list[str]:
        """
        Point d'extension pour une future gestion structurée
        des mots-clés.
        """

        return []

    def _extract_references(
        self,
    ) -> list[dict[str, Any]]:
        """
        Point d'extension pour une future gestion bibliographique
        structurée.
        """

        return []

    # ------------------------------------------------------------------
    # Texte normalisé
    # ------------------------------------------------------------------

    @staticmethod
    def _block_text(
        block: dict[str, Any],
    ) -> str:
        parts: list[str] = []

        text = block.get(
            "text",
            "",
        )

        if text:
            parts.append(
                str(text)
            )

        for node in block.get(
            "inline_nodes",
            [],
        ):
            if not isinstance(node, dict):
                continue

            node_type = node.get(
                "type"
            )

            if node_type == "math":
                latex = node.get(
                    "latex",
                    "",
                )

                if latex:
                    parts.append(
                        str(latex)
                    )

            elif node_type == "link":
                link_text = node.get(
                    "text",
                    "",
                )

                if link_text:
                    parts.append(
                        str(link_text)
                    )

            elif node_type == "text":
                node_text = node.get(
                    "text",
                    "",
                )

                if node_text:
                    parts.append(
                        str(node_text)
                    )

        for item in block.get(
            "items",
            [],
        ):
            if isinstance(item, str) and item:
                parts.append(item)

        return " ".join(
            part
            for part in parts
            if part
        )

    def _plain_text(
        self,
        blocks: list[dict[str, Any]],
    ) -> str:
        texts: list[str] = []

        for block in blocks:
            text = self._block_text(
                block
            )

            if text:
                texts.append(text)

            # Tableaux.
            for row in block.get(
                "rows",
                [],
            ):
                if not isinstance(
                    row,
                    list,
                ):
                    continue

                for cell in row:
                    if not isinstance(
                        cell,
                        dict,
                    ):
                        continue

                    cell_text = cell.get(
                        "text",
                        "",
                    )

                    if cell_text:
                        texts.append(
                            str(cell_text)
                        )

            # Images.
            for image in block.get(
                "images",
                [],
            ):
                if not isinstance(
                    image,
                    dict,
                ):
                    continue

                alt = (
                    image.get("alt")
                    or image.get("data-alt")
                    or image.get("title")
                    or ""
                )

                if alt:
                    texts.append(
                        str(alt)
                    )

            # Figure caption.
            caption = block.get(
                "caption",
                "",
            )

            if caption:
                texts.append(
                    str(caption)
                )

            # ScientificShape.
            if (
                block.get("type")
                == "scientific_shape"
            ):
                shape_text = block.get(
                    "text",
                    "",
                )

                if shape_text:
                    texts.append(
                        str(shape_text)
                    )

        return self._clean_text(
            " ".join(texts)
        )

    # ------------------------------------------------------------------
    # Build
    # ------------------------------------------------------------------

    def build(self) -> dict[str, Any]:
        html = self.report.content or ""

        blocks = self.parse_content()

        paragraphs = [
            block
            for block in blocks
            if block.get("type")
            == "paragraph"
        ]

        headings = [
            block
            for block in blocks
            if str(
                block.get(
                    "tag",
                    "",
                )
            ).lower()
            in self.HEADING_TAGS
        ]

        figures = [
            block
            for block in blocks
            if block.get("type")
            in {
                "figure",
                "scientific_shape",
            }
        ]

        tables = [
            block
            for block in blocks
            if block.get("type")
            == "table"
        ]

        lists = [
            block
            for block in blocks
            if block.get("type")
            == "list"
        ]

        math = self.extract_math(
            html
        )

        images = self.extract_images(
            html
        )

        plain_text = self._plain_text(
            blocks
        )

        words = [
            word
            for word in plain_text.split()
            if word
        ]

        metadata = {
            "title": (
                self.report.title
                or "Titre du rapport"
            ),
            "summary": (
                self.report.summary
                or ""
            ),
            "scientific_field": (
                self.report.scientific_field
                or ""
            ),
            "report_type": (
                self.report.report_type
                or ""
            ),
            "academic_level": (
                self.report.academic_level
                or ""
            ),
            "language": (
                self.report.language
                or "Français"
            ),
            "institution": (
                self.report.institution
                or ""
            ),
            "department": (
                self.report.department
                or ""
            ),
            "supervisor": (
                self.report.supervisor
                or ""
            ),
            "academic_year": (
                self.report.academic_year
                or ""
            ),
            "author": self._author_name(
                self.report
            ),
        }

        return {
            "id": self.report.pk,

            "metadata": metadata,

            "content_html": html,

            "blocks": blocks,

            "paragraphs": paragraphs,

            "headings": headings,

            "figures": figures,

            "tables": tables,

            "lists": lists,

            "math": math,

            "images": images,

            "keywords": self._extract_keywords(),

            "references": self._extract_references(),

            "statistics": {
                "characters": len(
                    plain_text
                ),

                "characters_without_spaces": len(
                    re.sub(
                        r"\s+",
                        "",
                        plain_text,
                    )
                ),

                "words": len(words),

                "paragraphs": len(
                    paragraphs
                ),

                "headings": len(
                    headings
                ),

                "images": len(
                    images
                ),

                "tables": len(
                    tables
                ),

                "lists": len(
                    lists
                ),

                "equations": len(
                    math
                ),
            },
        }


def build_document(
    report: Report,
) -> dict[str, Any]:
    """
    Point d'entrée simple utilisé par les autres services.
    """

    return ReportDocumentBuilder(
        report
    ).build()