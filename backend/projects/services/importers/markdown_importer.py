
"""
==========================================================
MACEVO IA
Markdown Importer
==========================================================

Importeur Markdown professionnel.

Objectifs :
- importer les fichiers Markdown ;
- préserver le source Markdown original ;
- détecter les titres et la hiérarchie ;
- détecter les listes ;
- détecter les tableaux ;
- détecter les images ;
- détecter les liens ;
- détecter les blocs de code ;
- détecter les citations ;
- produire une représentation textuelle ;
- fournir une structure exploitable par le Document IR ;
- rester indépendant des fournisseurs IA.
"""

import re
from pathlib import Path

from .base_importer import BaseImporter


class MarkdownImporter(BaseImporter):
    """
    Importeur Markdown.

    Le contenu Markdown original est conservé dans
    ``raw_content`` et ``markdown_source``.

    Une analyse structurelle légère est également fournie
    pour les couches suivantes de MACEVO.
    """

    supported_extensions = (
        ".md",
    )

    importer_name = "markdown"

    # ------------------------------------------------------
    # IMPORT PRINCIPAL
    # ------------------------------------------------------

    def import_document(self, file_path):
        """
        Importe un fichier Markdown.

        Parameters
        ----------
        file_path : str | Path
            Chemin du fichier Markdown.

        Returns
        -------
        dict
            Résultat normalisé de l'importation.
        """

        if not file_path:
            raise ValueError(
                "Le chemin du fichier Markdown est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier Markdown introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension Markdown non supportée : {path.suffix}"
            )

        # --------------------------------------------------
        # LECTURE
        # --------------------------------------------------

        source = self._read_source(path)

        if not source.strip():
            raise ValueError(
                f"Le fichier Markdown est vide : {path.name}"
            )

        # --------------------------------------------------
        # ANALYSE STRUCTURELLE
        # --------------------------------------------------

        headings = self._extract_headings(source)
        links = self._extract_links(source)
        images = self._extract_images(source)
        lists = self._extract_lists(source)
        tables = self._extract_tables(source)
        code_blocks = self._extract_code_blocks(source)
        blockquotes = self._extract_blockquotes(source)

        # --------------------------------------------------
        # TEXTE NETTOYÉ
        # --------------------------------------------------

        plain_text = self._markdown_to_text(
            source
        )

        # --------------------------------------------------
        # STATISTIQUES
        # --------------------------------------------------

        statistics = {
            "characters": len(source),

            "lines": self.count_lines(
                source
            ),

            "words": self.count_words(
                plain_text
            ),

            "headings": len(headings),

            "links": len(links),

            "images": len(images),

            "lists": len(lists),

            "tables": len(tables),

            "code_blocks": len(code_blocks),

            "blockquotes": len(blockquotes),
        }

        # --------------------------------------------------
        # STRUCTURE
        # --------------------------------------------------

        structure = {
            "headings": headings,

            "links": links,

            "images": images,

            "lists": lists,

            "tables": tables,

            "code_blocks": code_blocks,

            "blockquotes": blockquotes,
        }

        # --------------------------------------------------
        # MÉTADONNÉES
        # --------------------------------------------------

        metadata = {
            "format": "markdown",

            "source_file": path.name,

            "source_extension": path.suffix.lower(),

            "encoding": "utf-8",

            "heading_count": len(headings),

            "link_count": len(links),

            "image_count": len(images),

            "table_count": len(tables),

            "code_block_count": len(code_blocks),

            "statistics": statistics,
        }

        # --------------------------------------------------
        # RÉSULTAT
        # --------------------------------------------------

        return self.build_result(
            title=path.stem,

            content=plain_text,

            metadata=metadata,

            source_path=path,

            source_format="markdown",

            raw_content=source,

            markdown_source=source,

            plain_text=plain_text,

            structure=structure,

            headings=headings,

            links=links,

            images=images,

            lists=lists,

            tables=tables,

            code_blocks=code_blocks,

            blockquotes=blockquotes,

            statistics=statistics,
        )

    # ------------------------------------------------------
    # LECTURE
    # ------------------------------------------------------

    @staticmethod
    def _read_source(path):
        """
        Lit le fichier Markdown avec gestion du BOM et
        quelques encodages de secours.
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

            except UnicodeDecodeError:

                try:
                    return path.read_text(
                        encoding="cp1252"
                    )

                except UnicodeDecodeError:

                    try:
                        return path.read_text(
                            encoding="latin-1"
                        )

                    except UnicodeDecodeError as exc:
                        raise ValueError(
                            f"Impossible de décoder le fichier "
                            f"Markdown : {path.name}"
                        ) from exc

    # ------------------------------------------------------
    # TITRES
    # ------------------------------------------------------

    @staticmethod
    def _extract_headings(source):
        """
        Extrait les titres Markdown de type ATX :

            # Titre
            ## Sous-titre
            ### Section
        """

        headings = []

        pattern = re.compile(
            r"^(#{1,6})[ \t]+(.+?)"
            r"[ \t]*#*[ \t]*$",
            re.MULTILINE,
        )

        for index, match in enumerate(
            pattern.finditer(source),
            start=1,
        ):

            title = match.group(2).strip()

            headings.append(
                {
                    "index": index,

                    "level": len(
                        match.group(1)
                    ),

                    "title": (
                        MarkdownImporter
                        ._clean_inline_markdown(
                            title
                        )
                    ),
                }
            )

        return headings

    # ------------------------------------------------------
    # LIENS
    # ------------------------------------------------------

    @staticmethod
    def _extract_links(source):
        """
        Extrait les liens Markdown :

            [texte](url)
        """

        links = []

        pattern = re.compile(
            r"\[([^\]]+)\]"
            r"\(([^)\s]+)"
            r'(?:\s+"([^"]*)")?\)',
        )

        for index, match in enumerate(
            pattern.finditer(source),
            start=1,
        ):

            links.append(
                {
                    "index": index,

                    "text": (
                        MarkdownImporter
                        ._clean_inline_markdown(
                            match.group(1)
                        )
                    ),

                    "url": match.group(2),

                    "title": match.group(3),
                }
            )

        return links

    # ------------------------------------------------------
    # IMAGES
    # ------------------------------------------------------

    @staticmethod
    def _extract_images(source):
        """
        Extrait les images Markdown :

            ![alt](image.png)
        """

        images = []

        pattern = re.compile(
            r"!\[([^\]]*)\]"
            r"\(([^)\s]+)"
            r'(?:\s+"([^"]*)")?\)',
        )

        for index, match in enumerate(
            pattern.finditer(source),
            start=1,
        ):

            images.append(
                {
                    "index": index,

                    "alt": match.group(1),

                    "path": match.group(2),

                    "title": match.group(3),
                }
            )

        return images

    # ------------------------------------------------------
    # LISTES
    # ------------------------------------------------------

    @staticmethod
    def _extract_lists(source):
        """
        Extrait les éléments de listes Markdown.

        Supporte :
        - listes non ordonnées ;
        - listes ordonnées ;
        - cases à cocher.
        """

        items = []

        pattern = re.compile(
            r"^[ \t]*"
            r"(?:(?:[-+*])|(?:\d+[.)]))"
            r"[ \t]+"
            r"(.+?)$",
            re.MULTILINE,
        )

        for index, match in enumerate(
            pattern.finditer(source),
            start=1,
        ):

            raw = match.group(1).strip()

            checked = None

            checkbox = re.match(
                r"^\[([ xX])\][ \t]+(.+)$",
                raw,
            )

            if checkbox:

                checked = (
                    checkbox.group(1).lower()
                    == "x"
                )

                raw = checkbox.group(2).strip()

            items.append(
                {
                    "index": index,

                    "text": (
                        MarkdownImporter
                        ._clean_inline_markdown(
                            raw
                        )
                    ),

                    "checked": checked,
                }
            )

        return items

    # ------------------------------------------------------
    # TABLEAUX
    # ------------------------------------------------------

    @staticmethod
    def _extract_tables(source):
        """
        Extrait les tableaux Markdown simples.

        Exemple :

            | Nom | Valeur |
            | --- | --- |
            | A   | 10     |
        """

        tables = []

        lines = source.splitlines()

        index = 0

        while index < len(lines) - 1:

            header_line = lines[index].strip()
            separator_line = lines[index + 1].strip()

            if (
                "|" in header_line
                and MarkdownImporter._is_table_separator(
                    separator_line
                )
            ):

                headers = (
                    MarkdownImporter
                    ._split_table_row(
                        header_line
                    )
                )

                rows = []

                index += 2

                while index < len(lines):

                    row_line = lines[index].strip()

                    if (
                        not row_line
                        or "|" not in row_line
                    ):
                        break

                    rows.append(
                        MarkdownImporter
                        ._split_table_row(
                            row_line
                        )
                    )

                    index += 1

                tables.append(
                    {
                        "index": len(tables) + 1,

                        "headers": headers,

                        "rows": rows,

                        "row_count": len(rows),

                        "column_count": len(headers),
                    }
                )

                continue

            index += 1

        return tables

    @staticmethod
    def _is_table_separator(line):
        """
        Vérifie si une ligne correspond à la séparation
        d'un tableau Markdown.
        """

        cells = [
            cell.strip()
            for cell in line.strip("|").split("|")
        ]

        if not cells:
            return False

        return all(
            bool(
                re.fullmatch(
                    r":?-{3,}:?",
                    cell,
                )
            )
            for cell in cells
        )

    @staticmethod
    def _split_table_row(line):
        """
        Transforme une ligne de tableau en cellules.
        """

        line = line.strip()

        if line.startswith("|"):
            line = line[1:]

        if line.endswith("|"):
            line = line[:-1]

        return [
            MarkdownImporter
            ._clean_inline_markdown(
                cell.strip()
            )
            for cell in line.split("|")
        ]

    # ------------------------------------------------------
    # BLOCS DE CODE
    # ------------------------------------------------------

    @staticmethod
    def _extract_code_blocks(source):
        """
        Extrait les blocs de code fenced :

            ```python
            ...
            ```
        """

        blocks = []

        pattern = re.compile(
            r"```([^\n]*)\n"
            r"(.*?)"
            r"\n```",
            re.DOTALL,
        )

        for index, match in enumerate(
            pattern.finditer(source),
            start=1,
        ):

            language = (
                match.group(1).strip()
                or None
            )

            blocks.append(
                {
                    "index": index,

                    "language": language,

                    "content": match.group(2),
                }
            )

        return blocks

    # ------------------------------------------------------
    # CITATIONS / BLOCKQUOTES
    # ------------------------------------------------------

    @staticmethod
    def _extract_blockquotes(source):
        """
        Extrait les blocs de citation Markdown.
        """

        blockquotes = []

        pattern = re.compile(
            r"(?:^>[ \t]?.*(?:\n|$))+",
            re.MULTILINE,
        )

        for index, match in enumerate(
            pattern.finditer(source),
            start=1,
        ):

            lines = []

            for line in match.group(0).splitlines():

                line = re.sub(
                    r"^>[ \t]?",
                    "",
                    line,
                )

                lines.append(line)

            blockquotes.append(
                {
                    "index": index,

                    "content": "\n".join(
                        lines
                    ).strip(),
                }
            )

        return blockquotes

    # ------------------------------------------------------
    # MARKDOWN → TEXTE
    # ------------------------------------------------------

    @classmethod
    def _markdown_to_text(cls, source):
        """
        Produit une représentation textuelle simplifiée.

        Le source Markdown original n'est jamais supprimé :
        il reste disponible dans ``raw_content`` et
        ``markdown_source``.
        """

        text = source

        # Blocs de code.
        text = re.sub(
            r"```[^\n]*\n(.*?)\n```",
            r"\n\1\n",
            text,
            flags=re.DOTALL,
        )

        # Images.
        text = re.sub(
            r"!\[([^\]]*)\]"
            r"\(([^)\s]+)"
            r'(?:\s+"[^"]*")?\)',
            r"[IMAGE: \1]",
            text,
        )

        # Liens.
        text = re.sub(
            r"\[([^\]]+)\]"
            r"\(([^)\s]+)"
            r'(?:\s+"[^"]*")?\)',
            r"\1",
            text,
        )

        # Titres.
        text = re.sub(
            r"^#{1,6}[ \t]+",
            "",
            text,
            flags=re.MULTILINE,
        )

        # Blockquotes.
        text = re.sub(
            r"^[ \t]*>[ \t]?",
            "",
            text,
            flags=re.MULTILINE,
        )

        # Cases à cocher.
        text = re.sub(
            r"\[[ xX]\][ \t]+",
            "",
            text,
        )

        # Listes.
        text = re.sub(
            r"^[ \t]*(?:[-+*]|\d+[.)])"
            r"[ \t]+",
            "",
            text,
            flags=re.MULTILINE,
        )

        # Gras.
        text = re.sub(
            r"\*\*(.+?)\*\*",
            r"\1",
            text,
        )

        text = re.sub(
            r"__(.+?)__",
            r"\1",
            text,
        )

        # Italique.
        text = re.sub(
            r"(?<!\*)\*([^*\n]+)\*(?!\*)",
            r"\1",
            text,
        )

        text = re.sub(
            r"(?<!_)_([^_\n]+)_(?!_)",
            r"\1",
            text,
        )

        # Code inline.
        text = re.sub(
            r"`([^`]+)`",
            r"\1",
            text,
        )

        # Barré.
        text = re.sub(
            r"~~(.+?)~~",
            r"\1",
            text,
        )

        # Règles horizontales.
        text = re.sub(
            r"^[ \t]*([-*_])(?:[ \t]*\1){2,}[ \t]*$",
            "",
            text,
            flags=re.MULTILINE,
        )

        # Nettoyage.
        text = re.sub(
            r"[ \t]+",
            " ",
            text,
        )

        text = re.sub(
            r"\n\s*\n\s*\n+",
            "\n\n",
            text,
        )

        return cls.normalize_content(
            text
        )

    # ------------------------------------------------------
    # NETTOYAGE INLINE
    # ------------------------------------------------------

    @staticmethod
    def _clean_inline_markdown(text):
        """
        Nettoie les éléments Markdown inline.
        """

        if not text:
            return ""

        text = re.sub(
            r"!\[([^\]]*)\]"
            r"\(([^)\s]+)"
            r'(?:\s+"[^"]*")?\)',
            r"\1",
            text,
        )

        text = re.sub(
            r"\[([^\]]+)\]"
            r"\(([^)\s]+)"
            r'(?:\s+"[^"]*")?\)',
            r"\1",
            text,
        )

        text = re.sub(
            r"[*_~`]+",
            "",
            text,
        )

        return " ".join(
            text.split()
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
                    "Importeur Markdown professionnel "
                    "pour MACEVO."
                ),

                "source_preserved": True,

                "structural_analysis": True,

                "heading_detection": True,

                "table_detection": True,

                "image_detection": True,

                "code_detection": True,

                "link_detection": True,

                "document_ir_ready": True,
            }
        )

        return data
