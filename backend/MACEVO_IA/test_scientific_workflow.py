import os

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()


from core.ai.contracts.message import AIMessage, MessageRole
from core.ai.contracts.request import AIRequest
from core.scientific.generation import ScientificGenerationEngine
from core.document.engine import DocumentEngine


request = AIRequest(
    messages=[
        AIMessage(
            role=MessageRole.USER,
            content=(
                "Générer le contenu scientifique de la section "
                "Introduction d'un rapport sur l'intelligence artificielle."
            ),
        )
    ],
    metadata={
        "capability_input": (
            "Générer le contenu scientifique de la section "
            "Introduction d'un rapport scientifique."
        )
    },
)


document_engine = DocumentEngine()

document = document_engine.create(
    title="Rapport scientifique sur l'intelligence artificielle",
    author="MACEVO",
)

section = document_engine.add_section(
    document=document,
    title="Introduction",
)


engine = ScientificGenerationEngine()

result = engine.generate_section(
    document=document,
    section=section,
    topic="Intelligence artificielle",
    instructions=(
        "Rédiger une introduction scientifique de niveau universitaire. "
        "Présenter le contexte général, la problématique et les enjeux "
        "scientifiques. Ne pas inventer de références bibliographiques."
    ),
    context=(
        "Cette section présente le contexte général, "
        "la problématique et les enjeux scientifiques."
    ),
)


print()
print("=" * 80)
print("RESULTAT DU WORKFLOW SCIENTIFIQUE")
print("=" * 80)

print("STATUS :", result.status)
print("SUCCESS :", result.success)
print("MESSAGE :", result.message)
print("ERRORS :", result.errors)
print("WARNINGS :", result.warnings)

print()

data = result.data

if isinstance(data, dict):
    print("DATA KEYS :", list(data.keys()))

    document_result = data.get("document")

    if document_result is not None:
        print("DOCUMENT :", type(document_result).__name__)

    paragraph = data.get("paragraph")

    if paragraph is not None:
        print("PARAGRAPHE :", type(paragraph).__name__)

        content = getattr(
            paragraph,
            "content",
            None,
        )

        if content:
            print()
            print("CONTENU GENERE :")
            print(content)

print()
print("=" * 80)
print("TEST TERMINE")
print("=" * 80)
