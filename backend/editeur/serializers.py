"""
MACEVO — Sérialiseurs de l'éditeur scientifique.

Responsabilités :

    - sérialisation des assets de l'éditeur ;
    - contrôle de propriété du rapport ;
    - validation des fichiers importés ;
    - protection contre les extensions dangereuses ;
    - contrôle de taille des fichiers ;
    - cohérence entre type d'asset et fichier ;
    - génération d'URL absolues ;
    - bootstrap de l'éditeur.

Le modèle documentaire canonique reste :

    reports.Report

Aucun modèle Document parallèle n'est utilisé ici.
"""

from __future__ import annotations

from pathlib import Path

from django.conf import settings
from rest_framework import serializers

from reports.serializers import ReportSerializer

from .models import EditorAsset


# ============================================================================
# Configuration des uploads
# ============================================================================

DEFAULT_MAX_ASSET_SIZE = 15 * 1024 * 1024  # 15 Mo

MAX_ASSET_SIZE = getattr(
    settings,
    "EDITOR_MAX_ASSET_SIZE",
    DEFAULT_MAX_ASSET_SIZE,
)


# Extensions autorisées pour les images utilisées par l'éditeur.
IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".tif",
    ".tiff",
    ".svg",
}


# Formats particulièrement utiles pour les figures scientifiques.
FIGURE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".tif",
    ".tiff",
    ".svg",
    ".pdf",
}


# Documents pouvant être associés comme fichiers généraux
# à un document scientifique.
FILE_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".odt",
    ".txt",
    ".csv",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".tex",
    ".bib",
    ".json",
    ".xml",
    ".md",
    ".rtf",
    ".zip",
}


# Extensions explicitement interdites.
#
# L'éditeur ne doit jamais accepter de scripts ou exécutables comme
# assets destinés au document.
BLOCKED_EXTENSIONS = {
    ".exe",
    ".msi",
    ".com",
    ".scr",
    ".bat",
    ".cmd",
    ".ps1",
    ".psm1",
    ".vbs",
    ".vbe",
    ".js",
    ".jse",
    ".wsf",
    ".wsh",
    ".hta",
    ".jar",
    ".sh",
    ".bash",
    ".php",
    ".py",
    ".pyc",
    ".pyo",
    ".rb",
    ".pl",
    ".cgi",
    ".dll",
    ".so",
    ".dylib",
}


# Types MIME acceptés pour les images.
IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",
}


# Types MIME acceptés pour les figures.
FIGURE_MIME_TYPES = {
    *IMAGE_MIME_TYPES,
    "application/pdf",
}


# Types MIME courants pour les fichiers généraux.
FILE_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text",
    "text/plain",
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/x-tex",
    "text/x-tex",
    "application/x-bibtex",
    "application/json",
    "application/xml",
    "text/xml",
    "text/markdown",
    "application/rtf",
    "application/zip",
}


# ============================================================================
# Utilitaires
# ============================================================================


def _normalize_extension(filename: str) -> str:
    """
    Retourne l'extension normalisée du fichier.
    """

    return Path(
        filename
    ).suffix.lower()


def _safe_filename(filename: str) -> str:
    """
    Vérifie qu'un nom de fichier ne contient pas de chemin ou
    de caractères dangereux.

    Django protège déjà une partie de ce comportement, mais le
    serializer applique ici une validation supplémentaire.
    """

    if not filename:
        return ""

    filename = str(filename)

    if "\x00" in filename:
        raise serializers.ValidationError(
            "Le nom du fichier contient un caractère invalide."
        )

    # Un fichier uploadé ne doit pas transporter un chemin local.
    if "/" in filename or "\\" in filename:
        raise serializers.ValidationError(
            "Le nom du fichier est invalide."
        )

    return filename


def _validate_file_size(uploaded_file) -> None:
    """
    Vérifie la taille maximale autorisée.
    """

    size = getattr(
        uploaded_file,
        "size",
        None,
    )

    if size is None:
        return

    if size <= 0:
        raise serializers.ValidationError(
            "Le fichier est vide."
        )

    if size > MAX_ASSET_SIZE:
        max_size_mb = MAX_ASSET_SIZE / (
            1024 * 1024
        )

        raise serializers.ValidationError(
            (
                "Le fichier est trop volumineux. "
                f"La taille maximale est de "
                f"{max_size_mb:.0f} Mo."
            )
        )


def _validate_extension(
    extension: str,
    asset_type: str,
) -> None:
    """
    Vérifie que l'extension correspond au type d'asset.
    """

    if extension in BLOCKED_EXTENSIONS:
        raise serializers.ValidationError(
            (
                "Ce type de fichier est interdit "
                "pour des raisons de sécurité."
            )
        )

    if asset_type == "image":
        if extension not in IMAGE_EXTENSIONS:
            raise serializers.ValidationError(
                (
                    "Ce fichier n'est pas une image "
                    "compatible avec l'éditeur."
                )
            )

        return

    if asset_type == "figure":
        if extension not in FIGURE_EXTENSIONS:
            raise serializers.ValidationError(
                (
                    "Ce fichier n'est pas un format "
                    "de figure scientifique compatible."
                )
            )

        return

    if asset_type == "file":
        if extension not in (
            IMAGE_EXTENSIONS
            | FIGURE_EXTENSIONS
            | FILE_EXTENSIONS
        ):
            raise serializers.ValidationError(
                (
                    "Cette extension de fichier "
                    "n'est pas autorisée dans l'éditeur."
                )
            )


def _validate_mime_type(
    uploaded_file,
    extension: str,
    asset_type: str,
) -> None:
    """
    Vérifie le type MIME déclaré lorsqu'il est disponible.

    Le type MIME envoyé par le navigateur n'est pas considéré comme
    une preuve cryptographique du contenu, mais il permet de détecter
    les incohérences évidentes.
    """

    content_type = getattr(
        uploaded_file,
        "content_type",
        None,
    )

    if not content_type:
        return

    content_type = (
        str(content_type)
        .strip()
        .lower()
    )

    if asset_type == "image":
        allowed_types = IMAGE_MIME_TYPES

    elif asset_type == "figure":
        allowed_types = FIGURE_MIME_TYPES

    else:
        allowed_types = (
            IMAGE_MIME_TYPES
            | FIGURE_MIME_TYPES
            | FILE_MIME_TYPES
        )

    # Certains navigateurs ou clients peuvent envoyer un MIME générique.
    generic_types = {
        "application/octet-stream",
        "binary/octet-stream",
    }

    if content_type in generic_types:
        return

    if content_type not in allowed_types:
        raise serializers.ValidationError(
            (
                "Le type MIME du fichier n'est pas "
                "compatible avec l'asset sélectionné."
            )
        )

    # Contrôles supplémentaires extension / MIME.
    if (
        extension in IMAGE_EXTENSIONS
        and not content_type.startswith("image/")
    ):
        raise serializers.ValidationError(
            (
                "L'extension du fichier ne correspond "
                "pas à son type MIME."
            )
        )

    if (
        extension == ".pdf"
        and content_type != "application/pdf"
    ):
        raise serializers.ValidationError(
            (
                "Le fichier PDF possède un type MIME "
                "incohérent."
            )
        )

    if (
        extension == ".svg"
        and content_type != "image/svg+xml"
    ):
        raise serializers.ValidationError(
            (
                "Le fichier SVG possède un type MIME "
                "incohérent."
            )
        )


def _validate_asset_file(
    uploaded_file,
    asset_type: str,
) -> None:
    """
    Validation complète d'un fichier d'asset.
    """

    if uploaded_file is None:
        raise serializers.ValidationError(
            "Un fichier est requis."
        )

    filename = _safe_filename(
        getattr(
            uploaded_file,
            "name",
            "",
        )
    )

    if not filename:
        raise serializers.ValidationError(
            "Le fichier possède un nom invalide."
        )

    extension = _normalize_extension(
        filename
    )

    if not extension:
        raise serializers.ValidationError(
            (
                "Le fichier doit posséder "
                "une extension valide."
            )
        )

    _validate_file_size(
        uploaded_file
    )

    _validate_extension(
        extension,
        asset_type,
    )

    _validate_mime_type(
        uploaded_file,
        extension,
        asset_type,
    )


# ============================================================================
# EditorAssetSerializer
# ============================================================================


class EditorAssetSerializer(
    serializers.ModelSerializer
):
    """
    Sérialiseur principal des assets de l'éditeur scientifique.

    Un asset appartient toujours à un ``reports.Report`` appartenant
    à l'utilisateur connecté.
    """

    asset_type_display = serializers.CharField(
        source="get_asset_type_display",
        read_only=True,
    )

    file_url = serializers.SerializerMethodField()

    class Meta:
        model = EditorAsset

        fields = [
            "id",
            "report",
            "asset_type",
            "asset_type_display",
            "file",
            "file_url",
            "title",
            "description",
            "alt_text",
            "caption",
            "position",
            "uploaded_by",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "asset_type_display",
            "file_url",
            "uploaded_by",
            "created_at",
            "updated_at",
        ]

    # ----------------------------------------------------------------------
    # URL du fichier
    # ----------------------------------------------------------------------

    def get_file_url(
        self,
        obj,
    ):
        """
        Retourne l'URL absolue du fichier lorsque le contexte HTTP
        est disponible.
        """

        if not obj.file:
            return None

        request = self.context.get(
            "request"
        )

        url = obj.file.url

        if request:
            return request.build_absolute_uri(
                url
            )

        return url

    # ----------------------------------------------------------------------
    # Rapport propriétaire
    # ----------------------------------------------------------------------

    def validate_report(
        self,
        report,
    ):
        """
        Vérifie que le rapport appartient à l'utilisateur connecté.
        """

        request = self.context.get(
            "request"
        )

        if (
            not request
            or not request.user.is_authenticated
        ):
            raise serializers.ValidationError(
                "Authentification requise."
            )

        if report.author_id != request.user.id:
            raise serializers.ValidationError(
                "Ce rapport ne vous appartient pas."
            )

        return report

    # ----------------------------------------------------------------------
    # Validation du fichier
    # ----------------------------------------------------------------------

    def validate_file(
        self,
        uploaded_file,
    ):
        """
        Valide le fichier indépendamment du type d'asset.

        La cohérence avec ``asset_type`` est contrôlée dans
        ``validate()`` afin de disposer simultanément du fichier
        et du type sélectionné.
        """

        if uploaded_file is None:
            raise serializers.ValidationError(
                "Un fichier est requis."
            )

        _validate_file_size(
            uploaded_file
        )

        _safe_filename(
            getattr(
                uploaded_file,
                "name",
                "",
            )
        )

        return uploaded_file

    # ----------------------------------------------------------------------
    # Validation globale
    # ----------------------------------------------------------------------

    def validate(
        self,
        attrs,
    ):
        """
        Validation globale de l'asset.

        Vérifie notamment :

            - présence du fichier ;
            - type d'asset ;
            - extension ;
            - taille ;
            - type MIME ;
            - cohérence fichier / image / figure / fichier.
        """

        asset_type = attrs.get(
            "asset_type"
        )

        uploaded_file = attrs.get(
            "file"
        )

        # Lors d'une modification PATCH, le fichier peut ne pas être
        # renvoyé. Dans ce cas, on conserve le fichier existant.
        if uploaded_file is None and self.instance:
            uploaded_file = self.instance.file

        if uploaded_file is None:
            raise serializers.ValidationError(
                {
                    "file": (
                        "Un fichier est requis "
                        "pour cet asset."
                    )
                }
            )

        if not asset_type and self.instance:
            asset_type = self.instance.asset_type

        if asset_type not in {
            "image",
            "figure",
            "file",
        }:
            raise serializers.ValidationError(
                {
                    "asset_type": (
                        "Le type d'asset est invalide."
                    )
                }
            )

        try:
            _validate_asset_file(
                uploaded_file,
                asset_type,
            )
        except serializers.ValidationError as exc:
            raise serializers.ValidationError(
                {
                    "file": exc.detail,
                }
            )

        # ------------------------------------------------------------------
        # Nettoyage léger des métadonnées textuelles
        # ------------------------------------------------------------------

        for field_name in [
            "title",
            "description",
            "alt_text",
            "caption",
        ]:
            value = attrs.get(
                field_name
            )

            if isinstance(
                value,
                str,
            ):
                attrs[field_name] = (
                    value.strip()
                )

        return attrs


# ============================================================================
# Bootstrap de l'éditeur
# ============================================================================


class EditorBootstrapSerializer(
    serializers.Serializer
):
    """
    Structure de bootstrap consommée par le frontend de l'éditeur.

    Le rapport, ses assets et les capacités disponibles sont exposés
    dans une structure unique.
    """

    report = ReportSerializer(
        read_only=True,
    )

    assets = EditorAssetSerializer(
        many=True,
        read_only=True,
    )

    autosave = serializers.DictField(
        read_only=True,
    )

    capabilities = serializers.DictField(
        read_only=True,
    )

    exports = serializers.DictField(
        read_only=True,
    )