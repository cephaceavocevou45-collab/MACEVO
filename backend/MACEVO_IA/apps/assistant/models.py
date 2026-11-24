from __future__ import annotations

import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Conversation(models.Model):
    """
    Conversation persistante de MACEVO IA.

    Une conversation regroupe l'ensemble des messages échangés
    entre l'utilisateur et le moteur MACEVO IA.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        db_index=True,
    )

    title = models.CharField(
        max_length=500,
        blank=True,
        default="",
    )

    model = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    provider = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
     ordering = ["-updated_at"]

    indexes = [
        models.Index(
            fields=["user_id", "-updated_at"],
            name="ast_conv_user_upd_idx",
        ),
        models.Index(
            fields=["provider", "model"],
            name="ast_conv_prov_model_idx",
        ),
    ]

    def __str__(self) -> str:
        return (
            self.title
            or f"Conversation {self.id}"
        )


class Message(models.Model):
    """
    Message persistant appartenant à une conversation.

    Les rôles correspondent aux rôles internes utilisés
    par les contrats IA de MACEVO.
    """

    ROLE_SYSTEM = "system"
    ROLE_USER = "user"
    ROLE_ASSISTANT = "assistant"
    ROLE_TOOL = "tool"

    ROLE_CHOICES = [
        (ROLE_SYSTEM, "System"),
        (ROLE_USER, "User"),
        (ROLE_ASSISTANT, "Assistant"),
        (ROLE_TOOL, "Tool"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
    )

    content = models.TextField(
        blank=True,
        default="",
    )

    name = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    tool_call_id = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    tool_calls = models.JSONField(
        default=list,
        blank=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["created_at"]

        indexes = [
            models.Index(
                fields=[
                    "conversation",
                    "created_at",
                ],
                name="assistant_msg_conv_created_idx",
            ),
            models.Index(
                fields=[
                    "conversation",
                    "role",
                    "created_at",
                ],
                name="assistant_msg_conv_role_idx",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.role}: "
            f"{self.content[:60]}"
        )


class Memory(models.Model):
    """
    Mémoire persistante de MACEVO IA.

    Une mémoire peut être associée à un utilisateur,
    à un projet, ou être générale.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        db_index=True,
    )

    project_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        db_index=True,
    )

    memory_type = models.CharField(
        max_length=100,
        default="general",
        db_index=True,
    )

    content = models.TextField()

    importance = models.FloatField(
        default=0.5,
        validators=[
            MinValueValidator(0.0),
            MaxValueValidator(1.0),
        ],
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-importance",
            "-updated_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "user_id",
                    "memory_type",
                    "-updated_at",
                ],
                name="assistant_mem_user_type_idx",
            ),
            models.Index(
                fields=[
                    "project_id",
                    "memory_type",
                    "-updated_at",
                ],
                name="assistant_mem_project_type_idx",
            ),
            models.Index(
                fields=[
                    "-importance",
                    "-updated_at",
                ],
                name="assistant_mem_importance_idx",
            ),
        ]

    def __str__(self) -> str:
        return self.content[:80]