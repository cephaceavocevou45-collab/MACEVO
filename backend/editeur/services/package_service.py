"""
MACEVO — Résolution dynamique des packages LaTeX.

Le resolver est responsable de déterminer les packages nécessaires
à la génération d'un document scientifique LaTeX.

Le LatexService utilise ensuite cette résolution pour construire
un projet cohérent.
"""

from __future__ import annotations

import re
from typing import Any


class LatexPackageResolver:
    """
    Résout les dépendances LaTeX nécessaires au document.

    Le resolver produit une liste :

        ["geometry", "graphicx", ...]

    sans doublons et dans un ordre déterministe.
    """

    BASE_PACKAGES = [
        "geometry",
        "graphicx",
        "hyperref",
        "amsmath",
        "amssymb",
        "mathtools",
        "array",
        "booktabs",
        "longtable",
        "tabularx",
        "xcolor",
        "float",
        "caption",
        "setspace",
    ]

    OPTIONAL_PACKAGES = {
        "math": [
            "amsmath",
            "amssymb",
            "mathtools",
        ],
        "images": [
            "graphicx",
        ],
        "tables": [
            "array",
            "booktabs",
            "longtable",
            "tabularx",
        ],
        "colors": [
            "xcolor",
        ],
        "links": [
            "hyperref",
        ],
        "figures": [
            "float",
            "caption",
        ],
    }

    # ------------------------------------------------------------------
    # Détection
    # ------------------------------------------------------------------

    @staticmethod
    def _has_math(
        document: dict[str, Any],
    ) -> bool:
        return bool(
            document.get("math")
        )

    @staticmethod
    def _has_images(
        document: dict[str, Any],
    ) -> bool:
        return bool(
            document.get("images")
        )

    @staticmethod
    def _has_tables(
        document: dict[str, Any],
    ) -> bool:
        return bool(
            document.get("tables")
        )

    @staticmethod
    def _has_figures(
        document: dict[str, Any],
    ) -> bool:
        return bool(
            document.get("figures")
        )

    @staticmethod
    def _has_links(
        content_html: str,
    ) -> bool:
        return bool(
            re.search(
                r"<a(?:\s|>)",
                content_html or "",
                flags=re.IGNORECASE,
            )
        )

    @staticmethod
    def _has_colors(
        content_html: str,
    ) -> bool:
        """
        Détection des couleurs HTML/CSS.

        On ne déclenche pas xcolor simplement parce que le mot
        'color' apparaît dans un texte scientifique.
        """

        if not content_html:
            return False

        patterns = [
            r"style\s*=\s*['\"][^'\"]*(?:color|background-color)",
            r"data-color\s*=",
            r"data-text-color\s*=",
            r"data-highlight-color\s*=",
            r"<mark\b",
        ]

        return any(
            re.search(
                pattern,
                content_html,
                flags=re.IGNORECASE,
            )
            for pattern in patterns
        )

    # ------------------------------------------------------------------
    # Résolution
    # ------------------------------------------------------------------

    def resolve(
        self,
        document: dict[str, Any],
    ) -> list[str]:
        """
        Retourne la liste dédupliquée et ordonnée des packages.

        Les packages réellement utilisés par le LatexService sont
        garantis par le socle de base.
        """

        if not isinstance(
            document,
            dict,
        ):
            raise TypeError(
                "LatexPackageResolver.resolve attend un dictionnaire documentaire."
            )

        packages: list[str] = []
        seen: set[str] = set()

        def add(
            package: str,
        ) -> None:
            package = str(
                package or ""
            ).strip()

            if (
                package
                and package not in seen
            ):
                seen.add(package)
                packages.append(package)

        # --------------------------------------------------------------
        # Socle obligatoire.
        # --------------------------------------------------------------

        for package in self.BASE_PACKAGES:
            add(package)

        # --------------------------------------------------------------
        # Mathématiques.
        # --------------------------------------------------------------

        if self._has_math(
            document
        ):
            for package in self.OPTIONAL_PACKAGES[
                "math"
            ]:
                add(package)

        # --------------------------------------------------------------
        # Images.
        # --------------------------------------------------------------

        if self._has_images(
            document
        ):
            for package in self.OPTIONAL_PACKAGES[
                "images"
            ]:
                add(package)

        # --------------------------------------------------------------
        # Tableaux.
        # --------------------------------------------------------------

        if self._has_tables(
            document
        ):
            for package in self.OPTIONAL_PACKAGES[
                "tables"
            ]:
                add(package)

        # --------------------------------------------------------------
        # Figures.
        # --------------------------------------------------------------

        if self._has_figures(
            document
        ):
            for package in self.OPTIONAL_PACKAGES[
                "figures"
            ]:
                add(package)

        content_html = str(
            document.get(
                "content_html",
                "",
            )
            or ""
        )

        # --------------------------------------------------------------
        # Couleurs.
        # --------------------------------------------------------------

        if self._has_colors(
            content_html
        ):
            for package in self.OPTIONAL_PACKAGES[
                "colors"
            ]:
                add(package)

        # --------------------------------------------------------------
        # Liens.
        # --------------------------------------------------------------

        if self._has_links(
            content_html
        ):
            for package in self.OPTIONAL_PACKAGES[
                "links"
            ]:
                add(package)

        return packages

    # ------------------------------------------------------------------
    # Rendu
    # ------------------------------------------------------------------

    @staticmethod
    def render(
        packages: list[str],
    ) -> str:
        """
        Transforme les packages en commandes LaTeX.

        Exemple :

            geometry
            graphicx

        devient :

            \\usepackage{geometry}
            \\usepackage{graphicx}
        """

        if not packages:
            return ""

        rendered: list[str] = []

        seen: set[str] = set()

        for package in packages:
            package = str(
                package or ""
            ).strip()

            if (
                not package
                or package in seen
            ):
                continue

            seen.add(package)

            rendered.append(
                f"\\usepackage{{{package}}}"
            )

        return "\n".join(
            rendered
        )


def re_search_link(
    content_html: str,
) -> bool:
    """
    Compatibilité avec l'ancien resolver.

    Retourne True lorsqu'un lien HTML est détecté.
    """

    return LatexPackageResolver._has_links(
        content_html
    )