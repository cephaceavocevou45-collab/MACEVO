
"""
==========================================================
MACEVO IA
Delete Project View
==========================================================

API de suppression des projets scientifiques.

La logique métier est déléguée à ProjectService.

Auteur : MACEVO
"""

from rest_framework import status
from rest_framework.generics import DestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from projects.models import ScientificProject
from projects.services.project_service import ProjectService


class ProjectDeleteView(DestroyAPIView):
    """
    Supprime définitivement un projet scientifique.

    Un utilisateur ne peut supprimer que ses propres projets.
    """

    queryset = ScientificProject.objects.all()
    lookup_url_kwarg = "id"

    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        """
        Retourne uniquement les projets appartenant
        à l'utilisateur actuellement authentifié.
        """

        return (
            super()
            .get_queryset()
            .filter(
                author=self.request.user
            )
        )

    def destroy(
        self,
        request,
        *args,
        **kwargs,
    ):
        """
        Supprime définitivement le projet.
        """

        # get_object() applique automatiquement le filtrage
        # défini dans get_queryset().
        project = self.get_object()

        ProjectService.delete_project(
            project
        )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )
