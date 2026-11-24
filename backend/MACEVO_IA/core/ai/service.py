from __future__ import annotations

from typing import Any, Dict, Iterable, Iterator, Optional

from core.ai.contracts.message import AIMessage, MessageRole
from core.ai.contracts.request import AIRequest
from core.ai.contracts.result import AIResult
from core.ai.orchestrator.orchestrator import AIOrchestrator


class AIService:
    """
    Façade applicative principale de MACEVO IA.

    Cette classe constitue le point d'entrée utilisé par
    les couches applicatives et l'API.

    Responsabilités :

    - construction des AIRequest ;
    - exécution classique ;
    - exécution streaming ;
    - gestion des conversations ;
    - gestion de la mémoire ;
    - ajout manuel de messages.

    Toute la logique IA réelle reste dans AIOrchestrator.
    """

    def __init__(
        self,
        orchestrator: Optional[AIOrchestrator] = None,
    ) -> None:
        self.orchestrator = (
            orchestrator
            or AIOrchestrator()
        )

    # ==================================================================
    # EXECUTION GENERALE
    # ==================================================================

    def execute(
        self,
        request: AIRequest,
    ) -> AIResult:
        """
        Exécute une requête IA complète.

        Pour une requête stream=True, utiliser stream().
        """

        if not isinstance(request, AIRequest):
            raise TypeError(
                "request doit être une instance de AIRequest."
            )

        request.validate()

        if request.stream:
            raise ValueError(
                "Une requête stream=True doit être exécutée "
                "avec AIService.stream()."
            )

        return self.orchestrator.execute(request)

    # ==================================================================
    # CHAT
    # ==================================================================

    def chat(
        self,
        message: str,
        *,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        document_id: Optional[str] = None,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        tools: Optional[list] = None,
        instructions: Optional[Iterable[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """
        Point d'entrée conversationnel.

        stream=False :
            retourne AIResult.

        stream=True :
            retourne un générateur d'événements de streaming.
        """

        if not isinstance(message, str):
            raise TypeError(
                "message doit être une chaîne de caractères."
            )

        message = message.strip()

        if not message:
            raise ValueError(
                "Le message ne peut pas être vide."
            )

        request = self.build_request(
            message,
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
        )

        if stream:
            return self.stream(request)

        return self.execute(request)

    # ==================================================================
    # STREAMING
    # ==================================================================

    def stream(
        self,
        request: AIRequest,
    ) -> Iterator[Dict[str, Any]]:
        """
        Exécute une requête IA en streaming.

        Le streaming est entièrement délégué à
        AIOrchestrator.execute_stream().

        AIService ne construit donc plus lui-même le contexte
        et n'appelle plus directement TaskExecutor.
        """

        if not isinstance(request, AIRequest):
            raise TypeError(
                "request doit être une instance de AIRequest."
            )

        request.validate()

        if not request.stream:
            raise ValueError(
                "La requête doit avoir stream=True."
            )

        yield from self.orchestrator.execute_stream(
            request
        )

    # ==================================================================
    # CREATION DE REQUETE
    # ==================================================================

    def build_request(
        self,
        message: str,
        *,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        document_id: Optional[str] = None,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        tools: Optional[list] = None,
        instructions: Optional[Iterable[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AIRequest:
        """
        Construit une AIRequest normalisée.
        """

        if not isinstance(message, str):
            raise TypeError(
                "message doit être une chaîne de caractères."
            )

        message = message.strip()

        if not message:
            raise ValueError(
                "message ne peut pas être vide."
            )

        request = AIRequest(
            messages=[
                AIMessage(
                    role=MessageRole.USER,
                    content=message,
                )
            ],
            user_id=user_id,
            conversation_id=conversation_id,
            document_id=document_id,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream,
            tools=list(tools or []),
            instructions=list(instructions or []),
            metadata=dict(metadata or {}),
        )

        request.validate()

        return request

    # ==================================================================
    # CONVERSATION
    # ==================================================================

    def add_message(
        self,
        conversation_id: str,
        message: AIMessage,
    ) -> AIMessage:
        """
        Ajoute un message à une conversation.
        """

        if not conversation_id:
            raise ValueError(
                "conversation_id est obligatoire."
            )

        if not isinstance(message, AIMessage):
            raise TypeError(
                "message doit être une instance de AIMessage."
            )

        return self.orchestrator.context_engine.add_message(
            conversation_id,
            message,
        )

    def get_history(
        self,
        conversation_id: str,
        *,
        limit: Optional[int] = None,
    ) -> list[AIMessage]:
        """
        Récupère l'historique d'une conversation.
        """

        return self.orchestrator.context_engine.get_history(
            conversation_id,
            limit=limit,
        )

    def clear_conversation(
        self,
        conversation_id: str,
    ) -> None:
        """
        Supprime l'historique d'une conversation.
        """

        self.orchestrator.context_engine.clear_conversation(
            conversation_id
        )

    def delete_conversation(
        self,
        conversation_id: str,
    ) -> None:
        """
        Supprime complètement une conversation.
        """

        self.orchestrator.context_engine.delete_conversation(
            conversation_id
        )

    # ==================================================================
    # MEMOIRE
    # ==================================================================

    def remember(
        self,
        content: str,
        *,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        memory_type: str = "general",
        importance: float = 0.5,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """
        Enregistre une mémoire persistante.
        """

        return self.orchestrator.context_engine.remember(
            content,
            user_id=user_id,
            project_id=project_id,
            memory_type=memory_type,
            importance=importance,
            metadata=metadata,
        )

    def search_memory(
        self,
        query: str = "",
        *,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        memory_type: Optional[str] = None,
        limit: int = 20,
    ):
        """
        Recherche dans la mémoire.
        """

        return self.orchestrator.context_engine.search_memory(
            query=query,
            user_id=user_id,
            project_id=project_id,
            memory_type=memory_type,
            limit=limit,
        )

    def delete_memory(
        self,
        memory_id: str,
    ) -> bool:
        """
        Supprime une mémoire.
        """

        return self.orchestrator.context_engine.delete_memory(
            memory_id
        )

    def clear_memory(
        self,
        *,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        memory_type: Optional[str] = None,
    ) -> int:
        """
        Supprime les mémoires correspondant aux filtres.
        """

        return self.orchestrator.context_engine.clear_memory(
            user_id=user_id,
            project_id=project_id,
            memory_type=memory_type,
        )