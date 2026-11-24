"""
==========================================================
MACEVO
LaTeX API Views
==========================================================
"""

import base64
import binascii
import re
import uuid
from pathlib import Path

from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt


from django.conf import settings
from django.http import FileResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.services.latex.renderer import LatexRenderer
from projects.services.latex.compiler import LatexCompiler


# ==========================================================
# STOCKAGE DES COMPILATIONS
# ==========================================================

LATEX_STORAGE = (
    Path(settings.BASE_DIR)
    / "app"
    / "storage"
    / "latex"
)

LATEX_STORAGE.mkdir(
    parents=True,
    exist_ok=True,
)


# ==========================================================
# COMPILATION
# ==========================================================

class LatexCompileView(APIView):

    def post(self, request):

        latex = request.data.get(
            "latex",
            "",
        )

        # --------------------------------------------------
        # Validation
        # --------------------------------------------------

        if not isinstance(latex, str) or not latex.strip():

            return Response(
                {
                    "success": False,
                    "message": "Le document LaTeX est vide.",
                    "validation": {
                        "success": False,
                        "errors": [
                            {
                                "message":
                                    "Le document LaTeX est vide."
                            }
                        ],
                    },
                    "logs": [],
                    "statistics": {},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------
        # Identifiant unique
        # --------------------------------------------------

        compilation_id = uuid.uuid4().hex

        compilation_dir = (
            LATEX_STORAGE
            / compilation_id
        )

        compilation_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        # Les figures et le filigrane déposés dans l'éditeur sont transmis
        # comme fichiers séparés pour que LaTeX puisse les charger localement.
        assets = request.data.get("assets", [])
        if not isinstance(assets, list) or len(assets) > 40:
            return Response(
                {"success": False, "message": "La liste des images LaTeX est invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        total_asset_bytes = 0
        for asset in assets:
            if not isinstance(asset, dict):
                return Response(
                    {"success": False, "message": "Une image LaTeX est invalide."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            name = str(asset.get("name", ""))
            encoded = asset.get("content", "")
            if not re.fullmatch(r"macevo-(?:image-\d+|watermark)\.(?:png|jpg|pdf)", name) or not isinstance(encoded, str):
                return Response(
                    {"success": False, "message": "Le nom ou le contenu d'une image LaTeX est invalide."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                binary = base64.b64decode(encoded, validate=True)
            except (ValueError, binascii.Error):
                return Response(
                    {"success": False, "message": "Une image LaTeX est encodée de façon invalide."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            total_asset_bytes += len(binary)
            if not binary or len(binary) > 12 * 1024 * 1024 or total_asset_bytes > 40 * 1024 * 1024:
                return Response(
                    {"success": False, "message": "Les images dépassent la taille autorisée pour la compilation."},
                    status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                )
            (compilation_dir / name).write_bytes(binary)

        tex_file = (
            compilation_dir
            / "document.tex"
        )

        # --------------------------------------------------
        # Création du fichier .tex
        # --------------------------------------------------

        try:

            LatexRenderer.render(
                latex,
                tex_file,
            )

        except Exception as error:

            return Response(
                {
                    "success": False,
                    "latex": latex,
                    "pdf": None,
                    "compilationId": None,
                    "statistics": {},
                    "validation": {
                        "success": False,
                        "errors": [
                            {
                                "message": str(error)
                            }
                        ],
                    },
                    "logs": [
                        {
                            "type": "error",
                            "message": str(error),
                        }
                    ],
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --------------------------------------------------
        # Compilation pdflatex
        # --------------------------------------------------

        try:

            pdf_file = LatexCompiler.compile(
                tex_file
            )

        except Exception as error:

            return Response(
                {
                    "success": False,
                    "latex": latex,
                    "pdf": None,
                    "compilationId": None,
                    "statistics": {},
                    "validation": {
                        "success": False,
                        "errors": [
                            {
                                "message": str(error)
                            }
                        ],
                    },
                    "logs": [
                        {
                            "type": "error",
                            "message": str(error),
                        }
                    ],
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --------------------------------------------------
        # Vérification du PDF
        # --------------------------------------------------

        if not pdf_file.exists():

            message = (
                "La compilation a été exécutée "
                "mais aucun fichier PDF n'a été généré."
            )

            return Response(
                {
                    "success": False,
                    "latex": latex,
                    "pdf": None,
                    "compilationId": None,
                    "statistics": {},
                    "validation": {
                        "success": False,
                        "errors": [
                            {
                                "message": message
                            }
                        ],
                    },
                    "logs": [
                        {
                            "type": "error",
                            "message": message,
                        }
                    ],
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --------------------------------------------------
        # Statistiques simples
        # --------------------------------------------------

        statistics = {

            "characters": len(latex),

            "words": (
                len(latex.split())
                if latex.strip()
                else 0
            ),

            "pdfSize": pdf_file.stat().st_size,

        }

        # --------------------------------------------------
        # Succès
        # --------------------------------------------------

        return Response(
            {
                "success": True,

                "latex": latex,

                "pdf": (
                    f"/api/latex/pdf/"
                    f"{compilation_id}"
                ),

                "compilationId":
                    compilation_id,

                "statistics":
                    statistics,

                "validation": {

                    "success": True,

                    "errors": [],

                },

                "logs": [

                    {

                        "type": "success",

                        "message":
                            "Compilation LaTeX réussie.",

                    }

                ],

            },
            status=status.HTTP_200_OK,
        )


# ==========================================================
# PDF
# ==========================================================

@method_decorator(xframe_options_exempt, name="dispatch")
class LatexPdfView(APIView):

    def get(
        self,
        request,
        compilation_id,
    ):

        compilation_dir = (
            LATEX_STORAGE
            / compilation_id
        )

        pdf_file = (
            compilation_dir
            / "document.pdf"
        )

        # --------------------------------------------------
        # Sécurité / existence
        # --------------------------------------------------

        if not pdf_file.exists():

            return Response(
                {
                    "success": False,
                    "message": "PDF introuvable.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --------------------------------------------------
        # Retour du PDF
        # --------------------------------------------------

        response = FileResponse(
            open(
                pdf_file,
                "rb",
            ),
            content_type="application/pdf",
        )

        response["Content-Disposition"] = (
            'inline; filename="macevo-document.pdf"'
        )

        return response
