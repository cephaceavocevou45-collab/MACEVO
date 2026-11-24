"""
MACEVO — Exporteur PDF professionnel.

Pipeline :

    Document IR
        ↓
    LaTeXExporter
        ↓
    BibTeXGenerator
        ↓
    LaTeXCompiler
        ↓
    XeLaTeX → Biber → XeLaTeX
        ↓
    PDF
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional

from core.document.ir import Document
from core.latex.compiler import (
    LaTeXCompilationResult,
    LaTeXCompiler,
)
from core.latex.bibliography import BibTeXGenerator
from core.exporters.latex import LaTeXExporter


# ============================================================================
# RÉSULTAT
# ============================================================================


@dataclass
class PDFExportResult:
    """Résultat d'un export PDF MACEVO."""

    success: bool

    pdf_file: Optional[str] = None
    tex_file: Optional[str] = None
    bib_file: Optional[str] = None

    compilation: Optional[
        LaTeXCompilationResult
    ] = None

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
            "pdf_file": self.pdf_file,
            "tex_file": self.tex_file,
            "bib_file": self.bib_file,
            "compilation": (
                self.compilation.to_dict()
                if self.compilation
                else None
            ),
            "errors": self.errors,
            "warnings": self.warnings,
            "metadata": self.metadata,
        }


# ============================================================================
# EXPORTER PDF
# ============================================================================


class PDFExporter:
    """
    Exporteur PDF professionnel MACEVO.

    Pipeline :

        Document IR
            ↓
        LaTeXExporter
            ↓
        BibTeXGenerator
            ↓
        LaTeXCompiler
            ↓
        XeLaTeX → Biber → XeLaTeX
            ↓
        PDF
    """

    VERSION = "1.1.0"

    def __init__(
        self,
        *,
        latex_exporter: Optional[
            LaTeXExporter
        ] = None,
        compiler: Optional[
            LaTeXCompiler
        ] = None,
        bibtex_generator: Optional[
            BibTeXGenerator
        ] = None,
        keep_tex: bool = True,
        keep_bib: bool = True,
    ):
        self.latex_exporter = (
            latex_exporter
            or LaTeXExporter()
        )

        self.compiler = (
            compiler
            or LaTeXCompiler(
                use_biber=True,
            )
        )

        self.bibtex_generator = (
            bibtex_generator
            or BibTeXGenerator()
        )

        self.keep_tex = keep_tex
        self.keep_bib = keep_bib

    # ========================================================================
    # EXPORT PRINCIPAL
    # ========================================================================

    def export(
        self,
        document: Document,
        *,
        output_dir: str | Path,
        filename: str = "document.pdf",
        passes: int = 2,
        compiler_options: Optional[
            Dict[str, Any]
        ] = None,
        generator_options: Optional[
            Dict[str, Any]
        ] = None,
    ) -> PDFExportResult:
        """
        Génère un PDF à partir du Document IR MACEVO.

        Si le document possède des références, le fichier
        references.bib est généré automatiquement et Biber
        est utilisé par LaTeXCompiler.
        """

        # --------------------------------------------------------------------
        # Validation du document
        # --------------------------------------------------------------------

        if document is None:
            return PDFExportResult(
                success=False,
                errors=[
                    "Le document fourni est vide."
                ],
            )

        if not isinstance(
            document,
            Document,
        ):
            return PDFExportResult(
                success=False,
                errors=[
                    (
                        "Le document fourni doit être "
                        "une instance de Document."
                    )
                ],
            )

        # --------------------------------------------------------------------
        # Répertoire de sortie
        # --------------------------------------------------------------------

        output_path = Path(
            output_dir
        ).resolve()

        try:
            output_path.mkdir(
                parents=True,
                exist_ok=True,
            )
        except OSError as exc:
            return PDFExportResult(
                success=False,
                errors=[
                    (
                        "Impossible de créer le "
                        f"répertoire de sortie : {exc}"
                    )
                ],
            )

        # --------------------------------------------------------------------
        # Nom du PDF
        # --------------------------------------------------------------------

        filename = self._normalize_filename(
            filename
        )

        pdf_path = (
            output_path
            / filename
        )

        # Le .tex porte le même nom que le PDF.
        tex_filename = (
            pdf_path.stem
            + ".tex"
        )

        # Le document LaTeX actuel utilise references.bib.
        bib_filename = "references.bib"

        bib_path = (
            output_path
            / bib_filename
        )

        # --------------------------------------------------------------------
        # 1. Génération LaTeX
        # --------------------------------------------------------------------

        try:
            latex_result = (
                self.latex_exporter.export(
                    document,
                    output_dir=output_path,
                    filename=tex_filename,
                    generator_options=(
                        generator_options
                        or {}
                    ),
                )
            )
        except Exception as exc:
            return PDFExportResult(
                success=False,
                errors=[
                    (
                        "La génération LaTeX a provoqué "
                        f"une exception : {exc}"
                    )
                ],
                metadata={
                    "exporter_version": self.VERSION,
                    "stage": "latex_generation",
                },
            )

        if not latex_result.success:
            return PDFExportResult(
                success=False,
                tex_file=latex_result.tex_file,
                errors=list(
                    latex_result.errors
                ),
                warnings=list(
                    latex_result.warnings
                ),
                metadata={
                    "exporter_version": self.VERSION,
                    "stage": "latex_generation",
                },
            )

        tex_path = Path(
            latex_result.tex_file
        )

        # --------------------------------------------------------------------
        # 2. Génération automatique du fichier BibTeX
        # --------------------------------------------------------------------

        references = list(
            getattr(
                document,
                "references",
                None,
            )
            or []
        )

        bib_file_result: Optional[str] = None

        if references:
            try:
                bibtex = (
                    self.bibtex_generator.generate(
                        references
                    )
                )

                bib_path.write_text(
                    bibtex,
                    encoding="utf-8",
                )

                bib_file_result = str(
                    bib_path
                )

            except Exception as exc:
                return PDFExportResult(
                    success=False,
                    tex_file=str(
                        tex_path
                    ),
                    errors=[
                        (
                            "La génération BibTeX a provoqué "
                            f"une exception : {exc}"
                        )
                    ],
                    warnings=list(
                        latex_result.warnings
                    ),
                    metadata={
                        "exporter_version": self.VERSION,
                        "stage": "bibtex_generation",
                    },
                )

        # --------------------------------------------------------------------
        # 3. Compilation LaTeX → Biber → LaTeX → PDF
        # --------------------------------------------------------------------

        options = (
            compiler_options
            or {}
        ).copy()

        # Le nombre de passes est géré par compile().
        options.setdefault(
            "passes",
            passes,
        )


        try:
            compilation = (
                self.compiler.compile(
                    tex_path,
                    output_dir=output_path,
                    **options,
                )
            )
        except Exception as exc:
            return PDFExportResult(
                success=False,
                tex_file=str(
                    tex_path
                ),
                bib_file=bib_file_result,
                errors=[
                    (
                        "La compilation LaTeX a provoqué "
                        f"une exception : {exc}"
                    )
                ],
                warnings=list(
                    latex_result.warnings
                ),
                metadata={
                    "exporter_version": self.VERSION,
                    "stage": "latex_compilation",
                },
            )

        # --------------------------------------------------------------------
        # Avertissements
        # --------------------------------------------------------------------

        warnings = list(
            latex_result.warnings
        )

        warnings.extend(
            compilation.warnings
        )

        # --------------------------------------------------------------------
        # Échec compilation
        # --------------------------------------------------------------------

        if not compilation.success:
            return PDFExportResult(
                success=False,
                tex_file=str(
                    tex_path
                ),
                bib_file=bib_file_result,
                compilation=compilation,
                errors=list(
                    compilation.errors
                ),
                warnings=warnings,
                metadata={
                    "exporter_version": self.VERSION,
                    "stage": "latex_compilation",
                    "engine": compilation.engine,
                    "biber_executed": getattr(
                        compilation,
                        "biber_executed",
                        False,
                    ),
                    "biber_return_code": getattr(
                        compilation,
                        "biber_return_code",
                        None,
                    ),
                },
            )

        # --------------------------------------------------------------------
        # 4. Vérification du PDF généré
        # --------------------------------------------------------------------

        if not compilation.pdf_file:
            return PDFExportResult(
                success=False,
                tex_file=str(
                    tex_path
                ),
                bib_file=bib_file_result,
                compilation=compilation,
                errors=[
                    (
                        "La compilation a réussi mais "
                        "aucun fichier PDF n'a été retourné."
                    )
                ],
                warnings=warnings,
                metadata={
                    "exporter_version": self.VERSION,
                    "stage": "pdf_verification",
                },
            )

        generated_pdf = Path(
            compilation.pdf_file
        )

        if not generated_pdf.exists():
            return PDFExportResult(
                success=False,
                tex_file=str(
                    tex_path
                ),
                bib_file=bib_file_result,
                compilation=compilation,
                errors=[
                    (
                        "Le compilateur indique un PDF "
                        "mais le fichier est introuvable : "
                        f"{generated_pdf}"
                    )
                ],
                warnings=warnings,
                metadata={
                    "exporter_version": self.VERSION,
                    "stage": "pdf_verification",
                },
            )

        # --------------------------------------------------------------------
        # 5. Placement final du PDF
        # --------------------------------------------------------------------

        try:
            if (
                generated_pdf.resolve()
                != pdf_path.resolve()
            ):
                if pdf_path.exists():
                    pdf_path.unlink()

                generated_pdf.replace(
                    pdf_path
                )

        except OSError as exc:
            return PDFExportResult(
                success=False,
                tex_file=str(
                    tex_path
                ),
                bib_file=bib_file_result,
                compilation=compilation,
                errors=[
                    (
                        "Impossible de placer le PDF "
                        f"à l'emplacement final : {exc}"
                    )
                ],
                warnings=warnings,
                metadata={
                    "exporter_version": self.VERSION,
                    "stage": "pdf_finalize",
                },
            )

        # --------------------------------------------------------------------
        # 6. Suppression éventuelle du .tex
        # --------------------------------------------------------------------

        final_tex_file: Optional[str] = (
            str(tex_path)
            if self.keep_tex
            else None
        )

        if not self.keep_tex:
            try:
                tex_path.unlink(
                    missing_ok=True
                )
            except OSError as exc:
                warnings.append(
                    (
                        "Le fichier LaTeX temporaire "
                        f"n'a pas pu être supprimé : {exc}"
                    )
                )

        # --------------------------------------------------------------------
        # 7. Suppression éventuelle du .bib
        # --------------------------------------------------------------------

        final_bib_file: Optional[str] = (
            bib_file_result
            if self.keep_bib
            else None
        )

        if (
            not self.keep_bib
            and bib_path.exists()
        ):
            try:
                bib_path.unlink(
                    missing_ok=True
                )
            except OSError as exc:
                warnings.append(
                    (
                        "Le fichier BibTeX temporaire "
                        f"n'a pas pu être supprimé : {exc}"
                    )
                )

        # --------------------------------------------------------------------
        # 8. Résultat final
        # --------------------------------------------------------------------

        return PDFExportResult(
            success=True,
            pdf_file=str(
                pdf_path
            ),
            tex_file=final_tex_file,
            bib_file=final_bib_file,
            compilation=compilation,
            errors=[],
            warnings=warnings,
            metadata={
                "exporter_version": self.VERSION,
                "engine": compilation.engine,
                "passes": compilation.passes,
                "duration_ms": compilation.duration_ms,
                "pdf_size": pdf_path.stat().st_size,
                "output_directory": str(
                    output_path
                ),
                "references_count": len(
                    references
                ),
                "biber_executed": getattr(
                    compilation,
                    "biber_executed",
                    False,
                ),
                "biber_return_code": getattr(
                    compilation,
                    "biber_return_code",
                    None,
                ),
            },
        )

    # ========================================================================
    # UTILITAIRE
    # ========================================================================

    @staticmethod
    def _normalize_filename(
        filename: str,
    ) -> str:
        """
        Garantit l'extension .pdf.
        """

        if not filename:
            filename = "document.pdf"

        filename = str(
            filename
        ).strip()

        if not filename:
            filename = "document.pdf"

        if not filename.lower().endswith(
            ".pdf"
        ):
            filename += ".pdf"

        return filename


# ============================================================================
# HELPER PUBLIC
# ============================================================================


def export_pdf(
    document: Document,
    *,
    output_dir: str | Path,
    filename: str = "document.pdf",
    **kwargs,
) -> PDFExportResult:
    """
    Helper simplifié.
    """

    exporter = PDFExporter()

    return exporter.export(
        document,
        output_dir=output_dir,
        filename=filename,
        **kwargs,
    )