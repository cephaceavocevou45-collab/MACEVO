from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

from core.document.ir import Reference
from core.verification.reference import (
    ReferenceVerificationRequest,
    ReferenceVerificationResult,
    ReferenceVerificationStatus,
)


@dataclass
class ReferenceVerificationProvider:
    """
    Contrat minimal d'un fournisseur de vérification.
    """

    name: str

    def verify(
        self,
        request: ReferenceVerificationRequest,
    ) -> ReferenceVerificationResult:
        raise NotImplementedError(
            "Le fournisseur doit implémenter verify()."
        )


class ReferenceVerificationEngine:
    """
    Moteur central de vérification bibliographique.
    """

    DEFAULT_PROVIDER = "crossref"

    def __init__(
        self,
        providers: Optional[
            Dict[str, ReferenceVerificationProvider]
        ] = None,
    ):
        self.providers: Dict[
            str,
            ReferenceVerificationProvider,
        ] = {}

        if providers:
            for provider in providers.values():
                self.register_provider(provider)

    # ------------------------------------------------------------------
    # FOURNISSEURS
    # ------------------------------------------------------------------

    def register_provider(
        self,
        provider: ReferenceVerificationProvider,
    ) -> None:

        if not isinstance(
            provider,
            ReferenceVerificationProvider,
        ):
            raise TypeError(
                "provider doit être une instance de "
                "ReferenceVerificationProvider."
            )

        name = provider.name.strip()

        if not name:
            raise ValueError(
                "Le nom du fournisseur ne peut pas être vide."
            )

        self.providers[name] = provider

    def unregister_provider(
        self,
        name: str,
    ) -> None:

        self.providers.pop(
            name,
            None,
        )

    def get_provider(
        self,
        name: Optional[str] = None,
    ) -> Optional[ReferenceVerificationProvider]:

        provider_name = (
            name
            or self.DEFAULT_PROVIDER
        )

        return self.providers.get(
            provider_name
        )

    def list_providers(self) -> list[str]:
        return sorted(
            self.providers.keys()
        )

    # ------------------------------------------------------------------
    # NORMALISATION
    # ------------------------------------------------------------------

    def build_request(
        self,
        reference: Reference,
    ) -> ReferenceVerificationRequest:

        if not isinstance(
            reference,
            Reference,
        ):
            raise TypeError(
                "reference doit être une instance de Reference."
            )

        return ReferenceVerificationRequest(
            reference_id=reference.id,
            title=reference.title.strip(),
            authors=[
                author.strip()
                for author in reference.authors
                if isinstance(author, str)
                and author.strip()
            ],
            year=reference.year,
            journal=(
                reference.journal.strip()
                if isinstance(reference.journal, str)
                and reference.journal.strip()
                else None
            ),
            publisher=(
                reference.publisher.strip()
                if isinstance(reference.publisher, str)
                and reference.publisher.strip()
                else None
            ),
            doi=(
                reference.doi.strip()
                if isinstance(reference.doi, str)
                and reference.doi.strip()
                else None
            ),
            url=(
                reference.url.strip()
                if isinstance(reference.url, str)
                and reference.url.strip()
                else None
            ),
            metadata=dict(
                reference.metadata or {}
            ),
        )

    # ------------------------------------------------------------------
    # VERIFICATION
    # ------------------------------------------------------------------

    def verify(
        self,
        reference: Reference,
        *,
        provider: Optional[str] = None,
    ) -> ReferenceVerificationResult:

        request = self.build_request(
            reference
        )

        provider_name = (
            provider
            or reference.metadata.get(
                "verification_provider"
            )
            or self.DEFAULT_PROVIDER
        )

        verification_provider = self.get_provider(
            provider_name
        )

        if verification_provider is None:
            result = self._build_pending_result(
                request=request,
                provider=provider_name,
            )

            self.apply_result(
                reference,
                result,
            )

            return result

        try:
            result = verification_provider.verify(
                request
            )

        except Exception as exc:
            result = ReferenceVerificationResult(
                reference_id=reference.id,
                status=ReferenceVerificationStatus.ERROR,
                verified=False,
                provider=provider_name,
                message=(
                    "Une erreur est survenue pendant "
                    "la vérification de la référence."
                ),
                metadata={
                    "error_type": type(exc).__name__,
                    "error": str(exc),
                },
            )

        self.apply_result(
            reference,
            result,
        )

        return result

    # ------------------------------------------------------------------
    # RESULTAT EN ATTENTE
    # ------------------------------------------------------------------

    def _build_pending_result(
        self,
        *,
        request: ReferenceVerificationRequest,
        provider: str,
    ) -> ReferenceVerificationResult:

        return ReferenceVerificationResult(
            reference_id=request.reference_id,
            status=ReferenceVerificationStatus.PENDING,
            verified=False,
            provider=provider,
            message=(
                "Aucun fournisseur de vérification "
                "disponible pour cette référence."
            ),
            metadata={
                "verification_requested": True,
                "provider_available": False,
            },
        )

    # ------------------------------------------------------------------
    # APPLICATION A LA REFERENCE
    # ------------------------------------------------------------------

    def apply_result(
        self,
        reference: Reference,
        result: ReferenceVerificationResult,
    ) -> Reference:

        if not isinstance(
            reference,
            Reference,
        ):
            raise TypeError(
                "reference doit être une instance de Reference."
            )

        if not isinstance(
            result,
            ReferenceVerificationResult,
        ):
            raise TypeError(
                "result doit être une instance de "
                "ReferenceVerificationResult."
            )

        metadata = dict(
            reference.metadata or {}
        )

        metadata.update(
            {
                "verified": result.verified,
                "requires_verification": not result.verified,
                "verification_status": result.status.value,
                "verification_provider": result.provider,
                "verification_checked_at": (
                    result.checked_at.isoformat()
                ),
            }
        )

        if result.confidence is not None:
            metadata[
                "verification_confidence"
            ] = result.confidence

        if result.matched_metadata:
            metadata[
                "verification_matched_metadata"
            ] = dict(
                result.matched_metadata
            )

        if result.differences:
            metadata[
                "verification_differences"
            ] = dict(
                result.differences
            )

        if result.message:
            metadata[
                "verification_message"
            ] = result.message

        metadata[
            "verification_details"
        ] = result.to_dict()

        reference.metadata = metadata

        return reference

    # ------------------------------------------------------------------
    # VALIDATION LOCALE
    # ------------------------------------------------------------------

    def validate_input(
        self,
        reference: Reference,
    ) -> ReferenceVerificationResult:

        request = self.build_request(
            reference
        )

        if not request.title:
            return ReferenceVerificationResult(
                reference_id=reference.id,
                status=ReferenceVerificationStatus.INVALID,
                verified=False,
                provider=self.DEFAULT_PROVIDER,
                message=(
                    "La référence ne possède pas de titre."
                ),
                metadata={
                    "validation": "input",
                },
            )

        if not request.authors:
            return ReferenceVerificationResult(
                reference_id=reference.id,
                status=ReferenceVerificationStatus.INVALID,
                verified=False,
                provider=self.DEFAULT_PROVIDER,
                message=(
                    "La référence ne possède aucun auteur."
                ),
                metadata={
                    "validation": "input",
                },
            )

        return ReferenceVerificationResult(
            reference_id=reference.id,
            status=ReferenceVerificationStatus.PENDING,
            verified=False,
            provider=self.DEFAULT_PROVIDER,
            message=(
                "Les données bibliographiques minimales "
                "sont présentes. Une vérification externe "
                "reste nécessaire."
            ),
            metadata={
                "validation": "input",
                "ready_for_external_verification": True,
            },
        )