
"""
==========================================================
MACEVO IA
Projects Permissions
==========================================================

Permissions REST Framework pour les projets scientifiques.

Les règles d'accès sont centralisées ici afin d'éviter de
dupliquer la logique de sécurité dans les différentes vues.
"""

from __future__ import annotations

from rest_framework.permissions import (
    SAFE_METHODS,
    BasePermission,
)


class IsProjectOwner(BasePermission):
    """
    Autorise uniquement le propriétaire du projet.
    """

    message = "Vous n'êtes pas propriétaire de ce projet."

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        return (
            request.user.is_authenticated
            and obj.author_id == request.user.id
        )


class IsProjectOwnerOrReadOnly(BasePermission):
    """
    Autorise la lecture.

    Les opérations d'écriture sont réservées
    au propriétaire du projet.
    """

    message = "Modification interdite."

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        if request.method in SAFE_METHODS:
            return True

        return (
            request.user.is_authenticated
            and obj.author_id == request.user.id
        )


class ReadOnly(BasePermission):
    """
    Autorise uniquement les méthodes HTTP de lecture.
    """

    message = "Cette ressource est en lecture seule."

    def has_permission(
        self,
        request,
        view,
    ):
        return request.method in SAFE_METHODS


class IsAuthenticatedAndOwner(BasePermission):
    """
    L'utilisateur doit être authentifié et propriétaire
    du projet.
    """

    message = "Accès refusé."

    def has_permission(
        self,
        request,
        view,
    ):
        return bool(
            request.user
            and request.user.is_authenticated
        )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        return (
            request.user.is_authenticated
            and obj.author_id == request.user.id
        )


class CanExportProject(BasePermission):
    """
    Autorise l'export d'un projet.

    Le propriétaire peut exporter son projet.

    Un projet public peut également être exporté par
    un utilisateur authentifié.
    """

    message = "Vous ne pouvez pas exporter ce projet."

    def has_permission(
        self,
        request,
        view,
    ):
        return bool(
            request.user
            and request.user.is_authenticated
        )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        if not request.user.is_authenticated:
            return False

        return (
            obj.author_id == request.user.id
            or obj.is_public
        )


class CanGenerateAI(BasePermission):
    """
    Autorise l'utilisation de l'IA sur un projet.

    Seul le propriétaire peut utiliser l'IA et un projet
    archivé ne peut pas recevoir de nouvelle génération.
    """

    message = "Vous ne pouvez pas utiliser l'IA sur ce projet."

    def has_permission(
        self,
        request,
        view,
    ):
        return bool(
            request.user
            and request.user.is_authenticated
        )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        if not request.user.is_authenticated:
            return False

        return (
            obj.author_id == request.user.id
            and not obj.is_archived
        )


class CanArchiveProject(BasePermission):
    """
    Autorise l'archivage ou la restauration d'un projet.

    Seul le propriétaire peut effectuer cette opération.
    """

    message = "Archivage interdit."

    def has_permission(
        self,
        request,
        view,
    ):
        return bool(
            request.user
            and request.user.is_authenticated
        )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        if not request.user.is_authenticated:
            return False

        return obj.author_id == request.user.id


class CanDeleteProject(BasePermission):
    """
    Autorise la suppression d'un projet.

    Seul le propriétaire peut supprimer son projet.
    """

    message = "Suppression interdite."

    def has_permission(
        self,
        request,
        view,
    ):
        return bool(
            request.user
            and request.user.is_authenticated
        )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        if not request.user.is_authenticated:
            return False

        return obj.author_id == request.user.id
