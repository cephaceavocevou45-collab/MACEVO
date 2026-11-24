
"""
==========================================================
MACEVO IA
Base Provider
==========================================================

Interface abstraite commune à tous les fournisseurs IA.

Providers prévus :
- Ollama
- OpenAI
- Gemini
- Anthropic

Capacités spécialisées prévues :
- Vision
- Math
- Scientific

Principe :
Le reste de MACEVO ne doit pas dépendre directement d'un
provider particulier. Chaque provider doit respecter cette
interface afin de pouvoir être remplacé ou complété
ultérieurement.

Auteur : MACEVO
"""

from abc import ABC, abstractmethod


class BaseProvider(ABC):
    """
    Classe de base de tous les fournisseurs IA de MACEVO.

    Cette classe définit le contrat minimal que doit respecter
    chaque provider.

    Exemples :
        OllamaProvider
        OpenAIProvider
        GeminiProvider
        AnthropicProvider
    """

    # =====================================================
    # Identité
    # =====================================================

    provider_name = "unknown"

    def __init__(
        self,
        model=None,
        temperature=0.7,
        max_tokens=4096,
        **kwargs,
    ):
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.options = kwargs

    # =====================================================
    # Informations provider / modèle
    # =====================================================

    def current_model(self):
        """
        Retourne le modèle actuellement utilisé.

        Les providers peuvent surcharger cette méthode si
        leur gestion des modèles est plus complexe.
        """
        return self.model

    def info(self):
        """
        Retourne les informations principales du provider.
        """

        return {
            "provider": self.provider_name,
            "model": self.current_model(),
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "capabilities": self.capabilities(),
        }

    # =====================================================
    # Capacités
    # =====================================================

    def capabilities(self):
        """
        Retourne les capacités supportées par le provider.

        Un provider concret peut surcharger cette méthode.

        Exemple :

            {
                "chat": True,
                "streaming": True,
                "vision": True,
                "math": True,
                "scientific": True,
            }
        """

        return {
            "chat": True,
            "streaming": True,
            "vision": False,
            "math": False,
            "scientific": False,
        }

    def supports(self, capability):
        """
        Vérifie si le provider supporte une capacité donnée.

        Exemple :

            provider.supports("vision")
        """

        if not capability:
            return False

        capability = str(capability).strip().lower()

        return bool(
            self.capabilities().get(capability, False)
        )

    # =====================================================
    # Chat
    # =====================================================

    @abstractmethod
    def generate_response(
        self,
        messages,
    ):
        """
        Génère une réponse classique.

        Parameters
        ----------
        messages : list
            Liste standardisée de messages :

            [
                {
                    "role": "system",
                    "content": "..."
                },
                {
                    "role": "user",
                    "content": "..."
                }
            ]

        Returns
        -------
        str
            Réponse générée par le modèle.
        """
        raise NotImplementedError

    # =====================================================
    # Streaming
    # =====================================================

    @abstractmethod
    def stream_response(
        self,
        messages,
    ):
        """
        Génère une réponse en streaming.

        Le provider doit retourner un flux permettant à
        l'interface MACEVO d'afficher progressivement
        la réponse.
        """
        raise NotImplementedError

    # =====================================================
    # Modèles
    # =====================================================

    @abstractmethod
    def list_models(self):
        """
        Retourne les modèles disponibles chez le provider.
        """
        raise NotImplementedError

    # =====================================================
    # Santé du provider
    # =====================================================

    @abstractmethod
    def health_check(self):
        """
        Vérifie que le provider est disponible.

        Exemple de résultat :

            {
                "available": True,
                "provider": "ollama",
                "model": "..."
            }
        """
        raise NotImplementedError

    # =====================================================
    # Tâches spécialisées
    # =====================================================

    def generate_vision(
        self,
        messages,
        **kwargs,
    ):
        """
        Génération/analyse multimodale.

        Les providers compatibles Vision pourront surcharger
        cette méthode.

        Pour l'instant, on ne force aucun provider à implémenter
        Vision.
        """

        raise NotImplementedError(
            f"Le provider '{self.provider_name}' "
            "ne fournit pas encore la capacité Vision."
        )

    def generate_math(
        self,
        messages,
        **kwargs,
    ):
        """
        Opération spécialisée en mathématiques.

        Cette méthode pourra être reliée plus tard à un modèle
        ou moteur mathématique spécialisé.
        """

        raise NotImplementedError(
            f"Le provider '{self.provider_name}' "
            "ne fournit pas encore la capacité Math."
        )

    def generate_scientific(
        self,
        messages,
        **kwargs,
    ):
        """
        Opération spécialisée scientifique.

        Cette capacité pourra gérer notamment :
        - rédaction scientifique ;
        - analyse scientifique ;
        - structuration ;
        - méthodologie ;
        - équations ;
        - interprétation de résultats ;
        - références ;
        - amélioration académique.

        Les providers compatibles pourront surcharger cette
        méthode.
        """

        raise NotImplementedError(
            f"Le provider '{self.provider_name}' "
            "ne fournit pas encore la capacité Scientific."
        )

    # =====================================================
    # Construction des messages
    # =====================================================

    @staticmethod
    def build_message(
        role,
        content,
    ):
        """
        Construit un message au format standard MACEVO.
        """

        if not role:
            raise ValueError(
                "Le rôle du message est obligatoire."
            )

        if content is None:
            content = ""

        return {
            "role": str(role),
            "content": str(content),
        }

    def build_system_prompt(
        self,
        prompt,
    ):
        """
        Construit un message système.
        """

        return self.build_message(
            "system",
            prompt,
        )

    def build_user_prompt(
        self,
        prompt,
    ):
        """
        Construit un message utilisateur.
        """

        return self.build_message(
            "user",
            prompt,
        )

    def build_assistant_prompt(
        self,
        prompt,
    ):
        """
        Construit un message assistant.
        """

        return self.build_message(
            "assistant",
            prompt,
        )

    # =====================================================
    # Configuration
    # =====================================================

    def configure(
        self,
        model=None,
        temperature=None,
        max_tokens=None,
        **kwargs,
    ):
        """
        Permet de modifier la configuration du provider
        sans recréer nécessairement son instance.
        """

        if model is not None:
            self.model = model

        if temperature is not None:
            self.temperature = temperature

        if max_tokens is not None:
            self.max_tokens = max_tokens

        if kwargs:
            self.options.update(kwargs)

        return self

    # =====================================================
    # Représentation
    # =====================================================

    def __repr__(self):
        return (
            f"<{self.__class__.__name__} "
            f"provider={self.provider_name!r} "
            f"model={self.current_model()!r}>"
        )
