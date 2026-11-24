import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class WordToLatexConversion(models.Model):
    STATUS_UPLOADED = "uploaded"
    STATUS_ANALYZING = "analyzing"
    STATUS_ANALYZED = "analyzed"
    STATUS_CONVERTING = "converting"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_UPLOADED, "Uploaded"),
        (STATUS_ANALYZING, "Analyzing"),
        (STATUS_ANALYZED, "Analyzed"),
        (STATUS_CONVERTING, "Converting"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
    ]

    DOCUMENT_CLASS_CHOICES = [
        ("report", "Report"),
        ("article", "Article"),
    ]

    FONT_SIZE_CHOICES = [
        ("10pt", "10pt"),
        ("11pt", "11pt"),
        ("12pt", "12pt"),
    ]

    LANGUAGE_CHOICES = [
        ("french", "French"),
        ("english", "English"),
        ("spanish", "Spanish"),
        ("german", "German"),
    ]

    BIBLIOGRAPHY_PACKAGE_CHOICES = [
        ("biblatex", "BibLaTeX"),
        ("bibtex", "BibTeX"),
        ("none", "None"),
    ]

    IMAGE_HANDLING_CHOICES = [
        ("copy", "Copy images"),
        ("ignore", "Ignore images"),
        ("reference", "Reference images"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="word_to_latex_conversions",
        null=True,
        blank=True,
    )

    original_file = models.FileField(
        upload_to="word_to_latex/originals/",
    )

    original_filename = models.CharField(
        max_length=255,
    )

    file_size = models.PositiveBigIntegerField(
        default=0,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_UPLOADED,
        db_index=True,
    )

    progress = models.PositiveSmallIntegerField(
        default=0,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
    )

    error_message = models.TextField(
        blank=True,
        default="",
    )

    # ------------------------------------------------------------------
    # Conversion options
    # ------------------------------------------------------------------

    document_class = models.CharField(
        max_length=20,
        choices=DOCUMENT_CLASS_CHOICES,
        default="report",
    )

    font_size = models.CharField(
        max_length=10,
        choices=FONT_SIZE_CHOICES,
        default="11pt",
    )

    margins = models.CharField(
        max_length=20,
        default="2.5cm",
    )

    language = models.CharField(
        max_length=20,
        choices=LANGUAGE_CHOICES,
        default="french",
    )

    table_of_contents = models.BooleanField(
        default=True,
    )

    section_numbering = models.BooleanField(
        default=True,
    )

    bibliography_package = models.CharField(
        max_length=20,
        choices=BIBLIOGRAPHY_PACKAGE_CHOICES,
        default="biblatex",
    )

    bibliography_style = models.CharField(
        max_length=100,
        default="apa",
    )

    image_handling = models.CharField(
        max_length=20,
        choices=IMAGE_HANDLING_CHOICES,
        default="copy",
    )

    optimize_images = models.BooleanField(
        default=True,
    )

    include_footnotes = models.BooleanField(
        default=True,
    )

    include_comments = models.BooleanField(
        default=False,
    )

    include_metadata = models.BooleanField(
        default=False,
    )

    detect_complex_tables = models.BooleanField(
        default=True,
    )

    auto_error_correction = models.BooleanField(
        default=True,
    )

    # ------------------------------------------------------------------
    # Document statistics
    # ------------------------------------------------------------------

    paragraphs_count = models.PositiveIntegerField(
        default=0,
    )

    headings_count = models.PositiveIntegerField(
        default=0,
    )

    words_count = models.PositiveIntegerField(
        default=0,
    )

    tables_count = models.PositiveIntegerField(
        default=0,
    )

    images_count = models.PositiveIntegerField(
        default=0,
    )

    comments_count = models.PositiveIntegerField(
        default=0,
    )

    footnotes_count = models.PositiveIntegerField(
        default=0,
    )

    equations_count = models.PositiveIntegerField(
        default=0,
    )

    diagrams_count = models.PositiveIntegerField(
        default=0,
    )

    figures_count = models.PositiveIntegerField(
        default=0,
    )

    references_count = models.PositiveIntegerField(
        default=0,
    )

    # ------------------------------------------------------------------
    # Generated files/content
    # ------------------------------------------------------------------

    latex_code = models.TextField(
        blank=True,
        default="",
    )

    latex_lines_count = models.PositiveIntegerField(
        default=0,
    )

    latex_file = models.FileField(
        upload_to="word_to_latex/latex/",
        null=True,
        blank=True,
    )

    zip_file = models.FileField(
        upload_to="word_to_latex/zip/",
        null=True,
        blank=True,
    )

    pdf_file = models.FileField(
        upload_to="word_to_latex/pdf/",
        null=True,
        blank=True,
    )

    # ------------------------------------------------------------------
    # Metadata
    # ------------------------------------------------------------------

    document_title = models.CharField(
        max_length=500,
        blank=True,
        default="",
    )

    document_author = models.CharField(
        max_length=500,
        blank=True,
        default="",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["created_at"],
                name="wtl_created_idx",
            ),
        ]

    def __str__(self):
        return self.original_filename or str(self.id)

    @property
    def file_size_mb(self):
        return round(self.file_size / (1024 * 1024), 2)

    @property
    def is_completed(self):
        return self.status == self.STATUS_COMPLETED

    @property
    def has_failed(self):
        return self.status == self.STATUS_FAILED

    @property
    def is_ready_for_export(self):
        return (
            self.status == self.STATUS_COMPLETED
            and bool(self.latex_code)
        )

    @property
    def scientific_elements_count(self):
        """
        Total des éléments scientifiques détectés.

        figures_count représente déjà l'ensemble des figures
        (images + diagrammes) produit par l'analyseur.
        Les diagrammes ne doivent donc pas être ajoutés une
        seconde fois.
        """
        return (
            self.equations_count
            + self.figures_count
            + self.references_count
        )


class PdfLatexShare(models.Model):
    """Short-lived bearer link for a user-selected PDF-to-LaTeX export."""

    TYPE_LATEX = "latex"
    TYPE_ZIP = "zip"
    TYPE_CHOICES = [
        (TYPE_LATEX, "LaTeX source"),
        (TYPE_ZIP, "LaTeX project archive"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pdf_latex_shares",
    )
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    shared_file = models.FileField(upload_to="pdf_to_latex/shares/")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.original_filename} ({self.file_type})"
