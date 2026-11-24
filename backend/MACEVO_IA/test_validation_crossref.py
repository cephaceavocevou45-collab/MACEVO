import os

# ============================================================================
# CONFIGURATION DJANGO
# ============================================================================

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()


# ============================================================================
# IMPORTS MACEVO
# ============================================================================

from core.document.engine import DocumentEngine
from core.validation.engine import ValidationEngine
from core.verification import create_reference_verification_engine


# ============================================================================
# CONSTANTES
# ============================================================================

VALID_DOI = "10.1038/s41586-021-03819-2"

NOT_FOUND_DOI = "10.9999/DOI-QUI-NEXISTE-PAS-MACEVO"

MISMATCH_DOI = "10.1038/s41586-020-2649-2"


# ============================================================================
# OUTILS
# ============================================================================

def create_document_with_reference(
    *,
    title,
    authors,
    year,
    journal,
    publisher,
    doi,
    citation_key,
):
    """
    Crée un document MACEVO contenant une seule référence.
    """

    document_engine = DocumentEngine()

    document = document_engine.create(
        title="Document scientifique de test",
        author="MACEVO",
        language="fr",
        document_type="article",
    )

    document_engine.add_section(
        document,
        title="Introduction",
        level=1,
    )

    reference = document_engine.add_reference(
        document,
        title=title,
        authors=authors,
        year=year,
        journal=journal,
        publisher=publisher,
        doi=doi,
        url=f"https://doi.org/{doi}",
        citation_key=citation_key,
        metadata={
            "source": "integration_test",
            "requires_verification": True,
            "verified": False,
        },
    )

    return document, reference


def print_result(title, result, reference):
    """
    Affiche le résultat complet d'une validation.
    """

    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)

    print("\nRESULTAT")
    print("VALID :", result.valid)
    print("ERRORS :", len(result.errors))
    print("WARNINGS :", len(result.warnings))

    for issue in result.issues:
        print(
            f"[{issue.severity.upper()}] "
            f"{issue.code} | "
            f"{issue.message}"
        )

        if issue.metadata:
            print(
                "  METADATA :",
                issue.metadata,
            )

    print("\nVALIDATION METADATA")

    for key, value in result.metadata.items():
        print(
            f"{key} : {value}"
        )

    print("\nREFERENCE METADATA")

    for key, value in reference.metadata.items():
        print(
            f"{key} : {value}"
        )


# ============================================================================
# INITIALISATION
# ============================================================================

print("=" * 80)
print("TEST COMPLET D'INTEGRATION VALIDATION + CROSSREF")
print("=" * 80)

verification_engine = create_reference_verification_engine()

print("\nPROVIDERS DISPONIBLES")
print(
    verification_engine.list_providers()
)

validator = ValidationEngine(
    verification_engine=verification_engine,
)


# ============================================================================
# TEST 1 — REFERENCE CORRECTE
# ============================================================================

document, reference = create_document_with_reference(
    title="Highly accurate protein structure prediction with AlphaFold",
    authors=[],
    year=2021,
    journal="Nature",
    publisher="Springer Nature",
    doi=VALID_DOI,
    citation_key="Jumper2021",
)

result = validator.validate_with_reference_verification(
    document
)

print_result(
    "TEST 1 — DOI VALIDE / REFERENCE CORRECTE",
    result,
    reference,
)

status_1 = reference.metadata.get(
    "verification_status"
)

verified_1 = reference.metadata.get(
    "verified"
)

external_1 = result.metadata.get(
    "references_verified_externally"
)

print("\nVERIFICATIONS TEST 1")

print(
    "verification_status == 'verified' :",
    status_1 == "verified",
)

print(
    "verified == True :",
    verified_1 is True,
)

print(
    "references_verified_externally == 1 :",
    external_1 == 1,
)


test_1_success = (
    status_1 == "verified"
    and verified_1 is True
    and external_1 == 1
)


# ============================================================================
# TEST 2 — DOI INTROUVABLE
# ============================================================================

document, reference = create_document_with_reference(
    title="Référence inexistante dans Crossref",
    authors=["MACEVO Test"],
    year=2026,
    journal="Journal inexistant",
    publisher="MACEVO",
    doi=NOT_FOUND_DOI,
    citation_key="NotFound2026",
)

result = validator.validate_with_reference_verification(
    document
)

print_result(
    "TEST 2 — DOI INTROUVABLE",
    result,
    reference,
)

status_2 = reference.metadata.get(
    "verification_status"
)

verified_2 = reference.metadata.get(
    "verified"
)

not_found_2 = result.metadata.get(
    "references_not_found"
)

print("\nVERIFICATIONS TEST 2")

print(
    "verification_status == 'not_found' :",
    status_2 == "not_found",
)

print(
    "verified == False :",
    verified_2 is False,
)

print(
    "references_not_found == 1 :",
    not_found_2 == 1,
)


test_2_success = (
    status_2 == "not_found"
    and verified_2 is False
    and not_found_2 == 1
)


# ============================================================================
# TEST 3 — DOI VALIDE MAIS METADONNEES INCORRECTES
# ============================================================================

document, reference = create_document_with_reference(
    title="Array programming with NumPy",
    authors=[
        "Mauve",
        "Fictional Author",
    ],
    year=2020,
    journal="Fictional Journal",
    publisher="Fictional Publisher",
    doi=MISMATCH_DOI,
    citation_key="Mismatch2020",
)

result = validator.validate_with_reference_verification(
    document
)

print_result(
    "TEST 3 — DOI VALIDE MAIS REFERENCE INCOHERENTE",
    result,
    reference,
)

status_3 = reference.metadata.get(
    "verification_status"
)

verified_3 = reference.metadata.get(
    "verified"
)

mismatch_3 = result.metadata.get(
    "references_with_mismatch"
)

print("\nVERIFICATIONS TEST 3")

print(
    "verification_status == 'mismatch' :",
    status_3 == "mismatch",
)

print(
    "verified == False :",
    verified_3 is False,
)

print(
    "references_with_mismatch == 1 :",
    mismatch_3 == 1,
)


test_3_success = (
    status_3 == "mismatch"
    and verified_3 is False
    and mismatch_3 == 1
)


# ============================================================================
# RESULTAT FINAL
# ============================================================================

print("\n" + "=" * 80)
print("RESULTAT FINAL DES TESTS")
print("=" * 80)

print(
    "TEST 1 — VERIFIED :",
    test_1_success,
)

print(
    "TEST 2 — NOT_FOUND :",
    test_2_success,
)

print(
    "TEST 3 — MISMATCH :",
    test_3_success,
)


all_success = (
    test_1_success
    and test_2_success
    and test_3_success
)


print("\n" + "=" * 80)

if all_success:
    print(
        "TOUS LES TESTS CROSSREF SONT REUSSIS"
    )
else:
    print(
        "AU MOINS UN TEST CROSSREF A ECHOUE"
    )

print("=" * 80)