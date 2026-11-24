from core.ai.contracts.capability import (
    AICapability,
    CapabilityType,
)
from core.ai.capabilities.registry import CapabilityRegistry


def register_default_capabilities():
    """
    Enregistre les capacités natives de MACEVO IA.

    Cette fonction est idempotente :
    elle peut être appelée plusieurs fois sans créer
    de doublons problématiques.
    """

    capabilities = [
        AICapability(
            name="text",
            capability_type=CapabilityType.TEXT,
            description="Compréhension et génération de texte.",
            supported_operations=[
                "generate",
                "rewrite",
                "summarize",
                "answer",
            ],
        ),

        AICapability(
            name="analysis",
            capability_type=CapabilityType.ANALYSIS,
            description="Analyse et interprétation de contenus complexes.",
            supported_operations=[
                "analyze",
                "compare",
                "extract",
                "classify",
            ],
        ),

        AICapability(
            name="scientific",
            capability_type=CapabilityType.SCIENTIFIC,
            description="Raisonnement et génération scientifique.",
            supported_operations=[
                "research",
                "explain",
                "generate",
                "structure",
            ],
        ),

        AICapability(
            name="document",
            capability_type=CapabilityType.DOCUMENT,
            description="Analyse, transformation et génération de documents.",
            supported_operations=[
                "analyze",
                "create",
                "modify",
                "structure",
            ],
        ),

        AICapability(
            name="math",
            capability_type=CapabilityType.MATH,
            description="Calcul et raisonnement mathématique.",
            supported_operations=[
                "calculate",
                "solve",
                "derive",
                "verify",
            ],
        ),

        AICapability(
            name="equation",
            capability_type=CapabilityType.EQUATION,
            description="Création, analyse et validation d'équations.",
            supported_operations=[
                "generate",
                "convert",
                "explain",
                "verify",
            ],
        ),

        AICapability(
            name="figure",
            capability_type=CapabilityType.FIGURE,
            description="Création et gestion de figures scientifiques.",
            supported_operations=[
                "generate",
                "describe",
                "insert",
                "caption",
            ],
        ),

        AICapability(
            name="table",
            capability_type=CapabilityType.TABLE,
            description="Création et structuration de tableaux.",
            supported_operations=[
                "generate",
                "format",
                "analyze",
                "convert",
            ],
        ),

        AICapability(
            name="latex",
            capability_type=CapabilityType.LATEX,
            description="Génération et transformation de code LaTeX.",
            supported_operations=[
                "generate",
                "convert",
                "format",
                "validate",
            ],
        ),

        AICapability(
            name="bibliography",
            capability_type=CapabilityType.BIBLIOGRAPHY,
            description="Gestion des références et bibliographies scientifiques.",
            supported_operations=[
                "generate",
                "format",
                "convert",
                "validate",
            ],
        ),

        AICapability(
            name="code",
            capability_type=CapabilityType.CODE,
            description="Génération, analyse et transformation de code.",
            supported_operations=[
                "generate",
                "analyze",
                "debug",
                "refactor",
            ],
        ),

        AICapability(
            name="vision",
            capability_type=CapabilityType.VISION,
            description="Analyse et compréhension de contenus visuels.",
            supported_operations=[
                "analyze",
                "describe",
                "extract",
            ],
        ),

        AICapability(
            name="validation",
            capability_type=CapabilityType.VALIDATION,
            description="Validation de cohérence et de qualité des résultats.",
            supported_operations=[
                "validate",
                "verify",
                "check",
                "audit",
            ],
        ),
    ]

    for capability in capabilities:
        CapabilityRegistry.register(capability)

    return capabilities