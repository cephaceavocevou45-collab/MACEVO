
"""
==========================================================
MACEVO IA
APA Citation Service
==========================================================

Génération et normalisation de références APA 7.

Ce service reste volontairement indépendant du stockage
des références et du moteur IA.

Il peut être utilisé par :
    - bibliography_service.py
    - l'éditeur scientifique ;
    - l'assistant IA ;
    - les importateurs ;
    - les exports ;
    - le futur moteur de gestion bibliographique.
"""


class APAService:
    """
    Générateur de références bibliographiques APA 7.

    Les méthodes retournent des chaînes prêtes à être
    utilisées dans une bibliographie.
    """

    STYLE = "APA 7"

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
    def _join_non_empty(cls, *values, separator=" "):
        """
        Assemble uniquement les éléments non vides.
        """

        cleaned = [
            cls._clean(value)
            for value in values
            if cls._clean(value)
        ]

        return separator.join(cleaned)

    @classmethod
    def _year(cls, year):
        """
        Normalise l'année.

        Si l'année n'est pas fournie, APA utilise généralement
        une indication du type '(n.d.)'.
        """

        year = cls._clean(year)

        return year if year else "n.d."

    @classmethod
    def _author(cls, author):
        """
        Normalise l'auteur sans modifier inutilement son contenu.

        Le formatage complet des noms peut être ajouté plus tard
        dans un service dédié de normalisation bibliographique.
        """

        return cls._clean(author)

    # ======================================================
    # LIVRES
    # ======================================================

    @classmethod
    def book(
        cls,
        author,
        year,
        title,
        publisher,
        edition="",
        doi="",
        url="",
    ):
        """
        Génère une référence de livre en APA 7.

        Exemple :

            Dupont, J. (2024). Titre du livre. Éditeur.

        Une édition peut être ajoutée lorsque nécessaire.
        """

        author = cls._author(author)
        year = cls._year(year)
        title = cls._clean(title)
        publisher = cls._clean(publisher)
        edition = cls._clean(edition)
        doi = cls._clean(doi)
        url = cls._clean(url)

        parts = [
            f"{author} ({year})." if author else f"({year}).",
            f"{title}." if title else "",
        ]

        if edition:
            parts.append(f"({edition}).")

        if publisher:
            parts.append(f"{publisher}.")

        if doi:
            parts.append(doi)

        elif url:
            parts.append(url)

        return " ".join(
            part for part in parts if part
        ).strip()

    # ======================================================
    # ARTICLES SCIENTIFIQUES
    # ======================================================

    @classmethod
    def article(
        cls,
        author,
        year,
        title,
        journal,
        volume="",
        issue="",
        pages="",
        doi="",
        url="",
    ):
        """
        Génère une référence d'article scientifique en APA 7.

        Structure approximative :

            Auteur. (année). Titre. Journal, volume(issue),
            pages. DOI/URL
        """

        author = cls._author(author)
        year = cls._year(year)
        title = cls._clean(title)
        journal = cls._clean(journal)
        volume = cls._clean(volume)
        issue = cls._clean(issue)
        pages = cls._clean(pages)
        doi = cls._clean(doi)
        url = cls._clean(url)

        reference = []

        if author:
            reference.append(
                f"{author} ({year})."
            )
        else:
            reference.append(
                f"({year})."
            )

        if title:
            reference.append(
                f"{title}."
            )

        journal_part = ""

        if journal:
            journal_part = journal

        if volume:
            journal_part = (
                f"{journal_part}, {volume}"
                if journal_part
                else volume
            )

        if issue:
            if volume:
                journal_part += f"({issue})"
            else:
                journal_part += f"({issue})"

        if pages:
            journal_part += (
                f", {pages}"
                if journal_part
                else pages
            )

        if journal_part:
            reference.append(
                f"{journal_part}."
            )

        if doi:
            reference.append(doi)

        elif url:
            reference.append(url)

        return " ".join(reference).strip()

    # ======================================================
    # CHAPITRE DE LIVRE
    # ======================================================

    @classmethod
    def chapter(
        cls,
        author,
        year,
        title,
        book_title,
        editor="",
        pages="",
        publisher="",
        doi="",
        url="",
    ):
        """
        Génère une référence de chapitre d'ouvrage collectif.
        """

        author = cls._author(author)
        year = cls._year(year)
        title = cls._clean(title)
        book_title = cls._clean(book_title)
        editor = cls._clean(editor)
        pages = cls._clean(pages)
        publisher = cls._clean(publisher)
        doi = cls._clean(doi)
        url = cls._clean(url)

        reference = []

        reference.append(
            f"{author} ({year})."
            if author
            else f"({year})."
        )

        if title:
            reference.append(
                f"{title}."
            )

        if editor:
            reference.append(
                f"Dans {editor} (dir.),"
            )

        if book_title:
            book_part = book_title

            if pages:
                book_part += f" (pp. {pages})"

            reference.append(
                f"{book_part}."
            )

        if publisher:
            reference.append(
                f"{publisher}."
            )

        if doi:
            reference.append(doi)

        elif url:
            reference.append(url)

        return " ".join(reference).strip()

    # ======================================================
    # THÈSE / MÉMOIRE
    # ======================================================

    @classmethod
    def thesis(
        cls,
        author,
        year,
        title,
        institution,
        thesis_type="Thèse de doctorat",
        url="",
    ):
        """
        Génère une référence pour une thèse ou un mémoire.
        """

        author = cls._author(author)
        year = cls._year(year)
        title = cls._clean(title)
        institution = cls._clean(institution)
        thesis_type = cls._clean(thesis_type)
        url = cls._clean(url)

        reference = []

        reference.append(
            f"{author} ({year})."
            if author
            else f"({year})."
        )

        if title:
            reference.append(
                f"{title}."
            )

        if thesis_type or institution:
            details = []

            if thesis_type:
                details.append(thesis_type)

            if institution:
                details.append(institution)

            reference.append(
                f"[{', '.join(details)}]."
            )

        if url:
            reference.append(url)

        return " ".join(reference).strip()

    # ======================================================
    # PAGE WEB
    # ======================================================

    @classmethod
    def webpage(
        cls,
        author,
        year,
        title,
        website="",
        url="",
    ):
        """
        Génère une référence de page web.
        """

        author = cls._author(author)
        year = cls._year(year)
        title = cls._clean(title)
        website = cls._clean(website)
        url = cls._clean(url)

        reference = []

        reference.append(
            f"{author} ({year})."
            if author
            else f"({year})."
        )

        if title:
            reference.append(
                f"{title}."
            )

        if website:
            reference.append(
                f"{website}."
            )

        if url:
            reference.append(url)

        return " ".join(reference).strip()

    # ======================================================
    # RAPPORT
    # ======================================================

    @classmethod
    def report(
        cls,
        author,
        year,
        title,
        institution,
        report_number="",
        url="",
    ):
        """
        Génère une référence de rapport institutionnel.
        """

        author = cls._author(author)
        year = cls._year(year)
        title = cls._clean(title)
        institution = cls._clean(institution)
        report_number = cls._clean(report_number)
        url = cls._clean(url)

        reference = []

        reference.append(
            f"{author} ({year})."
            if author
            else f"({year})."
        )

        if title:
            title_part = title

            if report_number:
                title_part += f" ({report_number})"

            reference.append(
                f"{title_part}."
            )

        if institution:
            reference.append(
                f"{institution}."
            )

        if url:
            reference.append(url)

        return " ".join(reference).strip()

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
        Génère une citation APA dans le texte.

        Exemple :
            (Dupont, 2024)

        Avec page :
            (Dupont, 2024, p. 15)
        """

        author = cls._author(author)
        year = cls._year(year)

        if not author:
            author = "Auteur inconnu"

        citation = f"({author}, {year}"

        if page is not None:
            page = cls._clean(page)

            if page:
                citation += f", p. {page}"

        citation += ")"

        return citation

    # ======================================================
    # MÉTADONNÉES
    # ======================================================

    @classmethod
    def info(cls):
        """
        Informations sur le service bibliographique.
        """

        return {
            "style": cls.STYLE,
            "version": "7",
            "supported_types": [
                "book",
                "article",
                "chapter",
                "thesis",
                "webpage",
                "report",
                "in_text",
            ],
        }
