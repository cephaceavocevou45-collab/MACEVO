"""
MACEVO IA
Fichier : projects/services/ai/ollama_service.py

Service Ollama officiel de MACEVO.

Responsabilités :
- communication avec OllamaClient ;
- génération classique ;
- génération streaming ;
- gestion propre des erreurs ;
- désactivation explicite du thinking pour le chat classique ;
- diagnostic des réponses vides ;
- vérification de santé ;
- gestion du modèle ;
- préparation des capacités spécialisées futures.

Architecture :
    AIService
        ↓
    ModelManager
        ↓
    OllamaService
        ↓
    OllamaClient
        ↓
    Ollama API
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Iterable, Iterator, List, Optional

from django.conf import settings

from .base_provider import BaseProvider
from .exceptions import (
    GenerationError,
    ProviderConnectionError,
)

from .ollama_client import OllamaClient


logger = logging.getLogger(__name__)


class OllamaService(BaseProvider):
    """
    Provider Ollama utilisé actuellement par MACEVO.

    Ce service ne contient pas la logique HTTP bas niveau.
    Celle-ci appartient à OllamaClient.

    Il joue le rôle de couche provider :
        messages
            ↓
        OllamaService
            ↓
        OllamaClient
            ↓
        Ollama API
    """

    provider_name = "ollama"

    # ------------------------------------------------------------------
    # CONSTRUCTION
    # ------------------------------------------------------------------

    def __init__(
        self,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        client: Optional[OllamaClient] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialise le provider Ollama.

        Les valeurs sont récupérées depuis Django settings lorsqu'elles
        ne sont pas fournies explicitement.
        """

        configured_model = getattr(
            settings,
            "OLLAMA_MODEL",
            "qwen3:1.7b",
        )

        configured_temperature = getattr(
            settings,
            "AI_TEMPERATURE",
            0.4,
        )

        configured_max_tokens = getattr(
            settings,
            "AI_MAX_TOKENS",
            1024,
        )

        # Sécurité : éviter un max_tokens trop faible pour MACEVO.
        try:
            configured_max_tokens = int(configured_max_tokens)
        except (TypeError, ValueError):
            configured_max_tokens = 1024

        if configured_max_tokens < 256:
            configured_max_tokens = 256

        super().__init__(
            model=model or configured_model,
            temperature=(
                configured_temperature
                if temperature is None
                else temperature
            ),
            max_tokens=(
                configured_max_tokens
                if max_tokens is None
                else max_tokens
            ),
            **kwargs,
        )

        self.model = model or configured_model

        self.temperature = (
            configured_temperature
            if temperature is None
            else float(temperature)
        )

        self.max_tokens = (
            configured_max_tokens
            if max_tokens is None
            else int(max_tokens)
        )

        self.client = client or OllamaClient()

        # Capacités actuellement disponibles.
        #
        # Les capacités spécialisées sont préparées pour l'architecture
        # future de MACEVO mais ne sont pas activées artificiellement.
        self.capabilities = {
            "chat": True,
            "streaming": True,
            "code": True,
            "vision": False,
            "math": False,
            "scientific": False,
            "local": True,
        }

        logger.info(
            "Ollama initialisé | modèle=%s | temperature=%s | max_tokens=%s",
            self.model,
            self.temperature,
            self.max_tokens,
        )

    # ------------------------------------------------------------------
    # NORMALISATION DES MESSAGES
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_messages(
        messages: Iterable[Dict[str, Any]],
    ) -> List[Dict[str, str]]:
        """
        Normalise les messages avant transmission à Ollama.

        Format final :

        [
            {
                "role": "system",
                "content": "..."
            },
            {
                "role": "user",
                "content": "..."
            }
        ]
        """

        if messages is None:
            raise GenerationError(
                "Aucun message n'a été fourni à Ollama."
            )

        normalized: List[Dict[str, str]] = []

        try:
            iterable = list(messages)
        except TypeError as exc:
            raise GenerationError(
                "Les messages fournis à Ollama sont invalides."
            ) from exc

        for index, message in enumerate(iterable):
            if not isinstance(message, dict):
                raise GenerationError(
                    f"Message Ollama invalide à la position {index}."
                )

            role = str(message.get("role") or "").strip().lower()
            content = message.get("content")

            if role not in {
                "system",
                "user",
                "assistant",
            }:
                logger.warning(
                    "Rôle Ollama inconnu ignoré | index=%s | role=%s",
                    index,
                    role,
                )
                continue

            if content is None:
                content = ""

            if not isinstance(content, str):
                content = str(content)

            content = content.strip()

            # On ne transmet pas les messages totalement vides.
            if not content:
                continue

            normalized.append(
                {
                    "role": role,
                    "content": content,
                }
            )

        if not normalized:
            raise GenerationError(
                "Aucun message exploitable n'a été transmis à Ollama."
            )

        return normalized

    # ------------------------------------------------------------------
    # PRÉPARATION QWEN3 / THINKING
    # ------------------------------------------------------------------

    @staticmethod
    def _disable_thinking(
        messages: List[Dict[str, str]],
    ) -> List[Dict[str, str]]:
        """
        Désactive explicitement le raisonnement Qwen3 pour le chat classique.

        Le paramètre `think=False` est également envoyé à l'API Ollama.

        Le suffixe /no_think est ajouté au dernier message utilisateur
        uniquement s'il n'est pas déjà présent.

        Cela évite que Qwen3 consomme inutilement tout le budget de sortie
        dans son raisonnement avant de produire message.content.
        """

        prepared = [
            {
                "role": item["role"],
                "content": item["content"],
            }
            for item in messages
        ]

        last_user_index: Optional[int] = None

        for index in range(len(prepared) - 1, -1, -1):
            if prepared[index]["role"] == "user":
                last_user_index = index
                break

        if last_user_index is None:
            return prepared

        content = prepared[last_user_index]["content"]

        if "/no_think" not in content.lower():
            prepared[last_user_index] = {
                "role": "user",
                "content": f"{content}\n\n/no_think",
            }

        return prepared

    # ------------------------------------------------------------------
    # DIAGNOSTIC RÉPONSE
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_response_content(
        response: Dict[str, Any],
    ) -> tuple[str, str, Dict[str, Any]]:
        """
        Extrait :
        - message.content
        - message.thinking
        - métadonnées utiles.

        Retourne :
            content, thinking, metadata
        """

        if not isinstance(response, dict):
            raise GenerationError(
                "Ollama a retourné une réponse invalide."
            )

        error = response.get("error")

        if error:
            raise GenerationError(
                f"Ollama a retourné une erreur : {error}"
            )

        message = response.get("message")

        if not isinstance(message, dict):
            raise GenerationError(
                "Ollama n'a pas retourné de message exploitable."
            )

        content = message.get("content") or ""
        thinking = message.get("thinking") or ""

        if not isinstance(content, str):
            content = str(content)

        if not isinstance(thinking, str):
            thinking = str(thinking)

        metadata = {
            "done": response.get("done"),
            "done_reason": response.get("done_reason"),
            "total_duration": response.get("total_duration"),
            "load_duration": response.get("load_duration"),
            "prompt_eval_count": response.get(
                "prompt_eval_count"
            ),
            "prompt_eval_duration": response.get(
                "prompt_eval_duration"
            ),
            "eval_count": response.get("eval_count"),
            "eval_duration": response.get("eval_duration"),
        }

        return (
            content.strip(),
            thinking.strip(),
            metadata,
        )

    # ------------------------------------------------------------------
    # APPEL CLASSIQUE
    # ------------------------------------------------------------------

    def _call_classic(
        self,
        messages: List[Dict[str, str]],
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Effectue une génération classique auprès d'Ollama.

        Important :
        une erreur de connexion n'est PAS transformée en fallback
        streaming. Si Ollama est arrêté, il faut remonter immédiatement
        une ProviderConnectionError claire.
        """

        token_limit = (
            self.max_tokens
            if max_tokens is None
            else int(max_tokens)
        )

        logger.info(
            "Messages transmis à Ollama | total=%s | roles=%s",
            len(messages),
            [item["role"] for item in messages],
        )

        if messages:
            last = messages[-1]

            logger.info(
                "Dernier message Ollama | role=%s | chars=%s | preview=%r",
                last.get("role"),
                len(last.get("content", "")),
                last.get("content", "")[:160],
            )

        logger.info(
            "Appel Ollama classique | model=%s | max_tokens=%s | think=False",
            self.model,
            token_limit,
        )

        try:
            response = self.client.generate(
                model=self.model,
                messages=messages,
                stream=False,
                temperature=self.temperature,
                max_tokens=token_limit,
                think=False,
            )

        except ProviderConnectionError:
            # NE PAS relancer trois fois.
            #
            # Si localhost:11434 refuse la connexion, aucune répétition
            # immédiate ne peut résoudre le problème.
            logger.exception(
                "Connexion Ollama impossible | model=%s",
                self.model,
            )
            raise

        except Exception as exc:
            logger.exception(
                "Erreur inattendue pendant l'appel Ollama | model=%s",
                self.model,
            )

            raise GenerationError(
                "Impossible de communiquer avec Ollama."
            ) from exc

        try:
            content, thinking, metadata = (
                self._extract_response_content(response)
            )
        except GenerationError:
            raise
        except Exception as exc:
            raise GenerationError(
                "Impossible d'analyser la réponse Ollama."
            ) from exc

        logger.info(
            "Réponse Ollama reçue | model=%s | content_chars=%s | "
            "thinking_chars=%s | done=%s | done_reason=%s | "
            "prompt_eval_count=%s | eval_count=%s",
            self.model,
            len(content),
            len(thinking),
            metadata.get("done"),
            metadata.get("done_reason"),
            metadata.get("prompt_eval_count"),
            metadata.get("eval_count"),
        )

        # --------------------------------------------------------------
        # CAS NORMAL
        # --------------------------------------------------------------

        if content:
            return content

        # --------------------------------------------------------------
        # CAS : OLLAMA A FOURNI UNIQUEMENT DU THINKING
        # --------------------------------------------------------------

        if thinking:
            logger.error(
                "Ollama a terminé avec du thinking mais sans "
                "message.content | model=%s | thinking_chars=%s",
                self.model,
                len(thinking),
            )

            raise GenerationError(
                "Ollama a terminé son raisonnement mais n'a produit "
                "aucune réponse finale."
            )

        # --------------------------------------------------------------
        # CAS : RÉPONSE COMPLÈTEMENT VIDE
        # --------------------------------------------------------------

        logger.error(
            "Ollama a retourné un contenu vide | model=%s | "
            "done=%s | done_reason=%s | prompt_eval_count=%s | "
            "eval_count=%s",
            self.model,
            metadata.get("done"),
            metadata.get("done_reason"),
            metadata.get("prompt_eval_count"),
            metadata.get("eval_count"),
        )

        raise GenerationError(
            "Ollama a répondu, mais le contenu est vide."
        )

    # ------------------------------------------------------------------
    # GÉNÉRATION CLASSIQUE PUBLIQUE
    # ------------------------------------------------------------------

    def generate_response(
        self,
        messages: Iterable[Dict[str, Any]],
    ) -> str:
        """
        Génère une réponse complète.

        Cette méthode est utilisée par :

            AIService._generate()
                ↓
            OllamaService.generate_response()
        """

        normalized = self._normalize_messages(messages)

        prepared = self._disable_thinking(normalized)

        try:
            response = self._call_classic(
                messages=prepared,
                max_tokens=self.max_tokens,
            )

            if not response or not response.strip():
                raise GenerationError(
                    "La réponse finale d'Ollama est vide."
                )

            logger.info(
                "Génération Ollama terminée | modèle=%s | chars=%s",
                self.model,
                len(response),
            )

            return response.strip()

        except ProviderConnectionError:
            logger.error(
                "Ollama indisponible | modèle=%s | "
                "vérifiez que le serveur Ollama fonctionne sur localhost:11434",
                self.model,
            )
            raise

        except GenerationError:
            raise

        except Exception as exc:
            logger.exception(
                "Erreur pendant la génération Ollama."
            )

            raise GenerationError(
                "Impossible de générer une réponse avec Ollama."
            ) from exc

    # ------------------------------------------------------------------
    # STREAMING
    # ------------------------------------------------------------------

    def stream_response(
        self,
        messages: Iterable[Dict[str, Any]],
    ) -> Iterator[Dict[str, Any]]:
        """
        Génération streaming.

        Événements produits :

            {
                "type": "thinking",
                "content": "..."
            }

            {
                "type": "chunk",
                "content": "..."
            }

            {
                "type": "done",
                ...
            }
        """

        normalized = self._normalize_messages(messages)

        prepared = self._disable_thinking(normalized)

        logger.info(
            "Streaming Ollama démarré | model=%s | messages=%s | "
            "max_tokens=%s | think=False",
            self.model,
            len(prepared),
            self.max_tokens,
        )

        total_content_chars = 0
        total_thinking_chars = 0
        received_done = False

        try:
            events = self.client.generate_stream(
                model=self.model,
                messages=prepared,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                think=False,
            )

            for event in events:
                if not isinstance(event, dict):
                    logger.debug(
                        "Événement Ollama ignoré : %r",
                        event,
                    )
                    continue

                event_type = event.get("type")

                # ------------------------------------------------------
                # CHUNK FINAL
                # ------------------------------------------------------

                if event_type == "chunk":
                    content = event.get("content") or ""

                    if not isinstance(content, str):
                        content = str(content)

                    if content:
                        total_content_chars += len(content)

                        yield {
                            "type": "chunk",
                            "content": content,
                        }

                    continue

                # ------------------------------------------------------
                # THINKING
                # ------------------------------------------------------

                if event_type == "thinking":
                    thinking = event.get("content") or ""

                    if not isinstance(thinking, str):
                        thinking = str(thinking)

                    if thinking:
                        total_thinking_chars += len(thinking)

                        # On conserve l'événement pour l'interface
                        # scientifique future, mais le frontend peut
                        # choisir de ne pas l'afficher.
                        yield {
                            "type": "thinking",
                            "content": thinking,
                        }

                    continue

                # ------------------------------------------------------
                # FIN
                # ------------------------------------------------------

                if event_type == "done":
                    received_done = True

                    yield {
                        "type": "done",
                        "content": "",
                        "done": True,
                        "done_reason": event.get(
                            "done_reason"
                        ),
                        "prompt_eval_count": event.get(
                            "prompt_eval_count"
                        ),
                        "eval_count": event.get(
                            "eval_count"
                        ),
                        "total_duration": event.get(
                            "total_duration"
                        ),
                    }

                    continue

                # ------------------------------------------------------
                # ERREUR
                # ------------------------------------------------------

                if event_type == "error":
                    error_message = (
                        event.get("error")
                        or event.get("message")
                        or "Erreur Ollama inconnue."
                    )

                    raise GenerationError(
                        str(error_message)
                    )

                # ------------------------------------------------------
                # ÉVÉNEMENT INCONNU
                # ------------------------------------------------------

                logger.debug(
                    "Événement Ollama inconnu ignoré | type=%s",
                    event_type,
                )

        except ProviderConnectionError:
            logger.exception(
                "Connexion Ollama impossible pendant le streaming."
            )
            raise

        except GenerationError:
            raise

        except Exception as exc:
            logger.exception(
                "Erreur pendant le streaming Ollama."
            )

            raise GenerationError(
                "Impossible de générer la réponse Ollama en streaming."
            ) from exc

        finally:
            logger.info(
                "Streaming Ollama terminé | model=%s | "
                "content_chars=%s | thinking_chars=%s | done=%s",
                self.model,
                total_content_chars,
                total_thinking_chars,
                received_done,
            )

        if total_content_chars == 0:
            logger.warning(
                "Streaming Ollama terminé sans contenu final | model=%s",
                self.model,
            )

    # ------------------------------------------------------------------
    # STREAMING TEXTE SIMPLE
    # ------------------------------------------------------------------

    def stream_text(
        self,
        messages: Iterable[Dict[str, Any]],
    ) -> Iterator[str]:
        """
        Version simplifiée du streaming.

        Ne renvoie que les morceaux de texte final.
        Les événements `thinking` et `done` sont ignorés.
        """

        for event in self.stream_response(messages):
            if not isinstance(event, dict):
                continue

            if event.get("type") != "chunk":
                continue

            content = event.get("content") or ""

            if content:
                yield str(content)

    # ------------------------------------------------------------------
    # LISTE DES MODÈLES
    # ------------------------------------------------------------------

    def list_models(self) -> List[Dict[str, Any]]:
        """
        Retourne les modèles disponibles sur Ollama.
        """

        try:
            models = self.client.list_models()

            if models is None:
                return []

            if isinstance(models, list):
                return models

            # Certains clients peuvent retourner un dictionnaire :
            # {"models": [...]}
            if isinstance(models, dict):
                raw_models = models.get("models", [])

                if isinstance(raw_models, list):
                    return raw_models

            return []

        except ProviderConnectionError:
            logger.exception(
                "Impossible de récupérer les modèles Ollama."
            )
            raise

        except Exception as exc:
            logger.exception(
                "Erreur lors de la récupération des modèles Ollama."
            )

            raise GenerationError(
                "Impossible de récupérer les modèles Ollama."
            ) from exc

    # ------------------------------------------------------------------
    # VÉRIFICATION MODÈLE
    # ------------------------------------------------------------------

    def model_exists(
        self,
        model: Optional[str] = None,
    ) -> bool:
        """
        Vérifie si un modèle existe dans Ollama.
        """

        target_model = model or self.model

        try:
            return bool(
                self.client.model_exists(
                    target_model
                )
            )

        except ProviderConnectionError:
            logger.exception(
                "Impossible de vérifier le modèle Ollama | model=%s",
                target_model,
            )
            raise

        except Exception:
            logger.exception(
                "Erreur lors de la vérification du modèle | model=%s",
                target_model,
            )
            return False

    # ------------------------------------------------------------------
    # HEALTH CHECK
    # ------------------------------------------------------------------

    def health_check(self) -> Dict[str, Any]:
        """
        Vérifie la disponibilité du serveur Ollama.

        Cette méthode ne doit pas faire planter l'application.
        Elle retourne un état exploitable par l'interface.
        """

        try:
            result = self.client.health()

            if isinstance(result, dict):
                healthy = bool(
                    result.get(
                        "healthy",
                        result.get(
                            "ok",
                            True,
                        ),
                    )
                )

                return {
                    **result,
                    "healthy": healthy,
                    "provider": self.provider_name,
                    "model": self.model,
                }

            return {
                "healthy": bool(result),
                "provider": self.provider_name,
                "model": self.model,
            }

        except Exception as exc:
            logger.warning(
                "Ollama indisponible | model=%s | error=%s",
                self.model,
                exc,
            )

            return {
                "healthy": False,
                "provider": self.provider_name,
                "model": self.model,
                "error": str(exc),
            }

    # ------------------------------------------------------------------
    # CHANGEMENT DE MODÈLE
    # ------------------------------------------------------------------

    def set_model(
        self,
        model: str,
    ) -> str:
        """
        Change le modèle utilisé par le provider.

        Le modèle doit exister dans Ollama.
        """

        if not model or not str(model).strip():
            raise GenerationError(
                "Le nom du modèle Ollama est obligatoire."
            )

        model = str(model).strip()

        try:
            exists = self.client.model_exists(model)

        except ProviderConnectionError:
            logger.exception(
                "Impossible de vérifier le nouveau modèle Ollama | model=%s",
                model,
            )
            raise

        except Exception as exc:
            logger.exception(
                "Erreur lors de la vérification du nouveau modèle."
            )

            raise GenerationError(
                "Impossible de vérifier le modèle Ollama."
            ) from exc

        if not exists:
            raise GenerationError(
                f"Le modèle Ollama '{model}' n'existe pas "
                "ou n'est pas disponible."
            )

        self.model = model

        logger.info(
            "Modèle Ollama changé | model=%s",
            self.model,
        )

        return self.model

    # ------------------------------------------------------------------
    # CONFIGURATION
    # ------------------------------------------------------------------

    def configure(
        self,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> "OllamaService":
        """
        Modifie dynamiquement la configuration du provider.
        """

        if model is not None:
            model = str(model).strip()

            if model:
                self.model = model

        if temperature is not None:
            try:
                self.temperature = float(temperature)
            except (TypeError, ValueError) as exc:
                raise GenerationError(
                    "La température Ollama est invalide."
                ) from exc

        if max_tokens is not None:
            try:
                value = int(max_tokens)
            except (TypeError, ValueError) as exc:
                raise GenerationError(
                    "max_tokens Ollama est invalide."
                ) from exc

            if value < 256:
                value = 256

            self.max_tokens = value

        logger.info(
            "Configuration Ollama mise à jour | model=%s | "
            "temperature=%s | max_tokens=%s",
            self.model,
            self.temperature,
            self.max_tokens,
        )

        return self

    # ------------------------------------------------------------------
    # INFORMATIONS PROVIDER
    # ------------------------------------------------------------------

    def info(self) -> Dict[str, Any]:
        """
        Retourne les informations publiques du provider.
        """

        return {
            "provider": self.provider_name,
            "name": "Ollama",
            "model": self.model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "capabilities": dict(self.capabilities),
            "local": True,
            "streaming": True,
            "thinking_control": True,
        }

    # ------------------------------------------------------------------
    # CAPACITÉS
    # ------------------------------------------------------------------

    def supports(
        self,
        capability: str,
    ) -> bool:
        """
        Vérifie si Ollama supporte une capacité donnée.
        """

        if not capability:
            return False

        return bool(
            self.capabilities.get(
                str(capability).strip().lower(),
                False,
            )
        )

    # ------------------------------------------------------------------
    # VISION
    # ------------------------------------------------------------------

    def generate_vision(
        self,
        messages: Iterable[Dict[str, Any]],
        images: Optional[List[Any]] = None,
        **kwargs: Any,
    ) -> str:
        """
        Point d'entrée réservé à la future capacité Vision.

        Ollama peut supporter certains modèles multimodaux, mais MACEVO
        ne l'active pas automatiquement tant que le routage Vision dédié
        n'est pas configuré.
        """

        raise NotImplementedError(
            "La capacité Vision n'est pas encore activée "
            "pour Ollama dans MACEVO."
        )

    # ------------------------------------------------------------------
    # MATH
    # ------------------------------------------------------------------

    def generate_math(
        self,
        messages: Iterable[Dict[str, Any]],
        **kwargs: Any,
    ) -> str:
        """
        Point d'entrée réservé au futur moteur Math spécialisé.
        """

        raise NotImplementedError(
            "La capacité Math spécialisée n'est pas encore activée "
            "pour Ollama dans MACEVO."
        )

    # ------------------------------------------------------------------
    # SCIENTIFIQUE
    # ------------------------------------------------------------------

    def generate_scientific(
        self,
        messages: Iterable[Dict[str, Any]],
        **kwargs: Any,
    ) -> str:
        """
        Point d'entrée réservé au futur moteur scientifique spécialisé.
        """

        raise NotImplementedError(
            "La capacité Scientific spécialisée n'est pas encore activée "
            "pour Ollama dans MACEVO."
        )

    # ------------------------------------------------------------------
    # REPRÉSENTATION
    # ------------------------------------------------------------------

    def __repr__(self) -> str:
        return (
            f"<OllamaService "
            f"model={self.model!r} "
            f"temperature={self.temperature!r} "
            f"max_tokens={self.max_tokens!r}>"
        )


__all__ = [
    "OllamaService",
]