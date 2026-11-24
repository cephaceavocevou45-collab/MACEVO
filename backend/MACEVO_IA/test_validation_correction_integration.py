import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from core.document.engine import DocumentEngine
from core.validation.correction import ValidationCorrectionEngine


print("=" * 80)
print("TEST INTEGRATION — VALIDATION + CORRECTION AUTOMATIQUE")
print("=" * 80)


# ============================================================================
# 1. MOTEURS
# ============================================================================

document_engine = DocumentEngine()

correction_engine = ValidationCorrectionEngine(
    max_attempts=3,
)

print("\nCORRECTION ENGINE")
print(type(correction_engine).__name__)

print("MAX ATTEMPTS :", correction_engine.max_attempts)


# ============================================================================
# 2. CREATION DU DOCUMENT
# ============================================================================

document = document_engine.create(
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
        "Document utilisé pour tester le cycle "
        "de validation et de correction automatique."
    ),
)

print("\nDOCUMENT")
print("ID :", document.id)
print("TYPE :", type(document).__name__)


# ============================================================================
# 3. CREATION DE SECTION
# ============================================================================

section = document_engine.add_section(
    document=document,
    title="Introduction",
    level=1,
)

print("\nSECTION")
print("ID :", section.id)
print("TYPE :", type(section).__name__)


# ============================================================================
# 4. CONTENU VOLONTAIREMENT SIMPLE
# ============================================================================

paragraph = document_engine.add_paragraph(
    target=section,
    content=(
        "L'intelligence artificielle est un domaine scientifique "
        "qui permet de développer des systèmes capables de traiter "
        "des informations et de produire des résultats."
    ),
)

print("\nPARAGRAPHE")
print("ID :", paragraph.id)


# ============================================================================
# 5. VALIDATION INITIALE
# ============================================================================

print("\n" + "=" * 80)
print("VALIDATION INITIALE")
print("=" * 80)

initial_validation = correction_engine.validate_document(
    document
)

print("\nTYPE :", type(initial_validation).__name__)

if hasattr(initial_validation, "to_dict"):
    print(initial_validation.to_dict())
else:
    print(initial_validation)


# ============================================================================
# 6. ETAT DE VALIDATION
# ============================================================================

print("\n" + "=" * 80)
print("ETAT INITIAL")
print("=" * 80)

if hasattr(initial_validation, "valid"):
    print("VALID :", initial_validation.valid)

if hasattr(initial_validation, "errors"):
    print("ERRORS :", len(initial_validation.errors))

if hasattr(initial_validation, "warnings"):
    print("WARNINGS :", len(initial_validation.warnings))


# ============================================================================
# 7. TRAITEMENT COMPLET
# ============================================================================

print("\n" + "=" * 80)
print("PROCESS DOCUMENT")
print("=" * 80)

result = correction_engine.process_document(
    document,
    instructions=[
        "Vérifier la cohérence scientifique du document.",
        "Corriger les problèmes détectés si nécessaire.",
        "Préserver le sens scientifique du contenu.",
    ],
    metadata={
        "source": "validation_correction_integration_test",
    },
)


# ============================================================================
# 8. RESULTAT
# ============================================================================

print("\nRESULTAT")

print("TYPE :", type(result).__name__)

if hasattr(result, "status"):
    print("STATUS :", result.status)

if hasattr(result, "success"):
    print("SUCCESS :", result.success)

if hasattr(result, "message"):
    print("MESSAGE :", result.message)

if hasattr(result, "errors"):
    print("ERRORS :", result.errors)

if hasattr(result, "warnings"):
    print("WARNINGS :", result.warnings)


# ============================================================================
# 9. DONNEES DU RESULTAT
# ============================================================================

print("\n" + "=" * 80)
print("DONNEES DU RESULTAT")
print("=" * 80)

if hasattr(result, "data"):
    data = result.data

    print("DATA TYPE :", type(data).__name__)

    if isinstance(data, dict):
        print("DATA KEYS :", list(data.keys()))

        for key, value in data.items():

            if key in {
                "document",
                "validation",
                "validation_result",
                "correction",
                "history",
            }:
                print(f"\n{key} :")
                print(value)
            else:
                print(f"{key} :", value)

    else:
        print(data)


# ============================================================================
# 10. VALIDATION FINALE
# ============================================================================

print("\n" + "=" * 80)
print("VALIDATION FINALE")
print("=" * 80)

final_validation = correction_engine.validate_document(
    document
)

print("\nTYPE :", type(final_validation).__name__)

if hasattr(final_validation, "valid"):
    print("VALID :", final_validation.valid)

if hasattr(final_validation, "errors"):
    print("ERRORS :", len(final_validation.errors))

if hasattr(final_validation, "warnings"):
    print("WARNINGS :", len(final_validation.warnings))

if hasattr(final_validation, "to_dict"):
    print("\nDETAILS :")
    print(final_validation.to_dict())


# ============================================================================
# 11. CONTENU FINAL
# ============================================================================

print("\n" + "=" * 80)
print("DOCUMENT FINAL")
print("=" * 80)

print("SECTIONS :", len(getattr(document, "sections", [])))
print("REFERENCES :", len(getattr(document, "references", [])))
print("EQUATIONS :", len(getattr(document, "equations", [])))
print("FIGURES :", len(getattr(document, "figures", [])))
print("TABLES :", len(getattr(document, "tables", [])))


print("\n" + "=" * 80)
print("TEST TERMINE")
print("=" * 80)