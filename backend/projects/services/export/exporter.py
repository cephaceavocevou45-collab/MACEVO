
"""
==========================================================
MACEVO IA
Unified Exporter Facade
==========================================================
Façade centralisée pour l'export de documents scientifiques
dans tous les formats supportés par MACEVO.

Formats :
- PDF
- DOCX / Word
- LaTeX
- HTML

Le projet source peut être :
- un objet métier quelconque compatible avec DocumentBuilder ;
- ou directement un DocumentStructure.
"""

from __future__ import annotations

import logging
from typing import Any

from .document_builder import DocumentBuilder
from .document_structure import DocumentStructure
from .pdf_exporter import PdfExporter
from .word_exporter import WordExporter
from .html_exporter import HtmlExporter
from .latex_exporter import LatexExporter


logger = logging.getLogger(__name__)


class Exporter:
    """
    Façade unifiée pour la génération de documents scientifiques.

    Cette classe centralise la sélection de l'exportateur et évite
    que les couches supérieures de MACEVO aient à connaître les
    implémentations PDF/DOCX/LaTeX/HTML.
    """

    SUPPORTED_FORMATS = frozenset(
        {
            "pdf",
            "docx",
            "latex",
            "html",
        }
    )

    FORMAT_ALIASES = {
        "word": "docx",
        "doc": "docx",
        "tex": "latex",
        "htm": "html",
    }

    EXPORTERS = {
        "pdf": PdfExporter,
        "docx": WordExporter,
        "latex": LatexExporter,
        "html": HtmlExporter,
    }

    @classmethod
    def normalize_format(cls, format: str) -> str:
        """
        Normalise le nom du format demandé.

        Exemples :
            WORD  -> docx
            .docx -> docx
            TEX   -> latex
        """
        if format is None:
            raise ValueError("Le format d'export est obligatoire.")

        fmt = str(format).strip().lower()

        if fmt.startswith("."):
            fmt = fmt[1:]

        fmt = cls.FORMAT_ALIASES.get(fmt, fmt)

        if fmt not in cls.SUPPORTED_FORMATS:
            accepted = ", ".join(sorted(cls.SUPPORTED_FORMATS))
            raise ValueError(
                f"Format d'export non supporté : '{format}'. "
                f"Formats acceptés : {accepted}"
            )

        return fmt

    @classmethod
    def build_document(cls, project: Any) -> DocumentStructure:
        """
        Transforme la source en DocumentStructure.

        Si la source est déjà un DocumentStructure, aucune
        reconstruction n'est effectuée.
        """
        if isinstance(project, DocumentStructure):
            return project

        if project is None:
            raise ValueError(
                "Impossible d'exporter un projet vide."
            )

        document = DocumentBuilder(project).build()

        if not isinstance(document, DocumentStructure):
            raise TypeError(
                "DocumentBuilder.build() doit retourner "
                "un DocumentStructure."
            )

        return document

    @classmethod
    def get_exporter_class(cls, format: str) -> type:
        """
        Retourne la classe d'export correspondante au format.
        """
        fmt = cls.normalize_format(format)

        exporter_class = cls.EXPORTERS.get(fmt)

        if exporter_class is None:
            raise ValueError(
                f"Aucun exportateur configuré pour le format : {fmt}"
            )

        return exporter_class

    @classmethod
    def export(cls, project: Any, format: str) -> Any:
        """
        Exporte un projet ou un DocumentStructure.

        Parameters
        ----------
        project:
            Projet source ou DocumentStructure déjà construit.

        format:
            Format cible :
            pdf, docx, latex ou html.

        Returns
        -------
        Any
            Résultat retourné par l'exportateur spécialisé.
        """
        fmt = cls.normalize_format(format)
        document = cls.build_document(project)
        exporter_class = cls.get_exporter_class(fmt)

        logger.info(
            "Export MACEVO : format=%s, chapters=%s, sections=%s",
            fmt,
            document.chapter_count,
            document.section_count,
        )

        try:
            exporter = exporter_class(document)
            result = exporter.export()

            logger.info(
                "Export MACEVO terminé : format=%s",
                fmt,
            )

            return result

        except Exception:
            logger.exception(
                "Échec de l'export MACEVO : format=%s",
                fmt,
            )
            raise

    @classmethod
    def export_pdf(cls, project: Any) -> Any:
        """Exporte le document au format PDF."""
        return cls.export(project, "pdf")

    @classmethod
    def export_docx(cls, project: Any) -> Any:
        """Exporte le document au format DOCX/Word."""
        return cls.export(project, "docx")

    @classmethod
    def export_word(cls, project: Any) -> Any:
        """Alias pratique pour l'export Word."""
        return cls.export_docx(project)

    @classmethod
    def export_latex(cls, project: Any) -> Any:
        """Exporte le document au format LaTeX."""
        return cls.export(project, "latex")

    @classmethod
    def export_html(cls, project: Any) -> Any:
        """Exporte le document au format HTML."""
        return cls.export(project, "html")

    @classmethod
    def available_formats(cls) -> list[str]:
        """
        Retourne les formats officiellement supportés.
        """
        return sorted(cls.SUPPORTED_FORMATS)

    @classmethod
    def info(cls) -> dict[str, Any]:
        """
        Retourne les informations sur le moteur d'export.
        """
        return {
            "name": "MACEVO Unified Exporter",
            "version": "2.0.0",
            "formats": cls.available_formats(),
            "aliases": dict(cls.FORMAT_ALIASES),
            "exporters": {
                fmt: exporter.__name__
                for fmt, exporter in cls.EXPORTERS.items()
            },
        }


def load_project(name: str) -> dict[str, Any]:
    """
    Petit helper de compatibilité pour les tests ou exemples.

    Il ne remplace pas le véritable chargement d'un projet
    depuis la base de données ou le service de projet.
    """
    title = str(name).strip() if name is not None else ""

    if not title:
        title = "Document sans titre"

    return {
        "title": title,
        "subject": "Document généré automatiquement",
    }
