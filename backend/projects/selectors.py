
"""
==========================================================
MACEVO IA
Project Selectors
==========================================================

Toutes les requêtes de lecture de la base de données
concernant les projets scientifiques sont centralisées ici.

Les vues et services ne doivent pas dupliquer les requêtes
Django lorsque celles-ci relèvent de la lecture.

Architecture :

    View
      ↓
    Selector
      ↓
    QuerySet
      ↓
    Model

Auteur : MACEVO
"""

from __future__ import annotations

from typing import Optional

from django.db.models import Q, QuerySet

from projects.models import ScientificProject


class ProjectSelector:
    """
    Centralise les opérations de lecture sur les projets
    scientifiques.
    """

    # ======================================================
    # PROJETS
    # ======================================================

    @staticmethod
    def get_all_projects() -> QuerySet:
        """
        Retourne tous les projets.

        Cette méthode est destinée principalement aux usages
        administratifs ou internes. Les vues utilisateur doivent
        préférer get_user_projects().
        """

        return (
            ScientificProject.objects
            .select_related("author")
            .all()
        )

    @staticmethod
    def get_user_projects(user) -> QuerySet:
        """
        Retourne les projets appartenant à l'utilisateur.
        """

        if user is None:
            return ScientificProject.objects.none()

        return (
            ScientificProject.objects
            .select_related("author")
            .filter(author_id=user.id)
        )

    @staticmethod
    def get_project_by_id(
        project_id,
        user=None,
    ) -> Optional[ScientificProject]:
        """
        Recherche un projet par son identifiant.

        Si un utilisateur est fourni, seuls ses projets
        sont accessibles.
        """

        queryset = ScientificProject.objects.select_related(
            "author",
        )

        if user is not None:
            queryset = queryset.filter(
                author_id=user.id,
            )

        return queryset.filter(
            pk=project_id,
        ).first()

    @staticmethod
    def get_by_slug(
        slug,
        user=None,
    ) -> Optional[ScientificProject]:
        """
        Recherche un projet par son slug.

        Si un utilisateur est fourni, la recherche est limitée
        à ses projets.
        """

        if not slug:
            return None

        queryset = ScientificProject.objects.select_related(
            "author",
        )

        if user is not None:
            queryset = queryset.filter(
                author_id=user.id,
            )

        return queryset.filter(
            slug=slug,
        ).first()

    # ======================================================
    # RECHERCHE
    # ======================================================

    @staticmethod
    def search(
        query,
        user=None,
    ) -> QuerySet:
        """
        Recherche un projet sur plusieurs champs textuels.

        Champs recherchés :

        - titre
        - sujet
        - description
        - résumé
        - mots-clés

        Une recherche vide retourne un QuerySet vide afin
        d'éviter de charger accidentellement tous les projets.
        """

        query = (query or "").strip()

        if not query:
            return ScientificProject.objects.none()

        queryset = ScientificProject.objects.select_related(
            "author",
        )

        if user is not None:
            queryset = queryset.filter(
                author_id=user.id,
            )

        return (
            queryset
            .filter(
                Q(title__icontains=query)
                | Q(subject__icontains=query)
                | Q(description__icontains=query)
                | Q(abstract__icontains=query)
                | Q(keywords__icontains=query)
            )
            .distinct()
        )

    # ======================================================
    # FILTRES SCIENTIFIQUES
    # ======================================================

    @staticmethod
    def get_by_type(
        project_type,
        user=None,
    ) -> QuerySet:
        """
        Retourne les projets correspondant à un type.
        """

        queryset = ScientificProject.objects.select_related(
            "author",
        ).filter(
            project_type=project_type,
        )

        if user is not None:
            queryset = queryset.filter(
                author_id=user.id,
            )

        return queryset

    @staticmethod
    def get_by_level(
        level,
        user=None,
    ) -> QuerySet:
        """
        Retourne les projets correspondant à un niveau
        académique.
        """

        queryset = ScientificProject.objects.select_related(
            "author",
        ).filter(
            level=level,
        )

        if user is not None:
            queryset = queryset.filter(
                author_id=user.id,
            )

        return queryset

    @staticmethod
    def get_by_status(
        status,
        user=None,
    ) -> QuerySet:
        """
        Retourne les projets correspondant à un statut.
        """

        queryset = ScientificProject.objects.select_related(
            "author",
        ).filter(
            status=status,
        )

        if user is not None:
            queryset = queryset.filter(
                author_id=user.id,
            )

        return queryset

    @staticmethod
    def get_by_language(
        language,
        user=None,
    ) -> QuerySet:
        """
        Retourne les projets correspondant à une langue.
        """

        queryset = ScientificProject.objects.select_related(
            "author",
        ).filter(
            language=language,
        )

        if user is not None:
            queryset = queryset.filter(
                author_id=user.id,
            )

        return queryset

    # ======================================================
    # PROJETS RÉCENTS
    # ======================================================

    @staticmethod
    def get_recent_projects(
        user=None,
        limit=10,
    ) -> QuerySet:
        """
        Retourne les projets les plus récemment créés.
        """

        try:
            limit = int(limit)
        except (TypeError, ValueError):
            limit = 10

        if limit <= 0:
            return ScientificProject.objects.none()

        limit = min(limit, 100)

        queryset = (
            ScientificProject.objects
            .select_related("author")
            .order_by("-created_at")
        )

        if user is not None:
            queryset = queryset.filter(
                author_id=user.id,
            )

        return queryset[:limit]

    # ======================================================
    # PROJETS RÉCEMMENT MODIFIÉS
    # ======================================================

    @staticmethod
    def get_recently_updated(
        user=None,
        limit=10,
    ) -> QuerySet:
        """
        Retourne les projets les plus récemment modifiés.
        """

        try:
            limit = int(limit)
        except (TypeError, ValueError):
            limit = 10

        if limit <= 0:
            return ScientificProject.objects.none()

        limit = min(limit, 100)

        queryset = (
            ScientificProject.objects
            .select_related("author")
            .order_by("-updated_at")
        )

        if user is not None:
            queryset = queryset.filter(
                author_id=user.id,
            )

        return queryset[:limit]

    # ======================================================
    # PROJETS FAVORIS
    # ======================================================

    @staticmethod
    def get_favorite_projects(
        user,
    ) -> QuerySet:
        """
        Retourne les projets favoris d'un utilisateur.
        """

        if user is None:
            return ScientificProject.objects.none()

        return (
            ScientificProject.objects
            .select_related("author")
            .filter(
                author_id=user.id,
                is_favorite=True,
            )
            .order_by("-updated_at")
        )

    # ======================================================
    # PROJETS PUBLICS
    # ======================================================

    @staticmethod
    def get_public_projects() -> QuerySet:
        """
        Retourne les projets publiquement accessibles.

        Les projets archivés ne sont pas considérés comme
        publiquement accessibles.
        """

        return (
            ScientificProject.objects
            .select_related("author")
            .filter(
                is_public=True,
                is_archived=False,
            )
            .order_by("-updated_at")
        )

    # ======================================================
    # PROJETS ARCHIVÉS
    # ======================================================

    @staticmethod
    def get_archived_projects(
        user,
    ) -> QuerySet:
        """
        Retourne les projets archivés d'un utilisateur.
        """

        if user is None:
            return ScientificProject.objects.none()

        return (
            ScientificProject.objects
            .select_related("author")
            .filter(
                author_id=user.id,
                is_archived=True,
            )
            .order_by("-updated_at")
        )

    # ======================================================
    # COMPTAGE
    # ======================================================

    @staticmethod
    def count_projects(user=None) -> int:
        """
        Retourne le nombre de projets.
        """

        queryset = ScientificProject.objects.all()

        if user is not None:
            queryset = queryset.filter(
                author_id=user.id,
            )

        return queryset.count()

    @staticmethod
    def count_public_projects() -> int:
        """
        Retourne le nombre de projets publics actifs.
        """

        return ScientificProject.objects.filter(
            is_public=True,
            is_archived=False,
        ).count()

    # ======================================================
    # STATISTIQUES RAPIDES
    # ======================================================

    @staticmethod
    def get_project_counts(user) -> dict:
        """
        Retourne les principaux compteurs d'un utilisateur.

        Les statistiques détaillées restent du ressort des
        services statistiques.
        """

        if user is None:
            return {
                "total": 0,
                "active": 0,
                "archived": 0,
                "favorites": 0,
                "published": 0,
            }

        queryset = ScientificProject.objects.filter(
            author_id=user.id,
        )

        return {
            "total": queryset.count(),
            "active": queryset.filter(
                is_archived=False,
            ).count(),
            "archived": queryset.filter(
                is_archived=True,
            ).count(),
            "favorites": queryset.filter(
                is_favorite=True,
            ).count(),
            "published": queryset.filter(
                status=ScientificProject.PUBLISHED,
            ).count(),
        }
