from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse(
        {
            "service": "MACEVO Django API",
            "status": "ok",
        }
    )


urlpatterns = [
    path("", health_check, name="health"),
    path("api/health/", health_check, name="api-health"),

    # =====================================================
    # Administration
    # =====================================================

    path(
        "admin/",
        admin.site.urls,
    ),

    # =====================================================
    # Authentification
    # =====================================================

    path(
        "api/",
        include("users.urls"),
    ),

    # =====================================================
    # Paramètres utilisateur
    # =====================================================

    path(
        "api/settings/",
        include("user_settings.urls"),
    ),

    # =====================================================
    # Dashboard
    # =====================================================

    path(
        "api/dashboard/",
        include("dashboard.urls"),
    ),

    path(
        "api/projects/",
        include("projects.urls"),
    ),

    # =====================================================
    # Rapports
    # =====================================================

    path(
        "api/reports/",
        include("reports.urls"),
    ),

    # =====================================================
    # Assistant IA
    # =====================================================

    path(
        "api/assistant/",
        include("assistant.urls"),
    ),

    # =====================================================
    # Profils
    # =====================================================

    path(
        "api/profile/",
        include("profiles.urls"),
    ),

    # =====================================================
    # LaTeX
    # =====================================================

    path(
        "api/latex/",
        include("latex.urls"),
    ),

    # =====================================================
    # Word → LaTeX
    # =====================================================

    path(
        "api/word-to-latex/",
        include("word_to_latex.urls"),
    ),

    # =====================================================
    # Éditeur
    # =====================================================

    path(
        "api/editeur/",
        include("editeur.urls"),
    ),

    # =====================================================
    # Statistiques
    # =====================================================

    path(
        "api/statistiques/",
        include("statistiques.urls"),
    ),

    # =====================================================
    # Supports
    # =====================================================

    path(
        "api/supports/",
        include("supports.urls"),
    ),

    # =====================================================
    # Stockage
    # =====================================================

    path(
        "api/stockage/",
        include("stockage.urls"),
    ),

    # =====================================================
    # Dépôt scientifique
    # =====================================================

    path(
        "api/depot/",
        include("depot_scientifique.urls"),
    ),

]


# =========================================================
# Fichiers média en développement
# =========================================================

if settings.DEBUG:

    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )