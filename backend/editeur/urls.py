from django.urls import path

from .views import (
    EditorAssetDetailView,
    EditorAssetListCreateView,
    EditorBootstrapView,
    EditorExportView,
    EditorStatisticsView,
    EditorStructureView,
    EditorValidationView,
)


urlpatterns = [
    path(
        "assets/",
        EditorAssetListCreateView.as_view(),
        name="editor-assets",
    ),

    path(
        "assets/<int:pk>/",
        EditorAssetDetailView.as_view(),
        name="editor-asset-detail",
    ),

    path(
        "<int:pk>/",
        EditorBootstrapView.as_view(),
        name="editor-bootstrap",
    ),

    path(
        "<int:pk>/structure/",
        EditorStructureView.as_view(),
        name="editor-structure",
    ),

    path(
        "<int:pk>/validation/",
        EditorValidationView.as_view(),
        name="editor-validation",
    ),

    path(
        "<int:pk>/statistics/",
        EditorStatisticsView.as_view(),
        name="editor-statistics",
    ),

    path(
        "<int:pk>/export/<str:format_name>/",
        EditorExportView.as_view(),
        name="editor-export",
    ),
]