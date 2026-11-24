from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

import requests

from core.verification.engine import ReferenceVerificationProvider
from core.verification.reference import (
    ReferenceVerificationRequest,
    ReferenceVerificationResult,
    ReferenceVerificationStatus,
)


class CrossrefProvider(ReferenceVerificationProvider):
    """
    Fournisseur de vérification bibliographique basé sur Crossref.

    La vérification peut être effectuée principalement à partir
    d'un DOI. Les métadonnées retournées par Crossref sont ensuite
    comparées aux données présentes dans MACEVO.
    """

    API_BASE_URL = "https://api.crossref.org/works"

    DEFAULT_TIMEOUT = 10

    def __init__(
        self,
        *,
        mailto: Optional[str] = None,
        timeout: int = DEFAULT_TIMEOUT,
        user_agent: str = "MACEVO/1.0",
    ):
        super().__init__(
            name="crossref"
        )

        self.mailto = mailto
        self.timeout = timeout
        self.user_agent = user_agent

    # ------------------------------------------------------------------
    # VERIFICATION PRINCIPALE
    # ------------------------------------------------------------------

    def verify(
        self,
        request: ReferenceVerificationRequest,
    ) -> ReferenceVerificationResult:

        if not request.doi:
            return ReferenceVerificationResult(
                reference_id=request.reference_id,
                status=ReferenceVerificationStatus.PENDING,
                verified=False,
                provider=self.name,
                message=(
                    "Aucun DOI n'est disponible pour cette référence. "
                    "Une recherche bibliographique sera nécessaire."
                ),
                metadata={
                    "verification_method": "doi",
                    "doi_available": False,
                },
            )

        doi = self._normalize_doi(
            request.doi
        )

        if not doi:
            return ReferenceVerificationResult(
                reference_id=request.reference_id,
                status=ReferenceVerificationStatus.INVALID,
                verified=False,
                provider=self.name,
                message="Le DOI fourni est invalide.",
                metadata={
                    "verification_method": "doi",
                    "doi": request.doi,
                },
            )

        try:
            response = self._request_doi(
                doi
            )
        except requests.Timeout:
            return ReferenceVerificationResult(
                reference_id=request.reference_id,
                status=ReferenceVerificationStatus.ERROR,
                verified=False,
                provider=self.name,
                message=(
                    "Le service Crossref n'a pas répondu "
                    "dans le délai imparti."
                ),
                metadata={
                    "error_type": "timeout",
                    "doi": doi,
                },
            )
        except requests.RequestException as exc:
            return ReferenceVerificationResult(
                reference_id=request.reference_id,
                status=ReferenceVerificationStatus.ERROR,
                verified=False,
                provider=self.name,
                message=(
                    "Impossible de contacter le service Crossref."
                ),
                metadata={
                    "error_type": type(exc).__name__,
                    "error": str(exc),
                    "doi": doi,
                },
            )

        if response.status_code == 404:
            return ReferenceVerificationResult(
                reference_id=request.reference_id,
                status=ReferenceVerificationStatus.NOT_FOUND,
                verified=False,
                provider=self.name,
                message=(
                    "Le DOI n'a pas été trouvé dans Crossref."
                ),
                metadata={
                    "verification_method": "doi",
                    "doi": doi,
                    "http_status": 404,
                },
            )

        if not response.ok:
            return ReferenceVerificationResult(
                reference_id=request.reference_id,
                status=ReferenceVerificationStatus.ERROR,
                verified=False,
                provider=self.name,
                message=(
                    "Crossref a retourné une erreur "
                    f"HTTP {response.status_code}."
                ),
                metadata={
                    "verification_method": "doi",
                    "doi": doi,
                    "http_status": response.status_code,
                },
            )

        try:
            payload = response.json()
        except ValueError:
            return ReferenceVerificationResult(
                reference_id=request.reference_id,
                status=ReferenceVerificationStatus.ERROR,
                verified=False,
                provider=self.name,
                message=(
                    "La réponse de Crossref n'est pas "
                    "un JSON valide."
                ),
                metadata={
                    "verification_method": "doi",
                    "doi": doi,
                },
            )

        item = (
            payload
            .get("message", {})
        )

        if not isinstance(item, dict) or not item:
            return ReferenceVerificationResult(
                reference_id=request.reference_id,
                status=ReferenceVerificationStatus.NOT_FOUND,
                verified=False,
                provider=self.name,
                message=(
                    "Crossref n'a retourné aucune "
                    "métadonnée exploitable."
                ),
                metadata={
                    "verification_method": "doi",
                    "doi": doi,
                },
            )

        matched_metadata = self._extract_metadata(
            item
        )

        differences = self._compare_metadata(
            request,
            matched_metadata,
        )

        confidence = self._calculate_confidence(
            request,
            matched_metadata,
            differences,
        )

        verified = (
            self._doi_matches(
                doi,
                matched_metadata.get("doi"),
            )
            and confidence >= 0.80
            and not differences.get("critical")
        )

        if verified:
            status = (
                ReferenceVerificationStatus.VERIFIED
            )

            message = (
                "La référence a été vérifiée "
                "avec succès par Crossref."
            )

        else:
            status = (
                ReferenceVerificationStatus.MISMATCH
            )

            message = (
                "Le DOI existe dans Crossref, mais "
                "certaines métadonnées ne correspondent "
                "pas suffisamment à la référence fournie."
            )

        return ReferenceVerificationResult(
            reference_id=request.reference_id,
            status=status,
            verified=verified,
            confidence=confidence,
            provider=self.name,
            matched_metadata=matched_metadata,
            differences=differences,
            message=message,
            metadata={
                "verification_method": "doi",
                "doi": doi,
                "crossref_type": item.get("type"),
                "crossref_created": item.get(
                    "created"
                ),
                "http_status": response.status_code,
            },
        )

    # ------------------------------------------------------------------
    # HTTP
    # ------------------------------------------------------------------

    def _request_doi(
        self,
        doi: str,
    ) -> requests.Response:

        url = (
            f"{self.API_BASE_URL}/"
            f"{requests.utils.quote(doi, safe='')}"
        )

        headers = {
            "Accept": "application/json",
            "User-Agent": self.user_agent,
        }

        params = {}

        if self.mailto:
            params["mailto"] = self.mailto

        return requests.get(
            url,
            headers=headers,
            params=params,
            timeout=self.timeout,
        )

    # ------------------------------------------------------------------
    # DOI
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_doi(
        doi: Optional[str],
    ) -> Optional[str]:

        if not doi:
            return None

        value = doi.strip()

        value = re.sub(
            r"^https?://doi\.org/",
            "",
            value,
            flags=re.IGNORECASE,
        )

        value = re.sub(
            r"^doi:\s*",
            "",
            value,
            flags=re.IGNORECASE,
        )

        value = value.strip()

        if not value:
            return None

        if not re.match(
            r"^10\.\d{4,9}/\S+$",
            value,
            flags=re.IGNORECASE,
        ):
            return None

        return value

    @staticmethod
    def _doi_matches(
        requested_doi: Optional[str],
        returned_doi: Optional[str],
    ) -> bool:

        if not requested_doi or not returned_doi:
            return False

        left = (
            CrossrefProvider._normalize_doi(
                requested_doi
            )
        )

        right = (
            CrossrefProvider._normalize_doi(
                returned_doi
            )
        )

        if not left or not right:
            return False

        return left.lower() == right.lower()

    # ------------------------------------------------------------------
    # EXTRACTION DES METADONNEES
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_metadata(
        item: Dict[str, Any],
    ) -> Dict[str, Any]:

        titles = item.get(
            "title",
            [],
        )

        title = (
            titles[0].strip()
            if titles
            and isinstance(titles[0], str)
            else ""
        )

        authors: List[str] = []

        for author in item.get(
            "author",
            [],
        ):
            if not isinstance(
                author,
                dict,
            ):
                continue

            given = (
                author.get("given")
                or ""
            ).strip()

            family = (
                author.get("family")
                or ""
            ).strip()

            if given and family:
                authors.append(
                    f"{given} {family}"
                )
            elif family:
                authors.append(
                    family
                )
            elif given:
                authors.append(
                    given
                )

        year = CrossrefProvider._extract_year(
            item
        )

        container_titles = item.get(
            "container-title",
            [],
        )

        journal = (
            container_titles[0].strip()
            if container_titles
            and isinstance(
                container_titles[0],
                str,
            )
            else None
        )

        publisher = item.get(
            "publisher"
        )

        publisher = (
            publisher.strip()
            if isinstance(
                publisher,
                str,
            )
            else None
        )

        doi = item.get(
            "DOI"
        )

        doi = (
            doi.strip()
            if isinstance(
                doi,
                str,
            )
            else None
        )

        url = item.get(
            "URL"
        )

        url = (
            url.strip()
            if isinstance(
                url,
                str,
            )
            else None
        )

        return {
            "title": title,
            "authors": authors,
            "year": year,
            "journal": journal,
            "publisher": publisher,
            "doi": doi,
            "url": url,
        }

    @staticmethod
    def _extract_year(
        item: Dict[str, Any],
    ) -> Optional[int]:

        for field in (
            "published-print",
            "published-online",
            "published",
            "issued",
            "created",
        ):
            value = item.get(
                field
            )

            if not isinstance(
                value,
                dict,
            ):
                continue

            date_parts = value.get(
                "date-parts"
            )

            if not date_parts:
                continue

            if not isinstance(
                date_parts,
                list,
            ):
                continue

            first = date_parts[0]

            if (
                isinstance(first, list)
                and first
                and isinstance(first[0], int)
            ):
                return first[0]

        return None

    # ------------------------------------------------------------------
    # COMPARAISON
    # ------------------------------------------------------------------

    def _compare_metadata(
        self,
        request: ReferenceVerificationRequest,
        matched: Dict[str, Any],
    ) -> Dict[str, Any]:

        differences: Dict[str, Any] = {}
        critical: List[str] = []

        # --------------------------------------------------------------
        # TITRE
        # --------------------------------------------------------------

        if request.title and matched.get("title"):
            similarity = self._text_similarity(
                request.title,
                matched["title"],
            )

            if similarity < 0.70:
                differences["title"] = {
                    "provided": request.title,
                    "matched": matched["title"],
                    "similarity": similarity,
                }

                if similarity < 0.40:
                    critical.append(
                        "title"
                    )

        # --------------------------------------------------------------
        # AUTEURS
        # --------------------------------------------------------------

        if request.authors and matched.get("authors"):
            author_similarity = (
                self._authors_similarity(
                    request.authors,
                    matched["authors"],
                )
            )

            if author_similarity < 0.70:
                differences["authors"] = {
                    "provided": request.authors,
                    "matched": matched["authors"],
                    "similarity": author_similarity,
                }

                if author_similarity < 0.40:
                    critical.append(
                        "authors"
                    )

        # --------------------------------------------------------------
        # ANNEE
        # --------------------------------------------------------------

        if (
            request.year
            and matched.get("year")
            and request.year != matched["year"]
        ):
            differences["year"] = {
                "provided": request.year,
                "matched": matched["year"],
            }

            if abs(
                request.year
                - matched["year"]
            ) > 1:
                critical.append(
                    "year"
                )

        # --------------------------------------------------------------
        # JOURNAL
        # --------------------------------------------------------------

        if (
            request.journal
            and matched.get("journal")
        ):
            similarity = self._text_similarity(
                request.journal,
                matched["journal"],
            )

            if similarity < 0.70:
                differences["journal"] = {
                    "provided": request.journal,
                    "matched": matched["journal"],
                    "similarity": similarity,
                }

        # --------------------------------------------------------------
        # PUBLISHER
        # --------------------------------------------------------------

        if (
            request.publisher
            and matched.get("publisher")
        ):
            similarity = self._text_similarity(
                request.publisher,
                matched["publisher"],
            )

            if similarity < 0.70:
                differences["publisher"] = {
                    "provided": request.publisher,
                    "matched": matched["publisher"],
                    "similarity": similarity,
                }

        differences["critical"] = critical

        return differences

    # ------------------------------------------------------------------
    # SIMILARITE
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_text(
        value: str,
    ) -> str:

        value = value.lower().strip()

        value = re.sub(
            r"[^\w\s]",
            " ",
            value,
            flags=re.UNICODE,
        )

        value = re.sub(
            r"\s+",
            " ",
            value,
        )

        return value

    @classmethod
    def _text_similarity(
        cls,
        left: str,
        right: str,
    ) -> float:

        a = set(
            cls._normalize_text(
                left
            ).split()
        )

        b = set(
            cls._normalize_text(
                right
            ).split()
        )

        if not a or not b:
            return 0.0

        intersection = len(
            a.intersection(b)
        )

        union = len(
            a.union(b)
        )

        if union == 0:
            return 0.0

        return round(
            intersection / union,
            4,
        )

    @classmethod
    def _authors_similarity(
        cls,
        provided: List[str],
        matched: List[str],
    ) -> float:

        if not provided or not matched:
            return 0.0

        matched_normalized = [
            cls._normalize_text(
                author
            )
            for author in matched
        ]

        scores = []

        for author in provided:
            normalized = cls._normalize_text(
                author
            )

            best = max(
                (
                    cls._text_similarity(
                        normalized,
                        candidate,
                    )
                    for candidate in matched_normalized
                ),
                default=0.0,
            )

            scores.append(
                best
            )

        return round(
            sum(scores) / len(scores),
            4,
        )

    # ------------------------------------------------------------------
    # SCORE GLOBAL
    # ------------------------------------------------------------------

    def _calculate_confidence(
        self,
        request: ReferenceVerificationRequest,
        matched: Dict[str, Any],
        differences: Dict[str, Any],
    ) -> float:

        scores = []

        if request.doi and matched.get("doi"):
            scores.append(
                1.0
                if self._doi_matches(
                    request.doi,
                    matched["doi"],
                )
                else 0.0
            )

        if request.title and matched.get("title"):
            scores.append(
                self._text_similarity(
                    request.title,
                    matched["title"],
                )
            )

        if request.authors and matched.get("authors"):
            scores.append(
                self._authors_similarity(
                    request.authors,
                    matched["authors"],
                )
            )

        if (
            request.year
            and matched.get("year")
        ):
            scores.append(
                1.0
                if request.year
                == matched["year"]
                else 0.0
            )

        if not scores:
            return 0.0

        confidence = (
            sum(scores)
            / len(scores)
        )

        if differences.get("critical"):
            confidence *= 0.5

        return round(
            max(
                0.0,
                min(
                    1.0,
                    confidence,
                ),
            ),
            4,
        )