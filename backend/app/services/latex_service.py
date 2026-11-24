from pathlib import Path
import shutil
import subprocess
import uuid


class LatexService:

    def __init__(self):
        self.pdflatex = self._find_pdflatex()

        self.storage_dir = (
            Path(__file__).resolve().parent.parent
            / "storage"
            / "latex"
        )

        self.storage_dir.mkdir(
            parents=True,
            exist_ok=True
        )

    # ======================================================
    # RECHERCHE DE PDFLATEX
    # ======================================================

    def _find_pdflatex(self):

        executable = shutil.which("pdflatex")

        if executable:
            return executable

        candidates = [
            Path(
                r"C:\Program Files\MiKTeX\miktex\bin\x64\pdflatex.exe"
            ),
            Path(
                r"C:\Users\ORIGINAL\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe"
            ),
        ]

        for candidate in candidates:

            if candidate.exists():
                return str(candidate)

        raise RuntimeError(
            "pdflatex est introuvable. "
            "Vérifiez l'installation de MiKTeX."
        )

    # ======================================================
    # DOSSIER D'UNE COMPILATION
    # ======================================================

    def _get_compilation_dir(self, compilation_id):

        directory = (
            self.storage_dir
            / compilation_id
        )

        directory.mkdir(
            parents=True,
            exist_ok=True
        )

        return directory

    # ======================================================
    # COMPILATION
    # ======================================================

    def compile(self, latex: str):

        # --------------------------------------------------
        # VALIDATION
        # --------------------------------------------------

        if not latex or not latex.strip():

            return {
                "success": False,
                "latex": "",
                "pdf": None,
                "statistics": {},
                "compilationId": None,

                "validation": {
                    "success": False,
                    "errors": [
                        {
                            "message":
                                "Le document LaTeX est vide."
                        }
                    ],
                },

                "logs": "",
            }

        # --------------------------------------------------
        # IDENTIFIANT
        # --------------------------------------------------

        compilation_id = str(uuid.uuid4())

        compilation_dir = (
            self._get_compilation_dir(
                compilation_id
            )
        )

        tex_file = (
            compilation_dir
            / "document.tex"
        )

        pdf_file = (
            compilation_dir
            / "document.pdf"
        )

        log_file = (
            compilation_dir
            / "document.log"
        )

        # --------------------------------------------------
        # ÉCRITURE DU TEX
        # --------------------------------------------------

        tex_file.write_text(
            latex,
            encoding="utf-8"
        )

        # --------------------------------------------------
        # COMMANDE PDFLATEX
        # --------------------------------------------------

        command = [
            self.pdflatex,

            "-interaction=nonstopmode",

            "-halt-on-error",

            "-file-line-error",

            "-output-directory",

            str(compilation_dir),

            str(tex_file),
        ]

        # --------------------------------------------------
        # EXECUTION
        # --------------------------------------------------

        try:

            process = subprocess.run(

                command,

                cwd=str(
                    compilation_dir
                ),

                capture_output=True,

                text=True,

                encoding="utf-8",

                errors="replace",

                timeout=60,
            )

        except subprocess.TimeoutExpired:

            return {
                "success": False,
                "latex": latex,
                "pdf": None,
                "statistics": {},

                "compilationId":
                    compilation_id,

                "validation": {
                    "success": False,

                    "errors": [
                        {
                            "message":
                                "La compilation LaTeX a dépassé "
                                "la durée maximale de 60 secondes."
                        }
                    ],
                },

                "logs": "",
            }

        except Exception as error:

            return {
                "success": False,
                "latex": latex,
                "pdf": None,
                "statistics": {},

                "compilationId":
                    compilation_id,

                "validation": {
                    "success": False,

                    "errors": [
                        {
                            "message":
                                str(error)
                        }
                    ],
                },

                "logs": "",
            }

        # --------------------------------------------------
        # LOGS
        # --------------------------------------------------

        logs = (
            process.stdout
            + "\n"
            + process.stderr
        )

        if log_file.exists():

            try:

                logs += (
                    "\n"
                    + log_file.read_text(
                        encoding="utf-8",
                        errors="replace"
                    )
                )

            except Exception:
                pass

        # --------------------------------------------------
        # ÉCHEC
        # --------------------------------------------------

        if (
            process.returncode != 0
            or not pdf_file.exists()
        ):

            return {
                "success": False,
                "latex": latex,
                "pdf": None,
                "statistics": {},

                "compilationId":
                    compilation_id,

                "validation": {
                    "success": False,

                    "errors": [
                        {
                            "message":
                                "La compilation LaTeX a échoué."
                        }
                    ],
                },

                "logs": logs,
            }

        # --------------------------------------------------
        # SUCCÈS
        # --------------------------------------------------

        pdf_size = pdf_file.stat().st_size

        return {
            "success": True,

            "latex": latex,

            # IMPORTANT :
            # On retourne l'identifiant et non le chemin
            # physique du serveur.
            "pdf": (
                f"/api/latex/pdf/"
                f"{compilation_id}"
            ),

            "statistics": {
                "pdfSize": pdf_size,
            },

            "compilationId":
                compilation_id,

            "validation": {
                "success": True,
                "errors": [],
            },

            "logs": logs,
        }

    # ======================================================
    # RÉCUPÉRER LE PDF
    # ======================================================

    def get_pdf(self, compilation_id):

        if not compilation_id:
            return None

        pdf_file = (
            self.storage_dir
            / compilation_id
            / "document.pdf"
        )

        if not pdf_file.exists():
            return None

        return pdf_file

    # ======================================================
    # COMPATIBILITÉ
    # ======================================================

    def get_pdf_path(self, compilation_id):

        return self.get_pdf(
            compilation_id
        )

    # ======================================================
    # RÉCUPÉRER LES LOGS
    # ======================================================

    def get_logs(self, compilation_id):

        if not compilation_id:
            return ""

        log_file = (
            self.storage_dir
            / compilation_id
            / "document.log"
        )

        if not log_file.exists():
            return ""

        return log_file.read_text(
            encoding="utf-8",
            errors="replace"
        )


# ==========================================================
# INSTANCE UNIQUE
# ==========================================================

latex_service = LatexService()