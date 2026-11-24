"""
==========================================================
MACEVO IA
Word Statistics
==========================================================

Analyse statistique des mots et du texte.

Ce module fournit les métriques fondamentales utilisées par :
- les tableaux de bord ;
- les graphiques ;
- l'analyse de lisibilité ;
- les statistiques de documents ;
- le frontend de l'éditeur ;
- les futurs moteurs d'analyse scientifique.

Les méthodes historiques sont conservées pour assurer
la compatibilité avec le reste du projet.

==========================================================
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional


class WordStatistics:
    """
    Service central d'analyse statistique du texte.
    """

    # Expression permettant de reconnaître les mots, y compris
    # les caractères accentués et les formes avec apostrophe/tiret.
    WORD_PATTERN = re.compile(
        r"\b[\wÀ-ÿ]+(?:['’\-][\wÀ-ÿ]+)*\b",
        flags=re.UNICODE,
    )

    SENTENCE_PATTERN = re.compile(
        r"[^.!?…]+(?:[.!?…]+|$)",
        flags=re.UNICODE,
    )

    # ======================================================
    # NORMALISATION
    # ======================================================

    @staticmethod
    def normalize_text(text: Optional[str]) -> str:
        """
        Normalise une entrée textuelle.

        Les espaces multiples sont réduits, sans modifier
        fondamentalement le contenu.
        """

        if text is None:
            return ""

        text = str(text)

        return re.sub(
            r"[ \t\r\f\v]+",
            " ",
            text,
        ).strip()

    # ======================================================
    # EXTRACTION DES MOTS
    # ======================================================

    @classmethod
    def extract_words(
        cls,
        text: Optional[str],
    ) -> List[str]:
        """
        Extrait les mots du texte.

        Cette méthode est plus fiable que ``str.split()`` pour
        les textes académiques contenant ponctuation, apostrophes,
        accents ou tirets.
        """

        if not text:
            return []

        return cls.WORD_PATTERN.findall(str(text))

    # ======================================================
    # NOMBRE DE MOTS
    # ======================================================

    @classmethod
    def count_words(
        cls,
        text: Optional[str],
    ) -> int:
        """
        Compte le nombre de mots.
        """

        return len(cls.extract_words(text))

    # ======================================================
    # CARACTÈRES
    # ======================================================

    @staticmethod
    def count_characters(
        text: Optional[str],
    ) -> int:
        """
        Compte tous les caractères, espaces compris.
        """

        if not text:
            return 0

        return len(str(text))

    # ======================================================
    # CARACTÈRES SANS ESPACES
    # ======================================================

    @staticmethod
    def count_characters_without_spaces(
        text: Optional[str],
    ) -> int:
        """
        Compte les caractères en ignorant tous les espaces
        blancs : espaces, tabulations et retours à la ligne.
        """

        if not text:
            return 0

        return len(
            re.sub(
                r"\s+",
                "",
                str(text),
            )
        )

    # ======================================================
    # NOMBRE DE PHRASES
    # ======================================================

    @classmethod
    def count_sentences(
        cls,
        text: Optional[str],
    ) -> int:
        """
        Estime le nombre de phrases.

        La détection prend en compte :
        - .
        - !
        - ?
        - …

        Les fragments vides sont ignorés.
        """

        if not text or not str(text).strip():
            return 0

        matches = cls.SENTENCE_PATTERN.findall(
            str(text).strip()
        )

        return len(
            [
                sentence
                for sentence in matches
                if sentence.strip()
                and cls.count_words(sentence) > 0
            ]
        )

    # ======================================================
    # NOMBRE DE PARAGRAPHES
    # ======================================================

    @classmethod
    def count_paragraphs(
        cls,
        text: Optional[str],
    ) -> int:
        """
        Compte les paragraphes.

        Deux retours à la ligne ou davantage sont considérés
        comme une séparation de paragraphes.

        Pour un texte non vide sans double saut de ligne,
        un paragraphe est compté.
        """

        if not text or not str(text).strip():
            return 0

        paragraphs = re.split(
            r"\n\s*\n+",
            str(text).strip(),
        )

        return len(
            [
                paragraph
                for paragraph in paragraphs
                if paragraph.strip()
            ]
        )

    # ======================================================
    # MOYENNE MOTS / PHRASE
    # ======================================================

    @classmethod
    def average_words_per_sentence(
        cls,
        text: Optional[str],
    ) -> float:
        """
        Calcule le nombre moyen de mots par phrase.
        """

        sentences = cls.count_sentences(text)

        if sentences == 0:
            return 0.0

        return round(
            cls.count_words(text) / sentences,
            2,
        )

    # ======================================================
    # MOYENNE MOTS / PARAGRAPHE
    # ======================================================

    @classmethod
    def average_words_per_paragraph(
        cls,
        text: Optional[str],
    ) -> float:
        """
        Calcule le nombre moyen de mots par paragraphe.
        """

        paragraphs = cls.count_paragraphs(text)

        if paragraphs == 0:
            return 0.0

        return round(
            cls.count_words(text) / paragraphs,
            2,
        )

    # ======================================================
    # STATISTIQUES COMPLÈTES
    # ======================================================

    @classmethod
    def statistics(
        cls,
        text: Optional[str],
    ) -> Dict[str, Any]:
        """
        Retourne l'ensemble des statistiques fondamentales.
        """

        text = str(text or "")

        words = cls.count_words(text)
        characters = cls.count_characters(text)
        characters_without_spaces = (
            cls.count_characters_without_spaces(text)
        )
        sentences = cls.count_sentences(text)
        paragraphs = cls.count_paragraphs(text)

        return {
            "words": words,
            "characters": characters,
            "characters_without_spaces": (
                characters_without_spaces
            ),
            "sentences": sentences,
            "paragraphs": paragraphs,
            "average_words_per_sentence": (
                cls.average_words_per_sentence(text)
            ),
            "average_words_per_paragraph": (
                cls.average_words_per_paragraph(text)
            ),
        }

    # ======================================================
    # STATISTIQUES FRANÇAIS / TYPOGRAPHIE
    # ======================================================

    @classmethod
    def count_long_words(
        cls,
        text: Optional[str],
        minimum_length: int = 7,
    ) -> int:
        """
        Compte les mots dont la longueur dépasse le seuil.
        """

        try:
            minimum_length = int(minimum_length)
        except (TypeError, ValueError):
            minimum_length = 7

        if minimum_length < 1:
            minimum_length = 1

        words = cls.extract_words(text)

        return sum(
            1
            for word in words
            if len(word) >= minimum_length
        )

    @classmethod
    def count_unique_words(
        cls,
        text: Optional[str],
    ) -> int:
        """
        Compte le nombre de mots distincts.

        La comparaison est insensible à la casse.
        """

        words = cls.extract_words(text)

        return len(
            {
                word.casefold()
                for word in words
            }
        )

    # ======================================================
    # DENSITÉ LEXICALE
    # ======================================================

    @classmethod
    def lexical_diversity(
        cls,
        text: Optional[str],
    ) -> float:
        """
        Calcule une mesure simple de diversité lexicale :

            mots uniques / mots totaux

        La valeur est comprise entre 0 et 1.
        """

        total = cls.count_words(text)

        if total == 0:
            return 0.0

        unique = cls.count_unique_words(text)

        return round(
            unique / total,
            4,
        )

    # ======================================================
    # VALIDATION
    # ======================================================

    @classmethod
    def validate_text(
        cls,
        text: Optional[str],
    ) -> bool:
        """
        Vérifie qu'un texte contient au moins un mot.
        """

        return cls.count_words(text) > 0

    # ======================================================
    # INFORMATIONS
    # ======================================================

    @classmethod
    def info(cls) -> Dict[str, Any]:
        """
        Retourne les informations du service.
        """

        return {
            "name": "WordStatistics",
            "description": (
                "Service central d'analyse statistique "
                "des textes MACEVO."
            ),
            "metrics": [
                "words",
                "characters",
                "characters_without_spaces",
                "sentences",
                "paragraphs",
                "average_words_per_sentence",
                "average_words_per_paragraph",
                "long_words",
                "unique_words",
                "lexical_diversity",
            ],
            "methods": [
                "normalize_text",
                "extract_words",
                "count_words",
                "count_characters",
                "count_characters_without_spaces",
                "count_sentences",
                "count_paragraphs",
                "average_words_per_sentence",
                "average_words_per_paragraph",
                "statistics",
                "count_long_words",
                "count_unique_words",
                "lexical_diversity",
                "validate_text",
            ],
        }