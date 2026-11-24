from __future__ import annotations

import logging
import os
import re
import shutil
import subprocess
import zipfile
from pathlib import Path
from typing import Optional, Union
from uuid import UUID

from django.core.files import File

from .file_service import FileService


logger = logging.getLogger(__name__)


class ExportService:
    """
    Service centralisé de génération et d'export des fichiers
    Word → LaTeX.

    Responsabilités :
    - génération du fichier .tex ;
    - gestion des fichiers .bib ;
    - gestion des images ;
    - création de l'archive .zip ;
    - compilation PDF avec pdflatex ;
    - exécution de BibTeX / Biber ;
    - nettoyage des fichiers auxiliaires ;
    - synchronisation avec les FileField Django.
    """

    LATEX_FILENAME = "document.tex"
    BIB_FILENAME = "references.bib"
    ZIP_FILENAME = "document.zip"
    PDF_FILENAME = "document.pdf"

    PDF_AUXILIARY_EXTENSIONS = {
        ".aux",
        ".bcf",
        ".blg",
        ".bbl",
        ".fdb_latexmk",
        ".fls",
        ".idx",
        ".ilg",
        ".ind",
        ".lof",
        ".lot",
        ".nav",
        ".out",
        ".run.xml",
        ".snm",
        ".synctex",
        ".toc",
        ".vrb",
        ".xdv",
    }

    LATEX_COMPILATION_TIMEOUT = 120
    BIBLIOGRAPHY_TIMEOUT = 120
    MAX_COMMAND_OUTPUT_LENGTH = 12000

    def __init__(
        self,
        conversion=None,
        conversion_id: Optional[Union[str, UUID]] = None,
    ):
        self.conversion = conversion

        if conversion_id is not None:
            self.conversion_id = conversion_id
        elif conversion is not None:
            self.conversion_id = getattr(
                conversion,
                "id",
                None,
            )
        else:
            self.conversion_id = None

        if self.conversion_id is None:
            raise ValueError(
                "conversion ou conversion_id est obligatoire."
            )

    # ==============================================================
    # DIRECTORIES
    # ==============================================================

    @property
    def conversion_directory(self) -> Path:
        """Répertoire principal de la conversion."""
        return Path(
            FileService.get_conversion_directory(
                self.conversion_id
            )
        )

    @property
    def latex_directory(self) -> Path:
        """Répertoire de travail LaTeX."""
        return Path(
            FileService.get_latex_directory(
                self.conversion_id
            )
        )

    @property
    def images_directory(self) -> Path:
        """Répertoire des images extraites."""
        return Path(
            FileService.get_images_directory(
                self.conversion_id
            )
        )

    def ensure_latex_directory(self) -> Path:
        """
        Crée les répertoires nécessaires au projet LaTeX.
        """
        self.conversion_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.latex_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.images_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        return self.latex_directory

    # ==============================================================
    # PATHS
    # ==============================================================

    @property
    def latex_path(self) -> Path:
        """Chemin du fichier document.tex."""
        return self.latex_directory / self.LATEX_FILENAME

    @property
    def bibliography_path(self) -> Path:
        """Chemin du fichier references.bib."""
        return self.latex_directory / self.BIB_FILENAME

    @property
    def compiled_pdf_path(self) -> Path:
        """
        PDF directement produit par pdflatex.
        """
        return self.latex_directory / self.PDF_FILENAME

    @property
    def pdf_path(self) -> Path:
        """
        PDF final exposé au niveau de la conversion.
        """
        return self.conversion_directory / self.PDF_FILENAME

    @property
    def zip_path(self) -> Path:
        """Chemin de l'archive ZIP."""
        return self.conversion_directory / self.ZIP_FILENAME

    # ==============================================================
    # LATEX
    # ==============================================================

    def export_latex(self) -> Path:
        """
        Écrit conversion.latex_code dans document.tex
        et synchronise le FileField latex_file.
        """
        if self.conversion is None:
            raise ValueError(
                "conversion est obligatoire pour export_latex()."
            )

        latex_code = getattr(
            self.conversion,
            "latex_code",
            None,
        )

        if not latex_code:
            raise ValueError(
                "Aucun code LaTeX disponible pour cette conversion."
            )

        self.ensure_latex_directory()

        path = FileService.write_text(
            self.latex_path,
            str(latex_code),
            encoding="utf-8",
        )

        self._attach_generated_file(
            "latex_file",
            path,
        )

        return path

    # ==============================================================
    # BIBLIOGRAPHIE
    # ==============================================================

    def export_bibliography(
        self,
        bibliography_content: Optional[str] = None,
    ) -> Optional[Path]:
        """
        Écrit references.bib lorsqu'un contenu est fourni.

        Si references.bib existe déjà et qu'aucun contenu n'est fourni,
        le fichier est conservé.

        Si aucun contenu n'est disponible, retourne None.
        """
        self.ensure_latex_directory()

        if (
            bibliography_content is None
            and self.bibliography_path.is_file()
        ):
            return self.bibliography_path

        content = bibliography_content or ""

        if not content.strip():
            return None

        path = FileService.write_text(
            self.bibliography_path,
            content,
            encoding="utf-8",
        )

        return path

    # ==============================================================
    # ZIP
    # ==============================================================

    def create_zip(
        self,
        include_pdf: bool = False,
        include_bibliography: bool = True,
    ) -> Path:
        """
        Crée une archive ZIP contenant le projet LaTeX.

        Structure :

            main.tex
            references.bib
            images/
                ...
            autres fichiers .bib
            document.pdf (optionnel)
        """
        self.ensure_latex_directory()

        if not self.latex_path.is_file():
            self.export_latex()

        self.conversion_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        if self.zip_path.exists():
            try:
                self.zip_path.unlink()
            except OSError as exc:
                raise RuntimeError(
                    "Impossible de remplacer l'archive ZIP existante."
                ) from exc

        files_to_add: list[tuple[Path, str]] = []

        # ----------------------------------------------------------
        # main.tex — fichier d'entrée à la racine du projet Overleaf
        # ----------------------------------------------------------

        if self.latex_path.is_file():
            files_to_add.append(
                (
                    self.latex_path,
                    "main.tex",
                )
            )

        # ----------------------------------------------------------
        # references.bib
        # ----------------------------------------------------------

        if (
            include_bibliography
            and self.bibliography_path.is_file()
        ):
            files_to_add.append(
                (
                    self.bibliography_path,
                    self.BIB_FILENAME,
                )
            )

        # ----------------------------------------------------------
        # Autres fichiers .bib
        # ----------------------------------------------------------

        if include_bibliography:
            for bib_file in sorted(
                self.latex_directory.glob("*.bib"),
                key=lambda path: path.name.lower(),
            ):
                if (
                    bib_file.resolve()
                    == self.bibliography_path.resolve()
                ):
                    continue

                if bib_file.is_file():
                    files_to_add.append(
                        (
                            bib_file,
                            bib_file.name,
                        )
                    )

        # ----------------------------------------------------------
        # Images
        # ----------------------------------------------------------

        if self.images_directory.is_dir():
            for image_path in sorted(
                self.images_directory.rglob("*"),
                key=lambda path: str(path).lower(),
            ):
                if not image_path.is_file():
                    continue

                try:
                    relative_path = image_path.relative_to(
                        self.images_directory
                    )
                except ValueError:
                    continue

                archive_name = (
                    Path("images")
                    / relative_path
                )

                files_to_add.append(
                    (
                        image_path,
                        str(archive_name).replace(
                            os.sep,
                            "/",
                        ),
                    )
                )

        # ----------------------------------------------------------
        # PDF optionnel
        # ----------------------------------------------------------

        if include_pdf:
            pdf_source = self.pdf_path

            if not pdf_source.is_file():
                pdf_source = self.compiled_pdf_path

            if pdf_source.is_file():
                files_to_add.append(
                    (
                        pdf_source,
                        self.PDF_FILENAME,
                    )
                )

        # ----------------------------------------------------------
        # Création de l'archive
        # ----------------------------------------------------------

        with zipfile.ZipFile(
            self.zip_path,
            mode="w",
            compression=zipfile.ZIP_DEFLATED,
            compresslevel=6,
        ) as archive:

            added_names: set[str] = set()

            for source_path, archive_name in files_to_add:
                if not source_path.is_file():
                    continue

                normalized_name = str(
                    archive_name
                ).replace("\\", "/").lstrip("/")

                if not normalized_name:
                    continue

                if normalized_name in added_names:
                    continue

                archive.write(
                    source_path,
                    arcname=normalized_name,
                )

                added_names.add(normalized_name)

            archive.writestr(
                "README.txt",
                (
                    "Projet LaTeX MACEVO compatible avec Overleaf.\n"
                    "Le fichier principal est main.tex, place a la racine du projet.\n"
                    "Importez le ZIP complet pour inclure les images et references associees.\n"
                ).encode("utf-8"),
            )

        self._attach_generated_file(
            "zip_file",
            self.zip_path,
        )

        return self.zip_path

    # ==============================================================
    # PDF
    # ==============================================================

    def generate_pdf(
        self,
        clean_auxiliary: bool = True,
    ) -> Path:
        """
        Compile document.tex en PDF.

        Pipeline :

        1. pdflatex
        2. BibTeX/Biber si nécessaire
        3. pdflatex
        4. pdflatex

        Le PDF produit dans latex/ est copié dans le répertoire
        principal de la conversion.
        """
        self.ensure_latex_directory()

        if not self.latex_path.is_file():
            self.export_latex()

        if not self.latex_path.is_file():
            raise FileNotFoundError(
                f"Fichier LaTeX introuvable : {self.latex_path}"
            )

        if not self._command_exists("pdflatex"):
            raise RuntimeError(
                "pdflatex est introuvable sur le serveur. "
                "Installez une distribution LaTeX compatible "
                "avant de générer les PDF."
            )

        # Supprime les anciens PDF afin qu'un ancien fichier
        # ne soit jamais confondu avec le résultat de cette compilation.
        for stale_pdf in (
            self.compiled_pdf_path,
            self.pdf_path,
        ):
            try:
                if stale_pdf.is_file():
                    stale_pdf.unlink()
            except OSError:
                logger.warning(
                    "Impossible de supprimer l'ancien PDF : %s",
                    stale_pdf,
                    exc_info=True,
                )

        # Réinitialise le journal de compilation pour cette génération.
        compilation_log = (
            self.latex_directory
            / "compilation.log"
        )

        try:
            if compilation_log.is_file():
                compilation_log.unlink()
        except OSError:
            logger.warning(
                "Impossible de réinitialiser compilation.log.",
                exc_info=True,
            )

        self._prepare_bibliography_files_if_needed()

        bibliography_type = (
            self._detect_bibliography_engine()
        )

        try:
            # ------------------------------------------------------
            # Première compilation
            # ------------------------------------------------------

            self._run_pdflatex()

            # ------------------------------------------------------
            # Bibliographie
            # ------------------------------------------------------

            if bibliography_type == "biber":
                self._run_biber()
                self._run_pdflatex()
                self._run_pdflatex()

            elif bibliography_type == "bibtex":
                self._run_bibtex()
                self._run_pdflatex()
                self._run_pdflatex()

            else:
                # Deuxième passage pour les références croisées,
                # la table des matières et les renvois.
                self._run_pdflatex()

        except Exception:
            logger.exception(
                "Échec de compilation PDF pour la conversion %s.",
                self.conversion_id,
            )
            raise

        finally:
            if clean_auxiliary:
                self.cleanup_latex_auxiliary_files(
                    preserve_pdf=True,
                    preserve_tex=True,
                    preserve_bib=True,
                )

        if not self.compiled_pdf_path.is_file():
            raise RuntimeError(
                "pdflatex s'est terminé sans produire de fichier PDF. "
                "Consultez compilation.log pour plus de détails."
            )

        # ----------------------------------------------------------
        # Copie du PDF vers la racine de conversion
        # ----------------------------------------------------------

        self.conversion_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        try:
            shutil.copy2(
                self.compiled_pdf_path,
                self.pdf_path,
            )
        except OSError as exc:
            raise RuntimeError(
                "Impossible de copier le PDF compilé vers "
                "le répertoire final de conversion."
            ) from exc

        if not self.pdf_path.is_file():
            raise RuntimeError(
                "Le PDF final n'a pas pu être créé."
            )

        self._attach_generated_file(
            "pdf_file",
            self.pdf_path,
        )

        return self.pdf_path

    # ==============================================================
    # PDFLATEX
    # ==============================================================

    def _run_pdflatex(
        self,
    ) -> subprocess.CompletedProcess:
        """
        Lance une passe de pdflatex.

        --enable-installer permet à MiKTeX d'installer automatiquement
        les packages manquants lorsqu'ils sont nécessaires.
        """
        command = [
            "pdflatex",
            "--enable-installer",
            "-interaction=nonstopmode",
            "-halt-on-error",
            "-file-line-error",
            "-no-shell-escape",
            self.LATEX_FILENAME,
        ]

        return self._run_command(
            command,
            timeout=self.LATEX_COMPILATION_TIMEOUT,
        )

    # ==============================================================
    # BIBTEX
    # ==============================================================

    def _run_bibtex(
        self,
    ) -> subprocess.CompletedProcess:
        """Lance BibTeX."""
        if not self._command_exists("bibtex"):
            raise RuntimeError(
                "BibTeX est requis par le document mais "
                "n'est pas installé sur le serveur."
            )

        command = [
            "bibtex",
            Path(self.LATEX_FILENAME).stem,
        ]

        return self._run_command(
            command,
            timeout=self.BIBLIOGRAPHY_TIMEOUT,
        )

    # ==============================================================
    # BIBER
    # ==============================================================

    def _run_biber(
        self,
    ) -> subprocess.CompletedProcess:
        """Lance Biber."""
        if not self._command_exists("biber"):
            raise RuntimeError(
                "Biber est requis par le document mais "
                "n'est pas installé sur le serveur."
            )

        command = [
            "biber",
            Path(self.LATEX_FILENAME).stem,
        ]

        return self._run_command(
            command,
            timeout=self.BIBLIOGRAPHY_TIMEOUT,
        )

    # ==============================================================
    # BIBLIOGRAPHY DETECTION
    # ==============================================================

    def _detect_bibliography_engine(
        self,
    ) -> Optional[str]:
        """
        Détermine si le document utilise :

        - Biber ;
        - BibTeX ;
        - aucun moteur bibliographique.
        """
        if not self.latex_path.is_file():
            return None

        content = self.latex_path.read_text(
            encoding="utf-8",
            errors="replace",
        )

        if self._requires_biber(content):
            return "biber"

        if self._requires_bibtex(content):
            return "bibtex"

        return None

    @staticmethod
    def _requires_biber(
        latex_code: str,
    ) -> bool:
        """Détecte l'utilisation de biblatex/Biber."""
        if not latex_code:
            return False

        patterns = (
            r"\\usepackage(?:\[[^\]]*\])?\{biblatex\}",
            r"\\addbibresource(?:\[[^\]]*\])?\{",
            r"\\printbibliography\b",
        )

        return any(
            re.search(
                pattern,
                latex_code,
                flags=re.IGNORECASE,
            )
            for pattern in patterns
        )

    @staticmethod
    def _requires_bibtex(
        latex_code: str,
    ) -> bool:
        """Détecte l'ancien pipeline BibTeX."""
        if not latex_code:
            return False

        if ExportService._requires_biber(latex_code):
            return False

        patterns = (
            r"\\bibliography\s*\{",
            r"\\bibliographystyle\s*\{",
        )

        return any(
            re.search(
                pattern,
                latex_code,
                flags=re.IGNORECASE,
            )
            for pattern in patterns
        )

    # ==============================================================
    # BIBLIOGRAPHY PREPARATION
    # ==============================================================

    def _prepare_bibliography_files_if_needed(
        self,
    ) -> None:
        """
        Crée les fichiers .bib explicitement référencés par le
        document lorsqu'ils n'existent pas.

        Cela supporte :

            \\addbibresource{references.bib}

        ainsi que :

            \\bibliography{references}
        """
        if not self.latex_path.is_file():
            return

        latex_code = self.latex_path.read_text(
            encoding="utf-8",
            errors="replace",
        )

        latex_root = self.latex_directory.resolve()

        # ----------------------------------------------------------
        # biblatex : \addbibresource{xxx.bib}
        # ----------------------------------------------------------

        addbibresource_matches = re.findall(
            r"\\addbibresource(?:\[[^\]]*\])?\{([^}]+)\}",
            latex_code,
            flags=re.IGNORECASE,
        )

        for reference in addbibresource_matches:
            reference = reference.strip()

            if not reference:
                continue

            if reference.startswith(("/", "\\")):
                continue

            reference_path = (
                self.latex_directory
                / reference
            ).resolve()

            try:
                reference_path.relative_to(
                    latex_root
                )
            except ValueError:
                logger.warning(
                    "Référence bibliographique ignorée hors "
                    "du répertoire LaTeX : %s",
                    reference,
                )
                continue

            if reference_path.suffix.lower() != ".bib":
                reference_path = reference_path.with_suffix(
                    ".bib"
                )

            if reference_path.is_file():
                continue

            try:
                reference_path.parent.mkdir(
                    parents=True,
                    exist_ok=True,
                )

                reference_path.write_text(
                    "",
                    encoding="utf-8",
                )

            except OSError:
                logger.warning(
                    "Impossible de créer le fichier "
                    "bibliographique : %s",
                    reference_path,
                    exc_info=True,
                )

        # ----------------------------------------------------------
        # BibTeX : \bibliography{foo,bar}
        # ----------------------------------------------------------

        bibliography_matches = re.findall(
            r"\\bibliography\s*\{([^}]+)\}",
            latex_code,
            flags=re.IGNORECASE,
        )

        for bibliography_group in bibliography_matches:
            for reference in bibliography_group.split(","):
                reference = reference.strip()

                if not reference:
                    continue

                if reference.startswith(("/", "\\")):
                    continue

                if not reference.lower().endswith(".bib"):
                    reference += ".bib"

                reference_path = (
                    self.latex_directory
                    / reference
                ).resolve()

                try:
                    reference_path.relative_to(
                        latex_root
                    )
                except ValueError:
                    logger.warning(
                        "Référence BibTeX ignorée hors "
                        "du répertoire LaTeX : %s",
                        reference,
                    )
                    continue

                if reference_path.is_file():
                    continue

                try:
                    reference_path.parent.mkdir(
                        parents=True,
                        exist_ok=True,
                    )

                    reference_path.write_text(
                        "",
                        encoding="utf-8",
                    )

                except OSError:
                    logger.warning(
                        "Impossible de créer le fichier "
                        "BibTeX : %s",
                        reference_path,
                        exc_info=True,
                    )

    # ==============================================================
    # GENERIC COMMAND RUNNER
    # ==============================================================

    def _run_command(
        self,
        command: list[str],
        timeout: int,
    ) -> subprocess.CompletedProcess:
        """
        Exécute une commande dans le répertoire LaTeX.
        """
        self.ensure_latex_directory()

        logger.info(
            "Exécution commande export : %s",
            " ".join(command),
        )

        try:
            run_kwargs = {
                "args": command,
                "cwd": str(self.latex_directory),
                "stdout": subprocess.PIPE,
                "stderr": subprocess.STDOUT,
                "text": True,
                "encoding": "utf-8",
                "errors": "replace",
                "timeout": timeout,
                "check": False,
            }

            # Évite l'ouverture d'une fenêtre console supplémentaire
            # lorsque Django est lancé sous Windows.
            if os.name == "nt":
                creationflags = getattr(
                    subprocess,
                    "CREATE_NO_WINDOW",
                    0,
                )

                if creationflags:
                    run_kwargs["creationflags"] = creationflags

            result = subprocess.run(
                **run_kwargs,
            )

        except subprocess.TimeoutExpired as exc:
            raise RuntimeError(
                "La commande suivante a dépassé le délai maximal "
                f"de {timeout} secondes : "
                f"{' '.join(command)}"
            ) from exc

        except FileNotFoundError as exc:
            raise RuntimeError(
                f"Commande introuvable : {command[0]}"
            ) from exc

        output = result.stdout or ""

        self._write_compilation_log(
            command,
            output,
        )

        if result.returncode != 0:
            raise RuntimeError(
                self._build_command_error(
                    command,
                    result.returncode,
                    output,
                )
            )

        return result

    def _write_compilation_log(
        self,
        command: list[str],
        output: str,
    ) -> None:
        """Ajoute la sortie d'une commande au compilation.log."""
        log_path = (
            self.latex_directory
            / "compilation.log"
        )

        try:
            with log_path.open(
                "a",
                encoding="utf-8",
            ) as log_file:

                log_file.write("\n")
                log_file.write("=" * 80)
                log_file.write("\n")
                log_file.write(
                    "COMMAND: "
                    + " ".join(command)
                    + "\n\n"
                )
                log_file.write(output)
                log_file.write("\n")

        except OSError:
            logger.warning(
                "Impossible d'écrire compilation.log.",
                exc_info=True,
            )

    @classmethod
    def _build_command_error(
        cls,
        command: list[str],
        returncode: int,
        output: str,
    ) -> str:
        """Construit une erreur exploitable à partir du log."""
        command_text = " ".join(command)

        if len(output) > cls.MAX_COMMAND_OUTPUT_LENGTH:
            output = output[
                -cls.MAX_COMMAND_OUTPUT_LENGTH:
            ]

        return (
            f"La commande '{command_text}' a échoué "
            f"avec le code {returncode}.\n\n"
            f"Sortie de compilation :\n{output}"
        )

    @staticmethod
    def _command_exists(
        command: str,
    ) -> bool:
        """Vérifie si une commande est disponible dans PATH."""
        return shutil.which(command) is not None

    # ==============================================================
    # FULL EXPORT
    # ==============================================================

    def export_all(
        self,
        generate_pdf: bool = False,
        create_zip: bool = True,
        include_pdf_in_zip: bool = False,
    ) -> dict[str, Optional[Path]]:
        """
        Effectue l'ensemble des exports.
        """
        result: dict[str, Optional[Path]] = {
            "latex": None,
            "bibliography": None,
            "pdf": None,
            "zip": None,
        }

        result["latex"] = self.export_latex()

        if self.bibliography_path.is_file():
            result["bibliography"] = (
                self.bibliography_path
            )

        if generate_pdf:
            result["pdf"] = self.generate_pdf()

        if create_zip:
            result["zip"] = self.create_zip(
                include_pdf=include_pdf_in_zip,
                include_bibliography=True,
            )

        if self.conversion is not None:
            try:
                self.conversion.save()
            except Exception:
                logger.warning(
                    "Impossible de sauvegarder automatiquement "
                    "la conversion %s après export.",
                    self.conversion_id,
                    exc_info=True,
                )

        return result

    # ==============================================================
    # EXPORT FILE
    # ==============================================================

    def export_file(
        self,
        file_type: str,
    ) -> Path:
        """
        Exporte un type de fichier donné.

        Types :

            latex
            tex
            pdf
            zip
            bib
            bibliography
        """
        normalized_type = (
            str(file_type or "")
            .strip()
            .lower()
            .lstrip(".")
        )

        if normalized_type in {"latex", "tex"}:
            return self.export_latex()

        if normalized_type == "pdf":
            return self.generate_pdf()

        if normalized_type == "zip":
            return self.create_zip()

        if normalized_type in {
            "bib",
            "bibliography",
        }:
            path = self.export_bibliography()

            if path is None:
                raise FileNotFoundError(
                    "Aucune bibliographie disponible."
                )

            return path

        raise ValueError(
            f"Type d'export inconnu : {file_type}"
        )

    # ==============================================================
    # CLEANUP
    # ==============================================================

    def cleanup_latex_auxiliary_files(
        self,
        preserve_pdf: bool = True,
        preserve_tex: bool = True,
        preserve_bib: bool = True,
    ) -> None:
        """
        Supprime les fichiers auxiliaires produits par LaTeX.
        """
        if not self.latex_directory.is_dir():
            return

        preserved_names: set[str] = set()

        if preserve_tex:
            preserved_names.add(
                self.LATEX_FILENAME
            )

        if preserve_bib:
            preserved_names.add(
                self.BIB_FILENAME
            )

        if preserve_pdf:
            preserved_names.add(
                self.PDF_FILENAME
            )

        for path in self.latex_directory.iterdir():
            if not path.is_file():
                continue

            if path.name in preserved_names:
                continue

            filename_lower = path.name.lower()
            suffix = path.suffix.lower()

            is_synctex_gz = (
                filename_lower.endswith(
                    ".synctex.gz"
                )
            )

            if (
                suffix in self.PDF_AUXILIARY_EXTENSIONS
                or is_synctex_gz
            ):
                try:
                    path.unlink()
                except OSError:
                    logger.warning(
                        "Impossible de supprimer le fichier "
                        "auxiliaire : %s",
                        path,
                    )

    def delete_export_files(
        self,
        include_latex: bool = False,
        include_zip: bool = True,
        include_pdf: bool = True,
        include_bib: bool = False,
    ) -> None:
        """
        Supprime les fichiers générés par le service.
        """
        paths: list[Path] = []

        if include_latex:
            paths.append(
                self.latex_path
            )

        if include_zip:
            paths.append(
                self.zip_path
            )

        if include_pdf:
            paths.append(
                self.pdf_path
            )

            paths.append(
                self.compiled_pdf_path
            )

        if include_bib:
            paths.append(
                self.bibliography_path
            )

        seen: set[Path] = set()

        for path in paths:
            path = path.resolve()

            if path in seen:
                continue

            seen.add(path)

            try:
                if path.is_file():
                    path.unlink()
            except OSError:
                logger.warning(
                    "Impossible de supprimer : %s",
                    path,
                    exc_info=True,
                )

    def cleanup_conversion_directory(
        self,
    ) -> bool:
        """Supprime entièrement le répertoire de conversion."""
        return FileService.cleanup_conversion(
            self.conversion_id
        )

    # ==============================================================
    # DJANGO FILEFIELD
    # ==============================================================

    def _attach_generated_file(
        self,
        field_name: str,
        path: Path,
    ) -> None:
        """
        Attache un fichier généré à un FileField Django.

        save=True garantit que le FileField est réellement
        persisté lorsque generate_pdf(), export_latex() ou
        create_zip() sont appelés individuellement.
        """
        if self.conversion is None:
            return

        if not path.is_file():
            return

        field = getattr(
            self.conversion,
            field_name,
            None,
        )

        if field is None:
            logger.warning(
                "Le champ %s n'existe pas sur %s.",
                field_name,
                self.conversion.__class__.__name__,
            )
            return

        try:
            with path.open("rb") as handle:
                django_file = File(
                    handle,
                    name=path.name,
                )

                field.save(
                    path.name,
                    django_file,
                    save=True,
                )

        except (
            OSError,
            ValueError,
            AttributeError,
        ):
            logger.warning(
                "Impossible d'attacher %s au champ %s.",
                path,
                field_name,
                exc_info=True,
            )
            raise

    # ==============================================================
    # COMPATIBILITY HELPERS
    # ==============================================================

    def get_latex_file(self) -> Path:
        """Retourne le chemin document.tex."""
        return self.latex_path

    def get_pdf_file(self) -> Path:
        """Retourne le chemin du PDF final."""
        return self.pdf_path

    def get_zip_file(self) -> Path:
        """Retourne le chemin du ZIP."""
        return self.zip_path

    def get_bibliography_file(self) -> Path:
        """Retourne le chemin references.bib."""
        return self.bibliography_path

    def file_exists(
        self,
        file_type: str,
    ) -> bool:
        """Vérifie l'existence d'un export."""
        normalized_type = (
            str(file_type or "")
            .strip()
            .lower()
            .lstrip(".")
        )

        paths = {
            "latex": self.latex_path,
            "tex": self.latex_path,
            "pdf": self.pdf_path,
            "zip": self.zip_path,
            "bib": self.bibliography_path,
            "bibliography": self.bibliography_path,
        }

        path = paths.get(
            normalized_type
        )

        if path is None:
            return False

        return path.is_file()

    def get_file_path(
        self,
        file_type: str,
    ) -> Optional[Path]:
        """Retourne le chemin d'un export selon son type."""
        normalized_type = (
            str(file_type or "")
            .strip()
            .lower()
            .lstrip(".")
        )

        paths = {
            "latex": self.latex_path,
            "tex": self.latex_path,
            "pdf": self.pdf_path,
            "zip": self.zip_path,
            "bib": self.bibliography_path,
            "bibliography": self.bibliography_path,
        }

        return paths.get(
            normalized_type
        )


# ----------------------------------------------------------------------
# Alias de compatibilité
# ----------------------------------------------------------------------

WordToLatexExportService = ExportService
