"""
MACEVO — Exporteur ZIP scientifique.

Construit un paquet scientifique reproductible contenant les artefacts
produits par MACEVO :

package/
├── document.pdf
├── document.tex
├── references.bib
├── metadata.json
├── README.txt
├── bibliography/
├── figures/
├── tables/
└── annexes/

Le composant reste extensible afin d'accueillir les ressources
scientifiques produites ou importées par MACEVO.
"""

from __future__ import annotations

import json
import shutil
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Iterable, Optional

from core.document.ir import Document
from core.exporters.pdf import PDFExporter


@dataclass
class ZIPExportResult:
    """Résultat structuré d'un export ZIP MACEVO."""

    success: bool

    zip_file: Optional[str] = None
    package_dir: Optional[str] = None

    pdf_file: Optional[str] = None
    tex_file: Optional[str] = None
    bib_file: Optional[str] = None

    files: list[str] = field(default_factory=list)

    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def failed(self) -> bool:
        return not self.success

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "zip_file": self.zip_file,
            "package_dir": self.package_dir,
            "pdf_file": self.pdf_file,
            "tex_file": self.tex_file,
            "bib_file": self.bib_file,
            "files": self.files,
            "errors": self.errors,
            "warnings": self.warnings,
            "metadata": self.metadata,
        }


class ZIPExporter:
    """
    Exporteur de paquet scientifique MACEVO.

    Pipeline :

        Document IR
            ↓
        PDFExporter
            ↓
        PDF + TEX + BIB
            ↓
        Organisation scientifique
            ↓
        metadata.json + README.txt
            ↓
        ZIP
            ↓
        Vérification de l'archive
    """

    VERSION = "1.1.0"

    DEFAULT_DIRECTORIES = (
        "figures",
        "tables",
        "bibliography",
        "annexes",
    )

    def __init__(
        self,
        *,
        pdf_exporter: Optional[PDFExporter] = None,
        compression: int = zipfile.ZIP_DEFLATED,
        keep_package_dir: bool = True,
    ):
        self.pdf_exporter = (
            pdf_exporter
            or PDFExporter(
                keep_tex=True,
            )
        )

        self.compression = compression
        self.keep_package_dir = bool(keep_package_dir)

    # ======================================================================
    # EXPORT PRINCIPAL
    # ======================================================================

    def export(
        self,
        document: Document,
        *,
        output_dir: str | Path,
        filename: str = "macevo_document.zip",
        pdf_filename: str = "document.pdf",
        tex_filename: Optional[str] = None,
        extra_files: Optional[Iterable[str | Path]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ZIPExportResult:
        """
        Génère un paquet ZIP scientifique complet.

        Parameters
        ----------
        document:
            Document IR MACEVO.

        output_dir:
            Répertoire final de sortie.

        filename:
            Nom de l'archive ZIP.

        pdf_filename:
            Nom du PDF dans le paquet.

        tex_filename:
            Nom du fichier LaTeX dans le paquet.

        extra_files:
            Fichiers supplémentaires à intégrer.

        metadata:
            Métadonnées supplémentaires.
        """

        # ------------------------------------------------------------------
        # 1. Validation
        # ------------------------------------------------------------------

        if document is None:
            return ZIPExportResult(
                success=False,
                errors=[
                    "Le document fourni est vide."
                ],
            )

        if not isinstance(document, Document):
            return ZIPExportResult(
                success=False,
                errors=[
                    "Le document fourni doit être une instance de Document."
                ],
            )

        # ------------------------------------------------------------------
        # 2. Répertoire de sortie
        # ------------------------------------------------------------------

        output_path = Path(output_dir).resolve()

        try:
            output_path.mkdir(
                parents=True,
                exist_ok=True,
            )
        except OSError as exc:
            return ZIPExportResult(
                success=False,
                errors=[
                    f"Impossible de créer le répertoire de sortie : {exc}"
                ],
            )

        # ------------------------------------------------------------------
        # 3. Nom du ZIP
        # ------------------------------------------------------------------

        filename = self._normalize_filename(filename)

        zip_path = output_path / filename

        # ------------------------------------------------------------------
        # 4. Répertoire temporaire du paquet
        # ------------------------------------------------------------------

        package_name = zip_path.stem

        package_dir = (
            output_path
            / package_name
        )

        if package_dir.exists():
            try:
                shutil.rmtree(package_dir)
            except OSError as exc:
                return ZIPExportResult(
                    success=False,
                    errors=[
                        "Impossible de nettoyer l'ancien paquet : "
                        f"{exc}"
                    ],
                )

        try:
            package_dir.mkdir(
                parents=True,
                exist_ok=True,
            )

            for directory in self.DEFAULT_DIRECTORIES:
                (
                    package_dir
                    / directory
                ).mkdir(
                    parents=True,
                    exist_ok=True,
                )

        except OSError as exc:
            return ZIPExportResult(
                success=False,
                errors=[
                    "Impossible de créer la structure du paquet : "
                    f"{exc}"
                ],
            )

        warnings: list[str] = []

        # ==================================================================
        # 5. GÉNÉRATION PDF + LATEX + BIBTEX
        # ==================================================================

        pdf_result = self.pdf_exporter.export(
            document,
            output_dir=package_dir,
            filename=self._safe_filename(
                pdf_filename
            ),
        )

        warnings.extend(
            list(
                getattr(
                    pdf_result,
                    "warnings",
                    [],
                )
                or []
            )
        )

        if not pdf_result.success:
            self._cleanup_package(package_dir)

            return ZIPExportResult(
                success=False,
                errors=list(
                    getattr(
                        pdf_result,
                        "errors",
                        [],
                    )
                    or []
                ),
                warnings=self._unique(warnings),
                metadata={
                    "exporter_version": self.VERSION,
                    "stage": "pdf_generation",
                },
            )

        # ------------------------------------------------------------------
        # Artefacts produits par PDFExporter
        # ------------------------------------------------------------------

        generated_pdf = (
            Path(
                pdf_result.pdf_file
            ).resolve()
            if pdf_result.pdf_file
            else None
        )

        generated_tex = (
            Path(
                pdf_result.tex_file
            ).resolve()
            if pdf_result.tex_file
            else None
        )

        generated_bib = (
            Path(
                pdf_result.bib_file
            ).resolve()
            if getattr(
                pdf_result,
                "bib_file",
                None,
            )
            else None
        )

        # ------------------------------------------------------------------
        # Vérification du PDF
        # ------------------------------------------------------------------

        if (
            generated_pdf is None
            or not generated_pdf.exists()
        ):
            self._cleanup_package(package_dir)

            return ZIPExportResult(
                success=False,
                errors=[
                    "Le PDF annoncé par PDFExporter est introuvable."
                ],
                warnings=self._unique(warnings),
                metadata={
                    "exporter_version": self.VERSION,
                    "stage": "pdf_verification",
                },
            )

        # ==================================================================
        # 6. PLACEMENT DU PDF
        # ==================================================================

        final_pdf = self._move_into_package(
            source=generated_pdf,
            target=(
                package_dir
                / self._safe_filename(
                    pdf_filename
                )
            ),
            warnings=warnings,
            label="PDF",
        )

        # ==================================================================
        # 7. PLACEMENT DU LATEX
        # ==================================================================

        final_tex: Optional[Path] = None

        if (
            generated_tex is not None
            and generated_tex.exists()
        ):
            target_tex_name = self._safe_filename(
                tex_filename
                or generated_tex.name
            )

            final_tex = self._move_into_package(
                source=generated_tex,
                target=(
                    package_dir
                    / target_tex_name
                ),
                warnings=warnings,
                label="LaTeX",
            )

        # ==================================================================
        # 8. PLACEMENT DU BIBTEX
        # ==================================================================

        final_bib: Optional[Path] = None

        if (
            generated_bib is not None
            and generated_bib.exists()
        ):
            #
            # IMPORTANT :
            #
            # Le fichier BibTeX principal reste à la racine du paquet.
            #
            # Cela garantit que :
            #
            #     \addbibresource{references.bib}
            #
            # continue de fonctionner directement depuis le fichier .tex.
            #
            final_bib = self._move_into_package(
                source=generated_bib,
                target=(
                    package_dir
                    / generated_bib.name
                ),
                warnings=warnings,
                label="BibTeX",
            )

            # Copie organisationnelle dans bibliography/
            bibliography_copy = (
                package_dir
                / "bibliography"
                / generated_bib.name
            )

            try:
                if (
                    final_bib.exists()
                    and bibliography_copy.resolve()
                    != final_bib.resolve()
                ):
                    shutil.copy2(
                        final_bib,
                        bibliography_copy,
                    )
            except OSError as exc:
                warnings.append(
                    "Impossible de créer la copie du fichier BibTeX "
                    f"dans bibliography/ : {exc}"
                )

        elif document.references:
            warnings.append(
                "Le document contient des références, mais PDFExporter "
                "n'a pas produit de fichier BibTeX."
            )

        # ==================================================================
        # 9. MÉTADONNÉES
        # ==================================================================

        metadata_payload = self._build_metadata(
            document=document,
            pdf_result=pdf_result,
            final_pdf=final_pdf,
            final_tex=final_tex,
            final_bib=final_bib,
            extra_metadata=metadata,
        )

        metadata_file = (
            package_dir
            / "metadata.json"
        )

        try:
            metadata_file.write_text(
                json.dumps(
                    metadata_payload,
                    ensure_ascii=False,
                    indent=2,
                    default=str,
                ),
                encoding="utf-8",
            )
        except OSError as exc:
            warnings.append(
                "Impossible d'écrire metadata.json : "
                f"{exc}"
            )

        # ==================================================================
        # 10. README
        # ==================================================================

        readme_file = (
            package_dir
            / "README.txt"
        )

        try:
            readme_file.write_text(
                self._build_readme(
                    document=document,
                    final_pdf=final_pdf,
                    final_tex=final_tex,
                    final_bib=final_bib,
                ),
                encoding="utf-8",
            )
        except OSError as exc:
            warnings.append(
                "Impossible d'écrire README.txt : "
                f"{exc}"
            )

        # ==================================================================
        # 11. FICHIERS SUPPLÉMENTAIRES
        # ==================================================================

        if extra_files:
            self._copy_extra_files(
                extra_files=extra_files,
                package_dir=package_dir,
                warnings=warnings,
            )

        # ==================================================================
        # 12. COLLECTE DES FICHIERS
        # ==================================================================

        files = self._collect_files(
            package_dir
        )

        # ------------------------------------------------------------------
        # Artefacts obligatoires
        # ------------------------------------------------------------------

        required = {
            "metadata.json",
            "README.txt",
        }

        if final_pdf:
            required.add(
                final_pdf.name
            )

        if final_tex:
            required.add(
                final_tex.name
            )

        if final_bib:
            required.add(
                final_bib.name
            )

        missing = sorted(
            item
            for item in required
            if item not in files
        )

        if missing:
            return self._failure(
                package_dir=package_dir,
                zip_path=zip_path,
                pdf_file=final_pdf,
                tex_file=final_tex,
                bib_file=final_bib,
                files=files,
                warnings=warnings,
                errors=[
                    "Artefacts attendus absents du paquet : "
                    + ", ".join(missing)
                ],
                stage="package_validation",
            )

        # ==================================================================
        # 13. CRÉATION DU ZIP
        # ==================================================================

        try:
            if zip_path.exists():
                zip_path.unlink()

            self._create_zip(
                package_dir=package_dir,
                zip_path=zip_path,
            )

        except (
            OSError,
            zipfile.BadZipFile,
        ) as exc:
            return self._failure(
                package_dir=package_dir,
                zip_path=zip_path,
                pdf_file=final_pdf,
                tex_file=final_tex,
                bib_file=final_bib,
                files=files,
                warnings=warnings,
                errors=[
                    "La création du ZIP a échoué : "
                    f"{exc}"
                ],
                stage="zip_creation",
            )

        # ==================================================================
        # 14. VÉRIFICATION DU ZIP
        # ==================================================================

        if not zip_path.exists():
            return self._failure(
                package_dir=package_dir,
                zip_path=zip_path,
                pdf_file=final_pdf,
                tex_file=final_tex,
                bib_file=final_bib,
                files=files,
                warnings=warnings,
                errors=[
                    "Le fichier ZIP n'a pas été créé."
                ],
                stage="zip_verification",
            )

        try:
            with zipfile.ZipFile(
                zip_path,
                mode="r",
            ) as archive:

                bad_file = archive.testzip()

                if bad_file:
                    return self._failure(
                        package_dir=package_dir,
                        zip_path=zip_path,
                        pdf_file=final_pdf,
                        tex_file=final_tex,
                        bib_file=final_bib,
                        files=files,
                        warnings=warnings,
                        errors=[
                            "Le ZIP contient un fichier corrompu : "
                            f"{bad_file}"
                        ],
                        stage="zip_verification",
                    )

                archive_names = set(
                    archive.namelist()
                )

                missing_archive = sorted(
                    item
                    for item in files
                    if item not in archive_names
                )

                if missing_archive:
                    return self._failure(
                        package_dir=package_dir,
                        zip_path=zip_path,
                        pdf_file=final_pdf,
                        tex_file=final_tex,
                        bib_file=final_bib,
                        files=files,
                        warnings=warnings,
                        errors=[
                            "Des fichiers du paquet ne sont pas présents "
                            "dans l'archive : "
                            + ", ".join(missing_archive)
                        ],
                        stage="zip_verification",
                    )

        except zipfile.BadZipFile as exc:
            return self._failure(
                package_dir=package_dir,
                zip_path=zip_path,
                pdf_file=final_pdf,
                tex_file=final_tex,
                bib_file=final_bib,
                files=files,
                warnings=warnings,
                errors=[
                    "Le ZIP créé est invalide : "
                    f"{exc}"
                ],
                stage="zip_verification",
            )

        # ==================================================================
        # 15. NETTOYAGE OPTIONNEL
        # ==================================================================

        final_package_dir: Optional[str] = str(
            package_dir
        )

        if not self.keep_package_dir:
            self._cleanup_package(
                package_dir
            )
            final_package_dir = None

        # ==================================================================
        # 16. SUCCÈS
        # ==================================================================

        return ZIPExportResult(
            success=True,
            zip_file=str(
                zip_path
            ),
            package_dir=final_package_dir,
            pdf_file=(
                str(final_pdf)
                if final_pdf
                and final_pdf.exists()
                else None
            ),
            tex_file=(
                str(final_tex)
                if final_tex
                and final_tex.exists()
                else None
            ),
            bib_file=(
                str(final_bib)
                if final_bib
                and final_bib.exists()
                else None
            ),
            files=files,
            errors=[],
            warnings=self._unique(
                warnings
            ),
            metadata={
                "exporter_version": self.VERSION,
                "file_count": len(files),
                "zip_size": zip_path.stat().st_size,
                "output_directory": str(
                    output_path
                ),
                "package_directory": final_package_dir,
                "has_pdf": final_pdf is not None,
                "has_tex": final_tex is not None,
                "has_bibtex": final_bib is not None,
                "has_references": bool(
                    document.references
                ),
            },
        )

    # ======================================================================
    # MÉTADONNÉES
    # ======================================================================

    def _build_metadata(
        self,
        *,
        document: Document,
        pdf_result: Any,
        final_pdf: Optional[Path],
        final_tex: Optional[Path],
        final_bib: Optional[Path],
        extra_metadata: Optional[Dict[str, Any]],
    ) -> dict:

        document_metadata = (
            document.metadata.to_dict()
            if document.metadata
            else {}
        )

        compilation = getattr(
            pdf_result,
            "compilation",
            None,
        )

        payload = {
            "macevo": {
                "exporter": "ZIPExporter",
                "version": self.VERSION,
            },

            "document": document_metadata,

            "generation": {
                "pdf_success": bool(
                    pdf_result.success
                ),

                "pdf_file": (
                    str(final_pdf)
                    if final_pdf
                    else None
                ),

                "tex_file": (
                    str(final_tex)
                    if final_tex
                    else None
                ),

                "bib_file": (
                    str(final_bib)
                    if final_bib
                    else None
                ),

                "engine": (
                    compilation.engine
                    if compilation
                    else None
                ),

                "passes": (
                    compilation.passes
                    if compilation
                    else None
                ),

                "biber_executed": (
                    compilation.biber_executed
                    if compilation
                    else False
                ),

                "biber_return_code": (
                    compilation.biber_return_code
                    if compilation
                    else None
                ),
            },

            "package": {
                "directories": list(
                    self.DEFAULT_DIRECTORIES
                ),
            },
        }

        if extra_metadata:
            payload["metadata"] = dict(
                extra_metadata
            )

        return payload

    # ======================================================================
    # README
    # ======================================================================

    @staticmethod
    def _build_readme(
        *,
        document: Document,
        final_pdf: Optional[Path],
        final_tex: Optional[Path],
        final_bib: Optional[Path],
    ) -> str:

        title = (
            document.metadata.title
            if document.metadata
            else "Document MACEVO"
        )

        lines = [
            "MACEVO — Paquet scientifique",
            "================================",
            "",
            f"Titre : {title}",
            "",
            "Ce paquet a été généré automatiquement "
            "par MACEVO.",
            "",
            "Artefacts principaux :",
        ]

        if final_pdf:
            lines.append(
                f"- PDF : {final_pdf.name}"
            )

        if final_tex:
            lines.append(
                f"- LaTeX : {final_tex.name}"
            )

        if final_bib:
            lines.append(
                "- Bibliographie BibTeX : "
                f"{final_bib.name}"
            )

        lines.extend(
            [
                "- Métadonnées : metadata.json",
                "",
                "Répertoires scientifiques :",
                "- figures/       → figures et illustrations",
                "- tables/        → tableaux et données associées",
                "- bibliography/  → ressources bibliographiques",
                "- annexes/       → annexes du document",
                "",
                "Le fichier BibTeX principal reste à la racine "
                "afin que le fichier LaTeX puisse être recompilé "
                "directement avec sa référence BibLaTeX.",
                "",
                "Les fichiers présents dans l'archive correspondent "
                "aux artefacts effectivement générés ou fournis "
                "à MACEVO.",
            ]
        )

        return (
            "\n".join(lines)
            + "\n"
        )

    # ======================================================================
    # FICHIERS SUPPLÉMENTAIRES
    # ======================================================================

    @staticmethod
    def _copy_extra_files(
        *,
        extra_files: Iterable[str | Path],
        package_dir: Path,
        warnings: list[str],
    ) -> None:

        for extra_file in extra_files:

            source = Path(
                extra_file
            ).resolve()

            if not source.exists():
                warnings.append(
                    "Fichier supplémentaire introuvable : "
                    f"{source}"
                )
                continue

            if not source.is_file():
                warnings.append(
                    "La ressource supplémentaire n'est pas "
                    f"un fichier : {source}"
                )
                continue

            target = (
                package_dir
                / source.name
            )

            if target.exists():
                warnings.append(
                    "Fichier supplémentaire déjà présent, "
                    f"remplacé : {source.name}"
                )

            try:
                shutil.copy2(
                    source,
                    target,
                )

            except OSError as exc:
                warnings.append(
                    f"Impossible de copier {source.name} : {exc}"
                )

    # ======================================================================
    # DÉPLACEMENT SÉCURISÉ
    # ======================================================================

    @staticmethod
    def _move_into_package(
        source: Path,
        target: Path,
        warnings: list[str],
        label: str,
    ) -> Path:

        target.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        try:
            if source.resolve() == target.resolve():
                return target

            if target.exists():
                target.unlink()

            source.replace(
                target
            )

            return target

        except OSError as exc:
            warnings.append(
                "Impossible de placer le fichier "
                f"{label} dans le paquet : {exc}"
            )

            return source

    # ======================================================================
    # CRÉATION ZIP
    # ======================================================================

    def _create_zip(
        self,
        *,
        package_dir: Path,
        zip_path: Path,
    ) -> None:

        with zipfile.ZipFile(
            zip_path,
            mode="w",
            compression=self.compression,
        ) as archive:

            for file_path in package_dir.rglob("*"):

                if not file_path.is_file():
                    continue

                relative_path = (
                    file_path.relative_to(
                        package_dir
                    )
                )

                archive.write(
                    file_path,
                    arcname=str(
                        relative_path
                    ).replace(
                        "\\",
                        "/",
                    ),
                )

    # ======================================================================
    # COLLECTE
    # ======================================================================

    @staticmethod
    def _collect_files(
        package_dir: Path,
    ) -> list[str]:

        return sorted(
            str(
                path.relative_to(
                    package_dir
                )
            ).replace(
                "\\",
                "/",
            )
            for path in package_dir.rglob("*")
            if path.is_file()
        )

    # ======================================================================
    # ÉCHEC
    # ======================================================================

    @staticmethod
    def _failure(
        *,
        package_dir: Path,
        zip_path: Path,
        pdf_file: Optional[Path],
        tex_file: Optional[Path],
        bib_file: Optional[Path],
        files: list[str],
        warnings: list[str],
        errors: list[str],
        stage: str,
    ) -> ZIPExportResult:

        return ZIPExportResult(
            success=False,

            zip_file=(
                str(zip_path)
                if zip_path.exists()
                else None
            ),

            package_dir=(
                str(package_dir)
                if package_dir.exists()
                else None
            ),

            pdf_file=(
                str(pdf_file)
                if pdf_file
                else None
            ),

            tex_file=(
                str(tex_file)
                if tex_file
                else None
            ),

            bib_file=(
                str(bib_file)
                if bib_file
                else None
            ),

            files=files,

            errors=errors,

            warnings=ZIPExporter._unique(
                warnings
            ),

            metadata={
                "exporter_version": ZIPExporter.VERSION,
                "stage": stage,
            },
        )

    # ======================================================================
    # NETTOYAGE
    # ======================================================================

    @staticmethod
    def _cleanup_package(
        package_dir: Path,
    ) -> None:

        if package_dir.exists():

            try:
                shutil.rmtree(
                    package_dir
                )

            except OSError:
                pass

    # ======================================================================
    # NOMS
    # ======================================================================

    @staticmethod
    def _safe_filename(
        filename: str,
    ) -> str:

        value = Path(
            str(filename)
        ).name.strip()

        if not value:
            return "document.tex"

        return value

    @staticmethod
    def _normalize_filename(
        filename: str,
    ) -> str:

        value = str(
            filename or ""
        ).strip()

        if not value:
            value = "macevo_document.zip"

        value = Path(
            value
        ).name

        if not value.lower().endswith(
            ".zip"
        ):
            value += ".zip"

        return value

    # ======================================================================
    # UTILITAIRES
    # ======================================================================

    @staticmethod
    def _unique(
        values: Iterable[str],
    ) -> list[str]:

        result: list[str] = []
        seen: set[str] = set()

        for value in values:

            if value not in seen:
                seen.add(value)
                result.append(value)

        return result


def export_zip(
    document: Document,
    *,
    output_dir: str | Path,
    filename: str = "macevo_document.zip",
    **kwargs,
) -> ZIPExportResult:
    """Helper public simplifié."""

    exporter = ZIPExporter()

    return exporter.export(
        document,
        output_dir=output_dir,
        filename=filename,
        **kwargs,
    )