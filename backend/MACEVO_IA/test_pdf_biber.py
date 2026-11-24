import os
from pathlib import Path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from core.document.engine import DocumentEngine
from core.exporters.pdf import PDFExporter


OUTPUT_DIR = Path("exports_test") / "pdf_biber_test"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("=== TEST PDF EXPORTER → BIBER ===")

# ------------------------------------------------------------------
# 1. Création du document
# ------------------------------------------------------------------

engine = DocumentEngine()

document = engine.create(
    title="Test export PDF scientifique MACEVO",
    author="MACEVO",
    institution="MACEVO",
    department="Recherche scientifique",
    year=2026,
    language="fr",
    document_type="scientific",
    abstract=(
        "Test de génération PDF avec bibliographie "
        "BibLaTeX et Biber."
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
        "La prédiction moderne des structures protéiques "
        "a connu des avancées importantes "
        "[@jumper2021alphafold]."
    ),
)

engine.add_reference(
    document,
    "Highly accurate protein structure prediction with AlphaFold",
    authors=[
        "Jumper, John",
        "Evans, Richard",
        "Pritzel, Alexander",
    ],
    year=2021,
    journal="Nature",
    doi="10.1038/s41586-021-03819-2",
    url="https://doi.org/10.1038/s41586-021-03819-2",
    citation_key="jumper2021alphafold",
)

# ------------------------------------------------------------------
# 2. Export PDF
# ------------------------------------------------------------------

exporter = PDFExporter(
    keep_tex=True,
    keep_bib=True,
)

result = exporter.export(
    document,
    output_dir=OUTPUT_DIR,
    filename="macevo_pdf_biber_test.pdf",
    passes=2,
)

# ------------------------------------------------------------------
# 3. Résultats
# ------------------------------------------------------------------

print()
print("=== RÉSULTAT ===")

print("SUCCESS       :", result.success)
print("PDF           :", result.pdf_file)
print("TEX           :", result.tex_file)
print("BIB           :", result.bib_file)

if result.compilation:
    print(
        "ENGINE        :",
        result.compilation.engine,
    )

    print(
        "PASSES        :",
        result.compilation.passes,
    )

    print(
        "BIBER         :",
        result.compilation.biber_executed,
    )

    print(
        "BIBER CODE    :",
        result.compilation.biber_return_code,
    )

    print(
        "PDF COMPILER  :",
        result.compilation.pdf_file,
    )

print()
print("ERRORS :")

for error in result.errors:
    print(" -", error)

print()
print("WARNINGS :")

for warning in result.warnings:
    print(" -", warning)

# ------------------------------------------------------------------
# 4. Vérifications fichiers
# ------------------------------------------------------------------

pdf_path = Path(
    result.pdf_file
) if result.pdf_file else None

tex_path = Path(
    result.tex_file
) if result.tex_file else None

bib_path = Path(
    result.bib_file
) if result.bib_file else None

print()
print("=== FICHIERS ===")

print(
    "PDF EXISTE :",
    pdf_path.exists()
    if pdf_path
    else False,
)

print(
    "TEX EXISTE :",
    tex_path.exists()
    if tex_path
    else False,
)

print(
    "BIB EXISTE :",
    bib_path.exists()
    if bib_path
    else False,
)

if result.compilation and tex_path:
    bbl_path = tex_path.with_suffix(".bbl")
    blg_path = tex_path.with_suffix(".blg")

    print(
        "BBL EXISTE :",
        bbl_path.exists(),
    )

    print(
        "BLG EXISTE :",
        blg_path.exists(),
    )

# ------------------------------------------------------------------
# 5. Validation finale
# ------------------------------------------------------------------

if not result.success:
    raise RuntimeError(
        "PDFExporter a échoué."
    )

if not result.compilation:
    raise RuntimeError(
        "Aucun résultat de compilation disponible."
    )

if not result.compilation.biber_executed:
    raise RuntimeError(
        "PDFExporter n'a pas exécuté Biber."
    )

if result.compilation.biber_return_code != 0:
    raise RuntimeError(
        "Biber a échoué."
    )

if not pdf_path or not pdf_path.exists():
    raise RuntimeError(
        "Le PDF final est introuvable."
    )

if not bib_path or not bib_path.exists():
    raise RuntimeError(
        "Le fichier references.bib est introuvable."
    )

print()
print("==============================================")
print(" TEST PDF EXPORTER + BIBER : RÉUSSI")
print("==============================================")