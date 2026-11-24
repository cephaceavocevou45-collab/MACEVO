from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List


class CapabilityType(str, Enum):
    """
    Types de capacités reconnues par MACEVO IA.
    """

    TEXT = "text"
    VISION = "vision"
    MATH = "math"
    SCIENTIFIC = "scientific"
    DOCUMENT = "document"
    EQUATION = "equation"
    FIGURE = "figure"
    TABLE = "table"
    CODE = "code"
    LATEX = "latex"
    BIBLIOGRAPHY = "bibliography"
    ANALYSIS = "analysis"
    VALIDATION = "validation"


@dataclass(slots=True)
class AICapability:
    """
    Décrit une capacité exploitable par l'orchestrateur MACEVO IA.

    Une capacité peut déclarer :
    - les opérations qu'elle supporte ;
    - les providers compatibles ;
    - les outils nécessaires ;
    - son état d'activation ;
    - ses métadonnées.
    """

    name: str
    capability_type: CapabilityType | str

    description: str = ""

    enabled: bool = True

    version: str = "1.0"

    supported_operations: List[str] = field(
        default_factory=list
    )

    required_tools: List[str] = field(
        default_factory=list
    )

    supported_providers: List[str] = field(
        default_factory=list
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    def __post_init__(self) -> None:
        self.name = str(self.name or "").strip()

        if not self.name:
            raise ValueError(
                "Le nom de la capacité est obligatoire."
            )

        if isinstance(self.capability_type, str):
            self.capability_type = CapabilityType(
                self.capability_type.strip().lower()
            )

        self.description = str(
            self.description or ""
        ).strip()

        self.version = str(
            self.version or "1.0"
        ).strip()

        self.supported_operations = [
            str(operation).strip().lower()
            for operation in (
                self.supported_operations or []
            )
            if str(operation).strip()
        ]

        self.required_tools = [
            str(tool).strip()
            for tool in (
                self.required_tools or []
            )
            if str(tool).strip()
        ]

        self.supported_providers = [
            str(provider).strip().lower()
            for provider in (
                self.supported_providers or []
            )
            if str(provider).strip()
        ]

        self.metadata = dict(
            self.metadata or {}
        )

        self.validate()

    def validate(self) -> bool:
        """
        Valide complètement la définition de la capacité.

        Retourne True si la capacité est valide.
        Lève ValueError ou TypeError en cas de définition invalide.
        """

        if not self.name:
            raise ValueError(
                "Le nom de la capacité est obligatoire."
            )

        if not isinstance(
            self.capability_type,
            CapabilityType,
        ):
            raise TypeError(
                "capability_type doit être une instance "
                "de CapabilityType."
            )

        if not isinstance(self.enabled, bool):
            raise TypeError(
                "enabled doit être un booléen."
            )

        if not self.version:
            raise ValueError(
                "La version de la capacité est obligatoire."
            )

        if not isinstance(
            self.supported_operations,
            list,
        ):
            raise TypeError(
                "supported_operations doit être une liste."
            )

        if not isinstance(
            self.required_tools,
            list,
        ):
            raise TypeError(
                "required_tools doit être une liste."
            )

        if not isinstance(
            self.supported_providers,
            list,
        ):
            raise TypeError(
                "supported_providers doit être une liste."
            )

        if not isinstance(
            self.metadata,
            dict,
        ):
            raise TypeError(
                "metadata doit être un dictionnaire."
            )

        return True

    def supports_operation(
        self,
        operation: str,
    ) -> bool:
        """
        Indique si la capacité supporte une opération donnée.
        """

        operation = str(
            operation or ""
        ).strip().lower()

        if not operation:
            return False

        return operation in self.supported_operations

    def supports_provider(
        self,
        provider: str,
    ) -> bool:
        """
        Indique si la capacité est compatible avec un provider donné.

        Une liste vide signifie qu'aucune restriction de provider
        n'est imposée.
        """

        provider = str(
            provider or ""
        ).strip().lower()

        if not provider:
            return False

        if not self.supported_providers:
            return True

        return provider in self.supported_providers

    def to_dict(self) -> Dict[str, Any]:
        """
        Sérialise la capacité.
        """

        return {
            "name": self.name,
            "capability_type": self.capability_type.value,
            "description": self.description,
            "enabled": self.enabled,
            "version": self.version,
            "supported_operations": list(
                self.supported_operations
            ),
            "required_tools": list(
                self.required_tools
            ),
            "supported_providers": list(
                self.supported_providers
            ),
            "metadata": dict(
                self.metadata
            ),
        }

    def __repr__(self) -> str:
        return (
            "AICapability("
            f"name={self.name!r}, "
            f"capability_type="
            f"{self.capability_type.value!r}, "
            f"enabled={self.enabled!r}"
            ")"
        )