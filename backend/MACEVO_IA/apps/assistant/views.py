from __future__ import annotations

import json
from typing import Any, Dict

from django.http import JsonResponse, StreamingHttpResponse
from rest_framework import status
from rest_framework.views import APIView

from core.ai.contracts.message import AIMessage, MessageRole
from apps.assistant.serializers import (
    ChatRequestSerializer,
    ScientificDocumentRequestSerializer,
)
from apps.assistant.services import AssistantService


class AssistantChatView(APIView):
    """
    Endpoint principal de conversation MACEVO IA.

    Modes :

    stream=False
        Réponse JSON classique.

    stream=True
        Réponse SSE progressive.
    """

    def post(self, request, *args, **kwargs):
        serializer = ChatRequestSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return JsonResponse(
                {
                    "status": "failed",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data

        service = AssistantService()

        stream = bool(
            data.get("stream", False)
        )

        if stream:
            return self._stream_response(
                service,
                data,
            )

        return self._normal_response(
            service,
            data,
        )

    # ==================================================================
    # REPONSE CLASSIQUE
    # ==================================================================

    def _normal_response(
        self,
        service: AssistantService,
        data: Dict[str, Any],
    ):
        try:
            result = service.chat(
                data["message"],
                user_id=data.get("user_id"),
                conversation_id=data.get(
                    "conversation_id"
                ),
                document_id=data.get(
                    "document_id"
                ),
                model=data.get("model"),
                provider=data.get("provider"),
                temperature=data.get(
                    "temperature"
                ),
                max_tokens=data.get(
                    "max_tokens"
                ),
                stream=False,
                tools=data.get("tools"),
                instructions=data.get(
                    "instructions"
                ),
                metadata=data.get(
                    "metadata"
                ),
            )

            response_data = result.to_dict()

            http_status = (
                status.HTTP_500_INTERNAL_SERVER_ERROR
                if result.failed
                else status.HTTP_200_OK
            )

            return JsonResponse(
                response_data,
                status=http_status,
                json_dumps_params={
                    "ensure_ascii": False,
                },
            )

        except Exception as exc:
            return JsonResponse(
                {
                    "status": "failed",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                json_dumps_params={
                    "ensure_ascii": False,
                },
            )

    # ==================================================================
    # STREAMING SSE
    # ==================================================================

    def _stream_response(
        self,
        service: AssistantService,
        data: Dict[str, Any],
    ):
        """
        Transforme le générateur interne MACEVO en flux SSE.
        """

        request = service.build_request(
            data["message"],
            user_id=data.get("user_id"),
            conversation_id=data.get(
                "conversation_id"
            ),
            document_id=data.get(
                "document_id"
            ),
            model=data.get("model"),
            provider=data.get("provider"),
            temperature=data.get(
                "temperature"
            ),
            max_tokens=data.get(
                "max_tokens"
            ),
            stream=True,
            tools=data.get("tools"),
            instructions=data.get(
                "instructions"
            ),
            metadata=data.get(
                "metadata"
            ),
        )

        def event_stream():
            accumulated_content = ""

            # ----------------------------------------------------------
            # EVENEMENT INITIAL
            # ----------------------------------------------------------

            yield self._sse_event(
                {
                    "type": "start",
                    "request_id": request.id,
                    "conversation_id": (
                        request.conversation_id
                    ),
                    "model": request.model,
                    "provider": request.provider,
                }
            )

            try:
                chunks = service.ai_service.stream(
                    request
                )

                for chunk in chunks:
                    if not isinstance(chunk, dict):
                        chunk = {
                            "type": "content",
                            "content": str(chunk),
                        }

                    event_type = chunk.get(
                        "type",
                        "content",
                    )

                    # --------------------------------------------------
                    # CONTENU
                    # --------------------------------------------------

                    if event_type == "content":
                        content = chunk.get(
                            "content",
                            "",
                        )

                        if content:
                            accumulated_content += content

                        yield self._sse_event(
                            {
                                "type": "content",
                                "content": content,
                                "request_id": request.id,
                            }
                        )

                    # --------------------------------------------------
                    # TOOL CALL
                    # --------------------------------------------------

                    elif event_type == "tool_call":
                        yield self._sse_event(
                            {
                                "type": "tool_call",
                                "tool_calls": chunk.get(
                                    "tool_calls",
                                    [],
                                ),
                                "request_id": request.id,
                            }
                        )

                    # --------------------------------------------------
                    # ERREUR
                    # --------------------------------------------------

                    elif event_type == "error":
                        yield self._sse_event(
                            {
                                "type": "error",
                                "error": chunk.get(
                                    "error",
                                    "Erreur inconnue.",
                                ),
                                "request_id": request.id,
                            }
                        )

                        return

                    # --------------------------------------------------
                    # FIN
                    # --------------------------------------------------

                    elif event_type == "done":
                        # Le contenu final fourni par l'exécuteur
                        # est plus fiable que de reconstruire
                        # uniquement à partir du dernier événement.
                        final_content = chunk.get(
                            "final_content"
                        )

                        if isinstance(
                            final_content,
                            str,
                        ) and final_content:
                            accumulated_content = (
                                final_content
                            )

                # ------------------------------------------------------
                # PERSISTENCE
                # ------------------------------------------------------

                self._persist_stream_conversation(
                    service,
                    request,
                    accumulated_content,
                )

                # ------------------------------------------------------
                # EVENEMENT FINAL
                # ------------------------------------------------------

                yield self._sse_event(
                    {
                        "type": "done",
                        "request_id": request.id,
                        "conversation_id": (
                            request.conversation_id
                        ),
                        "content": accumulated_content,
                    }
                )

            except Exception as exc:
                yield self._sse_event(
                    {
                        "type": "error",
                        "request_id": request.id,
                        "error": str(exc),
                    }
                )

        response = StreamingHttpResponse(
            event_stream(),
            content_type=(
                "text/event-stream; "
                "charset=utf-8"
            ),
        )

        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        response["Connection"] = "keep-alive"

        return response

    # ==================================================================
    # SSE
    # ==================================================================

    @staticmethod
    def _sse_event(
        payload: Dict[str, Any],
    ) -> str:
        """
        Convertit un dictionnaire en événement SSE.
        """

        return (
            "data: "
            + json.dumps(
                payload,
                ensure_ascii=False,
            )
            + "\n\n"
        )

    # ==================================================================
    # PERSISTENCE
    # ==================================================================

    @staticmethod
    def _persist_stream_conversation(
        service: AssistantService,
        request,
        content: str,
    ) -> None:
        """
        Persiste la conversation après une génération
        streaming réussie.

        On enregistre le message utilisateur puis la réponse
        complète de l'assistant.
        """

        if not request.conversation_id:
            return

        context_engine = (
            service.ai_service
            .orchestrator
            .context_engine
        )

        context_engine.ensure_conversation(
            conversation_id=request.conversation_id,
            user_id=request.user_id,
            model=request.model or "",
            provider=request.provider or "",
            metadata=request.metadata,
        )

        user_message = request.user_message()

        if user_message is not None:
            context_engine.add_message(
                request.conversation_id,
                user_message,
            )

        if content:
            assistant_message = AIMessage(
                role=MessageRole.ASSISTANT,
                content=content,
                metadata={
                    "request_id": request.id,
                    "streamed": True,
                },
            )

            context_engine.add_message(
                request.conversation_id,
                assistant_message,
            )


class ScientificDocumentView(APIView):
    """
    Endpoint de génération de documents scientifiques.
    """

    def post(self, request, *args, **kwargs):
        serializer = ScientificDocumentRequestSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return JsonResponse(
                {
                    "status": "failed",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data

        service = AssistantService()

        try:
            result = service.create_scientific_document(
                **data
            )

            response_data = result.to_dict()

            http_status = (
                status.HTTP_500_INTERNAL_SERVER_ERROR
                if result.failed
                else status.HTTP_200_OK
            )

            return JsonResponse(
                response_data,
                status=http_status,
                json_dumps_params={
                    "ensure_ascii": False,
                },
            )

        except Exception as exc:
            return JsonResponse(
                {
                    "status": "failed",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                json_dumps_params={
                    "ensure_ascii": False,
                },
            )