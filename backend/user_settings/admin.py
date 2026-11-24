from django.contrib import admin

from .models import UserSettings


@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "theme",
        "language",
        "export_format",
        "auto_save",
        "confirm_delete",
    )

    search_fields = (
        "user__username",
    )