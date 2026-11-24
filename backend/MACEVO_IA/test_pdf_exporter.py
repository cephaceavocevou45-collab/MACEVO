import os

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()

from core.document.engine import DocumentEngine
from core.exporters.pdf import PDFExporter


engine = DocumentEngine()

document = engine.create(
    title="Test PDF MACEVO",
    author="Houssouf",
    institution="MACEVO",
    department="Département scientifique",
    supervisor="Direction scientifique",
    year=2026,
    language="fr",
    document_type="scientific",
    keywords=[
        "intelligence artificielle",
        "recherche scientifique",
        "MACEVO",
    ],
    abstract=(
        "Test de génération PDF "
        "du système MACEVO."
    ),
)

section = engine.add_section(
    document,
    "Introduction",
    level=1,
)

engine.add_paragraph(
    target=section,
    content=(
        "MACEVO permet de générer "
        "des documents scientifiques "
        "structurés automatiquement."
    ),
)

engine.add_equation(
    section,
    latex=r"E = mc^2",
    label="eq:energie",
)

exporter = PDFExporter(
    keep_tex=True
)

result = exporter.export(
    document,
    output_dir="exports_test",
    filename="macevo_pdf_test.pdf",
)

print("SUCCESS :", result.success)
print("PDF     :", result.pdf_file)
print("TEX     :", result.tex_file)
print("ERRORS  :", result.errors)
print("WARNINGS:", result.warnings)

if result.compilation:
    print(
        "ENGINE  :",
        result.compilation.engine,
    )

    print(
        "PASSES  :",
        result.compilation.passes,
    )

    print(
        "DURATION:",
        result.compilation.duration_ms,
        "ms",
    )