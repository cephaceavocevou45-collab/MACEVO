import os
from pathlib import Path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from core.document.engine import DocumentEngine
from core.latex.generator import LaTeXGenerator
from core.latex.bibliography import BibTeXGenerator
from core.latex.compiler import LaTeXCompiler


OUTPUT_DIR = Path("exports_test") / "biber_real_test"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TEX_FILE = OUTPUT_DIR / "biber_test.tex"
BIB_FILE = OUTPUT_DIR / "references.bib"


print("=== TEST RÉEL LATEX → BIBER → PDF ===")

# ------------------------------------------------------------------
# 1. Création du document scientifique
# ------------------------------------------------------------------

engine = DocumentEngine()

document = engine.create(
    title="Analyse scientifique MACEVO",
    author="MACEVO",
    institution="MACEVO",
    department="Recherche scientifique",
    year=2026,
    language="fr",
    document_type="scientific",
    abstract="Document scientifique de test de la chaîne BibLaTeX/Biber."
)

section = engine.add_section(
    document,
    "Introduction",
    level=1,
)

engine.add_paragraph(
    target=section,
    content=(
        "Les méthodes modernes de prédiction des structures protéiques "
        "ont connu des avancées importantes [@jumper2021alphafold]."
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
# 2. Génération LaTeX
# ------------------------------------------------------------------

generator = LaTeXGenerator(
    compiler="xelatex",
)

latex = generator.generate(document)

TEX_FILE.write_text(
    latex,
    encoding="utf-8",
)

# ------------------------------------------------------------------
# 3. Génération BibTeX
# ------------------------------------------------------------------

bib_generator = BibTeXGenerator()

bibtex = bib_generator.generate(
    document.references
)

BIB_FILE.write_text(
    bibtex,
    encoding="utf-8",
)

print()
print("TEX :", TEX_FILE)
print("BIB :", BIB_FILE)
print("TEX EXISTE :", TEX_FILE.exists())
print("BIB EXISTE :", BIB_FILE.exists())

# ------------------------------------------------------------------
# 4. Vérifications avant compilation
# ------------------------------------------------------------------

latex_text = TEX_FILE.read_text(
    encoding="utf-8"
)

print()
print("ADD BIB RESOURCE :", "\\addbibresource{references.bib}" in latex_text)
print("PRINT BIBLIOGRAPHY :", "\\printbibliography" in latex_text)
print("CITATION :", "\\cite{jumper2021alphafold}" in latex_text)

if "\\addbibresource{references.bib}" not in latex_text:
    raise RuntimeError(
        "Le fichier .tex ne référence pas references.bib."
    )

if "\\printbibliography" not in latex_text:
    raise RuntimeError(
        "Le fichier .tex ne contient pas \\\\printbibliography."
    )

if "\\cite{jumper2021alphafold}" not in latex_text:
    raise RuntimeError(
        "La citation n'a pas été générée correctement."
    )

# ------------------------------------------------------------------
# 5. Compilation réelle avec Biber
# ------------------------------------------------------------------

print()
print("=== COMPILATION ===")

compiler = LaTeXCompiler(
    preferred_engine="xelatex",
    passes=2,
    timeout=120,
    use_biber=True,
)

result = compiler.compile(
    TEX_FILE
)

# ------------------------------------------------------------------
# 6. Résultats
# ------------------------------------------------------------------

PDF_FILE = TEX_FILE.with_suffix(".pdf")
BBL_FILE = TEX_FILE.with_suffix(".bbl")
BCF_FILE = TEX_FILE.with_suffix(".bcf")
BLG_FILE = TEX_FILE.with_suffix(".blg")

print()
print("=== RÉSULTAT ===")

print("SUCCESS       :", result.success)
print("ENGINE        :", result.engine)
print("BIBER         :", result.biber_executed)
print("BIBER CODE    :", result.biber_return_code)
print("PASSES        :", result.passes)
print("PDF EXISTE    :", PDF_FILE.exists())
print("BBL EXISTE    :", BBL_FILE.exists())
print("BCF EXISTE    :", BCF_FILE.exists())
print("BLG EXISTE    :", BLG_FILE.exists())
print("DURATION (ms) :", result.duration_ms)

print()
print("ERRORS :")

for error in result.errors:
    print(" -", error)

print()
print("WARNINGS :")

for warning in result.warnings:
    print(" -", warning)

print()
print("=== FICHIERS ===")

for path in sorted(OUTPUT_DIR.iterdir()):
    if path.is_file():
        print(
            f"{path.name:<35} {path.stat().st_size} octets"
        )

# ------------------------------------------------------------------
# 7. Validation finale
# ------------------------------------------------------------------

if not result.success:
    raise RuntimeError(
        "La compilation LaTeX/Biber a échoué."
    )

if not result.biber_executed:
    raise RuntimeError(
        "Biber devait être exécuté mais ne l'a pas été."
    )

if result.biber_return_code != 0:
    raise RuntimeError(
        f"Biber a échoué avec le code {result.biber_return_code}."
    )

if not PDF_FILE.exists():
    raise RuntimeError(
        "Le PDF final n'a pas été généré."
    )

if not BBL_FILE.exists():
    raise RuntimeError(
        "Le fichier .bbl n'a pas été généré par Biber."
    )

print()
print("==========================================")
print(" TEST LATEX → BIBER → PDF : RÉUSSI")
print("==========================================")
