import django

django.setup()

from core.document.engine import DocumentEngine
from core.validation.engine import ValidationEngine
from core.verification import create_reference_verification_engine


DOI = "10.1038/s41586-021-03819-2"


print("=" * 80)
print("TEST D'INTEGRATION VALIDATION + CROSSREF")
print("=" * 80)


# ----------------------------------------------------------------------
# 1. Création du document
# ----------------------------------------------------------------------

document_engine = DocumentEngine()

document = document_engine.create_document(
    title="Document scientifique de test",
    author="MACEVO",
    language="fr",
    document_type="article",
)

print("\nDOCUMENT")
print("ID :", document.id)


# ----------------------------------------------------------------------
# 2. Création d'une section
# ----------------------------------------------------------------------

section = document_engine.add_section(
    document,
    title="Introduction",
    level=1,
)

print("\nSECTION")
print("ID :", section.id)


# ----------------------------------------------------------------------
# 3. Ajout d'une référence réelle
# ----------------------------------------------------------------------

reference = document_engine.add_reference(
    document,
    title="Highly accurate protein structure prediction with AlphaFold",
    authors=[],
    year=2021,
    journal="Nature",
    publisher="Springer Nature",
    doi=DOI,
    url="https://doi.org/10.1038/s41586-021-03819-2",
    citation_key="Jumper2021",
    metadata={
        "source": "integration_test",
        "requires_verification": True,
        "verified": False,
    },
)

print("\nREFERENCE")
print("ID :", reference.id)
print("DOI :", reference.doi)


# ----------------------------------------------------------------------
# 4. Création du moteur Crossref
# ----------------------------------------------------------------------

verification_engine = create_reference_verification_engine()

print("\nVERIFICATION ENGINE")
print(
    "PROVIDERS :",
    verification_engine.list_providers(),
)


# ----------------------------------------------------------------------
# 5. Création du ValidationEngine
# ----------------------------------------------------------------------

validator = ValidationEngine(
    verification_engine=verification_engine,
)


# ----------------------------------------------------------------------
# 6. Validation + vérification externe
# ----------------------------------------------------------------------

result = validator.validate_with_reference_verification(
    document,
)


# ----------------------------------------------------------------------
# 7. Résultat
# ----------------------------------------------------------------------

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


# ----------------------------------------------------------------------
# 8. Métadonnées de validation
# ----------------------------------------------------------------------

print("\nVALIDATION METADATA")

for key, value in result.metadata.items():
    print(
        f"{key} : {value}"
    )


# ----------------------------------------------------------------------
# 9. Métadonnées de la référence après Crossref
# ----------------------------------------------------------------------

print("\nREFERENCE METADATA APRES VERIFICATION")

for key, value in reference.metadata.items():
    print(
        f"{key} : {value}"
    )


# ----------------------------------------------------------------------
# 10. Vérifications automatiques
# ----------------------------------------------------------------------

print("\nVERIFICATIONS AUTOMATIQUES")

verification_status = reference.metadata.get(
    "verification_status"
)

verified = reference.metadata.get(
    "verified"
)

externally_verified = result.metadata.get(
    "references_verified_externally",
)


print(
    "verification_status == 'verified' :",
    verification_status == "verified",
)

print(
    "verified == True :",
    verified is True,
)

print(
    "references_verified_externally == 1 :",
    externally_verified == 1,
)


# ----------------------------------------------------------------------
# 11. Conclusion technique
# ----------------------------------------------------------------------

success = (
    verification_status == "verified"
    and verified is True
    and externally_verified == 1
)


print("\n" + "=" * 80)

if success:
    print(
        "TEST D'INTEGRATION REUSSI"
    )
else:
    print(
        "TEST D'INTEGRATION ECHOUE"
    )

print("=" * 80)