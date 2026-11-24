"""
MACEVO - Import Exceptions
Version: 1.0.1
"""


class ImportErrorBase(Exception):
    """Erreur de base du moteur d'importation."""

    def __init__(self, message: str, *, path: str | None = None):
        super().__init__(message)
        self.message = message
        self.path = path

    def __str__(self) -> str:
        if self.path:
            return f"{self.message} [fichier: {self.path}]"
        return self.message


class UnsupportedFormatError(ImportErrorBase):
    """Format de fichier non supporté."""


class ImportExtractionError(ImportErrorBase):
    """Erreur pendant l'extraction du contenu."""


class ImportValidationError(ImportErrorBase):
    """Erreur de validation du document importé."""


class ImportConfigurationError(ImportErrorBase):
    """Configuration invalide du moteur d'importation."""