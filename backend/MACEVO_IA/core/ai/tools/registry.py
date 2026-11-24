from __future__ import annotations

from dataclasses import dataclass
from threading import RLock
from typing import Any, Callable, Iterable


ToolHandler = Callable[..., Any]


@dataclass(slots=True)
class RegisteredTool:
    """
    Représente un outil enregistré dans MACEVO IA.
    """

    name: str
    handler: ToolHandler

    description: str = ""
    version: str = "1.0"
    enabled: bool = True

    capabilities: list[str] | None = None
    metadata: dict[str, Any] | None = None

    def __post_init__(self) -> None:
        self.name = str(self.name or "").strip().lower()

        if not self.name:
            raise ValueError(
                "Le nom de l'outil est obligatoire."
            )

        if not callable(self.handler):
            raise TypeError(
                f"Le handler de l'outil '{self.name}' "
                "doit être appelable."
            )

        self.description = str(
            self.description or ""
        ).strip()

        self.version = str(
            self.version or "1.0"
        ).strip()

        self.capabilities = [
            str(capability).strip().lower()
            for capability in (
                self.capabilities or []
            )
            if str(capability).strip()
        ]

        self.metadata = dict(
            self.metadata or {}
        )

    def supports_capability(
        self,
        capability: str,
    ) -> bool:
        capability = str(
            capability or ""
        ).strip().lower()

        if not capability:
            return False

        return capability in (
            self.capabilities or []
        )

    def execute(
        self,
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        if not self.enabled:
            raise RuntimeError(
                f"L'outil '{self.name}' est désactivé."
            )

        return self.handler(
            *args,
            **kwargs,
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "enabled": self.enabled,
            "capabilities": list(
                self.capabilities or []
            ),
            "metadata": dict(
                self.metadata or {}
            ),
        }


class ToolRegistry:
    """
    Registre central des outils MACEVO IA.

    Le registre est volontairement indépendant de Django,
    des providers et de l'orchestrateur.

    Il permet :

    - l'enregistrement dynamique ;
    - la suppression ;
    - la recherche ;
    - la résolution par capacité ;
    - l'exécution ;
    - l'activation/désactivation ;
    - l'inspection du registre.
    """

    _tools: dict[str, RegisteredTool] = {}
    _lock = RLock()

    @classmethod
    def register(
        cls,
        tool: RegisteredTool | None = None,
        *,
        name: str | None = None,
        handler: ToolHandler | None = None,
        description: str = "",
        version: str = "1.0",
        enabled: bool = True,
        capabilities: Iterable[str] | None = None,
        metadata: dict[str, Any] | None = None,
        replace: bool = False,
    ) -> RegisteredTool:
        """
        Enregistre un outil.

        Deux formes sont acceptées :

            ToolRegistry.register(
                RegisteredTool(...)
            )

        ou :

            ToolRegistry.register(
                name="calculator",
                handler=calculate,
            )
        """

        if tool is not None:
            if any(
                value is not None
                for value in (
                    name,
                    handler,
                )
            ):
                raise ValueError(
                    "Fournir soit 'tool', soit les paramètres "
                    "de création, pas les deux."
                )

            registered = tool

        else:
            if not name:
                raise ValueError(
                    "Le nom de l'outil est obligatoire."
                )

            if handler is None:
                raise ValueError(
                    "Le handler de l'outil est obligatoire."
                )

            registered = RegisteredTool(
                name=name,
                handler=handler,
                description=description,
                version=version,
                enabled=enabled,
                capabilities=list(
                    capabilities or []
                ),
                metadata=metadata,
            )

        with cls._lock:
            if (
                registered.name in cls._tools
                and not replace
            ):
                raise ValueError(
                    f"L'outil '{registered.name}' "
                    "est déjà enregistré."
                )

            cls._tools[
                registered.name
            ] = registered

        return registered

    @classmethod
    def unregister(
        cls,
        name: str,
    ) -> bool:
        """
        Supprime un outil.

        Retourne True si l'outil existait.
        """

        key = cls._normalize_name(name)

        with cls._lock:
            return cls._tools.pop(
                key,
                None,
            ) is not None

    @classmethod
    def get(
        cls,
        name: str,
    ) -> RegisteredTool:
        """
        Récupère un outil.

        Lève KeyError si l'outil n'existe pas.
        """

        key = cls._normalize_name(name)

        with cls._lock:
            try:
                return cls._tools[key]
            except KeyError:
                raise KeyError(
                    f"Outil MACEVO introuvable : '{name}'."
                ) from None

    @classmethod
    def get_or_none(
        cls,
        name: str,
    ) -> RegisteredTool | None:
        key = cls._normalize_name(name)

        with cls._lock:
            return cls._tools.get(key)

    @classmethod
    def exists(
        cls,
        name: str,
    ) -> bool:
        return cls.get_or_none(name) is not None

    @classmethod
    def enable(
        cls,
        name: str,
    ) -> RegisteredTool:
        tool = cls.get(name)
        tool.enabled = True
        return tool

    @classmethod
    def disable(
        cls,
        name: str,
    ) -> RegisteredTool:
        tool = cls.get(name)
        tool.enabled = False
        return tool

    @classmethod
    def list_tools(
        cls,
        *,
        enabled_only: bool = False,
    ) -> list[RegisteredTool]:
        with cls._lock:
            tools = list(
                cls._tools.values()
            )

        if enabled_only:
            tools = [
                tool
                for tool in tools
                if tool.enabled
            ]

        return sorted(
            tools,
            key=lambda tool: tool.name,
        )

    @classmethod
    def names(
        cls,
        *,
        enabled_only: bool = False,
    ) -> list[str]:
        return [
            tool.name
            for tool in cls.list_tools(
                enabled_only=enabled_only
            )
        ]

    @classmethod
    def find_by_capability(
        cls,
        capability: str,
        *,
        enabled_only: bool = True,
    ) -> list[RegisteredTool]:
        capability = str(
            capability or ""
        ).strip().lower()

        if not capability:
            return []

        tools = cls.list_tools(
            enabled_only=enabled_only
        )

        return [
            tool
            for tool in tools
            if tool.supports_capability(
                capability
            )
        ]

    @classmethod
    def resolve_for_capabilities(
        cls,
        capabilities: Iterable[str],
        *,
        enabled_only: bool = True,
    ) -> dict[str, list[RegisteredTool]]:
        """
        Associe chaque capacité aux outils disponibles.
        """

        result: dict[
            str,
            list[RegisteredTool],
        ] = {}

        for capability in capabilities:
            normalized = str(
                capability
            ).strip().lower()

            if not normalized:
                continue

            result[normalized] = (
                cls.find_by_capability(
                    normalized,
                    enabled_only=enabled_only,
                )
            )

        return result

    @classmethod
    def execute(
        cls,
        name: str,
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        """
        Exécute directement un outil enregistré.
        """

        tool = cls.get(name)

        return tool.execute(
            *args,
            **kwargs,
        )

    @classmethod
    def execute_if_available(
        cls,
        name: str,
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        """
        Exécute un outil s'il existe.

        Retourne None si l'outil n'est pas enregistré.
        """

        tool = cls.get_or_none(name)

        if tool is None:
            return None

        return tool.execute(
            *args,
            **kwargs,
        )

    @classmethod
    def describe(
        cls,
        *,
        enabled_only: bool = False,
    ) -> list[dict[str, Any]]:
        return [
            tool.to_dict()
            for tool in cls.list_tools(
                enabled_only=enabled_only
            )
        ]

    @classmethod
    def clear(cls) -> None:
        """
        Vide complètement le registre.

        Utile pour les tests.
        """

        with cls._lock:
            cls._tools.clear()

    @classmethod
    def count(
        cls,
        *,
        enabled_only: bool = False,
    ) -> int:
        return len(
            cls.list_tools(
                enabled_only=enabled_only
            )
        )

    @staticmethod
    def _normalize_name(
        name: str,
    ) -> str:
        normalized = str(
            name or ""
        ).strip().lower()

        if not normalized:
            raise ValueError(
                "Le nom de l'outil est obligatoire."
            )

        return normalized

    def __repr__(self) -> str:
        return (
            f"ToolRegistry("
            f"tools={self.count()}"
            ")"
        )