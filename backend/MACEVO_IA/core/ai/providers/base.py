from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, Iterable, Iterator, Optional


class BaseAIProvider(ABC):
    """
    Contrat commun de tous les providers IA de MACEVO.

    Chaque provider doit pouvoir :
    - générer une réponse complète ;
    - produire une réponse en streaming ;
    - vérifier sa disponibilité ;
    - lister ses modèles ;
    - déclarer ses capacités.
    """

    provider_name = "base"

    def __init__(
        self,
        model: Optional[str] = None,
        *,
        timeout: int = 120,
        **kwargs: Any,
    ):
        self.model = model
        self.timeout = timeout
        self.options: Dict[str, Any] = dict(kwargs)

    @abstractmethod
    def generate(
        self,
        messages: Iterable[Dict[str, Any]],
        *,
        model: Optional[str] = None,
        temperature: float = 0.4,
        max_tokens: int = 4096,
        tools: Optional[list] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        """
        Génération complète.
        """
        raise NotImplementedError

    @abstractmethod
    def stream(
        self,
        messages: Iterable[Dict[str, Any]],
        *,
        model: Optional[str] = None,
        temperature: float = 0.4,
        max_tokens: int = 4096,
        tools: Optional[list] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Iterator[Any]:
        """
        Génération en streaming.

        Le provider doit produire des événements/chunks
        successifs sans imposer un format propre à son fournisseur.
        """
        raise NotImplementedError

    def health_check(self) -> bool:
        """
        Vérifie si le provider est disponible.
        """
        return True

    def list_models(self) -> list:
        """
        Retourne les modèles disponibles.
        """
        return []

    def supports(self, capability: str) -> bool:
        """
        Indique si le provider supporte une capacité.
        """
        return False

    def get_info(self) -> Dict[str, Any]:
        """
        Informations publiques sur le provider.
        """
        return {
            "provider": self.provider_name,
            "model": self.model,
            "timeout": self.timeout,
        }

    def normalize_model(
        self,
        model: Optional[str] = None,
    ) -> str:
        """
        Résout le modèle demandé ou le modèle configuré.
        """
        resolved = model or self.model

        if not resolved:
            raise ValueError(
                f"Aucun modèle n'est défini pour le provider "
                f"'{self.provider_name}'."
            )

        return str(resolved).strip()

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"provider={self.provider_name!r}, "
            f"model={self.model!r}"
            f")"
        )