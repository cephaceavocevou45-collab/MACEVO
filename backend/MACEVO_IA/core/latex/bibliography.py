"""
MACEVO - Générateur bibliographique BibTeX
Version: 1.0.0

Transforme les références du Document IR MACEVO
en fichier .bib compatible avec biblatex / Biber.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Any, Iterable


class BibTeXGenerator:
    """
    Générateur de fichiers BibTeX pour MACEVO.

    Compatible avec :
    - biblatex
    - Biber
    - XeLaTeX
    - LuaLaTeX
    """

    VERSION = "1.0.0"

    def generate(self, references: Iterable[Any]) -> str:
        """
        Génère le contenu complet d'un fichier .bib.
        """
        entries = []

        for reference in references or []:
            entry = self._reference_to_bibtex(reference)

            if entry:
                entries.append(entry)

        if not entries:
            return "% MACEVO - Bibliographie\n"

        return (
            "% MACEVO - Bibliographie\n"
            f"% Généré par BibTeXGenerator {self.VERSION}\n\n"
            + "\n\n".join(entries)
            + "\n"
        )

    def write(
        self,
        references: Iterable[Any],
        output_file: str,
    ) -> str:
        """
        Génère et écrit un fichier .bib.
        """
        content = self.generate(references)

        with open(
            output_file,
            "w",
            encoding="utf-8",
            newline="\n",
        ) as handle:
            handle.write(content)

        return output_file

    def _reference_to_bibtex(self, reference: Any) -> str | None:
        """
        Convertit une Reference IR en entrée BibTeX.
        """

        citation_key = self._citation_key(reference)

        if not citation_key:
            return None

        title = self._get(reference, "title", "")
        authors = self._get(reference, "authors", [])
        year = self._get(reference, "year", None)
        journal = self._get(reference, "journal", "")
        publisher = self._get(reference, "publisher", "")
        doi = self._get(reference, "doi", "")
        url = self._get(reference, "url", "")

        metadata = self._get(reference, "metadata", {}) or {}

        entry_type = self._infer_entry_type(
            reference,
            metadata,
        )

        fields = []

        if title:
            fields.append(
                ("title", self._escape_value(title))
            )

        author_value = self._format_authors(authors)

        if author_value:
            fields.append(
                ("author", self._escape_value(author_value))
            )

        if year:
            fields.append(
                ("year", str(year))
            )

        if journal:
            fields.append(
                ("journaltitle", self._escape_value(journal))
            )

        if publisher:
            fields.append(
                ("publisher", self._escape_value(publisher))
            )

        if doi:
            fields.append(
                ("doi", self._escape_value(doi))
            )

        if url:
            fields.append(
                ("url", self._escape_value(url))
            )

        # Métadonnées complémentaires utiles.
        for source_key, bib_key in (
            ("volume", "volume"),
            ("number", "number"),
            ("issue", "number"),
            ("pages", "pages"),
            ("edition", "edition"),
            ("chapter", "chapter"),
            ("booktitle", "booktitle"),
        ):
            value = metadata.get(source_key)

            if value and not any(
                key == bib_key
                for key, _ in fields
            ):
                fields.append(
                    (bib_key, self._escape_value(value))
                )

        lines = [
            f"@{entry_type}{{{citation_key},"
        ]

        for index, (key, value) in enumerate(fields):
            suffix = "," if index < len(fields) - 1 else ""
            lines.append(
                f"  {key} = {{{value}}}{suffix}"
            )

        lines.append("}")

        return "\n".join(lines)

    def _citation_key(self, reference: Any) -> str:
        """
        Détermine une clé BibTeX stable.
        """

        citation_key = self._get(
            reference,
            "citation_key",
            "",
        )

        if citation_key:
            return self._sanitize_key(
                str(citation_key)
            )

        authors = self._get(
            reference,
            "authors",
            [],
        )

        year = self._get(
            reference,
            "year",
            "",
        )

        title = self._get(
            reference,
            "title",
            "",
        )

        author_part = "author"

        if authors:
            first_author = authors[0]

            if isinstance(first_author, dict):
                first_author = (
                    first_author.get("family")
                    or first_author.get("name")
                    or "author"
                )

            author_part = str(
                first_author
            ).split()[-1]

        title_part = str(title).split()[:3]

        raw_key = (
            f"{author_part}"
            f"{year}"
            f"{''.join(title_part)}"
        )

        return self._sanitize_key(raw_key)

    def _format_authors(
        self,
        authors: Any,
    ) -> str:
        """
        Convertit les auteurs MACEVO vers le format BibTeX.
        """

        if not authors:
            return ""

        if isinstance(authors, str):
            return authors

        formatted = []

        for author in authors:
            if isinstance(author, str):
                formatted.append(author)
                continue

            if isinstance(author, dict):
                family = (
                    author.get("family")
                    or author.get("last")
                    or ""
                )

                given = (
                    author.get("given")
                    or author.get("first")
                    or ""
                )

                if family and given:
                    formatted.append(
                        f"{family}, {given}"
                    )
                elif family:
                    formatted.append(family)
                elif given:
                    formatted.append(given)

        return " and ".join(formatted)

    def _infer_entry_type(
        self,
        reference: Any,
        metadata: dict[str, Any],
    ) -> str:
        """
        Détermine le type BibTeX.
        """

        explicit_type = (
            metadata.get("bibtex_type")
            or metadata.get("entry_type")
        )

        if explicit_type:
            return str(explicit_type).lower()

        if self._get(reference, "journal", ""):
            return "article"

        if metadata.get("booktitle"):
            return "inproceedings"

        if self._get(reference, "publisher", ""):
            return "book"

        if self._get(reference, "url", ""):
            return "online"

        return "misc"

    @staticmethod
    def _get(
        obj: Any,
        name: str,
        default: Any = None,
    ) -> Any:
        if isinstance(obj, dict):
            return obj.get(name, default)

        return getattr(
            obj,
            name,
            default,
        )

    @staticmethod
    def _sanitize_key(value: str) -> str:
        value = unicodedata.normalize(
            "NFKD",
            value,
        )

        value = "".join(
            char
            for char in value
            if not unicodedata.combining(char)
        )

        value = re.sub(
            r"[^A-Za-z0-9:_-]+",
            "",
            value,
        )

        return value or "reference"

    @staticmethod
    def _escape_value(value: Any) -> str:
        text = str(value)

        text = text.replace(
            "\\",
            r"\textbackslash{}",
        )

        text = text.replace(
            "{",
            r"\{",
        )

        text = text.replace(
            "}",
            r"\}",
        )

        return text


def generate_bibtex(
    references: Iterable[Any],
) -> str:
    """
    Fonction utilitaire publique.
    """
    return BibTeXGenerator().generate(
        references
    )