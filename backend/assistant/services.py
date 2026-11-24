"""
==========================================================
MACEVO IA
Assistant Services
==========================================================

Toute la logique métier du module Assistant.

Architecture :

    Assistant Views
          ↓
    AssistantService
          ↓
    DocumentService
          ↓
    MACEVO_IA HTTP API
          ↓
    MACEVO_IA AIService / Router
          ↓
    Fournisseur configuré (Ollama, OpenAI, ...)

Streaming :

    MACEVO_IA stream
       ↓
    AssistantService.stream_message()
       ↓
    Assistant Views / SSE
       ↓
    Frontend MACEVO
"""

import logging
import re

from django.core.exceptions import ObjectDoesNotExist

from .models import Conversation, Message

from .selectors import (
    ConversationSelector,
    MessageSelector,
)

from .validators import (
    validate_conversation_title,
    validate_message_content,
    validate_search_query,
)


logger = logging.getLogger(__name__)

MAX_DOCUMENT_CONTEXT_CHARS = 5000
DOCUMENT_STOP_WORDS = {
    "avec", "dans", "elle", "elles", "est", "les", "leur", "leurs",
    "mais", "mes", "mon", "nous", "notre", "pour", "que", "qui",
    "sur", "une", "des", "the", "and", "for", "from", "into", "that",
    "this", "what", "when", "where", "which", "with", "your", "you",
}


def _select_document_excerpts(document_text, question):
    """Select question-relevant passages while keeping prompt size bounded."""
    text = str(document_text or "").strip()
    if len(text) <= MAX_DOCUMENT_CONTEXT_CHARS:
        return text, ""

    parts = re.split(r"(?=--- PAGE \d+ ---)", text)
    if len(parts) == 1:
        paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
        parts = []
        for paragraph in paragraphs:
            if len(paragraph) <= 1400:
                parts.append(paragraph)
            else:
                parts.extend(
                    paragraph[offset:offset + 1200]
                    for offset in range(0, len(paragraph), 1000)
                )

    terms = {
        word.lower()
        for word in re.findall(r"[\wÀ-ÿ]{3,}", str(question or ""))
        if word.lower() not in DOCUMENT_STOP_WORDS
    }
    ranked = []
    for index, part in enumerate(parts):
        if not part.strip():
            continue
        part_terms = {word.lower() for word in re.findall(r"[\wÀ-ÿ]{3,}", part)}
        ranked.append((len(terms & part_terms), index, part.strip()))

    selected = []
    used_characters = 0
    for _, index, part in sorted(ranked, key=lambda entry: (-entry[0], entry[1])):
        remaining = MAX_DOCUMENT_CONTEXT_CHARS - used_characters
        if remaining <= 0:
            break
        excerpt = part[:remaining].strip()
        if excerpt:
            selected.append((index, excerpt))
            used_characters += len(excerpt) + 2

    selected.sort(key=lambda entry: entry[0])
    pages = sorted({
        int(number)
        for _, part in selected
        for number in re.findall(r"--- PAGE (\d+) ---", part)
    })
    coverage = (
        "L'IA ne reçoit qu'une sélection d'extraits, pas l'intégralité du "
        "document. Elle doit préciser cette limite, ne pas conclure sur les "
        "passages absents et citer les pages lorsqu'elles sont indiquées."
    )
    if pages:
        coverage += " Pages incluses : " + ", ".join(map(str, pages)) + "."
    return "\n\n".join(part for _, part in selected), coverage


class AssistantService:
    """
    Services métier du module Assistant.
    """

    # =====================================================
    # Conversations
    # =====================================================

    @staticmethod
    def list_conversations(
        user,
        search="",
    ):
        """
        Retourne les conversations d'un utilisateur.
        """

        search = validate_search_query(search)

        return ConversationSelector.list(
            user=user,
            search=search,
        )

    @staticmethod
    def get_conversation(
        user,
        conversation_id,
    ):
        """
        Retourne une conversation appartenant
        à l'utilisateur.
        """

        return ConversationSelector.by_id(
            user=user,
            conversation_id=conversation_id,
        )

    @staticmethod
    def get_or_create_conversation(
        *,
        user,
        conversation_id=None,
        first_message="Nouvelle conversation",
    ):
        """
        Retourne une conversation existante
        ou crée une nouvelle conversation.
        """

        if conversation_id:
            return AssistantService.get_conversation(
                user=user,
                conversation_id=conversation_id,
            )

        title = (
            str(first_message).strip()
            if first_message is not None
            else ""
        )

        title = (
            title[:60]
            if title
            else "Nouvelle conversation"
        )

        return AssistantService.create_conversation(
            user=user,
            title=title,
        )

    @staticmethod
    def create_conversation(
        user,
        title="Nouvelle conversation",
        scientific_project=None,
    ):
        """
        Crée une nouvelle conversation.
        """

        title = validate_conversation_title(title)

        return Conversation.objects.create(
            user=user,
            title=title,
            scientific_project=scientific_project,
        )

    @staticmethod
    def rename_conversation(
        conversation,
        title,
    ):
        """
        Renomme une conversation.
        """

        title = validate_conversation_title(title)

        conversation.title = title

        conversation.save(
            update_fields=[
                "title",
                "updated_at",
            ]
        )

        return conversation

    @staticmethod
    def delete_conversation(
        conversation,
    ):
        """
        Supprime une conversation.
        """

        conversation.delete()

    @staticmethod
    def archive_conversation(
        conversation,
    ):
        """
        Archive ou restaure une conversation.
        """

        conversation.is_archived = (
            not conversation.is_archived
        )

        conversation.save(
            update_fields=[
                "is_archived",
                "updated_at",
            ]
        )

        return conversation

    @staticmethod
    def pin_conversation(
        conversation,
    ):
        """
        Épingle ou désépingle une conversation.
        """

        conversation.is_pinned = (
            not conversation.is_pinned
        )

        conversation.save(
            update_fields=[
                "is_pinned",
                "updated_at",
            ]
        )

        return conversation

    # =====================================================
    # Messages
    # =====================================================

    @staticmethod
    def create_user_message(
        conversation,
        content,
        attachment=None,
    ):
        """
        Enregistre un message utilisateur.

        Le contenu enregistré reste le message visible
        par l'utilisateur.

        Le document joint est stocké séparément.
        """

        if content is None:
            content = ""

        content = str(content).strip()

        # -------------------------------------------------
        # Fichier sans texte
        # -------------------------------------------------

        if not content and attachment:

            content = (
                "Analyse le fichier que je viens "
                "de joindre."
            )

        elif not content:

            content = "Pièce jointe"

        else:

            content = validate_message_content(
                content
            )

        # -------------------------------------------------
        # Création
        # -------------------------------------------------

        message = Message.objects.create(
            conversation=conversation,
            role="user",
            content=content,
        )

        # -------------------------------------------------
        # Pièce jointe
        # -------------------------------------------------

        if attachment:

            attachment_name = (
                getattr(
                    attachment,
                    "name",
                    "",
                )
                or ""
            )

            attachment_type = (
                getattr(
                    attachment,
                    "content_type",
                    "",
                )
                or ""
            )

            attachment_size = getattr(
                attachment,
                "size",
                None,
            )

            logger.info(
                "Enregistrement pièce jointe. "
                "conversation_id=%s name=%s type=%s "
                "size=%s",
                getattr(
                    conversation,
                    "pk",
                    None,
                ),
                attachment_name,
                attachment_type,
                attachment_size,
            )

            message.attachment.save(
                attachment_name,
                attachment,
                save=False,
            )

            message.attachment_name = (
                attachment_name
            )

            message.attachment_type = (
                attachment_type
            )

            message.attachment_size = (
                attachment_size
            )

            message.save()

            logger.info(
                "Pièce jointe enregistrée. "
                "message_id=%s path=%s",
                getattr(
                    message,
                    "pk",
                    None,
                ),
                (
                    message.attachment.name
                    if message.attachment
                    else None
                ),
            )

        return message

    @staticmethod
    def create_assistant_message(
        conversation,
        content,
    ):
        """
        Enregistre une réponse IA.
        """

        if content is None:
            content = ""

        content = str(content).strip()

        content = validate_message_content(
            content
        )

        return Message.objects.create(
            conversation=conversation,
            role="assistant",
            content=content,
        )

    @staticmethod
    def get_history(
        conversation,
    ):
        """
        Retourne l'historique que le backend applicatif transmet à MACEVO_IA.
        """

        return MessageSelector.as_chat_history(
            conversation
        )

    @staticmethod
    def get_last_message(
        conversation,
    ):
        """
        Retourne le dernier message.
        """

        return MessageSelector.last(
            conversation
        )

    @staticmethod
    def count_messages(
        conversation,
    ):
        """
        Retourne le nombre de messages.
        """

        return MessageSelector.count(
            conversation
        )

    # =====================================================
    # Contexte document
    # =====================================================

    @staticmethod
    def _extract_document_text(
        attachment,
        conversation,
    ):
        """
        Extrait le texte d'un document.

        Le texte extrait sert uniquement de contexte IA.
        Il n'est pas ajouté au message visible enregistré.
        """

        if not attachment:
            return ""

        from .document_service import (
            DocumentService,
        )

        try:

            document_text = (
                DocumentService.extract_text(
                    attachment
                )
                or ""
            )

            document_text = str(
                document_text
            ).strip()

            logger.info(
                "Document extrait. "
                "conversation_id=%s filename=%s "
                "characters=%s",
                getattr(
                    conversation,
                    "pk",
                    None,
                ),
                getattr(
                    attachment,
                    "name",
                    "",
                ),
                len(document_text),
            )

            return document_text

        except Exception as exc:

            logger.exception(
                "Erreur extraction document. "
                "conversation_id=%s filename=%s",
                getattr(
                    conversation,
                    "pk",
                    None,
                ),
                getattr(
                    attachment,
                    "name",
                    "",
                ),
            )

            if isinstance(exc, ValueError):
                raise
            raise ValueError(
                "Impossible d'analyser le document joint. "
                "Vérifiez que le fichier n'est pas endommagé et réessayez."
            ) from exc

    @staticmethod
    def _add_document_context(
        history,
        document_text,
    ):
        """
        Ajoute le document uniquement au dernier
        message utilisateur destiné à l'IA.
        """

        if not document_text:
            return history

        user_item = next(
            (
                item for item in reversed(history)
                if isinstance(item, dict) and item.get("role") == "user"
            ),
            None,
        )
        question = str((user_item or {}).get("content", ""))
        document_excerpt, coverage_note = _select_document_excerpts(
            document_text,
            question,
        )

        document_context = (
            "\n\n"
            "==================================================\n"
            "DOCUMENT JOINT — CONTEXTE D'ANALYSE\n"
            "==================================================\n\n"
            f"{document_excerpt}\n\n"
            f"{coverage_note}\n\n"
            "==================================================\n"
            "FIN DU DOCUMENT JOINT\n"
            "=================================================="
        )

        for item in reversed(history):

            if (
                isinstance(item, dict)
                and item.get("role") == "user"
            ):

                original_content = (
                    item.get(
                        "content",
                        "",
                    )
                )

                item["content"] = (
                    f"{original_content}"
                    f"{document_context}"
                )

                break

        return history

    @staticmethod
    def _add_academic_profile_context(history, user):
        """Transmet au moteur IA le contexte académique utile du profil."""
        try:
            profile = user.profile
        except ObjectDoesNotExist:
            profile = None

        country = str(getattr(profile, "country", "") or "").strip()
        university = str(getattr(profile, "university", "") or "").strip()
        if not country and not university:
            return history

        context = (
            "Contexte académique du compte, à utiliser uniquement lorsque la "
            "question concerne les normes, la mise en forme ou les usages "
            "universitaires :\n"
            f"Pays : {country or 'non renseigné'}\n"
            f"Établissement : {university or 'non renseigné'}\n"
            "Le pays situe la demande mais ne suffit pas à établir une règle. "
            "Les consignes applicables dépendent aussi de l’établissement, "
            "de la faculté, du diplôme, de la discipline et parfois de la revue. "
            "Ne présente jamais une suggestion régionale comme une exigence "
            "officielle ; demande le guide institutionnel ou signale clairement "
            "ce qui reste à vérifier."
        )
        return [
            {"role": "system", "content": context},
            *history,
        ]

    @staticmethod
    def _add_scientific_project_context(history, conversation):
        """Ajoute uniquement le contexte du projet lié à cette conversation."""
        project = getattr(conversation, "scientific_project", None)
        if project is None:
            return history

        import json
        from projects.models import ProjectMemory

        plan = project.research_plan or []
        if project.plan_status != project.PLAN_VALIDATED:
            plan = []
        memories = ProjectMemory.objects.filter(
            user=conversation.user,
            project=project,
            status__in=(
                ProjectMemory.VALIDATED,
                ProjectMemory.ACTIVE,
            ),
        ).order_by("-updated_at")[:20]

        last_question = next(
            (
                str(item.get("content", ""))
                for item in reversed(history)
                if isinstance(item, dict) and item.get("role") == "user"
            ),
            "",
        )
        try:
            from projects.services.document_library import (
                format_retrieved_context,
                search_project_documents,
            )

            retrieved_chunks = search_project_documents(
                user=conversation.user,
                project=project,
                query=last_question,
                limit=4,
            )
            document_context = format_retrieved_context(retrieved_chunks)
        except Exception:
            logger.exception(
                "Échec de la récupération documentaire. project_id=%s",
                project.pk,
            )
            document_context = ""

        context = {
            "title": project.title,
            "document_type": project.get_project_type_display(),
            "academic_level": project.get_level_display(),
            "discipline": project.scientific_field,
            "country": project.country,
            "institution": project.institution,
            "subject": project.subject,
            "research_problem": project.research_problem,
            "research_questions": project.research_questions,
            "general_objective": project.general_objective,
            "specific_objectives": project.specific_objectives,
            "hypotheses": project.hypotheses,
            "methodology": project.methodology,
            "institutional_requirements": project.institutional_requirements,
            "supervisor_instructions": project.supervisor_instructions,
            "validated_plan": plan,
            "validated_project_memory": [
                {
                    "type": item.memory_type,
                    "content": item.content[:1600],
                    "source_type": item.source_type,
                    "source_reference": item.source_reference,
                }
                for item in memories
            ],
        }
        context_text = json.dumps(context, ensure_ascii=False, indent=2)
        if len(context_text) > 10000:
            context_text = context_text[:10000] + "\n[Contexte tronqué.] "

        return [
            {
                "role": "system",
                "content": (
                    "Contexte du projet scientifique lié à cette conversation. "
                    "Utilise ces informations comme contexte du projet courant, "
                    "sans inventer les champs manquants. Le plan ci-dessous n'est "
                    "fourni que s'il a été validé par l'utilisateur.\n"
                    + context_text
                ),
            },
            *(
                [{"role": "system", "content": document_context}]
                if document_context
                else []
            ),
            *history,
        ]

    # =====================================================
    # IA — mode classique
    # =====================================================

    @staticmethod
    def send_message(
        *,
        user,
        message,
        conversation=None,
        attachment=None,
    ):
        """
        Mode classique non-streaming.

        Flux :

        1. conversation ;
        2. document ;
        3. message utilisateur ;
        4. historique ;
        5. contexte document ;
        6. génération par MACEVO_IA ;
        7. sauvegarde réponse ;
        8. retour final.
        """

        from .macevo_ia_client import MacevoIAClient

        # -------------------------------------------------
        # Normalisation
        # -------------------------------------------------

        original_message = (
            str(message).strip()
            if message is not None
            else ""
        )

        # -------------------------------------------------
        # Conversation
        # -------------------------------------------------

        if conversation is None:

            if original_message:

                title = original_message[:60]

            elif attachment:

                title = (
                    getattr(
                        attachment,
                        "name",
                        "Document",
                    )
                    or "Document"
                )[:60]

            else:

                title = "Nouvelle conversation"

            conversation = (
                AssistantService.create_conversation(
                    user=user,
                    title=title,
                )
            )

        # -------------------------------------------------
        # Document
        # -------------------------------------------------

        document_text = (
            AssistantService._extract_document_text(
                attachment,
                conversation,
            )
        )

        # -------------------------------------------------
        # Message visible
        # -------------------------------------------------

        if not original_message:

            if attachment:

                original_message = (
                    "Analyse le fichier que je viens "
                    "de joindre."
                )

            else:

                original_message = "Bonjour."

        AssistantService.create_user_message(
            conversation=conversation,
            content=original_message,
            attachment=attachment,
        )

        # -------------------------------------------------
        # Historique
        # -------------------------------------------------

        history = AssistantService.get_history(
            conversation
        )

        if history is None:
            history = []

        history = (
            AssistantService._add_document_context(
                history,
                document_text,
            )
        )
        history = AssistantService._add_academic_profile_context(
            history,
            user,
        )
        history = AssistantService._add_scientific_project_context(
            history,
            conversation,
        )

        # -------------------------------------------------
        # Génération
        # -------------------------------------------------

        logger.info(
            "Requête IA classique. "
            "user_id=%s conversation_id=%s "
            "history_messages=%s has_document=%s",
            getattr(user, "pk", None),
            getattr(conversation, "pk", None),
            len(history),
            bool(document_text),
        )

        try:

            ai_response = MacevoIAClient.chat(
                messages=history,
                user_id=getattr(user, "pk", None),
                conversation_id=getattr(conversation, "pk", None),
                project_id=getattr(
                    getattr(conversation, "scientific_project", None),
                    "pk",
                    None,
                ),
            )

        except Exception:

            logger.exception(
                "Erreur génération IA classique. "
                "user_id=%s conversation_id=%s",
                getattr(user, "pk", None),
                getattr(conversation, "pk", None),
            )

            raise

        # -------------------------------------------------
        # Normalisation
        # -------------------------------------------------

        if ai_response is None:
            ai_response = ""

        ai_response = str(
            ai_response
        ).strip()

        if not ai_response:

            raise ValueError(
                "MACEVO IA n'a retourné aucune réponse."
            )

        # -------------------------------------------------
        # Sauvegarde
        # -------------------------------------------------

        AssistantService.create_assistant_message(
            conversation=conversation,
            content=ai_response,
        )

        conversation.refresh_from_db()

        logger.info(
            "Réponse IA enregistrée. "
            "conversation_id=%s response_length=%s",
            getattr(conversation, "pk", None),
            len(ai_response),
        )

        return (
            conversation,
            ai_response,
        )

    # =====================================================
    # IA — STREAMING
    # =====================================================

    @staticmethod
    def stream_message(
        *,
        user,
        message,
        conversation=None,
        attachment=None,
    ):
        """
        Génère une réponse IA en streaming.

        IMPORTANT :

        Cette méthode est un générateur.

        Elle ne bloque pas jusqu'à la fin de la réponse.

        Chaque morceau généré par le provider est transmis
        immédiatement à la couche HTTP.

        Flux :

            AssistantService.stream_message()
                ↓
            MACEVO_IA HTTP stream
                ↓
            Fournisseur configuré dans MACEVO_IA
                ↓
            Django StreamingHttpResponse
                ↓
            Frontend
        """

        from .macevo_ia_client import MacevoIAClient

        # =================================================
        # NORMALISATION
        # =================================================

        original_message = (
            str(message).strip()
            if message is not None
            else ""
        )

        # =================================================
        # CONVERSATION
        # =================================================

        if conversation is None:

            if original_message:

                title = original_message[:60]

            elif attachment:

                title = (
                    getattr(
                        attachment,
                        "name",
                        "Document",
                    )
                    or "Document"
                )[:60]

            else:

                title = "Nouvelle conversation"

            conversation = (
                AssistantService.create_conversation(
                    user=user,
                    title=title,
                )
            )

        # =================================================
        # DOCUMENT
        # =================================================

        document_text = (
            AssistantService._extract_document_text(
                attachment,
                conversation,
            )
        )

        # =================================================
        # MESSAGE UTILISATEUR
        # =================================================

        if not original_message:

            if attachment:

                original_message = (
                    "Analyse le fichier que je viens "
                    "de joindre."
                )

            else:

                original_message = "Bonjour."

        user_message = (
            AssistantService.create_user_message(
                conversation=conversation,
                content=original_message,
                attachment=attachment,
            )
        )

        # =================================================
        # HISTORIQUE
        # =================================================

        history = AssistantService.get_history(
            conversation
        )

        if history is None:
            history = []

        history = (
            AssistantService._add_document_context(
                history,
                document_text,
            )
        )
        history = AssistantService._add_academic_profile_context(
            history,
            user,
        )
        history = AssistantService._add_scientific_project_context(
            history,
            conversation,
        )

        # =================================================
        # LOG
        # =================================================

        logger.info(
            "Démarrage streaming IA. "
            "user_id=%s conversation_id=%s "
            "history_messages=%s has_document=%s",
            getattr(user, "pk", None),
            getattr(conversation, "pk", None),
            len(history),
            bool(document_text),
        )

        # =================================================
        # ACCUMULATION
        # =================================================

        accumulated_response = ""

        assistant_message_saved = False

        # =================================================
        # STREAM
        # =================================================

        try:

            stream = MacevoIAClient.stream_chat(
                messages=history,
                user_id=getattr(user, "pk", None),
                conversation_id=getattr(conversation, "pk", None),
                project_id=getattr(
                    getattr(conversation, "scientific_project", None),
                    "pk",
                    None,
                ),
            )

            for event in stream:

                # -------------------------------------------------
                # Provider peut retourner directement une chaîne
                # -------------------------------------------------

                if isinstance(event, str):

                    chunk = event

                # -------------------------------------------------
                # Event structuré
                # -------------------------------------------------

                elif isinstance(event, dict):

                    event_type = (
                        event.get("type")
                        or event.get("event")
                        or "chunk"
                    )

                    # ---------------------------------------------
                    # Erreur
                    # ---------------------------------------------

                    if event_type == "error":

                        error_message = (
                            event.get(
                                "message",
                                "Erreur pendant la génération IA.",
                            )
                        )

                        logger.error(
                            "Erreur streaming provider. "
                            "conversation_id=%s error=%s",
                            getattr(
                                conversation,
                                "pk",
                                None,
                            ),
                            error_message,
                        )

                        raise RuntimeError(
                            str(error_message)
                        )

                    # ---------------------------------------------
                    # Fin
                    # ---------------------------------------------

                    if event_type in (
                        "done",
                        "complete",
                        "completed",
                    ):

                        continue

                    # ---------------------------------------------
                    # Chunk
                    # ---------------------------------------------

                    chunk = (
                        event.get("content")
                        or event.get("text")
                        or event.get("delta")
                        or ""
                    )

                else:

                    chunk = ""

                # =================================================
                # NORMALISATION CHUNK
                # =================================================

                if chunk is None:
                    continue

                chunk = str(chunk)

                if not chunk:
                    continue

                # =================================================
                # ACCUMULATION
                # =================================================

                accumulated_response += chunk

                # =================================================
                # ENVOI IMMÉDIAT
                # =================================================

                yield {
                    "type": "chunk",
                    "content": chunk,
                }

            # =================================================
            # FIN DE GÉNÉRATION
            # =================================================

            final_response = (
                accumulated_response.strip()
            )

            if not final_response:

                raise ValueError(
                    "MACEVO IA n'a retourné aucune réponse."
                )

            # =================================================
            # SAUVEGARDE UNIQUE
            # =================================================

            assistant_message = (
                AssistantService.create_assistant_message(
                    conversation=conversation,
                    content=final_response,
                )
            )

            assistant_message_saved = True

            conversation.refresh_from_db()

            logger.info(
                "Streaming terminé et réponse enregistrée. "
                "conversation_id=%s "
                "message_id=%s "
                "response_length=%s",
                getattr(
                    conversation,
                    "pk",
                    None,
                ),
                getattr(
                    assistant_message,
                    "pk",
                    None,
                ),
                len(final_response),
            )

            # =================================================
            # EVENT FINAL
            # =================================================

            yield {
                "type": "done",
                "content": "",
                "message_id": getattr(
                    assistant_message,
                    "pk",
                    None,
                ),
                "conversation_id": getattr(
                    conversation,
                    "pk",
                    None,
                ),
            }

        except GeneratorExit:

            # =================================================
            # CLIENT DÉCONNECTÉ
            # =================================================

            logger.warning(
                "Client déconnecté pendant le streaming. "
                "conversation_id=%s "
                "generated_length=%s",
                getattr(
                    conversation,
                    "pk",
                    None,
                ),
                len(accumulated_response),
            )

            # -------------------------------------------------
            # IMPORTANT :
            #
            # Nous ne sauvegardons PAS une réponse partielle
            # comme réponse assistant normale.
            #
            # Cela évite d'avoir une conversation corrompue.
            # -------------------------------------------------

            raise

        except Exception as exc:

            logger.exception(
                "Erreur pendant le streaming IA. "
                "conversation_id=%s "
                "generated_length=%s",
                getattr(
                    conversation,
                    "pk",
                    None,
                ),
                len(accumulated_response),
            )

            # -------------------------------------------------
            # Une réponse complète déjà sauvegardée ne doit
            # jamais être enregistrée une seconde fois.
            # -------------------------------------------------

            if not assistant_message_saved:

                yield {
                    "type": "error",
                    "content": "",
                    "message": str(exc),
                }

            raise

    # =====================================================
    # IA — STREAM TEXTE SIMPLE
    # =====================================================

    @staticmethod
    def stream_text(
        *,
        user,
        message,
        conversation=None,
        attachment=None,
    ):
        """
        Variante pratique du streaming.

        Ne retourne que les morceaux de texte.

        Utile pour certains consommateurs internes.
        """

        for event in AssistantService.stream_message(
            user=user,
            message=message,
            conversation=conversation,
            attachment=attachment,
        ):

            if not isinstance(event, dict):
                continue

            if event.get("type") != "chunk":
                continue

            content = event.get(
                "content",
                "",
            )

            if content:
                yield content

    # =====================================================
    # Informations
    # =====================================================

    @staticmethod
    def info():
        """
        Informations sur le service Assistant.
        """

        return {
            "service": "AssistantService",
            "streaming": True,
            "attachments": True,
            "conversation_management": True,
            "document_context": True,
            "ai_service": "MACEVO_IA",
        }
