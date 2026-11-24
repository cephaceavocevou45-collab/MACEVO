"""
==========================================================
MACEVO IA
Assistant Views
==========================================================

Vues REST et streaming de l'assistant MACEVO.

Architecture :

    Frontend
        ↓
    assistantService.js
        ↓
    Assistant Views
        ↓
    AssistantService
        ↓
    MACEVO_IA HTTP API
        ↓
    MACEVO_IA AIService / Router
        ↓
    Fournisseur configuré (Ollama, OpenAI, ...)


Streaming :

    MACEVO_IA stream NDJSON
        ↓
    AssistantService.stream_message()
        ↓
    ChatView
        ↓
    SSE
        ↓
    Frontend
"""

import json
import logging

from django.core.exceptions import (
    ValidationError as DjangoValidationError,
)
from django.http import StreamingHttpResponse

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import (
    BaseRenderer,
    JSONRenderer,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation
from .serializers import ConversationSerializer
from .services import AssistantService
from projects.selectors import ProjectSelector
from .validators import (
    validate_conversation_title,
    validate_search_query,
)


logger = logging.getLogger(__name__)


# ==========================================================
# SSE RENDERER
# ==========================================================


class EventStreamRenderer(BaseRenderer):
    """
    Renderer minimal permettant à Django REST Framework
    d'accepter les requêtes SSE :

        Accept: text/event-stream

    Le flux réel est produit par StreamingHttpResponse.
    Ce renderer permet à DRF de valider la négociation
    de contenu avant l'exécution de la vue.
    """

    media_type = "text/event-stream"
    format = "sse"
    charset = "utf-8"
    render_style = "binary"

    def render(
        self,
        data,
        accepted_media_type=None,
        renderer_context=None,
    ):
        """
        Le flux SSE est déjà généré par
        StreamingHttpResponse.

        Cette méthode existe pour respecter
        le contrat de BaseRenderer.
        """

        if data is None:
            return b""

        if isinstance(data, bytes):
            return data

        return str(data).encode("utf-8")


# ==========================================================
# HELPERS
# ==========================================================


def _user_id(request):
    """
    Retourne l'identifiant de l'utilisateur.
    """

    return getattr(
        request.user,
        "pk",
        None,
    )


def _validate_conversation_id(value):
    """
    Validation locale de l'identifiant de conversation.

    Évite de dépendre d'un validator qui n'existe pas
    encore dans validators.py.
    """

    if value in (
        None,
        "",
    ):
        raise DjangoValidationError(
            "L'identifiant de conversation est obligatoire."
        )

    try:

        conversation_id = int(value)

    except (
        TypeError,
        ValueError,
    ):

        raise DjangoValidationError(
            "Identifiant de conversation invalide."
        )

    if conversation_id <= 0:

        raise DjangoValidationError(
            "Identifiant de conversation invalide."
        )

    return conversation_id


def _conversation_not_found():
    """
    Réponse REST standard.
    """

    return Response(
        {
            "error": "Conversation introuvable.",
            "code": "conversation_not_found",
        },
        status=status.HTTP_404_NOT_FOUND,
    )


def _sse_event(
    event_type,
    **payload,
):
    """
    Transforme un événement Python en événement SSE.

    Format :

        event: chunk
        data: {...}

    Le frontend peut ainsi traiter les événements
    progressivement.
    """

    data = {
        "type": event_type,
        **payload,
    }

    return (
        f"event: {event_type}\n"
        f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
    )


def _serialize_conversation(
    conversation,
    request,
):
    """
    Sérialise une conversation.
    """

    serializer = ConversationSerializer(
        conversation,
        context={
            "request": request,
        },
    )

    return serializer.data


# ==========================================================
# CONVERSATIONS
# ==========================================================


class ConversationListView(APIView):
    """
    Liste les conversations actives.

    GET:
        /assistant/conversations/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        search = request.query_params.get(
            "search",
            "",
        )

        try:

            search = validate_search_query(
                search
            )

        except DjangoValidationError as exc:

            return Response(
                {
                    "error": str(exc),
                    "code": "invalid_search",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            conversations = (
                AssistantService.list_conversations(
                    user=request.user,
                    search=search,
                )
            )

        except Exception:

            logger.exception(
                "Erreur récupération conversations. "
                "user_id=%s",
                _user_id(request),
            )

            return Response(
                {
                    "error": (
                        "Impossible de récupérer les conversations."
                    ),
                    "code": "conversation_list_error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = ConversationSerializer(
            conversations,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class ConversationDetailView(APIView):
    """
    Retourne une conversation appartenant
    à l'utilisateur connecté.

    GET:
        /assistant/conversations/<pk>/
    """

    permission_classes = [IsAuthenticated]

    def get(
        self,
        request,
        pk,
    ):

        try:

            conversation_id = (
                _validate_conversation_id(pk)
            )

        except DjangoValidationError as exc:

            return Response(
                {
                    "error": str(exc),
                    "code": "invalid_conversation_id",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            conversation = (
                AssistantService.get_conversation(
                    user=request.user,
                    conversation_id=conversation_id,
                )
            )

        except Conversation.DoesNotExist:

            return _conversation_not_found()

        except Exception:

            logger.exception(
                "Erreur récupération conversation. "
                "user_id=%s conversation_id=%s",
                _user_id(request),
                conversation_id,
            )

            return _conversation_not_found()

        serializer = ConversationSerializer(
            conversation,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class CreateConversationView(APIView):
    """
    Crée une conversation.

    POST:
        /assistant/conversations/create/
    """

    permission_classes = [IsAuthenticated]

    def post(
        self,
        request,
    ):

        title = request.data.get(
            "title",
            "Nouvelle conversation",
        )

        project_id = request.data.get("project_id")
        scientific_project = None
        if project_id not in (None, ""):
            try:
                scientific_project = ProjectSelector.get_project_by_id(
                    int(project_id),
                    request.user,
                )
            except (TypeError, ValueError):
                scientific_project = None
            if scientific_project is None:
                return Response(
                    {"error": "Projet scientifique introuvable ou inaccessible."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        try:

            title = validate_conversation_title(
                title
            )

        except DjangoValidationError as exc:

            return Response(
                {
                    "error": str(exc),
                    "code": "invalid_conversation",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            conversation = (
                AssistantService.create_conversation(
                    user=request.user,
                    title=title,
                    scientific_project=scientific_project,
                )
            )

        except Exception:

            logger.exception(
                "Erreur création conversation. "
                "user_id=%s",
                _user_id(request),
            )

            return Response(
                {
                    "error": (
                        "Impossible de créer la conversation."
                    ),
                    "code": "conversation_creation_error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            _serialize_conversation(
                conversation,
                request,
            ),
            status=status.HTTP_201_CREATED,
        )


class RenameConversationView(APIView):
    """
    Renomme une conversation.

    PUT:
        /assistant/conversations/<pk>/rename/
    """

    permission_classes = [IsAuthenticated]

    def put(
        self,
        request,
        pk,
    ):

        try:

            conversation_id = (
                _validate_conversation_id(pk)
            )

        except DjangoValidationError as exc:

            return Response(
                {
                    "error": str(exc),
                    "code": "invalid_conversation_id",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        title = request.data.get(
            "title",
            "",
        )

        try:

            title = validate_conversation_title(
                title
            )

        except DjangoValidationError as exc:

            return Response(
                {
                    "error": str(exc),
                    "code": "invalid_title",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            conversation = (
                AssistantService.get_conversation(
                    user=request.user,
                    conversation_id=conversation_id,
                )
            )

        except Exception:

            return _conversation_not_found()

        try:

            conversation = (
                AssistantService.rename_conversation(
                    conversation,
                    title,
                )
            )

        except Exception:

            logger.exception(
                "Erreur renommage conversation. "
                "user_id=%s conversation_id=%s",
                _user_id(request),
                conversation_id,
            )

            return Response(
                {
                    "error": (
                        "Impossible de renommer la conversation."
                    ),
                    "code": "conversation_rename_error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            _serialize_conversation(
                conversation,
                request,
            ),
            status=status.HTTP_200_OK,
        )


class DeleteConversationView(APIView):
    """
    Supprime une conversation.

    DELETE:
        /assistant/conversations/<pk>/delete/
    """

    permission_classes = [IsAuthenticated]

    def delete(
        self,
        request,
        pk,
    ):

        try:

            conversation_id = (
                _validate_conversation_id(pk)
            )

        except DjangoValidationError as exc:

            return Response(
                {
                    "error": str(exc),
                    "code": "invalid_conversation_id",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            conversation = (
                AssistantService.get_conversation(
                    user=request.user,
                    conversation_id=conversation_id,
                )
            )

        except Exception:

            return _conversation_not_found()

        try:

            AssistantService.delete_conversation(
                conversation
            )

        except Exception:

            logger.exception(
                "Erreur suppression conversation. "
                "user_id=%s conversation_id=%s",
                _user_id(request),
                conversation_id,
            )

            return Response(
                {
                    "error": (
                        "Impossible de supprimer la conversation."
                    ),
                    "code": "conversation_delete_error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "message": "Conversation supprimée.",
                "deleted": True,
            },
            status=status.HTTP_200_OK,
        )


class PinConversationView(APIView):
    """
    Épingle ou désépingle une conversation.

    PATCH:
        /assistant/conversations/<pk>/pin/
    """

    permission_classes = [IsAuthenticated]

    def patch(
        self,
        request,
        pk,
    ):

        try:

            conversation_id = (
                _validate_conversation_id(pk)
            )

        except DjangoValidationError as exc:

            return Response(
                {
                    "error": str(exc),
                    "code": "invalid_conversation_id",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            conversation = (
                AssistantService.get_conversation(
                    user=request.user,
                    conversation_id=conversation_id,
                )
            )

        except Exception:

            return _conversation_not_found()

        try:

            conversation = (
                AssistantService.pin_conversation(
                    conversation
                )
            )

        except Exception:

            logger.exception(
                "Erreur pin conversation. "
                "user_id=%s conversation_id=%s",
                _user_id(request),
                conversation_id,
            )

            return Response(
                {
                    "error": (
                        "Impossible de modifier le statut épinglé."
                    ),
                    "code": "conversation_pin_error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            _serialize_conversation(
                conversation,
                request,
            ),
            status=status.HTTP_200_OK,
        )


class ArchiveConversationView(APIView):
    """
    Archive ou restaure une conversation.

    PATCH:
        /assistant/conversations/<pk>/archive/
    """

    permission_classes = [IsAuthenticated]

    def patch(
        self,
        request,
        pk,
    ):

        try:

            conversation_id = (
                _validate_conversation_id(pk)
            )

        except DjangoValidationError as exc:

            return Response(
                {
                    "error": str(exc),
                    "code": "invalid_conversation_id",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            conversation = (
                AssistantService.get_conversation(
                    user=request.user,
                    conversation_id=conversation_id,
                )
            )

        except Exception:

            return _conversation_not_found()

        try:

            conversation = (
                AssistantService.archive_conversation(
                    conversation
                )
            )

        except Exception:

            logger.exception(
                "Erreur archive conversation. "
                "user_id=%s conversation_id=%s",
                _user_id(request),
                conversation_id,
            )

            return Response(
                {
                    "error": (
                        "Impossible de modifier le statut archivé."
                    ),
                    "code": "conversation_archive_error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            _serialize_conversation(
                conversation,
                request,
            ),
            status=status.HTTP_200_OK,
        )


# ==========================================================
# CHAT IA
# ==========================================================


class ChatView(APIView):
    """
    Endpoint principal de MACEVO IA.

    GET
    ---
        Vérifie la disponibilité du service.

    POST
    ----
        Chat classique ou streaming.

    Champs :

        message
        conversation_id
        file

    Streaming :

        stream=true

    Exemple :

        POST /assistant/chat/?stream=true
    """

    renderer_classes = [
        EventStreamRenderer,
        JSONRenderer,
    ]

    permission_classes = [IsAuthenticated]

    def get(
        self,
        request,
    ):

        return Response(
            {
                "ok": True,
                "message": "MACEVO IA est disponible.",
                "streaming": True,
            },
            status=status.HTTP_200_OK,
        )

    def post(
        self,
        request,
    ):

        message = request.data.get(
            "message",
            "",
        )

        if message is None:
            message = ""

        message = str(
            message
        ).strip()

        conversation_id = request.data.get(
            "conversation_id"
        )

        attachment = request.FILES.get(
            "file"
        )

        # ==================================================
        # STREAMING ?
        # ==================================================

        stream_value = request.query_params.get(
            "stream",
            "",
        )

        stream_requested = (
            str(stream_value).lower()
            in (
                "1",
                "true",
                "yes",
                "on",
            )
        )

        # ==================================================
        # VALIDATION
        # ==================================================

        if not message and not attachment:

            return Response(
                {
                    "error": (
                        "Un message ou un fichier est obligatoire."
                    ),
                    "code": "message_or_file_required",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ==================================================
        # CONVERSATION
        # ==================================================

        conversation = None
        requested_project = None
        requested_project_id = request.data.get("project_id")
        if requested_project_id not in (None, ""):
            try:
                requested_project = ProjectSelector.get_project_by_id(
                    int(requested_project_id),
                    request.user,
                )
            except (TypeError, ValueError):
                requested_project = None
            if requested_project is None:
                return Response(
                    {"error": "Projet scientifique introuvable ou inaccessible."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        if conversation_id not in (
            None,
            "",
        ):

            try:

                conversation_id = (
                    _validate_conversation_id(
                        conversation_id
                    )
                )

            except DjangoValidationError as exc:

                return Response(
                    {
                        "error": str(exc),
                        "code": "invalid_conversation_id",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:

                conversation = (
                    AssistantService.get_conversation(
                        user=request.user,
                        conversation_id=conversation_id,
                    )
                )

            except Exception:

                return _conversation_not_found()

            if requested_project is not None:
                if (
                    conversation.scientific_project_id is not None
                    and conversation.scientific_project_id != requested_project.pk
                ):
                    return Response(
                        {"error": "Cette conversation est déjà liée à un autre projet."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if conversation.scientific_project_id is None:
                    conversation.scientific_project = requested_project
                    conversation.save(
                        update_fields=["scientific_project", "updated_at"]
                    )
        elif requested_project is not None:
            conversation = AssistantService.create_conversation(
                user=request.user,
                title=message[:60] or "Nouvelle conversation",
                scientific_project=requested_project,
            )
            conversation_id = conversation.pk

        # ==================================================
        # LOG
        # ==================================================

        logger.info(
            "MACEVO chat request. "
            "user_id=%s conversation_id=%s "
            "stream=%s has_file=%s",
            _user_id(request),
            conversation_id,
            stream_requested,
            bool(attachment),
        )

        # ==================================================
        # STREAMING
        # ==================================================

        if stream_requested:

            return self._stream_response(
                request=request,
                message=message,
                conversation=conversation,
                attachment=attachment,
            )

        # ==================================================
        # MODE CLASSIQUE
        # ==================================================

        return self._classic_response(
            request=request,
            message=message,
            conversation=conversation,
            attachment=attachment,
            conversation_id=conversation_id,
        )

    # ======================================================
    # CLASSIQUE
    # ======================================================

    def _classic_response(
        self,
        *,
        request,
        message,
        conversation,
        attachment,
        conversation_id,
    ):
        """
        Réponse HTTP classique.
        """

        try:

            conversation, ai_response = (
                AssistantService.send_message(
                    user=request.user,
                    conversation=conversation,
                    message=message,
                    attachment=attachment,
                )
            )

        except ValueError as exc:

            logger.warning(
                "Erreur validation IA. "
                "user_id=%s error=%s",
                _user_id(request),
                exc,
            )

            return Response(
                {
                    "error": str(exc),
                    "code": "validation_error",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception:

            logger.exception(
                "Erreur interne IA. "
                "user_id=%s conversation_id=%s",
                _user_id(request),
                conversation_id,
            )

            return Response(
                {
                    "error": (
                        "MACEVO IA rencontre actuellement "
                        "un problème. Veuillez réessayer."
                    ),
                    "code": "ai_service_error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "conversation": _serialize_conversation(
                    conversation,
                    request,
                ),
                "response": ai_response,
            },
            status=status.HTTP_200_OK,
        )

    # ======================================================
    # STREAMING
    # ======================================================

    def _stream_response(
        self,
        *,
        request,
        message,
        conversation,
        attachment,
    ):
        """
        Réponse SSE véritablement progressive.

        Les chunks sont envoyés au navigateur dès leur
        réception depuis le moteur IA.
        """

        def event_generator():

            try:

                # ------------------------------------------
                # START
                # ------------------------------------------

                yield _sse_event(
                    "start",
                    conversation_id=(
                        getattr(
                            conversation,
                            "pk",
                            None,
                        )
                        if conversation
                        else None
                    ),
                )

                # ------------------------------------------
                # GENERATION
                # ------------------------------------------

                for event in AssistantService.stream_message(
                    user=request.user,
                    conversation=conversation,
                    message=message,
                    attachment=attachment,
                ):

                    if not isinstance(
                        event,
                        dict,
                    ):
                        continue

                    event_type = event.get(
                        "type",
                        "chunk",
                    )

                    # --------------------------------------
                    # CHUNK
                    # --------------------------------------

                    if event_type == "chunk":

                        content = event.get(
                            "content",
                            "",
                        )

                        if content:

                            yield _sse_event(
                                "chunk",
                                content=content,
                            )

                    # --------------------------------------
                    # DONE
                    # --------------------------------------

                    elif event_type == "done":

                        yield _sse_event(
                            "done",
                            message_id=event.get(
                                "message_id"
                            ),
                            conversation_id=event.get(
                                "conversation_id"
                            ),
                        )

                    # --------------------------------------
                    # ERROR
                    # --------------------------------------

                    elif event_type == "error":

                        yield _sse_event(
                            "error",
                            message=event.get(
                                "message",
                                "Erreur pendant la génération.",
                            ),
                        )

                logger.info(
                    "Streaming HTTP terminé. "
                    "user_id=%s",
                    _user_id(request),
                )

            except GeneratorExit:

                logger.warning(
                    "Client déconnecté du flux SSE. "
                    "user_id=%s",
                    _user_id(request),
                )

                raise

            except Exception as exc:

                logger.exception(
                    "Erreur flux SSE. "
                    "user_id=%s",
                    _user_id(request),
                )

                # ------------------------------------------
                # Les headers peuvent déjà avoir été envoyés.
                # Nous envoyons donc une erreur SSE.
                # ------------------------------------------

                is_validation_error = isinstance(exc, ValueError)
                yield _sse_event(
                    "error",
                    message=(
                        str(exc) if is_validation_error else
                        "MACEVO IA rencontre actuellement "
                        "un problème."
                    ),
                    code=(
                        "validation_error" if is_validation_error
                        else "ai_stream_error"
                    ),
                )

        response = StreamingHttpResponse(
            event_generator(),
            content_type="text/event-stream",
        )

        # ==================================================
        # HEADERS STREAMING
        # ==================================================

        response["Cache-Control"] = (
            "no-cache, no-transform"
        )

        response["X-Accel-Buffering"] = "no"

        # IMPORTANT :
        # Ne pas ajouter :
        #
        # response["Connection"] = "keep-alive"
        #
        # Django/WSGI interdit les hop-by-hop headers.

        return response
