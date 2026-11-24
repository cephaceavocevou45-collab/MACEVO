import tempfile
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from assistant.models import Conversation
from projects.models import ProjectDocument, ScientificProject
from projects.services.document_library import search_project_documents


class ProjectDocumentLibraryTests(TestCase):
    def setUp(self):
        test_media_parent = Path(__file__).resolve().parents[2] / ".tmp-test-media"
        test_media_parent.mkdir(exist_ok=True)
        self.media = tempfile.TemporaryDirectory(
            prefix="macevo-doc-library-", dir=test_media_parent
        )
        self.addCleanup(self.media.cleanup)
        self.media_override = override_settings(MEDIA_ROOT=Path(self.media.name))
        self.media_override.enable()
        self.addCleanup(self.media_override.disable)

        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            username="document-owner", password="test-password-only"
        )
        self.other = user_model.objects.create_user(
            username="document-other", password="test-password-only"
        )
        self.project = ScientificProject.objects.create(
            author=self.owner, title="Étude des cultures vivrières"
        )
        self.other_project = ScientificProject.objects.create(
            author=self.owner, title="Projet indépendant"
        )
        self.client = APIClient()
        self.client.force_authenticate(self.owner)

    def upload(self, project, name="source.txt", text=None):
        content = text or (
            "La culture du maïs nécessite une analyse précise des sols tropicaux. "
            "Les mesures d'humidité déterminent le rendement agricole. "
        ) * 30
        return self.client.post(
            f"/api/projects/{project.pk}/documents/",
            {"file": SimpleUploadedFile(name, content.encode("utf-8"), "text/plain")},
            format="multipart",
        )

    def test_upload_indexes_and_search_returns_project_scoped_passages(self):
        response = self.upload(self.project)
        self.assertEqual(response.status_code, 201, response.data)
        document = ProjectDocument.objects.get(project=self.project)
        self.assertGreater(document.chunks.count(), 1)
        self.assertEqual(response.data["chunk_count"], document.chunks.count())
        self.assertIn(f"documents/{document.pk}/download/", response.data["download_url"])

        result = self.client.get(
            f"/api/projects/{self.project.pk}/documents/?q=humidité rendement"
        )
        self.assertEqual(result.status_code, 200)
        self.assertTrue(result.data["results"])
        self.assertEqual(result.data["results"][0]["document_id"], document.pk)

        download = self.client.get(
            f"/api/projects/{self.project.pk}/documents/{document.pk}/download/"
        )
        self.assertEqual(download.status_code, 200)
        self.assertEqual(download["Content-Disposition"].split(";")[0], "attachment")
        download.close()

        isolated = search_project_documents(
            user=self.owner, project=self.other_project, query="humidité rendement"
        )
        self.assertEqual(isolated, [])

    def test_duplicate_upload_is_idempotent(self):
        first = self.upload(self.project)
        second = self.upload(self.project)
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(ProjectDocument.objects.filter(project=self.project).count(), 1)

    def test_other_user_cannot_list_or_search_project_documents(self):
        self.upload(self.project)
        document = ProjectDocument.objects.get(project=self.project)
        self.client.force_authenticate(self.other)
        response = self.client.get(
            f"/api/projects/{self.project.pk}/documents/?q=maïs"
        )
        self.assertEqual(response.status_code, 404)
        download = self.client.get(
            f"/api/projects/{self.project.pk}/documents/{document.pk}/download/"
        )
        self.assertEqual(download.status_code, 404)
        download.close()

    def test_project_context_includes_relevant_document_excerpt_only(self):
        self.upload(self.project, text="Les mesures de salinité expliquent le rendement du riz.")
        self.upload(self.other_project, name="other.txt", text="Indice secret du projet indépendant.")
        conversation = Conversation.objects.create(
            user=self.owner, scientific_project=self.project, title="Analyse du document"
        )
        history = [{"role": "user", "content": "Explique la salinité et le rendement."}]
        from assistant.services import AssistantService

        enriched = AssistantService._add_scientific_project_context(history, conversation)
        system_text = "\n".join(
            item["content"] for item in enriched if item.get("role") == "system"
        )
        self.assertIn("salinité", system_text)
        self.assertNotIn("Indice secret", system_text)
