
"""
==========================================================
MACEVO IA
Excel Importer
==========================================================

Importeur professionnel de fichiers Excel (.xlsx).

Objectifs :
- importer les classeurs Excel ;
- préserver les différentes feuilles ;
- conserver les données structurées ;
- extraire les dimensions des feuilles ;
- détecter les colonnes numériques ;
- produire une représentation textuelle ;
- préparer les données pour :
    - analyse scientifique ;
    - statistiques ;
    - tableaux ;
    - graphiques ;
    - Document IR.

Architecture :

    .xlsx
       ↓
    ExcelImporter
       ↓
    workbook structuré
       ↓
    Scientific Analysis / Statistics
       ↓
    Table / Figure / Document IR
"""

from pathlib import Path

from openpyxl import load_workbook

from .base_importer import BaseImporter


class ExcelImporter(BaseImporter):
    """
    Importeur de fichiers Excel (.xlsx).

    Le résultat conserve :
    - les feuilles ;
    - les colonnes ;
    - les lignes ;
    - les données structurées ;
    - les statistiques ;
    - le contenu textuel ;
    - les métadonnées du classeur.
    """

    supported_extensions = (
        ".xlsx",
    )

    importer_name = "excel"

    # ------------------------------------------------------
    # IMPORT PRINCIPAL
    # ------------------------------------------------------

    def import_document(self, file_path):
        """
        Importe un classeur Excel.

        Parameters
        ----------
        file_path : str | Path
            Chemin du fichier .xlsx.

        Returns
        -------
        dict
            Résultat normalisé.
        """

        if not file_path:
            raise ValueError(
                "Le chemin du fichier Excel est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier Excel introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension non supportée par ExcelImporter : "
                f"{path.suffix}"
            )

        # --------------------------------------------------
        # OUVERTURE DU CLASSEUR
        # --------------------------------------------------

        try:
            workbook = load_workbook(
                filename=path,
                data_only=True,
                read_only=True,
            )

        except Exception as exc:
            raise ValueError(
                f"Impossible de lire le fichier Excel "
                f"{path.name} : {exc}"
            ) from exc

        try:
            sheets = []

            for worksheet in workbook.worksheets:
                sheet = self._extract_sheet(
                    worksheet
                )

                sheets.append(sheet)

            # --------------------------------------------------
            # CONTENU GLOBAL
            # --------------------------------------------------

            content_parts = []

            for sheet in sheets:
                content_parts.append(
                    f"# {sheet['title']}"
                )

                sheet_content = sheet.get(
                    "content",
                    "",
                )

                if sheet_content:
                    content_parts.append(
                        sheet_content
                    )

            content = "\n\n".join(
                part
                for part in content_parts
                if part
            )

            # --------------------------------------------------
            # STATISTIQUES
            # --------------------------------------------------

            statistics = (
                self._build_workbook_statistics(
                    sheets
                )
            )

            # --------------------------------------------------
            # MÉTADONNÉES
            # --------------------------------------------------

            metadata = {
                "format": "excel",
                "source_file": path.name,
                "source_extension": path.suffix.lower(),

                "sheets": len(sheets),

                "sheet_names": [
                    sheet["title"]
                    for sheet in sheets
                ],

                "total_rows": statistics[
                    "total_rows"
                ],

                "total_columns": statistics[
                    "total_columns"
                ],

                "numeric_columns": statistics[
                    "numeric_columns"
                ],
            }

            # --------------------------------------------------
            # RÉSULTAT
            # --------------------------------------------------

            return self.build_result(
                title=path.stem,
                content=content,
                metadata=metadata,
                source_path=path,
                source_format="excel",

                sheets=sheets,

                statistics=statistics,

                workbook={
                    "sheet_count": len(sheets),
                    "sheet_names": [
                        sheet["title"]
                        for sheet in sheets
                    ],
                },
            )

        finally:
            workbook.close()

    # ------------------------------------------------------
    # EXTRACTION D'UNE FEUILLE
    # ------------------------------------------------------

    @classmethod
    def _extract_sheet(cls, worksheet):
        """
        Extrait une feuille Excel sous forme structurée.
        """

        raw_rows = []

        for row in worksheet.iter_rows(
            values_only=True
        ):
            values = [
                cls._normalize_cell(value)
                for value in row
            ]

            # Ignore uniquement les lignes complètement
            # vides.
            if any(
                value != ""
                for value in values
            ):
                raw_rows.append(values)

        if not raw_rows:
            return {
                "title": worksheet.title,
                "rows": [],
                "columns": [],
                "data": [],
                "content": "",
                "statistics": {
                    "rows": 0,
                    "columns": 0,
                    "numeric_columns": [],
                    "empty_cells": 0,
                    "total_cells": 0,
                },
            }

        # --------------------------------------------------
        # EN-TÊTES
        # --------------------------------------------------

        first_row = raw_rows[0]

        has_header = cls._detect_header(
            raw_rows
        )

        if has_header:
            columns = cls._normalize_headers(
                first_row
            )
            data_rows = raw_rows[1:]

        else:
            column_count = max(
                len(row)
                for row in raw_rows
            )

            columns = [
                f"Column_{index + 1}"
                for index in range(
                    column_count
                )
            ]

            data_rows = raw_rows

        # --------------------------------------------------
        # NORMALISATION DES LIGNES
        # --------------------------------------------------

        column_count = len(columns)

        normalized_rows = []

        for row in data_rows:
            row = list(row)

            if len(row) < column_count:
                row.extend(
                    [""] * (
                        column_count
                        - len(row)
                    )
                )

            elif len(row) > column_count:
                row = row[
                    :column_count
                ]

            normalized_rows.append(row)

        # --------------------------------------------------
        # DICTIONNAIRES
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

        statistics = cls._build_sheet_statistics(
            columns,
            normalized_rows,
        )

        # --------------------------------------------------
        # TEXTE
        # --------------------------------------------------

        content = cls._build_text_content(
            columns,
            normalized_rows,
        )

        return {
            "title": worksheet.title,

            "rows": normalized_rows,

            "columns": columns,

            "data": data,

            "content": content,

            "has_header": has_header,

            "statistics": statistics,
        }

    # ------------------------------------------------------
    # CELLULE
    # ------------------------------------------------------

    @staticmethod
    def _normalize_cell(value):
        """
        Convertit une cellule Excel en valeur sérialisable
        tout en conservant les nombres comme nombres.
        """

        if value is None:
            return ""

        if isinstance(value, (str, int, float, bool)):
            return value

        # Dates, heures, Decimal et autres objets Excel
        # sont convertis en texte.
        return str(value)

    # ------------------------------------------------------
    # EN-TÊTES
    # ------------------------------------------------------

    @staticmethod
    def _normalize_headers(headers):
        """
        Nettoie les noms de colonnes et garantit leur unicité.
        """

        result = []
        counters = {}

        for index, header in enumerate(
            headers
        ):
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

            result.append(name)

        return result

    # ------------------------------------------------------
    # DÉTECTION DES EN-TÊTES
    # ------------------------------------------------------

    @classmethod
    def _detect_header(cls, rows):
        """
        Détecte approximativement si la première ligne
        contient des en-têtes.
        """

        if len(rows) < 2:
            return True

        first_row = rows[0]
        second_row = rows[1]

        first_text_count = sum(
            1
            for value in first_row
            if value != ""
            and not cls._is_number(value)
        )

        second_numeric_count = sum(
            1
            for value in second_row
            if value != ""
            and cls._is_number(value)
        )

        if (
            first_text_count
            >= max(
                1,
                len(first_row) // 2,
            )
            and second_numeric_count > 0
        ):
            return True

        return False

    # ------------------------------------------------------
    # STATISTIQUES D'UNE FEUILLE
    # ------------------------------------------------------

    @classmethod
    def _build_sheet_statistics(
        cls,
        columns,
        rows,
    ):
        """
        Analyse une feuille Excel sans modifier les données.
        """

        column_count = len(columns)

        statistics = {
            "rows": len(rows),
            "columns": column_count,

            "numeric_columns": [],
            "text_columns": [],

            "empty_cells": 0,

            "total_cells": (
                len(rows) * column_count
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
                if value != ""
                and value is not None
            ]

            statistics["empty_cells"] += (
                len(values)
                - len(non_empty)
            )

            if non_empty and all(
                cls._is_number(value)
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
    # STATISTIQUES DU CLASSEUR
    # ------------------------------------------------------

    @classmethod
    def _build_workbook_statistics(
        cls,
        sheets,
    ):
        """
        Agrège les statistiques de toutes les feuilles.
        """

        total_rows = 0
        total_columns = 0
        total_cells = 0
        empty_cells = 0

        numeric_columns = []
        sheet_statistics = []

        for sheet in sheets:
            statistics = sheet.get(
                "statistics",
                {},
            )

            total_rows += statistics.get(
                "rows",
                0,
            )

            total_columns += statistics.get(
                "columns",
                0,
            )

            total_cells += statistics.get(
                "total_cells",
                0,
            )

            empty_cells += statistics.get(
                "empty_cells",
                0,
            )

            for column in statistics.get(
                "numeric_columns",
                [],
            ):
                numeric_columns.append(
                    {
                        "sheet": sheet.get(
                            "title"
                        ),
                        "column": column,
                    }
                )

            sheet_statistics.append(
                {
                    "sheet": sheet.get(
                        "title"
                    ),
                    **statistics,
                }
            )

        return {
            "sheets": len(sheets),

            "total_rows": total_rows,

            "total_columns": total_columns,

            "total_cells": total_cells,

            "empty_cells": empty_cells,

            "numeric_columns": numeric_columns,

            "sheet_statistics": sheet_statistics,
        }

    # ------------------------------------------------------
    # REPRÉSENTATION TEXTUELLE
    # ------------------------------------------------------

    @staticmethod
    def _build_text_content(
        columns,
        rows,
    ):
        """
        Produit une représentation Markdown/tableau lisible.
        """

        lines = []

        if columns:
            lines.append(
                " | ".join(
                    str(column)
                    for column in columns
                )
            )

            lines.append(
                " | ".join(
                    "---"
                    for _ in columns
                )
            )

        for row in rows:
            lines.append(
                " | ".join(
                    str(value)
                    if value != ""
                    else ""
                    for value in row
                )
            )

        return "\n".join(lines)

    # ------------------------------------------------------
    # TEST NUMÉRIQUE
    # ------------------------------------------------------

    @staticmethod
    def _is_number(value):
        """
        Détermine si une valeur est numérique.
        """

        if isinstance(
            value,
            bool,
        ):
            return False

        if isinstance(
            value,
            (int, float),
        ):
            return True

        if not isinstance(
            value,
            str,
        ):
            return False

        text = value.strip()

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

    # ------------------------------------------------------
    # ACCÈS AUX FEUILLES
    # ------------------------------------------------------

    @staticmethod
    def find_sheet(result, sheet_name):
        """
        Recherche une feuille par son nom.
        """

        if not isinstance(
            result,
            dict,
        ):
            return None

        target = str(
            sheet_name
        ).strip().lower()

        for sheet in result.get(
            "sheets",
            [],
        ):
            title = str(
                sheet.get(
                    "title",
                    "",
                )
            ).strip().lower()

            if title == target:
                return sheet

        return None

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
                    "Importeur de classeurs Excel "
                    "pour MACEVO."
                ),
                "structured_output": True,
                "multi_sheet": True,
                "scientific_data": True,
                "statistics": True,
                "chart_ready": True,
            }
        )

        return data
