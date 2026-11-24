"""
==========================================================
MACEVO IA
LaTeX Templates
==========================================================

Registre central des modèles LaTeX disponibles dans MACEVO.

Responsabilités :
- déclarer les templates LaTeX supportés ;
- fournir leurs métadonnées ;
- normaliser les noms et alias ;
- permettre au moteur LaTeX de sélectionner un template ;
- préparer l'intégration future avec le Document IR ;
- rester indépendant du compilateur LaTeX.

Ce module ne compile pas de LaTeX.
==========================================================
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional


class LatexTemplates:
    """
    Registre central des templates LaTeX MACEVO.

    Les constantes sont volontairement conservées sous forme de chaînes
    simples afin de rester compatibles avec le code existant.
    """

    # ======================================================
    # TEMPLATES SCIENTIFIQUES
    # ======================================================

    IEEE = "ieee"
    ACM = "acm"
    SPRINGER = "springer"
    ELSEVIER = "elsevier"
    NATURE = "nature"

    # ======================================================
    # PRÉSENTATIONS
    # ======================================================

    BEAMER = "beamer"

    # ======================================================
    # DOCUMENTS ACADÉMIQUES
    # ======================================================

    MEMOIRE = "memoire"
    DOCTORAT = "doctorat"

    # ======================================================
    # DOCUMENTS GÉNÉRIQUES
    # ======================================================

    ARTICLE = "article"
    REPORT = "report"
    BOOK = "book"

    # ======================================================
    # MÉTADONNÉES
    # ======================================================

    _TEMPLATES: Dict[str, Dict[str, Any]] = {
        IEEE: {
            "name": "IEEE",
            "category": "scientific",
            "document_class": "IEEEtran",
            "description": "Template scientifique pour articles et publications IEEE.",
            "supports": [
                "article",
                "scientific_article",
                "research_paper",
            ],
        },
        ACM: {
            "name": "ACM",
            "category": "scientific",
            "document_class": "acmart",
            "description": "Template scientifique pour publications ACM.",
            "supports": [
                "article",
                "scientific_article",
                "research_paper",
            ],
        },
        SPRINGER: {
            "name": "Springer",
            "category": "scientific",
            "document_class": "svjour3",
            "description": "Template destiné aux publications scientifiques Springer.",
            "supports": [
                "article",
                "scientific_article",
                "research_paper",
            ],
        },
        ELSEVIER: {
            "name": "Elsevier",
            "category": "scientific",
            "document_class": "elsarticle",
            "description": "Template pour articles scientifiques Elsevier.",
            "supports": [
                "article",
                "scientific_article",
                "research_paper",
            ],
        },
        NATURE: {
            "name": "Nature",
            "category": "scientific",
            "document_class": "article",
            "description": "Template orienté publications scientifiques de type Nature.",
            "supports": [
                "article",
                "scientific_article",
                "research_paper",
            ],
        },
        BEAMER: {
            "name": "Beamer",
            "category": "presentation",
            "document_class": "beamer",
            "description": "Template LaTeX pour présentations scientifiques.",
            "supports": [
                "presentation",
                "slides",
                "conference",
            ],
        },
        MEMOIRE: {
            "name": "Mémoire",
            "category": "academic",
            "document_class": "report",
            "description": "Template académique pour mémoires et travaux universitaires.",
            "supports": [
                "memoire",
                "dissertation",
                "academic_report",
            ],
        },
        DOCTORAT: {
            "name": "Doctorat",
            "category": "academic",
            "document_class": "report",
            "description": "Template académique pour thèses et travaux doctoraux.",
            "supports": [
                "doctorat",
                "thesis",
                "phd",
                "doctoral_thesis",
            ],
        },
        ARTICLE: {
            "name": "Article",
            "category": "generic",
            "document_class": "article",
            "description": "Template générique pour articles LaTeX.",
            "supports": [
                "article",
                "paper",
            ],
        },
        REPORT: {
            "name": "Report",
            "category": "generic",
            "document_class": "report",
            "description": "Template générique pour rapports structurés.",
            "supports": [
                "report",
                "rapport",
                "academic_report",
            ],
        },
        BOOK: {
            "name": "Book",
            "category": "generic",
            "document_class": "book",
            "description": "Template générique pour livres et documents longs.",
            "supports": [
                "book",
                "ouvrage",
                "long_document",
            ],
        },
    }

    # ======================================================
    # ALIAS
    # ======================================================

    _ALIASES: Dict[str, str] = {
        "ieee": IEEE,
        "ieee tran": IEEE,
        "ieee tran": IEEE,

        "acm": ACM,

        "springer": SPRINGER,

        "elsevier": ELSEVIER,

        "nature": NATURE,

        "beamer": BEAMER,
        "presentation": BEAMER,
        "slides": BEAMER,

        "memoire": MEMOIRE,
        "mémoire": MEMOIRE,

        "doctorat": DOCTORAT,
        "thesis": DOCTORAT,
        "phd": DOCTORAT,
        "doctoral": DOCTORAT,
        "doctoral thesis": DOCTORAT,
        "thèse": DOCTORAT,

        "article": ARTICLE,
        "paper": ARTICLE,

        "report": REPORT,
        "rapport": REPORT,

        "book": BOOK,
        "livre": BOOK,
        "ouvrage": BOOK,
    }

    # ======================================================
    # API PRINCIPALE
    # ======================================================

    @classmethod
    def available(cls) -> List[str]:
        """
        Retourne la liste des identifiants de templates disponibles.

        Compatible avec l'ancienne API.
        """
        return list(cls._TEMPLATES.keys())

    @classmethod
    def all(cls) -> List[str]:
        """
        Alias de ``available``.
        """
        return cls.available()

    @classmethod
    def normalize(cls, template: Optional[str]) -> str:
        """
        Normalise un nom ou alias de template.

        Exemple :
            "Mémoire" -> "memoire"
            "Thèse" -> "doctorat"
            "IEEE" -> "ieee"
        """
        if not template:
            return cls.ARTICLE

        value = str(template).strip().lower()

        if value in cls._TEMPLATES:
            return value

        if value in cls._ALIASES:
            return cls._ALIASES[value]

        return value

    @classmethod
    def is_available(cls, template: Optional[str]) -> bool:
        """
        Indique si un template existe.
        """
        normalized = cls.normalize(template)
        return normalized in cls._TEMPLATES

    @classmethod
    def exists(cls, template: Optional[str]) -> bool:
        """
        Alias de ``is_available``.
        """
        return cls.is_available(template)

    # ======================================================
    # INFORMATIONS
    # ======================================================

    @classmethod
    def get(cls, template: Optional[str]) -> Dict[str, Any]:
        """
        Retourne les métadonnées d'un template.

        Retourne un dictionnaire vide si le template est inconnu.
        """
        normalized = cls.normalize(template)

        data = cls._TEMPLATES.get(normalized)

        if not data:
            return {}

        return {
            "id": normalized,
            **data,
        }

    @classmethod
    def info(cls, template: Optional[str]) -> Dict[str, Any]:
        """
        Alias de ``get``.
        """
        return cls.get(template)

    @classmethod
    def document_class(cls, template: Optional[str]) -> Optional[str]:
        """
        Retourne la classe LaTeX associée au template.
        """
        data = cls.get(template)

        return data.get("document_class")

    @classmethod
    def name(cls, template: Optional[str]) -> Optional[str]:
        """
        Retourne le nom lisible du template.
        """
        data = cls.get(template)

        return data.get("name")

    @classmethod
    def description(cls, template: Optional[str]) -> Optional[str]:
        """
        Retourne la description du template.
        """
        data = cls.get(template)

        return data.get("description")

    # ======================================================
    # CATÉGORIES
    # ======================================================

    @classmethod
    def categories(cls) -> List[str]:
        """
        Retourne les catégories disponibles.
        """
        return sorted(
            {
                data.get("category")
                for data in cls._TEMPLATES.values()
                if data.get("category")
            }
        )

    @classmethod
    def by_category(cls, category: str) -> List[str]:
        """
        Retourne les templates appartenant à une catégorie.
        """
        if not category:
            return []

        category = str(category).strip().lower()

        return [
            template_id
            for template_id, data in cls._TEMPLATES.items()
            if data.get("category") == category
        ]

    # ======================================================
    # COMPATIBILITÉ AVEC UN TYPE DE DOCUMENT
    # ======================================================

    @classmethod
    def supports_document_type(
        cls,
        template: Optional[str],
        document_type: Optional[str],
    ) -> bool:
        """
        Vérifie si un template est adapté à un type de document.
        """
        if not document_type:
            return False

        data = cls.get(template)

        supported_types = data.get("supports", [])

        document_type = str(document_type).strip().lower()

        return document_type in supported_types

    @classmethod
    def recommended_for(
        cls,
        document_type: Optional[str],
    ) -> List[str]:
        """
        Retourne les templates compatibles avec un type de document.

        Cette méthode servira notamment au futur moteur intelligent
        de sélection des templates MACEVO.
        """
        if not document_type:
            return []

        document_type = str(document_type).strip().lower()

        return [
            template_id
            for template_id, data in cls._TEMPLATES.items()
            if document_type in data.get("supports", [])
        ]

    # ======================================================
    # VALIDATION
    # ======================================================

    @classmethod
    def validate(cls, template: Optional[str]) -> Dict[str, Any]:
        """
        Valide un template et retourne un résultat exploitable.
        """
        normalized = cls.normalize(template)

        if normalized not in cls._TEMPLATES:
            return {
                "valid": False,
                "template": normalized,
                "error": f"Template LaTeX inconnu : {template}",
            }

        data = cls._TEMPLATES[normalized]

        return {
            "valid": True,
            "template": normalized,
            "name": data.get("name"),
            "category": data.get("category"),
            "document_class": data.get("document_class"),
        }

    # ======================================================
    # REGISTRE COMPLET
    # ======================================================

    @classmethod
    def registry(cls) -> Dict[str, Dict[str, Any]]:
        """
        Retourne une copie du registre complet.

        Une copie est retournée afin d'éviter qu'un appel externe
        modifie accidentellement le registre interne.
        """
        return {
            template_id: dict(data)
            for template_id, data in cls._TEMPLATES.items()
        }

    # ======================================================
    # INFORMATIONS GÉNÉRALES
    # ======================================================

    @classmethod
    def statistics(cls) -> Dict[str, Any]:
        """
        Retourne des statistiques sur les templates disponibles.
        """
        categories = cls.categories()

        return {
            "count": len(cls._TEMPLATES),
            "categories": categories,
            "by_category": {
                category: len(cls.by_category(category))
                for category in categories
            },
        }

    @classmethod
    def info_all(cls) -> Dict[str, Any]:
        """
        Retourne une vue générale du registre.
        """
        return {
            "templates": cls.registry(),
            "available": cls.available(),
            "categories": cls.categories(),
            "statistics": cls.statistics(),
        }