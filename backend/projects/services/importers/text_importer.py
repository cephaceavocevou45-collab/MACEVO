
"""
==========================================================
MACEVO IA
Text Importer
==========================================================

Importeur professionnel de fichiers texte pour MACEVO.

Objectifs :
- importer les fichiers .txt ;
- gérer plusieurs encodages ;
- normaliser le contenu ;
- conserver le texte source ;
- extraire les lignes et paragraphes ;
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

from .base_importer import BaseImporter


class TextImporter(BaseImporter):
    """
    Importeur professionnel de fichiers texte.
    """

    supported_extensions = (
        ".txt",
    )

    importer_name = "text"

    # ======================================================
    # IMPORT PRINCIPAL
    # ======================================================

    def import_document(
        self,
        file_path,
    ):
        """
        Importe un fichier texte.

        Parameters
        ----------
        file_path : str | Path
            Chemin vers le fichier .txt.

        Returns
        -------
        dict
            Résultat normalisé MACEVO.
        """

        if not file_path:
            raise ValueError(
                "Le chemin du fichier texte "
                "est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier texte introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension texte non supportée : "
                f"{path.suffix}"
            )

        # --------------------------------------------------
        # LECTURE
        # --------------------------------------------------

        raw_content, encoding = self._read_text(
            path
        )

        # --------------------------------------------------
        # NORMALISATION
        # --------------------------------------------------

        content = self.normalize_content(
            raw_content
        )

        # --------------------------------------------------
        # PARAGRAPHES
        # --------------------------------------------------

        paragraphs = self._extract_paragraphs(
            content
        )

        # --------------------------------------------------
        # LIGNES
        # --------------------------------------------------

        lines = self._extract_lines(
            content
        )

        # --------------------------------------------------
        # STATISTIQUES
        # --------------------------------------------------

        statistics = self._build_statistics(
            raw_content,
            content,
            paragraphs,
            lines,
        )

        # --------------------------------------------------
        # STRUCTURE
        # --------------------------------------------------

        structure = {
            "paragraphs": paragraphs,

            "paragraph_count": len(
                paragraphs
            ),

            "lines": lines,

            "line_count": len(
                lines
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
                "format": "txt",

                "source_file": path.name,

                "source_extension": path.suffix.lower(),

                "encoding": encoding,

                "statistics": statistics,
            },

            source_path=path,

            source_format="txt",

            raw_content=raw_content,

            encoding=encoding,

            structure=structure,

            paragraphs=paragraphs,

            lines=lines,

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
    def _read_text(
        path: Path,
    ) -> tuple[str, str]:
        """
        Lit le fichier avec plusieurs encodages.

        Ordre :
        1. UTF-8 avec BOM
        2. UTF-8
        3. Windows-1252
        4. Latin-1
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

                return (
                    path.read_text(
                        encoding=encoding
                    ),
                    encoding,
                )

            except UnicodeDecodeError as exc:
                last_error = exc

        # --------------------------------------------------
        # Dernier recours
        # --------------------------------------------------

        try:

            content = path.read_text(
                encoding="utf-8",
                errors="replace",
            )

            return (
                content,
                "utf-8-replace",
            )

        except Exception as exc:

            raise ValueError(
                f"Impossible de lire le fichier "
                f"{path.name}."
            ) from (
                last_error
                or exc
            )

    # ======================================================
    # PARAGRAPHES
    # ======================================================

    @staticmethod
    def _extract_paragraphs(
        content: str,
    ) -> list[str]:
        """
        Extrait les paragraphes du fichier texte.

        Deux lignes vides ou une séparation équivalente
        sont interprétées comme une séparation de paragraphes.
        """

        if not content:
            return []

        normalized = (
            content
            .replace("\r\n", "\n")
            .replace("\r", "\n")
        )

        paragraphs = []

        for block in normalized.split(
            "\n\n"
        ):

            block = " ".join(
                line.strip()
                for line in block.splitlines()
                if line.strip()
            ).strip()

            if block:
                paragraphs.append(
                    block
                )

        return paragraphs

    # ======================================================
    # LIGNES
    # ======================================================

    @staticmethod
    def _extract_lines(
        content: str,
    ) -> list[str]:
        """
        Extrait les lignes non vides.
        """

        if not content:
            return []

        lines = []

        for line in content.splitlines():

            line = line.strip()

            if line:
                lines.append(
                    line
                )

        return lines

    # ======================================================
    # STATISTIQUES
    # ======================================================

    @classmethod
    def _build_statistics(
        cls,
        raw_content: str,
        content: str,
        paragraphs: list[str],
        lines: list[str],
    ) -> dict[str, Any]:
        """
        Calcule les statistiques du fichier texte.
        """

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

            "lines": len(
                lines
            ),

            "paragraphs": len(
                paragraphs
            ),

            "empty_lines": sum(
                1
                for line in content.splitlines()
                if not line.strip()
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
            "introduction",
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
                    "Importeur de fichiers texte "
                    "professionnel pour MACEVO."
                ),

                "text_extraction": True,

                "raw_source_preservation": True,

                "encoding_fallback": True,

                "paragraph_extraction": True,

                "statistics": True,

                "scientific_analysis": True,

                "document_ir_ready": True,
            }
        )

        return data
