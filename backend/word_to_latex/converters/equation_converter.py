import re
from xml.etree import ElementTree as ET


class EquationConverter:
    """
    Convertisseur OMML (Office Math Markup Language) vers LaTeX.

    Le convertisseur traite les principales structures mathématiques
    générées par Microsoft Word :

    - fractions ;
    - racines ;
    - indices / exposants ;
    - indices + exposants ;
    - pré-indices / pré-exposants ;
    - délimiteurs ;
    - opérateurs n-aires ;
    - limites ;
    - accents ;
    - barres ;
    - fonctions ;
    - matrices ;
    - systèmes d'équations ;
    - accolades ;
    - boîtes ;
    - phantom ;
    - symboles grecs et mathématiques.

    L'objectif est de transformer la structure OMML en véritable
    expression mathématique LaTeX et non en texte brut.

    Exemple conceptuel :

        (1-b∂xx)∂tη + ∂x(a∂xxu+u+uη)=0

    devient une expression LaTeX exploitable par pdflatex.
    """

    OMML_NAMESPACE = (
        "http://schemas.openxmlformats.org/officeDocument/2006/math"
    )
    WORD_NAMESPACE = (
        "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    )

    NS = {
        "m": OMML_NAMESPACE,
        "w": WORD_NAMESPACE,
    }

    # ------------------------------------------------------------------
    # Tags OMML
    # ------------------------------------------------------------------

    TAG_MATH = "oMath"
    TAG_MATH_PARAGRAPH = "oMathPara"

    TAG_RUN = "r"
    TAG_TEXT = "t"

    TAG_FRACTION = "f"
    TAG_NUMERATOR = "num"
    TAG_DENOMINATOR = "den"

    TAG_RADICAL = "rad"
    TAG_DEGREE = "deg"
    TAG_BASE = "e"

    TAG_SUBSCRIPT = "sSub"
    TAG_SUPERSCRIPT = "sSup"
    TAG_SUB_SUP = "sSubSup"
    TAG_SUB = "sub"
    TAG_SUP = "sup"

    TAG_DELIMITER = "d"
    TAG_DELIMITER_PROPERTIES = "dPr"
    TAG_BEGIN = "begChr"
    TAG_END = "endChr"
    TAG_SEPARATOR = "sepChr"

    TAG_NARY = "nary"
    TAG_NARY_PROPERTIES = "naryPr"

    TAG_LIMIT_LOW = "limLow"
    TAG_LIMIT_LOW_PROPERTIES = "limLowPr"

    TAG_LIMIT_UP = "limUpp"
    TAG_LIMIT_UP_PROPERTIES = "limUppPr"

    TAG_ACCENT = "acc"
    TAG_ACCENT_PROPERTIES = "accPr"
    TAG_ACCENT_CHARACTER = "chr"

    TAG_BAR = "bar"
    TAG_BAR_PROPERTIES = "barPr"

    TAG_FUNCTION = "func"
    TAG_FUNCTION_PROPERTIES = "funcPr"
    TAG_FUNCTION_NAME = "fName"

    TAG_MATRIX = "m"
    TAG_MATRIX_ROW = "mr"

    TAG_PRE_SUB_SUP = "sPre"

    TAG_EQ_ARRAY = "eqArr"

    TAG_GROUP_CHARACTER = "groupChr"
    TAG_GROUP_CHARACTER_PROPERTIES = "groupChrPr"

    TAG_BOX = "box"
    TAG_BORDER_BOX = "borderBox"

    TAG_PHANTOM = "phant"

    # ------------------------------------------------------------------
    # Caractères spéciaux LaTeX
    # ------------------------------------------------------------------

    LATEX_SPECIAL_CHARS = {
        "\\": r"\textbackslash{}",
        "{": r"\{",
        "}": r"\}",
        "_": r"\_",
        "^": r"\hat{}",
        "%": r"\%",
        "&": r"\&",
        "#": r"\#",
        "$": r"\$",
    }

    # ------------------------------------------------------------------
    # Symboles grecs
    # ------------------------------------------------------------------

    GREEK_SYMBOLS = {
        "α": r"\alpha",
        "β": r"\beta",
        "γ": r"\gamma",
        "δ": r"\delta",
        "ε": r"\epsilon",
        "ϵ": r"\varepsilon",
        "ζ": r"\zeta",
        "η": r"\eta",
        "θ": r"\theta",
        "ϑ": r"\vartheta",
        "ι": r"\iota",
        "κ": r"\kappa",
        "λ": r"\lambda",
        "μ": r"\mu",
        "ν": r"\nu",
        "ξ": r"\xi",
        "ο": "o",
        "π": r"\pi",
        "ϖ": r"\varpi",
        "ρ": r"\rho",
        "ϱ": r"\varrho",
        "σ": r"\sigma",
        "ς": r"\varsigma",
        "τ": r"\tau",
        "υ": r"\upsilon",
        "φ": r"\phi",
        "ϕ": r"\varphi",
        "χ": r"\chi",
        "ψ": r"\psi",
        "ω": r"\omega",
        "Α": "A",
        "Β": "B",
        "Γ": r"\Gamma",
        "Δ": r"\Delta",
        "Ε": "E",
        "Ζ": "Z",
        "Η": "H",
        "Θ": r"\Theta",
        "Ι": "I",
        "Κ": "K",
        "Λ": r"\Lambda",
        "Μ": "M",
        "Ν": "N",
        "Ξ": r"\Xi",
        "Ο": "O",
        "Π": r"\Pi",
        "Ρ": "P",
        "Σ": r"\Sigma",
        "Τ": "T",
        "Υ": r"\Upsilon",
        "Φ": r"\Phi",
        "Χ": "X",
        "Ψ": r"\Psi",
        "Ω": r"\Omega",
    }

    # ------------------------------------------------------------------
    # Symboles mathématiques
    # ------------------------------------------------------------------

    SYMBOLS = {
        "∞": r"\infty",
        "∂": r"\partial",
        "∇": r"\nabla",
        "√": r"\sqrt{}",
        "×": r"\times",
        "·": r"\cdot",
        "⋅": r"\cdot",
        "÷": r"\div",
        "±": r"\pm",
        "∓": r"\mp",
        "≤": r"\leq",
        "≥": r"\geq",
        "≠": r"\neq",
        "≈": r"\approx",
        "≃": r"\simeq",
        "≅": r"\cong",
        "≡": r"\equiv",
        "∼": r"\sim",
        "∝": r"\propto",
        "→": r"\rightarrow",
        "←": r"\leftarrow",
        "↔": r"\leftrightarrow",
        "⇒": r"\Rightarrow",
        "⇐": r"\Leftarrow",
        "⇔": r"\Leftrightarrow",
        "↦": r"\mapsto",
        "∈": r"\in",
        "∉": r"\notin",
        "⊂": r"\subset",
        "⊃": r"\supset",
        "⊆": r"\subseteq",
        "⊇": r"\supseteq",
        "∩": r"\cap",
        "∪": r"\cup",
        "∧": r"\land",
        "∨": r"\lor",
        "¬": r"\neg",
        "∀": r"\forall",
        "∃": r"\exists",
        "∄": r"\nexists",
        "∅": r"\emptyset",
        "ℝ": r"\mathbb{R}",
        "ℤ": r"\mathbb{Z}",
        "ℕ": r"\mathbb{N}",
        "ℚ": r"\mathbb{Q}",
        "ℂ": r"\mathbb{C}",
        "ℙ": r"\mathbb{P}",
        "∑": r"\sum",
        "∏": r"\prod",
        "∐": r"\coprod",
        "∫": r"\int",
        "∬": r"\iint",
        "∭": r"\iiint",
        "∮": r"\oint",
        "∯": r"\oiint",
        "∰": r"\oiiint",
        "ℓ": r"\ell",
        "ℏ": r"\hbar",
        "°": r"^\circ",
        "′": "'",
        "″": "''",
        "‴": "'''",
        "…": r"\ldots",
        "∴": r"\therefore",
        "∵": r"\because",
        "∠": r"\angle",
        "⊥": r"\perp",
        "∥": r"\parallel",
    }

    # ------------------------------------------------------------------
    # Fonctions mathématiques connues
    # ------------------------------------------------------------------

    KNOWN_FUNCTIONS = {
        "sin",
        "cos",
        "tan",
        "cot",
        "sec",
        "csc",
        "arcsin",
        "arccos",
        "arctan",
        "sinh",
        "cosh",
        "tanh",
        "coth",
        "sech",
        "csch",
        "log",
        "ln",
        "exp",
        "lim",
        "sup",
        "inf",
        "max",
        "min",
        "det",
        "dim",
        "ker",
        "rank",
        "gcd",
        "Pr",
        "arg",
        "deg",
    }

    # ------------------------------------------------------------------
    # Opérateurs n-aires OMML
    # ------------------------------------------------------------------

    NARY_OPERATORS = {
        "∑": r"\sum",
        "∏": r"\prod",
        "∐": r"\coprod",
        "∫": r"\int",
        "∬": r"\iint",
        "∭": r"\iiint",
        "∮": r"\oint",
        "∯": r"\oiint",
        "∰": r"\oiiint",
        "⋃": r"\bigcup",
        "⋂": r"\bigcap",
        "⋁": r"\bigvee",
        "⋀": r"\bigwedge",
    }

    # ------------------------------------------------------------------
    # Accents OMML
    # ------------------------------------------------------------------

    ACCENT_MAPPING = {
        "^": r"\hat",
        "ˆ": r"\hat",
        "¯": r"\bar",
        "‾": r"\overline",
        "~": r"\tilde",
        "˜": r"\tilde",
        "→": r"\vec",
        "˙": r"\dot",
        "¨": r"\ddot",
        "ˇ": r"\check",
        "˘": r"\breve",
        "⃗": r"\vec",
    }

    # ------------------------------------------------------------------
    # Initialisation
    # ------------------------------------------------------------------

    def __init__(self, display_environment="equation"):
        """
        Args:
            display_environment:
                Environnement LaTeX utilisé pour les équations affichées.
        """

        environment = str(display_environment or "equation").strip()

        if not re.fullmatch(r"[A-Za-z][A-Za-z0-9*]*", environment):
            environment = "equation"

        self.display_environment = environment

    # ==================================================================
    # API PRINCIPALE
    # ==================================================================

    def convert(self, element, display=False):
        """
        Convertit un élément OMML vers LaTeX.

        Args:
            element:
                Élément xml.etree.ElementTree représentant OMML.

            display:
                Si True, produit une équation affichée.
                Si False, produit une expression mathématique inline
                pour un élément m:oMath.
        """

        if element is None:
            return ""

        if isinstance(element, str):
            content = self.convert_text(element)

            if not content:
                return ""

            if display:
                return self.wrap_display_math(content)

            return self.wrap_inline_math(content)

        local_name = self.local_name(element.tag)

        if local_name == self.TAG_MATH_PARAGRAPH:
            return self.convert_math_paragraph(element)

        if local_name == self.TAG_MATH:
            content = self.convert_children(element)

            if not content:
                return ""

            if display:
                return self.wrap_display_math(content)

            return self.wrap_inline_math(content)

        content = self.convert_element(element)

        if not content:
            return ""

        if display:
            return self.wrap_display_math(content)

        return content

    # ==================================================================
    # PARAGRAPHE OMML
    # ==================================================================

    def convert_paragraph(self, paragraph, display=False):
        """
        Extrait les équations OMML d'un paragraphe python-docx.

        Cette méthode est principalement une API de compatibilité.
        La conservation exacte de l'ordre texte + équation + texte
        doit normalement être assurée par ParagraphConverter.
        """

        if paragraph is None:
            return ""

        try:
            paragraph_element = paragraph._p
        except AttributeError:
            return ""

        parts = []

        for child in list(paragraph_element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_MATH:
                converted = self.convert(
                    child,
                    display=display,
                )

                if converted:
                    parts.append(converted)

            elif local_name == self.TAG_MATH_PARAGRAPH:
                converted = self.convert_math_paragraph(child)

                if converted:
                    parts.append(converted)

        return "\n".join(
            part.strip()
            for part in parts
            if part and part.strip()
        ).strip()

    # ==================================================================
    # m:oMathPara
    # ==================================================================

    def convert_math_paragraph(self, element):
        """
        Convertit m:oMathPara.

        Word peut placer un ou plusieurs m:oMath dans m:oMathPara.
        """

        if element is None:
            return ""

        equations = []

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name != self.TAG_MATH:
                continue

            content = self.convert_children(child)

            if content:
                equations.append(content)

        if not equations:
            content = self.convert_children(element)

            if not content:
                return ""

            equations.append(content)

        if len(equations) == 1:
            return self.wrap_display_math(equations[0])

        return "\n".join(
            self.wrap_display_math(equation)
            for equation in equations
        )

    # ==================================================================
    # CONVERSION RÉCURSIVE
    # ==================================================================

    def convert_element(self, element):
        """
        Convertit récursivement un élément OMML.
        """

        if element is None:
            return ""

        local_name = self.local_name(element.tag)

        # --------------------------------------------------------------
        # Texte
        # --------------------------------------------------------------

        if local_name == self.TAG_TEXT:
            return self.convert_text(element.text or "")

        # --------------------------------------------------------------
        # Run OMML
        # --------------------------------------------------------------

        if local_name == self.TAG_RUN:
            return self.convert_children(element)

        # --------------------------------------------------------------
        # Fraction
        # --------------------------------------------------------------

        if local_name == self.TAG_FRACTION:
            return self.convert_fraction(element)

        # --------------------------------------------------------------
        # Racine
        # --------------------------------------------------------------

        if local_name == self.TAG_RADICAL:
            return self.convert_radical(element)

        # --------------------------------------------------------------
        # Indice
        # --------------------------------------------------------------

        if local_name == self.TAG_SUBSCRIPT:
            return self.convert_subscript(element)

        # --------------------------------------------------------------
        # Exposant
        # --------------------------------------------------------------

        if local_name == self.TAG_SUPERSCRIPT:
            return self.convert_superscript(element)

        # --------------------------------------------------------------
        # Indice + exposant
        # --------------------------------------------------------------

        if local_name == self.TAG_SUB_SUP:
            return self.convert_sub_sup(element)

        # --------------------------------------------------------------
        # Délimiteurs
        # --------------------------------------------------------------

        if local_name == self.TAG_DELIMITER:
            return self.convert_delimiter(element)

        # --------------------------------------------------------------
        # Opérateur n-aire
        # --------------------------------------------------------------

        if local_name == self.TAG_NARY:
            return self.convert_nary(element)

        # --------------------------------------------------------------
        # Limite inférieure
        # --------------------------------------------------------------

        if local_name == self.TAG_LIMIT_LOW:
            return self.convert_limit_low(element)

        # --------------------------------------------------------------
        # Limite supérieure
        # --------------------------------------------------------------

        if local_name == self.TAG_LIMIT_UP:
            return self.convert_limit_up(element)

        # --------------------------------------------------------------
        # Accent
        # --------------------------------------------------------------

        if local_name == self.TAG_ACCENT:
            return self.convert_accent(element)

        # --------------------------------------------------------------
        # Barre
        # --------------------------------------------------------------

        if local_name == self.TAG_BAR:
            return self.convert_bar(element)

        # --------------------------------------------------------------
        # Fonction
        # --------------------------------------------------------------

        if local_name == self.TAG_FUNCTION:
            return self.convert_function(element)

        # --------------------------------------------------------------
        # Matrice
        # --------------------------------------------------------------

        if local_name == self.TAG_MATRIX:
            return self.convert_matrix(element)

        # --------------------------------------------------------------
        # Pré-indice / pré-exposant
        # --------------------------------------------------------------

        if local_name == self.TAG_PRE_SUB_SUP:
            return self.convert_pre_sub_sup(element)

        # --------------------------------------------------------------
        # Système d'équations
        # --------------------------------------------------------------

        if local_name == self.TAG_EQ_ARRAY:
            return self.convert_equation_array(element)

        # --------------------------------------------------------------
        # Group character
        # --------------------------------------------------------------

        if local_name == self.TAG_GROUP_CHARACTER:
            return self.convert_group_character(element)

        # --------------------------------------------------------------
        # Box
        # --------------------------------------------------------------

        if local_name == self.TAG_BOX:
            return self.convert_box(element)

        # --------------------------------------------------------------
        # Border box
        # --------------------------------------------------------------

        if local_name == self.TAG_BORDER_BOX:
            return self.convert_border_box(element)

        # --------------------------------------------------------------
        # Phantom
        # --------------------------------------------------------------

        if local_name == self.TAG_PHANTOM:
            return self.convert_children(element)

        # --------------------------------------------------------------
        # Éléments structurels
        # --------------------------------------------------------------

        if local_name in {
            self.TAG_NUMERATOR,
            self.TAG_DENOMINATOR,
            self.TAG_DEGREE,
            self.TAG_BASE,
            self.TAG_SUB,
            self.TAG_SUP,
            self.TAG_FUNCTION_NAME,
            self.TAG_MATRIX_ROW,
        }:
            return self.convert_children(element)

        # --------------------------------------------------------------
        # Propriétés OMML
        # --------------------------------------------------------------

        if local_name.endswith("Pr"):
            return ""

        # --------------------------------------------------------------
        # Caractères de propriétés
        # --------------------------------------------------------------

        if local_name in {
            self.TAG_BEGIN,
            self.TAG_END,
            self.TAG_SEPARATOR,
        }:
            return ""

        # --------------------------------------------------------------
        # Fallback récursif
        # --------------------------------------------------------------

        return self.convert_children(element)

    # ==================================================================
    # ENFANTS
    # ==================================================================

    def convert_children(self, element):
        """
        Convertit tous les enfants utiles d'un élément.
        """

        if element is None:
            return ""

        parts = []

        for child in list(element):
            converted = self.convert_element(child)

            if converted:
                parts.append(converted)

        return "".join(parts)

    # ==================================================================
    # FRACTION
    # ==================================================================

    def convert_fraction(self, element):
        """
        Convertit une fraction OMML en :

            \\frac{numérateur}{dénominateur}
        """

        numerator = ""
        denominator = ""

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_NUMERATOR:
                numerator = self.convert_children(child)

            elif local_name == self.TAG_DENOMINATOR:
                denominator = self.convert_children(child)

        numerator = numerator or "{}"
        denominator = denominator or "{}"

        return (
            r"\frac{"
            + numerator
            + "}{"
            + denominator
            + "}"
        )

    # ==================================================================
    # RACINE
    # ==================================================================

    def convert_radical(self, element):
        """
        Convertit :

            √x

        en :

            \\sqrt{x}

        et les racines n-ièmes en :

            \\sqrt[n]{x}
        """

        degree = ""
        base = ""

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_DEGREE:
                degree = self.convert_children(child)

            elif local_name == self.TAG_BASE:
                base = self.convert_children(child)

        base = base or "{}"

        if degree:
            return (
                r"\sqrt["
                + degree
                + "]{"
                + base
                + "}"
            )

        return (
            r"\sqrt{"
            + base
            + "}"
        )

    # ==================================================================
    # INDICE
    # ==================================================================

    def convert_subscript(self, element):
        """
        Convertit :

            x_i

        en :

            x_{i}
        """

        base = ""
        subscript = ""

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_BASE:
                base = self.convert_children(child)

            elif local_name == self.TAG_SUB:
                subscript = self.convert_children(child)

        if not base:
            base = self.extract_first_content(element)

        if not base:
            return ""

        if not subscript:
            return base

        return (
            "{"
            + base
            + "}_{"
            + subscript
            + "}"
        )

    # ==================================================================
    # EXPOSANT
    # ==================================================================

    def convert_superscript(self, element):
        """
        Convertit :

            x²

        en :

            x^{2}
        """

        base = ""
        superscript = ""

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_BASE:
                base = self.convert_children(child)

            elif local_name == self.TAG_SUP:
                superscript = self.convert_children(child)

        if not base:
            base = self.extract_first_content(element)

        if not base:
            return ""

        if not superscript:
            return base

        return (
            "{"
            + base
            + "}^{"
            + superscript
            + "}"
        )

    # ==================================================================
    # INDICE + EXPOSANT
    # ==================================================================

    def convert_sub_sup(self, element):
        """
        Convertit une structure OMML sSubSup.
        """

        base = ""
        subscript = ""
        superscript = ""

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_BASE:
                base = self.convert_children(child)

            elif local_name == self.TAG_SUB:
                subscript = self.convert_children(child)

            elif local_name == self.TAG_SUP:
                superscript = self.convert_children(child)

        if not base:
            base = self.extract_first_content(element)

        if not base:
            return ""

        result = "{" + base + "}"

        if subscript:
            result += "_{" + subscript + "}"

        if superscript:
            result += "^{" + superscript + "}"

        return result

    # ==================================================================
    # DÉLIMITEURS
    # ==================================================================

    def convert_delimiter(self, element):
        """
        Convertit notamment :

            (x)
            [x]
            {x}
            |x|
            <x>
            ⟨x⟩
        """

        opening = "("
        closing = ")"

        content_parts = []

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_DELIMITER_PROPERTIES:
                opening, closing = self.read_delimiter_characters(child)

            elif local_name == self.TAG_BASE:
                content_parts.append(
                    self.convert_children(child)
                )

            elif local_name == "e":
                content_parts.append(
                    self.convert_children(child)
                )

        content = "".join(content_parts)

        if not content:
            return ""

        left = self.delimiter_to_latex(opening)
        right = self.delimiter_to_latex(closing)

        if left == "." and right == ".":
            return content

        return (
            r"\left"
            + left
            + content
            + r"\right"
            + right
        )

    def read_delimiter_characters(self, properties):
        """
        Lit les caractères begChr/endChr d'un dPr OMML.
        """

        opening = "("
        closing = ")"

        if properties is None:
            return opening, closing

        for child in list(properties):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_BEGIN:
                value = self.get_omml_attribute(child, "val")

                if value is not None:
                    opening = value

            elif local_name == self.TAG_END:
                value = self.get_omml_attribute(child, "val")

                if value is not None:
                    closing = value

        return opening, closing

    @staticmethod
    def delimiter_to_latex(delimiter):
        """
        Convertit un délimiteur Word vers son équivalent LaTeX.
        """

        mapping = {
            "": ".",
            "(": "(",
            ")": ")",
            "[": "[",
            "]": "]",
            "{": r"\{",
            "}": r"\}",
            "|": "|",
            "‖": r"\Vert",
            "⌈": r"\lceil",
            "⌉": r"\rceil",
            "⌊": r"\lfloor",
            "⌋": r"\rfloor",
            "⟨": r"\langle",
            "⟩": r"\rangle",
            "<": r"\langle",
            ">": r"\rangle",
            "/": "/",
            "\\": r"\backslash",
        }

        return mapping.get(
            delimiter,
            delimiter,
        )

    # ==================================================================
    # OPÉRATEURS N-AIRES
    # ==================================================================

    def convert_nary(self, element):
        """
        Convertit une structure OMML n-aire.

        Exemple :

            ∑_{i=1}^{n} a_i

        devient :

            \\sum_{i=1}^{n} a_i
        """

        operator = r"\sum"
        subscript = ""
        superscript = ""
        base = ""

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_NARY_PROPERTIES:
                operator = self.read_nary_operator(child)

            elif local_name == self.TAG_SUB:
                subscript = self.convert_children(child)

            elif local_name == self.TAG_SUP:
                superscript = self.convert_children(child)

            elif local_name == self.TAG_BASE:
                base = self.convert_children(child)

            elif local_name == "e":
                base = self.convert_children(child)

        result = operator

        if subscript:
            result += "_{" + subscript + "}"

        if superscript:
            result += "^{" + superscript + "}"

        if base:
            result += " " + base

        return result

    def read_nary_operator(self, properties):
        """
        Lit l'opérateur chr/@val dans naryPr.
        """

        if properties is None:
            return r"\sum"

        for child in list(properties):
            local_name = self.local_name(child.tag)

            if local_name != "chr":
                continue

            value = self.get_omml_attribute(child, "val")

            if not value:
                continue

            if value in self.NARY_OPERATORS:
                return self.NARY_OPERATORS[value]

            if value in self.SYMBOLS:
                return self.SYMBOLS[value]

            converted = self.convert_text(value)

            if converted:
                return converted

        return r"\sum"

    # ==================================================================
    # LIMITES
    # ==================================================================

    def convert_limit_low(self, element):
        """
        Convertit une limite inférieure OMML :

            lim_{x -> 0} f(x)

        """

        base = ""
        limit = ""

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_BASE:
                base = self.convert_children(child)

            elif local_name == "lim":
                limit = self.convert_children(child)

            elif local_name == "e" and not limit:
                limit = self.convert_children(child)

        if not base:
            base = self.extract_first_content(element)

        if not base:
            return ""

        if not limit:
            return base

        return (
            "{"
            + base
            + "}_{"
            + limit
            + "}"
        )

    def convert_limit_up(self, element):
        """
        Convertit une limite supérieure OMML.
        """

        base = ""
        limit = ""

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_BASE:
                base = self.convert_children(child)

            elif local_name == "lim":
                limit = self.convert_children(child)

            elif local_name == "e" and not limit:
                limit = self.convert_children(child)

        if not base:
            base = self.extract_first_content(element)

        if not base:
            return ""

        if not limit:
            return base

        return (
            "{"
            + base
            + "}^{"
            + limit
            + "}"
        )

    # ==================================================================
    # ACCENTS
    # ==================================================================

    def convert_accent(self, element):
        """
        Convertit un accent OMML.

        Exemples :

            x̂  -> \\hat{x}
            x̄  -> \\bar{x}
            x⃗  -> \\vec{x}
        """

        base = ""
        accent = "^"

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_ACCENT_PROPERTIES:
                accent = self.read_accent_character(child)

            elif local_name == self.TAG_BASE:
                base = self.convert_children(child)

            elif local_name == "e":
                base = self.convert_children(child)

        if not base:
            base = self.extract_first_content(element)

        if not base:
            return ""

        command = self.accent_to_latex(accent)

        return (
            command
            + "{"
            + base
            + "}"
        )

    def read_accent_character(self, properties):
        """
        Lit le caractère d'accent dans accPr.
        """

        if properties is None:
            return "^"

        for child in list(properties):
            local_name = self.local_name(child.tag)

            if local_name != self.TAG_ACCENT_CHARACTER:
                continue

            value = self.get_omml_attribute(child, "val")

            if value:
                return value

        return "^"

    def accent_to_latex(self, character):
        return self.ACCENT_MAPPING.get(
            character,
            r"\hat",
        )

    # ==================================================================
    # BARRE
    # ==================================================================

    def convert_bar(self, element):
        """
        Convertit une barre OMML en \\overline{}.
        """

        base = ""

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name in {
                self.TAG_BASE,
                "e",
            }:
                base = self.convert_children(child)

        if not base:
            base = self.extract_first_content(element)

        if not base:
            return ""

        return (
            r"\overline{"
            + base
            + "}"
        )

    # ==================================================================
    # FONCTIONS
    # ==================================================================

    def convert_function(self, element):
        """
        Convertit une fonction OMML.

        Les fonctions LaTeX connues utilisent directement leurs
        commandes natives :

            sin -> \\sin
            cos -> \\cos
            ln  -> \\ln

        Les fonctions inconnues utilisent :

            \\operatorname{nom}
        """

        function_name = ""
        argument = ""

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_FUNCTION_PROPERTIES:
                continue

            if local_name == self.TAG_FUNCTION_NAME:
                function_name = self.convert_children(child)

            elif local_name == self.TAG_BASE:
                argument += self.convert_children(child)

            elif local_name == "e":
                argument += self.convert_children(child)

        clean_name = self.strip_latex_commands(
            function_name
        ).strip()

        if clean_name in self.KNOWN_FUNCTIONS:
            function_latex = "\\" + clean_name

        elif function_name:
            function_latex = (
                r"\operatorname{"
                + self.strip_latex_commands(function_name)
                + "}"
            )

        else:
            function_latex = ""

        if argument:
            return function_latex + argument

        return function_latex

    # ==================================================================
    # MATRICE
    # ==================================================================

    def convert_matrix(self, element):
        """
        Convertit une matrice OMML.

        Exemple :

            [a b]
            [c d]

        devient :

            \\begin{matrix}
            a & b \\\\
            c & d
            \\end{matrix}
        """

        rows = []

        for child in list(element):
            if self.local_name(child.tag) != self.TAG_MATRIX_ROW:
                continue

            cells = []

            for cell in list(child):
                if self.local_name(cell.tag) != "e":
                    continue

                cells.append(
                    self.convert_children(cell)
                )

            if cells:
                rows.append(
                    " & ".join(cells)
                )

        if not rows:
            return ""

        return (
            r"\begin{matrix}"
            + r" \\ ".join(rows)
            + r"\end{matrix}"
        )

    # ==================================================================
    # PRÉ-INDICE / PRÉ-EXPOSANT
    # ==================================================================

    def convert_pre_sub_sup(self, element):
        """
        Convertit les pré-indices/pré-exposants OMML.

        Structure typique :

            m:sPre
                m:sub
                m:sup
                m:e

        Résultat :

            {}_{sub}^{sup}base
        """

        subscript = ""
        superscript = ""
        base = ""

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_SUB:
                subscript = self.convert_children(child)

            elif local_name == self.TAG_SUP:
                superscript = self.convert_children(child)

            elif local_name == self.TAG_BASE:
                base = self.convert_children(child)

            elif local_name == "e":
                base = self.convert_children(child)

        result = "{}"

        if subscript:
            result += "_{" + subscript + "}"

        if superscript:
            result += "^{" + superscript + "}"

        result += base

        return result

    # ==================================================================
    # SYSTÈME D'ÉQUATIONS
    # ==================================================================

    def convert_equation_array(self, element):
        """
        Convertit m:eqArr vers un environnement aligned.
        """

        rows = []

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name != "e":
                continue

            content = self.convert_children(child)

            if content:
                rows.append(content)

        if not rows:
            return ""

        return (
            r"\begin{aligned}"
            + r" \\ ".join(rows)
            + r"\end{aligned}"
        )

    # ==================================================================
    # GROUP CHARACTER
    # ==================================================================

    def convert_group_character(self, element):
        """
        Convertit les accolades/braces de groupement OMML.

        Par défaut :

            overbrace

        Selon le caractère :

            underbrace
        """

        base = ""
        character = r"\overbrace"

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name == self.TAG_GROUP_CHARACTER_PROPERTIES:
                value = self.read_group_character(child)

                if value in {
                    "_",
                    "⌢",
                    "⏞",
                    "︵",
                }:
                    character = r"\overbrace"

                elif value in {
                    "⌣",
                    "⏟",
                    "︶",
                }:
                    character = r"\underbrace"

            elif local_name in {
                "e",
                self.TAG_BASE,
            }:
                base = self.convert_children(child)

        if not base:
            base = self.extract_first_content(element)

        if not base:
            return ""

        return (
            character
            + "{"
            + base
            + "}"
        )

    def read_group_character(self, properties):
        """
        Lit le caractère chr d'un groupChrPr.
        """

        if properties is None:
            return ""

        for child in list(properties):
            if self.local_name(child.tag) != "chr":
                continue

            value = self.get_omml_attribute(
                child,
                "val",
            )

            if value:
                return value

        return ""

    # ==================================================================
    # BOX
    # ==================================================================

    def convert_box(self, element):
        """
        Convertit une boîte mathématique OMML.
        """

        content = self.extract_first_content(element)

        if not content:
            return ""

        return (
            r"\boxed{"
            + content
            + "}"
        )

    # ==================================================================
    # BORDER BOX
    # ==================================================================

    def convert_border_box(self, element):
        """
        Convertit une bordure mathématique OMML.
        """

        content = self.extract_first_content(element)

        if not content:
            return ""

        return (
            r"\boxed{"
            + content
            + "}"
        )

    # ==================================================================
    # TEXTE MATHÉMATIQUE
    # ==================================================================

    def convert_text(self, text):
        """
        Convertit le texte contenu dans m:t.

        Le texte est interprété comme du contenu mathématique OMML.

        Les caractères grecs et opérateurs scientifiques sont convertis
        vers les commandes LaTeX correspondantes.
        """

        if text is None:
            return ""

        text = str(text)

        if not text:
            return ""

        text = (
            text
            .replace("\r", "")
            .replace("\n", "")
            .replace("\t", " ")
        )

        # Normalisation des variantes Unicode du signe moins.
        text = (
            text
            .replace("−", "-")
            .replace("–", "-")
            .replace("—", "-")
            .replace("⁻", "-")
        )

        parts = []

        for character in text:
            if character in self.GREEK_SYMBOLS:
                parts.append(
                    self.GREEK_SYMBOLS[character]
                )
                continue

            if character in self.SYMBOLS:
                parts.append(
                    self.SYMBOLS[character]
                )
                continue

            if character == " ":
                parts.append(" ")
                continue

            # Caractères mathématiques qui ne nécessitent pas
            # d'échappement particulier dans ce contexte.
            if character in {
                "(",
                ")",
                "[",
                "]",
                ",",
                ";",
                ":",
                ".",
                "=",
                "+",
                "-",
                "/",
                "<",
                ">",
                "|",
                "!",
                "?",
                "*",
                "'",
                '"',
                ":",
            }:
                parts.append(character)
                continue

            if character in self.LATEX_SPECIAL_CHARS:
                parts.append(
                    self.LATEX_SPECIAL_CHARS[character]
                )
                continue

            parts.append(character)

        return "".join(parts)

    # ==================================================================
    # WRAPPERS MATH
    # ==================================================================

    @staticmethod
    def wrap_inline_math(content):
        """
        Produit une expression mathématique inline LaTeX.

        Exemple :

            x_i

        devient :

            \\(x_i\\)
        """

        if not content:
            return ""

        content = content.strip()

        if not content:
            return ""

        if (
            content.startswith(r"\(")
            and content.endswith(r"\)")
        ):
            return content

        return (
            r"\("
            + content
            + r"\)"
        )

    def wrap_display_math(self, content):
        """
        Produit une équation LaTeX affichée.
        """

        if not content:
            return ""

        content = content.strip()

        if not content:
            return ""

        environment = self.display_environment

        # Détecte un environnement equation déjà présent.
        environment_pattern = (
            rf"\\begin\{{{re.escape(environment)}\*?\}}"
        )

        if re.match(
            environment_pattern,
            content,
        ):
            return content

        return (
            rf"\begin{{{environment}}}"
            "\n"
            + content
            + "\n"
            rf"\end{{{environment}}}"
        )

    # ==================================================================
    # UTILITAIRES
    # ==================================================================

    @staticmethod
    def local_name(tag):
        """
        Retourne le nom local d'un tag XML.

        Exemple :

            {namespace}oMath -> oMath
        """

        if not tag:
            return ""

        return str(tag).rsplit("}", 1)[-1]

    def extract_first_content(self, element):
        """
        Extrait le premier contenu mathématique utile d'un élément.
        """

        if element is None:
            return ""

        for child in list(element):
            local_name = self.local_name(child.tag)

            if local_name in {
                "e",
                "r",
                "t",
                "base",
            }:
                content = self.convert_element(child)

                if content:
                    return content

        return self.convert_children(element)

    @classmethod
    def get_omml_attribute(cls, element, attribute):
        """
        Lit un attribut OMML en gérant les formes :

            val
            {OMML_NAMESPACE}val
        """

        if element is None:
            return None

        value = element.get(attribute)

        if value is not None:
            return value

        return element.get(
            f"{{{cls.OMML_NAMESPACE}}}{attribute}"
        )

    @staticmethod
    def strip_latex_commands(value):
        """
        Supprime les commandes LaTeX simples afin de récupérer
        le nom textuel d'une fonction.
        """

        if not value:
            return ""

        value = re.sub(
            r"\\[A-Za-z]+",
            "",
            value,
        )

        value = re.sub(
            r"[{}]",
            "",
            value,
        )

        return value.strip()

    # ==================================================================
    # COMPATIBILITÉ / API XML
    # ==================================================================

    def convert_xml(self, xml, display=False):
        """
        Convertit directement une chaîne XML OMML.

        Utile pour les tests unitaires et les traitements indépendants
        de python-docx.
        """

        if not xml:
            return ""

        try:
            root = ET.fromstring(xml)
        except ET.ParseError as exc:
            raise ValueError(
                "Le fragment XML OMML est invalide."
            ) from exc

        return self.convert(
            root,
            display=display,
        )

    # ==================================================================
    # API DE COMPATIBILITÉ
    # ==================================================================

    def convert_math_content(self, element, display=False):
        """
        Alias de compatibilité utilisé par certaines versions
        de ParagraphConverter/LatexGenerator.
        """

        return self.convert(
            element,
            display=display,
        )

    def has_math_content(self, element):
        """
        Vérifie si un élément XML contient du contenu OMML.
        """

        if element is None:
            return False

        if isinstance(element, str):
            return False

        for descendant in element.iter():
            local_name = self.local_name(
                descendant.tag
            )

            if local_name in {
                self.TAG_MATH,
                self.TAG_MATH_PARAGRAPH,
            }:
                return True

        return False

    def run_contains_math(self, run):
        """
        Vérifie si un run python-docx contient une équation OMML.
        """

        if run is None:
            return False

        try:
            run_element = run._r
        except AttributeError:
            return False

        return self.has_math_content(run_element)

    def convert_runs(self, runs):
        """
        API de compatibilité.

        Convertit une séquence de runs en conservant les fragments
        mathématiques rencontrés.
        """

        if runs is None:
            return ""

        parts = []

        for run in runs:
            try:
                run_element = run._r
            except AttributeError:
                continue

            for child in list(run_element):
                local_name = self.local_name(child.tag)

                if local_name == self.TAG_MATH:
                    converted = self.convert(
                        child,
                        display=False,
                    )

                    if converted:
                        parts.append(converted)

                elif local_name == self.TAG_MATH_PARAGRAPH:
                    converted = self.convert_math_paragraph(
                        child
                    )

                    if converted:
                        parts.append(converted)

        return "".join(parts)


__all__ = ["EquationConverter"]