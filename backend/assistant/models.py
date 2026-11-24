
"""
==========================================================
MACEVO IA
Assistant Models
==========================================================

Modèles des conversations, messages et pièces jointes.

Ces modèles constituent la couche de persistance de MACEVO IA.
Ils restent volontairement indépendants du fournisseur IA utilisé
(Ollama, OpenAI, Gemini, Anthropic, etc.).
"""

from django.conf import settings
from django.core.validators import MinLengthValidator
from django.db import models
from projects.models import ScientificProject


class Conversation(models.Model):
    """
    Conversation entre un utilisateur et MACEVO IA.

    Une conversation contient une suite de messages et peut être
    épinglée ou archivée.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations",
        verbose_name="Utilisateur",
    )

    scientific_project = models.ForeignKey(
        ScientificProject,
        on_delete=models.SET_NULL,
        related_name="assistant_conversations",
        null=True,
        blank=True,
        verbose_name="Projet scientifique",
    )

    title = models.CharField(
        max_length=255,
        default="Nouvelle conversation",
        validators=[MinLengthValidator(1)],
        verbose_name="Titre",
    )

    is_pinned = models.BooleanField(
        default=False,
        verbose_name="Épinglée",
    )

    is_archived = models.BooleanField(
        default=False,
        verbose_name="Archivée",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Dernière modification",
    )

    class Meta:
        ordering = ["-is_pinned", "-updated_at"]
        verbose_name = "Conversation"
        verbose_name_plural = "Conversations"

        indexes = [
    models.Index(
        fields=["user", "-updated_at"],
        name="asst_conv_usr_upd",
    ),
    models.Index(
        fields=["user", "is_archived"],
        name="asst_conv_usr_arch",
    ),
    models.Index(
        fields=["user", "is_pinned"],
        name="asst_conv_usr_pin",
    ),
]

    def __str__(self):
        title = (self.title or "").strip()
        return title or "Nouvelle conversation"

    @property
    def message_count(self):
        """
        Nombre de messages de la conversation.
        """

        return self.messages.count()

    @property
    def last_message(self):
        """
        Dernier message de la conversation.

        Retourne None si la conversation ne contient aucun message.
        """

        return self.messages.order_by("-created_at", "-id").first()

    def archive(self):
        """
        Archive la conversation.
        """

        if not self.is_archived:
            self.is_archived = True
            self.save(update_fields=["is_archived", "updated_at"])

    def unarchive(self):
        """
        Désarchive la conversation.
        """

        if self.is_archived:
            self.is_archived = False
            self.save(update_fields=["is_archived", "updated_at"])

    def pin(self):
        """
        Épingle la conversation.
        """

        if not self.is_pinned:
            self.is_pinned = True
            self.save(update_fields=["is_pinned", "updated_at"])

    def unpin(self):
        """
        Désépingle la conversation.
        """

        if self.is_pinned:
            self.is_pinned = False
            self.save(update_fields=["is_pinned", "updated_at"])


class Message(models.Model):
    """
    Message appartenant à une conversation.

    Le champ ``content`` contient le contenu textuel du message.
    Une pièce jointe peut être associée au message utilisateur.
    """

    ROLE_USER = "user"
    ROLE_ASSISTANT = "assistant"
    ROLE_SYSTEM = "system"

    ROLE_CHOICES = [
        (ROLE_USER, "Utilisateur"),
        (ROLE_ASSISTANT, "Assistant IA"),
        (ROLE_SYSTEM, "Système"),
    ]

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
        verbose_name="Conversation",
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        verbose_name="Auteur",
    )

    content = models.TextField(
        blank=True,
        default="",
        verbose_name="Contenu",
    )

    # ======================================================
    # PIÈCE JOINTE
    # ======================================================

    attachment = models.FileField(
        upload_to="assistant/attachments/%Y/%m/",
        null=True,
        blank=True,
        verbose_name="Pièce jointe",
    )

    attachment_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Nom du fichier",
    )

    attachment_type = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Type du fichier",
    )

    attachment_size = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        verbose_name="Taille du fichier",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'envoi",
    )

    class Meta:
        ordering = ["created_at", "id"]
        verbose_name = "Message"
        verbose_name_plural = "Messages"

        indexes = [
            models.Index(
                fields=["conversation", "created_at"],
                name="assistant_msg_conv_created_idx",
            ),
            models.Index(
                fields=["conversation", "role"],
                name="assistant_msg_conv_role_idx",
            ),
        ]

    def __str__(self):
        content = (self.content or "").strip().replace("\n", " ")

        if len(content) > 50:
            content = f"{content[:47]}..."

        return f"{self.role} - {content or '[message vide]'}"

    @property
    def has_attachment(self):
        """
        Indique si le message possède une pièce jointe.
        """

        return bool(self.attachment)

    @property
    def is_user_message(self):
        """
        Indique si le message provient de l'utilisateur.
        """

        return self.role == self.ROLE_USER

    @property
    def is_assistant_message(self):
        """
        Indique si le message provient de MACEVO IA.
        """

        return self.role == self.ROLE_ASSISTANT

    @property
    def is_system_message(self):
        """
        Indique si le message est un message système.
        """

        return self.role == self.ROLE_SYSTEM
