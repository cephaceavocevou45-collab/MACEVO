"""
MACEVO — Façade centrale des exports de l'éditeur scientifique.

Toutes les opérations d'export initiées depuis l'éditeur
passent par ce service.

LaTeX, PDF, DOCX, HTML et ZIP restent des capacités
du domaine ``editeur``.

Architecture :

    reports.Report
          │
          ▼
    EditorExportService
          │
          ├── LatexService
          │      ├── TEX
          │      ├── PDF
          │      └── ZIP
          │
          ├── DOCXService
          │
          └── HTMLService

Le service ne construit pas lui-même les documents.

Il orchestre les moteurs spécialisés et constitue
le point d'entrée unique des exports de l'éditeur.
"""

from __future__ import annotations

import tempfile
import uuid
from pathlib import Path

from django.conf import settings

from reports.models import Report

from .docx_service import DOCXService
from .html_service import HTMLService
from .latex_service import LatexService


class EditorExportService:
    """
    Façade centrale des exports MACEVO.

    Le frontend de l'éditeur n'a pas besoin de connaître
    l'implémentation interne des moteurs d'export.

    Il demande simplement :

        EditorExportService().export(
            report,
            "pdf",
        )

    Formats officiellement exposés :

        pdf
        docx
        html
        latex
        tex
        zip

    Le modèle documentaire canonique reste ``reports.Report``.
    """

    SUPPORTED_FORMATS = frozenset(
        {
            "pdf",
            "docx",
            "html",
            "latex",
            "tex",
            "zip",
        }
    )

    LATEX_FORMATS = frozenset(
        {
            "latex",
            "tex",
        }
    )

    def __init__(
        self,
        latex_service: LatexService | None = None,
        html_service: HTMLService | None = None,
        docx_service: DOCXService | None = None,
    ) -> None:
        """
        Initialise les moteurs d'export.

        Les dépendances peuvent être injectées afin de faciliter
        les tests unitaires et les évolutions futures.
        """

        self.latex = (
            latex_service
            if latex_service is not None
            else LatexService()
        )

        self.html = (
            html_service
            if html_service is not None
            else HTMLService()
        )

        self.docx = (
            docx_service
            if docx_service is not None
            else DOCXService()
        )

    # ==================================================================
    # API publique
    # ==================================================================

    def export(
        self,
        report: Report,
        format_name: str,
    ) -> Path:
        """
        Exporte un rapport dans le format demandé.

        Parameters
        ----------
        report:
            Instance canonique de ``reports.Report``.

        format_name:
            Nom du format demandé.

        Returns
        -------
        Path
            Chemin du fichier généré.

        Raises
        ------
        ValueError
            Si le format demandé n'est pas supporté ou n'est pas
            correctement traité.

        Exception
            Les exceptions provenant des moteurs spécialisés
            sont volontairement propagées.

            ``EditorExportView`` constitue la couche HTTP qui
            transforme ces erreurs en réponse API appropriée.
        """

        normalized_format = self.normalize_format(
            format_name,
        )

        if normalized_format not in self.SUPPORTED_FORMATS:
            raise ValueError(
                "Format d'export non supporté : "
                f"{normalized_format}"
            )

        if normalized_format in self.LATEX_FORMATS:
            return self._ensure_path(
                self._export_latex(
                    report,
                )
            )

        if normalized_format == "pdf":
            return self._ensure_path(
                self._export_pdf(
                    report,
                )
            )

        if normalized_format == "zip":
            return self._ensure_path(
                self._export_zip(
                    report,
                )
            )

        if normalized_format == "html":
            return self._ensure_path(
                self._export_html(
                    report,
                )
            )

        if normalized_format == "docx":
            return self._ensure_path(
                self._export_docx(
                    report,
                )
            )

        # Cette branche constitue une protection contre une
        # modification incohérente de SUPPORTED_FORMATS.
        raise ValueError(
            "Format d'export non traité : "
            f"{normalized_format}"
        )

    # ==================================================================
    # Normalisation
    # ==================================================================

    @staticmethod
    def normalize_format(
        format_name: str,
    ) -> str:
        """
        Normalise le nom du format.

        Exemples :

            " PDF "   -> "pdf"
            "DOCX"    -> "docx"
            "LaTeX"   -> "latex"
            ".tex"    -> "tex"
            " TEX "   -> "tex"
        """

        return (
            str(format_name or "")
            .strip()
            .lower()
            .lstrip(".")
        )

    # ==================================================================
    # Export LaTeX / TEX
    # ==================================================================

    def _export_latex(
        self,
        report: Report,
    ) -> Path:
        """
        Génère le fichier source LaTeX autonome.

        ``latex`` et ``tex`` utilisent volontairement le même
        moteur et produisent un fichier ``.tex``.

        La génération effective du document reste entièrement
        déléguée à ``LatexService``.
        """

        export_dir = self._get_export_directory()

        filename = (
            f"report_{report.pk}_"
            f"{uuid.uuid4().hex[:12]}.tex"
        )

        path = export_dir / filename

        result = self.latex.write_tex(
            report,
            path,
        )

        return self._ensure_path(
            result,
        )

    # ==================================================================
    # Export PDF
    # ==================================================================

    def _export_pdf(
        self,
        report: Report,
    ) -> Path:
        """
        Génère le PDF du rapport via le moteur LaTeX.

        LatexService reste responsable :

            - de la génération du source LaTeX ;
            - de la préparation des ressources ;
            - de la compilation ;
            - de la gestion du compilateur disponible ;
            - du retour du fichier PDF.

        Aucun faux PDF n'est fabriqué ici.
        """

        result = self.latex.compile_pdf(
            report,
        )

        return self._ensure_path(
            result,
        )

    # ==================================================================
    # Export ZIP
    # ==================================================================

    def _export_zip(
        self,
        report: Report,
    ) -> Path:
        """
        Génère l'archive scientifique complète du rapport.

        La composition réelle de l'archive est déléguée
        à ``LatexService``.

        Selon le moteur, l'archive peut contenir notamment :

            - source LaTeX ;
            - bibliographie ;
            - images ;
            - figures ;
            - ressources ;
            - PDF compilé lorsque disponible.
        """

        result = self.latex.create_zip(
            report,
        )

        return self._ensure_path(
            result,
        )

    # ==================================================================
    # Export HTML
    # ==================================================================

    def _export_html(
        self,
        report: Report,
    ) -> Path:
        """
        Exporte le rapport au format HTML.

        La structure et le rendu HTML restent de la responsabilité
        de ``HTMLService``.
        """

        result = self.html.export(
            report,
        )

        return self._ensure_path(
            result,
        )

    # ==================================================================
    # Export DOCX
    # ==================================================================

    def _export_docx(
        self,
        report: Report,
    ) -> Path:
        """
        Exporte le rapport au format Microsoft Word DOCX.

        La construction du document reste déléguée
        à ``DOCXService``.
        """

        result = self.docx.export(
            report,
        )

        return self._ensure_path(
            result,
        )

    # ==================================================================
    # Normalisation du résultat
    # ==================================================================

    @staticmethod
    def _ensure_path(
        result,
    ) -> Path:
        """
        Normalise le résultat retourné par un moteur d'export.

        Les moteurs peuvent historiquement retourner :

            - Path
            - str

        La façade expose toujours un ``Path``.

        Un résultat vide constitue une erreur de génération.
        """

        if result is None:
            raise ValueError(
                "Le moteur d'export n'a retourné aucun fichier."
            )

        if isinstance(
            result,
            Path,
        ):
            path = result
        else:
            path = Path(
                str(result),
            )

        if not str(path).strip():
            raise ValueError(
                "Le moteur d'export a retourné "
                "un chemin de fichier vide."
            )

        return path

    # ==================================================================
    # Répertoire des exports
    # ==================================================================

    @staticmethod
    def _get_export_directory() -> Path:
        """
        Retourne le répertoire dédié aux exports temporaires
        de l'éditeur.

        Priorité :

            1. ``MEDIA_ROOT/editor_exports``
            2. répertoire temporaire du système

        Le répertoire est créé automatiquement s'il n'existe pas.
        """

        media_root = getattr(
            settings,
            "MEDIA_ROOT",
            None,
        )

        if media_root:
            base_directory = Path(
                media_root,
            )
        else:
            base_directory = Path(
                tempfile.gettempdir(),
            )

        export_dir = (
            base_directory
            / "editor_exports"
        )

        export_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        return export_dir