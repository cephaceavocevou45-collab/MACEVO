import os

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()

from core.document.engine import DocumentEngine
from core.latex.bibliography import BibTeXGenerator


engine = DocumentEngine()

document = engine.create(
    title="Test bibliographique MACEVO",
    author="Houssouf",
    institution="MACEVO",
    year=2026,
    language="fr",
    document_type="scientific",
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

generator = BibTeXGenerator()

bibtex = generator.generate(
    document.references
)

print("=== BIBTEX MACEVO ===")
print(bibtex)

output = "exports_test\\references_test.bib"

generator.write(
    document.references,
    output,
)

print("FICHIER :", output)
print("EXISTE  :", os.path.exists(output))