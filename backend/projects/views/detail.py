
"""
==========================================================
MACEVO IA
Project Detail View
==========================================================

API de récupération d'un projet scientifique.

La sélection des projets accessibles est déléguée
à ProjectSelector.

Auteur : MACEVO
"""

from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

from projects.selectors import ProjectSelector
from projects.serializers import ScientificProjectSerializer


class ProjectDetailView(RetrieveAPIView):
    """
    Retourne les informations d'un projet scientifique.

    GET /api/projects/<pk>/

    Un utilisateur authentifié ne peut consulter
    que ses propres projets.
    """

    serializer_class = ScientificProjectSerializer
    lookup_url_kwarg = "id"

    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        """
        Retourne uniquement les projets accessibles
        à l'utilisateur connecté.
        """

        return ProjectSelector.get_user_projects(
            self.request.user
        )
