from __future__ import annotations

from collections import defaultdict, deque
from threading import RLock
from typing import Dict, Iterable, List, Optional

from core.ai.contracts.message import AIMessage


class ConversationStore:
    """
    Stockage conversationnel temporaire du moteur IA.

    Cette implémentation est volontairement indépendante de Django.
    Elle pourra ensuite être remplacée par un backend persistant
    (PostgreSQL/Redis/etc.) sans modifier le ContextEngine.
    """

    def __init__(self, max_messages: int = 50):
        if max_messages <= 0:
            raise ValueError(
                "max_messages doit être supérieur à zéro."
            )

        self.max_messages = max_messages

        self._conversations: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=self.max_messages)
        )

        self._lock = RLock()

    def add(
        self,
        conversation_id: str,
        message: AIMessage,
    ) -> AIMessage:
        """
        Ajoute un message à une conversation.
        """

        if not conversation_id:
            raise ValueError(
                "conversation_id est obligatoire."
            )

        if not isinstance(message, AIMessage):
            raise TypeError(
                "message doit être une instance de AIMessage."
            )

        with self._lock:
            self._conversations[conversation_id].append(message)

        return message

    def add_many(
        self,
        conversation_id: str,
        messages: Iterable[AIMessage],
    ) -> None:
        """
        Ajoute plusieurs messages dans l'ordre.
        """

        for message in messages:
            self.add(conversation_id, message)

    def get(
        self,
        conversation_id: str,
    ) -> List[AIMessage]:
        """
        Retourne une copie de l'historique.
        """

        if not conversation_id:
            return []

        with self._lock:
            return list(
                self._conversations.get(
                    conversation_id,
                    deque(),
                )
            )

    def last(
        self,
        conversation_id: str,
    ) -> Optional[AIMessage]:
        """
        Retourne le dernier message de la conversation.
        """

        messages = self.get(conversation_id)

        if not messages:
            return None

        return messages[-1]

    def clear(
        self,
        conversation_id: str,
    ) -> None:
        """
        Supprime une conversation.
        """

        if not conversation_id:
            return

        with self._lock:
            self._conversations.pop(
                conversation_id,
                None,
            )

    def exists(
        self,
        conversation_id: str,
    ) -> bool:
        """
        Vérifie l'existence d'une conversation.
        """

        if not conversation_id:
            return False

        with self._lock:
            return conversation_id in self._conversations

    def count(
        self,
        conversation_id: str,
    ) -> int:
        """
        Retourne le nombre de messages.
        """

        return len(self.get(conversation_id))

    def conversations(self) -> List[str]:
        """
        Retourne les identifiants des conversations connues.
        """

        with self._lock:
            return list(self._conversations.keys())

    def clear_all(self) -> None:
        """
        Efface toutes les conversations.
        """

        with self._lock:
            self._conversations.clear()

    def __len__(self) -> int:
        with self._lock:
            return len(self._conversations)