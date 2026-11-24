"""
MACEVO — Deterministic Document Structure Analyzer.

Cette couche ne dépend d'aucun modèle IA.
Elle détecte uniquement la structure explicite du document.
"""

from __future__ import annotations

import re
from typing import Any

from .exceptions import StructureAnalysisError
from .models import DetectedSection


class StructureAnalyzer:
    """
    Analyseur structurel déterministe.

    Il sait reconnaître notamment :

    - CHAPITRE 1
    - CHAPTER 1
    - 1 Introduction
    - 1.1 Méthodologie
    - 1.1.1 Collecte des données
    - Introduction
    - Résumé
    - Abstract
    - Résultats
    - Discussion
    - Conclusion
    - Références
    - Bibliographie
    - Annexes
    """

    NUMBERED_PATTERN = re.compile(
        r"^(?P<number>"
        r"\d+(?:\.\d+)*"
        r"|[IVXLCDM]+"
        r")"
        r"\s*[.)-]?\s+"
        r"(?P<title>.+)$",
        re.IGNORECASE,
    )

    CHAPTER_PATTERN = re.compile(
        r"^(?:CHAPITRE|CHAPTER)"
        r"\s+"
        r"(?P<number>[\w.-]+)"
        r"\s*[:.-]?\s*"
        r"(?P<title>.*)$",
        re.IGNORECASE,
    )

    KNOWN_HEADINGS = {
        "résumé": 1,
        "resume": 1,
        "abstract": 1,
        "introduction": 1,
        "méthodologie": 1,
        "methodologie": 1,
        "méthodes": 1,
        "methodes": 1,
        "matériels et méthodes": 1,
        "materiels et methodes": 1,
        "materials and methods": 1,
        "résultats": 1,
        "resultats": 1,
        "results": 1,
        "discussion": 1,
        "conclusion": 1,
        "références": 1,
        "references": 1,
        "bibliographie": 1,
        "annexes": 1,
        "annexes et appendices": 1,
    }

    def analyze(
        self,
        imported_document: Any,
    ) -> list[DetectedSection]:
        """
        Analyse un ImportedDocument.

        Priorité :

        1. structure fournie par l'importeur ;
        2. détection depuis le texte ;
        3. document générique.
        """

        try:
            existing_sections = (
                getattr(
                    imported_document,
                    "sections",
                    None,
                )
                or []
            )

            if existing_sections:
                detected = self._from_existing(
                    existing_sections
                )

                if detected:
                    return detected

            text = str(
                getattr(
                    imported_document,
                    "text",
                    "",
                )
                or ""
            )

            return self._from_text(text)

        except Exception as exc:
            raise StructureAnalysisError(
                f"Analyse structurelle impossible : {exc}"
            ) from exc

    # ========================================================================
    # EXISTING STRUCTURE
    # ========================================================================

    def _from_existing(
        self,
        sections: list[Any],
    ) -> list[DetectedSection]:

        result: list[DetectedSection] = []

        for item in sections:

            if isinstance(item, dict):

                title = str(
                    item.get("title")
                    or item.get("name")
                    or "Section"
                )

                level = int(
                    item.get("level")
                    or 1
                )

                number = item.get(
                    "number"
                )

                paragraphs = (
                    item.get("paragraphs")
                    or item.get("content")
                    or []
                )

            else:

                title = str(
                    getattr(
                        item,
                        "title",
                        None,
                    )
                    or getattr(
                        item,
                        "name",
                        None,
                    )
                    or "Section"
                )

                level = int(
                    getattr(
                        item,
                        "level",
                        1,
                    )
                    or 1
                )

                number = getattr(
                    item,
                    "number",
                    None,
                )

                paragraphs = (
                    getattr(
                        item,
                        "paragraphs",
                        None,
                    )
                    or []
                )

            normalized_paragraphs = []

            if isinstance(
                paragraphs,
                str,
            ):
                paragraphs = [
                    paragraphs
                ]

            for paragraph in paragraphs:

                if isinstance(
                    paragraph,
                    dict,
                ):
                    value = (
                        paragraph.get("content")
                        or paragraph.get("text")
                        or ""
                    )
                else:
                    value = str(
                        paragraph
                    )

                value = value.strip()

                if value:
                    normalized_paragraphs.append(
                        value
                    )

            result.append(
                DetectedSection(
                    title=title.strip(),
                    level=max(
                        1,
                        level,
                    ),
                    number=(
                        str(number)
                        if number is not None
                        else None
                    ),
                    paragraphs=normalized_paragraphs,
                )
            )

        return result

    # ========================================================================
    # TEXT ANALYSIS
    # ========================================================================

    def _from_text(
        self,
        text: str,
    ) -> list[DetectedSection]:

        normalized = (
            text
            .replace("\r\n", "\n")
            .replace("\r", "\n")
        )

        lines = normalized.split("\n")

        sections: list[DetectedSection] = []

        current: DetectedSection | None = None

        pending_lines: list[str] = []

        def flush() -> None:
            nonlocal pending_lines

            if current is not None:

                paragraphs = (
                    self._paragraphs_from_lines(
                        pending_lines
                    )
                )

                current.paragraphs.extend(
                    paragraphs
                )

            pending_lines = []

        for raw_line in lines:

            line = raw_line.strip()

            if not line:

                flush()
                continue

            heading = self._detect_heading(
                raw_line
            )

            if heading:

                flush()

                level, title, number = heading

                current = DetectedSection(
                    title=title,
                    level=level,
                    number=number,
                )

                sections.append(
                    current
                )

            else:

                pending_lines.append(
                    line
                )

        flush()

        if not sections and normalized.strip():

            sections.append(
                DetectedSection(
                    title="Document",
                    level=1,
                    paragraphs=self._paragraphs_from_lines(
                        lines
                    ),
                )
            )

        return sections

    # ========================================================================
    # PARAGRAPHS
    # ========================================================================

    @staticmethod
    def _paragraphs_from_lines(
        lines: list[str],
    ) -> list[str]:

        if not lines:
            return []

        paragraphs: list[str] = []

        buffer: list[str] = []

        for line in lines:

            line = line.strip()

            if line:

                buffer.append(
                    line
                )

            elif buffer:

                paragraphs.append(
                    " ".join(buffer)
                )

                buffer = []

        if buffer:

            paragraphs.append(
                " ".join(buffer)
            )

        return paragraphs

    # ========================================================================
    # HEADING DETECTION
    # ========================================================================

    def _detect_heading(
        self,
        line: str,
    ) -> tuple[
        int,
        str,
        str | None,
    ] | None:

        original = line.strip()

        # Markdown heading
        markdown_match = re.match(
            r"^(#{1,6})\s+(.+)$",
            original,
        )

        if markdown_match:

            level = len(
                markdown_match.group(1)
            )

            return (
                level,
                markdown_match.group(2).strip(),
                None,
            )

        clean = original

        # CHAPITRE / CHAPTER
        chapter = (
            self.CHAPTER_PATTERN.match(
                clean
            )
        )

        if chapter:

            number = (
                chapter.group(
                    "number"
                )
            )

            title = (
                chapter.group(
                    "title"
                ).strip()
            )

            if not title:

                title = (
                    f"Chapitre {number}"
                )

            return (
                1,
                title,
                number,
            )

        # Numbered headings
        numbered = (
            self.NUMBERED_PATTERN.match(
                clean
            )
        )

        if numbered:

            title = (
                numbered.group(
                    "title"
                ).strip()
            )

            number = (
                numbered.group(
                    "number"
                )
            )

            # Évite de transformer une phrase
            # normale en titre.
            if (
                len(title.split())
                <= 16
                and not title.endswith(".")
            ):

                if number[0].isdigit():

                    level = min(
                        6,
                        number.count(".") + 1,
                    )

                else:

                    level = 1

                return (
                    level,
                    title,
                    number,
                )

        # Titres scientifiques connus
        key = re.sub(
            r"\s+",
            " ",
            clean,
        ).lower()

        if key in self.KNOWN_HEADINGS:

            return (
                self.KNOWN_HEADINGS[key],
                clean,
                None,
            )

        return None