"""
MACEVO â€” Compilateur LaTeX â†’ PDF.

ResponsabilitÃ©s :
- dÃ©tection automatique de XeLaTeX / LuaLaTeX / PDFLaTeX ;
- compilation d'un fichier .tex ;
- gestion des passes multiples ;
- rÃ©cupÃ©ration du PDF ;
- capture stdout / stderr ;
- dÃ©tection des erreurs de compilation ;
- fonctionnement Windows / Linux / macOS ;
- rÃ©sultat structurÃ© exploitable par MACEVO.
"""

from __future__ import annotations

import shutil
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional


# ============================================================================
# RÃ‰SULTAT DE COMPILATION
# ============================================================================


@dataclass
class LaTeXCompilationResult:
    """
    RÃ©sultat d'une compilation LaTeX.
    """

    success: bool
    engine: Optional[str] = None
    tex_file: Optional[str] = None
    pdf_file: Optional[str] = None

    return_code: Optional[int] = None

    stdout: str = ""
    stderr: str = ""

    duration_ms: Optional[float] = None

    passes: int = 0
    biber_executed: bool = False
    biber_return_code: Optional[int] = None
    biber_stdout: str = ""
    biber_stderr: str = ""

    errors: List[str] = field(
        default_factory=list
    )

    warnings: List[str] = field(
        default_factory=list
    )

    metadata: dict = field(
        default_factory=dict
    )

    @property
    def failed(self) -> bool:
        return not self.success

    @property
    def pdf_exists(self) -> bool:
        return bool(
            self.pdf_file
            and Path(self.pdf_file).exists()
        )

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "engine": self.engine,
            "tex_file": self.tex_file,
            "pdf_file": self.pdf_file,
            "return_code": self.return_code,
            "stdout": self.stdout,
            "stderr": self.stderr,
            "duration_ms": self.duration_ms,
            "passes": self.passes,
            "biber_executed": self.biber_executed,
            "biber_return_code": self.biber_return_code,
            "biber_stdout": self.biber_stdout,
            "biber_stderr": self.biber_stderr,
            "errors": self.errors,
            "warnings": self.warnings,
            "metadata": self.metadata,
        }


# ============================================================================
# COMPILATEUR
# ============================================================================


class LaTeXCompiler:
    """
    Compilateur LaTeX professionnel MACEVO.

    Ordre de prÃ©fÃ©rence :

        1. xelatex
        2. lualatex
        3. pdflatex

    XeLaTeX est privilÃ©giÃ© car le gÃ©nÃ©rateur MACEVO actuel
    utilise notamment fontspec et polyglossia.
    """

    VERSION = "1.2.0"

    DEFAULT_ENGINES = (
        "xelatex",
        "lualatex",
        "pdflatex",
    )

    def __init__(
        self,
        *,
        preferred_engine: Optional[str] = None,
        passes: int = 2,
        timeout: int = 120,
        interaction: str = "nonstopmode",
        halt_on_error: bool = True,
        clean_auxiliary: bool = False,
        use_biber: bool = True,
        biber_executable: Optional[str] = None,
        biber_timeout: Optional[int] = None,
    ):
        self.preferred_engine = (
            preferred_engine
        )

        self.passes = max(
            1,
            int(passes),
        )

        self.timeout = max(
            1,
            int(timeout),
        )

        self.interaction = interaction

        self.halt_on_error = (
            halt_on_error
        )

        self.clean_auxiliary = (
            clean_auxiliary
        )

        self.use_biber = bool(use_biber)
        self.biber_executable = biber_executable
        self.biber_timeout = (
            self.timeout
            if biber_timeout is None
            else max(1, int(biber_timeout))
        )

    # ========================================================================
    # DÃ‰TECTION DU MOTEUR
    # ========================================================================

    def detect_engine(
        self,
    ) -> Optional[str]:
        """
        DÃ©tecte automatiquement un moteur LaTeX disponible.
        """

        engines = []

        if self.preferred_engine:
            engines.append(
                self.preferred_engine
            )

        for engine in self.DEFAULT_ENGINES:
            if engine not in engines:
                engines.append(engine)

        for engine in engines:
            executable = shutil.which(
                engine
            )

            if executable:
                return executable

        return None

    def available_engines(self) -> List[str]:
        """
        Retourne les moteurs LaTeX disponibles.
        """

        available = []

        for engine in self.DEFAULT_ENGINES:
            executable = shutil.which(
                engine
            )

            if executable:
                available.append(
                    executable
                )

        return available

    # ========================================================================
    # DÉTECTION DE BIBER
    # ========================================================================

    def detect_biber(self) -> Optional[str]:
        """Détecte Biber, avec priorité au chemin explicitement fourni."""
        if self.biber_executable:
            explicit = Path(self.biber_executable)
            if explicit.exists():
                return str(explicit.resolve())
            resolved = shutil.which(self.biber_executable)
            if resolved:
                return resolved
        return shutil.which("biber")

    # ========================================================================
    # COMPILATION
    # ========================================================================

    def compile(
        self,
        tex_file: str | Path,
        *,
        output_dir: Optional[str | Path] = None,
        engine: Optional[str] = None,
        passes: Optional[int] = None,
        timeout: Optional[int] = None,
    ) -> LaTeXCompilationResult:
        """
        Compile un fichier .tex vers PDF.
        """

        start_time = time.perf_counter()

        tex_path = Path(
            tex_file
        ).resolve()

        # --------------------------------------------------------------------
        # VÃ©rification fichier
        # --------------------------------------------------------------------

        if not tex_path.exists():
            return self._failure(
                start_time=start_time,
                tex_file=tex_path,
                errors=[
                    (
                        "Le fichier LaTeX "
                        f"n'existe pas : {tex_path}"
                    )
                ],
                code=None,
            )

        if not tex_path.is_file():
            return self._failure(
                start_time=start_time,
                tex_file=tex_path,
                errors=[
                    (
                        "Le chemin fourni "
                        "n'est pas un fichier."
                    )
                ],
                code=None,
            )

        # --------------------------------------------------------------------
        # DÃ©termination du moteur
        # --------------------------------------------------------------------

        executable = self._resolve_engine(
            engine
        )

        if not executable:
            return self._failure(
                start_time=start_time,
                tex_file=tex_path,
                errors=[
                    (
                        "Aucun moteur LaTeX disponible. "
                        "Installez une distribution LaTeX "
                        "comme MiKTeX ou TeX Live."
                    )
                ],
                code=None,
            )

        engine_name = Path(
            executable
        ).stem.lower()

        # --------------------------------------------------------------------
        # RÃ©pertoire de sortie
        # --------------------------------------------------------------------

        if output_dir is None:
            build_dir = tex_path.parent
        else:
            build_dir = Path(
                output_dir
            ).resolve()

            build_dir.mkdir(
                parents=True,
                exist_ok=True,
            )

        # --------------------------------------------------------------------
        # Nombre de passes
        # --------------------------------------------------------------------

        compile_passes = (
            self.passes
            if passes is None
            else max(
                1,
                int(passes),
            )
        )

        compile_timeout = (
            self.timeout
            if timeout is None
            else max(
                1,
                int(timeout),
            )
        )

        # --------------------------------------------------------------------
        # Construction commande
        # --------------------------------------------------------------------

        command = self._build_command(
            executable=executable,
            tex_path=tex_path,
            output_dir=build_dir,
        )

        all_stdout = []
        all_stderr = []

        return_code = 0
        executed_passes = 0

        biber_executed = False
        biber_return_code = None
        biber_stdout = []
        biber_stderr = []

        has_bibliography = self._tex_requires_biber(tex_path)
        biber_executable = (
            self.detect_biber()
            if self.use_biber and has_bibliography
            else None
        )

        # Une bibliographie BibLaTeX/Biber nécessite au minimum deux passes
        # LaTeX : une passe initiale pour produire le .bcf, Biber, puis une
        # passe finale pour intégrer le .bbl dans le PDF.
        if biber_executable and compile_passes < 2:
            compile_passes = 2

        if self.use_biber and has_bibliography and not biber_executable:
            return self._failure(
                start_time=start_time,
                tex_file=tex_path,
                engine=engine_name,
                stdout="\n".join(all_stdout),
                stderr="\n".join(all_stderr),
                code=None,
                passes=0,
                errors=[
                    "Biber est requis par le document LaTeX mais aucun exécutable Biber n'a été trouvé."
                ],
            )

        for pass_number in range(1, compile_passes + 1):
            executed_passes = pass_number

            process_result = self._run_process(
                command,
                cwd=tex_path.parent,
                timeout=compile_timeout,
            )

            all_stdout.append(process_result["stdout"])
            all_stderr.append(process_result["stderr"])

            if process_result["timeout"]:
                return self._failure(
                    start_time=start_time,
                    tex_file=tex_path,
                    engine=engine_name,
                    stdout="\n".join(all_stdout),
                    stderr="\n".join(all_stderr),
                    code=None,
                    passes=executed_passes,
                    errors=["La compilation LaTeX a dépassé le délai maximal."],
                    biber_executed=biber_executed,
                    biber_return_code=biber_return_code,
                    biber_stdout="\n".join(biber_stdout),
                    biber_stderr="\n".join(biber_stderr),
                )

            if process_result["os_error"]:
                return self._failure(
                    start_time=start_time,
                    tex_file=tex_path,
                    engine=engine_name,
                    stdout="\n".join(all_stdout),
                    stderr="\n".join(all_stderr),
                    code=None,
                    passes=executed_passes,
                    errors=[f"Impossible d'exécuter le moteur LaTeX : {process_result['os_error']}"],
                    biber_executed=biber_executed,
                    biber_return_code=biber_return_code,
                    biber_stdout="\n".join(biber_stdout),
                    biber_stderr="\n".join(biber_stderr),
                )

            stdout = process_result["stdout"]
            stderr = process_result["stderr"]
            return_code = process_result["return_code"]

            if return_code != 0:
                errors = self._extract_errors(stdout, stderr)
                if not errors:
                    errors = [f"La compilation LaTeX a échoué avec le code {return_code}."]

                return self._failure(
                    start_time=start_time,
                    tex_file=tex_path,
                    engine=engine_name,
                    stdout="\n".join(all_stdout),
                    stderr="\n".join(all_stderr),
                    code=return_code,
                    passes=executed_passes,
                    errors=errors,
                    biber_executed=biber_executed,
                    biber_return_code=biber_return_code,
                    biber_stdout="\n".join(biber_stdout),
                    biber_stderr="\n".join(biber_stderr),
                )

            # Biber doit être exécuté après la première passe LaTeX.
            if pass_number == 1 and biber_executable:
                biber_result = self._run_process(
                    [biber_executable, tex_path.stem],
                    cwd=tex_path.parent,
                    timeout=self.biber_timeout,
                )

                biber_executed = True
                biber_return_code = biber_result["return_code"]
                biber_stdout.append(biber_result["stdout"])
                biber_stderr.append(biber_result["stderr"])

                if biber_result["timeout"]:
                    return self._failure(
                        start_time=start_time,
                        tex_file=tex_path,
                        engine=engine_name,
                        stdout="\n".join(all_stdout),
                        stderr="\n".join(all_stderr),
                        code=None,
                        passes=executed_passes,
                        errors=[f"Biber a dépassé le délai maximal de {self.biber_timeout} secondes."],
                        biber_executed=True,
                        biber_stdout="\n".join(biber_stdout),
                        biber_stderr="\n".join(biber_stderr),
                    )

                if biber_result["os_error"]:
                    return self._failure(
                        start_time=start_time,
                        tex_file=tex_path,
                        engine=engine_name,
                        stdout="\n".join(all_stdout),
                        stderr="\n".join(all_stderr),
                        code=None,
                        passes=executed_passes,
                        errors=[f"Impossible d'exécuter Biber : {biber_result['os_error']}"],
                        biber_executed=True,
                        biber_stdout="\n".join(biber_stdout),
                        biber_stderr="\n".join(biber_stderr),
                    )

                if biber_return_code != 0:
                    errors = self._extract_biber_errors(
                        biber_result["stdout"],
                        biber_result["stderr"],
                    )
                    if not errors:
                        errors = [f"Biber a échoué avec le code {biber_return_code}."]

                    return self._failure(
                        start_time=start_time,
                        tex_file=tex_path,
                        engine=engine_name,
                        stdout="\n".join(all_stdout),
                        stderr="\n".join(all_stderr),
                        code=biber_return_code,
                        passes=executed_passes,
                        errors=errors,
                        biber_executed=True,
                        biber_return_code=biber_return_code,
                        biber_stdout="\n".join(biber_stdout),
                        biber_stderr="\n".join(biber_stderr),
                    )

        # --------------------------------------------------------------------
        # PDF attendu
        # --------------------------------------------------------------------

        pdf_path = (
            build_dir
            / f"{tex_path.stem}.pdf"
        )

        if not pdf_path.exists():
            errors = [
                (
                    "La compilation s'est terminÃ©e "
                    "sans produire le PDF attendu : "
                    f"{pdf_path}"
                )
            ]

            return self._failure(
                start_time=start_time,
                tex_file=tex_path,
                engine=engine_name,
                stdout="\n".join(
                    all_stdout
                ),
                stderr="\n".join(
                    all_stderr
                ),
                code=return_code,
                passes=executed_passes,
                errors=errors,
            )

        # --------------------------------------------------------------------
        # Analyse finale
        # --------------------------------------------------------------------

        # IMPORTANT : ne pas analyser toutes les passes pour déterminer les
        # warnings finaux. La première passe LaTeX peut légitimement produire
        # des warnings de citations/références qui sont résolus après Biber et
        # la passe finale. On conserve tout stdout/stderr dans le résultat,
        # mais les warnings exposés par l'API correspondent uniquement à la
        # dernière passe LaTeX.
        final_output = stdout + "\n" + stderr
        warnings = self._extract_warnings(final_output)

        final_analysis = self._analyze_final_state(
            tex_path=tex_path,
            final_output=final_output,
            has_bibliography=has_bibliography,
            biber_executed=biber_executed,
            biber_return_code=biber_return_code,
        )

        # --------------------------------------------------------------------
        # Nettoyage optionnel
        # --------------------------------------------------------------------

        if self.clean_auxiliary:
            self._clean_auxiliary_files(
                tex_path=tex_path,
                output_dir=build_dir,
            )

        # --------------------------------------------------------------------
        # SuccÃ¨s
        # --------------------------------------------------------------------

        duration_ms = (
            time.perf_counter()
            - start_time
        ) * 1000

        return LaTeXCompilationResult(
            success=True,
            engine=engine_name,
            tex_file=str(
                tex_path
            ),
            pdf_file=str(
                pdf_path
            ),
            return_code=return_code,
            stdout="\n".join(
                all_stdout
            ),
            stderr="\n".join(
                all_stderr
            ),
            duration_ms=round(
                duration_ms,
                2,
            ),
            passes=executed_passes,
            biber_executed=biber_executed,
            biber_return_code=biber_return_code,
            biber_stdout="\n".join(biber_stdout),
            biber_stderr="\n".join(biber_stderr),
            errors=[],
            warnings=warnings,
            metadata={
                "compiler_version": self.VERSION,
                "output_directory": str(
                    build_dir
                ),
                "command": command,
                "biber_enabled": self.use_biber,
                "biber_required": has_bibliography,
                "biber_executable": biber_executable,
                "requested_passes": self.passes if passes is None else max(1, int(passes)),
                "effective_passes": compile_passes,
                "final_pass_only_warnings": True,
                **final_analysis,
            },
        )

    # ========================================================================
    # COMPILE Ã€ PARTIR D'UNE SOURCE
    # ========================================================================

    def compile_source(
        self,
        latex: str,
        *,
        output_dir: str | Path,
        filename: str = "macevo_document.tex",
        engine: Optional[str] = None,
        passes: Optional[int] = None,
        timeout: Optional[int] = None,
    ) -> LaTeXCompilationResult:
        """
        Ã‰crit une source LaTeX dans un fichier temporaire/persistant
        puis la compile.
        """

        output_path = Path(
            output_dir
        ).resolve()

        output_path.mkdir(
            parents=True,
            exist_ok=True,
        )

        tex_path = (
            output_path
            / filename
        )

        try:
            tex_path.write_text(
                latex,
                encoding="utf-8",
            )

        except OSError as exc:
            return LaTeXCompilationResult(
                success=False,
                tex_file=str(
                    tex_path
                ),
                errors=[
                    (
                        "Impossible d'Ã©crire "
                        f"le fichier LaTeX : {exc}"
                    )
                ],
            )

        return self.compile(
            tex_path,
            output_dir=output_path,
            engine=engine,
            passes=passes,
            timeout=timeout,
        )

    # ========================================================================
    # RÃ‰SOLUTION MOTEUR
    # ========================================================================

    def _resolve_engine(
        self,
        engine: Optional[str],
    ) -> Optional[str]:
        """
        RÃ©sout le moteur demandÃ© ou utilise la dÃ©tection automatique.
        """

        if engine:
            executable = shutil.which(
                engine
            )

            if executable:
                return executable

            # Autorise Ã©galement un chemin absolu.
            engine_path = Path(
                engine
            )

            if engine_path.exists():
                return str(
                    engine_path
                )

            return None

        return self.detect_engine()

    # ========================================================================
    # COMMANDE
    # ========================================================================

    def _build_command(
        self,
        *,
        executable: str,
        tex_path: Path,
        output_dir: Path,
    ) -> List[str]:
        """
        Construit la commande de compilation.
        """

        command = [
            executable,
            f"-interaction={self.interaction}",
            "-file-line-error",
            f"-output-directory={output_dir}",
        ]

        if self.halt_on_error:
            command.append(
                "-halt-on-error"
            )

        command.append(
            tex_path.name
        )

        return command

    # ========================================================================
    # EXÉCUTION DES PROCESSUS
    # ========================================================================

    @staticmethod
    def _run_process(
        command: List[str],
        *,
        cwd: Path,
        timeout: int,
    ) -> dict:
        try:
            process = subprocess.run(
                command,
                cwd=str(cwd),
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout,
                check=False,
            )
            return {
                "return_code": process.returncode,
                "stdout": process.stdout or "",
                "stderr": process.stderr or "",
                "timeout": False,
                "os_error": None,
            }
        except subprocess.TimeoutExpired as exc:
            return {
                "return_code": None,
                "stdout": LaTeXCompiler._decode_output(exc.stdout),
                "stderr": LaTeXCompiler._decode_output(exc.stderr),
                "timeout": True,
                "os_error": None,
            }
        except OSError as exc:
            return {
                "return_code": None,
                "stdout": "",
                "stderr": "",
                "timeout": False,
                "os_error": str(exc),
            }

    @staticmethod
    def _tex_requires_biber(tex_path: Path) -> bool:
        try:
            content = tex_path.read_text(
                encoding="utf-8",
                errors="replace",
            )
        except OSError:
            return False

        return (
            "\\addbibresource" in content
            and "\\printbibliography" in content
        )

    @staticmethod
    def _extract_biber_errors(
        stdout: str,
        stderr: str,
    ) -> List[str]:
        output = stdout + "\n" + stderr
        errors = []

        for line in output.splitlines():
            stripped = line.strip()
            if not stripped:
                continue

            upper = stripped.upper()
            if (
                "ERROR" in upper
                or "FATAL" in upper
                or "ERROR:" in upper
            ):
                if stripped not in errors:
                    errors.append(stripped)

        return errors[:50]

    # ========================================================================
    # EXTRACTION ERREURS
    # ========================================================================

    def _extract_errors(
        self,
        stdout: str,
        stderr: str,
    ) -> List[str]:
        """
        Extrait les erreurs les plus utiles de la sortie LaTeX.
        """

        output = (
            stdout
            + "\n"
            + stderr
        )

        errors = []

        for line in output.splitlines():
            stripped = line.strip()

            if not stripped:
                continue

            # Erreur LaTeX classique.
            if stripped.startswith("!"):
                errors.append(
                    stripped
                )
                continue

            # Erreurs avec numÃ©ro de ligne.
            if re_search_latex_error(
                stripped
            ):
                errors.append(
                    stripped
                )

        # Ã‰vite les doublons.
        unique = []

        for error in errors:
            if error not in unique:
                unique.append(
                    error
                )

        return unique[:50]

    # ========================================================================
    # EXTRACTION AVERTISSEMENTS
    # ========================================================================

    def _extract_warnings(
        self,
        output: str,
    ) -> List[str]:
        """
        Extrait les warnings LaTeX.
        """

        warnings = []

        for line in output.splitlines():
            stripped = line.strip()

            if (
                "Warning:" in stripped
                or "warning:" in stripped
            ):
                if stripped not in warnings:
                    warnings.append(
                        stripped
                    )

        return warnings[:100]


    def _analyze_final_state(
        self,
        *,
        tex_path: Path,
        final_output: str,
        has_bibliography: bool,
        biber_executed: bool,
        biber_return_code: Optional[int],
    ) -> dict:
        """
        Analyse l'état final du document sans considérer les warnings
        transitoires des premières passes.

        Cette analyse est volontairement conservatrice : elle ne déclare une
        bibliographie comme résolue que si Biber a réussi et qu'aucun signal
        final classique d'une bibliographie/citation encore non résolue n'est
        présent dans la dernière sortie LaTeX.
        """
        output_lower = final_output.lower()

        pdf_path = tex_path.parent / f"{tex_path.stem}.pdf"
        bbl_path = tex_path.parent / f"{tex_path.stem}.bbl"
        bcf_path = tex_path.parent / f"{tex_path.stem}.bcf"

        unresolved_citations = (
            "undefined citations" in output_lower
            or "citation '" in output_lower and "undefined" in output_lower
            or "there were undefined references" in output_lower
        )
        empty_bibliography = "empty bibliography" in output_lower
        rerun_biber = (
            "please (re)run biber" in output_lower
            or "please rerun biber" in output_lower
        )
        bibliography_resolved = (
            not has_bibliography
            or (
                biber_executed
                and biber_return_code == 0
                and bbl_path.exists()
                and not unresolved_citations
                and not empty_bibliography
                and not rerun_biber
            )
        )

        return {
            "pdf_exists_after_final_pass": pdf_path.exists(),
            "bibliography_resolved": bibliography_resolved,
            "bibliography_has_bbl": bbl_path.exists(),
            "bibliography_has_bcf": bcf_path.exists(),
            "final_unresolved_citations": unresolved_citations,
            "final_empty_bibliography": empty_bibliography,
            "final_requests_biber_rerun": rerun_biber,
        }

    # ========================================================================
    # NETTOYAGE
    # ========================================================================

    def _clean_auxiliary_files(
        self,
        *,
        tex_path: Path,
        output_dir: Path,
    ):
        """
        Supprime les fichiers auxiliaires gÃ©nÃ©rÃ©s par LaTeX.

        Le PDF et le .tex sont conservÃ©s.
        """

        extensions = {
            ".aux",
            ".log",
            ".out",
            ".toc",
            ".lof",
            ".lot",
            ".bcf",
            ".run.xml",
            ".fls",
            ".fdb_latexmk",
            ".synctex.gz",
            ".nav",
            ".snm",
        }

        # Fichiers directement associÃ©s au document.
        for extension in extensions:

            candidate = (
                output_dir
                / f"{tex_path.stem}{extension}"
            )

            try:
                if candidate.exists():
                    candidate.unlink()

            except OSError:
                # Le nettoyage ne doit jamais transformer
                # une compilation rÃ©ussie en Ã©chec.
                pass

    # ========================================================================
    # Ã‰CHEC
    # ========================================================================

    def _failure(
        self,
        *,
        start_time,
        tex_file: Optional[Path] = None,
        engine: Optional[str] = None,
        stdout: str = "",
        stderr: str = "",
        code: Optional[int] = None,
        passes: int = 0,
        errors: Optional[List[str]] = None,
        biber_executed: bool = False,
        biber_return_code: Optional[int] = None,
        biber_stdout: str = "",
        biber_stderr: str = "",
    ) -> LaTeXCompilationResult:
        duration_ms = (
            time.perf_counter()
            - start_time
        ) * 1000

        return LaTeXCompilationResult(
            success=False,
            engine=engine,
            tex_file=(
                str(tex_file)
                if tex_file
                else None
            ),
            pdf_file=None,
            return_code=code,
            stdout=stdout,
            stderr=stderr,
            duration_ms=round(
                duration_ms,
                2,
            ),
            passes=passes,
            biber_executed=biber_executed,
            biber_return_code=biber_return_code,
            biber_stdout=biber_stdout,
            biber_stderr=biber_stderr,
            errors=errors or [],
            warnings=[],
            metadata={
                "compiler_version": self.VERSION,
                "biber_enabled": self.use_biber,
            },
        )

    # ========================================================================
    # UTILITAIRE
    # ========================================================================

    @staticmethod
    def _decode_output(
        value,
    ) -> str:
        """
        Normalise la sortie de subprocess,
        notamment lors d'un timeout.
        """

        if value is None:
            return ""

        if isinstance(
            value,
            bytes,
        ):
            return value.decode(
                "utf-8",
                errors="replace",
            )

        return str(value)


# ============================================================================
# HELPER INTERNE
# ============================================================================


def re_search_latex_error(
    line: str,
) -> bool:
    """
    DÃ©tecte certaines formes d'erreurs LaTeX.
    """

    patterns = (
        r"^.*:\d+:.*error.*$",
        r"^.*\.tex:\d+:.*$",
        r"^.*LaTeX Error:.*$",
        r"^.*Package .* Error:.*$",
    )

    import re

    return any(
        re.search(
            pattern,
            line,
            re.IGNORECASE,
        )
        for pattern in patterns
    )


# ============================================================================
# FONCTION UTILITAIRE PUBLIQUE
# ============================================================================


def compile_latex(
    tex_file: str | Path,
    **kwargs,
) -> LaTeXCompilationResult:
    """
    Fonction simplifiÃ©e :

        result = compile_latex("document.tex")
    """

    compiler = LaTeXCompiler(
        **kwargs
    )

    return compiler.compile(
        tex_file
    )
