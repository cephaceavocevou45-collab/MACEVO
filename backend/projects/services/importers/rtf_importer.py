
"""
==========================================================
MACEVO IA
RTF Importer
==========================================================

Importeur RTF professionnel pour MACEVO.

Objectifs :
- importer les fichiers .rtf ;
- gérer plusieurs encodages ;
- convertir le RTF en texte exploitable ;
- conserver le contenu source ;
- calculer les statistiques ;
- préparer l'analyse scientifique ;
- rester compatible avec BaseImporter ;
- préparer l'intégration avec le Document IR.

L'importeur ne communique pas directement avec les
providers IA.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from striprtf.striprtf import rtf_to_text

from .base_importer import BaseImporter


class RTFImporter(BaseImporter):
    """
    Importeur RTF professionnel.
    """

    supported_extensions = (
        ".rtf",
    )

    importer_name = "rtf"

    # ======================================================
    # IMPORT PRINCIPAL
    # ======================================================

    def import_document(
        self,
        file_path,
    ):
        """
        Importe un fichier RTF.

        Parameters
        ----------
        file_path : str | Path
            Chemin vers le fichier RTF.

        Returns
        -------
        dict
            Résultat normalisé MACEVO.
        """

        if not file_path:
            raise ValueError(
                "Le chemin du fichier RTF "
                "est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier RTF introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension RTF non supportée : "
                f"{path.suffix}"
            )

        # --------------------------------------------------
        # LECTURE
        # --------------------------------------------------

        raw_content = self._read_rtf(
            path
        )

        if not raw_content.strip():
            content = ""
        else:
            try:
                content = rtf_to_text(
                    raw_content
                )
            except Exception as exc:
                raise ValueError(
                    f"Impossible de convertir le RTF "
                    f"{path.name} en texte : {exc}"
                ) from exc

        content = self.normalize_content(
            content
        )

        # --------------------------------------------------
        # STATISTIQUES
        # --------------------------------------------------

        statistics = self._build_statistics(
            raw_content,
            content,
        )

        # --------------------------------------------------
        # STRUCTURE
        # --------------------------------------------------

        structure = {
            "paragraphs": self._extract_paragraphs(
                content
            ),

            "paragraph_count": len(
                self._extract_paragraphs(
                    content
                )
            ),

            "has_text": bool(
                content.strip()
            ),
        }

        # --------------------------------------------------
        # RÉSULTAT
        # --------------------------------------------------

        return self.build_result(
            title=path.stem,

            content=content,

            metadata={
                "format": "rtf",

                "source_file": path.name,

                "source_extension": path.suffix.lower(),

                "statistics": statistics,
            },

            source_path=path,

            source_format="rtf",

            raw_content=raw_content,

            structure=structure,

            statistics=statistics,

            scientific_analysis={
                "text_available": bool(
                    content.strip()
                ),

                "scientific_content_candidate": (
                    self._looks_like_scientific_content(
                        content
                    )
                ),
            },
        )

    # ======================================================
    # LECTURE
    # ======================================================

    @staticmethod
    def _read_rtf(
        path: Path,
    ) -> str:
        """
        Lit le fichier RTF avec plusieurs encodages
        de secours.

        UTF-8 est essayé en premier, puis les encodages
        couramment rencontrés dans les anciens documents
        RTF.
        """

        encodings = (
            "utf-8",
            "utf-8-sig",
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

        # Dernier recours : lecture tolérante.
        try:

            return path.read_text(
                encoding="latin-1",
                errors="replace",
            )

        except Exception as exc:

            if last_error is not None:
                raise ValueError(
                    f"Impossible de lire le fichier RTF "
                    f"{path.name}."
                ) from last_error

            raise ValueError(
                f"Impossible de lire le fichier RTF "
                f"{path.name}."
            ) from exc

    # ======================================================
    # PARAGRAPHES
    # ======================================================

    @staticmethod
    def _extract_paragraphs(
        content: str,
    ) -> list[str]:
        """
        Transforme le texte importé en paragraphes simples.
        """

        if not content:
            return []

        paragraphs = []

        for paragraph in content.splitlines():

            paragraph = paragraph.strip()

            if paragraph:
                paragraphs.append(
                    paragraph
                )

        return paragraphs

    # ======================================================
    # STATISTIQUES
    # ======================================================

    @classmethod
    def _build_statistics(
        cls,
        raw_content: str,
        content: str,
    ) -> dict[str, Any]:
        """
        Calcule les statistiques du document RTF.
        """

        paragraphs = cls._extract_paragraphs(
            content
        )

        return {
            "raw_characters": len(
                raw_content
            ),

            "characters": len(
                content
            ),

            "words": cls.count_words(
                content
            ),

            "lines": cls.count_lines(
                content
            ),

            "paragraphs": len(
                paragraphs
            ),

            "has_content": bool(
                content.strip()
            ),
        }

    # ======================================================
    # ANALYSE SCIENTIFIQUE
    # ======================================================

    @staticmethod
    def _looks_like_scientific_content(
        text: str,
    ) -> bool:
        """
        Détection heuristique préliminaire de contenu
        scientifique.

        Cette méthode ne remplace pas le moteur scientifique
        de MACEVO.
        """

        if not text:
            return False

        indicators = (
            "méthodologie",
            "methodology",
            "résultats",
            "results",
            "discussion",
            "conclusion",
            "références",
            "references",
            "bibliographie",
            "équation",
            "equation",
            "figure",
            "tableau",
            "théorème",
            "theorem",
            "hypothèse",
            "hypothesis",
            "expérience",
            "experiment",
            "analyse",
            "analysis",
            "abstract",
            "résumé",
        )

        lowered = text.lower()

        return any(
            indicator in lowered
            for indicator in indicators
        )

    # ======================================================
    # INFORMATIONS
    # ======================================================

    @classmethod
    def info(cls):
        """
        Informations publiques sur l'importeur.
        """

        data = super().info()

        data.update(
            {
                "description": (
                    "Importeur RTF professionnel "
                    "pour MACEVO."
                ),

                "text_extraction": True,

                "raw_source_preservation": True,

                "encoding_fallback": True,

                "statistics": True,

                "scientific_analysis": True,

                "document_ir_ready": True,
            }
        )

        return data
