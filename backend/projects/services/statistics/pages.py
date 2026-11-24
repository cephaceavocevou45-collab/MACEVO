"""
==========================================================
MACEVO IA
Page Statistics
==========================================================

Estimation des pages et du temps de lecture.

Ce module fournit des estimations statistiques simples et
indépendantes du moteur de rendu réel.

Important :
- l'estimation de pages n'est PAS une pagination réelle ;
- la pagination exacte dépend du format, de la police,
  des marges, de l'interligne, des tableaux, figures, etc. ;
- la pagination réelle reste du ressort des moteurs
  d'export/rendu (Word, LaTeX, PDF).

==========================================================
"""

from __future__ import annotations

import math
from typing import Any, Dict, Optional


class PageStatistics:
    """
    Service d'estimation des pages d'un document.

    Les valeurs par défaut sont volontairement simples et
    adaptées aux statistiques générales de MACEVO.
    """

    # Nombre moyen de mots utilisé pour une estimation générale.
    WORDS_PER_PAGE = 500

    # Vitesse moyenne de lecture en mots/minute.
    WORDS_PER_MINUTE = 200

    # ======================================================
    # PAGES
    # ======================================================

    @classmethod
    def estimate(
        cls,
        word_count: Optional[int],
        words_per_page: Optional[int] = None,
    ) -> int:
        """
        Estime le nombre de pages à partir du nombre de mots.

        Exemple :
            1000 mots -> 2 pages

        Un document contenant au moins un mot retourne au minimum
        une page.

        Cette méthode ne remplace pas une pagination réelle.
        """

        try:
            words = int(word_count or 0)
        except (TypeError, ValueError):
            words = 0

        if words <= 0:
            return 0

        per_page = words_per_page or cls.WORDS_PER_PAGE

        try:
            per_page = int(per_page)
        except (TypeError, ValueError):
            per_page = cls.WORDS_PER_PAGE

        if per_page <= 0:
            per_page = cls.WORDS_PER_PAGE

        return max(
            1,
            math.ceil(words / per_page),
        )

    # ======================================================
    # TEMPS DE LECTURE
    # ======================================================

    @classmethod
    def estimate_reading_time(
        cls,
        word_count: Optional[int],
        words_per_minute: Optional[int] = None,
    ) -> int:
        """
        Estime le temps de lecture en minutes.

        Exemple :
            400 mots -> 2 minutes

        Un document contenant du texte retourne au minimum
        une minute.
        """

        try:
            words = int(word_count or 0)
        except (TypeError, ValueError):
            words = 0

        if words <= 0:
            return 0

        speed = words_per_minute or cls.WORDS_PER_MINUTE

        try:
            speed = int(speed)
        except (TypeError, ValueError):
            speed = cls.WORDS_PER_MINUTE

        if speed <= 0:
            speed = cls.WORDS_PER_MINUTE

        return max(
            1,
            math.ceil(words / speed),
        )

    # ======================================================
    # ESTIMATION COMPLÈTE
    # ======================================================

    @classmethod
    def estimate_all(
        cls,
        word_count: Optional[int],
        words_per_page: Optional[int] = None,
        words_per_minute: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Retourne toutes les estimations principales.
        """

        words = int(word_count or 0)

        return {
            "words": max(0, words),
            "pages": cls.estimate(
                words,
                words_per_page=words_per_page,
            ),
            "reading_time": cls.estimate_reading_time(
                words,
                words_per_minute=words_per_minute,
            ),
            "words_per_page": (
                words_per_page or cls.WORDS_PER_PAGE
            ),
            "words_per_minute": (
                words_per_minute or cls.WORDS_PER_MINUTE
            ),
        }

    # ======================================================
    # ESTIMATION AVEC PARAMÈTRES DE DOCUMENT
    # ======================================================

    @classmethod
    def estimate_for_format(
        cls,
        word_count: Optional[int],
        page_format: str = "A4",
        words_per_page: Optional[int] = None,
    ) -> int:
        """
        Estime le nombre de pages selon un format général.

        Cette méthode reste volontairement indicative.

        Formats reconnus :
        - A4
        - A5
        - Letter
        - Legal

        Si ``words_per_page`` est fourni, il est prioritaire.
        """

        if words_per_page is not None:
            return cls.estimate(
                word_count,
                words_per_page=words_per_page,
            )

        format_name = str(page_format or "A4").strip().lower()

        # Valeurs indicatives.
        format_words = {
            "a4": 500,
            "a5": 350,
            "letter": 500,
            "us-letter": 500,
            "legal": 600,
        }

        per_page = format_words.get(
            format_name,
            cls.WORDS_PER_PAGE,
        )

        return cls.estimate(
            word_count,
            words_per_page=per_page,
        )

    # ======================================================
    # VALIDATION
    # ======================================================

    @classmethod
    def validate_word_count(
        cls,
        word_count: Any,
    ) -> bool:
        """
        Vérifie qu'un nombre de mots est valide.
        """

        try:
            value = int(word_count)
        except (TypeError, ValueError):
            return False

        return value >= 0

    # ======================================================
    # INFORMATIONS
    # ======================================================

    @classmethod
    def info(cls) -> Dict[str, Any]:
        """
        Retourne les informations du service.
        """

        return {
            "name": "PageStatistics",
            "description": (
                "Service d'estimation du nombre de pages "
                "et du temps de lecture."
            ),
            "words_per_page": cls.WORDS_PER_PAGE,
            "words_per_minute": cls.WORDS_PER_MINUTE,
            "formats": [
                "A4",
                "A5",
                "Letter",
                "Legal",
            ],
            "methods": [
                "estimate",
                "estimate_reading_time",
                "estimate_all",
                "estimate_for_format",
                "validate_word_count",
            ],
            "warning": (
                "Les pages sont des estimations statistiques et "
                "ne correspondent pas nécessairement à la pagination "
                "réelle du document."
            ),
        }