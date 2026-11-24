
"""
==========================================================
MACEVO IA
List Projects View
==========================================================

API de récupération de la liste des projets scientifiques.

La sélection des projets accessibles est déléguée
à ProjectSelector.

Auteur : MACEVO
"""

from __future__ import annotations

from rest_framework.filters import (
    OrderingFilter,
    SearchFilter,
)
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from projects.selectors import ProjectSelector
from projects.serializers import ScientificProjectSerializer


class ProjectListView(ListAPIView):
    """
    Retourne la liste des projets de l'utilisateur connecté.

    GET /api/projects/

    Recherche :
        ?search=mémoire

    Tri :
        ?ordering=title
        ?ordering=-updated_at
        ?ordering=created_at
    """

    serializer_class = ScientificProjectSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    # =========================================================
    # RECHERCHE
    # =========================================================

    search_fields = [
        "title",
        "subject",
    ]

    # =========================================================
    # TRI
    # =========================================================

    ordering_fields = [
        "title",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-updated_at",
    ]

    # =========================================================
    # QUERYSET
    # =========================================================

    def get_queryset(self):
        """
        Retourne uniquement les projets appartenant
        à l'utilisateur connecté.

        ProjectSelector reste responsable de la règle
        d'accès aux projets.
        """

        return ProjectSelector.get_user_projects(
            self.request.user
        )
