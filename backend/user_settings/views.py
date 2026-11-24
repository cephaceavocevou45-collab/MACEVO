from django.contrib.auth.password_validation import (
    validate_password,
)
from django.core.exceptions import (
    ValidationError as DjangoValidationError,
)

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UserSettingsSerializer
from .services import UserSettingsService


class UserSettingsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = UserSettingsService.get_settings(
            request.user
        )

        serializer = UserSettingsSerializer(
            settings
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        settings = UserSettingsService.get_settings(
            request.user
        )

        serializer = UserSettingsSerializer(
            settings,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            settings = (
                UserSettingsService.update_settings(
                    request.user,
                    serializer.validated_data,
                )
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = (
            UserSettingsSerializer(settings)
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        settings = UserSettingsService.get_settings(
            request.user
        )

        serializer = UserSettingsSerializer(
            settings,
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            settings = (
                UserSettingsService.update_settings(
                    request.user,
                    serializer.validated_data,
                )
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = (
            UserSettingsSerializer(settings)
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        old_password = request.data.get(
            "old_password",
            "",
        )

        new_password = request.data.get(
            "new_password",
            "",
        )

        confirmation = request.data.get(
            "new_password_confirmation",
            "",
        )

        if not old_password:
            return Response(
                {
                    "old_password": [
                        "Le mot de passe actuel est obligatoire."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not new_password:
            return Response(
                {
                    "new_password": [
                        "Le nouveau mot de passe est obligatoire."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirmation:
            return Response(
                {
                    "new_password_confirmation": [
                        "Les deux nouveaux mots de passe ne correspondent pas."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(
            old_password
        ):
            return Response(
                {
                    "old_password": [
                        "Le mot de passe actuel est incorrect."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(
                new_password,
                user=user,
            )
        except DjangoValidationError as exc:
            return Response(
                {
                    "new_password": list(
                        exc.messages
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(
            update_fields=["password"]
        )

        return Response(
            {
                "detail": (
                    "Mot de passe modifié avec succès."
                )
            },
            status=status.HTTP_200_OK,
        )