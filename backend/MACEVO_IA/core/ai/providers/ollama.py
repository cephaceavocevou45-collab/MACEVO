from __future__ import annotations

import json
import os
from typing import Any, Dict, Iterable, Iterator, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from core.ai.providers.base import BaseAIProvider


class OllamaProvider(BaseAIProvider):
    """
    Provider Ollama officiel de MACEVO IA.

    Responsabilités :
    - génération complète ;
    - streaming ;
    - health check ;
    - découverte des modèles ;
    - déclaration des capacités ;
    - gestion du mode thinking de Qwen ;
    - normalisation des paramètres Ollama ;
    - protection contre les problèmes d'encodage UTF-8/mojibake.

    Le provider ne contient aucune logique métier MACEVO.
    Il sert uniquement d'adaptateur entre MACEVO IA et Ollama.
    """

    provider_name = "ollama"

    DEFAULT_BASE_URL = "http://127.0.0.1:11434"
    DEFAULT_MODEL = "qwen3:1.7b"
    DEFAULT_TIMEOUT = 120

    def __init__(
        self,
        model: Optional[str] = None,
        *,
        timeout: int = DEFAULT_TIMEOUT,
        base_url: Optional[str] = None,
        think: bool = False,
        **kwargs: Any,
    ) -> None:
        self.base_url = (
            base_url
            or os.getenv(
                "OLLAMA_BASE_URL",
                self.DEFAULT_BASE_URL,
            )
        ).rstrip("/")

        resolved_model = (
            model
            or os.getenv(
                "OLLAMA_MODEL",
                self.DEFAULT_MODEL,
            )
        )

        self.think = bool(think)

        super().__init__(
            model=resolved_model,
            timeout=timeout,
            base_url=self.base_url,
            think=self.think,
            **kwargs,
        )

    # ============================================================
    # GENERATION
    # ============================================================

    def generate(
        self,
        messages: Iterable[Dict[str, Any]],
        *,
        model: Optional[str] = None,
        temperature: float = 0.4,
        max_tokens: int = 4096,
        tools: Optional[list] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Génère une réponse complète via /api/chat.

        Le mode thinking est désactivé par défaut afin d'éviter
        que Qwen consomme toute la limite de sortie dans le champ
        `thinking` sans produire de contenu final.
        """

        resolved_model = self.normalize_model(model)

        normalized_messages = self._normalize_messages(
            messages
        )

        payload = self._build_payload(
            model=resolved_model,
            messages=normalized_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            tools=tools,
            metadata=metadata,
            stream=False,
            kwargs=kwargs,
        )

        response = self._post_json(
            "/api/chat",
            payload,
        )

        return self._normalize_response(
            response
        )

    # ============================================================
    # STREAMING
    # ============================================================

    def stream(
        self,
        messages: Iterable[Dict[str, Any]],
        *,
        model: Optional[str] = None,
        temperature: float = 0.4,
        max_tokens: int = 4096,
        tools: Optional[list] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Iterator[Dict[str, Any]]:
        """
        Génère une réponse Ollama en streaming.

        Chaque élément retourné correspond à un événement JSON
        décodé depuis le flux HTTP.
        """

        resolved_model = self.normalize_model(model)

        normalized_messages = self._normalize_messages(
            messages
        )

        payload = self._build_payload(
            model=resolved_model,
            messages=normalized_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            tools=tools,
            metadata=metadata,
            stream=True,
            kwargs=kwargs,
        )

        yield from self._stream_json_lines(
            "/api/chat",
            payload,
        )

    # ============================================================
    # HEALTH
    # ============================================================

    def health_check(self) -> bool:
        """
        Vérifie que le serveur Ollama répond.
        """

        try:
            response = self._get_json(
                "/api/tags"
            )

            return isinstance(
                response,
                dict,
            )

        except Exception:
            return False

    # ============================================================
    # MODELES
    # ============================================================

    def list_models(self) -> list:
        """
        Retourne les modèles disponibles dans Ollama.
        """

        response = self._get_json(
            "/api/tags"
        )

        models = response.get(
            "models",
            [],
        )

        if not isinstance(models, list):
            return []

        return models

    # ============================================================
    # CAPACITES
    # ============================================================

    def supports(
        self,
        capability: str,
    ) -> bool:
        """
        Indique si Ollama supporte une capacité donnée.
        """

        capability = str(
            capability or ""
        ).strip().lower()

        supported = {
            "text",
            "chat",
            "completion",
            "streaming",
            "stream",
            "tools",
            "tool",
            "function_calling",
            "thinking",
        }

        return capability in supported

    # ============================================================
    # INFORMATIONS
    # ============================================================

    def get_info(self) -> Dict[str, Any]:
        """
        Informations publiques du provider.
        """

        return {
            "provider": self.provider_name,
            "model": self.model,
            "base_url": self.base_url,
            "timeout": self.timeout,
            "think": self.think,
            "capabilities": [
                "text",
                "chat",
                "streaming",
                "tools",
                "thinking",
            ],
        }

    # ============================================================
    # PAYLOAD
    # ============================================================

    def _build_payload(
        self,
        *,
        model: str,
        messages: list[Dict[str, Any]],
        temperature: float,
        max_tokens: int,
        tools: Optional[list],
        metadata: Optional[Dict[str, Any]],
        stream: bool,
        kwargs: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Construit le payload officiel envoyé à Ollama.
        """

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": stream,

            # Désactivé par défaut pour que Qwen retourne
            # directement son contenu final.
            "think": self.think,

            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        if tools:
            payload["tools"] = tools

        if metadata:
            payload["metadata"] = metadata

        extra_options = kwargs.get(
            "options"
        )

        if isinstance(
            extra_options,
            dict,
        ):
            payload["options"].update(
                extra_options
            )

        for key in (
            "top_p",
            "top_k",
            "min_p",
            "repeat_penalty",
            "seed",
            "num_ctx",
            "num_batch",
            "stop",
        ):
            if key in kwargs:
                payload["options"][key] = kwargs[key]

        if "think" in kwargs:
            payload["think"] = bool(
                kwargs["think"]
            )

        return payload

    # ============================================================
    # NORMALISATION MESSAGES
    # ============================================================

    def _normalize_messages(
        self,
        messages: Iterable[Dict[str, Any]],
    ) -> list[Dict[str, Any]]:
        """
        Normalise les messages avant envoi à Ollama.

        Le contenu est conservé en Unicode Python natif.
        """

        normalized: list[Dict[str, Any]] = []

        for message in messages:

            if not isinstance(
                message,
                dict,
            ):
                raise TypeError(
                    "Chaque message doit être un dictionnaire."
                )

            role = str(
                message.get(
                    "role",
                    "",
                )
            ).strip().lower()

            if not role:
                raise ValueError(
                    "Un message Ollama doit contenir un rôle."
                )

            content = message.get(
                "content",
                "",
            )

            if content is None:
                content = ""

            item: Dict[str, Any] = {
                "role": role,
                "content": self._repair_mojibake(
                    str(content)
                ),
            }

            if "name" in message:
                item["name"] = message["name"]

            if "tool_call_id" in message:
                item["tool_call_id"] = (
                    message["tool_call_id"]
                )

            if "tool_calls" in message:
                item["tool_calls"] = (
                    message["tool_calls"]
                )

            normalized.append(item)

        return normalized

    # ============================================================
    # NORMALISATION REPONSE
    # ============================================================

    def _normalize_response(
        self,
        response: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Normalise la réponse Ollama tout en conservant
        les autres informations retournées par le serveur.

        Le contenu final est systématiquement contrôlé contre
        les formes classiques de mojibake UTF-8.
        """

        if not isinstance(
            response,
            dict,
        ):
            raise RuntimeError(
                "Ollama a retourné une réponse invalide."
            )

        normalized = dict(response)

        message = response.get(
            "message"
        )

        if not isinstance(
            message,
            dict,
        ):
            message = {}

        normalized_message = dict(
            message
        )

        content = normalized_message.get(
            "content",
            "",
        )

        thinking = normalized_message.get(
            "thinking",
            "",
        )

        if content is None:
            content = ""

        if thinking is None:
            thinking = ""

        content = self._repair_mojibake(
            str(content)
        )

        thinking = self._repair_mojibake(
            str(thinking)
        )

        normalized_message["content"] = content
        normalized_message["thinking"] = thinking

        normalized["message"] = normalized_message
        normalized["content"] = content
        normalized["thinking"] = thinking

        return normalized

    # ============================================================
    # REPARATION UTF-8 / MOJIBAKE
    # ============================================================

    @staticmethod
    def _repair_mojibake(
        value: str,
    ) -> str:
        """
        Répare uniquement les chaînes qui présentent des signes
        caractéristiques d'un UTF-8 interprété comme Latin-1.

        Exemple :

            hypothÃ¨se
            phÃ©nomÃ¨ne
            rÃ©ponse

        devient :

            hypothèse
            phénomène
            réponse

        Une chaîne Unicode normale n'est pas modifiée.
        """

        if not isinstance(
            value,
            str,
        ):
            return value

        if not value:
            return value

        # Marqueurs très caractéristiques du mojibake UTF-8.
        markers = (
            "Ã",
            "Â",
            "â€",
            "â€™",
            "â€œ",
            "â€",
            "â€“",
            "â€”",
            "â€¦",
            "ðŸ",
            "ï»¿",
        )

        if not any(
            marker in value
            for marker in markers
        ):
            return value

        try:
            repaired = value.encode(
                "latin-1"
            ).decode(
                "utf-8"
            )
        except (
            UnicodeEncodeError,
            UnicodeDecodeError,
        ):
            return value

        if not repaired:
            return value

        # On ne conserve la réparation que si elle réduit
        # effectivement les marqueurs de corruption.
        original_score = sum(
            value.count(marker)
            for marker in markers
        )

        repaired_score = sum(
            repaired.count(marker)
            for marker in markers
        )

        if repaired_score < original_score:
            return repaired

        return value

    # ============================================================
    # HTTP POST
    # ============================================================

    def _post_json(
        self,
        path: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Envoie une requête JSON POST à Ollama.

        Le corps est explicitement encodé en UTF-8.
        La réponse HTTP est décodée explicitement en UTF-8
        avant json.loads().
        """

        url = (
            f"{self.base_url}"
            f"{path}"
        )

        body = json.dumps(
            payload,
            ensure_ascii=False,
        ).encode(
            "utf-8"
        )

        request = Request(
            url,
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
            },
        )

        try:
            with urlopen(
                request,
                timeout=self.timeout,
            ) as response:

                raw = response.read()

        except HTTPError as exc:

            error_body = self._read_error_body(
                exc
            )

            raise RuntimeError(
                "Ollama a retourné une erreur HTTP "
                f"{exc.code}: {error_body}"
            ) from exc

        except URLError as exc:

            raise RuntimeError(
                "Impossible de contacter Ollama : "
                f"{exc.reason}"
            ) from exc

        except TimeoutError as exc:

            raise RuntimeError(
                "Le délai d'attente vers Ollama "
                f"a expiré après {self.timeout} secondes."
            ) from exc

        except OSError as exc:

            raise RuntimeError(
                "Erreur réseau lors de la communication "
                f"avec Ollama : {exc}"
            ) from exc

        decoded = self._decode_utf8(
            raw
        )

        try:
            data = json.loads(
                decoded
            )

        except json.JSONDecodeError as exc:

            raise RuntimeError(
                "Ollama a retourné une réponse JSON invalide."
            ) from exc

        if not isinstance(
            data,
            dict,
        ):
            raise RuntimeError(
                "Ollama a retourné un JSON inattendu."
            )

        return data

    # ============================================================
    # HTTP GET
    # ============================================================

    def _get_json(
        self,
        path: str,
    ) -> Dict[str, Any]:
        """
        Envoie une requête GET JSON à Ollama.
        """

        url = (
            f"{self.base_url}"
            f"{path}"
        )

        request = Request(
            url,
            method="GET",
            headers={
                "Accept": "application/json",
            },
        )

        try:
            with urlopen(
                request,
                timeout=self.timeout,
            ) as response:

                raw = response.read()

        except HTTPError as exc:

            error_body = self._read_error_body(
                exc
            )

            raise RuntimeError(
                "Ollama a retourné une erreur HTTP "
                f"{exc.code}: {error_body}"
            ) from exc

        except URLError as exc:

            raise RuntimeError(
                "Impossible de contacter Ollama : "
                f"{exc.reason}"
            ) from exc

        except TimeoutError as exc:

            raise RuntimeError(
                "Le délai d'attente vers Ollama "
                f"a expiré après {self.timeout} secondes."
            ) from exc

        except OSError as exc:

            raise RuntimeError(
                "Erreur réseau lors de la communication "
                f"avec Ollama : {exc}"
            ) from exc

        decoded = self._decode_utf8(
            raw
        )

        try:
            data = json.loads(
                decoded
            )

        except json.JSONDecodeError as exc:

            raise RuntimeError(
                "Ollama a retourné une réponse JSON invalide."
            ) from exc

        if not isinstance(
            data,
            dict,
        ):
            raise RuntimeError(
                "Ollama a retourné un JSON inattendu."
            )

        return data

    # ============================================================
    # DECODAGE UTF-8
    # ============================================================

    @staticmethod
    def _decode_utf8(
        raw: bytes,
    ) -> str:
        """
        Décode explicitement les octets HTTP en UTF-8.

        Ollama utilise JSON/UTF-8. Une erreur de décodage est
        volontairement remontée plutôt que de remplacer silencieusement
        les caractères invalides.
        """

        if not isinstance(
            raw,
            bytes,
        ):
            raise TypeError(
                "La réponse HTTP doit être de type bytes."
            )

        try:
            return raw.decode(
                "utf-8"
            )

        except UnicodeDecodeError as exc:

            raise RuntimeError(
                "La réponse Ollama n'est pas encodée "
                "correctement en UTF-8."
            ) from exc

    # ============================================================
    # STREAM HTTP
    # ============================================================

    def _stream_json_lines(
        self,
        path: str,
        payload: Dict[str, Any],
    ) -> Iterator[Dict[str, Any]]:
        """
        Lit le flux JSON Lines produit par Ollama.
        """

        url = (
            f"{self.base_url}"
            f"{path}"
        )

        body = json.dumps(
            payload,
            ensure_ascii=False,
        ).encode(
            "utf-8"
        )

        request = Request(
            url,
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/x-ndjson",
            },
        )

        try:
            with urlopen(
                request,
                timeout=self.timeout,
            ) as response:

                for raw_line in response:

                    line = raw_line.strip()

                    if not line:
                        continue

                    try:
                        decoded = self._decode_utf8(
                            line
                        )

                        data = json.loads(
                            decoded
                        )

                    except (
                        RuntimeError,
                        json.JSONDecodeError,
                    ):
                        continue

                    if isinstance(
                        data,
                        dict,
                    ):
                        yield self._normalize_stream_response(
                            data
                        )

        except HTTPError as exc:

            error_body = self._read_error_body(
                exc
            )

            raise RuntimeError(
                "Ollama a retourné une erreur HTTP "
                f"{exc.code}: {error_body}"
            ) from exc

        except URLError as exc:

            raise RuntimeError(
                "Impossible de contacter Ollama : "
                f"{exc.reason}"
            ) from exc

        except TimeoutError as exc:

            raise RuntimeError(
                "Le streaming Ollama a dépassé "
                f"le délai de {self.timeout} secondes."
            ) from exc

        except OSError as exc:

            raise RuntimeError(
                "Erreur réseau pendant le streaming Ollama : "
                f"{exc}"
            ) from exc

    # ============================================================
    # NORMALISATION STREAM
    # ============================================================

    def _normalize_stream_response(
        self,
        response: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Répare uniquement les champs textuels susceptibles d'avoir
        subi une corruption d'encodage.
        """

        normalized = dict(
            response
        )

        message = response.get(
            "message"
        )

        if isinstance(
            message,
            dict,
        ):
            normalized_message = dict(
                message
            )

            if "content" in normalized_message:
                normalized_message["content"] = (
                    self._repair_mojibake(
                        str(
                            normalized_message["content"]
                            or ""
                        )
                    )
                )

            if "thinking" in normalized_message:
                normalized_message["thinking"] = (
                    self._repair_mojibake(
                        str(
                            normalized_message["thinking"]
                            or ""
                        )
                    )
                )

            normalized["message"] = normalized_message

        if "content" in normalized:
            normalized["content"] = (
                self._repair_mojibake(
                    str(
                        normalized["content"]
                        or ""
                    )
                )
            )

        if "thinking" in normalized:
            normalized["thinking"] = (
                self._repair_mojibake(
                    str(
                        normalized["thinking"]
                        or ""
                    )
                )
            )

        return normalized

    # ============================================================
    # ERREURS HTTP
    # ============================================================

    @staticmethod
    def _read_error_body(
        error: HTTPError,
    ) -> str:
        """
        Essaie de récupérer le message d'erreur retourné
        par Ollama.
        """

        try:
            raw = error.read()

            if not raw:
                return ""

            return raw.decode(
                "utf-8",
                errors="replace",
            )

        except Exception:
            return ""

    # ============================================================
    # REPRESENTATION
    # ============================================================

    def __repr__(self) -> str:
        return (
            "OllamaProvider("
            f"model={self.model!r}, "
            f"base_url={self.base_url!r}, "
            f"think={self.think!r}"
            ")"
        )