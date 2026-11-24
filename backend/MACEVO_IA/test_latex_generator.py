import os
import sys

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()

from core.document.engine import DocumentEngine
from core.latex.generator import LaTeXGenerator


engine = DocumentEngine()

document = engine.create(
    title="Étude scientifique MACEVO",
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
        "Ce document présente une étude scientifique "
        "générée et structurée avec MACEVO."
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
        "L'intelligence artificielle transforme "
        "progressivement les méthodes de recherche scientifique."
    ),
)

engine.add_equation(
    section,
    latex=r"E = mc^2",
    label="eq:energie",
)

generator = LaTeXGenerator()

latex = generator.generate(
    document
)

print("=" * 70)
print("TEST GÉNÉRATEUR LATEX MACEVO")
print("=" * 70)

print(latex)

with open(
    "macevo_test.tex",
    "w",
    encoding="utf-8",
) as file:
    file.write(latex)

print("=" * 70)
print("FICHIER CRÉÉ : macevo_test.tex")
print("=" * 70)