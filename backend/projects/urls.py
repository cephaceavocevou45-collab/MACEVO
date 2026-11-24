
"""
==========================================================
MACEVO IA
Projects URLs
==========================================================
"""

from django.urls import path

from .views import (
    ProjectCreateView,
    ProjectListView,
    ProjectDetailView,
    ProjectUpdateView,
    ProjectDeleteView,
    ProjectSearchView,
    ProjectExportView,
    ProjectStatisticsView,
)
from .views.memory import (
    ProjectMemoryDetailView,
    ProjectMemoryListCreateView,
)
from .views.generation import ProjectPlanGenerationView
from .views.plan_validation import ProjectPlanValidationView
from .views.documents import ProjectDocumentDetailView, ProjectDocumentListCreateView


app_name = "projects"


urlpatterns = [

    # ======================================================
    # Liste
    # ======================================================

    path(
        "",
        ProjectListView.as_view(),
        name="project-list",
    ),

    # ======================================================
    # Création
    # ======================================================

    path(
        "create/",
        ProjectCreateView.as_view(),
        name="project-create",
    ),

    path(
        "<int:project_id>/generate/plan/",
        ProjectPlanGenerationView.as_view(),
        name="project-generate-plan",
    ),
    path(
        "<int:project_id>/validate/plan/",
        ProjectPlanValidationView.as_view(),
        name="project-validate-plan",
    ),

    path(
        "<int:project_id>/memory/",
        ProjectMemoryListCreateView.as_view(),
        name="project-memory-list-create",
    ),

    path(
        "<int:project_id>/memory/<int:memory_id>/",
        ProjectMemoryDetailView.as_view(),
        name="project-memory-detail",
    ),

    path(
        "<int:project_id>/documents/",
        ProjectDocumentListCreateView.as_view(),
        name="project-document-list-create",
    ),
    path(
        "<int:project_id>/documents/<int:document_id>/download/",
        ProjectDocumentDetailView.as_view(),
        name="project-document-download",
    ),
    path(
        "<int:project_id>/documents/<int:document_id>/",
        ProjectDocumentDetailView.as_view(),
        name="project-document-detail",
    ),

    # ======================================================
    # Recherche
    #
    # Les routes statiques sont placées avant les routes
    # dynamiques afin d'éviter toute ambiguïté.
    # ======================================================

    path(
        "search/",
        ProjectSearchView.as_view(),
        name="project-search",
    ),

    # ======================================================
    # Export
    # ======================================================

    path(
        "<int:project_id>/export/",
        ProjectExportView.as_view(),
        name="project-export",
    ),

    # ======================================================
    # Statistiques
    # ======================================================

    path(
        "<int:project_id>/statistics/",
        ProjectStatisticsView.as_view(),
        name="project-statistics",
    ),

    # ======================================================
    # Détail
    # ======================================================

    path(
        "<int:id>/",
        ProjectDetailView.as_view(),
        name="project-detail",
    ),

    # ======================================================
    # Modification
    # ======================================================

    path(
        "<int:id>/update/",
        ProjectUpdateView.as_view(),
        name="project-update",
    ),

    # ======================================================
    # Suppression
    # ======================================================

    path(
        "<int:id>/delete/",
        ProjectDeleteView.as_view(),
        name="project-delete",
    ),
]
