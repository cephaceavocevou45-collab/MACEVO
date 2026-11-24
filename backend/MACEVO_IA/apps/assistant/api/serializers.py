from __future__ import annotations

from typing import Any

from django.conf import settings
from rest_framework import serializers


class ChatRequestSerializer(serializers.Serializer):
    """
    Validation de la requête HTTP de conversation MACEVO.

    Cette couche valide uniquement les données entrantes.
    La logique IA reste dans AIService / AIOrchestrator.
    """

    message = serializers.CharField(
        required=False,
        allow_blank=False,
        trim_whitespace=True,
    )

    messages = serializers.ListField(
        required=False,
        child=serializers.DictField(),
    )

    conversation_id = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        default=None,
    )

    user_id = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        default=None,
    )

    document_id = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        default=None,
    )

    provider = serializers.CharField(
        required=False,
        allow_blank=True,
        default=None,
    )

    model = serializers.CharField(
        required=False,
        allow_blank=True,
        default=None,
    )

    temperature = serializers.FloatField(
        required=False,
        min_value=0.0,
        max_value=2.0,
        default=settings.AI_TEMPERATURE,
    )

    max_tokens = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=32768,
        default=settings.AI_MAX_TOKENS,
    )

    stream = serializers.BooleanField(
        required=False,
        default=False,
    )

    instructions = serializers.ListField(
        required=False,
        child=serializers.CharField(
            allow_blank=False,
            trim_whitespace=True,
        ),
        default=list,
    )

    tools = serializers.ListField(
        required=False,
        child=serializers.JSONField(),
        default=list,
    )

    metadata = serializers.DictField(
        required=False,
        child=serializers.JSONField(),
        default=dict,
    )

    def validate_message(self, value: str) -> str:
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le message ne peut pas être vide."
            )

        return value

    def validate_messages(self, value: list[dict[str, Any]]) -> list[dict[str, str]]:
        normalized = []
        allowed_roles = {"system", "user", "assistant", "tool"}
        for index, message in enumerate(value):
            role = str(message.get("role", "")).strip().lower()
            content = message.get("content", "")
            if role not in allowed_roles:
                raise serializers.ValidationError(
                    f"Rôle invalide dans le message {index + 1}."
                )
            if not isinstance(content, str):
                content = str(content)
            normalized.append({"role": role, "content": content})
        if not normalized:
            raise serializers.ValidationError("L'historique ne peut pas être vide.")
        return normalized

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        messages = attrs.get("messages") or []
        message = attrs.get("message")
        if not message and not any(item["role"] == "user" for item in messages):
            raise serializers.ValidationError(
                {"message": "Un message utilisateur est obligatoire."}
            )
        if not message:
            attrs["message"] = next(
                item["content"]
                for item in reversed(messages)
                if item["role"] == "user"
            )

        conversation_id = attrs.get("conversation_id")

        if conversation_id is not None:
            conversation_id = str(
                conversation_id
            ).strip()

            attrs["conversation_id"] = (
                conversation_id or None
            )

        document_id = attrs.get("document_id")

        if document_id is not None:
            document_id = str(
                document_id
            ).strip()

            attrs["document_id"] = (
                document_id or None
            )

        return attrs

    def validate_provider(self, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip().lower()
        return value or None

    def validate_model(self, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    def validate_instructions(
        self,
        value: list[str],
    ) -> list[str]:
        return [
            instruction.strip()
            for instruction in value
            if instruction.strip()
        ]


class ChatResponseSerializer(serializers.Serializer):
    """
    Structure de réponse publique de l'API MACEVO.
    """

    success = serializers.BooleanField()

    status = serializers.CharField()

    data = serializers.JSONField(
        allow_null=True,
    )

    errors = serializers.ListField(
        child=serializers.CharField(),
        default=list,
    )

    warnings = serializers.ListField(
        child=serializers.CharField(),
        default=list,
    )

    metadata = serializers.JSONField(
        allow_null=True,
        required=False,
        default=dict,
    )
