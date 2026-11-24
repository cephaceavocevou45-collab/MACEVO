from __future__ import annotations

import re
from typing import Any, Optional

from docx.oxml.ns import qn
try:
    from .latex_symbols import replace_latex_symbols
except ImportError:
    from latex_symbols import replace_latex_symbols


class ParagraphConverter:
    """
    Convertit les paragraphes Word en LaTeX.

    Responsabilités :
    - texte normal ;
    - gras / italique / souligné / barré / petites capitales ;
    - exposants / indices ;
    - retours à la ligne ;
    - tabulations ;
    - hyperliens ;
    - équations OMML ;
    - paragraphes mathématiques ;
    - échappement LaTeX ;
    - conservation de l'ordre réel des éléments XML.

    Les équations sont déléguées à EquationConverter lorsque celui-ci
    est disponible.
    """

    WORD_NS = (
        "http://schemas.openxmlformats.org/"
        "wordprocessingml/2006/main"
    )

    MATH_NS = (
        "http://schemas.openxmlformats.org/"
        "officeDocument/2006/math"
    )

    REL_NS = (
        "http://schemas.openxmlformats.org/"
        "officeDocument/2006/relationships"
    )

    NS = {
        "w": WORD_NS,
        "m": MATH_NS,
        "r": REL_NS,
    }

    HEADING_COMMANDS = {
        1: "section",
        2: "subsection",
        3: "subsubsection",
        4: "paragraph",
        5: "subparagraph",
    }

    LATEX_SPECIAL_CHARS = {
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

    def __init__(
        self,
        equation_converter: Optional[Any] = None,
    ):
        self.equation_converter = equation_converter

    # ------------------------------------------------------------------
    # API principale
    # ------------------------------------------------------------------

    def convert(
        self,
        paragraph: Any,
        heading_level: Optional[int] = None,
    ) -> str:
        """
        Convertit un paragraphe Word en LaTeX.

        Si heading_level est fourni, le paragraphe est converti en titre.
        """

        if paragraph is None:
            return ""

        paragraph_element = getattr(
            paragraph,
            "_p",
            paragraph,
        )

        if self._is_math_paragraph(paragraph_element):
            return self.convert_math_paragraph(
                paragraph_element
            )

        content = self.convert_paragraph_element(
            paragraph_element
        )

        if not content.strip():
            return ""

        if heading_level is not None:
            return self._wrap_heading(
                content,
                heading_level,
            )

        return self._finalize_paragraph(content)

    def convert_paragraph_element(
        self,
        paragraph_element: Any,
    ) -> str:
        """
        Convertit le XML w:p en respectant strictement l'ordre
        des enfants XML.

        C'est important pour les documents scientifiques où une
        équation peut apparaître entre deux fragments de texte.
        """

        if paragraph_element is None:
            return ""

        parts: list[str] = []

        for child in paragraph_element.iterchildren():
            local_name = self._local_name(child.tag)

            if local_name == "r":
                parts.append(
                    self.convert_run_element(child)
                )

            elif local_name == "hyperlink":
                parts.append(
                    self.convert_hyperlink_element(child)
                )

            elif local_name == "oMath":
                parts.append(
                    self.convert_math_element(
                        child,
                        display=False,
                    )
                )

            elif local_name == "oMathPara":
                parts.append(
                    self.convert_math_element(
                        child,
                        display=True,
                    )
                )

            elif local_name == "smartTag":
                parts.append(
                    self.convert_container_element(child)
                )

            elif local_name in {
                "ins",
                "del",
                "moveFrom",
                "moveTo",
                "customXml",
                "sdt",
            }:
                parts.append(
                    self.convert_container_element(child)
                )

        return "".join(parts)

    # ------------------------------------------------------------------
    # Runs
    # ------------------------------------------------------------------

    def convert_run_element(
        self,
        run_element: Any,
    ) -> str:
        """
        Convertit un w:r.

        Le texte et les éléments spéciaux sont traités dans leur ordre
        d'apparition.
        """

        if run_element is None:
            return ""

        properties = self._get_run_properties(
            run_element
        )

        output: list[str] = []

        for child in run_element.iterchildren():
            local_name = self._local_name(child.tag)

            if local_name == "rPr":
                continue

            if local_name == "t":
                text = child.text or ""

                output.append(
                    self._apply_run_formatting(
                        self.escape_latex(text),
                        properties,
                    )
                )

            elif local_name == "tab":
                output.append(
                    r"\hspace{0.5cm}"
                )

            elif local_name == "br":
                output.append(
                    self._convert_break(child)
                )

            elif local_name == "cr":
                output.append(
                    r"\newline{}"
                )

            elif local_name == "noBreakHyphen":
                output.append("-")

            elif local_name == "softHyphen":
                output.append(
                    r"\-"
                )

            elif local_name == "sym":
                output.append(
                    self._convert_symbol(child)
                )

            elif local_name == "drawing":
                # Les images sont normalement gérées au niveau
                # LatexGenerator afin de pouvoir extraire le média.
                continue

            elif local_name == "pict":
                continue

            elif local_name == "object":
                continue

            elif local_name in {
                "footnoteReference",
                "commentReference",
            }:
                output.append(
                    self._convert_reference_element(child)
                )

            elif local_name == "fldChar":
                continue

            elif local_name == "instrText":
                continue

            elif local_name == "oMath":
                output.append(
                    self.convert_math_element(
                        child,
                        display=False,
                    )
                )

            else:
                nested_text = self._element_text(child)

                if nested_text:
                    output.append(
                        self._apply_run_formatting(
                            self.escape_latex(
                                nested_text
                            ),
                            properties,
                        )
                    )

        return replace_latex_symbols("".join(output))

    def _get_run_properties(
        self,
        run_element: Any,
    ) -> dict[str, Any]:
        properties = {
            "bold": False,
            "italic": False,
            "underline": False,
            "strike": False,
            "superscript": False,
            "subscript": False,
            "small_caps": False,
        }

        r_pr = run_element.find(
            qn("w:rPr")
        )

        if r_pr is None:
            return properties

        properties["bold"] = (
            r_pr.find(qn("w:b")) is not None
        )

        properties["italic"] = (
            r_pr.find(qn("w:i")) is not None
        )

        properties["strike"] = (
            r_pr.find(qn("w:strike")) is not None
        )

        properties["small_caps"] = (
            r_pr.find(qn("w:smallCaps")) is not None
        )

        underline = r_pr.find(
            qn("w:u")
        )

        if underline is not None:
            value = underline.get(
                qn("w:val")
            )

            properties["underline"] = (
                value not in {"none", "0"}
            )

        vertical = r_pr.find(
            qn("w:vertAlign")
        )

        if vertical is not None:
            value = vertical.get(
                qn("w:val")
            )

            properties["superscript"] = (
                value == "superscript"
            )

            properties["subscript"] = (
                value == "subscript"
            )

        return properties

    def _apply_run_formatting(
        self,
        text: str,
        properties: dict[str, Any],
    ) -> str:
        if not text:
            return ""

        result = text

        if properties.get("bold"):
            result = (
                r"\textbf{"
                + result
                + "}"
            )

        if properties.get("italic"):
            result = (
                r"\textit{"
                + result
                + "}"
            )

        if properties.get("underline"):
            result = (
                r"\underline{"
                + result
                + "}"
            )

        if properties.get("strike"):
            result = (
                r"\sout{"
                + result
                + "}"
            )

        if properties.get("small_caps"):
            result = (
                r"\textsc{"
                + result
                + "}"
            )

        if properties.get("superscript"):
            result = (
                r"\textsuperscript{"
                + result
                + "}"
            )

        if properties.get("subscript"):
            result = (
                r"\textsubscript{"
                + result
                + "}"
            )

        return result

    # ------------------------------------------------------------------
    # Hyperliens
    # ------------------------------------------------------------------

    def convert_hyperlink_element(
        self,
        hyperlink_element: Any,
    ) -> str:
        """
        Convertit un hyperlink Word.

        La résolution de la cible réelle du lien est laissée au
        LatexGenerator lorsqu'elle est disponible.
        """

        if hyperlink_element is None:
            return ""

        relationship_id = None

        for (
            attribute_name,
            attribute_value,
        ) in hyperlink_element.attrib.items():
            if self._local_name(attribute_name) == "id":
                relationship_id = attribute_value
                break

        text_parts: list[str] = []

        for child in hyperlink_element.iterchildren():
            local_name = self._local_name(
                child.tag
            )

            if local_name == "r":
                text_parts.append(
                    self.convert_run_element(child)
                )

            elif local_name == "oMath":
                text_parts.append(
                    self.convert_math_element(
                        child,
                        display=False,
                    )
                )

            elif local_name in {
                "smartTag",
                "ins",
                "del",
                "customXml",
                "sdt",
            }:
                text_parts.append(
                    self.convert_container_element(child)
                )

        text = "".join(text_parts)

        if not text:
            return ""

        # Le target réel pourra être résolu par LatexGenerator.
        # On conserve ici le texte du lien sans fabriquer une URL
        # incorrecte.
        if relationship_id:
            return text

        return text

    # ------------------------------------------------------------------
    # Équations OMML
    # ------------------------------------------------------------------

    def convert_math_element(
        self,
        element: Any,
        display: bool = False,
    ) -> str:
        """
        Convertit un élément OMML.

        On privilégie l'API publique EquationConverter :

            convert(element, display=True/False)

        afin d'éviter qu'une expression inline soit retournée comme
        du LaTeX brut sans délimiteurs mathématiques.
        """

        if element is None:
            return ""

        converter = self.equation_converter

        if converter is None:
            raw = self._fallback_convert_math(
                element
            )

            return self.wrap_math(
                raw,
                display=display,
            )

        # API principale.
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
                pass

            except Exception:
                pass

        # API alternative : convert_omml_element().
        method = getattr(
            converter,
            "convert_omml_element",
            None,
        )

        if callable(method):
            try:
                result = method(element)

                if result:
                    return self.wrap_math(
                        str(result),
                        display=display,
                    )

            except Exception:
                pass

        # API alternative : convert_element().
        method = getattr(
            converter,
            "convert_element",
            None,
        )

        if callable(method):
            try:
                result = method(element)

                if result:
                    return self.wrap_math(
                        str(result),
                        display=display,
                    )

            except Exception:
                pass

        # API alternative : convert_omml().
        method = getattr(
            converter,
            "convert_omml",
            None,
        )

        if callable(method):
            try:
                result = method(element)

                if result:
                    return self.wrap_math(
                        str(result),
                        display=display,
                    )

            except Exception:
                pass

        raw = self._fallback_convert_math(
            element
        )

        return self.wrap_math(
            raw,
            display=display,
        )

    def convert_math_paragraph(
        self,
        paragraph_element: Any,
    ) -> str:
        """
        Convertit un paragraphe contenant principalement une équation
        affichée.

        Si EquationConverter fournit une conversion spécialisée,
        celle-ci est utilisée.
        """

        if paragraph_element is None:
            return ""

        converter = self.equation_converter

        if converter is not None:
            method = getattr(
                converter,
                "convert_math_paragraph",
                None,
            )

            if callable(method):
                try:
                    result = method(
                        paragraph_element
                    )

                    if result:
                        return str(result).strip()

                except Exception:
                    pass

            method = getattr(
                converter,
                "convert_paragraph",
                None,
            )

            if callable(method):
                try:
                    result = method(
                        paragraph_element
                    )

                    if result:
                        result = str(result).strip()

                        if (
                            r"\begin{equation}" in result
                            or r"\begin{equation*}" in result
                            or r"\[" in result
                            or "$$" in result
                        ):
                            return result

                except Exception:
                    pass

        parts: list[str] = []

        for child in paragraph_element.iterchildren():
            local_name = self._local_name(
                child.tag
            )

            if local_name == "oMath":
                parts.append(
                    self.convert_math_element(
                        child,
                        display=True,
                    )
                )

            elif local_name == "oMathPara":
                parts.append(
                    self.convert_math_element(
                        child,
                        display=True,
                    )
                )

        return "\n\n".join(
            part
            for part in parts
            if part
        )

    def wrap_math(
        self,
        value: str,
        display: bool = False,
    ) -> str:
        """
        Ajoute les délimiteurs mathématiques si nécessaire.

        Inline :
            \\( ... \\)

        Display :
            \\[
                ...
            \\]
        """

        value = (value or "").strip()

        if not value:
            return ""

        if self._already_wrapped_math(value):
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

    @staticmethod
    def _already_wrapped_math(
        value: str,
    ) -> bool:
        stripped = value.strip()

        if (
            stripped.startswith(r"\(")
            and stripped.endswith(r"\)")
        ):
            return True

        if (
            stripped.startswith("$")
            and stripped.endswith("$")
        ):
            return True

        if (
            stripped.startswith(r"\[")
            and stripped.endswith(r"\]")
        ):
            return True

        if r"\begin{equation}" in stripped:
            return True

        if r"\begin{equation*}" in stripped:
            return True

        if r"\begin{align}" in stripped:
            return True

        if r"\begin{align*}" in stripped:
            return True

        if r"\begin{gather}" in stripped:
            return True

        if r"\begin{gather*}" in stripped:
            return True

        return False

    # ------------------------------------------------------------------
    # Fallback OMML
    # ------------------------------------------------------------------

    def _fallback_convert_math(
        self,
        element: Any,
    ) -> str:
        """
        Fallback robuste pour les structures OMML courantes.

        La conversion scientifique complète reste déléguée à
        EquationConverter.
        """

        if element is None:
            return ""

        local_name = self._local_name(
            element.tag
        )

        if local_name == "oMathPara":
            children = [
                child
                for child in element.iterchildren()
                if self._local_name(child.tag) == "oMath"
            ]

            return "".join(
                self._fallback_convert_math(child)
                for child in children
            )

        if local_name == "oMath":
            return "".join(
                self._fallback_convert_math(child)
                for child in element.iterchildren()
            )

        if local_name in {
            "r",
            "rPr",
        }:
            return self._element_text(element)

        if local_name == "t":
            return self.escape_math_text(
                element.text or ""
            )

        if local_name == "f":
            numerator = ""
            denominator = ""

            for child in element.iterchildren():
                name = self._local_name(
                    child.tag
                )

                if name == "num":
                    numerator = "".join(
                        self._fallback_convert_math(c)
                        for c in child.iterchildren()
                    )

                elif name == "den":
                    denominator = "".join(
                        self._fallback_convert_math(c)
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
                        self._fallback_convert_math(c)
                        for c in child.iterchildren()
                    )

                elif name == "sub":
                    sub = "".join(
                        self._fallback_convert_math(c)
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
                        self._fallback_convert_math(c)
                        for c in child.iterchildren()
                    )

                elif name == "sup":
                    sup = "".join(
                        self._fallback_convert_math(c)
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
                        self._fallback_convert_math(c)
                        for c in child.iterchildren()
                    )

                elif name == "sub":
                    sub = "".join(
                        self._fallback_convert_math(c)
                        for c in child.iterchildren()
                    )

                elif name == "sup":
                    sup = "".join(
                        self._fallback_convert_math(c)
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
            degree = ""
            expression = ""

            for child in element.iterchildren():
                name = self._local_name(
                    child.tag
                )

                if name == "deg":
                    degree = "".join(
                        self._fallback_convert_math(c)
                        for c in child.iterchildren()
                    )

                elif name == "e":
                    expression = "".join(
                        self._fallback_convert_math(c)
                        for c in child.iterchildren()
                    )

            if degree:
                return (
                    r"\sqrt["
                    + degree
                    + "]{"
                    + expression
                    + "}"
                )

            return (
                r"\sqrt{"
                + expression
                + "}"
            )

        if local_name == "d":
            value = "".join(
                self._fallback_convert_math(c)
                for c in element.iterchildren()
            )

            return value

        if local_name == "nary":
            expression = ""

            for child in element.iterchildren():
                name = self._local_name(
                    child.tag
                )

                if name in {
                    "sub",
                    "sup",
                    "e",
                }:
                    expression += "".join(
                        self._fallback_convert_math(c)
                        for c in child.iterchildren()
                    )

            return expression

        if local_name == "func":
            expression = "".join(
                self._fallback_convert_math(c)
                for c in element.iterchildren()
            )

            return expression

        if local_name == "limLow":
            base = ""
            limit = ""

            for child in element.iterchildren():
                name = self._local_name(
                    child.tag
                )

                if name == "e":
                    base = "".join(
                        self._fallback_convert_math(c)
                        for c in child.iterchildren()
                    )

                elif name == "lim":
                    limit = "".join(
                        self._fallback_convert_math(c)
                        for c in child.iterchildren()
                    )

            return (
                base
                + "_{"
                + limit
                + "}"
            )

        if local_name == "limUpp":
            base = ""
            limit = ""

            for child in element.iterchildren():
                name = self._local_name(
                    child.tag
                )

                if name == "e":
                    base = "".join(
                        self._fallback_convert_math(c)
                        for c in child.iterchildren()
                    )

                elif name == "lim":
                    limit = "".join(
                        self._fallback_convert_math(c)
                        for c in child.iterchildren()
                    )

            return (
                base
                + "^{"
                + limit
                + "}"
            )

        if local_name == "acc":
            expression = ""

            for child in element.iterchildren():
                name = self._local_name(
                    child.tag
                )

                if name == "e":
                    expression = "".join(
                        self._fallback_convert_math(c)
                        for c in child.iterchildren()
                    )

            return expression

        if local_name == "bar":
            expression = "".join(
                self._fallback_convert_math(c)
                for c in element.iterchildren()
            )

            return (
                r"\overline{"
                + expression
                + "}"
            )

        if local_name == "radPr":
            return ""

        return "".join(
            self._fallback_convert_math(child)
            for child in element.iterchildren()
        )

    # ------------------------------------------------------------------
    # Paragraphes / conteneurs
    # ------------------------------------------------------------------

    def convert_container_element(
        self,
        element: Any,
    ) -> str:
        if element is None:
            return ""

        parts: list[str] = []

        for child in element.iterchildren():
            local_name = self._local_name(
                child.tag
            )

            if local_name == "r":
                parts.append(
                    self.convert_run_element(child)
                )

            elif local_name == "hyperlink":
                parts.append(
                    self.convert_hyperlink_element(child)
                )

            elif local_name == "oMath":
                parts.append(
                    self.convert_math_element(
                        child,
                        display=False,
                    )
                )

            elif local_name == "oMathPara":
                parts.append(
                    self.convert_math_element(
                        child,
                        display=True,
                    )
                )

            else:
                parts.append(
                    self.convert_container_element(child)
                )

        return "".join(parts)

    # ------------------------------------------------------------------
    # Titres
    # ------------------------------------------------------------------

    def convert_heading(
        self,
        paragraph: Any,
        level: int,
    ) -> str:
        return self.convert(
            paragraph,
            heading_level=level,
        )

    def _wrap_heading(
        self,
        content: str,
        level: int,
    ) -> str:
        try:
            level = int(level)
        except (TypeError, ValueError):
            level = 1

        level = max(
            1,
            min(
                level,
                max(self.HEADING_COMMANDS),
            ),
        )

        command = self.HEADING_COMMANDS[
            level
        ]

        return (
            "\\"
            + command
            + "{"
            + content.strip()
            + "}\n\n"
        )

    # ------------------------------------------------------------------
    # Retours à la ligne
    # ------------------------------------------------------------------

    def _convert_break(
        self,
        break_element: Any,
    ) -> str:
        if break_element is None:
            return ""

        break_type = break_element.get(
            qn("w:type")
        )

        if break_type == "page":
            return r"\newpage{}"

        if break_type == "column":
            return r"\columnbreak{}"

        return r"\newline{}"

    # ------------------------------------------------------------------
    # Symboles Word
    # ------------------------------------------------------------------

    def _convert_symbol(
        self,
        element: Any,
    ) -> str:
        if element is None:
            return ""

        char_value = None

        for (
            attribute_name,
            attribute_value,
        ) in element.attrib.items():
            if self._local_name(attribute_name) == "char":
                char_value = attribute_value
                break

        if not char_value:
            return ""

        # Word stocke souvent le caractère sous forme hexadécimale.
        try:
            codepoint = int(
                char_value,
                16,
            )

            character = chr(codepoint)

            return self.escape_latex(
                character
            )

        except (TypeError, ValueError):
            return ""

    # ------------------------------------------------------------------
    # Références
    # ------------------------------------------------------------------

    def _convert_reference_element(
        self,
        element: Any,
    ) -> str:
        if element is None:
            return ""

        local_name = self._local_name(
            element.tag
        )

        if local_name == "footnoteReference":
            note_id = element.get(
                qn("w:id")
            )

            if note_id is not None:
                return (
                    r"\footnote{"
                    + self.escape_latex(
                        f"Note {note_id}"
                    )
                    + "}"
                )

        # Les commentaires ne sont pas insérés comme texte.
        # Leur extraction éventuelle est gérée par le générateur.
        if local_name == "commentReference":
            return ""

        return ""

    # ------------------------------------------------------------------
    # Finalisation
    # ------------------------------------------------------------------

    def _finalize_paragraph(
        self,
        content: str,
    ) -> str:
        content = content.strip()

        if not content:
            return ""

        # Nettoyage des espaces avant les retours à la ligne.
        content = re.sub(
            r"[ \t]+\n",
            "\n",
            content,
        )

        # Word peut générer plusieurs espaces successifs.
        content = re.sub(
            r"[ \t]{2,}",
            " ",
            content,
        )

        return (
            content
            + "\n\n"
        )

    # ------------------------------------------------------------------
    # Échappement LaTeX
    # ------------------------------------------------------------------

    def escape_latex(
        self,
        text: str,
    ) -> str:
        """
        Échappe uniquement le texte Word.

        Ne jamais appeler cette méthode sur du LaTeX déjà généré.
        """

        if text is None:
            return ""

        text = str(text)

        output: list[str] = []

        for character in text:
            output.append(
                self.LATEX_SPECIAL_CHARS.get(
                    character,
                    character,
                )
            )

        return replace_latex_symbols("".join(output))

    def escape_math_text(
        self,
        text: str,
    ) -> str:
        """
        Échappement spécifique au texte contenu dans OMML.

        Certains caractères restent volontairement utilisables
        dans les expressions mathématiques.
        """

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
    # Détection
    # ------------------------------------------------------------------

    def _is_math_paragraph(
        self,
        paragraph_element: Any,
    ) -> bool:
        """
        Détermine si un paragraphe est purement mathématique.

        Un paragraphe contenant uniquement une équation est traité
        comme une équation affichée.

        Un paragraphe mixte texte + équation reste un paragraphe
        normal avec équation inline.
        """

        if paragraph_element is None:
            return False

        has_math = False
        has_text = False

        for element in paragraph_element.iter():
            local_name = self._local_name(
                element.tag
            )

            if local_name in {
                "oMath",
                "oMathPara",
            }:
                has_math = True

            elif local_name == "t":
                if (element.text or "").strip():
                    has_text = True

        return (
            has_math
            and not has_text
        )

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
    "ParagraphConverter",
]
