"""
==========================================================
MACEVO IA
Readability Statistics
==========================================================

Analyse de lisibilité et de complexité textuelle.

Ce module fournit des indicateurs statistiques simples :
- longueur moyenne des phrases ;
- longueur moyenne des paragraphes ;
- niveau de lisibilité ;
- complexité textuelle ;
- densité de mots longs ;
- statistiques générales.

Les résultats sont destinés au frontend, aux tableaux de bord
et au moteur d'analyse scientifique de MACEVO.

Important :
Ces indicateurs sont heuristiques. Ils ne constituent pas,
à eux seuls, une évaluation linguistique ou scientifique
complète d'un document.

==========================================================
"""

from __future__ import annotations

import re
from typing import Any, Dict, Optional

from .words import WordStatistics


class ReadabilityStatistics:
    """
    Analyse statistique de la lisibilité d'un document.
    """

    # Seuils indicatifs pour la longueur moyenne des phrases.
    VERY_EASY_MAX = 15
    EASY_MAX = 20
    MEDIUM_MAX = 30
    DIFFICULT_MAX = 40

    # Un mot dépassant cette longueur est considéré comme long.
    LONG_WORD_LENGTH = 7

    # ======================================================
    # UTILITAIRES
    # ======================================================

    @staticmethod
    def _normalize_text(text: Optional[str]) -> str:
        """
        Normalise l'entrée afin d'éviter les erreurs sur None
        ou sur des objets non textuels.
        """
        if text is None:
            return ""

        return str(text).strip()

    @staticmethod
    def _words(text: str) -> list[str]:
        """
        Retourne une liste de mots approximative.
        """
        if not text:
            return []

        return re.findall(
            r"\b[\wÀ-ÿ'-]+\b",
            text,
            flags=re.UNICODE,
        )

    # ======================================================
    # SCORE PRINCIPAL
    # ======================================================

    @classmethod
    def readability_score(
        cls,
        text: Optional[str],
    ) -> str:
        """
        Détermine un niveau indicatif de lisibilité.

        Le calcul repose principalement sur la longueur moyenne
        des phrases, comme dans la version originale.

        Niveaux :
        - Très facile
        - Facile
        - Moyen
        - Difficile
        - Très difficile
        """

        text = cls._normalize_text(text)

        words = WordStatistics.count_words(text)
        sentences = WordStatistics.count_sentences(text)

        if words <= 0 or sentences <= 0:
            return "Non évalué"

        average = words / sentences

        if average <= cls.VERY_EASY_MAX:
            return "Très facile"

        if average <= cls.EASY_MAX:
            return "Facile"

        if average <= cls.MEDIUM_MAX:
            return "Moyen"

        if average <= cls.DIFFICULT_MAX:
            return "Difficile"

        return "Très difficile"

    # ======================================================
    # LONGUEUR MOYENNE DES PHRASES
    # ======================================================

    @classmethod
    def average_sentence_length(
        cls,
        text: Optional[str],
    ) -> float:
        """
        Retourne le nombre moyen de mots par phrase.
        """

        text = cls._normalize_text(text)

        words = WordStatistics.count_words(text)
        sentences = WordStatistics.count_sentences(text)

        if words <= 0 or sentences <= 0:
            return 0.0

        return round(words / sentences, 2)

    # ======================================================
    # LONGUEUR MOYENNE DES PARAGRAPHES
    # ======================================================

    @classmethod
    def average_paragraph_length(
        cls,
        text: Optional[str],
    ) -> float:
        """
        Retourne le nombre moyen de mots par paragraphe.
        """

        text = cls._normalize_text(text)

        words = WordStatistics.count_words(text)
        paragraphs = WordStatistics.count_paragraphs(text)

        if words <= 0 or paragraphs <= 0:
            return 0.0

        return round(words / paragraphs, 2)

    # ======================================================
    # MOTS LONGS
    # ======================================================

    @classmethod
    def long_word_statistics(
        cls,
        text: Optional[str],
    ) -> Dict[str, Any]:
        """
        Analyse la proportion de mots longs.
        """

        text = cls._normalize_text(text)

        words = cls._words(text)

        if not words:
            return {
                "total_words": 0,
                "long_words": 0,
                "percentage": 0.0,
            }

        long_words = [
            word
            for word in words
            if len(word) > cls.LONG_WORD_LENGTH
        ]

        percentage = (
            len(long_words) / len(words)
        ) * 100

        return {
            "total_words": len(words),
            "long_words": len(long_words),
            "percentage": round(percentage, 2),
        }

    # ======================================================
    # COMPLEXITÉ
    # ======================================================

    @classmethod
    def complexity(
        cls,
        text: Optional[str],
    ) -> Dict[str, Any]:
        """
        Retourne une analyse de complexité textuelle.

        Cette méthode conserve les clés principales de l'ancienne
        implémentation afin de rester compatible avec le code existant.
        """

        text = cls._normalize_text(text)

        words = WordStatistics.count_words(text)
        sentences = WordStatistics.count_sentences(text)
        paragraphs = WordStatistics.count_paragraphs(text)

        return {
            "niveau": cls.readability_score(text),
            "mots": words,
            "phrases": sentences,
            "paragraphes": paragraphs,
            "longueur_moyenne_phrase": cls.average_sentence_length(
                text
            ),
            "longueur_moyenne_paragraphe": cls.average_paragraph_length(
                text
            ),
            "mots_longs": cls.long_word_statistics(text),
        }

    # ======================================================
    # ANALYSE COMPLÈTE
    # ======================================================

    @classmethod
    def analyze(
        cls,
        text: Optional[str],
    ) -> Dict[str, Any]:
        """
        Retourne une analyse complète de lisibilité.
        """

        text = cls._normalize_text(text)

        complexity = cls.complexity(text)

        return {
            "score": complexity["niveau"],
            "metrics": {
                "words": complexity["mots"],
                "sentences": complexity["phrases"],
                "paragraphs": complexity["paragraphes"],
                "average_sentence_length": (
                    complexity["longueur_moyenne_phrase"]
                ),
                "average_paragraph_length": (
                    complexity["longueur_moyenne_paragraphe"]
                ),
                "long_words": complexity["mots_longs"],
            },
        }

    # ======================================================
    # CONSEILS
    # ======================================================

    @classmethod
    def recommendations(
        cls,
        text: Optional[str],
    ) -> list[str]:
        """
        Génère des recommandations simples à partir des indicateurs.
        """

        text = cls._normalize_text(text)

        recommendations = []

        average_sentence = cls.average_sentence_length(text)
        average_paragraph = cls.average_paragraph_length(text)
        long_words = cls.long_word_statistics(text)

        if average_sentence > cls.DIFFICULT_MAX:
            recommendations.append(
                "Certaines phrases sont très longues. "
                "Envisagez de les diviser pour améliorer la lisibilité."
            )
        elif average_sentence > cls.MEDIUM_MAX:
            recommendations.append(
                "La longueur moyenne des phrases est élevée. "
                "Une simplification peut améliorer la lecture."
            )

        if average_paragraph > 150:
            recommendations.append(
                "Les paragraphes sont relativement longs. "
                "Pensez à mieux segmenter les idées."
            )

        if long_words["percentage"] > 25:
            recommendations.append(
                "La proportion de mots longs est élevée. "
                "Vérifiez que le vocabulaire technique est nécessaire "
                "et suffisamment expliqué."
            )

        if not recommendations:
            recommendations.append(
                "La structure textuelle présente des indicateurs "
                "de lisibilité globalement équilibrés."
            )

        return recommendations

    # ======================================================
    # VALIDATION
    # ======================================================

    @classmethod
    def validate(
        cls,
        text: Optional[str],
    ) -> Dict[str, Any]:
        """
        Vérifie si une analyse de lisibilité peut être effectuée.
        """

        normalized = cls._normalize_text(text)

        if not normalized:
            return {
                "valid": False,
                "error": "Le texte est vide.",
            }

        words = WordStatistics.count_words(normalized)

        if words <= 0:
            return {
                "valid": False,
                "error": "Aucun mot détecté.",
            }

        return {
            "valid": True,
            "words": words,
            "sentences": WordStatistics.count_sentences(
                normalized
            ),
            "paragraphs": WordStatistics.count_paragraphs(
                normalized
            ),
        }

    # ======================================================
    # INFORMATIONS
    # ======================================================

    @classmethod
    def info(cls) -> Dict[str, Any]:
        """
        Retourne les informations du service.
        """

        return {
            "name": "ReadabilityStatistics",
            "description": (
                "Analyse heuristique de lisibilité et de "
                "complexité textuelle."
            ),
            "metrics": [
                "readability_score",
                "average_sentence_length",
                "average_paragraph_length",
                "long_word_statistics",
            ],
            "levels": [
                "Très facile",
                "Facile",
                "Moyen",
                "Difficile",
                "Très difficile",
            ],
            "methods": [
                "readability_score",
                "average_sentence_length",
                "average_paragraph_length",
                "long_word_statistics",
                "complexity",
                "analyze",
                "recommendations",
                "validate",
            ],
        }