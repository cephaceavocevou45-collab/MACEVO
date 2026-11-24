from django.urls import path

from .views import (
    ReportListCreateView,
    ReportDetailView,
)


urlpatterns = [
    # ============================================================
    # LISTE + CRÉATION
    # ============================================================

    path(
        "",
        ReportListCreateView.as_view(),
        name="report-list-create",
    ),

    # ============================================================
    # DÉTAIL + MODIFICATION + SUPPRESSION
    # ============================================================

    path(
        "<int:pk>/",
        ReportDetailView.as_view(),
        name="report-detail",
    ),
]