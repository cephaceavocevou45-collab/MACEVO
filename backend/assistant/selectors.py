
"""
==========================================================
MACEVO IA
Assistant Selectors
==========================================================

Toutes les requêtes de lecture du module Assistant.

Les selectors centralisent les accès en lecture à la base de données.
Ils ne doivent pas contenir de logique métier lourde.
"""

from django.db.models import Q

from .models import Conversation, Message


class ConversationSelector:
    """
    Sélecteurs en lecture des conversations.

    Toutes les requêtes sont limitées à l'utilisateur fourni afin
    d'éviter toute fuite de conversation entre utilisateurs.
    """

    @staticmethod
    def list(user, search=""):
        """
        Retourne les conversations actives de l'utilisateur.

        Les conversations épinglées apparaissent en premier,
        puis les plus récemment modifiées.
        """

        queryset = (
            Conversation.objects
            .filter(
                user=user,
                is_archived=False,
            )
        )

        search = (search or "").strip()

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(messages__content__icontains=search)
            ).distinct()

        return queryset.order_by(
            "-is_pinned",
            "-updated_at",
            "-id",
        )

    @staticmethod
    def archived(user):
        """
        Retourne les conversations archivées de l'utilisateur.
        """

        return (
            Conversation.objects
            .filter(
                user=user,
                is_archived=True,
            )
            .order_by(
                "-updated_at",
                "-id",
            )
        )

    @staticmethod
    def favorites(user):
        """
        Retourne les conversations épinglées de l'utilisateur.
        """

        return (
            Conversation.objects
            .filter(
                user=user,
                is_pinned=True,
            )
            .order_by(
                "-updated_at",
                "-id",
            )
        )

    @staticmethod
    def by_id(user, conversation_id):
        """
        Retourne une conversation appartenant à l'utilisateur.

        Lève Conversation.DoesNotExist si elle n'existe pas.
        """

        return Conversation.objects.get(
            id=conversation_id,
            user=user,
        )

    @staticmethod
    def by_id_or_none(user, conversation_id):
        """
        Retourne une conversation ou None si elle n'existe pas.
        """

        if not conversation_id:
            return None

        return (
            Conversation.objects
            .filter(
                id=conversation_id,
                user=user,
            )
            .first()
        )

    @staticmethod
    def exists(user, conversation_id):
        """
        Vérifie si une conversation appartient à l'utilisateur.
        """

        if not conversation_id:
            return False

        return Conversation.objects.filter(
            id=conversation_id,
            user=user,
        ).exists()

    @staticmethod
    def count(user):
        """
        Nombre total de conversations de l'utilisateur.
        """

        return Conversation.objects.filter(
            user=user,
        ).count()

    @staticmethod
    def active_count(user):
        """
        Nombre de conversations non archivées.
        """

        return Conversation.objects.filter(
            user=user,
            is_archived=False,
        ).count()

    @staticmethod
    def archived_count(user):
        """
        Nombre de conversations archivées.
        """

        return Conversation.objects.filter(
            user=user,
            is_archived=True,
        ).count()

    @staticmethod
    def pinned_count(user):
        """
        Nombre de conversations épinglées.
        """

        return Conversation.objects.filter(
            user=user,
            is_pinned=True,
        ).count()

    @staticmethod
    def recent(user, limit=10):
        """
        Retourne les conversations récentes.

        ``limit`` est volontairement borné à une valeur positive.
        """

        try:
            limit = int(limit)
        except (TypeError, ValueError):
            limit = 10

        limit = max(1, min(limit, 100))

        return (
            Conversation.objects
            .filter(user=user)
            .order_by(
                "-updated_at",
                "-id",
            )[:limit]
        )


class MessageSelector:
    """
    Sélecteurs en lecture des messages.
    """

    @staticmethod
    def history(conversation):
        """
        Retourne tous les messages d'une conversation.

        L'ordre est chronologique et stable.
        """

        return (
            Message.objects
            .filter(
                conversation=conversation,
            )
            .order_by(
                "created_at",
                "id",
            )
        )

    @staticmethod
    def recent(conversation, limit=20):
        """
        Retourne les derniers messages d'une conversation.

        L'ordre retourné reste chronologique afin que le résultat
        puisse être envoyé directement au moteur IA.
        """

        try:
            limit = int(limit)
        except (TypeError, ValueError):
            limit = 20

        limit = max(1, min(limit, 200))

        messages = list(
            Message.objects
            .filter(
                conversation=conversation,
            )
            .order_by(
                "-created_at",
                "-id",
            )[:limit]
        )

        messages.reverse()

        return messages

    @staticmethod
    def last(conversation):
        """
        Retourne le dernier message de la conversation.
        """

        return (
            Message.objects
            .filter(
                conversation=conversation,
            )
            .order_by(
                "-created_at",
                "-id",
            )
            .first()
        )

    @staticmethod
    def first(conversation):
        """
        Retourne le premier message de la conversation.
        """

        return (
            Message.objects
            .filter(
                conversation=conversation,
            )
            .order_by(
                "created_at",
                "id",
            )
            .first()
        )

    @staticmethod
    def count(conversation):
        """
        Nombre de messages de la conversation.
        """

        return Message.objects.filter(
            conversation=conversation,
        ).count()

    @staticmethod
    def count_by_role(conversation, role):
        """
        Nombre de messages correspondant à un rôle donné.
        """

        return Message.objects.filter(
            conversation=conversation,
            role=role,
        ).count()

    @staticmethod
    def as_chat_history(conversation):
        """
        Transforme l'historique en format compatible avec les LLM.

        Format standard :

        [
            {
                "role": "user",
                "content": "..."
            },
            {
                "role": "assistant",
                "content": "..."
            }
        ]

        Ce format est volontairement indépendant du fournisseur IA.
        Ollama, OpenAI, Gemini, Anthropic et les futurs providers
        pourront recevoir une représentation adaptée à partir de
        cette structure.
        """

        messages = MessageSelector.history(conversation)

        return [
            {
                "role": message.role,
                "content": message.content or "",
            }
            for message in messages
        ]

    @staticmethod
    def as_chat_history_limited(conversation, limit=20):
        """
        Retourne les derniers messages au format LLM.

        Utile lorsque l'historique devient trop important pour
        être envoyé intégralement au modèle.
        """

        messages = MessageSelector.recent(
            conversation,
            limit=limit,
        )

        return [
            {
                "role": message.role,
                "content": message.content or "",
            }
            for message in messages
        ]

    @staticmethod
    def with_attachments(conversation):
        """
        Retourne uniquement les messages possédant une pièce jointe.
        """

        return (
            Message.objects
            .filter(
                conversation=conversation,
                attachment__isnull=False,
            )
            .exclude(
                attachment="",
            )
            .order_by(
                "created_at",
                "id",
            )
        )

    @staticmethod
    def user_messages(conversation):
        """
        Retourne les messages envoyés par l'utilisateur.
        """

        return (
            Message.objects
            .filter(
                conversation=conversation,
                role=Message.ROLE_USER,
            )
            .order_by(
                "created_at",
                "id",
            )
        )

    @staticmethod
    def assistant_messages(conversation):
        """
        Retourne les réponses de MACEVO IA.
        """

        return (
            Message.objects
            .filter(
                conversation=conversation,
                role=Message.ROLE_ASSISTANT,
            )
            .order_by(
                "created_at",
                "id",
            )
        )
