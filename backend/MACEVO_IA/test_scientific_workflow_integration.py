import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from core.document.engine import DocumentEngine
from core.scientific.workflow import ScientificWorkflowEngine
from core.verification import create_reference_verification_engine


print("=" * 80)
print("TEST COMPLET — SCIENTIFIC WORKFLOW + VALIDATION + CROSSREF")
print("=" * 80)


# ============================================================================
# 1. MOTEUR DE VERIFICATION
# ============================================================================

reference_verification_engine = create_reference_verification_engine(
    timeout=10,
)

print("\nPROVIDERS DE VERIFICATION")
print(reference_verification_engine.list_providers())


# ============================================================================
# 2. WORKFLOW SCIENTIFIQUE
# ============================================================================

workflow = ScientificWorkflowEngine(
    reference_verification_engine=reference_verification_engine,
)

print("\nWORKFLOW")
print(type(workflow).__name__)


# ============================================================================
# 3. DOCUMENT
# ============================================================================

document_engine = DocumentEngine()

document = document_engine.create(
    title="Analyse scientifique intégrée",
    author="MACEVO Integration Test",
    institution="MACEVO",
    language="fr",
    document_type="scientific",
    keywords=["MACEVO", "Crossref", "validation"],
    abstract="Document de test de l'intégration scientifique.",
)

print("\nDOCUMENT")
print("ID :", document.id)
print("TYPE :", type(document).__name__)


# ============================================================================
# 4. SECTION
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
# 5. REFERENCE CROSSREF VALIDE
# ============================================================================

reference_valid = document_engine.add_reference(
    document=document,
    title="Highly accurate protein structure prediction with AlphaFold",
    authors=[
        "John Jumper",
        "Richard Evans",
        "Alexander Pritzel",
    ],
    year=2021,
    journal="Nature",
    publisher="Springer Nature",
    doi="10.1038/s41586-021-03819-2",
    url="https://doi.org/10.1038/s41586-021-03819-2",
    citation_key="jumper2021alphafold",
    metadata={
        "source": "workflow_integration_test",
        "requires_verification": True,
        "verified": False,
    },
)


# ============================================================================
# 6. REFERENCE CROSSREF INTROUVABLE
# ============================================================================

reference_invalid = document_engine.add_reference(
    document=document,
    title="Référence scientifique inexistante MACEVO",
    authors=["Auteur Inexistant"],
    year=2026,
    journal="Journal Inexistant",
    publisher="Éditeur Inexistant",
    doi="10.9999/MACEVO-WORKFLOW-DOI-INVALID",
    citation_key="macevo_invalid_2026",
    metadata={
        "source": "workflow_integration_test",
        "requires_verification": True,
        "verified": False,
    },
)


# ============================================================================
# 7. REFERENCES DU DOCUMENT
# ============================================================================

references = getattr(document, "references", [])

print("\nREFERENCES AVANT VERIFICATION")
print("NOMBRE :", len(references))

for index, reference in enumerate(references, start=1):
    print(f"\nREFERENCE {index}")
    print("TYPE :", type(reference).__name__)

    if hasattr(reference, "id"):
        print("ID :", reference.id)

    if hasattr(reference, "title"):
        print("TITLE :", reference.title)

    if hasattr(reference, "doi"):
        print("DOI :", reference.doi)

    if hasattr(reference, "metadata"):
        print("METADATA :", reference.metadata)


# ============================================================================
# 8. VERIFICATION VIA LE WORKFLOW
# ============================================================================

print("\n" + "=" * 80)
print("VERIFICATION DES REFERENCES VIA SCIENTIFIC WORKFLOW")
print("=" * 80)

verification_result = workflow._verify_references(document)


print("\nRESULTAT DE VERIFICATION")
print(verification_result)


# ============================================================================
# 9. METADONNEES DU RESULTAT
# ============================================================================

print("\n" + "=" * 80)
print("METADONNEES DE VERIFICATION")
print("=" * 80)

if isinstance(verification_result, dict):

    for key, value in verification_result.items():
        print(f"{key} : {value}")

else:
    print("TYPE RESULTAT :", type(verification_result).__name__)

    if hasattr(verification_result, "to_dict"):
        print(verification_result.to_dict())


# ============================================================================
# 10. REFERENCES APRES VERIFICATION
# ============================================================================

print("\n" + "=" * 80)
print("REFERENCES APRES VERIFICATION")
print("=" * 80)

references_after = getattr(document, "references", [])

for index, reference in enumerate(references_after, start=1):

    print(f"\nREFERENCE {index}")

    if hasattr(reference, "title"):
        print("TITLE :", reference.title)

    if hasattr(reference, "doi"):
        print("DOI :", reference.doi)

    if hasattr(reference, "metadata"):
        print("METADATA :", reference.metadata)


# ============================================================================
# 11. CONTROLES
# ============================================================================

print("\n" + "=" * 80)
print("CONTROLES")
print("=" * 80)


verified_count = 0
not_found_count = 0
mismatch_count = 0
verification_error_count = 0


for reference in references_after:

    metadata = getattr(reference, "metadata", None)

    if not isinstance(metadata, dict):
        continue

    status = metadata.get("verification_status")

    if status == "verified":
        verified_count += 1

    elif status == "not_found":
        not_found_count += 1

    elif status == "mismatch":
        mismatch_count += 1

    elif status == "error":
        verification_error_count += 1


print("REFERENCES VERIFIED :", verified_count)
print("REFERENCES NOT_FOUND :", not_found_count)
print("REFERENCES MISMATCH :", mismatch_count)
print("REFERENCE VERIFICATION ERRORS :", verification_error_count)


# ============================================================================
# 12. RESULTAT ATTENDU
# ============================================================================

print("\n" + "=" * 80)
print("RESULTAT ATTENDU")
print("=" * 80)

print("Au minimum :")
print("- 1 référence vérifiée par Crossref")
print("- 1 référence non trouvée par Crossref")

print("\n" + "=" * 80)
print("TEST TERMINE")
print("=" * 80)