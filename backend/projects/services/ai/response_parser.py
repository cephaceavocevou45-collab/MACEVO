
"""
==========================================================
MACEVO IA
Response Parser
==========================================================

Normalisation des réponses des modèles IA.

Objectif :
    Fournir une interface commune aux différents providers.

Le parser accepte notamment :

    - texte brut ;
    - réponse Ollama ;
    - réponses de type OpenAI ;
    - réponses de type Gemini ;
    - réponses de type Anthropic ;
    - réponses structurées contenant du texte ;
    - fragments de streaming.

IMPORTANT
---------
Le parser ne décide pas quel provider est utilisé.
Il normalise uniquement les réponses reçues.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, List

from .exceptions import ResponseParsingError


class ResponseParser:
    """
    Parse et normalise les réponses des différents
    fournisseurs IA.
    """

    # =====================================================
    # Parse principal
    # =====================================================

    @classmethod
    def parse(cls, response: Any) -> str:
        """
        Retourne le texte généré.

        Accepte :

            str
            dict
            listes/blocs contenant du texte

        Raises
        ------
        ResponseParsingError
            Lorsque le format est inconnu ou impossible
            à interpréter.
        """

        if response is None:
            raise ResponseParsingError(
                "La réponse du modèle est vide."
            )

        # -------------------------------------------------
        # Texte brut
        # -------------------------------------------------

        if isinstance(response, str):
            return response.strip()

        # -------------------------------------------------
        # Dictionnaire
        # -------------------------------------------------

        if isinstance(response, dict):
            content = cls._extract_from_dict(response)

            if content is not None:
                return content.strip()

        # -------------------------------------------------
        # Liste / blocs
        # -------------------------------------------------

        if isinstance(response, (list, tuple)):
            content = cls._extract_from_blocks(response)

            if content:
                return content.strip()

        raise ResponseParsingError(
            "Impossible d'extraire le contenu de la réponse IA."
        )

    # =====================================================
    # Extraction depuis dictionnaire
    # =====================================================

    @classmethod
    def _extract_from_dict(
        cls,
        response: Dict[str, Any],
    ) -> str | None:
        """
        Extrait le contenu texte d'une réponse structurée.
        """

        # -------------------------------------------------
        # Ollama
        # -------------------------------------------------

        message = response.get("message")

        if isinstance(message, dict):

            content = message.get("content")

            if isinstance(content, str):
                return content

            nested = cls._extract_content_value(content)

            if nested:
                return nested

        # -------------------------------------------------
        # Réponse OpenAI classique / compatible
        # -------------------------------------------------

        choices = response.get("choices")

        if isinstance(choices, list) and choices:

            for choice in choices:

                if not isinstance(choice, dict):
                    continue

                # OpenAI chat completions
                message = choice.get("message")

                if isinstance(message, dict):

                    content = cls._extract_content_value(
                        message.get("content")
                    )

                    if content:
                        return content

                # Certaines APIs utilisent directement text
                text = choice.get("text")

                if isinstance(text, str) and text.strip():
                    return text

                content = cls._extract_content_value(
                    choice.get("content")
                )

                if content:
                    return content

        # -------------------------------------------------
        # Anthropic
        # -------------------------------------------------

        content = response.get("content")

        if isinstance(content, list):

            extracted = cls._extract_from_blocks(content)

            if extracted:
                return extracted

        if isinstance(content, str):
            return content

        # -------------------------------------------------
        # Gemini / formats génériques
        # -------------------------------------------------

        candidates = response.get("candidates")

        if isinstance(candidates, list):

            for candidate in candidates:

                if not isinstance(candidate, dict):
                    continue

                candidate_content = candidate.get("content")

                if isinstance(candidate_content, dict):

                    parts = candidate_content.get("parts")

                    extracted = cls._extract_from_blocks(parts)

                    if extracted:
                        return extracted

                extracted = cls._extract_content_value(
                    candidate.get("text")
                )

                if extracted:
                    return extracted

        # -------------------------------------------------
        # Formats génériques
        # -------------------------------------------------

        for key in (
            "text",
            "output",
            "response",
            "generated_text",
        ):

            value = response.get(key)

            extracted = cls._extract_content_value(value)

            if extracted:
                return extracted

        return None

    # =====================================================
    # Extraction de contenu
    # =====================================================

    @classmethod
    def _extract_content_value(
        cls,
        value: Any,
    ) -> str:
        """
        Extrait récursivement du texte depuis différents
        formats de contenu.
        """

        if value is None:
            return ""

        if isinstance(value, str):
            return value.strip()

        if isinstance(value, dict):

            # Formats fréquents :
            # {"text": "..."}
            # {"content": "..."}
            # {"value": "..."}

            for key in (
                "text",
                "content",
                "value",
                "output_text",
            ):

                nested = value.get(key)

                if isinstance(nested, str) and nested.strip():
                    return nested.strip()

                if isinstance(nested, (dict, list, tuple)):

                    extracted = cls._extract_content_value(
                        nested
                    )

                    if extracted:
                        return extracted

            return ""

        if isinstance(value, (list, tuple)):
            return cls._extract_from_blocks(value)

        return ""

    # =====================================================
    # Extraction de blocs
    # =====================================================

    @classmethod
    def _extract_from_blocks(
        cls,
        blocks: Iterable[Any] | None,
    ) -> str:
        """
        Extrait et assemble les fragments textuels.
        """

        if not blocks:
            return ""

        parts: List[str] = []

        for block in blocks:

            if isinstance(block, str):

                if block.strip():
                    parts.append(block.strip())

                continue

            if not isinstance(block, dict):
                continue

            # ---------------------------------------------
            # Bloc texte classique
            # ---------------------------------------------

            text = block.get("text")

            if isinstance(text, str) and text.strip():
                parts.append(text.strip())
                continue

            # ---------------------------------------------
            # Bloc content
            # ---------------------------------------------

            content = block.get("content")

            if isinstance(content, str) and content.strip():
                parts.append(content.strip())
                continue

            # ---------------------------------------------
            # Bloc nested
            # ---------------------------------------------

            nested = cls._extract_content_value(block)

            if nested:
                parts.append(nested)

        return "\n".join(parts).strip()

    # =====================================================
    # Streaming
    # =====================================================

    @classmethod
    def parse_stream(
        cls,
        chunk: Any,
    ) -> str:
        """
        Retourne le texte d'un fragment de réponse
        en streaming.

        Contrairement à parse(), une absence de contenu
        dans un chunk n'est pas considérée comme une erreur.
        """

        if chunk is None:
            return ""

        if isinstance(chunk, str):
            return chunk

        if isinstance(chunk, dict):

            # Ollama
            message = chunk.get("message")

            if isinstance(message, dict):

                content = cls._extract_content_value(
                    message.get("content")
                )

                if content:
                    return content

            # OpenAI / compatible
            choices = chunk.get("choices")

            if isinstance(choices, list):

                for choice in choices:

                    if not isinstance(choice, dict):
                        continue

                    delta = choice.get("delta")

                    if isinstance(delta, dict):

                        content = cls._extract_content_value(
                            delta.get("content")
                        )

                        if content:
                            return content

                    content = cls._extract_content_value(
                        choice.get("text")
                    )

                    if content:
                        return content

            # Gemini
            candidates = chunk.get("candidates")

            if isinstance(candidates, list):

                for candidate in candidates:

                    if not isinstance(candidate, dict):
                        continue

                    content = candidate.get("content")

                    if isinstance(content, dict):

                        extracted = cls._extract_from_blocks(
                            content.get("parts")
                        )

                        if extracted:
                            return extracted

            # Format générique
            content = cls._extract_content_value(
                chunk.get("content")
            )

            if content:
                return content

            content = cls._extract_content_value(
                chunk.get("text")
            )

            if content:
                return content

        return ""

    # =====================================================
    # Détection réponse vide
    # =====================================================

    @classmethod
    def is_empty(
        cls,
        response: Any,
    ) -> bool:
        """
        Vérifie si une réponse contient du texte exploitable.
        """

        try:
            return cls.parse(response) == ""

        except ResponseParsingError:
            return True

    # =====================================================
    # Métadonnées
    # =====================================================

    @staticmethod
    def metadata(
        response: Any,
    ) -> Dict[str, Any]:
        """
        Retourne les métadonnées disponibles sans modifier
        la réponse originale.

        Les champs retournés sont normalisés autant que
        possible entre providers.
        """

        if not isinstance(response, dict):
            return {}

        metadata: Dict[str, Any] = {}

        # -------------------------------------------------
        # Informations générales
        # -------------------------------------------------

        for key in (
            "model",
            "id",
            "created_at",
            "created",
            "done",
            "finish_reason",
        ):

            if key in response:
                metadata[key] = response.get(key)

        # -------------------------------------------------
        # Statistiques Ollama
        # -------------------------------------------------

        for key in (
            "total_duration",
            "load_duration",
            "prompt_eval_count",
            "prompt_eval_duration",
            "eval_count",
            "eval_duration",
        ):

            if key in response:
                metadata[key] = response.get(key)

        # -------------------------------------------------
        # Usage OpenAI / Anthropic / autres
        # -------------------------------------------------

        usage = response.get("usage")

        if isinstance(usage, dict):
            metadata["usage"] = usage

        return metadata

    # =====================================================
    # Analyse du format
    # =====================================================

    @staticmethod
    def response_type(
        response: Any,
    ) -> str:
        """
        Identifie grossièrement le type de réponse.

        Cette méthode ne détermine pas nécessairement
        le provider réel.
        """

        if isinstance(response, str):
            return "text"

        if isinstance(response, list):
            return "blocks"

        if not isinstance(response, dict):
            return "unknown"

        if "choices" in response:
            return "openai_compatible"

        if "candidates" in response:
            return "gemini_compatible"

        if "message" in response:
            return "ollama_compatible"

        if isinstance(response.get("content"), list):
            return "anthropic_compatible"

        if "text" in response:
            return "text_response"

        return "generic"

    # =====================================================
    # Parse sécurisé
    # =====================================================

    @classmethod
    def safe_parse(
        cls,
        response: Any,
        default: str = "",
    ) -> str:
        """
        Parse une réponse sans lever d'exception.

        Utile pour les flux non critiques, notamment
        certains traitements de streaming.
        """

        try:
            return cls.parse(response)

        except ResponseParsingError:
            return default
