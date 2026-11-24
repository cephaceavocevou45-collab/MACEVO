from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from projects.models import ScientificProject


class ScientificProjectAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="project-owner",
            password="TestPassword!234",
        )
        token = RefreshToken.for_user(self.user).access_token
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

    def test_create_persists_scientific_configuration(self):
        response = self.client.post(
            "/api/projects/create/",
            {
                "title": "Étude sur la qualité logicielle",
                "project_type": ScientificProject.MASTER_MEMORY,
                "level": ScientificProject.MASTER,
                "scientific_field": "Informatique",
                "country": "Bénin",
                "institution": "Université de test",
                "research_problem": "Problématique validée par l'étudiant.",
                "research_questions": ["Question centrale ?"],
                "general_objective": "Évaluer une méthode.",
                "specific_objectives": ["Comparer deux approches."],
                "hypotheses": ["L'approche A est plus rapide."],
                "methodology": "Étude comparative.",
                "institutional_requirements": "Guide fourni par l'établissement.",
                "supervisor_instructions": "Présenter les limites.",
                "research_plan": [{"title": "Introduction"}],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        project = ScientificProject.objects.get(pk=response.data["id"])
        self.assertEqual(project.author_id, self.user.pk)
        self.assertEqual(project.country, "Bénin")
        self.assertEqual(project.research_questions, ["Question centrale ?"])
        self.assertEqual(project.plan_status, ScientificProject.PLAN_DRAFT)

    def test_user_cannot_read_another_users_project(self):
        other_user = get_user_model().objects.create_user(
            username="another-owner",
            password="TestPassword!234",
        )
        project = ScientificProject.objects.create(
            author=other_user,
            title="Projet privé",
        )

        response = self.client.get(f"/api/projects/{project.pk}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch(
        "projects.views.generation.MacevoIAClient.chat",
        return_value=(
            '{"chapters":[{"title":"Cadre théorique",'
            '"objective":"Définir les concepts",'
            '"sections":[{"title":"Concepts clés",'
            '"purpose":"Clarifier le vocabulaire"}]}]}'
        ),
    )
    def test_plan_generation_uses_macevo_ia_and_persists_review_state(self, chat):
        project = ScientificProject.objects.create(
            author=self.user,
            title="Mémoire sur un système scientifique",
            subject="Étude d'un système",
            research_problem="Problématique renseignée.",
        )

        response = self.client.post(
            f"/api/projects/{project.pk}/generate/plan/",
            {"study_type": "Étude descriptive"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        project.refresh_from_db()
        self.assertEqual(project.plan_status, ScientificProject.PLAN_NEEDS_REVIEW)
        self.assertEqual(
            project.research_plan["chapters"][0]["title"],
            "Cadre théorique",
        )
        self.assertEqual(chat.call_args.kwargs["project_id"], project.pk)

    @patch(
        "projects.views.generation.MacevoIAClient.chat",
        return_value="Je ne peux pas produire le plan.",
    )
    def test_invalid_ai_plan_is_not_saved(self, chat):
        project = ScientificProject.objects.create(
            author=self.user,
            title="Projet avec réponse invalide",
        )

        response = self.client.post(
            f"/api/projects/{project.pk}/generate/plan/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        project.refresh_from_db()
        self.assertEqual(project.research_plan, [])
        self.assertEqual(project.plan_status, ScientificProject.PLAN_DRAFT)

    def test_owner_can_validate_generated_plan(self):
        project = ScientificProject.objects.create(
            author=self.user,
            title="Projet à valider",
            research_plan={"chapters": [{"title": "Introduction", "sections": []}]},
            plan_status=ScientificProject.PLAN_NEEDS_REVIEW,
        )

        response = self.client.post(
            f"/api/projects/{project.pk}/validate/plan/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        project.refresh_from_db()
        self.assertEqual(project.plan_status, ScientificProject.PLAN_VALIDATED)
        self.assertIsNotNone(project.plan_validated_at)

    def test_owner_cannot_validate_project_without_pending_plan(self):
        project = ScientificProject.objects.create(
            author=self.user,
            title="Projet sans plan",
        )

        response = self.client.post(
            f"/api/projects/{project.pk}/validate/plan/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        project.refresh_from_db()
        self.assertEqual(project.plan_status, ScientificProject.PLAN_DRAFT)
