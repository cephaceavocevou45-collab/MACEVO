import json
import logging
from datetime import timedelta
from pathlib import Path

from django.core.files.base import ContentFile
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PdfLatexShare, WordToLatexConversion
from .serializers import (
    ConversionOptionsSerializer,
    PdfDocumentUploadSerializer,
    WordDocumentUploadSerializer,
    WordToLatexConversionSerializer,
)
from .services.file_service import FileService


logger = logging.getLogger(__name__)


def _conversion_service():
    """Charge le pipeline DOCX à la demande, pas au chargement des URLs."""
    from .services.conversion_service import ConversionService

    return ConversionService


# ==========================================================
# OUTILS INTERNES
# ==========================================================

def _safe_filename(value, fallback="document"):
    """
    Nettoie un nom de fichier destiné au header HTTP.

    Le nom retourné ne contient ni chemin ni caractères
    susceptibles de créer un header invalide.
    """
    if not value:
        return fallback

    name = Path(str(value)).name.strip()

    if not name:
        return fallback

    name = (
        name.replace("\r", "")
        .replace("\n", "")
        .replace('"', "")
        .replace("\\", "")
        .strip()
    )

    return name or fallback


def _document_basename(conversion):
    """
    Retourne le nom de base du document original sans extension.
    """
    original_filename = getattr(
        conversion,
        "original_filename",
        None,
    )

    if not original_filename:
        original_file = getattr(
            conversion,
            "original_file",
            None,
        )

        if original_file:
            original_filename = getattr(
                original_file,
                "name",
                None,
            )

    if not original_filename:
        return "document"

    basename = Path(
        str(original_filename)
    ).stem

    return _safe_filename(
        basename,
        fallback="document",
    )


def _download_response(
    file_field,
    *,
    filename,
    content_type,
    conversion_id,
):
    """
    Construit une FileResponse sécurisée à partir d'un FileField.
    """

    if not file_field:
        return Response(
            {
                "detail": (
                    "Ce fichier n'est pas "
                    "encore disponible."
                )
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        file_path = Path(file_field.path)

    except (
        AttributeError,
        NotImplementedError,
    ):
        logger.exception(
            "Le stockage ne permet pas "
            "l'accès local au fichier %s",
            conversion_id,
        )

        return Response(
            {
                "detail": (
                    "Le fichier n'est pas "
                    "accessible actuellement."
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        if not file_path.exists():
            return Response(
                {
                    "detail": (
                        "Le fichier demandé "
                        "n'existe plus."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not file_path.is_file():
            return Response(
                {
                    "detail": (
                        "Le fichier demandé "
                        "n'est pas valide."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if file_path.stat().st_size <= 0:
            return Response(
                {
                    "detail": (
                        "Le fichier demandé "
                        "est vide."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

    except OSError:
        logger.exception(
            "Impossible de vérifier le fichier %s",
            conversion_id,
        )

        return Response(
            {
                "detail": (
                    "Impossible d'accéder "
                    "au fichier."
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        file_handle = file_path.open("rb")

    except OSError:
        logger.exception(
            "Impossible d'ouvrir le fichier %s",
            conversion_id,
        )

        return Response(
            {
                "detail": (
                    "Impossible de télécharger "
                    "le fichier."
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    response = FileResponse(
        file_handle,
        content_type=content_type,
    )

    response["Content-Disposition"] = (
        'attachment; filename="'
        f'{_safe_filename(filename)}'
        '"'
    )

    response["Content-Length"] = str(
        file_path.stat().st_size
    )

    return response


# ==========================================================
# LISTE DES CONVERSIONS
# ==========================================================

class ConversionListAPIView(ListAPIView):
    """
    Retourne uniquement les conversions appartenant
    à l'utilisateur authentifié.
    """

    serializer_class = WordToLatexConversionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            WordToLatexConversion.objects
            .filter(user=self.request.user)
            .order_by("-created_at")
        )


# ==========================================================
# DÉTAIL D'UNE CONVERSION
# ==========================================================

class ConversionDetailAPIView(APIView):
    """
    Retourne une conversion appartenant à l'utilisateur
    authentifié.
    """

    permission_classes = [IsAuthenticated]

    @staticmethod
    def get_object(request, conversion_id):
        return get_object_or_404(
            WordToLatexConversion,
            id=conversion_id,
            user=request.user,
        )

    def get(self, request, id):
        conversion = self.get_object(
            request,
            id,
        )

        serializer = WordToLatexConversionSerializer(
            conversion
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


# ==========================================================
# UPLOAD + CONVERSION
# ==========================================================

class UploadWordDocumentAPIView(APIView):
    """
    Upload d'un fichier DOCX puis conversion Word -> LaTeX.

    Workflow :

        DOCX
          ↓
        validation
          ↓
        stockage
          ↓
        analyse scientifique
          ↓
        conversion LaTeX
          ↓
        réponse JSON

    Le PDF et le ZIP ne sont pas générés automatiquement.
    """

    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def post(self, request):
        # --------------------------------------------------
        # Validation du document
        # --------------------------------------------------

        document_serializer = (
            WordDocumentUploadSerializer(
                data=request.data
            )
        )

        document_serializer.is_valid(
            raise_exception=True
        )

        # --------------------------------------------------
        # IMPORTANT :
        # Le serializer définit le champ "file".
        # --------------------------------------------------

        document = (
            document_serializer.validated_data.get(
                "file"
            )
        )

        if document is None:
            raise ValidationError(
                {
                    "file": (
                        "Aucun fichier Word "
                        "n'a été fourni."
                    )
                }
            )

        # --------------------------------------------------
        # Extraction des options
        # --------------------------------------------------

        try:
            options = self._extract_options(
                request
            )

        except (ValueError, TypeError) as exc:
            raise ValidationError(
                {
                    "options": str(exc)
                }
            )

        # --------------------------------------------------
        # Validation des options
        # --------------------------------------------------

        options_serializer = (
            ConversionOptionsSerializer(
                data=options
            )
        )

        options_serializer.is_valid(
            raise_exception=True
        )

        validated_options = (
            options_serializer.validated_data
        )

        conversion = None

        try:
            # --------------------------------------------------
            # Création de la conversion
            # --------------------------------------------------

            conversion = (
                FileService.create_conversion(
                    document=document,
                    user=request.user,
                    options=validated_options,
                )
            )

            # --------------------------------------------------
            # Analyse + conversion
            # --------------------------------------------------

            result = (
                _conversion_service().process_conversion(
                    conversion
                )
            )

            conversion.refresh_from_db()

            # --------------------------------------------------
            # Réponse
            # --------------------------------------------------

            response_data = {
                "conversion": (
                    WordToLatexConversionSerializer(
                        conversion
                    ).data
                )
            }

            if isinstance(result, dict):
                allowed_result_fields = {
                    "analysis",
                    "latex_content",
                    "lines",
                    "success",
                    "latex_file",
                }

                for field in allowed_result_fields:
                    if field in result:
                        response_data[field] = (
                            result[field]
                        )

            return Response(
                response_data,
                status=status.HTTP_201_CREATED,
            )

        except ValidationError:
            raise

        except Exception as exc:
            logger.exception(
                "Erreur lors de l'upload/conversion "
                "de l'utilisateur %s",
                request.user.pk,
            )

            if conversion is not None:
                try:
                    _conversion_service().mark_as_failed(
                        conversion,
                        exc,
                    )
                except Exception:
                    logger.exception(
                        "Impossible de marquer "
                        "la conversion %s comme échouée.",
                        getattr(
                            conversion,
                            "id",
                            None,
                        ),
                    )

            return Response(
                {
                    "detail": (
                        "La conversion du document "
                        "a échoué. Veuillez réessayer."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ======================================================
    # OPTIONS
    # ======================================================

    @staticmethod
    def _extract_options(request):
        """
        Supporte deux formats.

        1. Objet JSON dans multipart :

            options='{"language":"french"}'

        2. Champs directs :

            language=french
            font_size=12pt

        Les valeurs booléennes multipart sont converties
        en vrais booléens.
        """

        raw_options = request.data.get(
            "options"
        )

        # --------------------------------------------------
        # Objet JSON transmis dans multipart
        # --------------------------------------------------

        if raw_options is not None:
            if isinstance(raw_options, dict):
                return raw_options

            if isinstance(raw_options, str):
                try:
                    parsed_options = json.loads(
                        raw_options
                    )

                except json.JSONDecodeError as exc:
                    raise ValueError(
                        "Le champ 'options' "
                        "contient un JSON invalide."
                    ) from exc

                if not isinstance(
                    parsed_options,
                    dict,
                ):
                    raise ValueError(
                        "Le champ 'options' "
                        "doit contenir un objet JSON."
                    )

                return parsed_options

            raise ValueError(
                "Le champ 'options' "
                "doit être un objet JSON valide."
            )

        # --------------------------------------------------
        # Champs directs
        # --------------------------------------------------

        serializer = (
            ConversionOptionsSerializer()
        )

        option_fields = set(
            serializer.fields.keys()
        )

        boolean_fields = {
            "table_of_contents",
            "section_numbering",
            "optimize_images",
            "include_footnotes",
            "include_comments",
            "include_metadata",
            "detect_complex_tables",
            "auto_error_correction",
        }

        options = {}

        for field_name in option_fields:
            if field_name not in request.data:
                continue

            value = request.data.get(
                field_name
            )

            if (
                field_name in boolean_fields
                and isinstance(value, str)
            ):
                normalized = (
                    value.strip().lower()
                )

                if normalized in {
                    "true",
                    "1",
                    "yes",
                    "on",
                }:
                    value = True

                elif normalized in {
                    "false",
                    "0",
                    "no",
                    "off",
                }:
                    value = False

            options[field_name] = value

        return options


# ==========================================================
# SUPPRESSION
# ==========================================================

class DeleteConversionAPIView(APIView):
    """
    Supprime une conversion appartenant à l'utilisateur
    ainsi que ses fichiers associés.
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request, id):
        conversion = get_object_or_404(
            WordToLatexConversion,
            id=id,
            user=request.user,
        )

        conversion_id = conversion.id

        try:
            FileService.delete_conversion_files(
                conversion
            )

            conversion.delete()

            return Response(
                status=status.HTTP_204_NO_CONTENT
            )

        except Exception:
            logger.exception(
                "Erreur lors de la suppression "
                "de la conversion %s",
                conversion_id,
            )

            return Response(
                {
                    "detail": (
                        "Impossible de supprimer "
                        "la conversion."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ==========================================================
# TÉLÉCHARGEMENT DES FICHIERS
# ==========================================================

class ConversionFileDownloadAPIView(APIView):
    """
    Téléchargement sécurisé des fichiers d'une conversion.

    Types disponibles :

        original
        docx
        latex
        tex
        pdf
        zip
    """

    permission_classes = [IsAuthenticated]

    FILE_CONFIG = {
        "original": {
            "field": "original_file",
            "content_type": (
                "application/vnd.openxmlformats-officedocument."
                "wordprocessingml.document"
            ),
            "extension": ".docx",
        },
        "docx": {
            "field": "original_file",
            "content_type": (
                "application/vnd.openxmlformats-officedocument."
                "wordprocessingml.document"
            ),
            "extension": ".docx",
        },
        "latex": {
            "field": "latex_file",
            "content_type": "application/x-tex",
            "extension": ".tex",
        },
        "tex": {
            "field": "latex_file",
            "content_type": "application/x-tex",
            "extension": ".tex",
        },
        "pdf": {
            "field": "pdf_file",
            "content_type": "application/pdf",
            "extension": ".pdf",
        },
        "zip": {
            "field": "zip_file",
            "content_type": "application/zip",
            "extension": ".zip",
        },
    }

    def get(self, request, id, file_type):
        # --------------------------------------------------
        # Normalisation du type
        # --------------------------------------------------

        file_type = str(file_type).strip().lower()

        config = self.FILE_CONFIG.get(
            file_type
        )

        if config is None:
            return Response(
                {
                    "detail": (
                        "Type de fichier invalide."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --------------------------------------------------
        # Propriétaire uniquement
        # --------------------------------------------------

        conversion = get_object_or_404(
            WordToLatexConversion,
            id=id,
            user=request.user,
        )

        # --------------------------------------------------
        # Récupération du FileField
        # --------------------------------------------------

        file_field = getattr(
            conversion,
            config["field"],
            None,
        )

        if not file_field:
            return Response(
                {
                    "detail": (
                        "Ce fichier n'est pas "
                        "encore disponible."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --------------------------------------------------
        # Nom du fichier
        # --------------------------------------------------

        basename = _document_basename(
            conversion
        )

        if file_type in {
            "original",
            "docx",
        }:
            filename = (
                f"{basename}"
                f"{config['extension']}"
            )

        elif file_type in {
            "latex",
            "tex",
        }:
            filename = (
                f"{basename}"
                f"{config['extension']}"
            )

        elif file_type == "pdf":
            filename = (
                f"{basename}"
                f"{config['extension']}"
            )

        else:
            filename = (
                f"{basename}"
                "_latex.zip"
            )

        # --------------------------------------------------
        # Réponse fichier
        # --------------------------------------------------

        return _download_response(
            file_field,
            filename=filename,
            content_type=config["content_type"],
            conversion_id=conversion.id,
        )


# ==========================================================
# GÉNÉRATION DU ZIP
# ==========================================================

class ConversionZipExportAPIView(APIView):
    """
    Génère le ZIP complet de la conversion.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        conversion = get_object_or_404(
            WordToLatexConversion,
            id=id,
            user=request.user,
        )

        if not _conversion_service().is_ready_for_export(
            conversion
        ):
            return Response(
                {
                    "detail": (
                        "La conversion n'est pas "
                        "prête pour l'export."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = (
                _conversion_service().export_conversion(
                    conversion,
                    generate_pdf=False,
                )
            )

            conversion.refresh_from_db()

            zip_url = None

            if conversion.zip_file:
                try:
                    zip_url = (
                        conversion.zip_file.url
                    )
                except ValueError:
                    logger.warning(
                        "URL ZIP indisponible "
                        "pour la conversion %s.",
                        conversion.id,
                    )

            if not zip_url and isinstance(
                result,
                dict,
            ):
                zip_url = result.get(
                    "zip_file"
                )

            return Response(
                {
                    "success": True,
                    "conversion": (
                        WordToLatexConversionSerializer(
                            conversion
                        ).data
                    ),
                    "zip_file": zip_url,
                },
                status=status.HTTP_200_OK,
            )

        except Exception:
            logger.exception(
                "Erreur lors de la génération ZIP "
                "de la conversion %s",
                conversion.id,
            )

            return Response(
                {
                    "detail": (
                        "Impossible de générer "
                        "le fichier ZIP."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ==========================================================
# GÉNÉRATION DU PDF
# ==========================================================

class ConversionPdfExportAPIView(APIView):
    """
    Génère le PDF à partir du LaTeX.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        conversion = get_object_or_404(
            WordToLatexConversion,
            id=id,
            user=request.user,
        )

        if not _conversion_service().is_ready_for_export(
            conversion
        ):
            return Response(
                {
                    "detail": (
                        "La conversion n'est pas "
                        "prête pour l'export."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = (
                _conversion_service().export_conversion(
                    conversion,
                    generate_pdf=True,
                )
            )

            conversion.refresh_from_db()

            pdf_url = None

            if conversion.pdf_file:
                try:
                    pdf_url = (
                        conversion.pdf_file.url
                    )
                except ValueError:
                    logger.warning(
                        "URL PDF indisponible "
                        "pour la conversion %s.",
                        conversion.id,
                    )

            if not pdf_url and isinstance(
                result,
                dict,
            ):
                pdf_url = result.get(
                    "pdf_file"
                )

            return Response(
                {
                    "success": True,
                    "conversion": (
                        WordToLatexConversionSerializer(
                            conversion
                        ).data
                    ),
                    "pdf_file": pdf_url,
                },
                status=status.HTTP_200_OK,
            )

        except Exception:
            logger.exception(
                "Erreur lors de la génération PDF "
                "de la conversion %s",
                conversion.id,
            )

            return Response(
                {
                    "detail": (
                        "Impossible de générer "
                        "le fichier PDF."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UploadPdfToLatexAPIView(APIView):
    """Extract text from an imported PDF and return editable LaTeX."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = PdfDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.validated_data["file"]

        try:
            from .services.pdf_to_latex import convert_pdf

            result = convert_pdf(document)
        except ValueError as exc:
            raise ValidationError({"detail": str(exc)}) from exc
        except Exception:
            logger.exception(
                "PDF vers LaTeX failed for user %s", request.user.pk
            )
            return Response(
                {"detail": "Impossible d’analyser ce PDF. Vérifiez le fichier et réessayez."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        return Response(result, status=status.HTTP_200_OK)


class DownloadPdfLatexArchiveAPIView(APIView):
    """Rebuild and stream an Overleaf-ready source-and-assets ZIP."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = PdfDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.validated_data["file"]

        try:
            from .services.pdf_to_latex import create_latex_archive

            archive, filename = create_latex_archive(document)
        except ValueError as exc:
            raise ValidationError({"detail": str(exc)}) from exc
        except Exception:
            logger.exception(
                "PDF LaTeX archive failed for user %s", request.user.pk
            )
            return Response(
                {"detail": "Impossible de préparer le projet ZIP pour ce PDF."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        return FileResponse(
            archive,
            as_attachment=True,
            filename=filename,
            content_type="application/zip",
        )


class CreatePdfLatexShareAPIView(APIView):
    """Create a private-to-the-link export with a seven-day expiry."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = PdfDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.validated_data["file"]
        file_type = request.data.get("file_type", PdfLatexShare.TYPE_LATEX)
        if file_type not in {PdfLatexShare.TYPE_LATEX, PdfLatexShare.TYPE_ZIP}:
            raise ValidationError({"file_type": "Choose 'latex' or 'zip'."})

        try:
            from .services.pdf_to_latex import convert_pdf, create_latex_archive

            conversion = convert_pdf(document)
            if file_type == PdfLatexShare.TYPE_ZIP:
                archive, filename = create_latex_archive(
                    document,
                    conversion_result=conversion,
                )
                content = archive.getvalue()
            else:
                filename = f"{Path(document.name).stem}.tex"
                content = conversion["latex_code"].encode("utf-8")

            now = timezone.now()
            for expired in PdfLatexShare.objects.filter(expires_at__lte=now).iterator():
                expired.shared_file.delete(save=False)
                expired.delete()

            share = PdfLatexShare.objects.create(
                user=request.user,
                original_filename=_safe_filename(document.name),
                file_type=file_type,
                expires_at=now + timedelta(days=7),
            )
            try:
                share.shared_file.save(
                    _safe_filename(filename, fallback="document." + file_type),
                    ContentFile(content),
                    save=True,
                )
            except Exception:
                share.delete()
                raise
        except ValueError as exc:
            raise ValidationError({"detail": str(exc)}) from exc
        except Exception:
            logger.exception(
                "PDF LaTeX share creation failed for user %s", request.user.pk
            )
            return Response(
                {"detail": "Unable to create a sharing link for this PDF."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        share_path = reverse(
            "word_to_latex:shared_pdf_latex_download",
            kwargs={"token": share.pk},
        )
        return Response(
            {
                "share_url": request.build_absolute_uri(share_path),
                "file_type": file_type,
                "expires_at": share.expires_at,
            },
            status=status.HTTP_201_CREATED,
        )


class SharedPdfLatexDownloadAPIView(APIView):
    """Download a file through its unguessable, expiring bearer URL."""

    permission_classes = [AllowAny]

    def get(self, request, token):
        share = get_object_or_404(PdfLatexShare, pk=token)
        if share.expires_at <= timezone.now():
            share.shared_file.delete(save=False)
            share.delete()
            return Response(
                {"detail": "This sharing link has expired."},
                status=status.HTTP_410_GONE,
            )

        extension = "tex" if share.file_type == PdfLatexShare.TYPE_LATEX else "zip"
        filename = f"{Path(share.original_filename).stem}.{extension}"
        response = FileResponse(
            share.shared_file.open("rb"),
            as_attachment=True,
            filename=_safe_filename(filename),
            content_type=(
                "application/x-tex"
                if extension == "tex"
                else "application/zip"
            ),
        )
        response["Cache-Control"] = "private, no-store"
        response["X-Robots-Tag"] = "noindex, nofollow"
        return response
