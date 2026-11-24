from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from typing import Any, Iterable

from core.ai.contracts.capability import (
    AICapability,
    CapabilityType,
)


@dataclass(slots=True)
class CapabilityResolution:
    """
    Résultat de la résolution des capacités nécessaires
    pour une requête MACEVO IA.
    """

    capabilities: list[AICapability] = field(default_factory=list)
    reasons: dict[str, list[str]] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)

    def has(
        self,
        capability_type: CapabilityType | str,
    ) -> bool:
        """
        Vérifie si une capacité est présente.
        """

        if isinstance(capability_type, CapabilityType):
            value = capability_type.value
        else:
            value = str(capability_type).strip().lower()

        return any(
            capability.capability_type.value == value
            for capability in self.capabilities
        )

    def types(self) -> list[str]:
        """
        Retourne les types de capacités résolus.
        """

        return [
            capability.capability_type.value
            for capability in self.capabilities
        ]

    def to_dict(self) -> dict[str, Any]:
        """
        Sérialise le résultat.
        """

        return {
            "capabilities": [
                capability.to_dict()
                for capability in self.capabilities
            ],
            "reasons": dict(self.reasons),
            "metadata": dict(self.metadata),
        }


class CapabilityResolver:
    """
    Résout automatiquement les capacités nécessaires
    à une requête MACEVO IA.

    Le resolver ne génère aucune réponse.

    Il identifie les capacités nécessaires afin que
    le planner puisse construire le workflow approprié.

    IMPORTANT
    ---------
    La détection des capacités doit porter sur l'intention
    fonctionnelle de l'utilisateur, et non sur les instructions
    internes destinées au modèle.

    Lorsqu'une requête contient :

        metadata["capability_input"]

    cette valeur est utilisée prioritairement.

    Exemple :

        capability_input =
            "Générer le contenu scientifique de la section Introduction"

    Le prompt complet peut, lui, contenir :

        "ne pas inventer de références bibliographiques"

    Cette instruction ne doit évidemment pas déclencher
    la capacité BIBLIOGRAPHY.
    """

    CAPABILITY_INPUT_KEY = "capability_input"

    # ------------------------------------------------------------------
    # PATTERNS
    # ------------------------------------------------------------------

    _PATTERNS: dict[CapabilityType, tuple[str, ...]] = {
        CapabilityType.VISION: (
            r"\bimage\b",
            r"\bimages\b",
            r"\bphoto\b",
            r"\bphotos\b",
            r"\bphotographie\b",
            r"\bphotographies\b",
            r"\bfigure\b",
            r"\bfigures\b",
            r"\bschema\b",
            r"\bschemas\b",
            r"\bdiagramme\b",
            r"\bdiagrammes\b",
            r"\bgraphique\b",
            r"\bgraphiques\b",
            r"\bvisualisation\b",
            r"\bvisualisations\b",
            r"\bvisuel\b",
            r"\bvisuels\b",
        ),

        CapabilityType.MATH: (
            r"\bmathematique\b",
            r"\bmathematiques\b",
            r"\bmath\b",
            r"\bcalcul\b",
            r"\bcalculer\b",
            r"\bcalculs\b",
            r"\bstatistique\b",
            r"\bstatistiques\b",
            r"\bprobabilite\b",
            r"\bprobabilites\b",
            r"\bmatrice\b",
            r"\bmatrices\b",
            r"\balgorithme\b",
            r"\balgorithmes\b",
            r"\bderivee\b",
            r"\bderivees\b",
            r"\bintegrale\b",
            r"\bintegrales\b",
            r"\bfonction\b",
            r"\bfonctions\b",
            r"\btheoreme\b",
            r"\btheoremes\b",
        ),

        CapabilityType.EQUATION: (
            r"\bequation\b",
            r"\bequations\b",
            r"\bformule\b",
            r"\bformules\b",
            r"\bexpression mathematique\b",
            r"\bexpressions mathematiques\b",
            r"\bequation differentielle\b",
            r"\bequations differentielles\b",
        ),

        CapabilityType.SCIENTIFIC: (
            r"\bscientifique\b",
            r"\bscientifiques\b",
            r"\bscience\b",
            r"\bsciences\b",
            r"\bhypothese\b",
            r"\bhypotheses\b",
            r"\bmethodologie\b",
            r"\bmethodologies\b",
            r"\bmethode scientifique\b",
            r"\bmethodes scientifiques\b",
            r"\bexperience\b",
            r"\bexperiences\b",
            r"\bexperimental\b",
            r"\bexperimentale\b",
            r"\bexperimentaux\b",
            r"\banalyse scientifique\b",
            r"\bdiscussion scientifique\b",
            r"\bresultats scientifiques\b",
            r"\barticle scientifique\b",
            r"\bpublication scientifique\b",
            r"\bacademique\b",
            r"\bacademiques\b",
        ),

        CapabilityType.DOCUMENT: (
            r"\bdocument\b",
            r"\bdocuments\b",
            r"\brapport\b",
            r"\brapports\b",
            r"\bmemoire\b",
            r"\bmemoires\b",
            r"\bthese\b",
            r"\btheses\b",
            r"\bmanuscrit\b",
            r"\bmanuscrits\b",
            r"\bfichier\b",
            r"\bfichiers\b",
            r"\bchapitre\b",
            r"\bchapitres\b",
            r"\bsection\b",
            r"\bsections\b",
            r"\bsous-section\b",
            r"\bsous-sections\b",
            r"\bpage\b",
            r"\bpages\b",
        ),

        CapabilityType.FIGURE: (
            r"\bfigure\b",
            r"\bfigures\b",
            r"\bschema\b",
            r"\bschemas\b",
            r"\bdiagramme\b",
            r"\bdiagrammes\b",
            r"\bgraphique\b",
            r"\bgraphiques\b",
            r"\bvisualisation\b",
            r"\bvisualisations\b",
            r"\bvisualiser\b",
            r"\bcourbe\b",
            r"\bcourbes\b",
        ),

        CapabilityType.TABLE: (
            r"\btableau\b",
            r"\btableaux\b",
            r"\btable\b",
            r"\btables\b",
            r"\bcomparatif\b",
            r"\bcomparatifs\b",
            r"\bmatrice de donnees\b",
            r"\bmatrices de donnees\b",
        ),

        CapabilityType.CODE: (
            r"\bcode\b",
            r"\bcodes\b",
            r"\bpython\b",
            r"\bjavascript\b",
            r"\btypescript\b",
            r"\bjava\b",
            r"\bc\+\+\b",
            r"\bsql\b",
            r"\bprogramme\b",
            r"\bprogrammer\b",
            r"\bprogrammation\b",
            r"\bscript\b",
            r"\bscripting\b",
        ),

        CapabilityType.LATEX: (
            r"\blatex\b",
            r"\btex\b",
            r"\bcode latex\b",
            r"\bfichier latex\b",
            r"\bdocument latex\b",
            r"\bcompiler en latex\b",
        ),

        # IMPORTANT :
        # On ne met volontairement PAS :
        #
        #   r"\breference\b"
        #   r"\breferences\b"
        #   r"\bcitation\b"
        #
        # comme déclencheurs génériques.
        #
        # Ces termes peuvent apparaître dans une instruction négative
        # ou descriptive sans constituer une demande bibliographique.
        CapabilityType.BIBLIOGRAPHY: (
            r"\bbibliographie\b",
            r"\bbibliographies\b",
            r"\bbibliographique\b",
            r"\bbibliographiques\b",
            r"\bcitation\b",
            r"\bcitations\b",
            r"\bciter\b",
            r"\bcitez\b",
            r"\bcite les sources\b",
            r"\bciter les sources\b",
            r"\bsources scientifiques\b",
            r"\bsources academiques\b",
            r"\breferences scientifiques\b",
            r"\breferences academiques\b",
            r"\breferences bibliographiques\b",
            r"\breference bibliographique\b",
            r"\bdoi\b",
            r"\bbibtex\b",
            r"\bapa\b",
            r"\bieee\b",
            r"\bmla\b",
            r"\bchicago\b",
        ),

        CapabilityType.ANALYSIS: (
            r"\banalyse\b",
            r"\banalyser\b",
            r"\betudier\b",
            r"\betudie\b",
            r"\bexamine\b",
            r"\bexaminer\b",
            r"\bevaluer\b",
            r"\bevaluation\b",
            r"\binterpreter\b",
            r"\binterpretation\b",
            r"\bdiagnostiquer\b",
            r"\bidentifier les lacunes\b",
            r"\bidentifier les erreurs\b",
        ),

        CapabilityType.VALIDATION: (
            r"\bverifie\b",
            r"\bverifier\b",
            r"\bverification\b",
            r"\bvalidation\b",
            r"\bvalider\b",
            r"\bvalide\b",
            r"\bcontrole\b",
            r"\bcontroler\b",
            r"\bcoherence\b",
            r"\bcoherent\b",
            r"\bcoherente\b",
            r"\bexactitude\b",
            r"\berreur\b",
            r"\berreurs\b",
            r"\bcorrige\b",
            r"\bcorriger\b",
            r"\bcorrection\b",
        ),
    }

    # ------------------------------------------------------------------
    # EXPLICIT ALIASES
    # ------------------------------------------------------------------

    _EXPLICIT_ALIASES: dict[str, CapabilityType] = {
        "text": CapabilityType.TEXT,
        "texte": CapabilityType.TEXT,

        "vision": CapabilityType.VISION,
        "image": CapabilityType.VISION,

        "math": CapabilityType.MATH,
        "maths": CapabilityType.MATH,
        "mathematics": CapabilityType.MATH,
        "mathematique": CapabilityType.MATH,

        "scientific": CapabilityType.SCIENTIFIC,
        "science": CapabilityType.SCIENTIFIC,
        "scientifique": CapabilityType.SCIENTIFIC,

        "document": CapabilityType.DOCUMENT,
        "documents": CapabilityType.DOCUMENT,

        "equation": CapabilityType.EQUATION,
        "equations": CapabilityType.EQUATION,

        "figure": CapabilityType.FIGURE,
        "figures": CapabilityType.FIGURE,

        "table": CapabilityType.TABLE,
        "tableau": CapabilityType.TABLE,

        "code": CapabilityType.CODE,

        "latex": CapabilityType.LATEX,
        "tex": CapabilityType.LATEX,

        "bibliography": CapabilityType.BIBLIOGRAPHY,
        "bibliographie": CapabilityType.BIBLIOGRAPHY,

        "analysis": CapabilityType.ANALYSIS,
        "analyse": CapabilityType.ANALYSIS,

        "validation": CapabilityType.VALIDATION,
    }

    # ------------------------------------------------------------------
    # PRIORITÉ
    # ------------------------------------------------------------------

    _PRIORITY: dict[CapabilityType, int] = {
        CapabilityType.TEXT: 0,
        CapabilityType.VISION: 10,
        CapabilityType.MATH: 20,
        CapabilityType.SCIENTIFIC: 30,
        CapabilityType.DOCUMENT: 40,
        CapabilityType.ANALYSIS: 50,
        CapabilityType.EQUATION: 60,
        CapabilityType.FIGURE: 70,
        CapabilityType.TABLE: 80,
        CapabilityType.CODE: 90,
        CapabilityType.BIBLIOGRAPHY: 100,
        CapabilityType.LATEX: 110,
        CapabilityType.VALIDATION: 120,
    }

    def __init__(
        self,
        *,
        default_capability: CapabilityType = CapabilityType.TEXT,
    ) -> None:
        self.default_capability = default_capability

    # ------------------------------------------------------------------
    # RESOLUTION
    # ------------------------------------------------------------------

    def resolve(
        self,
        request: Any = None,
        *,
        text: str | None = None,
        explicit: Iterable[CapabilityType | str] | None = None,
    ) -> CapabilityResolution:
        """
        Analyse la requête et retourne les capacités nécessaires.

        Ordre de priorité pour le texte analysé :

        1. ``text=...`` explicite ;
        2. ``metadata["capability_input"]`` ;
        3. message utilisateur.

        Les instructions internes ne sont jamais utilisées comme
        source d'intention lorsque ``capability_input`` est fourni.
        """

        source_text, source_type = self._extract_text(
            request,
            text,
        )

        normalized_text = self._normalize_text(
            source_text
        )

        capabilities: list[CapabilityType] = []
        reasons: dict[str, list[str]] = {}

        self._add_capability(
            capabilities,
            reasons,
            self.default_capability,
            "capacité par défaut",
        )

        explicit_values = list(
            explicit
            if explicit is not None
            else self._extract_explicit_capabilities(request)
        )

        for value in explicit_values:
            capability = self._normalize_capability(
                value
            )

            if capability is None:
                continue

            self._add_capability(
                capabilities,
                reasons,
                capability,
                "capacité explicitement demandée",
            )

        # --------------------------------------------------------------
        # DÉTECTION PAR MOTIFS
        # --------------------------------------------------------------

        for capability_type, patterns in self._PATTERNS.items():

            matched = [
                pattern
                for pattern in patterns
                if re.search(
                    pattern,
                    normalized_text,
                    flags=re.IGNORECASE,
                )
            ]

            if not matched:
                continue

            self._add_capability(
                capabilities,
                reasons,
                capability_type,
                (
                    "mots-clés détectés: "
                    + ", ".join(matched[:5])
                ),
            )

        # --------------------------------------------------------------
        # RÈGLES SÉMANTIQUES
        # --------------------------------------------------------------

        self._apply_semantic_rules(
            normalized_text,
            capabilities,
            reasons,
            request,
        )

        ordered = self._order_capabilities(
            capabilities
        )

        resolved_capabilities = [
            self._build_capability(
                capability_type,
                reasons,
            )
            for capability_type in ordered
        ]

        return CapabilityResolution(
            capabilities=resolved_capabilities,
            reasons=reasons,
            metadata={
                "source_text_length": len(source_text),
                "source_type": source_type,
                "capability_input_used": (
                    source_type == "capability_input"
                ),
                "capability_count": len(
                    resolved_capabilities
                ),
                "capability_types": [
                    capability.value
                    for capability in ordered
                ],
            },
        )

    # ------------------------------------------------------------------
    # TYPES UNIQUEMENT
    # ------------------------------------------------------------------

    def resolve_types(
        self,
        request: Any = None,
        *,
        text: str | None = None,
        explicit: Iterable[CapabilityType | str] | None = None,
    ) -> list[CapabilityType]:
        """
        Retourne uniquement les types de capacités.
        """

        resolution = self.resolve(
            request,
            text=text,
            explicit=explicit,
        )

        return [
            capability.capability_type
            for capability in resolution.capabilities
        ]

    # ------------------------------------------------------------------
    # EXTRACTION DU TEXTE
    # ------------------------------------------------------------------

    def _extract_text(
        self,
        request: Any,
        text: str | None,
    ) -> tuple[str, str]:

        # --------------------------------------------------------------
        # 1. TEXTE EXPLICITE
        # --------------------------------------------------------------

        if text is not None:
            return str(text), "explicit_text"

        if request is None:
            return "", "empty"

        # --------------------------------------------------------------
        # 2. CHAÎNE DIRECTE
        # --------------------------------------------------------------

        if isinstance(request, str):
            return request, "direct_string"

        # --------------------------------------------------------------
        # 3. CAPABILITY INPUT
        # --------------------------------------------------------------

        metadata = getattr(
            request,
            "metadata",
            None,
        ) or {}

        capability_input = metadata.get(
            self.CAPABILITY_INPUT_KEY
        )

        if isinstance(
            capability_input,
            str,
        ) and capability_input.strip():

            return (
                capability_input,
                "capability_input",
            )

        # --------------------------------------------------------------
        # 4. MESSAGE UTILISATEUR
        # --------------------------------------------------------------

        user_message = getattr(
            request,
            "user_message",
            None,
        )

        if user_message is not None:

            if callable(user_message):
                user_message = user_message()

            if hasattr(
                user_message,
                "content",
            ):
                return (
                    str(
                        user_message.content or ""
                    ),
                    "user_message",
                )

            return (
                str(user_message or ""),
                "user_message",
            )

        # --------------------------------------------------------------
        # 5. LISTE DES MESSAGES
        # --------------------------------------------------------------

        messages = getattr(
            request,
            "messages",
            None,
        )

        if messages:

            for message in reversed(messages):

                role = getattr(
                    message,
                    "role",
                    None,
                )

                if hasattr(
                    role,
                    "value",
                ):
                    role = role.value

                if (
                    str(role).strip().lower()
                    != "user"
                ):
                    continue

                content = getattr(
                    message,
                    "content",
                    None,
                )

                if content:
                    return (
                        str(content),
                        "user_message",
                    )

        # --------------------------------------------------------------
        # 6. FALLBACK
        # --------------------------------------------------------------

        for attribute in (
            "content",
            "message",
        ):
            value = getattr(
                request,
                attribute,
                None,
            )

            if value:
                return (
                    str(value),
                    f"request_{attribute}",
                )

        return "", "empty"

    # ------------------------------------------------------------------
    # CAPACITÉS EXPLICITES
    # ------------------------------------------------------------------

    def _extract_explicit_capabilities(
        self,
        request: Any,
    ) -> list[CapabilityType | str]:

        if request is None:
            return []

        values = getattr(
            request,
            "capabilities",
            None,
        )

        if values is None:

            metadata = getattr(
                request,
                "metadata",
                None,
            ) or {}

            values = metadata.get(
                "capabilities"
            )

        if values is None:
            return []

        if isinstance(
            values,
            (str, CapabilityType),
        ):
            return [values]

        return list(values)

    # ------------------------------------------------------------------
    # NORMALISATION CAPACITÉ
    # ------------------------------------------------------------------

    def _normalize_capability(
        self,
        value: CapabilityType | str,
    ) -> CapabilityType | None:

        if isinstance(
            value,
            CapabilityType,
        ):
            return value

        normalized = self._normalize_text(
            str(value)
        )

        if not normalized:
            return None

        alias = self._EXPLICIT_ALIASES.get(
            normalized
        )

        if alias is not None:
            return alias

        try:
            return CapabilityType(
                normalized
            )
        except ValueError:
            return None

    # ------------------------------------------------------------------
    # NORMALISATION TEXTE
    # ------------------------------------------------------------------

    def _normalize_text(
        self,
        text: str,
    ) -> str:
        """
        Normalise le texte pour une détection robuste.

        Les accents sont supprimés afin que :

            équation
            equation

        soient traités de manière équivalente.

        Cela évite également que des différences d'encodage
        perturbent la détection.
        """

        value = str(text or "")

        value = unicodedata.normalize(
            "NFKD",
            value,
        )

        value = "".join(
            character
            for character in value
            if not unicodedata.combining(character)
        )

        value = " ".join(
            value.strip().split()
        ).lower()

        return value

    # ------------------------------------------------------------------
    # AJOUT CAPACITÉ
    # ------------------------------------------------------------------

    def _add_capability(
        self,
        capabilities: list[CapabilityType],
        reasons: dict[str, list[str]],
        capability_type: CapabilityType,
        reason: str,
    ) -> None:

        if capability_type not in capabilities:
            capabilities.append(
                capability_type
            )

        key = capability_type.value

        reasons.setdefault(
            key,
            [],
        )

        if reason not in reasons[key]:
            reasons[key].append(reason)

    # ------------------------------------------------------------------
    # RÈGLES SÉMANTIQUES
    # ------------------------------------------------------------------

    def _apply_semantic_rules(
        self,
        text: str,
        capabilities: list[CapabilityType],
        reasons: dict[str, list[str]],
        request: Any,
    ) -> None:

        has_document = (
            CapabilityType.DOCUMENT
            in capabilities
        )

        has_analysis = (
            CapabilityType.ANALYSIS
            in capabilities
        )

        has_scientific = (
            CapabilityType.SCIENTIFIC
            in capabilities
        )

        # --------------------------------------------------------------
        # ANALYSE SCIENTIFIQUE
        # --------------------------------------------------------------

        if has_analysis and (
            has_document
            or has_scientific
            or any(
                term in text
                for term in (
                    "rapport",
                    "these",
                    "memoire",
                    "article scientifique",
                    "methodologie",
                    "methode scientifique",
                )
            )
        ):
            self._add_capability(
                capabilities,
                reasons,
                CapabilityType.SCIENTIFIC,
                (
                    "règle sémantique: "
                    "analyse scientifique"
                ),
            )

        # --------------------------------------------------------------
        # STRUCTURE DOCUMENTAIRE
        # --------------------------------------------------------------

        if any(
            term in text
            for term in (
                "chapitre",
                "chapitres",
                "section",
                "sections",
                "sous-section",
                "rapport complet",
                "these complete",
                "memoire complet",
                "manuscrit complet",
            )
        ):
            self._add_capability(
                capabilities,
                reasons,
                CapabilityType.DOCUMENT,
                (
                    "règle sémantique: "
                    "structure documentaire"
                ),
            )

        # --------------------------------------------------------------
        # GÉNÉRATION DE FIGURES
        # --------------------------------------------------------------

        if any(
            term in text
            for term in (
                "genere une figure",
                "generer une figure",
                "genere des figures",
                "generer des figures",
                "cree une figure",
                "creer une figure",
                "dessine un schema",
                "dessiner un schema",
                "produis un graphique",
                "produire un graphique",
            )
        ):
            self._add_capability(
                capabilities,
                reasons,
                CapabilityType.FIGURE,
                (
                    "règle sémantique: "
                    "génération visuelle"
                ),
            )

        # --------------------------------------------------------------
        # GÉNÉRATION DE TABLEAUX
        # --------------------------------------------------------------

        if any(
            term in text
            for term in (
                "genere un tableau",
                "generer un tableau",
                "genere des tableaux",
                "generer des tableaux",
                "cree un tableau",
                "creer un tableau",
                "produis un tableau",
                "produire un tableau",
            )
        ):
            self._add_capability(
                capabilities,
                reasons,
                CapabilityType.TABLE,
                (
                    "règle sémantique: "
                    "génération tabulaire"
                ),
            )

        # --------------------------------------------------------------
        # LATEX → DOCUMENT
        # --------------------------------------------------------------

        if CapabilityType.LATEX in capabilities:
            self._add_capability(
                capabilities,
                reasons,
                CapabilityType.DOCUMENT,
                (
                    "règle sémantique: "
                    "LaTeX documentaire"
                ),
            )

        # --------------------------------------------------------------
        # BIBLIOGRAPHIE
        # --------------------------------------------------------------
        #
        # IMPORTANT :
        #
        # On ne transforme PAS automatiquement le mot
        # "reference" en bibliographie.
        #
        # Les expressions ci-dessous représentent des intentions
        # bibliographiques réelles.
        #

        bibliography_intents = (
            "generer une bibliographie",
            "generer la bibliographie",
            "genere une bibliographie",
            "genere la bibliographie",
            "creer une bibliographie",
            "creer la bibliographie",
            "ajouter une bibliographie",
            "ajouter la bibliographie",
            "construire une bibliographie",
            "construire la bibliographie",
            "bibliographie complete",
            "bibliographie scientifique",
            "bibliographie academique",
            "generer des citations",
            "generer une citation",
            "ajouter des citations",
            "ajouter une citation",
            "citer les sources",
            "citer les references",
            "chercher des sources scientifiques",
            "chercher des sources academiques",
            "trouver des sources scientifiques",
            "trouver des sources academiques",
            "chercher des references scientifiques",
            "chercher des references academiques",
            "ajouter les references bibliographiques",
            "generer les references bibliographiques",
            "format apa",
            "format ieee",
            "format mla",
            "format chicago",
            "format bibtex",
        )

        if any(
            term in text
            for term in bibliography_intents
        ):
            self._add_capability(
                capabilities,
                reasons,
                CapabilityType.BIBLIOGRAPHY,
                (
                    "règle sémantique: "
                    "intention bibliographique explicite"
                ),
            )

        # --------------------------------------------------------------
        # VALIDATION DOCUMENTAIRE
        # --------------------------------------------------------------

        if (
            CapabilityType.VALIDATION
            in capabilities
            and has_document
        ):
            self._add_capability(
                capabilities,
                reasons,
                CapabilityType.ANALYSIS,
                (
                    "règle sémantique: "
                    "validation documentaire"
                ),
            )

        # --------------------------------------------------------------
        # IMAGE FOURNIE
        # --------------------------------------------------------------

        metadata = getattr(
            request,
            "metadata",
            None,
        ) or {}

        if (
            metadata.get("has_image")
            or metadata.get("image") is not None
        ):
            self._add_capability(
                capabilities,
                reasons,
                CapabilityType.VISION,
                (
                    "métadonnées: "
                    "image fournie"
                ),
            )

    # ------------------------------------------------------------------
    # ORDRE
    # ------------------------------------------------------------------

    def _order_capabilities(
        self,
        capabilities: Iterable[CapabilityType],
    ) -> list[CapabilityType]:

        unique = list(
            dict.fromkeys(capabilities)
        )

        return sorted(
            unique,
            key=lambda item: self._PRIORITY.get(
                item,
                999,
            ),
        )

    # ------------------------------------------------------------------
    # CONSTRUCTION AICAPABILITY
    # ------------------------------------------------------------------

    def _build_capability(
        self,
        capability_type: CapabilityType,
        reasons: dict[str, list[str]],
    ) -> AICapability:
        """
        Construit une AICapability conforme au contrat
        central de MACEVO.
        """

        operation = capability_type.value

        descriptions = {
            CapabilityType.TEXT: (
                "Traitement et génération de texte."
            ),
            CapabilityType.VISION: (
                "Analyse et traitement de contenus visuels."
            ),
            CapabilityType.MATH: (
                "Calcul et raisonnement mathématique."
            ),
            CapabilityType.SCIENTIFIC: (
                "Analyse et raisonnement scientifique."
            ),
            CapabilityType.DOCUMENT: (
                "Analyse et génération de documents structurés."
            ),
            CapabilityType.EQUATION: (
                "Génération et traitement d'équations."
            ),
            CapabilityType.FIGURE: (
                "Génération et traitement de figures."
            ),
            CapabilityType.TABLE: (
                "Génération et traitement de tableaux."
            ),
            CapabilityType.CODE: (
                "Génération et analyse de code."
            ),
            CapabilityType.LATEX: (
                "Génération et structuration LaTeX."
            ),
            CapabilityType.BIBLIOGRAPHY: (
                "Gestion des références et bibliographies."
            ),
            CapabilityType.ANALYSIS: (
                "Analyse approfondie de contenu."
            ),
            CapabilityType.VALIDATION: (
                "Validation et contrôle de cohérence."
            ),
        }

        return AICapability(
            name=operation,
            capability_type=capability_type,
            description=descriptions.get(
                capability_type,
                "",
            ),
            enabled=True,
            version="1.1",
            supported_operations=[
                operation,
            ],
            required_tools=[],
            supported_providers=[],
            metadata={
                "reasons": reasons.get(
                    operation,
                    [],
                ),
                "resolved_by": (
                    "CapabilityResolver"
                ),
            },
        )

    # ------------------------------------------------------------------
    # REPRESENTATION
    # ------------------------------------------------------------------

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            "default_capability="
            f"{self.default_capability.value!r}"
            ")"
        )