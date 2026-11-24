from django.conf import settings
from django.db import models
from django.utils import timezone

from reports.models import Report


class ScientificDeposit(models.Model):
    """
    Dépôt scientifique public de MACEVO.

    Un dépôt scientifique correspond à un Report existant.
    Le Report reste le document canonique de la plateforme.

    ScientificDeposit ajoute uniquement la couche de publication :
    - identifiant public MACEVO ;
    - type scientifique ;
    - visibilité ;
    - consentement ;
    - publication ;
    - statistiques publiques.
    """

    DOCUMENT_TYPE_CHOICES = [
        ("RAP", "Rapport"),
        ("MEM", "Mémoire"),
        ("THE", "Thèse"),
        ("ART", "Article scientifique"),
        ("PFE", "Projet / PFE"),
        ("COU", "Cours"),
        ("DOC", "Document scientifique"),
        ("AUT", "Autre"),
    ]

    VISIBILITY_CHOICES = [
        ("private", "Privé"),
        ("shared", "Partagé"),
        ("public", "Public"),
    ]

    PUBLICATION_STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("pending", "En attente de publication"),
        ("published", "Publié"),
        ("withdrawn", "Retiré"),
    ]

    # ------------------------------------------------------------------
    # DOCUMENT CANONIQUE
    # ------------------------------------------------------------------

    report = models.OneToOneField(
        Report,
        on_delete=models.CASCADE,
        related_name="scientific_deposit",
        verbose_name="Rapport associé",
    )

    # ------------------------------------------------------------------
    # IDENTITÉ PUBLIQUE
    # ------------------------------------------------------------------

    public_id = models.CharField(
        max_length=80,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name="Identifiant public MACEVO",
    )

    document_type = models.CharField(
        max_length=10,
        choices=DOCUMENT_TYPE_CHOICES,
        default="DOC",
        db_index=True,
        verbose_name="Type de document",
    )

    # ------------------------------------------------------------------
    # PUBLICATION
    # ------------------------------------------------------------------

    visibility = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default="private",
        db_index=True,
        verbose_name="Visibilité",
    )

    publication_status = models.CharField(
        max_length=20,
        choices=PUBLICATION_STATUS_CHOICES,
        default="draft",
        db_index=True,
        verbose_name="Statut de publication",
    )

    # ------------------------------------------------------------------
    # CONSENTEMENT
    # ------------------------------------------------------------------

    consent_given = models.BooleanField(
        default=False,
        verbose_name="Autorisation de publication accordée",
    )

    consent_given_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date du consentement",
    )

    consent_version = models.CharField(
        max_length=30,
        blank=True,
        default="",
        verbose_name="Version des conditions acceptées",
    )

    # ------------------------------------------------------------------
    # PUBLICATION
    # ------------------------------------------------------------------

    published_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Date de publication",
    )

    withdrawn_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de retrait",
    )

    # ------------------------------------------------------------------
    # STATISTIQUES
    # ------------------------------------------------------------------

    view_count = models.PositiveBigIntegerField(
        default=0,
        verbose_name="Nombre de consultations",
    )

    download_count = models.PositiveBigIntegerField(
        default=0,
        verbose_name="Nombre de téléchargements",
    )

    # ------------------------------------------------------------------
    # TRAÇABILITÉ
    # ------------------------------------------------------------------

    deposited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scientific_deposits",
        verbose_name="Déposé par",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création du dépôt",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Dernière modification",
    )

    class Meta:
        ordering = ["-published_at", "-created_at"]
        verbose_name = "Dépôt scientifique"
        verbose_name_plural = "Dépôts scientifiques"

        indexes = [
            models.Index(
                fields=["publication_status", "visibility"],
                name="dep_status_visibility",
            ),
            models.Index(
                fields=["document_type", "publication_status"],
                name="dep_type_status",
            ),
            models.Index(
                fields=["published_at"],
                name="dep_published_at",
            ),
        ]

    def __str__(self):
        return f"{self.public_id} — {self.report.title}"

    # ------------------------------------------------------------------
    # IDENTIFIANT PUBLIC
    # ------------------------------------------------------------------

    def _build_public_id(self):
        """
        Construit un identifiant public stable.

        Exemple :
            MACEVO-RAP-2026-00000066
            MACEVO-MEM-2026-00000127
            MACEVO-THE-2026-00000452

        Le numéro interne du Report n'est jamais exposé comme
        identifiant principal du dépôt dans l'interface publique.
        """

        year = (
            self.created_at.year
            if self.created_at
            else timezone.now().year
        )

        return (
            f"MACEVO-"
            f"{self.document_type}-"
            f"{year}-"
            f"{self.report_id:08d}"
        )

    # ------------------------------------------------------------------
    # CONSENTEMENT
    # ------------------------------------------------------------------

    def give_consent(self, version="1.0"):
        """
        Enregistre explicitement l'autorisation de publication.
        """

        self.consent_given = True
        self.consent_given_at = timezone.now()
        self.consent_version = version

        if self.publication_status == "draft":
            self.publication_status = "pending"

    def revoke_consent(self):
        """
        Retire l'autorisation de publication.
        """

        self.consent_given = False
        self.consent_given_at = None
        self.consent_version = ""

        if self.publication_status == "published":
            self.publication_status = "withdrawn"
            self.withdrawn_at = timezone.now()

    # ------------------------------------------------------------------
    # PUBLICATION
    # ------------------------------------------------------------------

    def publish(self):
        """
        Publie le dépôt uniquement si le consentement a été donné.
        """

        if not self.consent_given:
            raise ValueError(
                "La publication est impossible sans consentement explicite."
            )

        if not self.consent_given_at:
            raise ValueError(
                "La date du consentement est obligatoire."
            )

        self.visibility = "public"
        self.publication_status = "published"
        self.published_at = timezone.now()
        self.withdrawn_at = None

    def withdraw(self):
        """
        Retire le document de la publication publique.
        """

        self.visibility = "private"
        self.publication_status = "withdrawn"
        self.withdrawn_at = timezone.now()

    # ------------------------------------------------------------------
    # ÉTAT PUBLIC
    # ------------------------------------------------------------------

    @property
    def is_public(self):
        return (
            self.visibility == "public"
            and self.publication_status == "published"
            and self.consent_given
        )

    # ------------------------------------------------------------------
    # SAUVEGARDE
    # ------------------------------------------------------------------

    def save(self, *args, **kwargs):
        """
        Génère l'identifiant public une seule fois.

        Une fois créé, public_id reste inchangé.
        """

        is_new = self.pk is None

        super().save(*args, **kwargs)

        if is_new and not self.public_id:
            self.public_id = self._build_public_id()

            super().save(
                update_fields=["public_id", "updated_at"]
            )