from django.db import models
from django.contrib.auth.models import User


class UserSettings(models.Model):

    # ==========================================================
    # CHOIX
    # ==========================================================

    THEME_CHOICES = [
        ("light", "Clair"),
        ("dark", "Sombre"),
        ("system", "Système"),
    ]

    LANGUAGE_CHOICES = [
        ("fr", "Français"),
        ("en", "English"),
        ("zh", "中文"),
        ("ar", "العربية"),
    ]

    EXPORT_CHOICES = [
        ("pdf", "PDF"),
        ("docx", "Word"),
        ("latex", "LaTeX"),
    ]

    DATE_FORMAT_CHOICES = [
        ("DD/MM/YYYY", "31/12/2026"),
        ("MM/DD/YYYY", "12/31/2026"),
        ("YYYY-MM-DD", "2026-12-31"),
    ]

    FONT_CHOICES = [
        ("inter", "Inter"),
        ("roboto", "Roboto"),
        ("times_new_roman", "Times New Roman"),
    ]

    FONT_SIZE_CHOICES = [
        ("10", "10 pt"),
        ("11", "11 pt"),
        ("12", "12 pt"),
        ("14", "14 pt"),
        ("16", "16 pt"),
    ]

    LINE_SPACING_CHOICES = [
        ("1.0", "1.0"),
        ("1.15", "1.15"),
        ("1.5", "1.5"),
        ("2.0", "2.0"),
    ]

    MARGIN_CHOICES = [
        ("narrow", "Étroites"),
        ("normal", "Normales"),
        ("wide", "Larges"),
    ]

    AI_MODEL_CHOICES = [
        ("qwen3", "Qwen3"),
        ("gpt-4o", "GPT-4o"),
        ("claude-3-5-sonnet", "Claude 3.5 Sonnet"),
    ]

    # ==========================================================
    # UTILISATEUR
    # ==========================================================

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="settings",
    )

    # ==========================================================
    # LOCALISATION
    # ==========================================================

    country = models.CharField(
        max_length=100,
        default="Bénin",
    )

    timezone = models.CharField(
        max_length=100,
        default="Africa/Porto-Novo",
    )

    language = models.CharField(
        max_length=10,
        choices=LANGUAGE_CHOICES,
        default="fr",
    )

    date_format = models.CharField(
        max_length=20,
        choices=DATE_FORMAT_CHOICES,
        default="DD/MM/YYYY",
    )

    # ==========================================================
    # ÉDITEUR
    # ==========================================================

    default_font = models.CharField(
        max_length=50,
        choices=FONT_CHOICES,
        default="inter",
    )

    font_size = models.CharField(
        max_length=10,
        choices=FONT_SIZE_CHOICES,
        default="12",
    )

    line_spacing = models.CharField(
        max_length=10,
        choices=LINE_SPACING_CHOICES,
        default="1.5",
    )

    default_margins = models.CharField(
        max_length=20,
        choices=MARGIN_CHOICES,
        default="normal",
    )

    auto_numbering = models.BooleanField(
        default=True,
    )

    show_ruler = models.BooleanField(
        default=True,
    )

    auto_save = models.BooleanField(
        default=True,
    )

    latex_preview = models.BooleanField(
        default=True,
    )

    scientific_spellcheck = models.BooleanField(
        default=True,
    )

    # ==========================================================
    # IA
    # ==========================================================

    ai_model = models.CharField(
        max_length=100,
        choices=AI_MODEL_CHOICES,
        default="qwen3",
    )

    creativity = models.FloatField(
        default=0.7,
    )

    academic_refs = models.BooleanField(
        default=True,
    )

    show_sources = models.BooleanField(
        default=True,
    )

    system_prompt = models.TextField(
        blank=True,
        default=(
            "Tu es un assistant scientifique rigoureux et structuré, "
            "spécialisé dans la rédaction académique de haut niveau."
        ),
    )

    # ==========================================================
    # NOTIFICATIONS
    # ==========================================================

    notification_ai_messages = models.BooleanField(
        default=True,
    )

    notification_latex_conversion = models.BooleanField(
        default=True,
    )

    notification_tips = models.BooleanField(
        default=True,
    )

    notification_marketing = models.BooleanField(
        default=False,
    )

    # ==========================================================
    # STOCKAGE / EXPORT
    # ==========================================================

    export_format = models.CharField(
        max_length=20,
        choices=EXPORT_CHOICES,
        default="pdf",
    )

    include_toc = models.BooleanField(
        default=True,
    )

    compress_images = models.BooleanField(
        default=True,
    )

    # ==========================================================
    # APPARENCE
    # ==========================================================

    theme = models.CharField(
        max_length=20,
        choices=THEME_CHOICES,
        default="system",
    )

    animations = models.BooleanField(
        default=True,
    )

    # ==========================================================
    # PROFIL PUBLIC
    # ==========================================================

    public_profile = models.BooleanField(
        default=False,
    )

    # ==========================================================
    # SÉCURITÉ
    # ==========================================================

    confirm_delete = models.BooleanField(
        default=True,
    )

    # ==========================================================
    # DATES
    # ==========================================================

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    # ==========================================================
    # META
    # ==========================================================

    class Meta:
        verbose_name = "Paramètres utilisateur"
        verbose_name_plural = "Paramètres utilisateurs"

    def __str__(self):
        return f"Paramètres de {self.user.username}"