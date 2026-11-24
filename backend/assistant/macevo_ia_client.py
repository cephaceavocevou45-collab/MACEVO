import json
from collections.abc import Iterator
from typing import Any

import requests
from django.conf import settings


class MacevoIAClient:
    """Client interne du moteur MACEVO_IA."""

    @classmethod
    def _request_data(
        cls,
        messages: list[dict[str, Any]],
        *,
        user_id: Any,
        conversation_id: Any,
        project_id: Any = None,
        stream: bool,
    ) -> dict[str, Any]:
        normalized_messages = []
        for item in messages:
            role = str(item.get("role", "")).strip().lower()
            content = item.get("content", "")
            if role not in {"system", "user", "assistant", "tool"}:
                continue
            if role == "tool":
                role = "assistant"
            normalized_messages.append({
                "role": role,
                "content": str(content or ""),
            })

        if not normalized_messages:
            raise ValueError("Aucun message utilisable pour MACEVO_IA.")

        last_user_message = next(
            (item["content"] for item in reversed(normalized_messages) if item["role"] == "user"),
            normalized_messages[-1]["content"],
        )

        metadata = {"source": "macevo_assistant"}
        if conversation_id is not None:
            metadata["external_conversation_id"] = str(conversation_id)
        if project_id is not None:
            metadata["project_id"] = str(project_id)

        return {
            "message": last_user_message or "Réponds au contexte fourni.",
            "messages": normalized_messages,
            # Le backend applicatif est la source de vérité de l'historique.
            # Ne pas demander à MACEVO_IA de persister la même conversation :
            # ses UUID internes ne sont pas les identifiants entiers locaux
            # du backend et les historiques complets sont déjà transmis ici.
            "user_id": str(user_id) if user_id is not None else None,
            "conversation_id": None,
            "stream": stream,
            "metadata": metadata,
        }

    @classmethod
    def _request(cls, *, stream: bool = False):
        base_url = getattr(settings, "MACEVO_IA_BASE_URL", "").rstrip("/")
        if not base_url:
            raise RuntimeError("MACEVO_IA_BASE_URL n'est pas configurée.")

        headers = {"Accept": "application/x-ndjson" if stream else "application/json"}
        service_token = getattr(settings, "MACEVO_IA_SERVICE_TOKEN", "")
        if service_token:
            headers["X-MACEVO-IA-TOKEN"] = service_token
        elif not getattr(settings, "DEBUG", False):
            raise RuntimeError(
                "MACEVO_IA_SERVICE_TOKEN doit être configuré "
                "pour les échanges backend en production."
            )
        return f"{base_url}/api/ai/chat/", headers

    @classmethod
    def chat(
        cls,
        *,
        messages: list[dict[str, Any]],
        user_id: Any = None,
        conversation_id: Any = None,
        project_id: Any = None,
    ) -> str:
        url, headers = cls._request()
        response = requests.post(
            url,
            json=cls._request_data(
                messages,
                user_id=user_id,
                conversation_id=conversation_id,
                project_id=project_id,
                stream=False,
            ),
            headers=headers,
            timeout=getattr(settings, "MACEVO_IA_TIMEOUT", 120),
        )
        response.raise_for_status()
        body = response.json()
        if not body.get("success"):
            errors = body.get("errors") or ["MACEVO_IA a refusé la requête."]
            raise RuntimeError(" ".join(map(str, errors)))

        data = body.get("data")
        if isinstance(data, dict):
            data = data.get("content") or data.get("text") or data.get("answer")
        if not isinstance(data, str) or not data.strip():
            raise RuntimeError("MACEVO_IA n'a retourné aucun texte.")
        return data.strip()

    @classmethod
    def stream_chat(
        cls,
        *,
        messages: list[dict[str, Any]],
        user_id: Any = None,
        conversation_id: Any = None,
        project_id: Any = None,
    ) -> Iterator[dict[str, Any]]:
        url, headers = cls._request(stream=True)
        response = requests.post(
            url,
            json=cls._request_data(
                messages,
                user_id=user_id,
                conversation_id=conversation_id,
                project_id=project_id,
                stream=True,
            ),
            headers=headers,
            stream=True,
            timeout=(10, getattr(settings, "MACEVO_IA_TIMEOUT", 120)),
        )
        try:
            response.raise_for_status()
            for line in response.iter_lines(decode_unicode=True):
                if not line:
                    continue
                try:
                    event = json.loads(line)
                except (TypeError, json.JSONDecodeError):
                    yield {"type": "content", "content": str(line)}
                    continue
                if event.get("type") == "error":
                    yield {
                        "type": "error",
                        "message": event.get("error") or event.get("message") or "Erreur MACEVO_IA.",
                    }
                    return
                yield event
        finally:
            response.close()
