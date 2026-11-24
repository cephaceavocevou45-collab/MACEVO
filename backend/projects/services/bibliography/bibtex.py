
"""
==========================================================
MACEVO IA
BibTeX Service
==========================================================

Génération et normalisation des entrées BibTeX.

Le service est indépendant du moteur IA et peut être utilisé
par :
    - bibliography_service.py
    - les importateurs BibTeX ;
    - l'éditeur scientifique ;
    - les exports LaTeX ;
    - le moteur de références MACEVO.
"""


class BibTeXService:
    """
    Générateur d'entrées BibTeX.

    Les champs vides sont automatiquement ignorés.
    """

    STYLE = "BibTeX"

    # ======================================================
    # UTILITAIRES
    # ======================================================

    @staticmethod
    def _clean(value):
        """
        Nettoie une valeur bibliographique.
        """

        if value is None:
            return ""

        return str(value).strip()

    @staticmethod
    def _escape(value):
        """
        Protège les caractères spéciaux BibTeX.

        Les accolades existantes sont volontairement conservées
        afin de permettre au développeur de contrôler certains
        éléments typographiques.
        """

        value = BibTeXService._clean(value)

        if not value:
            return ""

        replacements = {
            "\\": r"\textbackslash{}",
            "&": r"\&",
            "%": r"\%",
            "$": r"\$",
            "#": r"\#",
            "_": r"\_",
        }

        for char, replacement in replacements.items():
            value = value.replace(char, replacement)

        return value

    @classmethod
    def _field(cls, name, value):
        """
        Génère un champ BibTeX s'il possède une valeur.
        """

        value = cls._escape(value)

        if not value:
            return None

        return f"  {name} = {{{value}}}"

    @classmethod
    def _entry(cls, entry_type, citation_key, fields):
        """
        Construit une entrée BibTeX complète.
        """

        citation_key = cls._clean(citation_key)

        if not citation_key:
            raise ValueError(
                "La clé de citation BibTeX est obligatoire."
            )

        valid_fields = [
            field
            for field in fields
            if field
        ]

        lines = [
            f"@{entry_type}{{{citation_key},"
        ]

        lines.extend(
            f"{field},"
            for field in valid_fields[:-1]
        )

        if valid_fields:
            lines.append(valid_fields[-1])

        lines.append("}")

        return "\n".join(lines)

    # ======================================================
    # ARTICLE
    # ======================================================

    @classmethod
    def article(
        cls,
        citation_key,
        author,
        title,
        journal,
        year,
        volume="",
        number="",
        pages="",
        doi="",
        url="",
        publisher="",
    ):
        """
        Génère une entrée BibTeX de type @article.
        """

        fields = [
            cls._field("author", author),
            cls._field("title", title),
            cls._field("journal", journal),
            cls._field("year", year),
            cls._field("volume", volume),
            cls._field("number", number),
            cls._field("pages", pages),
            cls._field("publisher", publisher),
            cls._field("doi", doi),
            cls._field("url", url),
        ]

        return cls._entry(
            "article",
            citation_key,
            fields,
        )

    # ======================================================
    # LIVRE
    # ======================================================

    @classmethod
    def book(
        cls,
        citation_key,
        author,
        title,
        publisher,
        year,
        edition="",
        volume="",
        series="",
        isbn="",
        doi="",
        url="",
    ):
        """
        Génère une entrée BibTeX de type @book.
        """

        fields = [
            cls._field("author", author),
            cls._field("title", title),
            cls._field("publisher", publisher),
            cls._field("year", year),
            cls._field("edition", edition),
            cls._field("volume", volume),
            cls._field("series", series),
            cls._field("isbn", isbn),
            cls._field("doi", doi),
            cls._field("url", url),
        ]

        return cls._entry(
            "book",
            citation_key,
            fields,
        )

    # ======================================================
    # CHAPITRE
    # ======================================================

    @classmethod
    def inbook(
        cls,
        citation_key,
        author,
        title,
        booktitle,
        year,
        publisher="",
        editor="",
        pages="",
        chapter="",
        volume="",
        series="",
        doi="",
        url="",
    ):
        """
        Génère une entrée BibTeX de type @inbook.
        """

        fields = [
            cls._field("author", author),
            cls._field("editor", editor),
            cls._field("title", title),
            cls._field("booktitle", booktitle),
            cls._field("chapter", chapter),
            cls._field("pages", pages),
            cls._field("publisher", publisher),
            cls._field("year", year),
            cls._field("volume", volume),
            cls._field("series", series),
            cls._field("doi", doi),
            cls._field("url", url),
        ]

        return cls._entry(
            "inbook",
            citation_key,
            fields,
        )

    # ======================================================
    # THÈSE
    # ======================================================

    @classmethod
    def phdthesis(
        cls,
        citation_key,
        author,
        title,
        school,
        year,
        month="",
        address="",
        doi="",
        url="",
    ):
        """
        Génère une entrée BibTeX de type @phdthesis.
        """

        fields = [
            cls._field("author", author),
            cls._field("title", title),
            cls._field("school", school),
            cls._field("year", year),
            cls._field("month", month),
            cls._field("address", address),
            cls._field("doi", doi),
            cls._field("url", url),
        ]

        return cls._entry(
            "phdthesis",
            citation_key,
            fields,
        )

    # ======================================================
    # MÉMOIRE / MASTER
    # ======================================================

    @classmethod
    def masterthesis(
        cls,
        citation_key,
        author,
        title,
        school,
        year,
        month="",
        address="",
        doi="",
        url="",
    ):
        """
        Génère une entrée BibTeX de type @mastersthesis.
        """

        fields = [
            cls._field("author", author),
            cls._field("title", title),
            cls._field("school", school),
            cls._field("year", year),
            cls._field("month", month),
            cls._field("address", address),
            cls._field("doi", doi),
            cls._field("url", url),
        ]

        return cls._entry(
            "mastersthesis",
            citation_key,
            fields,
        )

    # ======================================================
    # RAPPORT
    # ======================================================

    @classmethod
    def techreport(
        cls,
        citation_key,
        author,
        title,
        institution,
        year,
        number="",
        address="",
        doi="",
        url="",
    ):
        """
        Génère une entrée BibTeX de type @techreport.
        """

        fields = [
            cls._field("author", author),
            cls._field("title", title),
            cls._field("institution", institution),
            cls._field("year", year),
            cls._field("number", number),
            cls._field("address", address),
            cls._field("doi", doi),
            cls._field("url", url),
        ]

        return cls._entry(
            "techreport",
            citation_key,
            fields,
        )

    # ======================================================
    # PAGE WEB
    # ======================================================

    @classmethod
    def misc(
        cls,
        citation_key,
        author="",
        title="",
        year="",
        howpublished="",
        note="",
        url="",
    ):
        """
        Génère une entrée BibTeX générique @misc.
        """

        fields = [
            cls._field("author", author),
            cls._field("title", title),
            cls._field("year", year),
            cls._field("howpublished", howpublished),
            cls._field("note", note),
            cls._field("url", url),
        ]

        return cls._entry(
            "misc",
            citation_key,
            fields,
        )

    # ======================================================
    # NORMALISATION D'UNE ENTRÉE
    # ======================================================

    @classmethod
    def normalize_key(cls, citation_key):
        """
        Normalise une clé de citation.

        Exemple :
            "Dupont 2024 étude"
            -> "Dupont2024etude"
        """

        value = cls._clean(citation_key)

        if not value:
            raise ValueError(
                "La clé BibTeX ne peut pas être vide."
            )

        normalized = "".join(
            character
            for character in value
            if character.isalnum()
            or character in "_:-"
        )

        if not normalized:
            raise ValueError(
                "La clé BibTeX ne contient aucun caractère valide."
            )

        return normalized

    # ======================================================
    # INFORMATIONS
    # ======================================================

    @classmethod
    def info(cls):
        """
        Retourne les informations du service.
        """

        return {
            "style": cls.STYLE,
            "supported_types": [
                "article",
                "book",
                "inbook",
                "phdthesis",
                "mastersthesis",
                "techreport",
                "misc",
            ],
        }
