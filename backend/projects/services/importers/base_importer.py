
"""
==========================================================
MACEVO IA
Base Importer
==========================================================

Contrat commun de tous les importeurs MACEVO.

Architecture :

    Fichier source
        ↓
    Importer spécialisé
        ↓
    BaseImporter.build_result()
        ↓
    résultat normalisé
        ↓
    analyse scientifique / Document IR

Objectif :
- standardiser les résultats d'importation ;
- conserver les métadonnées ;
- calculer les statistiques de base ;
- préparer l'intégration future avec le Document IR ;
- fournir des helpers communs aux importeurs.
"""

from abc import ABC, abstractmethod
from pathlib import Path


class BaseImporter(ABC):
    """
    Classe mère de tous les importeurs MACEVO.

    Chaque importeur spécialisé doit :
        1. déclarer ses extensions supportées ;
        2. implémenter import_document() ;
        3. retourner un résultat normalisé via build_result().
    """

    supported_extensions = ()

    importer_name = "base"

    # ------------------------------------------------------
    # IDENTIFICATION
    # ------------------------------------------------------

    @classmethod
    def supports_extension(cls, file_path):
        """
        Vérifie si l'importeur supporte l'extension du fichier.
        """

        if not file_path:
            return False

        extension = Path(str(file_path)).suffix.lower()

        supported = {
            str(item).lower()
            if str(item).startswith(".")
            else f".{str(item).lower()}"
            for item in cls.supported_extensions
        }

        return extension in supported

    @classmethod
    def extensions(cls):
        """
        Retourne les extensions supportées.
        """

        return tuple(cls.supported_extensions)

    # ------------------------------------------------------
    # IMPORT PRINCIPAL
    # ------------------------------------------------------

    @abstractmethod
    def import_document(self, file_path):
        """
        Importe un document.

        Doit retourner un dictionnaire normalisé contenant
        au minimum :

            {
                "title": ...,
                "content": ...,
                "metadata": ...,
                "length": ...,
                "word_count": ...
            }
        """

        raise NotImplementedError

    # ------------------------------------------------------
    # NORMALISATION
    # ------------------------------------------------------

    @staticmethod
    def normalize_content(content):
        """
        Normalise légèrement le contenu textuel.

        Cette méthode ne doit pas détruire la structure
        scientifique du document.
        """

        if content is None:
            return ""

        if not isinstance(content, str):
            content = str(content)

        content = content.replace("\r\n", "\n")
        content = content.replace("\r", "\n")

        # Évite les espaces inutiles en fin de ligne.
        lines = [
            line.rstrip()
            for line in content.split("\n")
        ]

        return "\n".join(lines).strip()

    @staticmethod
    def normalize_title(title, default="Document importé"):
        """
        Garantit un titre exploitable.
        """

        if title is None:
            return default

        title = str(title).strip()

        return title or default

    @staticmethod
    def normalize_metadata(metadata):
        """
        Garantit que les métadonnées sont un dictionnaire.
        """

        if metadata is None:
            return {}

        if isinstance(metadata, dict):
            return dict(metadata)

        return {
            "source_metadata": metadata,
        }

    # ------------------------------------------------------
    # STATISTIQUES
    # ------------------------------------------------------

    @staticmethod
    def count_words(content):
        """
        Compte approximativement les mots du document.
        """

        if not content:
            return 0

        return len(str(content).split())

    @staticmethod
    def count_characters(content):
        """
        Compte les caractères du contenu.
        """

        if not content:
            return 0

        return len(str(content))

    @staticmethod
    def count_lines(content):
        """
        Compte les lignes du document.
        """

        if not content:
            return 0

        return len(str(content).splitlines())

    # ------------------------------------------------------
    # CONSTRUCTION DU RÉSULTAT
    # ------------------------------------------------------

    def build_result(
        self,
        *,
        title,
        content,
        metadata=None,
        source_path=None,
        source_format=None,
        **extra,
    ):
        """
        Construit le résultat normalisé d'un import.

        Les champs supplémentaires sont conservés afin de
        permettre aux importeurs spécialisés de transmettre
        des informations spécifiques sans casser le contrat
        commun.
        """

        title = self.normalize_title(title)
        content = self.normalize_content(content)
        metadata = self.normalize_metadata(metadata)

        result = {
            "title": title,
            "content": content,
            "metadata": metadata,

            "length": self.count_characters(content),
            "word_count": self.count_words(content),
            "line_count": self.count_lines(content),

            "source_path": (
                str(source_path)
                if source_path is not None
                else None
            ),

            "source_format": (
                str(source_format).lower()
                if source_format is not None
                else None
            ),

            "importer": self.importer_name,
        }

        result.update(extra)

        return result

    # ------------------------------------------------------
    # VALIDATION
    # ------------------------------------------------------

    def validate_file(self, file_path):
        """
        Vérifie qu'un fichier peut être importé.

        Retourne True si le fichier existe et que son
        extension est supportée.
        """

        if not file_path:
            return False

        path = Path(str(file_path))

        if not path.exists():
            return False

        if not path.is_file():
            return False

        return self.supports_extension(path)

    # ------------------------------------------------------
    # INFORMATIONS
    # ------------------------------------------------------

    @classmethod
    def info(cls):
        """
        Retourne les informations générales sur l'importeur.
        """

        return {
            "name": cls.importer_name,
            "extensions": list(cls.supported_extensions),
        }

    def __repr__(self):
        return (
            f"{self.__class__.__name__}("
            f"extensions={self.supported_extensions!r}"
            f")"
        )

