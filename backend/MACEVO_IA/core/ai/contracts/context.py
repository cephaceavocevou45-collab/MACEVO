from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .message import AIMessage


@dataclass
class AIContext:
    """
    Contexte complet utilisé par le moteur IA MACEVO.

    AIContext conserve une représentation interne riche avec des
    objets AIMessage.

    La conversion vers le format provider est effectuée uniquement
    au moment de construire les messages destinés aux providers.
    """

    id: Optional[str] = None

    system_messages: List[AIMessage] = field(
        default_factory=list
    )

    conversation_messages: List[AIMessage] = field(
        default_factory=list
    )

    instructions: List[str] = field(
        default_factory=list
    )

    document: Any = None

    scientific: Dict[str, Any] = field(
        default_factory=dict
    )

    references: List[Any] = field(
        default_factory=list
    )

    memory: List[Any] = field(
        default_factory=list
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    def __post_init__(self) -> None:
        if self.system_messages is None:
            self.system_messages = []

        if self.conversation_messages is None:
            self.conversation_messages = []

        if self.instructions is None:
            self.instructions = []

        if self.references is None:
            self.references = []

        if self.memory is None:
            self.memory = []

        if self.scientific is None:
            self.scientific = {}

        if self.metadata is None:
            self.metadata = {}

        self.system_messages = self._normalize_messages(
            self.system_messages
        )

        self.conversation_messages = self._normalize_messages(
            self.conversation_messages
        )

        self.instructions = [
            str(item).strip()
            for item in self.instructions
            if str(item).strip()
        ]

        self.scientific = dict(self.scientific)
        self.metadata = dict(self.metadata)

    # ------------------------------------------------------------------
    # Normalisation
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_messages(
        messages: List[AIMessage],
    ) -> List[AIMessage]:
        normalized: List[AIMessage] = []

        for message in messages or []:
            if isinstance(message, AIMessage):
                normalized.append(message)
                continue

            if isinstance(message, dict):
                normalized.append(
                    AIMessage.from_dict(message)
                )
                continue

            raise TypeError(
                "Chaque message doit être un AIMessage "
                "ou un dictionnaire compatible."
            )

        return normalized

    # ------------------------------------------------------------------
    # Messages système
    # ------------------------------------------------------------------

    def add_system_message(
        self,
        message: AIMessage,
    ) -> None:
        if not isinstance(message, AIMessage):
            raise TypeError(
                "message doit être un AIMessage."
            )

        self.system_messages.append(message)

    # ------------------------------------------------------------------
    # Messages de conversation
    # ------------------------------------------------------------------

    def add_conversation_message(
        self,
        message: AIMessage,
    ) -> None:
        if not isinstance(message, AIMessage):
            raise TypeError(
                "message doit être un AIMessage."
            )

        self.conversation_messages.append(message)

    # ------------------------------------------------------------------
    # Instructions
    # ------------------------------------------------------------------

    def add_instruction(
        self,
        instruction: str,
    ) -> None:
        instruction = str(
            instruction or ""
        ).strip()

        if instruction:
            self.instructions.append(
                instruction
            )

    # ------------------------------------------------------------------
    # Références
    # ------------------------------------------------------------------

    def add_reference(
        self,
        reference: Any,
    ) -> None:
        if reference is not None:
            self.references.append(
                reference
            )

    # ------------------------------------------------------------------
    # Mémoire
    # ------------------------------------------------------------------

    def add_memory(
        self,
        memory: Any,
    ) -> None:
        if memory is not None:
            self.memory.append(
                memory
            )

    # ------------------------------------------------------------------
    # Construction des messages internes
    # ------------------------------------------------------------------

    def build_messages(self) -> List[AIMessage]:
        """
        Construit la séquence complète des messages internes.

        Cette méthode retourne volontairement des AIMessage.
        La conversion JSON/provider est réalisée par
        build_provider_messages().
        """

        messages: List[AIMessage] = []

        messages.extend(
            self.system_messages
        )

        messages.extend(
            self.conversation_messages
        )

        for instruction in self.instructions:
            messages.append(
                AIMessage(
                    role="system",
                    content=instruction,
                )
            )

        return messages

    # ------------------------------------------------------------------
    # Construction pour les providers
    # ------------------------------------------------------------------

    def build_provider_messages(
        self,
    ) -> List[Dict[str, Any]]:
        """
        Convertit le contexte interne vers le format générique
        attendu par les providers IA.

        Aucun AIMessage ne doit sortir de cette méthode.
        """

        return [
            message.to_provider_dict()
            for message in self.build_messages()
        ]

    # ------------------------------------------------------------------
    # Sérialisation
    # ------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "system_messages": [
                message.to_dict()
                for message in self.system_messages
            ],
            "conversation_messages": [
                message.to_dict()
                for message in self.conversation_messages
            ],
            "instructions": list(
                self.instructions
            ),
            "document": self.document,
            "scientific": dict(
                self.scientific
            ),
            "references": list(
                self.references
            ),
            "memory": [
                item.to_dict()
                if hasattr(item, "to_dict")
                else item
                for item in self.memory
            ],
            "metadata": dict(
                self.metadata
            ),
        }

    # ------------------------------------------------------------------
    # Utilitaires
    # ------------------------------------------------------------------

    @property
    def messages(self) -> List[AIMessage]:
        """
        Retourne tous les messages internes du contexte.
        """

        return self.build_messages()

    @property
    def message_count(self) -> int:
        return len(
            self.system_messages
        ) + len(
            self.conversation_messages
        )

    def clear_messages(self) -> None:
        self.system_messages.clear()
        self.conversation_messages.clear()

    def clear_memory(self) -> None:
        self.memory.clear()

    def clear_references(self) -> None:
        self.references.clear()

    def __len__(self) -> int:
        return self.message_count