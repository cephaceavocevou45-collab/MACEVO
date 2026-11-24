from __future__ import annotations

import re
import zipfile
from pathlib import Path
from typing import Any, Dict, Iterable, Optional
from xml.etree import ElementTree as ET

from docx import Document
from docx.document import Document as _Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.oxml.ns import qn


class DocumentAnalyzer:
    """
    Analyse scientifique d'un document Microsoft Word (.docx).

    L'analyse identifie les éléments utiles au pipeline DOCX -> LaTeX :

    - paragraphes du corps principal ;
    - titres et niveaux de sections ;
    - mots ;
    - tableaux ;
    - images ;
    - équations OMML ;
    - diagrammes, graphiques et formes ;
    - figures ;
    - références et citations ;
    - notes de bas de page ;
    - commentaires ;
    - métadonnées.

    Le résultat est compatible avec WordToLatexConversion et
    ConversionService.
    """

    WORD_NAMESPACE = (
        "http://schemas.openxmlformats.org/"
        "wordprocessingml/2006/main"
    )

    DRAWING_NAMESPACE = (
        "http://schemas.openxmlformats.org/"
        "drawingml/2006/main"
    )

    PICTURE_NAMESPACE = (
        "http://schemas.openxmlformats.org/"
        "drawingml/2006/picture"
    )

    RELATIONSHIP_NAMESPACE = (
        "http://schemas.openxmlformats.org/"
        "officeDocument/2006/relationships"
    )

    PACKAGE_RELATIONSHIP_NAMESPACE = (
        "http://schemas.openxmlformats.org/"
        "package/2006/relationships"
    )

    MATH_NAMESPACE = (
        "http://schemas.openxmlformats.org/"
        "officeDocument/2006/math"
    )

    VML_NAMESPACE = "urn:schemas-microsoft-com:vml"

    CHART_NAMESPACE = (
        "http://schemas.openxmlformats.org/"
        "drawingml/2006/chart"
    )

    WORD_2010_NAMESPACE = (
        "http://schemas.microsoft.com/office/word/2010/"
        "wordprocessingShape"
    )

    NS = {
        "w": WORD_NAMESPACE,
        "m": MATH_NAMESPACE,
        "a": DRAWING_NAMESPACE,
        "pic": PICTURE_NAMESPACE,
        "r": RELATIONSHIP_NAMESPACE,
        "pr": PACKAGE_RELATIONSHIP_NAMESPACE,
        "c": CHART_NAMESPACE,
        "v": VML_NAMESPACE,
        "wps": WORD_2010_NAMESPACE,
    }

    HEADING_STYLE_RE = re.compile(
        r"^(?:heading|titre)\s*([1-9][0-9]*)$",
        re.IGNORECASE,
    )

    WORD_REFERENCE_RE = re.compile(
        r"\b(?:REF|PAGEREF|NOTEREF)\b",
        re.IGNORECASE,
    )

    NUMERIC_CITATION_RE = re.compile(
        r"""
        \[
            \s*
            \d+
            (?:
                \s*[,;\-]\s*\d+
            )*
            \s*
        \]
        """,
        re.VERBOSE,
    )

    AUTHOR_YEAR_CITATION_RE = re.compile(
        r"""
        \(
            \s*
            [A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'’-]{2,}
            (?:\s+et\s+al\.)?
            \s*,\s*
            (?:19|20)\d{2}[a-z]?
            (?:
                \s*;\s*
                [A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'’-]{2,}
                (?:\s+et\s+al\.)?
                \s*,\s*
                (?:19|20)\d{2}[a-z]?
            )*
            \s*
        \)
        """,
        re.VERBOSE | re.IGNORECASE,
    )

    BIBLIOGRAPHY_HEADING_RE = re.compile(
        r"^(?:bibliography|references|références|bibliographie)$",
        re.IGNORECASE,
    )

    GRAPHIC_ELEMENT_NAMES = {
        "diagram",
        "chart",
        "group",
        "wsp",
        "wgp",
        "shape",
        "graphicFrame",
        "graphic",
        "smartArt",
    }

    GRAPHIC_RELATION_MARKERS = (
        "/chart",
        "/diagram",
        "/smartart",
    )

    def __init__(self, document_path: str | Path):
        self.document_path = Path(document_path)

        self.document: Optional[_Document] = None

        self.archive_names: set[str] = set()

        self._xml_cache: Dict[str, Optional[ET.Element]] = {}

    # ------------------------------------------------------------------
    # API publique
    # ------------------------------------------------------------------

    def analyze(self) -> Dict[str, Any]:
        """
        Effectue l'analyse complète du document.

        Retourne toujours une structure compatible avec
        WordToLatexConversion.
        """

        self._validate_document()

        self.document = Document(str(self.document_path))

        with zipfile.ZipFile(self.document_path, "r") as archive:
            self.archive_names = set(archive.namelist())

        paragraphs = self.analyze_paragraphs()
        headings = self.analyze_headings()
        words = self.analyze_words()
        tables = self.analyze_tables()
        images = self.analyze_images()
        equations = self.analyze_equations()
        diagrams = self.analyze_diagrams()

        figures = self.analyze_figures(
            image_count=images,
            diagram_count=diagrams,
        )

        comments = self.analyze_comments()
        footnotes = self.analyze_footnotes()
        references = self.analyze_references()
        metadata = self.analyze_metadata()

        result = {
            "paragraphs_count": paragraphs,
            "headings_count": headings,
            "words_count": words,
            "tables_count": tables,
            "images_count": images,
            "comments_count": comments,
            "footnotes_count": footnotes,
            "equations_count": equations,
            "diagrams_count": diagrams,
            "figures_count": figures,
            "references_count": references,
            "document_title": metadata.get("title", ""),
            "document_author": metadata.get("author", ""),
            "metadata": metadata,
        }

        result["scientific_elements_count"] = (
            result["equations_count"]
            + result["diagrams_count"]
            + result["figures_count"]
            + result["references_count"]
        )

        return result

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    def _validate_document(self) -> None:
        if not self.document_path.exists():
            raise FileNotFoundError(
                f"Document introuvable : {self.document_path}"
            )

        if not self.document_path.is_file():
            raise ValueError(
                "Le chemin indiqué n'est pas un fichier : "
                f"{self.document_path}"
            )

        if self.document_path.stat().st_size == 0:
            raise ValueError("Le document DOCX est vide.")

        if self.document_path.suffix.lower() != ".docx":
            raise ValueError(
                "Le document doit être au format Microsoft Word .docx."
            )

        try:
            with zipfile.ZipFile(self.document_path, "r") as archive:
                corrupt_file = archive.testzip()

                if corrupt_file is not None:
                    raise ValueError(
                        "L'archive DOCX est corrompue : "
                        f"{corrupt_file}"
                    )

                names = set(archive.namelist())

                if "word/document.xml" not in names:
                    raise ValueError(
                        "Le fichier DOCX ne contient pas "
                        "word/document.xml."
                    )

        except zipfile.BadZipFile as exc:
            raise ValueError(
                "Le fichier fourni n'est pas un document DOCX valide."
            ) from exc

    # ------------------------------------------------------------------
    # Paragraphes
    # ------------------------------------------------------------------

    def analyze_paragraphs(self) -> int:
        """
        Compte les paragraphes du corps principal.

        Les paragraphes contenus dans les cellules des tableaux ne sont
        volontairement pas ajoutés à ce compteur principal afin d'éviter
        de gonfler les statistiques du document.
        """

        if self.document is None:
            return 0

        count = 0

        for block in self.iter_block_items():
            if not isinstance(block, Paragraph):
                continue

            if (
                block.text.strip()
                or self._paragraph_contains_scientific_content(block)
            ):
                count += 1

        return count

    def analyze_headings(self) -> int:
        """
        Compte les titres du corps principal.
        """

        if self.document is None:
            return 0

        return sum(
            1
            for block in self.iter_block_items()
            if isinstance(block, Paragraph)
            and self.is_heading(block)
        )

    def analyze_words(self) -> int:
        """
        Compte les mots du corps principal.

        Les paragraphes des cellules de tableaux ne sont pas comptés ici.
        """

        if self.document is None:
            return 0

        total = 0

        for block in self.iter_block_items():
            if not isinstance(block, Paragraph):
                continue

            text = self._paragraph_plain_text(block)

            if not text:
                continue

            total += len(
                re.findall(
                    r"\b[\wÀ-ÖØ-öø-ÿ'-]+\b",
                    text,
                    flags=re.UNICODE,
                )
            )

        return total

    def is_heading(self, paragraph: Paragraph) -> bool:
        """
        Détermine si un paragraphe est un titre.

        Priorité :

        1. style Word Heading/Titre ;
        2. niveau XML w:outlineLvl.
        """

        style_name = ""

        try:
            if paragraph.style is not None:
                style_name = paragraph.style.name or ""
        except Exception:
            style_name = ""

        if self.HEADING_STYLE_RE.match(style_name.strip()):
            return True

        p_pr = paragraph._p.find(qn("w:pPr"))

        if p_pr is not None:
            outline_level = p_pr.find(qn("w:outlineLvl"))

            if outline_level is not None:
                value = outline_level.get(qn("w:val"))

                try:
                    level = int(value)

                    if 0 <= level <= 8:
                        return True

                except (TypeError, ValueError):
                    pass

        return False

    def get_heading_level(
        self,
        paragraph: Paragraph,
    ) -> Optional[int]:
        """
        Retourne le niveau du titre.

        Heading 1 -> 1
        Heading 2 -> 2
        ...
        XML outlineLvl=0 -> niveau 1.
        """

        style_name = ""

        try:
            if paragraph.style is not None:
                style_name = paragraph.style.name or ""
        except Exception:
            style_name = ""

        match = self.HEADING_STYLE_RE.match(style_name.strip())

        if match:
            try:
                return int(match.group(1))
            except ValueError:
                pass

        p_pr = paragraph._p.find(qn("w:pPr"))

        if p_pr is not None:
            outline_level = p_pr.find(qn("w:outlineLvl"))

            if outline_level is not None:
                value = outline_level.get(qn("w:val"))

                try:
                    level = int(value) + 1

                    if 1 <= level <= 9:
                        return level

                except (TypeError, ValueError):
                    pass

        return None

    # ------------------------------------------------------------------
    # Tableaux
    # ------------------------------------------------------------------

    def analyze_tables(self) -> int:
        """
        Compte les tableaux du corps principal.
        """

        if self.document is None:
            return 0

        return sum(
            1
            for block in self.iter_block_items()
            if isinstance(block, Table)
        )

    # ------------------------------------------------------------------
    # Images
    # ------------------------------------------------------------------

    def analyze_images(self) -> int:
        """
        Compte les images réellement utilisées par document.xml.

        Les relations sont résolues afin de ne pas confondre un simple
        identifiant de relation avec une image réellement présente.

        Un même fichier image réutilisé plusieurs fois n'est compté
        qu'une seule fois.
        """

        root = self._read_xml_from_archive("word/document.xml")

        if root is None:
            return 0

        relationships = self._read_relationship_elements(
            "word/_rels/document.xml.rels"
        )

        relationship_targets: Dict[str, str] = {}

        for relationship in relationships:
            rel_id = relationship.get("Id")

            target = relationship.get("Target")

            if rel_id and target:
                relationship_targets[rel_id] = target

        image_targets: set[str] = set()

        for element in root.iter():
            local_name = self._local_name(element.tag).lower()

            if local_name not in {"blip", "imagedata"}:
                continue

            for attr_name, attr_value in element.attrib.items():
                attr_local_name = self._local_name(attr_name).lower()

                if attr_local_name not in {"embed", "id"}:
                    continue

                target = relationship_targets.get(attr_value)

                if target:
                    image_targets.add(
                        self._normalize_relationship_target(
                            target
                        )
                    )

        if image_targets:
            return len(image_targets)

        # Fallback : si le XML contient des références d'images mais
        # que les relations sont absentes ou incomplètes.
        referenced_ids: set[str] = set()

        for element in root.iter():
            local_name = self._local_name(element.tag).lower()

            if local_name not in {"blip", "imagedata"}:
                continue

            for attr_name, attr_value in element.attrib.items():
                attr_local_name = self._local_name(attr_name).lower()

                if attr_local_name in {"embed", "id"} and attr_value:
                    referenced_ids.add(attr_value)

        if referenced_ids:
            return len(referenced_ids)

        # Dernier fallback : médias présents dans le DOCX.
        media_files = self.get_media_files()

        return len(media_files)

    # ------------------------------------------------------------------
    # Équations
    # ------------------------------------------------------------------

    def analyze_equations(self) -> int:
        """
        Compte les expressions mathématiques OMML.

        Un oMathPara peut contenir un ou plusieurs oMath. Le compteur
        utilise donc les oMath comme unités d'expression mathématique.
        """

        root = self._read_xml_from_archive("word/document.xml")

        if root is None:
            return 0

        return sum(
            1
            for element in root.iter()
            if self._local_name(element.tag) == "oMath"
        )

    # ------------------------------------------------------------------
    # Diagrammes / dessins / graphiques
    # ------------------------------------------------------------------

    def analyze_diagrams(self) -> int:
        """
        Détecte les objets graphiques complexes présents dans le
        document principal.

        Sont notamment pris en compte :

        - graphiques Office ;
        - SmartArt ;
        - formes Word ;
        - groupes DrawingML ;
        - cadres graphiques ;
        - objets WPS/VML.

        Les images raster simples ne sont pas comptées ici.
        """

        root = self._read_xml_from_archive("word/document.xml")

        if root is None:
            return 0

        graphic_objects: set[str] = set()

        for element in root.iter():
            local_name = self._local_name(element.tag)

            if local_name in self.GRAPHIC_ELEMENT_NAMES:
                object_id = self._graphic_object_identifier(element)

                if object_id:
                    graphic_objects.add(object_id)

        # Détection des objets graphiques via les relations du document.
        relationship_graphics: set[str] = set()

        for relationship in self._read_relationship_elements(
            "word/_rels/document.xml.rels"
        ):
            rel_type = relationship.get("Type", "").lower()

            if any(
                marker in rel_type
                for marker in self.GRAPHIC_RELATION_MARKERS
            ):
                rel_id = relationship.get("Id")

                if rel_id:
                    relationship_graphics.add(rel_id)

        if graphic_objects:
            return len(graphic_objects)

        return len(relationship_graphics)

    def _graphic_object_identifier(
        self,
        element: ET.Element,
    ) -> Optional[str]:
        """
        Produit un identifiant stable approximatif pour un objet
        graphique.

        Les relations sont privilégiées lorsqu'elles existent.
        """

        for attr_name, attr_value in element.attrib.items():
            local_name = self._local_name(attr_name).lower()

            if local_name in {
                "id",
                "docprid",
                "name",
            } and attr_value:
                return f"{local_name}:{attr_value}"

        # Pour les éléments sans identifiant explicite, utiliser
        # l'identité mémoire de l'élément pendant cette analyse.
        return f"element:{id(element)}"

    # ------------------------------------------------------------------
    # Figures
    # ------------------------------------------------------------------

    def analyze_figures(
        self,
        image_count: Optional[int] = None,
        diagram_count: Optional[int] = None,
    ) -> int:
        """
        Compte les figures graphiques.

        Dans le modèle actuel, une figure représente un élément visuel
        exploitable par la conversion : image ou objet graphique complexe.

        Les images et diagrammes étant déjà séparés dans leurs compteurs,
        figures_count représente ici le total visuel.
        """

        if image_count is None:
            image_count = self.analyze_images()

        if diagram_count is None:
            diagram_count = self.analyze_diagrams()

        return image_count + diagram_count

    # ------------------------------------------------------------------
    # Commentaires
    # ------------------------------------------------------------------

    def analyze_comments(self) -> int:
        """
        Compte les commentaires Word dans comments.xml.

        commentsExtended.xml peut exister mais ne contient pas
        directement les commentaires principaux ; il n'est donc pas
        additionné au compteur.
        """

        root = self._read_xml_from_archive(
            "word/comments.xml"
        )

        if root is None:
            return 0

        return sum(
            1
            for element in root.iter()
            if self._local_name(element.tag) == "comment"
        )

    # ------------------------------------------------------------------
    # Notes de bas de page
    # ------------------------------------------------------------------

    def analyze_footnotes(self) -> int:
        """
        Compte les notes de bas de page Word.

        Les notes de type separator et continuationSeparator sont
        exclues.
        """

        root = self._read_xml_from_archive(
            "word/footnotes.xml"
        )

        if root is None:
            return 0

        count = 0

        for element in root.iter():
            if self._local_name(element.tag) != "footnote":
                continue

            note_type = element.get(qn("w:type"))

            if note_type in {
                "separator",
                "continuationSeparator",
            }:
                continue

            count += 1

        return count

    # ------------------------------------------------------------------
    # Références / citations
    # ------------------------------------------------------------------

    def analyze_references(self) -> int:
        """
        Détecte les références bibliographiques et citations.

        Sont pris en compte :

        - champs CITATION ;
        - champs BIBLIOGRAPHY ;
        - champs REF/PAGEREF/NOTEREF ;
        - citations numériques ;
        - citations auteur-date ;
        - sources bibliographiques Word présentes dans le package.
        """

        root = self._read_xml_from_archive(
            "word/document.xml"
        )

        found: set[tuple[str, str]] = set()

        if root is not None:
            # Champs Word.
            for element in root.iter():
                local_name = self._local_name(element.tag)

                if local_name != "instrText":
                    continue

                text = self._normalize_whitespace(
                    self._element_text(element)
                )

                if not text:
                    continue

                upper = text.upper()

                if (
                    "CITATION" in upper
                    or "BIBLIOGRAPHY" in upper
                    or self.WORD_REFERENCE_RE.search(text)
                ):
                    found.add(
                        (
                            "field",
                            text.lower(),
                        )
                    )

            # Citations visibles dans le texte.
            if self.document is not None:
                for block in self.iter_block_items():
                    if not isinstance(block, Paragraph):
                        continue

                    text = self._paragraph_plain_text(block)

                    if not text:
                        continue

                    for match in self.NUMERIC_CITATION_RE.finditer(
                        text
                    ):
                        found.add(
                            (
                                "numeric",
                                self._normalize_whitespace(
                                    match.group(0)
                                ),
                            )
                        )

                    for match in self.AUTHOR_YEAR_CITATION_RE.finditer(
                        text
                    ):
                        found.add(
                            (
                                "author-year",
                                self._normalize_whitespace(
                                    match.group(0)
                                ).lower(),
                            )
                        )

        part_count = self._analyze_bibliography_parts()

        return len(found) + part_count

    def _analyze_bibliography_parts(self) -> int:
        """
        Analyse les parties XML pouvant contenir les sources
        bibliographiques Word.

        Word peut stocker ces informations dans customXml ou dans
        différentes parties liées aux bibliographies.
        """

        count = 0

        for filename in self.archive_names:
            normalized = filename.lower()

            is_candidate = (
                "bibliograph" in normalized
                or normalized.startswith("word/customxml/")
                or normalized.startswith("word/customxml")
            )

            if not is_candidate:
                continue

            root = self._read_xml_from_archive(filename)

            if root is None:
                continue

            seen_nodes: set[int] = set()

            for element in root.iter():
                local_name = self._local_name(
                    element.tag
                ).lower()

                if local_name not in {
                    "source",
                    "bibliosource",
                }:
                    continue

                marker = id(element)

                if marker in seen_nodes:
                    continue

                seen_nodes.add(marker)

                count += 1

        return count

    # ------------------------------------------------------------------
    # Métadonnées
    # ------------------------------------------------------------------

    def analyze_metadata(self) -> Dict[str, str]:
        """
        Récupère les principales propriétés du document Word.
        """

        if self.document is None:
            return {}

        properties = self.document.core_properties

        return {
            "title": (properties.title or "").strip(),
            "author": (properties.author or "").strip(),
            "subject": (properties.subject or "").strip(),
            "keywords": (properties.keywords or "").strip(),
            "comments": (properties.comments or "").strip(),
            "category": (properties.category or "").strip(),
            "last_modified_by": (
                properties.last_modified_by or ""
            ).strip(),
            "revision": str(
                properties.revision or ""
            ),
        }

    # ------------------------------------------------------------------
    # Itération des blocs
    # ------------------------------------------------------------------

    def iter_block_items(
        self,
    ) -> Iterable[Paragraph | Table]:
        """
        Parcourt les paragraphes et tableaux du corps principal dans
        leur ordre réel d'apparition.

        Cette méthode est essentielle pour conserver l'ordre scientifique
        lors de la conversion DOCX -> LaTeX.
        """

        if self.document is None:
            return

        body = self.document.element.body

        for child in body.iterchildren():
            local_name = self._local_name(child.tag)

            if local_name == "p":
                yield Paragraph(
                    child,
                    self.document,
                )

            elif local_name == "tbl":
                yield Table(
                    child,
                    self.document,
                )

    def iter_block_paragraphs(self) -> Iterable[Paragraph]:
        """
        Parcourt les paragraphes du corps principal uniquement.

        Les paragraphes des cellules de tableaux ne sont pas ajoutés
        automatiquement afin de conserver des statistiques cohérentes.

        Pour inspecter les cellules d'un tableau, le convertisseur de
        tableaux doit parcourir explicitement Table.rows/cells.
        """

        if self.document is None:
            return

        for block in self.iter_block_items():
            if isinstance(block, Paragraph):
                yield block

    # ------------------------------------------------------------------
    # Utilitaires paragraphes
    # ------------------------------------------------------------------

    def _paragraph_plain_text(
        self,
        paragraph: Paragraph,
    ) -> str:
        """
        Extrait le texte lisible du paragraphe.

        Les équations OMML sont remplacées par un marqueur interne afin
        qu'un paragraphe contenant uniquement une équation soit considéré
        comme non vide.

        Cette méthode ne transforme pas l'équation en LaTeX.
        """

        parts: list[str] = []

        for child in paragraph._p.iterchildren():
            local_name = self._local_name(child.tag)

            if local_name == "r":
                parts.append(
                    self._element_text(child)
                )

            elif local_name == "hyperlink":
                parts.append(
                    self._element_text(child)
                )

            elif local_name in {
                "oMath",
                "oMathPara",
            }:
                parts.append(" math ")

        return self._normalize_whitespace(
            "".join(parts)
        )

    def _paragraph_contains_scientific_content(
        self,
        paragraph: Paragraph,
    ) -> bool:
        """
        Détermine si un paragraphe contient un élément scientifique
        ou graphique même lorsqu'il ne possède pas de texte classique.
        """

        scientific_nodes = {
            "oMath",
            "oMathPara",
            "drawing",
            "pict",
            "object",
        }

        for element in paragraph._p.iter():
            local_name = self._local_name(
                element.tag
            )

            if local_name in scientific_nodes:
                return True

        return False

    # ------------------------------------------------------------------
    # Utilitaires XML
    # ------------------------------------------------------------------

    def _read_xml_from_archive(
        self,
        filename: str,
    ) -> Optional[ET.Element]:
        """
        Lit et met en cache une partie XML du DOCX.
        """

        if filename in self._xml_cache:
            return self._xml_cache[filename]

        if not self.archive_names:
            try:
                with zipfile.ZipFile(
                    self.document_path,
                    "r",
                ) as archive:
                    self.archive_names = set(
                        archive.namelist()
                    )

            except (
                zipfile.BadZipFile,
                OSError,
            ):
                self._xml_cache[filename] = None
                return None

        if filename not in self.archive_names:
            self._xml_cache[filename] = None
            return None

        try:
            with zipfile.ZipFile(
                self.document_path,
                "r",
            ) as archive:
                data = archive.read(filename)

            root = ET.fromstring(data)

        except (
            KeyError,
            ET.ParseError,
            OSError,
            zipfile.BadZipFile,
        ):
            root = None

        self._xml_cache[filename] = root

        return root

    def _read_relationships(
        self,
        filename: str,
    ) -> Dict[str, str]:
        """
        Retourne les relations sous la forme :

            relationship_id -> target
        """

        relationships: Dict[str, str] = {}

        for element in self._read_relationship_elements(
            filename
        ):
            rel_id = element.get("Id")

            if rel_id is None:
                rel_id = element.get(
                    f"{{{self.RELATIONSHIP_NAMESPACE}}}id"
                )

            target = element.get("Target")

            if rel_id and target:
                relationships[rel_id] = target

        return relationships

    def _read_relationship_elements(
        self,
        filename: str,
    ) -> list[ET.Element]:
        """
        Retourne les éléments Relationship d'une partie .rels.
        """

        root = self._read_xml_from_archive(
            filename
        )

        if root is None:
            return []

        return [
            element
            for element in root.iter()
            if self._local_name(element.tag)
            == "Relationship"
        ]

    @staticmethod
    def _local_name(tag: str) -> str:
        """
        Extrait le nom local d'un tag XML.

        Supporte :

        {namespace}name
        prefix:name
        name
        """

        if not tag:
            return ""

        if "}" in tag:
            return tag.rsplit("}", 1)[-1]

        if ":" in tag:
            return tag.rsplit(":", 1)[-1]

        return tag

    @staticmethod
    def _element_text(
        element: ET.Element,
    ) -> str:
        """
        Retourne tout le texte contenu dans un élément XML.
        """

        return "".join(
            text
            for text in element.itertext()
            if text
        )

    @staticmethod
    def _normalize_whitespace(
        value: str,
    ) -> str:
        """
        Normalise les espaces et retours à la ligne.
        """

        return re.sub(
            r"\s+",
            " ",
            value or "",
        ).strip()

    @staticmethod
    def _normalize_relationship_target(
        target: str,
    ) -> str:
        """
        Normalise une cible de relation DOCX.

        Les chemins relatifs sont conservés sous forme homogène afin
        qu'une même image ne soit pas comptée plusieurs fois à cause
        d'une variation de notation du chemin.
        """

        value = target.replace("\\", "/")

        while value.startswith("./"):
            value = value[2:]

        if value.startswith("/"):
            value = value.lstrip("/")

        if not value.startswith("word/"):
            value = f"word/{value}"

        parts: list[str] = []

        for part in value.split("/"):
            if part in {"", "."}:
                continue

            if part == "..":
                if parts:
                    parts.pop()

                continue

            parts.append(part)

        return "/".join(parts)

    # ------------------------------------------------------------------
    # Informations supplémentaires utiles au pipeline
    # ------------------------------------------------------------------

    def get_document_xml(
        self,
    ) -> Optional[ET.Element]:
        """
        Retourne word/document.xml sous forme d'ElementTree.
        """

        return self._read_xml_from_archive(
            "word/document.xml"
        )

    def get_relationships(
        self,
    ) -> Dict[str, str]:
        """
        Retourne les relations de word/document.xml.

        Ces relations permettent notamment de résoudre :

        - images ;
        - graphiques ;
        - SmartArt ;
        - autres objets externes.
        """

        return self._read_relationships(
            "word/_rels/document.xml.rels"
        )

    def get_media_files(self) -> list[str]:
        """
        Retourne les fichiers médias présents dans l'archive DOCX.
        """

        if not self.archive_names:
            try:
                with zipfile.ZipFile(
                    self.document_path,
                    "r",
                ) as archive:
                    self.archive_names = set(
                        archive.namelist()
                    )

            except (
                zipfile.BadZipFile,
                OSError,
            ):
                return []

        return sorted(
            name
            for name in self.archive_names
            if name.startswith("word/media/")
        )

    def get_statistics(self) -> Dict[str, int]:
        """
        Retourne uniquement les statistiques numériques.
        """

        result = self.analyze()

        return {
            "paragraphs_count": result[
                "paragraphs_count"
            ],
            "headings_count": result[
                "headings_count"
            ],
            "words_count": result[
                "words_count"
            ],
            "tables_count": result[
                "tables_count"
            ],
            "images_count": result[
                "images_count"
            ],
            "comments_count": result[
                "comments_count"
            ],
            "footnotes_count": result[
                "footnotes_count"
            ],
            "equations_count": result[
                "equations_count"
            ],
            "diagrams_count": result[
                "diagrams_count"
            ],
            "figures_count": result[
                "figures_count"
            ],
            "references_count": result[
                "references_count"
            ],
            "scientific_elements_count": result[
                "scientific_elements_count"
            ],
        }


__all__ = [
    "DocumentAnalyzer",
]