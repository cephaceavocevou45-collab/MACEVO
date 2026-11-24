from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch

from assistant.models import Conversation
from projects.models import ProjectMemory, ScientificProject


User = get_user_model()


class CreateConversationEndpointTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="conversation-owner",
            email="conversation-owner@example.test",
            password="test-password-only",
        )
        self.url = reverse("assistant:conversation-create")

    def test_authenticated_user_can_create_conversation(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            self.url,
            {"title": "Nouvelle conversation"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Nouvelle conversation")
        self.assertTrue(response.data["id"])
        self.assertEqual(Conversation.objects.filter(user=self.user).count(), 1)

    def test_unauthenticated_user_cannot_create_conversation(self):
        response = self.client.post(
            self.url,
            {"title": "Nouvelle conversation"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Conversation.objects.count(), 0)

    def test_conversation_can_be_attached_to_owned_scientific_project(self):
        self.client.force_authenticate(user=self.user)
        project = ScientificProject.objects.create(
            author=self.user,
            title="Projet de recherche",
        )

        response = self.client.post(
            self.url,
            {
                "title": "Échange sur le projet",
                "project_id": project.pk,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["scientific_project"], project.pk)
        self.assertEqual(
            Conversation.objects.get(pk=response.data["id"]).scientific_project_id,
            project.pk,
        )

    def test_conversation_cannot_be_attached_to_another_users_project(self):
        self.client.force_authenticate(user=self.user)
        other_user = User.objects.create_user(
            username="project-owner-other",
            password="test-password-only",
        )
        project = ScientificProject.objects.create(
            author=other_user,
            title="Projet privé",
        )

        response = self.client.post(
            self.url,
            {"title": "Échange interdit", "project_id": project.pk},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Conversation.objects.filter(user=self.user).count(), 0)


class ProjectConversationChatTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="project-chat-owner",
            password="test-password-only",
        )
        self.client.force_authenticate(user=self.user)

    @patch(
        "assistant.macevo_ia_client.MacevoIAClient.chat",
        return_value="Réponse fondée sur le projet.",
    )
    def test_chat_receives_only_the_conversation_project_context(self, chat):
        project = ScientificProject.objects.create(
            author=self.user,
            title="Projet contexte test",
            research_problem="Problématique confidentielle du projet courant.",
        )
        conversation = Conversation.objects.create(
            user=self.user,
            title="Conversation liée",
            scientific_project=project,
        )
        ProjectMemory.objects.create(
            user=self.user,
            project=project,
            memory_type=ProjectMemory.VALIDATED_DECISION,
            status=ProjectMemory.VALIDATED,
            content="Décision confirmée pour le projet courant.",
        )
        other_project = ScientificProject.objects.create(
            author=self.user,
            title="Autre projet du même utilisateur",
        )
        ProjectMemory.objects.create(
            user=self.user,
            project=other_project,
            memory_type=ProjectMemory.VALIDATED_DECISION,
            status=ProjectMemory.VALIDATED,
            content="Décision privée de l'autre projet.",
        )

        response = self.client.post(
            reverse("assistant:chat"),
            {
                "message": "Rappelle-moi la problématique.",
                "conversation_id": conversation.pk,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            chat.call_args.kwargs["project_id"],
            project.pk,
        )
        system_context = "\n".join(
            item["content"]
            for item in chat.call_args.kwargs["messages"]
            if item["role"] == "system"
        )
        self.assertIn("Problématique confidentielle du projet courant.", system_context)
        self.assertIn("Décision confirmée pour le projet courant.", system_context)
        self.assertNotIn("Décision privée de l'autre projet.", system_context)
        self.assertEqual(
            Conversation.objects.get(pk=conversation.pk).scientific_project_id,
            project.pk,
        )


class ProjectMemoryAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="memory-owner",
            password="test-password-only",
        )
        self.client.force_authenticate(user=self.user)
        self.project = ScientificProject.objects.create(
            author=self.user,
            title="Projet mémoire",
        )

    def test_memory_is_saved_and_scoped_to_its_project(self):
        response = self.client.post(
            f"/api/projects/{self.project.pk}/memory/",
            {
                "memory_type": ProjectMemory.VALIDATED_DECISION,
                "status": ProjectMemory.VALIDATED,
                "content": "Question de recherche validée.",
                "source_type": ProjectMemory.USER_SOURCE,
                "source_reference": {"field": "research_question"},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        memory = ProjectMemory.objects.get(pk=response.data["id"])
        self.assertEqual(memory.user_id, self.user.pk)
        self.assertEqual(memory.project_id, self.project.pk)

        listed = self.client.get(
            f"/api/projects/{self.project.pk}/memory/?status=validated"
        )
        self.assertEqual(listed.status_code, status.HTTP_200_OK)
        self.assertEqual(len(listed.data), 1)
