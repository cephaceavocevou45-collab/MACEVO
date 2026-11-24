import io
import tempfile
from pathlib import Path
import zipfile

import fitz
from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from projects.models import ProjectFigure, ScientificProject
from projects.services.export_service import ExportService


class ScientificProjectExportTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="export-owner",
            password="test-password-only",
        )
        self.project = ScientificProject.objects.create(
            author=self.user,
            title="Essai scientifique vérifié",
            subject="Qualité des mesures",
            abstract="Résumé de vérification des exports.",
            content=(
                "Ce contenu vérifie la génération réelle du document. "
                "La méthode et les résultats doivent rester traçables."
            ),
            research_problem="Comment vérifier la qualité des mesures ?",
        )

    def test_latex_export_creates_a_complete_source_file(self):
        with tempfile.TemporaryDirectory(prefix="macevo-export-") as directory:
            output = Path(directory) / "project.tex"
            generated = Path(
                ExportService.export(self.project, output, "latex")
            )

            self.assertEqual(generated, output)
            self.assertGreater(generated.stat().st_size, 100)
            source = generated.read_text(encoding="utf-8")
            self.assertIn(r"\documentclass", source)
            self.assertIn(r"\usepackage{url}", source)
            self.assertNotIn(r"\usepackage{xurl}", source)
            self.assertIn("Essai scientifique", source)
            self.assertIn("qualité des mesures", source.lower())

    def test_pdf_export_creates_a_readable_pdf_with_project_content(self):
        with tempfile.TemporaryDirectory(prefix="macevo-export-") as directory:
            output = Path(directory) / "project.pdf"
            generated = Path(
                ExportService.export(self.project, output, "pdf")
            )

            self.assertEqual(generated.read_bytes()[:5], b"%PDF-")
            self.assertGreater(generated.stat().st_size, 500)
            with fitz.open(generated) as document:
                self.assertGreater(document.page_count, 0)
                extracted = "\n".join(
                    page.get_text() for page in document
                ).lower()
            self.assertIn("essai scientifique", extracted)
            self.assertIn("qualité des mesures", extracted)

    def test_zip_export_contains_real_source_preview_and_readme(self):
        with tempfile.TemporaryDirectory(prefix="macevo-export-") as directory:
            output = Path(directory) / "project.zip"
            generated = Path(
                ExportService.export(self.project, output, "zip")
            )

            self.assertGreater(generated.stat().st_size, 500)
            with zipfile.ZipFile(generated) as archive:
                self.assertIsNone(archive.testzip())
                self.assertEqual(
                    set(archive.namelist()),
                    {"main.tex", "preview.pdf", "README.md"},
                )
                self.assertIn(
                    r"\documentclass",
                    archive.read("main.tex").decode("utf-8"),
                )
                self.assertEqual(archive.read("preview.pdf")[:5], b"%PDF-")
                self.assertIn(
                    "n’est pas présenté comme une compilation",
                    archive.read("README.md").decode("utf-8"),
                )

    def test_zip_export_api_returns_archive_and_checks_project_owner(self):
        client = APIClient()
        client.force_authenticate(user=self.user)
        with tempfile.TemporaryDirectory(prefix="macevo-api-export-") as directory:
            with override_settings(BASE_DIR=Path(directory)):
                response = client.post(
                    f"/api/projects/{self.project.pk}/export/",
                    {"format": "zip"},
                    format="json",
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response["Content-Type"], "application/zip")
                content = b"".join(response.streaming_content)
                with zipfile.ZipFile(io.BytesIO(content)) as archive:
                    self.assertIsNone(archive.testzip())
                    self.assertIn("main.tex", archive.namelist())

                other_user = get_user_model().objects.create_user(
                    username="not-export-owner",
                    password="test-password-only",
                )
                client.force_authenticate(user=other_user)
                denied = client.post(
                    f"/api/projects/{self.project.pk}/export/",
                    {"format": "zip"},
                    format="json",
                )
                self.assertEqual(denied.status_code, 404)

    def test_zip_export_includes_project_figures_as_relative_resources(self):
        image_buffer = io.BytesIO()
        Image.new("RGB", (12, 12), color=(12, 80, 140)).save(
            image_buffer,
            format="PNG",
        )
        with tempfile.TemporaryDirectory(prefix="macevo-figure-media-") as directory:
            with override_settings(MEDIA_ROOT=Path(directory) / "media"):
                ProjectFigure.objects.create(
                    project=self.project,
                    title="Figure de contrôle",
                    image=SimpleUploadedFile(
                        "figure.png",
                        image_buffer.getvalue(),
                        content_type="image/png",
                    ),
                )
                output = Path(directory) / "project.zip"
                ExportService.export(self.project, output, "zip")

                with zipfile.ZipFile(output) as archive:
                    self.assertIn("figures/figure-01.png", archive.namelist())
                    source = archive.read("main.tex").decode("utf-8")
                    self.assertIn(
                        r"\includegraphics[width=0.85\textwidth]{figures/figure-01.png}",
                        source,
                    )
                    with Image.open(
                        io.BytesIO(archive.read("figures/figure-01.png"))
                    ) as packed_image:
                        self.assertEqual(packed_image.size, (12, 12))
