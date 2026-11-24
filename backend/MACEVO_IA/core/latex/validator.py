"""
MACEVO — Validateur LaTeX.

Vérifie un fichier/source LaTeX avant compilation.

Le validateur ne compile pas le document et ne modifie jamais
le contenu. Il détecte les problèmes pouvant empêcher une
compilation correcte ou signaler une incohérence structurelle.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional


# ============================================================================
# RÉSULTATS
# ============================================================================

@dataclass
class LaTeXIssue:
    """
    Problème détecté dans un document LaTeX.
    """

    code: str
    message: str
    severity: str = "error"
    line: Optional[int] = None

    def to_dict(self):
        return {
            "code": self.code,
            "message": self.message,
            "severity": self.severity,
            "line": self.line,
        }


@dataclass
class LaTeXValidationResult:
    """
    Résultat complet de validation.
    """

    valid: bool
    issues: List[LaTeXIssue] = field(
        default_factory=list
    )
    warnings: List[LaTeXIssue] = field(
        default_factory=list
    )
    statistics: dict = field(
        default_factory=dict
    )

    @property
    def errors(self):
        return [
            issue
            for issue in self.issues
            if issue.severity == "error"
        ]

    def to_dict(self):
        return {
            "valid": self.valid,
            "issues": [
                issue.to_dict()
                for issue in self.issues
            ],
            "warnings": [
                warning.to_dict()
                for warning in self.warnings
            ],
            "statistics": self.statistics,
        }


# ============================================================================
# VALIDATEUR
# ============================================================================

class LaTeXValidator:
    """
    Validateur structurel LaTeX MACEVO.

    Contrôles principaux :

    - documentclass ;
    - begin/end document ;
    - accolades ;
    - environnements ;
    - labels ;
    - références ;
    - figures ;
    - commandes critiques ;
    - fichiers référencés ;
    - cohérence basique des références internes.
    """

    VERSION = "1.0.0"

    # Environnements LaTeX courants.
    KNOWN_ENVIRONMENTS = {
        "document",
        "titlepage",
        "abstract",
        "equation",
        "equation*",
        "align",
        "align*",
        "alignat",
        "alignat*",
        "gather",
        "gather*",
        "multline",
        "multline*",
        "figure",
        "table",
        "tabular",
        "tabularx",
        "longtable",
        "thebibliography",
        "itemize",
        "enumerate",
        "description",
        "verbatim",
        "lstlisting",
    }

    REQUIRED_COMMANDS = {
        "documentclass",
    }

    def __init__(
        self,
        *,
        require_document_class: bool = True,
        require_document_environment: bool = True,
        check_files: bool = True,
        check_labels: bool = True,
        check_environments: bool = True,
        check_braces: bool = True,
    ):
        self.require_document_class = (
            require_document_class
        )

        self.require_document_environment = (
            require_document_environment
        )

        self.check_files = check_files
        self.check_labels = check_labels
        self.check_environments = (
            check_environments
        )
        self.check_braces = check_braces

    # ========================================================================
    # API PUBLIQUE
    # ========================================================================

    def validate(
        self,
        latex: str,
        *,
        base_dir: Optional[str | Path] = None,
    ) -> LaTeXValidationResult:
        """
        Valide une source LaTeX.

        Parameters
        ----------
        latex:
            Source LaTeX complète.

        base_dir:
            Répertoire utilisé pour vérifier les fichiers référencés
            par \\includegraphics.
        """

        if latex is None:
            return self._invalid(
                "EMPTY_SOURCE",
                "La source LaTeX est vide.",
            )

        if not isinstance(latex, str):
            return self._invalid(
                "INVALID_SOURCE_TYPE",
                "La source LaTeX doit être une chaîne de caractères.",
            )

        source = latex

        issues: List[LaTeXIssue] = []
        warnings: List[LaTeXIssue] = []

        # --------------------------------------------------------------------
        # Contrôles fondamentaux
        # --------------------------------------------------------------------

        self._check_document_class(
            source,
            issues,
        )

        self._check_document_environment(
            source,
            issues,
        )

        # --------------------------------------------------------------------
        # Accolades
        # --------------------------------------------------------------------

        if self.check_braces:
            self._check_braces(
                source,
                issues,
            )

        # --------------------------------------------------------------------
        # Environnements
        # --------------------------------------------------------------------

        if self.check_environments:
            self._check_environments(
                source,
                issues,
            )

        # --------------------------------------------------------------------
        # Labels / références
        # --------------------------------------------------------------------

        labels = set()
        references = []

        if self.check_labels:
            labels, references = (
                self._check_labels_and_references(
                    source,
                    issues,
                    warnings,
                )
            )

        # --------------------------------------------------------------------
        # Images / fichiers
        # --------------------------------------------------------------------

        image_files = []

        if self.check_files:
            image_files = (
                self._check_graphic_files(
                    source,
                    base_dir,
                    issues,
                    warnings,
                )
            )

        # --------------------------------------------------------------------
        # Commandes critiques
        # --------------------------------------------------------------------

        self._check_critical_commands(
            source,
            issues,
            warnings,
        )

        # --------------------------------------------------------------------
        # Statistiques
        # --------------------------------------------------------------------

        statistics = {
            "lines": len(
                source.splitlines()
            ),
            "characters": len(source),
            "sections": self._count_sections(
                source
            ),
            "equations": self._count_environment(
                source,
                (
                    "equation",
                    "equation*",
                    "align",
                    "align*",
                    "gather",
                    "gather*",
                ),
            ),
            "figures": self._count_environment(
                source,
                ("figure",),
            ),
            "tables": self._count_environment(
                source,
                ("table",),
            ),
            "labels": len(labels),
            "references": len(references),
            "images": len(image_files),
            "errors": len(issues),
            "warnings": len(warnings),
        }

        return LaTeXValidationResult(
            valid=len(issues) == 0,
            issues=issues,
            warnings=warnings,
            statistics=statistics,
        )

    # ========================================================================
    # FICHIER
    # ========================================================================

    def validate_file(
        self,
        path: str | Path,
    ) -> LaTeXValidationResult:
        """
        Valide directement un fichier .tex.
        """

        file_path = Path(path)

        if not file_path.exists():
            return self._invalid(
                "FILE_NOT_FOUND",
                f"Le fichier LaTeX n'existe pas : {file_path}",
            )

        if not file_path.is_file():
            return self._invalid(
                "NOT_A_FILE",
                f"Le chemin fourni n'est pas un fichier : {file_path}",
            )

        try:
            source = file_path.read_text(
                encoding="utf-8"
            )

        except UnicodeDecodeError:
            return self._invalid(
                "INVALID_ENCODING",
                (
                    "Le fichier LaTeX n'est pas lisible "
                    "comme UTF-8."
                ),
            )

        except OSError as exc:
            return self._invalid(
                "FILE_READ_ERROR",
                f"Impossible de lire le fichier : {exc}",
            )

        return self.validate(
            source,
            base_dir=file_path.parent,
        )

    # ========================================================================
    # DOCUMENT CLASS
    # ========================================================================

    def _check_document_class(
        self,
        source: str,
        issues: List[LaTeXIssue],
    ):
        if not self.require_document_class:
            return

        match = re.search(
            r"\\documentclass(?:\[[^\]]*\])?\{([^}]+)\}",
            source,
        )

        if not match:
            issues.append(
                LaTeXIssue(
                    code="MISSING_DOCUMENTCLASS",
                    message=(
                        "La commande \\documentclass "
                        "est absente."
                    ),
                    severity="error",
                    line=self._find_line(
                        source,
                        r"\\documentclass",
                    ),
                )
            )

    # ========================================================================
    # DOCUMENT ENVIRONMENT
    # ========================================================================

    def _check_document_environment(
        self,
        source: str,
        issues: List[LaTeXIssue],
    ):
        if not self.require_document_environment:
            return

        begin_count = len(
            re.findall(
                r"\\begin\{document\}",
                source,
            )
        )

        end_count = len(
            re.findall(
                r"\\end\{document\}",
                source,
            )
        )

        if begin_count == 0:
            issues.append(
                LaTeXIssue(
                    code="MISSING_BEGIN_DOCUMENT",
                    message=(
                        "La commande "
                        "\\begin{document} est absente."
                    ),
                    severity="error",
                )
            )

        if end_count == 0:
            issues.append(
                LaTeXIssue(
                    code="MISSING_END_DOCUMENT",
                    message=(
                        "La commande "
                        "\\end{document} est absente."
                    ),
                    severity="error",
                )
            )

        if begin_count > 1:
            issues.append(
                LaTeXIssue(
                    code="DUPLICATE_BEGIN_DOCUMENT",
                    message=(
                        "Plusieurs commandes "
                        "\\begin{document} ont été détectées."
                    ),
                    severity="error",
                )
            )

        if end_count > 1:
            issues.append(
                LaTeXIssue(
                    code="DUPLICATE_END_DOCUMENT",
                    message=(
                        "Plusieurs commandes "
                        "\\end{document} ont été détectées."
                    ),
                    severity="error",
                )
            )

    # ========================================================================
    # ACCOLADES
    # ========================================================================

    def _check_braces(
        self,
        source: str,
        issues: List[LaTeXIssue],
    ):
        """
        Vérification basique des accolades.

        Les commentaires sont ignorés.
        """

        balance = 0
        escaped = False

        for line_number, line in enumerate(
            source.splitlines(),
            start=1,
        ):
            clean_line = self._remove_comment(
                line
            )

            for char in clean_line:

                if char == "\\" and not escaped:
                    escaped = True
                    continue

                if char == "{" and not escaped:
                    balance += 1

                elif char == "}" and not escaped:
                    balance -= 1

                    if balance < 0:
                        issues.append(
                            LaTeXIssue(
                                code="UNBALANCED_BRACE",
                                message=(
                                    "Une accolade fermante "
                                    "est présente sans accolade "
                                    "ouvrante correspondante."
                                ),
                                severity="error",
                                line=line_number,
                            )
                        )

                        return

                escaped = False

        if balance > 0:
            issues.append(
                LaTeXIssue(
                    code="UNBALANCED_BRACE",
                    message=(
                        "Le nombre d'accolades ouvrantes "
                        "et fermantes n'est pas équilibré."
                    ),
                    severity="error",
                )
            )

    # ========================================================================
    # ENVIRONNEMENTS
    # ========================================================================

    def _check_environments(
        self,
        source: str,
        issues: List[LaTeXIssue],
    ):
        """
        Vérifie l'équilibre des \\begin / \\end.
        """

        stack = []

        pattern = re.compile(
            r"\\(begin|end)\{([^}]+)\}"
        )

        for match in pattern.finditer(
            source
        ):
            action = match.group(1)
            environment = match.group(2)

            if action == "begin":
                stack.append(
                    (
                        environment,
                        self._line_from_position(
                            source,
                            match.start(),
                        ),
                    )
                )
                continue

            # END
            if not stack:
                issues.append(
                    LaTeXIssue(
                        code="UNEXPECTED_END",
                        message=(
                            f"\\end{{{environment}}} "
                            "ne possède pas de \\begin correspondant."
                        ),
                        severity="error",
                        line=self._line_from_position(
                            source,
                            match.start(),
                        ),
                    )
                )
                continue

            opened_environment, opened_line = (
                stack.pop()
            )

            if (
                opened_environment
                != environment
            ):
                issues.append(
                    LaTeXIssue(
                        code="MISMATCHED_ENVIRONMENT",
                        message=(
                            f"Environnement ouvert "
                            f"'{opened_environment}' à la ligne "
                            f"{opened_line}, mais fermeture "
                            f"'{environment}' détectée."
                        ),
                        severity="error",
                        line=self._line_from_position(
                            source,
                            match.start(),
                        ),
                    )
                )

        for environment, line in stack:
            issues.append(
                LaTeXIssue(
                    code="UNCLOSED_ENVIRONMENT",
                    message=(
                        f"L'environnement "
                        f"'{environment}' ouvert à la ligne "
                        f"{line} n'est pas fermé."
                    ),
                    severity="error",
                    line=line,
                )
            )

    # ========================================================================
    # LABELS / REFERENCES
    # ========================================================================

    def _check_labels_and_references(
        self,
        source: str,
        issues: List[LaTeXIssue],
        warnings: List[LaTeXIssue],
    ):
        labels = set()

        # --------------------------------------------------------------
        # Labels
        # --------------------------------------------------------------

        for match in re.finditer(
            r"\\label\{([^}]+)\}",
            source,
        ):
            label = match.group(1).strip()

            line = self._line_from_position(
                source,
                match.start(),
            )

            if not label:
                issues.append(
                    LaTeXIssue(
                        code="EMPTY_LABEL",
                        message=(
                            "Un label LaTeX vide a été détecté."
                        ),
                        severity="error",
                        line=line,
                    )
                )
                continue

            if label in labels:
                issues.append(
                    LaTeXIssue(
                        code="DUPLICATE_LABEL",
                        message=(
                            f"Le label '{label}' "
                            "est défini plusieurs fois."
                        ),
                        severity="error",
                        line=line,
                    )
                )

            labels.add(label)

        # --------------------------------------------------------------
        # Références
        # --------------------------------------------------------------

        references = []

        for match in re.finditer(
            r"\\(?:ref|pageref|eqref)\{([^}]+)\}",
            source,
        ):
            label = match.group(1).strip()

            references.append(
                label
            )

            if (
                label
                and label not in labels
            ):
                warnings.append(
                    LaTeXIssue(
                        code="UNRESOLVED_REFERENCE",
                        message=(
                            f"La référence '{label}' "
                            "ne possède pas de label correspondant "
                            "dans le document LaTeX."
                        ),
                        severity="warning",
                        line=self._line_from_position(
                            source,
                            match.start(),
                        ),
                    )
                )

        return labels, references

    # ========================================================================
    # FICHIERS / IMAGES
    # ========================================================================

    def _check_graphic_files(
        self,
        source: str,
        base_dir: Optional[str | Path],
        issues: List[LaTeXIssue],
        warnings: List[LaTeXIssue],
    ):
        """
        Vérifie les fichiers utilisés par \\includegraphics.

        Une image manquante est une erreur seulement lorsqu'un
        répertoire de base est fourni.
        """

        files = []

        pattern = re.compile(
            r"\\includegraphics"
            r"(?:\[[^\]]*\])?"
            r"\{([^}]+)\}"
        )

        for match in pattern.finditer(
            source
        ):
            file_name = (
                match.group(1)
                .strip()
            )

            files.append(
                file_name
            )

            if not base_dir:
                warnings.append(
                    LaTeXIssue(
                        code="IMAGE_NOT_VERIFIED",
                        message=(
                            f"L'image '{file_name}' "
                            "n'a pas été vérifiée car aucun "
                            "répertoire de base n'a été fourni."
                        ),
                        severity="warning",
                        line=self._line_from_position(
                            source,
                            match.start(),
                        ),
                    )
                )
                continue

            path = Path(
                base_dir
            ) / file_name

            candidates = [
                path,
                Path(
                    str(path) + ".png"
                ),
                Path(
                    str(path) + ".jpg"
                ),
                Path(
                    str(path) + ".jpeg"
                ),
                Path(
                    str(path) + ".pdf"
                ),
            ]

            if not any(
                candidate.exists()
                for candidate in candidates
            ):
                issues.append(
                    LaTeXIssue(
                        code="MISSING_IMAGE",
                        message=(
                            f"Le fichier image "
                            f"'{file_name}' est introuvable."
                        ),
                        severity="error",
                        line=self._line_from_position(
                            source,
                            match.start(),
                        ),
                    )
                )

        return files

    # ========================================================================
    # COMMANDES CRITIQUES
    # ========================================================================

    def _check_critical_commands(
        self,
        source: str,
        issues: List[LaTeXIssue],
        warnings: List[LaTeXIssue],
    ):
        """
        Vérifie quelques problèmes fréquents.
        """

        # ----------------------------------------------------------------
        # Fontspec nécessite normalement XeLaTeX/LuaLaTeX.
        # ----------------------------------------------------------------

        if (
            r"\usepackage{fontspec}"
            in source
        ):
            warnings.append(
                LaTeXIssue(
                    code="FONTspec_REQUIRES_UNICODE_ENGINE",
                    message=(
                        "Le document utilise fontspec. "
                        "XeLaTeX ou LuaLaTeX est recommandé "
                        "pour la compilation."
                    ),
                    severity="warning",
                )
            )

        # ----------------------------------------------------------------
        # Polyglossia
        # ----------------------------------------------------------------

        if (
            r"\usepackage{polyglossia}"
            in source
            and r"\usepackage{babel}"
            in source
        ):
            issues.append(
                LaTeXIssue(
                    code="CONFLICTING_LANGUAGE_PACKAGES",
                    message=(
                        "polyglossia et babel sont utilisés "
                        "simultanément. Une seule stratégie "
                        "de gestion linguistique doit être utilisée."
                    ),
                    severity="error",
                )
            )

        # ----------------------------------------------------------------
        # biblatex sans références
        # ----------------------------------------------------------------

        if (
            r"\usepackage[" in source
            and "biblatex" in source
            and r"\begin{thebibliography}" not in source
            and r"\printbibliography" not in source
        ):
            warnings.append(
                LaTeXIssue(
                    code="BIBLATEX_WITHOUT_BIBLIOGRAPHY",
                    message=(
                        "biblatex est chargé mais aucune "
                        "bibliographie externe n'est imprimée."
                    ),
                    severity="warning",
                )
            )

    # ========================================================================
    # STATISTIQUES
    # ========================================================================

    def _count_sections(
        self,
        source: str,
    ) -> int:
        return len(
            re.findall(
                r"\\(?:chapter|section|subsection|subsubsection)\{",
                source,
            )
        )

    def _count_environment(
        self,
        source: str,
        environments,
    ) -> int:
        total = 0

        for environment in environments:
            total += len(
                re.findall(
                    rf"\\begin\{{{re.escape(environment)}\}}",
                    source,
                )
            )

        return total

    # ========================================================================
    # OUTILS LIGNES
    # ========================================================================

    def _find_line(
        self,
        source: str,
        pattern: str,
    ) -> Optional[int]:
        match = re.search(
            pattern,
            source,
        )

        if not match:
            return None

        return self._line_from_position(
            source,
            match.start(),
        )

    def _line_from_position(
        self,
        source: str,
        position: int,
    ) -> int:
        return (
            source.count(
                "\n",
                0,
                position,
            )
            + 1
        )

    def _remove_comment(
        self,
        line: str,
    ) -> str:
        """
        Supprime les commentaires simples.

        Un % précédé d'un backslash n'est pas considéré
        comme un début de commentaire.
        """

        result = []
        escaped = False

        for char in line:

            if char == "%" and not escaped:
                break

            result.append(char)

            if char == "\\":
                escaped = not escaped
            else:
                escaped = False

        return "".join(result)

    # ========================================================================
    # HELPERS RÉSULTAT
    # ========================================================================

    def _invalid(
        self,
        code: str,
        message: str,
    ) -> LaTeXValidationResult:
        return LaTeXValidationResult(
            valid=False,
            issues=[
                LaTeXIssue(
                    code=code,
                    message=message,
                    severity="error",
                )
            ],
            warnings=[],
            statistics={
                "errors": 1,
                "warnings": 0,
            },
        )


# ============================================================================
# FONCTION UTILITAIRE
# ============================================================================

def validate_latex(
    latex: str,
    **kwargs,
) -> LaTeXValidationResult:
    """
    Fonction pratique :

        result = validate_latex(latex)
    """

    validator = LaTeXValidator(
        **kwargs
    )

    return validator.validate(
        latex
    )