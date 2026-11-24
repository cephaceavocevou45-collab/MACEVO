
"""
==========================================================
MACEVO IA
Image Importer
==========================================================

Importeur professionnel d'images avec OCR.

Objectifs :
- importer les images ;
- extraire les métadonnées techniques ;
- effectuer l'OCR lorsque disponible ;
- conserver le texte OCR ;
- préparer l'image pour l'analyse Vision ;
- préparer l'analyse d'équations et de contenu scientifique ;
- identifier les caractéristiques utiles à l'analyse ;
- préserver le chemin de l'image source.

Architecture :

    Image
      ↓
    ImageImporter
      ├── métadonnées
      ├── OCR
      └── informations visuelles
            ↓
       Vision / Math / Scientific
            ↓
        Document IR
"""

from pathlib import Path

import pytesseract
from PIL import Image, ImageOps

from .base_importer import BaseImporter


class ImageImporter(BaseImporter):
    """
    Importeur d'images avec OCR.

    Le résultat conserve :
    - le texte OCR ;
    - les métadonnées de l'image ;
    - les dimensions ;
    - le mode colorimétrique ;
    - le format ;
    - le chemin source ;
    - les informations préparatoires à Vision.
    """

    supported_extensions = (
        ".png",
        ".jpg",
        ".jpeg",
        ".bmp",
        ".tif",
        ".tiff",
        ".webp",
    )

    importer_name = "image"

    # ------------------------------------------------------
    # IMPORT PRINCIPAL
    # ------------------------------------------------------

    def import_document(self, file_path):
        """
        Importe une image et effectue l'OCR.

        Parameters
        ----------
        file_path : str | Path
            Chemin de l'image.

        Returns
        -------
        dict
            Résultat normalisé.
        """

        if not file_path:
            raise ValueError(
                "Le chemin de l'image est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Image introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension d'image non supportée : "
                f"{path.suffix}"
            )

        # --------------------------------------------------
        # OUVERTURE
        # --------------------------------------------------

        try:
            image = Image.open(path)

            # Force le chargement afin de détecter
            # immédiatement les fichiers corrompus.
            image.load()

        except Exception as exc:
            raise ValueError(
                f"Impossible de lire l'image "
                f"{path.name} : {exc}"
            ) from exc

        try:
            # --------------------------------------------------
            # MÉTADONNÉES
            # --------------------------------------------------

            metadata = self._extract_metadata(
                image,
                path,
            )

            # --------------------------------------------------
            # OCR
            # --------------------------------------------------

            ocr_result = self._extract_ocr(
                image
            )

            text = ocr_result["text"]

            # --------------------------------------------------
            # STATISTIQUES OCR
            # --------------------------------------------------

            ocr_statistics = {
                "characters": len(text),
                "words": self.count_words(text),
                "lines": self.count_lines(text),

                "confidence": (
                    ocr_result["confidence"]
                ),

                "language": "fra+eng",
            }

            # --------------------------------------------------
            # MÉTADONNÉES FINALES
            # --------------------------------------------------

            metadata.update(
                {
                    "format": "image",
                    "source_file": path.name,
                    "source_extension": path.suffix.lower(),

                    "ocr": True,

                    "ocr_language": "fra+eng",

                    "ocr_confidence": (
                        ocr_result["confidence"]
                    ),
                }
            )

            # --------------------------------------------------
            # RÉSULTAT
            # --------------------------------------------------

            return self.build_result(
                title=path.stem,
                content=text,
                metadata=metadata,
                source_path=path,
                source_format="image",

                image={
                    "path": str(path),
                    "filename": path.name,
                    "format": metadata["image_format"],
                    "width": metadata["width"],
                    "height": metadata["height"],
                    "mode": metadata["mode"],
                    "has_transparency": metadata[
                        "has_transparency"
                    ],
                },

                ocr={
                    "text": text,
                    "language": "fra+eng",
                    "confidence": (
                        ocr_result["confidence"]
                    ),
                    "statistics": ocr_statistics,
                },

                vision={
                    "ready": True,
                    "source_path": str(path),
                    "width": metadata["width"],
                    "height": metadata["height"],
                },

                scientific_analysis={
                    "ocr_available": bool(text),
                    "possible_equation": self._looks_like_equation(
                        text
                    ),
                    "possible_table": self._looks_like_table(
                        text
                    ),
                },

                statistics={
                    "ocr": ocr_statistics,
                    "image": {
                        "width": metadata["width"],
                        "height": metadata["height"],
                    },
                },
            )

        finally:
            image.close()

    # ------------------------------------------------------
    # MÉTADONNÉES IMAGE
    # ------------------------------------------------------

    @staticmethod
    def _extract_metadata(
        image,
        path,
    ):
        """
        Extrait les principales informations techniques
        de l'image.
        """

        width, height = image.size

        has_transparency = (
            "A" in image.getbands()
            or "transparency" in image.info
        )

        return {
            "format": "image",

            "image_format": (
                image.format.lower()
                if image.format
                else path.suffix
                .lower()
                .lstrip(".")
            ),

            "width": width,

            "height": height,

            "mode": image.mode,

            "has_transparency": (
                has_transparency
            ),

            "dpi": image.info.get(
                "dpi"
            ),

            "filename": path.name,

            "file_size": (
                path.stat().st_size
            ),
        }

    # ------------------------------------------------------
    # OCR
    # ------------------------------------------------------

    @classmethod
    def _extract_ocr(cls, image):
        """
        Effectue l'OCR et calcule une confiance moyenne
        lorsque Tesseract fournit les données nécessaires.
        """

        # Une copie en niveaux de gris améliore souvent
        # l'OCR sur les documents numérisés.
        processed = cls._prepare_for_ocr(
            image
        )

        try:
            text = pytesseract.image_to_string(
                processed,
                lang="fra+eng",
            )

        except pytesseract.TesseractNotFoundError as exc:
            raise RuntimeError(
                "Tesseract OCR n'est pas installé ou "
                "n'est pas accessible dans l'environnement."
            ) from exc

        except Exception as exc:
            raise RuntimeError(
                f"Échec de l'OCR : {exc}"
            ) from exc

        text = cls.normalize_content(
            text
        )

        confidence = cls._ocr_confidence(
            processed
        )

        return {
            "text": text,
            "confidence": confidence,
        }

    # ------------------------------------------------------
    # PRÉPARATION OCR
    # ------------------------------------------------------

    @staticmethod
    def _prepare_for_ocr(image):
        """
        Prépare une copie de l'image pour l'OCR.

        L'image originale n'est jamais modifiée.
        """

        processed = image.copy()

        if processed.mode not in (
            "L",
            "RGB",
        ):
            processed = processed.convert(
                "RGB"
            )

        if processed.mode == "RGB":
            processed = ImageOps.grayscale(
                processed
            )

        return processed

    # ------------------------------------------------------
    # CONFIANCE OCR
    # ------------------------------------------------------

    @staticmethod
    def _ocr_confidence(image):
        """
        Calcule la confiance moyenne fournie par Tesseract.

        Retourne None si les données de confiance ne sont
        pas disponibles.
        """

        try:
            data = pytesseract.image_to_data(
                image,
                lang="fra+eng",
                output_type=pytesseract.Output.DICT,
            )

        except Exception:
            return None

        values = []

        for value in data.get(
            "conf",
            [],
        ):
            try:
                confidence = float(value)

                if confidence >= 0:
                    values.append(
                        confidence
                    )

            except (
                TypeError,
                ValueError,
            ):
                continue

        if not values:
            return None

        return round(
            sum(values) / len(values),
            2,
        )

    # ------------------------------------------------------
    # DÉTECTION ÉQUATION
    # ------------------------------------------------------

    @staticmethod
    def _looks_like_equation(text):
        """
        Détection heuristique très prudente d'un contenu
        pouvant être mathématique.

        Cette méthode ne prétend pas reconnaître une
        équation avec certitude : l'analyse spécialisée
        devra être réalisée par le futur moteur Math/Vision.
        """

        if not text:
            return False

        mathematical_symbols = (
            "=",
            "∑",
            "∫",
            "√",
            "≤",
            "≥",
            "∞",
            "∂",
            "Δ",
            "α",
            "β",
            "γ",
            "^",
        )

        symbol_count = sum(
            text.count(symbol)
            for symbol in mathematical_symbols
        )

        return symbol_count >= 1

    # ------------------------------------------------------
    # DÉTECTION TABLEAU
    # ------------------------------------------------------

    @staticmethod
    def _looks_like_table(text):
        """
        Détection heuristique d'un texte OCR pouvant provenir
        d'un tableau.
        """

        if not text:
            return False

        lines = [
            line
            for line in text.splitlines()
            if line.strip()
        ]

        if len(lines) < 3:
            return False

        separator_lines = sum(
            1
            for line in lines
            if (
                "|" in line
                or "\t" in line
                or "  " in line
            )
        )

        return separator_lines >= 2

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
                    "Importeur d'images avec OCR "
                    "pour MACEVO."
                ),

                "ocr": True,

                "vision_ready": True,

                "scientific_analysis": True,

                "equation_detection": True,

                "table_detection": True,
            }
        )

        return data
