"""
==========================================================
MACEVO IA
Import Service
==========================================================

Service central d'importation des documents.

Toutes les vues utilisent exclusivement ce service.
"""

from pathlib import Path

from projects.services.importers.pdf_importer import PDFImporter
from projects.services.importers.word_importer import WordImporter
from projects.services.importers.latex_importer import LatexImporter
from projects.services.importers.markdown_importer import MarkdownImporter
from projects.services.importers.html_importer import HTMLImporter
from projects.services.importers.text_importer import TextImporter
from projects.services.importers.json_importer import JSONImporter
from projects.services.importers.bibtex_importer import BibTeXImporter
from projects.services.importers.csv_importer import CSVImporter
from projects.services.importers.excel_importer import ExcelImporter
from projects.services.importers.powerpoint_importer import PowerPointImporter
from projects.services.importers.xml_importer import XMLImporter
from projects.services.importers.rtf_importer import RTFImporter
from projects.services.importers.epub_importer import EPUBImporter
from projects.services.importers.odt_importer import ODTImporter
from projects.services.importers.image_importer import ImageImporter


class ImportService:
    """
    Point d'entrée unique du système d'importation.
    """

    _importers = [

        PDFImporter(),

        WordImporter(),

        LatexImporter(),

        MarkdownImporter(),

        HTMLImporter(),

        TextImporter(),

        JSONImporter(),

        BibTeXImporter(),

        CSVImporter(),

        ExcelImporter(),

        PowerPointImporter(),

        XMLImporter(),

        RTFImporter(),

        EPUBImporter(),

        ODTImporter(),

        ImageImporter(),

    ]

    @classmethod
    def importer(cls, file_path):

        extension = Path(file_path).suffix.lower()

        for importer in cls._importers:

            if extension in importer.supported_extensions:

                return importer

        raise ValueError(
            f"Format non supporté : {extension}"
        )

    @classmethod
    def import_document(cls, file_path):

        importer = cls.importer(file_path)

        result = importer.import_document(file_path)

        content = result.get("content", "")

        result["statistics"] = cls.statistics(content)

        result["language"] = cls.detect_language(content)

        result["reading_time"] = cls.reading_time(content)

        return result

    @staticmethod
    def statistics(content):

        words = len(content.split())

        lines = len(content.splitlines())

        characters = len(content)

        return {

            "words": words,

            "characters": characters,

            "lines": lines,

        }

    @staticmethod
    def reading_time(content):

        words = len(content.split())

        return max(1, round(words / 200))

    @staticmethod
    def detect_language(content):

        text = content.lower()

        french = [
            " le ",
            " la ",
            " les ",
            " des ",
            " est ",
        ]

        english = [
            " the ",
            " and ",
            " is ",
            " are ",
        ]

        fr = sum(text.count(word) for word in french)

        en = sum(text.count(word) for word in english)

        if fr > en:

            return "fr"

        if en > fr:

            return "en"

        return "unknown"

    @classmethod
    def supported_extensions(cls):

        extensions = []

        for importer in cls._importers:

            extensions.extend(importer.supported_extensions)

        return sorted(extensions)