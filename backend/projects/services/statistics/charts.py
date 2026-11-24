"""
==========================================================
MACEVO IA
Chart Statistics
==========================================================

Service de statistiques destiné à alimenter :
- graphiques ;
- tableaux de bord ;
- statistiques de documents ;
- analyses de rapports ;
- visualisations frontend ;
- futures analyses scientifiques.

Ce module ne génère pas les graphiques.
Il prépare uniquement les données nécessaires.

==========================================================
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from .words import WordStatistics
from .pages import PageStatistics


class ChartStatistics:
    """
    Générateur de données statistiques destinées aux graphiques.

    Le résultat est volontairement sérialisable en JSON afin de pouvoir
    être directement transmis au frontend ou à une API.
    """

    # ======================================================
    # STATISTIQUES PRINCIPALES
    # ======================================================

    @staticmethod
    def document_statistics(
        text: Optional[str] = None,
        content: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Calcule les statistiques générales d'un document.

        ``text`` reste le premier argument pour conserver la compatibilité
        avec l'ancienne API.

        ``content`` peut être utilisé comme alias.

        Exemple :
            ChartStatistics.document_statistics(text)
        """

        if text is None:
            text = content

        if text is None:
            text = ""

        text = str(text)

        words = WordStatistics.count_words(text)
        characters = WordStatistics.count_characters(text)
        sentences = WordStatistics.count_sentences(text)
        paragraphs = WordStatistics.count_paragraphs(text)
        pages = PageStatistics.estimate(words)
        reading_time = PageStatistics.estimate_reading_time(words)

        return {
            "words": words,
            "characters": characters,
            "sentences": sentences,
            "paragraphs": paragraphs,
            "pages": pages,
            "reading_time": reading_time,
        }

    # ======================================================
    # DONNÉES POUR GRAPHIQUE
    # ======================================================

    @classmethod
    def document_chart_data(
        cls,
        text: Optional[str] = None,
        content: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retourne les données directement exploitables par un graphique.

        Exemple de structure :

        {
            "labels": [...],
            "values": [...],
            "metrics": {...}
        }
        """

        statistics = cls.document_statistics(
            text=text,
            content=content,
        )

        labels = [
            "Mots",
            "Caractères",
            "Phrases",
            "Paragraphes",
            "Pages",
            "Temps de lecture",
        ]

        values = [
            statistics["words"],
            statistics["characters"],
            statistics["sentences"],
            statistics["paragraphs"],
            statistics["pages"],
            statistics["reading_time"],
        ]

        return {
            "labels": labels,
            "values": values,
            "metrics": statistics,
        }

    # ======================================================
    # COMPARAISON
    # ======================================================

    @classmethod
    def compare_documents(
        cls,
        text_a: Optional[str],
        text_b: Optional[str],
        labels: Optional[tuple] = None,
    ) -> Dict[str, Any]:
        """
        Compare les statistiques de deux documents.

        Utile pour :
        - comparer deux versions d'un rapport ;
        - suivre l'évolution d'un document ;
        - afficher un graphique avant/après.
        """

        stats_a = cls.document_statistics(text_a)
        stats_b = cls.document_statistics(text_b)

        document_labels = labels or (
            "Document A",
            "Document B",
        )

        metrics = [
            "words",
            "characters",
            "sentences",
            "paragraphs",
            "pages",
            "reading_time",
        ]

        comparison = {}

        for metric in metrics:
            comparison[metric] = {
                document_labels[0]: stats_a[metric],
                document_labels[1]: stats_b[metric],
            }

        return {
            "labels": list(document_labels),
            "documents": {
                document_labels[0]: stats_a,
                document_labels[1]: stats_b,
            },
            "comparison": comparison,
        }

    # ======================================================
    # ÉVOLUTION
    # ======================================================

    @classmethod
    def evolution(
        cls,
        texts: list,
    ) -> Dict[str, Any]:
        """
        Calcule l'évolution des statistiques sur plusieurs versions
        ou plusieurs documents.

        ``texts`` doit contenir une liste de textes.

        Exemple :
            [
                version_1,
                version_2,
                version_3,
            ]
        """

        if texts is None:
            texts = []

        statistics = [
            cls.document_statistics(text)
            for text in texts
        ]

        metrics = [
            "words",
            "characters",
            "sentences",
            "paragraphs",
            "pages",
            "reading_time",
        ]

        series = {}

        for metric in metrics:
            series[metric] = [
                item[metric]
                for item in statistics
            ]

        return {
            "count": len(statistics),
            "versions": statistics,
            "series": series,
        }

    # ======================================================
    # RÉSUMÉ
    # ======================================================

    @classmethod
    def summary(
        cls,
        text: Optional[str] = None,
        content: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retourne un résumé statistique compact.
        """

        statistics = cls.document_statistics(
            text=text,
            content=content,
        )

        return {
            "words": statistics["words"],
            "pages": statistics["pages"],
            "paragraphs": statistics["paragraphs"],
            "sentences": statistics["sentences"],
            "reading_time": statistics["reading_time"],
        }

    # ======================================================
    # VALIDATION
    # ======================================================

    @staticmethod
    def validate_statistics(
        statistics: Optional[Dict[str, Any]],
    ) -> bool:
        """
        Vérifie qu'un dictionnaire contient les métriques principales.
        """

        if not isinstance(statistics, dict):
            return False

        required = {
            "words",
            "characters",
            "sentences",
            "paragraphs",
            "pages",
            "reading_time",
        }

        return required.issubset(statistics.keys())

    # ======================================================
    # INFORMATIONS
    # ======================================================

    @classmethod
    def info(cls) -> Dict[str, Any]:
        """
        Retourne les informations du service.
        """

        return {
            "name": "ChartStatistics",
            "description": (
                "Préparation de statistiques de documents "
                "pour graphiques et tableaux de bord."
            ),
            "metrics": [
                "words",
                "characters",
                "sentences",
                "paragraphs",
                "pages",
                "reading_time",
            ],
            "methods": [
                "document_statistics",
                "document_chart_data",
                "compare_documents",
                "evolution",
                "summary",
                "validate_statistics",
            ],
        }