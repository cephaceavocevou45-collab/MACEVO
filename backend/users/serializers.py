import re

from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from rest_framework import serializers

from google.oauth2 import id_token
from google.auth.transport import requests


class RegisterSerializer(serializers.ModelSerializer):
    fullname = serializers.CharField(write_only=True)
    confirmPassword = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "fullname",
            "email",
            "password",
            "confirmPassword",
        ]

        extra_kwargs = {
            "password": {"write_only": True},
        }

    def validate(self, attrs):
        password = attrs["password"]

        if password != attrs["confirmPassword"]:
            raise serializers.ValidationError(
                {
                    "confirmPassword": "Les mots de passe ne correspondent pas."
                }
            )

        if User.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError(
                {
                    "email": "Cette adresse email existe déjà."
                }
            )

        if len(password) < 8:
            raise serializers.ValidationError(
                {
                    "password": "Le mot de passe doit contenir au moins 8 caractères."
                }
            )

        if not re.search(r"[A-Z]", password):
            raise serializers.ValidationError(
                {
                    "password": "Le mot de passe doit contenir au moins une lettre majuscule."
                }
            )

        if not re.search(r"[a-z]", password):
            raise serializers.ValidationError(
                {
                    "password": "Le mot de passe doit contenir au moins une lettre minuscule."
                }
            )

        if not re.search(r"\d", password):
            raise serializers.ValidationError(
                {
                    "password": "Le mot de passe doit contenir au moins un chiffre."
                }
            )

        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            raise serializers.ValidationError(
                {
                    "password": "Le mot de passe doit contenir au moins un caractère spécial."
                }
            )

        return attrs

    def create(self, validated_data):
        fullname = validated_data.pop("fullname")
        validated_data.pop("confirmPassword")

        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=fullname,
        )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Adresse email ou mot de passe incorrect."
            )

        user = authenticate(
            username=user.username,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError(
                "Adresse email ou mot de passe incorrect."
            )

        attrs["user"] = user
        return attrs


class GoogleLoginSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate(self, attrs):
        token = attrs.get("token")

        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
            )

            email = idinfo["email"]
            fullname = idinfo.get("name", "")

        except Exception:
            raise serializers.ValidationError(
                "Token Google invalide."
            )

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "first_name": fullname,
            },
        )

        attrs["user"] = user
        return attrs