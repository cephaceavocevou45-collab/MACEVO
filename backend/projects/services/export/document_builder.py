
"""
==========================================================
MACEVO IA
Document Builder
==========================================================

Source commune pour les exports :
- PDF
- Word
- LaTeX

Le DocumentBuilder transforme un projet scientifique en
DocumentStructure normalisé.

Principe :
    ScientificProject
        ↓
    DocumentBuilder
        ↓
    DocumentStructure
        ↓
    PDF / Word / LaTeX / autres exports
"""

from __future__ import annotations

import re
from typing import Any, Iterable

from .document_structure import (
    DocumentChapter,
    DocumentFigure,
    DocumentReference,
    DocumentSection,
    DocumentStructure,
    DocumentTable,
)


class DocumentBuilder:
    """
    Construit un DocumentStructure depuis un projet scientifique.

    Le builder reste indépendant :
    - du moteur IA
    - des exporteurs
    - de Django
    - du format final

    Il accepte aussi bien des objets Django que des structures
    simples lorsque cela est nécessaire.
    """

    CHAPTER_TITLES = {
        "introduction",
        "méthodologie",
        "methodologie",
        "méthodes",
        "methodes",
        "matériel et méthodes",
        "materiel et methodes",
        "résultats",
        "resultats",
        "résultats et analyse",
        "resultats et analyse",
        "discussion",
        "conclusion",
    }

    def __init__(self, project: Any):
        if project is None:
            raise ValueError("Le projet scientifique est obligatoire.")

        self.project = project

    # ==========================================================
    # API PUBLIQUE
    # ==========================================================

    def metadata(self) -> dict[str, Any]:
        """Construit les métadonnées générales du document."""

        project = self.project

        return {
            "title": self._string(self._get(project, "title")),
            "subject": self._string(self._get(project, "subject")),
            "description": self._string(
                self._get(project, "description")
            ),
            "author": self._author_name(project),
            "created_at": self._get(project, "created_at"),
            "updated_at": self._get(project, "updated_at"),
        }

    def cover(self) -> dict[str, Any]:
        """Construit les informations de la page de garde."""

        project = self.project

        return {
            "title": self._string(self._get(project, "title")),
            "subject": self._string(self._get(project, "subject")),
            "author": self._author_name(project),
            "level": self._string(
                self._first(
                    project,
                    "level",
                    "academic_level",
                    "study_level",
                    "niveau",
                )
            ),
            "project_type": self._string(
                self._first(
                    project,
                    "project_type",
                    "type",
                    "document_type",
                )
            ),
            "institution": self._string(
                self._first(
                    project,
                    "institution",
                    "university",
                    "school",
                    "organization",
                )
            ),
            "academic_year": self._string(
                self._first(
                    project,
                    "academic_year",
                    "school_year",
                )
            ),
        }

    def abstract(self) -> str:
        """Retourne le résumé scientifique."""

        return self._clean(
            self._first(
                self.project,
                "abstract",
                "summary",
                "resume",
            )
        )

    def keywords(self) -> list[str]:
        """Retourne les mots-clés normalisés."""

        value = self._first(
            self.project,
            "keywords",
            "key_words",
            "mots_cles",
            "tags",
            default="",
        )

        if not value:
            return []

        if isinstance(value, (list, tuple, set)):
            return [
                self._string(item)
                for item in value
                if self._string(item)
            ]

        return [
            item.strip()
            for item in re.split(r"[,;]", str(value))
            if item.strip()
        ]

    def content(self) -> str:
        """Retourne le contenu principal du document."""

        return self._clean(
            self._first(
                self.project,
                "content",
                "body",
                "document_content",
                "scientific_content",
                default="",
            )
        )

    def build(self) -> DocumentStructure:
        """
        Construit le DocumentStructure complet.

        Toutes les collections sont normalisées avant retour.
        """

        document = DocumentStructure(
            metadata=self.metadata(),
            cover=self.cover(),
            abstract=self.abstract(),
            keywords=self.keywords(),
            chapters=self._build_chapters(),
            tables=self._build_tables(),
            figures=self._build_figures(),
            references=self._build_references(),
            appendices=self._build_appendices(),
        )

        # Normalisation finale des numéros.
        document.normalize_numbers()

        return document

    # ==========================================================
    # CHAPITRES
    # ==========================================================

    def _build_chapters(self) -> list[DocumentChapter]:
        """
        Construit les chapitres.

        Priorité :
        1. relations explicites chapters/document_chapters
        2. chapitres détectés dans le contenu
        3. contenu unique dans un chapitre
        4. structure vide

        On évite volontairement de transformer arbitrairement
        quatre paragraphes en quatre chapitres.
        """

        content = self.content()

        # ------------------------------------------------------
        # 1. Relations explicites
        # ------------------------------------------------------

        related = self._related(
            self.project,
            "chapters",
            "document_chapters",
        )

        if related:
            result = []

            for index, item in enumerate(related, 1):
                title = self._first(
                    item,
                    "title",
                    "name",
                    "heading",
                    default=f"Chapitre {index}",
                )

                body = self._clean(
                    self._first(
                        item,
                        "content",
                        "body",
                        "text",
                        default="",
                    )
                )

                result.append(
                    DocumentChapter(
                        title=self._string(title).strip()
                        or f"Chapitre {index}",
                        content="",
                        number=index,
                        sections=self._parse_sections(
                            body,
                            index,
                        ),
                    )
                )

            if result:
                return result

        # ------------------------------------------------------
        # 2. Détection dans le contenu
        # ------------------------------------------------------

        blocks = self._parse_chapter_blocks(content)

        if blocks:
            return [
                DocumentChapter(
                    title=title,
                    content="",
                    number=index,
                    sections=self._parse_sections(
                        body,
                        index,
                    ),
                )
                for index, (title, body) in enumerate(
                    blocks,
                    1,
                )
            ]

        # ------------------------------------------------------
        # 3. Contenu unique
        # ------------------------------------------------------

        if content:
            return [
                DocumentChapter(
                    title="Contenu",
                    content="",
                    number=1,
                    sections=self._parse_sections(
                        content,
                        1,
                    ),
                )
            ]

        # ------------------------------------------------------
        # 4. Projet vide
        # ------------------------------------------------------

        return []

    def _parse_chapter_blocks(
        self,
        content: str,
    ) -> list[tuple[str, str]]:
        """
        Détecte les chapitres présents explicitement dans le texte.
        """

        if not content:
            return []

        blocks: list[tuple[str, str]] = []

        title: str | None = None
        body: list[str] = []

        normalized_content = (
            content
            .replace("\r\n", "\n")
            .replace("\r", "\n")
        )

        for raw in normalized_content.split("\n"):
            line = raw.strip()

            if self._is_chapter_heading(line):
                if title is not None:
                    blocks.append(
                        (
                            title,
                            self._clean(
                                "\n".join(body)
                            ),
                        )
                    )

                title = self._clean_heading(line)
                body = []
                continue

            if title is not None:
                body.append(raw)

        if title is not None:
            blocks.append(
                (
                    title,
                    self._clean(
                        "\n".join(body)
                    ),
                )
            )

        return blocks

    # ==========================================================
    # SECTIONS / SOUS-SECTIONS
    # ==========================================================

    def _parse_sections(
        self,
        content: str,
        chapter_number: int,
    ) -> list[DocumentSection]:
        """
        Détecte les sections et sous-sections.

        Formats supportés notamment :
            1. Introduction
            1.1 Cadre théorique
            1.1.1 Définition
        """

        content = self._clean(content)

        if not content:
            return []

        if self._has_numbered_heading(content):
            return self._parse_numbered_sections(
                content,
                chapter_number,
            )

        textual = self._parse_textual_sections(content)

        if textual:
            return textual

        return [
            DocumentSection(
                title="Contenu",
                content=content,
                level=2,
            )
        ]

    def _parse_numbered_sections(
        self,
        content: str,
        chapter_number: int,
    ) -> list[DocumentSection]:
        """Parse les sections numérotées."""

        sections: list[DocumentSection] = []

        current: DocumentSection | None = None
        subsection: DocumentSection | None = None

        normalized_content = (
            content
            .replace("\r\n", "\n")
            .replace("\r", "\n")
        )

        for raw in normalized_content.split("\n"):
            line = raw.strip()

            if not line:
                continue

            # --------------------------------------------------
            # Niveau 3
            # --------------------------------------------------

            match_level_3 = re.match(
                r"^(\d+)\.(\d+)\.(\d+)"
                r"(?:[\s:._\-–—]+)(.+)$",
                line,
            )

            if match_level_3:
                if current is None:
                    current = DocumentSection(
                        title="Contenu",
                        level=2,
                    )
                    sections.append(current)

                subsection = DocumentSection(
                    title=match_level_3.group(4).strip(),
                    level=3,
                    number=(
                        f"{match_level_3.group(1)}."
                        f"{match_level_3.group(2)}."
                        f"{match_level_3.group(3)}"
                    ),
                )

                current.subsections.append(subsection)
                continue

            # --------------------------------------------------
            # Niveau 2
            # --------------------------------------------------

            match_level_2 = re.match(
                r"^(\d+)\.(\d+)"
                r"(?:[\s:._\-–—]+)(.+)$",
                line,
            )

            if match_level_2:
                current = DocumentSection(
                    title=match_level_2.group(3).strip(),
                    level=2,
                    number=(
                        f"{match_level_2.group(1)}."
                        f"{match_level_2.group(2)}"
                    ),
                )

                sections.append(current)
                subsection = None
                continue

            # --------------------------------------------------
            # Niveau 1 numéroté
            # --------------------------------------------------

            match_level_1 = re.match(
                r"^(\d+)"
                r"(?:[\s:._\-–—]+)(.+)$",
                line,
            )

            if match_level_1:
                current = DocumentSection(
                    title=match_level_1.group(2).strip(),
                    level=2,
                    number=match_level_1.group(1),
                )

                sections.append(current)
                subsection = None
                continue

            # --------------------------------------------------
            # Contenu
            # --------------------------------------------------

            if subsection is not None:
                subsection.content = self._append_line(
                    subsection.content,
                    line,
                )

            elif current is not None:
                current.content = self._append_line(
                    current.content,
                    line,
                )

            else:
                current = DocumentSection(
                    title="Contenu",
                    content=line,
                    level=2,
                )

                sections.append(current)

        return sections

    def _parse_textual_sections(
        self,
        content: str,
    ) -> list[DocumentSection]:
        """
        Détecte des sections textuelles.

        Une ligne courte isolée peut être considérée comme un
        titre, mais uniquement lorsqu'elle apparaît comme un bloc
        autonome.
        """

        blocks = self._paragraphs(content)

        if len(blocks) < 2:
            return []

        result: list[DocumentSection] = []

        for block in blocks:
            lines = [
                line.strip()
                for line in block.splitlines()
                if line.strip()
            ]

            # Un bloc d'une seule ligne pouvant être un titre.
            if (
                len(lines) == 1
                and self._looks_like_heading(lines[0])
            ):
                result.append(
                    DocumentSection(
                        title=lines[0],
                        content="",
                        level=2,
                    )
                )
                continue

            if result:
                result[-1].content = self._append_block(
                    result[-1].content,
                    block,
                )
            else:
                # Le contenu commence avant tout titre détecté.
                return []

        return result

    # ==========================================================
    # TABLES
    # ==========================================================

    def _build_tables(self) -> list[DocumentTable]:
        """Construit les tableaux du projet."""

        items = self._related(
            self.project,
            "tables",
            "document_tables",
        )

        result: list[DocumentTable] = []

        for index, item in enumerate(items, 1):
            headers = self._first(
                item,
                "headers",
                "columns",
                "header",
                default=[],
            )

            rows = self._first(
                item,
                "rows",
                "data",
                "values",
                default=[],
            )

            if not isinstance(
                headers,
                (list, tuple),
            ):
                headers = (
                    [str(headers)]
                    if headers
                    else []
                )

            normalized_rows = []

            if isinstance(rows, (list, tuple)):
                for row in rows:
                    if isinstance(
                        row,
                        (list, tuple),
                    ):
                        normalized_rows.append(
                            [self._string(value) for value in row]
                        )
                    else:
                        normalized_rows.append(
                            [self._string(row)]
                        )

            title = self._first(
                item,
                "title",
                "name",
                "caption",
                default=f"Tableau {index}",
            )

            caption = self._first(
                item,
                "caption",
                default="",
            )

            result.append(
                DocumentTable(
                    title=self._string(title)
                    or f"Tableau {index}",
                    headers=[
                        self._string(value)
                        for value in headers
                    ],
                    rows=normalized_rows,
                    number=index,
                    caption=self._string(caption),
                )
            )

        return result

    # ==========================================================
    # FIGURES
    # ==========================================================

    def _build_figures(self) -> list[DocumentFigure]:
        """Construit les figures et images du projet."""

        items = self._related(
            self.project,
            "figures",
            "document_figures",
            "images",
        )

        result: list[DocumentFigure] = []

        for index, item in enumerate(items, 1):
            path = self._first(
                item,
                "path",
                "image_path",
                "file_path",
                "image",
                "file",
                default="",
            )

            # Django FileField / ImageField.
            if hasattr(path, "path"):
                try:
                    path = path.path
                except Exception:
                    path = str(path)

            title = self._first(
                item,
                "title",
                "name",
                "caption",
                default=f"Figure {index}",
            )

            caption = self._first(
                item,
                "caption",
                default="",
            )

            result.append(
                DocumentFigure(
                    title=self._string(title)
                    or f"Figure {index}",
                    path=self._string(path),
                    caption=self._string(caption),
                    number=index,
                )
            )

        return result

    # ==========================================================
    # RÉFÉRENCES
    # ==========================================================

    def _build_references(self) -> list[DocumentReference]:
        """Construit les références bibliographiques."""

        items = self._related(
            self.project,
            "references",
            "bibliography",
            "bibliographies",
            "document_references",
        )

        result: list[DocumentReference] = []

        for item in items:
            result.append(
                DocumentReference(
                    author=self._string(
                        self._first(
                            item,
                            "author",
                            "authors",
                            default="",
                        )
                    ),
                    title=self._string(
                        self._first(
                            item,
                            "title",
                            default="",
                        )
                    ),
                    year=self._string(
                        self._first(
                            item,
                            "year",
                            "publication_year",
                            default="",
                        )
                    ),
                    publisher=self._string(
                        self._first(
                            item,
                            "publisher",
                            "journal",
                            default="",
                        )
                    ),
                    doi=self._string(
                        self._first(
                            item,
                            "doi",
                            default="",
                        )
                    ),
                    url=self._string(
                        self._first(
                            item,
                            "url",
                            "link",
                            default="",
                        )
                    ),
                    citation_key=self._string(
                        self._first(
                            item,
                            "citation_key",
                            "key",
                            default="",
                        )
                    ),
                )
            )

        return result

    # ==========================================================
    # ANNEXES
    # ==========================================================

    def _build_appendices(self) -> list[DocumentChapter]:
        """Construit les annexes."""

        items = self._related(
            self.project,
            "appendices",
            "annexes",
            "document_appendices",
        )

        result: list[DocumentChapter] = []

        for index, item in enumerate(items, 1):
            body = self._clean(
                self._first(
                    item,
                    "content",
                    "body",
                    "text",
                    default="",
                )
            )

            title = self._first(
                item,
                "title",
                "name",
                default=f"Annexe {index}",
            )

            result.append(
                DocumentChapter(
                    title=self._string(title)
                    or f"Annexe {index}",
                    content="",
                    number=index,
                    sections=self._parse_sections(
                        body,
                        index,
                    ),
                )
            )

        return result

    # ==========================================================
    # ACCÈS AUX DONNÉES
    # ==========================================================

    @staticmethod
    def _get(
        obj: Any,
        name: str,
        default: Any = "",
    ) -> Any:
        """
        Récupère une valeur depuis :
        - un objet Django/Python
        - un dictionnaire
        """

        if obj is None:
            return default

        if isinstance(obj, dict):
            return obj.get(name, default)

        try:
            value = getattr(
                obj,
                name,
                default,
            )
        except Exception:
            return default

        return default if value is None else value

    @classmethod
    def _first(
        cls,
        obj: Any,
        *names: str,
        default: Any = "",
    ) -> Any:
        """
        Retourne la première valeur réellement renseignée.
        """

        for name in names:
            value = cls._get(
                obj,
                name,
                None,
            )

            if value is None:
                continue

            if isinstance(value, str):
                if value.strip():
                    return value
                continue

            if value:
                return value

        return default

    @classmethod
    def _author_name(
        cls,
        project: Any,
    ) -> str:
        """Construit le nom de l'auteur."""

        author = cls._first(
            project,
            "author",
            "owner",
            "user",
            "created_by",
            default=None,
        )

        if author is None:
            return ""

        # Auteur sous forme de dictionnaire ou objet.
        first = cls._get(
            author,
            "first_name",
            "",
        )

        last = cls._get(
            author,
            "last_name",
            "",
        )

        full = " ".join(
            str(value).strip()
            for value in (first, last)
            if str(value).strip()
        )

        if full:
            return full

        return cls._string(
            cls._first(
                author,
                "username",
                "name",
                "email",
                default=author,
            )
        )

    # ==========================================================
    # NETTOYAGE DU TEXTE
    # ==========================================================

    @staticmethod
    def _string(value: Any) -> str:
        """Convertit proprement une valeur en texte."""

        if value is None:
            return ""

        return str(value).strip()

    @staticmethod
    def _clean(value: Any) -> str:
        """Nettoie les espaces et les retours à la ligne."""

        if value is None:
            return ""

        text = (
            str(value)
            .replace("\r\n", "\n")
            .replace("\r", "\n")
        )

        text = re.sub(
            r"[ \t]+",
            " ",
            text,
        )

        text = re.sub(
            r"\n{3,}",
            "\n\n",
            text,
        )

        return text.strip()

    @classmethod
    def _paragraphs(
        cls,
        content: Any,
    ) -> list[str]:
        """Découpe un contenu en blocs de paragraphes."""

        return [
            cls._clean(block)
            for block in re.split(
                r"\n\s*\n+",
                str(content),
            )
            if cls._clean(block)
        ]

    @staticmethod
    def _append_line(
        current: str,
        value: Any,
    ) -> str:
        """Ajoute une ligne au contenu courant."""

        value = str(value).strip()

        if not value:
            return current

        if not current:
            return value

        return f"{current}\n{value}"

    @staticmethod
    def _append_block(
        current: str,
        value: Any,
    ) -> str:
        """Ajoute un bloc au contenu courant."""

        value = str(value).strip()

        if not value:
            return current

        if not current:
            return value

        return f"{current}\n\n{value}"

    # ==========================================================
    # DÉTECTION DES TITRES
    # ==========================================================

    @classmethod
    def _normalize(
        cls,
        value: Any,
    ) -> str:
        return re.sub(
            r"\s+",
            " ",
            str(value).strip().lower(),
        )

    @classmethod
    def _is_chapter_heading(
        cls,
        line: str,
    ) -> bool:
        """Détermine si une ligne correspond à un chapitre."""

        if not line:
            return False

        normalized = cls._normalize(line)

        if normalized in cls.CHAPTER_TITLES:
            return True

        # Chapitre 1 / Chapter 1
        if re.match(
            r"^(chapitre|chapter)\s+\d+"
            r"(?:[\s:._\-–—]+|$)",
            line,
            re.IGNORECASE,
        ):
            return True

        # 1 - Introduction
        # 1. Introduction
        # 1) Introduction
        match = re.match(
            r"^\d+\s*[.):\-–—]\s*(.+)$",
            line,
        )

        if match:
            return (
                cls._normalize(match.group(1))
                in cls.CHAPTER_TITLES
            )

        return False

    @staticmethod
    def _clean_heading(
        line: str,
    ) -> str:
        """Supprime les préfixes de chapitre."""

        line = re.sub(
            r"^(chapitre|chapter)\s+\d+"
            r"[\s:._\-–—]*",
            "",
            str(line).strip(),
            flags=re.IGNORECASE,
        )

        line = re.sub(
            r"^\d+\s*[.):\-–—]\s*",
            "",
            line,
        )

        return line.strip()

    @staticmethod
    def _has_numbered_heading(
        content: str,
    ) -> bool:
        """Détecte une numérotation de sections."""

        return bool(
            re.search(
                r"^\d+(?:\.\d+){1,2}"
                r"(?:[\s:._\-–—]+).+$",
                str(content),
                re.MULTILINE,
            )
        )

    @staticmethod
    def _looks_like_heading(
        line: str,
    ) -> bool:
        """
        Détermine si une ligne isolée ressemble à un titre.
        """

        text = str(line).strip()

        if not text:
            return False

        if len(text) > 90:
            return False

        if text.endswith(
            (".", "!", "?", ";", ":")
        ):
            return False

        words = text.split()

        if not 1 <= len(words) <= 10:
            return False

        # Une ligne entièrement numérique n'est pas un titre.
        if text.isdigit():
            return False

        return True

    # ==========================================================
    # RELATIONS
    # ==========================================================

    @staticmethod
    def _related(
        obj: Any,
        *names: str,
    ) -> list[Any]:
        """
        Récupère une relation depuis un objet.

        Particularité importante :
        si une relation existe mais est vide, on continue à
        chercher les autres noms possibles.

        Cela évite le problème :
            tables = relation vide
            document_tables = relation remplie

        où l'ancien builder s'arrêtait trop tôt.
        """

        if obj is None:
            return []

        for name in names:
            try:
                manager = (
                    obj.get(name)
                    if isinstance(obj, dict)
                    else getattr(
                        obj,
                        name,
                        None,
                    )
                )
            except Exception:
                manager = None

            if manager is None:
                continue

            # Django RelatedManager / QuerySet.
            if hasattr(manager, "all"):
                try:
                    values = list(manager.all())

                    if values:
                        return values

                    # Relation présente mais vide :
                    # continuer vers le prochain alias.
                    continue

                except Exception:
                    continue

            # Collections Python.
            if isinstance(
                manager,
                (list, tuple, set),
            ):
                values = list(manager)

                if values:
                    return values

                continue

        return []
