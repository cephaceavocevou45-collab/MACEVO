"""
Test du validateur de cohérence scientifique MACEVO.
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.document.engine import DocumentEngine
from core.validation.consistency import ScientificConsistencyValidator


print("=" * 80)
print("TEST — COHÉRENCE SCIENTIFIQUE MACEVO")
print("=" * 80)


engine = DocumentEngine()

document = engine.create(
    title="Document scientifique de test",
    author="MACEVO",
    institution="MACEVO",
    language="fr",
    document_type="scientific",
    keywords=[
        "intelligence artificielle",
        "validation",
        "scientifique",
    ],
    abstract=(
        "Document destiné à tester la cohérence interne "
        "d'un document scientifique."
    ),
)


section = engine.add_section(
    document,
    "Résultats",
    level=1,
)


# ----------------------------------------------------------------------
# Paragraphe avec références internes et citation
# ----------------------------------------------------------------------

paragraph = section.add_paragraph(
    (
        "Les résultats présentés dans "
        "\\ref{eq:performance} sont illustrés par la "
        "figure \\ref{fig:architecture} et le tableau "
        "\\ref{tab:results}. "
        "Ces résultats sont comparés aux travaux précédents "
        "\\cite{dupont2025}."
    )
)


# ----------------------------------------------------------------------
# Équation
# ----------------------------------------------------------------------

equation = section.add_equation(
    r"E = mc^2",
    label="eq:performance",
    caption="Relation entre masse et énergie.",
)


# ----------------------------------------------------------------------
# Figure
# ----------------------------------------------------------------------

figure = section.add_figure(
    source="architecture.png",
    caption="Architecture scientifique du système.",
    label="fig:architecture",
)


# ----------------------------------------------------------------------
# Tableau
# ----------------------------------------------------------------------

table = section.add_table(
    columns=["Méthode", "Précision"],
    rows=[
        ["MACEVO", "95 %"],
        ["Méthode A", "91 %"],
    ],
    caption="Comparaison des performances.",
    label="tab:results",
)


# ----------------------------------------------------------------------
# Référence bibliographique
# ----------------------------------------------------------------------

reference = engine.add_reference(
    document,
    "Une étude sur l'intelligence artificielle scientifique",
    authors=["Dupont, Jean"],
    year=2025,
    journal="Journal of Scientific AI",
    citation_key="dupont2025",
)


validator = ScientificConsistencyValidator()


print()
print("=" * 80)
print("VALIDATION — DOCUMENT COHÉRENT")
print("=" * 80)

result = validator.validate(document)

print("VALID :", result.valid)
print("ERREURS :", len(result.errors))
print("AVERTISSEMENTS :", len(result.warnings))
print("INFORMATIONS :", len(result.infos))

print()
print("STATISTIQUES")
print(result.statistics)


if result.issues:
    print()
    print("ISSUES")
    for issue in result.issues:
        print(
            f"[{issue.severity.value.upper()}] "
            f"{issue.code} : {issue.message}"
        )


# ----------------------------------------------------------------------
# Test d'une incohérence volontaire
# ----------------------------------------------------------------------

print()
print("=" * 80)
print("TEST — RÉFÉRENCE INEXISTANTE")
print("=" * 80)

section.add_paragraph(
    "Cette phrase contient une référence inexistante : "
    "\\ref{fig:does_not_exist}."
)

result_invalid = validator.validate(document)

print("VALID :", result_invalid.valid)
print("ERREURS :", len(result_invalid.errors))
print("AVERTISSEMENTS :", len(result_invalid.warnings))

for issue in result_invalid.errors:
    print(
        f"[{issue.severity.value.upper()}] "
        f"{issue.code} : {issue.message}"
    )


# ----------------------------------------------------------------------
# Test d'une citation inexistante
# ----------------------------------------------------------------------

print()
print("=" * 80)
print("TEST — CITATION BIBLIOGRAPHIQUE INEXISTANTE")
print("=" * 80)

section.add_paragraph(
    "Une autre étude est mentionnée dans "
    "\\cite{source_inexistante2026}."
)

result_citation = validator.validate(document)

print("VALID :", result_citation.valid)
print("ERREURS :", len(result_citation.errors))
print("AVERTISSEMENTS :", len(result_citation.warnings))

for issue in result_citation.errors:
    print(
        f"[{issue.severity.value.upper()}] "
        f"{issue.code} : {issue.message}"
    )


print()
print("=" * 80)
print("TEST TERMINÉ")
print("=" * 80)