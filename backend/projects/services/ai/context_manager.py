
"""
==========================================================
MACEVO IA
Context Manager
==========================================================

Gestion centralisée du contexte envoyé au moteur IA.

Le ContextManager distingue plusieurs types de contexte :

- système ;
- conversation ;
- document ;
- scientifique ;
- instructions ;
- références ;
- mémoire.

Objectif :
Ne pas traiter un document scientifique volumineux comme
une simple conversation de quelques messages.

Le ContextManager prépare le contexte qui sera ensuite
transmis au provider IA.

Auteur : MACEVO
"""

from collections import deque

from .exceptions import (
    ContextOverflowError,
    InvalidMessageError,
)


class ContextManager:
    """
    Gestionnaire central du contexte IA.

    Le contexte conversationnel reste limité afin d'éviter
    une croissance infinie.

    Les contextes documentaires et scientifiques sont gérés
    séparément afin de préparer l'architecture future de
    MACEVO.
    """

    DEFAULT_MAX_MESSAGES = 20

    VALID_ROLES = {
        "system",
        "user",
        "assistant",
        "tool",
    }

    VALID_CONTEXT_TYPES = {
        "system",
        "conversation",
        "document",
        "scientific",
        "instructions",
        "references",
        "memory",
    }

    def __init__(
        self,
        max_messages=DEFAULT_MAX_MESSAGES,
    ):
        if max_messages is None:
            max_messages = self.DEFAULT_MAX_MESSAGES

        try:
            max_messages = int(max_messages)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "max_messages doit être un entier."
            ) from exc

        if max_messages <= 0:
            raise ValueError(
                "max_messages doit être supérieur à zéro."
            )

        self.max_messages = max_messages

        # -------------------------------------------------
        # Conversation
        # -------------------------------------------------

        self._messages = deque(
            maxlen=max_messages
        )

        # -------------------------------------------------
        # Contextes persistants
        # -------------------------------------------------

        self._contexts = {
            "document": [],
            "scientific": [],
            "instructions": [],
            "references": [],
            "memory": [],
        }

    # =====================================================
    # Validation
    # =====================================================

    @classmethod
    def _validate_role(cls, role):
        """
        Vérifie le rôle d'un message.
        """

        if not role:
            raise InvalidMessageError(
                "Le rôle du message est obligatoire."
            )

        role = str(role).strip().lower()

        if role not in cls.VALID_ROLES:
            raise InvalidMessageError(
                f"Rôle de message non supporté : {role}"
            )

        return role

    @staticmethod
    def _validate_content(content):
        """
        Normalise le contenu d'un message.
        """

        if content is None:
            return ""

        if not isinstance(
            content,
            str,
        ):
            content = str(content)

        return content

    @classmethod
    def _build_message(
        cls,
        role,
        content,
        context_type="conversation",
        metadata=None,
    ):
        """
        Construit un message standard MACEVO.
        """

        role = cls._validate_role(role)

        if (
            context_type
            not in cls.VALID_CONTEXT_TYPES
        ):
            raise InvalidMessageError(
                f"Type de contexte non supporté : "
                f"{context_type}"
            )

        content = cls._validate_content(
            content
        )

        return {
            "role": role,
            "content": content,
            "context_type": context_type,
            "metadata": metadata or {},
        }

    # =====================================================
    # Gestion des messages
    # =====================================================

    def add_message(
        self,
        role,
        content,
        context_type="conversation",
        metadata=None,
    ):
        """
        Ajoute un message au contexte conversationnel.

        Compatible avec l'ancienne API :

            add_message(
                role="user",
                content="Bonjour"
            )
        """

        message = self._build_message(
            role=role,
            content=content,
            context_type=context_type,
            metadata=metadata,
        )

        self._messages.append(
            message
        )

        return message

    def add_system(
        self,
        content,
        metadata=None,
    ):
        """
        Ajoute un message système.
        """

        return self.add_message(
            role="system",
            content=content,
            context_type="system",
            metadata=metadata,
        )

    def add_user(
        self,
        content,
        metadata=None,
    ):
        """
        Ajoute un message utilisateur.
        """

        return self.add_message(
            role="user",
            content=content,
            context_type="conversation",
            metadata=metadata,
        )

    def add_assistant(
        self,
        content,
        metadata=None,
    ):
        """
        Ajoute un message assistant.
        """

        return self.add_message(
            role="assistant",
            content=content,
            context_type="conversation",
            metadata=metadata,
        )

    # =====================================================
    # Contextes documentaires
    # =====================================================

    def add_context(
        self,
        context_type,
        content,
        metadata=None,
    ):
        """
        Ajoute un contexte persistant.

        Exemples :

            add_context(
                "document",
                document_text
            )

            add_context(
                "scientific",
                scientific_context
            )

            add_context(
                "references",
                bibliography
            )
        """

        if (
            context_type
            not in self.VALID_CONTEXT_TYPES
        ):
            raise InvalidMessageError(
                f"Type de contexte non supporté : "
                f"{context_type}"
            )

        if context_type == "system":
            raise InvalidMessageError(
                "Le contexte système doit être géré "
                "avec ensure_system_message()."
            )

        content = self._validate_content(
            content
        )

        if not content.strip():
            return None

        context = {
            "content": content,
            "metadata": metadata or {},
        }

        self._contexts[
            context_type
        ].append(context)

        return context

    def add_document(
        self,
        content,
        metadata=None,
    ):
        """
        Ajoute du contexte documentaire.
        """

        return self.add_context(
            "document",
            content,
            metadata,
        )

    def add_scientific_context(
        self,
        content,
        metadata=None,
    ):
        """
        Ajoute du contexte scientifique.
        """

        return self.add_context(
            "scientific",
            content,
            metadata,
        )

    def add_instructions(
        self,
        content,
        metadata=None,
    ):
        """
        Ajoute des instructions spécifiques
        au traitement demandé.
        """

        return self.add_context(
            "instructions",
            content,
            metadata,
        )

    def add_references(
        self,
        content,
        metadata=None,
    ):
        """
        Ajoute des références bibliographiques.
        """

        return self.add_context(
            "references",
            content,
            metadata,
        )

    def add_memory(
        self,
        content,
        metadata=None,
    ):
        """
        Ajoute une information de mémoire.
        """

        return self.add_context(
            "memory",
            content,
            metadata,
        )

    # =====================================================
    # Consultation des messages
    # =====================================================

    def messages(
        self,
        include_metadata=False,
    ):
        """
        Retourne les messages conversationnels.

        Par défaut, retourne exactement le format attendu
        par les providers :

            [
                {
                    "role": "...",
                    "content": "..."
                }
            ]

        include_metadata=True permet d'obtenir les
        informations internes MACEVO.
        """

        if include_metadata:
            return list(
                self._messages
            )

        return [
            {
                "role": message["role"],
                "content": message["content"],
            }
            for message in self._messages
        ]

    # =====================================================
    # Construction du contexte complet
    # =====================================================

    def context(
        self,
        include_document=True,
        include_scientific=True,
        include_instructions=True,
        include_references=True,
        include_memory=True,
    ):
        """
        Retourne les contextes persistants séparément.

        Cette méthode ne transforme pas encore le contenu
        en prompt géant.

        Elle prépare une structure exploitable par une future
        couche de Context Builder / Document IR.
        """

        result = {}

        flags = {
            "document": include_document,
            "scientific": include_scientific,
            "instructions": include_instructions,
            "references": include_references,
            "memory": include_memory,
        }

        for context_type, enabled in flags.items():
            if not enabled:
                continue

            result[context_type] = list(
                self._contexts[
                    context_type
                ]
            )

        return result

    def build_context_messages(
        self,
        include_document=True,
        include_scientific=True,
        include_instructions=True,
        include_references=True,
        include_memory=True,
    ):
        """
        Construit les messages supplémentaires à partir
        des contextes persistants.

        Cette méthode fournit une représentation standard
        compatible avec les providers.

        La future architecture pourra remplacer cette étape
        par un véritable Context Builder / Document IR.
        """

        messages = []

        context = self.context(
            include_document=include_document,
            include_scientific=include_scientific,
            include_instructions=include_instructions,
            include_references=include_references,
            include_memory=include_memory,
        )

        labels = {
            "document": "CONTEXTE DOCUMENTAIRE",
            "scientific": "CONTEXTE SCIENTIFIQUE",
            "instructions": "INSTRUCTIONS",
            "references": "RÉFÉRENCES",
            "memory": "MÉMOIRE",
        }

        for context_type, items in context.items():

            for item in items:

                content = item.get(
                    "content",
                    "",
                )

                if not content:
                    continue

                messages.append(
                    {
                        "role": "system",
                        "content": (
                            f"[{labels[context_type]}]\n"
                            f"{content}"
                        ),
                    }
                )

        return messages

    # =====================================================
    # Consultation rapide
    # =====================================================

    def last(self):
        """
        Retourne le dernier message.
        """

        if not self._messages:
            return None

        return self._messages[-1]

    def size(self):
        """
        Nombre de messages conversationnels.
        """

        return len(
            self._messages
        )

    def is_empty(self):
        """
        Indique si le contexte conversationnel est vide.
        """

        return not bool(
            self._messages
        )

    # =====================================================
    # Prompt système
    # =====================================================

    def ensure_system_message(
        self,
        content,
    ):
        """
        Ajoute le prompt système au début du contexte
        s'il n'existe pas déjà.
        """

        content = self._validate_content(
            content
        )

        if not content.strip():
            raise InvalidMessageError(
                "Le prompt système ne peut pas être vide."
            )

        if self._messages:

            first = self._messages[0]

            if first.get("role") == "system":
                return first

        message = self._build_message(
            role="system",
            content=content,
            context_type="system",
        )

        self._messages.appendleft(
            message
        )

        return message

    # =====================================================
    # Nettoyage
    # =====================================================

    def clear(self):
        """
        Vide uniquement la conversation.
        """

        self._messages.clear()

    def clear_context(
        self,
        context_type=None,
    ):
        """
        Vide les contextes persistants.

        Si context_type est None, tous les contextes
        persistants sont supprimés.
        """

        if context_type is None:

            for key in self._contexts:
                self._contexts[key].clear()

            return

        if (
            context_type
            not in self._contexts
        ):
            raise InvalidMessageError(
                f"Type de contexte inconnu : "
                f"{context_type}"
            )

        self._contexts[
            context_type
        ].clear()

    def clear_all(self):
        """
        Vide absolument tout le contexte.
        """

        self.clear()
        self.clear_context()

    # =====================================================
    # Statistiques
    # =====================================================

    def statistics(self):
        """
        Retourne des statistiques simples sur le contexte.
        """

        return {
            "messages": self.size(),
            "max_messages": self.max_messages,
            "contexts": {
                key: len(value)
                for key, value in self._contexts.items()
            },
        }

    # =====================================================
    # Export interne
    # =====================================================

    def export(self):
        """
        Retourne l'état complet du ContextManager.

        Utile pour le debug, les tests et éventuellement
        la persistance future.
        """

        return {
            "messages": self.messages(
                include_metadata=True
            ),
            "contexts": self.context(),
            "statistics": self.statistics(),
        }
