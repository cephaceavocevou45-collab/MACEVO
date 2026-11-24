from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import re


# =====================================================================
# PROBLÈMES DE VALIDATION
# =====================================================================


@dataclass
class ScientificValidationIssue:
    """
    Problème détecté pendant la validation scientifique.
    """

    code: str
    severity: str
    message: str

    path: Optional[str] = None
    object_id: Optional[str] = None
    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "code": self.code,
            "severity": self.severity,
            "message": self.message,
            "path": self.path,
            "object_id": self.object_id,
            "metadata": self.metadata,
        }


# =====================================================================
# RAPPORT DE VALIDATION
# =====================================================================


@dataclass
class ScientificValidationReport:
    """
    Rapport complet de validation scientifique.
    """

    valid: bool = True

    errors: List[ScientificValidationIssue] = field(
        default_factory=list
    )

    warnings: List[ScientificValidationIssue] = field(
        default_factory=list
    )

    infos: List[ScientificValidationIssue] = field(
        default_factory=list
    )

    statistics: Dict[str, Any] = field(
        default_factory=dict
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    @property
    def error_count(self) -> int:
        return len(self.errors)

    @property
    def warning_count(self) -> int:
        return len(self.warnings)

    @property
    def info_count(self) -> int:
        return len(self.infos)

    @property
    def has_errors(self) -> bool:
        return bool(self.errors)

    @property
    def has_warnings(self) -> bool:
        return bool(self.warnings)

    def add_error(
        self,
        code: str,
        message: str,
        *,
        path: Optional[str] = None,
        object_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.valid = False

        self.errors.append(
            ScientificValidationIssue(
                code=code,
                severity="error",
                message=message,
                path=path,
                object_id=object_id,
                metadata=dict(metadata or {}),
            )
        )

    def add_warning(
        self,
        code: str,
        message: str,
        *,
        path: Optional[str] = None,
        object_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.warnings.append(
            ScientificValidationIssue(
                code=code,
                severity="warning",
                message=message,
                path=path,
                object_id=object_id,
                metadata=dict(metadata or {}),
            )
        )

    def add_info(
        self,
        code: str,
        message: str,
        *,
        path: Optional[str] = None,
        object_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.infos.append(
            ScientificValidationIssue(
                code=code,
                severity="info",
                message=message,
                path=path,
                object_id=object_id,
                metadata=dict(metadata or {}),
            )
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "valid": self.valid,
            "errors": [
                item.to_dict()
                for item in self.errors
            ],
            "warnings": [
                item.to_dict()
                for item in self.warnings
            ],
            "infos": [
                item.to_dict()
                for item in self.infos
            ],
            "statistics": self.statistics,
            "metadata": self.metadata,
            "summary": {
                "errors": self.error_count,
                "warnings": self.warning_count,
                "infos": self.info_count,
            },
        }


# =====================================================================
# VALIDATEUR SCIENTIFIQUE
# =====================================================================


class ScientificValidator:
    """
    Validateur scientifique central du Document IR MACEVO.

    Ce moteur est volontairement non destructif :
    il analyse le document mais ne le modifie jamais.

    Il constitue la première couche de validation scientifique
    avant les validations plus spécialisées :
        - équations avancées ;
        - figures ;
        - tableaux ;
        - citations ;
        - cohérence scientifique ;
        - validation IA.
    """

    VERSION = "1.0"

    MIN_PARAGRAPH_LENGTH = 20

    DOI_PATTERN = re.compile(
        r"^10\.\d{4,9}/\S+$",
        re.IGNORECASE,
    )

    def validate(
        self,
        document: Any,
    ) -> ScientificValidationReport:
        """
        Valide un Document IR MACEVO.
        """

        report = ScientificValidationReport(
            metadata={
                "validator": "scientific",
                "version": self.VERSION,
            }
        )

        if document is None:
            report.add_error(
                "DOCUMENT_MISSING",
                "Le document scientifique est absent.",
                path="document",
            )
            return report

        self._validate_document_metadata(
            document,
            report,
        )

        self._validate_abstract(
            document,
            report,
        )

        self._validate_keywords(
            document,
            report,
        )

        sections = getattr(
            document,
            "sections",
            None,
        ) or []

        if not sections:
            report.add_error(
                "NO_SECTIONS",
                "Le document ne contient aucune section.",
                path="document.sections",
            )

        ids: Dict[str, str] = {}
        labels: Dict[str, str] = {}

        self._validate_sections(
            sections=sections,
            report=report,
            ids=ids,
            labels=labels,
            path="document.sections",
            parent_level=0,
        )

        annexes = getattr(
            document,
            "annexes",
            None,
        ) or []

        self._validate_sections(
            sections=annexes,
            report=report,
            ids=ids,
            labels=labels,
            path="document.annexes",
            parent_level=0,
            is_annex=True,
        )

        references = getattr(
            document,
            "references",
            None,
        ) or []

        self._validate_references(
            references,
            report,
            ids,
        )

        self._build_statistics(
            document=document,
            report=report,
        )

        report.metadata.update(
            {
                "document_id": getattr(
                    document,
                    "id",
                    None,
                ),
            }
        )

        return report

    # =================================================================
    # DOCUMENT
    # =================================================================

    def _validate_document_metadata(
        self,
        document: Any,
        report: ScientificValidationReport,
    ) -> None:

        metadata = getattr(
            document,
            "metadata",
            None,
        )

        if metadata is None:
            report.add_error(
                "METADATA_MISSING",
                "Les métadonnées du document sont absentes.",
                path="document.metadata",
            )
            return

        title = str(
            getattr(
                metadata,
                "title",
                "",
            )
            or ""
        ).strip()

        if not title:
            report.add_error(
                "TITLE_MISSING",
                "Le titre du document est absent.",
                path="document.metadata.title",
            )

        document_type = str(
            getattr(
                metadata,
                "document_type",
                "",
            )
            or ""
        ).strip()

        if not document_type:
            report.add_warning(
                "DOCUMENT_TYPE_MISSING",
                "Le type du document n'est pas renseigné.",
                path="document.metadata.document_type",
            )

        language = str(
            getattr(
                metadata,
                "language",
                "",
            )
            or ""
        ).strip()

        if not language:
            report.add_warning(
                "LANGUAGE_MISSING",
                "La langue du document n'est pas renseignée.",
                path="document.metadata.language",
            )

        author = str(
            getattr(
                metadata,
                "author",
                "",
            )
            or ""
        ).strip()

        if not author:
            report.add_warning(
                "AUTHOR_MISSING",
                "L'auteur du document n'est pas renseigné.",
                path="document.metadata.author",
            )

    # =================================================================
    # ABSTRACT
    # =================================================================

    def _validate_abstract(
        self,
        document: Any,
        report: ScientificValidationReport,
    ) -> None:

        abstract = str(
            getattr(
                document,
                "abstract",
                "",
            )
            or ""
        ).strip()

        if not abstract:
            report.add_warning(
                "ABSTRACT_MISSING",
                "Le résumé scientifique est absent.",
                path="document.abstract",
            )
            return

        if len(abstract) < self.MIN_PARAGRAPH_LENGTH:
            report.add_warning(
                "ABSTRACT_TOO_SHORT",
                (
                    "Le résumé scientifique est très court "
                    "et peut nécessiter une révision."
                ),
                path="document.abstract",
            )

    # =================================================================
    # KEYWORDS
    # =================================================================

    def _validate_keywords(
        self,
        document: Any,
        report: ScientificValidationReport,
    ) -> None:

        keywords = getattr(
            document,
            "keywords",
            None,
        ) or []

        if not keywords:
            metadata = getattr(
                document,
                "metadata",
                None,
            )

            keywords = getattr(
                metadata,
                "keywords",
                None,
            ) or []

        if not keywords:
            report.add_warning(
                "KEYWORDS_MISSING",
                "Aucun mot-clé scientifique n'est défini.",
                path="document.keywords",
            )
            return

        normalized = [
            str(keyword).strip().lower()
            for keyword in keywords
            if str(keyword).strip()
        ]

        duplicates = self._duplicates(
            normalized
        )

        for keyword in duplicates:
            report.add_warning(
                "DUPLICATE_KEYWORD",
                (
                    f"Le mot-clé '{keyword}' "
                    "apparaît plusieurs fois."
                ),
                path="document.keywords",
            )

    # =================================================================
    # SECTIONS
    # =================================================================

    def _validate_sections(
        self,
        *,
        sections: list,
        report: ScientificValidationReport,
        ids: Dict[str, str],
        labels: Dict[str, str],
        path: str,
        parent_level: int,
        is_annex: bool = False,
    ) -> None:

        for index, section in enumerate(
            sections
        ):
            current_path = (
                f"{path}[{index}]"
            )

            if section is None:
                report.add_error(
                    "SECTION_MISSING",
                    "Une section est absente.",
                    path=current_path,
                )
                continue

            section_id = getattr(
                section,
                "id",
                None,
            )

            self._register_id(
                section_id,
                "section",
                current_path,
                ids,
                report,
            )

            title = str(
                getattr(
                    section,
                    "title",
                    "",
                )
                or ""
            ).strip()

            if not title:
                report.add_error(
                    "SECTION_TITLE_MISSING",
                    "Une section ne possède pas de titre.",
                    path=current_path,
                    object_id=section_id,
                )

            level = getattr(
                section,
                "level",
                None,
            )

            if not isinstance(
                level,
                int,
            ) or level < 1:
                report.add_error(
                    "INVALID_SECTION_LEVEL",
                    (
                        "Le niveau d'une section doit être "
                        "un entier supérieur ou égal à 1."
                    ),
                    path=f"{current_path}.level",
                    object_id=section_id,
                )
                level = 1

            if (
                parent_level > 0
                and level > parent_level + 1
            ):
                report.add_error(
                    "SECTION_HIERARCHY_GAP",
                    (
                        "La hiérarchie des sections contient "
                        "un saut de niveau."
                    ),
                    path=f"{current_path}.level",
                    object_id=section_id,
                    metadata={
                        "parent_level": parent_level,
                        "current_level": level,
                    },
                )

            self._validate_section_content(
                section=section,
                report=report,
                ids=ids,
                labels=labels,
                path=current_path,
            )

            children = getattr(
                section,
                "sections",
                None,
            ) or []

            self._validate_sections(
                sections=children,
                report=report,
                ids=ids,
                labels=labels,
                path=f"{current_path}.sections",
                parent_level=level,
                is_annex=is_annex,
            )

    # =================================================================
    # CONTENU D'UNE SECTION
    # =================================================================

    def _validate_section_content(
        self,
        *,
        section: Any,
        report: ScientificValidationReport,
        ids: Dict[str, str],
        labels: Dict[str, str],
        path: str,
    ) -> None:

        paragraphs = getattr(
            section,
            "paragraphs",
            None,
        ) or []

        equations = getattr(
            section,
            "equations",
            None,
        ) or []

        figures = getattr(
            section,
            "figures",
            None,
        ) or []

        tables = getattr(
            section,
            "tables",
            None,
        ) or []

        children = getattr(
            section,
            "sections",
            None,
        ) or []

        if (
            not paragraphs
            and not equations
            and not figures
            and not tables
            and not children
        ):
            report.add_warning(
                "EMPTY_SECTION",
                (
                    "La section ne contient aucun "
                    "contenu scientifique."
                ),
                path=path,
                object_id=getattr(
                    section,
                    "id",
                    None,
                ),
            )

        self._validate_paragraphs(
            paragraphs,
            report,
            ids,
            f"{path}.paragraphs",
        )

        self._validate_equations(
            equations,
            report,
            ids,
            labels,
            f"{path}.equations",
        )

        self._validate_figures(
            figures,
            report,
            ids,
            labels,
            f"{path}.figures",
        )

        self._validate_tables(
            tables,
            report,
            ids,
            labels,
            f"{path}.tables",
        )

    # =================================================================
    # PARAGRAPHES
    # =================================================================

    def _validate_paragraphs(
        self,
        paragraphs: list,
        report: ScientificValidationReport,
        ids: Dict[str, str],
        path: str,
    ) -> None:

        contents: Dict[str, str] = {}

        for index, paragraph in enumerate(
            paragraphs
        ):
            current_path = (
                f"{path}[{index}]"
            )

            if paragraph is None:
                report.add_error(
                    "PARAGRAPH_MISSING",
                    "Un paragraphe est absent.",
                    path=current_path,
                )
                continue

            paragraph_id = getattr(
                paragraph,
                "id",
                None,
            )

            self._register_id(
                paragraph_id,
                "paragraph",
                current_path,
                ids,
                report,
            )

            content = str(
                getattr(
                    paragraph,
                    "content",
                    "",
                )
                or ""
            ).strip()

            if not content:
                report.add_error(
                    "EMPTY_PARAGRAPH",
                    "Un paragraphe est vide.",
                    path=current_path,
                    object_id=paragraph_id,
                )
                continue

            normalized = self._normalize_text(
                content
            )

            if normalized in contents:
                report.add_warning(
                    "DUPLICATE_PARAGRAPH",
                    (
                        "Un paragraphe identique "
                        "existe déjà dans cette section."
                    ),
                    path=current_path,
                    object_id=paragraph_id,
                    metadata={
                        "duplicate_path": contents[
                            normalized
                        ],
                    },
                )

            else:
                contents[normalized] = (
                    current_path
                )

            if len(content) < self.MIN_PARAGRAPH_LENGTH:
                report.add_warning(
                    "SHORT_PARAGRAPH",
                    (
                        "Le paragraphe est très court "
                        "et peut nécessiter une vérification."
                    ),
                    path=current_path,
                    object_id=paragraph_id,
                )

    # =================================================================
    # ÉQUATIONS
    # =================================================================

    def _validate_equations(
        self,
        equations: list,
        report: ScientificValidationReport,
        ids: Dict[str, str],
        labels: Dict[str, str],
        path: str,
    ) -> None:

        for index, equation in enumerate(
            equations
        ):
            current_path = (
                f"{path}[{index}]"
            )

            if equation is None:
                report.add_error(
                    "EQUATION_MISSING",
                    "Une équation est absente.",
                    path=current_path,
                )
                continue

            equation_id = getattr(
                equation,
                "id",
                None,
            )

            self._register_id(
                equation_id,
                "equation",
                current_path,
                ids,
                report,
            )

            latex = str(
                getattr(
                    equation,
                    "latex",
                    "",
                )
                or ""
            ).strip()

            if not latex:
                report.add_error(
                    "EMPTY_EQUATION",
                    "Une équation ne contient aucun LaTeX.",
                    path=f"{current_path}.latex",
                    object_id=equation_id,
                )
                continue

            self._validate_latex_balance(
                latex,
                report,
                f"{current_path}.latex",
                equation_id,
            )

            label = getattr(
                equation,
                "label",
                None,
            )

            self._register_label(
                label,
                "equation",
                current_path,
                labels,
                report,
            )

    # =================================================================
    # FIGURES
    # =================================================================

    def _validate_figures(
        self,
        figures: list,
        report: ScientificValidationReport,
        ids: Dict[str, str],
        labels: Dict[str, str],
        path: str,
    ) -> None:

        for index, figure in enumerate(
            figures
        ):
            current_path = (
                f"{path}[{index}]"
            )

            if figure is None:
                report.add_error(
                    "FIGURE_MISSING",
                    "Une figure est absente.",
                    path=current_path,
                )
                continue

            figure_id = getattr(
                figure,
                "id",
                None,
            )

            self._register_id(
                figure_id,
                "figure",
                current_path,
                ids,
                report,
            )

            source = str(
                getattr(
                    figure,
                    "source",
                    "",
                )
                or ""
            ).strip()

            caption = str(
                getattr(
                    figure,
                    "caption",
                    "",
                )
                or ""
            ).strip()

            if not source:
                report.add_warning(
                    "FIGURE_SOURCE_MISSING",
                    (
                        "La figure ne possède pas "
                        "de source."
                    ),
                    path=f"{current_path}.source",
                    object_id=figure_id,
                )

            if not caption:
                report.add_warning(
                    "FIGURE_CAPTION_MISSING",
                    (
                        "La figure ne possède pas "
                        "de légende."
                    ),
                    path=f"{current_path}.caption",
                    object_id=figure_id,
                )

            self._register_label(
                getattr(
                    figure,
                    "label",
                    None,
                ),
                "figure",
                current_path,
                labels,
                report,
            )

    # =================================================================
    # TABLEAUX
    # =================================================================

    def _validate_tables(
        self,
        tables: list,
        report: ScientificValidationReport,
        ids: Dict[str, str],
        labels: Dict[str, str],
        path: str,
    ) -> None:

        for index, table in enumerate(
            tables
        ):
            current_path = (
                f"{path}[{index}]"
            )

            if table is None:
                report.add_error(
                    "TABLE_MISSING",
                    "Un tableau est absent.",
                    path=current_path,
                )
                continue

            table_id = getattr(
                table,
                "id",
                None,
            )

            self._register_id(
                table_id,
                "table",
                current_path,
                ids,
                report,
            )

            columns = getattr(
                table,
                "columns",
                None,
            ) or []

            rows = getattr(
                table,
                "rows",
                None,
            ) or []

            caption = str(
                getattr(
                    table,
                    "caption",
                    "",
                )
                or ""
            ).strip()

            if not columns:
                report.add_error(
                    "TABLE_COLUMNS_MISSING",
                    "Le tableau ne possède aucune colonne.",
                    path=f"{current_path}.columns",
                    object_id=table_id,
                )

            if not rows:
                report.add_warning(
                    "TABLE_ROWS_MISSING",
                    "Le tableau ne possède aucune ligne.",
                    path=f"{current_path}.rows",
                    object_id=table_id,
                )

            column_count = len(columns)

            for row_index, row in enumerate(
                rows
            ):
                if not isinstance(
                    row,
                    (list, tuple),
                ):
                    report.add_error(
                        "TABLE_ROW_INVALID",
                        (
                            "Une ligne de tableau "
                            "n'est pas une liste."
                        ),
                        path=(
                            f"{current_path}.rows"
                            f"[{row_index}]"
                        ),
                        object_id=table_id,
                    )
                    continue

                if len(row) != column_count:
                    report.add_error(
                        "TABLE_COLUMN_MISMATCH",
                        (
                            "Le nombre de cellules d'une ligne "
                            "ne correspond pas au nombre de colonnes."
                        ),
                        path=(
                            f"{current_path}.rows"
                            f"[{row_index}]"
                        ),
                        object_id=table_id,
                        metadata={
                            "expected": column_count,
                            "actual": len(row),
                        },
                    )

            if not caption:
                report.add_warning(
                    "TABLE_CAPTION_MISSING",
                    (
                        "Le tableau ne possède pas "
                        "de légende."
                    ),
                    path=f"{current_path}.caption",
                    object_id=table_id,
                )

            self._register_label(
                getattr(
                    table,
                    "label",
                    None,
                ),
                "table",
                current_path,
                labels,
                report,
            )

    # =================================================================
    # RÉFÉRENCES
    # =================================================================

    def _validate_references(
        self,
        references: list,
        report: ScientificValidationReport,
        ids: Dict[str, str],
    ) -> None:

        dois: Dict[str, str] = {}
        citation_keys: Dict[str, str] = {}

        for index, reference in enumerate(
            references
        ):
            current_path = (
                f"document.references[{index}]"
            )

            if reference is None:
                report.add_error(
                    "REFERENCE_MISSING",
                    "Une référence est absente.",
                    path=current_path,
                )
                continue

            reference_id = getattr(
                reference,
                "id",
                None,
            )

            self._register_id(
                reference_id,
                "reference",
                current_path,
                ids,
                report,
            )

            title = str(
                getattr(
                    reference,
                    "title",
                    "",
                )
                or ""
            ).strip()

            if not title:
                report.add_error(
                    "REFERENCE_TITLE_MISSING",
                    (
                        "Une référence bibliographique "
                        "ne possède pas de titre."
                    ),
                    path=f"{current_path}.title",
                    object_id=reference_id,
                )

            authors = getattr(
                reference,
                "authors",
                None,
            ) or []

            if not authors:
                report.add_warning(
                    "REFERENCE_AUTHORS_MISSING",
                    (
                        "Une référence ne possède "
                        "aucun auteur."
                    ),
                    path=f"{current_path}.authors",
                    object_id=reference_id,
                )

            year = getattr(
                reference,
                "year",
                None,
            )

            if year is not None:
                if (
                    not isinstance(
                        year,
                        int,
                    )
                    or year < 0
                    or year > 2100
                ):
                    report.add_error(
                        "REFERENCE_YEAR_INVALID",
                        (
                            "L'année d'une référence "
                            "n'est pas valide."
                        ),
                        path=f"{current_path}.year",
                        object_id=reference_id,
                    )

            doi = str(
                getattr(
                    reference,
                    "doi",
                    "",
                )
                or ""
            ).strip()

            if doi:
                normalized_doi = self._normalize_doi(
                    doi
                )

                if not self.DOI_PATTERN.match(
                    normalized_doi
                ):
                    report.add_warning(
                        "REFERENCE_DOI_INVALID",
                        (
                            "Le DOI d'une référence "
                            "ne correspond pas au format attendu."
                        ),
                        path=f"{current_path}.doi",
                        object_id=reference_id,
                    )

                if normalized_doi in dois:
                    report.add_error(
                        "DUPLICATE_DOI",
                        (
                            "Le même DOI est utilisé "
                            "par plusieurs références."
                        ),
                        path=f"{current_path}.doi",
                        object_id=reference_id,
                        metadata={
                            "duplicate_path": dois[
                                normalized_doi
                            ],
                        },
                    )
                else:
                    dois[
                        normalized_doi
                    ] = current_path

            citation_key = str(
                getattr(
                    reference,
                    "citation_key",
                    "",
                )
                or ""
            ).strip()

            if citation_key:
                normalized_key = (
                    citation_key.lower()
                )

                if normalized_key in citation_keys:
                    report.add_error(
                        "DUPLICATE_CITATION_KEY",
                        (
                            "La même clé de citation "
                            "est utilisée plusieurs fois."
                        ),
                        path=(
                            f"{current_path}"
                            ".citation_key"
                        ),
                        object_id=reference_id,
                        metadata={
                            "duplicate_path": citation_keys[
                                normalized_key
                            ],
                        },
                    )
                else:
                    citation_keys[
                        normalized_key
                    ] = current_path

    # =================================================================
    # IDENTIFIANTS
    # =================================================================

    @staticmethod
    def _register_id(
        object_id: Optional[str],
        object_type: str,
        path: str,
        ids: Dict[str, str],
        report: ScientificValidationReport,
    ) -> None:

        if not object_id:
            report.add_error(
                "OBJECT_ID_MISSING",
                (
                    f"L'objet de type '{object_type}' "
                    "ne possède pas d'identifiant."
                ),
                path=path,
            )
            return

        if object_id in ids:
            report.add_error(
                "DUPLICATE_OBJECT_ID",
                (
                    f"L'identifiant '{object_id}' "
                    "est utilisé plusieurs fois."
                ),
                path=path,
                object_id=object_id,
                metadata={
                    "duplicate_path": ids[
                        object_id
                    ],
                    "object_type": object_type,
                },
            )
            return

        ids[
            object_id
        ] = path

    # =================================================================
    # LABELS
    # =================================================================

    @staticmethod
    def _register_label(
        label: Optional[str],
        object_type: str,
        path: str,
        labels: Dict[str, str],
        report: ScientificValidationReport,
    ) -> None:

        if not label:
            return

        normalized = str(
            label
        ).strip().lower()

        if not normalized:
            return

        if normalized in labels:
            report.add_error(
                "DUPLICATE_LABEL",
                (
                    f"Le label '{label}' est utilisé "
                    "plusieurs fois."
                ),
                path=f"{path}.label",
                metadata={
                    "duplicate_path": labels[
                        normalized
                    ],
                    "object_type": object_type,
                },
            )
            return

        labels[
            normalized
        ] = path

    # =================================================================
    # LATEX
    # =================================================================

    def _validate_latex_balance(
        self,
        latex: str,
        report: ScientificValidationReport,
        path: str,
        object_id: Optional[str],
    ) -> None:

        if latex.count("{") != latex.count("}"):
            report.add_error(
                "LATEX_BRACE_MISMATCH",
                (
                    "L'équation contient un nombre "
                    "déséquilibré d'accolades LaTeX."
                ),
                path=path,
                object_id=object_id,
            )

        if latex.count("[") != latex.count("]"):
            report.add_warning(
                "LATEX_BRACKET_MISMATCH",
                (
                    "L'équation contient un nombre "
                    "déséquilibré de crochets."
                ),
                path=path,
                object_id=object_id,
            )

        begin_count = len(
            re.findall(
                r"\\begin\{([^}]+)\}",
                latex,
            )
        )

        end_count = len(
            re.findall(
                r"\\end\{([^}]+)\}",
                latex,
            )
        )

        if begin_count != end_count:
            report.add_error(
                "LATEX_ENVIRONMENT_MISMATCH",
                (
                    "Les environnements LaTeX "
                    "\\begin / \\end semblent déséquilibrés."
                ),
                path=path,
                object_id=object_id,
            )

    # =================================================================
    # STATISTIQUES
    # =================================================================

    def _build_statistics(
        self,
        *,
        document: Any,
        report: ScientificValidationReport,
    ) -> None:

        statistics = {
            "sections": 0,
            "paragraphs": 0,
            "equations": 0,
            "figures": 0,
            "tables": 0,
            "references": len(
                getattr(
                    document,
                    "references",
                    None,
                )
                or []
            ),
            "annexes": 0,
        }

        def walk_sections(
            sections: list,
        ) -> None:

            for section in sections:
                if section is None:
                    continue

                statistics[
                    "sections"
                ] += 1

                statistics[
                    "paragraphs"
                ] += len(
                    getattr(
                        section,
                        "paragraphs",
                        None,
                    )
                    or []
                )

                statistics[
                    "equations"
                ] += len(
                    getattr(
                        section,
                        "equations",
                        None,
                    )
                    or []
                )

                statistics[
                    "figures"
                ] += len(
                    getattr(
                        section,
                        "figures",
                        None,
                    )
                    or []
                )

                statistics[
                    "tables"
                ] += len(
                    getattr(
                        section,
                        "tables",
                        None,
                    )
                    or []
                )

                walk_sections(
                    getattr(
                        section,
                        "sections",
                        None,
                    )
                    or []
                )

        walk_sections(
            getattr(
                document,
                "sections",
                None,
            )
            or []
        )

        statistics[
            "annexes"
        ] = len(
            getattr(
                document,
                "annexes",
                None,
            )
            or []
        )

        report.statistics = statistics

    # =================================================================
    # UTILITAIRES
    # =================================================================

    @staticmethod
    def _normalize_text(
        value: str,
    ) -> str:
        return " ".join(
            value.lower().split()
        )

    @staticmethod
    def _normalize_doi(
        doi: str,
    ) -> str:

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

        return value.strip().lower()

    @staticmethod
    def _duplicates(
        values: List[str],
    ) -> List[str]:

        seen = set()
        duplicates = []

        for value in values:
            if value in seen:
                if value not in duplicates:
                    duplicates.append(value)
            else:
                seen.add(value)

        return duplicates


__all__ = [
    "ScientificValidationIssue",
    "ScientificValidationReport",
    "ScientificValidator",
]