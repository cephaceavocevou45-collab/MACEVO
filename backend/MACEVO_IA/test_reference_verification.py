import os

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()

from core.document.engine import DocumentEngine
from core.verification import (
    ReferenceVerificationEngine,
    ReferenceVerificationStatus,
)


document_engine = DocumentEngine()

document = document_engine.create(
    title="Test vérification bibliographique",
    author="MACEVO",
)

reference = document_engine.add_reference(
    document=document,
    title="Article scientifique de test",
    authors=["Auteur Test"],
    year=2025,
    journal="Journal scientifique",
    publisher="Éditeur scientifique",
    doi="10.1234/test",
    url="https://example.org/article",
    citation_key="Auteur2025",
)

engine = ReferenceVerificationEngine()

request = engine.build_request(reference)

print()
print("=" * 80)
print("TEST DU MOTEUR DE VERIFICATION BIBLIOGRAPHIQUE")
print("=" * 80)

print()
print("REFERENCE :")
print(request.to_dict())

print()
print("FOURNISSEURS DISPONIBLES :")
print(engine.list_providers())

print()
print("VALIDATION LOCALE :")

result = engine.validate_input(reference)

print("STATUS :", result.status.value)
print("VERIFIED :", result.verified)
print("MESSAGE :", result.message)

print()
print("VERIFICATION EXTERNE :")

result = engine.verify(reference)

print("STATUS :", result.status.value)
print("VERIFIED :", result.verified)
print("PROVIDER :", result.provider)
print("MESSAGE :", result.message)

print()
print("METADATA DE LA REFERENCE :")
print(reference.metadata)

print()
print("=" * 80)
print("TEST TERMINE")
print("=" * 80)
