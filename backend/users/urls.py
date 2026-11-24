from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    GoogleLoginView,
    SafeTokenRefreshView,
)

urlpatterns = [

    path(
        "register/",
        RegisterView.as_view(),
    ),

    path(
        "login/",
        LoginView.as_view(),
    ),

    path(
        "google-login/",
        GoogleLoginView.as_view(),
    ),

    path(
        "token/refresh/",
        SafeTokenRefreshView.as_view(),
    ),
]