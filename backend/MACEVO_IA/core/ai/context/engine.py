from __future__ import annotations

from typing import Any, Iterable, Optional

from core.ai.contracts.context import AIContext
from core.ai.contracts.message import AIMessage, MessageRole
from core.ai.contracts.request import AIRequest

from core.ai.context.budget import ContextBudget
from core.ai.context.model_budget import ModelContextBudgetResolver
from core.ai.context.selector import ContextSelector
from core.ai.context.django_store import DjangoConversationStore
from core.ai.memory.django_store import DjangoMemoryStore


class ContextEngine:
    """
    Moteur central intelligent de gestion du contexte MACEVO IA.

    Responsabilités :

    - récupérer l'historique d'une conversation ;
    - sélectionner intelligemment l'historique ;
    - déterminer dynamiquement le budget selon le modèle ;
    - respecter la fenêtre de contexte du modèle ;
    - récupérer les mémoires ;
    - intégrer les messages de la requête ;
    - intégrer les instructions ;
    - intégrer les informations documentaires ;
    - construire un AIContext exploitable par l'orchestrateur ;
    - persister les messages ;
    - persister les mémoires.

    Architecture :

        AIRequest
            ↓
        ModelContextBudgetResolver
            ↓
        ContextBudget
            ↓
        ContextSelector
            ↓
        AIContext
          ↙    ↘
    Conversation Memory
       Store      Store
          ↓        ↓
       Django   Django
          ↓        ↓
      Database Database

    Le budget est résolu dynamiquement pour chaque requête.
    """

    DEFAULT_HISTORY_LIMIT = 50
    DEFAULT_MEMORY_LIMIT = 20

    def __init__(
        self,
        conversation_store: Optional[
            DjangoConversationStore
        ] = None,
        memory_store: Optional[
            DjangoMemoryStore
        ] = None,
        budget: Optional[ContextBudget] = None,
        selector: Optional[ContextSelector] = None,
        budget_resolver: Optional[
            ModelContextBudgetResolver
        ] = None,
    ):
        self.conversation_store = (
            conversation_store
            or DjangoConversationStore()
        )

        self.memory_store = (
            memory_store
            or DjangoMemoryStore()
        )

        # Budget de secours / compatibilité.
        #
        # Il reste disponible lorsque le modèle n'est pas encore
        # résolu ou lorsqu'un budget explicite est injecté.
        self.budget = budget or ContextBudget()

        self.budget_resolver = (
            budget_resolver
            or ModelContextBudgetResolver()
        )

        # Le selector fourni explicitement reste conservé pour
        # compatibilité avec les appels existants.
        self.selector = selector or ContextSelector(
            budget=self.budget
        )

    # ============================================================
    # BUDGET DYNAMIQUE
    # ============================================================

    def resolve_context_budget(
        self,
        request: AIRequest,
    ) -> ContextBudget:
        """
        Résout le budget de contexte adapté à la requête.

        Le modèle et le provider de AIRequest sont utilisés pour
        déterminer la fenêtre de contexte réellement disponible.

        Si aucun modèle/provider n'est précisé, le resolver applique
        ses valeurs par défaut.
        """

        if not isinstance(request, AIRequest):
            raise TypeError(
                "request doit être une instance de AIRequest."
            )

        resolved = self.budget_resolver.resolve_budget(
            model=request.model,
            provider=request.provider,
            request_max_tokens=request.max_tokens,
        )

        return ContextBudget(
            max_context_tokens=resolved[
                "context_window"
            ],
            reserved_output_tokens=resolved[
                "reserved_output_tokens"
            ],
            safety_margin_tokens=resolved[
                "safety_margin_tokens"
            ],
            model=resolved.get("model"),
            provider=resolved.get("provider"),
        )

    def _create_selector(
        self,
        budget: ContextBudget,
    ) -> ContextSelector:
        """
        Crée un selector utilisant le budget courant.

        Le selector doit être spécifique à la requête afin que
        deux modèles possédant des fenêtres différentes ne partagent
        pas accidentellement le même budget.
        """

        return ContextSelector(
            budget=budget
        )

    # ============================================================
    # CONSTRUCTION DU CONTEXTE
    # ============================================================

    def build_context(
        self,
        request: AIRequest,
        *,
        history_limit: Optional[int] = None,
        memory_limit: Optional[int] = None,
    ) -> AIContext:
        """
        Construit le contexte intelligent d'une requête.

        Le contexte final contient :

        - instructions ;
        - messages système ;
        - historique sélectionné ;
        - messages courants ;
        - mémoires ;
        - document courant ;
        - métadonnées.

        Le budget de contexte est calculé dynamiquement selon
        le modèle et le provider de la requête.
        """

        if not isinstance(request, AIRequest):
            raise TypeError(
                "request doit être une instance de AIRequest."
            )

        request.validate()

        history_limit = (
            self.DEFAULT_HISTORY_LIMIT
            if history_limit is None
            else int(history_limit)
        )

        memory_limit = (
            self.DEFAULT_MEMORY_LIMIT
            if memory_limit is None
            else int(memory_limit)
        )

        if history_limit <= 0:
            raise ValueError(
                "history_limit doit être supérieur à zéro."
            )

        if memory_limit < 0:
            raise ValueError(
                "memory_limit ne peut pas être négatif."
            )

        # --------------------------------------------------------
        # 0. Résolution du budget pour CETTE requête
        # --------------------------------------------------------

        context_budget = self.resolve_context_budget(
            request
        )

        selector = self._create_selector(
            context_budget
        )

        # --------------------------------------------------------
        # AIContext
        # --------------------------------------------------------

        context = AIContext(
            system_messages=[],
            conversation_messages=[],
            instructions=[],
            document=None,
            scientific={},
            references=[],
            memory=[],
            metadata={},
        )

        # --------------------------------------------------------
        # 1. Instructions
        # --------------------------------------------------------

        for instruction in request.instructions:
            context.add_instruction(
                instruction
            )

        # --------------------------------------------------------
        # 2. Historique persistant
        # --------------------------------------------------------

        history: list[AIMessage] = []

        if request.conversation_id:
            history = self.conversation_store.get(
                request.conversation_id,
                limit=history_limit,
            )

        # --------------------------------------------------------
        # 3. Messages système provenant de l'historique
        # --------------------------------------------------------

        system_messages: list[AIMessage] = []

        for message in history:
            if message.role == MessageRole.SYSTEM:
                system_messages.append(message)

        # --------------------------------------------------------
        # 4. Messages de conversation
        # --------------------------------------------------------

        conversation_messages: list[AIMessage] = []

        for message in history:
            if message.role != MessageRole.SYSTEM:
                conversation_messages.append(message)

        # --------------------------------------------------------
        # 5. Messages actuels
        # --------------------------------------------------------

        current_messages: list[AIMessage] = []

        for message in request.messages:
            if message.role == MessageRole.SYSTEM:
                system_messages.append(message)
            else:
                current_messages.append(message)

        # --------------------------------------------------------
        # 6. Éviter les doublons
        # --------------------------------------------------------

        existing_ids: set[str] = {
            str(message.id)
            for message in conversation_messages
        }

        unique_current_messages: list[AIMessage] = []

        for message in current_messages:
            message_id = str(message.id)

            if message_id in existing_ids:
                continue

            unique_current_messages.append(
                message
            )
            existing_ids.add(message_id)

        # --------------------------------------------------------
        # 7. Sélection intelligente
        # --------------------------------------------------------

        selectable_messages = (
            conversation_messages
            + unique_current_messages
        )

        selection = selector.select(
            selectable_messages,
            system_messages=system_messages,
            preserve_last_user=True,
        )

        selected_ids = {
            str(message.id)
            for message in selection.messages
        }

        # --------------------------------------------------------
        # 8. Réinjecter les messages sélectionnés
        # --------------------------------------------------------

        for message in selection.messages:
            if message.role == MessageRole.SYSTEM:
                context.add_system_message(
                    message
                )
            else:
                context.add_conversation_message(
                    message
                )

        # --------------------------------------------------------
        # 9. Mémoires
        # --------------------------------------------------------

        memories = []

        if request.user_id and memory_limit > 0:
            memories = self.memory_store.search(
                user_id=request.user_id,
                limit=memory_limit,
            )

        for memory in memories:
            memory_data = (
                memory.to_dict()
                if hasattr(memory, "to_dict")
                else memory
            )

            context.add_memory(
                memory_data
            )

        # --------------------------------------------------------
        # 10. Document courant
        # --------------------------------------------------------

        if request.document_id:
            context.document = {
                "document_id": request.document_id,
            }

        # --------------------------------------------------------
        # 11. Métadonnées
        # --------------------------------------------------------

        context.metadata.update(
            request.metadata or {}
        )

        resolved_budget = {
            "model": context_budget.model,
            "provider": context_budget.provider,
            "context_window": (
                context_budget.max_context_tokens
            ),
            "reserved_output_tokens": (
                context_budget.reserved_output_tokens
            ),
            "safety_margin_tokens": (
                context_budget.safety_margin_tokens
            ),
            "available_input_tokens": (
                context_budget.available_input_tokens
            ),
        }

        context.metadata.update(
            {
                "request_id": str(request.id),
                "conversation_id": request.conversation_id,
                "document_id": request.document_id,
                "user_id": request.user_id,
                "model": request.model,
                "provider": request.provider,

                # Budget effectivement utilisé par CETTE requête.
                "context_budget": resolved_budget,

                "context_selection": {
                    "selected_messages": len(
                        selection.messages
                    ),
                    "discarded_messages": (
                        selection.discarded_messages
                    ),
                    "estimated_tokens": (
                        selection.estimated_tokens
                    ),
                    "truncated": selection.truncated,
                    "selected_message_ids": list(
                        selected_ids
                    ),
                },
            }
        )

        return context

    # ============================================================
    # MESSAGES PROVIDER
    # ============================================================

    def build_provider_messages(
        self,
        request: AIRequest,
        *,
        history_limit: Optional[int] = None,
        memory_limit: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        """
        Construit les messages directement exploitables par
        un provider.

        Cette méthode retourne des dictionnaires provider-ready,
        et non des objets AIMessage.
        """

        context = self.build_context(
            request,
            history_limit=history_limit,
            memory_limit=memory_limit,
        )

        return context.build_provider_messages()

    # ============================================================
    # CONVERSATION
    # ============================================================

    def ensure_conversation(
        self,
        conversation_id: str,
        *,
        user_id: Optional[str] = None,
        title: str = "",
        model: str = "",
        provider: str = "",
        metadata: Optional[dict[str, Any]] = None,
    ):
        if not conversation_id:
            raise ValueError(
                "conversation_id est obligatoire."
            )

        return self.conversation_store.get_or_create_conversation(
            conversation_id,
            user_id=user_id,
            title=title,
            model=model,
            provider=provider,
            metadata=metadata,
        )

    def add_message(
        self,
        conversation_id: str,
        message: AIMessage,
    ):
        if not conversation_id:
            raise ValueError(
                "conversation_id est obligatoire."
            )

        if not isinstance(message, AIMessage):
            raise TypeError(
                "message doit être une instance de AIMessage."
            )

        return self.conversation_store.add(
            conversation_id,
            message,
        )

    def add_messages(
        self,
        conversation_id: str,
        messages: Iterable[AIMessage],
    ):
        if not conversation_id:
            raise ValueError(
                "conversation_id est obligatoire."
            )

        normalized = list(messages or [])

        for message in normalized:
            if not isinstance(message, AIMessage):
                raise TypeError(
                    "Tous les éléments doivent être "
                    "des instances de AIMessage."
                )

        return self.conversation_store.add_many(
            conversation_id,
            normalized,
        )

    def get_history(
        self,
        conversation_id: str,
        *,
        limit: Optional[int] = None,
    ) -> list[AIMessage]:
        if not conversation_id:
            return []

        resolved_limit = (
            self.DEFAULT_HISTORY_LIMIT
            if limit is None
            else int(limit)
        )

        if resolved_limit <= 0:
            return []

        return self.conversation_store.get(
            conversation_id,
            limit=resolved_limit,
        )

    def get_last_message(
        self,
        conversation_id: str,
    ) -> Optional[AIMessage]:
        if not conversation_id:
            return None

        return self.conversation_store.last(
            conversation_id
        )

    def conversation_exists(
        self,
        conversation_id: str,
    ) -> bool:
        if not conversation_id:
            return False

        return self.conversation_store.exists(
            conversation_id
        )

    def conversation_message_count(
        self,
        conversation_id: str,
    ) -> int:
        if not conversation_id:
            return 0

        return self.conversation_store.count(
            conversation_id
        )

    def clear_conversation(
        self,
        conversation_id: str,
    ) -> None:
        if not conversation_id:
            return

        self.conversation_store.clear(
            conversation_id
        )

    def delete_conversation(
        self,
        conversation_id: str,
    ) -> None:
        if not conversation_id:
            return

        self.conversation_store.delete_conversation(
            conversation_id
        )

    # ============================================================
    # MEMOIRE
    # ============================================================

    def remember(
        self,
        content: str,
        *,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        memory_type: str = "general",
        importance: float = 0.5,
        metadata: Optional[dict[str, Any]] = None,
    ):
        return self.memory_store.create(
            content=content,
            user_id=user_id,
            project_id=project_id,
            memory_type=memory_type,
            importance=importance,
            metadata=metadata,
        )

    def get_memory(
        self,
        memory_id: str,
    ):
        if not memory_id:
            return None

        return self.memory_store.get(
            memory_id
        )

    def search_memory(
        self,
        *,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        memory_type: Optional[str] = None,
        limit: int = 20,
    ):
        if limit <= 0:
            return []

        return self.memory_store.search(
            user_id=user_id,
            project_id=project_id,
            memory_type=memory_type,
            limit=limit,
        )

    def delete_memory(
        self,
        memory_id: str,
    ) -> None:
        if not memory_id:
            return

        self.memory_store.delete(
            memory_id
        )

    def clear_memory(
        self,
        *,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
    ) -> None:
        self.memory_store.clear(
            user_id=user_id,
            project_id=project_id,
        )

    # ============================================================
    # PERSISTANCE
    # ============================================================

    def save_request(
        self,
        request: AIRequest,
    ) -> None:
        """
        Persiste les messages pertinents d'une requête.

        Les messages assistant ne sont pas ajoutés ici :
        l'orchestrateur persiste explicitement la réponse finale.
        """

        if not isinstance(request, AIRequest):
            raise TypeError(
                "request doit être une instance de AIRequest."
            )

        if not request.conversation_id:
            return

        self.ensure_conversation(
            request.conversation_id,
            user_id=request.user_id,
            model=request.model or "",
            provider=request.provider or "",
            metadata=request.metadata,
        )

        existing_messages = self.get_history(
            request.conversation_id,
            limit=self.DEFAULT_HISTORY_LIMIT,
        )

        existing_ids = {
            str(message.id)
            for message in existing_messages
        }

        messages_to_save: list[AIMessage] = []

        for message in request.messages:
            if message.role not in {
                MessageRole.USER,
                MessageRole.SYSTEM,
                MessageRole.TOOL,
            }:
                continue

            message_id = str(message.id)

            if message_id in existing_ids:
                continue

            messages_to_save.append(
                message
            )
            existing_ids.add(message_id)

        if messages_to_save:
            self.add_messages(
                request.conversation_id,
                messages_to_save,
            )

    # ============================================================
    # RESUME
    # ============================================================

    def get_context_summary(
        self,
        request: AIRequest,
    ) -> dict[str, Any]:
        """
        Retourne un résumé technique du contexte construit.
        """

        context = self.build_context(
            request
        )

        provider_messages = (
            context.build_provider_messages()
        )

        context_budget = context.metadata.get(
            "context_budget",
            {},
        )

        return {
            "message_count": context.message_count,
            "provider_message_count": len(
                provider_messages
            ),
            "memory_count": len(
                context.memory
            ),
            "has_document": bool(
                context.document
            ),
            "estimated_tokens": (
                context.metadata
                .get("context_selection", {})
                .get("estimated_tokens", 0)
            ),
            "discarded_messages": (
                context.metadata
                .get("context_selection", {})
                .get("discarded_messages", 0)
            ),
            "truncated": (
                context.metadata
                .get("context_selection", {})
                .get("truncated", False)
            ),
            "budget": context_budget,
        }

    # ============================================================
    # NETTOYAGE COMPLET
    # ============================================================

    def clear_all_context(
        self,
        conversation_id: str,
        *,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
    ) -> None:
        """
        Nettoie la conversation et les mémoires associées.
        """

        self.clear_conversation(
            conversation_id
        )

        self.clear_memory(
            user_id=user_id,
            project_id=project_id,
        )