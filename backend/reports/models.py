from django.db import models
from django.contrib.auth import get_user_model


User = get_user_model()


class Template(models.Model):
    """
    Modèle de rapport disponible dans MACEVO, adapté aux standards internationaux.

    Le slug correspond à l'identifiant utilisé par le frontend.
    """

    slug = models.SlugField(
        max_length=100,
        unique=True,
        verbose_name="Identifiant du modèle",
    )

    title = models.CharField(
        max_length=255,
        verbose_name="Titre du modèle",
    )

    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Description",
    )

    category = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Catégorie",
    )

    # Nouveaux champs pour l'internationalisation des templates
    country = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Pays ou code régional (ex: International, BEN, FRA, CAN)",
        help_text="Permet de cibler les normes spécifiques d'un pays ou d'une région.",
    )

    language = models.CharField(
        max_length=50,
        default="fr",
        verbose_name="Langue du modèle",
        help_text="Code langue par défaut (ex: fr, en, es).",
    )

    page_count = models.IntegerField(
        default=1,
        verbose_name="Nombre de pages estimé",
    )

    is_popular = models.BooleanField(
        default=False,
        verbose_name="Modèle populaire",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création",
    )

    class Meta:
        ordering = ["title"]
        verbose_name = "Modèle de rapport"
        verbose_name_plural = "Modèles de rapports"

    def __str__(self):
        region_info = f" [{self.country}]" if self.country else " [Global]"
        return f"{self.title}{region_info}"


class Report(models.Model):
    """
    Document académique et scientifique créé dans MACEVO.

    Conçu pour supporter la diversité des formats institutionnels à l'échelle internationale.
    """

    STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("progress", "En cours"),
        ("completed", "Terminé"),
    ]

    # ============================================================
    # FICHIER / DOCUMENT
    # ============================================================

    document = models.FileField(
        upload_to="reports/",
        blank=True,
        null=True,
        verbose_name="Document importé",
    )

    # ============================================================
    # IDENTITÉ DU RAPPORT
    # ============================================================

    title = models.CharField(
        max_length=255,
        verbose_name="Titre du rapport",
    )

    summary = models.TextField(
        blank=True,
        null=True,
        verbose_name="Résumé",
    )

    scientific_field = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        verbose_name="Domaine scientifique / Discipline",
    )

    report_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Type de rapport",
    )

    academic_level = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Niveau d'études",
    )

    language = models.CharField(
        max_length=50,
        default="Français",
        verbose_name="Langue du rapport",
    )

    diploma = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Diplôme",
    )

    # ============================================================
    # IDENTITÉ DE L'AUTEUR
    # ============================================================

    author_first_name = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        verbose_name="Prénom de l'auteur",
    )

    author_last_name = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        verbose_name="Nom de l'auteur",
    )

    student_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Matricule / Identifiant étudiant",
    )

    # ============================================================
    # CONTEXTE ACADÉMIQUE ET GÉOGRAPHIQUE
    # ============================================================

    country = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        verbose_name="Pays de l'institution",
    )

    institution = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Université / Institution",
    )

    faculty = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Faculté",
    )

    department = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Département",
    )

    laboratory = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Laboratoire",
    )

    program = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Programme / Formation",
    )

    specialty = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Spécialité",
    )

    academic_year = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Année académique",
    )

    # ============================================================
    # LOGO DE L'INSTITUTION
    # ============================================================

    institution_logo = models.ImageField(
        upload_to="reports/logos/",
        blank=True,
        null=True,
        verbose_name="Logo de l'institution",
    )

    # ============================================================
    # DIRECTION / ENCADREMENT
    # ============================================================

    director = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Directeur",
    )

    co_director = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Co-directeur",
    )

    supervisor = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Directeur / Encadreur",
    )

    co_supervisor = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Co-encadreur",
    )

    # ============================================================
    # JURY
    # ============================================================

    jury_president = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Président du jury",
    )

    jury_rapporteur = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Rapporteur",
    )

    jury_examiner = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Examinateur",
    )

    jury_members = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Autres membres du jury",
    )

    # ============================================================
    # PRÉFÉRENCES SCIENTIFIQUES & INTERNATIONALES
    # ============================================================

    study_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Type d'étude",
    )

    citation_style = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Style de citation (ex: APA, IEEE, Harvard)",
    )

    reference_language = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Langue des références",
    )

    institutional_requirements = models.TextField(
        blank=True,
        null=True,
        verbose_name="Exigences institutionnelles",
    )

    other_requirements = models.TextField(
        blank=True,
        null=True,
        verbose_name="Autres exigences",
    )

    # ============================================================
    # OPTIONS DE DOCUMENT
    # ============================================================

    generate_toc = models.BooleanField(
        default=True,
        verbose_name="Générer la table des matières",
    )

    # ============================================================
    # STRUCTURE LOGIQUE DU DOCUMENT
    # ============================================================

    structure = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Structure du rapport",
    )

    # ============================================================
    # RELATION UTILISATEUR
    # ============================================================

    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reports",
        null=True,
        blank=True,
        verbose_name="Auteur du compte",
    )

    scientific_project = models.ForeignKey(
        "projects.ScientificProject",
        on_delete=models.SET_NULL,
        related_name="reports",
        null=True,
        blank=True,
        verbose_name="Projet scientifique associé",
        help_text=(
            "Projet scientifique canonique associé à ce document. "
            "La relation reste facultative pour préserver les rapports historiques."
        ),
    )

    # ============================================================
    # MODÈLE ASSOCIÉ
    # ============================================================

    template = models.ForeignKey(
        Template,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports",
        verbose_name="Modèle associé",
    )

    template_key = models.CharField(
        max_length=100,
        blank=True,
        default="",
        db_index=True,
        verbose_name="Identifiant du modèle MACEVO",
    )

    macevo_document = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Document canonique MACEVO",
    )

    # ============================================================
    # CONTENU ÉDITABLE
    # ============================================================

    content = models.TextField(
        blank=True,
        null=True,
        verbose_name="Contenu du rapport",
    )

    # ============================================================
    # STATUT
    # ============================================================

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
        verbose_name="Statut",
    )

    # ============================================================
    # DATES
    # ============================================================

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Dernière modification",
    )

    # ============================================================
    # CONFIGURATION
    # ============================================================

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Rapport"
        verbose_name_plural = "Rapports"

    # ============================================================
    # REPRÉSENTATION
    # ============================================================

    def __str__(self):
        author_name = (
            self.author.username
            if self.author
            else "Anonyme"
        )
        return f"{self.title} ({author_name})"
