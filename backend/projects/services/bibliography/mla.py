
"""
==========================================================
MACEVO IA
MLA Citation Service
==========================================================

Génération et normalisation des références bibliographiques
au format MLA.

Le service est indépendant du moteur IA et peut être utilisé
par l'éditeur, le gestionnaire bibliographique, les importateurs
et les exporteurs MACEVO.
"""


class MLAService:
    """
    Service de génération des références MLA.
    """

    STYLE = "MLA"

    # ==========================================================
    # UTILITAIRES
    # ==========================================================

    @staticmethod
    def _clean(value):
        """Nettoie une valeur bibliographique."""
        if value is None:
            return ""

        return " ".join(str(value).strip().split())

    @staticmethod
    def _author(author):
        """Nettoie le nom de l'auteur sans le réécrire."""
        return MLAService._clean(author)

    @staticmethod
    def _doi_or_url(doi="", url=""):
        """Retourne le DOI ou l'URL disponible."""
        doi = MLAService._clean(doi)
        url = MLAService._clean(url)

        if doi:
            if doi.lower().startswith("http"):
                return doi
            return f"https://doi.org/{doi}"

        return url

    # ==========================================================
    # LIVRE
    # ==========================================================

    @staticmethod
    def book(
        author,
        title,
        publisher,
        year,
        edition="",
        volume="",
        url="",
        doi="",
    ):
        """
        Génère une référence MLA pour un livre.

        Exemple :
        Smith, John. Scientific Computing. 2nd ed.,
        Springer, 2025.
        """

        author = MLAService._author(author)
        title = MLAService._clean(title)
        publisher = MLAService._clean(publisher)
        year = MLAService._clean(year)
        edition = MLAService._clean(edition)
        volume = MLAService._clean(volume)

        parts = []

        if author:
            parts.append(f"{author}.")

        if title:
            parts.append(f"{title}.")

        if edition:
            parts.append(
                f"{edition} ed."
                if edition.isdigit()
                else f"{edition}."
            )

        if volume:
            parts.append(f"vol. {volume}.")

        if publisher:
            parts.append(f"{publisher},")

        if year:
            parts.append(f"{year}.")

        reference = " ".join(parts).strip()

        link = MLAService._doi_or_url(doi, url)

        if link:
            reference = f"{reference} {link}.".strip()

        return reference

    # ==========================================================
    # ARTICLE SCIENTIFIQUE
    # ==========================================================

    @staticmethod
    def article(
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
        Génère une référence MLA pour un article scientifique.

        Exemple :
        Smith, John. "Scientific Analysis."
        Journal of Science, vol. 12, no. 3, 2025, pp. 10-20.
        """

        author = MLAService._author(author)
        title = MLAService._clean(title)
        journal = MLAService._clean(journal)
        year = MLAService._clean(year)
        volume = MLAService._clean(volume)
        issue = MLAService._clean(issue)
        pages = MLAService._clean(pages)

        parts = []

        if author:
            parts.append(f"{author}.")

        if title:
            parts.append(f'"{title}."')

        if journal:
            parts.append(f"{journal},")

        if volume:
            parts.append(f"vol. {volume},")

        if issue:
            parts.append(f"no. {issue},")

        if year:
            parts.append(f"{year},")

        if pages:
            parts.append(f"pp. {pages}.")

        else:
            # Termine proprement même si les pages sont absentes.
            if parts:
                parts[-1] = parts[-1].rstrip(",") + "."

        reference = " ".join(parts).strip()

        link = MLAService._doi_or_url(doi, url)

        if link:
            reference = f"{reference} {link}.".strip()

        return reference

    # ==========================================================
    # CHAPITRE D'OUVRAGE
    # ==========================================================

    @staticmethod
    def chapter(
        author,
        title,
        book_title,
        publisher,
        year,
        pages="",
        editor="",
        edition="",
        url="",
        doi="",
    ):
        """
        Génère une référence MLA pour un chapitre d'ouvrage.
        """

        author = MLAService._author(author)
        title = MLAService._clean(title)
        book_title = MLAService._clean(book_title)
        publisher = MLAService._clean(publisher)
        year = MLAService._clean(year)
        pages = MLAService._clean(pages)
        editor = MLAService._clean(editor)
        edition = MLAService._clean(edition)

        parts = []

        if author:
            parts.append(f"{author}.")

        if title:
            parts.append(f'"{title}."')

        if book_title:
            parts.append(f"{book_title},")

        if editor:
            parts.append(f"edited by {editor},")

        if edition:
            parts.append(
                f"{edition} ed,"
                if edition.isdigit()
                else f"{edition},"
            )

        if publisher:
            parts.append(f"{publisher},")

        if year:
            parts.append(f"{year},")

        if pages:
            parts.append(f"pp. {pages}.")

        else:
            if parts:
                parts[-1] = parts[-1].rstrip(",") + "."

        reference = " ".join(parts).strip()

        link = MLAService._doi_or_url(doi, url)

        if link:
            reference = f"{reference} {link}.".strip()

        return reference

    # ==========================================================
    # THÈSE / MÉMOIRE
    # ==========================================================

    @staticmethod
    def thesis(
        author,
        title,
        institution,
        year,
        degree="PhD dissertation",
        database="",
        url="",
    ):
        """
        Génère une référence MLA pour une thèse ou un mémoire.
        """

        author = MLAService._author(author)
        title = MLAService._clean(title)
        institution = MLAService._clean(institution)
        year = MLAService._clean(year)
        degree = MLAService._clean(degree)
        database = MLAService._clean(database)

        parts = []

        if author:
            parts.append(f"{author}.")

        if title:
            parts.append(f"{title}.")

        if degree:
            parts.append(f"{degree},")

        if institution:
            parts.append(f"{institution},")

        if year:
            parts.append(f"{year}.")

        if database:
            parts.append(f"{database}.")

        reference = " ".join(parts).strip()

        if url:
            reference = f"{reference} {MLAService._clean(url)}.".strip()

        return reference

    # ==========================================================
    # RAPPORT
    # ==========================================================

    @staticmethod
    def report(
        author,
        title,
        institution,
        year,
        report_number="",
        url="",
    ):
        """
        Génère une référence MLA pour un rapport.
        """

        author = MLAService._author(author)
        title = MLAService._clean(title)
        institution = MLAService._clean(institution)
        year = MLAService._clean(year)
        report_number = MLAService._clean(report_number)

        parts = []

        if author:
            parts.append(f"{author}.")

        if title:
            parts.append(f"{title}.")

        if report_number:
            parts.append(f"Report {report_number}.")

        if institution:
            parts.append(f"{institution},")

        if year:
            parts.append(f"{year}.")

        reference = " ".join(parts).strip()

        if url:
            reference = f"{reference} {MLAService._clean(url)}.".strip()

        return reference

    # ==========================================================
    # PAGE WEB
    # ==========================================================

    @staticmethod
    def webpage(
        author,
        title,
        website,
        year="",
        url="",
    ):
        """
        Génère une référence MLA pour une page web.
        """

        author = MLAService._author(author)
        title = MLAService._clean(title)
        website = MLAService._clean(website)
        year = MLAService._clean(year)
        url = MLAService._clean(url)

        parts = []

        if author:
            parts.append(f"{author}.")

        if title:
            parts.append(f'"{title}."')

        if website:
            parts.append(f"{website},")

        if year:
            parts.append(f"{year},")

        if url:
            parts.append(f"{url}.")

        reference = " ".join(parts).strip()

        if reference and not reference.endswith("."):
            reference += "."

        return reference

    # ==========================================================
    # CITATION DANS LE TEXTE
    # ==========================================================

    @staticmethod
    def in_text(author, page=""):
        """
        Génère une citation MLA dans le texte.

        Exemples :
            (Smith)
            (Smith 25)
        """

        author = MLAService._clean(author)
        page = MLAService._clean(page)

        if not author:
            return ""

        if page:
            return f"({author} {page})"

        return f"({author})"

    # ==========================================================
    # INFORMATIONS DU STYLE
    # ==========================================================

    @classmethod
    def info(cls):
        """Retourne les informations sur le style MLA."""

        return {
            "style": cls.STYLE,
            "name": "MLA",
            "description": (
                "Style bibliographique MLA utilisé notamment "
                "dans les sciences humaines, les lettres et "
                "les études linguistiques."
            ),
            "citation_format": "(Auteur page)",
            "supported_types": [
                "book",
                "article",
                "chapter",
                "thesis",
                "report",
                "webpage",
            ],
        }
