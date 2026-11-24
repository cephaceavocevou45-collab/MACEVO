
"""
==========================================================
MACEVO IA
Chicago Citation Service
==========================================================

Génération de références bibliographiques Chicago.

Le service fournit une base commune pour le formatage
des références utilisées par MACEVO.
"""


class ChicagoService:
    """
    Générateur de références Chicago.

    La logique de stockage, de recherche et de validation
    des références reste indépendante de ce service.
    """

    STYLE = "Chicago"

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

    @classmethod
    def _author(cls, author):
        return cls._clean(author)

    @classmethod
    def _year(cls, year):
        year = cls._clean(year)
        return year if year else "s. d."

    # ======================================================
    # LIVRE
    # ======================================================

    @classmethod
    def book(
        cls,
        author,
        title,
        publisher,
        year,
        edition="",
        location="",
        doi="",
        url="",
    ):
        """
        Génère une référence Chicago pour un livre.

        Exemple :

            Dupont, Jean. Titre du livre. Paris: Éditeur, 2024.
        """

        author = cls._author(author)
        title = cls._clean(title)
        publisher = cls._clean(publisher)
        year = cls._year(year)
        edition = cls._clean(edition)
        location = cls._clean(location)
        doi = cls._clean(doi)
        url = cls._clean(url)

        parts = []

        if author:
            parts.append(f"{author}.")

        if title:
            parts.append(f"{title}.")

        if edition:
            parts.append(f"{edition}.")

        publication = ""

        if location and publisher:
            publication = f"{location}: {publisher}"
        elif publisher:
            publication = publisher
        elif location:
            publication = location

        if publication:
            parts.append(
                f"{publication}, {year}."
            )
        elif year:
            parts.append(
                f"{year}."
            )

        if doi:
            parts.append(doi)
        elif url:
            parts.append(url)

        return " ".join(parts).strip()

    # ======================================================
    # ARTICLE
    # ======================================================

    @classmethod
    def article(
        cls,
        author,
        title,
        journal,
        year,
        volume="",
        issue="",
        pages="",
        doi="",
        url="",
    ):
        """
        Génère une référence Chicago pour un article.

        Structure :

            Auteur. "Titre." Journal volume, no. numéro
            (année): pages. DOI/URL
        """

        author = cls._author(author)
        title = cls._clean(title)
        journal = cls._clean(journal)
        year = cls._year(year)
        volume = cls._clean(volume)
        issue = cls._clean(issue)
        pages = cls._clean(pages)
        doi = cls._clean(doi)
        url = cls._clean(url)

        parts = []

        if author:
            parts.append(f"{author}.")

        if title:
            parts.append(
                f'"{title}."'
            )

        journal_part = journal

        if volume:
            journal_part = (
                f"{journal_part} {volume}"
                if journal_part
                else volume
            )

        if issue:
            journal_part = (
                f"{journal_part}, no. {issue}"
                if journal_part
                else f"no. {issue}"
            )

        if journal_part:
            parts.append(journal_part)

        date_pages = f"({year})"

        if pages:
            date_pages += f": {pages}"

        parts.append(
            f"{date_pages}."
        )

        if doi:
            parts.append(doi)
        elif url:
            parts.append(url)

        return " ".join(
            part for part in parts if part
        ).strip()

    # ======================================================
    # CHAPITRE DE LIVRE
    # ======================================================

    @classmethod
    def chapter(
        cls,
        author,
        title,
        book_title,
        year,
        editor="",
        pages="",
        publisher="",
        location="",
        doi="",
        url="",
    ):
        """
        Génère une référence Chicago pour un chapitre.
        """

        author = cls._author(author)
        title = cls._clean(title)
        book_title = cls._clean(book_title)
        year = cls._year(year)
        editor = cls._clean(editor)
        pages = cls._clean(pages)
        publisher = cls._clean(publisher)
        location = cls._clean(location)
        doi = cls._clean(doi)
        url = cls._clean(url)

        parts = []

        if author:
            parts.append(f"{author}.")

        if title:
            parts.append(
                f'"{title}."'
            )

        book_part = ""

        if book_title:
            book_part = (
                f"Dans {book_title}"
                if not editor
                else f"Dans {book_title}, édité par {editor}"
            )

        if pages:
            book_part += f", {pages}"

        if book_part:
            parts.append(
                f"{book_part}."
            )

        publication = ""

        if location and publisher:
            publication = f"{location}: {publisher}"
        elif publisher:
            publication = publisher
        elif location:
            publication = location

        if publication:
            parts.append(
                f"{publication}, {year}."
            )
        else:
            parts.append(
                f"{year}."
            )

        if doi:
            parts.append(doi)
        elif url:
            parts.append(url)

        return " ".join(parts).strip()

    # ======================================================
    # THÈSE / MÉMOIRE
    # ======================================================

    @classmethod
    def thesis(
        cls,
        author,
        title,
        institution,
        year,
        thesis_type="PhD diss.",
        department="",
        url="",
    ):
        """
        Génère une référence Chicago pour une thèse ou
        un mémoire.
        """

        author = cls._author(author)
        title = cls._clean(title)
        institution = cls._clean(institution)
        year = cls._year(year)
        thesis_type = cls._clean(thesis_type)
        department = cls._clean(department)
        url = cls._clean(url)

        parts = []

        if author:
            parts.append(f"{author}.")

        if title:
            parts.append(
                f'"{title}."'
            )

        details = []

        if thesis_type:
            details.append(thesis_type)

        if department:
            details.append(department)

        if institution:
            details.append(institution)

        details.append(year)

        if details:
            parts.append(
                f"({', '.join(details)})."
            )

        if url:
            parts.append(url)

        return " ".join(parts).strip()

    # ======================================================
    # RAPPORT
    # ======================================================

    @classmethod
    def report(
        cls,
        author,
        title,
        institution,
        year,
        report_number="",
        location="",
        url="",
    ):
        """
        Génère une référence Chicago pour un rapport.
        """

        author = cls._author(author)
        title = cls._clean(title)
        institution = cls._clean(institution)
        year = cls._year(year)
        report_number = cls._clean(report_number)
        location = cls._clean(location)
        url = cls._clean(url)

        parts = []

        if author:
            parts.append(f"{author}.")

        if title:
            parts.append(
                f"{title}."
            )

        if report_number:
            parts.append(
                f"Rapport {report_number}."
            )

        publication = ""

        if location and institution:
            publication = f"{location}: {institution}"
        elif institution:
            publication = institution
        elif location:
            publication = location

        if publication:
            parts.append(
                f"{publication}, {year}."
            )
        else:
            parts.append(
                f"{year}."
            )

        if url:
            parts.append(url)

        return " ".join(parts).strip()

    # ======================================================
    # PAGE WEB
    # ======================================================

    @classmethod
    def webpage(
        cls,
        author,
        title,
        website="",
        year="",
        url="",
    ):
        """
        Génère une référence Chicago pour une page web.
        """

        author = cls._author(author)
        title = cls._clean(title)
        website = cls._clean(website)
        year = cls._clean(year)
        url = cls._clean(url)

        parts = []

        if author:
            parts.append(f"{author}.")

        if title:
            parts.append(
                f'"{title}."'
            )

        if website:
            parts.append(
                f"{website}."
            )

        if year:
            parts.append(
                f"{year}."
            )

        if url:
            parts.append(url)

        return " ".join(parts).strip()

    # ======================================================
    # CITATION DANS LE TEXTE
    # ======================================================

    @classmethod
    def in_text(
        cls,
        author,
        year,
        page=None,
    ):
        """
        Génère une citation Chicago auteur-date.

        Exemple :
            (Dupont 2024)

        Avec page :
            (Dupont 2024, 15)
        """

        author = cls._author(author)
        year = cls._year(year)

        if not author:
            author = "Auteur inconnu"

        citation = f"({author} {year}"

        if page is not None:
            page = cls._clean(page)

            if page:
                citation += f", {page}"

        citation += ")"

        return citation

    # ======================================================
    # INFORMATIONS
    # ======================================================

    @classmethod
    def info(cls):
        """
        Informations sur le service Chicago.
        """

        return {
            "style": cls.STYLE,
            "supported_types": [
                "book",
                "article",
                "chapter",
                "thesis",
                "report",
                "webpage",
                "in_text",
            ],
        }