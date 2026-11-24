"""
MACEVO - Import Registry
Version: 1.1.0

Registre central des extracteurs MACEVO.

Le registre standard initialise automatiquement les extracteurs
natifs supportés par MACEVO :

    TXT
    PDF
    DOCX
    CSV
    XLSX
    IMAGE

Un registre personnalisé peut toujours être créé et alimenté
manuellement si nécessaire.
"""

from __future__ import annotations

from typing import Dict

from core.importers.extractors.base import BaseExtractor
from core.importers.models import ImportFormat


class ImportRegistry:
    """
    Registre central des extracteurs MACEVO.

    Par défaut, un registre standard est initialisé avec tous les
    extracteurs natifs disponibles.

    Exemple :

        registry = ImportRegistry()

        registry.has(ImportFormat.TXT)
        registry.get(ImportFormat.PDF)

    Il reste possible d'enregistrer ou de remplacer un extracteur :

        registry.register(
            ImportFormat.TXT,
            MonExtracteurTXT(),
        )
    """

    VERSION = "1.1.0"

    def __init__(
        self,
        *,
        load_defaults: bool = True,
    ) -> None:
        self._extractors: Dict[
            ImportFormat,
            BaseExtractor,
        ] = {}

        if load_defaults:
            self._register_default_extractors()

    def _register_default_extractors(self) -> None:
        """
        Enregistre les extracteurs natifs MACEVO.

        Les imports sont effectués localement afin de limiter les
        risques de dépendances circulaires lors du chargement
        du package core.importers.
        """

        from core.importers.extractors.csv import CSVExtractor
        from core.importers.extractors.docx import DOCXExtractor
        from core.importers.extractors.image import ImageExtractor
        from core.importers.extractors.pdf import PDFExtractor
        from core.importers.extractors.txt import TXTExtractor
        from core.importers.extractors.xlsx import XLSXExtractor

        default_extractors = {
            ImportFormat.TXT: TXTExtractor(),
            ImportFormat.PDF: PDFExtractor(),
            ImportFormat.DOCX: DOCXExtractor(),
            ImportFormat.CSV: CSVExtractor(),
            ImportFormat.XLSX: XLSXExtractor(),
            ImportFormat.IMAGE: ImageExtractor(),
        }

        for import_format, extractor in default_extractors.items():
            self.register(
                import_format,
                extractor,
            )

    def register(
        self,
        import_format: ImportFormat,
        extractor: BaseExtractor,
    ) -> None:
        """
        Enregistre un extracteur pour un format.

        Si un extracteur existe déjà pour ce format, il est remplacé.
        Cela permet notamment d'utiliser un extracteur spécialisé
        sans modifier le moteur principal.
        """

        if not isinstance(import_format, ImportFormat):
            raise TypeError(
                "import_format doit être une instance de ImportFormat."
            )

        if not isinstance(extractor, BaseExtractor):
            raise TypeError(
                "extractor doit être une instance de BaseExtractor."
            )

        self._extractors[import_format] = extractor

    def get(
        self,
        import_format: ImportFormat,
    ) -> BaseExtractor:
        """
        Retourne l'extracteur correspondant au format demandé.
        """

        if not isinstance(import_format, ImportFormat):
            raise TypeError(
                "import_format doit être une instance de ImportFormat."
            )

        try:
            return self._extractors[import_format]

        except KeyError as exc:
            raise ValueError(
                "Aucun extracteur enregistré pour le format : "
                f"{import_format.value}"
            ) from exc

    def has(
        self,
        import_format: ImportFormat,
    ) -> bool:
        """
        Indique si un extracteur est enregistré.
        """

        return import_format in self._extractors

    def formats(self) -> list[ImportFormat]:
        """
        Retourne la liste des formats actuellement enregistrés.
        """

        return list(self._extractors.keys())

    def unregister(
        self,
        import_format: ImportFormat,
    ) -> bool:
        """
        Supprime un extracteur du registre.

        Retourne True si un extracteur a effectivement été supprimé.
        """

        return self._extractors.pop(
            import_format,
            None,
        ) is not None

    def clear(self) -> None:
        """
        Vide complètement le registre.

        Utile principalement pour les tests ou pour construire
        explicitement un registre personnalisé.
        """

        self._extractors.clear()

    def reload_defaults(self) -> None:
        """
        Recharge les extracteurs natifs MACEVO.

        Les extracteurs actuellement enregistrés sont remplacés
        par les implémentations natives.
        """

        self.clear()
        self._register_default_extractors()