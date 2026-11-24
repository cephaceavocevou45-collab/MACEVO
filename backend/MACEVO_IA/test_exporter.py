import os

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()

from core.document.engine import DocumentEngine
from core.exporters.exporter import Exporter


engine = DocumentEngine()

document = engine.create(
    title="Test façade Exporter MACEVO",
    author="Houssouf",
    institution="MACEVO",
    department="Département scientifique",
    year=2026,
    language="fr",
    document_type="scientific",
)

section = engine.add_section(
    document,
    "Introduction",
    level=1,
)

engine.add_paragraph(
    target=section,
    content=(
        "Test de la façade centrale "
        "des exportations MACEVO."
    ),
)

engine.add_equation(
    section,
    latex=r"E = mc^2",
    label="eq:energie",
)

exporter = Exporter()

print(
    "FORMATS :",
    exporter.formats(),
)

print(
    "PDF SUPPORTE :",
    exporter.supports("pdf"),
)

print(
    "LATEX SUPPORTE :",
    exporter.supports(".tex"),
)

print(
    "ZIP SUPPORTE :",
    exporter.supports("zip"),
)

result = exporter.export(
    document,
    format="pdf",
    output_dir="exports_test",
    filename="facade_test.pdf",
)

print(
    "SUCCESS :",
    result.success,
)

print(
    "FORMAT  :",
    result.format,
)

print(
    "OUTPUT  :",
    result.output_file,
)

print(
    "ERRORS  :",
    result.errors,
)

print(
    "WARNINGS:",
    result.warnings,
)