
"""
==========================================================
MACEVO IA
AI Exceptions
==========================================================

Exceptions personnalisées du moteur IA MACEVO.

Cette hiérarchie couvre notamment :
    - moteur IA ;
    - providers ;
    - configuration ;
    - authentification ;
    - API ;
    - modèles ;
    - prompts ;
    - contexte ;
    - génération ;
    - streaming ;
    - capacités spécialisées ;
    - analyse scientifique ;
    - documents ;
    - sorties structurées ;
    - LaTeX ;
    - exports.

Les exceptions peuvent transporter des informations
complémentaires sur le provider, le modèle et les détails
techniques de l'erreur.

Auteur : MACEVO
"""


class AIServiceError(Exception):
    """
    Exception racine du moteur IA MACEVO.

    Tous les problèmes contrôlables du moteur IA doivent
    idéalement dériver de cette classe.
    """

    default_message = (
        "Une erreur est survenue dans le moteur IA."
    )

    def __init__(
        self,
        message=None,
        *,
        provider=None,
        model=None,
        details=None,
    ):
        self.provider = provider
        self.model = model
        self.details = details

        final_message = (
            str(message)
            if message
            else self.default_message
        )

        super().__init__(final_message)

    def __str__(self):
        """
        Représentation lisible de l'erreur.

        Le message principal reste prioritaire.
        Les informations techniques restent accessibles
        via les attributs provider, model et details.
        """

        return super().__str__()

    def to_dict(self):
        """
        Transforme l'erreur en dictionnaire.

        Utile pour :
            - les réponses API Django ;
            - les logs ;
            - le frontend ;
            - le monitoring.
        """

        return {
            "error": self.__class__.__name__,
            "message": str(self),
            "provider": self.provider,
            "model": self.model,
            "details": self.details,
        }


# ==========================================================
# PROVIDERS
# ==========================================================


class ProviderNotFoundError(AIServiceError):
    """
    Provider demandé introuvable.
    """

    default_message = (
        "Le fournisseur IA demandé est introuvable."
    )


class UnsupportedProviderError(AIServiceError):
    """
    Provider non supporté par MACEVO.
    """

    default_message = (
        "Ce fournisseur IA n'est pas supporté par MACEVO."
    )


class ProviderConnectionError(AIServiceError):
    """
    Impossible de communiquer avec un provider.
    """

    default_message = (
        "Impossible de contacter le fournisseur IA."
    )


class ProviderConfigurationError(AIServiceError):
    """
    Configuration incorrecte d'un provider.

    Exemples :
        - URL incorrecte ;
        - configuration manquante ;
        - paramètres incompatibles ;
        - modèle mal configuré.
    """

    default_message = (
        "La configuration du fournisseur IA est incorrecte."
    )


class ProviderInitializationError(AIServiceError):
    """
    Échec lors de l'initialisation d'un provider.
    """

    default_message = (
        "Impossible d'initialiser le fournisseur IA."
    )


# ==========================================================
# AUTHENTIFICATION / API
# ==========================================================


class AuthenticationError(AIServiceError):
    """
    Authentification auprès du provider impossible.

    Exemples :
        - clé API absente ;
        - clé API invalide ;
        - credentials refusés.
    """

    default_message = (
        "Authentification auprès du fournisseur IA impossible."
    )


class APIError(AIServiceError):
    """
    Erreur générale retournée par une API IA.
    """

    default_message = (
        "Le fournisseur IA a retourné une erreur API."
    )


class RateLimitError(APIError):
    """
    Limite de requêtes atteinte.
    """

    default_message = (
        "La limite de requêtes du fournisseur IA a été atteinte."
    )


class QuotaExceededError(APIError):
    """
    Quota ou crédit API épuisé.
    """

    default_message = (
        "Le quota du fournisseur IA a été dépassé."
    )


class InvalidAPIResponseError(APIError):
    """
    Réponse API techniquement invalide ou inattendue.
    """

    default_message = (
        "La réponse reçue de l'API IA est invalide."
    )


# ==========================================================
# MODÈLES
# ==========================================================


class ModelNotFoundError(AIServiceError):
    """
    Modèle IA introuvable.
    """

    default_message = (
        "Le modèle IA demandé est introuvable."
    )


class UnsupportedModelError(AIServiceError):
    """
    Modèle non supporté par le provider.
    """

    default_message = (
        "Ce modèle n'est pas pris en charge."
    )


class ModelUnavailableError(AIServiceError):
    """
    Modèle momentanément indisponible.
    """

    default_message = (
        "Le modèle IA est momentanément indisponible."
    )


class ModelConfigurationError(AIServiceError):
    """
    Configuration invalide d'un modèle.
    """

    default_message = (
        "La configuration du modèle IA est incorrecte."
    )


# ==========================================================
# PROMPTS / CONTEXTE
# ==========================================================


class InvalidPromptError(AIServiceError):
    """
    Prompt invalide.
    """

    default_message = (
        "Le prompt fourni est invalide."
    )


class InvalidMessageError(AIServiceError):
    """
    Message IA mal formé.
    """

    default_message = (
        "Le message fourni au moteur IA est invalide."
    )


class ContextOverflowError(AIServiceError):
    """
    Contexte trop volumineux pour le modèle.
    """

    default_message = (
        "Le contexte dépasse la taille maximale autorisée."
    )


class ContextBuildError(AIServiceError):
    """
    Impossible de construire le contexte IA.
    """

    default_message = (
        "Impossible de construire le contexte IA."
    )


# ==========================================================
# GÉNÉRATION
# ==========================================================


class GenerationError(AIServiceError):
    """
    Erreur générale durant une génération.
    """

    default_message = (
        "Une erreur est survenue lors de la génération."
    )


class ResponseParsingError(AIServiceError):
    """
    Réponse IA impossible à analyser.
    """

    default_message = (
        "Impossible d'analyser la réponse du modèle."
    )


class InvalidResponseError(AIServiceError):
    """
    Réponse du provider mal formée ou inattendue.
    """

    default_message = (
        "Le fournisseur IA a retourné une réponse invalide."
    )


class StructuredOutputError(GenerationError):
    """
    La réponse du modèle ne respecte pas la structure
    attendue.
    """

    default_message = (
        "La sortie structurée du modèle est invalide."
    )


# ==========================================================
# STREAMING
# ==========================================================


class StreamError(AIServiceError):
    """
    Erreur générale pendant le streaming.
    """

    default_message = (
        "Le streaming de la réponse a échoué."
    )


class StreamConnectionError(StreamError):
    """
    Connexion de streaming interrompue.
    """

    default_message = (
        "La connexion de streaming avec le fournisseur "
        "IA a été interrompue."
    )


class StreamParsingError(StreamError):
    """
    Fragment de streaming impossible à analyser.
    """

    default_message = (
        "Impossible d'analyser un fragment de streaming."
    )


# ==========================================================
# TEMPS D'EXÉCUTION
# ==========================================================


class TimeoutError(AIServiceError):
    """
    Temps de réponse dépassé.
    """

    default_message = (
        "Le délai de réponse du modèle a été dépassé."
    )


# ==========================================================
# CAPACITÉS SPÉCIALISÉES
# ==========================================================


class UnsupportedCapabilityError(AIServiceError):
    """
    Provider ou modèle ne possédant pas la capacité
    demandée.
    """

    default_message = (
        "La capacité IA demandée n'est pas disponible."
    )


class VisionError(AIServiceError):
    """
    Erreur lors d'une opération de vision.
    """

    default_message = (
        "Une erreur est survenue lors de l'analyse visuelle."
    )


class MathError(AIServiceError):
    """
    Erreur lors d'une opération mathématique.
    """

    default_message = (
        "Une erreur est survenue lors du traitement "
        "mathématique."
    )


class ScientificError(AIServiceError):
    """
    Erreur lors d'une opération scientifique.
    """

    default_message = (
        "Une erreur est survenue lors du traitement "
        "scientifique."
    )


# ==========================================================
# DOCUMENTS
# ==========================================================


class DocumentAnalysisError(AIServiceError):
    """
    Erreur lors de l'analyse d'un document.
    """

    default_message = (
        "Impossible d'analyser correctement le document."
    )


class DocumentGenerationError(AIServiceError):
    """
    Erreur lors de la génération d'un document.
    """

    default_message = (
        "Impossible de générer correctement le document."
    )


class DocumentStructureError(AIServiceError):
    """
    Structure scientifique ou documentaire invalide.
    """

    default_message = (
        "La structure du document est invalide."
    )


# ==========================================================
# BIBLIOGRAPHIE / RÉFÉRENCES
# ==========================================================


class BibliographyError(AIServiceError):
    """
    Erreur liée à la bibliographie ou aux références.
    """

    default_message = (
        "Une erreur est survenue lors du traitement "
        "de la bibliographie."
    )


class CitationError(BibliographyError):
    """
    Erreur liée à une citation ou une référence.
    """

    default_message = (
        "Une erreur est survenue lors du traitement "
        "d'une citation."
    )


# ==========================================================
# LATEX
# ==========================================================


class LaTeXGenerationError(AIServiceError):
    """
    Erreur lors de la génération LaTeX.
    """

    default_message = (
        "Impossible de générer correctement le document LaTeX."
    )


class LaTeXCompilationError(AIServiceError):
    """
    Erreur lors de la compilation LaTeX.
    """

    default_message = (
        "La compilation du document LaTeX a échoué."
    )


# ==========================================================
# EXPORT
# ==========================================================


class ExportGenerationError(AIServiceError):
    """
    Erreur lors de la préparation d'un export.
    """

    default_message = (
        "Impossible de générer l'export demandé."
    )


class ExportFormatError(AIServiceError):
    """
    Format d'export invalide ou non supporté.
    """

    default_message = (
        "Le format d'export demandé n'est pas supporté."
    )
