from __future__ import annotations

import logging
from pathlib import Path

from django.utils import timezone

from word_to_latex.converters.document_analyzer import DocumentAnalyzer
from word_to_latex.converters.latex_generator import LatexGenerator
from word_to_latex.services.export_service import ExportService
from word_to_latex.services.file_service import FileService


logger = logging.getLogger(__name__)


class ConversionService:
    """
    Service principal du workflow Word → LaTeX.

    Workflow :

        uploaded
            ↓
        analyzing
            ↓
        analyzed
            ↓
        converting
            ↓
        completed

    En cas d'erreur :

        failed

    Les exports PDF / ZIP sont réalisés séparément après
    la génération du document LaTeX.
    """

    # ==========================================================
    # UTILITAIRES
    # ==========================================================

    @staticmethod
    def get_original_file_path(conversion) -> Path:
        """
        Retourne le chemin physique du fichier Word original.
        """
        if conversion is None:
            raise ValueError(
                "La conversion est obligatoire."
            )

        original_file = getattr(
            conversion,
            "original_file",
            None,
        )

        if not original_file:
            raise ValueError(
                "Le fichier Word original est introuvable."
            )

        file_path = FileService.get_file_path(
            original_file
        )

        if file_path is None:
            raise ValueError(
                "Le chemin du fichier Word original "
                "est introuvable."
            )

        file_path = Path(
            file_path
        ).resolve()

        if not file_path.exists():
            raise FileNotFoundError(
                f"Fichier Word introuvable : {file_path}"
            )

        if not file_path.is_file():
            raise ValueError(
                "Le fichier Word original n'est pas "
                "un fichier valide."
            )

        try:
            file_size = file_path.stat().st_size
        except OSError as exc:
            raise ValueError(
                "Impossible de déterminer la taille "
                "du fichier Word original."
            ) from exc

        if file_size <= 0:
            raise ValueError(
                "Le fichier Word est vide."
            )

        if file_path.suffix.lower() != ".docx":
            raise ValueError(
                "Le fichier Word original doit être "
                "au format .docx."
            )

        return file_path

    @staticmethod
    def _get_export_service(
        conversion,
    ) -> ExportService:
        """
        Construit le service d'export correspondant
        à une conversion.
        """
        if conversion is None:
            raise ValueError(
                "La conversion est obligatoire."
            )

        return ExportService(
            conversion=conversion
        )

    # ==========================================================
    # ANALYSE
    # ==========================================================

    @staticmethod
    def analyze_document(conversion):
        """
        Analyse le document Word et enregistre les statistiques.

        Returns:
            dict: résultat de l'analyse.
        """
        if conversion is None:
            raise ValueError(
                "La conversion est obligatoire."
            )

        try:
            ConversionService.update_progress(
                conversion,
                status="analyzing",
                progress=20,
                error_message="",
            )

            file_path = (
                ConversionService.get_original_file_path(
                    conversion
                )
            )

            analyzer = DocumentAnalyzer(
                str(file_path)
            )

            analysis = analyzer.analyze()

            if not isinstance(
                analysis,
                dict,
            ):
                raise ValueError(
                    "L'analyse du document a retourné "
                    "un résultat invalide."
                )

            # --------------------------------------------------
            # Statistiques générales
            # --------------------------------------------------

            conversion.paragraphs_count = (
                ConversionService.safe_int(
                    analysis.get(
                        "paragraphs_count",
                        0,
                    )
                )
            )

            conversion.headings_count = (
                ConversionService.safe_int(
                    analysis.get(
                        "headings_count",
                        0,
                    )
                )
            )

            conversion.words_count = (
                ConversionService.safe_int(
                    analysis.get(
                        "words_count",
                        0,
                    )
                )
            )

            conversion.tables_count = (
                ConversionService.safe_int(
                    analysis.get(
                        "tables_count",
                        0,
                    )
                )
            )

            conversion.images_count = (
                ConversionService.safe_int(
                    analysis.get(
                        "images_count",
                        0,
                    )
                )
            )

            conversion.comments_count = (
                ConversionService.safe_int(
                    analysis.get(
                        "comments_count",
                        0,
                    )
                )
            )

            conversion.footnotes_count = (
                ConversionService.safe_int(
                    analysis.get(
                        "footnotes_count",
                        0,
                    )
                )
            )

            # --------------------------------------------------
            # Éléments scientifiques
            # --------------------------------------------------

            conversion.equations_count = (
                ConversionService.safe_int(
                    analysis.get(
                        "equations_count",
                        0,
                    )
                )
            )

            conversion.diagrams_count = (
                ConversionService.safe_int(
                    analysis.get(
                        "diagrams_count",
                        0,
                    )
                )
            )

            conversion.figures_count = (
                ConversionService.safe_int(
                    analysis.get(
                        "figures_count",
                        0,
                    )
                )
            )

            conversion.references_count = (
                ConversionService.safe_int(
                    analysis.get(
                        "references_count",
                        0,
                    )
                )
            )

            # --------------------------------------------------
            # Métadonnées
            # --------------------------------------------------

            document_title = analysis.get(
                "document_title"
            )

            if document_title is not None:
                conversion.document_title = str(
                    document_title
                ).strip()

            document_author = analysis.get(
                "document_author"
            )

            if document_author is not None:
                conversion.document_author = str(
                    document_author
                ).strip()

            # --------------------------------------------------
            # État
            # --------------------------------------------------

            conversion.status = "analyzed"
            conversion.progress = 30
            conversion.error_message = ""

            conversion.save(
                update_fields=[
                    "paragraphs_count",
                    "headings_count",
                    "words_count",
                    "tables_count",
                    "images_count",
                    "comments_count",
                    "footnotes_count",
                    "equations_count",
                    "diagrams_count",
                    "figures_count",
                    "references_count",
                    "document_title",
                    "document_author",
                    "status",
                    "progress",
                    "error_message",
                    "updated_at",
                ]
            )

            return analysis

        except Exception as exc:
            logger.exception(
                "Erreur lors de l'analyse de la conversion %s",
                getattr(
                    conversion,
                    "id",
                    None,
                ),
            )

            ConversionService.mark_as_failed(
                conversion,
                exc,
            )

            raise

    # ==========================================================
    # CONVERSION LATEX
    # ==========================================================

    @staticmethod
    def convert_to_latex(conversion):
        """
        Convertit le document Word en LaTeX.

        Returns:
            dict
        """
        if conversion is None:
            raise ValueError(
                "La conversion est obligatoire."
            )

        try:
            ConversionService.update_progress(
                conversion,
                status="converting",
                progress=40,
                error_message="",
            )

            file_path = (
                ConversionService.get_original_file_path(
                    conversion
                )
            )

            # --------------------------------------------------
            # Génération du LaTeX
            # --------------------------------------------------

            generator = LatexGenerator(
                conversion
            )

            latex_content = generator.generate()

            if latex_content is None:
                raise ValueError(
                    "La génération LaTeX n'a retourné "
                    "aucun contenu."
                )

            latex_content = str(
                latex_content
            )

            if not latex_content.strip():
                raise ValueError(
                    "Le document LaTeX généré est vide."
                )

            ConversionService.update_progress(
                conversion,
                status="converting",
                progress=65,
            )

            # --------------------------------------------------
            # Service d'export
            # --------------------------------------------------

            export_service = (
                ConversionService._get_export_service(
                    conversion
                )
            )

            latex_directory = (
                export_service.ensure_latex_directory()
            )

            tex_path = (
                export_service.latex_path
            )

            # --------------------------------------------------
            # Écriture du code LaTeX
            # --------------------------------------------------

            FileService.write_text(
                tex_path,
                latex_content,
                encoding="utf-8",
            )

            ConversionService.update_progress(
                conversion,
                status="converting",
                progress=80,
            )

            # --------------------------------------------------
            # Synchronisation du FileField
            # --------------------------------------------------

            export_service._attach_generated_file(
                "latex_file",
                tex_path,
            )

            # --------------------------------------------------
            # Statistiques
            # --------------------------------------------------

            latex_lines_count = len(
                latex_content.splitlines()
            )

            conversion.latex_code = (
                latex_content
            )

            conversion.latex_lines_count = (
                latex_lines_count
            )

            conversion.status = "completed"
            conversion.progress = 100
            conversion.completed_at = (
                timezone.now()
            )
            conversion.error_message = ""

            # --------------------------------------------------
            # Persistance
            # --------------------------------------------------

            conversion.save(
                update_fields=[
                    "latex_code",
                    "latex_lines_count",
                    "status",
                    "progress",
                    "completed_at",
                    "error_message",
                    "updated_at",
                ]
            )

            # --------------------------------------------------
            # Vérifications
            # --------------------------------------------------

            if not conversion.latex_file:
                raise ValueError(
                    "Le fichier LaTeX n'a pas pu "
                    "être enregistré."
                )

            if not Path(
                tex_path
            ).is_file():
                raise FileNotFoundError(
                    "Le fichier document.tex n'a pas "
                    "été créé correctement."
                )

            return {
                "success": True,
                "latex_content": latex_content,
                "lines": latex_lines_count,
                "latex_file": (
                    conversion.latex_file.url
                    if conversion.latex_file
                    else None
                ),
                "latex_path": str(
                    tex_path
                ),
                "latex_directory": str(
                    latex_directory
                ),
                "source_file": str(
                    file_path
                ),
            }

        except Exception as exc:
            logger.exception(
                "Erreur lors de la conversion LaTeX "
                "de la conversion %s",
                getattr(
                    conversion,
                    "id",
                    None,
                ),
            )

            ConversionService.mark_as_failed(
                conversion,
                exc,
            )

            raise

    # ==========================================================
    # WORKFLOW COMPLET
    # ==========================================================

    @staticmethod
    def process_conversion(conversion):
        """
        Exécute le workflow complet :

            1. Analyse du DOCX
            2. Conversion en LaTeX

        Le PDF et le ZIP sont générés séparément via ExportService.

        Aucune transaction globale n'est utilisée autour du workflow,
        car celui-ci manipule des fichiers physiques et peut être long.
        """
        if conversion is None:
            raise ValueError(
                "La conversion est obligatoire."
            )

        try:
            analysis = (
                ConversionService.analyze_document(
                    conversion
                )
            )

            latex_result = (
                ConversionService.convert_to_latex(
                    conversion
                )
            )

            conversion.refresh_from_db()

            return {
                "success": True,
                "analysis": analysis,
                "latex_content": (
                    latex_result.get(
                        "latex_content",
                        "",
                    )
                ),
                "lines": (
                    latex_result.get(
                        "lines",
                        0,
                    )
                ),
                "latex_file": (
                    latex_result.get(
                        "latex_file"
                    )
                ),
            }

        except Exception:
            logger.exception(
                "Échec du workflow complet "
                "de la conversion %s.",
                getattr(
                    conversion,
                    "id",
                    None,
                ),
            )

            raise

    # ==========================================================
    # EXPORT GLOBAL
    # ==========================================================

    @staticmethod
    def export_conversion(
        conversion,
        generate_pdf=False,
        create_zip=True,
        include_pdf_in_zip=False,
    ):
        """
        Génère les fichiers d'export :

            - document.tex
            - references.bib si disponible
            - document.pdf si demandé
            - document.zip si demandé
        """
        if conversion is None:
            raise ValueError(
                "La conversion est obligatoire."
            )

        try:
            if not ConversionService.is_ready_for_export(
                conversion
            ):
                raise ValueError(
                    "La conversion n'est pas prête "
                    "pour générer les exports."
                )

            export_service = (
                ConversionService._get_export_service(
                    conversion
                )
            )

            result = export_service.export_all(
                generate_pdf=bool(
                    generate_pdf
                ),
                create_zip=bool(
                    create_zip
                ),
                include_pdf_in_zip=bool(
                    include_pdf_in_zip
                ),
            )

            conversion.refresh_from_db()

            return result

        except Exception:
            logger.exception(
                "Erreur lors de l'export de la conversion %s",
                getattr(
                    conversion,
                    "id",
                    None,
                ),
            )

            raise

    # ==========================================================
    # EXPORT LATEX
    # ==========================================================

    @staticmethod
    def export_latex(
        conversion,
    ):
        """Génère uniquement le fichier LaTeX."""
        if conversion is None:
            raise ValueError(
                "La conversion est obligatoire."
            )

        try:
            if not ConversionService.is_ready_for_export(
                conversion
            ):
                raise ValueError(
                    "La conversion n'est pas prête "
                    "pour l'export LaTeX."
                )

            export_service = (
                ConversionService._get_export_service(
                    conversion
                )
            )

            result = export_service.export_latex()

            conversion.refresh_from_db()

            return result

        except Exception:
            logger.exception(
                "Erreur lors de l'export LaTeX "
                "de la conversion %s",
                getattr(
                    conversion,
                    "id",
                    None,
                ),
            )

            raise

    # ==========================================================
    # EXPORT PDF
    # ==========================================================

    @staticmethod
    def export_pdf(
        conversion,
    ):
        """Génère le PDF à partir du document LaTeX."""
        if conversion is None:
            raise ValueError(
                "La conversion est obligatoire."
            )

        try:
            if not ConversionService.is_ready_for_export(
                conversion
            ):
                raise ValueError(
                    "La conversion n'est pas prête "
                    "pour générer le PDF."
                )

            export_service = (
                ConversionService._get_export_service(
                    conversion
                )
            )

            result = export_service.generate_pdf()

            conversion.refresh_from_db()

            return result

        except Exception:
            logger.exception(
                "Erreur lors de l'export PDF "
                "de la conversion %s",
                getattr(
                    conversion,
                    "id",
                    None,
                ),
            )

            raise

    # ==========================================================
    # EXPORT ZIP
    # ==========================================================

    @staticmethod
    def export_zip(
        conversion,
    ):
        """Génère l'archive ZIP du projet LaTeX."""
        if conversion is None:
            raise ValueError(
                "La conversion est obligatoire."
            )

        try:
            if not ConversionService.is_ready_for_export(
                conversion
            ):
                raise ValueError(
                    "La conversion n'est pas prête "
                    "pour l'export ZIP."
                )

            export_service = (
                ConversionService._get_export_service(
                    conversion
                )
            )

            result = export_service.create_zip()

            conversion.refresh_from_db()

            return result

        except Exception:
            logger.exception(
                "Erreur lors de l'export ZIP "
                "de la conversion %s",
                getattr(
                    conversion,
                    "id",
                    None,
                ),
            )

            raise

    # ==========================================================
    # EXPORT BIBLIOGRAPHIE
    # ==========================================================

    @staticmethod
    def export_bibliography(
        conversion,
        bibliography_content=None,
    ):
        """
        Génère references.bib si un contenu bibliographique
        est disponible.
        """
        if conversion is None:
            raise ValueError(
                "La conversion est obligatoire."
            )

        try:
            if not ConversionService.is_ready_for_export(
                conversion
            ):
                raise ValueError(
                    "La conversion n'est pas prête "
                    "pour l'export bibliographique."
                )

            export_service = (
                ConversionService._get_export_service(
                    conversion
                )
            )

            result = export_service.export_bibliography(
                bibliography_content
            )

            conversion.refresh_from_db()

            return result

        except Exception:
            logger.exception(
                "Erreur lors de l'export bibliographique "
                "de la conversion %s",
                getattr(
                    conversion,
                    "id",
                    None,
                ),
            )

            raise

    # ==========================================================
    # STATUT / PROGRESSION
    # ==========================================================

    @staticmethod
    def update_progress(
        conversion,
        status=None,
        progress=None,
        error_message=None,
    ):
        """
        Met à jour proprement l'état de la conversion.
        """
        if conversion is None:
            raise ValueError(
                "La conversion est obligatoire."
            )

        update_fields: list[str] = []

        if status is not None:
            conversion.status = str(
                status
            ).strip()

            update_fields.append(
                "status"
            )

        if progress is not None:
            try:
                progress = int(
                    progress
                )
            except (
                TypeError,
                ValueError,
            ):
                progress = 0

            progress = max(
                0,
                min(
                    100,
                    progress,
                ),
            )

            conversion.progress = progress

            update_fields.append(
                "progress"
            )

        if error_message is not None:
            conversion.error_message = str(
                error_message
            )

            update_fields.append(
                "error_message"
            )

        if update_fields:
            update_fields.append(
                "updated_at"
            )

            conversion.save(
                update_fields=list(
                    dict.fromkeys(
                        update_fields
                    )
                )
            )

    # ==========================================================
    # ÉCHEC
    # ==========================================================

    @staticmethod
    def mark_as_failed(
        conversion,
        exception=None,
    ):
        """
        Marque une conversion comme échouée.

        Le détail technique reste dans les logs.
        L'utilisateur reçoit un message générique.
        """
        if conversion is None:
            return

        conversion_id = getattr(
            conversion,
            "id",
            None,
        )

        if exception is not None:
            logger.error(
                "Conversion %s échouée : %s",
                conversion_id,
                exception,
            )

        try:
            conversion.status = "failed"
            conversion.progress = 0

            conversion.error_message = (
                "La conversion a échoué. "
                "Veuillez réessayer."
            )

            conversion.save(
                update_fields=[
                    "status",
                    "progress",
                    "error_message",
                    "updated_at",
                ]
            )

        except Exception:
            logger.exception(
                "Impossible de marquer la conversion "
                "%s comme échouée.",
                conversion_id,
            )

    # ==========================================================
    # VALIDATION AVANT EXPORT
    # ==========================================================

    @staticmethod
    def is_ready_for_export(
        conversion,
    ) -> bool:
        """
        Vérifie si la conversion possède un LaTeX exploitable.
        """
        if conversion is None:
            return False

        status = getattr(
            conversion,
            "status",
            None,
        )

        latex_code = getattr(
            conversion,
            "latex_code",
            None,
        ) or ""

        latex_file = getattr(
            conversion,
            "latex_file",
            None,
        )

        return (
            status == "completed"
            and bool(
                str(latex_code).strip()
            )
            and bool(
                latex_file
            )
        )

    # ==========================================================
    # ALIAS DE COMPATIBILITÉ
    # ==========================================================

    @staticmethod
    def analyze(
        conversion,
    ):
        """Alias vers analyze_document()."""
        return ConversionService.analyze_document(
            conversion
        )

    @staticmethod
    def convert(
        conversion,
    ):
        """Alias vers convert_to_latex()."""
        return ConversionService.convert_to_latex(
            conversion
        )

    @staticmethod
    def process(
        conversion,
    ):
        """Alias vers process_conversion()."""
        return ConversionService.process_conversion(
            conversion
        )

    @staticmethod
    def export(
        conversion,
        generate_pdf=False,
    ):
        """Alias vers export_conversion()."""
        return ConversionService.export_conversion(
            conversion,
            generate_pdf=generate_pdf,
        )

    # ==========================================================
    # UTILITAIRE ENTIER
    # ==========================================================

    @staticmethod
    def safe_int(
        value,
        default=0,
    ) -> int:
        """
        Convertit proprement une valeur en entier positif.
        """
        try:
            if value is None:
                return default

            value = int(
                value
            )

            return max(
                0,
                value,
            )

        except (
            TypeError,
            ValueError,
        ):
            return default