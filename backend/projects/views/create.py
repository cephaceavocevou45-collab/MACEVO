
"""
==========================================================
MACEVO IA
Create Project View
==========================================================

API de création des projets scientifiques.

La logique métier est déléguée à ProjectService.

Auteur : MACEVO
"""

from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from projects.models import ScientificProject
from projects.serializers import (
    ScientificProjectCreateSerializer,
    ScientificProjectSerializer,
)
from projects.services.project_service import ProjectService


class ProjectCreateView(CreateAPIView):
    """
    API permettant de créer un nouveau projet scientifique.

    Flux :

        Request
           ↓
        Serializer d'entrée
           ↓
        ProjectService
           ↓
        ScientificProject
           ↓
        Serializer de sortie
           ↓
        Response HTTP 201
    """

    queryset = ScientificProject.objects.all()

    serializer_class = ScientificProjectCreateSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        """
        Crée un projet scientifique.
        """

        # -----------------------------------------------------
        # Validation des données entrantes
        # -----------------------------------------------------

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        # -----------------------------------------------------
        # Création via le service métier
        # -----------------------------------------------------

        project = ProjectService.create_project(
            author=request.user,
            **serializer.validated_data,
        )

        # -----------------------------------------------------
        # Sérialisation de sortie
        # -----------------------------------------------------

        output_serializer = ScientificProjectSerializer(
            project,
            context=self.get_serializer_context(),
        )

        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED,
        )
