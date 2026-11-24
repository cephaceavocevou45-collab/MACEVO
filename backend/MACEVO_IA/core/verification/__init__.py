from core.verification.engine import (
    ReferenceVerificationEngine,
    ReferenceVerificationProvider,
)

from core.verification.reference import (
    ReferenceVerificationRequest,
    ReferenceVerificationResult,
    ReferenceVerificationStatus,
)

from core.verification.providers import (
    CrossrefProvider,
)


def create_reference_verification_engine(
    *,
    crossref_mailto=None,
    timeout=10,
):
    """
    Crée le moteur MACEVO avec les fournisseurs
    officiellement disponibles.
    """

    engine = ReferenceVerificationEngine()

    engine.register_provider(
        CrossrefProvider(
            mailto=crossref_mailto,
            timeout=timeout,
        )
    )

    return engine


__all__ = [
    "ReferenceVerificationEngine",
    "ReferenceVerificationProvider",
    "ReferenceVerificationRequest",
    "ReferenceVerificationResult",
    "ReferenceVerificationStatus",
    "CrossrefProvider",
    "create_reference_verification_engine",
]