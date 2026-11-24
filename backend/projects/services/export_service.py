
"""
==========================================================
MACEVO IA
Export Service
==========================================================

Service central des exportations.

Architecture :

    Project
       ↓
    Document Structure / IR
       ↓
    ExportService
       ↓
    PDF / DOCX / LaTeX / HTML

Toutes les exportations de documents passent par cette
classe.

Auteur : MACEVO
"""

from __future__ import annotations

import logging
import os
import tempfile
import uuid
import zipfile
from pathlib import Path
from typing import Any, Dict, Optional


logger = logging.getLogger(__name__)


class ExportService:
    """
    Façade centrale des exportations MACEVO.

    Le service accepte soit un projet, soit une structure
    documentaire déjà construite.

    Les exporteurs spécialisés restent responsables du rendu
    de leur format.
    """

    # =========================================================
    # OUTILS INTERNES
    # =========================================================

    @staticmethod
    def _ensure_directory(directory: str | os.PathLike) -> Path:
        """
        Crée le dossier de destination s'il n'existe pas.
        """

        path = Path(directory)

        path.mkdir(
            parents=True,
            exist_ok=True,
        )

        return path

    @staticmethod
    def _project_slug(project: Any) -> str:
        """
        Retourne un slug exploitable pour les noms de fichiers.
        """

        if project is None:
            return "document"

        slug = getattr(project, "slug", None)

        if slug:
            return str(slug)

        title = getattr(project, "title", None)

        if title:
            value = str(title).strip().lower()

            value = "".join(
                char if char.isalnum() else "-"
                for char in value
            )

            value = "-".join(
                part
                for part in value.split("-")
                if part
            )

            if value:
                return value

        project_id = getattr(project, "id", None)

        if project_id:
            return f"project-{project_id}"

        return "document"

    @staticmethod
    def _build_structure(
        project: Any = None,
        structure: Any = None,
    ) -> Any:
        """
        Construit ou récupère la structure documentaire.

        Priorité :
        1. structure explicitement fournie ;
        2. structure déjà présente sur le projet ;
        3. DocumentBuilder.from_project().

        Cette méthode reste volontairement tolérante afin de
        conserver la compatibilité avec les différentes versions
        du modèle de projet MACEVO.
        """

        if structure is not None:
            return structure

        if project is None:
            raise ValueError(
                "project ou structure doit être fourni."
            )

        # Une structure peut déjà être attachée au projet.
        for attribute in (
            "document_structure",
            "structure",
            "document",
        ):
            value = getattr(project, attribute, None)

            if value is not None:
                return value

        # Construction via DocumentBuilder.
        try:
            from projects.services.export.document_builder import (
                DocumentBuilder,
            )
        except ImportError:
            DocumentBuilder = None

        if DocumentBuilder is not None:
            # L'API actuelle est un builder d'instance qui reçoit
            # le projet au constructeur. Garder le chemin de classe
            # pour d'anciens adaptateurs qui exposent from_project.
            if hasattr(DocumentBuilder, "from_project"):
                return DocumentBuilder.from_project(project)

            try:
                builder = DocumentBuilder(project)
            except TypeError:
                builder = None

            if builder is not None and hasattr(builder, "build"):
                return builder.build()

            # Compatibilité avec les builders historiques statiques.
            if hasattr(DocumentBuilder, "build"):
                return DocumentBuilder.build(project)

        raise ValueError(
            "Impossible de construire la structure documentaire "
            "à partir du projet."
        )

    @staticmethod
    def _get_exporter(
        exporter_class: Any,
        structure: Any,
    ) -> Any:
        """
        Instancie un exporteur avec sa structure documentaire.

        Une compatibilité avec les exporteurs plus anciens est
        conservée lorsque leur constructeur n'accepte aucun
        argument.
        """

        try:
            return exporter_class(structure)
        except TypeError:
            return exporter_class()

    @staticmethod
    def _export(
        exporter_class: Any,
        project: Any,
        output_path: str | os.PathLike,
        structure: Any = None,
    ) -> Any:
        """
        Exécute un export avec l'exporteur spécialisé.
        """

        output = Path(output_path)

        output.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        document_structure = ExportService._build_structure(
            project=project,
            structure=structure,
        )

        exporter = ExportService._get_exporter(
            exporter_class,
            document_structure,
        )

        # API moderne :
        # exporter.export(output_path)
        try:
            return exporter.export(str(output))
        except TypeError:
            # Compatibilité ancienne :
            # exporter.export(project, output_path)
            return exporter.export(
                project,
                str(output),
            )

    # =========================================================
    # PDF
    # =========================================================

    @staticmethod
    def export_pdf(
        project: Any = None,
        output_path: Optional[str | os.PathLike] = None,
        structure: Any = None,
    ) -> Any:
        """
        Exporte un projet au format PDF.
        """

        if output_path is None:
            raise ValueError(
                "output_path est obligatoire."
            )

        from projects.services.export.pdf_exporter import (
            PDFExporter,
        )

        return ExportService._export(
            exporter_class=PDFExporter,
            project=project,
            output_path=output_path,
            structure=structure,
        )

    # =========================================================
    # WORD / DOCX
    # =========================================================

    @staticmethod
    def export_word(
        project: Any = None,
        output_path: Optional[str | os.PathLike] = None,
        structure: Any = None,
    ) -> Any:
        """
        Exporte un projet au format Microsoft Word DOCX.
        """

        if output_path is None:
            raise ValueError(
                "output_path est obligatoire."
            )

        from projects.services.export.word_exporter import (
            WordExporter,
        )

        return ExportService._export(
            exporter_class=WordExporter,
            project=project,
            output_path=output_path,
            structure=structure,
        )

    # Alias explicite DOCX.
    export_docx = export_word

    # =========================================================
    # LATEX
    # =========================================================

    @staticmethod
    def export_latex(
        project: Any = None,
        output_path: Optional[str | os.PathLike] = None,
        structure: Any = None,
    ) -> Any:
        """
        Exporte un projet au format LaTeX.
        """

        if output_path is None:
            raise ValueError(
                "output_path est obligatoire."
            )

        from projects.services.export.latex_exporter import (
            LatexExporter,
        )

        return ExportService._export(
            exporter_class=LatexExporter,
            project=project,
            output_path=output_path,
            structure=structure,
        )

    # =========================================================
    # HTML
    # =========================================================

    @staticmethod
    def export_html(
        project: Any = None,
        output_path: Optional[str | os.PathLike] = None,
        structure: Any = None,
    ) -> Any:
        """
        Exporte un projet au format HTML.
        """

        if output_path is None:
            raise ValueError(
                "output_path est obligatoire."
            )

        from projects.services.export.html_exporter import (
            HtmlExporter,
        )

        return ExportService._export(
            exporter_class=HtmlExporter,
            project=project,
            output_path=output_path,
            structure=structure,
        )

    @staticmethod
    def export_zip(
        project: Any = None,
        output_path: Optional[str | os.PathLike] = None,
        structure: Any = None,
    ) -> Any:
        """Crée une archive portable des sources et du PDF d'aperçu."""
        if output_path is None:
            raise ValueError("output_path est obligatoire.")
        if project is None:
            raise ValueError("project est obligatoire pour créer une archive.")

        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)
        document = ExportService._build_structure(
            project=project,
            structure=structure,
        )
        archive_temp = output.with_name(
            f".{output.name}.{uuid.uuid4().hex}.tmp"
        )

        try:
            with tempfile.TemporaryDirectory(
                prefix="macevo-project-export-",
                dir=output.parent,
            ) as working_directory:
                work = Path(working_directory)
                tex_file = Path(
                    ExportService.export_latex(
                        project=project,
                        output_path=work / "main.tex",
                        structure=document,
                    )
                )
                pdf_file = Path(
                    ExportService.export_pdf(
                        project=project,
                        output_path=work / "preview.pdf",
                        structure=document,
                    )
                )

                source = tex_file.read_text(encoding="utf-8")
                resource_files: list[tuple[str, bytes]] = []
                related_figures = getattr(project, "figures", None)
                if related_figures is not None:
                    for index, figure in enumerate(related_figures.all(), start=1):
                        image = getattr(figure, "image", None)
                        if not image or not getattr(image, "name", ""):
                            continue
                        suffix = Path(image.name).suffix.lower()
                        if suffix not in {".png", ".jpg", ".jpeg", ".pdf"}:
                            continue
                        archive_name = f"figures/figure-{index:02d}{suffix}"
                        try:
                            candidates: list[tuple[str, bool]] = [
                                (str(image.name), True)
                            ]
                            try:
                                candidates.append((str(image.path), False))
                            except (AttributeError, NotImplementedError, ValueError):
                                pass
                            with image.open("rb") as image_stream:
                                content = image_stream.read()
                        except OSError as exc:
                            raise ValueError(
                                f"Impossible de lire la figure {index} du projet."
                            ) from exc
                        for candidate, relative in candidates:
                            normalized = candidate.replace("\\", "/")
                            if relative:
                                source = source.replace(
                                    "{" + normalized + "}",
                                    "{" + archive_name + "}",
                                )
                            else:
                                source = source.replace(normalized, archive_name)
                        resource_files.append((archive_name, content))

                tex_file.write_text(source, encoding="utf-8", newline="\n")
                readme = (
                    f"# {getattr(project, 'title', 'Projet scientifique')}\n\n"
                    "Cette archive contient le source LaTeX (`main.tex`), "
                    "les ressources graphiques disponibles dans `figures/` "
                    "et un PDF d’aperçu (`preview.pdf`).\n\n"
                    "Le PDF d’aperçu est rendu par le moteur PDF de MACEVO ; "
                    "il n’est pas présenté comme une compilation de `main.tex`. "
                    "Pour compiler le source, ouvrez `main.tex` dans une "
                    "distribution LaTeX ou dans Overleaf. La bibliographie "
                    "exportée est incluse directement dans le source.\n"
                )
                with zipfile.ZipFile(
                    archive_temp,
                    mode="w",
                    compression=zipfile.ZIP_DEFLATED,
                ) as archive:
                    archive.write(tex_file, "main.tex")
                    archive.write(pdf_file, "preview.pdf")
                    archive.writestr("README.md", readme)
                    for archive_name, content in resource_files:
                        archive.writestr(archive_name, content)

            os.replace(archive_temp, output)
            return str(output)
        finally:
            try:
                archive_temp.unlink(missing_ok=True)
            except OSError:
                logger.warning("Impossible de nettoyer le ZIP temporaire d'export.")

    # =========================================================
    # EXPORT GÉNÉRIQUE
    # =========================================================

    @classmethod
    def export(
        cls,
        project: Any,
        output_path: str | os.PathLike,
        format: str,
        structure: Any = None,
    ) -> Any:
        """
        Export générique.

        Formats supportés :

            pdf
            word
            docx
            latex
            tex
            html
            htm
        """

        normalized_format = str(format).strip().lower()

        exporters = {
            "pdf": cls.export_pdf,
            "word": cls.export_word,
            "docx": cls.export_word,
            "latex": cls.export_latex,
            "tex": cls.export_latex,
            "html": cls.export_html,
            "htm": cls.export_html,
            "zip": cls.export_zip,
        }

        exporter = exporters.get(normalized_format)

        if exporter is None:
            raise ValueError(
                f"Format d'export non supporté : "
                f"{format}. "
                f"Formats disponibles : "
                f"{', '.join(exporters.keys())}"
            )

        return exporter(
            project=project,
            output_path=output_path,
            structure=structure,
        )

    # =========================================================
    # TOUS LES FORMATS
    # =========================================================

    @classmethod
    def export_all(
        cls,
        project: Any,
        directory: str | os.PathLike,
        structure: Any = None,
    ) -> Dict[str, Any]:
        """
        Exporte le document dans tous les formats actuellement
        disponibles.

        Retourne un dictionnaire contenant le résultat de chaque
        export.
        """

        destination = cls._ensure_directory(
            directory
        )

        slug = cls._project_slug(project)

        results: Dict[str, Any] = {}

        # Construire une seule fois la structure documentaire.
        document_structure = cls._build_structure(
            project=project,
            structure=structure,
        )

        results["pdf"] = cls.export_pdf(
            project=project,
            output_path=destination / f"{slug}.pdf",
            structure=document_structure,
        )

        results["word"] = cls.export_word(
            project=project,
            output_path=destination / f"{slug}.docx",
            structure=document_structure,
        )

        results["latex"] = cls.export_latex(
            project=project,
            output_path=destination / f"{slug}.tex",
            structure=document_structure,
        )

        results["html"] = cls.export_html(
            project=project,
            output_path=destination / f"{slug}.html",
            structure=document_structure,
        )

        results["zip"] = cls.export_zip(
            project=project,
            output_path=destination / f"{slug}.zip",
            structure=document_structure,
        )

        return results

    # =========================================================
    # INFORMATIONS
    # =========================================================

    @staticmethod
    def supported_formats() -> tuple[str, ...]:
        """
        Retourne les formats actuellement supportés.
        """

        return (
            "pdf",
            "docx",
            "word",
            "latex",
            "tex",
            "html",
            "zip",
        )

    @staticmethod
    def info() -> Dict[str, Any]:
        """
        Informations sur le service d'exportation.
        """

        return {
            "service": "ExportService",
            "version": "2.0.0",
            "formats": list(
                ExportService.supported_formats()
            ),
            "architecture": (
                "Project -> Document Structure -> Exporter"
            ),
            "capabilities": [
                "export_pdf",
                "export_word",
                "export_docx",
                "export_latex",
                "export_html",
                "export_zip",
                "export_all",
            ],
            "extensible": True,
        }
