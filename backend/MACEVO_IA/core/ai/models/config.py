from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class AIModelConfig:
    """
    Configuration complète d'un modèle IA MACEVO.

    Cette classe décrit les capacités et paramètres d'un modèle,
    indépendamment du fournisseur qui l'héberge.

    Exemple :

        provider="ollama"
        model="qwen3:latest"
    """

    model: str
    provider: str

    temperature: float = 0.4
    max_tokens: int = 4096

    top_p: Optional[float] = 0.9
    top_k: Optional[int] = None

    timeout: int = 120

    supports_streaming: bool = True
    supports_tools: bool = False
    supports_vision: bool = False
    supports_reasoning: bool = False

    metadata: Dict[str, Any] = field(default_factory=dict)
    options: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        """
        Normalisation légère après création.
        """
        self.model = str(self.model or "").strip()
        self.provider = str(self.provider or "").strip().lower()

        if self.metadata is None:
            self.metadata = {}

        if self.options is None:
            self.options = {}

        self.metadata = dict(self.metadata)
        self.options = dict(self.options)

    # ------------------------------------------------------------------
    # VALIDATION
    # ------------------------------------------------------------------

    def validate(self) -> "AIModelConfig":
        """
        Valide la configuration du modèle.

        Retourne self lorsque la configuration est valide.
        Lève ValueError en cas de configuration invalide.
        """

        if not self.model:
            raise ValueError(
                "Le nom du modèle est obligatoire."
            )

        if not self.provider:
            raise ValueError(
                "Le provider du modèle est obligatoire."
            )

        # --------------------------------------------------------------
        # Temperature
        # --------------------------------------------------------------

        try:
            self.temperature = float(self.temperature)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "temperature doit être un nombre."
            ) from exc

        if not 0.0 <= self.temperature <= 2.0:
            raise ValueError(
                "temperature doit être comprise entre 0 et 2."
            )

        # --------------------------------------------------------------
        # Max tokens
        # --------------------------------------------------------------

        try:
            self.max_tokens = int(self.max_tokens)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "max_tokens doit être un entier."
            ) from exc

        if self.max_tokens <= 0:
            raise ValueError(
                "max_tokens doit être supérieur à 0."
            )

        # --------------------------------------------------------------
        # Top P
        # --------------------------------------------------------------

        if self.top_p is not None:
            try:
                self.top_p = float(self.top_p)
            except (TypeError, ValueError) as exc:
                raise ValueError(
                    "top_p doit être un nombre."
                ) from exc

            if not 0.0 < self.top_p <= 1.0:
                raise ValueError(
                    "top_p doit être supérieur à 0 et inférieur "
                    "ou égal à 1."
                )

        # --------------------------------------------------------------
        # Top K
        # --------------------------------------------------------------

        if self.top_k is not None:
            try:
                self.top_k = int(self.top_k)
            except (TypeError, ValueError) as exc:
                raise ValueError(
                    "top_k doit être un entier."
                ) from exc

            if self.top_k <= 0:
                raise ValueError(
                    "top_k doit être supérieur à 0."
                )

        # --------------------------------------------------------------
        # Timeout
        # --------------------------------------------------------------

        try:
            self.timeout = int(self.timeout)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "timeout doit être un entier."
            ) from exc

        if self.timeout <= 0:
            raise ValueError(
                "timeout doit être supérieur à 0."
            )

        # --------------------------------------------------------------
        # Booléens
        # --------------------------------------------------------------

        boolean_fields = (
            "supports_streaming",
            "supports_tools",
            "supports_vision",
            "supports_reasoning",
        )

        for field_name in boolean_fields:
            value = getattr(self, field_name)

            if not isinstance(value, bool):
                raise ValueError(
                    f"{field_name} doit être un booléen."
                )

        # --------------------------------------------------------------
        # Dictionnaires
        # --------------------------------------------------------------

        if not isinstance(self.metadata, dict):
            raise ValueError(
                "metadata doit être un dictionnaire."
            )

        if not isinstance(self.options, dict):
            raise ValueError(
                "options doit être un dictionnaire."
            )

        return self

    # ------------------------------------------------------------------
    # SERIALISATION
    # ------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        """
        Transforme la configuration en dictionnaire sérialisable.
        """

        return {
            "model": self.model,
            "provider": self.provider,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "top_p": self.top_p,
            "top_k": self.top_k,
            "timeout": self.timeout,
            "supports_streaming": self.supports_streaming,
            "supports_tools": self.supports_tools,
            "supports_vision": self.supports_vision,
            "supports_reasoning": self.supports_reasoning,
            "metadata": dict(self.metadata),
            "options": dict(self.options),
        }

    # ------------------------------------------------------------------
    # COPIE AVEC SURCHARGES
    # ------------------------------------------------------------------

    def with_overrides(
        self,
        *,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        timeout: Optional[int] = None,
        supports_streaming: Optional[bool] = None,
        supports_tools: Optional[bool] = None,
        supports_vision: Optional[bool] = None,
        supports_reasoning: Optional[bool] = None,
        metadata: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> "AIModelConfig":
        """
        Crée une nouvelle configuration à partir de celle-ci
        avec certaines valeurs remplacées.
        """

        return AIModelConfig(
            model=self.model if model is None else model,
            provider=self.provider if provider is None else provider,
            temperature=(
                self.temperature
                if temperature is None
                else temperature
            ),
            max_tokens=(
                self.max_tokens
                if max_tokens is None
                else max_tokens
            ),
            top_p=self.top_p if top_p is None else top_p,
            top_k=self.top_k if top_k is None else top_k,
            timeout=self.timeout if timeout is None else timeout,
            supports_streaming=(
                self.supports_streaming
                if supports_streaming is None
                else supports_streaming
            ),
            supports_tools=(
                self.supports_tools
                if supports_tools is None
                else supports_tools
            ),
            supports_vision=(
                self.supports_vision
                if supports_vision is None
                else supports_vision
            ),
            supports_reasoning=(
                self.supports_reasoning
                if supports_reasoning is None
                else supports_reasoning
            ),
            metadata=(
                dict(self.metadata)
                if metadata is None
                else dict(metadata)
            ),
            options=(
                dict(self.options)
                if options is None
                else dict(options)
            ),
        )

    # ------------------------------------------------------------------
    # HELPERS
    # ------------------------------------------------------------------

    def supports(self, capability: str) -> bool:
        """
        Indique si le modèle supporte une capacité donnée.

        Capacités reconnues :

        - streaming
        - tools
        - vision
        - reasoning
        """

        capability = (capability or "").strip().lower()

        mapping = {
            "streaming": self.supports_streaming,
            "stream": self.supports_streaming,
            "tools": self.supports_tools,
            "tool": self.supports_tools,
            "vision": self.supports_vision,
            "reasoning": self.supports_reasoning,
        }

        return bool(mapping.get(capability, False))

    def __repr__(self) -> str:
        return (
            f"AIModelConfig("
            f"provider={self.provider!r}, "
            f"model={self.model!r}"
            f")"
        )