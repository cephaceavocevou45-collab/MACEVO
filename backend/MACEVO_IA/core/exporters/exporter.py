"""
MACEVO — Façade centrale des exports.

Point d'entrée unique pour les différents formats :

    latex
    pdf
    zip

L'orchestrateur MACEVO n'a ainsi pas besoin de connaître
les implémentations internes de chaque exporteur.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional

from core.document.ir import Document

from core.exporters.latex import (
    LaTeXExporter,
    LaTeXExportResult,
)

from core.exporters.pdf import (
    PDFExporter,
    PDFExportResult,
)

from core.exporters.zip import (
    ZIPExporter,
    ZIPExportResult,
)


# ============================================================================
# RÉSULTAT UNIFIÉ
# ============================================================================


@dataclass
class ExportResult:
    """
    Résultat unifié de l'API d'export MACEVO.
    """

    success: bool

    format: str

    result: Any = None

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

    @property
    def output_file(self) -> Optional[str]:
        """
        Retourne le fichier principal produit.
        """

        if self.result is None:
            return None

        if self.format == "latex":
            return self.result.tex_file

        if self.format == "pdf":
            return self.result.pdf_file

        if self.format == "zip":
            return self.result.zip_file

        return None

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "format": self.format,
            "output_file": self.output_file,
            "errors": self.errors,
            "warnings": self.warnings,
            "metadata": self.metadata,
            "result": (
                self.result.to_dict()
                if self.result
                and hasattr(
                    self.result,
                    "to_dict",
                )
                else None
            ),
        }


# ============================================================================
# EXPORTER CENTRAL
# ============================================================================


class Exporter:
    """
    Façade centrale des exports MACEVO.

    Formats supportés :

        latex
        pdf
        zip
    """

    VERSION = "1.0.0"

    SUPPORTED_FORMATS = (
        "latex",
        "pdf",
        "zip",
    )

    def __init__(
        self,
        *,
        latex_exporter: Optional[
            LaTeXExporter
        ] = None,
        pdf_exporter: Optional[
            PDFExporter
        ] = None,
        zip_exporter: Optional[
            ZIPExporter
        ] = None,
    ):
        self.latex_exporter = (
            latex_exporter
            or LaTeXExporter()
        )

        self.pdf_exporter = (
            pdf_exporter
            or PDFExporter(
                latex_exporter=self.latex_exporter
            )
        )

        self.zip_exporter = (
            zip_exporter
            or ZIPExporter(
                pdf_exporter=self.pdf_exporter
            )
        )

    # ========================================================================
    # EXPORT
    # ========================================================================

    def export(
        self,
        document: Document,
        *,
        format: str,
        output_dir: str | Path,
        filename: Optional[str] = None,
        **kwargs,
    ) -> ExportResult:
        """
        Exporte un Document MACEVO.

        Exemple :

            exporter.export(
                document,
                format="pdf",
                output_dir="exports",
                filename="rapport.pdf",
            )
        """

        if document is None:
            return ExportResult(
                success=False,
                format=str(
                    format
                ).lower(),
                errors=[
                    "Le document fourni est vide."
                ],
            )

        if not isinstance(
            document,
            Document,
        ):
            return ExportResult(
                success=False,
                format=str(
                    format
                ).lower(),
                errors=[
                    (
                        "Le document fourni doit être "
                        "une instance de Document."
                    )
                ],
            )

        normalized_format = (
            self.normalize_format(
                format
            )
        )

        if normalized_format not in (
            self.SUPPORTED_FORMATS
        ):
            return ExportResult(
                success=False,
                format=normalized_format,
                errors=[
                    (
                        "Format d'export non supporté : "
                        f"{format}. "
                        "Formats disponibles : "
                        f"{', '.join(self.SUPPORTED_FORMATS)}."
                    )
                ],
                metadata={
                    "exporter_version": self.VERSION,
                },
            )

        # ====================================================================
        # LATEX
        # ====================================================================

        if normalized_format == "latex":

            output_filename = (
                filename
                or "document.tex"
            )

            result = (
                self.latex_exporter.export(
                    document,
                    output_dir=output_dir,
                    filename=output_filename,
                    **kwargs,
                )
            )

            return self._wrap_result(
                normalized_format,
                result,
            )

        # ====================================================================
        # PDF
        # ====================================================================

        if normalized_format == "pdf":

            output_filename = (
                filename
                or "document.pdf"
            )

            result = (
                self.pdf_exporter.export(
                    document,
                    output_dir=output_dir,
                    filename=output_filename,
                    **kwargs,
                )
            )

            return self._wrap_result(
                normalized_format,
                result,
            )

        # ====================================================================
        # ZIP
        # ====================================================================

        if normalized_format == "zip":

            output_filename = (
                filename
                or "macevo_document.zip"
            )

            result = (
                self.zip_exporter.export(
                    document,
                    output_dir=output_dir,
                    filename=output_filename,
                    **kwargs,
                )
            )

            return self._wrap_result(
                normalized_format,
                result,
            )

        # Protection supplémentaire.
        return ExportResult(
            success=False,
            format=normalized_format,
            errors=[
                (
                    "Le format d'export n'a pas "
                    "été correctement traité."
                )
            ],
        )

    # ========================================================================
    # NORMALISATION
    # ========================================================================

    @classmethod
    def normalize_format(
        cls,
        format: str,
    ) -> str:
        """
        Normalise les alias de formats.
        """

        if format is None:
            return ""

        value = str(
            format
        ).strip().lower()

        aliases = {
            "tex": "latex",
            ".tex": "latex",
            "latex": "latex",

            "pdf": "pdf",
            ".pdf": "pdf",

            "zip": "zip",
            ".zip": "zip",
            "archive": "zip",
        }

        return aliases.get(
            value,
            value,
        )

    # ========================================================================
    # SUPPORT
    # ========================================================================

    @classmethod
    def supports(
        cls,
        format: str,
    ) -> bool:
        return (
            cls.normalize_format(
                format
            )
            in cls.SUPPORTED_FORMATS
        )

    @classmethod
    def formats(cls) -> list[str]:
        return list(
            cls.SUPPORTED_FORMATS
        )

    # ========================================================================
    # WRAPPER
    # ========================================================================

    def _wrap_result(
        self,
        format: str,
        result: Any,
    ) -> ExportResult:

        return ExportResult(
            success=bool(
                result.success
            ),
            format=format,
            result=result,
            errors=list(
                getattr(
                    result,
                    "errors",
                    [],
                )
            ),
            warnings=list(
                getattr(
                    result,
                    "warnings",
                    [],
                )
            ),
            metadata={
                "exporter_version": self.VERSION,
                **getattr(
                    result,
                    "metadata",
                    {},
                ),
            },
        )


# ============================================================================
# HELPER PUBLIC
# ============================================================================


def export_document(
    document: Document,
    *,
    format: str,
    output_dir: str | Path,
    filename: Optional[str] = None,
    **kwargs,
) -> ExportResult:
    """
    Helper public simplifié.
    """

    exporter = Exporter()

    return exporter.export(
        document,
        format=format,
        output_dir=output_dir,
        filename=filename,
        **kwargs,
    )