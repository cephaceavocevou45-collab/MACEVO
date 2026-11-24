
"""
==========================================================
MACEVO IA
Bibliography Service
==========================================================

Service central de gestion et de génération bibliographique.

Responsabilités :
- normalisation des références ;
- génération BibTeX ;
- génération IEEE ;
- génération APA ;
- citations dans le texte ;
- validation minimale des références ;
- export de collections bibliographiques ;
- architecture extensible pour Chicago, MLA, etc.

Le service travaille avec des dictionnaires Python afin de rester
compatible avec les importateurs BibTeX, CSV, JSON, Word, etc.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, Iterable, List, Mapping, Optional, Sequence, Union


logger = logging.getLogger(__name__)


Reference = Mapping[str, Any]
ReferenceInput = Union[Reference, Sequence[Reference]]


class BibliographyService:
    """
    Façade centrale de la bibliographie MACEVO.

    Exemple :

        references = [
            {
                "id": "smith2024",
                "type": "article",
                "author": "John Smith",
                "title": "Scientific Research Methods",
                "journal": "Journal of Science",
                "year": 2024,
                "volume": 12,
                "number": 2,
                "pages": "10-25",
                "doi": "10.xxxx/example",
            }
        ]

        bibtex = BibliographyService.generate_bibtex(references)
        ieee = BibliographyService.generate_ieee(references)
        apa = BibliographyService.generate_apa(references)
    """

    # ==========================================================
    # NORMALISATION
    # ==========================================================

    @staticmethod
    def _normalize_references(
        references: Optional[ReferenceInput],
    ) -> List[Dict[str, Any]]:
        """
        Normalise une référence unique ou une collection.

        Retourne toujours une liste de dictionnaires.
        """

        if references is None:
            return []

        if isinstance(references, Mapping):
            references = [references]

        if isinstance(references, (str, bytes)):
            raise TypeError(
                "references doit être un dictionnaire ou une séquence "
                "de dictionnaires."
            )

        normalized: List[Dict[str, Any]] = []

        for index, reference in enumerate(references, start=1):
            if not isinstance(reference, Mapping):
                raise TypeError(
                    f"Référence #{index} invalide : "
                    "chaque référence doit être un dictionnaire."
                )

            item = {
                str(key).strip(): value
                for key, value in reference.items()
                if value is not None
            }

            normalized.append(
                BibliographyService.normalize_reference(
                    item,
                    index=index,
                )
            )

        return normalized

    @staticmethod
    def normalize_reference(
        reference: Reference,
        index: int = 1,
    ) -> Dict[str, Any]:
        """
        Normalise une référence individuelle.

        Les alias courants sont harmonisés :
        - authors -> author
        - editors -> editor
        - publication_year -> year
        - pages_range -> pages
        - doi_url -> doi
        """

        result = dict(reference)

        aliases = {
            "authors": "author",
            "author_name": "author",
            "editors": "editor",
            "publication_year": "year",
            "date": "year",
            "pages_range": "pages",
            "doi_url": "doi",
            "link": "url",
            "website": "url",
            "publication": "journal",
        }

        for source, target in aliases.items():
            if target not in result and source in result:
                result[target] = result[source]

        result.setdefault(
            "id",
            BibliographyService._generate_key(result, index),
        )

        result["id"] = BibliographyService._safe_key(
            str(result["id"])
        )

        result["type"] = BibliographyService._normalize_type(
            result.get("type", "misc")
        )

        return result

    @staticmethod
    def _normalize_type(value: Any) -> str:
        """Normalise le type bibliographique."""

        if value is None:
            return "misc"

        value = str(value).strip().lower()

        aliases = {
            "journal": "article",
            "journal_article": "article",
            "paper": "article",
            "scientific_article": "article",
            "book_chapter": "incollection",
            "chapter": "incollection",
            "conference": "inproceedings",
            "conference_paper": "inproceedings",
            "proceedings": "inproceedings",
            "thesis": "phdthesis",
            "doctoral_thesis": "phdthesis",
            "doctorate": "phdthesis",
            "master_thesis": "mastersthesis",
            "web": "online",
            "website": "online",
        }

        return aliases.get(value, value or "misc")

    @staticmethod
    def _generate_key(reference: Reference, index: int) -> str:
        """Génère une clé bibliographique stable."""

        author = reference.get("author") or reference.get("editor")
        year = reference.get("year")

        if author:
            if isinstance(author, list):
                author = author[0] if author else "reference"

            author = str(author)

            # John Smith -> Smith
            parts = re.findall(r"[A-Za-zÀ-ÿ'-]+", author)

            if parts:
                surname = parts[-1]
            else:
                surname = "reference"

            surname = BibliographyService._safe_key(surname)

            if year:
                return f"{surname}{year}"

            return surname

        return f"reference{index}"

    @staticmethod
    def _safe_key(value: str) -> str:
        """Nettoie une clé BibTeX."""

        value = re.sub(r"[^A-Za-z0-9_-]+", "", value)

        return value or "reference"

    # ==========================================================
    # UTILITAIRES
    # ==========================================================

    @staticmethod
    def _value(reference: Reference, key: str, default: str = "") -> str:
        """Retourne une valeur bibliographique propre."""

        value = reference.get(key, default)

        if value is None:
            return default

        if isinstance(value, (list, tuple)):
            return ", ".join(str(item) for item in value)

        return str(value).strip()

    @staticmethod
    def _authors(reference: Reference) -> List[str]:
        """
        Retourne les auteurs sous forme de liste.
        """

        value = reference.get("author", "")

        if not value:
            return []

        if isinstance(value, (list, tuple)):
            return [
                str(item).strip()
                for item in value
                if str(item).strip()
            ]

        text = str(value).strip()

        # Support :
        # "John Smith; Jane Doe"
        # "John Smith, Jane Doe"
        # "John Smith and Jane Doe"
        if ";" in text:
            parts = text.split(";")
        elif " and " in text:
            parts = re.split(r"\s+and\s+", text)
        else:
            parts = [text]

        return [
            part.strip()
            for part in parts
            if part.strip()
        ]

    @staticmethod
    def _format_authors_apa(reference: Reference) -> str:
        """
        Formate les auteurs selon une forme APA simplifiée.
        """

        authors = BibliographyService._authors(reference)

        if not authors:
            return ""

        formatted = []

        for author in authors:
            author = author.strip()

            # Si déjà sous forme "Nom, Prénom"
            if "," in author:
                formatted.append(author)
                continue

            parts = author.split()

            if len(parts) >= 2:
                surname = parts[-1]
                initials = " ".join(
                    f"{part[0]}."
                    for part in parts[:-1]
                    if part
                )

                formatted.append(f"{surname}, {initials}")
            else:
                formatted.append(author)

        if len(formatted) == 1:
            return formatted[0]

        if len(formatted) == 2:
            return f"{formatted[0]} & {formatted[1]}"

        return ", ".join(formatted[:-1]) + f", & {formatted[-1]}"

    @staticmethod
    def _format_authors_ieee(reference: Reference) -> str:
        """
        Formate les auteurs selon une forme IEEE simplifiée.
        """

        authors = BibliographyService._authors(reference)

        if not authors:
            return ""

        formatted = []

        for author in authors:
            parts = author.split()

            if len(parts) >= 2:
                surname = parts[-1]
                initials = " ".join(
                    f"{part[0]}."
                    for part in parts[:-1]
                    if part
                )
                formatted.append(f"{initials} {surname}")
            else:
                formatted.append(author)

        if len(formatted) <= 6:
            if len(formatted) == 1:
                return formatted[0]

            if len(formatted) == 2:
                return f"{formatted[0]} and {formatted[1]}"

            return ", ".join(formatted[:-1]) + (
                f", and {formatted[-1]}"
            )

        return ", ".join(formatted[:6]) + ", et al."

    # ==========================================================
    # BIBTEX
    # ==========================================================

    @staticmethod
    def generate_bibtex(
        references: Optional[ReferenceInput] = None,
    ) -> str:
        """
        Génère une bibliographie BibTeX.

        Compatible avec :
        - articles ;
        - livres ;
        - chapitres ;
        - conférences ;
        - thèses ;
        - ressources en ligne ;
        - références génériques.
        """

        refs = BibliographyService._normalize_references(references)

        if not refs:
            return ""

        entries: List[str] = []

        supported_fields = (
            "author",
            "editor",
            "title",
            "journal",
            "booktitle",
            "publisher",
            "year",
            "volume",
            "number",
            "issue",
            "pages",
            "edition",
            "address",
            "school",
            "institution",
            "organization",
            "doi",
            "url",
            "isbn",
            "issn",
            "note",
            "abstract",
        )

        for reference in refs:
            entry_type = BibliographyService._normalize_type(
                reference.get("type", "misc")
            )

            key = BibliographyService._safe_key(
                BibliographyService._value(
                    reference,
                    "id",
                    "reference",
                )
            )

            lines = [
                f"@{entry_type}{{{key},"
            ]

            for field in supported_fields:
                value = reference.get(field)

                if value is None or value == "":
                    continue

                if isinstance(value, (list, tuple)):
                    value = " and ".join(
                        str(item) for item in value
                    )

                value = BibliographyService._escape_bibtex(
                    str(value)
                )

                lines.append(
                    f"  {field} = {{{value}}},"
                )

            # Supprime la virgule finale.
            if len(lines) > 1:
                lines[-1] = lines[-1].rstrip(",")

            lines.append("}")

            entries.append("\n".join(lines))

        return "\n\n".join(entries)

    @staticmethod
    def _escape_bibtex(value: str) -> str:
        """Échappe les caractères critiques pour BibTeX."""

        replacements = {
            "\\": r"\textbackslash{}",
            "&": r"\&",
            "%": r"\%",
            "$": r"\$",
            "#": r"\#",
            "_": r"\_",
        }

        for old, new in replacements.items():
            value = value.replace(old, new)

        return value

    # ==========================================================
    # IEEE
    # ==========================================================

    @staticmethod
    def generate_ieee(
        references: Optional[ReferenceInput] = None,
    ) -> str:
        """
        Génère une bibliographie au format IEEE simplifié.

        Les références sont numérotées automatiquement.
        """

        refs = BibliographyService._normalize_references(references)

        if not refs:
            return ""

        output: List[str] = []

        for index, reference in enumerate(refs, start=1):
            authors = BibliographyService._format_authors_ieee(
                reference
            )

            title = BibliographyService._value(
                reference,
                "title",
            )

            journal = BibliographyService._value(
                reference,
                "journal",
            )

            booktitle = BibliographyService._value(
                reference,
                "booktitle",
            )

            publisher = BibliographyService._value(
                reference,
                "publisher",
            )

            year = BibliographyService._value(
                reference,
                "year",
            )

            volume = BibliographyService._value(
                reference,
                "volume",
            )

            number = BibliographyService._value(
                reference,
                "number",
            )

            pages = BibliographyService._value(
                reference,
                "pages",
            )

            doi = BibliographyService._value(
                reference,
                "doi",
            )

            url = BibliographyService._value(
                reference,
                "url",
            )

            entry_type = BibliographyService._normalize_type(
                reference.get("type", "misc")
            )

            parts: List[str] = []

            if authors:
                parts.append(authors + ",")

            if title:
                parts.append(f'"{title},"')

            if entry_type == "article":
                if journal:
                    parts.append(f"*{journal}*,")

                if volume:
                    parts.append(f"vol. {volume},")

                if number:
                    parts.append(f"no. {number},")

                if pages:
                    parts.append(f"pp. {pages},")

            elif entry_type in {
                "book",
                "inbook",
                "incollection",
            }:
                if publisher:
                    parts.append(f"{publisher},")

                if pages:
                    parts.append(f"pp. {pages},")

            elif entry_type == "inproceedings":
                if booktitle:
                    parts.append(
                        f"in *{booktitle}*,"
                    )

                if pages:
                    parts.append(f"pp. {pages},")

            elif entry_type in {
                "phdthesis",
                "mastersthesis",
            }:
                school = BibliographyService._value(
                    reference,
                    "school",
                )

                if school:
                    parts.append(f"{school},")

            elif entry_type == "online":
                if url:
                    parts.append(url + ",")

            if year:
                parts.append(year + ".")

            if doi:
                parts.append(f"doi: {doi}.")

            text = " ".join(
                part.strip()
                for part in parts
                if part.strip()
            )

            # Nettoyage de ponctuation double.
            text = re.sub(r",\s+\.", ".", text)
            text = re.sub(r"\.\s+\.", ".", text)

            output.append(
                f"[{index}] {text}"
            )

        return "\n".join(output)

    # ==========================================================
    # APA
    # ==========================================================

    @staticmethod
    def generate_apa(
        references: Optional[ReferenceInput] = None,
    ) -> str:
        """
        Génère une bibliographie au format APA simplifié.
        """

        refs = BibliographyService._normalize_references(references)

        if not refs:
            return ""

        output: List[str] = []

        for reference in refs:
            authors = BibliographyService._format_authors_apa(
                reference
            )

            year = BibliographyService._value(
                reference,
                "year",
            )

            title = BibliographyService._value(
                reference,
                "title",
            )

            journal = BibliographyService._value(
                reference,
                "journal",
            )

            volume = BibliographyService._value(
                reference,
                "volume",
            )

            number = BibliographyService._value(
                reference,
                "number",
            )

            pages = BibliographyService._value(
                reference,
                "pages",
            )

            publisher = BibliographyService._value(
                reference,
                "publisher",
            )

            doi = BibliographyService._value(
                reference,
                "doi",
            )

            url = BibliographyService._value(
                reference,
                "url",
            )

            entry_type = BibliographyService._normalize_type(
                reference.get("type", "misc")
            )

            parts: List[str] = []

            # Auteur
            if authors:
                parts.append(authors)

            # Année
            if year:
                parts.append(f"({year}).")

            # Titre
            if title:
                if entry_type == "book":
                    parts.append(f"*{title}*.")
                else:
                    parts.append(f"{title}.")

            # Article
            if journal:
                journal_part = f"*{journal}*"

                if volume:
                    journal_part += f", *{volume}*"

                if number:
                    journal_part += f"({number})"

                if pages:
                    journal_part += f", {pages}"

                journal_part += "."

                parts.append(journal_part)

            # Livre
            elif publisher:
                parts.append(f"{publisher}.")

            # DOI
            if doi:
                doi = doi.strip()

                if doi.startswith("http"):
                    parts.append(f"{doi}.")
                else:
                    parts.append(
                        f"https://doi.org/{doi}."
                    )

            # URL
            elif url:
                parts.append(url)

            text = " ".join(
                part.strip()
                for part in parts
                if part.strip()
            )

            text = re.sub(
                r"\.\s+\.",
                ".",
                text,
            )

            output.append(text)

        return "\n".join(output)

    # ==========================================================
    # CITATIONS
    # ==========================================================

    @staticmethod
    def citation(
        reference: Reference,
        style: str = "apa",
        index: Optional[int] = None,
    ) -> str:
        """
        Génère une citation dans le texte.

        Exemples :
            (Smith, 2024)
            [1]
        """

        normalized = BibliographyService.normalize_reference(
            reference
        )

        style = str(style).strip().lower()

        authors = BibliographyService._authors(
            normalized
        )

        year = BibliographyService._value(
            normalized,
            "year",
        )

        if style == "ieee":
            if index is not None:
                return f"[{index}]"

            return "[?]"

        if style == "bibtex":
            return (
                f"\\cite{{"
                f"{normalized['id']}"
                f"}}"
            )

        if not authors:
            author = BibliographyService._value(
                normalized,
                "title",
                "Unknown",
            )
        elif len(authors) == 1:
            author = authors[0]
        else:
            author = authors[0]

        # Nom de famille pour une citation APA.
        if author and " " in author and "," not in author:
            author = author.split()[-1]

        if year:
            return f"({author}, {year})"

        return f"({author})"

    # ==========================================================
    # VALIDATION
    # ==========================================================

    @staticmethod
    def validate_reference(
        reference: Reference,
    ) -> Dict[str, Any]:
        """
        Valide une référence de manière non destructive.

        Cette validation ne remplace pas une validation
        bibliographique scientifique complète.
        """

        if not isinstance(reference, Mapping):
            return {
                "valid": False,
                "errors": [
                    "La référence doit être un dictionnaire."
                ],
                "warnings": [],
            }

        normalized = BibliographyService.normalize_reference(
            reference
        )

        errors: List[str] = []
        warnings: List[str] = []

        entry_type = normalized.get("type", "misc")

        title = normalized.get("title")
        year = normalized.get("year")

        if not title:
            errors.append(
                "Le titre de la référence est manquant."
            )

        if not year:
            warnings.append(
                "L'année de publication est manquante."
            )

        if entry_type in {
            "article",
            "inproceedings",
        } and not normalized.get(
            "author"
        ):
            warnings.append(
                "Le ou les auteurs ne sont pas renseignés."
            )

        if entry_type == "article" and not normalized.get(
            "journal"
        ):
            warnings.append(
                "Le journal est manquant pour cet article."
            )

        if entry_type == "book" and not normalized.get(
            "publisher"
        ):
            warnings.append(
                "L'éditeur est manquant pour ce livre."
            )

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "normalized": normalized,
        }

    @staticmethod
    def validate(
        references: Optional[ReferenceInput],
    ) -> Dict[str, Any]:
        """Valide une collection de références."""

        refs = BibliographyService._normalize_references(
            references
        )

        results = [
            BibliographyService.validate_reference(reference)
            for reference in refs
        ]

        errors = [
            error
            for result in results
            for error in result["errors"]
        ]

        warnings = [
            warning
            for result in results
            for warning in result["warnings"]
        ]

        return {
            "valid": not errors,
            "count": len(refs),
            "errors": errors,
            "warnings": warnings,
            "references": results,
        }

    # ==========================================================
    # GÉNÉRATION UNIFIÉE
    # ==========================================================

    @staticmethod
    def generate(
        references: Optional[ReferenceInput],
        style: str = "bibtex",
    ) -> str:
        """
        Générateur bibliographique unifié.

        Styles actuellement supportés :
        - bibtex
        - ieee
        - apa
        """

        style = str(style).strip().lower()

        generators = {
            "bibtex": BibliographyService.generate_bibtex,
            "bib": BibliographyService.generate_bibtex,
            "ieee": BibliographyService.generate_ieee,
            "apa": BibliographyService.generate_apa,
        }

        generator = generators.get(style)

        if generator is None:
            raise ValueError(
                f"Style bibliographique non supporté : {style}. "
                f"Styles disponibles : "
                f"{', '.join(sorted(set(generators)))}"
            )

        return generator(references)

    # ==========================================================
    # STATISTIQUES
    # ==========================================================

    @staticmethod
    def statistics(
        references: Optional[ReferenceInput],
    ) -> Dict[str, Any]:
        """Retourne des statistiques bibliographiques."""

        refs = BibliographyService._normalize_references(
            references
        )

        types: Dict[str, int] = {}

        years: List[int] = []

        authors_count = 0
        doi_count = 0
        url_count = 0

        for reference in refs:
            entry_type = BibliographyService._normalize_type(
                reference.get("type", "misc")
            )

            types[entry_type] = (
                types.get(entry_type, 0) + 1
            )

            authors_count += len(
                BibliographyService._authors(reference)
            )

            if reference.get("doi"):
                doi_count += 1

            if reference.get("url"):
                url_count += 1

            try:
                year = int(
                    str(reference.get("year"))
                )
                years.append(year)
            except (TypeError, ValueError):
                pass

        return {
            "count": len(refs),
            "types": types,
            "authors_count": authors_count,
            "doi_count": doi_count,
            "url_count": url_count,
            "year_min": min(years) if years else None,
            "year_max": max(years) if years else None,
        }

    # ==========================================================
    # INFORMATIONS SERVICE
    # ==========================================================

    @staticmethod
    def info() -> Dict[str, Any]:
        """Informations sur le service."""

        return {
            "service": "BibliographyService",
            "version": "2.0.0",
            "styles": [
                "bibtex",
                "ieee",
                "apa",
            ],
            "capabilities": [
                "normalize",
                "validate",
                "generate_bibtex",
                "generate_ieee",
                "generate_apa",
                "citation",
                "statistics",
            ],
            "extensible": True,
        }
