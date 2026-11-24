import os

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()

from core.document.engine import DocumentEngine
from core.exporters.zip import ZIPExporter


engine = DocumentEngine()

document = engine.create(
    title="Test paquet scientifique MACEVO",
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
        "Test du paquet scientifique "
        "complet MACEVO."
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
        "MACEVO permet de produire des "
        "documents scientifiques structurés."
    ),
)

engine.add_equation(
    section,
    latex=r"E = mc^2",
    label="eq:energie",
)

exporter = ZIPExporter(
    keep_package_dir=True
)

result = exporter.export(
    document,
    output_dir="exports_test",
    filename="macevo_scientific_package.zip",
)

print("SUCCESS :", result.success)
print("ZIP     :", result.zip_file)
print("PACKAGE :", result.package_dir)
print("PDF     :", result.pdf_file)
print("TEX     :", result.tex_file)
print("ERRORS  :", result.errors)
print("WARNINGS:", result.warnings)
print("FILES   :", result.files)

if result.zip_file:
    from pathlib import Path

    zip_path = Path(
        result.zip_file
    )

    print(
        "ZIP SIZE:",
        zip_path.stat().st_size,
        "bytes",
    )