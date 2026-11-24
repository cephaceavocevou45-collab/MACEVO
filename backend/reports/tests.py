import json
from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Report
from .serializers import ReportSerializer
from projects.models import ScientificProject


class ReportCanonicalDocumentTests(TestCase):
	def setUp(self):
		self.user = get_user_model().objects.create_user(
			username="macevo-serializer-test",
			password="TestPassword!234",
		)
		self.context = {"request": SimpleNamespace(user=self.user)}

	def test_canonical_document_and_template_key_round_trip(self):
		template_key = "memoire-master"
		document = {
			"model": "MACEVO_DOCUMENT",
			"modelVersion": "1.5.0",
			"template": {"id": template_key},
		}
		serializer = ReportSerializer(
			data={
				"title": "Mémoire de test",
				"template_key": template_key,
				"macevo_document": json.dumps(document),
			},
			context=self.context,
		)

		self.assertTrue(serializer.is_valid(), serializer.errors)
		report = serializer.save()
		report.refresh_from_db()

		self.assertEqual(report.template_key, template_key)
		self.assertEqual(report.macevo_document, document)
		self.assertEqual(report.scientific_project.author_id, self.user.pk)
		self.assertEqual(
			ReportSerializer(report).data["macevo_document"],
			document,
		)

	def test_rejects_invalid_canonical_document(self):
		serializer = ReportSerializer(
			data={
				"title": "Document invalide",
				"macevo_document": "not-json",
			}
		)

		self.assertFalse(serializer.is_valid())
		self.assertIn("macevo_document", serializer.errors)


class ReportApiFlowTests(APITestCase):
	def setUp(self):
		user_model = get_user_model()
		self.user = user_model.objects.create_user(
			username="macevo-api-test",
			email="macevo-api-test@example.test",
			password="TestPassword!234",
		)
		access_token = RefreshToken.for_user(self.user).access_token
		self.client.credentials(
			HTTP_AUTHORIZATION=f"Bearer {access_token}"
		)

	def test_authenticated_report_round_trip(self):
		document = {
			"model": "MACEVO_DOCUMENT",
			"modelVersion": "1.5.0",
			"template": {"id": "memoire-master"},
		}
		created = self.client.post(
			"/api/reports/",
			{
				"title": "Rapport de test API",
				"template_key": "memoire-master",
				"macevo_document": document,
			},
			format="json",
		)

		self.assertEqual(created.status_code, status.HTTP_201_CREATED)
		report_id = created.data["id"]

		retrieved = self.client.get(f"/api/reports/{report_id}/")

		self.assertEqual(retrieved.status_code, status.HTTP_200_OK)
		self.assertEqual(retrieved.data["template_key"], "memoire-master")
		self.assertEqual(retrieved.data["macevo_document"], document)
		project = ScientificProject.objects.get(
			pk=created.data["scientific_project"],
			 author=self.user,
		)
		self.assertEqual(project.title, "Rapport de test API")

	def test_report_creation_persists_project_scientific_configuration(self):
		response = self.client.post(
			"/api/reports/",
			{
				"title": "Mémoire de Master",
				"report_type": "memoire",
				"academic_level": "master",
				"scientific_field": "Informatique",
				"country": "Bénin",
				"institution": "Université de test",
				"research_problem": "Problématique de test.",
				"research_questions": ["Question de recherche ?"],
				"general_objective": "Évaluer le système.",
				"specific_objectives": ["Mesurer la latence."],
				"hypotheses": ["Le système améliore la latence."],
				"methodology": "Étude expérimentale.",
				"supervisor_instructions": "Utiliser le guide fourni.",
				"structure": [{"title": "Introduction"}],
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		project = ScientificProject.objects.get(
			pk=response.data["scientific_project"],
			 author=self.user,
		)
		self.assertEqual(project.project_type, ScientificProject.MASTER_MEMORY)
		self.assertEqual(project.level, ScientificProject.MASTER)
		self.assertEqual(project.country, "Bénin")
		self.assertEqual(project.research_questions, ["Question de recherche ?"])
		self.assertEqual(project.research_plan, [{"title": "Introduction"}])

	def test_report_cannot_be_linked_to_another_users_project(self):
		other_user = get_user_model().objects.create_user(
			username="macevo-other-owner",
			password="TestPassword!234",
		)
		project = ScientificProject.objects.create(
			author=other_user,
			title="Projet privé",
		)
		response = self.client.post(
			"/api/reports/",
			{
				"title": "Tentative de liaison",
				"scientific_project": project.pk,
			},
			format="json",
		)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_health_endpoint_is_public(self):
		self.client.credentials()

		response = self.client.get("/api/health/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.json()["status"], "ok")
