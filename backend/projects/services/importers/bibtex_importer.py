
"""
==========================================================
MACEVO IA
BibTeX Importer
==========================================================

Importeur professionnel de fichiers BibTeX.

Objectifs :
- lire les fichiers .bib ;
- conserver le contenu BibTeX brut ;
- extraire les entrées bibliographiques ;
- normaliser les champs utiles ;
- produire des statistiques ;
- préparer l'intégration avec le moteur bibliographique
  et le Document IR de MACEVO.

Architecture :

    .bib
      ↓
    BibTeXImporter
      ↓
    résultat normalisé
      ↓
    Bibliography Service / Scientific Analysis / Document IR
"""

from pathlib import Path

import bibtexparser

from .base_importer import BaseImporter


class BibTeXImporter(BaseImporter):
    """
    Importeur BibTeX.

    Produit un résultat contenant :
    - le contenu BibTeX brut ;
    - les entrées structurées ;
    - les métadonnées ;
    - les statistiques bibliographiques.
    """

    supported_extensions = (
        ".bib",
    )

    importer_name = "bibtex"

    # ------------------------------------------------------
    # IMPORT PRINCIPAL
    # ------------------------------------------------------

    def import_document(self, file_path):
        """
        Importe un fichier BibTeX.

        Parameters
        ----------
        file_path : str | Path
            Chemin du fichier .bib.

        Returns
        -------
        dict
            Résultat normalisé de l'importation.
        """

        if not file_path:
            raise ValueError(
                "Le chemin du fichier BibTeX est obligatoire."
            )

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Fichier BibTeX introuvable : {path}"
            )

        if not path.is_file():
            raise ValueError(
                f"Le chemin indiqué n'est pas un fichier : {path}"
            )

        if not self.supports_extension(path):
            raise ValueError(
                f"Extension non supportée par BibTeXImporter : "
                f"{path.suffix}"
            )

        # --------------------------------------------------
        # LECTURE
        # --------------------------------------------------

        try:
            with path.open(
                mode="r",
                encoding="utf-8",
            ) as bib_file:
                raw_content = bib_file.read()

        except UnicodeDecodeError:
            # Certains fichiers BibTeX historiques peuvent
            # utiliser une autre représentation de texte.
            with path.open(
                mode="r",
                encoding="latin-1",
            ) as bib_file:
                raw_content = bib_file.read()

        # --------------------------------------------------
        # PARSING
        # --------------------------------------------------

        try:
            parser = bibtexparser.bparser.BibTexParser(
                common_strings=True
            )

            library = bibtexparser.loads(
                raw_content,
                parser=parser,
            )

        except Exception as exc:
            raise ValueError(
                f"Impossible d'analyser le fichier BibTeX "
                f"{path.name} : {exc}"
            ) from exc

        # --------------------------------------------------
        # ENTRÉES STRUCTURÉES
        # --------------------------------------------------

        entries = []

        for entry in library.entries:
            normalized = self._normalize_entry(entry)

            if normalized:
                entries.append(normalized)

        # --------------------------------------------------
        # STATISTIQUES
        # --------------------------------------------------

        entry_types = {}

        for entry in entries:
            entry_type = entry.get(
                "ENTRYTYPE",
                "unknown",
            )

            entry_type = str(
                entry_type
            ).strip().lower()

            entry_types[entry_type] = (
                entry_types.get(entry_type, 0) + 1
            )

        # --------------------------------------------------
        # RÉSULTAT
        # --------------------------------------------------

        metadata = {
            "format": "bibtex",
            "entries": len(entries),
            "entry_types": entry_types,
            "source_file": path.name,
            "source_extension": path.suffix.lower(),
        }

        return self.build_result(
            title=path.stem,
            content=raw_content,
            metadata=metadata,
            source_path=path,
            source_format="bibtex",
            entries=entries,
            bibliography={
                "entries": entries,
                "count": len(entries),
                "entry_types": entry_types,
            },
        )

    # ------------------------------------------------------
    # NORMALISATION D'UNE ENTRÉE
    # ------------------------------------------------------

    @classmethod
    def _normalize_entry(cls, entry):
        """
        Normalise une entrée BibTeX sans détruire les champs
        originaux.

        Les champs originaux sont conservés dans ``raw``.
        """

        if not isinstance(entry, dict):
            return None

        raw = {
            str(key): value
            for key, value in entry.items()
        }

        entry_type = cls._clean(
            entry.get("ENTRYTYPE")
        )

        citation_key = cls._clean(
            entry.get("ID")
        )

        if not citation_key and not entry_type:
            return None

        normalized = {
            "id": citation_key,
            "citation_key": citation_key,
            "type": entry_type.lower()
            if entry_type
            else "misc",

            "author": cls._clean(
                entry.get("author")
            ),

            "editor": cls._clean(
                entry.get("editor")
            ),

            "title": cls._clean(
                entry.get("title")
            ),

            "year": cls._clean(
                entry.get("year")
            ),

            "journal": cls._clean(
                entry.get("journal")
            ),

            "booktitle": cls._clean(
                entry.get("booktitle")
            ),

            "publisher": cls._clean(
                entry.get("publisher")
            ),

            "volume": cls._clean(
                entry.get("volume")
            ),

            "number": cls._clean(
                entry.get("number")
            ),

            "issue": cls._clean(
                entry.get("issue")
            ),

            "pages": cls._clean(
                entry.get("pages")
            ),

            "edition": cls._clean(
                entry.get("edition")
            ),

            "address": cls._clean(
                entry.get("address")
            ),

            "doi": cls._clean(
                entry.get("doi")
            ),

            "url": cls._clean(
                entry.get("url")
            ),

            "isbn": cls._clean(
                entry.get("isbn")
            ),

            "issn": cls._clean(
                entry.get("issn")
            ),

            "school": cls._clean(
                entry.get("school")
            ),

            "institution": cls._clean(
                entry.get("institution")
            ),

            "organization": cls._clean(
                entry.get("organization")
            ),

            "note": cls._clean(
                entry.get("note")
            ),

            "abstract": cls._clean(
                entry.get("abstract")
            ),

            # Conservation intégrale de l'entrée originale.
            "raw": raw,
        }

        # Supprime uniquement les valeurs vides de la
        # représentation structurée, sauf les identifiants
        # principaux.
        normalized = {
            key: value
            for key, value in normalized.items()
            if value not in (None, "")
            or key in {
                "id",
                "citation_key",
                "type",
            }
        }

        return normalized

    # ------------------------------------------------------
    # NETTOYAGE
    # ------------------------------------------------------

    @staticmethod
    def _clean(value):
        """
        Nettoie une valeur BibTeX sans effectuer de
        transformation bibliographique agressive.
        """

        if value is None:
            return ""

        if isinstance(value, str):
            return value.strip()

        return str(value).strip()

    # ------------------------------------------------------
    # RECHERCHE D'UNE ENTRÉE
    # ------------------------------------------------------

    @staticmethod
    def find_entry(entries, citation_key):
        """
        Recherche une entrée par clé de citation.
        """

        if not citation_key:
            return None

        target = str(
            citation_key
        ).strip().lower()

        for entry in entries or []:
            key = entry.get(
                "citation_key",
                ""
            )

            if str(key).strip().lower() == target:
                return entry

        return None

    # ------------------------------------------------------
    # STATISTIQUES
    # ------------------------------------------------------

    @staticmethod
    def bibliography_statistics(entries):
        """
        Calcule quelques statistiques bibliographiques.
        """

        entries = entries or []

        statistics = {
            "total": len(entries),
            "with_author": 0,
            "with_title": 0,
            "with_year": 0,
            "with_doi": 0,
            "with_url": 0,
            "types": {},
        }

        for entry in entries:
            if entry.get("author"):
                statistics["with_author"] += 1

            if entry.get("title"):
                statistics["with_title"] += 1

            if entry.get("year"):
                statistics["with_year"] += 1

            if entry.get("doi"):
                statistics["with_doi"] += 1

            if entry.get("url"):
                statistics["with_url"] += 1

            entry_type = entry.get(
                "type",
                "misc",
            )

            statistics["types"][entry_type] = (
                statistics["types"].get(entry_type, 0) + 1
            )

        return statistics

    # ------------------------------------------------------
    # INFORMATIONS
    # ------------------------------------------------------

    @classmethod
    def info(cls):
        """
        Informations publiques sur l'importeur.
        """

        data = super().info()

        data.update(
            {
                "description": (
                    "Importeur de références "
                    "bibliographiques BibTeX."
                ),
                "structured_output": True,
                "preserves_raw_content": True,
            }
        )

        return data
