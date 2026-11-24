import os

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()

from core.document.engine import DocumentEngine
from core.validation.engine import ValidationEngine


document_engine = DocumentEngine()

document = document_engine.create(
    title="Test référence invalide",
    author="MACEVO",
)

section = document_engine.add_section(
    document=document,
    title="Introduction",
)

document_engine.add_paragraph(
    target=section,
    content=(
        "Paragraphe de test pour la validation "
        "d'une référence explicitement invalide."
    ),
)

reference = document_engine.add_reference(
    document=document,
    title="Référence explicitement invalide",
    authors=["Auteur Test"],
)

reference.metadata.update(
    {
        "generated_by": "MACEVO IA",
        "source": "ai_generation",
        "verified": False,
        "requires_verification": True,
        "verification_status": "invalid",
    }
)


validation_engine = ValidationEngine()

result = validation_engine.validate(document)


print()
print("=" * 80)
print("TEST REFERENCE EXPLICITEMENT INVALIDE")
print("=" * 80)

print("VALID :", result.valid)
print("ERRORS :", len(result.errors))
print("WARNINGS :", len(result.warnings))

print()

for issue in result.issues:
    print(
        f"[{issue.severity.upper()}] "
        f"{issue.code} | "
        f"{issue.message}"
    )

    if issue.metadata:
        print("  METADATA :", issue.metadata)

print()
print("VALIDATION METADATA :")
print(result.metadata)

print()
print("=" * 80)
print("TEST TERMINE")
print("=" * 80)
