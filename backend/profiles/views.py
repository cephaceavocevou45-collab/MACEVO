from django.db import transaction

from rest_framework import status
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .serializers import ProfileSerializer


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    parser_classes = [
        JSONParser,
        MultiPartParser,
        FormParser,
    ]

    def get_profile(self, user):
        profile, _ = Profile.objects.get_or_create(
            user=user
        )

        return profile

    def get(self, request):
        profile = self.get_profile(request.user)

        serializer = ProfileSerializer(
            profile,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @transaction.atomic
    def patch(self, request):
        profile = self.get_profile(request.user)

        serializer = ProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        serializer.is_valid(
            raise_exception=True
        )

        profile = serializer.save()

        response_serializer = ProfileSerializer(
            profile,
            context={"request": request},
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )


class AvatarView(APIView):
    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def get_profile(self, user):
        profile, _ = Profile.objects.get_or_create(
            user=user
        )

        return profile

    @transaction.atomic
    def post(self, request):
        profile = self.get_profile(request.user)

        avatar = request.FILES.get("avatar")

        if not avatar:
            return Response(
                {
                    "avatar": [
                        "Aucune image n'a été envoyée."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_size = 5 * 1024 * 1024

        if avatar.size > max_size:
            return Response(
                {
                    "avatar": [
                        "L'image ne doit pas dépasser 5 Mo."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }

        if avatar.content_type not in allowed_types:
            return Response(
                {
                    "avatar": [
                        "Format d'image non supporté. "
                        "Utilisez JPG, PNG ou WebP."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_avatar = profile.avatar.name if profile.avatar else None

        profile.avatar = avatar

        profile.save(
            update_fields=[
                "avatar",
                "updated_at",
            ]
        )

        if old_avatar:
            try:
                profile.avatar.storage.delete(old_avatar)
            except Exception:
                pass

        serializer = ProfileSerializer(
            profile,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @transaction.atomic
    def delete(self, request):
        profile = self.get_profile(request.user)

        if profile.avatar:
            avatar = profile.avatar

            profile.avatar = None

            profile.save(
                update_fields=[
                    "avatar",
                    "updated_at",
                ]
            )

            try:
                avatar.delete(save=False)
            except Exception:
                pass

        serializer = ProfileSerializer(
            profile,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )