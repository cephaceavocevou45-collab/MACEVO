from django.urls import path

from apps.assistant.views import (
    AssistantChatView,
    ScientificDocumentView,
)


urlpatterns = [
    path(
        "chat/",
        AssistantChatView.as_view(),
        name="assistant-chat",
    ),
    path(
        "scientific-document/",
        ScientificDocumentView.as_view(),
        name="scientific-document",
    ),
]