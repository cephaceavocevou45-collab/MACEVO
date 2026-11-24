from zoneinfo import available_timezones

from rest_framework import serializers

from .models import UserSettings


class UserSettingsSerializer(serializers.ModelSerializer):

    # Ces deux champs sont acceptés en écriture.
    # Leur représentation est ajoutée manuellement dans
    # to_representation().
    full_name = serializers.CharField(
        required=False,
        write_only=True,
    )

    email = serializers.EmailField(
        required=False,
        write_only=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    class Meta:
        model = UserSettings

        fields = [
            "full_name",
            "email",
            "username",

            "country",
            "timezone",
            "language",
            "date_format",

            "default_font",
            "font_size",
            "line_spacing",
            "default_margins",
            "auto_numbering",
            "show_ruler",
            "auto_save",
            "latex_preview",
            "scientific_spellcheck",

            "ai_model",
            "creativity",
            "academic_refs",
            "show_sources",
            "system_prompt",

            "notification_ai_messages",
            "notification_latex_conversion",
            "notification_tips",
            "notification_marketing",

            "export_format",
            "include_toc",
            "compress_images",

            "theme",
            "animations",

            "public_profile",
            "confirm_delete",

            "updated_at",
        ]

        read_only_fields = [
            "username",
            "updated_at",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)

        user = instance.user

        data["full_name"] = (
            user.get_full_name()
            or user.username
        )

        data["email"] = user.email or ""

        return data

    def validate_timezone(self, value):
        if value not in available_timezones():
            raise serializers.ValidationError(
                "Fuseau horaire invalide."
            )

        return value

    def validate_creativity(self, value):
        if value < 0 or value > 1:
            raise serializers.ValidationError(
                "La créativité doit être comprise entre 0 et 1."
            )

        return value

    def validate_country(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le pays ne peut pas être vide."
            )

        return value

    def validate_system_prompt(self, value):
        if len(value) > 10000:
            raise serializers.ValidationError(
                "Le prompt système ne peut pas dépasser 10 000 caractères."
            )

        return value