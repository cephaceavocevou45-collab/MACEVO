"""
==========================================================
MACEVO IA
Assistant Permissions
==========================================================

Permissions du module Assistant.
"""

from rest_framework.permissions import BasePermission


class IsConversationOwner(BasePermission):
    """
    Vérifie que l'utilisateur est propriétaire
    de la conversation.
    """

    message = (
        "Vous n'êtes pas autorisé à accéder à cette conversation."
    )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        return obj.user == request.user


class IsMessageOwner(BasePermission):
    """
    Vérifie que le message appartient
    à l'utilisateur connecté.
    """

    message = (
        "Vous n'êtes pas autorisé à accéder à ce message."
    )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        return (
            obj.conversation.user == request.user
        )


class ReadOnly(BasePermission):
    """
    Autorise uniquement les méthodes de lecture.
    """

    def has_permission(
        self,
        request,
        view,
    ):
        return request.method in (
            "GET",
            "HEAD",
            "OPTIONS",
        )


class IsAuthenticatedAndOwner(BasePermission):
    """
    Vérifie que l'utilisateur est authentifié
    et propriétaire de la ressource.
    """

    message = (
        "Authentification requise."
    )

    def has_permission(
        self,
        request,
        view,
    ):
        return (
            request.user
            and request.user.is_authenticated
        )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        if hasattr(obj, "user"):
            return obj.user == request.user

        if hasattr(obj, "conversation"):
            return (
                obj.conversation.user
                == request.user
            )

        return False