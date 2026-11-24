from io import BytesIO
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse as django_reverse
from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase

from .models import WordToLatexConversion
from .services.conversion_service import ConversionService


User = get_user_model()


def reverse(viewname, *args, **kwargs):
    return django_reverse(
        f"word_to_latex:{viewname}",
        *args,
        **kwargs,
    )


class WordToLatexTestMixin:
    """
    Utilitaires communs aux tests.
    """

    def create_user(self):
        return User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="StrongPassword123!",
        )

    def create_docx_file(
        self,
        filename="document.docx",
        content=b"fake docx content",
    ):
        return SimpleUploadedFile(
            filename,
            content,
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "wordprocessingml.document"
            ),
        )

    def create_conversion(
        self,
        user,
        **kwargs,
    ):
        defaults = {
            "original_filename": "document.docx",
            "file_size": 1024,
            "status": "uploaded",
            "progress": 10,
        }

        defaults.update(kwargs)

        return WordToLatexConversion.objects.create(
            user=user,
            **defaults,
        )


class ConversionModelTests(
    WordToLatexTestMixin,
    APITestCase,
):
    """
    Tests du modèle WordToLatexConversion.
    """

    def setUp(self):
        self.user = self.create_user()

    def test_conversion_is_created(self):
        conversion = self.create_conversion(
            self.user
        )

        self.assertIsNotNone(
            conversion.id
        )

        self.assertEqual(
            conversion.user,
            self.user,
        )

        self.assertEqual(
            conversion.status,
            "uploaded",
        )

        self.assertEqual(
            conversion.progress,
            10,
        )

    def test_is_completed_returns_false_for_uploaded(self):
        conversion = self.create_conversion(
            self.user,
            status="uploaded",
        )

        self.assertFalse(
            conversion.is_completed
        )

    def test_is_completed_returns_true_for_completed_conversion(self):
        conversion = self.create_conversion(
            self.user,
            status="completed",
            latex_code="\\documentclass{article}",
        )

        self.assertTrue(
            conversion.is_completed
        )

    def test_has_failed_returns_false_for_completed_conversion(self):
        conversion = self.create_conversion(
            self.user,
            status="completed",
        )

        self.assertFalse(
            conversion.has_failed
        )

    def test_has_failed_returns_true_for_failed_conversion(self):
        conversion = self.create_conversion(
            self.user,
            status="failed",
            error_message="Conversion failed.",
        )

        self.assertTrue(
            conversion.has_failed
        )


class ConversionServiceTests(
    WordToLatexTestMixin,
    APITestCase,
):
    """
    Tests du ConversionService.
    """

    def setUp(self):
        self.user = self.create_user()

        self.conversion = self.create_conversion(
            self.user
        )

    def test_safe_int_with_valid_value(self):
        result = (
            ConversionService.safe_int(
                "25"
            )
        )

        self.assertEqual(
            result,
            25,
        )

    def test_safe_int_with_invalid_value(self):
        result = (
            ConversionService.safe_int(
                "invalid"
            )
        )

        self.assertEqual(
            result,
            0,
        )

    def test_safe_int_does_not_return_negative_values(self):
        result = (
            ConversionService.safe_int(
                -10
            )
        )

        self.assertEqual(
            result,
            0,
        )

    def test_update_progress(self):
        ConversionService.update_progress(
            self.conversion,
            status="analyzing",
            progress=20,
        )

        self.conversion.refresh_from_db()

        self.assertEqual(
            self.conversion.status,
            "analyzing",
        )

        self.assertEqual(
            self.conversion.progress,
            20,
        )

    def test_update_progress_is_limited_to_100(self):
        ConversionService.update_progress(
            self.conversion,
            progress=150,
        )

        self.conversion.refresh_from_db()

        self.assertEqual(
            self.conversion.progress,
            100,
        )

    def test_update_progress_is_limited_to_zero(self):
        ConversionService.update_progress(
            self.conversion,
            progress=-20,
        )

        self.conversion.refresh_from_db()

        self.assertEqual(
            self.conversion.progress,
            0,
        )

    def test_mark_as_failed(self):
        ConversionService.mark_as_failed(
            self.conversion,
            ValueError("Technical error"),
        )

        self.conversion.refresh_from_db()

        self.assertEqual(
            self.conversion.status,
            "failed",
        )

        self.assertEqual(
            self.conversion.progress,
            0,
        )

        self.assertTrue(
            self.conversion.error_message
        )

        self.assertNotIn(
            "Technical error",
            self.conversion.error_message,
        )

    def test_is_ready_for_export_returns_false_when_not_completed(self):
        self.conversion.status = "uploaded"
        self.conversion.latex_code = (
            "\\documentclass{article}"
        )
        self.conversion.save()

        self.assertFalse(
            ConversionService.is_ready_for_export(
                self.conversion
            )
        )

    def test_is_ready_for_export_returns_false_without_latex(self):
        self.conversion.status = "completed"
        self.conversion.latex_code = ""
        self.conversion.save()

        self.assertFalse(
            ConversionService.is_ready_for_export(
                self.conversion
            )
        )

    def test_is_ready_for_export_returns_true_with_latex_and_file(self):
        self.conversion.status = "completed"
        self.conversion.latex_code = (
            "\\documentclass{article}"
        )

        self.conversion.latex_file.save(
            "document.tex",
            BytesIO(
                b"\\documentclass{article}"
            ),
            save=True,
        )

        self.conversion.refresh_from_db()

        self.assertTrue(
            ConversionService.is_ready_for_export(
                self.conversion
            )
        )


class ConversionAPITests(
    WordToLatexTestMixin,
    APITestCase,
):
    """
    Tests des endpoints API.
    """

    def setUp(self):
        self.user = self.create_user()

        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="StrongPassword123!",
        )

    def test_anonymous_user_cannot_list_conversions(self):
        url = reverse(
            "conversion_list"
        )

        response = self.client.get(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_authenticated_user_can_list_own_conversions(self):
        own_conversion = self.create_conversion(
            self.user
        )

        self.create_conversion(
            self.other_user
        )

        self.client.force_authenticate(
            user=self.user
        )

        url = reverse(
            "conversion_list"
        )

        response = self.client.get(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        returned_ids = {
            str(item["id"])
            for item in response.data
        }

        self.assertIn(
            str(own_conversion.id),
            returned_ids,
        )

        self.assertNotIn(
            str(
                WordToLatexConversion.objects
                .filter(user=self.other_user)
                .first()
                .id
            ),
            returned_ids,
        )

    def test_user_cannot_access_another_users_conversion(self):
        conversion = self.create_conversion(
            self.other_user
        )

        self.client.force_authenticate(
            user=self.user
        )

        url = reverse(
            "conversion_detail",
            kwargs={
                "id": conversion.id,
            },
        )

        response = self.client.get(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_user_can_access_own_conversion(self):
        conversion = self.create_conversion(
            self.user
        )

        self.client.force_authenticate(
            user=self.user
        )

        url = reverse(
            "conversion_detail",
            kwargs={
                "id": conversion.id,
            },
        )

        response = self.client.get(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            str(response.data["id"]),
            str(conversion.id),
        )

    def test_anonymous_user_cannot_upload(self):
        document = self.create_docx_file()

        url = reverse(
            "upload_word_document"
        )

        response = self.client.post(
            url,
            {
                "file": document,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_upload_rejects_non_docx_file(self):
        self.client.force_authenticate(
            user=self.user
        )

        document = SimpleUploadedFile(
            "document.pdf",
            b"fake pdf",
            content_type="application/pdf",
        )

        url = reverse(
            "upload_word_document"
        )

        response = self.client.post(
            url,
            {
                "file": document,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_upload_rejects_empty_file(self):
        self.client.force_authenticate(
            user=self.user
        )

        document = self.create_docx_file(
            content=b""
        )

        url = reverse(
            "upload_word_document"
        )

        response = self.client.post(
            url,
            {
                "file": document,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    @patch("word_to_latex.views._conversion_service")
    @patch(
        "word_to_latex.views.FileService.create_conversion"
    )
    def test_authenticated_user_can_upload_document(
        self,
        mock_create_conversion,
        mock_conversion_service,
    ):
        self.client.force_authenticate(
            user=self.user
        )

        conversion = self.create_conversion(
            self.user,
            status="completed",
            progress=100,
            latex_code=(
                "\\documentclass{article}"
            ),
        )

        mock_create_conversion.return_value = (
            conversion
        )

        mock_conversion_service.return_value.process_conversion.return_value = {
            "success": True,
            "analysis": {
                "paragraphs_count": 1,
                "headings_count": 1,
                "words_count": 5,
                "tables_count": 0,
                "images_count": 0,
                "comments_count": 0,
                "footnotes_count": 0,
            },
            "latex_content": (
                "\\documentclass{article}"
            ),
            "lines": 1,
        }

        document = self.create_docx_file()

        url = reverse(
            "upload_word_document"
        )

        response = self.client.post(
            url,
            {
                "file": document,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertIn(
            "conversion",
            response.data,
        )

        self.assertTrue(
            response.data["success"]
        )

        mock_create_conversion.assert_called_once()
        mock_conversion_service.return_value.process_conversion.assert_called_once()

    @patch(
        "word_to_latex.views.FileService.delete_conversion_files"
    )
    def test_user_can_delete_own_conversion(
        self,
        mock_delete_files,
    ):
        conversion = self.create_conversion(
            self.user
        )

        self.client.force_authenticate(
            user=self.user
        )

        url = reverse(
            "conversion_delete",
            kwargs={
                "id": conversion.id,
            },
        )

        response = self.client.delete(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            WordToLatexConversion.objects.filter(
                id=conversion.id
            ).exists()
        )

        mock_delete_files.assert_called_once()

    def test_user_cannot_delete_another_users_conversion(
        self,
    ):
        conversion = self.create_conversion(
            self.other_user
        )

        self.client.force_authenticate(
            user=self.user
        )

        url = reverse(
            "conversion_delete",
            kwargs={
                "id": conversion.id,
            },
        )

        response = self.client.delete(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertTrue(
            WordToLatexConversion.objects.filter(
                id=conversion.id
            ).exists()
        )


class ConversionAnalyzerIntegrationTests(
    WordToLatexTestMixin,
    APITestCase,
):
    """
    Tests d'intégration légère du pipeline.

    Les dépendances externes complexes sont mockées afin
    de tester le comportement du service sans dépendre
    d'un document Word réel.
    """

    def setUp(self):
        self.user = self.create_user()

    @patch(
        "word_to_latex.services.conversion_service.DocumentAnalyzer"
    )
    def test_analyze_document_saves_statistics(
        self,
        mock_analyzer_class,
    ):
        conversion = self.create_conversion(
            self.user
        )

        # Le service vérifie le fichier physique.
        # On fournit donc un fichier temporaire via
        # le FileField du modèle.
        conversion.original_file.save(
            "document.docx",
            ContentBytes(
                b"fake document",
            ),
            save=True,
        )

        mock_analyzer = (
            mock_analyzer_class.return_value
        )

        mock_analyzer.analyze.return_value = {
            "paragraphs_count": 10,
            "headings_count": 3,
            "words_count": 250,
            "tables_count": 2,
            "images_count": 4,
            "comments_count": 1,
            "footnotes_count": 2,
            "document_title": "Mon document",
            "document_author": "Auteur",
        }

        result = (
            ConversionService.analyze_document(
                conversion
            )
        )

        conversion.refresh_from_db()

        self.assertEqual(
            conversion.status,
            "analyzed",
        )

        self.assertEqual(
            conversion.progress,
            30,
        )

        self.assertEqual(
            conversion.paragraphs_count,
            10,
        )

        self.assertEqual(
            conversion.headings_count,
            3,
        )

        self.assertEqual(
            conversion.words_count,
            250,
        )

        self.assertEqual(
            conversion.tables_count,
            2,
        )

        self.assertEqual(
            conversion.images_count,
            4,
        )

        self.assertEqual(
            conversion.comments_count,
            1,
        )

        self.assertEqual(
            conversion.footnotes_count,
            2,
        )

        self.assertEqual(
            conversion.document_title,
            "Mon document",
        )

        self.assertEqual(
            conversion.document_author,
            "Auteur",
        )

        self.assertEqual(
            result["words_count"],
            250,
        )


class ContentBytes:
    """
    Petit wrapper compatible avec FileField.save().
    """

    def __init__(self, content):
        self.content = content

    def read(self, *args, **kwargs):
        return self.content

    def chunks(self, chunk_size=64 * 1024):
        yield self.content
