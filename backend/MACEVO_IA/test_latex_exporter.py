import os

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()

from core.document.engine import DocumentEngine
from core.exporters.latex import LaTeXExporter


engine = DocumentEngine()

document = engine.create(
    title="Test export MACEVO",
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
    ],
    abstract=(
        "Document de test du système "
        "d'export LaTeX MACEVO."
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
        "MACEVO génère des documents "
        "scientifiques structurés."
    ),
)

engine.add_equation(
    section,
    latex=r"E = mc^2",
    label="eq:energie",
)

exporter = LaTeXExporter()

result = exporter.export(
    document,
    output_dir="exports_test",
    filename="macevo_export_test.tex",
)

print("SUCCESS :", result.success)
print("TEX     :", result.tex_file)
print("ERRORS  :", result.errors)
print("WARNINGS:", result.warnings)

if result.validation:
    print(
        "VALID   :",
        result.validation.valid,
    )

    print(
        "STATS   :",
        result.validation.statistics,
    )