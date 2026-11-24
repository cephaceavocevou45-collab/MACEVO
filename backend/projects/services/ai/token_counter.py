
"""
==========================================================
MACEVO IA
Token Counter
==========================================================

Estimation et contrôle du nombre de tokens.

Objectifs :
    - estimer le volume de tokens sans dépendre d'un provider ;
    - contrôler la taille du contexte ;
    - fournir des informations utiles à l'orchestrateur IA ;
    - rester compatible avec Ollama et les futurs providers
      OpenAI, Gemini et Anthropic.

IMPORTANT
---------
Il s'agit d'une estimation.

Le nombre exact de tokens dépend du tokenizer du modèle utilisé.
Un tokenizer spécifique pourra être ajouté ultérieurement
sans modifier l'architecture générale.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

from .exceptions import ContextOverflowError


class TokenCounter:
    """
    Gestionnaire central du comptage approximatif des tokens.
    """

    DEFAULT_MAX_TOKENS = 4096

    # Estimation moyenne.
    # Cette valeur reste volontairement conservatrice pour du texte
    # scientifique pouvant contenir des symboles, formules ou LaTeX.
    CHARS_PER_TOKEN = 4

    # Petit coût structurel approximatif par message.
    MESSAGE_OVERHEAD = 4

    # Limite de sécurité pour éviter des valeurs absurdes.
    MIN_LIMIT = 1

    @classmethod
    def estimate_tokens(cls, text: Any) -> int:
        """
        Estime le nombre de tokens d'un texte.

        Cette méthode ne remplace pas le tokenizer réel du modèle.
        Elle sert principalement à contrôler la taille du contexte
        avant d'appeler un provider.
        """

        if text is None:
            return 0

        if not isinstance(text, str):
            text = str(text)

        if not text:
            return 0

        # L'arrondi vers le haut est plus sûr que len(text) // 4 :
        # 1 caractère ne doit pas être considéré comme 0 token.
        return max(
            1,
            (len(text) + cls.CHARS_PER_TOKEN - 1)
            // cls.CHARS_PER_TOKEN,
        )

    @classmethod
    def count_message(cls, message: Dict[str, Any]) -> int:
        """
        Compte approximativement les tokens d'un message.

        Le contenu représente l'essentiel du coût.
        Un petit overhead est ajouté pour tenir compte de la
        structure role/content envoyée au modèle.
        """

        if not isinstance(message, dict):
            return 0

        content = message.get("content", "")

        if content is None:
            content = ""

        return (
            cls.estimate_tokens(content)
            + cls.MESSAGE_OVERHEAD
        )

    @classmethod
    def count_messages(
        cls,
        messages: Optional[Iterable[Dict[str, Any]]],
    ) -> int:
        """
        Compte approximativement les tokens d'une conversation.
        """

        if not messages:
            return 0

        total = 0

        for message in messages:
            total += cls.count_message(message)

        return total

    @classmethod
    def resolve_limit(
        cls,
        max_tokens: Optional[int] = None,
    ) -> int:
        """
        Détermine la limite effective.

        Contrairement à l'ancienne version, une valeur explicite
        de 0 n'est pas silencieusement remplacée par la valeur par
        défaut.
        """

        if max_tokens is None:
            return cls.DEFAULT_MAX_TOKENS

        try:
            limit = int(max_tokens)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "La limite de tokens doit être un entier."
            ) from exc

        if limit < cls.MIN_LIMIT:
            raise ValueError(
                "La limite de tokens doit être supérieure à zéro."
            )

        return limit

    @classmethod
    def check_limit(
        cls,
        messages: Optional[Iterable[Dict[str, Any]]],
        max_tokens: Optional[int] = None,
    ) -> int:
        """
        Vérifie que le contexte ne dépasse pas la limite.

        Retourne le nombre de tokens estimé si la limite est respectée.

        Lève :
            ContextOverflowError
                si le contexte dépasse la limite.
        """

        limit = cls.resolve_limit(max_tokens)
        total = cls.count_messages(messages)

        if total > limit:
            raise ContextOverflowError(
                (
                    f"Contexte trop volumineux "
                    f"({total}/{limit} tokens estimés)."
                )
            )

        return total

    @classmethod
    def remaining_tokens(
        cls,
        messages: Optional[Iterable[Dict[str, Any]]],
        max_tokens: Optional[int] = None,
    ) -> int:
        """
        Retourne le nombre de tokens estimés encore disponibles.
        """

        limit = cls.resolve_limit(max_tokens)
        used = cls.count_messages(messages)

        return max(
            0,
            limit - used,
        )

    @classmethod
    def usage(
        cls,
        messages: Optional[Iterable[Dict[str, Any]]],
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Retourne un résumé de l'utilisation du contexte.

        Utile pour :
            - l'interface de l'éditeur ;
            - le monitoring ;
            - l'orchestrateur IA ;
            - les futurs systèmes de sélection de contexte.
        """

        limit = cls.resolve_limit(max_tokens)
        used = cls.count_messages(messages)
        remaining = max(0, limit - used)

        percentage = (
            (used / limit) * 100
            if limit > 0
            else 100
        )

        return {
            "used": used,
            "limit": limit,
            "remaining": remaining,
            "percentage": round(
                min(percentage, 100),
                2,
            ),
            "overflow": used > limit,
        }

    @classmethod
    def fits(
        cls,
        messages: Optional[Iterable[Dict[str, Any]]],
        max_tokens: Optional[int] = None,
    ) -> bool:
        """
        Retourne True si le contexte respecte la limite.
        """

        limit = cls.resolve_limit(max_tokens)
        return cls.count_messages(messages) <= limit

    @classmethod
    def estimate_available_text(
        cls,
        messages: Optional[Iterable[Dict[str, Any]]],
        max_tokens: Optional[int] = None,
    ) -> int:
        """
        Estime approximativement le nombre de caractères pouvant
        encore être ajoutés au contexte.

        Cette valeur est indicative et ne doit pas être considérée
        comme une capacité exacte du modèle.
        """

        remaining = cls.remaining_tokens(
            messages,
            max_tokens,
        )

        return remaining * cls.CHARS_PER_TOKEN

    @classmethod
    def estimate_text_tokens(cls, text: str) -> int:
        """
        Alias explicite pour les appels nécessitant de distinguer
        le texte d'un message complet.
        """

        return cls.estimate_tokens(text)

    @classmethod
    def info(cls) -> Dict[str, Any]:
        """
        Retourne les paramètres du compteur.
        """

        return {
            "default_max_tokens": cls.DEFAULT_MAX_TOKENS,
            "chars_per_token": cls.CHARS_PER_TOKEN,
            "message_overhead": cls.MESSAGE_OVERHEAD,
            "minimum_limit": cls.MIN_LIMIT,
            "exact": False,
        }
