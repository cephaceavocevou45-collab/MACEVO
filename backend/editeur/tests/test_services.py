from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from editeur.models import EditorAsset
from editeur.services.document_service import (
    ReportDocumentBuilder,
    build_document,
)
from editeur.services.export_service import (
    EditorExportService,
)
from editeur.services.latex_service import (
    LatexService,
)
from editeur.services.statistics_service import (
    DocumentStatisticsService,
)
from editeur.services.validation_service import (
    DocumentValidationService,
)
from reports.models import Report


User = get_user_model()


class EditorServiceTestCase(TestCase):
    """
    Tests fonctionnels du moteur central de l'éditeur MACEVO.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="macevo_test",
            password="test-password-123",
        )

        self.report = Report.objects.create(
            author=self.user,
            title="Étude scientifique MACEVO",
            summary="Rapport de test scientifique.",
            scientific_field="Informatique",
            report_type="Mémoire",
            academic_level="Master",
            language="Français",
            generate_toc=True,
            institution="Université de test",
            department="Département informatique",
            supervisor="Dr. Test",
            academic_year="2026-2027",
            content="""
                <h1>Introduction</h1>

                <p>
                    MACEVO est un éditeur scientifique professionnel.
                </p>

                <p>
                    Une équation :
                    <span data-latex="E = mc^2"></span>
                </p>

                <h2>Résultats</h2>

                <p>
                    Les résultats expérimentaux sont présentés ci-dessous.
                </p>

                <table>
                    <thead>
                        <tr>
                            <th>Variable</th>
                            <th>Valeur</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>x</td>
                            <td>10</td>
                        </tr>
                        <tr>
                            <td>y</td>
                            <td>20</td>
                        </tr>
                    </tbody>
                </table>

                <ul>
                    <li>Premier résultat</li>
                    <li>Deuxième résultat</li>
                </ul>

                <figure>
                    <img
                        src="/media/editor/assets/test.png"
                        alt="Figure scientifique"
                    >
                    <figcaption>
                        Figure expérimentale
                    </figcaption>
                </figure>

                <p>
                    Consulter
                    <a href="https://example.com">
                        la documentation
                    </a>.
                </p>
            """,
        )

    def test_build_document_returns_normalized_document(self):
        document = build_document(
            self.report
        )

        self.assertEqual(
            document["id"],
            self.report.pk,
        )

        self.assertEqual(
            document["metadata"]["title"],
            "Étude scientifique MACEVO",
        )

        self.assertEqual(
            document["metadata"]["author"],
            "macevo_test",
        )

        self.assertTrue(
            document["content_html"]
        )

        self.assertGreaterEqual(
            len(document["headings"]),
            2,
        )

        self.assertGreaterEqual(
            len(document["tables"]),
            1,
        )

        self.assertGreaterEqual(
            len(document["lists"]),
            1,
        )

        self.assertIn(
            "E = mc^2",
            document["math"],
        )

    def test_mathnode_is_detected(self):
        document = build_document(
            self.report
        )

        self.assertIn(
            "E = mc^2",
            document["math"],
        )

        self.assertEqual(
            document["statistics"]["equations"],
            1,
        )

    def test_table_is_detected(self):
        document = build_document(
            self.report
        )

        self.assertEqual(
            len(document["tables"]),
            1,
        )

        table = document["tables"][0]

        self.assertEqual(
            len(table["rows"]),
            3,
        )

        self.assertEqual(
            table["rows"][0][0]["text"],
            "Variable",
        )

    def test_list_is_detected(self):
        document = build_document(
            self.report
        )

        self.assertEqual(
            len(document["lists"]),
            1,
        )

        self.assertEqual(
            document["lists"][0]["items"],
            [
                "Premier résultat",
                "Deuxième résultat",
            ],
        )

    def test_validation_accepts_valid_document(self):
        result = (
            DocumentValidationService()
            .validate(self.report)
        )

        self.assertTrue(
            result["valid"]
        )

        self.assertEqual(
            result["errors"],
            [],
        )

    def test_validation_rejects_empty_document(self):
        self.report.content = ""
        self.report.save(
            update_fields=["content"]
        )

        result = (
            DocumentValidationService()
            .validate(self.report)
        )

        self.assertFalse(
            result["valid"]
        )

        self.assertTrue(
            result["errors"]
        )

    def test_validation_detects_missing_image_source(self):
        self.report.content = """
            <p>Test</p>
            <img alt="Image">
        """

        self.report.save(
            update_fields=["content"]
        )

        result = (
            DocumentValidationService()
            .validate(self.report)
        )

        self.assertFalse(
            result["valid"]
        )

        self.assertTrue(
            any(
                "source" in error.lower()
                for error in result["errors"]
            )
        )

    def test_validation_warns_missing_alt(self):
        self.report.content = """
            <p>Test</p>
            <img src="/media/test.png">
        """

        self.report.save(
            update_fields=["content"]
        )

        result = (
            DocumentValidationService()
            .validate(self.report)
        )

        self.assertTrue(
            result["valid"]
        )

        self.assertTrue(
            any(
                "alternatif" in warning.lower()
                for warning in result["warnings"]
            )
        )

    def test_statistics_are_computed(self):
        result = (
            DocumentStatisticsService()
            .compute(self.report)
        )

        self.assertGreater(
            result["characters"],
            0,
        )

        self.assertGreater(
            result["words"],
            0,
        )

        self.assertGreaterEqual(
            result["paragraphs"],
            3,
        )

        self.assertGreaterEqual(
            result["headings"],
            2,
        )

        self.assertEqual(
            result["tables"],
            1,
        )

        self.assertEqual(
            result["lists"],
            1,
        )

        self.assertEqual(
            result["equations"],
            1,
        )

        self.assertGreaterEqual(
            result["estimated_pages"],
            1,
        )

        self.assertGreaterEqual(
            result["reading_time"],
            1,
        )

    def test_latex_contains_document_structure(self):
        service = LatexService()

        latex = service.build_tex(
            self.report
        )

        self.assertIn(
            r"\documentclass",
            latex,
        )

        self.assertIn(
            r"\begin{document}",
            latex,
        )

        self.assertIn(
            r"\end{document}",
            latex,
        )

        self.assertIn(
            r"\section{Introduction}",
            latex,
        )

        self.assertIn(
            r"\subsection{Résultats}",
            latex,
        )

    def test_latex_contains_mathnode(self):
        service = LatexService()

        latex = service.build_tex(
            self.report
        )

        self.assertIn(
            r"\(E = mc^2\)",
            latex,
        )

    def test_latex_contains_table(self):
        service = LatexService()

        latex = service.build_tex(
            self.report
        )

        self.assertIn(
            r"\begin{table}",
            latex,
        )

        self.assertIn(
            "Variable",
            latex,
        )

        self.assertIn(
            "Valeur",
            latex,
        )

    def test_latex_package_resolution(self):
        service = LatexService()

        latex = service.build_tex(
            self.report
        )

        self.assertIn(
            r"\usepackage{amsmath}",
            latex,
        )

        self.assertIn(
            r"\usepackage{graphicx}",
            latex,
        )

        self.assertIn(
            r"\usepackage{booktabs}",
            latex,
        )

    def test_html_export(self):
        service = EditorExportService()

        path = service.export(
            self.report,
            "html",
        )

        try:
            path = Path(path)

            self.assertTrue(
                path.exists()
            )

            self.assertEqual(
                path.suffix,
                ".html",
            )

            content = path.read_text(
                encoding="utf-8"
            )

            self.assertIn(
                "Étude scientifique MACEVO",
                content,
            )

        finally:
            if path.exists():
                path.unlink()

    def test_latex_export(self):
        service = EditorExportService()

        path = service.export(
            self.report,
            "latex",
        )

        try:
            path = Path(path)

            self.assertTrue(
                path.exists()
            )

            self.assertEqual(
                path.suffix,
                ".tex",
            )

            content = path.read_text(
                encoding="utf-8"
            )

            self.assertIn(
                r"\documentclass",
                content,
            )

        finally:
            if path.exists():
                path.unlink()

    def test_tex_alias_exports_latex(self):
        service = EditorExportService()

        path = service.export(
            self.report,
            "tex",
        )

        try:
            path = Path(path)

            self.assertTrue(
                path.exists()
            )

            self.assertEqual(
                path.suffix,
                ".tex",
            )

        finally:
            if path.exists():
                path.unlink()

    def test_latex_zip_contains_main_tex(self):
        service = EditorExportService()

        path = service.export(
            self.report,
            "zip",
        )

        try:
            import zipfile

            path = Path(path)

            self.assertTrue(
                path.exists()
            )

            with zipfile.ZipFile(
                path,
                "r",
            ) as archive:
                names = archive.namelist()

                self.assertIn(
                    "main.tex",
                    names,
                )

        finally:
            if path.exists():
                path.unlink()