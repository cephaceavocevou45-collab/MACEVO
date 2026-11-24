"""
==========================================================
MACEVO IA
Projects Services Package
==========================================================

Contient toute la logique métier du module Projects.
"""

__all__ = [
    "ProjectService",
    "AIService",
    "ExportService",
    "ImportService",
    "LatexService",
    "StatisticsService",
    "BibliographyService",
]


def __getattr__(name):
    """Charge les services uniquement lorsqu'ils sont utilisés.

    Les services d'import/export dépendent de bibliothèques natives
    optionnelles; leur import anticipé ne doit pas empêcher le démarrage
    de l'API principale ou des routes sans rapport avec ces formats.
    """
    modules = {
        "ProjectService": ".project_service",
        "AIService": ".ai_service",
        "ExportService": ".export_service",
        "ImportService": ".import_service",
        "LatexService": ".latex_service",
        "StatisticsService": ".statistics_service",
        "BibliographyService": ".bibliography_service",
    }
    if name not in modules:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

    from importlib import import_module

    value = getattr(import_module(modules[name], __name__), name)
    globals()[name] = value
    return value
