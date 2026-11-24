"""
==========================================================
MACEVO IA
Exceptions personnalisées
==========================================================
"""


class MacevoException(Exception):
    """
    Exception de base.
    """

    pass


class AIUnavailableException(MacevoException):
    """
    IA indisponible.
    """

    pass


class ExportException(MacevoException):
    """
    Erreur d'export.
    """

    pass