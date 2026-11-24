import os

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()

from core.document.engine import DocumentEngine
from core.verification import create_reference_verification_engine


document_engine = DocumentEngine()

document = document_engine.create(
    title="Test Crossref MACEVO - Verification positive",
    author="MACEVO",
)

reference = document_engine.add_reference(
    document=document,
    title="Highly accurate protein structure prediction with AlphaFold",
    authors=[],
    year=2021,
    journal="Nature",
    doi="10.1038/s41586-021-03819-2",
    url="https://doi.org/10.1038/s41586-021-03819-2",
    citation_key="Jumper2021",
    metadata={
        "source": "test_crossref_positive",
        "requires_verification": True,
        "verified": False,
    },
)

engine = create_reference_verification_engine()

print()
print("=" * 80)
print("TEST CROSSREF - VERIFICATION POSITIVE")
print("=" * 80)

print()
print("FOURNISSEURS :", engine.list_providers())

print()
print("REFERENCE AVANT VERIFICATION :")
print(reference.to_dict())

print()
print("VERIFICATION EN COURS...")

result = engine.verify(reference)

print()
print("STATUS     :", result.status.value)
print("VERIFIED   :", result.verified)
print("CONFIDENCE :", result.confidence)
print("PROVIDER   :", result.provider)
print("MESSAGE    :", result.message)

print()
print("METADONNEES RETROUVEES :")

for key, value in result.matched_metadata.items():
    print(f"  {key}: {value}")

print()
print("DIFFERENCES :")

if result.differences:
    for key, value in result.differences.items():
        print(f"  {key}: {value}")
else:
    print("  Aucune différence détectée.")

print()
print("METADATA REFERENCE APRES VERIFICATION :")

for key, value in reference.metadata.items():
    print(f"  {key}: {value}")

print()
print("=" * 80)
print("TEST TERMINE")
print("=" * 80)
