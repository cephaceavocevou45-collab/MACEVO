
"""
==========================================================
MACEVO IA
Project Export View
==========================================================

API d'exportation des projets scientifiques.

Formats disponibles :
- PDF
- Word / DOCX
- LaTeX / TEX
- HTML
- ZIP (source, ressources, PDF d'aperçu)

La logique d'export est entièrement déléguée
à ExportService.

Auteur : MACEVO
"""

from __future__ import annotations

import logging
from pathlib import Path

from django.conf import settings
from django.http import FileResponse

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.selectors import ProjectSelector
from projects.services.export_service import ExportService


logger = logging.getLogger(__name__)


class ProjectExportView(APIView):
    """
    API permettant d'exporter un projet scientifique.

    Endpoint :

        POST /api/projects/<project_id>/export/

    Body :

        {
            "format": "pdf"
        }

    Formats acceptés :

        pdf
        word
        docx
        latex
        tex
        html
        zip

    Le fichier généré est retourné directement
    au frontend sous forme de téléchargement.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    # =========================================================
    # CONFIGURATION
    # =========================================================

    FORMAT_ALIASES = {
        "docx": "word",
        "tex": "latex",
    }

    EXTENSIONS = {
        "pdf": "pdf",
        "word": "docx",
        "latex": "tex",
        "html": "html",
        "zip": "zip",
    }

    CONTENT_TYPES = {
        "pdf": "application/pdf",

        "word": (
            "application/vnd.openxmlformats-"
            "officedocument.wordprocessingml.document"
        ),

        "latex": "application/x-latex",

        "html": "text/html; charset=utf-8",
        "zip": "application/zip",
    }

    # =========================================================
    # UTILITAIRES
    # =========================================================

    @classmethod
    def normalize_format(
        cls,
        export_format,
    ):
        """
        Valide et normalise le format demandé.
        """

        if not isinstance(
            export_format,
            str,
        ):
            return None

        export_format = (
            export_format
            .strip()
            .lower()
        )

        export_format = cls.FORMAT_ALIASES.get(
            export_format,
            export_format,
        )

        if export_format not in cls.EXTENSIONS:
            return None

        return export_format

    @staticmethod
    def safe_filename(
        value,
        fallback="projet-scientifique",
    ) -> str:
        """
        Nettoie une valeur destinée à devenir un nom
        de fichier.

        Aucun chemin fourni par le client n'est utilisé.
        """

        value = str(
            value or ""
        ).strip()

        if not value:
            value = fallback

        safe = "".join(
            character
            if (
                character.isalnum()
                or character in (
                    "-",
                    "_",
                )
            )
            else "-"
            for character in value
        )

        # Évite les répétitions excessives de tirets.
        while "--" in safe:
            safe = safe.replace(
                "--",
                "-",
            )

        safe = safe.strip(
            "-_."
        )

        return (
            safe
            or fallback
        )

    @staticmethod
    def get_export_directory() -> Path:
        """
        Retourne le dossier de génération des exports.
        """

        base_dir = Path(
            getattr(
                settings,
                "BASE_DIR",
                Path.cwd(),
            )
        )

        directory = (
            base_dir
            / "exports"
        )

        directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        return directory

    # =========================================================
    # POST
    # =========================================================

    def post(
        self,
        request,
        project_id,
        *args,
        **kwargs,
    ):
        """
        Génère et retourne l'export du projet.
        """

        # =====================================================
        # 1. RÉCUPÉRATION DU PROJET
        # =====================================================

        project = ProjectSelector.get_project_by_id(
            project_id,
            request.user,
        )

        if project is None:
            return Response(
                {
                    "detail": "Projet introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # =====================================================
        # 2. FORMAT DEMANDÉ
        # =====================================================

        requested_format = request.data.get(
            "format",
            "pdf",
        )

        export_format = (
            self.normalize_format(
                requested_format
            )
        )

        if export_format is None:
            return Response(
                {
                    "detail": (
                        "Format d'export non supporté.",
                    ),
                    "supported_formats": [
                        "pdf",
                        "word",
                        "docx",
                        "latex",
                        "tex",
                        "html",
                        "zip",
                    ],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # =====================================================
        # 3. DOSSIER DE SORTIE
        # =====================================================

        try:
            export_directory = (
                self.get_export_directory()
            )

        except Exception:
            logger.exception(
                "Impossible de créer le dossier d'export."
            )

            return Response(
                {
                    "detail": (
                        "Impossible de préparer "
                        "le dossier d'export."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # =====================================================
        # 4. NOM DU FICHIER
        # =====================================================

        project_slug = getattr(
            project,
            "slug",
            None,
        )

        safe_slug = self.safe_filename(
            project_slug,
            fallback=f"projet-{project_id}",
        )

        extension = self.EXTENSIONS[
            export_format
        ]

        output_path = (
            export_directory
            / f"{safe_slug}.{extension}"
        )

        # =====================================================
        # 5. EXPORT
        # =====================================================

        try:

            generated_file = (
                ExportService.export(
                    project=project,
                    format=export_format,
                    output_path=output_path,
                )
            )

        except NotImplementedError as exc:

            logger.warning(
                "Format d'export non implémenté : %s",
                export_format,
            )

            return Response(
                {
                    "detail": str(exc)
                    or (
                        "Ce format d'export "
                        "n'est pas encore disponible."
                    )
                },
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )

        except ValueError as exc:

            logger.warning(
                "Erreur de validation pendant l'export "
                "du projet %s : %s",
                project_id,
                exc,
            )

            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception:

            logger.exception(
                "Erreur pendant l'export du projet %s "
                "au format %s.",
                project_id,
                export_format,
            )

            return Response(
                {
                    "detail": (
                        "Une erreur est survenue pendant "
                        "la génération du fichier."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # =====================================================
        # 6. CHEMIN FINAL
        # =====================================================

        generated_path = Path(
            generated_file
            if generated_file
            else output_path
        )

        # =====================================================
        # 7. SÉCURITÉ DU CHEMIN
        # =====================================================

        try:

            export_root = (
                export_directory
                .resolve()
            )

            resolved_path = (
                generated_path
                .resolve()
            )

            if (
                resolved_path != export_root
                and export_root not in resolved_path.parents
            ):
                logger.error(
                    "Chemin d'export hors du dossier autorisé : %s",
                    resolved_path,
                )

                return Response(
                    {
                        "detail": (
                            "Le fichier généré se trouve "
                            "dans un emplacement non autorisé."
                        )
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            generated_path = resolved_path

        except Exception:

            logger.exception(
                "Impossible de vérifier le chemin "
                "du fichier exporté."
            )

            return Response(
                {
                    "detail": (
                        "Impossible de vérifier "
                        "le fichier généré."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # =====================================================
        # 8. VÉRIFICATION DU FICHIER
        # =====================================================

        if not generated_path.exists():

            logger.error(
                "Export terminé mais fichier introuvable : %s",
                generated_path,
            )

            return Response(
                {
                    "detail": (
                        "L'export a été exécuté, "
                        "mais le fichier généré "
                        "est introuvable."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not generated_path.is_file():

            return Response(
                {
                    "detail": (
                        "Le chemin généré ne correspond "
                        "pas à un fichier valide."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            file_size = generated_path.stat().st_size

        except OSError:

            logger.exception(
                "Impossible de lire la taille "
                "du fichier exporté."
            )

            return Response(
                {
                    "detail": (
                        "Impossible de vérifier "
                        "le fichier généré."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if file_size <= 0:

            return Response(
                {
                    "detail": (
                        "Le fichier a été généré "
                        "mais il est vide."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # =====================================================
        # 9. TYPE MIME
        # =====================================================

        content_type = self.CONTENT_TYPES[
            export_format
        ]

        # =====================================================
        # 10. TÉLÉCHARGEMENT
        # =====================================================

        try:

            file_handle = open(
                generated_path,
                "rb",
            )

        except OSError:

            logger.exception(
                "Impossible d'ouvrir le fichier exporté : %s",
                generated_path,
            )

            return Response(
                {
                    "detail": (
                        "Impossible d'ouvrir "
                        "le fichier généré."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = FileResponse(
            file_handle,
            as_attachment=True,
            filename=generated_path.name,
            content_type=content_type,
        )

        # Informations utiles au frontend.
        response["X-Export-Format"] = (
            export_format
        )

        response["X-Export-Filename"] = (
            generated_path.name
        )

        response["X-Export-Size"] = str(
            file_size
        )

        return response
