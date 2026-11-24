
"""
==========================================================
MACEVO IA
LaTeX Equations
==========================================================

Générateur et utilitaire pour les équations LaTeX.

Objectifs :
- générer des équations inline et display ;
- gérer les environnements mathématiques ;
- normaliser les équations ;
- protéger certains caractères LaTeX ;
- générer des systèmes, matrices et alignements ;
- fournir des blocs prêts pour le Document IR ;
- rester compatible avec l'ancienne API.
"""

from __future__ import annotations

import re
from typing import Iterable


class LatexEquations:
    """
    Générateur d'équations LaTeX.
    """

    # ---------------------------------------------------------
    # Basic normalization
    # ---------------------------------------------------------

    @staticmethod
    def normalize(equation) -> str:
        """
        Normalise une équation avant génération.
        """

        if equation is None:
            return ""

        equation = str(equation)

        # Normalisation des espaces.
        equation = equation.replace("\r\n", "\n")
        equation = equation.replace("\r", "\n")

        return equation.strip()

    @staticmethod
    def is_empty(equation) -> bool:
        """
        Vérifie si une équation est vide.
        """

        return not LatexEquations.normalize(
            equation
        )

    # ---------------------------------------------------------
    # Inline / Display
    # ---------------------------------------------------------

    @staticmethod
    def inline(equation) -> str:
        """
        Génère une équation inline.

        Exemple :
            LatexEquations.inline("E = mc^2")

        Retour :
            $E = mc^2$
        """

        equation = LatexEquations.normalize(equation)

        if not equation:
            return ""

        # Évite d'encapsuler deux fois une équation déjà inline.
        if (
            equation.startswith("$")
            and equation.endswith("$")
        ):
            return equation

        return f"${equation}$"

    @staticmethod
    def display(equation) -> str:
        """
        Génère une équation en mode display.

        Utilise \\[ ... \\] afin d'éviter la numérotation automatique.
        """

        equation = LatexEquations.normalize(equation)

        if not equation:
            return ""

        # Si l'équation est déjà dans un environnement display,
        # ne pas l'imbriquer inutilement.
        if (
            equation.startswith("\\[")
            and equation.endswith("\\]")
        ):
            return equation

        return (
            "\\[\n"
            f"{equation}\n"
            "\\]"
        )

    # ---------------------------------------------------------
    # Numbered equations
    # ---------------------------------------------------------

    @staticmethod
    def numbered(
        equation,
        label: str | None = None,
    ) -> str:
        """
        Génère une équation numérotée.

        Exemple :

            \\begin{equation}
            E = mc^2
            \\label{eq:energy}
            \\end{equation}
        """

        equation = LatexEquations.normalize(equation)

        if not equation:
            return ""

        lines = [
            "\\begin{equation}",
            equation,
        ]

        if label:
            lines.append(
                LatexEquations.label(label)
            )

        lines.append(
            "\\end{equation}"
        )

        return "\n".join(lines)

    # ---------------------------------------------------------
    # Environments
    # ---------------------------------------------------------

    @staticmethod
    def begin_environment(name) -> str:
        """
        Génère l'ouverture d'un environnement LaTeX.
        """

        name = str(name).strip()

        if not name:
            raise ValueError(
                "Le nom de l'environnement est obligatoire."
            )

        return f"\\begin{{{name}}}"

    @staticmethod
    def end_environment(name) -> str:
        """
        Génère la fermeture d'un environnement LaTeX.
        """

        name = str(name).strip()

        if not name:
            raise ValueError(
                "Le nom de l'environnement est obligatoire."
            )

        return f"\\end{{{name}}}"

    @classmethod
    def environment(
        cls,
        name,
        content="",
        options: str | None = None,
    ) -> str:
        """
        Génère un environnement LaTeX complet.

        Exemple :

            LatexEquations.environment(
                "align",
                "a &= b + c \\\\",
            )
        """

        name = str(name).strip()

        if not name:
            raise ValueError(
                "Le nom de l'environnement est obligatoire."
            )

        content = cls.normalize(content)

        begin = (
            f"\\begin{{{name}}}"
            if not options
            else f"\\begin{{{name}}}[{options}]"
        )

        end = f"\\end{{{name}}}"

        if content:
            return (
                f"{begin}\n"
                f"{content}\n"
                f"{end}"
            )

        return (
            f"{begin}\n"
            f"{end}"
        )

    # ---------------------------------------------------------
    # Alignment
    # ---------------------------------------------------------

    @classmethod
    def align(
        cls,
        equations: Iterable[str],
        numbered: bool = False,
    ) -> str:
        """
        Génère un bloc align / align*.

        Exemple :

            [
                "a &= b + c",
                "x &= y + z",
            ]
        """

        items = [
            cls.normalize(item)
            for item in equations
            if cls.normalize(item)
        ]

        if not items:
            return ""

        environment = (
            "align"
            if numbered
            else "align*"
        )

        content = " \\\\\n".join(items)

        return cls.environment(
            environment,
            content,
        )

    # ---------------------------------------------------------
    # Equation systems
    # ---------------------------------------------------------

    @classmethod
    def system(
        cls,
        equations: Iterable[str],
        alignment: str = "&",
    ) -> str:
        """
        Génère un système d'équations.

        Exemple :

            \\begin{cases}
            x + y = 10 \\\\
            x - y = 2
            \\end{cases}
        """

        items = [
            cls.normalize(item)
            for item in equations
            if cls.normalize(item)
        ]

        if not items:
            return ""

        content = " \\\\\n".join(
            items
        )

        return (
            "\\begin{cases}\n"
            f"{content}\n"
            "\\end{cases}"
        )

    # ---------------------------------------------------------
    # Matrix
    # ---------------------------------------------------------

    @classmethod
    def matrix(
        cls,
        rows: Iterable[Iterable[str]],
        environment: str = "bmatrix",
    ) -> str:
        """
        Génère une matrice LaTeX.

        Exemple :

            [
                ["a", "b"],
                ["c", "d"],
            ]

        devient :

            \\begin{bmatrix}
            a & b \\\\
            c & d
            \\end{bmatrix}
        """

        matrix_rows: list[str] = []

        for row in rows:
            values = [
                cls.normalize(value)
                for value in row
            ]

            matrix_rows.append(
                " & ".join(values)
            )

        if not matrix_rows:
            return ""

        content = " \\\\\n".join(
            matrix_rows
        )

        return cls.environment(
            environment,
            content,
        )

    # ---------------------------------------------------------
    # Cases
    # ---------------------------------------------------------

    @classmethod
    def cases(
        cls,
        cases: Iterable[tuple[str, str] | str],
    ) -> str:
        """
        Génère un environnement cases.

        Accepte :

            [
                ("x", "si x > 0"),
                ("0", "sinon"),
            ]

        ou simplement des chaînes.
        """

        rows: list[str] = []

        for item in cases:

            if isinstance(item, (tuple, list)):
                if len(item) >= 2:
                    expression = cls.normalize(
                        item[0]
                    )
                    condition = cls.normalize(
                        item[1]
                    )

                    rows.append(
                        f"{expression} & {condition}"
                    )
            else:
                rows.append(
                    cls.normalize(item)
                )

        rows = [
            row
            for row in rows
            if row
        ]

        if not rows:
            return ""

        content = " \\\\\n".join(rows)

        return (
            "\\begin{cases}\n"
            f"{content}\n"
            "\\end{cases}"
        )

    # ---------------------------------------------------------
    # Fractions / powers / roots
    # ---------------------------------------------------------

    @staticmethod
    def fraction(
        numerator,
        denominator,
    ) -> str:
        """
        Génère une fraction.
        """

        numerator = LatexEquations.normalize(
            numerator
        )
        denominator = LatexEquations.normalize(
            denominator
        )

        return (
            f"\\frac{{{numerator}}}"
            f"{{{denominator}}}"
        )

    @staticmethod
    def power(
        base,
        exponent,
    ) -> str:
        """
        Génère une puissance.
        """

        base = LatexEquations.normalize(base)
        exponent = LatexEquations.normalize(
            exponent
        )

        return (
            f"{base}^{{{exponent}}}"
        )

    @staticmethod
    def subscript(
        base,
        index,
    ) -> str:
        """
        Génère un indice.
        """

        base = LatexEquations.normalize(base)
        index = LatexEquations.normalize(index)

        return (
            f"{base}_{{{index}}}"
        )

    @staticmethod
    def sqrt(expression) -> str:
        """
        Génère une racine carrée.
        """

        expression = LatexEquations.normalize(
            expression
        )

        return f"\\sqrt{{{expression}}}"

    @staticmethod
    def root(
        degree,
        expression,
    ) -> str:
        """
        Génère une racine d'ordre n.
        """

        degree = LatexEquations.normalize(degree)
        expression = LatexEquations.normalize(
            expression
        )

        return (
            f"\\sqrt[{degree}]"
            f"{{{expression}}}"
        )

    # ---------------------------------------------------------
    # Operators
    # ---------------------------------------------------------

    @staticmethod
    def sum(
        variable,
        lower,
        upper,
        expression,
    ) -> str:
        """
        Génère une somme.
        """

        variable = LatexEquations.normalize(
            variable
        )
        lower = LatexEquations.normalize(lower)
        upper = LatexEquations.normalize(upper)
        expression = LatexEquations.normalize(
            expression
        )

        return (
            f"\\sum_{{{variable}={lower}}}"
            f"^{{{upper}}}"
            f" {expression}"
        )

    @staticmethod
    def integral(
        variable,
        lower=None,
        upper=None,
        expression="",
    ) -> str:
        """
        Génère une intégrale.
        """

        variable = LatexEquations.normalize(
            variable
        )
        expression = LatexEquations.normalize(
            expression
        )

        if lower is None and upper is None:
            operator = "\\int"

        else:
            lower = LatexEquations.normalize(lower)
            upper = LatexEquations.normalize(upper)

            operator = (
                f"\\int_{{{lower}}}^{{{upper}}}"
            )

        if expression:
            return (
                f"{operator} "
                f"{expression}"
                f"\\, d{variable}"
            )

        return operator

    @staticmethod
    def limit(
        variable,
        value,
        expression,
    ) -> str:
        """
        Génère une limite.
        """

        variable = LatexEquations.normalize(
            variable
        )
        value = LatexEquations.normalize(value)
        expression = LatexEquations.normalize(
            expression
        )

        return (
            f"\\lim_{{{variable} \\to {value}}}"
            f" {expression}"
        )

    # ---------------------------------------------------------
    # Labels / references
    # ---------------------------------------------------------

    @staticmethod
    def label(identifier) -> str:
        """
        Génère un label LaTeX.

        Exemple :
            \\label{eq:energy}
        """

        identifier = str(identifier).strip()

        if not identifier:
            raise ValueError(
                "L'identifiant du label est obligatoire."
            )

        # Nettoyage léger pour éviter les espaces.
        identifier = re.sub(
            r"\s+",
            "-",
            identifier,
        )

        return f"\\label{{{identifier}}}"

    @staticmethod
    def reference(identifier) -> str:
        """
        Génère une référence LaTeX.
        """

        identifier = str(identifier).strip()

        if not identifier:
            raise ValueError(
                "L'identifiant de référence est obligatoire."
            )

        return f"\\ref{{{identifier}}}"

    # ---------------------------------------------------------
    # Validation
    # ---------------------------------------------------------

    @staticmethod
    def validate(equation) -> dict[str, object]:
        """
        Validation légère d'une équation LaTeX.

        Cette méthode ne cherche pas à remplacer un compilateur
        LaTeX. Elle détecte uniquement les erreurs structurelles
        évidentes.
        """

        equation = LatexEquations.normalize(
            equation
        )

        errors: list[str] = []
        warnings: list[str] = []

        if not equation:
            errors.append(
                "L'équation est vide."
            )

        # Vérification basique des accolades.
        balance = 0

        escaped = False

        for character in equation:

            if character == "\\" and not escaped:
                escaped = True
                continue

            if character == "{" and not escaped:
                balance += 1

            elif character == "}" and not escaped:
                balance -= 1

                if balance < 0:
                    errors.append(
                        "Accolade fermante sans "
                        "accolade ouvrante correspondante."
                    )
                    break

            escaped = False

        if balance > 0:
            errors.append(
                "Accolades non équilibrées."
            )

        # Détection simple de certains environnements.
        begins = re.findall(
            r"\\begin\{([^}]+)\}",
            equation,
        )

        ends = re.findall(
            r"\\end\{([^}]+)\}",
            equation,
        )

        if len(begins) != len(ends):
            errors.append(
                "Le nombre de \\begin et \\end "
                "ne correspond pas."
            )

        elif begins != ends:
            warnings.append(
                "Les environnements \\begin/\\end "
                "semblent ne pas être correctement imbriqués."
            )

        return {
            "valid": not errors,
            "errors": errors,
            "warnings": warnings,
        }

    # ---------------------------------------------------------
    # IR helper
    # ---------------------------------------------------------

    @classmethod
    def to_ir(
        cls,
        equation,
        *,
        display: bool = True,
        numbered: bool = False,
        label: str | None = None,
        description: str | None = None,
    ) -> dict[str, object]:
        """
        Prépare une équation pour le futur Document IR scientifique.

        Cette méthode ne remplace pas le Document IR final.
        Elle fournit simplement une représentation intermédiaire
        normalisée.
        """

        equation = cls.normalize(equation)

        latex = equation

        if numbered:
            latex = cls.numbered(
                equation,
                label=label,
            )

        elif display:
            latex = cls.display(
                equation,
            )

        else:
            latex = cls.inline(
                equation,
            )

        validation = cls.validate(
            equation,
        )

        return {
            "type": "equation",
            "latex": latex,
            "source": equation,
            "display": display,
            "numbered": numbered,
            "label": label,
            "description": description,
            "validation": validation,
        }

    # ---------------------------------------------------------
    # Information
    # ---------------------------------------------------------

    @classmethod
    def info(cls) -> dict[str, object]:
        """
        Informations sur le générateur.
        """

        return {
            "name": "LatexEquations",
            "features": [
                "inline",
                "display",
                "numbered_equations",
                "environments",
                "alignment",
                "systems",
                "matrices",
                "cases",
                "fractions",
                "powers",
                "subscripts",
                "roots",
                "sums",
                "integrals",
                "limits",
                "labels",
                "references",
                "validation",
                "document_ir_preparation",
            ],
        }
