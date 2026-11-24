
"""
==========================================================
MACEVO IA
XML Importer
==========================================================

Importeur robuste des fichiers XML.

Objectifs :
- valider et lire les fichiers XML ;
- préserver le XML source ;
- extraire le texte lisible ;
- analyser la structure hiérarchique ;
- détecter les éléments, attributs et namespaces ;
- produire des statistiques ;
- fournir une représentation exploitable par l'IA ;
- rester compatible avec BaseImporter.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any
from xml.dom import Node, minidom

from .base_importer import BaseImporter


logger = logging.getLogger(__name__)


class XMLImporter(BaseImporter):
    """
    Importeur XML.
    """

    supported_extensions = (
        ".xml",
    )

    importer_name = "xml"

    # ---------------------------------------------------------
    # Helpers
    # ---------------------------------------------------------

    @staticmethod
    def _node_name(node: Node) -> str:
        """
        Retourne le nom d'un nœud XML.
        """
        return getattr(node, "tagName", None) or getattr(
            node,
            "nodeName",
            "",
        )

    @staticmethod
    def _node_text(node: Node) -> str:
        """
        Extrait récursivement le texte d'un nœud.
        """
        parts: list[str] = []

        for child in node.childNodes:
            if child.nodeType in (
                Node.TEXT_NODE,
                Node.CDATA_SECTION_NODE,
            ):
                text = child.data.strip()

                if text:
                    parts.append(text)

            elif child.nodeType == Node.ELEMENT_NODE:
                text = XMLImporter._node_text(child)

                if text:
                    parts.append(text)

        return " ".join(parts)

    @staticmethod
    def _extract_attributes(node: Node) -> dict[str, str]:
        """
        Extrait les attributs d'un élément XML.
        """
        attributes: dict[str, str] = {}

        if not getattr(node, "hasAttributes", lambda: False)():
            return attributes

        named_nodes = node.attributes

        if named_nodes is None:
            return attributes

        for index in range(named_nodes.length):
            attribute = named_nodes.item(index)

            if attribute is None:
                continue

            attributes[
                attribute.name
            ] = attribute.value

        return attributes

    @classmethod
    def _build_structure(
        cls,
        node: Node,
        depth: int = 0,
    ) -> dict[str, Any]:
        """
        Transforme récursivement un nœud XML en structure Python.
        """
        name = cls._node_name(node)

        element: dict[str, Any] = {
            "name": name,
            "type": (
                "element"
                if node.nodeType == Node.ELEMENT_NODE
                else "node"
            ),
            "depth": depth,
            "attributes": cls._extract_attributes(node),
            "text": "",
            "children": [],
        }

        direct_text: list[str] = []

        for child in node.childNodes:
            if child.nodeType in (
                Node.TEXT_NODE,
                Node.CDATA_SECTION_NODE,
            ):
                text = child.data.strip()

                if text:
                    direct_text.append(text)

            elif child.nodeType == Node.ELEMENT_NODE:
                element["children"].append(
                    cls._build_structure(
                        child,
                        depth=depth + 1,
                    )
                )

        element["text"] = " ".join(direct_text)

        return element

    @classmethod
    def _collect_elements(
        cls,
        node: Node,
        elements: list[dict[str, Any]],
        depth: int = 0,
    ) -> None:
        """
        Collecte tous les éléments XML.
        """
        if node.nodeType != Node.ELEMENT_NODE:
            return

        name = cls._node_name(node)

        elements.append(
            {
                "name": name,
                "depth": depth,
                "attributes": cls._extract_attributes(node),
                "text": cls._node_text(node),
            }
        )

        for child in node.childNodes:
            if child.nodeType == Node.ELEMENT_NODE:
                cls._collect_elements(
                    child,
                    elements,
                    depth + 1,
                )

    @classmethod
    def _collect_namespaces(
        cls,
        node: Node,
        namespaces: set[str],
    ) -> None:
        """
        Détecte les namespaces utilisés par le document.
        """
        if node.nodeType != Node.ELEMENT_NODE:
            return

        attributes = getattr(node, "attributes", None)

        if attributes:
            for index in range(attributes.length):
                attribute = attributes.item(index)

                if attribute is None:
                    continue

                name = attribute.name

                if name == "xmlns":
                    namespaces.add(attribute.value)

                elif name.startswith("xmlns:"):
                    namespaces.add(attribute.value)

        for child in node.childNodes:
            if child.nodeType == Node.ELEMENT_NODE:
                cls._collect_namespaces(
                    child,
                    namespaces,
                )

    @classmethod
    def _extract_text_content(
        cls,
        document,
    ) -> str:
        """
        Extrait une représentation textuelle lisible du XML.
        """
        root = document.documentElement

        if root is None:
            return ""

        return cls._node_text(root)

    # ---------------------------------------------------------
    # Import
    # ---------------------------------------------------------

    def import_document(
        self,
        file_path,
    ):
        """
        Importe un fichier XML et retourne un résultat normalisé.
        """
        path = Path(file_path)

        self.validate_file(path)

        if path.suffix.lower() not in self.supported_extensions:
            raise ValueError(
                f"Format XML non supporté : {path.suffix}"
            )

        logger.info(
            "Import du document XML : %s",
            path,
        )

        # -----------------------------------------------------
        # Lecture du fichier source
        # -----------------------------------------------------

        try:
            raw_content = path.read_text(
                encoding="utf-8-sig",
            )
        except UnicodeDecodeError:
            try:
                raw_content = path.read_text(
                    encoding="utf-8",
                )
            except UnicodeDecodeError:
                raw_content = path.read_text(
                    encoding="latin-1",
                )

        # -----------------------------------------------------
        # Parsing XML
        # -----------------------------------------------------

        try:
            document = minidom.parseString(
                raw_content,
            )
        except Exception as exc:
            logger.exception(
                "XML invalide : %s",
                path,
            )

            raise ValueError(
                f"Le fichier XML est invalide ou illisible : {path}"
            ) from exc

        root = document.documentElement

        root_name = (
            self._node_name(root)
            if root is not None
            else ""
        )

        # -----------------------------------------------------
        # Structure
        # -----------------------------------------------------

        structure = (
            self._build_structure(root)
            if root is not None
            else {}
        )

        # -----------------------------------------------------
        # Éléments
        # -----------------------------------------------------

        elements: list[dict[str, Any]] = []

        if root is not None:
            self._collect_elements(
                root,
                elements,
            )

        # -----------------------------------------------------
        # Namespaces
        # -----------------------------------------------------

        namespaces: set[str] = set()

        if root is not None:
            self._collect_namespaces(
                root,
                namespaces,
            )

        # -----------------------------------------------------
        # Texte
        # -----------------------------------------------------

        content = self._extract_text_content(
            document,
        )

        # -----------------------------------------------------
        # XML formaté
        # -----------------------------------------------------

        try:
            formatted_xml = document.toprettyxml(
                indent="  ",
                encoding="utf-8",
            ).decode("utf-8")
        except Exception:
            formatted_xml = raw_content

        # -----------------------------------------------------
        # Statistiques
        # -----------------------------------------------------

        word_count = self.count_words(content)
        character_count = len(content)
        line_count = len(content.splitlines())

        element_names = [
            element["name"]
            for element in elements
        ]

        unique_element_names = sorted(
            set(element_names)
        )

        attribute_count = sum(
            len(element["attributes"])
            for element in elements
        )

        max_depth = max(
            (
                element["depth"]
                for element in elements
            ),
            default=0,
        )

        # -----------------------------------------------------
        # Heuristique scientifique
        # -----------------------------------------------------

        scientific_keywords = (
            "article",
            "paper",
            "thesis",
            "thèse",
            "research",
            "recherche",
            "experiment",
            "expérience",
            "result",
            "résultat",
            "method",
            "méthode",
            "methodology",
            "méthodologie",
            "equation",
            "équation",
            "formula",
            "formule",
            "table",
            "figure",
            "reference",
            "référence",
            "bibliography",
            "bibliographie",
            "author",
            "auteur",
        )

        searchable_names = " ".join(
            name.lower()
            for name in unique_element_names
        )

        searchable_text = content.lower()

        scientific_matches = [
            keyword
            for keyword in scientific_keywords
            if keyword in searchable_names
            or keyword in searchable_text
        ]

        scientific_analysis = {
            "likely_scientific_document": bool(
                scientific_matches
            ),
            "matched_keywords": sorted(
                set(scientific_matches)
            ),
            "has_tables": any(
                "table" in name.lower()
                for name in unique_element_names
            ),
            "has_figures": any(
                "figure" in name.lower()
                or "fig" == name.lower()
                for name in unique_element_names
            ),
            "has_references": any(
                "reference" in name.lower()
                or "bibliograph" in name.lower()
                for name in unique_element_names
            ),
            "has_equations": any(
                "equation" in name.lower()
                or "formula" in name.lower()
                for name in unique_element_names
            ),
        }

        # -----------------------------------------------------
        # Métadonnées
        # -----------------------------------------------------

        metadata = {
            "format": "xml",
            "extension": ".xml",
            "filename": path.name,
            "source": str(path),

            "root_element": root_name,

            "element_count": len(elements),
            "unique_element_count": len(
                unique_element_names
            ),

            "attribute_count": attribute_count,
            "namespace_count": len(namespaces),
            "namespaces": sorted(namespaces),

            "max_depth": max_depth,

            "word_count": word_count,
            "character_count": character_count,
            "line_count": line_count,

            "scientific_analysis": scientific_analysis,

            "structure": structure,
        }

        # -----------------------------------------------------
        # Résultat normalisé
        # -----------------------------------------------------

        return self.build_result(
            title=path.stem,
            content=content,
            metadata=metadata,

            raw_content=raw_content,
            formatted_xml=formatted_xml,

            root_element=root_name,
            elements=elements,
            element_names=unique_element_names,
            namespaces=sorted(namespaces),

            structure=structure,
            scientific_analysis=scientific_analysis,

            source_format="xml",
            source_path=str(path),
        )

    # ---------------------------------------------------------
    # Info
    # ---------------------------------------------------------

    @classmethod
    def info(cls) -> dict[str, Any]:
        """
        Informations sur l'importeur XML.
        """
        return {
            "name": cls.importer_name,
            "format": "XML",
            "extensions": list(cls.supported_extensions),
            "features": [
                "raw_xml",
                "formatted_xml",
                "text_extraction",
                "hierarchical_structure",
                "elements",
                "attributes",
                "namespaces",
                "statistics",
                "scientific_analysis",
            ],
        }
