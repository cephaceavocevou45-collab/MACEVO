from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from core.ai.contracts.message import AIMessage


@dataclass
class AIRequest:
    """
    Requête standardisée envoyée au système IA MACEVO_IA.

    Cette classe constitue le contrat d'entrée principal du moteur IA.
    """

    messages: List[AIMessage] = field(default_factory=list)

    id: str = field(
        default_factory=lambda: str(uuid4())
    )

    user_id: Optional[str] = None
    conversation_id: Optional[str] = None
    document_id: Optional[str] = None

    model: Optional[str] = None
    provider: Optional[str] = None

    temperature: Optional[float] = 0.4
    max_tokens: Optional[int] = 4096

    stream: bool = False

    tools: List[Dict[str, Any]] = field(
        default_factory=list
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    instructions: List[str] = field(
        default_factory=list
    )

    created_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    def __post_init__(self) -> None:
        """
        Normalise les données reçues, y compris lorsque certaines
        valeurs arrivent explicitement à None.
        """

        # ---------------------------------------------------------
        # Messages
        # ---------------------------------------------------------

        if self.messages is None:
            self.messages = []

        if not isinstance(self.messages, list):
            self.messages = list(self.messages)

        normalized_messages: List[AIMessage] = []

        for message in self.messages:

            if isinstance(message, AIMessage):
                normalized_messages.append(message)

            elif isinstance(message, dict):
                normalized_messages.append(
                    AIMessage.from_dict(message)
                )

            else:
                raise TypeError(
                    "Each message must be an AIMessage "
                    "or a dictionary."
                )

        self.messages = normalized_messages

        # ---------------------------------------------------------
        # Instructions
        # ---------------------------------------------------------

        if self.instructions is None:
            self.instructions = []

        elif isinstance(self.instructions, str):
            self.instructions = [
                self.instructions
            ]

        else:
            self.instructions = list(
                self.instructions
            )

        self.instructions = [
            str(instruction).strip()
            for instruction in self.instructions
            if str(instruction).strip()
        ]

        # ---------------------------------------------------------
        # Tools
        # ---------------------------------------------------------

        if self.tools is None:
            self.tools = []

        elif not isinstance(self.tools, list):
            self.tools = list(self.tools)

        # ---------------------------------------------------------
        # Metadata
        # ---------------------------------------------------------

        if self.metadata is None:
            self.metadata = {}

        elif not isinstance(self.metadata, dict):
            raise TypeError(
                "metadata must be a dictionary."
            )

        # ---------------------------------------------------------
        # Identifiants
        # ---------------------------------------------------------

        if self.user_id is not None:
            self.user_id = str(self.user_id)

        if self.conversation_id is not None:
            self.conversation_id = str(
                self.conversation_id
            )

        if self.document_id is not None:
            self.document_id = str(
                self.document_id
            )

        # ---------------------------------------------------------
        # Provider / modèle
        # ---------------------------------------------------------

        if self.provider is not None:
            self.provider = str(
                self.provider
            ).strip().lower()

        if self.model is not None:
            self.model = str(
                self.model
            ).strip()

        # ---------------------------------------------------------
        # Paramètres génération
        # ---------------------------------------------------------

        if self.temperature is not None:
            self.temperature = float(
                self.temperature
            )

            if not 0 <= self.temperature <= 2:
                raise ValueError(
                    "temperature must be between 0 and 2."
                )

        if self.max_tokens is not None:
            self.max_tokens = int(
                self.max_tokens
            )

            if self.max_tokens <= 0:
                raise ValueError(
                    "max_tokens must be greater than zero."
                )

        self.stream = bool(self.stream)

    # ------------------------------------------------------------------
    # Messages
    # ------------------------------------------------------------------

    def add_message(
        self,
        message: AIMessage,
    ) -> None:
        """
        Ajoute un message à la requête.
        """

        if not isinstance(message, AIMessage):
            raise TypeError(
                "message must be an AIMessage instance."
            )

        self.messages.append(message)

    # ------------------------------------------------------------------
    # Instructions
    # ------------------------------------------------------------------

    def add_instruction(
        self,
        instruction: str,
    ) -> None:
        """
        Ajoute une instruction à la requête.
        """

        instruction = str(
            instruction
        ).strip()

        if not instruction:
            return

        self.instructions.append(
            instruction
        )

    # ------------------------------------------------------------------
    # Provider messages
    # ------------------------------------------------------------------

    def to_provider_messages(
        self,
    ) -> List[Dict[str, Any]]:
        """
        Convertit les messages au format générique attendu
        par les providers.
        """

        return [
            message.to_provider_dict()
            for message in self.messages
        ]

    # ------------------------------------------------------------------
    # Dernier message
    # ------------------------------------------------------------------

    @property
    def last_message(
        self,
    ) -> Optional[AIMessage]:

        if not self.messages:
            return None

        return self.messages[-1]

    @property
    def user_message(
        self,
    ) -> Optional[AIMessage]:

        for message in reversed(self.messages):

            if message.is_user:
                return message

        return None

    # ------------------------------------------------------------------
    # Sérialisation
    # ------------------------------------------------------------------

    def to_dict(
        self,
    ) -> Dict[str, Any]:

        return {
            "id": self.id,
            "messages": [
                message.to_dict()
                for message in self.messages
            ],
            "user_id": self.user_id,
            "conversation_id": self.conversation_id,
            "document_id": self.document_id,
            "model": self.model,
            "provider": self.provider,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "stream": self.stream,
            "tools": self.tools,
            "metadata": self.metadata,
            "instructions": self.instructions,
            "created_at": self.created_at.isoformat(),
        }

    @classmethod
    def from_dict(
        cls,
        data: Dict[str, Any],
    ) -> "AIRequest":

        if not isinstance(data, dict):
            raise TypeError(
                "data must be a dictionary."
            )

        created_at = data.get(
            "created_at"
        )

        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(
                    created_at
                )
            except ValueError:
                created_at = None

        if created_at is None:
            created_at = datetime.now(
                timezone.utc
            )

        return cls(
            id=data.get(
                "id",
                str(uuid4()),
            ),
            messages=data.get(
                "messages",
                [],
            ),
            user_id=data.get(
                "user_id"
            ),
            conversation_id=data.get(
                "conversation_id"
            ),
            document_id=data.get(
                "document_id"
            ),
            model=data.get(
                "model"
            ),
            provider=data.get(
                "provider"
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
            instructions=data.get(
                "instructions",
                [],
            ),
            created_at=created_at,
        )

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    def validate(self) -> None:
        """
        Vérifie que la requête respecte le contrat MACEVO_IA.
        """

        if not self.id:
            raise ValueError(
                "Request id cannot be empty."
            )

        if self.temperature is not None:
            if not 0 <= self.temperature <= 2:
                raise ValueError(
                    "temperature must be between 0 and 2."
                )

        if self.max_tokens is not None:
            if self.max_tokens <= 0:
                raise ValueError(
                    "max_tokens must be greater than zero."
                )

        for message in self.messages:

            if not isinstance(
                message,
                AIMessage,
            ):
                raise TypeError(
                    "All messages must be AIMessage instances."
                )

        if not isinstance(
            self.instructions,
            list,
        ):
            raise TypeError(
                "instructions must be a list."
            )

        if not isinstance(
            self.tools,
            list,
        ):
            raise TypeError(
                "tools must be a list."
            )

        if not isinstance(
            self.metadata,
            dict,
        ):
            raise TypeError(
                "metadata must be a dictionary."
            )