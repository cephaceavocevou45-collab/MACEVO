from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

from core.ai.contracts.message import AIMessage
from core.ai.service import AIService
from core.scientific.workflow import ScientificWorkflowEngine


class AssistantService:
    """
    Service applicatif Django de MACEVO Assistant.

    Il fait le lien entre les vues/API et le moteur IA central.
    """

    def __init__(
        self,
        ai_service: Optional[AIService] = None,
        scientific_workflow: Optional[ScientificWorkflowEngine] = None,
    ):
        self.ai_service = ai_service or AIService()
        self.scientific_workflow = (
            scientific_workflow
            or ScientificWorkflowEngine(
                ai_service=self.ai_service
            )
        )

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
        Chat classique ou streaming.
        """

        return self.ai_service.chat(
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

    # ==================================================================
    # REQUETE
    # ==================================================================

    def build_request(
        self,
        message: str,
        **kwargs,
    ):
        return self.ai_service.build_request(
            message,
            **kwargs,
        )

    # ==================================================================
    # HISTORIQUE
    # ==================================================================

    def add_message(
        self,
        conversation_id: str,
        message: AIMessage,
    ):
        return self.ai_service.add_message(
            conversation_id,
            message,
        )

    def get_history(
        self,
        conversation_id: str,
        *,
        limit: Optional[int] = None,
    ):
        return self.ai_service.get_history(
            conversation_id,
            limit=limit,
        )

    def clear_conversation(
        self,
        conversation_id: str,
    ) -> None:
        self.ai_service.clear_conversation(
            conversation_id
        )

    def delete_conversation(
        self,
        conversation_id: str,
    ) -> None:
        self.ai_service.delete_conversation(
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
        return self.ai_service.remember(
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
        return self.ai_service.search_memory(
            query,
            user_id=user_id,
            project_id=project_id,
            memory_type=memory_type,
            limit=limit,
        )

    def clear_memory(
        self,
        *,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        memory_type: Optional[str] = None,
    ) -> int:
        return self.ai_service.clear_memory(
            user_id=user_id,
            project_id=project_id,
            memory_type=memory_type,
        )

    # ==================================================================
    # DOCUMENT SCIENTIFIQUE
    # ==================================================================

    def create_scientific_document(
        self,
        **kwargs,
    ):
        """
        Lance le workflow scientifique complet.
        """

        return self.scientific_workflow.execute(
            **kwargs
        )