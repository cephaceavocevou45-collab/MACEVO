from django.core.validators import FileExtensionValidator
from rest_framework import serializers

from .models import WordToLatexConversion


MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


class WordDocumentUploadSerializer(serializers.Serializer):
    """
    Validation du fichier DOCX envoyé par le frontend.
    """

    file = serializers.FileField(
        validators=[
            FileExtensionValidator(
                allowed_extensions=["docx"]
            )
        ]
    )

    def validate_file(self, value):
        if not value:
            raise serializers.ValidationError(
                "Aucun fichier n'a été fourni."
            )

        if value.size <= 0:
            raise serializers.ValidationError(
                "Le fichier est vide."
            )

        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                "Le fichier est trop volumineux. "
                "La taille maximale autorisée est de 50 MB."
            )

        filename = (value.name or "").lower()

        if not filename.endswith(".docx"):
            raise serializers.ValidationError(
                "Seuls les fichiers Microsoft Word .docx sont acceptés."
            )

        return value


class ConversionOptionsSerializer(serializers.Serializer):
    """
    Options de conversion DOCX → LaTeX.

    Les valeurs correspondent aux options utilisées par le backend
    et par l'interface React.
    """

    document_class = serializers.ChoiceField(
        choices=[
            ("report", "Report"),
            ("article", "Article"),
        ],
        default="report",
        required=False,
    )

    font_size = serializers.ChoiceField(
        choices=[
            ("10pt", "10pt"),
            ("11pt", "11pt"),
            ("12pt", "12pt"),
        ],
        default="11pt",
        required=False,
    )

    margins = serializers.CharField(
        max_length=20,
        default="2.5cm",
        required=False,
    )

    language = serializers.ChoiceField(
        choices=[
            ("french", "Français"),
            ("english", "English"),
            ("spanish", "Español"),
            ("german", "Deutsch"),
        ],
        default="french",
        required=False,
    )

    table_of_contents = serializers.BooleanField(
        default=True,
        required=False,
    )

    section_numbering = serializers.BooleanField(
        default=True,
        required=False,
    )

    bibliography_package = serializers.ChoiceField(
        choices=[
            ("biblatex", "BibLaTeX"),
            ("bibtex", "BibTeX"),
            ("none", "Aucune"),
        ],
        default="biblatex",
        required=False,
    )

    bibliography_style = serializers.CharField(
        max_length=100,
        default="apa",
        required=False,
    )

    image_handling = serializers.ChoiceField(
        choices=[
            ("copy", "Copier les images"),
            ("ignore", "Ignorer les images"),
            ("reference", "Conserver les références"),
        ],
        default="copy",
        required=False,
    )

    optimize_images = serializers.BooleanField(
        default=True,
        required=False,
    )

    include_footnotes = serializers.BooleanField(
        default=True,
        required=False,
    )

    include_comments = serializers.BooleanField(
        default=False,
        required=False,
    )

    include_metadata = serializers.BooleanField(
        default=False,
        required=False,
    )

    detect_complex_tables = serializers.BooleanField(
        default=True,
        required=False,
    )

    auto_error_correction = serializers.BooleanField(
        default=True,
        required=False,
    )

    def validate_margins(self, value):
        """
        Vérifie sommairement le format des marges.

        Exemples acceptés :
        - 2.5cm
        - 25mm
        - 1in
        - 1.2in
        """
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "La marge ne peut pas être vide."
            )

        if len(value) > 20:
            raise serializers.ValidationError(
                "La valeur de marge est trop longue."
            )

        return value

    def validate_bibliography_style(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le style bibliographique ne peut pas être vide."
            )

        return value


class WordToLatexConversionSerializer(serializers.ModelSerializer):
    """
    Sérialiseur principal utilisé pour retourner l'état d'une conversion.
    """

    file_size_mb = serializers.ReadOnlyField()
    is_completed = serializers.BooleanField(read_only=True)
    has_failed = serializers.BooleanField(read_only=True)
    is_ready_for_export = serializers.BooleanField(read_only=True)
    scientific_elements_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = WordToLatexConversion

        fields = [
            "id",

            # Fichier original
            "original_file",
            "original_filename",
            "file_size",
            "file_size_mb",

            # État de la conversion
            "status",
            "progress",
            "error_message",

            # Options
            "document_class",
            "font_size",
            "margins",
            "language",
            "table_of_contents",
            "section_numbering",
            "bibliography_package",
            "bibliography_style",
            "image_handling",
            "optimize_images",
            "include_footnotes",
            "include_comments",
            "include_metadata",
            "detect_complex_tables",
            "auto_error_correction",

            # Statistiques
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
            "scientific_elements_count",

            # Résultat
            "latex_code",
            "latex_lines_count",

            # Fichiers générés
            "latex_file",
            "zip_file",
            "pdf_file",

            # Métadonnées document
            "document_title",
            "document_author",

            # Helpers
            "is_completed",
            "has_failed",
            "is_ready_for_export",

            # Dates
            "created_at",
            "updated_at",
            "completed_at",
        ]

        read_only_fields = [
            "id",
            "original_file",
            "original_filename",
            "file_size",
            "file_size_mb",

            "status",
            "progress",
            "error_message",

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
            "scientific_elements_count",

            "latex_code",
            "latex_lines_count",

            "latex_file",
            "zip_file",
            "pdf_file",

            "document_title",
            "document_author",

            "is_completed",
            "has_failed",
            "is_ready_for_export",

            "created_at",
            "updated_at",
            "completed_at",
        ]


class WordToLatexCreateSerializer(serializers.Serializer):
    """
    Sérialiseur pratique pour les requêtes multipart/form-data.

    Le frontend peut envoyer :
        file=<document.docx>
        document_class=report
        font_size=11pt
        ...
    """

    file = serializers.FileField(
        validators=[
            FileExtensionValidator(
                allowed_extensions=["docx"]
            )
        ]
    )

    document_class = serializers.ChoiceField(
        choices=["report", "article"],
        default="report",
        required=False,
    )

    font_size = serializers.ChoiceField(
        choices=["10pt", "11pt", "12pt"],
        default="11pt",
        required=False,
    )

    margins = serializers.CharField(
        default="2.5cm",
        required=False,
        max_length=20,
    )

    language = serializers.ChoiceField(
        choices=[
            "french",
            "english",
            "spanish",
            "german",
        ],
        default="french",
        required=False,
    )

    table_of_contents = serializers.BooleanField(
        default=True,
        required=False,
    )

    section_numbering = serializers.BooleanField(
        default=True,
        required=False,
    )

    bibliography_package = serializers.ChoiceField(
        choices=[
            "biblatex",
            "bibtex",
            "none",
        ],
        default="biblatex",
        required=False,
    )

    bibliography_style = serializers.CharField(
        default="apa",
        required=False,
        max_length=100,
    )

    image_handling = serializers.ChoiceField(
        choices=[
            "copy",
            "ignore",
            "reference",
        ],
        default="copy",
        required=False,
    )

    optimize_images = serializers.BooleanField(
        default=True,
        required=False,
    )

    include_footnotes = serializers.BooleanField(
        default=True,
        required=False,
    )

    include_comments = serializers.BooleanField(
        default=False,
        required=False,
    )

    include_metadata = serializers.BooleanField(
        default=False,
        required=False,
    )

    detect_complex_tables = serializers.BooleanField(
        default=True,
        required=False,
    )

    auto_error_correction = serializers.BooleanField(
        default=True,
        required=False,
    )

    def validate_file(self, value):
        if value.size <= 0:
            raise serializers.ValidationError(
                "Le fichier est vide."
            )

        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                "Le fichier est trop volumineux. "
                "La taille maximale autorisée est de 50 MB."
            )

        filename = (value.name or "").lower()

        if not filename.endswith(".docx"):
            raise serializers.ValidationError(
                "Seuls les fichiers .docx sont acceptés."
            )

        return value


class PdfDocumentUploadSerializer(serializers.Serializer):
    """Validation d'un PDF source pour sa reconstruction en LaTeX."""

    file = serializers.FileField()

    def validate_file(self, value):
        if not value or value.size <= 0:
            raise serializers.ValidationError("Le fichier PDF est vide.")
        if value.size > 20 * 1024 * 1024:
            raise serializers.ValidationError(
                "Le PDF dépasse la taille maximale autorisée de 20 MB."
            )
        if not (value.name or "").lower().endswith(".pdf"):
            raise serializers.ValidationError("Seuls les fichiers PDF sont acceptés.")
        return value
