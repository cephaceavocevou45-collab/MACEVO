from django.urls import path

from .views import (
    AvatarView,
    ProfileView,
)


urlpatterns = [
    path(
        "",
        ProfileView.as_view(),
        name="profile",
    ),

    path(
        "avatar/",
        AvatarView.as_view(),
        name="profile-avatar",
    ),
]