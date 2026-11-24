from __future__ import annotations

import json
import hmac
from typing import Any, Iterable, Iterator

from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.renderers import BaseRenderer, JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from core.ai.contracts.request import AIRequest
from core.ai.service import AIService

from .serializers import (
    ChatRequestSerializer,
    ChatResponseSerializer,
)


ACADEMIC_ASSISTANT_INSTRUCTIONS = (
    "Tu es l'assistant scientifique et académique de MACEVO. "
    "Aide les étudiants à comprendre leurs cours, définir une problématique, "
    "structurer et rédiger leurs rapports, mémoires, thèses et articles, "
    "choisir une méthodologie, analyser des résultats et préparer des "
    "équations, tableaux ou figures. Réponds dans la langue de l'étudiant, "
    "avec un niveau de détail adapté à sa question. Explique les étapes et "
    "distingue clairement faits, interprétations et suggestions. N'invente "
    "jamais de données, de résultats, de citations, de DOI ou de références ; "
    "signale ce qui doit être vérifié et demande les précisions nécessaires. "
    "Respecte l'intégrité académique : aide à apprendre et à améliorer le "
    "travail sans prétendre avoir effectué une recherche ou une expérience "
    "qui n'a pas été fournie. Pour un document joint, fonde l'analyse sur "
    "son contenu et indique les limites si le texte est incomplet. Pour les "
    "normes universitaires, distingue le contexte national des règles propres "
    "à l'établissement, à la faculté, au diplôme et à la discipline ; ne "
    "présente pas une suggestion comme une règle officielle sans source "
    "applicable. Structure les réponses avec un Markdown lisible et "
    "professionnel, sans laisser de marqueurs isolés dans le texte."
)


class NDJSONRenderer(BaseRenderer):
    media_type = "application/x-ndjson"
    format = "ndjson"
    charset = "utf-8"
    render_style = "binary"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if data is None:
            return b""
        return (json.dumps(data, ensure_ascii=False) + "\n").encode("utf-8")


class AssistantChatView(APIView):
    """
    Endpoint principal de conversation de MACEVO IA.

    POST /api/ai/chat/

    Deux modes sont disponibles :

    1. stream=false
       → réponse JSON classique.

    2. stream=true
       → flux HTTP NDJSON progressif.

    La vue reste une frontière HTTP mince.

    Elle ne contient aucune logique de :
    - planification ;
    - exécution de tâches ;
    - routage de modèles ;
    - génération scientifique ;
    - gestion des providers.

    Ces responsabilités restent dans le cœur IA.
    """

    permission_classes = [AllowAny]
    renderer_classes = [JSONRenderer, NDJSONRenderer]

    def _service_token_is_valid(self, request) -> bool:
        expected = getattr(settings, "MACEVO_IA_SERVICE_TOKEN", "")
        supplied = request.headers.get("X-MACEVO-IA-TOKEN", "")
        if expected:
            return hmac.compare_digest(expected, supplied)
        return bool(settings.DEBUG)

    # ==========================================================
    # POST
    # ==========================================================

    def post(
        self,
        request,
        *args: Any,
        **kwargs: Any,
    ) -> Response | StreamingHttpResponse:
        """
        Traite une demande de conversation IA.

        Le mode de réponse dépend de ai_request.stream.
        """

        if not self._service_token_is_valid(request):
            return Response(
                {"detail": "Accès service-à-service requis."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ChatRequestSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return self._error_response(
                errors=self._flatten_errors(
                    serializer.errors
                ),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data

        try:
            ai_request = self._build_ai_request(
                data
            )

            service = AIService()

            # ------------------------------------------------------
            # STREAMING HTTP
            # ------------------------------------------------------

            if ai_request.stream:
                return self._stream_response(
                    service,
                    ai_request,
                )

            # ------------------------------------------------------
            # EXECUTION CLASSIQUE
            # ------------------------------------------------------

            result = service.execute(
                ai_request
            )

            response_data = self._serialize_result(
                result
            )

            http_status = (
                status.HTTP_200_OK
                if result.success
                else status.HTTP_500_INTERNAL_SERVER_ERROR
            )

            if result.partial:
                http_status = (
                    status.HTTP_206_PARTIAL_CONTENT
                )

            if result.status.value == "cancelled":
                http_status = (
                    status.HTTP_409_CONFLICT
                )

            return Response(
                response_data,
                status=http_status,
            )

        except ValueError as exc:
            return self._error_response(
                errors=[str(exc)],
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as exc:
            return self._error_response(
                errors=[
                    "Une erreur interne est survenue "
                    "pendant le traitement de la demande.",
                    str(exc),
                ],
                status_code=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
            )

    # ==========================================================
    # STREAMING HTTP
    # ==========================================================

    def _stream_response(
        self,
        service: AIService,
        ai_request: AIRequest,
    ) -> StreamingHttpResponse:
        """
        Construit la réponse HTTP streaming.

        MACEVO utilise ici le format NDJSON :

            {"type":"start",...}
            {"type":"content","content":"Bonjour"}
            {"type":"content","content":" ..."}
            {"type":"task_done",...}
            {"type":"done",...}

        Chaque événement occupe une ligne JSON indépendante.

        Avantages :
        - simple à consommer côté React ;
        - compatible fetch() ;
        - UTF-8 ;
        - pas besoin de maintenir un objet JSON
          complet pendant toute la génération ;
        - conservation des métadonnées IA.
        """

        event_stream = service.stream(
            ai_request
        )

        response = StreamingHttpResponse(
            self._encode_stream(
                event_stream
            ),
            content_type=(
                "application/x-ndjson; charset=utf-8"
            ),
            status=status.HTTP_200_OK,
        )

        # ----------------------------------------------------------
        # HEADERS STREAMING
        # ----------------------------------------------------------

        response["Cache-Control"] = (
            "no-cache, no-store, must-revalidate"
        )

        response["Pragma"] = "no-cache"

        response["Expires"] = "0"

        # Empêche certains reverse proxies de mettre
        # le flux en buffer.
        response["X-Accel-Buffering"] = "no"

        # IMPORTANT :
        # Ne pas ajouter :
        #
        # response["Connection"] = "keep-alive"
        #
        # "Connection" est un header hop-by-hop.
        # Le serveur WSGI de Django interdit à l'application
        # de le définir explicitement.

        return response

    @classmethod
    def _encode_stream(
        cls,
        events: Iterable[Any],
    ) -> Iterator[bytes]:
        """
        Transforme les événements internes du moteur IA
        en lignes NDJSON UTF-8.

        Chaque événement produit exactement une ligne.
        """

        try:
            for event in events:

                normalized_event = cls._normalize_value(
                    event
                )

                payload = json.dumps(
                    normalized_event,
                    ensure_ascii=False,
                    separators=(
                        ",",
                        ":",
                    ),
                    default=str,
                )

                yield (
                    payload + "\n"
                ).encode(
                    "utf-8"
                )

        except Exception as exc:
            # ------------------------------------------------------
            # ERREUR PENDANT LE STREAM
            # ------------------------------------------------------
            #
            # À ce stade la réponse HTTP est déjà commencée.
            # Il n'est donc plus possible de modifier le code
            # HTTP en 500.
            #
            # On transmet donc l'erreur comme événement NDJSON.
            #

            error_event = {
                "type": "error",
                "error": str(exc),
            }

            payload = json.dumps(
                error_event,
                ensure_ascii=False,
                separators=(
                    ",",
                    ":",
                ),
            )

            yield (
                payload + "\n"
            ).encode(
                "utf-8"
            )

    # ==========================================================
    # CONSTRUCTION DE LA REQUÊTE IA
    # ==========================================================

    def _build_ai_request(
        self,
        data: dict[str, Any],
    ) -> AIRequest:
        """
        Transforme les données HTTP validées en AIRequest.

        La conversion HTTP → contrat IA est centralisée ici
        afin que le cœur IA reste indépendant de Django REST.
        """

        return AIRequest(
            messages=data.get("messages") or [
                {
                    "role": "user",
                    "content": data["message"],
                }
            ],
            conversation_id=data.get(
                "conversation_id"
            ),
            user_id=data.get(
                "user_id"
            ),
            document_id=data.get(
                "document_id"
            ),
            provider=data.get(
                "provider"
            ),
            model=data.get(
                "model"
            ),
            temperature=data.get(
                "temperature",
                0.4,
            ),
            max_tokens=data.get(
                "max_tokens",
                4096,
            ),
            stream=data.get(
                "stream",
                False,
            ),
            tools=data.get(
                "tools",
                [],
            ),
            metadata=data.get(
                "metadata",
                {},
            ),
            instructions=[
                ACADEMIC_ASSISTANT_INSTRUCTIONS,
                *data.get("instructions", []),
            ],
        )

    # ==========================================================
    # SERIALISATION DU RÉSULTAT IA
    # ==========================================================

    def _serialize_result(
        self,
        result: Any,
    ) -> dict[str, Any]:
        """
        Transforme AIResult en réponse HTTP publique.

        L'API ne renvoie pas directement l'objet interne
        AIResult.
        """

        response_data = {
            "success": result.success,
            "status": result.status.value,
            "data": self._normalize_value(
                result.data
            ),
            "errors": list(
                result.errors or []
            ),
            "warnings": list(
                result.warnings or []
            ),
            "metadata": self._normalize_value(
                result.metadata or {}
            ),
        }

        serializer = ChatResponseSerializer(
            data=response_data
        )

        serializer.is_valid(
            raise_exception=True
        )

        return serializer.validated_data

    # ==========================================================
    # ERREURS
    # ==========================================================

    def _error_response(
        self,
        *,
        errors: list[str],
        status_code: int,
    ) -> Response:
        """
        Produit une réponse d'erreur homogène.
        """

        payload = {
            "success": False,
            "status": "failed",
            "data": None,
            "errors": errors,
            "warnings": [],
            "metadata": {},
        }

        serializer = ChatResponseSerializer(
            data=payload
        )

        serializer.is_valid(
            raise_exception=True
        )

        return Response(
            serializer.validated_data,
            status=status_code,
        )

    @staticmethod
    def _flatten_errors(
        errors: Any,
    ) -> list[str]:
        """
        Convertit les erreurs DRF imbriquées en liste
        de messages simples.
        """

        flattened: list[str] = []

        if isinstance(
            errors,
            dict,
        ):
            for field, field_errors in errors.items():

                messages = (
                    AssistantChatView
                    ._flatten_errors(
                        field_errors
                    )
                )

                for message in messages:
                    flattened.append(
                        f"{field}: {message}"
                    )

            return flattened

        if isinstance(
            errors,
            list,
        ):
            for error in errors:
                flattened.extend(
                    AssistantChatView
                    ._flatten_errors(
                        error
                    )
                )

            return flattened

        flattened.append(
            str(errors)
        )

        return flattened

    # ==========================================================
    # NORMALISATION DES DONNÉES
    # ==========================================================

    @classmethod
    def _normalize_value(
        cls,
        value: Any,
    ) -> Any:
        """
        Rend les valeurs internes compatibles JSON.

        Les contrats IA peuvent contenir :
        - UUID ;
        - datetime ;
        - Enum ;
        - dataclasses ;
        - objets sérialisables.
        """

        if value is None:
            return None

        if isinstance(
            value,
            (str, int, float, bool),
        ):
            return value

        if isinstance(
            value,
            dict,
        ):
            return {
                str(key): cls._normalize_value(
                    item
                )
                for key, item in value.items()
            }

        if isinstance(
            value,
            (list, tuple),
        ):
            return [
                cls._normalize_value(
                    item
                )
                for item in value
            ]

        if hasattr(
            value,
            "to_dict",
        ):
            return cls._normalize_value(
                value.to_dict()
            )

        if hasattr(
            value,
            "value",
        ):
            return cls._normalize_value(
                value.value
            )

        if hasattr(
            value,
            "isoformat",
        ):
            return value.isoformat()

        return str(value)
