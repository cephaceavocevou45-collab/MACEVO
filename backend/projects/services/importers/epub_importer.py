
"""
==========================================================
MACEVO IA
EPUB Importer
==========================================================

Importeur professionnel de livres EPUB.

Objectifs :
- lire les fichiers EPUB ;
- récupérer les métadonnées du livre ;
- respecter l'ordre de lecture EPUB ;
- extraire les chapitres ;
- conserver une structure par chapitre ;
- produire un contenu textuel global ;
- préparer l'analyse scientifique et le Document IR.

Architecture :

    .epub
       ↓
    EPUBImporter
       ↓
    métadonnées + chapitres + contenu
       ↓
    Scientific Analysis
       ↓
    Document IR
"""

from pathlib import Path

from bs4 import BeautifulSoup
from ebooklib import epub, ITEM_DOCUMENT

from .base_importer import BaseImporter


class EPUBImporter(BaseImporter):
    """
    Importeur de livres EPUB.

    Le résultat conserve :
    - le texte global ;
    - les chapitres ;
    - les métadonnées ;
    - les informations de navigation ;
    - les statistiques de base.
    """

    supported_extensions = (
        ".epub",
    )

    importer_name = "epub"

    # ------------------------------------------------------
    # IMPORT PRINCIPAL
    # ------------------------------------------------------

    def import_document(self, file_path):
        """
        Importe un fichier EPUB.

        Parameters
        ----------
        file_path : str | Path
            Chemin du fichier EPUB.

        Returns
        -------
        dict
            Résultat normalisé.
        """

        if not file_path:
            raise ValueError(
                "Le chemin du fichier EPUB est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier EPUB introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension non supportée par EPUBImporter : "
                f"{path.suffix}"
            )

        # --------------------------------------------------
        # LECTURE EPUB
        # --------------------------------------------------

        try:
            book = epub.read_epub(str(path))

        except Exception as exc:
            raise ValueError(
                f"Impossible de lire le fichier EPUB "
                f"{path.name} : {exc}"
            ) from exc

        # --------------------------------------------------
        # MÉTADONNÉES
        # --------------------------------------------------

        metadata = self._extract_metadata(
            book,
            path,
        )

        # --------------------------------------------------
        # DOCUMENTS EPUB
        # --------------------------------------------------

        document_items = self._get_document_items(
            book
        )

        chapters = []

        for index, item in enumerate(
            document_items,
            start=1,
        ):
            chapter = self._extract_chapter(
                item,
                index,
            )

            if chapter:
                chapters.append(chapter)

        # --------------------------------------------------
        # CONTENU GLOBAL
        # --------------------------------------------------

        content = "\n\n".join(
            chapter["content"]
            for chapter in chapters
            if chapter.get("content")
        )

        # --------------------------------------------------
        # STATISTIQUES
        # --------------------------------------------------

        statistics = {
            "chapters": len(chapters),
            "documents": len(document_items),
            "characters": len(content),
            "words": self.count_words(content),
            "lines": self.count_lines(content),
        }

        # --------------------------------------------------
        # MÉTADONNÉES COMPLÉMENTAIRES
        # --------------------------------------------------

        metadata.update(
            {
                "format": "epub",
                "source_file": path.name,
                "source_extension": path.suffix.lower(),

                "chapters": len(chapters),
                "documents": len(document_items),
            }
        )

        # --------------------------------------------------
        # RÉSULTAT
        # --------------------------------------------------

        title = (
            metadata.get("title")
            or path.stem
        )

        return self.build_result(
            title=title,
            content=content,
            metadata=metadata,
            source_path=path,
            source_format="epub",

            chapters=chapters,

            statistics=statistics,

            navigation=[
                {
                    "index": chapter["index"],
                    "title": chapter["title"],
                    "href": chapter.get("href"),
                }
                for chapter in chapters
            ],
        )

    # ------------------------------------------------------
    # MÉTADONNÉES
    # ------------------------------------------------------

    @staticmethod
    def _extract_metadata(book, path):
        """
        Extrait les principales métadonnées EPUB.
        """

        def get_metadata(name):
            try:
                values = book.get_metadata(
                    "DC",
                    name,
                )

                if not values:
                    return ""

                value = values[0]

                if isinstance(value, tuple):
                    return str(value[0]).strip()

                return str(value).strip()

            except Exception:
                return ""

        title = get_metadata("title")
        creator = get_metadata("creator")
        language = get_metadata("language")
        publisher = get_metadata("publisher")
        date = get_metadata("date")
        identifier = get_metadata("identifier")
        subject = get_metadata("subject")
        description = get_metadata("description")

        return {
            "format": "epub",
            "title": title or path.stem,
            "author": creator,
            "language": language,
            "publisher": publisher,
            "date": date,
            "identifier": identifier,
            "subject": subject,
            "description": description,
        }

    # ------------------------------------------------------
    # ORDRE DES DOCUMENTS
    # ------------------------------------------------------

    @staticmethod
    def _get_document_items(book):
        """
        Retourne les documents EPUB dans l'ordre de lecture
        lorsque celui-ci est disponible.

        Fallback :
            ordre des documents retournés par EbookLib.
        """

        try:
            spine = getattr(
                book,
                "spine",
                [],
            )

            if spine:
                items = []

                for spine_item in spine:
                    item_id = None

                    if isinstance(
                        spine_item,
                        (tuple, list),
                    ):
                        if spine_item:
                            item_id = spine_item[0]
                    else:
                        item_id = spine_item

                    if not item_id:
                        continue

                    try:
                        item = book.get_item_with_id(
                            item_id
                        )
                    except Exception:
                        item = None

                    if item is None:
                        continue

                    if item.get_type() == ITEM_DOCUMENT:
                        items.append(item)

                if items:
                    return items

        except Exception:
            pass

        return [
            item
            for item in book.get_items()
            if item.get_type() == ITEM_DOCUMENT
        ]

    # ------------------------------------------------------
    # EXTRACTION D'UN CHAPITRE
    # ------------------------------------------------------

    @classmethod
    def _extract_chapter(cls, item, index):
        """
        Extrait le texte et les informations principales
        d'un document HTML interne à l'EPUB.
        """

        try:
            body = item.get_body_content()

        except Exception:
            body = b""

        if isinstance(body, bytes):
            try:
                body = body.decode(
                    "utf-8",
                    errors="replace",
                )
            except Exception:
                body = str(body)

        if not body:
            return None

        try:
            soup = BeautifulSoup(
                body,
                "html.parser",
            )

        except Exception:
            return None

        # --------------------------------------------------
        # TITRE
        # --------------------------------------------------

        title = cls._extract_title(
            soup,
            item,
            index,
        )

        # --------------------------------------------------
        # TEXTE
        # --------------------------------------------------

        text = soup.get_text(
            separator="\n",
            strip=True,
        )

        text = cls.normalize_content(text)

        if not text:
            return None

        # --------------------------------------------------
        # TITRES INTERNES
        # --------------------------------------------------

        headings = []

        for heading in soup.find_all(
            [
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
            ]
        ):
            heading_text = heading.get_text(
                " ",
                strip=True,
            )

            if heading_text:
                headings.append(
                    {
                        "level": int(
                            heading.name[1]
                        ),
                        "title": heading_text,
                    }
                )

        # --------------------------------------------------
        # LIENS
        # --------------------------------------------------

        links = []

        for link in soup.find_all("a"):
            href = link.get("href")
            link_text = link.get_text(
                " ",
                strip=True,
            )

            if href:
                links.append(
                    {
                        "text": link_text,
                        "href": href,
                    }
                )

        # --------------------------------------------------
        # RÉSULTAT
        # --------------------------------------------------

        href = ""

        try:
            href = item.get_name() or ""
        except Exception:
            pass

        return {
            "index": index,
            "id": getattr(
                item,
                "id",
                "",
            ),
            "title": title,
            "href": href,
            "content": text,

            "word_count": cls.count_words(
                text
            ),

            "character_count": len(text),

            "headings": headings,
            "links": links,
        }

    # ------------------------------------------------------
    # TITRE DU CHAPITRE
    # ------------------------------------------------------

    @staticmethod
    def _extract_title(
        soup,
        item,
        index,
    ):
        """
        Cherche le titre du document HTML.
        """

        for selector in (
            "h1",
            "h2",
            "title",
        ):
            element = soup.find(selector)

            if element:
                title = element.get_text(
                    " ",
                    strip=True,
                )

                if title:
                    return title

        try:
            name = item.get_name()

            if name:
                return Path(name).stem

        except Exception:
            pass

        return f"Chapitre {index}"

    # ------------------------------------------------------
    # STATISTIQUES
    # ------------------------------------------------------

    @staticmethod
    def chapter_statistics(result):
        """
        Retourne les statistiques détaillées des chapitres.
        """

        if not isinstance(result, dict):
            return []

        chapters = result.get(
            "chapters",
            [],
        )

        return [
            {
                "index": chapter.get("index"),
                "title": chapter.get("title"),
                "word_count": chapter.get(
                    "word_count",
                    0,
                ),
                "character_count": chapter.get(
                    "character_count",
                    0,
                ),
                "headings": len(
                    chapter.get(
                        "headings",
                        [],
                    )
                ),
                "links": len(
                    chapter.get(
                        "links",
                        [],
                    )
                ),
            }
            for chapter in chapters
        ]

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
                    "Importeur de livres et documents EPUB "
                    "pour MACEVO."
                ),
                "structured_output": True,
                "chapter_extraction": True,
                "metadata_extraction": True,
                "navigation_preservation": True,
            }
        )

        return data
