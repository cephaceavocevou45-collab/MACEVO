from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional


@dataclass
class ResearchObjective:
    """
    Objectif scientifique individuel.
    """

    title: str
    description: str = ""
    objective_type: str = "specific"
    order: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "description": self.description,
            "objective_type": self.objective_type,
            "order": self.order,
        }


@dataclass
class ResearchHypothesis:
    """
    Hypothèse scientifique.
    """

    statement: str
    variable_independent: Optional[str] = None
    variable_dependent: Optional[str] = None
    rationale: str = ""
    order: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "statement": self.statement,
            "variable_independent": self.variable_independent,
            "variable_dependent": self.variable_dependent,
            "rationale": self.rationale,
            "order": self.order,
        }


@dataclass
class ResearchSection:
    """
    Élément du plan scientifique.
    """

    title: str
    purpose: str = ""
    order: int = 0
    required: bool = True
    section_type: str = "section"
    children: List["ResearchSection"] = field(
        default_factory=list
    )

    def add_child(
        self,
        section: "ResearchSection",
    ) -> None:
        if not isinstance(section, ResearchSection):
            raise TypeError(
                "section doit être une instance de ResearchSection."
            )

        self.children.append(section)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "purpose": self.purpose,
            "order": self.order,
            "required": self.required,
            "section_type": self.section_type,
            "children": [
                child.to_dict()
                for child in self.children
            ],
        }


@dataclass
class ResearchPlan:
    """
    Plan scientifique complet.

    Ce modèle constitue une représentation intermédiaire entre
    l'intention de l'utilisateur et la génération du document.
    """

    subject: str

    research_question: str = ""

    problem_statement: str = ""

    general_objective: str = ""

    objectives: List[ResearchObjective] = field(
        default_factory=list
    )

    hypotheses: List[ResearchHypothesis] = field(
        default_factory=list
    )

    methodology: Dict[str, Any] = field(
        default_factory=dict
    )

    expected_results: List[str] = field(
        default_factory=list
    )

    keywords: List[str] = field(
        default_factory=list
    )

    document_type: str = "thesis"

    sections: List[ResearchSection] = field(
        default_factory=list
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    def add_objective(
        self,
        objective: ResearchObjective,
    ) -> None:
        if not isinstance(objective, ResearchObjective):
            raise TypeError(
                "objective doit être une instance de ResearchObjective."
            )

        objective.order = len(self.objectives) + 1
        self.objectives.append(objective)

    def add_hypothesis(
        self,
        hypothesis: ResearchHypothesis,
    ) -> None:
        if not isinstance(
            hypothesis,
            ResearchHypothesis,
        ):
            raise TypeError(
                "hypothesis doit être une instance "
                "de ResearchHypothesis."
            )

        hypothesis.order = len(self.hypotheses) + 1
        self.hypotheses.append(hypothesis)

    def add_section(
        self,
        section: ResearchSection,
    ) -> None:
        if not isinstance(section, ResearchSection):
            raise TypeError(
                "section doit être une instance de ResearchSection."
            )

        section.order = len(self.sections) + 1
        self.sections.append(section)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "subject": self.subject,
            "research_question": self.research_question,
            "problem_statement": self.problem_statement,
            "general_objective": self.general_objective,
            "objectives": [
                objective.to_dict()
                for objective in self.objectives
            ],
            "hypotheses": [
                hypothesis.to_dict()
                for hypothesis in self.hypotheses
            ],
            "methodology": dict(self.methodology),
            "expected_results": list(
                self.expected_results
            ),
            "keywords": list(self.keywords),
            "document_type": self.document_type,
            "sections": [
                section.to_dict()
                for section in self.sections
            ],
            "metadata": dict(self.metadata),
        }


class ScientificResearchPlanner:
    """
    Planificateur scientifique de MACEVO.

    Cette version constitue le moteur déterministe de base.
    Le raisonnement IA sera branché ensuite afin d'enrichir
    et de personnaliser le plan.
    """

    DOCUMENT_TEMPLATES = {
        "article": [
            (
                "Introduction",
                "Présenter le contexte, la problématique et les objectifs.",
            ),
            (
                "Revue de littérature",
                "Présenter et analyser les connaissances existantes.",
            ),
            (
                "Méthodologie",
                "Décrire les méthodes et protocoles utilisés.",
            ),
            (
                "Résultats",
                "Présenter les résultats obtenus.",
            ),
            (
                "Discussion",
                "Interpréter les résultats et les comparer à la littérature.",
            ),
            (
                "Conclusion",
                "Synthétiser les résultats et les perspectives.",
            ),
        ],
        "rapport": [
            (
                "Introduction",
                "Présenter le contexte et les objectifs du rapport.",
            ),
            (
                "Contexte et état des connaissances",
                "Présenter le contexte scientifique et technique.",
            ),
            (
                "Méthodologie",
                "Décrire l'approche adoptée.",
            ),
            (
                "Résultats",
                "Présenter les résultats.",
            ),
            (
                "Analyse et discussion",
                "Analyser et interpréter les résultats.",
            ),
            (
                "Conclusion et recommandations",
                "Synthétiser les conclusions et recommandations.",
            ),
        ],
        "memoire": [
            (
                "Introduction générale",
                "Présenter le contexte, la problématique et les objectifs.",
            ),
            (
                "Revue de littérature",
                "Analyser les travaux antérieurs.",
            ),
            (
                "Cadre méthodologique",
                "Présenter la méthodologie de recherche.",
            ),
            (
                "Résultats",
                "Présenter les résultats de l'étude.",
            ),
            (
                "Discussion",
                "Interpréter les résultats.",
            ),
            (
                "Conclusion générale",
                "Présenter les conclusions et perspectives.",
            ),
        ],
        "these": [
            (
                "Introduction générale",
                "Présenter le contexte scientifique et la problématique.",
            ),
            (
                "État de l'art",
                "Analyser de manière critique les connaissances existantes.",
            ),
            (
                "Cadre théorique",
                "Présenter les concepts et modèles théoriques.",
            ),
            (
                "Méthodologie générale",
                "Présenter la stratégie et les méthodes de recherche.",
            ),
            (
                "Résultats",
                "Présenter les résultats des travaux.",
            ),
            (
                "Discussion générale",
                "Interpréter les résultats et leurs implications.",
            ),
            (
                "Conclusion générale",
                "Synthétiser les contributions et perspectives.",
            ),
        ],
    }

    def create_plan(
        self,
        subject: str,
        *,
        research_question: str = "",
        problem_statement: str = "",
        general_objective: str = "",
        objectives: Optional[Iterable[str]] = None,
        hypotheses: Optional[Iterable[str]] = None,
        methodology: Optional[Dict[str, Any]] = None,
        expected_results: Optional[Iterable[str]] = None,
        keywords: Optional[Iterable[str]] = None,
        document_type: str = "these",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ResearchPlan:
        """
        Crée un plan scientifique structuré.
        """

        if not isinstance(subject, str):
            raise TypeError(
                "subject doit être une chaîne de caractères."
            )

        subject = subject.strip()

        if not subject:
            raise ValueError(
                "Le sujet scientifique ne peut pas être vide."
            )

        normalized_type = (
            document_type.strip().lower()
            if isinstance(document_type, str)
            else "these"
        )

        if normalized_type not in self.DOCUMENT_TEMPLATES:
            normalized_type = "these"

        plan = ResearchPlan(
            subject=subject,
            research_question=research_question.strip(),
            problem_statement=problem_statement.strip(),
            general_objective=general_objective.strip(),
            methodology=dict(methodology or {}),
            expected_results=[
                item.strip()
                for item in (expected_results or [])
                if isinstance(item, str) and item.strip()
            ],
            keywords=[
                item.strip()
                for item in (keywords or [])
                if isinstance(item, str) and item.strip()
            ],
            document_type=normalized_type,
            metadata=dict(metadata or {}),
        )

        for objective in objectives or []:
            if isinstance(objective, str):
                objective = objective.strip()

                if objective:
                    plan.add_objective(
                        ResearchObjective(
                            title=objective,
                            description=objective,
                        )
                    )

        for hypothesis in hypotheses or []:
            if isinstance(hypothesis, str):
                hypothesis = hypothesis.strip()

                if hypothesis:
                    plan.add_hypothesis(
                        ResearchHypothesis(
                            statement=hypothesis
                        )
                    )

        self._build_sections(plan)

        return plan

    def _build_sections(
        self,
        plan: ResearchPlan,
    ) -> None:
        template = self.DOCUMENT_TEMPLATES[
            plan.document_type
        ]

        for title, purpose in template:
            plan.add_section(
                ResearchSection(
                    title=title,
                    purpose=purpose,
                    section_type="major",
                )
            )

    def validate_plan(
        self,
        plan: ResearchPlan,
    ) -> List[str]:
        """
        Validation logique minimale du plan.
        """

        if not isinstance(plan, ResearchPlan):
            raise TypeError(
                "plan doit être une instance de ResearchPlan."
            )

        errors: List[str] = []

        if not plan.subject.strip():
            errors.append(
                "Le sujet scientifique est obligatoire."
            )

        if not plan.research_question.strip():
            errors.append(
                "La question de recherche est absente."
            )

        if not plan.problem_statement.strip():
            errors.append(
                "La problématique est absente."
            )

        if not plan.general_objective.strip():
            errors.append(
                "L'objectif général est absent."
            )

        if not plan.objectives:
            errors.append(
                "Aucun objectif spécifique n'est défini."
            )

        if not plan.sections:
            errors.append(
                "Aucune section scientifique n'est définie."
            )

        return errors

    def enrich_plan(
        self,
        plan: ResearchPlan,
        *,
        research_question: Optional[str] = None,
        problem_statement: Optional[str] = None,
        general_objective: Optional[str] = None,
        keywords: Optional[Iterable[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ResearchPlan:
        """
        Enrichit un plan existant sans détruire ses données.
        """

        if not isinstance(plan, ResearchPlan):
            raise TypeError(
                "plan doit être une instance de ResearchPlan."
            )

        if research_question is not None:
            plan.research_question = (
                research_question.strip()
            )

        if problem_statement is not None:
            plan.problem_statement = (
                problem_statement.strip()
            )

        if general_objective is not None:
            plan.general_objective = (
                general_objective.strip()
            )

        if keywords is not None:
            for keyword in keywords:
                if (
                    isinstance(keyword, str)
                    and keyword.strip()
                    and keyword.strip()
                    not in plan.keywords
                ):
                    plan.keywords.append(
                        keyword.strip()
                    )

        if metadata:
            plan.metadata.update(metadata)

        return plan