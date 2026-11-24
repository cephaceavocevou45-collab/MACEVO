from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

from core.ai.contracts.result import AIResult, ResultStatus
from core.ai.generation.engine import GenerationEngine
from core.document.engine import DocumentEngine
from core.document.ir import (
    Document,
    Equation,
    Figure,
    Reference,
    Section,
    Table,
)


class ScientificGenerationEngine:
    """
    Moteur spécialisé de génération scientifique de MACEVO IA.

    Il constitue la couche entre :

        AI / GenerationEngine
                ↓
        ScientificGenerationEngine
                ↓
        Document IR

    Le moteur ne dépend d'aucun fournisseur IA particulier.
    """

    def __init__(
        self,
        generation_engine: Optional[GenerationEngine] = None,
        document_engine: Optional[DocumentEngine] = None,
    ):
        self.generation_engine = (
            generation_engine or GenerationEngine()
        )
        self.document_engine = (
            document_engine or DocumentEngine()
        )

    # ================================================================
    # SECTION
    # ================================================================

    def generate_section(
        self,
        document: Document,
        section: Section,
        *,
        topic: Optional[str] = None,
        instructions: Optional[Iterable[str]] = None,
        context: Optional[str] = None,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AIResult:
        """
        Génère une section scientifique complète.
        """

        if not isinstance(document, Document):
            raise TypeError(
                "document doit être une instance de Document."
            )

        if not isinstance(section, Section):
            raise TypeError(
                "section doit être une instance de Section."
            )

        prompt = self._build_scientific_section_prompt(
            document=document,
            section=section,
            topic=topic,
            context=context,
        )

        generation_metadata = dict(metadata or {})

        generation_metadata.update(
            {
                "scientific_generation": True,
                "generation_type": "scientific_section",
                "document_id": document.id,
                "section_id": section.id,
            }
        )

        result = self.generation_engine.generate_text(
            prompt=prompt,
            user_id=user_id,
            conversation_id=conversation_id,
            document_id=document.id,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens,
            instructions=instructions,
            metadata=generation_metadata,
        )

        if result.status == ResultStatus.FAILED:
            return result

        content = self.generation_engine.extract_text(result)

        if not content:
            return AIResult(
                status=ResultStatus.PARTIAL,
                request_id=result.request_id,
                message=(
                    "La génération a été exécutée, "
                    "mais aucun contenu textuel exploitable "
                    "n'a été retourné."
                ),
                data={
                    "document_id": document.id,
                    "section_id": section.id,
                },
                warnings=[
                    "Aucun texte exploitable n'a été extrait."
                ],
            )

        paragraph = self.document_engine.add_paragraph(
            target=section,
            content=content,
        )

        return AIResult(
            status=ResultStatus.SUCCESS,
            request_id=result.request_id,
            message="Section scientifique générée avec succès.",
            data={
                "document_id": document.id,
                "section_id": section.id,
                "paragraph_id": paragraph.id,
                "content": content,
                "source_result": result.to_dict(),
            },
        )

    # ================================================================
    # EQUATION
    # ================================================================

    def generate_equation(
        self,
        section: Section,
        *,
        description: str,
        context: Optional[str] = None,
        label: Optional[str] = None,
        number: Optional[str] = None,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        document_id: Optional[str] = None,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AIResult:
        """
        Génère une équation scientifique au format LaTeX.

        La réponse IA est ensuite transformée en objet Equation.
        """

        if not isinstance(section, Section):
            raise TypeError(
                "section doit être une instance de Section."
            )

        if not isinstance(description, str):
            raise TypeError(
                "description doit être une chaîne de caractères."
            )

        description = description.strip()

        if not description:
            raise ValueError(
                "La description de l'équation ne peut pas être vide."
            )

        prompt = self._build_equation_prompt(
            description=description,
            context=context,
        )

        result = self.generation_engine.generate_text(
            prompt=prompt,
            user_id=user_id,
            conversation_id=conversation_id,
            document_id=document_id,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens,
            instructions=[
                "Retourner uniquement une équation LaTeX.",
                "Ne pas utiliser de bloc Markdown.",
                "Ne pas ajouter d'explication.",
            ],
            metadata={
                **dict(metadata or {}),
                "generation_type": "equation",
            },
        )

        if result.status == ResultStatus.FAILED:
            return result

        latex = self.generation_engine.extract_text(result)

        latex = self._clean_latex(latex)

        if not latex:
            return AIResult(
                status=ResultStatus.PARTIAL,
                request_id=result.request_id,
                message=(
                    "Aucune équation LaTeX exploitable "
                    "n'a été générée."
                ),
                data={
                    "section_id": section.id,
                },
            )

        equation = self.document_engine.add_equation(
            section=section,
            latex=latex,
            label=label,
            number=number,
        )

        return AIResult(
            status=ResultStatus.SUCCESS,
            request_id=result.request_id,
            message="Équation générée avec succès.",
            data={
                "section_id": section.id,
                "equation_id": equation.id,
                "latex": latex,
            },
        )

    # ================================================================
    # FIGURE
    # ================================================================

    def generate_figure(
        self,
        section: Section,
        *,
        description: str,
        caption: Optional[str] = None,
        label: Optional[str] = None,
        context: Optional[str] = None,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        document_id: Optional[str] = None,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AIResult:
        """
        Génère une description scientifique de figure.

        La création graphique réelle sera branchée plus tard
        sur un outil de génération de figures.
        """

        if not isinstance(section, Section):
            raise TypeError(
                "section doit être une instance de Section."
            )

        description = description.strip()

        if not description:
            raise ValueError(
                "La description de la figure ne peut pas être vide."
            )

        prompt = self._build_figure_prompt(
            description=description,
            context=context,
        )

        result = self.generation_engine.generate_text(
            prompt=prompt,
            user_id=user_id,
            conversation_id=conversation_id,
            document_id=document_id,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens,
            instructions=[
                "Décrire précisément la figure scientifique.",
                "Ne pas inventer de données expérimentales.",
                "Retourner uniquement la description.",
            ],
            metadata={
                **dict(metadata or {}),
                "generation_type": "figure",
            },
        )

        if result.status == ResultStatus.FAILED:
            return result

        generated_description = (
            self.generation_engine.extract_text(result)
        )

        if not generated_description:
            return AIResult(
                status=ResultStatus.PARTIAL,
                request_id=result.request_id,
                message="Aucune description de figure générée.",
                data={
                    "section_id": section.id,
                },
            )

        final_caption = caption or generated_description

        figure = self.document_engine.add_figure(
            section=section,
            path="",
            caption=final_caption,
            label=label,
        )

        return AIResult(
            status=ResultStatus.SUCCESS,
            request_id=result.request_id,
            message="Figure scientifique préparée avec succès.",
            data={
                "section_id": section.id,
                "figure_id": figure.id,
                "description": generated_description,
                "caption": final_caption,
                "requires_graphic_generation": True,
            },
        )

    # ================================================================
    # TABLEAU
    # ================================================================

    def generate_table(
        self,
        section: Section,
        *,
        description: str,
        context: Optional[str] = None,
        caption: Optional[str] = None,
        label: Optional[str] = None,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        document_id: Optional[str] = None,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AIResult:
        """
        Génère la structure logique d'un tableau scientifique.

        Cette première version produit une représentation structurée.
        Le parsing avancé des cellules sera renforcé ensuite.
        """

        if not isinstance(section, Section):
            raise TypeError(
                "section doit être une instance de Section."
            )

        description = description.strip()

        if not description:
            raise ValueError(
                "La description du tableau ne peut pas être vide."
            )

        prompt = self._build_table_prompt(
            description=description,
            context=context,
        )

        result = self.generation_engine.generate_text(
            prompt=prompt,
            user_id=user_id,
            conversation_id=conversation_id,
            document_id=document_id,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens,
            instructions=[
                "Produire uniquement le contenu du tableau.",
                "Ne pas inventer de données.",
                "Utiliser des données fournies lorsqu'elles existent.",
            ],
            metadata={
                **dict(metadata or {}),
                "generation_type": "table",
            },
        )

        if result.status == ResultStatus.FAILED:
            return result

        content = self.generation_engine.extract_text(result)

        if not content:
            return AIResult(
                status=ResultStatus.PARTIAL,
                request_id=result.request_id,
                message="Aucun contenu de tableau généré.",
                data={
                    "section_id": section.id,
                },
            )

        table = self.document_engine.add_table(
            section=section,
            caption=caption or description,
            label=label,
            data={
                "generated_content": content,
                "source": "ai",
            },
        )

        return AIResult(
            status=ResultStatus.SUCCESS,
            request_id=result.request_id,
            message="Tableau scientifique préparé avec succès.",
            data={
                "section_id": section.id,
                "table_id": table.id,
                "content": content,
            },
        )

    # ================================================================
    # BIBLIOGRAPHIE
    # ================================================================

    def generate_reference(
        self,
        document: Document,
        *,
        citation_request: str,
        style: str = "APA",
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AIResult:
        """
        Prépare une référence bibliographique.

        Important :
        l'IA ne doit pas être considérée comme une source fiable
        pour inventer des références. La vérification des sources
        sera assurée par le futur système de recherche/citation.
        """

        if not isinstance(document, Document):
            raise TypeError(
                "document doit être une instance de Document."
            )

        citation_request = citation_request.strip()

        if not citation_request:
            raise ValueError(
                "La demande bibliographique ne peut pas être vide."
            )

        prompt = self._build_reference_prompt(
            citation_request=citation_request,
            style=style,
        )

        result = self.generation_engine.generate_text(
            prompt=prompt,
            user_id=user_id,
            conversation_id=conversation_id,
            document_id=document.id,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens,
            instructions=[
                "Ne jamais inventer les informations bibliographiques.",
                "Signaler les informations manquantes.",
                "Retourner uniquement les informations bibliographiques.",
            ],
            metadata={
                **dict(metadata or {}),
                "generation_type": "reference",
                "citation_style": style,
            },
        )

        if result.status == ResultStatus.FAILED:
            return result

        content = self.generation_engine.extract_text(result)

        if not content:
            return AIResult(
                status=ResultStatus.PARTIAL,
                request_id=result.request_id,
                message="Aucune référence exploitable générée.",
            )

        reference = self.document_engine.add_reference(
            document=document,
            reference={
                "citation": content,
                "style": style,
                "verified": False,
                "requires_verification": True,
            },
        )

        return AIResult(
            status=ResultStatus.SUCCESS,
            request_id=result.request_id,
            message="Référence préparée pour vérification.",
            data={
                "reference_id": reference.id,
                "citation": content,
                "style": style,
                "verified": False,
            },
            warnings=[
                "La référence doit être vérifiée par une source "
                "bibliographique fiable avant publication."
            ],
        )

    # ================================================================
    # PROMPTS
    # ================================================================

    def _build_scientific_section_prompt(
        self,
        document: Document,
        section: Section,
        topic: Optional[str],
        context: Optional[str],
    ) -> str:

        title = getattr(document.metadata, "title", "") or ""

        parts = [
            "MACEVO IA — génération scientifique.",
            "",
            "Rédiger une section académique rigoureuse.",
            f"Titre du document : {title}",
            f"Section : {section.title}",
        ]

        if topic:
            parts.extend(
                [
                    "",
                    f"Sujet spécifique : {topic}",
                ]
            )

        if context:
            parts.extend(
                [
                    "",
                    "Contexte :",
                    context,
                ]
            )

        parts.extend(
            [
                "",
                "Contraintes scientifiques :",
                "- respecter la logique scientifique ;",
                "- distinguer faits, hypothèses et interprétations ;",
                "- ne pas inventer de résultats ;",
                "- ne pas inventer de références ;",
                "- utiliser une terminologie académique précise ;",
                "- assurer la cohérence avec la section ;",
                "- éviter les répétitions ;",
                "- produire uniquement le texte scientifique.",
            ]
        )

        return "\n".join(parts)

    def _build_equation_prompt(
        self,
        description: str,
        context: Optional[str],
    ) -> str:

        parts = [
            "MACEVO IA — génération d'équation scientifique.",
            "",
            f"Demande : {description}",
        ]

        if context:
            parts.extend(
                [
                    "",
                    f"Contexte : {context}",
                ]
            )

        parts.extend(
            [
                "",
                "Générer une expression mathématique correcte "
                "en LaTeX.",
                "Retourner uniquement l'expression LaTeX.",
            ]
        )

        return "\n".join(parts)

    def _build_figure_prompt(
        self,
        description: str,
        context: Optional[str],
    ) -> str:

        parts = [
            "MACEVO IA — conception d'une figure scientifique.",
            "",
            f"Demande : {description}",
        ]

        if context:
            parts.extend(
                [
                    "",
                    f"Contexte : {context}",
                ]
            )

        parts.extend(
            [
                "",
                "Décrire :",
                "- les éléments visuels ;",
                "- les axes si nécessaire ;",
                "- les variables ;",
                "- les relations représentées ;",
                "- les légendes nécessaires ;",
                "- les unités.",
            ]
        )

        return "\n".join(parts)

    def _build_table_prompt(
        self,
        description: str,
        context: Optional[str],
    ) -> str:

        parts = [
            "MACEVO IA — conception d'un tableau scientifique.",
            "",
            f"Demande : {description}",
        ]

        if context:
            parts.extend(
                [
                    "",
                    f"Contexte : {context}",
                ]
            )

        parts.extend(
            [
                "",
                "Construire une structure de tableau claire.",
                "Ne jamais inventer de données absentes.",
                "Retourner uniquement le contenu exploitable.",
            ]
        )

        return "\n".join(parts)

    def _build_reference_prompt(
        self,
        citation_request: str,
        style: str,
    ) -> str:

        return "\n".join(
            [
                "MACEVO IA — préparation bibliographique.",
                "",
                f"Style demandé : {style}",
                f"Demande : {citation_request}",
                "",
                "Ne jamais fabriquer une source.",
                "Utiliser uniquement les informations fournies.",
                "Identifier explicitement les informations manquantes.",
            ]
        )

    # ================================================================
    # NETTOYAGE LATEX
    # ================================================================

    def _clean_latex(self, content: str) -> str:
        """
        Nettoyage prudent d'une réponse LaTeX.
        """

        if not content:
            return ""

        content = content.strip()

        if content.startswith("```"):
            lines = content.splitlines()

            if lines:
                lines = lines[1:]

            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]

            content = "\n".join(lines).strip()

        if content.startswith("$") and content.endswith("$"):
            content = content[1:-1].strip()

        if content.startswith("\\[") and content.endswith("\\]"):
            content = content[2:-2].strip()

        return content