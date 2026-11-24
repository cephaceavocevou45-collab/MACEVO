import os

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()

from core.document.engine import DocumentEngine
from core.latex.generator import LaTeXGenerator
from core.latex.bibliography import BibTeXGenerator


engine = DocumentEngine()

document = engine.create(
    title="Test bibliographique scientifique MACEVO",
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
        "Les méthodes modernes de prédiction des structures "
        "protéiques ont connu des avancées importantes "
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


# ---------------------------------------------------------------------
# Génération LaTeX
# ---------------------------------------------------------------------

generator = LaTeXGenerator()

latex = generator.generate(document)

output_tex = (
    "exports_test\\bibliography_integration_test.tex"
)

with open(
    output_tex,
    "w",
    encoding="utf-8",
    newline="\n",
) as handle:
    handle.write(latex)


# ---------------------------------------------------------------------
# Génération BibTeX
# ---------------------------------------------------------------------

bib_generator = BibTeXGenerator()

output_bib = (
    "exports_test\\references_integration_test.bib"
)

bib_generator.write(
    document.references,
    output_bib,
)


# ---------------------------------------------------------------------
# Vérifications
# ---------------------------------------------------------------------

print("=== TEST INTÉGRATION BIBLATEX / BIBER ===")

print("TEX EXISTE :", os.path.exists(output_tex))
print("BIB EXISTE :", os.path.exists(output_bib))

print(
    "ADD BIB RESOURCE :",
    r"\addbibresource{references.bib}" in latex,
)

print(
    "PRINT BIBLIOGRAPHY :",
    r"\printbibliography" in latex,
)

print(
    "THEBIBLIOGRAPHY ABSENT :",
    r"\begin{thebibliography}" not in latex,
)

print(
    "CITATION PRÉSENTE :",
    r"\cite{jumper2021alphafold}" in latex,
)

print()
print("TEX :", output_tex)
print("BIB :", output_bib)