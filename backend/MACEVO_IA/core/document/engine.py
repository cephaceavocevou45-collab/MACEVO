from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional
from uuid import uuid4

from core.document.ir import (
    Citation,
    Document,
    DocumentMetadata,
    Equation,
    Figure,
    Paragraph,
    Reference,
    Section,
    Table,
)


class DocumentEngine:
    """
    Moteur central de manipulation des documents MACEVO.

    Responsabilités :
    - créer des documents ;
    - construire des documents depuis des données structurées ;
    - ajouter/modifier des sections ;
    - ajouter paragraphes, citations, équations, figures et tableaux ;
    - gérer les références ;
    - fusionner plusieurs documents ;
    - produire une représentation IR stable.

    Le moteur ne dépend d'aucun modèle IA.
    """

    def create(
        self,
        *,
        title: str = "",
        author: str = "",
        institution: str = "",
        department: str = "",
        supervisor: str = "",
        year: Optional[int] = None,
        language: str = "fr",
        document_type: str = "scientific",
        keywords: Optional[List[str]] = None,
        abstract: str = "",
    ) -> Document:

        return Document(
            metadata=DocumentMetadata(
                title=self._clean(title),
                author=self._clean(author),
                institution=self._clean(institution),
                department=self._clean(department),
                supervisor=self._clean(supervisor),
                year=year,
                language=self._clean(language) or "fr",
                document_type=(
                    self._clean(document_type)
                    or "scientific"
                ),
                keywords=self._clean_list(keywords),
            ),
            abstract=self._clean(abstract),
            keywords=self._clean_list(keywords),
        )

    def from_dict(
        self,
        data: Dict[str, Any],
    ) -> Document:

        if not isinstance(data, dict):
            raise TypeError(
                "data doit être un dictionnaire."
            )

        metadata_data = data.get(
            "metadata",
            {},
        )

        if not isinstance(metadata_data, dict):
            metadata_data = {}

        metadata_fields = {
            "title",
            "subtitle",
            "author",
            "institution",
            "department",
            "supervisor",
            "year",
            "language",
            "document_type",
            "keywords",
            "doi",
            "url",
        }

        metadata = DocumentMetadata(
            **{
                key: value
                for key, value in metadata_data.items()
                if key in metadata_fields
            }
        )

        document = Document(
            id=data.get("id") or self._new_id(),
            metadata=metadata,
            abstract=self._clean(
                data.get("abstract", "")
            ),
            keywords=self._clean_list(
                data.get("keywords", [])
            ),
            metadata_extra=dict(
                data.get(
                    "metadata_extra",
                    {},
                )
            ),
        )

        document.sections = [
            self._section_from_dict(section_data)
            for section_data in data.get(
                "sections",
                [],
            )
            if isinstance(section_data, dict)
        ]

        document.references = [
            self._reference_from_dict(reference_data)
            for reference_data in data.get(
                "references",
                [],
            )
            if isinstance(reference_data, dict)
        ]

        document.annexes = [
            self._section_from_dict(annex_data)
            for annex_data in data.get(
                "annexes",
                [],
            )
            if isinstance(annex_data, dict)
        ]

        return document

    def add_section(
        self,
        document: Document,
        title: str,
        *,
        level: int = 1,
        parent: Optional[Section] = None,
    ) -> Section:

        self._validate_document(document)

        title = self._clean(title)

        if not title:
            raise ValueError(
                "Le titre de la section ne peut pas être vide."
            )

        if level <= 0:
            raise ValueError(
                "Le niveau de section doit être supérieur à zéro."
            )

        if parent is not None:
            if not isinstance(parent, Section):
                raise TypeError(
                    "parent doit être une instance de Section."
                )

            return parent.add_section(
                title=title,
                level=level,
            )

        return document.add_section(
            title=title,
            level=level,
        )

    def add_paragraph(
        self,
        target: Any,
        content: str,
        *,
        style: str = "body",
    ) -> Paragraph:

        if not isinstance(target, Section):
            raise TypeError(
                "target doit être une instance de Section."
            )

        content = self._clean(content)

        if not content:
            raise ValueError(
                "Le contenu du paragraphe ne peut pas être vide."
            )

        return target.add_paragraph(
            content=content,
            style=self._clean(style) or "body",
        )

    def add_citation(
        self,
        target: Any,
        citation_key: str,
        *,
        citation_type: str = "parenthetical",
        locator: Optional[str] = None,
        prefix: Optional[str] = None,
        suffix: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Citation:

        """
        Ajoute une citation à un paragraphe.

        target doit être un Paragraph.

        citation_key doit correspondre à la citation_key
        d'une Reference du document.
        """

        if not isinstance(target, Paragraph):
            raise TypeError(
                "target doit être une instance de Paragraph."
            )

        citation_key = self._clean(citation_key)

        if not citation_key:
            raise ValueError(
                "La clé de citation ne peut pas être vide."
            )

        return target.add_citation(
            citation_key=citation_key,
            citation_type=(
                self._clean(citation_type)
                or "parenthetical"
            ),
            locator=self._clean_optional(locator),
            prefix=self._clean_optional(prefix),
            suffix=self._clean_optional(suffix),
            metadata=dict(metadata or {}),
        )

    def add_equation(
        self,
        target: Any,
        latex: str,
        *,
        label: Optional[str] = None,
        caption: Optional[str] = None,
    ) -> Equation:

        if not isinstance(target, Section):
            raise TypeError(
                "target doit être une instance de Section."
            )

        latex = self._clean(latex)

        if not latex:
            raise ValueError(
                "L'équation LaTeX ne peut pas être vide."
            )

        return target.add_equation(
            latex=latex,
            label=self._clean_optional(label),
            caption=self._clean_optional(caption),
        )

    def add_figure(
        self,
        target: Any,
        *,
        source: Optional[str] = None,
        caption: Optional[str] = None,
        label: Optional[str] = None,
        alt_text: Optional[str] = None,
    ) -> Figure:

        if not isinstance(target, Section):
            raise TypeError(
                "target doit être une instance de Section."
            )

        figure = target.add_figure(
            source=self._clean_optional(source),
            caption=self._clean_optional(caption),
            label=self._clean_optional(label),
        )

        if alt_text:
            figure.alt_text = self._clean(
                alt_text
            )

        return figure

    def add_table(
        self,
        target: Any,
        *,
        columns: Optional[List[str]] = None,
        rows: Optional[List[List[Any]]] = None,
        caption: Optional[str] = None,
        label: Optional[str] = None,
    ) -> Table:

        if not isinstance(target, Section):
            raise TypeError(
                "target doit être une instance de Section."
            )

        return target.add_table(
            columns=self._clean_list(columns),
            rows=list(rows or []),
            caption=self._clean_optional(caption),
            label=self._clean_optional(label),
        )

    def add_reference(
        self,
        document: Document,
        title: str,
        *,
        authors: Optional[List[str]] = None,
        year: Optional[int] = None,
        journal: Optional[str] = None,
        publisher: Optional[str] = None,
        doi: Optional[str] = None,
        url: Optional[str] = None,
        citation_key: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Reference:

        self._validate_document(document)

        title = self._clean(title)

        if not title:
            raise ValueError(
                "Le titre de la référence ne peut pas être vide."
            )

        citation_key = self._clean_optional(
            citation_key
        )

        # Si aucune clé n'est fournie, nous en générons une
        # stable et exploitable par BibTeX.
        if not citation_key:
            citation_key = self._generate_citation_key(
                authors=authors,
                year=year,
                title=title,
                existing=[
                    ref.citation_key
                    for ref in document.references
                    if ref.citation_key
                ],
            )

        return document.add_reference(
            title=title,
            authors=self._clean_list(authors),
            year=year,
            journal=self._clean_optional(journal),
            publisher=self._clean_optional(publisher),
            doi=self._clean_optional(doi),
            url=self._clean_optional(url),
            citation_key=citation_key,
            metadata=dict(metadata or {}),
        )

    def find_reference(
        self,
        document: Document,
        citation_key: str,
    ) -> Optional[Reference]:

        self._validate_document(document)

        citation_key = self._clean(citation_key)

        if not citation_key:
            return None

        for reference in document.references:
            if reference.citation_key == citation_key:
                return reference

        return None

    def validate_citations(
        self,
        document: Document,
    ) -> Dict[str, Any]:

        """
        Vérifie la cohérence entre les citations présentes
        dans les paragraphes et les références bibliographiques.

        Cette validation est structurelle.
        Elle ne vérifie pas encore l'exactitude scientifique
        de la référence.
        """

        self._validate_document(document)

        errors: List[str] = []
        warnings: List[str] = []

        reference_keys = {
            ref.citation_key
            for ref in document.references
            if ref.citation_key
        }

        cited_keys = set()

        for section in self._walk_sections(
            document.sections
        ):
            for paragraph in section.paragraphs:
                for citation in paragraph.citations:

                    key = citation.citation_key

                    if key in cited_keys:
                        continue

                    cited_keys.add(key)

                    if key not in reference_keys:
                        errors.append(
                            "Citation sans référence "
                            f"correspondante : {key}"
                        )

        uncited_references = sorted(
            key
            for key in reference_keys
            if key not in cited_keys
        )

        if uncited_references:
            warnings.append(
                "Références présentes mais non citées : "
                + ", ".join(uncited_references)
            )

        return {
            "valid": not errors,
            "errors": errors,
            "warnings": warnings,
            "cited_keys": sorted(cited_keys),
            "uncited_keys": uncited_references,
            "document_id": document.id,
        }

    def merge(
        self,
        documents: Iterable[Document],
        *,
        title: Optional[str] = None,
    ) -> Document:

        documents = list(documents)

        if not documents:
            raise ValueError(
                "Au moins un document est nécessaire."
            )

        for document in documents:
            self._validate_document(document)

        first = documents[0]

        result = self.create(
            title=(
                self._clean(title)
                if title is not None
                else first.metadata.title
            ),
            author=first.metadata.author,
            institution=first.metadata.institution,
            department=first.metadata.department,
            supervisor=first.metadata.supervisor,
            year=first.metadata.year,
            language=first.metadata.language,
            document_type=first.metadata.document_type,
            keywords=list(first.keywords),
            abstract=first.abstract,
        )

        for document in documents:
            result.sections.extend(
                document.sections
            )

            result.references.extend(
                document.references
            )

            result.annexes.extend(
                document.annexes
            )

            for keyword in document.keywords:
                if keyword not in result.keywords:
                    result.keywords.append(keyword)

        result.metadata.keywords = list(
            result.keywords
        )

        return result

    def validate_basic(
        self,
        document: Document,
    ) -> Dict[str, Any]:

        self._validate_document(document)

        errors: List[str] = []
        warnings: List[str] = []

        if not document.metadata.title:
            warnings.append(
                "Le document ne possède pas de titre."
            )

        if not document.sections:
            warnings.append(
                "Le document ne contient aucune section."
            )

        self._validate_sections(
            document.sections,
            errors,
            warnings,
        )

        citation_validation = (
            self.validate_citations(document)
        )

        errors.extend(
            citation_validation["errors"]
        )

        warnings.extend(
            citation_validation["warnings"]
        )

        return {
            "valid": not errors,
            "errors": errors,
            "warnings": warnings,
            "document_id": document.id,
        }

    def _validate_sections(
        self,
        sections: List[Section],
        errors: List[str],
        warnings: List[str],
    ) -> None:

        for section in sections:

            if not section.title.strip():
                errors.append(
                    f"Section invalide : {section.id}"
                )

            for paragraph in section.paragraphs:
                if not paragraph.content.strip():
                    errors.append(
                        f"Paragraphe vide : {paragraph.id}"
                    )

                for citation in paragraph.citations:
                    if not citation.citation_key.strip():
                        errors.append(
                            "Citation sans clé : "
                            f"{citation.id}"
                        )

            for equation in section.equations:
                if not equation.latex.strip():
                    errors.append(
                        f"Équation vide : {equation.id}"
                    )

            for table in section.tables:

                if table.columns and table.rows:

                    expected = len(table.columns)

                    for index, row in enumerate(
                        table.rows,
                        start=1,
                    ):
                        if len(row) != expected:
                            errors.append(
                                "Tableau "
                                f"{table.id} : ligne {index} "
                                "incompatible avec le nombre "
                                "de colonnes."
                            )

            self._validate_sections(
                section.sections,
                errors,
                warnings,
            )

    @staticmethod
    def _section_from_dict(
        data: Dict[str, Any],
    ) -> Section:

        section = Section(
            title=str(
                data.get(
                    "title",
                    "",
                )
            ),
            id=data.get("id")
            or DocumentEngine._new_id(),
            level=int(
                data.get(
                    "level",
                    1,
                )
            ),
            number=data.get("number"),
            metadata=dict(
                data.get(
                    "metadata",
                    {},
                )
            ),
        )

        for item in data.get(
            "paragraphs",
            [],
        ):

            if not isinstance(item, dict):
                continue

            paragraph = Paragraph(
                content=str(
                    item.get(
                        "content",
                        "",
                    )
                ),
                id=item.get("id")
                or DocumentEngine._new_id(),
                style=str(
                    item.get(
                        "style",
                        "body",
                    )
                ),
                metadata=dict(
                    item.get(
                        "metadata",
                        {},
                    )
                ),
            )

            for citation_data in item.get(
                "citations",
                [],
            ):
                if not isinstance(
                    citation_data,
                    dict,
                ):
                    continue

                citation_key = str(
                    citation_data.get(
                        "citation_key",
                        "",
                    )
                ).strip()

                if not citation_key:
                    continue

                paragraph.citations.append(
                    Citation(
                        citation_key=citation_key,
                        id=citation_data.get("id")
                        or DocumentEngine._new_id(),
                        citation_type=str(
                            citation_data.get(
                                "citation_type",
                                "parenthetical",
                            )
                        ),
                        locator=citation_data.get(
                            "locator"
                        ),
                        prefix=citation_data.get(
                            "prefix"
                        ),
                        suffix=citation_data.get(
                            "suffix"
                        ),
                        metadata=dict(
                            citation_data.get(
                                "metadata",
                                {},
                            )
                        ),
                    )
                )

            section.paragraphs.append(
                paragraph
            )

        for item in data.get(
            "equations",
            [],
        ):

            if isinstance(item, dict):
                section.equations.append(
                    Equation(
                        latex=str(
                            item.get(
                                "latex",
                                "",
                            )
                        ),
                        id=item.get("id")
                        or DocumentEngine._new_id(),
                        label=item.get("label"),
                        number=item.get("number"),
                        caption=item.get("caption"),
                        metadata=dict(
                            item.get(
                                "metadata",
                                {},
                            )
                        ),
                    )
                )

        for item in data.get(
            "figures",
            [],
        ):

            if isinstance(item, dict):
                section.figures.append(
                    Figure(
                        source=item.get("source"),
                        id=item.get("id")
                        or DocumentEngine._new_id(),
                        caption=item.get("caption"),
                        label=item.get("label"),
                        alt_text=item.get("alt_text"),
                        width=item.get("width"),
                        height=item.get("height"),
                        metadata=dict(
                            item.get(
                                "metadata",
                                {},
                            )
                        ),
                    )
                )

        for item in data.get(
            "tables",
            [],
        ):

            if isinstance(item, dict):
                section.tables.append(
                    Table(
                        columns=list(
                            item.get(
                                "columns",
                                [],
                            )
                        ),
                        rows=list(
                            item.get(
                                "rows",
                                [],
                            )
                        ),
                        id=item.get("id")
                        or DocumentEngine._new_id(),
                        caption=item.get("caption"),
                        label=item.get("label"),
                        metadata=dict(
                            item.get(
                                "metadata",
                                {},
                            )
                        ),
                    )
                )

        section.sections = [
            DocumentEngine._section_from_dict(
                child
            )
            for child in data.get(
                "sections",
                [],
            )
            if isinstance(child, dict)
        ]

        return section

    @staticmethod
    def _reference_from_dict(
        data: Dict[str, Any],
    ) -> Reference:

        return Reference(
            title=str(
                data.get(
                    "title",
                    "",
                )
            ),
            id=data.get("id")
            or DocumentEngine._new_id(),
            authors=list(
                data.get(
                    "authors",
                    [],
                )
            ),
            year=data.get("year"),
            journal=data.get("journal"),
            publisher=data.get("publisher"),
            doi=data.get("doi"),
            url=data.get("url"),
            citation_key=data.get("citation_key"),
            metadata=dict(
                data.get(
                    "metadata",
                    {},
                )
            ),
        )

    @staticmethod
    def _validate_document(
        document: Document,
    ) -> None:

        if not isinstance(document, Document):
            raise TypeError(
                "document doit être une instance de Document."
            )

    @staticmethod
    def _clean(
        value: Any,
    ) -> str:

        if value is None:
            return ""

        return str(value).strip()

    @classmethod
    def _clean_optional(
        cls,
        value: Any,
    ) -> Optional[str]:

        cleaned = cls._clean(value)

        return cleaned or None

    @classmethod
    def _clean_list(
        cls,
        values: Optional[Iterable[Any]],
    ) -> List[str]:

        if not values:
            return []

        result: List[str] = []

        for value in values:

            cleaned = cls._clean(value)

            if cleaned:
                result.append(cleaned)

        return result

    @staticmethod
    def _new_id() -> str:
        return str(uuid4())

    @staticmethod
    def _walk_sections(
        sections: Iterable[Section],
    ) -> Iterable[Section]:

        for section in sections:
            yield section

            yield from DocumentEngine._walk_sections(
                section.sections
            )

    @classmethod
    def _generate_citation_key(
        cls,
        *,
        authors: Optional[List[str]],
        year: Optional[int],
        title: str,
        existing: Iterable[str],
    ) -> str:

        existing_set = {
            str(item).strip()
            for item in existing
            if item
        }

        base = ""

        if authors:
            first_author = cls._clean(
                authors[0]
            )

            if first_author:
                # Gère notamment :
                # "Jumper, John"
                # "John Jumper"
                if "," in first_author:
                    surname = first_author.split(
                        ",",
                        1,
                    )[0].strip()
                else:
                    surname = first_author.split()[-1]

                base = "".join(
                    char.lower()
                    for char in surname
                    if char.isalnum()
                )

        if not base:
            words = [
                word
                for word in title.split()
                if word
            ]

            if words:
                base = "".join(
                    char.lower()
                    for char in words[0]
                    if char.isalnum()
                )

        if not base:
            base = "reference"

        if year:
            base += str(year)

        candidate = base
        index = 2

        while candidate in existing_set:
            candidate = f"{base}_{index}"
            index += 1

        return candidate