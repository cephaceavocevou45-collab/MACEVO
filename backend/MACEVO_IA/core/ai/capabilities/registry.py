from __future__ import annotations

from typing import Dict, List, Optional

from core.ai.contracts.capability import (
    AICapability,
    CapabilityType,
)


class CapabilityRegistry:
    """
    Registre central des capacités IA de MACEVO_IA.

    Le registre décrit les capacités disponibles.
    Il ne réalise aucune génération et ne dépend d'aucun provider.
    """

    _capabilities: Dict[str, AICapability] = {}

    @classmethod
    def register(
        cls,
        capability: AICapability,
    ) -> None:
        """
        Enregistre une capacité.
        """

        if not isinstance(
            capability,
            AICapability,
        ):
            raise TypeError(
                "capability must be an AICapability instance."
            )

        name = capability.name.strip().lower()

        if not name:
            raise ValueError(
                "Capability name cannot be empty."
            )

        cls._capabilities[name] = capability

    @classmethod
    def get(
        cls,
        name: str,
    ) -> AICapability:
        """
        Récupère une capacité par son nom.
        """

        normalized_name = name.strip().lower()

        try:
            return cls._capabilities[
                normalized_name
            ]
        except KeyError as exc:
            available = ", ".join(
                cls.list_names()
            ) or "aucune"

            raise ValueError(
                f"Capacité inconnue: {normalized_name}. "
                f"Capacités disponibles: {available}"
            ) from exc

    @classmethod
    def exists(
        cls,
        name: str,
    ) -> bool:
        return (
            name.strip().lower()
            in cls._capabilities
        )

    @classmethod
    def unregister(
        cls,
        name: str,
    ) -> None:
        cls._capabilities.pop(
            name.strip().lower(),
            None,
        )

    @classmethod
    def list(
        cls,
        capability_type: Optional[
            CapabilityType
        ] = None,
    ) -> List[AICapability]:
        """
        Retourne toutes les capacités.

        Un filtre par type peut être appliqué.
        """

        capabilities = list(
            cls._capabilities.values()
        )

        if capability_type is not None:
            capabilities = [
                capability
                for capability in capabilities
                if capability.type == capability_type
            ]

        return capabilities

    @classmethod
    def list_names(cls) -> List[str]:
        return sorted(
            cls._capabilities.keys()
        )

    @classmethod
    def all(cls) -> Dict[str, AICapability]:
        return dict(cls._capabilities)

    @classmethod
    def clear(cls) -> None:
        cls._capabilities.clear()