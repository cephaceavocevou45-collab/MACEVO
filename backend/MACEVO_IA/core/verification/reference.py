from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


class ReferenceVerificationStatus(str, Enum):
    """
    États possibles d'une vérification bibliographique.
    """

    PENDING = "pending"
    VERIFIED = "verified"
    NOT_FOUND = "not_found"
    MISMATCH = "mismatch"
    INVALID = "invalid"
    ERROR = "error"


@dataclass
class ReferenceVerificationResult:
    """
    Résultat normalisé d'une vérification bibliographique.

    Ce modèle est indépendant de la source utilisée pour effectuer
    la vérification : DOI, Crossref, autre service scientifique, etc.
    """

    reference_id: str
    status: ReferenceVerificationStatus

    verified: bool = False

    confidence: Optional[float] = None

    provider: Optional[str] = None

    matched_metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    differences: Dict[str, Any] = field(
        default_factory=dict
    )

    message: str = ""

    checked_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    @property
    def requires_verification(self) -> bool:
        return not self.verified

    @property
    def successful(self) -> bool:
        return self.status == ReferenceVerificationStatus.VERIFIED

    @property
    def failed(self) -> bool:
        return self.status in {
            ReferenceVerificationStatus.INVALID,
            ReferenceVerificationStatus.ERROR,
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "reference_id": self.reference_id,
            "status": self.status.value,
            "verified": self.verified,
            "confidence": self.confidence,
            "provider": self.provider,
            "matched_metadata": self.matched_metadata,
            "differences": self.differences,
            "message": self.message,
            "checked_at": self.checked_at.isoformat(),
            "metadata": self.metadata,
        }


@dataclass
class ReferenceVerificationRequest:
    """
    Requête normalisée adressée au moteur de vérification.
    """

    reference_id: str

    title: str = ""

    authors: List[str] = field(
        default_factory=list
    )

    year: Optional[int] = None

    journal: Optional[str] = None

    publisher: Optional[str] = None

    doi: Optional[str] = None

    url: Optional[str] = None

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "reference_id": self.reference_id,
            "title": self.title,
            "authors": list(self.authors),
            "year": self.year,
            "journal": self.journal,
            "publisher": self.publisher,
            "doi": self.doi,
            "url": self.url,
            "metadata": dict(self.metadata),
        }