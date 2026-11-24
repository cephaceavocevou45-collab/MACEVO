from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

from core.ai.contracts.message import AIMessage, MessageRole
from core.ai.contracts.request import AIRequest
from core.ai.contracts.result import AIResult, ResultStatus
from core.ai.service import AIService
from core.document.engine import DocumentEngine
from core.document.ir import Document, Section


class GenerationEngine:
    """
    Moteur de génération de contenu de MACEVO IA.

    Responsabilités :

    - transformer une demande de génération en AIRequest ;
    - séparer l'intention utilisateur du prompt interne ;
    - déléguer l'exécution au AIService ;
    - récupérer le résultat produit par l'orchestrateur ;
    - générer du contenu textuel ;
    - générer le contenu d'une section ;
    - générer un document à partir d'une structure existante ;
    - générer directement des paragraphes ;
    - conserver une séparation stricte entre IA et Document IR.

    Le moteur ne communique jamais directement avec un provider.

    IMPORTANT
    ---------
    Le champ metadata["capability_input"] représente le texte utilisé
    exclusivement par CapabilityResolver pour déterminer les capacités
    nécessaires.

    Il ne doit pas contenir les instructions internes de génération.
    """

    CAPABILITY_INPUT_KEY = "capability_input"

    def __init__(
        self,
        ai_service: Optional[AIService] = None,
        document_engine: Optional[DocumentEngine] = None,
    ):
        self.ai_service = ai_service or AIService()
        self.document_engine = document_engine or DocumentEngine()

    # ------------------------------------------------------------------
    # CONSTRUCTION DE REQUÊTE
    # ------------------------------------------------------------------

    def build_request(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        document_id: Optional[str] = None,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        tools: Optional[Iterable[Dict[str, Any]]] = None,
        instructions: Optional[Iterable[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        capability_input: Optional[str] = None,
    ) -> AIRequest:
        """
        Construit une AIRequest normalisée.

        ``prompt`` reste le contenu réellement envoyé au modèle.

        ``capability_input`` est une représentation séparée de
        l'intention à analyser par CapabilityResolver.

        Cette séparation empêche les instructions internes telles que :

            "ne pas inventer de références bibliographiques"

        de déclencher par erreur la capacité ``bibliography``.
        """

        if not isinstance(prompt, str):
            raise TypeError(
                "prompt doit être une chaîne de caractères."
            )

        prompt = prompt.strip()

        if not prompt:
            raise ValueError(
                "prompt ne peut pas être vide."
            )

        messages = [
            AIMessage(
                role=MessageRole.USER,
                content=prompt,
            )
        ]

        final_instructions = list(instructions or [])

        if system_instruction:
            final_instructions.insert(
                0,
                system_instruction,
            )

        metadata_payload = dict(metadata or {})

        if capability_input is not None:
            if not isinstance(capability_input, str):
                raise TypeError(
                    "capability_input doit être une chaîne de caractères."
                )

            capability_input = capability_input.strip()

            if capability_input:
                metadata_payload[
                    self.CAPABILITY_INPUT_KEY
                ] = capability_input

        return AIRequest(
            messages=messages,
            user_id=user_id,
            conversation_id=conversation_id,
            document_id=document_id,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream,
            tools=list(tools or []),
            instructions=final_instructions,
            metadata=metadata_payload,
        )

    # ------------------------------------------------------------------
    # GÉNÉRATION TEXTUELLE
    # ------------------------------------------------------------------

    def generate_text(
        self,
        prompt: str,
        *,
        system_instruction: Optional[str] = None,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        document_id: Optional[str] = None,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        tools: Optional[Iterable[Dict[str, Any]]] = None,
        instructions: Optional[Iterable[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        capability_input: Optional[str] = None,
    ) -> AIResult:
        """
        Génère une réponse textuelle via AIService.

        Le provider n'est jamais appelé directement ici.

        ``capability_input`` peut être fourni lorsqu'une couche
        supérieure connaît explicitement l'intention fonctionnelle.
        """

        request = self.build_request(
            prompt=prompt,
            system_instruction=system_instruction,
            user_id=user_id,
            conversation_id=conversation_id,
            document_id=document_id,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream,
            tools=tools,
            instructions=instructions,
            metadata=metadata,
            capability_input=capability_input,
        )

        return self.ai_service.execute(request)

    # ------------------------------------------------------------------
    # EXTRACTION DU TEXTE
    # ------------------------------------------------------------------

    def extract_text(self, result: Any) -> str:
        """
        Extrait proprement le texte depuis les différentes formes
        de résultats utilisées par MACEVO.
        """

        if result is None:
            return ""

        if isinstance(result, str):
            return result.strip()

        status = getattr(result, "status", None)

        if status == ResultStatus.FAILED:
            return ""

        if isinstance(result, AIResult):
            data = result.data
        elif isinstance(result, dict):
            data = result.get("data", result)
        else:
            data = getattr(result, "data", None)

        if isinstance(data, str):
            return data.strip()

        if isinstance(data, dict):

            results = data.get("results")

            if isinstance(results, dict):
                values = reversed(
                    list(results.values())
                )

                for task_result in values:

                    if isinstance(task_result, AIResult):
                        content = self.extract_text(
                            task_result
                        )

                        if content:
                            return content

                    if not isinstance(
                        task_result,
                        dict,
                    ):
                        continue

                    response = task_result.get(
                        "response"
                    )

                    if isinstance(
                        response,
                        AIResult,
                    ):
                        content = self.extract_text(
                            response
                        )

                        if content:
                            return content

                    if isinstance(response, str):
                        if response.strip():
                            return response.strip()

                    if isinstance(response, dict):

                        content = response.get(
                            "content"
                        )

                        if (
                            isinstance(content, str)
                            and content.strip()
                        ):
                            return content.strip()

                        text = response.get("text")

                        if (
                            isinstance(text, str)
                            and text.strip()
                        ):
                            return text.strip()

                        message = response.get(
                            "message"
                        )

                        if isinstance(message, str):
                            if message.strip():
                                return message.strip()

                        if isinstance(message, dict):
                            content = message.get(
                                "content"
                            )

                            if (
                                isinstance(content, str)
                                and content.strip()
                            ):
                                return content.strip()

                    content = task_result.get(
                        "content"
                    )

                    if (
                        isinstance(content, str)
                        and content.strip()
                    ):
                        return content.strip()

                    text = task_result.get("text")

                    if (
                        isinstance(text, str)
                        and text.strip()
                    ):
                        return text.strip()

            direct_content = data.get(
                "content"
            )

            if isinstance(direct_content, str):
                return direct_content.strip()

            direct_text = data.get("text")

            if isinstance(direct_text, str):
                return direct_text.strip()

            message = data.get("message")

            if isinstance(message, str):
                return message.strip()

            if isinstance(message, dict):

                content = message.get("content")

                if isinstance(content, str):
                    return content.strip()

                text = message.get("text")

                if isinstance(text, str):
                    return text.strip()

        content = getattr(
            result,
            "content",
            None,
        )

        if isinstance(content, str):
            return content.strip()

        text = getattr(
            result,
            "text",
            None,
        )

        if isinstance(text, str):
            return text.strip()

        message = getattr(
            result,
            "message",
            None,
        )

        if isinstance(message, str):
            return message.strip()

        if isinstance(message, dict):

            content = message.get("content")

            if isinstance(content, str):
                return content.strip()

            text = message.get("text")

            if isinstance(text, str):
                return text.strip()

        return ""

    # ------------------------------------------------------------------
    # GÉNÉRATION D'UNE SECTION
    # ------------------------------------------------------------------

    def generate_section(
        self,
        document: Document,
        section: Section,
        *,
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
        Génère le contenu d'une section et l'insère dans le Document IR.

        La section existante est conservée.

        Le prompt interne peut contenir des instructions scientifiques
        complexes, mais CapabilityResolver reçoit une intention séparée.
        """

        if not isinstance(document, Document):
            raise TypeError(
                "document doit être une instance de Document."
            )

        if not isinstance(section, Section):
            raise TypeError(
                "section doit être une instance de Section."
            )

        prompt = self._build_section_prompt(
            document=document,
            section=section,
            context=context,
        )

        generation_metadata = dict(
            metadata or {}
        )

        generation_metadata.update(
            {
                "generation_type": "section",
                "document_id": document.id,
                "section_id": section.id,
                "section_title": section.title,
            }
        )

        # --------------------------------------------------------------
        # INTENTION SÉMANTIQUE POUR LE CAPABILITY RESOLVER
        # --------------------------------------------------------------
        #
        # IMPORTANT :
        # on ne transmet pas le prompt complet ici.
        #
        # Le prompt complet contient notamment :
        #
        # "ne pas inventer de références bibliographiques"
        #
        # Cette phrase ne constitue PAS une demande de bibliographie.
        #
        capability_input = (
            "Générer le contenu scientifique de la section "
            f"« {section.title} » "
            "du document."
        )

        if context:
            capability_input += (
                " Le contenu doit respecter le contexte scientifique "
                "fourni."
            )

        generation_metadata[
            self.CAPABILITY_INPUT_KEY
        ] = capability_input

        result = self.generate_text(
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
            capability_input=capability_input,
        )

        if result.status == ResultStatus.FAILED:
            return result

        content = self.extract_text(result)

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
                    "source_result": result.to_dict(),
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
            message="Section générée avec succès.",
            data={
                "document_id": document.id,
                "section_id": section.id,
                "paragraph_id": paragraph.id,
                "content": content,
                "source_result": result.to_dict(),
            },
        )

    # ------------------------------------------------------------------
    # GÉNÉRATION D'UN DOCUMENT
    # ------------------------------------------------------------------

    def generate_document(
        self,
        document: Document,
        *,
        instructions: Optional[Iterable[str]] = None,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AIResult:
        """
        Génère le contenu des sections existantes d'un document.

        Les sections sont parcourues récursivement.
        """

        if not isinstance(document, Document):
            raise TypeError(
                "document doit être une instance de Document."
            )

        sections = self._flatten_sections(
            document.sections
        )

        if not sections:
            return AIResult(
                status=ResultStatus.PARTIAL,
                message=(
                    "Le document ne contient aucune section "
                    "à générer."
                ),
                data={
                    "document_id": document.id,
                    "sections_generated": 0,
                },
                warnings=[
                    "Aucune section disponible."
                ],
            )

        generated_sections = []
        failed_sections = []

        for section in sections:

            result = self.generate_section(
                document=document,
                section=section,
                instructions=instructions,
                user_id=user_id,
                conversation_id=conversation_id,
                model=model,
                provider=provider,
                temperature=temperature,
                max_tokens=max_tokens,
                metadata=metadata,
            )

            if result.status == ResultStatus.SUCCESS:
                generated_sections.append(
                    result.data
                )
            else:
                failed_sections.append(
                    {
                        "section_id": section.id,
                        "section_title": section.title,
                        "result": result.to_dict(),
                    }
                )

        if failed_sections:
            status = ResultStatus.PARTIAL
            message = (
                "Le document a été partiellement généré."
            )
        else:
            status = ResultStatus.SUCCESS
            message = (
                "Le document a été généré avec succès."
            )

        return AIResult(
            status=status,
            message=message,
            data={
                "document_id": document.id,
                "sections_generated": generated_sections,
                "sections_failed": failed_sections,
                "total_sections": len(sections),
            },
        )

    # ------------------------------------------------------------------
    # CONSTRUCTION DES PROMPTS
    # ------------------------------------------------------------------

    def _build_section_prompt(
        self,
        document: Document,
        section: Section,
        context: Optional[str] = None,
    ) -> str:
        """
        Construit un prompt scientifique structuré pour une section.
        """

        document_title = ""

        if document.metadata:
            document_title = (
                getattr(
                    document.metadata,
                    "title",
                    "",
                )
                or ""
            )

        prompt_parts = [
            "Tu es le moteur de rédaction scientifique de MACEVO IA.",
            "",
            "Rédige le contenu de la section suivante.",
            "",
            f"Titre du document : {document_title}",
            f"Section : {section.title}",
        ]

        if section.level is not None:
            prompt_parts.append(
                f"Niveau hiérarchique : {section.level}"
            )

        if context:
            prompt_parts.extend(
                [
                    "",
                    "Contexte fourni :",
                    context.strip(),
                ]
            )

        prompt_parts.extend(
            [
                "",
                "Exigences :",
                "- produire un texte scientifique structuré ;",
                "- respecter le sujet et le niveau académique ;",
                "- éviter les affirmations non justifiées ;",
                "- utiliser une terminologie précise ;",
                "- conserver une progression logique ;",
                "- ne pas inventer de références bibliographiques ;",
                "- ne pas ajouter de préambule conversationnel ;",
                "- retourner uniquement le contenu de la section.",
            ]
        )

        return "\n".join(prompt_parts)

    # ------------------------------------------------------------------
    # UTILITAIRES DOCUMENTAIRES
    # ------------------------------------------------------------------

    def _flatten_sections(
        self,
        sections: Iterable[Section],
    ) -> list[Section]:
        """
        Transforme l'arbre des sections en liste linéaire.

        L'IR MACEVO utilise :

            Section.sections
        """

        flattened: list[Section] = []

        for section in sections:

            flattened.append(section)

            children = getattr(
                section,
                "sections",
                None,
            )

            if children:
                flattened.extend(
                    self._flatten_sections(
                        children
                    )
                )

        return flattened

    # ------------------------------------------------------------------
    # GÉNÉRATION DIRECTE D'UN PARAGRAPHE
    # ------------------------------------------------------------------

    def generate_paragraph(
        self,
        section: Section,
        prompt: str,
        *,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        document_id: Optional[str] = None,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        instructions: Optional[Iterable[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AIResult:
        """
        Génère directement un paragraphe dans une section.

        Cette méthode est utilisée notamment pour l'édition interactive :

        - développer ;
        - réécrire ;
        - améliorer ;
        - corriger ;
        - reformuler ;
        - compléter.

        Ici, ``prompt`` représente directement l'intention de l'utilisateur.
        """

        if not isinstance(section, Section):
            raise TypeError(
                "section doit être une instance de Section."
            )

        if not isinstance(prompt, str):
            raise TypeError(
                "prompt doit être une chaîne de caractères."
            )

        prompt = prompt.strip()

        if not prompt:
            raise ValueError(
                "prompt ne peut pas être vide."
            )

        generation_metadata = dict(
            metadata or {}
        )

        generation_metadata.setdefault(
            self.CAPABILITY_INPUT_KEY,
            prompt,
        )

        result = self.generate_text(
            prompt=prompt,
            user_id=user_id,
            conversation_id=conversation_id,
            document_id=document_id,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens,
            instructions=instructions,
            metadata=generation_metadata,
            capability_input=generation_metadata.get(
                self.CAPABILITY_INPUT_KEY
            ),
        )

        if result.status == ResultStatus.FAILED:
            return result

        content = self.extract_text(result)

        if not content:
            return AIResult(
                status=ResultStatus.PARTIAL,
                request_id=result.request_id,
                message=(
                    "Aucun contenu textuel n'a été généré."
                ),
                data={
                    "section_id": section.id,
                },
            )

        paragraph = self.document_engine.add_paragraph(
            target=section,
            content=content,
        )

        return AIResult(
            status=ResultStatus.SUCCESS,
            request_id=result.request_id,
            message="Paragraphe généré avec succès.",
            data={
                "section_id": section.id,
                "paragraph_id": paragraph.id,
                "content": content,
            },
        )