
"""
==========================================================
MACEVO IA
Prompt Builder
==========================================================

Construit les messages envoyés aux modèles IA.

Tous les services de MACEVO utilisent cette classe afin
de produire des messages homogènes, structurés et
compatibles avec les différents modules scientifiques.

Le PromptBuilder ne communique jamais directement avec
un provider IA. Il construit uniquement les messages.

Architecture :

    Service IA
        ↓
    PromptBuilder
        ↓
    messages[]
        ↓
    Provider / Model
"""

from __future__ import annotations

from typing import Any, Dict, List

from .prompt_templates import PromptTemplates


class PromptBuilder:
    """
    Construit les messages destinés aux modèles IA.

    Cette classe constitue la couche de transformation entre
    les services MACEVO et la bibliothèque de templates.

    Elle ne contient aucune logique de communication réseau.
    """

    # =====================================================
    # Constantes
    # =====================================================

    SYSTEM_ROLE = "system"
    USER_ROLE = "user"
    ASSISTANT_ROLE = "assistant"

    # =====================================================
    # Construction générique
    # =====================================================

    @staticmethod
    def build(
        template: str,
        **kwargs: Any,
    ) -> str:
        """
        Construit un prompt à partir d'un template.

        Parameters
        ----------
        template:
            Template texte à formater.

        kwargs:
            Variables utilisées par le template.

        Returns
        -------
        str
            Prompt final.

        Raises
        ------
        ValueError
            Si le template est vide ou invalide.

        KeyError
            Si une variable obligatoire du template est absente.
        """

        if template is None:
            raise ValueError(
                "Le template du prompt ne peut pas être None."
            )

        if not isinstance(template, str):
            raise TypeError(
                "Le template du prompt doit être une chaîne de caractères."
            )

        template = template.strip()

        if not template:
            raise ValueError(
                "Le template du prompt ne peut pas être vide."
            )

        try:
            return template.format(**kwargs)
        except KeyError as exc:
            missing_key = exc.args[0]

            raise KeyError(
                f"Variable '{missing_key}' absente du template IA."
            ) from exc

    # =====================================================
    # Message système
    # =====================================================

    @classmethod
    def system(
        cls,
        instructions: str | None = None,
    ) -> Dict[str, str]:
        """
        Retourne le message système MACEVO.

        Par défaut, utilise PromptTemplates.SYSTEM.

        Un système spécifique peut être fourni lorsqu'un
        module spécialisé doit ajouter des instructions.
        """

        content = (
            instructions
            if instructions is not None
            else PromptTemplates.SYSTEM
        )

        if not isinstance(content, str) or not content.strip():
            raise ValueError(
                "Le prompt système ne peut pas être vide."
            )

        return {
            "role": cls.SYSTEM_ROLE,
            "content": content.strip(),
        }

    # =====================================================
    # Message utilisateur
    # =====================================================

    @classmethod
    def user(
        cls,
        content: str,
    ) -> Dict[str, str]:
        """
        Construit un message utilisateur.
        """

        if content is None:
            raise ValueError(
                "Le contenu utilisateur ne peut pas être None."
            )

        return {
            "role": cls.USER_ROLE,
            "content": str(content),
        }

    # =====================================================
    # Conversation complète
    # =====================================================

    @classmethod
    def messages(
        cls,
        template: str,
        include_system: bool = True,
        **kwargs: Any,
    ) -> List[Dict[str, str]]:
        """
        Construit une conversation complète.

        Par défaut :

            system
            ↓
            user

        ``include_system=False`` permet à un service externe
        de fournir son propre contexte système.
        """

        prompt = cls.build(
            template,
            **kwargs,
        )

        result: List[Dict[str, str]] = []

        if include_system:
            result.append(cls.system())

        result.append(
            cls.user(prompt)
        )

        return result

    # =====================================================
    # Chat
    # =====================================================

    @classmethod
    def chat(
        cls,
        question: str,
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt conversationnel.
        """

        return cls.messages(
            PromptTemplates.CHAT,
            question=question,
        )

    # =====================================================
    # Résumé
    # =====================================================

    @classmethod
    def summarize(
        cls,
        text: str,
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt de résumé.
        """

        return cls.messages(
            PromptTemplates.SUMMARIZE,
            text=text,
        )

    # =====================================================
    # Explication
    # =====================================================

    @classmethod
    def explain(
        cls,
        text: str,
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt d'explication.
        """

        return cls.messages(
            PromptTemplates.EXPLAIN,
            text=text,
        )

    # =====================================================
    # Correction
    # =====================================================

    @classmethod
    def correct(
        cls,
        text: str,
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt de correction.
        """

        return cls.messages(
            PromptTemplates.CORRECT,
            text=text,
        )

    # =====================================================
    # Traduction
    # =====================================================

    @classmethod
    def translate(
        cls,
        text: str,
        language: str,
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt de traduction.
        """

        return cls.messages(
            PromptTemplates.TRANSLATE,
            text=text,
            language=language,
        )

    # =====================================================
    # Amélioration
    # =====================================================

    @classmethod
    def improve(
        cls,
        text: str,
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt d'amélioration générale.
        """

        return cls.messages(
            PromptTemplates.IMPROVE,
            text=text,
        )

    # =====================================================
    # Amélioration scientifique
    # =====================================================

    @classmethod
    def scientific_improve(
        cls,
        text: str,
        discipline: str = "",
        level: str = "",
        constraints: str = "",
    ) -> List[Dict[str, str]]:
        """
        Améliore scientifiquement un contenu existant.
        """

        return cls.messages(
            PromptTemplates.SCIENTIFIC_IMPROVE,
            text=text,
            discipline=discipline,
            level=level,
            constraints=constraints,
        )

    # =====================================================
    # Analyse de document
    # =====================================================

    @classmethod
    def document_analysis(
        cls,
        document: str,
        instructions: str = "",
    ) -> List[Dict[str, str]]:
        """
        Analyse la structure et le contenu scientifique
        d'un document.
        """

        return cls.messages(
            PromptTemplates.DOCUMENT_ANALYSIS,
            document=document,
            instructions=instructions,
        )

    # =====================================================
    # Article scientifique
    # =====================================================

    @classmethod
    def article(
        cls,
        topic: str,
        constraints: str = "",
        discipline: str = "",
        level: str = "",
    ) -> List[Dict[str, str]]:
        """
        Génère un article scientifique.
        """

        return cls.messages(
            PromptTemplates.ARTICLE,
            topic=topic,
            constraints=constraints,
            discipline=discipline,
            level=level,
        )

    # =====================================================
    # Rapport
    # =====================================================

    @classmethod
    def report(
        cls,
        topic: str,
        constraints: str = "",
        discipline: str = "",
        level: str = "",
    ) -> List[Dict[str, str]]:
        """
        Génère un rapport scientifique ou académique.
        """

        return cls.messages(
            PromptTemplates.REPORT,
            topic=topic,
            constraints=constraints,
            discipline=discipline,
            level=level,
        )

    # =====================================================
    # Mémoire / Thèse
    # =====================================================

    @classmethod
    def thesis(
        cls,
        topic: str,
        level: str,
        constraints: str = "",
        discipline: str = "",
    ) -> List[Dict[str, str]]:
        """
        Génère une structure de mémoire ou de thèse.
        """

        return cls.messages(
            PromptTemplates.THESIS,
            topic=topic,
            level=level,
            constraints=constraints,
            discipline=discipline,
        )

    # =====================================================
    # Thèse doctorale
    # =====================================================

    @classmethod
    def doctorate(
        cls,
        topic: str,
        discipline: str,
        constraints: str = "",
        methodology: str = "",
    ) -> List[Dict[str, str]]:
        """
        Génère un contenu destiné à une thèse doctorale.
        """

        return cls.messages(
            PromptTemplates.DOCTORATE,
            topic=topic,
            discipline=discipline,
            constraints=constraints,
            methodology=methodology,
        )

    # =====================================================
    # Méthodologie
    # =====================================================

    @classmethod
    def methodology(
        cls,
        topic: str,
        context: str = "",
        constraints: str = "",
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt spécialisé pour la méthodologie.
        """

        return cls.messages(
            PromptTemplates.METHODOLOGY,
            topic=topic,
            context=context,
            constraints=constraints,
        )

    # =====================================================
    # Résultats
    # =====================================================

    @classmethod
    def results(
        cls,
        data: str,
        context: str = "",
        constraints: str = "",
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt spécialisé pour les résultats.
        """

        return cls.messages(
            PromptTemplates.RESULTS,
            data=data,
            context=context,
            constraints=constraints,
        )

    # =====================================================
    # Discussion
    # =====================================================

    @classmethod
    def discussion(
        cls,
        results: str,
        context: str = "",
        constraints: str = "",
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt spécialisé pour la discussion.
        """

        return cls.messages(
            PromptTemplates.DISCUSSION,
            results=results,
            context=context,
            constraints=constraints,
        )

    # =====================================================
    # RAG
    # =====================================================

    @classmethod
    def rag(
        cls,
        context: str,
        question: str,
        instructions: str = "",
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt RAG.

        Le contexte doit être fourni par un système de
        récupération/ContextBuilder et non par le provider.
        """

        return cls.messages(
            PromptTemplates.RAG,
            context=context,
            question=question,
            instructions=instructions,
        )

    # =====================================================
    # Vision
    # =====================================================

    @classmethod
    def vision(
        cls,
        instruction: str,
        context: str = "",
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt d'analyse visuelle.

        La représentation réelle de l'image est laissée au
        provider/capability Vision.
        """

        return cls.messages(
            PromptTemplates.VISION,
            instruction=instruction,
            context=context,
        )

    # =====================================================
    # Mathématiques
    # =====================================================

    @classmethod
    def math(
        cls,
        problem: str,
        context: str = "",
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt mathématique.
        """

        return cls.messages(
            PromptTemplates.MATH,
            problem=problem,
            context=context,
        )

    # =====================================================
    # Équation
    # =====================================================

    @classmethod
    def equation(
        cls,
        description: str,
        context: str = "",
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt de génération/analyse
        d'équations scientifiques.
        """

        return cls.messages(
            PromptTemplates.EQUATION,
            description=description,
            context=context,
        )

    # =====================================================
    # Tableau
    # =====================================================

    @classmethod
    def table(
        cls,
        description: str,
        data: str = "",
        context: str = "",
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt de génération de tableau.
        """

        return cls.messages(
            PromptTemplates.TABLE,
            description=description,
            data=data,
            context=context,
        )

    # =====================================================
    # Figure
    # =====================================================

    @classmethod
    def figure(
        cls,
        description: str,
        context: str = "",
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt de génération/analyse de figure.
        """

        return cls.messages(
            PromptTemplates.FIGURE,
            description=description,
            context=context,
        )

    # =====================================================
    # Code
    # =====================================================

    @classmethod
    def code(
        cls,
        language: str,
        description: str,
        context: str = "",
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt de génération de code.
        """

        return cls.messages(
            PromptTemplates.CODE,
            language=language,
            description=description,
            context=context,
        )

    # =====================================================
    # LaTeX
    # =====================================================

    @classmethod
    def latex(
        cls,
        text: str,
        context: str = "",
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt LaTeX.

        LaTeX est traité comme un format scientifique
        de premier ordre dans MACEVO.
        """

        return cls.messages(
            PromptTemplates.LATEX,
            text=text,
            context=context,
        )

    # =====================================================
    # Bibliographie / Citation
    # =====================================================

    @classmethod
    def citation(
        cls,
        style: str,
        content: str,
        context: str = "",
    ) -> List[Dict[str, str]]:
        """
        Construit un prompt de citation/bibliographie.
        """

        return cls.messages(
            PromptTemplates.CITATION,
            style=style,
            content=content,
            context=context,
        )

    # =====================================================
    # Cohérence scientifique
    # =====================================================

    @classmethod
    def consistency(
        cls,
        document: str,
        context: str = "",
    ) -> List[Dict[str, str]]:
        """
        Vérifie la cohérence scientifique et structurelle
        d'un document.
        """

        return cls.messages(
            PromptTemplates.CONSISTENCY,
            document=document,
            context=context,
        )

    # =====================================================
    # Sortie structurée
    # =====================================================

    @classmethod
    def structured(
        cls,
        instruction: str,
        schema: str,
        context: str = "",
    ) -> List[Dict[str, str]]:
        """
        Construit une demande de sortie structurée.

        Le schema est fourni comme texte afin de garder cette
        couche indépendante du provider utilisé.
        """

        return cls.messages(
            PromptTemplates.STRUCTURED,
            instruction=instruction,
            schema=schema,
            context=context,
        )
