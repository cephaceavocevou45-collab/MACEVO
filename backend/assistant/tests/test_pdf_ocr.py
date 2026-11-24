from io import BytesIO
from unittest.mock import patch

import fitz
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase

from assistant.document_service import DocumentService


class DocumentServicePdfTests(SimpleTestCase):
    @staticmethod
    def make_pdf(*page_texts):
        document = fitz.open()
        for page_text in page_texts:
            page = document.new_page()
            if page_text is None:
                from PIL import Image

                image = Image.new("RGB", (800, 1000), "white")
                image_bytes = BytesIO()
                image.save(image_bytes, format="PNG")
                page.insert_image(page.rect, stream=image_bytes.getvalue())
                image.close()
            elif page_text:
                page.insert_text((72, 72), page_text)
        content = document.tobytes()
        document.close()
        return SimpleUploadedFile(
            "rapport.pdf", content, content_type="application/pdf"
        )

    def test_extracts_text_from_digital_pdf(self):
        upload = self.make_pdf(
            "This page contains enough text to skip the OCR threshold."
        )
        result = DocumentService.extract_pdf(upload)
        self.assertIn("This page contains enough text", result)
        self.assertIn("PAGE 1", result)

    @patch.object(
        DocumentService,
        "_extract_image_with_tesseract_cli",
        return_value="OCR recognized text from scanned page.",
    )
    def test_extracts_text_from_scanned_pdf(self, ocr):
        result = DocumentService.extract_pdf(self.make_pdf(None))
        self.assertIn("OCR recognized text", result)
        ocr.assert_called_once()

    @patch.object(
        DocumentService,
        "_extract_image_with_tesseract_cli",
        return_value="OCR text from the scanned page.",
    )
    def test_extracts_mixed_digital_and_scanned_pages(self, ocr):
        result = DocumentService.extract_pdf(self.make_pdf(
            "Digital page has enough characters to skip OCR.", None
        ))
        self.assertIn("Digital page has enough characters", result)
        self.assertIn("OCR text from the scanned page", result)
        ocr.assert_called_once()

    def test_detects_scanned_pages_in_mixed_pdf(self):
        upload = self.make_pdf(
            "Digital page has enough characters to skip OCR.", None
        )
        self.assertTrue(DocumentService.pdf_requires_ocr(upload))
