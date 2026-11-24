from django.contrib import admin
from .models import Report, Template


@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "slug",
        "category",
        "page_count",
        "is_popular",
        "created_at",
    )

    list_filter = (
        "category",
        "is_popular",
    )

    search_fields = (
        "title",
        "slug",
        "description",
    )

    prepopulated_fields = {
        "slug": ("title",),
    }


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "author",
        "report_type",
        "academic_level",
        "status",
        "template",
        "created_at",
        "updated_at",
    )

    list_filter = (
        "status",
        "academic_level",
        "report_type",
        "scientific_field",
    )

    search_fields = (
        "title",
        "summary",
        "scientific_field",
        "report_type",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    ordering = (
        "-created_at",
    )