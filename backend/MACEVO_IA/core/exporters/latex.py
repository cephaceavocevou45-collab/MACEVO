"""
MACEVO — Exporteur LaTeX.

Transforme un Document IR MACEVO en fichier .tex.

Pipeline :

    Document
        ↓
    LaTeXGenerator
        ↓
    LaTeXValidator
        ↓
    fichier .tex

La compilation PDF est volontairement déléguée à
core.latex.compiler.LaTeXCompiler.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional

from core.document.ir import Document
from core.latex.generator import LaTeXGenerator
from core.latex.validator import (
    LaTeXValidationResult,
    LaTeXValidator,
)


# ============================================================================
# RÉSULTAT
# ============================================================================


@dataclass
class LaTeXExportResult:
    """
    Résultat d'un export LaTeX.
    """

    success: bool

    tex_file: Optional[str] = None

    content: Optional[str] = None

    validation: Optional[LaTeXValidationResult] = None

    errors: list[str] = field(
        default_factory=list
    )

    warnings: list[str] = field(
        default_factory=list
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    @property
    def failed(self) -> bool:
        return not self.success

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "tex_file": self.tex_file,
            "content": self.content,
            "validation": (
                self.validation.to_dict()
                if self.validation
                else None
            ),
            "errors": self.errors,
            "warnings": self.warnings,
            "metadata": self.metadata,
        }


# ============================================================================
# EXPORTER
# ============================================================================


class LaTeXExporter:
    """
    Exporteur professionnel LaTeX MACEVO.

    Responsabilités :

    - générer le LaTeX depuis le Document IR ;
    - valider le LaTeX généré ;
    - écrire le fichier .tex ;
    - conserver une représentation exploitable du résultat ;
    - ne pas compiler directement en PDF.
    """

    VERSION = "1.0.0"

    def __init__(
        self,
        *,
        generator: Optional[LaTeXGenerator] = None,
        validator: Optional[LaTeXValidator] = None,
        validate: bool = True,
        fail_on_validation_error: bool = True,
    ):
        self.generator = (
            generator
            or LaTeXGenerator()
        )

        self.validator = (
            validator
            or LaTeXValidator()
        )

        self.validate_generated_latex = (
            validate
        )

        self.fail_on_validation_error = (
            fail_on_validation_error
        )

    # ========================================================================
    # EXPORT PRINCIPAL
    # ========================================================================

    def export(
        self,
        document: Document,
        *,
        output_dir: str | Path,
        filename: str = "document.tex",
        validate: Optional[bool] = None,
        generator_options: Optional[
            Dict[str, Any]
        ] = None,
    ) -> LaTeXExportResult:
        """
        Génère et écrit un fichier LaTeX.

        Parameters
        ----------
        document:
            Document IR MACEVO.

        output_dir:
            Répertoire de sortie.

        filename:
            Nom du fichier .tex.

        validate:
            Active/désactive la validation pour cet export.

        generator_options:
            Options transmises au LaTeXGenerator.
        """

        # --------------------------------------------------------------------
        # Validation des paramètres
        # --------------------------------------------------------------------

        if document is None:
            return LaTeXExportResult(
                success=False,
                errors=[
                    "Le document fourni est vide."
                ],
            )

        if not isinstance(
            document,
            Document,
        ):
            return LaTeXExportResult(
                success=False,
                errors=[
                    (
                        "Le document fourni doit être "
                        "une instance de core.document.ir.Document."
                    )
                ],
            )

        output_path = Path(
            output_dir
        ).resolve()

        try:
            output_path.mkdir(
                parents=True,
                exist_ok=True,
            )
        except OSError as exc:
            return LaTeXExportResult(
                success=False,
                errors=[
                    (
                        "Impossible de créer le "
                        f"répertoire de sortie : {exc}"
                    )
                ],
            )

        # --------------------------------------------------------------------
        # Nom du fichier
        # --------------------------------------------------------------------

        filename = self._normalize_filename(
            filename
        )

        tex_path = (
            output_path
            / filename
        )

        # --------------------------------------------------------------------
        # Génération
        # --------------------------------------------------------------------

        try:
            options = (
                generator_options
                or {}
            )

            latex = self.generator.generate(
                document,
                **options,
            )

        except Exception as exc:
            return LaTeXExportResult(
                success=False,
                errors=[
                    (
                        "La génération LaTeX a échoué : "
                        f"{exc}"
                    )
                ],
                metadata={
                    "exporter_version": self.VERSION,
                },
            )

        if not isinstance(
            latex,
            str,
        ) or not latex.strip():
            return LaTeXExportResult(
                success=False,
                errors=[
                    (
                        "Le générateur LaTeX "
                        "n'a produit aucun contenu."
                    )
                ],
                metadata={
                    "exporter_version": self.VERSION,
                },
            )

        # --------------------------------------------------------------------
        # Validation
        # --------------------------------------------------------------------

        validation = None

        should_validate = (
            self.validate_generated_latex
            if validate is None
            else bool(validate)
        )

        warnings = []

        if should_validate:

            validation = self.validator.validate(
                latex,
                base_dir=output_path,
            )

            warnings.extend(
                issue.message
                for issue in validation.warnings
            )

            if (
                not validation.valid
                and self.fail_on_validation_error
            ):
                return LaTeXExportResult(
                    success=False,
                    tex_file=str(
                        tex_path
                    ),
                    content=latex,
                    validation=validation,
                    errors=[
                        issue.message
                        for issue in validation.errors
                    ],
                    warnings=warnings,
                    metadata={
                        "exporter_version": self.VERSION,
                        "validation_failed": True,
                    },
                )

        # --------------------------------------------------------------------
        # Écriture
        # --------------------------------------------------------------------

        try:
            tex_path.write_text(
                latex,
                encoding="utf-8",
                newline="\n",
            )

        except OSError as exc:
            return LaTeXExportResult(
                success=False,
                tex_file=str(
                    tex_path
                ),
                content=latex,
                validation=validation,
                errors=[
                    (
                        "Impossible d'écrire "
                        f"le fichier LaTeX : {exc}"
                    )
                ],
                warnings=warnings,
                metadata={
                    "exporter_version": self.VERSION,
                },
            )

        # --------------------------------------------------------------------
        # Succès
        # --------------------------------------------------------------------

        return LaTeXExportResult(
            success=True,
            tex_file=str(
                tex_path
            ),
            content=latex,
            validation=validation,
            errors=[],
            warnings=warnings,
            metadata={
                "exporter_version": self.VERSION,
                "validated": should_validate,
                "characters": len(latex),
                "lines": len(
                    latex.splitlines()
                ),
                "output_directory": str(
                    output_path
                ),
            },
        )

    # ========================================================================
    # EXPORT EN MÉMOIRE
    # ========================================================================

    def generate(
        self,
        document: Document,
        *,
        validate: Optional[bool] = None,
        generator_options: Optional[
            Dict[str, Any]
        ] = None,
    ) -> LaTeXExportResult:
        """
        Génère le LaTeX sans créer de fichier.
        """

        if document is None:
            return LaTeXExportResult(
                success=False,
                errors=[
                    "Le document fourni est vide."
                ],
            )

        if not isinstance(
            document,
            Document,
        ):
            return LaTeXExportResult(
                success=False,
                errors=[
                    (
                        "Le document fourni doit être "
                        "une instance de Document."
                    )
                ],
            )

        try:
            latex = self.generator.generate(
                document,
                **(
                    generator_options
                    or {}
                ),
            )

        except Exception as exc:
            return LaTeXExportResult(
                success=False,
                errors=[
                    (
                        "La génération LaTeX a échoué : "
                        f"{exc}"
                    )
                ],
            )

        validation = None
        warnings = []

        should_validate = (
            self.validate_generated_latex
            if validate is None
            else bool(validate)
        )

        if should_validate:

            validation = self.validator.validate(
                latex
            )

            warnings.extend(
                issue.message
                for issue in validation.warnings
            )

            if (
                not validation.valid
                and self.fail_on_validation_error
            ):
                return LaTeXExportResult(
                    success=False,
                    content=latex,
                    validation=validation,
                    errors=[
                        issue.message
                        for issue in validation.errors
                    ],
                    warnings=warnings,
                )

        return LaTeXExportResult(
            success=True,
            content=latex,
            validation=validation,
            warnings=warnings,
            metadata={
                "exporter_version": self.VERSION,
                "validated": should_validate,
                "characters": len(latex),
                "lines": len(
                    latex.splitlines()
                ),
            },
        )

    # ========================================================================
    # NOM DE FICHIER
    # ========================================================================

    @staticmethod
    def _normalize_filename(
        filename: str,
    ) -> str:
        """
        Garantit l'extension .tex.
        """

        if not filename:
            filename = "document.tex"

        filename = str(
            filename
        ).strip()

        if not filename:
            filename = "document.tex"

        if not filename.lower().endswith(
            ".tex"
        ):
            filename += ".tex"

        return filename


# ============================================================================
# HELPER PUBLIC
# ============================================================================


def export_latex(
    document: Document,
    *,
    output_dir: str | Path,
    filename: str = "document.tex",
    **kwargs,
) -> LaTeXExportResult:
    """
    Helper simplifié :

        result = export_latex(
            document,
            output_dir="exports",
        )
    """

    exporter = LaTeXExporter()

    return exporter.export(
        document,
        output_dir=output_dir,
        filename=filename,
        **kwargs,
    )