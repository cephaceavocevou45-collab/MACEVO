
"""
==========================================================
MACEVO IA
Statistics Service
==========================================================

Service central des statistiques scientifiques.

Cette classe constitue la façade métier pour les statistiques
des documents MACEVO.

Elle délègue les calculs spécialisés aux services :

- WordStatistics
- PageStatistics
- ReadabilityStatistics
- ChartStatistics

Auteur : MACEVO
"""

from __future__ import annotations

from typing import Any, Dict, Optional


class StatisticsService:
    """
    Façade centrale des statistiques MACEVO.
    """

    # =========================================================
    # SERVICES INTERNES
    # =========================================================

    @staticmethod
    def _word_service():
        from projects.services.statistics.words import (
            WordStatistics,
        )

        return WordStatistics

    @staticmethod
    def _page_service():
        from projects.services.statistics.pages import (
            PageStatistics,
        )

        return PageStatistics

    @staticmethod
    def _readability_service():
        from projects.services.statistics.readability import (
            ReadabilityStatistics,
        )

        return ReadabilityStatistics

    @staticmethod
    def _chart_service():
        from projects.services.statistics.charts import (
            ChartStatistics,
        )

        return ChartStatistics

    # =========================================================
    # MOTS
    # =========================================================

    @staticmethod
    def word_count(
        text: str,
    ) -> int:
        """
        Retourne le nombre de mots.
        """

        return StatisticsService._word_service().count_words(
            text
        )

    @staticmethod
    def character_count(
        text: str,
    ) -> int:
        """
        Retourne le nombre de caractères, espaces compris.
        """

        return StatisticsService._word_service().count_characters(
            text
        )

    @staticmethod
    def character_count_without_spaces(
        text: str,
    ) -> int:
        """
        Retourne le nombre de caractères sans espaces.
        """

        return (
            StatisticsService
            ._word_service()
            .count_characters_without_spaces(text)
        )

    @staticmethod
    def sentence_count(
        text: str,
    ) -> int:
        """
        Retourne le nombre de phrases.
        """

        return StatisticsService._word_service().count_sentences(
            text
        )

    @staticmethod
    def paragraph_count(
        text: str,
    ) -> int:
        """
        Retourne le nombre de paragraphes.
        """

        return StatisticsService._word_service().count_paragraphs(
            text
        )

    # =========================================================
    # STATISTIQUES COMPLÈTES DU TEXTE
    # =========================================================

    @staticmethod
    def word_statistics(
        text: str,
    ) -> Dict[str, Any]:
        """
        Retourne l'ensemble des statistiques lexicales.
        """

        return StatisticsService._word_service().statistics(
            text
        )

    @staticmethod
    def statistics(
        text: str,
        words_per_page: int = 500,
    ) -> Dict[str, Any]:
        """
        Retourne un rapport statistique complet.

        Inclut :
        - mots ;
        - caractères ;
        - phrases ;
        - paragraphes ;
        - pages estimées ;
        - lisibilité ;
        - temps de lecture.
        """

        word_stats = (
            StatisticsService
            ._word_service()
            .statistics(text)
        )

        page_stats = (
            StatisticsService
            ._page_service()
            .estimate_all(
                word_stats.get(
                    "words",
                    word_stats.get(
                        "word_count",
                        0,
                    ),
                )
            )
        )

        readability = (
            StatisticsService
            ._readability_service()
            .analyze(text)
        )

        return {
            "words": word_stats,
            "pages": page_stats,
            "readability": readability,
        }

    # =========================================================
    # PAGES
    # =========================================================

    @staticmethod
    def page_estimation(
        words: int,
        words_per_page: int = 500,
    ) -> int:
        """
        Estime le nombre de pages.

        Une page partiellement remplie compte comme une page.
        """

        return StatisticsService._page_service().estimate(
            words,
            words_per_page=words_per_page,
        )

    @staticmethod
    def page_statistics(
        words: int,
        words_per_page: int = 500,
    ) -> Dict[str, Any]:
        """
        Retourne les statistiques de pagination.
        """

        return StatisticsService._page_service().estimate_all(
            words,
            words_per_page=words_per_page,
        )

    @staticmethod
    def page_statistics_for_format(
        words: int,
        page_format: str = "A4",
        words_per_page: int = 500,
    ) -> Dict[str, Any]:
        """
        Estime les pages selon un format documentaire.
        """

        return (
            StatisticsService
            ._page_service()
            .estimate_for_format(
                words,
                page_format=page_format,
                words_per_page=words_per_page,
            )
        )

    # =========================================================
    # LECTURE / LISIBILITÉ
    # =========================================================

    @staticmethod
    def readability(
        text: str,
    ) -> Dict[str, Any]:
        """
        Analyse la lisibilité du texte.
        """

        return (
            StatisticsService
            ._readability_service()
            .analyze(text)
        )

    @staticmethod
    def readability_score(
        text: str,
    ) -> float:
        """
        Retourne le score de lisibilité.
        """

        return (
            StatisticsService
            ._readability_service()
            .readability_score(text)
        )

    @staticmethod
    def complexity(
        text: str,
    ) -> Dict[str, Any]:
        """
        Retourne l'analyse de complexité.
        """

        return (
            StatisticsService
            ._readability_service()
            .complexity(text)
        )

    # =========================================================
    # TEMPS DE LECTURE
    # =========================================================

    @staticmethod
    def reading_time(
        text: str,
        words_per_minute: int = 200,
    ) -> int:
        """
        Estime le temps de lecture en minutes.
        """

        words = StatisticsService.word_count(
            text
        )

        if words <= 0:
            return 0

        if words_per_minute <= 0:
            words_per_minute = 200

        # Import volontairement local afin de garder la logique
        # de pagination/statistiques centralisée.
        page_service = StatisticsService._page_service()

        if hasattr(
            page_service,
            "reading_time",
        ):
            return page_service.reading_time(
                words,
                words_per_minute=words_per_minute,
            )

        # Fallback compatible avec d'anciennes versions.
        from math import ceil

        return ceil(
            words / words_per_minute
        )

    # =========================================================
    # DOCUMENT
    # =========================================================

    @staticmethod
    def document_statistics(
        document: Any,
    ) -> Dict[str, Any]:
        """
        Calcule les statistiques d'un document.

        Le document peut être :
        - une chaîne ;
        - un objet possédant un champ content ;
        - un objet possédant un champ text ;
        - un dictionnaire.
        """

        text = StatisticsService._extract_text(
            document
        )

        return StatisticsService.statistics(
            text
        )

    @staticmethod
    def _extract_text(
        document: Any,
    ) -> str:
        """
        Extrait du texte depuis différentes représentations.
        """

        if document is None:
            return ""

        if isinstance(
            document,
            str,
        ):
            return document

        if isinstance(
            document,
            dict,
        ):
            for key in (
                "content",
                "text",
                "plain_text",
                "body",
            ):
                value = document.get(key)

                if isinstance(
                    value,
                    str,
                ):
                    return value

            return ""

        for attribute in (
            "content",
            "text",
            "plain_text",
            "body",
        ):
            value = getattr(
                document,
                attribute,
                None,
            )

            if isinstance(
                value,
                str,
            ):
                return value

        return ""

    # =========================================================
    # COMPARAISON
    # =========================================================

    @staticmethod
    def compare_documents(
        documents: Any,
    ):
        """
        Compare plusieurs documents.

        Délègue la comparaison au service spécialisé.
        """

        return (
            StatisticsService
            ._chart_service()
            .compare_documents(documents)
        )

    @staticmethod
    def evolution(
        documents: Any,
    ):
        """
        Retourne l'évolution des statistiques
        sur plusieurs documents/versions.
        """

        return (
            StatisticsService
            ._chart_service()
            .evolution(documents)
        )

    # =========================================================
    # DONNÉES POUR GRAPHIQUES
    # =========================================================

    @staticmethod
    def chart_data(
        document: Any,
    ):
        """
        Prépare les données statistiques destinées
        aux graphiques du frontend.
        """

        return (
            StatisticsService
            ._chart_service()
            .document_chart_data(document)
        )

    # =========================================================
    # VALIDATION
    # =========================================================

    @staticmethod
    def validate(
        text: str,
    ) -> Dict[str, Any]:
        """
        Valide les statistiques d'un document.
        """

        word_validation = (
            StatisticsService
            ._word_service()
            .validate(text)
        )

        readability_validation = (
            StatisticsService
            ._readability_service()
            .validate(text)
        )

        return {
            "valid": (
                word_validation.get(
                    "valid",
                    True,
                )
                and readability_validation.get(
                    "valid",
                    True,
                )
            ),
            "words": word_validation,
            "readability": readability_validation,
        }

    # =========================================================
    # INFORMATIONS
    # =========================================================

    @classmethod
    def info(cls) -> Dict[str, Any]:
        """
        Informations sur le service.
        """

        return {
            "service": "StatisticsService",
            "version": "2.0.0",
            "description": (
                "Façade centrale des statistiques "
                "scientifiques MACEVO."
            ),
            "capabilities": [
                "word_count",
                "character_count",
                "sentence_count",
                "paragraph_count",
                "word_statistics",
                "page_estimation",
                "page_statistics",
                "readability",
                "reading_time",
                "document_statistics",
                "compare_documents",
                "evolution",
                "chart_data",
                "validation",
            ],
        }
