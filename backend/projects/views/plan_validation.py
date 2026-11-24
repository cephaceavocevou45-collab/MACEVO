from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import ScientificProject
from projects.selectors import ProjectSelector


class ProjectPlanValidationView(APIView):
    """Enregistre explicitement la validation du plan par son propriétaire."""

    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = ProjectSelector.get_project_by_id(project_id, request.user)
        if project is None:
            return Response(
                {"detail": "Projet scientifique introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )
        chapters = project.research_plan.get("chapters") if isinstance(
            project.research_plan, dict
        ) else None
        if project.plan_status != ScientificProject.PLAN_NEEDS_REVIEW:
            return Response(
                {"detail": "Seul un plan généré et en attente de relecture peut être validé."},
                status=status.HTTP_409_CONFLICT,
            )
        if not isinstance(chapters, list) or not chapters:
            return Response(
                {"detail": "Le projet ne contient pas de plan valide à confirmer."},
                status=status.HTTP_409_CONFLICT,
            )

        project.plan_status = ScientificProject.PLAN_VALIDATED
        project.plan_validated_at = timezone.now()
        project.save(update_fields=["plan_status", "plan_validated_at", "updated_at"])
        return Response(
            {
                "project_id": project.pk,
                "plan": project.research_plan,
                "plan_status": project.plan_status,
                "plan_validated_at": project.plan_validated_at,
            },
            status=status.HTTP_200_OK,
        )
