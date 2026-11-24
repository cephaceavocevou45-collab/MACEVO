
"""
==========================================================
MACEVO IA
Update Project View
==========================================================

API de modification d'un projet scientifique.

PUT   /api/projects/<pk>/
PATCH /api/projects/<pk>/

La validation est effectuée par le serializer.
La modification réelle est effectuée par ProjectService.
L'accès au projet est contrôlé par ProjectSelector.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.generics import UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from projects.selectors import ProjectSelector
from projects.serializers import (
    ScientificProjectSerializer,
    ScientificProjectUpdateSerializer,
)
from projects.services.project_service import ProjectService


class ProjectUpdateView(UpdateAPIView):
    """
    Met à jour un projet scientifique appartenant
    à l'utilisateur connecté.
    """

    serializer_class = ScientificProjectUpdateSerializer
    lookup_url_kwarg = "id"

    permission_classes = [
        IsAuthenticated,
    ]

    # =========================================================
    # QUERYSET
    # =========================================================

    def get_queryset(self):
        """
        Limite les projets accessibles à ceux de l'utilisateur
        connecté.
        """

        return ProjectSelector.get_user_projects(
            self.request.user,
        )

    # =========================================================
    # UPDATE
    # =========================================================

    def update(self, request, *args, **kwargs):
        """
        Met à jour le projet.

        PUT  : mise à jour complète.
        PATCH : mise à jour partielle.
        """

        project = self.get_object()

        partial = kwargs.pop(
            "partial",
            False,
        )

        serializer = self.get_serializer(
            project,
            data=request.data,
            partial=partial,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        project = ProjectService.update_project(
            project,
            **serializer.validated_data,
        )

        output_serializer = ScientificProjectSerializer(
            project,
            context=self.get_serializer_context(),
        )

        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK,
        )
