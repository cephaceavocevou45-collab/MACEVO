
"""
==========================================================
MACEVO IA
JSON Importer
==========================================================

Importeur JSON professionnel.

Objectifs :
- charger les fichiers JSON ;
- valider le fichier ;
- préserver les données originales ;
- produire une représentation textuelle lisible ;
- conserver la structure JSON ;
- calculer des statistiques ;
- préparer les données pour le Document IR ;
- rester indépendant des fournisseurs IA.
"""

import json
from pathlib import Path

from .base_importer import BaseImporter


class JSONImporter(BaseImporter):
    """
    Importeur JSON.

    Le JSON peut représenter :
    - des données ;
    - des métadonnées ;
    - des résultats scientifiques ;
    - des configurations ;
    - des structures documentaires ;
    - des références ;
    - des tableaux ou séries de données.
    """

    supported_extensions = (
        ".json",
    )

    importer_name = "json"

    # ------------------------------------------------------
    # IMPORT PRINCIPAL
    # ------------------------------------------------------

    def import_document(self, file_path):
        """
        Importe un fichier JSON.

        Parameters
        ----------
        file_path : str | Path
            Chemin du fichier JSON.

        Returns
        -------
        dict
            Résultat normalisé de l'importation.
        """

        if not file_path:
            raise ValueError(
                "Le chemin du fichier JSON est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier JSON introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension JSON non supportée : {path.suffix}"
            )

        # --------------------------------------------------
        # LECTURE
        # --------------------------------------------------

        raw_content = self._read_file(path)

        if not raw_content.strip():
            raise ValueError(
                f"Le fichier JSON est vide : {path.name}"
            )

        # --------------------------------------------------
        # PARSING
        # --------------------------------------------------

        try:
            data = json.loads(raw_content)

        except json.JSONDecodeError as exc:
            raise ValueError(
                f"JSON invalide dans {path.name} "
                f"(ligne {exc.lineno}, colonne {exc.colno}) : "
                f"{exc.msg}"
            ) from exc

        # --------------------------------------------------
        # REPRÉSENTATION TEXTUELLE
        # --------------------------------------------------

        formatted_content = json.dumps(
            data,
            indent=4,
            ensure_ascii=False,
        )

        # --------------------------------------------------
        # STATISTIQUES
        # --------------------------------------------------

        statistics = self._build_statistics(
            data
        )

        # --------------------------------------------------
        # STRUCTURE
        # --------------------------------------------------

        structure = self._detect_structure(
            data
        )

        # --------------------------------------------------
        # MÉTADONNÉES
        # --------------------------------------------------

        metadata = {
            "format": "json",

            "source_file": path.name,

            "source_extension": path.suffix.lower(),

            "encoding": "utf-8",

            "root_type": type(data).__name__,

            "structure": structure,

            "statistics": statistics,
        }

        # --------------------------------------------------
        # RÉSULTAT
        # --------------------------------------------------

        return self.build_result(
            title=path.stem,

            content=formatted_content,

            metadata=metadata,

            source_path=path,

            source_format="json",

            data=data,

            raw_content=raw_content,

            structure=structure,

            statistics=statistics,
        )

    # ------------------------------------------------------
    # LECTURE
    # ------------------------------------------------------

    @staticmethod
    def _read_file(path):
        """
        Lit le fichier JSON.

        UTF-8 est prioritaire. UTF-8 avec BOM est également
        accepté.
        """

        try:
            return path.read_text(
                encoding="utf-8"
            )

        except UnicodeDecodeError:
            try:
                return path.read_text(
                    encoding="utf-8-sig"
                )

            except UnicodeDecodeError as exc:
                raise ValueError(
                    f"Impossible de décoder le fichier JSON "
                    f"{path.name} en UTF-8."
                ) from exc

    # ------------------------------------------------------
    # STATISTIQUES
    # ------------------------------------------------------

    @classmethod
    def _build_statistics(cls, data):
        """
        Produit des statistiques sur la structure JSON.
        """

        statistics = {
            "root_type": type(data).__name__,

            "objects": 0,

            "arrays": 0,

            "strings": 0,

            "numbers": 0,

            "booleans": 0,

            "nulls": 0,

            "keys": 0,

            "max_depth": 0,
        }

        cls._walk(
            data,
            statistics,
            depth=0,
        )

        return statistics

    @classmethod
    def _walk(
        cls,
        value,
        statistics,
        depth,
    ):
        """
        Parcourt récursivement la structure JSON.
        """

        statistics["max_depth"] = max(
            statistics["max_depth"],
            depth,
        )

        if isinstance(value, dict):

            statistics["objects"] += 1

            statistics["keys"] += len(value)

            for child in value.values():
                cls._walk(
                    child,
                    statistics,
                    depth + 1,
                )

            return

        if isinstance(value, list):

            statistics["arrays"] += 1

            for child in value:
                cls._walk(
                    child,
                    statistics,
                    depth + 1,
                )

            return

        if isinstance(value, str):

            statistics["strings"] += 1

            return

        # bool doit être testé avant int car bool
        # est une sous-classe de int en Python.
        if isinstance(value, bool):

            statistics["booleans"] += 1

            return

        if isinstance(
            value,
            (int, float),
        ):

            statistics["numbers"] += 1

            return

        if value is None:

            statistics["nulls"] += 1

    # ------------------------------------------------------
    # DÉTECTION DE STRUCTURE
    # ------------------------------------------------------

    @staticmethod
    def _detect_structure(data):
        """
        Détermine la structure racine du JSON.
        """

        if isinstance(data, dict):

            keys = list(data.keys())

            return {
                "root": "object",

                "keys": keys,

                "key_count": len(keys),

                "is_tabular_candidate": (
                    JSONImporter._is_tabular_object(
                        data
                    )
                ),
            }

        if isinstance(data, list):

            item_types = sorted(
                {
                    type(item).__name__
                    for item in data
                }
            )

            return {
                "root": "array",

                "item_count": len(data),

                "item_types": item_types,

                "is_tabular_candidate": (
                    JSONImporter._is_tabular_array(
                        data
                    )
                ),
            }

        return {
            "root": type(data).__name__,

            "keys": [],

            "key_count": 0,

            "is_tabular_candidate": False,
        }

    # ------------------------------------------------------
    # DÉTECTION TABLEAU
    # ------------------------------------------------------

    @staticmethod
    def _is_tabular_array(data):
        """
        Détermine si un tableau JSON ressemble à une table.

        Exemple :

        [
            {"nom": "A", "valeur": 10},
            {"nom": "B", "valeur": 20}
        ]
        """

        if not isinstance(data, list):
            return False

        dictionaries = [
            item
            for item in data
            if isinstance(item, dict)
        ]

        if not dictionaries:
            return False

        if len(dictionaries) != len(data):
            return False

        first_keys = set(
            dictionaries[0].keys()
        )

        if not first_keys:
            return False

        return all(
            set(item.keys()) == first_keys
            for item in dictionaries
        )

    @staticmethod
    def _is_tabular_object(data):
        """
        Détermine si un objet JSON peut être assimilé
        à une structure tabulaire simple.
        """

        if not isinstance(data, dict):
            return False

        values = list(data.values())

        if not values:
            return False

        return all(
            isinstance(value, list)
            for value in values
        )

    # ------------------------------------------------------
    # EXTRACTION DES CLÉS
    # ------------------------------------------------------

    @staticmethod
    def extract_keys(data):
        """
        Retourne les clés de premier niveau.
        """

        if not isinstance(data, dict):
            return []

        return list(data.keys())

    # ------------------------------------------------------
    # RECHERCHE RÉCURSIVE
    # ------------------------------------------------------

    @classmethod
    def find_key(
        cls,
        data,
        key,
    ):
        """
        Recherche récursivement une clé dans un JSON.

        Retourne les valeurs trouvées.

        Exemple :
            find_key(data, "title")
        """

        if not isinstance(key, str):
            raise TypeError(
                "La clé recherchée doit être une chaîne."
            )

        results = []

        cls._find_key_recursive(
            data,
            key,
            results,
        )

        return results

    @classmethod
    def _find_key_recursive(
        cls,
        value,
        key,
        results,
    ):

        if isinstance(value, dict):

            for current_key, current_value in value.items():

                if current_key == key:
                    results.append(
                        current_value
                    )

                cls._find_key_recursive(
                    current_value,
                    key,
                    results,
                )

            return

        if isinstance(value, list):

            for item in value:
                cls._find_key_recursive(
                    item,
                    key,
                    results,
                )

    # ------------------------------------------------------
    # STATISTIQUES PUBLIQUES
    # ------------------------------------------------------

    @classmethod
    def json_statistics(cls, data):
        """
        Retourne les statistiques d'une structure JSON.
        """

        return cls._build_statistics(
            data
        )

    # ------------------------------------------------------
    # INFORMATIONS
    # ------------------------------------------------------

    @classmethod
    def info(cls):
        """
        Informations publiques sur l'importeur.
        """

        data = super().info()

        data.update(
            {
                "description": (
                    "Importeur JSON professionnel "
                    "pour MACEVO."
                ),

                "structured_data": True,

                "recursive_analysis": True,

                "tabular_detection": True,

                "raw_content_preserved": True,
            }
        )

        return data
