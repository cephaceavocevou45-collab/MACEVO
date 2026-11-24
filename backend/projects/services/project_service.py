
"""
==========================================================
MACEVO IA
Project Service
==========================================================

Service central de gestion des projets scientifiques.

Toutes les opérations métier liées aux projets
passent par cette classe.

Responsabilités :
- création ;
- modification ;
- suppression ;
- archivage ;
- restauration ;
- favoris ;
- publication ;
- duplication ;
- recherche et récupération ;
- génération de slugs.

Auteur : MACEVO
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from django.db import transaction
from django.utils.text import slugify

from projects.models import ScientificProject


logger = logging.getLogger(__name__)


class ProjectService:
    """
    Service métier central des projets scientifiques MACEVO.

    Les vues et API doivent privilégier cette classe pour
    les opérations métier plutôt que de manipuler directement
    ScientificProject.objects.
    """

    # =========================================================
    # UTILITAIRES
    # =========================================================

    @staticmethod
    def _generate_unique_slug(
        title: str,
        project: Optional[ScientificProject] = None,
    ) -> str:
        """
        Génère un slug unique.

        Si un projet est fourni, son propre slug est exclu
        de la vérification.
        """

        base_slug = slugify(
            str(title or "").strip()
        )

        if not base_slug:
            base_slug = "projet-scientifique"

        slug = base_slug

        queryset = ScientificProject.objects.all()

        if project is not None and project.pk:
            queryset = queryset.exclude(
                pk=project.pk
            )

        counter = 2

        while queryset.filter(
            slug=slug
        ).exists():

            slug = f"{base_slug}-{counter}"
            counter += 1

        return slug

    @staticmethod
    def _field_exists(
        field_name: str,
    ) -> bool:
        """
        Vérifie qu'un champ existe réellement sur le modèle.

        Utile pour garder le service compatible avec différentes
        versions du modèle ScientificProject.
        """

        try:
            ScientificProject._meta.get_field(
                field_name
            )
            return True

        except Exception:
            return False

    @staticmethod
    def _save(
        project: ScientificProject,
        fields: Optional[list[str]] = None,
    ) -> ScientificProject:
        """
        Sauvegarde un projet en tenant compte de updated_at
        lorsqu'il existe.
        """

        update_fields = None

        if fields:
            update_fields = list(fields)

            if ProjectService._field_exists(
                "updated_at"
            ) and "updated_at" not in update_fields:
                update_fields.append(
                    "updated_at"
                )

        if update_fields:
            project.save(
                update_fields=update_fields
            )
        else:
            project.save()

        return project

    # =========================================================
    # CRÉATION
    # =========================================================

    @staticmethod
    @transaction.atomic
    def create_project(
        **validated_data: Any,
    ) -> ScientificProject:
        """
        Crée un nouveau projet scientifique.

        Le slug est généré automatiquement lorsqu'il n'est
        pas fourni.
        """

        title = str(
            validated_data.get(
                "title",
                ""
            )
        ).strip()

        if not title:
            raise ValueError(
                "Le titre du projet est obligatoire."
            )

        validated_data["title"] = title

        if not validated_data.get("slug"):
            validated_data["slug"] = (
                ProjectService._generate_unique_slug(
                    title
                )
            )
        else:
            validated_data["slug"] = (
                ProjectService._generate_unique_slug(
                    validated_data["slug"]
                )
            )

        project = ScientificProject.objects.create(
            **validated_data
        )

        logger.info(
            "Projet scientifique créé : id=%s slug=%s",
            project.pk,
            getattr(project, "slug", None),
        )

        return project

    # =========================================================
    # RÉCUPÉRATION
    # =========================================================

    @staticmethod
    def get_project(
        project_id: Any,
    ) -> ScientificProject:
        """
        Récupère un projet par son identifiant.
        """

        return ScientificProject.objects.get(
            pk=project_id
        )

    @staticmethod
    def get_project_by_slug(
        slug: str,
    ) -> ScientificProject:
        """
        Récupère un projet par son slug.
        """

        return ScientificProject.objects.get(
            slug=slug
        )

    @staticmethod
    def list_projects(
        include_archived: bool = False,
    ):
        """
        Retourne les projets.

        Par défaut, les projets archivés sont exclus.
        """

        queryset = ScientificProject.objects.all()

        if (
            not include_archived
            and ProjectService._field_exists(
                "is_archived"
            )
        ):
            queryset = queryset.filter(
                is_archived=False
            )

        return queryset

    # =========================================================
    # MODIFICATION
    # =========================================================

    @staticmethod
    @transaction.atomic
    def update_project(
        project: ScientificProject,
        **validated_data: Any,
    ) -> ScientificProject:
        """
        Met à jour un projet.

        Le slug est recalculé uniquement lorsque le titre
        est effectivement modifié.
        """

        if project is None:
            raise ValueError(
                "Le projet est obligatoire."
            )

        changed_fields = []

        title = validated_data.get(
            "title"
        )

        if title is not None:
            title = str(title).strip()

            if not title:
                raise ValueError(
                    "Le titre du projet ne peut pas être vide."
                )

            validated_data["title"] = title

            current_title = getattr(
                project,
                "title",
                "",
            )

            if title != current_title:
                if ProjectService._field_exists(
                    "slug"
                ):
                    validated_data["slug"] = (
                        ProjectService._generate_unique_slug(
                            title,
                            project=project,
                        )
                    )

        for field, value in validated_data.items():

            if not ProjectService._field_exists(
                field
            ):
                raise ValueError(
                    f"Champ inconnu du projet : {field}"
                )

            current_value = getattr(
                project,
                field,
                None,
            )

            if current_value != value:
                setattr(
                    project,
                    field,
                    value,
                )

                changed_fields.append(
                    field
                )

        if changed_fields:
            ProjectService._save(
                project,
                fields=changed_fields,
            )

        logger.info(
            "Projet scientifique mis à jour : id=%s fields=%s",
            project.pk,
            changed_fields,
        )

        return project

    # =========================================================
    # SUPPRESSION
    # =========================================================

    @staticmethod
    @transaction.atomic
    def delete_project(
        project: ScientificProject,
    ) -> None:
        """
        Supprime définitivement un projet.
        """

        if project is None:
            raise ValueError(
                "Le projet est obligatoire."
            )

        project_id = project.pk

        project.delete()

        logger.info(
            "Projet scientifique supprimé définitivement : id=%s",
            project_id,
        )

    # =========================================================
    # ARCHIVAGE
    # =========================================================

    @staticmethod
    @transaction.atomic
    def archive_project(
        project: ScientificProject,
    ) -> ScientificProject:
        """
        Archive un projet.
        """

        if not ProjectService._field_exists(
            "is_archived"
        ):
            raise AttributeError(
                "ScientificProject ne possède pas "
                "le champ is_archived."
            )

        project.is_archived = True

        return ProjectService._save(
            project,
            fields=["is_archived"],
        )

    # =========================================================
    # RESTAURATION
    # =========================================================

    @staticmethod
    @transaction.atomic
    def restore_project(
        project: ScientificProject,
    ) -> ScientificProject:
        """
        Restaure un projet archivé.
        """

        if not ProjectService._field_exists(
            "is_archived"
        ):
            raise AttributeError(
                "ScientificProject ne possède pas "
                "le champ is_archived."
            )

        project.is_archived = False

        return ProjectService._save(
            project,
            fields=["is_archived"],
        )

    # =========================================================
    # FAVORIS
    # =========================================================

    @staticmethod
    @transaction.atomic
    def favorite_project(
        project: ScientificProject,
    ) -> ScientificProject:
        """
        Inverse l'état favori d'un projet.
        """

        if not ProjectService._field_exists(
            "is_favorite"
        ):
            raise AttributeError(
                "ScientificProject ne possède pas "
                "le champ is_favorite."
            )

        project.is_favorite = not bool(
            project.is_favorite
        )

        return ProjectService._save(
            project,
            fields=["is_favorite"],
        )

    # Alias explicite.
    toggle_favorite = favorite_project

    # =========================================================
    # PUBLICATION
    # =========================================================

    @staticmethod
    @transaction.atomic
    def publish_project(
        project: ScientificProject,
    ) -> ScientificProject:
        """
        Rend un projet public et publié.
        """

        fields = []

        if ProjectService._field_exists(
            "is_public"
        ):
            project.is_public = True
            fields.append(
                "is_public"
            )

        if ProjectService._field_exists(
            "status"
        ):
            published_status = getattr(
                ScientificProject,
                "PUBLISHED",
                "published",
            )

            project.status = published_status

            fields.append(
                "status"
            )

        if not fields:
            raise AttributeError(
                "ScientificProject ne possède ni "
                "is_public ni status."
            )

        return ProjectService._save(
            project,
            fields=fields,
        )

    # =========================================================
    # DÉPUBLICATION
    # =========================================================

    @staticmethod
    @transaction.atomic
    def unpublish_project(
        project: ScientificProject,
    ) -> ScientificProject:
        """
        Retire la publication publique d'un projet.

        Le statut est remis à une valeur cohérente lorsqu'une
        constante correspondante existe sur le modèle.
        """

        fields = []

        if ProjectService._field_exists(
            "is_public"
        ):
            project.is_public = False
            fields.append(
                "is_public"
            )

        if ProjectService._field_exists(
            "status"
        ):
            draft_status = getattr(
                ScientificProject,
                "DRAFT",
                "draft",
            )

            project.status = draft_status

            fields.append(
                "status"
            )

        if not fields:
            raise AttributeError(
                "ScientificProject ne possède ni "
                "is_public ni status."
            )

        return ProjectService._save(
            project,
            fields=fields,
        )

    # =========================================================
    # DUPLICATION
    # =========================================================

    @staticmethod
    @transaction.atomic
    def duplicate_project(
        project: ScientificProject,
    ) -> ScientificProject:
        """
        Crée une véritable copie indépendante du projet.

        L'objet original n'est jamais modifié.
        """

        if project is None:
            raise ValueError(
                "Le projet est obligatoire."
            )

        original_title = str(
            getattr(
                project,
                "title",
                "Projet scientifique",
            )
        ).strip()

        new_title = (
            f"{original_title} (Copie)"
        )

        new_data: Dict[str, Any] = {}

        # -----------------------------------------------------
        # Copier les champs concrets du modèle.
        # -----------------------------------------------------

        for field in project._meta.concrete_fields:

            name = field.name

            # La clé primaire sera recréée automatiquement.
            if getattr(
                field,
                "primary_key",
                False,
            ):
                continue

            # Ces champs sont généralement gérés par Django.
            if name in {
                "created_at",
                "updated_at",
            }:
                continue

            # Relations : on ne copie pas automatiquement
            # les ForeignKey complexes ici.
            if field.is_relation:
                new_data[name] = getattr(
                    project,
                    name,
                )

                continue

            new_data[name] = getattr(
                project,
                name,
            )

        # -----------------------------------------------------
        # Titre / slug
        # -----------------------------------------------------

        if ProjectService._field_exists(
            "title"
        ):
            new_data["title"] = new_title

        if ProjectService._field_exists(
            "slug"
        ):
            new_data["slug"] = (
                ProjectService._generate_unique_slug(
                    new_title
                )
            )

        # -----------------------------------------------------
        # Version
        # -----------------------------------------------------

        if ProjectService._field_exists(
            "version"
        ):
            new_data["version"] = 1

        # -----------------------------------------------------
        # Une copie ne doit pas être publiée par défaut.
        # -----------------------------------------------------

        if ProjectService._field_exists(
            "is_public"
        ):
            new_data["is_public"] = False

        if ProjectService._field_exists(
            "is_archived"
        ):
            new_data["is_archived"] = False

        if ProjectService._field_exists(
            "is_favorite"
        ):
            new_data["is_favorite"] = False

        if ProjectService._field_exists(
            "status"
        ):
            new_data["status"] = getattr(
                ScientificProject,
                "DRAFT",
                "draft",
            )

        duplicated = ScientificProject.objects.create(
            **new_data
        )

        logger.info(
            "Projet scientifique dupliqué : original=%s nouveau=%s",
            project.pk,
            duplicated.pk,
        )

        return duplicated

    # =========================================================
    # RECHERCHE
    # =========================================================

    @staticmethod
    def search(
        query: str,
        include_archived: bool = False,
    ):
        """
        Recherche un projet par titre, slug ou description
        lorsque ces champs existent.
        """

        from django.db.models import Q

        query = str(
            query or ""
        ).strip()

        if not query:
            return ProjectService.list_projects(
                include_archived=include_archived
            )

        queryset = ProjectService.list_projects(
            include_archived=include_archived
        )

        conditions = Q()

        if ProjectService._field_exists(
            "title"
        ):
            conditions |= Q(
                title__icontains=query
            )

        if ProjectService._field_exists(
            "slug"
        ):
            conditions |= Q(
                slug__icontains=query
            )

        if ProjectService._field_exists(
            "description"
        ):
            conditions |= Q(
                description__icontains=query
            )

        if not conditions.children:
            return queryset.none()

        return queryset.filter(
            conditions
        ).distinct()

    # =========================================================
    # INFORMATIONS
    # =========================================================

    @staticmethod
    def project_summary(
        project: ScientificProject,
    ) -> Dict[str, Any]:
        """
        Retourne un résumé exploitable par les services IA,
        statistiques et export.
        """

        if project is None:
            raise ValueError(
                "Le projet est obligatoire."
            )

        return {
            "id": project.pk,
            "title": getattr(
                project,
                "title",
                "",
            ),
            "slug": getattr(
                project,
                "slug",
                "",
            ),
            "status": getattr(
                project,
                "status",
                None,
            ),
            "version": getattr(
                project,
                "version",
                None,
            ),
            "is_archived": getattr(
                project,
                "is_archived",
                False,
            ),
            "is_favorite": getattr(
                project,
                "is_favorite",
                False,
            ),
            "is_public": getattr(
                project,
                "is_public",
                False,
            ),
        }

    @classmethod
    def info(cls) -> Dict[str, Any]:
        """
        Informations sur le service.
        """

        return {
            "service": "ProjectService",
            "version": "2.0.0",
            "model": "ScientificProject",
            "operations": [
                "create_project",
                "get_project",
                "get_project_by_slug",
                "list_projects",
                "update_project",
                "delete_project",
                "archive_project",
                "restore_project",
                "favorite_project",
                "publish_project",
                "unpublish_project",
                "duplicate_project",
                "search",
                "project_summary",
            ],
            "scientific_project": True,
        }
