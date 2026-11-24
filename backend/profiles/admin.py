from django.contrib import admin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):

    list_display = (

        "user",

        "phone",

        "university",

        "country",

        "city",

        "profile_completed",

        "created_at",

    )

    list_filter = (

        "profile_completed",

        "country",

        "university",

    )

    search_fields = (

        "user__first_name",

        "user__last_name",

        "user__email",

        "user__username",

        "phone",

    )

    readonly_fields = (

        "created_at",

        "updated_at",

    )

    ordering = (

        "-created_at",

    )