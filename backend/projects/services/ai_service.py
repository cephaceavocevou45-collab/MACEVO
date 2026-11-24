"""
==========================================================
MACEVO IA
AI Service
==========================================================

Point d'entrée principal du moteur IA MACEVO.

Responsabilités :
- validation des messages ;
- gestion du contexte conversationnel ;
- limitation du contexte ;
- contrôle des tokens ;
- sélection du provider ;
- génération classique ;
- génération streaming ;
- parsing des réponses ;
- opérations IA spécialisées ;
- informations et diagnostic du moteur.

Architecture :

    AssistantService
          ↓
      AIService
          ↓
    ContextManager
          ↓
    TokenCounter
          ↓
    ModelManager
          ↓
      Provider
          ↓
   Ollama / OpenAI / Gemini / Anthropic / ...
          ↓
    ResponseParser

Le service reste volontairement provider-neutral.

Auteur : MACEVO
"""

import logging
import time
from collections.abc import Iterator

from projects.services.ai.model_manager import ModelManager
from projects.services.ai.prompt_builder import PromptBuilder
from projects.services.ai.response_parser import ResponseParser
from projects.services.ai.token_counter import TokenCounter


logger = logging.getLogger(__name__)


class AIService:
    """
    Service central du moteur IA MACEVO.

    Ce service constitue la porte d'entrée commune de toutes
    les fonctionnalités IA.

    Il est conçu pour fonctionner aussi bien avec :

        generate_response()

    que :

        stream_response()

    afin de permettre à MACEVO de fonctionner comme un véritable
    assistant moderne avec génération progressive.
    """

    # =========================================================
    # Configuration
    # =========================================================

    # Nombre maximum de messages conservés dans le contexte
    # conversationnel après réduction.
    DEFAULT_MAX_MESSAGES = 20

    # Nombre minimal de messages à conserver lorsqu'une
    # réduction du contexte est nécessaire.
    MIN_MESSAGES_TO_KEEP = 4

    # Taille maximale approximative du contexte en caractères.
    # Le TokenCounter reste l'autorité finale.
    DEFAULT_MAX_CONTEXT_CHARS = 60000

    # =========================================================
    # Provider
    # =========================================================

    @classmethod
    def provider(cls):
        """
        Retourne le provider IA actuellement configuré.
        """
        return ModelManager.provider()

    # =========================================================
    # Validation des messages
    # =========================================================

    @staticmethod
    def _validate_messages(messages):
        """
        Vérifie et normalise une liste de messages.

        Format attendu :

        [
            {
                "role": "system",
                "content": "..."
            },
            {
                "role": "user",
                "content": "..."
            },
            {
                "role": "assistant",
                "content": "..."
            }
        ]
        """

        if messages is None:
            raise ValueError(
                "La liste des messages ne peut pas être vide."
            )

        if not isinstance(messages, (list, tuple)):
            raise TypeError(
                "Les messages doivent être une liste ou un tuple."
            )

        if not messages:
            raise ValueError(
                "La liste des messages ne peut pas être vide."
            )

        normalized = []

        for message in messages:

            if not isinstance(message, dict):
                raise TypeError(
                    "Chaque message doit être un dictionnaire."
                )

            role = message.get("role")
            content = message.get("content", "")

            if not role:
                raise ValueError(
                    "Chaque message doit posséder un rôle."
                )

            if content is None:
                content = ""

            role = str(role).strip().lower()
            content = str(content)

            if not role:
                raise ValueError(
                    "Le rôle du message ne peut pas être vide."
                )

            normalized.append(
                {
                    "role": role,
                    "content": content,
                }
            )

        return normalized

    # =========================================================
    # Réduction du contexte
    # =========================================================

    @classmethod
    def _reduce_context(
        cls,
        messages,
        *,
        max_messages=None,
        max_chars=None,
    ):
        """
        Réduit intelligemment l'historique lorsque celui-ci devient
        trop important.

        Principes :

        - conserver le message système ;
        - conserver les messages les plus récents ;
        - ne jamais supprimer le dernier message utilisateur ;
        - éviter d'envoyer un historique gigantesque à Ollama ;
        - conserver la continuité de conversation autant que possible.

        Cette étape permet également d'éviter que les petits modèles
        locaux deviennent extrêmement lents lorsque l'historique
        devient long.
        """

        messages = list(messages)

        if not messages:
            return messages

        max_messages = (
            max_messages
            or cls.DEFAULT_MAX_MESSAGES
        )

        max_chars = (
            max_chars
            or cls.DEFAULT_MAX_CONTEXT_CHARS
        )

        # -----------------------------------------------------
        # Vérification rapide
        # -----------------------------------------------------

        total_chars = sum(
            len(str(message.get("content", "")))
            for message in messages
        )

        if (
            len(messages) <= max_messages
            and total_chars <= max_chars
        ):
            return messages

        logger.warning(
            "Contexte IA trop volumineux. "
            "Réduction automatique de l'historique."
        )

        # -----------------------------------------------------
        # Message système
        # -----------------------------------------------------

        system_messages = [
            message
            for message in messages
            if message.get("role") == "system"
        ]

        # -----------------------------------------------------
        # Autres messages
        # -----------------------------------------------------

        non_system_messages = [
            message
            for message in messages
            if message.get("role") != "system"
        ]

        # Toujours conserver le dernier message.
        latest_message = (
            non_system_messages[-1]
            if non_system_messages
            else None
        )

        # -----------------------------------------------------
        # Sélection des messages récents
        # -----------------------------------------------------

        keep_count = max(
            cls.MIN_MESSAGES_TO_KEEP,
            max_messages - len(system_messages),
        )

        recent_messages = non_system_messages[-keep_count:]

        # -----------------------------------------------------
        # Contrôle supplémentaire par caractères
        # -----------------------------------------------------

        selected = []

        current_chars = sum(
            len(str(message.get("content", "")))
            for message in system_messages
        )

        for message in reversed(recent_messages):

            content = str(
                message.get("content", "")
            )

            message_size = len(content)

            if (
                selected
                and current_chars + message_size > max_chars
            ):
                break

            selected.append(message)
            current_chars += message_size

        selected.reverse()

        # S'assurer que le dernier message est toujours présent.
        if latest_message is not None:
            if latest_message not in selected:
                selected.append(latest_message)

        final_messages = (
            system_messages
            + selected
        )

        removed = len(messages) - len(final_messages)

        if removed > 0:
            logger.info(
                "Contexte IA réduit automatiquement | "
                "messages_supprimes=%d | messages_conserves=%d",
                removed,
                len(final_messages),
            )

        return final_messages

    # =========================================================
    # Préparation du contexte
    # =========================================================

    @classmethod
    def _prepare_messages(
        cls,
        messages,
        *,
        reduce_context=True,
        max_messages=None,
        max_chars=None,
    ):
        """
        Valide et prépare les messages avant génération.
        """

        messages = cls._validate_messages(messages)

        if reduce_context:
            messages = cls._reduce_context(
                messages,
                max_messages=max_messages,
                max_chars=max_chars,
            )

        return messages

    # =========================================================
    # Modèle du provider
    # =========================================================

    @staticmethod
    def _provider_model(provider):
        """
        Retourne le modèle courant du provider.

        Compatible avec :

            current_model()

        ou :

            model
        """

        current_model = getattr(
            provider,
            "current_model",
            None,
        )

        if callable(current_model):
            try:
                return current_model()
            except Exception:
                logger.debug(
                    "Impossible de récupérer current_model().",
                    exc_info=True,
                )

        return getattr(
            provider,
            "model",
            None,
        )

    # =========================================================
    # Génération classique
    # =========================================================

    @classmethod
    def _generate(
        cls,
        messages,
        *,
        parse=True,
        reduce_context=True,
    ):
        """
        Pipeline central de génération classique.

        Pipeline :

            messages
                ↓
            validation
                ↓
            réduction contexte
                ↓
            TokenCounter
                ↓
            provider
                ↓
            génération
                ↓
            ResponseParser
        """

        messages = cls._prepare_messages(
            messages,
            reduce_context=reduce_context,
        )

        # -----------------------------------------------------
        # TokenCounter
        # -----------------------------------------------------

        start = time.perf_counter()

        TokenCounter.check_limit(
            messages
        )

        logger.debug(
            "TokenCounter terminé en %.3fs",
            time.perf_counter() - start,
        )

        # -----------------------------------------------------
        # Provider
        # -----------------------------------------------------

        provider = cls.provider()

        logger.debug(
            "Provider IA utilisé : %s",
            provider.__class__.__name__,
        )

        # -----------------------------------------------------
        # Modèle
        # -----------------------------------------------------

        current_model = cls._provider_model(
            provider
        )

        if current_model:
            logger.debug(
                "Modèle IA utilisé : %s",
                current_model,
            )

        # -----------------------------------------------------
        # Génération
        # -----------------------------------------------------

        start = time.perf_counter()

        try:
            response = provider.generate_response(
                messages
            )

        except Exception:
            logger.exception(
                "Erreur pendant la génération IA."
            )
            raise

        elapsed = time.perf_counter() - start

        logger.info(
            "Génération IA terminée en %.3fs | "
            "provider=%s | model=%s",
            elapsed,
            provider.__class__.__name__,
            current_model,
        )

        # -----------------------------------------------------
        # Vérification
        # -----------------------------------------------------

        if response is None:
            raise RuntimeError(
                "Le provider IA n'a retourné aucune réponse."
            )

        # -----------------------------------------------------
        # Parsing
        # -----------------------------------------------------

        if not parse:
            return response

        start = time.perf_counter()

        result = ResponseParser.parse(
            response
        )

        logger.debug(
            "ResponseParser terminé en %.3fs",
            time.perf_counter() - start,
        )

        if result is None:
            raise RuntimeError(
                "Le parseur IA n'a produit aucune réponse."
            )

        return result

    # =========================================================
    # Streaming interne
    # =========================================================

    @classmethod
    def _stream(
        cls,
        messages,
        *,
        reduce_context=True,
    ) -> Iterator[dict]:
        """
        Pipeline de génération streaming.

        Le provider doit exposer :

            stream_response(messages)

        Chaque événement est normalisé vers :

            {
                "type": "chunk",
                "content": "..."
            }

        ou :

            {
                "type": "done",
                ...
            }

        ou :

            {
                "type": "error",
                ...
            }
        """

        messages = cls._prepare_messages(
            messages,
            reduce_context=reduce_context,
        )

        # -----------------------------------------------------
        # TokenCounter
        # -----------------------------------------------------

        TokenCounter.check_limit(
            messages
        )

        # -----------------------------------------------------
        # Provider
        # -----------------------------------------------------

        provider = cls.provider()

        model = cls._provider_model(
            provider
        )

        logger.info(
            "Démarrage streaming IA | "
            "provider=%s | model=%s | messages=%d",
            provider.__class__.__name__,
            model,
            len(messages),
        )

        # -----------------------------------------------------
        # Vérification du support
        # -----------------------------------------------------

        stream_method = getattr(
            provider,
            "stream_response",
            None,
        )

        if not callable(stream_method):
            raise NotImplementedError(
                "Le provider IA actuel ne supporte pas "
                "la génération streaming."
            )

        start = time.perf_counter()

        total_content = ""
        completed = False

        try:

            events = stream_method(
                messages
            )

            if events is None:
                raise RuntimeError(
                    "Le provider streaming n'a retourné aucun flux."
                )

            for event in events:

                # -------------------------------------------------
                # Event texte brut
                # -------------------------------------------------

                if isinstance(event, str):

                    content = event

                    if not content:
                        continue

                    total_content += content

                    yield {
                        "type": "chunk",
                        "content": content,
                    }

                    continue

                # -------------------------------------------------
                # Event dictionnaire
                # -------------------------------------------------

                if isinstance(event, dict):

                    event_type = str(
                        event.get(
                            "type",
                            "chunk",
                        )
                    ).lower()

                    # ---------------------------------------------
                    # Chunk
                    # ---------------------------------------------

                    if event_type in {
                        "chunk",
                        "token",
                        "text",
                    }:

                        content = event.get(
                            "content",
                            event.get(
                                "text",
                                "",
                            ),
                        )

                        if content is None:
                            content = ""

                        content = str(
                            content
                        )

                        if content:

                            total_content += content

                            yield {
                                **event,
                                "type": "chunk",
                                "content": content,
                            }

                        continue

                    # ---------------------------------------------
                    # Done
                    # ---------------------------------------------

                    if event_type in {
                        "done",
                        "complete",
                        "completed",
                    }:

                        completed = True

                        yield {
                            **event,
                            "type": "done",
                            "content": event.get(
                                "content",
                                "",
                            ),
                            "response": event.get(
                                "response",
                                total_content,
                            ),
                        }

                        continue

                    # ---------------------------------------------
                    # Error
                    # ---------------------------------------------

                    if event_type == "error":

                        yield {
                            **event,
                            "type": "error",
                        }

                        continue

                    # ---------------------------------------------
                    # Autre événement
                    # ---------------------------------------------

                    yield event

                    continue

                # -------------------------------------------------
                # Objet inattendu
                # -------------------------------------------------

                logger.debug(
                    "Événement streaming ignoré : %r",
                    event,
                )

            # -----------------------------------------------------
            # Fin implicite du flux
            # -----------------------------------------------------

            if not completed:

                yield {
                    "type": "done",
                    "content": "",
                    "response": total_content,
                }

            elapsed = (
                time.perf_counter()
                - start
            )

            logger.info(
                "Streaming IA terminé en %.3fs | "
                "provider=%s | model=%s | "
                "response_length=%d",
                elapsed,
                provider.__class__.__name__,
                model,
                len(total_content),
            )

        except GeneratorExit:

            logger.info(
                "Streaming IA interrompu par le client."
            )

            raise

        except Exception as exc:

            logger.exception(
                "Erreur pendant le streaming IA."
            )

            yield {
                "type": "error",
                "error": str(exc),
                "message": str(exc),
            }

    # =========================================================
    # Chat classique
    # =========================================================

    @classmethod
    def chat(
        cls,
        messages,
    ):
        """
        Génère une réponse IA à partir d'un historique
        de conversation.

        Le système MACEVO est ajouté automatiquement.
        """

        from projects.services.ai.context_manager import (
            ContextManager,
        )

        from projects.services.ai.prompt_templates import (
            PromptTemplates,
        )

        messages = cls._validate_messages(
            messages
        )

        # -----------------------------------------------------
        # Construction du contexte
        # -----------------------------------------------------

        context = ContextManager()

        for message in messages:

            context.add_message(
                role=message["role"],
                content=message["content"],
            )

        context.ensure_system_message(
            PromptTemplates.SYSTEM
        )

        final_messages = context.messages()

        logger.debug(
            "Contexte IA construit avec %d messages.",
            len(final_messages),
        )

        # -----------------------------------------------------
        # Génération
        # -----------------------------------------------------

        return cls._generate(
            final_messages,
            reduce_context=True,
        )

    # =========================================================
    # Chat streaming
    # =========================================================

    @classmethod
    def stream_chat(
        cls,
        messages,
    ):
        """
        Version streaming de chat().

        Le contexte MACEVO est identique à celui utilisé
        par chat(), ce qui évite d'avoir deux comportements
        différents entre le mode classique et le mode streaming.
        """

        from projects.services.ai.context_manager import (
            ContextManager,
        )

        from projects.services.ai.prompt_templates import (
            PromptTemplates,
        )

        messages = cls._validate_messages(
            messages
        )

        # -----------------------------------------------------
        # Construction du contexte
        # -----------------------------------------------------

        context = ContextManager()

        for message in messages:

            context.add_message(
                role=message["role"],
                content=message["content"],
            )

        context.ensure_system_message(
            PromptTemplates.SYSTEM
        )

        final_messages = context.messages()

        logger.debug(
            "Contexte streaming IA construit avec %d messages.",
            len(final_messages),
        )

        # -----------------------------------------------------
        # Streaming
        # -----------------------------------------------------

        yield from cls._stream(
            final_messages,
            reduce_context=True,
        )

    # =========================================================
    # Streaming générique
    # =========================================================

    @classmethod
    def stream(
        cls,
        messages,
    ):
        """
        Streaming générique pour les futurs moteurs MACEVO.
        """

        yield from cls._stream(
            messages,
            reduce_context=True,
        )

    # =========================================================
    # Résumé
    # =========================================================

    @classmethod
    def summarize(
        cls,
        text,
    ):
        """
        Résume un contenu.
        """

        messages = PromptBuilder.summarize(
            text
        )

        return cls._generate(
            messages
        )

    # =========================================================
    # Explication
    # =========================================================

    @classmethod
    def explain(
        cls,
        text,
    ):
        """
        Explique un contenu.
        """

        messages = PromptBuilder.explain(
            text
        )

        return cls._generate(
            messages
        )

    # =========================================================
    # Correction
    # =========================================================

    @classmethod
    def correct(
        cls,
        text,
    ):
        """
        Corrige un contenu.
        """

        messages = PromptBuilder.correct(
            text
        )

        return cls._generate(
            messages
        )

    # =========================================================
    # Traduction
    # =========================================================

    @classmethod
    def translate(
        cls,
        text,
        language,
    ):
        """
        Traduit un contenu vers une langue donnée.
        """

        messages = PromptBuilder.translate(
            text=text,
            language=language,
        )

        return cls._generate(
            messages
        )

    # =========================================================
    # Amélioration
    # =========================================================

    @classmethod
    def improve(
        cls,
        text,
    ):
        """
        Améliore un contenu.
        """

        messages = PromptBuilder.improve(
            text
        )

        return cls._generate(
            messages
        )

    # =========================================================
    # Génération brute
    # =========================================================

    @classmethod
    def generate(
        cls,
        messages,
    ):
        """
        Génération brute destinée aux futurs services MACEVO.

        Utilisable pour :

        - analyse scientifique ;
        - analyse documentaire ;
        - génération d'équations ;
        - figures ;
        - tableaux ;
        - analyse de résultats ;
        - validation ;
        - génération de code ;
        - LaTeX ;
        - RAG ;
        - tâches structurées.
        """

        return cls._generate(
            messages
        )

    # =========================================================
    # Génération brute streaming
    # =========================================================

    @classmethod
    def generate_stream(
        cls,
        messages,
    ):
        """
        Version streaming de generate().
        """

        yield from cls._stream(
            messages,
            reduce_context=True,
        )

    # =========================================================
    # Modèles
    # =========================================================

    @classmethod
    def list_models(cls):
        """
        Retourne les modèles disponibles chez le provider.
        """

        provider = cls.provider()

        return provider.list_models()

    # =========================================================
    # Modèle courant
    # =========================================================

    @classmethod
    def current_model(cls):
        """
        Retourne le modèle actuellement utilisé.
        """

        provider = cls.provider()

        return cls._provider_model(
            provider
        )

    # =========================================================
    # Santé
    # =========================================================

    @classmethod
    def health(cls):
        """
        Vérifie l'état du provider IA.
        """

        provider = cls.provider()

        return provider.health_check()

    # =========================================================
    # Reload provider
    # =========================================================

    @classmethod
    def reload_provider(cls):
        """
        Recharge le provider IA.
        """

        return ModelManager.reload()

    # =========================================================
    # Informations générales
    # =========================================================

    @classmethod
    def info(cls):
        """
        Retourne les informations du moteur IA MACEVO.
        """

        provider = cls.provider()

        model = cls._provider_model(
            provider
        )

        provider_info = {}

        info_method = getattr(
            provider,
            "info",
            None,
        )

        if callable(info_method):

            try:
                provider_info = (
                    info_method()
                    or {}
                )
            except Exception:
                logger.debug(
                    "Impossible de récupérer "
                    "les informations du provider.",
                    exc_info=True,
                )

        capabilities = getattr(
            provider,
            "capabilities",
            {},
        )

        return {
            "service": "MACEVO AI Service",
            "provider": provider.__class__.__name__,
            "model": model,
            "streaming": callable(
                getattr(
                    provider,
                    "stream_response",
                    None,
                )
            ),
            "capabilities": capabilities,
            "provider_info": provider_info,
        }