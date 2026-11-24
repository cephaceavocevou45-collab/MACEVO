from io import BytesIO
from unittest.mock import patch
from zipfile import ZIP_DEFLATED, ZipFile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase

from assistant.document_service import DocumentService


class DocumentServiceDocxFallbackTests(SimpleTestCase):
    @staticmethod
    def _minimal_docx():
        xml = """<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Texte du rapport</w:t></w:r></w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Variable</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Résultat</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>"""
        buffer = BytesIO()
        with ZipFile(buffer, "w", ZIP_DEFLATED) as package:
            package.writestr("word/document.xml", xml)
        return buffer.getvalue()

    @patch.dict("sys.modules", {"docx": None})
    def test_extracts_paragraphs_and_tables_without_python_docx(self):
        upload = SimpleUploadedFile(
            "rapport.docx",
            self._minimal_docx(),
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "wordprocessingml.document"
            ),
        )

        result = DocumentService.extract_docx(upload)

        self.assertIn("Texte du rapport", result)
        self.assertIn("--- TABLEAU 1 ---", result)
        self.assertIn("Variable | Résultat", result)
