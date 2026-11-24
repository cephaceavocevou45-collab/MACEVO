from __future__ import annotations

import os
from typing import Any, Dict, Iterable, Iterator, Optional

from core.ai.providers.base import BaseAIProvider


class OpenAIProvider(BaseAIProvider):
    """
    Provider OpenAI pour MACEVO IA.

    Responsabilités :
    - communication avec l'API OpenAI ;
    - génération synchrone ;
    - streaming ;
    - gestion de la clé API ;
    - normalisation des réponses ;
    - gestion des modèles ;
    - prise en charge des outils ;
    - vérification de disponibilité du service.

    La clé API n'est jamais stockée dans le code.
    Elle est récupérée depuis OPENAI_API_KEY.

    Particularité :
    certains modèles OpenAI récents n'acceptent pas le paramètre
    `temperature`. Le provider détecte cette contrainte à partir
    de la configuration du modèle et n'envoie donc pas ce paramètre
    lorsqu'il n'est pas supporté.
    """

    provider_name = "openai"

    DEFAULT_MODEL = "gpt-5.6-luna"

    # Modèles connus de MACEVO qui ne doivent pas recevoir
    # le paramètre `temperature` via Responses API.
    MODELS_WITHOUT_TEMPERATURE = {
        "gpt-5.6-luna",
    }

    def __init__(
        self,
        model: Optional[str] = None,
        *,
        api_key: Optional[str] = None,
        timeout: int = 120,
        base_url: Optional[str] = None,
        organization: Optional[str] = None,
        project: Optional[str] = None,
        **kwargs: Any,
    ):
        super().__init__(
            model=model or os.getenv(
                "OPENAI_MODEL",
                self.DEFAULT_MODEL,
            ),
            timeout=timeout,
            **kwargs,
        )

        self.api_key = (
            api_key
            or os.getenv("OPENAI_API_KEY")
            or ""
        ).strip()

        self.base_url = (
            base_url
            or os.getenv("OPENAI_BASE_URL")
            or None
        )

        self.organization = (
            organization
            or os.getenv("OPENAI_ORGANIZATION")
            or None
        )

        self.project = (
            project
            or os.getenv("OPENAI_PROJECT")
            or None
        )

        self._client = None

    # ============================================================
    # CLIENT
    # ============================================================

    def _get_client(self):
        """
        Initialise paresseusement le client OpenAI.

        Le SDK n'est importé que lorsque le provider est réellement
        utilisé.
        """

        if self._client is not None:
            return self._client

        if not self.api_key:
            raise RuntimeError(
                "OPENAI_API_KEY n'est pas configurée."
            )

        try:
            from openai import OpenAI
        except ImportError as exc:
            raise RuntimeError(
                "Le package 'openai' n'est pas installé. "
                "Installez-le avec : pip install openai"
            ) from exc

        client_kwargs: Dict[str, Any] = {
            "api_key": self.api_key,
            "timeout": self.timeout,
        }

        if self.base_url:
            client_kwargs["base_url"] = self.base_url

        if self.organization:
            client_kwargs["organization"] = self.organization

        if self.project:
            client_kwargs["project"] = self.project

        self._client = OpenAI(**client_kwargs)

        return self._client

    # ============================================================
    # PARAMETRES MODELE
    # ============================================================

    def _supports_temperature(
        self,
        model: Optional[str] = None,
    ) -> bool:
        """
        Indique si le modèle doit recevoir `temperature`.

        Les modèles explicitement connus comme n'acceptant pas
        ce paramètre sont exclus.

        Le comportement est centralisé ici afin que generate()
        et stream() restent cohérents.
        """

        resolved_model = (
            model
            or self.model
            or self.DEFAULT_MODEL
        )

        normalized_model = (
            str(resolved_model)
            .strip()
            .lower()
        )

        return normalized_model not in {
            model_name.lower()
            for model_name in self.MODELS_WITHOUT_TEMPERATURE
        }

    def _apply_generation_parameters(
        self,
        request_kwargs: Dict[str, Any],
        *,
        model: str,
        temperature: Optional[float],
        max_tokens: Optional[int],
    ) -> None:
        """
        Ajoute les paramètres de génération compatibles
        avec le modèle utilisé.
        """

        if max_tokens is not None:
            request_kwargs["max_output_tokens"] = int(
                max_tokens
            )

        if (
            temperature is not None
            and self._supports_temperature(model)
        ):
            request_kwargs["temperature"] = float(
                temperature
            )

    # ============================================================
    # NORMALISATION DES MESSAGES
    # ============================================================

    def _normalize_messages(
        self,
        messages: Iterable[Dict[str, Any]],
    ) -> list[Dict[str, Any]]:
        """
        Normalise les messages MACEVO vers le format attendu
        par l'API OpenAI.
        """

        normalized: list[Dict[str, Any]] = []

        for message in messages:
            if not isinstance(message, dict):
                raise TypeError(
                    "Chaque message doit être un dictionnaire."
                )

            role = str(
                message.get("role", "")
            ).strip().lower()

            content = message.get(
                "content",
                "",
            )

            if role not in {
                "system",
                "user",
                "assistant",
                "developer",
                "tool",
            }:
                role = "user"

            item: Dict[str, Any] = {
                "role": role,
                "content": content,
            }

            if message.get("name"):
                item["name"] = message["name"]

            if message.get("tool_call_id"):
                item["tool_call_id"] = (
                    message["tool_call_id"]
                )

            if message.get("tool_calls"):
                item["tool_calls"] = (
                    message["tool_calls"]
                )

            normalized.append(item)

        return normalized

    # ============================================================
    # OUTILS
    # ============================================================

    def _normalize_tools(
        self,
        tools: Optional[list],
    ) -> Optional[list]:
        """
        Normalise les outils MACEVO.

        Les outils déjà conformes au format OpenAI sont transmis
        directement.
        """

        if not tools:
            return None

        normalized = []

        for tool in tools:
            if isinstance(tool, dict):
                normalized.append(tool)
                continue

            if hasattr(tool, "to_definition"):
                normalized.append(
                    tool.to_definition()
                )
                continue

            raise TypeError(
                "Format d'outil OpenAI non supporté."
            )

        return normalized

    # ============================================================
    # EXTRACTION REPONSE
    # ============================================================

    def _extract_response_text(
        self,
        response: Any,
    ) -> str:
        """
        Extrait le texte d'une réponse OpenAI.

        Le SDK récent expose directement output_text.
        """

        output_text = getattr(
            response,
            "output_text",
            None,
        )

        if output_text is not None:
            return str(output_text)

        output = getattr(
            response,
            "output",
            None,
        )

        if not output:
            return ""

        parts: list[str] = []

        for item in output:
            content_items = getattr(
                item,
                "content",
                None,
            )

            if not content_items:
                continue

            for content in content_items:
                text = getattr(
                    content,
                    "text",
                    None,
                )

                if text:
                    parts.append(str(text))

        return "".join(parts)

    def _extract_usage(
        self,
        response: Any,
    ) -> Dict[str, Any]:
        """
        Convertit l'utilisation OpenAI vers le format MACEVO.
        """

        usage = getattr(
            response,
            "usage",
            None,
        )

        if usage is None:
            return {}

        result: Dict[str, Any] = {}

        for source_name, target_name in (
            ("input_tokens", "prompt_tokens"),
            ("output_tokens", "completion_tokens"),
            ("total_tokens", "total_tokens"),
        ):
            value = getattr(
                usage,
                source_name,
                None,
            )

            if value is not None:
                result[target_name] = int(value)

        return result

    def _extract_tool_calls(
        self,
        response: Any,
    ) -> list:
        """
        Extrait les éventuels appels d'outils.
        """

        output = getattr(
            response,
            "output",
            None,
        )

        if not output:
            return []

        tool_calls = []

        for item in output:
            item_type = getattr(
                item,
                "type",
                None,
            )

            if item_type in {
                "function_call",
                "tool_call",
            }:
                if hasattr(
                    item,
                    "model_dump",
                ):
                    tool_calls.append(
                        item.model_dump()
                    )
                elif hasattr(
                    item,
                    "to_dict",
                ):
                    tool_calls.append(
                        item.to_dict()
                    )
                else:
                    tool_calls.append(item)

        return tool_calls

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
        Génération synchrone via OpenAI Responses API.
        """

        resolved_model = self.normalize_model(model)

        normalized_messages = (
            self._normalize_messages(messages)
        )

        normalized_tools = (
            self._normalize_tools(tools)
        )

        request_kwargs: Dict[str, Any] = {
            "model": resolved_model,
            "input": normalized_messages,
        }

        # --------------------------------------------------------
        # Instructions
        # --------------------------------------------------------

        instructions = kwargs.get("instructions")

        if instructions:
            request_kwargs["instructions"] = instructions

        # --------------------------------------------------------
        # Paramètres de génération
        # --------------------------------------------------------

        self._apply_generation_parameters(
            request_kwargs,
            model=resolved_model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        # --------------------------------------------------------
        # Outils
        # --------------------------------------------------------

        if normalized_tools:
            request_kwargs["tools"] = normalized_tools

        # --------------------------------------------------------
        # Métadonnées
        # --------------------------------------------------------

        if metadata:
            request_kwargs["metadata"] = {
                str(key): str(value)
                for key, value in metadata.items()
            }

        # --------------------------------------------------------
        # Paramètres additionnels
        # --------------------------------------------------------

        excluded = {
            "instructions",
            "think",
        }

        for key, value in kwargs.items():
            if (
                key not in excluded
                and value is not None
                and key not in request_kwargs
            ):
                request_kwargs[key] = value

        try:
            response = (
                self._get_client()
                .responses
                .create(**request_kwargs)
            )

        except Exception as exc:
            raise RuntimeError(
                f"Erreur OpenAI : {exc}"
            ) from exc

        content = self._extract_response_text(
            response
        )

        tool_calls = self._extract_tool_calls(
            response
        )

        return {
            "content": content,
            "thinking": "",
            "tool_calls": tool_calls,
            "usage": self._extract_usage(response),
            "model": getattr(
                response,
                "model",
                resolved_model,
            ),
            "provider": self.provider_name,
            "response_id": getattr(
                response,
                "id",
                None,
            ),
            "raw": response,
        }

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
        Streaming OpenAI.

        Chaque événement textuel est normalisé vers :

            {
                "content": "...",
                "done": False
            }

        Le dernier événement contient :

            {
                "content": "",
                "done": True
            }
        """

        resolved_model = self.normalize_model(model)

        normalized_messages = (
            self._normalize_messages(messages)
        )

        normalized_tools = (
            self._normalize_tools(tools)
        )

        request_kwargs: Dict[str, Any] = {
            "model": resolved_model,
            "input": normalized_messages,
            "stream": True,
        }

        # --------------------------------------------------------
        # Instructions
        # --------------------------------------------------------

        instructions = kwargs.get("instructions")

        if instructions:
            request_kwargs["instructions"] = instructions

        # --------------------------------------------------------
        # Paramètres de génération
        # --------------------------------------------------------

        self._apply_generation_parameters(
            request_kwargs,
            model=resolved_model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        # --------------------------------------------------------
        # Outils
        # --------------------------------------------------------

        if normalized_tools:
            request_kwargs["tools"] = normalized_tools

        # --------------------------------------------------------
        # Métadonnées
        # --------------------------------------------------------

        if metadata:
            request_kwargs["metadata"] = {
                str(key): str(value)
                for key, value in metadata.items()
            }

        # --------------------------------------------------------
        # Paramètres additionnels
        # --------------------------------------------------------

        excluded = {
            "instructions",
            "think",
        }

        for key, value in kwargs.items():
            if (
                key not in excluded
                and value is not None
                and key not in request_kwargs
            ):
                request_kwargs[key] = value

        try:
            stream_response = (
                self._get_client()
                .responses
                .create(**request_kwargs)
            )

            for event in stream_response:
                event_type = getattr(
                    event,
                    "type",
                    "",
                )

                if (
                    event_type
                    == "response.output_text.delta"
                ):
                    delta = getattr(
                        event,
                        "delta",
                        "",
                    )

                    if delta:
                        yield {
                            "content": str(delta),
                            "thinking": "",
                            "done": False,
                            "provider": self.provider_name,
                            "model": resolved_model,
                        }

                elif (
                    event_type
                    == "response.completed"
                ):
                    response = getattr(
                        event,
                        "response",
                        None,
                    )

                    yield {
                        "content": "",
                        "thinking": "",
                        "done": True,
                        "provider": self.provider_name,
                        "model": (
                            getattr(
                                response,
                                "model",
                                resolved_model,
                            )
                            if response
                            else resolved_model
                        ),
                        "usage": (
                            self._extract_usage(response)
                            if response
                            else {}
                        ),
                    }

        except Exception as exc:
            raise RuntimeError(
                f"Erreur streaming OpenAI : {exc}"
            ) from exc

    # ============================================================
    # HEALTH CHECK
    # ============================================================

    def health_check(self) -> bool:
        """
        Vérifie que la clé et le client OpenAI sont utilisables.

        Cette méthode effectue une requête légère sur la liste
        des modèles.
        """

        try:
            client = self._get_client()

            client.models.list()

            return True

        except Exception:
            return False

    # ============================================================
    # MODELES
    # ============================================================

    def list_models(self) -> list:
        """
        Retourne les modèles accessibles avec la clé actuelle.
        """

        client = self._get_client()

        try:
            response = client.models.list()
        except Exception as exc:
            raise RuntimeError(
                "Impossible de récupérer les modèles "
                f"OpenAI : {exc}"
            ) from exc

        models = []

        data = getattr(
            response,
            "data",
            [],
        )

        for model in data:
            model_id = getattr(
                model,
                "id",
                None,
            )

            if model_id:
                models.append(str(model_id))

        return sorted(models)

    # ============================================================
    # CAPACITES
    # ============================================================

    def supports(
        self,
        capability: str,
    ) -> bool:
        """
        Indique les capacités générales supportées.

        La disponibilité exacte peut dépendre du modèle.
        """

        capability = str(
            capability or ""
        ).strip().lower()

        return capability in {
            "text",
            "chat",
            "streaming",
            "tools",
            "function_calling",
            "vision",
            "reasoning",
            "analysis",
        }

    # ============================================================
    # INFORMATIONS
    # ============================================================

    def get_info(self) -> Dict[str, Any]:
        info = super().get_info()

        info.update(
            {
                "provider": self.provider_name,
                "model": self.model,
                "base_url": self.base_url,
                "organization": self.organization,
                "project": self.project,
                "api_key_configured": bool(
                    self.api_key
                ),
                "temperature_supported": (
                    self._supports_temperature(
                        self.model
                    )
                ),
                "capabilities": {
                    "text": True,
                    "streaming": True,
                    "tools": True,
                    "function_calling": True,
                    "vision": True,
                    "reasoning": True,
                    "analysis": True,
                },
            }
        )

        return info

    # ============================================================
    # REPRESENTATION
    # ============================================================

    def __repr__(self) -> str:
        return (
            "OpenAIProvider("
            f"provider={self.provider_name!r}, "
            f"model={self.model!r}, "
            f"api_key_configured="
            f"{bool(self.api_key)!r}"
            ")"
        )