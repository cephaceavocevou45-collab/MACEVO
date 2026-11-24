
"""
==========================================================
MACEVO IA
LaTeX Importer
==========================================================

Importeur LaTeX professionnel.

Objectifs :
- importer les sources .tex ;
- préserver le source LaTeX original ;
- détecter la classe du document ;
- détecter les packages ;
- détecter les environnements ;
- détecter les sections ;
- détecter les équations ;
- détecter les figures ;
- détecter les tableaux ;
- détecter les références et citations ;
- fournir une représentation textuelle exploitable ;
- préparer l'intégration avec le Document IR ;
- rester indépendant des fournisseurs IA.
"""

import re
from pathlib import Path

from .base_importer import BaseImporter


class LatexImporter(BaseImporter):
    """
    Importeur LaTeX.

    Le source LaTeX original est conservé intégralement.

    L'importeur fournit également une analyse structurelle
    légère permettant aux couches suivantes de MACEVO de
    construire le Document IR.
    """

    supported_extensions = (
        ".tex",
    )

    importer_name = "latex"

    # ------------------------------------------------------
    # IMPORT PRINCIPAL
    # ------------------------------------------------------

    def import_document(self, file_path):
        """
        Importe un fichier LaTeX.

        Parameters
        ----------
        file_path : str | Path
            Chemin du fichier .tex.

        Returns
        -------
        dict
            Résultat normalisé.
        """

        if not file_path:
            raise ValueError(
                "Le chemin du fichier LaTeX est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier LaTeX introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension LaTeX non supportée : {path.suffix}"
            )

        # --------------------------------------------------
        # LECTURE
        # --------------------------------------------------

        source = self._read_source(path)

        if not source.strip():
            raise ValueError(
                f"Le fichier LaTeX est vide : {path.name}"
            )

        # --------------------------------------------------
        # ANALYSE STRUCTURELLE
        # --------------------------------------------------

        document_class = self._extract_document_class(
            source
        )

        packages = self._extract_packages(
            source
        )

        sections = self._extract_sections(
            source
        )

        environments = self._extract_environments(
            source
        )

        equations = self._extract_equations(
            source
        )

        figures = self._extract_figures(
            source
        )

        tables = self._extract_tables(
            source
        )

        citations = self._extract_citations(
            source
        )

        labels = self._extract_labels(
            source
        )

        references = self._extract_references(
            source
        )

        bibliography = self._extract_bibliography(
            source
        )

        # --------------------------------------------------
        # TEXTE NETTOYÉ
        # --------------------------------------------------

        plain_text = self._latex_to_text(
            source
        )

        # --------------------------------------------------
        # STATISTIQUES
        # --------------------------------------------------

        statistics = {
            "characters": len(source),

            "lines": self.count_lines(
                source
            ),

            "words": self.count_words(
                plain_text
            ),

            "sections": len(sections),

            "packages": len(packages),

            "environments": len(environments),

            "equations": len(equations),

            "figures": len(figures),

            "tables": len(tables),

            "citations": len(citations),

            "labels": len(labels),

            "references": len(references),

            "bibliography_entries": len(
                bibliography
            ),
        }

        # --------------------------------------------------
        # STRUCTURE
        # --------------------------------------------------

        structure = {
            "document_class": document_class,

            "packages": packages,

            "sections": sections,

            "environments": environments,

            "equations": equations,

            "figures": figures,

            "tables": tables,

            "citations": citations,

            "labels": labels,

            "references": references,

            "bibliography": bibliography,
        }

        # --------------------------------------------------
        # MÉTADONNÉES
        # --------------------------------------------------

        metadata = {
            "format": "latex",

            "source_file": path.name,

            "source_extension": path.suffix.lower(),

            "encoding": "utf-8",

            "document_class": document_class,

            "package_count": len(packages),

            "section_count": len(sections),

            "equation_count": len(equations),

            "figure_count": len(figures),

            "table_count": len(tables),

            "citation_count": len(citations),

            "reference_count": len(references),

            "statistics": statistics,
        }

        # --------------------------------------------------
        # RÉSULTAT
        # --------------------------------------------------

        return self.build_result(
            title=path.stem,

            content=plain_text,

            metadata=metadata,

            source_path=path,

            source_format="latex",

            raw_content=source,

            latex_source=source,

            plain_text=plain_text,

            document_class=document_class,

            packages=packages,

            structure=structure,

            sections=sections,

            environments=environments,

            equations=equations,

            figures=figures,

            tables=tables,

            citations=citations,

            labels=labels,

            references=references,

            bibliography=bibliography,

            statistics=statistics,
        )

    # ------------------------------------------------------
    # LECTURE
    # ------------------------------------------------------

    @staticmethod
    def _read_source(path):
        """
        Lit le source LaTeX avec gestion de BOM et fallback.
        """

        try:
            return path.read_text(
                encoding="utf-8"
            )

        except UnicodeDecodeError:

            try:
                return path.read_text(
                    encoding="utf-8-sig"
                )

            except UnicodeDecodeError:

                try:
                    return path.read_text(
                        encoding="latin-1"
                    )

                except UnicodeDecodeError as exc:
                    raise ValueError(
                        f"Impossible de lire le fichier "
                        f"LaTeX : {path.name}"
                    ) from exc

    # ------------------------------------------------------
    # DOCUMENT CLASS
    # ------------------------------------------------------

    @staticmethod
    def _extract_document_class(source):
        """
        Extrait :

            \\documentclass[options]{class}
        """

        match = re.search(
            r"\\documentclass"
            r"(?:\s*\[([^\]]*)\])?"
            r"\s*\{([^}]+)\}",
            source,
            re.IGNORECASE,
        )

        if not match:
            return {
                "name": None,
                "options": [],
            }

        options = (
            [
                option.strip()
                for option in match.group(1).split(",")
                if option.strip()
            ]
            if match.group(1)
            else []
        )

        return {
            "name": match.group(2).strip(),
            "options": options,
        }

    # ------------------------------------------------------
    # PACKAGES
    # ------------------------------------------------------

    @staticmethod
    def _extract_packages(source):
        """
        Extrait les packages \\usepackage.
        """

        packages = []

        pattern = re.compile(
            r"\\usepackage"
            r"(?:\s*\[([^\]]*)\])?"
            r"\s*\{([^}]+)\}",
            re.IGNORECASE,
        )

        for match in pattern.finditer(source):

            options = (
                [
                    option.strip()
                    for option in match.group(1).split(",")
                    if option.strip()
                ]
                if match.group(1)
                else []
            )

            names = [
                name.strip()
                for name in match.group(2).split(",")
                if name.strip()
            ]

            for name in names:

                packages.append(
                    {
                        "name": name,
                        "options": options,
                    }
                )

        return packages

    # ------------------------------------------------------
    # SECTIONS
    # ------------------------------------------------------

    @staticmethod
    def _extract_sections(source):
        """
        Extrait les commandes :

            chapter
            section
            subsection
            subsubsection
            paragraph
            subparagraph
        """

        sections = []

        pattern = re.compile(
            r"\\"
            r"(chapter|section|subsection|"
            r"subsubsection|paragraph|subparagraph)"
            r"(\*)?"
            r"(?:\s*\[[^\]]*\])?"
            r"\s*\{([^}]*)\}",
            re.IGNORECASE,
        )

        for index, match in enumerate(
            pattern.finditer(source),
            start=1,
        ):

            command = match.group(1).lower()

            sections.append(
                {
                    "index": index,
                    "level": command,
                    "title": (
                        LatexImporter._clean_latex_text(
                            match.group(3)
                        )
                    ),
                    "starred": bool(match.group(2)),
                }
            )

        return sections

    # ------------------------------------------------------
    # ENVIRONNEMENTS
    # ------------------------------------------------------

    @staticmethod
    def _extract_environments(source):
        """
        Détecte les environnements \\begin{...}.

        Les environnements sont regroupés par nom.
        """

        counts = {}

        pattern = re.compile(
            r"\\begin\s*\{([^}]+)\}",
            re.IGNORECASE,
        )

        for match in pattern.finditer(source):

            name = match.group(1).strip()

            counts[name] = (
                counts.get(name, 0) + 1
            )

        return [
            {
                "name": name,
                "count": count,
            }
            for name, count in sorted(
                counts.items()
            )
        ]

    # ------------------------------------------------------
    # ÉQUATIONS
    # ------------------------------------------------------

    @staticmethod
    def _extract_equations(source):
        """
        Extrait les principales formes d'équations LaTeX.
        """

        equations = []

        # Environnements mathématiques.
        environment_pattern = re.compile(
            r"\\begin\s*\{"
            r"(equation\*?|align\*?|"
            r"gather\*?|multline\*?|"
            r"eqnarray\*?)"
            r"\}"
            r"(.*?)"
            r"\\end\s*\{\1\}",
            re.IGNORECASE | re.DOTALL,
        )

        for index, match in enumerate(
            environment_pattern.finditer(source),
            start=1,
        ):

            equations.append(
                {
                    "index": index,
                    "environment": match.group(1),
                    "content": match.group(2).strip(),
                }
            )

        # Formes \[ ... \]
        bracket_pattern = re.compile(
            r"\\\[(.*?)\\\]",
            re.DOTALL,
        )

        for match in bracket_pattern.finditer(
            source
        ):

            equations.append(
                {
                    "index": len(equations) + 1,
                    "environment": "display-math",
                    "content": match.group(1).strip(),
                }
            )

        # Formes $$ ... $$
        dollar_pattern = re.compile(
            r"\$\$(.*?)\$\$",
            re.DOTALL,
        )

        for match in dollar_pattern.finditer(
            source
        ):

            equations.append(
                {
                    "index": len(equations) + 1,
                    "environment": "display-math",
                    "content": match.group(1).strip(),
                }
            )

        return equations

    # ------------------------------------------------------
    # FIGURES
    # ------------------------------------------------------

    @staticmethod
    def _extract_figures(source):
        """
        Extrait les images utilisées par \\includegraphics.
        """

        figures = []

        pattern = re.compile(
            r"\\includegraphics"
            r"(?:\s*\[[^\]]*\])?"
            r"\s*\{([^}]+)\}",
            re.IGNORECASE,
        )

        for index, match in enumerate(
            pattern.finditer(source),
            start=1,
        ):

            figures.append(
                {
                    "index": index,
                    "path": match.group(1).strip(),
                }
            )

        return figures

    # ------------------------------------------------------
    # TABLEAUX
    # ------------------------------------------------------

    @staticmethod
    def _extract_tables(source):
        """
        Détecte les environnements de tableau.
        """

        tables = []

        pattern = re.compile(
            r"\\begin\s*\{"
            r"(table\*?|tabular\*?|"
            r"longtable|array)"
            r"\}"
            r"(.*?)"
            r"\\end\s*\{\1\}",
            re.IGNORECASE | re.DOTALL,
        )

        for index, match in enumerate(
            pattern.finditer(source),
            start=1,
        ):

            tables.append(
                {
                    "index": index,
                    "environment": match.group(1),
                    "content": match.group(2).strip(),
                }
            )

        return tables

    # ------------------------------------------------------
    # CITATIONS
    # ------------------------------------------------------

    @staticmethod
    def _extract_citations(source):
        """
        Extrait les principales commandes de citation.
        """

        citations = []

        pattern = re.compile(
            r"\\(?:cite|citep|citet|parencite|"
            r"textcite|autocite)"
            r"(?:\s*\[[^\]]*\])?"
            r"(?:\s*\[[^\]]*\])?"
            r"\s*\{([^}]+)\}",
            re.IGNORECASE,
        )

        for match in pattern.finditer(
            source
        ):

            keys = [
                key.strip()
                for key in match.group(1).split(",")
                if key.strip()
            ]

            citations.extend(keys)

        # Supprime les doublons en conservant l'ordre.
        return list(
            dict.fromkeys(citations)
        )

    # ------------------------------------------------------
    # LABELS
    # ------------------------------------------------------

    @staticmethod
    def _extract_labels(source):
        """
        Extrait les \\label{...}.
        """

        return list(
            dict.fromkeys(
                match.group(1).strip()
                for match in re.finditer(
                    r"\\label\s*\{([^}]+)\}",
                    source,
                    re.IGNORECASE,
                )
            )
        )

    # ------------------------------------------------------
    # REFERENCES
    # ------------------------------------------------------

    @staticmethod
    def _extract_references(source):
        """
        Extrait les \\ref, \\eqref et \\pageref.
        """

        references = []

        pattern = re.compile(
            r"\\(?:ref|eqref|pageref)"
            r"\s*\{([^}]+)\}",
            re.IGNORECASE,
        )

        for match in pattern.finditer(
            source
        ):

            references.append(
                {
                    "key": match.group(1).strip(),
                }
            )

        return list(
            {
                item["key"]: item
                for item in references
            }.values()
        )

    # ------------------------------------------------------
    # BIBLIOGRAPHIE
    # ------------------------------------------------------

    @staticmethod
    def _extract_bibliography(source):
        """
        Détecte les clés présentes dans les entrées
        bibliographiques \\bibitem.
        """

        bibliography = []

        pattern = re.compile(
            r"\\bibitem"
            r"(?:\s*\[[^\]]*\])?"
            r"\s*\{([^}]+)\}",
            re.IGNORECASE,
        )

        for index, match in enumerate(
            pattern.finditer(source),
            start=1,
        ):

            bibliography.append(
                {
                    "index": index,
                    "key": match.group(1).strip(),
                }
            )

        return bibliography

    # ------------------------------------------------------
    # LATEX → TEXTE
    # ------------------------------------------------------

    @classmethod
    def _latex_to_text(cls, source):
        """
        Produit une représentation textuelle simplifiée.

        Important :
        cette conversion ne remplace PAS le source LaTeX.

        Le source reste disponible dans :
            raw_content
            latex_source
        """

        text = source

        # Commentaires.
        text = re.sub(
            r"(?<!\\)%.*",
            "",
            text,
        )

        # Suppression du préambule.
        text = re.sub(
            r"\\documentclass"
            r".*?"
            r"\\begin\s*\{document\}",
            "",
            text,
            flags=re.IGNORECASE | re.DOTALL,
        )

        # Fin du document.
        text = re.sub(
            r"\\end\s*\{document\}.*",
            "",
            text,
            flags=re.IGNORECASE | re.DOTALL,
        )

        # Figures : on conserve le chemin.
        text = re.sub(
            r"\\includegraphics"
            r"(?:\s*\[[^\]]*\])?"
            r"\s*\{([^}]+)\}",
            r"[IMAGE: \1]",
            text,
            flags=re.IGNORECASE,
        )

        # Citations.
        text = re.sub(
            r"\\(?:cite|citep|citet|parencite|"
            r"textcite|autocite)"
            r"(?:\s*\[[^\]]*\])?"
            r"(?:\s*\[[^\]]*\])?"
            r"\s*\{([^}]+)\}",
            r"[CITATION: \1]",
            text,
            flags=re.IGNORECASE,
        )

        # Labels.
        text = re.sub(
            r"\\label\s*\{([^}]+)\}",
            "",
            text,
            flags=re.IGNORECASE,
        )

        # Références croisées.
        text = re.sub(
            r"\\(?:ref|eqref|pageref)"
            r"\s*\{([^}]+)\}",
            r"[REF: \1]",
            text,
            flags=re.IGNORECASE,
        )

        # Commandes de sections.
        text = re.sub(
            r"\\(?:chapter|section|subsection|"
            r"subsubsection|paragraph|subparagraph)"
            r"(?:\*)?"
            r"(?:\s*\[[^\]]*\])?"
            r"\s*\{([^}]*)\}",
            r"\n\1\n",
            text,
            flags=re.IGNORECASE,
        )

        # Environnements : on conserve le contenu.
        text = re.sub(
            r"\\begin\s*\{[^}]+\}",
            "",
            text,
            flags=re.IGNORECASE,
        )

        text = re.sub(
            r"\\end\s*\{[^}]+\}",
            "",
            text,
            flags=re.IGNORECASE,
        )

        # Commandes de mise en forme courantes.
        formatting_commands = (
            "textbf",
            "textit",
            "texttt",
            "emph",
            "underline",
            "textrm",
            "textsf",
            "textsc",
        )

        for command in formatting_commands:

            text = re.sub(
                rf"\\{command}\s*\{{([^{{}}]*)\}}",
                r"\1",
                text,
                flags=re.IGNORECASE,
            )

        # Commandes simples sans argument.
        text = re.sub(
            r"\\(?:noindent|newline|linebreak|"
            r"newpage|clearpage|smallskip|medskip|"
            r"bigskip|centering|raggedright|"
            r"raggedleft|maketitle)",
            "\n",
            text,
            flags=re.IGNORECASE,
        )

        # Commandes génériques avec un argument.
        text = re.sub(
            r"\\[a-zA-Z@]+\*?"
            r"(?:\s*\[[^\]]*\])?"
            r"\s*\{([^{}]*)\}",
            r"\1",
            text,
        )

        # Commandes restantes.
        text = re.sub(
            r"\\[a-zA-Z@]+\*?",
            "",
            text,
        )

        # Accolades restantes.
        text = text.replace(
            "{",
            "",
        ).replace(
            "}",
            "",
        )

        # Nettoyage des espaces.
        text = re.sub(
            r"[ \t]+",
            " ",
            text,
        )

        text = re.sub(
            r"\n\s*\n\s*\n+",
            "\n\n",
            text,
        )

        return cls.normalize_content(
            text
        )

    # ------------------------------------------------------
    # NETTOYAGE TEXTE LATEX
    # ------------------------------------------------------

    @staticmethod
    def _clean_latex_text(text):
        """
        Nettoie légèrement un titre ou une valeur LaTeX.
        """

        if not text:
            return ""

        text = re.sub(
            r"\\[a-zA-Z@]+\*?"
            r"(?:\s*\[[^\]]*\])?"
            r"\s*\{([^{}]*)\}",
            r"\1",
            text,
        )

        text = re.sub(
            r"\\[a-zA-Z@]+\*?",
            "",
            text,
        )

        text = text.replace(
            "{",
            "",
        ).replace(
            "}",
            "",
        )

        return " ".join(
            text.split()
        )

    # ------------------------------------------------------
    # INFORMATIONS
    # ------------------------------------------------------

    @classmethod
    def info(cls):
        """
        Informations publiques sur l'importeur.
        """

        data = super().info()

        data.update(
            {
                "description": (
                    "Importeur LaTeX professionnel "
                    "pour MACEVO."
                ),

                "native_latex": True,

                "source_preserved": True,

                "structural_analysis": True,

                "equation_detection": True,

                "figure_detection": True,

                "table_detection": True,

                "citation_detection": True,

                "cross_reference_detection": True,

                "bibliography_detection": True,

                "document_ir_ready": True,
            }
        )

        return data
