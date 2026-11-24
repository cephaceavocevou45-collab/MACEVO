from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable, List, Optional

from core.ai.contracts.message import AIMessage
from core.ai.context.budget import ContextBudget


@dataclass(slots=True)
class ContextSelection:
    """
    Résultat de la sélection du contexte.

    Contient les messages conservés ainsi que les informations
    permettant de comprendre pourquoi certains éléments ont été exclus.
    """

    messages: List[AIMessage]

    estimated_tokens: int = 0
    discarded_messages: int = 0
    truncated: bool = False

    metadata: dict[str, Any] | None = None

    def __post_init__(self) -> None:
        self.messages = list(self.messages or [])
        self.estimated_tokens = int(self.estimated_tokens)
        self.discarded_messages = int(self.discarded_messages)

        if self.estimated_tokens < 0:
            raise ValueError(
                "estimated_tokens ne peut pas être négatif."
            )

        if self.discarded_messages < 0:
            raise ValueError(
                "discarded_messages ne peut pas être négatif."
            )

        self.metadata = dict(self.metadata or {})

    def to_dict(self) -> dict[str, Any]:
        return {
            "messages": [
                message.to_dict()
                for message in self.messages
            ],
            "estimated_tokens": self.estimated_tokens,
            "discarded_messages": self.discarded_messages,
            "truncated": self.truncated,
            "metadata": self.metadata,
        }


class ContextSelector:
    """
    Sélecteur intelligent du contexte MACEVO IA.

    Stratégie actuelle :

    1. conserver les messages système ;
    2. conserver les messages les plus récents ;
    3. respecter le budget de tokens ;
    4. ne jamais dépasser le budget ;
    5. conserver autant que possible le dernier message utilisateur.

    Cette classe constitue la base qui permettra ensuite d'ajouter :

    - pertinence sémantique ;
    - embeddings ;
    - recherche vectorielle ;
    - mémoire long terme ;
    - contexte documentaire ;
    - priorité scientifique ;
    - importance des messages.
    """

    def __init__(
        self,
        budget: Optional[ContextBudget] = None,
        *,
        chars_per_token: float = 4.0,
    ):
        self.budget = budget or ContextBudget()
        self.chars_per_token = float(chars_per_token)

        if self.chars_per_token <= 0:
            raise ValueError(
                "chars_per_token doit être supérieur à zéro."
            )

    def estimate_tokens(self, message: AIMessage) -> int:
        """
        Estime le nombre de tokens d'un message.

        Cette estimation reste volontairement simple à ce stade.
        Elle pourra être remplacée plus tard par un tokenizer réel
        dépendant du modèle.
        """

        if not isinstance(message, AIMessage):
            raise TypeError(
                "message doit être une instance de AIMessage."
            )

        content = str(message.content or "")

        if not content:
            return 1

        return max(
            1,
            int(len(content) / self.chars_per_token),
        )

    def estimate_messages_tokens(
        self,
        messages: Iterable[AIMessage],
    ) -> int:
        return sum(
            self.estimate_tokens(message)
            for message in messages
        )

    def select(
        self,
        messages: Iterable[AIMessage],
        *,
        system_messages: Optional[Iterable[AIMessage]] = None,
        preserve_last_user: bool = True,
    ) -> ContextSelection:
        """
        Sélectionne les messages compatibles avec le budget.

        Les messages système sont prioritaires.

        Les autres messages sont parcourus du plus récent au plus ancien.
        """

        all_messages = list(messages or [])
        systems = list(system_messages or [])

        selected: list[AIMessage] = []
        selected_ids: set[str] = set()

        estimated_tokens = 0
        discarded = 0

        # ---------------------------------------------------------
        # 1. Messages système prioritaires
        # ---------------------------------------------------------

        for message in systems:
            if not isinstance(message, AIMessage):
                continue

            message_id = str(message.id)

            if message_id in selected_ids:
                continue

            tokens = self.estimate_tokens(message)

            if estimated_tokens + tokens <= self.budget.available_input_tokens:
                selected.append(message)
                selected_ids.add(message_id)
                estimated_tokens += tokens
            else:
                discarded += 1

        # ---------------------------------------------------------
        # 2. Dernier message utilisateur prioritaire
        # ---------------------------------------------------------

        last_user: Optional[AIMessage] = None

        if preserve_last_user:
            for message in reversed(all_messages):
                if (
                    isinstance(message, AIMessage)
                    and message.is_user
                ):
                    last_user = message
                    break

        if last_user is not None:
            message_id = str(last_user.id)

            if message_id not in selected_ids:
                tokens = self.estimate_tokens(last_user)

                if (
                    estimated_tokens + tokens
                    <= self.budget.available_input_tokens
                ):
                    selected.append(last_user)
                    selected_ids.add(message_id)
                    estimated_tokens += tokens

        # ---------------------------------------------------------
        # 3. Historique récent
        # ---------------------------------------------------------

        for message in reversed(all_messages):
            if not isinstance(message, AIMessage):
                continue

            message_id = str(message.id)

            if message_id in selected_ids:
                continue

            tokens = self.estimate_tokens(message)

            if (
                estimated_tokens + tokens
                <= self.budget.available_input_tokens
            ):
                selected.append(message)
                selected_ids.add(message_id)
                estimated_tokens += tokens
            else:
                discarded += 1

        # ---------------------------------------------------------
        # 4. Restaurer l'ordre chronologique
        # ---------------------------------------------------------

        selected.sort(
            key=lambda message: message.created_at
        )

        return ContextSelection(
            messages=selected,
            estimated_tokens=estimated_tokens,
            discarded_messages=discarded,
            truncated=discarded > 0,
            metadata={
                "budget": self.budget.to_dict(),
                "selection_strategy": "system_then_recent",
                "preserve_last_user": preserve_last_user,
            },
        )