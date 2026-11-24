import json
import unicodedata

from django.db import transaction
from rest_framework import serializers
from .models import Report, Template
from projects.models import ScientificProject
from projects.services.project_service import ProjectService


class JSONListField(serializers.ListField):
    """Accepte une liste JSON issue d'un formulaire multipart."""

    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError(
                    "Fournissez une liste JSON valide."
                ) from exc
        return super().to_internal_value(data)


class TemplateSerializer(serializers.ModelSerializer):
    """
    Sérialisation des modèles de rapports (Templates) adaptés aux normes internationales.
    """

    class Meta:
        model = Template
        fields = [
            "id",
            "slug",
            "title",
            "description",
            "category",
            "country",      # Permet de cibler le pays ou le standard régional (ex: 'FR', 'US', 'BJ', 'GLOBAL')
            "language",     # Langue par défaut du template (ex: 'fr', 'en', 'es')
            "page_count",
            "is_popular",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]


class ReportSerializer(serializers.ModelSerializer):
    """
    API principale des rapports MACEVO avec support multilingue et multi-normes internationales.
    """

    status = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    author = serializers.SerializerMethodField(
        read_only=True
    )

    template_slug = serializers.CharField(
        write_only=True,
        required=False,
        allow_null=True,
        allow_blank=True,
    )

    template_details = TemplateSerializer(
        source="template",
        read_only=True,
    )

    institution_logo = serializers.ImageField(
        required=False,
        allow_null=True,
    )

    scientific_project = serializers.PrimaryKeyRelatedField(
        queryset=ScientificProject.objects.all(),
        required=False,
        allow_null=True,
    )

    research_problem = serializers.CharField(
        required=False, allow_blank=True, write_only=True,
    )
    research_questions = JSONListField(
        child=serializers.CharField(allow_blank=False),
        required=False, write_only=True,
    )
    general_objective = serializers.CharField(
        required=False, allow_blank=True, write_only=True,
    )
    specific_objectives = JSONListField(
        child=serializers.CharField(allow_blank=False),
        required=False, write_only=True,
    )
    hypotheses = JSONListField(
        child=serializers.CharField(allow_blank=False),
        required=False, write_only=True,
    )
    methodology = serializers.CharField(
        required=False, allow_blank=True, write_only=True,
    )
    supervisor_instructions = serializers.CharField(
        required=False, allow_blank=True, write_only=True,
    )

    class Meta:
        model = Report
        fields = [
            "id",
            "title",
            "summary",
            "scientific_field",
            "report_type",
            "academic_level",
            "language",           # Langue de rédaction du rapport
            "diploma",
            "author",
            "scientific_project",
            "research_problem",
            "research_questions",
            "general_objective",
            "specific_objectives",
            "hypotheses",
            "methodology",
            "supervisor_instructions",
            "author_first_name",
            "author_last_name",
            "student_id",
            "country",            # Pays de l'institution destinatrice
            "institution",
            "faculty",
            "department",
            "laboratory",
            "program",
            "specialty",
            "academic_year",
            "director",
            "co_director",
            "supervisor",
            "co_supervisor",
            "jury_president",
            "jury_rapporteur",
            "jury_examiner",
            "jury_members",
            "study_type",
            "citation_style",     # Standard international (APA, IEEE, Harvard, etc.)
            "reference_language",
            "institutional_requirements",
            "other_requirements",
            "generate_toc",
            "structure",
            "document",
            "content",
            "template_key",
            "macevo_document",
            "institution_logo",
            "template",
            "template_slug",
            "template_details",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "template",
            "template_details",
            "created_at",
            "updated_at",
        ]

    def get_author(self, obj):
        if not obj.author:
            return "Non renseigné"

        full_name = f"{obj.author.first_name} {obj.author.last_name}".strip()
        if full_name:
            return full_name

        if obj.author.username:
            return obj.author.username

        return "Non renseigné"

    def validate_scientific_project(self, project):
        if project is None:
            return None

        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated:
            raise serializers.ValidationError(
                "Un utilisateur authentifié est requis."
            )
        if project.author_id != user.pk:
            raise serializers.ValidationError(
                "Le projet sélectionné n'appartient pas à cet utilisateur."
            )
        return project

    @staticmethod
    def _normalized(value):
        value = unicodedata.normalize("NFKD", str(value or ""))
        return "".join(char for char in value if not unicodedata.combining(char)).lower().strip()

    @classmethod
    def _project_type(cls, report_type, academic_level):
        value = cls._normalized(report_type)
        level = cls._academic_level(academic_level)
        if "these" in value or "doctoral" in value:
            return ScientificProject.DOCTORAL_THESIS
        if "stage" in value:
            return ScientificProject.INTERNSHIP_REPORT
        if "article" in value:
            return ScientificProject.SCIENTIFIC_ARTICLE
        if "technique" in value:
            return ScientificProject.TECHNICAL_REPORT
        if "memoire" in value:
            return (
                ScientificProject.MASTER_MEMORY
                if level == ScientificProject.MASTER
                else ScientificProject.LICENSE_MEMORY
            )
        if "recherche" in value:
            return ScientificProject.RESEARCH_PROJECT
        return ScientificProject.CUSTOM

    @classmethod
    def _academic_level(cls, value):
        normalized = cls._normalized(value)
        if "doctor" in normalized or "phd" in normalized or "these" in normalized:
            return ScientificProject.DOCTORATE
        if "master" in normalized:
            return ScientificProject.MASTER
        if "licence" in normalized or "undergraduate" in normalized or "bachelor" in normalized:
            return ScientificProject.LICENSE
        if not normalized:
            return ScientificProject.NONE
        return ScientificProject.OTHER

    @staticmethod
    def _language_code(value):
        normalized = str(value or "").strip().lower()
        if normalized in {"fr", "en", "es", "de", "pt"}:
            return normalized
        if normalized.startswith("fran"):
            return "fr"
        if normalized.startswith("engl") or normalized.startswith("en "):
            return "en"
        if normalized.startswith("espa") or normalized.startswith("span"):
            return "es"
        if normalized.startswith("deut") or normalized.startswith("germ"):
            return "de"
        if normalized.startswith("port"):
            return "pt"
        return "fr"

    @classmethod
    def _project_values_from_report(cls, report_data, project_data):
        title = str(report_data.get("title") or "Projet scientifique").strip()
        summary = report_data.get("summary") or ""
        structure = report_data.get("structure") or []
        return {
            "title": title,
            "subject": title,
            "description": summary,
            "abstract": summary,
            "content": report_data.get("content") or "",
            "project_type": cls._project_type(
                report_data.get("report_type"), report_data.get("academic_level"),
            ),
            "level": cls._academic_level(report_data.get("academic_level")),
            "scientific_field": report_data.get("scientific_field") or "",
            "language": cls._language_code(report_data.get("language")),
            "country": report_data.get("country") or "",
            "institution": report_data.get("institution") or "",
            "faculty": report_data.get("faculty") or "",
            "department": report_data.get("department") or "",
            "citation_style": (report_data.get("citation_style") or "ieee")[:30],
            "research_plan": project_data.get("research_plan", structure),
            "research_problem": project_data.get("research_problem", ""),
            "research_questions": project_data.get("research_questions", []),
            "general_objective": project_data.get("general_objective", ""),
            "specific_objectives": project_data.get("specific_objectives", []),
            "hypotheses": project_data.get("hypotheses", []),
            "methodology": project_data.get("methodology") or report_data.get("study_type") or "",
            "institutional_requirements": report_data.get("institutional_requirements") or "",
            "supervisor_instructions": project_data.get("supervisor_instructions", ""),
            "plan_status": ScientificProject.PLAN_DRAFT,
        }

    @classmethod
    def _project_updates_from_report(cls, report):
        """Champs documentaires que le parcours historique édite encore."""
        return {
            "title": report.title,
            "subject": report.title,
            "description": report.summary or "",
            "abstract": report.summary or "",
            "content": report.content or "",
            "project_type": cls._project_type(
                report.report_type, report.academic_level,
            ),
            "level": cls._academic_level(report.academic_level),
            "scientific_field": report.scientific_field or "",
            "language": cls._language_code(report.language),
            "country": report.country or "",
            "institution": report.institution or "",
            "faculty": report.faculty or "",
            "department": report.department or "",
            "citation_style": (report.citation_style or "ieee")[:30],
            "institutional_requirements": report.institutional_requirements or "",
        }

    def validate_template_slug(self, value):
        if value is None:
            return None

        value = str(value).strip()
        if not value:
            return None

        try:
            return Template.objects.get(slug=value)
        except Template.DoesNotExist:
            raise serializers.ValidationError(
                f"Le modèle '{value}' n'existe pas ou n'est pas disponible pour cette région."
            )

    def validate_macevo_document(self, value):
        if value in (None, ""):
            return {}

        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError(
                    "Le document canonique doit être un objet JSON valide."
                ) from exc

        if not isinstance(value, dict) or value.get("model") != "MACEVO_DOCUMENT":
            raise serializers.ValidationError(
                "Le document doit être un modèle MACEVO_DOCUMENT valide."
            )

        return value

    def validate_status(self, value):
        if not value:
            return "draft"

        mapping = {
            "En cours": "progress",
            "Brouillon": "draft",
            "Terminé": "completed",
            "progress": "progress",
            "draft": "draft",
            "completed": "completed",
        }

        if value in mapping:
            return mapping[value]

        raise serializers.ValidationError(
            f"Le statut '{value}' est invalide."
        )

    def validate_structure(self, value):
        if value is None:
            return []

        if not isinstance(value, list):
            raise serializers.ValidationError(
                "La structure du rapport doit être une liste JSON."
            )

        for index, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    {
                        "structure": (
                            f"L'élément {index + 1} de la structure doit être un objet JSON valide."
                        )
                    }
                )

        return value

    def validate_jury_members(self, value):
        if value is None:
            return []

        if not isinstance(value, list):
            raise serializers.ValidationError(
                "Les membres supplémentaires du jury doivent être fournis sous forme de liste."
            )

        return value

    def validate_title(self, value):
        if value is None:
            return value

        value = str(value).strip()
        if not value:
            raise serializers.ValidationError(
                "Le titre du rapport est obligatoire."
            )

        return value

    def validate(self, attrs):
        if self.instance is None:
            title = attrs.get("title")
            if title is None or not str(title).strip():
                raise serializers.ValidationError(
                    {"title": "Le titre du rapport est obligatoire."}
                )
        return attrs

    def create(self, validated_data):
        """
        Crée le projet scientifique canonique et son premier document dans
        une transaction unique. Les appels d'API historiques restent valides.
        """
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Un utilisateur authentifié est requis."
            )

        project_data = {
            field: validated_data.pop(field)
            for field in (
                "research_problem",
                "research_questions",
                "general_objective",
                "specific_objectives",
                "hypotheses",
                "methodology",
                "supervisor_instructions",
            )
            if field in validated_data
        }

        template = validated_data.pop("template_slug", None)
        if template is not None:
            validated_data["template"] = template

        validated_data["author"] = request.user

        with transaction.atomic():
            project = validated_data.get("scientific_project")
            if project is None:
                project = ProjectService.create_project(
                    author=request.user,
                    **self._project_values_from_report(validated_data, project_data),
                )
                validated_data["scientific_project"] = project
            elif project.author_id != request.user.pk:
                raise serializers.ValidationError(
                    {"scientific_project": "Projet non accessible."}
                )

            return Report.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """
        Mise à jour d'un Report de manière sécurisée.
        """
        template_marker = object()
        template = validated_data.pop("template_slug", template_marker)
        project_fields = {
            field: validated_data.pop(field)
            for field in (
                "research_problem",
                "research_questions",
                "general_objective",
                "specific_objectives",
                "hypotheses",
                "methodology",
                "supervisor_instructions",
            )
            if field in validated_data
        }
        changed_report_fields = set(validated_data)

        if template is not template_marker:
            instance.template = template

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        with transaction.atomic():
            instance.save()
            project = instance.scientific_project
            if project is not None:
                project_updates = self._project_updates_from_report(instance)
                if "structure" in changed_report_fields:
                    project_updates["research_plan"] = instance.structure or []
                    project_updates["plan_status"] = ScientificProject.PLAN_DRAFT
                    project_updates["plan_validated_at"] = None
                for field, value in project_fields.items():
                    project_updates[field] = value
                for field, value in project_updates.items():
                    setattr(project, field, value)
                project.save()
        return instance
