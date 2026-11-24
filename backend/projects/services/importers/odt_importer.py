
"""
==========================================================
MACEVO IA
ODT Importer
==========================================================

Importeur OpenDocument Text (.odt).

Objectifs :
- importer les documents ODT ;
- extraire le texte ;
- détecter les titres ;
- détecter les listes ;
- détecter les tableaux ;
- détecter les images ;
- extraire les métadonnées ;
- conserver une structure exploitable ;
- préparer l'intégration avec le Document IR ;
- rester indépendant des fournisseurs IA.
"""

from pathlib import Path

from odf import teletype
from odf.draw import Frame
from odf.opendocument import load
from odf.table import Table, TableCell, TableRow
from odf.text import (
    H,
    List,
    ListItem,
    P,
)

from .base_importer import BaseImporter


class ODTImporter(BaseImporter):
    """
    Importeur OpenDocument Text (.odt).

    Le résultat contient à la fois :
    - le contenu textuel ;
    - les paragraphes ;
    - les titres ;
    - les listes ;
    - les tableaux ;
    - les images ;
    - les métadonnées ;
    - les statistiques ;
    - une structure générale du document.
    """

    supported_extensions = (
        ".odt",
    )

    importer_name = "odt"

    # ------------------------------------------------------
    # IMPORT PRINCIPAL
    # ------------------------------------------------------

    def import_document(self, file_path):
        """
        Importe un document ODT.

        Parameters
        ----------
        file_path : str | Path
            Chemin du fichier .odt.

        Returns
        -------
        dict
            Résultat normalisé de l'importation.
        """

        if not file_path:
            raise ValueError(
                "Le chemin du fichier ODT est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier ODT introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension ODT non supportée : {path.suffix}"
            )

        # --------------------------------------------------
        # CHARGEMENT
        # --------------------------------------------------

        try:
            document = load(str(path))

        except Exception as exc:
            raise ValueError(
                f"Impossible de charger le document ODT "
                f"{path.name} : {exc}"
            ) from exc

        # --------------------------------------------------
        # EXTRACTION
        # --------------------------------------------------

        paragraphs = self._extract_paragraphs(
            document
        )

        headings = self._extract_headings(
            document
        )

        lists = self._extract_lists(
            document
        )

        tables = self._extract_tables(
            document
        )

        images = self._extract_images(
            document
        )

        metadata = self._extract_metadata(
            document
        )

        # --------------------------------------------------
        # CONTENU PRINCIPAL
        # --------------------------------------------------

        content_parts = []

        for paragraph in paragraphs:
            text = paragraph["text"]

            if text.strip():
                content_parts.append(text)

        content = "\n\n".join(
            content_parts
        )

        # --------------------------------------------------
        # STRUCTURE
        # --------------------------------------------------

        structure = {
            "paragraphs": paragraphs,

            "headings": headings,

            "lists": lists,

            "tables": tables,

            "images": images,
        }

        # --------------------------------------------------
        # STATISTIQUES
        # --------------------------------------------------

        statistics = {
            "paragraphs": len(
                paragraphs
            ),

            "headings": len(
                headings
            ),

            "lists": len(
                lists
            ),

            "tables": len(
                tables
            ),

            "images": len(
                images
            ),

            "characters": len(
                content
            ),

            "words": self.count_words(
                content
            ),

            "lines": self.count_lines(
                content
            ),
        }

        # --------------------------------------------------
        # MÉTADONNÉES
        # --------------------------------------------------

        metadata.update(
            {
                "format": "odt",

                "source_file": path.name,

                "source_extension": path.suffix.lower(),

                "statistics": statistics,
            }
        )

        # --------------------------------------------------
        # RÉSULTAT
        # --------------------------------------------------

        return self.build_result(
            title=(
                metadata.get("title")
                or path.stem
            ),

            content=content,

            metadata=metadata,

            source_path=path,

            source_format="odt",

            paragraphs=paragraphs,

            headings=headings,

            lists=lists,

            tables=tables,

            images=images,

            structure=structure,

            statistics=statistics,
        )

    # ------------------------------------------------------
    # PARAGRAPHES
    # ------------------------------------------------------

    @staticmethod
    def _extract_paragraphs(document):
        """
        Extrait les paragraphes ODT.
        """

        paragraphs = []

        for index, paragraph in enumerate(
            document.getElementsByType(P),
            start=1,
        ):

            text = ODTImporter._element_text(
                paragraph
            )

            if not text.strip():
                continue

            paragraphs.append(
                {
                    "index": index,

                    "text": text,

                    "word_count": (
                        ODTImporter.count_words(
                            text
                        )
                    ),
                }
            )

        return paragraphs

    # ------------------------------------------------------
    # TITRES
    # ------------------------------------------------------

    @staticmethod
    def _extract_headings(document):
        """
        Extrait les titres et niveaux de titres ODT.
        """

        headings = []

        for index, heading in enumerate(
            document.getElementsByType(H),
            start=1,
        ):

            text = ODTImporter._element_text(
                heading
            )

            if not text.strip():
                continue

            level = (
                heading.getAttribute(
                    "outlinelevel"
                )
            )

            try:
                level = int(level)

            except (
                TypeError,
                ValueError,
            ):
                level = 1

            headings.append(
                {
                    "index": index,

                    "level": level,

                    "title": text,
                }
            )

        return headings

    # ------------------------------------------------------
    # LISTES
    # ------------------------------------------------------

    @classmethod
    def _extract_lists(cls, document):
        """
        Extrait les listes et leurs éléments.
        """

        lists = []

        for index, odt_list in enumerate(
            document.getElementsByType(List),
            start=1,
        ):

            items = []

            for item_index, item in enumerate(
                odt_list.getElementsByType(
                    ListItem
                ),
                start=1,
            ):

                item_paragraphs = []

                for paragraph in item.getElementsByType(
                    P
                ):

                    text = cls._element_text(
                        paragraph
                    )

                    if text.strip():
                        item_paragraphs.append(
                            text
                        )

                if item_paragraphs:

                    items.append(
                        {
                            "index": item_index,

                            "text": "\n".join(
                                item_paragraphs
                            ),
                        }
                    )

            if items:

                lists.append(
                    {
                        "index": index,

                        "items": items,

                        "item_count": len(
                            items
                        ),
                    }
                )

        return lists

    # ------------------------------------------------------
    # TABLEAUX
    # ------------------------------------------------------

    @classmethod
    def _extract_tables(cls, document):
        """
        Extrait les tableaux ODT.
        """

        tables = []

        for index, table in enumerate(
            document.getElementsByType(Table),
            start=1,
        ):

            rows = []

            for row in table.getElementsByType(
                TableRow
            ):

                cells = []

                for cell in row.getElementsByType(
                    TableCell
                ):

                    cell_paragraphs = []

                    for paragraph in cell.getElementsByType(
                        P
                    ):

                        text = cls._element_text(
                            paragraph
                        )

                        if text.strip():
                            cell_paragraphs.append(
                                text
                            )

                    cells.append(
                        "\n".join(
                            cell_paragraphs
                        )
                    )

                if cells:
                    rows.append(cells)

            headers = []

            data_rows = rows

            if rows:
                # Le premier rang est considéré comme
                # en-tête uniquement lorsqu'il existe
                # au moins une ligne supplémentaire.
                if len(rows) > 1:
                    headers = rows[0]
                    data_rows = rows[1:]

            tables.append(
                {
                    "index": index,

                    "headers": headers,

                    "rows": data_rows,

                    "raw_rows": rows,

                    "row_count": len(
                        data_rows
                    ),

                    "column_count": (
                        max(
                            (
                                len(row)
                                for row in rows
                            ),
                            default=0,
                        )
                    ),
                }
            )

        return tables

    # ------------------------------------------------------
    # IMAGES
    # ------------------------------------------------------

    @staticmethod
    def _extract_images(document):
        """
        Détecte les images incorporées dans les cadres ODT.

        Le chemin interne de l'image peut être conservé
        lorsqu'il est disponible.
        """

        images = []

        for index, frame in enumerate(
            document.getElementsByType(Frame),
            start=1,
        ):

            image_elements = []

            for child in frame.childNodes:

                if (
                    getattr(
                        child,
                        "qname",
                        None,
                    )
                    and child.qname[1] == "image"
                ):
                    image_elements.append(
                        child
                    )

            if not image_elements:
                continue

            for image in image_elements:

                href = image.getAttribute(
                    "href"
                )

                if href is None:
                    href = image.getAttribute(
                        "xlink:href"
                    )

                images.append(
                    {
                        "index": len(images) + 1,

                        "path": href,

                        "frame": index,
                    }
                )

        return images

    # ------------------------------------------------------
    # MÉTADONNÉES
    # ------------------------------------------------------

    @staticmethod
    def _extract_metadata(document):
        """
        Extrait les métadonnées Dublin Core disponibles
        dans le document ODT.
        """

        metadata = {}

        meta = getattr(
            document,
            "meta",
            None,
        )

        if meta is None:
            return metadata

        fields = {
            "title": "title",
            "subject": "subject",
            "description": "description",
            "creator": "creator",
            "initial_creator": "initial_creator",
            "date": "date",
            "language": "language",
            "keyword": "keyword",
            "generator": "generator",
        }

        for attribute, key in fields.items():

            try:
                elements = getattr(
                    meta,
                    attribute,
                    None,
                )

                if elements is None:
                    continue

                if not isinstance(
                    elements,
                    (list, tuple),
                ):
                    elements = [elements]

                values = []

                for element in elements:

                    text = ODTImporter._element_text(
                        element
                    )

                    if text.strip():
                        values.append(
                            text.strip()
                        )

                if values:

                    metadata[key] = (
                        values
                        if len(values) > 1
                        else values[0]
                    )

            except Exception:
                continue

        return metadata

    # ------------------------------------------------------
    # TEXTE D'ÉLÉMENT
    # ------------------------------------------------------

    @staticmethod
    def _element_text(element):
        """
        Extrait le texte d'un élément ODT.

        ``teletype.extractText`` permet de récupérer
        également le texte contenu dans les éléments
        descendants.
        """

        try:
            text = teletype.extractText(
                element
            )

        except Exception:
            text = ""

            for node in getattr(
                element,
                "childNodes",
                [],
            ):

                if hasattr(
                    node,
                    "data",
                ):
                    text += node.data

        return " ".join(
            str(text).split()
        )

    # ------------------------------------------------------
    # RECHERCHE DE TITRE
    # ------------------------------------------------------

    @classmethod
    def extract_title(cls, document):
        """
        Retourne le titre du document lorsqu'il existe.
        """

        metadata = cls._extract_metadata(
            document
        )

        return metadata.get(
            "title"
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
                    "Importeur OpenDocument Text "
                    "professionnel pour MACEVO."
                ),

                "structural_analysis": True,

                "metadata_extraction": True,

                "heading_detection": True,

                "list_detection": True,

                "table_detection": True,

                "image_detection": True,

                "document_ir_ready": True,
            }
        )

        return data
