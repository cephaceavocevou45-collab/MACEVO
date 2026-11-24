
"""
==========================================================
MACEVO IA
LaTeX Renderer
==========================================================

Générateur de fichiers LaTeX (.tex).

Objectifs :
- écrire du contenu LaTeX dans un fichier ;
- créer automatiquement les répertoires nécessaires ;
- valider le contenu avant écriture ;
- gérer proprement les erreurs d'écriture ;
- permettre la génération depuis une structure de document ;
- fournir des informations sur le fichier généré ;
- rester compatible avec l'ancienne API :
      LatexRenderer.render(content, output_file)
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any


logger = logging.getLogger(__name__)


class LatexRenderer:
    """
    Génère et écrit des fichiers .tex.
    """

    DEFAULT_ENCODING = "utf-8"

    # ---------------------------------------------------------
    # Content
    # ---------------------------------------------------------

    @staticmethod
    def normalize_content(content) -> str:
        """
        Normalise le contenu LaTeX avant écriture.
        """

        if content is None:
            return ""

        if isinstance(content, bytes):
            content = content.decode(
                "utf-8",
                errors="replace",
            )

        content = str(content)

        # Normalisation des fins de ligne.
        content = content.replace(
            "\r\n",
            "\n",
        )
        content = content.replace(
            "\r",
            "\n",
        )

        return content

    @staticmethod
    def validate_content(content) -> dict[str, Any]:
        """
        Validation structurelle légère du contenu LaTeX.

        Cette validation ne remplace pas le compilateur LaTeX.
        Elle détecte seulement quelques problèmes évidents.
        """

        content = LatexRenderer.normalize_content(
            content
        )

        errors: list[str] = []
        warnings: list[str] = []

        if not content.strip():
            warnings.append(
                "Le contenu LaTeX est vide."
            )

        # -----------------------------------------------------
        # Accolades
        # -----------------------------------------------------

        balance = 0
        escaped = False

        for character in content:

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

        # -----------------------------------------------------
        # Environnements
        # -----------------------------------------------------

        import re

        begins = re.findall(
            r"\\begin\{([^}]+)\}",
            content,
        )

        ends = re.findall(
            r"\\end\{([^}]+)\}",
            content,
        )

        if len(begins) != len(ends):
            errors.append(
                "Le nombre de \\begin et \\end "
                "ne correspond pas."
            )

        elif begins != ends:
            warnings.append(
                "Certains environnements LaTeX "
                "peuvent être mal imbriqués."
            )

        # -----------------------------------------------------
        # Document
        # -----------------------------------------------------

        has_documentclass = (
            "\\documentclass" in content
        )

        has_begin_document = (
            "\\begin{document}" in content
        )

        has_end_document = (
            "\\end{document}" in content
        )

        if not has_documentclass:
            warnings.append(
                "Aucune commande \\documentclass détectée."
            )

        if has_begin_document != has_end_document:
            errors.append(
                "Les commandes "
                "\\begin{document} et "
                "\\end{document} sont incohérentes."
            )

        return {
            "valid": not errors,
            "errors": errors,
            "warnings": warnings,
        }

    # ---------------------------------------------------------
    # Render
    # ---------------------------------------------------------

    @classmethod
    def render(
        cls,
        content,
        output_file,
        *,
        validate: bool = False,
        create_parent: bool = True,
        overwrite: bool = True,
    ) -> Path:
        """
        Génère un fichier .tex.

        Parameters
        ----------
        content:
            Contenu LaTeX.

        output_file:
            Chemin du fichier .tex.

        validate:
            Effectue une validation structurelle avant écriture.

        create_parent:
            Crée automatiquement le dossier parent.

        overwrite:
            Autorise l'écrasement d'un fichier existant.

        Returns
        -------
        Path
            Chemin du fichier généré.
        """

        output = Path(output_file).resolve()

        content = cls.normalize_content(
            content
        )

        # -----------------------------------------------------
        # Validation du chemin
        # -----------------------------------------------------

        if output.suffix.lower() != ".tex":
            raise ValueError(
                f"Le fichier de sortie doit être "
                f"un fichier .tex : {output}"
            )

        if output.exists() and not overwrite:
            raise FileExistsError(
                f"Le fichier existe déjà : {output}"
            )

        # -----------------------------------------------------
        # Validation LaTeX optionnelle
        # -----------------------------------------------------

        validation = None

        if validate:
            validation = cls.validate_content(
                content
            )

            if not validation["valid"]:
                raise ValueError(
                    "Le contenu LaTeX est invalide : "
                    + "; ".join(
                        validation["errors"]
                    )
                )

        # -----------------------------------------------------
        # Création du dossier
        # -----------------------------------------------------

        if create_parent:
            output.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

        # -----------------------------------------------------
        # Écriture
        # -----------------------------------------------------

        try:
            output.write_text(
                content,
                encoding=cls.DEFAULT_ENCODING,
            )

        except OSError as exc:
            logger.exception(
                "Impossible d'écrire le fichier LaTeX : %s",
                output,
            )

            raise OSError(
                f"Impossible d'écrire le fichier LaTeX : "
                f"{output}"
            ) from exc

        logger.info(
            "Fichier LaTeX généré : %s",
            output,
        )

        return output

    # ---------------------------------------------------------
    # Render from lines
    # ---------------------------------------------------------

    @classmethod
    def render_lines(
        cls,
        lines,
        output_file,
        **kwargs,
    ) -> Path:
        """
        Génère un fichier .tex à partir d'une liste de lignes.
        """

        if lines is None:
            content = ""

        else:
            content = "\n".join(
                str(line)
                for line in lines
            )

        return cls.render(
            content,
            output_file,
            **kwargs,
        )

    # ---------------------------------------------------------
    # Render document
    # ---------------------------------------------------------

    @classmethod
    def render_document(
        cls,
        document,
        output_file,
        **kwargs,
    ) -> Path:
        """
        Génère un fichier LaTeX à partir d'un objet document.

        La méthode accepte plusieurs représentations afin de rester
        compatible avec les futures structures MACEVO.
        """

        if document is None:
            raise ValueError(
                "Le document ne peut pas être None."
            )

        # Objet possédant une méthode to_latex().
        if hasattr(document, "to_latex"):
            content = document.to_latex()

        # Objet possédant une méthode render().
        elif hasattr(document, "render"):
            content = document.render()

        # Dictionnaire avec contenu LaTeX.
        elif isinstance(document, dict):

            content = (
                document.get("latex")
                or document.get("content")
                or document.get("text")
                or ""
            )

        # Chaîne directement fournie.
        elif isinstance(document, str):
            content = document

        else:
            raise TypeError(
                "Type de document non supporté pour "
                "le rendu LaTeX."
            )

        return cls.render(
            content,
            output_file,
            **kwargs,
        )

    # ---------------------------------------------------------
    # Read
    # ---------------------------------------------------------

    @classmethod
    def read(
        cls,
        tex_file,
    ) -> str:
        """
        Lit un fichier .tex.
        """

        path = Path(tex_file).resolve()

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier LaTeX introuvable : {path}"
            )

        if path.suffix.lower() != ".tex":
            raise ValueError(
                f"Le fichier doit être un .tex : {path}"
            )

        try:
            return path.read_text(
                encoding=cls.DEFAULT_ENCODING,
            )

        except UnicodeDecodeError:
            return path.read_text(
                encoding="utf-8",
                errors="replace",
            )

    # ---------------------------------------------------------
    # Statistics
    # ---------------------------------------------------------

    @classmethod
    def statistics(
        cls,
        content,
    ) -> dict[str, Any]:
        """
        Retourne quelques statistiques sur un document LaTeX.
        """

        content = cls.normalize_content(
            content
        )

        lines = content.splitlines()

        return {
            "characters": len(content),
            "lines": len(lines),
            "non_empty_lines": sum(
                bool(line.strip())
                for line in lines
            ),
            "has_documentclass": (
                "\\documentclass" in content
            ),
            "has_document_environment": (
                "\\begin{document}" in content
                and "\\end{document}" in content
            ),
            "chapters": content.count(
                "\\chapter{"
            ),
            "sections": content.count(
                "\\section{"
            ),
            "subsections": content.count(
                "\\subsection{"
            ),
            "equations": (
                content.count("\\begin{equation}")
                + content.count("\\[")
            ),
            "tables": content.count(
                "\\begin{table}"
            ),
            "figures": content.count(
                "\\begin{figure}"
            ),
            "citations": content.count(
                "\\cite"
            ),
        }

    # ---------------------------------------------------------
    # Info
    # ---------------------------------------------------------

    @classmethod
    def info(cls) -> dict[str, Any]:
        """
        Informations sur le renderer.
        """

        return {
            "name": "LatexRenderer",
            "output_format": "tex",
            "encoding": cls.DEFAULT_ENCODING,
            "features": [
                "latex_file_generation",
                "content_normalization",
                "validation",
                "directory_creation",
                "document_rendering",
                "line_rendering",
                "file_reading",
                "statistics",
            ],
        }
