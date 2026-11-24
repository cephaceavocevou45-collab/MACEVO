
"""
==========================================================
MACEVO IA
Projects Admin
==========================================================

Administration Django des projets scientifiques MACEVO.
"""

from __future__ import annotations

from django.contrib import admin

from .models import ScientificProject


@admin.register(ScientificProject)
class ScientificProjectAdmin(admin.ModelAdmin):
    """
    Interface d'administration des projets scientifiques.
    """

    # =========================================================
    # LISTE
    # =========================================================

    list_display = (
        "title",
        "author",
        "project_type",
        "level",
        "language",
        "status",
        "progress",
        "word_count",
        "page_count",
        "version",
        "is_public",
        "is_archived",
        "created_at",
        "updated_at",
    )

    list_filter = (
        "project_type",
        "level",
        "language",
        "status",
        "citation_style",
        "latex_template",
        "is_public",
        "is_archived",
        "is_favorite",
        "created_at",
    )

    search_fields = (
        "title",
        "subject",
        "keywords",
        "description",
        "author__username",
        "author__email",
    )

    list_select_related = (
        "author",
    )

    ordering = (
        "-updated_at",
    )

    list_per_page = 25

    # =========================================================
    # CHAMPS EN LECTURE SEULE
    # =========================================================

    readonly_fields = (
        "created_at",
        "updated_at",
        "word_count",
        "page_count",
        "chapter_count",
        "reference_count",
        "figure_count",
        "table_count",
        "last_ai_generation",
    )

    # =========================================================
    # FIELDSETS
    # =========================================================

    fieldsets = (
        (
            "Informations générales",
            {
                "fields": (
                    "author",
                    "title",
                    "slug",
                    "subject",
                    "description",
                    "abstract",
                    "content",
                    "keywords",
                ),
            },
        ),

        (
            "Classification",
            {
                "fields": (
                    "project_type",
                    "level",
                    "language",
                    "status",
                ),
            },
        ),

        (
            "Configuration scientifique",
            {
                "fields": (
                    "latex_template",
                    "citation_style",
                    "export_format",
                ),
            },
        ),

        (
            "Intelligence Artificielle",
            {
                "fields": (
                    "ai_provider",
                    "ai_model",
                    "last_ai_generation",
                ),
            },
        ),

        (
            "Documents",
            {
                "fields": (
                    "cover_image",
                    "source_file",
                ),
            },
        ),

        (
            "Statistiques",
            {
                "fields": (
                    "word_count",
                    "page_count",
                    "chapter_count",
                    "reference_count",
                    "figure_count",
                    "table_count",
                    "progress",
                    "version",
                ),
            },
        ),

        (
            "Organisation",
            {
                "fields": (
                    "is_public",
                    "is_archived",
                    "is_favorite",
                    "last_opened",
                ),
            },
        ),

        (
            "Dates",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
            },
        ),
    )
