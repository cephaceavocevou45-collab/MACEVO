from django.db import transaction

from .models import UserSettings


class UserSettingsService:

    @staticmethod
    def get_settings(user):
        settings, _ = UserSettings.objects.get_or_create(
            user=user
        )

        return settings

    @staticmethod
    @transaction.atomic
    def update_settings(user, validated_data):
        settings = UserSettingsService.get_settings(
            user
        )

        full_name = validated_data.pop(
            "full_name",
            None,
        )

        email = validated_data.pop(
            "email",
            None,
        )

        user_changed = False

        if full_name is not None:
            full_name = full_name.strip()

            if not full_name:
                raise ValueError(
                    "Le nom complet ne peut pas être vide."
                )

            parts = full_name.split(
                " ",
                1,
            )

            user.first_name = parts[0]

            if len(parts) > 1:
                user.last_name = parts[1]
            else:
                user.last_name = ""

            user_changed = True

        if email is not None:
            email = email.strip().lower()

            if not email:
                raise ValueError(
                    "L'adresse email ne peut pas être vide."
                )

            if user.email != email:
                user.email = email
                user_changed = True

        if user_changed:
            user.save(
                update_fields=[
                    "first_name",
                    "last_name",
                    "email",
                ]
            )

        for field, value in validated_data.items():
            setattr(
                settings,
                field,
                value,
            )

        settings.save()

        return settings