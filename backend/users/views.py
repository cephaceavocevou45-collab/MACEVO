from django.contrib.auth.models import User

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.views import TokenRefreshView

from google.oauth2 import id_token
from google.auth.transport import requests

from .serializers import RegisterSerializer, LoginSerializer

import traceback


class SafeTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except User.DoesNotExist as exc:
            raise InvalidToken(
                "La session est invalide ou le compte n'existe plus."
            ) from exc


class SafeTokenRefreshView(TokenRefreshView):
    serializer_class = SafeTokenRefreshSerializer

GOOGLE_CLIENT_ID = "979398997217-ufqkdum75thml0q0ea3d6ngm2v5qqggh.apps.googleusercontent.com"


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "email": user.email,
                "fullname": user.first_name,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "email": user.email,
                "fullname": user.first_name,
            },
            status=status.HTTP_200_OK,
        )


class GoogleLoginView(APIView):

    def post(self, request):

        token = request.data.get("token")

        if not token:
            return Response(
                {
                    "error": "Token Google manquant."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                GOOGLE_CLIENT_ID,
            )

            email = idinfo["email"]
            fullname = idinfo.get("name", "")

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": email,
                    "first_name": fullname,
                },
            )

            if created:
                user.set_unusable_password()
                user.save()

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "email": user.email,
                    "fullname": user.first_name,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            print("\n" + "=" * 70)
            print("ERREUR GOOGLE LOGIN")
            print(type(e))
            print(e) 
            traceback.print_exc()
            print("=" * 70)
            return Response(
        {
            "error": str(e),
        },
        status=status.HTTP_400_BAD_REQUEST,
    )