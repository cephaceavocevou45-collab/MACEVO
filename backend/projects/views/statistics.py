
"""
==========================================================
MACEVO IA
Project Statistics View
==========================================================

API permettant de récupérer les statistiques d'un projet
scientifique appartenant à l'utilisateur connecté.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.selectors import ProjectSelector
from projects.services.project_service import ProjectService


class ProjectStatisticsView(APIView):
    """
    Retourne les statistiques d'un projet scientifique.

    Endpoint :

        GET /api/projects/<project_id>/statistics/

    La vérification d'accès au projet est déléguée au selector.
    Le calcul des statistiques est centralisé dans ProjectService.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request, project_id):
        """
        Retourne les statistiques du projet demandé.
        """

        # =====================================================
        # RÉCUPÉRATION SÉCURISÉE DU PROJET
        # =====================================================

        project = ProjectSelector.get_project_by_id(
            project_id,
            request.user,
        )

        if project is None:
            return Response(
                {
                    "detail": "Projet introuvable.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # =====================================================
        # CALCUL DES STATISTIQUES
        # =====================================================

        statistics = ProjectService.statistics(
            project,
        )

        # =====================================================
        # RÉPONSE
        # =====================================================

        return Response(
            statistics,
            status=status.HTTP_200_OK,
        )
