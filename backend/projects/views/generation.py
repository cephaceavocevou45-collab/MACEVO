import json
import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from assistant.macevo_ia_client import MacevoIAClient
from projects.models import ScientificProject
from projects.selectors import ProjectSelector


logger = logging.getLogger(__name__)


class ProjectPlanGenerationView(APIView):
    """Génère et sauvegarde un plan scientifique via MACEVO_IA."""

    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = ProjectSelector.get_project_by_id(
            project_id,
            request.user,
        )
        if project is None:
            return Response(
                {"detail": "Projet scientifique introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            chapter_count = int(request.data.get("chapter_count", 5))
        except (TypeError, ValueError):
            return Response(
                {"chapter_count": "Le nombre de chapitres doit être un entier entre 3 et 12."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not 3 <= chapter_count <= 12:
            return Response(
                {"chapter_count": "Le nombre de chapitres doit être compris entre 3 et 12."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        context = {
            "title": project.title,
            "document_type": project.get_project_type_display(),
            "academic_level": project.get_level_display(),
            "discipline": project.scientific_field,
            "country": project.country,
            "institution": project.institution,
            "subject": project.subject,
            "problem": project.research_problem,
            "questions": project.research_questions,
            "general_objective": project.general_objective,
            "specific_objectives": project.specific_objectives,
            "hypotheses": project.hypotheses,
            "methodology": project.methodology,
            "study_type": request.data.get("study_type", ""),
            "requested_chapter_count": chapter_count,
        }
        messages = [
            {
                "role": "system",
                "content": (
                    "Tu es un méthodologue scientifique. Construis un plan adapté "
                    "au niveau, au type de document, à la discipline et aux consignes "
                    "fournies. Ne crée ni résultats, ni données, ni références. "
                    "Retourne uniquement un objet JSON valide de forme : "
                    '{"chapters":[{"title":"...","objective":"...",'
                    '"sections":[{"title":"...","purpose":"..."}]}]}. '
                    "Propose une structure cohérente et suffisamment détaillée, sans "
                    "chapitres de remplissage."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(context, ensure_ascii=False, indent=2),
            },
        ]

        try:
            raw_response = MacevoIAClient.chat(
                messages=messages,
                user_id=request.user.pk,
                project_id=project.pk,
            )
            response_text = raw_response.strip()
            fence = chr(96) * 3
            if response_text.startswith(fence):
                response_text = response_text.split("\n", 1)[-1]
                if response_text.rstrip().endswith(fence):
                    response_text = response_text.rstrip()[:-3].strip()
            plan = json.loads(response_text)
            chapters = plan.get("chapters") if isinstance(plan, dict) else None
            if not isinstance(chapters, list) or not chapters:
                raise ValueError("Le plan généré ne contient aucun chapitre.")
            for index, chapter in enumerate(chapters):
                if (
                    not isinstance(chapter, dict)
                    or not str(chapter.get("title", "")).strip()
                    or not isinstance(chapter.get("sections"), list)
                ):
                    raise ValueError(
                        f"Le chapitre {index + 1} ne respecte pas la structure attendue."
                    )
                for section in chapter["sections"]:
                    if not isinstance(section, dict) or not str(
                        section.get("title", "")
                    ).strip():
                        raise ValueError(
                            f"Une section du chapitre {index + 1} est invalide."
                        )
        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning(
                "Plan scientifique invalide, project_id=%s: %s",
                project.pk,
                exc,
            )
            return Response(
                {
                    "detail": (
                        "MACEVO_IA n'a pas retourné un plan exploitable. "
                        "Aucun plan n'a été sauvegardé."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception:
            logger.exception(
                "Échec de génération du plan, project_id=%s",
                project.pk,
            )
            return Response(
                {
                    "detail": (
                        "Le service MACEVO_IA est momentanément indisponible. "
                        "Le projet n'a pas été modifié."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        project.research_plan = {"chapters": chapters}
        project.plan_status = ScientificProject.PLAN_NEEDS_REVIEW
        project.plan_validated_at = None
        project.save(
            update_fields=[
                "research_plan",
                "plan_status",
                "plan_validated_at",
                "updated_at",
            ]
        )
        return Response(
            {
                "project_id": project.pk,
                "plan": project.research_plan,
                "plan_status": project.plan_status,
            },
            status=status.HTTP_200_OK,
        )
