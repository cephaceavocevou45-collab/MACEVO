from django.conf import settings
from django.db import models


class SupportTicket(models.Model):
    class Category(models.TextChoices):
        ACCOUNT = "account", "Compte"
        DOCUMENT = "document", "Document et modèles"
        EDITOR = "editor", "Éditeur et export"
        ACADEMIC = "academic", "Consignes académiques"
        OTHER = "other", "Autre demande"

    class Status(models.TextChoices):
        OPEN = "open", "Ouvert"
        IN_PROGRESS = "in_progress", "En cours"
        RESOLVED = "resolved", "Résolu"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_tickets",
    )
    category = models.CharField(max_length=24, choices=Category.choices)
    subject = models.CharField(max_length=160)
    message = models.TextField(max_length=5000)
    response = models.TextField(max_length=5000, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "demande d’assistance"
        verbose_name_plural = "demandes d’assistance"

    def __str__(self):
        return f"{self.subject} — {self.get_status_display()}"
