"""
MACEVO - Base Extractor
Version: 1.0.1
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from core.importers.models import ImportedDocument, ImportFormat


class BaseExtractor(ABC):
    """
    Interface commune à tous les extracteurs MACEVO.
    """

    format: ImportFormat

    @abstractmethod
    def extract(self, path: Path) -> ImportedDocument:
        """
        Extrait le contenu d'un fichier et retourne un
        ImportedDocument normalisé.
        """
        raise NotImplementedError

    def validate_path(self, path: Path) -> None:
        if not path.exists():
            raise FileNotFoundError(f"Fichier introuvable : {path}")

        if not path.is_file():
            raise ValueError(f"Le chemin n'est pas un fichier : {path}")