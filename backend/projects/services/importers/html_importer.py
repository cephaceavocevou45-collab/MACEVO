
"""
==========================================================
MACEVO IA
HTML Importer
==========================================================

Importeur professionnel de documents HTML.

Objectifs :
- importer HTML / HTM ;
- extraire les métadonnées ;
- préserver la hiérarchie des titres ;
- extraire paragraphes et listes ;
- extraire les tableaux ;
- extraire les liens ;
- détecter les images ;
- produire un contenu textuel normalisé ;
- préparer l'analyse scientifique et le Document IR.

Architecture :

    HTML
      ↓
    HTMLImporter
      ↓
    structure + contenu + métadonnées
      ↓
    Scientific Analysis
      ↓
    Document IR
"""

from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .base_importer import BaseImporter


class HTMLImporter(BaseImporter):
    """
    Importeur HTML.

    Le résultat conserve :
    - le texte global ;
    - les titres ;
    - les sections ;
    - les tableaux ;
    - les liens ;
    - les images ;
    - les métadonnées HTML.
    """

    supported_extensions = (
        ".html",
        ".htm",
    )

    importer_name = "html"

    # ------------------------------------------------------
    # IMPORT PRINCIPAL
    # ------------------------------------------------------

    def import_document(self, file_path):
        """
        Importe un document HTML.

        Parameters
        ----------
        file_path : str | Path
            Chemin du fichier HTML.

        Returns
        -------
        dict
            Résultat normalisé.
        """

        if not file_path:
            raise ValueError(
                "Le chemin du fichier HTML est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier HTML introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension non supportée par HTMLImporter : "
                f"{path.suffix}"
            )

        # --------------------------------------------------
        # LECTURE
        # --------------------------------------------------

        html_content = self._read_file(path)

        if not html_content.strip():
            return self.build_result(
                title=path.stem,
                content="",
                metadata={
                    "format": "html",
                    "source_file": path.name,
                    "empty": True,
                },
                source_path=path,
                source_format="html",
                headings=[],
                paragraphs=[],
                lists=[],
                tables=[],
                links=[],
                images=[],
                sections=[],
            )

        # --------------------------------------------------
        # PARSING
        # --------------------------------------------------

        try:
            soup = BeautifulSoup(
                html_content,
                "html.parser",
            )

        except Exception as exc:
            raise ValueError(
                f"Impossible d'analyser le fichier HTML "
                f"{path.name} : {exc}"
            ) from exc

        # --------------------------------------------------
        # MÉTADONNÉES
        # --------------------------------------------------

        metadata = self._extract_metadata(
            soup,
            path,
        )

        # --------------------------------------------------
        # EXTRACTIONS STRUCTURÉES
        # --------------------------------------------------

        headings = self._extract_headings(
            soup
        )

        paragraphs = self._extract_paragraphs(
            soup
        )

        lists = self._extract_lists(
            soup
        )

        tables = self._extract_tables(
            soup
        )

        links = self._extract_links(
            soup,
            path,
        )

        images = self._extract_images(
            soup,
            path,
        )

        sections = self._build_sections(
            headings,
            paragraphs,
        )

        # --------------------------------------------------
        # CONTENU TEXTUEL
        # --------------------------------------------------

        content = self._extract_text(
            soup
        )

        # --------------------------------------------------
        # STATISTIQUES
        # --------------------------------------------------

        statistics = {
            "headings": len(headings),
            "paragraphs": len(paragraphs),
            "lists": len(lists),
            "tables": len(tables),
            "links": len(links),
            "images": len(images),
            "sections": len(sections),

            "words": self.count_words(
                content
            ),

            "characters": len(content),

            "lines": self.count_lines(
                content
            ),
        }

        metadata.update(
            {
                "format": "html",
                "source_file": path.name,
                "source_extension": path.suffix.lower(),
                "statistics": statistics,
            }
        )

        title = (
            metadata.get("title")
            or path.stem
        )

        # --------------------------------------------------
        # RÉSULTAT
        # --------------------------------------------------

        return self.build_result(
            title=title,
            content=content,
            metadata=metadata,
            source_path=path,
            source_format="html",

            headings=headings,
            paragraphs=paragraphs,
            lists=lists,
            tables=tables,
            links=links,
            images=images,
            sections=sections,

            statistics=statistics,

            raw_content=html_content,
        )

    # ------------------------------------------------------
    # LECTURE
    # ------------------------------------------------------

    @staticmethod
    def _read_file(path):
        """
        Lit le HTML avec plusieurs encodages de secours.
        """

        encodings = (
            "utf-8-sig",
            "utf-8",
            "cp1252",
            "latin-1",
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
            f"Impossible de décoder le fichier HTML : "
            f"{path}"
        ) from last_error

    # ------------------------------------------------------
    # MÉTADONNÉES
    # ------------------------------------------------------

    @staticmethod
    def _extract_metadata(
        soup,
        path,
    ):
        """
        Extrait les principales métadonnées HTML.
        """

        def meta_content(*names):
            for name in names:
                element = soup.find(
                    "meta",
                    attrs={
                        "name": name,
                    },
                )

                if element and element.get(
                    "content"
                ):
                    return element.get(
                        "content"
                    ).strip()

                element = soup.find(
                    "meta",
                    attrs={
                        "property": name,
                    },
                )

                if element and element.get(
                    "content"
                ):
                    return element.get(
                        "content"
                    ).strip()

            return ""

        title = ""

        if soup.title:
            title = soup.title.get_text(
                " ",
                strip=True,
            )

        description = meta_content(
            "description",
            "og:description",
        )

        author = meta_content(
            "author",
            "article:author",
        )

        language = ""

        if soup.html:
            language = (
                soup.html.get("lang")
                or ""
            )

        keywords = meta_content(
            "keywords",
        )

        return {
            "format": "html",

            "title": title or path.stem,

            "author": author,

            "description": description,

            "language": language,

            "keywords": [
                keyword.strip()
                for keyword in keywords.split(",")
                if keyword.strip()
            ],

            "source_file": path.name,
        }

    # ------------------------------------------------------
    # TITRES
    # ------------------------------------------------------

    @staticmethod
    def _extract_headings(soup):
        """
        Extrait h1 à h6 avec leur niveau.
        """

        headings = []

        for element in soup.find_all(
            [
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
            ]
        ):
            text = element.get_text(
                " ",
                strip=True,
            )

            if not text:
                continue

            headings.append(
                {
                    "level": int(
                        element.name[1]
                    ),
                    "title": text,
                    "id": element.get(
                        "id"
                    ),
                }
            )

        return headings

    # ------------------------------------------------------
    # PARAGRAPHES
    # ------------------------------------------------------

    @staticmethod
    def _extract_paragraphs(soup):
        """
        Extrait les paragraphes HTML.
        """

        paragraphs = []

        for element in soup.find_all(
            "p"
        ):
            text = element.get_text(
                " ",
                strip=True,
            )

            if text:
                paragraphs.append(text)

        return paragraphs

    # ------------------------------------------------------
    # LISTES
    # ------------------------------------------------------

    @staticmethod
    def _extract_lists(soup):
        """
        Extrait les listes ordonnées et non ordonnées.
        """

        lists = []

        for element in soup.find_all(
            [
                "ul",
                "ol",
            ]
        ):
            items = []

            for item in element.find_all(
                "li",
                recursive=False,
            ):
                text = item.get_text(
                    " ",
                    strip=True,
                )

                if text:
                    items.append(text)

            if not items:
                continue

            lists.append(
                {
                    "type": (
                        "ordered"
                        if element.name == "ol"
                        else "unordered"
                    ),
                    "items": items,
                }
            )

        return lists

    # ------------------------------------------------------
    # TABLEAUX
    # ------------------------------------------------------

    @classmethod
    def _extract_tables(cls, soup):
        """
        Extrait les tableaux HTML sous une forme structurée.
        """

        tables = []

        for table_index, table in enumerate(
            soup.find_all("table"),
            start=1,
        ):
            headers = []

            header_row = table.find("thead")

            if header_row:
                row = header_row.find("tr")

                if row:
                    headers = [
                        cell.get_text(
                            " ",
                            strip=True,
                        )
                        for cell in row.find_all(
                            [
                                "th",
                                "td",
                            ]
                        )
                    ]

            rows = []

            for row in table.find_all(
                "tr"
            ):
                cells = row.find_all(
                    [
                        "td",
                        "th",
                    ]
                )

                values = [
                    cell.get_text(
                        " ",
                        strip=True,
                    )
                    for cell in cells
                ]

                if not values:
                    continue

                # Si aucune structure d'en-tête n'a
                # été détectée, une première ligne
                # de th peut servir d'en-tête.
                if (
                    not headers
                    and all(
                        cell.name == "th"
                        for cell in cells
                    )
                ):
                    headers = values
                    continue

                rows.append(values)

            # Détermine le nombre de colonnes.
            column_count = max(
                [
                    len(headers),
                    *(
                        len(row)
                        for row in rows
                    ),
                ],
                default=0,
            )

            # Normalise les lignes.
            normalized_rows = []

            for row in rows:
                row = list(row)

                if len(row) < column_count:
                    row.extend(
                        [""] * (
                            column_count
                            - len(row)
                        )
                    )

                normalized_rows.append(row)

            caption_element = table.find(
                "caption"
            )

            caption = ""

            if caption_element:
                caption = caption_element.get_text(
                    " ",
                    strip=True,
                )

            tables.append(
                {
                    "index": table_index,
                    "caption": caption,
                    "headers": headers,
                    "rows": normalized_rows,
                    "columns": column_count,
                }
            )

        return tables

    # ------------------------------------------------------
    # LIENS
    # ------------------------------------------------------

    @staticmethod
    def _extract_links(
        soup,
        path,
    ):
        """
        Extrait les liens avec leur URL résolue.
        """

        links = []

        base_url = ""

        base_element = soup.find(
            "base",
            href=True,
        )

        if base_element:
            base_url = base_element.get(
                "href",
                "",
            )

        for element in soup.find_all(
            "a",
            href=True,
        ):
            href = element.get(
                "href",
                "",
            ).strip()

            if not href:
                continue

            text = element.get_text(
                " ",
                strip=True,
            )

            absolute_url = (
                urljoin(
                    base_url,
                    href,
                )
                if base_url
                else href
            )

            links.append(
                {
                    "text": text,
                    "href": href,
                    "url": absolute_url,
                }
            )

        return links

    # ------------------------------------------------------
    # IMAGES
    # ------------------------------------------------------

    @staticmethod
    def _extract_images(
        soup,
        path,
    ):
        """
        Extrait les images référencées par le HTML.

        Les fichiers ne sont pas copiés ou modifiés ici.
        """

        images = []

        for index, element in enumerate(
            soup.find_all(
                "img",
                src=True,
            ),
            start=1,
        ):
            src = element.get(
                "src",
                "",
            ).strip()

            if not src:
                continue

            alt = element.get(
                "alt",
                "",
            ).strip()

            title = element.get(
                "title",
                "",
            ).strip()

            source_path = None

            # Pour les chemins relatifs locaux,
            # fournit le chemin absolu correspondant.
            if not (
                src.startswith("http://")
                or src.startswith("https://")
                or src.startswith("data:")
                or src.startswith("//")
            ):
                source_path = str(
                    (
                        path.parent
                        / src
                    ).resolve()
                )

            images.append(
                {
                    "index": index,
                    "src": src,
                    "alt": alt,
                    "title": title,
                    "path": source_path,
                }
            )

        return images

    # ------------------------------------------------------
    # TEXTE GLOBAL
    # ------------------------------------------------------

    @classmethod
    def _extract_text(cls, soup):
        """
        Extrait le texte lisible du document.

        Les éléments non textuels ou techniques sont
        retirés afin de ne pas polluer l'analyse.
        """

        # Copie logique du DOM pour éviter de modifier
        # le contenu utilisé par les autres extracteurs.
        for element in soup.find_all(
            [
                "script",
                "style",
                "noscript",
                "template",
                "svg",
            ]
        ):
            element.decompose()

        text = soup.get_text(
            separator="\n",
            strip=True,
        )

        return cls.normalize_content(
            text
        )

    # ------------------------------------------------------
    # CONSTRUCTION DES SECTIONS
    # ------------------------------------------------------

    @staticmethod
    def _build_sections(
        headings,
        paragraphs,
    ):
        """
        Construit une représentation simplifiée des
        sections à partir des titres.

        Cette structure pourra être transformée plus tard
        vers le Document IR complet.
        """

        if not headings:
            return []

        sections = []

        for index, heading in enumerate(
            headings
        ):
            next_level = None

            if index + 1 < len(headings):
                next_level = headings[
                    index + 1
                ].get("level")

            sections.append(
                {
                    "title": heading.get(
                        "title",
                        "",
                    ),
                    "level": heading.get(
                        "level",
                        1,
                    ),
                    "id": heading.get(
                        "id"
                    ),
                    "has_following_heading": (
                        index + 1
                        < len(headings)
                    ),
                    "next_heading_level": (
                        next_level
                    ),
                }
            )

        return sections

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
                    "Importeur de documents HTML "
                    "pour MACEVO."
                ),
                "structured_output": True,
                "metadata_extraction": True,
                "heading_extraction": True,
                "table_extraction": True,
                "link_extraction": True,
                "image_detection": True,
            }
        )

        return data
