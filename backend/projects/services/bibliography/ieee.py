
"""
==========================================================
MACEVO IA
IEEE Citation Service
==========================================================

Génération et normalisation des références bibliographiques
au format IEEE.

Objectifs :
- références de livres
- articles scientifiques
- chapitres d'ouvrages
- thèses et mémoires
- rapports
- pages web
- DOI / URL
- citations dans le texte
- gestion propre des champs optionnels
"""


class IEEEService:
    """
    Service de génération des références IEEE.

    Le service reste volontairement indépendant du moteur IA.
    Il peut donc être utilisé par :
        - l'import bibliographique
        - l'éditeur scientifique
        - l'IA
        - le gestionnaire de références
        - les exporteurs
        - le moteur LaTeX/BibTeX
    """

    STYLE = "IEEE"

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
    def _join_non_empty(*parts, separator=" "):
        """Assemble uniquement les éléments non vides."""
        cleaned = [
            IEEEService._clean(part)
            for part in parts
            if IEEEService._clean(part)
        ]

        return separator.join(cleaned)

    @staticmethod
    def _author(author):
        """
        Normalise légèrement le champ auteur.

        Le service ne tente pas de réécrire agressivement les noms,
        afin de préserver les données fournies par l'utilisateur.
        """
        return IEEEService._clean(author)

    @staticmethod
    def _doi_or_url(doi="", url=""):
        """Retourne DOI ou URL lorsqu'ils sont disponibles."""
        doi = IEEEService._clean(doi)
        url = IEEEService._clean(url)

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
        doi="",
        url="",
    ):
        """
        Génère une référence IEEE pour un livre.

        Exemple :
        J. Smith, Scientific Computing, 2nd ed. Springer, 2025.
        """

        author = IEEEService._author(author)
        title = IEEEService._clean(title)
        publisher = IEEEService._clean(publisher)
        year = IEEEService._clean(year)
        edition = IEEEService._clean(edition)

        parts = []

        if author:
            parts.append(f"{author},")

        if title:
            parts.append(title + ",")

        if edition:
            edition_text = edition

            if edition.isdigit():
                edition_text = f"{edition}nd ed."

            parts.append(edition_text)

        if publisher:
            parts.append(publisher + ",")

        if year:
            parts.append(f"{year}.")

        result = " ".join(parts).strip()

        if result and not result.endswith("."):
            result += "."

        reference = result

        link = IEEEService._doi_or_url(doi, url)

        if link:
            reference = f"{reference} {link}".strip()

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
        Génère une référence IEEE pour un article scientifique.

        Exemple :
        J. Smith, "Scientific analysis," Nature, vol. 12,
        no. 3, pp. 10-20, 2025.
        """

        author = IEEEService._author(author)
        title = IEEEService._clean(title)
        journal = IEEEService._clean(journal)
        year = IEEEService._clean(year)
        volume = IEEEService._clean(volume)
        issue = IEEEService._clean(issue)
        pages = IEEEService._clean(pages)

        parts = []

        if author:
            parts.append(f"{author},")

        if title:
            parts.append(f'"{title},"')

        if journal:
            parts.append(f"{journal},")

        if volume:
            parts.append(f"vol. {volume},")

        if issue:
            parts.append(f"no. {issue},")

        if pages:
            parts.append(f"pp. {pages},")

        if year:
            parts.append(f"{year}.")

        reference = " ".join(parts).strip()

        if reference and not reference.endswith("."):
            reference += "."

        link = IEEEService._doi_or_url(doi, url)

        if link:
            reference = f"{reference} {link}".strip()

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
        doi="",
        url="",
    ):
        """
        Génère une référence IEEE pour un chapitre d'ouvrage.
        """

        author = IEEEService._author(author)
        title = IEEEService._clean(title)
        book_title = IEEEService._clean(book_title)
        publisher = IEEEService._clean(publisher)
        year = IEEEService._clean(year)
        pages = IEEEService._clean(pages)
        editor = IEEEService._clean(editor)
        edition = IEEEService._clean(edition)

        parts = []

        if author:
            parts.append(f"{author},")

        if title:
            parts.append(f'"{title},"')

        if editor:
            parts.append(f"in {book_title}, {editor}, Ed.")

        elif book_title:
            parts.append(f"in {book_title},")

        if edition:
            parts.append(f"{edition} ed.,")

        if publisher:
            parts.append(f"{publisher},")

        if pages:
            parts.append(f"pp. {pages},")

        if year:
            parts.append(f"{year}.")

        reference = " ".join(parts).strip()

        if reference and not reference.endswith("."):
            reference += "."

        link = IEEEService._doi_or_url(doi, url)

        if link:
            reference = f"{reference} {link}".strip()

        return reference

    # ==========================================================
    # THÈSE
    # ==========================================================

    @staticmethod
    def thesis(
        author,
        title,
        institution,
        year,
        degree="Ph.D.",
        url="",
    ):
        """
        Génère une référence IEEE pour une thèse ou un mémoire.
        """

        author = IEEEService._author(author)
        title = IEEEService._clean(title)
        institution = IEEEService._clean(institution)
        year = IEEEService._clean(year)
        degree = IEEEService._clean(degree)

        parts = []

        if author:
            parts.append(f"{author},")

        if title:
            parts.append(f'"{title},"')

        if degree:
            parts.append(f"{degree} dissertation,")

        if institution:
            parts.append(f"{institution},")

        if year:
            parts.append(f"{year}.")

        reference = " ".join(parts).strip()

        if reference and not reference.endswith("."):
            reference += "."

        if url:
            reference = f"{reference} {IEEEService._clean(url)}".strip()

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
        Génère une référence IEEE pour un rapport technique.
        """

        author = IEEEService._author(author)
        title = IEEEService._clean(title)
        institution = IEEEService._clean(institution)
        year = IEEEService._clean(year)
        report_number = IEEEService._clean(report_number)

        parts = []

        if author:
            parts.append(f"{author},")

        if title:
            parts.append(f'"{title},"')

        if report_number:
            parts.append(f"Tech. Rep. {report_number},")

        if institution:
            parts.append(f"{institution},")

        if year:
            parts.append(f"{year}.")

        reference = " ".join(parts).strip()

        if reference and not reference.endswith("."):
            reference += "."

        if url:
            reference = f"{reference} {IEEEService._clean(url)}".strip()

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
        Génère une référence IEEE pour une page web.
        """

        author = IEEEService._author(author)
        title = IEEEService._clean(title)
        website = IEEEService._clean(website)
        year = IEEEService._clean(year)
        url = IEEEService._clean(url)

        parts = []

        if author:
            parts.append(f"{author},")

        if title:
            parts.append(f'"{title},"')

        if website:
            parts.append(f"{website},")

        if year:
            parts.append(f"{year},")

        if url:
            parts.append(f"[Online]. Available: {url}")

        reference = " ".join(parts).strip()

        if reference and not reference.endswith("."):
            reference += "."

        return reference

    # ==========================================================
    # CITATION DANS LE TEXTE
    # ==========================================================

    @staticmethod
    def in_text(index):
        """
        Génère une citation IEEE dans le texte.

        Exemple :
            [1]
            [3]
        """

        if index is None:
            return ""

        value = str(index).strip()

        if not value:
            return ""

        # Évite de doubler les crochets.
        if value.startswith("[") and value.endswith("]"):
            return value

        return f"[{value}]"

    # ==========================================================
    # INFORMATIONS DU STYLE
    # ==========================================================

    @classmethod
    def info(cls):
        """Retourne les informations sur le style IEEE."""

        return {
            "style": cls.STYLE,
            "name": "IEEE",
            "description": (
                "Style bibliographique IEEE destiné notamment "
                "aux publications scientifiques, techniques "
                "et d'ingénierie."
            ),
            "citation_format": "[n]",
            "supported_types": [
                "book",
                "article",
                "chapter",
                "thesis",
                "report",
                "webpage",
            ],
        }
