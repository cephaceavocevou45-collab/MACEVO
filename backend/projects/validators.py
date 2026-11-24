
"""
==========================================================
MACEVO IA
Projects Validators
==========================================================

Validateurs métier des projets scientifiques.

Principe :
    - validation réutilisable par les services ;
    - messages d'erreur explicites ;
    - compatibilité Django / DRF ;
    - aucune logique de sauvegarde ;
    - cohérence avec ScientificProject.
"""

from __future__ import annotations

from numbers import Real

from django.core.exceptions import ValidationError

from .models import ScientificProject


# ==========================================================
# CONSTANTES
# ==========================================================

LATEX_TEMPLATES = frozenset(
    {
        "ieee",
        "acm",
        "springer",
        "elsevier",
        "nature",
        "beamer",
        "memoire",
        "these",
        "article",
        "report",
        "book",
        "doctorat",
    }
)


CITATION_STYLES = frozenset(
    {
        "ieee",
        "apa",
        "mla",
        "chicago",
        "bibtex",
    }
)


EXPORT_FORMATS = frozenset(
    {
        "pdf",
        "word",
        "docx",
        "latex",
        "html",
    }
)


# ==========================================================
# OUTILS INTERNES
# ==========================================================

def _clean_string(
    value,
    field_name: str,
    *,
    required: bool = False,
    min_length: int | None = None,
    max_length: int | None = None,
) -> str:
    """
    Nettoie et valide une chaîne de caractères.
    """

    if value is None:
        if required:
            raise ValidationError(
                f"{field_name} est obligatoire."
            )

        return ""

    if not isinstance(value, str):
        raise ValidationError(
            f"{field_name} doit être une chaîne de caractères."
        )

    value = value.strip()

    if required and not value:
        raise ValidationError(
            f"{field_name} est obligatoire."
        )

    if min_length is not None and value:
        if len(value) < min_length:
            raise ValidationError(
                f"{field_name} doit contenir au moins "
                f"{min_length} caractères."
            )

    if max_length is not None and len(value) > max_length:
        raise ValidationError(
            f"{field_name} ne peut pas dépasser "
            f"{max_length} caractères."
        )

    return value


def _choice_values(
    choices,
) -> set:
    """
    Retourne l'ensemble des valeurs d'un champ Django
    utilisant une liste de choix.
    """

    return {
        value
        for value, _label in choices
    }


# ==========================================================
# TITRE
# ==========================================================

def validate_project_title(title):
    """
    Valide le titre d'un projet scientifique.
    """

    return _clean_string(
        title,
        "Le titre",
        required=True,
        min_length=5,
        max_length=255,
    )


# ==========================================================
# SUJET
# ==========================================================

def validate_project_subject(subject):
    """
    Valide le sujet du projet.
    """

    return _clean_string(
        subject,
        "Le sujet",
        required=True,
        min_length=5,
        max_length=255,
    )


# ==========================================================
# DESCRIPTION
# ==========================================================

def validate_project_description(description):
    """
    Nettoie la description du projet.
    """

    return _clean_string(
        description,
        "La description",
    )


# ==========================================================
# RÉSUMÉ
# ==========================================================

def validate_project_abstract(abstract):
    """
    Nettoie le résumé scientifique.
    """

    return _clean_string(
        abstract,
        "Le résumé",
    )


# ==========================================================
# CONTENU
# ==========================================================

def validate_project_content(content):
    """
    Nettoie le contenu principal du projet.

    Le contenu peut être du texte, du HTML, du contenu
    Tiptap/ProseMirror ou ultérieurement une représentation
    structurée du Document IR.
    """

    return _clean_string(
        content,
        "Le contenu",
    )


# ==========================================================
# MOTS-CLÉS
# ==========================================================

def validate_project_keywords(keywords):
    """
    Nettoie les mots-clés.
    """

    return _clean_string(
        keywords,
        "Les mots-clés",
    )


# ==========================================================
# TYPE DE PROJET
# ==========================================================

def validate_project_type(project_type):
    """
    Valide le type de projet scientifique.
    """

    values = _choice_values(
        ScientificProject.PROJECT_TYPES
    )

    if project_type not in values:
        raise ValidationError(
            "Type de projet invalide."
        )

    return project_type


# ==========================================================
# NIVEAU
# ==========================================================

def validate_project_level(level):
    """
    Valide le niveau académique.
    """

    values = _choice_values(
        ScientificProject.LEVELS
    )

    if level not in values:
        raise ValidationError(
            "Niveau académique invalide."
        )

    return level


# ==========================================================
# LANGUE
# ==========================================================

def validate_project_language(language):
    """
    Valide la langue du projet.

    On utilise directement les choix déclarés par le modèle
    afin d'avoir une seule source de vérité.
    """

    choices = getattr(
        ScientificProject,
        "LANGUAGES",
        None,
    )

    if choices is None:
        choices = getattr(
            ScientificProject,
            "LANGUAGE_CHOICES",
            (),
        )

    values = _choice_values(choices)

    if language not in values:
        raise ValidationError(
            "Langue non supportée."
        )

    return language


# ==========================================================
# TEMPLATE LATEX
# ==========================================================

def validate_latex_template(template):
    """
    Valide le template LaTeX du projet.

    Les templates supplémentaires permettent à MACEVO
    d'évoluer vers les mémoires, thèses, articles et
    documents scientifiques avancés.
    """

    if template not in LATEX_TEMPLATES:
        raise ValidationError(
            "Template LaTeX invalide."
        )

    return template


# ==========================================================
# STYLE BIBLIOGRAPHIQUE
# ==========================================================

def validate_citation_style(style):
    """
    Valide le style bibliographique.
    """

    if style not in CITATION_STYLES:
        raise ValidationError(
            "Style bibliographique invalide."
        )

    return style


# ==========================================================
# FORMAT D'EXPORT
# ==========================================================

def validate_export_format(export_format):
    """
    Valide le format d'export.
    """

    if export_format not in EXPORT_FORMATS:
        raise ValidationError(
            "Format d'export invalide."
        )

    return export_format


# ==========================================================
# PROGRESSION
# ==========================================================

def validate_progress(progress):
    """
    Valide la progression d'un projet.

    Valeur attendue : nombre compris entre 0 et 100.
    """

    if isinstance(progress, bool) or not isinstance(
        progress,
        Real,
    ):
        raise ValidationError(
            "La progression doit être un nombre."
        )

    if progress < 0 or progress > 100:
        raise ValidationError(
            "La progression doit être comprise "
            "entre 0 et 100."
        )

    return progress


# ==========================================================
# VERSION
# ==========================================================

def validate_project_version(version):
    """
    Valide la version du projet.
    """

    return _clean_string(
        version,
        "La version",
        max_length=20,
    )


# ==========================================================
# UTILITAIRE DE VALIDATION GLOBAL
# ==========================================================

def validate_project_data(data):
    """
    Valide les principaux champs d'un projet.

    Cette fonction est volontairement indépendante du modèle
    afin de pouvoir être utilisée par ProjectService, les
    importateurs et les futures opérations IA.
    """

    if not isinstance(data, dict):
        raise ValidationError(
            "Les données du projet doivent être fournies "
            "sous forme de dictionnaire."
        )

    validators = {
        "title": validate_project_title,
        "subject": validate_project_subject,
        "description": validate_project_description,
        "abstract": validate_project_abstract,
        "content": validate_project_content,
        "keywords": validate_project_keywords,
        "project_type": validate_project_type,
        "level": validate_project_level,
        "language": validate_project_language,
        "latex_template": validate_latex_template,
        "citation_style": validate_citation_style,
        "export_format": validate_export_format,
        "progress": validate_progress,
        "version": validate_project_version,
    }

    errors = {}
    cleaned_data = dict(data)

    for field_name, validator in validators.items():

        if field_name not in data:
            continue

        try:
            cleaned_data[field_name] = validator(
                data[field_name]
            )

        except ValidationError as exc:
            errors[field_name] = exc.messages

    if errors:
        raise ValidationError(errors)

    return cleaned_data
