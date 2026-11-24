
"""
==========================================================
MACEVO IA
CSV Importer
==========================================================

Importeur professionnel de fichiers CSV.

Objectifs :
- importer les données tabulaires ;
- conserver la structure lignes/colonnes ;
- détecter automatiquement le séparateur ;
- gérer plusieurs encodages courants ;
- produire une représentation textuelle ;
- conserver les données structurées ;
- préparer l'analyse statistique et scientifique ;
- préparer la génération de tableaux et graphiques.

Architecture :

    .csv
      ↓
    CSVImporter
      ↓
    données structurées
      ↓
    Scientific Analysis / Statistics
      ↓
    Table / Figure / Document IR
"""

import csv
from pathlib import Path

from .base_importer import BaseImporter


class CSVImporter(BaseImporter):
    """
    Importeur de fichiers CSV.

    Le résultat contient à la fois :
    - le contenu textuel ;
    - les colonnes ;
    - les lignes ;
    - les données structurées ;
    - les statistiques du tableau ;
    - les métadonnées du fichier.
    """

    supported_extensions = (
        ".csv",
    )

    importer_name = "csv"

    # ------------------------------------------------------
    # IMPORT PRINCIPAL
    # ------------------------------------------------------

    def import_document(self, file_path):
        """
        Importe un fichier CSV.

        Parameters
        ----------
        file_path : str | Path
            Chemin du fichier CSV.

        Returns
        -------
        dict
            Résultat normalisé de l'importation.
        """

        if not file_path:
            raise ValueError(
                "Le chemin du fichier CSV est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier CSV introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension non supportée par CSVImporter : "
                f"{path.suffix}"
            )

        # --------------------------------------------------
        # LECTURE AVEC DÉTECTION D'ENCODAGE
        # --------------------------------------------------

        raw_content = self._read_file(path)

        if not raw_content.strip():
            return self.build_result(
                title=path.stem,
                content="",
                metadata={
                    "format": "csv",
                    "rows": 0,
                    "columns": 0,
                    "empty": True,
                    "source_file": path.name,
                },
                source_path=path,
                source_format="csv",
                columns=[],
                rows=[],
                data=[],
                statistics={
                    "rows": 0,
                    "columns": 0,
                    "numeric_columns": [],
                },
            )

        # --------------------------------------------------
        # DÉTECTION DU DIALECTE
        # --------------------------------------------------

        dialect = self._detect_dialect(raw_content)

        # --------------------------------------------------
        # PARSING
        # --------------------------------------------------

        try:
            reader = csv.reader(
                raw_content.splitlines(),
                dialect=dialect,
            )

            rows = [
                [
                    self._clean_cell(cell)
                    for cell in row
                ]
                for row in reader
            ]

        except csv.Error as exc:
            raise ValueError(
                f"Impossible d'analyser le fichier CSV "
                f"{path.name} : {exc}"
            ) from exc

        # Supprime les lignes totalement vides.
        rows = [
            row
            for row in rows
            if any(cell.strip() for cell in row)
        ]

        if not rows:
            return self.build_result(
                title=path.stem,
                content="",
                metadata={
                    "format": "csv",
                    "rows": 0,
                    "columns": 0,
                    "empty": True,
                    "source_file": path.name,
                },
                source_path=path,
                source_format="csv",
                columns=[],
                rows=[],
                data=[],
            )

        # --------------------------------------------------
        # DÉTECTION DES EN-TÊTES
        # --------------------------------------------------

        has_header = self._detect_header(rows)

        if has_header:
            columns = self._normalize_headers(rows[0])
            data_rows = rows[1:]
        else:
            column_count = max(
                len(row)
                for row in rows
            )

            columns = [
                f"Column_{index + 1}"
                for index in range(column_count)
            ]

            data_rows = rows

        # --------------------------------------------------
        # NORMALISATION DES LIGNES
        # --------------------------------------------------

        column_count = len(columns)

        normalized_rows = []

        for row in data_rows:
            normalized = list(row)

            if len(normalized) < column_count:
                normalized.extend(
                    [""] * (
                        column_count
                        - len(normalized)
                    )
                )

            elif len(normalized) > column_count:
                normalized = normalized[
                    :column_count
                ]

            normalized_rows.append(normalized)

        # --------------------------------------------------
        # DONNÉES STRUCTURÉES
        # --------------------------------------------------

        data = [
            {
                columns[index]: row[index]
                for index in range(column_count)
            }
            for row in normalized_rows
        ]

        # --------------------------------------------------
        # STATISTIQUES
        # --------------------------------------------------

        statistics = self._build_statistics(
            columns,
            normalized_rows,
        )

        # --------------------------------------------------
        # REPRÉSENTATION TEXTUELLE
        # --------------------------------------------------

        content = self._build_text_content(
            columns,
            normalized_rows,
        )

        # --------------------------------------------------
        # MÉTADONNÉES
        # --------------------------------------------------

        metadata = {
            "format": "csv",
            "source_file": path.name,
            "source_extension": path.suffix.lower(),

            "delimiter": getattr(
                dialect,
                "delimiter",
                ",",
            ),

            "quotechar": getattr(
                dialect,
                "quotechar",
                '"',
            ),

            "has_header": has_header,

            "rows": len(normalized_rows),
            "columns": column_count,

            "empty": False,

            "numeric_columns": statistics[
                "numeric_columns"
            ],

            "text_columns": statistics[
                "text_columns"
            ],
        }

        return self.build_result(
            title=path.stem,
            content=content,
            metadata=metadata,
            source_path=path,
            source_format="csv",

            columns=columns,
            rows=normalized_rows,
            data=data,

            statistics=statistics,

            raw_content=raw_content,
        )

    # ------------------------------------------------------
    # LECTURE DU FICHIER
    # ------------------------------------------------------

    @staticmethod
    def _read_file(path):
        """
        Lit le fichier avec plusieurs encodages de secours.
        """

        encodings = (
            "utf-8-sig",
            "utf-8",
            "latin-1",
            "cp1252",
        )

        last_error = None

        for encoding in encodings:
            try:
                return path.read_text(
                    encoding=encoding
                )
            except UnicodeDecodeError as exc:
                last_error = exc

        raise ValueError(
            f"Impossible de décoder le fichier CSV : "
            f"{path}"
        ) from last_error

    # ------------------------------------------------------
    # DÉTECTION DU DIALECTE
    # ------------------------------------------------------

    @staticmethod
    def _detect_dialect(content):
        """
        Détecte automatiquement le séparateur CSV.

        Si la détection échoue, utilise la virgule.
        """

        sample = content[:8192]

        try:
            return csv.Sniffer().sniff(
                sample,
                delimiters=",;\t|",
            )

        except csv.Error:
            class DefaultDialect(csv.excel):
                delimiter = ","

            return DefaultDialect()

    # ------------------------------------------------------
    # DÉTECTION DES EN-TÊTES
    # ------------------------------------------------------

    @staticmethod
    def _detect_header(rows):
        """
        Détecte approximativement la présence d'une ligne
        d'en-têtes.

        La détection reste volontairement prudente afin de
        ne pas modifier silencieusement les données.
        """

        if len(rows) < 2:
            return True

        first_row = rows[0]
        second_row = rows[1]

        if not first_row:
            return False

        # Si la première ligne contient du texte et que la
        # deuxième contient des valeurs numériques, elle est
        # probablement constituée d'en-têtes.
        first_text = sum(
            1
            for value in first_row
            if value and not BaseCSVHelper.is_number(value)
        )

        second_numeric = sum(
            1
            for value in second_row
            if value and BaseCSVHelper.is_number(value)
        )

        if first_text >= max(
            1,
            len(first_row) // 2,
        ) and second_numeric > 0:
            return True

        # csv.Sniffer peut fournir une indication utile.
        try:
            sample = "\n".join(
                ",".join(row)
                for row in rows[:10]
            )

            return csv.Sniffer().has_header(
                sample
            )

        except csv.Error:
            return False

    # ------------------------------------------------------
    # NORMALISATION DES EN-TÊTES
    # ------------------------------------------------------

    @staticmethod
    def _normalize_headers(headers):
        """
        Nettoie les noms de colonnes et garantit leur
        unicité.
        """

        normalized = []
        counters = {}

        for index, header in enumerate(headers):
            name = str(header).strip()

            if not name:
                name = f"Column_{index + 1}"

            counters[name] = (
                counters.get(name, 0) + 1
            )

            if counters[name] > 1:
                name = (
                    f"{name}_{counters[name]}"
                )

            normalized.append(name)

        return normalized

    # ------------------------------------------------------
    # NETTOYAGE DES CELLULES
    # ------------------------------------------------------

    @staticmethod
    def _clean_cell(value):
        if value is None:
            return ""

        return str(value).strip()

    # ------------------------------------------------------
    # STATISTIQUES
    # ------------------------------------------------------

    @classmethod
    def _build_statistics(
        cls,
        columns,
        rows,
    ):
        """
        Analyse les colonnes sans modifier les données.
        """

        statistics = {
            "rows": len(rows),
            "columns": len(columns),

            "numeric_columns": [],
            "text_columns": [],

            "empty_cells": 0,
            "total_cells": (
                len(rows) * len(columns)
            ),
        }

        for column_index, column_name in enumerate(
            columns
        ):
            values = [
                row[column_index]
                for row in rows
                if column_index < len(row)
            ]

            non_empty = [
                value
                for value in values
                if str(value).strip()
            ]

            empty_count = (
                len(values)
                - len(non_empty)
            )

            statistics["empty_cells"] += (
                empty_count
            )

            if non_empty and all(
                BaseCSVHelper.is_number(value)
                for value in non_empty
            ):
                statistics[
                    "numeric_columns"
                ].append(column_name)
            else:
                statistics[
                    "text_columns"
                ].append(column_name)

        return statistics

    # ------------------------------------------------------
    # TEXTE
    # ------------------------------------------------------

    @staticmethod
    def _build_text_content(
        columns,
        rows,
    ):
        """
        Construit une représentation textuelle lisible
        sans perdre les données structurées originales.
        """

        lines = []

        if columns:
            lines.append(
                " | ".join(columns)
            )

            lines.append(
                " | ".join(
                    "---"
                    for _ in columns
                )
            )

        for row in rows:
            lines.append(
                " | ".join(row)
            )

        return "\n".join(lines)

    # ------------------------------------------------------
    # STATISTIQUES PUBLIQUES
    # ------------------------------------------------------

    @staticmethod
    def table_statistics(result):
        """
        Retourne les statistiques d'un résultat CSV importé.
        """

        if not isinstance(result, dict):
            return {}

        return result.get(
            "statistics",
            {},
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
                    "Importeur de données tabulaires CSV "
                    "pour MACEVO."
                ),
                "structured_output": True,
                "scientific_data": True,
                "statistics": True,
                "supports_delimiter_detection": True,
            }
        )

        return data


class BaseCSVHelper:
    """
    Helpers internes au traitement CSV.

    Séparés de CSVImporter pour garder la logique
    d'identification des valeurs indépendante de
    l'importeur principal.
    """

    @staticmethod
    def is_number(value):
        """
        Détermine si une valeur peut raisonnablement être
        considérée comme numérique.

        Accepte notamment :
            12
            12.5
            -3.2
            1,25
            1e-5
        """

        if value is None:
            return False

        text = str(value).strip()

        if not text:
            return False

        normalized = (
            text
            .replace(" ", "")
            .replace(",", ".")
        )

        try:
            float(normalized)
            return True

        except ValueError:
            return False
