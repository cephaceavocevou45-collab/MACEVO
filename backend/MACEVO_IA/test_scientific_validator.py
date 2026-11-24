import os

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()

from core.document.engine import DocumentEngine
from core.validation.scientific import ScientificValidator


engine = DocumentEngine()

document = engine.create(
    title="Étude scientifique MACEVO",
    author="MACEVO",
    institution="Université",
    document_type="scientific",
    language="fr",
    keywords=[
        "intelligence artificielle",
        "documents scientifiques",
    ],
    abstract=(
        "Cette étude présente une architecture "
        "scientifique destinée à la génération "
        "et à la validation automatisée de documents."
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
        "L'intelligence artificielle permet "
        "d'automatiser certaines étapes de production "
        "des documents scientifiques."
    ),
)

engine.add_equation(
    target=section,
    latex=r"E = mc^2",
    label="eq:energie",
    caption="Relation masse-énergie.",
)

engine.add_figure(
    target=section,
    source="figure1.png",
    label="fig:architecture",
    caption="Architecture générale de MACEVO.",
)

engine.add_table(
    target=section,
    columns=["Paramètre", "Valeur"],
    rows=[
        ["Température", "0.4"],
        ["Modèle", "qwen3"],
    ],
    label="tab:parametres",
    caption="Paramètres du système.",
)

engine.add_reference(
    document,
    "Attention Is All You Need",
    authors=[
        "Vaswani",
        "Shazeer",
        "Parmar",
    ],
    year=2017,
    doi="10.48550/arXiv.1706.03762",
    citation_key="vaswani2017",
)

validator = ScientificValidator()

result = validator.validate(
    document
)

print()
print("====================================")
print("VALIDATION SCIENTIFIQUE MACEVO")
print("====================================")
print()
print("VALID       :", result.valid)
print("ERREURS     :", result.error_count)
print("AVERTISSEMENTS :", result.warning_count)
print("INFORMATIONS:", result.info_count)
print()
print("STATISTIQUES")
print(result.statistics)
print()

for error in result.errors:
    print(
        "ERROR:",
        error.code,
        "|",
        error.message,
        "|",
        error.path,
    )

for warning in result.warnings:
    print(
        "WARNING:",
        warning.code,
        "|",
        warning.message,
        "|",
        warning.path,
    )

print()
print("TEST TERMINÉ")