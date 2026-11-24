"""
==========================================================
MACEVO IA
Permissions communes
==========================================================
"""

from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """
    Vérifie que l'utilisateur est propriétaire
    de l'objet.
    """

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        return obj.author == request.user