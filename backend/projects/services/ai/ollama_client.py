"""
==========================================================
MACEVO IA
Ollama Client
==========================================================

Client HTTP bas niveau chargé de communiquer avec Ollama.

Responsabilités :
    - communication HTTP avec Ollama ;
    - vérification du serveur ;
    - récupération des modèles ;
    - génération classique ;
    - génération en streaming ;
    - parsing des chunks Ollama ;
    - gestion des erreurs réseau.

Aucune logique métier ou conversationnelle ici.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Iterator, List

import requests
from django.conf import settings

from .exceptions import (
    ModelNotFoundError,
    ProviderConnectionError,
)

logger = logging.getLogger(__name__)


class OllamaClient:

    API_CHAT = "/api/chat"
    API_TAGS = "/api/tags"

    def __init__(self):

        self.base_url = str(
            getattr(
                settings,
                "OLLAMA_BASE_URL",
                "http://localhost:11434",
            )
        ).rstrip("/")

        self.timeout = int(
            getattr(
                settings,
                "OLLAMA_TIMEOUT",
                180,
            )
        )

        self.health_timeout = int(
            getattr(
                settings,
                "OLLAMA_HEALTH_TIMEOUT",
                10,
            )
        )

        self.stream_timeout = int(
            getattr(
                settings,
                "OLLAMA_STREAM_TIMEOUT",
                self.timeout,
            )
        )

        self.default_temperature = float(
            getattr(
                settings,
                "AI_TEMPERATURE",
                0.4,
            )
        )

        self.default_max_tokens = int(
            getattr(
                settings,
                "AI_MAX_TOKENS",
                1024,
            )
        )

    # =====================================================
    # UTILITAIRES
    # =====================================================

    def _url(self, endpoint: str) -> str:

        endpoint = str(endpoint or "").strip()

        if not endpoint.startswith("/"):
            endpoint = f"/{endpoint}"

        return f"{self.base_url}{endpoint}"

    def _validate_model(self, model: str) -> str:

        model = str(model or "").strip()

        if not model:
            raise ModelNotFoundError(
                "Aucun modèle Ollama n'a été spécifié."
            )

        return model

    def _validate_messages(
        self,
        messages: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:

        if not isinstance(messages, list):
            raise ValueError(
                "Les messages doivent être fournis sous forme de liste."
            )

        if not messages:
            raise ValueError(
                "La liste des messages ne peut pas être vide."
            )

        validated = []

        for index, message in enumerate(messages):

            if not isinstance(message, dict):
                raise ValueError(
                    f"Le message {index} est invalide."
                )

            role = message.get("role")

            if not role:
                raise ValueError(
                    f"Le message {index} ne possède pas de rôle."
                )

            content = message.get("content")

            if content is None:
                content = ""

            validated.append(
                {
                    **message,
                    "role": str(role),
                    "content": str(content),
                }
            )

        return validated

    # =====================================================
    # PAYLOAD
    # =====================================================

    def _build_payload(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        stream: bool,
        temperature: float,
        max_tokens: int,
        **kwargs,
    ) -> Dict[str, Any]:

        model = self._validate_model(model)

        messages = self._validate_messages(messages)

        options = {
            "temperature": float(temperature),
            "num_predict": int(max_tokens),
        }

        extra_options = kwargs.pop(
            "options",
            None,
        )

        if isinstance(extra_options, dict):
            options.update(extra_options)

        # -------------------------------------------------
        # IMPORTANT :
        # Pour Qwen3, on force le dernier message utilisateur
        # en mode non-thinking pour les générations normales.
        # -------------------------------------------------

        think = kwargs.pop(
            "think",
            False,
        )

        if not stream and think is False:

            messages = [
                dict(message)
                for message in messages
            ]

            for index in range(
                len(messages) - 1,
                -1,
                -1,
            ):

                if messages[index].get("role") == "user":

                    content = str(
                        messages[index].get(
                            "content",
                            "",
                        )
                    )

                    if "/no_think" not in content.lower():

                        messages[index]["content"] = (
                            f"{content}\n\n/no_think"
                        )

                    break

        payload = {
            "model": model,
            "messages": messages,
            "stream": bool(stream),

            # IMPORTANT :
            # think doit être au niveau du payload,
            # pas dans options.
            "think": think,

            "options": options,
        }

        payload.update(kwargs)

        return payload

    # =====================================================
    # SANTÉ
    # =====================================================

    def health(self) -> bool:

        try:

            response = requests.get(
                self._url(self.API_TAGS),
                timeout=self.health_timeout,
            )

            response.raise_for_status()

            return True

        except requests.Timeout as exc:

            raise ProviderConnectionError(
                "Ollama ne répond pas dans le délai prévu."
            ) from exc

        except requests.RequestException as exc:

            logger.warning(
                "Ollama indisponible : %s",
                exc,
            )

            raise ProviderConnectionError(
                "Impossible de contacter Ollama."
            ) from exc

    # =====================================================
    # MODÈLES
    # =====================================================

    def list_models(self) -> List[str]:

        try:

            response = requests.get(
                self._url(self.API_TAGS),
                timeout=self.health_timeout,
            )

            response.raise_for_status()

            try:
                data = response.json()

            except ValueError as exc:

                raise ProviderConnectionError(
                    "Ollama a retourné une réponse JSON invalide."
                ) from exc

            models = data.get("models", [])

            if not isinstance(models, list):

                raise ProviderConnectionError(
                    "Réponse Ollama invalide."
                )

            result = []

            for model in models:

                if not isinstance(model, dict):
                    continue

                name = model.get("name")

                if name:
                    result.append(str(name))

            return result

        except ProviderConnectionError:
            raise

        except requests.Timeout as exc:

            raise ProviderConnectionError(
                "Timeout lors de la récupération des modèles Ollama."
            ) from exc

        except requests.RequestException as exc:

            raise ProviderConnectionError(
                "Impossible de récupérer la liste des modèles Ollama."
            ) from exc

    def model_exists(
        self,
        model: str,
    ) -> bool:

        model = str(model or "").strip()

        if not model:
            return False

        return model in self.list_models()

    # =====================================================
    # GÉNÉRATION CLASSIQUE
    # =====================================================

    def generate(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        stream: bool = False,
        temperature: float | None = None,
        max_tokens: int | None = None,
        **kwargs,
    ):

        if temperature is None:
            temperature = self.default_temperature

        if max_tokens is None:
            max_tokens = self.default_max_tokens

        payload = self._build_payload(
            model=model,
            messages=messages,
            stream=stream,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )

        try:

            logger.info(
                "Requête Ollama | model=%s | stream=%s | "
                "messages=%d | max_tokens=%s | think=%s",
                model,
                stream,
                len(messages),
                max_tokens,
                payload.get("think"),
            )

            response = requests.post(
                self._url(self.API_CHAT),
                json=payload,
                timeout=(
                    self.stream_timeout
                    if stream
                    else self.timeout
                ),
                stream=stream,
            )

            response.raise_for_status()

            # -------------------------------------------------
            # STREAM
            # -------------------------------------------------

            if stream:
                return response

            # -------------------------------------------------
            # JSON
            # -------------------------------------------------

            try:

                data = response.json()

            except ValueError as exc:

                logger.error(
                    "Réponse JSON Ollama invalide | body=%r",
                    response.text[:2000],
                )

                raise ProviderConnectionError(
                    "Ollama a retourné une réponse JSON invalide."
                ) from exc

            if not isinstance(data, dict):

                raise ProviderConnectionError(
                    "Ollama a retourné une réponse invalide."
                )

            if data.get("error"):

                error_message = str(
                    data.get("error")
                )

                raise ProviderConnectionError(
                    f"Ollama a retourné une erreur : "
                    f"{error_message}"
                )

            # -------------------------------------------------
            # DIAGNOSTIC COMPLET
            # -------------------------------------------------

            message = data.get("message")

            if isinstance(message, dict):

                content = str(
                    message.get(
                        "content",
                        "",
                    )
                    or ""
                )

                thinking = str(
                    message.get(
                        "thinking",
                        "",
                    )
                    or ""
                )

                logger.info(
                    "Réponse Ollama reçue | "
                    "model=%s | "
                    "content_chars=%d | "
                    "thinking_chars=%d | "
                    "done=%s | "
                    "done_reason=%s | "
                    "eval_count=%s | "
                    "prompt_eval_count=%s",
                    data.get("model", model),
                    len(content),
                    len(thinking),
                    data.get("done"),
                    data.get("done_reason"),
                    data.get("eval_count"),
                    data.get("prompt_eval_count"),
                )

            else:

                logger.warning(
                    "Réponse Ollama sans objet message | "
                    "model=%s | keys=%s",
                    model,
                    list(data.keys()),
                )

            return data

        except ProviderConnectionError:
            raise

        except requests.Timeout as exc:

            logger.exception(
                "Timeout Ollama | model=%s | timeout=%s",
                model,
                self.timeout,
            )

            raise ProviderConnectionError(
                "Ollama met trop de temps à répondre."
            ) from exc

        except requests.RequestException as exc:

            logger.exception(
                "Erreur HTTP Ollama | model=%s",
                model,
            )

            raise ProviderConnectionError(
                "Erreur lors de la communication avec Ollama."
            ) from exc

    # =====================================================
    # PARSING STREAM
    # =====================================================

    def _parse_stream_line(
        self,
        raw_line: Any,
        model: str,
    ) -> Dict[str, Any] | None:

        if raw_line is None:
            return None

        if isinstance(raw_line, bytes):

            raw_line = raw_line.decode(
                "utf-8",
                errors="replace",
            )

        if isinstance(raw_line, dict):

            data = raw_line

        else:

            line = str(raw_line).strip()

            if not line:
                return None

            try:

                data = json.loads(line)

            except json.JSONDecodeError as exc:

                logger.error(
                    "Chunk JSON Ollama invalide : %r",
                    line[:500],
                )

                raise ProviderConnectionError(
                    "Ollama a envoyé un chunk JSON invalide."
                ) from exc

        if not isinstance(data, dict):
            return None

        if data.get("error"):

            message = str(
                data.get("error")
            )

            raise ProviderConnectionError(
                f"Ollama a retourné une erreur : {message}"
            )

        message = data.get("message")

        if not isinstance(message, dict):
            message = {}

        content = str(
            message.get(
                "content",
                "",
            )
            or ""
        )

        thinking = str(
            message.get(
                "thinking",
                "",
            )
            or ""
        )

        done = bool(
            data.get(
                "done",
                False,
            )
        )

        if content:

            return {
                "type": "chunk",
                "content": content,
                "thinking": thinking,
                "done": False,
                "model": data.get(
                    "model",
                    model,
                ),
                "message": message,
                "raw": data,
            }

        if thinking:

            return {
                "type": "thinking",
                "content": "",
                "thinking": thinking,
                "done": False,
                "model": data.get(
                    "model",
                    model,
                ),
                "message": message,
                "raw": data,
            }

        if done:

            return {
                "type": "done",
                "content": "",
                "thinking": "",
                "done": True,
                "model": data.get(
                    "model",
                    model,
                ),
                "message": message,
                "raw": data,
            }

        return None

    # =====================================================
    # STREAMING
    # =====================================================

    def generate_stream(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        temperature: float | None = None,
        max_tokens: int | None = None,
        **kwargs,
    ) -> Iterator[Dict[str, Any]]:

        if temperature is None:
            temperature = self.default_temperature

        if max_tokens is None:
            max_tokens = self.default_max_tokens

        response = self.generate(
            model=model,
            messages=messages,
            stream=True,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )

        completed = False

        try:

            for raw_line in response.iter_lines(
                decode_unicode=False
            ):

                if raw_line is None:
                    continue

                event = self._parse_stream_line(
                    raw_line,
                    model,
                )

                if event is None:
                    continue

                event_type = event.get("type")

                if event_type in (
                    "chunk",
                    "thinking",
                ):

                    yield event

                elif event_type == "done":

                    completed = True

                    yield event

                    logger.info(
                        "Streaming Ollama terminé | model=%s",
                        event.get(
                            "model",
                            model,
                        ),
                    )

                    break

        except ProviderConnectionError:
            raise

        except requests.Timeout as exc:

            raise ProviderConnectionError(
                "Le streaming Ollama a dépassé "
                "le délai autorisé."
            ) from exc

        except requests.RequestException as exc:

            logger.exception(
                "Erreur réseau pendant le streaming Ollama."
            )

            raise ProviderConnectionError(
                "La connexion au streaming Ollama "
                "a été interrompue."
            ) from exc

        finally:

            try:
                response.close()

            except Exception:

                logger.debug(
                    "Impossible de fermer "
                    "la réponse Ollama.",
                    exc_info=True,
                )

        if not completed:

            logger.warning(
                "Flux Ollama terminé sans événement done | "
                "model=%s",
                model,
            )

    # =====================================================
    # STREAMING TEXTE
    # =====================================================

    def stream_text(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        temperature: float | None = None,
        max_tokens: int | None = None,
        **kwargs,
    ) -> Iterator[str]:

        for event in self.generate_stream(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        ):

            if event.get("type") != "chunk":
                continue

            content = event.get(
                "content",
                "",
            )

            if content:
                yield str(content)

    # =====================================================
    # INFO
    # =====================================================

    def info(self) -> Dict[str, Any]:

        return {
            "provider": "ollama",
            "base_url": self.base_url,
            "timeout": self.timeout,
            "health_timeout": self.health_timeout,
            "stream_timeout": self.stream_timeout,
            "default_temperature": self.default_temperature,
            "default_max_tokens": self.default_max_tokens,
        }