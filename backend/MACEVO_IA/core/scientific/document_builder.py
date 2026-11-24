from __future__ import annotations

from typing import Any, Dict, Optional

from core.document.engine import DocumentEngine
from core.document.ir import Document, Section
from core.scientific.research import (
    ResearchPlan,
    ResearchSection,
)


class ScientificDocumentBuilder:
    """
    Transforme un ResearchPlan en Document IR MACEVO.

    Responsabilité :

        ResearchPlan
             ↓
        Document IR

    Ce composant ne génère pas encore le contenu avec l'IA.
    Il construit d'abord une structure documentaire propre,
    stable et exploitable par les moteurs suivants.
    """

    def __init__(
        self,
        document_engine: Optional[DocumentEngine] = None,
    ):
        self.document_engine = (
            document_engine or DocumentEngine()
        )

    # ================================================================
    # BUILD
    # ================================================================

    def build(
        self,
        plan: ResearchPlan,
        *,
        title: Optional[str] = None,
        author: Optional[str] = None,
        institution: Optional[str] = None,
        department: Optional[str] = None,
        supervisor: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Document:
        """
        Transforme un ResearchPlan en Document.
        """

        if not isinstance(plan, ResearchPlan):
            raise TypeError(
                "plan doit être une instance de ResearchPlan."
            )

        validation_errors = self._validate_plan(plan)

        if validation_errors:
            raise ValueError(
                "ResearchPlan invalide : "
                + " | ".join(validation_errors)
            )

        document_title = (
            title.strip()
            if isinstance(title, str) and title.strip()
            else self._default_title(plan)
        )

        document_metadata = {
            "research_question": plan.research_question,
            "problem_statement": plan.problem_statement,
            "general_objective": plan.general_objective,
            "document_type": plan.document_type,
            "keywords": list(plan.keywords),
            "objectives": [
                objective.to_dict()
                for objective in plan.objectives
            ],
            "hypotheses": [
                hypothesis.to_dict()
                for hypothesis in plan.hypotheses
            ],
            "methodology": dict(plan.methodology),
            "expected_results": list(
                plan.expected_results
            ),
            "research_plan": plan.to_dict(),
            **dict(plan.metadata),
            **dict(metadata or {}),
        }

        document = self.document_engine.create(
            title=document_title,
            author=author or "",
            institution=institution or "",
            metadata=document_metadata,
        )

        self._build_research_sections(
            document=document,
            plan=plan,
        )

        return document

    # ================================================================
    # SECTIONS
    # ================================================================

    def _build_research_sections(
        self,
        document: Document,
        plan: ResearchPlan,
    ) -> None:

        for research_section in plan.sections:
            self._add_research_section(
                document=document,
                parent=None,
                research_section=research_section,
            )

    def _add_research_section(
        self,
        document: Document,
        parent: Optional[Section],
        research_section: ResearchSection,
    ) -> Section:
        """
        Ajoute récursivement une section et ses sous-sections.
        """

        section = self._add_section(
            document=document,
            parent=parent,
            title=research_section.title,
        )

        self._attach_section_metadata(
            section=section,
            research_section=research_section,
        )

        for child in research_section.children:
            self._add_research_section(
                document=document,
                parent=section,
                research_section=child,
            )

        return section

    def _add_section(
        self,
        document: Document,
        parent: Optional[Section],
        title: str,
    ) -> Section:
        """
        Ajoute une section à la racine ou à une section parente.
        """

        if parent is None:
            return self.document_engine.add_section(
                document=document,
                title=title,
            )

        return self.document_engine.add_section(
            document=document,
            title=title,
            parent=parent,
        )

    # ================================================================
    # SECTION METADATA
    # ================================================================

    def _attach_section_metadata(
        self,
        section: Section,
        research_section: ResearchSection,
    ) -> None:
        """
        Conserve les informations du ResearchPlan sur la section IR.
        """

        metadata = getattr(
            section,
            "metadata",
            None,
        )

        if metadata is None:
            try:
                section.metadata = {}
                metadata = section.metadata
            except Exception:
                return

        if isinstance(metadata, dict):
            metadata.update(
                {
                    "research_section_type": (
                        research_section.section_type
                    ),
                    "research_section_purpose": (
                        research_section.purpose
                    ),
                    "research_section_required": (
                        research_section.required
                    ),
                    "research_section_order": (
                        research_section.order
                    ),
                }
            )

    # ================================================================
    # PLAN VALIDATION
    # ================================================================

    def _validate_plan(
        self,
        plan: ResearchPlan,
    ) -> list[str]:
        """
        Vérifie les informations indispensables avant construction.
        """

        errors: list[str] = []

        if not plan.subject.strip():
            errors.append(
                "Le sujet est obligatoire."
            )

        if not plan.sections:
            errors.append(
                "Le plan ne contient aucune section."
            )

        return errors

    # ================================================================
    # DEFAULT TITLE
    # ================================================================

    def _default_title(
        self,
        plan: ResearchPlan,
    ) -> str:
        """
        Produit un titre de document raisonnable lorsque
        l'utilisateur n'en fournit pas.
        """

        subject = plan.subject.strip()

        if plan.document_type == "article":
            return subject

        if plan.document_type == "rapport":
            return f"Rapport scientifique — {subject}"

        if plan.document_type == "memoire":
            return f"Mémoire de recherche — {subject}"

        return f"Thèse de recherche — {subject}"