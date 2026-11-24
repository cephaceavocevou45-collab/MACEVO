from __future__ import annotations

import uuid

from typing import Iterable, List, Optional

from core.ai.contracts.message import AIMessage, MessageRole


class DjangoConversationStore:
    """
    Store persistant des conversations MACEVO IA.

    Cette classe fait le pont entre le moteur IA générique
    et les modèles Django :

        Conversation
        Message

    Le reste du moteur IA ne dépend pas directement de Django.

    Architecture :

        AIRequest
            ↓
        ContextEngine
            ↓
        DjangoConversationStore
            ↓
        Django ORM
            ↓
        Database
    """

    def __init__(self, max_messages: int = 100):
        self.max_messages = max_messages

    # ================================================================
    # DJANGO MODELS
    # ================================================================

    @staticmethod
    def _models():
        """
        Charge les modèles Django uniquement au moment nécessaire.

        Cela évite les problèmes d'importation lorsque Django
        n'est pas encore initialisé.
        """

        from apps.assistant.models import Conversation, Message

        return Conversation, Message

    # ================================================================
    # IDENTIFIANT DE CONVERSATION
    # ================================================================

    @staticmethod
    def _normalize_conversation_id(
        conversation_id: Optional[str],
    ) -> Optional[str]:
        """
        Normalise un identifiant de conversation.

        Le modèle Django Conversation utilise un UUIDField.

        Si l'identifiant fourni est déjà un UUID valide,
        il est conservé.

        Si l'identifiant fourni n'est pas un UUID valide,
        un UUID déterministe est généré à partir de celui-ci.

        Exemple :

            "context-test"
                ↓
            UUID déterministe

        Ainsi, le frontend peut utiliser des identifiants
        externes sans casser la couche Django.
        """

        if not conversation_id:
            return None

        value = str(conversation_id).strip()

        if not value:
            return None

        try:
            return str(uuid.UUID(value))
        except ValueError:
            return str(
                uuid.uuid5(
                    uuid.NAMESPACE_URL,
                    f"macevo-conversation:{value}",
                )
            )

    # ================================================================
    # ROLE
    # ================================================================

    @staticmethod
    def _normalize_role(
        role: MessageRole | str,
    ) -> str:
        """
        Convertit MessageRole ou chaîne vers le format
        attendu par Django.
        """

        if isinstance(role, MessageRole):
            return role.value

        return str(role).lower().strip()

    # ================================================================
    # AIMessage -> Django Message
    # ================================================================

    @staticmethod
    def _message_to_model(
        conversation,
        message: AIMessage,
    ):
        """
        Convertit un AIMessage en instance du modèle Django Message.
        """

        _, Message = DjangoConversationStore._models()

        if not isinstance(message, AIMessage):
            raise TypeError(
                "message doit être une instance de AIMessage."
            )

        return Message(
            conversation=conversation,
            role=DjangoConversationStore._normalize_role(
                message.role
            ),
            content=message.content or "",
            name=message.name or "",
            tool_call_id=message.tool_call_id or "",
            tool_calls=list(message.tool_calls or []),
            metadata=dict(message.metadata or {}),
        )

    # ================================================================
    # Django Message -> AIMessage
    # ================================================================

    @staticmethod
    def _model_to_message(
        model,
    ) -> AIMessage:
        """
        Convertit un modèle Django Message en AIMessage.
        """

        role = MessageRole(model.role)

        return AIMessage(
            id=str(model.id),
            role=role,
            content=model.content or "",
            name=model.name or "",
            tool_call_id=model.tool_call_id or "",
            tool_calls=list(model.tool_calls or []),
            metadata=dict(model.metadata or {}),
            created_at=model.created_at,
        )

    # ================================================================
    # CONVERSATION
    # ================================================================

    def create_conversation(
        self,
        *,
        conversation_id: Optional[str] = None,
        user_id: Optional[str] = None,
        title: str = "",
        model: str = "",
        provider: str = "",
        metadata: Optional[dict] = None,
    ):
        """
        Crée une conversation persistante.
        """

        Conversation, _ = self._models()

        normalized_id = self._normalize_conversation_id(
            conversation_id
        )

        data = {
            "user_id": user_id,
            "title": title or "",
            "model": model or "",
            "provider": provider or "",
            "metadata": dict(metadata or {}),
        }

        if normalized_id:
            data["id"] = normalized_id

        return Conversation.objects.create(
            **data
        )

    def get_conversation(
        self,
        conversation_id: str,
    ):
        """
        Récupère une conversation par son identifiant.
        """

        if not conversation_id:
            raise ValueError(
                "conversation_id est obligatoire."
            )

        Conversation, _ = self._models()

        normalized_id = self._normalize_conversation_id(
            conversation_id
        )

        return (
            Conversation.objects
            .filter(id=normalized_id)
            .first()
        )

    def get_or_create_conversation(
        self,
        conversation_id: Optional[str] = None,
        *,
        user_id: Optional[str] = None,
        title: str = "",
        model: str = "",
        provider: str = "",
        metadata: Optional[dict] = None,
    ):
        """
        Récupère une conversation existante ou la crée.

        Les identifiants externes sont automatiquement
        normalisés en UUID.
        """

        normalized_id = self._normalize_conversation_id(
            conversation_id
        )

        if normalized_id:

            conversation = self.get_conversation(
                normalized_id
            )

            if conversation is not None:
                return conversation

        return self.create_conversation(
            conversation_id=normalized_id,
            user_id=user_id,
            title=title,
            model=model,
            provider=provider,
            metadata=metadata,
        )

    # ================================================================
    # MESSAGES
    # ================================================================

    def add(
        self,
        conversation_id: str,
        message: AIMessage,
    ) -> AIMessage:
        """
        Ajoute un message à une conversation persistante.
        """

        if not conversation_id:
            raise ValueError(
                "conversation_id est obligatoire."
            )

        normalized_id = self._normalize_conversation_id(
            conversation_id
        )

        conversation = self.get_conversation(
            normalized_id
        )

        if conversation is None:
            conversation = self.create_conversation(
                conversation_id=normalized_id
            )

        message_model = self._message_to_model(
            conversation,
            message,
        )

        message_model.save()

        conversation.save(
            update_fields=["updated_at"]
        )

        return self._model_to_message(
            message_model
        )

    def add_many(
        self,
        conversation_id: str,
        messages: Iterable[AIMessage],
    ) -> List[AIMessage]:
        """
        Ajoute plusieurs messages à une conversation.
        """

        if not conversation_id:
            raise ValueError(
                "conversation_id est obligatoire."
            )

        results = []

        for message in messages:
            results.append(
                self.add(
                    conversation_id,
                    message,
                )
            )

        return results

    def get(
        self,
        conversation_id: str,
        *,
        limit: Optional[int] = None,
    ) -> List[AIMessage]:
        """
        Récupère l'historique d'une conversation
        dans l'ordre chronologique.
        """

        if not conversation_id:
            raise ValueError(
                "conversation_id est obligatoire."
            )

        _, Message = self._models()

        normalized_id = self._normalize_conversation_id(
            conversation_id
        )

        queryset = (
            Message.objects
            .filter(
                conversation_id=normalized_id
            )
            .order_by("created_at")
        )

        effective_limit = (
            limit
            if limit is not None
            else self.max_messages
        )

        if effective_limit > 0:

            queryset = queryset.order_by(
                "-created_at"
            )[:effective_limit]

            models = list(queryset)

            models.reverse()

        else:

            models = list(queryset)

        return [
            self._model_to_message(model)
            for model in models
        ]

    def last(
        self,
        conversation_id: str,
    ) -> Optional[AIMessage]:
        """
        Retourne le dernier message d'une conversation.
        """

        if not conversation_id:
            raise ValueError(
                "conversation_id est obligatoire."
            )

        _, Message = self._models()

        normalized_id = self._normalize_conversation_id(
            conversation_id
        )

        model = (
            Message.objects
            .filter(
                conversation_id=normalized_id
            )
            .order_by("-created_at")
            .first()
        )

        if model is None:
            return None

        return self._model_to_message(
            model
        )

    # ================================================================
    # EXISTENCE / STATISTIQUES
    # ================================================================

    def exists(
        self,
        conversation_id: str,
    ) -> bool:
        """
        Vérifie si une conversation existe.
        """

        if not conversation_id:
            return False

        Conversation, _ = self._models()

        normalized_id = self._normalize_conversation_id(
            conversation_id
        )

        return Conversation.objects.filter(
            id=normalized_id
        ).exists()

    def count(
        self,
        conversation_id: str,
    ) -> int:
        """
        Retourne le nombre de messages d'une conversation.
        """

        if not conversation_id:
            return 0

        _, Message = self._models()

        normalized_id = self._normalize_conversation_id(
            conversation_id
        )

        return Message.objects.filter(
            conversation_id=normalized_id
        ).count()

    # ================================================================
    # NETTOYAGE
    # ================================================================

    def clear(
        self,
        conversation_id: str,
    ) -> None:
        """
        Supprime tous les messages d'une conversation
        sans supprimer la conversation elle-même.
        """

        if not conversation_id:
            raise ValueError(
                "conversation_id est obligatoire."
            )

        _, Message = self._models()

        normalized_id = self._normalize_conversation_id(
            conversation_id
        )

        Message.objects.filter(
            conversation_id=normalized_id
        ).delete()

    def delete_conversation(
        self,
        conversation_id: str,
    ) -> None:
        """
        Supprime complètement une conversation.

        Les messages associés sont supprimés automatiquement
        grâce à la relation CASCADE du modèle Django.
        """

        if not conversation_id:
            raise ValueError(
                "conversation_id est obligatoire."
            )

        Conversation, _ = self._models()

        normalized_id = self._normalize_conversation_id(
            conversation_id
        )

        Conversation.objects.filter(
            id=normalized_id
        ).delete()

    # ================================================================
    # LISTE DES CONVERSATIONS
    # ================================================================

    def conversations(
        self,
        *,
        user_id: Optional[str] = None,
        limit: int = 50,
    ):
        """
        Liste les conversations persistantes.

        Les conversations les plus récemment modifiées
        sont retournées en premier.
        """

        Conversation, _ = self._models()

        queryset = Conversation.objects.all()

        if user_id is not None:
            queryset = queryset.filter(
                user_id=user_id
            )

        queryset = queryset.order_by(
            "-updated_at"
        )

        if limit > 0:
            queryset = queryset[:limit]

        return list(queryset)