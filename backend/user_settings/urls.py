from django.urls import path

from .views import (
    ChangePasswordView,
    UserSettingsView,
)


urlpatterns = [
    path(
        "",
        UserSettingsView.as_view(),
        name="user-settings",
    ),

    path(
        "password/",
        ChangePasswordView.as_view(),
        name="change-password",
    ),
]