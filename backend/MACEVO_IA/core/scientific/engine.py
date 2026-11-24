from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from core.document.ir import Document, Section


@dataclass
class ScientificAnalysis:
    """
    Résultat structuré d'une analyse scientifique.
    """

    subject: str = ""
    research_question: str = ""
    problem_statement: str = ""

    objectives: List[str] = field(
        default_factory=list
    )

    hypotheses: List[str] = field(
        default_factory=list
    )

    methodology: List[str] = field(
        default_factory=list
    )

    expected_results: List[str] = field(
        default_factory=list
    )

    keywords: List[str] = field(
        default_factory=list
    )

    document_type: str = "scientific"

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "subject": self.subject,
            "research_question": self.research_question,
            "problem_statement": self.problem_statement,
            "objectives": self.objectives,
            "hypotheses": self.hypotheses,
            "methodology": self.methodology,
            "expected_results": self.expected_results,
            "keywords": self.keywords,
            "document_type": self.document_type,
            "metadata": self.metadata,
        }


class ScientificEngine:
    """
    Moteur scientifique central de MACEVO.

    Responsabilités initiales :
    - analyser une demande scientifique ;
    - produire une structure scientifique ;
    - construire un Document IR ;
    - préparer les données nécessaires aux futurs moteurs IA.

    Le moteur ne dépend d'aucun fournisseur IA.
    """

    DEFAULT_STRUCTURE = [
        ("Introduction", 1),
        ("Revue de littérature", 1),
        ("Problématique et hypothèses", 1),
        ("Méthodologie", 1),
        ("Résultats", 1),
        ("Discussion", 1),
        ("Conclusion", 1),
    ]

    DOCUMENT_STRUCTURES = {
        "article": [
            ("Introduction", 1),
            ("Revue de littérature", 1),
            ("Méthodologie", 1),
            ("Résultats", 1),
            ("Discussion", 1),
            ("Conclusion", 1),
        ],
        "rapport": [
            ("Introduction", 1),
            ("Contexte et état de l'art", 1),
            ("Problématique", 1),
            ("Méthodologie", 1),
            ("Résultats", 1),
            ("Discussion", 1),
            ("Conclusion et recommandations", 1),
        ],
        "these": [
            ("Introduction générale", 1),
            ("Cadre théorique et revue de littérature", 1),
            ("Problématique et hypothèses", 1),
            ("Méthodologie générale", 1),
            ("Résultats", 1),
            ("Discussion générale", 1),
            ("Conclusion générale", 1),
        ],
        "memoire": [
            ("Introduction", 1),
            ("Revue de littérature", 1),
            ("Problématique et hypothèses", 1),
            ("Méthodologie", 1),
            ("Résultats", 1),
            ("Discussion", 1),
            ("Conclusion", 1),
        ],
    }

    def analyze(
        self,
        subject: str,
        *,
        document_type: str = "scientific",
        research_question: str = "",
        problem_statement: str = "",
        objectives: Optional[List[str]] = None,
        hypotheses: Optional[List[str]] = None,
        methodology: Optional[List[str]] = None,
        keywords: Optional[List[str]] = None,
    ) -> ScientificAnalysis:
        """
        Construit une analyse scientifique structurée.

        Cette méthode est déterministe pour l'instant.
        Un futur modèle IA pourra enrichir cette analyse.
        """

        subject = self._clean(subject)

        if not subject:
            raise ValueError(
                "Le sujet scientifique ne peut pas être vide."
            )

        normalized_type = self._normalize_document_type(
            document_type
        )

        return ScientificAnalysis(
            subject=subject,
            research_question=self._clean(
                research_question
            ),
            problem_statement=self._clean(
                problem_statement
            ),
            objectives=self._clean_list(
                objectives
            ),
            hypotheses=self._clean_list(
                hypotheses
            ),
            methodology=self._clean_list(
                methodology
            ),
            keywords=self._clean_list(
                keywords
            ),
            document_type=normalized_type,
        )

    def create_document(
        self,
        analysis: ScientificAnalysis,
        *,
        title: Optional[str] = None,
    ) -> Document:
        """
        Transforme une analyse scientifique en Document IR.
        """

        if not isinstance(
            analysis,
            ScientificAnalysis,
        ):
            raise TypeError(
                "analysis doit être une instance de "
                "ScientificAnalysis."
            )

        document = Document()

        document.metadata.title = (
            title.strip()
            if isinstance(title, str)
            and title.strip()
            else analysis.subject
        )

        document.metadata.document_type = (
            analysis.document_type
        )

        document.keywords = list(
            analysis.keywords
        )

        document.metadata.keywords = list(
            analysis.keywords
        )

        self._populate_document(
            document=document,
            analysis=analysis,
        )

        return document

    def build_structure(
        self,
        document_type: str = "scientific",
    ) -> List[Dict[str, Any]]:
        """
        Retourne la structure canonique d'un type de document.
        """

        normalized_type = self._normalize_document_type(
            document_type
        )

        structure = self.DOCUMENT_STRUCTURES.get(
            normalized_type,
            self.DEFAULT_STRUCTURE,
        )

        return [
            {
                "title": title,
                "level": level,
            }
            for title, level in structure
        ]

    def _populate_document(
        self,
        document: Document,
        analysis: ScientificAnalysis,
    ) -> None:

        structure = self.DOCUMENT_STRUCTURES.get(
            analysis.document_type,
            self.DEFAULT_STRUCTURE,
        )

        for title, level in structure:

            section = document.add_section(
                title=title,
                level=level,
            )

            self._populate_section(
                section=section,
                title=title,
                analysis=analysis,
            )

    def _populate_section(
        self,
        section: Section,
        title: str,
        analysis: ScientificAnalysis,
    ) -> None:

        normalized = title.lower()

        if "introduction" in normalized:

            section.add_paragraph(
                f"Cette étude porte sur : "
                f"{analysis.subject}."
            )

            if analysis.problem_statement:
                section.add_paragraph(
                    analysis.problem_statement,
                    style="problem-statement",
                )

            if analysis.research_question:
                section.add_paragraph(
                    analysis.research_question,
                    style="research-question",
                )

        elif (
            "problématique" in normalized
            or "hypothèses" in normalized
        ):

            if analysis.problem_statement:
                section.add_paragraph(
                    analysis.problem_statement,
                    style="problem-statement",
                )

            for hypothesis in analysis.hypotheses:
                section.add_paragraph(
                    hypothesis,
                    style="hypothesis",
                )

        elif "méthodologie" in normalized:

            for method in analysis.methodology:
                section.add_paragraph(
                    method,
                    style="methodology",
                )

        elif "conclusion" in normalized:

            section.add_paragraph(
                "La conclusion sera construite à partir "
                "des résultats et de leur interprétation."
            )

        elif "résultats" in normalized:

            section.add_paragraph(
                "Les résultats seront intégrés et "
                "structurés à partir des données de l'étude."
            )

        elif "discussion" in normalized:

            section.add_paragraph(
                "La discussion mettra en relation les "
                "résultats obtenus avec la littérature "
                "scientifique et les hypothèses."
            )

    @staticmethod
    def _clean(value: Any) -> str:
        if value is None:
            return ""

        return str(value).strip()

    @classmethod
    def _clean_list(
        cls,
        values: Optional[List[str]],
    ) -> List[str]:

        if not values:
            return []

        result = []

        for value in values:

            cleaned = cls._clean(value)

            if cleaned:
                result.append(cleaned)

        return result

    @staticmethod
    def _normalize_document_type(
        document_type: str,
    ) -> str:

        value = (
            str(document_type or "scientific")
            .strip()
            .lower()
        )

        aliases = {
            "thèse": "these",
            "these": "these",
            "mémoire": "memoire",
            "memoire": "memoire",
            "article scientifique": "article",
            "article": "article",
            "rapport scientifique": "rapport",
            "rapport": "rapport",
        }

        return aliases.get(
            value,
            value or "scientific",
        )