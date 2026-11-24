
"""
==========================================================
MACEVO IA
Projects Serializers
==========================================================

Serializers REST Framework des projets scientifiques.

Principe :

    API
     ↓
    Serializer
     ↓
    Validation
     ↓
    Service
     ↓
    Model
"""

from __future__ import annotations

from rest_framework import serializers
from django.urls import reverse

from .models import ProjectDocument, ProjectMemory, ScientificProject


class ScientificProjectSerializer(serializers.ModelSerializer):
    """
    Serializer principal d'un projet scientifique.

    Utilisé pour les réponses détaillées de l'API.
    """

    author = serializers.StringRelatedField(
        read_only=True,
    )

    class Meta:
        model = ScientificProject

        fields = (
            "id",

            # Auteur
            "author",

            # Informations générales
            "title",
            "slug",
            "subject",
            "scientific_field",
            "country",
            "institution",
            "faculty",
            "department",
            "description",
            "abstract",
            "content",
            "keywords",

            # Configuration scientifique persistante
            "research_problem",
            "research_questions",
            "general_objective",
            "specific_objectives",
            "hypotheses",
            "methodology",
            "institutional_requirements",
            "supervisor_instructions",
            "research_plan",
            "plan_status",
            "plan_validated_at",

            # Classification
            "project_type",
            "level",
            "language",
            "status",

            # Configuration scientifique
            "latex_template",
            "citation_style",
            "export_format",

            # IA
            "ai_provider",
            "ai_model",
            "last_ai_generation",

            # Documents
            "cover_image",
            "source_file",

            # Statistiques
            "word_count",
            "page_count",
            "chapter_count",
            "reference_count",
            "figure_count",
            "table_count",
            "progress",
            "version",

            # Organisation
            "is_public",
            "is_archived",
            "is_favorite",
            "last_opened",

            # Dates
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "author",
            "plan_validated_at",
            "word_count",
            "page_count",
            "chapter_count",
            "reference_count",
            "figure_count",
            "table_count",
            "last_ai_generation",
            "created_at",
            "updated_at",
        )


class ProjectDocumentSerializer(serializers.ModelSerializer):
    chunk_count = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectDocument
        fields = (
            "id", "original_name", "content_type", "size_bytes", "sha256",
            "extraction_status", "extraction_note", "metadata", "chunk_count",
            "download_url", "created_at", "updated_at",
        )
        read_only_fields = fields

    def get_download_url(self, obj):
        request = self.context.get("request")
        if not request or not obj.file:
            return None
        try:
            path = reverse(
                "projects:project-document-download",
                kwargs={"project_id": obj.project_id, "document_id": obj.pk},
            )
            return request.build_absolute_uri(path)
        except (ValueError, NotImplementedError):
            return None

    def get_chunk_count(self, obj):
        annotated = getattr(obj, "chunk_count", None)
        return annotated if annotated is not None else obj.chunks.count()


class ScientificProjectCreateSerializer(
    serializers.ModelSerializer
):
    """
    Serializer utilisé lors de la création d'un projet.

    L'auteur est toujours défini côté serveur à partir de
    request.user.
    """

    class Meta:
        model = ScientificProject

        fields = (
            "title",
            "slug",
            "subject",
            "scientific_field",
            "country",
            "institution",
            "faculty",
            "department",
            "description",
            "abstract",
            "content",
            "keywords",

            "research_problem",
            "research_questions",
            "general_objective",
            "specific_objectives",
            "hypotheses",
            "methodology",
            "institutional_requirements",
            "supervisor_instructions",
            "research_plan",
            "plan_status",

            "project_type",
            "level",
            "language",
            "status",

            "latex_template",
            "citation_style",
            "export_format",

            "ai_provider",
            "ai_model",

            "cover_image",
            "source_file",

            "is_public",
            "is_archived",
            "is_favorite",

            "version",
        )

    def validate_title(self, value):
        """
        Vérifie que le titre n'est pas vide.
        """

        value = (value or "").strip()

        if not value:
            raise serializers.ValidationError(
                "Le titre du projet est obligatoire."
            )

        return value

    def validate(self, attrs):
        """
        Validation complémentaire de création.
        """

        if attrs.get("is_archived"):
            raise serializers.ValidationError(
                {
                    "is_archived": (
                        "Un nouveau projet ne peut pas être "
                        "créé directement comme archivé."
                    )
                }
            )

        return attrs

    def create(self, validated_data):
        """
        Création du projet.

        L'auteur est imposé côté serveur.
        """

        request = self.context.get("request")

        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Un utilisateur authentifié est requis."
            )

        validated_data["author"] = request.user

        return ScientificProject.objects.create(
            **validated_data,
        )


class ScientificProjectUpdateSerializer(
    serializers.ModelSerializer
):
    """
    Serializer utilisé pour modifier un projet.

    Les statistiques, dates, auteur et informations internes
    de génération IA ne peuvent pas être modifiées directement
    par le client.
    """

    class Meta:
        model = ScientificProject

        fields = (
            "title",
            "slug",
            "subject",
            "scientific_field",
            "country",
            "institution",
            "faculty",
            "department",
            "description",
            "abstract",
            "content",
            "keywords",

            "research_problem",
            "research_questions",
            "general_objective",
            "specific_objectives",
            "hypotheses",
            "methodology",
            "institutional_requirements",
            "supervisor_instructions",
            "research_plan",
            "plan_status",

            "project_type",
            "level",
            "language",
            "status",

            "latex_template",
            "citation_style",
            "export_format",

            "ai_provider",
            "ai_model",

            "cover_image",
            "source_file",

            "is_public",
            "is_archived",
            "is_favorite",

            "last_opened",

            "version",
        )

    def validate_title(self, value):
        """
        Vérifie le titre lorsqu'il est modifié.
        """

        value = (value or "").strip()

        if not value:
            raise serializers.ValidationError(
                "Le titre du projet ne peut pas être vide."
            )

        return value

    def validate(self, attrs):
        """
        Validation complémentaire avant modification.
        """

        # Le serializer ne doit pas permettre de revenir
        # directement à une valeur statistique ou système :
        # ces champs ne sont volontairement pas exposés.

        return attrs


class ScientificProjectListSerializer(
    serializers.ModelSerializer
):
    """
    Serializer léger pour les listes de projets.
    """

    class Meta:
        model = ScientificProject

        fields = (
            "id",
            "title",
            "subject",
            "project_type",
            "level",
            "status",
            "language",
            "progress",
            "version",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "progress",
            "updated_at",
        )


class ScientificProjectStatisticsSerializer(
    serializers.ModelSerializer
):
    """
    Serializer des statistiques principales d'un projet.
    """

    class Meta:
        model = ScientificProject

        fields = (
            "word_count",
            "page_count",
            "chapter_count",
            "reference_count",
            "figure_count",
            "table_count",
            "progress",
        )

        read_only_fields = (
            "word_count",
            "page_count",
            "chapter_count",
            "reference_count",
            "figure_count",
            "table_count",
            "progress",
        )


class ProjectMemorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectMemory
        fields = (
            "id",
            "user",
            "project",
            "memory_type",
            "status",
            "content",
            "source_type",
            "source_reference",
            "version",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "user",
            "project",
            "version",
            "created_at",
            "updated_at",
        )

    def validate_content(self, value):
        value = str(value or "").strip()
        if not value:
            raise serializers.ValidationError(
                "Le contenu de mémoire ne peut pas être vide."
            )
        return value
