from __future__ import annotations

"""
==========================================================
MACEVO IA
Search Projects View
==========================================================

API de recherche des projets scientifiques.

La logique de recherche et de filtrage des projets est
déléguée à ProjectSelector.

Auteur : MACEVO
"""

from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from projects.selectors import ProjectSelector
from projects.serializers import ScientificProjectSerializer


class ProjectSearchView(ListAPIView):
    """
    Recherche des projets scientifiques de l'utilisateur connecté.

    Endpoint :

        GET /api/projects/search/?q=terme

    Paramètre :

        q
            Terme de recherche.
    """

    serializer_class = ScientificProjectSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    # =========================================================
    # QUERYSET
    # =========================================================

    def get_queryset(self):
        """
        Retourne les projets correspondant à la recherche.

        La restriction aux projets accessibles à l'utilisateur
        ainsi que la logique de recherche restent dans
        ProjectSelector.
        """

        query = self.request.query_params.get(
            "q",
            "",
        ).strip()

        return ProjectSelector.search(
            query,
            self.request.user,
        )
