from django.contrib import admin

from .models import WordToLatexConversion


@admin.register(WordToLatexConversion)
class WordToLatexConversionAdmin(admin.ModelAdmin):
    """
    Interface d'administration des conversions Word -> LaTeX.
    """

    list_display = (
        "original_filename",
        "user",
        "status",
        "progress",
        "words_count",
        "tables_count",
        "images_count",
        "created_at",
    )

    list_filter = (
        "status",
        "document_class",
        "language",
        "bibliography_package",
        "image_handling",
        "created_at",
    )

    search_fields = (
        "original_filename",
        "document_title",
        "document_author",
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "id",
        "file_size",
        "file_size_mb",
        "paragraphs_count",
        "headings_count",
        "words_count",
        "tables_count",
        "images_count",
        "comments_count",
        "footnotes_count",
        "latex_lines_count",
        "created_at",
        "updated_at",
        "completed_at",
    )

    fieldsets = (
        (
            "Informations générales",
            {
                "fields": (
                    "id",
                    "user",
                    "status",
                    "progress",
                    "error_message",
                )
            },
        ),
        (
            "Document Word original",
            {
                "fields": (
                    "original_file",
                    "original_filename",
                    "file_size",
                    "file_size_mb",
                    "document_title",
                    "document_author",
                )
            },
        ),
        (
            "Options de conversion",
            {
                "fields": (
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
                )
            },
        ),
        (
            "Statistiques du document",
            {
                "fields": (
                    "paragraphs_count",
                    "headings_count",
                    "words_count",
                    "tables_count",
                    "images_count",
                    "comments_count",
                    "footnotes_count",
                    "latex_lines_count",
                )
            },
        ),
        (
            "Contenu LaTeX",
            {
                "fields": (
                    "latex_code",
                    "latex_file",
                )
            },
        ),
        (
            "Fichiers exportés",
            {
                "fields": (
                    "zip_file",
                    "pdf_file",
                )
            },
        ),
        (
            "Dates",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                    "completed_at",
                )
            },
        ),
    )

    ordering = ("-created_at",)

    list_per_page = 25