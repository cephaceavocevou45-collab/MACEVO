"""
==========================================================
MACEVO IA
Assistant URLs
==========================================================
"""

from django.urls import path

from .views import (
    ArchiveConversationView,
    ChatView,
    ConversationDetailView,
    ConversationListView,
    CreateConversationView,
    DeleteConversationView,
    PinConversationView,
    RenameConversationView,
)

app_name = "assistant"

urlpatterns = [

    # =====================================================
    # Conversations
    # =====================================================

    path(
        "conversations/",
        ConversationListView.as_view(),
        name="conversation-list",
    ),

    path(
        "conversations/create/",
        CreateConversationView.as_view(),
        name="conversation-create",
    ),

    path(
        "conversations/<int:pk>/",
        ConversationDetailView.as_view(),
        name="conversation-detail",
    ),

    path(
        "conversations/<int:pk>/rename/",
        RenameConversationView.as_view(),
        name="conversation-rename",
    ),

    path(
        "conversations/<int:pk>/delete/",
        DeleteConversationView.as_view(),
        name="conversation-delete",
    ),

    path(
        "conversations/<int:pk>/pin/",
        PinConversationView.as_view(),
        name="conversation-pin",
    ),

    path(
        "conversations/<int:pk>/archive/",
        ArchiveConversationView.as_view(),
        name="conversation-archive",
    ),

    # =====================================================
    # Chat IA
    # =====================================================

    path(
        "chat/",
        ChatView.as_view(),
        name="chat",
    ),

]