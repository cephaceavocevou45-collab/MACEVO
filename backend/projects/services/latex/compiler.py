
"""
==========================================================
MACEVO IA
LaTeX Compiler
==========================================================

Moteur de compilation LaTeX.

Objectifs :
- compiler un fichier .tex en PDF ;
- vérifier les entrées ;
- détecter le moteur LaTeX disponible ;
- récupérer les logs de compilation ;
- gérer les erreurs proprement ;
- supporter plusieurs passes de compilation ;
- préparer la compilation scientifique de documents MACEVO.
"""

from __future__ import annotations

import logging
import shutil
import subprocess
from pathlib import Path
from typing import Any


logger = logging.getLogger(__name__)


class LatexCompiler:
    """
    Compilation des documents LaTeX.
    """

    DEFAULT_ENGINE = "pdflatex"

    SUPPORTED_ENGINES = (
        "pdflatex",
        "xelatex",
        "lualatex",
    )

    # ---------------------------------------------------------
    # Engine
    # ---------------------------------------------------------

    @classmethod
    def find_engine(
        cls,
        engine: str | None = None,
    ) -> str:
        """
        Détermine le moteur LaTeX à utiliser.

        Si aucun moteur n'est précisé, recherche dans l'ordre :
        pdflatex -> xelatex -> lualatex.
        """

        requested = (
            engine or cls.DEFAULT_ENGINE
        ).lower().strip()

        if requested not in cls.SUPPORTED_ENGINES:
            raise ValueError(
                f"Moteur LaTeX non supporté : {requested}. "
                f"Moteurs disponibles : "
                f"{', '.join(cls.SUPPORTED_ENGINES)}"
            )

        executable = shutil.which(requested)

        if executable:
            return executable

        # Si aucun moteur n'est trouvé et qu'un moteur explicite
        # a été demandé, signaler clairement le problème.
        if engine:
            raise FileNotFoundError(
                f"Le moteur LaTeX '{requested}' "
                f"n'est pas installé ou n'est pas accessible "
                f"dans le PATH."
            )

        # Recherche des autres moteurs disponibles.
        for candidate in cls.SUPPORTED_ENGINES:
            executable = shutil.which(candidate)

            if executable:
                logger.warning(
                    "Le moteur '%s' n'est pas disponible. "
                    "Utilisation de '%s'.",
                    requested,
                    candidate,
                )

                return executable

        raise FileNotFoundError(
            "Aucun moteur LaTeX disponible. "
            "Installez une distribution LaTeX "
            "(TeX Live, MiKTeX, etc.)."
        )

    # ---------------------------------------------------------
    # Command
    # ---------------------------------------------------------

    @classmethod
    def build_command(
        cls,
        tex_file: Path,
        engine: str | None = None,
        interaction: str = "nonstopmode",
        shell_escape: bool = False,
        synctex: bool = False,
    ) -> list[str]:
        """
        Construit la commande de compilation.
        """

        executable = cls.find_engine(engine)

        command = [
            executable,
            f"-interaction={interaction}",
            "-halt-on-error",
        ]

        if shell_escape:
            command.append("-shell-escape")

        if synctex:
            command.append("-synctex=1")

        command.append(tex_file.name)

        return command

    # ---------------------------------------------------------
    # Single compilation
    # ---------------------------------------------------------

    @classmethod
    def compile(
        cls,
        tex_file,
        engine: str | None = None,
        passes: int = 1,
        timeout: int = 120,
        shell_escape: bool = False,
        synctex: bool = False,
        clean: bool = False,
    ) -> Path:
        """
        Compile un fichier .tex en PDF.

        Parameters
        ----------
        tex_file:
            Chemin vers le fichier .tex.

        engine:
            pdflatex, xelatex ou lualatex.

        passes:
            Nombre de passes de compilation.
            1 suffit pour un document simple.
            2 ou 3 sont utiles pour les références,
            la table des matières, les numéros, etc.

        timeout:
            Temps maximal d'une passe en secondes.

        shell_escape:
            Active -shell-escape si nécessaire.

        synctex:
            Active la génération SyncTeX.

        clean:
            Supprime les fichiers auxiliaires avant compilation.
        """

        tex_path = Path(tex_file).resolve()

        if not tex_path.exists():
            raise FileNotFoundError(
                f"Fichier LaTeX introuvable : {tex_path}"
            )

        if not tex_path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : "
                f"{tex_path}"
            )

        if tex_path.suffix.lower() != ".tex":
            raise ValueError(
                f"Le fichier doit avoir l'extension .tex : "
                f"{tex_path}"
            )

        if passes < 1:
            raise ValueError(
                "Le nombre de passes doit être supérieur ou égal à 1."
            )

        if timeout <= 0:
            raise ValueError(
                "Le timeout doit être supérieur à 0."
            )

        output_pdf = tex_path.with_suffix(".pdf")

        # -----------------------------------------------------
        # Nettoyage optionnel
        # -----------------------------------------------------

        if clean:
            cls.clean_auxiliary_files(
                tex_path,
            )

        command = cls.build_command(
            tex_path,
            engine=engine,
            shell_escape=shell_escape,
            synctex=synctex,
        )

        logger.info(
            "Compilation LaTeX : %s",
            tex_path,
        )

        logger.debug(
            "Commande : %s",
            " ".join(command),
        )

        last_stdout = ""
        last_stderr = ""

        # -----------------------------------------------------
        # Compilation
        # -----------------------------------------------------

        for pass_number in range(1, passes + 1):

            logger.info(
                "Passe LaTeX %d/%d : %s",
                pass_number,
                passes,
                tex_path.name,
            )

            try:
                process = subprocess.run(
                    command,
                    cwd=tex_path.parent,
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    timeout=timeout,
                    check=False,
                )

            except subprocess.TimeoutExpired as exc:
                logger.exception(
                    "Timeout pendant la compilation LaTeX."
                )

                raise TimeoutError(
                    f"La compilation LaTeX a dépassé "
                    f"{timeout} secondes."
                ) from exc

            except OSError as exc:
                logger.exception(
                    "Impossible d'exécuter le moteur LaTeX."
                )

                raise RuntimeError(
                    "Impossible d'exécuter le moteur LaTeX."
                ) from exc

            last_stdout = process.stdout or ""
            last_stderr = process.stderr or ""

            if process.returncode != 0:

                log_file = tex_path.with_suffix(".log")

                log_content = ""

                if log_file.exists():
                    try:
                        log_content = log_file.read_text(
                            encoding="utf-8",
                            errors="replace",
                        )
                    except OSError:
                        pass

                raise RuntimeError(
                    cls._format_compilation_error(
                        tex_path=tex_path,
                        return_code=process.returncode,
                        stdout=last_stdout,
                        stderr=last_stderr,
                        log=log_content,
                    )
                )

        # -----------------------------------------------------
        # Vérification du PDF
        # -----------------------------------------------------

        if not output_pdf.exists():
            raise RuntimeError(
                "La compilation LaTeX s'est terminée "
                "sans générer le PDF attendu : "
                f"{output_pdf}"
            )

        logger.info(
            "PDF LaTeX généré : %s",
            output_pdf,
        )

        return output_pdf

    # ---------------------------------------------------------
    # Compilation détaillée
    # ---------------------------------------------------------

    @classmethod
    def compile_with_result(
        cls,
        tex_file,
        engine: str | None = None,
        passes: int = 1,
        timeout: int = 120,
        shell_escape: bool = False,
        synctex: bool = False,
        clean: bool = False,
    ) -> dict[str, Any]:
        """
        Compile un fichier LaTeX et retourne un résultat détaillé.

        Cette méthode est particulièrement utile pour les services
        backend et l'interface MACEVO.
        """

        tex_path = Path(tex_file).resolve()

        try:
            pdf_path = cls.compile(
                tex_path,
                engine=engine,
                passes=passes,
                timeout=timeout,
                shell_escape=shell_escape,
                synctex=synctex,
                clean=clean,
            )

            log_path = tex_path.with_suffix(".log")

            log_content = ""

            if log_path.exists():
                try:
                    log_content = log_path.read_text(
                        encoding="utf-8",
                        errors="replace",
                    )
                except OSError:
                    pass

            return {
                "success": True,
                "source": str(tex_path),
                "pdf": str(pdf_path),
                "engine": (
                    engine
                    or cls.DEFAULT_ENGINE
                ),
                "passes": passes,
                "log": log_content,
                "error": None,
            }

        except Exception as exc:

            logger.exception(
                "Échec de compilation LaTeX : %s",
                tex_path,
            )

            return {
                "success": False,
                "source": str(tex_path),
                "pdf": None,
                "engine": engine or cls.DEFAULT_ENGINE,
                "passes": passes,
                "log": cls._read_log(tex_path),
                "error": str(exc),
            }

    # ---------------------------------------------------------
    # Errors
    # ---------------------------------------------------------

    @staticmethod
    def _format_compilation_error(
        tex_path: Path,
        return_code: int,
        stdout: str,
        stderr: str,
        log: str,
    ) -> str:
        """
        Construit un message d'erreur exploitable.
        """

        parts = [
            f"Échec de compilation LaTeX : {tex_path.name}",
            f"Code retour : {return_code}",
        ]

        if stderr.strip():
            parts.append(
                f"\nSTDERR :\n{stderr.strip()}"
            )

        if stdout.strip():
            parts.append(
                f"\nSTDOUT :\n{stdout.strip()}"
            )

        if log.strip():
            # Le log peut être extrêmement volumineux.
            # On conserve une portion raisonnable dans l'exception.
            log_excerpt = log[-12000:]

            parts.append(
                f"\nLOG LaTeX :\n{log_excerpt}"
            )

        return "\n".join(parts)

    @staticmethod
    def _read_log(tex_file: Path) -> str:
        """
        Lit le fichier .log s'il existe.
        """

        log_file = tex_file.with_suffix(".log")

        if not log_file.exists():
            return ""

        try:
            return log_file.read_text(
                encoding="utf-8",
                errors="replace",
            )
        except OSError:
            return ""

    # ---------------------------------------------------------
    # Auxiliary files
    # ---------------------------------------------------------

    @staticmethod
    def auxiliary_extensions() -> tuple[str, ...]:
        """
        Extensions de fichiers auxiliaires couramment générés
        par LaTeX.
        """

        return (
            ".aux",
            ".log",
            ".out",
            ".toc",
            ".lof",
            ".lot",
            ".fls",
            ".fdb_latexmk",
            ".synctex",
            ".synctex.gz",
            ".bbl",
            ".blg",
            ".bcf",
            ".run.xml",
            ".nav",
            ".snm",
            ".vrb",
        )

    @classmethod
    def clean_auxiliary_files(
        cls,
        tex_file,
    ) -> list[Path]:
        """
        Supprime les fichiers auxiliaires associés au .tex.

        Retourne la liste des fichiers supprimés.
        """

        tex_path = Path(tex_file).resolve()

        removed: list[Path] = []

        for extension in cls.auxiliary_extensions():
            auxiliary_file = tex_path.with_suffix(
                extension,
            )

            if not auxiliary_file.exists():
                continue

            try:
                auxiliary_file.unlink()
                removed.append(auxiliary_file)

            except OSError as exc:
                logger.warning(
                    "Impossible de supprimer %s : %s",
                    auxiliary_file,
                    exc,
                )

        return removed

    # ---------------------------------------------------------
    # Availability
    # ---------------------------------------------------------

    @classmethod
    def available_engines(cls) -> list[str]:
        """
        Retourne les moteurs LaTeX disponibles.
        """

        return [
            engine
            for engine in cls.SUPPORTED_ENGINES
            if shutil.which(engine)
        ]

    @classmethod
    def is_available(
        cls,
        engine: str | None = None,
    ) -> bool:
        """
        Vérifie si un moteur LaTeX est disponible.
        """

        try:
            cls.find_engine(engine)
            return True
        except (FileNotFoundError, ValueError):
            return False

    @classmethod
    def info(cls) -> dict[str, Any]:
        """
        Informations sur le compilateur.
        """

        return {
            "name": "LatexCompiler",
            "default_engine": cls.DEFAULT_ENGINE,
            "supported_engines": list(
                cls.SUPPORTED_ENGINES
            ),
            "available_engines": cls.available_engines(),
            "features": [
                "pdf_compilation",
                "multi_pass_compilation",
                "compilation_logs",
                "error_reporting",
                "synctex",
                "shell_escape",
                "auxiliary_cleanup",
            ],
        }
