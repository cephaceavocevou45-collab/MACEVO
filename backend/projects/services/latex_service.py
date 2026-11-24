
"""
==========================================================
MACEVO IA
Latex Service
==========================================================

Service central LaTeX de MACEVO.

Architecture :

    Projet / Document IR
            ↓
       LatexService
        ┌───┴────┐
        ↓        ↓
   Renderer    Compiler
        ↓        ↓
      .tex      PDF

Le service orchestre les composants LaTeX spécialisés
sans dupliquer leur logique.

Auteur : MACEVO
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional


logger = logging.getLogger(__name__)


class LatexService:
    """
    Façade centrale du système LaTeX MACEVO.

    Responsabilités :
    - génération du code LaTeX ;
    - rendu d'un document ;
    - compilation LaTeX vers PDF ;
    - validation basique ;
    - génération d'équations ;
    - accès aux templates ;
    - informations sur l'environnement LaTeX.
    """

    # =========================================================
    # OUTILS INTERNES
    # =========================================================

    @staticmethod
    def _build_structure(
        project: Any = None,
        structure: Any = None,
    ) -> Any:
        """
        Retourne la structure documentaire à utiliser.

        Priorité :
        1. structure fournie explicitement ;
        2. structure attachée au projet ;
        3. DocumentBuilder.
        """

        if structure is not None:
            return structure

        if project is None:
            return None

        for attribute in (
            "document_structure",
            "structure",
            "document",
        ):
            value = getattr(
                project,
                attribute,
                None,
            )

            if value is not None:
                return value

        try:
            from projects.services.export.document_builder import (
                DocumentBuilder,
            )

            if hasattr(
                DocumentBuilder,
                "from_project",
            ):
                return DocumentBuilder.from_project(
                    project
                )

            if hasattr(
                DocumentBuilder,
                "build",
            ):
                return DocumentBuilder.build(
                    project
                )

        except (ImportError, AttributeError):
            logger.debug(
                "DocumentBuilder indisponible.",
                exc_info=True,
            )

        return project

    # =========================================================
    # GÉNÉRATION
    # =========================================================

    @classmethod
    def generate(
        cls,
        project: Any = None,
        structure: Any = None,
        template: Optional[str] = None,
        content: Optional[str] = None,
    ) -> str:
        """
        Génère le code source LaTeX.

        Si `content` est fourni, il est utilisé directement.

        Sinon, la structure documentaire est convertie via
        LatexExporter.
        """

        if content is not None:
            return str(content)

        document_structure = cls._build_structure(
            project=project,
            structure=structure,
        )

        if document_structure is None:
            raise ValueError(
                "Impossible de générer le LaTeX : "
                "aucun projet, structure ou contenu fourni."
            )

        try:
            from projects.services.export.latex_exporter import (
                LatexExporter,
            )

            exporter = LatexExporter(
                document_structure
            )

            if hasattr(
                exporter,
                "render",
            ):
                latex = exporter.render()
            elif hasattr(
                exporter,
                "generate",
            ):
                latex = exporter.generate()
            else:
                raise AttributeError(
                    "LatexExporter ne fournit ni render() "
                    "ni generate()."
                )

        except ImportError as exc:
            raise RuntimeError(
                "LatexExporter est indisponible."
            ) from exc

        # Le template pourra être exploité directement
        # par LatexExporter dans une évolution future.
        if template:
            logger.debug(
                "Template LaTeX demandé : %s",
                template,
            )

        return str(latex)

    # =========================================================
    # RENDU
    # =========================================================

    @classmethod
    def render(
        cls,
        content: str,
        output_file: Optional[str | Path] = None,
        validate: bool = False,
    ) -> Any:
        """
        Rend un contenu LaTeX.

        Si `output_file` est fourni, le fichier .tex est écrit.
        """

        if content is None:
            raise ValueError(
                "Le contenu LaTeX est obligatoire."
            )

        try:
            from projects.services.latex.renderer import (
                LatexRenderer,
            )
        except ImportError as exc:
            raise RuntimeError(
                "LatexRenderer est indisponible."
            ) from exc

        renderer = LatexRenderer()

        if hasattr(
            renderer,
            "render",
        ):
            return renderer.render(
                content,
                output_file,
                validate=validate,
            )

        raise RuntimeError(
            "LatexRenderer ne fournit pas render()."
        )

    # =========================================================
    # COMPILATION
    # =========================================================

    @classmethod
    def compile(
        cls,
        project: Any = None,
        output_directory: Optional[str | Path] = None,
        content: Optional[str] = None,
        engine: str = "pdflatex",
        passes: int = 2,
        timeout: int = 120,
        clean: bool = False,
        shell_escape: bool = False,
        synctex: bool = False,
        structure: Any = None,
    ) -> Any:
        """
        Compile un document LaTeX vers PDF.

        Paramètres :
        - project : projet MACEVO ;
        - structure : structure documentaire ;
        - content : LaTeX déjà généré ;
        - output_directory : dossier de sortie ;
        - engine : pdflatex, xelatex ou lualatex ;
        - passes : nombre de passes ;
        - timeout : délai maximal ;
        - clean : nettoyage des fichiers auxiliaires ;
        - shell_escape : autorisation shell-escape ;
        - synctex : génération SyncTeX.
        """

        latex_content = content

        if latex_content is None:
            latex_content = cls.generate(
                project=project,
                structure=structure,
            )

        if not latex_content:
            raise ValueError(
                "Aucun contenu LaTeX à compiler."
            )

        try:
            from projects.services.latex.compiler import (
                LatexCompiler,
            )
        except ImportError as exc:
            raise RuntimeError(
                "LatexCompiler est indisponible."
            ) from exc

        compiler = LatexCompiler()

        # -----------------------------------------------------
        # Compilation depuis le contenu.
        # -----------------------------------------------------

        if hasattr(
            compiler,
            "compile",
        ):
            try:
                return compiler.compile(
                    latex_content,
                    output_directory=output_directory,
                    engine=engine,
                    passes=passes,
                    timeout=timeout,
                    clean=clean,
                    shell_escape=shell_escape,
                    synctex=synctex,
                )
            except TypeError:
                # Compatibilité avec une ancienne signature.
                try:
                    return compiler.compile(
                        latex_content,
                        output_directory,
                    )
                except TypeError:
                    pass

        raise RuntimeError(
            "LatexCompiler ne fournit pas une API de "
            "compilation compatible."
        )

    # =========================================================
    # GÉNÉRATION + COMPILATION
    # =========================================================

    @classmethod
    def build_pdf(
        cls,
        project: Any,
        output_directory: str | Path,
        template: Optional[str] = None,
        engine: str = "pdflatex",
        passes: int = 2,
        timeout: int = 120,
        clean: bool = False,
        shell_escape: bool = False,
        synctex: bool = False,
        structure: Any = None,
    ) -> Any:
        """
        Génère puis compile un projet en PDF.
        """

        latex = cls.generate(
            project=project,
            structure=structure,
            template=template,
        )

        return cls.compile(
            project=project,
            structure=structure,
            content=latex,
            output_directory=output_directory,
            engine=engine,
            passes=passes,
            timeout=timeout,
            clean=clean,
            shell_escape=shell_escape,
            synctex=synctex,
        )

    # =========================================================
    # VALIDATION
    # =========================================================

    @staticmethod
    def validate(
        content: str,
    ) -> Dict[str, Any]:
        """
        Valide sommairement un document LaTeX.
        """

        if content is None:
            return {
                "valid": False,
                "errors": [
                    "Le contenu LaTeX est vide."
                ],
                "warnings": [],
            }

        try:
            from projects.services.latex.renderer import (
                LatexRenderer,
            )

            renderer = LatexRenderer()

            if hasattr(
                renderer,
                "validate_content",
            ):
                result = renderer.validate_content(
                    str(content)
                )

                if isinstance(result, dict):
                    return result

                return {
                    "valid": bool(result),
                    "errors": [],
                    "warnings": [],
                }

        except ImportError:
            logger.debug(
                "LatexRenderer indisponible.",
                exc_info=True,
            )

        text = str(content)

        errors = []
        warnings = []

        if "\\begin{document}" not in text:
            errors.append(
                "Le document ne contient pas "
                "\\begin{document}."
            )

        if "\\end{document}" not in text:
            errors.append(
                "Le document ne contient pas "
                "\\end{document}."
            )

        if text.count("{") != text.count("}"):
            errors.append(
                "Les accolades LaTeX ne sont pas équilibrées."
            )

        if "\\documentclass" not in text:
            warnings.append(
                "Aucune commande \\documentclass détectée."
            )

        return {
            "valid": not errors,
            "errors": errors,
            "warnings": warnings,
        }

    # =========================================================
    # ÉQUATIONS
    # =========================================================

    @staticmethod
    def equation(
        expression: str,
        mode: str = "display",
        numbered: bool = False,
        label: Optional[str] = None,
    ) -> str:
        """
        Génère une équation LaTeX.

        Cette méthode délègue à equations.py.
        """

        try:
            from projects.services.latex.equations import (
                EquationBuilder,
            )
        except ImportError as exc:
            raise RuntimeError(
                "EquationBuilder est indisponible."
            ) from exc

        builder = EquationBuilder()

        if mode == "inline":
            return builder.inline(
                expression
            )

        if numbered:
            result = builder.numbered(
                expression,
                label=label,
            )
        else:
            result = builder.display(
                expression
            )

        return result

    # =========================================================
    # TEMPLATES
    # =========================================================

    @staticmethod
    def templates() -> Dict[str, Any]:
        """
        Retourne les templates LaTeX disponibles.
        """

        try:
            from projects.services.latex.templates import (
                LatexTemplates,
            )
        except ImportError:
            return {}

        if hasattr(
            LatexTemplates,
            "all",
        ):
            return LatexTemplates.all()

        if hasattr(
            LatexTemplates,
            "registry",
        ):
            return LatexTemplates.registry()

        return {}

    # =========================================================
    # DISPONIBILITÉ DU COMPILATEUR
    # =========================================================

    @staticmethod
    def compiler_info() -> Dict[str, Any]:
        """
        Retourne l'état de l'environnement LaTeX.
        """

        try:
            from projects.services.latex.compiler import (
                LatexCompiler,
            )

            compiler = LatexCompiler()

            if hasattr(
                compiler,
                "info",
            ):
                return compiler.info()

            if hasattr(
                compiler,
                "availability",
            ):
                return compiler.availability()

        except ImportError as exc:
            return {
                "available": False,
                "error": str(exc),
            }

        return {
            "available": False,
            "error": (
                "Impossible de déterminer "
                "la disponibilité du compilateur."
            ),
        }

    # =========================================================
    # INFORMATIONS
    # =========================================================

    @classmethod
    def info(cls) -> Dict[str, Any]:
        """
        Informations générales du service LaTeX.
        """

        return {
            "service": "LatexService",
            "version": "2.0.0",
            "engines": [
                "pdflatex",
                "xelatex",
                "lualatex",
            ],
            "capabilities": [
                "generate",
                "render",
                "compile",
                "build_pdf",
                "validate",
                "equation",
                "templates",
                "compiler_info",
            ],
            "architecture": (
                "Document IR -> LatexService -> "
                "LatexExporter / Renderer / Compiler"
            ),
            "scientific_latex": True,
        }
