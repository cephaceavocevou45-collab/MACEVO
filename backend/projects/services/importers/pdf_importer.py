
"""
==========================================================
MACEVO IA
PDF Importer
==========================================================

Importeur PDF professionnel.

Objectifs :
- importer les PDF ;
- extraire le texte page par page ;
- conserver la structure des pages ;
- extraire les blocs de texte ;
- détecter les images ;
- extraire les métadonnées PDF ;
- calculer des statistiques ;
- détecter les caractéristiques scientifiques ;
- préparer l'analyse Vision/OCR ;
- préparer l'intégration avec le Document IR ;
- rester indépendant des fournisseurs IA.

Architecture :

    PDF
     │
     ├── texte
     ├── pages
     ├── blocs
     ├── images
     └── métadonnées
            │
            ↓
       Analyse scientifique
            │
            ↓
       Document IR
"""

from pathlib import Path

import fitz

from .base_importer import BaseImporter


class PDFImporter(BaseImporter):
    """
    Importeur PDF professionnel avec PyMuPDF.
    """

    supported_extensions = (
        ".pdf",
    )

    importer_name = "pdf"

    # ------------------------------------------------------
    # IMPORT PRINCIPAL
    # ------------------------------------------------------

    def import_document(self, file_path):
        """
        Importe un fichier PDF.

        Parameters
        ----------
        file_path : str | Path
            Chemin du PDF.

        Returns
        -------
        dict
            Résultat normalisé.
        """

        if not file_path:
            raise ValueError(
                "Le chemin du fichier PDF est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier PDF introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension PDF non supportée : {path.suffix}"
            )

        # --------------------------------------------------
        # OUVERTURE
        # --------------------------------------------------

        try:
            document = fitz.open(
                str(path)
            )

        except Exception as exc:
            raise ValueError(
                f"Impossible d'ouvrir le PDF "
                f"{path.name} : {exc}"
            ) from exc

        try:

            if document.is_encrypted:

                if not document.authenticate(""):
                    raise ValueError(
                        f"Le PDF {path.name} est protégé "
                        "par mot de passe et ne peut pas "
                        "être ouvert automatiquement."
                    )

            # --------------------------------------------------
            # MÉTADONNÉES
            # --------------------------------------------------

            pdf_metadata = self._extract_metadata(
                document
            )

            # --------------------------------------------------
            # PAGES
            # --------------------------------------------------

            pages = []

            for page_number, page in enumerate(
                document,
                start=1,
            ):

                page_data = self._extract_page(
                    page,
                    page_number,
                )

                pages.append(
                    page_data
                )

            # --------------------------------------------------
            # CONTENU
            # --------------------------------------------------

            content = self._build_content(
                pages
            )

            # --------------------------------------------------
            # STATISTIQUES
            # --------------------------------------------------

            statistics = self._build_statistics(
                pages,
                content,
            )

            # --------------------------------------------------
            # STRUCTURE
            # --------------------------------------------------

            structure = {
                "pages": pages,

                "page_count": len(pages),

                "text_pages": sum(
                    1
                    for page in pages
                    if page["text"].strip()
                ),

                "image_pages": sum(
                    1
                    for page in pages
                    if page["images"]
                ),
            }

            # --------------------------------------------------
            # MÉTADONNÉES FINALES
            # --------------------------------------------------

            metadata = {
                "format": "pdf",

                "source_file": path.name,

                "source_extension": path.suffix.lower(),

                "pages": len(document),

                "title": pdf_metadata.get(
                    "title"
                ),

                "author": pdf_metadata.get(
                    "author"
                ),

                "subject": pdf_metadata.get(
                    "subject"
                ),

                "keywords": pdf_metadata.get(
                    "keywords"
                ),

                "creator": pdf_metadata.get(
                    "creator"
                ),

                "producer": pdf_metadata.get(
                    "producer"
                ),

                "creation_date": pdf_metadata.get(
                    "creationDate"
                ),

                "modification_date": pdf_metadata.get(
                    "modDate"
                ),

                "statistics": statistics,
            }

            # --------------------------------------------------
            # RÉSULTAT
            # --------------------------------------------------

            return self.build_result(
                title=(
                    pdf_metadata.get("title")
                    or path.stem
                ),

                content=content,

                metadata=metadata,

                source_path=path,

                source_format="pdf",

                pages=pages,

                structure=structure,

                pdf_metadata=pdf_metadata,

                statistics=statistics,

                vision={
                    "available": True,

                    "image_pages": sum(
                        1
                        for page in pages
                        if page["images"]
                    ),

                    "image_count": statistics[
                        "images"
                    ],
                },

                scientific_analysis={
                    "text_available": bool(
                        content.strip()
                    ),

                    "image_content_available": (
                        statistics["images"] > 0
                    ),

                    "scanned_document_candidate": (
                        statistics["text_pages"] == 0
                        and statistics["images"] > 0
                    ),

                    "equation_candidate": (
                        self._looks_like_scientific_content(
                            content
                        )
                    ),
                },
            )

        finally:
            document.close()

    # ------------------------------------------------------
    # PAGE
    # ------------------------------------------------------

    @classmethod
    def _extract_page(
        cls,
        page,
        page_number,
    ):
        """
        Extrait les informations d'une page.
        """

        text = page.get_text(
            "text"
        )

        blocks = cls._extract_blocks(
            page
        )

        images = cls._extract_images(
            page
        )

        width = page.rect.width
        height = page.rect.height

        return {
            "number": page_number,

            "text": cls.normalize_content(
                text
            ),

            "blocks": blocks,

            "images": images,

            "width": round(
                width,
                2,
            ),

            "height": round(
                height,
                2,
            ),

            "rotation": page.rotation,

            "word_count": cls.count_words(
                text
            ),

            "character_count": len(
                text
            ),
        }

    # ------------------------------------------------------
    # BLOCS DE TEXTE
    # ------------------------------------------------------

    @staticmethod
    def _extract_blocks(page):
        """
        Extrait les blocs de texte du PDF.

        Les coordonnées sont conservées afin de permettre
        ultérieurement une reconstruction plus fidèle de
        la mise en page.
        """

        blocks = []

        try:
            raw_blocks = page.get_text(
                "blocks"
            )

        except Exception:
            return blocks

        for index, block in enumerate(
            raw_blocks,
            start=1,
        ):

            if len(block) < 5:
                continue

            x0, y0, x1, y1, text = block[:5]

            text = str(text).strip()

            if not text:
                continue

            blocks.append(
                {
                    "index": index,

                    "text": text,

                    "bbox": {
                        "x0": round(x0, 2),
                        "y0": round(y0, 2),
                        "x1": round(x1, 2),
                        "y1": round(y1, 2),
                    },

                    "width": round(
                        x1 - x0,
                        2,
                    ),

                    "height": round(
                        y1 - y0,
                        2,
                    ),
                }
            )

        return blocks

    # ------------------------------------------------------
    # IMAGES
    # ------------------------------------------------------

    @staticmethod
    def _extract_images(page):
        """
        Détecte les images présentes sur la page.

        Les données binaires ne sont pas extraites ici.
        L'objectif est de préparer leur traitement futur
        par Vision/OCR.
        """

        images = []

        try:
            image_list = page.get_images(
                full=True
            )

        except Exception:
            return images

        for index, image in enumerate(
            image_list,
            start=1,
        ):

            if not image:
                continue

            xref = image[0]

            width = (
                image[2]
                if len(image) > 2
                else None
            )

            height = (
                image[3]
                if len(image) > 3
                else None
            )

            images.append(
                {
                    "index": index,

                    "xref": xref,

                    "width": width,

                    "height": height,
                }
            )

        return images

    # ------------------------------------------------------
    # CONTENU
    # ------------------------------------------------------

    @staticmethod
    def _build_content(pages):
        """
        Construit le contenu global en conservant les
        séparations entre pages.
        """

        parts = []

        for page in pages:

            text = page["text"].strip()

            if not text:
                continue

            parts.append(
                f"[Page {page['number']}]\n{text}"
            )

        return "\n\n".join(
            parts
        )

    # ------------------------------------------------------
    # MÉTADONNÉES PDF
    # ------------------------------------------------------

    @staticmethod
    def _extract_metadata(document):
        """
        Extrait les métadonnées natives du PDF.
        """

        try:
            metadata = document.metadata

        except Exception:
            metadata = {}

        if not isinstance(
            metadata,
            dict,
        ):
            return {}

        return {
            key: value
            for key, value in metadata.items()
            if value not in (
                None,
                "",
            )
        }

    # ------------------------------------------------------
    # STATISTIQUES
    # ------------------------------------------------------

    @staticmethod
    def _build_statistics(
        pages,
        content,
    ):
        """
        Calcule les statistiques globales du PDF.
        """

        return {
            "pages": len(pages),

            "text_pages": sum(
                1
                for page in pages
                if page["text"].strip()
            ),

            "images": sum(
                len(page["images"])
                for page in pages
            ),

            "blocks": sum(
                len(page["blocks"])
                for page in pages
            ),

            "characters": len(
                content
            ),

            "words": PDFImporter.count_words(
                content
            ),

            "lines": PDFImporter.count_lines(
                content
            ),
        }

    # ------------------------------------------------------
    # DÉTECTION SCIENTIFIQUE
    # ------------------------------------------------------

    @staticmethod
    def _looks_like_scientific_content(
        text
    ):
        """
        Détection heuristique très prudente de contenu
        scientifique.

        Cette méthode ne remplace pas le moteur scientifique
        de MACEVO.
        """

        if not text:
            return False

        indicators = (
            "équation",
            "equation",
            "méthodologie",
            "methodology",
            "résultats",
            "results",
            "discussion",
            "conclusion",
            "références",
            "references",
            "bibliographie",
            "doi",
            "tableau",
            "figure",
            "theorem",
            "théorème",
        )

        lowered = text.lower()

        return any(
            indicator in lowered
            for indicator in indicators
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
                    "Importeur PDF professionnel "
                    "pour MACEVO."
                ),

                "page_extraction": True,

                "block_extraction": True,

                "image_detection": True,

                "metadata_extraction": True,

                "layout_coordinates": True,

                "scientific_analysis": True,

                "vision_ready": True,

                "document_ir_ready": True,
            }
        )

        return data
