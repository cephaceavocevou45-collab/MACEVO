from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from reports.models import Report


User = get_user_model()


class EditorAPITestCase(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            username="api_test_user",
            password="test-password-123",
        )

        self.other_user = User.objects.create_user(
            username="other_user",
            password="test-password-123",
        )

        self.report = Report.objects.create(
            author=self.user,
            title="Rapport API MACEVO",
            content="""
                <h1>Introduction</h1>
                <p>Contenu scientifique.</p>
                <p>
                    <span data-latex="a^2 + b^2 = c^2"></span>
                </p>
            """,
        )

        self.other_report = Report.objects.create(
            author=self.other_user,
            title="Rapport privé",
            content="<p>Privé</p>",
        )

    def authenticate(self):
        self.client.force_authenticate(
            user=self.user
        )

    def test_bootstrap_requires_authentication(self):
        response = self.client.get(
            f"/api/editeur/{self.report.pk}/"
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    def test_bootstrap_returns_editor_data(self):
        self.authenticate()

        response = self.client.get(
            f"/api/editeur/{self.report.pk}/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertIn(
            "report",
            response.data,
        )

        self.assertIn(
            "assets",
            response.data,
        )

        self.assertIn(
            "autosave",
            response.data,
        )

        self.assertIn(
            "capabilities",
            response.data,
        )

        self.assertIn(
            "exports",
            response.data,
        )

    def test_structure_endpoint(self):
        self.authenticate()

        response = self.client.get(
            f"/api/editeur/"
            f"{self.report.pk}/structure/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["id"],
            self.report.pk,
        )

        self.assertIn(
            "content_html",
            response.data,
        )

    def test_validation_endpoint(self):
        self.authenticate()

        response = self.client.get(
            f"/api/editeur/"
            f"{self.report.pk}/validation/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertIn(
            "valid",
            response.data,
        )

        self.assertIn(
            "errors",
            response.data,
        )

        self.assertIn(
            "warnings",
            response.data,
        )

    def test_statistics_endpoint(self):
        self.authenticate()

        response = self.client.get(
            f"/api/editeur/"
            f"{self.report.pk}/statistics/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertIn(
            "words",
            response.data,
        )

        self.assertIn(
            "equations",
            response.data,
        )

    def test_user_cannot_access_other_report(self):
        self.authenticate()

        response = self.client.get(
            f"/api/editeur/"
            f"{self.other_report.pk}/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_user_cannot_access_other_report_structure(self):
        self.authenticate()

        response = self.client.get(
            f"/api/editeur/"
            f"{self.other_report.pk}/structure/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_user_cannot_access_other_report_validation(self):
        self.authenticate()

        response = self.client.get(
            f"/api/editeur/"
            f"{self.other_report.pk}/validation/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_html_export_endpoint(self):
        self.authenticate()

        response = self.client.get(
            f"/api/editeur/"
            f"{self.report.pk}/export/html/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_latex_export_endpoint(self):
        self.authenticate()

        response = self.client.get(
            f"/api/editeur/"
            f"{self.report.pk}/export/latex/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_invalid_export_format(self):
        self.authenticate()

        response = self.client.get(
            f"/api/editeur/"
            f"{self.report.pk}/export/unknown/"
        )

        self.assertEqual(
            response.status_code,
            500,
        )