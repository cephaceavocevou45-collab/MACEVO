"""
MACEVO — Validation scientifique des documents.
"""

from html.parser import HTMLParser
from urllib.parse import urlparse

from .document_service import build_document


class DocumentValidationParser(HTMLParser):

    def __init__(self):
        super().__init__(
            convert_charrefs=True,
        )

        self.errors = []
        self.warnings = []

        self.images = []
        self.links = []
        self.tables = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)

        if tag.lower() == "img":
            self.images.append(attrs)

        elif tag.lower() == "a":
            self.links.append(attrs)

        elif tag.lower() == "table":
            self.tables.append(
                {
                    "rows": 0,
                }
            )

        elif tag.lower() == "tr":
            if self.tables:
                self.tables[-1]["rows"] += 1


class DocumentValidationService:
    """
    Validation avant export.
    """

    def validate(self, report):
        errors = []
        warnings = []

        html = report.content or ""

        if not html.strip():
            errors.append(
                "Le document est vide."
            )

            return {
                "valid": False,
                "errors": errors,
                "warnings": warnings,
            }

        parser = DocumentValidationParser()

        try:
            parser.feed(html)
            parser.close()
        except Exception as exc:
            errors.append(
                "Le contenu HTML du document "
                f"est invalide : {exc}"
            )

        for image in parser.images:
            src = (
                image.get("src")
                or ""
            ).strip()

            alt = (
                image.get("alt")
                or ""
            ).strip()

            if not src:
                errors.append(
                    "Une image ne possède "
                    "pas de source."
                )

            if not alt:
                warnings.append(
                    "Une image ne possède pas "
                    "de texte alternatif."
                )

        for table in parser.tables:
            if table["rows"] == 0:
                warnings.append(
                    "Un tableau est vide."
                )

        for link in parser.links:
            href = (
                link.get("href")
                or ""
            ).strip()

            if not href:
                warnings.append(
                    "Un lien ne possède "
                    "pas d'adresse."
                )
                continue

            parsed = urlparse(href)

            if not parsed.scheme and not href.startswith(
                ("#", "/", "./", "../")
            ):
                warnings.append(
                    f"Le lien '{href}' "
                    "semble invalide."
                )

        document = build_document(
            report
        )

        for latex in document["math"]:
            if not latex.strip():
                warnings.append(
                    "Une équation LaTeX est vide."
                )

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
        }