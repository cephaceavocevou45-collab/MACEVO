from django.contrib.auth.models import User

from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(
        source="user.first_name",
        required=False,
        allow_blank=True,
        max_length=150,
    )

    lastName = serializers.CharField(
        source="user.last_name",
        required=False,
        allow_blank=True,
        max_length=150,
    )

    username = serializers.CharField(
        source="user.username",
        required=False,
        allow_blank=False,
        max_length=150,
    )

    email = serializers.EmailField(
        source="user.email",
        required=False,
        allow_blank=False,
    )

    avatar = serializers.ImageField(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Profile

        fields = [
            "firstName",
            "lastName",
            "username",
            "email",
            "phone",
            "university",
            "country",
            "city",
            "bio",
            "avatar",
            "date_of_birth",
            "profile_completed",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "profile_completed",
            "created_at",
            "updated_at",
        ]

    def validate_username(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le nom d'utilisateur ne peut pas être vide."
            )

        user = self.instance.user if self.instance else None

        queryset = User.objects.filter(
            username__iexact=value
        )

        if user:
            queryset = queryset.exclude(pk=user.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Ce nom d'utilisateur est déjà utilisé."
            )

        return value

    def validate_email(self, value):
        value = value.strip().lower()

        if not value:
            raise serializers.ValidationError(
                "L'adresse e-mail ne peut pas être vide."
            )

        user = self.instance.user if self.instance else None

        queryset = User.objects.filter(
            email__iexact=value
        )

        if user:
            queryset = queryset.exclude(pk=user.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Cette adresse e-mail est déjà utilisée."
            )

        return value

    def validate_phone(self, value):
        value = value.strip()

        if value:
            allowed_characters = set(
                "0123456789+ -()."
            )

            if not all(
                character in allowed_characters
                for character in value
            ):
                raise serializers.ValidationError(
                    "Le numéro de téléphone contient des caractères invalides."
                )

        return value

    def validate_country(self, value):
        value = value.strip()

        if len(value) > 100:
            raise serializers.ValidationError(
                "Le nom du pays est trop long."
            )

        return value

    def validate_city(self, value):
        value = value.strip()

        if len(value) > 100:
            raise serializers.ValidationError(
                "Le nom de la ville est trop long."
            )

        return value

    def validate_university(self, value):
        value = value.strip()

        if len(value) > 255:
            raise serializers.ValidationError(
                "Le nom de l'établissement est trop long."
            )

        return value

    def validate_bio(self, value):
        value = value.strip()

        if len(value) > 2000:
            raise serializers.ValidationError(
                "La biographie ne peut pas dépasser 2000 caractères."
            )

        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop(
            "user",
            {},
        )

        user = instance.user

        if "first_name" in user_data:
            user.first_name = user_data["first_name"].strip()

        if "last_name" in user_data:
            user.last_name = user_data["last_name"].strip()

        if "username" in user_data:
            user.username = user_data["username"]

        if "email" in user_data:
            user.email = user_data["email"]

        user.save(
            update_fields=[
                "first_name",
                "last_name",
                "username",
                "email",
            ]
        )

        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.profile_completed = (
            instance.calculate_completion()
        )

        instance.save()

        return instance