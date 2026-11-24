
"""
==========================================================
MACEVO IA
Assistant Serializers
==========================================================

Sérialiseurs REST du module Assistant.

Les serializers sont responsables de la représentation API.
La logique métier reste dans AssistantService et la lecture
dans les selectors.
"""

from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    """
    Sérialisation complète d'un message.

    Les messages sont créés et modifiés par AssistantService.
    L'API de lecture expose donc ici les champs en lecture seule.
    """

    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Message

        fields = [
            "id",
            "role",
            "content",
            "created_at",
            "attachment",
            "attachment_url",
            "attachment_name",
            "attachment_type",
            "attachment_size",
        ]

        read_only_fields = [
            "id",
            "role",
            "content",
            "created_at",
            "attachment",
            "attachment_url",
            "attachment_name",
            "attachment_type",
            "attachment_size",
        ]

    def get_attachment_url(self, obj):
        """
        Retourne l'URL absolue de la pièce jointe.

        Si aucune requête HTTP n'est disponible dans le contexte,
        l'URL relative du storage est retournée.
        """

        if not obj.attachment:
            return None

        try:
            url = obj.attachment.url
        except (ValueError, AttributeError):
            return None

        request = self.context.get("request")

        if request is not None:
            try:
                return request.build_absolute_uri(url)
            except Exception:
                return url

        return url


class ConversationSerializer(serializers.ModelSerializer):
    """
    Sérialisation complète d'une conversation.

    Utilisée notamment pour afficher une conversation avec son
    historique de messages.
    """

    messages = MessageSerializer(
        many=True,
        read_only=True,
    )

    total_messages = serializers.SerializerMethodField()

    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation

        fields = [
            "id",
            "title",
            "scientific_project",
            "is_pinned",
            "is_archived",
            "created_at",
            "updated_at",
            "total_messages",
            "last_message",
            "messages",
        ]

        read_only_fields = [
            "id",
            "scientific_project",
            "created_at",
            "updated_at",
            "total_messages",
            "last_message",
            "messages",
        ]

    def get_total_messages(self, obj):
        """
        Retourne le nombre total de messages.
        """

        return obj.message_count

    def get_last_message(self, obj):
        """
        Retourne le contenu du dernier message.

        La valeur reste une chaîne vide lorsqu'il n'existe
        aucun message.
        """

        message = obj.last_message

        if not message:
            return ""

        return message.content or ""


class ConversationListSerializer(serializers.ModelSerializer):
    """
    Sérialiseur léger destiné aux listes de conversations.

    Contrairement à ConversationSerializer, il ne charge pas tout
    l'historique des messages.
    """

    total_messages = serializers.SerializerMethodField()

    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation

        fields = [
            "id",
            "title",
            "scientific_project",
            "is_pinned",
            "is_archived",
            "created_at",
            "updated_at",
            "total_messages",
            "last_message",
        ]

        read_only_fields = [
            "id",
            "scientific_project",
            "created_at",
            "updated_at",
            "total_messages",
            "last_message",
        ]

    def get_total_messages(self, obj):
        """
        Retourne le nombre de messages.
        """

        return obj.message_count

    def get_last_message(self, obj):
        """
        Retourne le contenu du dernier message.
        """

        message = obj.last_message

        if not message:
            return ""

        return message.content or ""


class ConversationCreateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur de création d'une conversation.

    Le propriétaire est déterminé par la vue/service et n'est
    jamais fourni par le client.
    """

    class Meta:
        model = Conversation

        fields = [
            "title",
        ]

    def validate_title(self, value):
        """
        Nettoie et valide le titre.
        """

        value = (value or "").strip()

        if not value:
            raise serializers.ValidationError(
                "Le titre de la conversation ne peut pas être vide."
            )

        return value


class ConversationRenameSerializer(serializers.Serializer):
    """
    Sérialiseur utilisé pour renommer une conversation.
    """

    title = serializers.CharField(
        max_length=255,
        allow_blank=False,
        trim_whitespace=True,
    )

    def validate_title(self, value):
        """
        Vérifie que le titre contient réellement du texte.
        """

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le titre ne peut pas être vide."
            )

        return value
