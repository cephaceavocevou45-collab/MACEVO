from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional
from uuid import uuid4


def _id() -> str:
    return str(uuid4())


@dataclass
class DocumentMetadata:
    """
    Métadonnées générales d'un document scientifique.
    """

    title: str = ""
    subtitle: str = ""
    author: str = ""
    institution: str = ""
    department: str = ""
    supervisor: str = ""
    year: Optional[int] = None
    language: str = "fr"
    document_type: str = "scientific"
    keywords: List[str] = field(default_factory=list)
    doi: Optional[str] = None
    url: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Citation:
    """
    Citation bibliographique associée à un élément textuel.

    citation_key correspond à la clé bibliographique de Reference.
    """

    citation_key: str
    id: str = field(default_factory=_id)

    # Type de citation :
    # - parenthetical : (Jumper et al., 2021)
    # - narrative : Jumper et al. (2021)
    # - textual : citation textuelle libre
    citation_type: str = "parenthetical"

    # Localisation optionnelle dans la source.
    locator: Optional[str] = None

    # Préfixe/suffixe permettant par exemple :
    # "voir" + citation
    # citation + ", p. 12"
    prefix: Optional[str] = None
    suffix: Optional[str] = None

    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Paragraph:
    """
    Paragraphe textuel scientifique.

    citations contient les références effectivement citées
    dans le paragraphe.
    """

    content: str
    id: str = field(default_factory=_id)
    style: str = "body"

    citations: List[Citation] = field(
        default_factory=list
    )

    metadata: Dict[str, Any] = field(default_factory=dict)

    def add_citation(
        self,
        citation_key: str,
        *,
        citation_type: str = "parenthetical",
        locator: Optional[str] = None,
        prefix: Optional[str] = None,
        suffix: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Citation:
        """
        Ajoute une citation au paragraphe.
        """

        citation_key = str(citation_key or "").strip()

        if not citation_key:
            raise ValueError(
                "La clé de citation ne peut pas être vide."
            )

        citation = Citation(
            citation_key=citation_key,
            citation_type=(
                str(citation_type or "parenthetical").strip()
                or "parenthetical"
            ),
            locator=(
                str(locator).strip()
                if locator is not None
                else None
            ),
            prefix=(
                str(prefix).strip()
                if prefix is not None
                else None
            ),
            suffix=(
                str(suffix).strip()
                if suffix is not None
                else None
            ),
            metadata=dict(metadata or {}),
        )

        self.citations.append(citation)

        return citation

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content": self.content,
            "id": self.id,
            "style": self.style,
            "citations": [
                citation.to_dict()
                for citation in self.citations
            ],
            "metadata": self.metadata,
        }


@dataclass
class Equation:
    """
    Équation scientifique.

    latex contient la représentation mathématique canonique.
    """

    latex: str
    id: str = field(default_factory=_id)
    label: Optional[str] = None
    number: Optional[str] = None
    caption: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Figure:
    """
    Figure ou image scientifique.
    """

    source: Optional[str] = None
    id: str = field(default_factory=_id)
    caption: Optional[str] = None
    label: Optional[str] = None
    alt_text: Optional[str] = None
    width: Optional[str] = None
    height: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Table:
    """
    Tableau scientifique structuré.
    """

    columns: List[str] = field(default_factory=list)
    rows: List[List[Any]] = field(default_factory=list)
    id: str = field(default_factory=_id)
    caption: Optional[str] = None
    label: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Reference:
    """
    Référence bibliographique.

    Les informations bibliographiques principales sont conservées
    directement dans la structure.

    Les informations de provenance et de vérification sont conservées
    dans metadata.
    """

    title: str
    id: str = field(default_factory=_id)
    authors: List[str] = field(default_factory=list)
    year: Optional[int] = None
    journal: Optional[str] = None
    publisher: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    citation_key: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Section:
    """
    Section hiérarchique d'un document.
    """

    title: str
    id: str = field(default_factory=_id)
    level: int = 1
    number: Optional[str] = None

    paragraphs: List[Paragraph] = field(
        default_factory=list
    )

    equations: List[Equation] = field(
        default_factory=list
    )

    figures: List[Figure] = field(
        default_factory=list
    )

    tables: List[Table] = field(
        default_factory=list
    )

    sections: List["Section"] = field(
        default_factory=list
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    def add_paragraph(
        self,
        content: str,
        style: str = "body",
    ) -> Paragraph:

        paragraph = Paragraph(
            content=content,
            style=style,
        )

        self.paragraphs.append(paragraph)

        return paragraph

    def add_equation(
        self,
        latex: str,
        label: Optional[str] = None,
        caption: Optional[str] = None,
    ) -> Equation:

        equation = Equation(
            latex=latex,
            label=label,
            caption=caption,
        )

        self.equations.append(equation)

        return equation

    def add_figure(
        self,
        source: Optional[str] = None,
        caption: Optional[str] = None,
        label: Optional[str] = None,
    ) -> Figure:

        figure = Figure(
            source=source,
            caption=caption,
            label=label,
        )

        self.figures.append(figure)

        return figure

    def add_table(
        self,
        columns: Optional[List[str]] = None,
        rows: Optional[List[List[Any]]] = None,
        caption: Optional[str] = None,
        label: Optional[str] = None,
    ) -> Table:

        table = Table(
            columns=list(columns or []),
            rows=list(rows or []),
            caption=caption,
            label=label,
        )

        self.tables.append(table)

        return table

    def add_section(
        self,
        title: str,
        level: Optional[int] = None,
    ) -> "Section":

        child = Section(
            title=title,
            level=(
                level
                if level is not None
                else self.level + 1
            ),
        )

        self.sections.append(child)

        return child

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "id": self.id,
            "level": self.level,
            "number": self.number,
            "paragraphs": [
                item.to_dict()
                for item in self.paragraphs
            ],
            "equations": [
                item.to_dict()
                for item in self.equations
            ],
            "figures": [
                item.to_dict()
                for item in self.figures
            ],
            "tables": [
                item.to_dict()
                for item in self.tables
            ],
            "sections": [
                item.to_dict()
                for item in self.sections
            ],
            "metadata": self.metadata,
        }


@dataclass
class Document:
    """
    Représentation intermédiaire canonique d'un document MACEVO.

    Cette structure devient la source commune des futurs moteurs :
    - IA
    - validation
    - LaTeX
    - PDF
    - DOCX
    - HTML
    - export ZIP
    """

    metadata: DocumentMetadata = field(
        default_factory=DocumentMetadata
    )

    id: str = field(default_factory=_id)

    abstract: str = ""

    keywords: List[str] = field(
        default_factory=list
    )

    sections: List[Section] = field(
        default_factory=list
    )

    references: List[Reference] = field(
        default_factory=list
    )

    annexes: List[Section] = field(
        default_factory=list
    )

    metadata_extra: Dict[str, Any] = field(
        default_factory=dict
    )

    def add_section(
        self,
        title: str,
        level: int = 1,
    ) -> Section:

        section = Section(
            title=title,
            level=level,
        )

        self.sections.append(section)

        return section

    def add_reference(
        self,
        title: str,
        authors: Optional[List[str]] = None,
        year: Optional[int] = None,
        journal: Optional[str] = None,
        publisher: Optional[str] = None,
        doi: Optional[str] = None,
        url: Optional[str] = None,
        citation_key: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Reference:

        reference = Reference(
            title=title,
            authors=list(authors or []),
            year=year,
            journal=journal,
            publisher=publisher,
            doi=doi,
            url=url,
            citation_key=citation_key,
            metadata=dict(metadata or {}),
        )

        self.references.append(reference)

        return reference

    def add_annex(
        self,
        title: str,
    ) -> Section:

        annex = Section(
            title=title,
            level=1,
        )

        self.annexes.append(annex)

        return annex

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "metadata": self.metadata.to_dict(),
            "abstract": self.abstract,
            "keywords": self.keywords,
            "sections": [
                section.to_dict()
                for section in self.sections
            ],
            "references": [
                reference.to_dict()
                for reference in self.references
            ],
            "annexes": [
                annex.to_dict()
                for annex in self.annexes
            ],
            "metadata_extra": self.metadata_extra,
        }

    @classmethod
    def from_dict(
        cls,
        data: Dict[str, Any],
    ) -> "Document":

        metadata_data = data.get(
            "metadata",
            {},
        )

        metadata = DocumentMetadata(
            **{
                key: value
                for key, value in metadata_data.items()
                if key in DocumentMetadata.__dataclass_fields__
            }
        )

        document = cls(
            id=data.get("id", _id()),
            metadata=metadata,
            abstract=data.get("abstract", ""),
            keywords=data.get("keywords", []),
            metadata_extra=data.get(
                "metadata_extra",
                {},
            ),
        )

        return document