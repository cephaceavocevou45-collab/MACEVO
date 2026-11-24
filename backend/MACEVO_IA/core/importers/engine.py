"""
MACEVO - Import Engine
Version: 1.1.0

Moteur principal d'importation des documents.

Pipeline :

    fichier
        ↓
    détection du format
        ↓
    registre des extracteurs
        ↓
    sélection de l'extracteur
        ↓
    extraction
        ↓
    ImportedDocument
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from core.importers.detectors.format_detector import FormatDetector
from core.importers.exceptions import (
    ImportExtractionError,
    UnsupportedFormatError,
)
from core.importers.models import ImportedDocument, ImportFormat
from core.importers.registry import ImportRegistry


class ImportEngine:
    """
    Orchestre le pipeline d'importation MACEVO.

    Le moteur utilise par défaut un ImportRegistry configuré avec
    les extracteurs natifs MACEVO.

    Exemple :

        engine = ImportEngine()

        document = engine.import_file(
            "document.pdf"
        )

    Un registre personnalisé peut également être fourni :

        registry = ImportRegistry(
            load_defaults=False
        )

        registry.register(
            ImportFormat.TXT,
            MonExtracteurTXT()
        )

        engine = ImportEngine(
            registry=registry
        )
    """

    VERSION = "1.1.0"

    def __init__(
        self,
        registry: Optional[ImportRegistry] = None,
        detector: Optional[FormatDetector] = None,
    ) -> None:
        """
        Initialise le moteur d'importation.

        Si aucun registre n'est fourni, ImportRegistry() crée
        automatiquement le registre standard MACEVO avec tous
        les extracteurs natifs.
        """

        self.detector = detector or FormatDetector()

        self.registry = (
            registry
            if registry is not None
            else ImportRegistry()
        )

    def register(
        self,
        import_format: ImportFormat,
        extractor,
    ) -> None:
        """
        Enregistre ou remplace un extracteur.

        Cette méthode permet d'ajouter un extracteur spécialisé
        sans accéder directement au registre interne.
        """

        self.registry.register(
            import_format,
            extractor,
        )

    def detect_format(
        self,
        path: str | Path,
    ) -> ImportFormat:
        """
        Détecte le format d'un fichier.

        Raises:
            FileNotFoundError:
                si le fichier n'existe pas.

            ValueError:
                si le chemin ne correspond pas à un fichier.

            UnsupportedFormatError:
                si le format n'est pas supporté.
        """

        file_path = Path(path)

        if not file_path.exists():
            raise FileNotFoundError(
                f"Fichier introuvable : {file_path}"
            )

        if not file_path.is_file():
            raise ValueError(
                f"Le chemin n'est pas un fichier : {file_path}"
            )

        try:
            return self.detector.detect(
                file_path
            )

        except ValueError as exc:
            raise UnsupportedFormatError(
                str(exc),
                path=str(file_path),
            ) from exc

    def get_extractor(
        self,
        import_format: ImportFormat,
    ):
        """
        Retourne l'extracteur associé à un format.

        Cette méthode rend explicite la séparation entre :

            détection
                ↓
            sélection de l'extracteur
                ↓
            extraction
        """

        return self.registry.get(
            import_format
        )

    def import_file(
        self,
        path: str | Path,
    ) -> ImportedDocument:
        """
        Importe un fichier et retourne un ImportedDocument.

        Pipeline :

            1. validation du chemin
            2. détection du format
            3. récupération de l'extracteur
            4. extraction
            5. validation du résultat
        """

        file_path = Path(path)

        import_format = self.detect_format(
            file_path
        )

        extractor = self.get_extractor(
            import_format
        )

        try:
            document = extractor.extract(
                file_path
            )

        except Exception as exc:
            raise ImportExtractionError(
                "Échec de l'extraction du fichier : "
                f"{exc}",
                path=str(file_path),
            ) from exc

        if not isinstance(
            document,
            ImportedDocument,
        ):
            raise ImportExtractionError(
                "L'extracteur n'a pas retourné "
                "un ImportedDocument.",
                path=str(file_path),
            )

        return document

    def import_path(
        self,
        path: str | Path,
    ) -> ImportedDocument:
        """
        Alias explicite de import_file().
        """

        return self.import_file(
            path
        )