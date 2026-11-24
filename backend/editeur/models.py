"""
MACEVO — Modèles de l'éditeur scientifique.

Le document principal reste reports.Report.

L'application editeur ne possède donc pas de deuxième
modèle de document.
"""

from django.conf import settings
from django.db import models

from reports.models import Report


class EditorAsset(models.Model):
    """
    Ressource associée à un rapport MACEVO.

    Peut représenter :
    - une image ;
    - une figure ;
    - un fichier scientifique.
    """

    ASSET_TYPE_CHOICES = [
        ("image", "Image"),
        ("figure", "Figure"),
        ("file", "Fichier"),
    ]

    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name="editor_assets",
    )

    asset_type = models.CharField(
        max_length=20,
        choices=ASSET_TYPE_CHOICES,
        default="image",
    )

    file = models.FileField(
        upload_to="editor/assets/",
    )

    title = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    description = models.TextField(
        blank=True,
        default="",
    )

    alt_text = models.CharField(
        max_length=500,
        blank=True,
        default="",
    )

    caption = models.CharField(
        max_length=500,
        blank=True,
        default="",
    )

    position = models.PositiveIntegerField(
        default=0,
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="editor_assets",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "position",
            "created_at",
        ]

        indexes = [
            models.Index(
                fields=["report", "asset_type"],
                name="ed_asset_report_type",
            ),
            models.Index(
                fields=["report", "position"],
                name="ed_asset_report_pos",
            ),
        ]

    def __str__(self):
        return (
            self.title
            or f"{self.get_asset_type_display()} #{self.pk}"
        )