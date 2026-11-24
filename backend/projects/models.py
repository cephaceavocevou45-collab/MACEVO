
"""
==========================================================
MACEVO IA
Projects Models
==========================================================

Modèles principaux des projets scientifiques MACEVO.

Architecture actuelle :

    ScientificProject
        ├── ProjectChapter
        │      └── ProjectSection
        ├── ProjectReference
        ├── ProjectFigure
        └── ProjectTable

Le champ ``content`` est conservé pour compatibilité avec
l'éditeur actuel. La structure scientifique détaillée est
progressivement portée par les modèles enfants et pourra
ensuite être reliée au Document IR de MACEVO.
"""

from __future__ import annotations

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify

from common.constants import LANGUAGES
from common.models import BaseModel


class ScientificProject(BaseModel):
    """
    Projet scientifique principal de MACEVO IA.
    """

    # ======================================================
    # TYPES DE PROJETS
    # ======================================================

    LICENSE_MEMORY = "license_memory"
    MASTER_MEMORY = "master_memory"
    DOCTORAL_THESIS = "doctoral_thesis"
    SCIENTIFIC_ARTICLE = "scientific_article"
    TECHNICAL_REPORT = "technical_report"
    INTERNSHIP_REPORT = "internship_report"
    RESEARCH_PROJECT = "research_project"
    SCIENTIFIC_PRESENTATION = "scientific_presentation"
    BOOK = "book"
    TECHNICAL_DOCUMENTATION = "technical_documentation"
    CUSTOM = "custom"

    PROJECT_TYPES = (
        (LICENSE_MEMORY, "Mémoire de Licence"),
        (MASTER_MEMORY, "Mémoire de Master"),
        (DOCTORAL_THESIS, "Thèse de Doctorat"),
        (SCIENTIFIC_ARTICLE, "Article Scientifique"),
        (TECHNICAL_REPORT, "Rapport Technique"),
        (INTERNSHIP_REPORT, "Rapport de Stage"),
        (RESEARCH_PROJECT, "Projet de Recherche"),
        (SCIENTIFIC_PRESENTATION, "Présentation Scientifique"),
        (BOOK, "Livre"),
        (TECHNICAL_DOCUMENTATION, "Documentation Technique"),
        (CUSTOM, "Autre"),
    )

    # ======================================================
    # NIVEAUX ACADÉMIQUES
    # ======================================================

    NONE = "none"
    LICENSE = "license"
    MASTER = "master"
    DOCTORATE = "doctorate"
    POST_DOCTORATE = "post_doctorate"
    OTHER = "other"

    LEVELS = (
        (NONE, "Aucun"),
        (LICENSE, "Licence"),
        (MASTER, "Master"),
        (DOCTORATE, "Doctorat"),
        (POST_DOCTORATE, "Post-Doctorat"),
        (OTHER, "Autre"),
    )

    # ======================================================
    # STATUTS
    # ======================================================

    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    UNDER_REVIEW = "under_review"
    COMPLETED = "completed"
    PUBLISHED = "published"
    ARCHIVED = "archived"

    STATUS = (
        (DRAFT, "Brouillon"),
        (IN_PROGRESS, "En cours"),
        (UNDER_REVIEW, "En révision"),
        (COMPLETED, "Terminé"),
        (PUBLISHED, "Publié"),
        (ARCHIVED, "Archivé"),
    )

    # ======================================================
    # INFORMATIONS GÉNÉRALES
    # ======================================================

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
        db_index=True,
    )

    title = models.CharField(
        max_length=255,
        db_index=True,
    )

    slug = models.SlugField(
        max_length=255,
        unique=True,
        blank=True,
        null=True,
        db_index=True,
    )

    subject = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        db_index=True,
    )

    # Données scientifiques et institutionnelles du projet.
    # Les choix de document, niveau et langue sont portés par
    # project_type, level et language ci-dessus afin d'éviter les doublons.
    scientific_field = models.CharField(
        max_length=150,
        blank=True,
        default="",
        db_index=True,
    )

    country = models.CharField(max_length=150, blank=True, default="")
    institution = models.CharField(max_length=255, blank=True, default="")
    faculty = models.CharField(max_length=255, blank=True, default="")
    department = models.CharField(max_length=255, blank=True, default="")

    research_problem = models.TextField(blank=True, default="")
    research_questions = models.JSONField(default=list, blank=True)
    general_objective = models.TextField(blank=True, default="")
    specific_objectives = models.JSONField(default=list, blank=True)
    hypotheses = models.JSONField(default=list, blank=True)
    methodology = models.TextField(blank=True, default="")
    institutional_requirements = models.TextField(blank=True, default="")
    supervisor_instructions = models.TextField(blank=True, default="")

    PLAN_DRAFT = "draft"
    PLAN_NEEDS_REVIEW = "needs_review"
    PLAN_VALIDATED = "validated"
    PLAN_STATUS_CHOICES = (
        (PLAN_DRAFT, "Brouillon"),
        (PLAN_NEEDS_REVIEW, "À valider"),
        (PLAN_VALIDATED, "Validé"),
    )
    research_plan = models.JSONField(default=list, blank=True)
    plan_status = models.CharField(
        max_length=20,
        choices=PLAN_STATUS_CHOICES,
        default=PLAN_DRAFT,
        db_index=True,
    )
    plan_validated_at = models.DateTimeField(blank=True, null=True)

    description = models.TextField(
        blank=True,
        null=True,
    )

    abstract = models.TextField(
        blank=True,
        null=True,
    )

    content = models.TextField(
        blank=True,
        null=True,
        help_text=(
            "Contenu principal du projet. "
            "Conservé pour compatibilité avec l'éditeur actuel."
        ),
    )

    keywords = models.TextField(
        blank=True,
        null=True,
        help_text="Mots-clés séparés par des virgules.",
    )

    # ======================================================
    # CLASSIFICATION
    # ======================================================

    project_type = models.CharField(
        max_length=50,
        choices=PROJECT_TYPES,
        default=LICENSE_MEMORY,
        db_index=True,
    )

    level = models.CharField(
        max_length=30,
        choices=LEVELS,
        default=LICENSE,
        db_index=True,
    )

    language = models.CharField(
        max_length=5,
        choices=LANGUAGES,
        default="fr",
        db_index=True,
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS,
        default=DRAFT,
        db_index=True,
    )

    # ======================================================
    # CONFIGURATION SCIENTIFIQUE
    # ======================================================

    latex_template = models.CharField(
        max_length=100,
        default="ieee",
        db_index=True,
    )

    citation_style = models.CharField(
        max_length=30,
        default="ieee",
        db_index=True,
    )

    export_format = models.CharField(
        max_length=20,
        default="pdf",
    )

    # ======================================================
    # INTELLIGENCE ARTIFICIELLE
    # ======================================================

    ai_provider = models.CharField(
        max_length=50,
        default="ollama",
        db_index=True,
    )

    ai_model = models.CharField(
        max_length=100,
        default="qwen3",
    )

    last_ai_generation = models.DateTimeField(
        blank=True,
        null=True,
    )

    # ======================================================
    # DOCUMENTS
    # ======================================================

    cover_image = models.ImageField(
        upload_to="projects/covers/",
        blank=True,
        null=True,
    )

    source_file = models.FileField(
        upload_to="projects/files/",
        blank=True,
        null=True,
    )

    # ======================================================
    # STATISTIQUES
    # ======================================================

    word_count = models.PositiveIntegerField(
        default=0,
    )

    page_count = models.PositiveIntegerField(
        default=0,
    )

    chapter_count = models.PositiveIntegerField(
        default=0,
    )

    reference_count = models.PositiveIntegerField(
        default=0,
    )

    figure_count = models.PositiveIntegerField(
        default=0,
    )

    table_count = models.PositiveIntegerField(
        default=0,
    )

    progress = models.PositiveSmallIntegerField(
        default=0,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
    )

    version = models.CharField(
        max_length=20,
        default="1.0",
    )

    # ======================================================
    # ORGANISATION
    # ======================================================

    is_public = models.BooleanField(
        default=False,
        db_index=True,
    )

    is_archived = models.BooleanField(
        default=False,
        db_index=True,
    )

    is_favorite = models.BooleanField(
        default=False,
        db_index=True,
    )

    last_opened = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True,
    )

    # ======================================================
    # META
    # ======================================================

    class Meta:
        ordering = (
            "-updated_at",
        )

        verbose_name = "Projet scientifique"
        verbose_name_plural = "Projets scientifiques"

        indexes = (
            models.Index(
                fields=("author", "-updated_at"),
                name="project_author_updated_idx",
            ),
            models.Index(
                fields=("author", "status"),
                name="project_author_status_idx",
            ),
            models.Index(
                fields=("author", "is_archived"),
                name="project_author_archived_idx",
            ),
            models.Index(
                fields=("project_type", "level"),
                name="project_type_level_idx",
            ),
        )

    # ======================================================
    # SAUVEGARDE
    # ======================================================

    def save(self, *args, **kwargs):
        """
        Génère automatiquement un slug lorsqu'il est absent.

        La génération définitive des slugs et la gestion des
        collisions restent également prises en charge par
        ProjectService lors des opérations applicatives.
        """

        if not self.slug and self.title:
            self.slug = slugify(self.title)

        super().save(*args, **kwargs)

    # ======================================================
    # PROPRIÉTÉS
    # ======================================================

    @property
    def total_elements(self):
        """
        Nombre total d'éléments scientifiques structurés.
        """

        return (
            self.chapters.count()
            + self.references.count()
            + self.figures.count()
            + self.tables.count()
        )

    @property
    def has_content(self):
        """
        Indique si le projet possède du contenu exploitable.
        """

        return bool(
            (self.content or "").strip()
            or self.chapters.exists()
        )

    # ======================================================
    # REPRÉSENTATION
    # ======================================================

    def __str__(self):
        return self.title


class ProjectMemory(BaseModel):
    """Fait, décision, contrainte ou tâche structurée d'un projet."""

    USER_FACT = "user_fact"
    EXTRACTED_FACT = "extracted_fact"
    VALIDATED_DECISION = "validated_decision"
    AI_SUGGESTION = "ai_suggestion"
    CONSTRAINT = "constraint"
    TASK = "task"
    PROJECT_CONTEXT = "project_context"
    MEMORY_TYPES = (
        (USER_FACT, "Information fournie par l'utilisateur"),
        (EXTRACTED_FACT, "Information extraite"),
        (VALIDATED_DECISION, "Décision validée"),
        (AI_SUGGESTION, "Suggestion de l'IA"),
        (CONSTRAINT, "Contrainte"),
        (TASK, "Tâche restante"),
        (PROJECT_CONTEXT, "Contexte du projet"),
    )

    PROPOSED = "proposed"
    VALIDATED = "validated"
    ACTIVE = "active"
    REJECTED = "rejected"
    COMPLETED = "completed"
    STATUSES = (
        (PROPOSED, "À valider"),
        (VALIDATED, "Validé"),
        (ACTIVE, "Actif"),
        (REJECTED, "Refusé"),
        (COMPLETED, "Terminé"),
    )

    USER_SOURCE = "user"
    DOCUMENT_SOURCE = "document"
    AI_SOURCE = "ai"
    INSTITUTION_SOURCE = "institution"
    SYSTEM_SOURCE = "system"
    SOURCE_TYPES = (
        (USER_SOURCE, "Utilisateur"),
        (DOCUMENT_SOURCE, "Document"),
        (AI_SOURCE, "IA"),
        (INSTITUTION_SOURCE, "Institution"),
        (SYSTEM_SOURCE, "Système"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="scientific_project_memories",
        db_index=True,
    )
    project = models.ForeignKey(
        ScientificProject,
        on_delete=models.CASCADE,
        related_name="memories",
        db_index=True,
    )
    memory_type = models.CharField(
        max_length=30,
        choices=MEMORY_TYPES,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUSES,
        default=PROPOSED,
        db_index=True,
    )
    content = models.TextField()
    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_TYPES,
        default=USER_SOURCE,
    )
    source_reference = models.JSONField(default=dict, blank=True)
    version = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ("-updated_at", "-created_at")
        indexes = (
            models.Index(
                fields=("user", "project", "status", "memory_type"),
                name="project_memory_scope_idx",
            ),
        )

    def clean(self):
        super().clean()
        if self.project_id and self.user_id:
            if self.project.author_id != self.user_id:
                from django.core.exceptions import ValidationError

                raise ValidationError(
                    {"user": "L'utilisateur doit être propriétaire du projet."}
                )


class ProjectDocument(BaseModel):
    """Document importé dans un projet, avec son extraction textuelle."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="scientific_project_documents",
        db_index=True,
    )
    project = models.ForeignKey(
        ScientificProject,
        on_delete=models.CASCADE,
        related_name="documents",
        db_index=True,
    )
    file = models.FileField(upload_to="projects/documents/%Y/%m/")
    original_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=120, blank=True, default="")
    size_bytes = models.PositiveBigIntegerField(default=0)
    sha256 = models.CharField(max_length=64, db_index=True)
    extracted_text = models.TextField(blank=True, default="")
    extraction_status = models.CharField(
        max_length=20,
        choices=(("complete", "Terminée"), ("partial", "Partielle")),
        default="complete",
    )
    extraction_note = models.CharField(max_length=500, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = (
            models.UniqueConstraint(
                fields=("project", "sha256"),
                name="project_document_hash_uniq",
            ),
        )
        indexes = (
            models.Index(
                fields=("user", "project", "created_at"),
                name="project_document_scope_idx",
            ),
        )

    def clean(self):
        super().clean()
        if self.project_id and self.user_id and self.project.author_id != self.user_id:
            from django.core.exceptions import ValidationError

            raise ValidationError({"user": "L'utilisateur doit posséder le projet."})


class ProjectDocumentChunk(BaseModel):
    """Fragment textuel ordonné pour une recherche documentaire traçable."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="scientific_document_chunks",
        db_index=True,
    )
    project = models.ForeignKey(
        ScientificProject,
        on_delete=models.CASCADE,
        related_name="document_chunks",
        db_index=True,
    )
    document = models.ForeignKey(
        ProjectDocument,
        on_delete=models.CASCADE,
        related_name="chunks",
    )
    ordinal = models.PositiveIntegerField()
    text = models.TextField()
    start_offset = models.PositiveIntegerField()
    end_offset = models.PositiveIntegerField()
    page_number = models.PositiveIntegerField(null=True, blank=True)
    section_title = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ("document_id", "ordinal")
        constraints = (
            models.UniqueConstraint(
                fields=("document", "ordinal"),
                name="project_doc_chunk_order_uniq",
            ),
        )
        indexes = (
            models.Index(
                fields=("user", "project", "document"),
                name="project_doc_chunk_scope_idx",
            ),
        )


class ProjectChapter(BaseModel):
    """
    Chapitre d'un projet scientifique.
    """

    project = models.ForeignKey(
        ScientificProject,
        on_delete=models.CASCADE,
        related_name="chapters",
    )

    title = models.CharField(
        max_length=255,
    )

    number = models.PositiveIntegerField(
        default=1,
    )

    content = models.TextField(
        blank=True,
        default="",
    )

    order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        ordering = (
            "order",
            "number",
        )

        verbose_name = "Chapitre"
        verbose_name_plural = "Chapitres"

        constraints = (
            models.UniqueConstraint(
                fields=("project", "number"),
                name="unique_project_chapter_number",
            ),
        )

        indexes = (
            models.Index(
                fields=("project", "order"),
                name="chapter_project_order_idx",
            ),
        )

    def __str__(self):
        return f"{self.number}. {self.title}"


class ProjectSection(BaseModel):
    """
    Section ou sous-section d'un chapitre.
    """

    chapter = models.ForeignKey(
        ProjectChapter,
        on_delete=models.CASCADE,
        related_name="sections",
    )

    title = models.CharField(
        max_length=255,
    )

    number = models.CharField(
        max_length=20,
    )

    content = models.TextField(
        blank=True,
        default="",
    )

    order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        ordering = (
            "order",
        )

        verbose_name = "Section"
        verbose_name_plural = "Sections"

        indexes = (
            models.Index(
                fields=("chapter", "order"),
                name="section_chapter_order_idx",
            ),
        )

    def __str__(self):
        return f"{self.number}. {self.title}"


class ProjectReference(BaseModel):
    """
    Référence bibliographique d'un projet scientifique.
    """

    project = models.ForeignKey(
        ScientificProject,
        on_delete=models.CASCADE,
        related_name="references",
    )

    authors = models.CharField(
        max_length=500,
    )

    title = models.CharField(
        max_length=500,
    )

    year = models.PositiveIntegerField(
        blank=True,
        null=True,
    )

    journal = models.CharField(
        max_length=500,
        blank=True,
        default="",
    )

    publisher = models.CharField(
        max_length=500,
        blank=True,
        default="",
    )

    doi = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    url = models.URLField(
        blank=True,
        default="",
    )

    reference_type = models.CharField(
        max_length=50,
        default="article",
        db_index=True,
    )

    order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        ordering = (
            "order",
            "id",
        )

        verbose_name = "Référence"
        verbose_name_plural = "Références"

        indexes = (
            models.Index(
                fields=("project", "order"),
                name="reference_project_order_idx",
            ),
        )

    def __str__(self):
        return self.title


class ProjectFigure(BaseModel):
    """
    Figure ou image scientifique.
    """

    project = models.ForeignKey(
        ScientificProject,
        on_delete=models.CASCADE,
        related_name="figures",
    )

    title = models.CharField(
        max_length=255,
    )

    image = models.ImageField(
        upload_to="projects/figures/",
    )

    number = models.PositiveIntegerField(
        default=1,
    )

    caption = models.TextField(
        blank=True,
        default="",
    )

    order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        ordering = (
            "order",
            "number",
        )

        verbose_name = "Figure"
        verbose_name_plural = "Figures"

        indexes = (
            models.Index(
                fields=("project", "order"),
                name="figure_project_order_idx",
            ),
        )

    def __str__(self):
        return f"Figure {self.number} — {self.title}"


class ProjectTable(BaseModel):
    """
    Tableau scientifique.
    """

    project = models.ForeignKey(
        ScientificProject,
        on_delete=models.CASCADE,
        related_name="tables",
    )

    title = models.CharField(
        max_length=255,
    )

    number = models.PositiveIntegerField(
        default=1,
    )

    data = models.JSONField(
        default=list,
    )

    caption = models.TextField(
        blank=True,
        default="",
    )

    order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        ordering = (
            "order",
            "number",
        )

        verbose_name = "Tableau"
        verbose_name_plural = "Tableaux"

        indexes = (
            models.Index(
                fields=("project", "order"),
                name="table_project_order_idx",
            ),
        )

    def __str__(self):
        return f"Tableau {self.number} — {self.title}"
