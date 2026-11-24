# ==========================================================
# MACEVO IA
# Scientific Generator Service
# ==========================================================

"""
Générateur scientifique de MACEVO.

Responsabilités :
- préparer un projet scientifique ;
- construire son blueprint ;
- déterminer les sections ;
- construire les prompts scientifiques ;
- générer les sections une par une ;
- éviter la fabrication de données/résultats/références ;
- demander explicitement les données manquantes ;
- préparer une structure exploitable par l'éditeur MACEVO.

Architecture :

    ScientificGeneratorService
              ↓
    Scientific Prompt Builder
              ↓
           AIService
              ↓
        ModelManager
              ↓
       OllamaService
              ↓
         OllamaClient
              ↓
            Ollama
"""

import json
import logging
from typing import Any, Dict, List, Optional


from projects.services.ai_service import AIService


logger = logging.getLogger(__name__)


class ScientificGeneratorService:
    """
    Orchestrateur principal de la génération scientifique MACEVO.

    Ce service ne remplace pas AIService.

    AIService reste responsable de la communication avec
    le moteur IA.

    ScientificGeneratorService est responsable de la logique
    scientifique et de l'orchestration de la génération.
    """

    # =========================================================
    # TYPES DE TRAVAUX
    # =========================================================

    RESEARCH_TYPE_RULES = {
        "Revue de littérature": {
            "method": (
                "Identifier, sélectionner, analyser et synthétiser "
                "la littérature pertinente."
            ),
            "must_have": [
                "question de recherche",
                "stratégie de recherche",
                "critères d'inclusion et d'exclusion",
                "synthèse critique",
                "limites",
            ],
            "guideline": "PRISMA si applicable",
        },

        "Étude expérimentale": {
            "method": (
                "Présenter une démarche expérimentale reproductible "
                "avec variables, protocole, mesures et analyse."
            ),
            "must_have": [
                "hypothèses",
                "variables",
                "matériel",
                "protocole",
                "résultats",
                "analyse",
                "limites",
            ],
            "guideline": "Selon le domaine",
        },

        "Étude observationnelle": {
            "method": (
                "Analyser des observations sans intervention "
                "expérimentale directe."
            ),
            "must_have": [
                "population",
                "échantillon",
                "variables",
                "méthode de collecte",
                "analyse",
                "limites",
            ],
            "guideline": "STROBE si applicable",
        },

        "Étude descriptive": {
            "method": (
                "Décrire systématiquement un phénomène, "
                "une population ou une situation."
            ),
            "must_have": [
                "population",
                "variables",
                "méthode",
                "résultats descriptifs",
                "discussion",
            ],
            "guideline": "Selon le domaine",
        },

        "Étude comparative": {
            "method": (
                "Comparer plusieurs groupes, méthodes, systèmes "
                "ou situations selon des critères explicites."
            ),
            "must_have": [
                "critères de comparaison",
                "groupes ou méthodes",
                "mesures",
                "résultats",
                "analyse comparative",
            ],
            "guideline": "Selon le domaine",
        },

        "Étude de cas": {
            "method": (
                "Analyser de manière approfondie un cas particulier "
                "dans son contexte."
            ),
            "must_have": [
                "présentation du cas",
                "contexte",
                "méthode d'analyse",
                "résultats",
                "discussion",
                "limites",
            ],
            "guideline": "Selon le domaine",
        },

        "Recherche quantitative": {
            "method": (
                "Produire et analyser des données quantitatives "
                "avec des méthodes statistiques appropriées."
            ),
            "must_have": [
                "variables",
                "échantillon",
                "méthode",
                "analyse statistique",
                "résultats",
                "limites",
            ],
            "guideline": "Selon le domaine",
        },

        "Recherche qualitative": {
            "method": (
                "Analyser des données qualitatives afin de faire "
                "émerger des thèmes, catégories ou interprétations."
            ),
            "must_have": [
                "population",
                "collecte des données",
                "méthode d'analyse",
                "thèmes",
                "interprétation",
                "limites",
            ],
            "guideline": "Selon le domaine",
        },

        "Recherche mixte": {
            "method": (
                "Combiner des méthodes quantitatives et qualitatives "
                "dans un même protocole de recherche."
            ),
            "must_have": [
                "volet quantitatif",
                "volet qualitatif",
                "stratégie d'intégration",
                "résultats",
                "discussion",
            ],
            "guideline": "Selon le domaine",
        },

        "R&D": {
            "method": (
                "Concevoir, développer et évaluer une solution "
                "ou un prototype."
            ),
            "must_have": [
                "problème",
                "cahier des charges",
                "conception",
                "implémentation",
                "évaluation",
                "limites",
            ],
            "guideline": "Selon le domaine",
        },

        "Modélisation": {
            "method": (
                "Construire un modèle permettant de représenter "
                "ou d'expliquer un phénomène."
            ),
            "must_have": [
                "hypothèses",
                "variables",
                "équations ou règles",
                "paramètres",
                "validation",
                "limites",
            ],
            "guideline": "Selon le domaine",
        },

        "Simulation numérique": {
            "method": (
                "Étudier un phénomène au moyen d'un modèle "
                "numérique ou computationnel."
            ),
            "must_have": [
                "modèle",
                "paramètres",
                "conditions initiales",
                "méthode numérique",
                "résultats",
                "validation",
            ],
            "guideline": "Selon le domaine",
        },

        "Conception / implémentation": {
            "method": (
                "Concevoir et implémenter une solution technique "
                "répondant à un problème défini."
            ),
            "must_have": [
                "analyse des besoins",
                "architecture",
                "conception",
                "implémentation",
                "tests",
                "évaluation",
            ],
            "guideline": "Selon le domaine",
        },
    }

    # =========================================================
    # STRUCTURES PAR TYPE
    # =========================================================

    SECTION_STRUCTURES = {
        "Mémoire": [
            "Introduction générale",
            "Revue de littérature",
            "Problématique",
            "Objectifs",
            "Méthodologie",
            "Résultats",
            "Discussion",
            "Conclusion générale",
            "Références bibliographiques",
            "Annexes",
        ],

        "Thèse": [
            "Introduction générale",
            "État de l'art",
            "Problématique",
            "Cadre théorique",
            "Méthodologie",
            "Résultats",
            "Discussion",
            "Conclusion générale",
            "Références bibliographiques",
            "Annexes",
        ],

        "Rapport de stage": [
            "Introduction",
            "Présentation de la structure d'accueil",
            "Contexte et problématique",
            "Missions réalisées",
            "Méthodologie",
            "Résultats et réalisations",
            "Analyse et discussion",
            "Apports du stage",
            "Limites et recommandations",
            "Conclusion",
            "Références",
            "Annexes",
        ],

        "Article scientifique": [
            "Résumé",
            "Mots-clés",
            "Introduction",
            "État de l'art",
            "Méthodologie",
            "Résultats",
            "Discussion",
            "Conclusion",
            "Références",
        ],

        "Projet": [
            "Introduction",
            "Contexte et justification",
            "Problématique",
            "Objectifs",
            "Analyse des besoins",
            "Conception",
            "Méthodologie",
            "Implémentation",
            "Tests et validation",
            "Résultats",
            "Discussion",
            "Conclusion",
            "Références",
            "Annexes",
        ],

        "Rapport technique": [
            "Introduction",
            "Contexte technique",
            "Problématique",
            "Spécifications",
            "Architecture",
            "Méthodologie",
            "Implémentation",
            "Tests",
            "Résultats",
            "Analyse",
            "Limites",
            "Conclusion",
            "Références",
            "Annexes",
        ],
    }

    DEFAULT_STRUCTURE = [
        "Introduction générale",
        "Revue de littérature",
        "Méthodologie",
        "Résultats",
        "Discussion",
        "Conclusion générale",
        "Références bibliographiques",
        "Annexes",
    ]

    # =========================================================
    # INITIALISATION
    # =========================================================

    def __init__(
        self,
        *,
        report=None,
        profile=None,
        generation_config=None,
    ):
        """
        Initialise le générateur.

        Parameters
        ----------
        report :
            Données du rapport provenant du frontend/backend.

        profile :
            Profil scientifique du document.

        generation_config :
            Configuration détaillée de génération.
        """

        self.report = report or {}
        self.profile = profile or {}
        self.generation_config = (
            generation_config or {}
        )

    # =========================================================
    # OUTILS
    # =========================================================

    @staticmethod
    def _clean(value):
        """
        Convertit une valeur en texte propre.
        """

        if value is None:
            return ""

        return str(value).strip()

    @staticmethod
    def _safe_list(value):
        """
        Garantit une liste.
        """

        if value is None:
            return []

        if isinstance(value, list):
            return value

        if isinstance(value, tuple):
            return list(value)

        return [value]

    # =========================================================
    # INFORMATIONS DU DOCUMENT
    # =========================================================

    def get_document_info(self):
        """
        Retourne les informations scientifiques normalisées.
        """

        return {
            "title": self._clean(
                self.report.get("title")
                or self.profile.get("title")
            ),

            "report_type": self._clean(
                self.report.get("report_type")
                or self.profile.get("report_type")
                or "Mémoire"
            ),

            "discipline": self._clean(
                self.report.get("scientific_field")
                or self.profile.get("discipline")
            ),

            "specialization": self._clean(
                self.report.get("specialization")
                or self.profile.get("specialization")
            ),

            "academic_level": self._clean(
                self.report.get("academic_level")
                or self.profile.get("academic_level")
            ),

            "language": self._clean(
                self.report.get("language")
                or self.profile.get("language")
                or "Français"
            ),

            "institution": self._clean(
                self.report.get("institution")
            ),

            "academic_year": self._clean(
                self.report.get("academic_year")
            ),
        }

    # =========================================================
    # TYPE DE RECHERCHE
    # =========================================================

    def get_research_type(self):
        """
        Retourne le type de recherche sélectionné.
        """

        return (
            self._clean(
                self.generation_config.get(
                    "researchType"
                )
            )
            or "Revue de littérature"
        )

    def get_research_rules(self):
        """
        Retourne les règles associées au type de recherche.
        """

        research_type = self.get_research_type()

        return self.RESEARCH_TYPE_RULES.get(
            research_type,
            {
                "method": (
                    "Définir une méthodologie cohérente "
                    "avec la question de recherche."
                ),
                "must_have": [],
                "guideline": "Selon le domaine",
            },
        )

    # =========================================================
    # STRUCTURE
    # =========================================================

    def get_sections(self):
        """
        Retourne les sections adaptées au type de document.
        """

        report_type = self._clean(
            self.report.get("report_type")
            or self.profile.get("report_type")
        )

        sections = self.SECTION_STRUCTURES.get(
            report_type
        )

        if sections:
            return list(sections)

        return list(
            self.DEFAULT_STRUCTURE
        )

    # =========================================================
    # BLUEPRINT
    # =========================================================

    def build_blueprint(self):
        """
        Construit le blueprint scientifique du document.

        Le blueprint est une représentation structurée du futur
        document avant sa génération.
        """

        document = self.get_document_info()
        research_rules = self.get_research_rules()

        research_objective = self._clean(
            self.generation_config.get(
                "researchObjective"
            )
        )

        research_question = self._clean(
            self.generation_config.get(
                "researchQuestion"
            )
        )

        hypotheses = self._clean(
            self.generation_config.get(
                "hypotheses"
            )
        )

        methodology = self._clean(
            self.generation_config.get(
                "methodology"
            )
        )

        target_pages = self._clean(
            self.generation_config.get(
                "targetPages"
            )
            or "automatic"
        )

        citation_style = self._clean(
            self.generation_config.get(
                "citationStyle"
            )
            or "APA 7"
        )

        elements = (
            self.generation_config.get(
                "elements"
            )
            or {}
        )

        sections = self.get_sections()

        blueprint_sections = []

        for index, title in enumerate(
            sections,
            start=1,
        ):
            blueprint_sections.append(
                {
                    "number": index,
                    "title": title,
                    "status": "pending",
                    "content": "",
                    "sources": [],
                    "validation": {
                        "status": "pending",
                        "issues": [],
                    },
                }
            )

        return {
            "version": "1.0",

            "document": document,

            "research": {
                "type": self.get_research_type(),
                "objective": research_objective,
                "question": research_question,
                "hypotheses": hypotheses,
                "methodology": methodology,
                "rules": research_rules,
            },

            "generation": {
                "target_pages": target_pages,
                "citation_style": citation_style,
                "elements": elements,
            },

            "sections": blueprint_sections,

            "workflow": [
                "planning",
                "research",
                "generation",
                "validation",
                "review",
            ],
        }

    # =========================================================
    # PROMPT SYSTÈME SCIENTIFIQUE
    # =========================================================

    def build_scientific_system_prompt(self):
        """
        Construit les règles scientifiques fondamentales.
        """

        document = self.get_document_info()
        research_rules = self.get_research_rules()

        language = (
            document["language"]
            or "Français"
        )

        return f"""
Tu es le moteur scientifique de MACEVO.

Tu dois produire un contenu académique rigoureux,
structuré et vérifiable.

INFORMATIONS DU DOCUMENT

Titre :
{document["title"]}

Type :
{document["report_type"]}

Discipline :
{document["discipline"]}

Spécialisation :
{document["specialization"]}

Niveau académique :
{document["academic_level"]}

Langue :
{language}

TYPE DE RECHERCHE

{self.get_research_type()}

MÉTHODE

{research_rules["method"]}

RÈGLES OBLIGATOIRES

1. Ne jamais inventer de données expérimentales.

2. Ne jamais inventer de statistiques.

3. Ne jamais inventer de résultats.

4. Ne jamais inventer de références bibliographiques.

5. Ne jamais inventer de DOI.

6. Ne jamais présenter une hypothèse comme un résultat.

7. Si une information indispensable manque, utiliser
   explicitement un emplacement à compléter ou signaler
   que l'information est nécessaire.

8. Distinguer clairement :
   - faits établis ;
   - hypothèses ;
   - interprétations ;
   - propositions.

9. Utiliser un raisonnement scientifique cohérent.

10. Éviter le remplissage artificiel.

11. Les sections doivent être suffisamment développées
    pour correspondre au niveau académique demandé.

12. Respecter la discipline scientifique sélectionnée.

13. Respecter le type de recherche sélectionné.

14. Les équations doivent être accompagnées d'une
    explication scientifique lorsqu'elles sont pertinentes.

15. Les tableaux et figures doivent être introduits
    et interprétés dans le texte.

16. Les références doivent être traçables.

17. Ne jamais prétendre avoir consulté une source qui
    n'a pas réellement été fournie au moteur.

18. Ne jamais fabriquer une citation pour donner
    l'impression qu'une affirmation est sourcée.

19. Produire un texte scientifique naturel et professionnel.

20. La langue de sortie doit être :
    {language}.
"""

    # =========================================================
    # PROMPT DE SECTION
    # =========================================================

    def build_section_prompt(
        self,
        section,
        *,
        section_number=None,
        previous_sections=None,
        sources=None,
    ):
        """
        Construit le prompt spécifique à une section.
        """

        document = self.get_document_info()
        research_rules = self.get_research_rules()

        previous_sections = (
            previous_sections or []
        )

        sources = sources or []

        objective = self._clean(
            self.generation_config.get(
                "researchObjective"
            )
        )

        question = self._clean(
            self.generation_config.get(
                "researchQuestion"
            )
        )

        methodology = self._clean(
            self.generation_config.get(
                "methodology"
            )
        )

        citation_style = self._clean(
            self.generation_config.get(
                "citationStyle"
            )
            or "APA 7"
        )

        previous_context = ""

        if previous_sections:

            previous_context = "\n\n".join(
                [
                    (
                        f"Section {item.get('number')}: "
                        f"{item.get('title')}\n"
                        f"{item.get('content', '')[:4000]}"
                    )
                    for item in previous_sections[-3:]
                ]
            )

        source_context = ""

        if sources:

            source_context = "\n\n".join(
                [
                    self._format_source(source)
                    for source in sources
                ]
            )

        return f"""
Rédige la section scientifique suivante pour MACEVO.

DOCUMENT

Titre :
{document["title"]}

Type :
{document["report_type"]}

Discipline :
{document["discipline"]}

Spécialisation :
{document["specialization"]}

Niveau :
{document["academic_level"]}

Langue :
{document["language"]}

TYPE DE RECHERCHE

{self.get_research_type()}

RÈGLES MÉTHODOLOGIQUES

{research_rules["method"]}

OBJECTIF DE RECHERCHE

{objective or "Non précisé."}

QUESTION DE RECHERCHE

{question or "Non précisée."}

MÉTHODOLOGIE FOURNIE

{methodology or "À définir à partir des informations disponibles."}

STYLE DE CITATION

{citation_style}

SECTION À RÉDIGER

Numéro :
{section_number or ""}

Titre :
{section}

SECTIONS PRÉCÉDENTES

{previous_context or "Aucune section précédente."}

SOURCES FOURNIES

{source_context or "Aucune source vérifiée fournie."}

INSTRUCTIONS

- Développe réellement la section.
- Ne fais pas un simple résumé.
- Utilise une structure académique cohérente.
- Ajoute des sous-sections lorsque cela améliore la
  compréhension scientifique.
- Assure une transition logique avec les autres parties.
- Ne répète pas inutilement les sections précédentes.
- Ne fabrique aucune donnée.
- Ne fabrique aucune référence.
- Ne fabrique aucun résultat.
- Si des données sont indispensables mais absentes,
  indique précisément ce qui manque.
- Lorsque des références fournies sont disponibles,
  utilise uniquement celles-ci pour les affirmations
  qui nécessitent une source.
- N'ajoute pas de commentaire du type "Voici votre section".
- Retourne directement le contenu scientifique.
"""

    # =========================================================
    # SOURCES
    # =========================================================

    @staticmethod
    def _format_source(source):
        """
        Formate une source déjà fournie.

        Cette méthode ne crée jamais de source.
        """

        if not isinstance(source, dict):
            return str(source)

        title = source.get(
            "title",
            "",
        )

        authors = source.get(
            "authors",
            "",
        )

        year = source.get(
            "year",
            "",
        )

        journal = source.get(
            "journal",
            "",
        )

        doi = source.get(
            "doi",
            "",
        )

        url = source.get(
            "url",
            "",
        )

        return (
            f"Titre : {title}\n"
            f"Auteurs : {authors}\n"
            f"Année : {year}\n"
            f"Publication : {journal}\n"
            f"DOI : {doi}\n"
            f"URL : {url}"
        )

    # =========================================================
    # GÉNÉRATION D'UNE SECTION
    # =========================================================

    def generate_section(
        self,
        section,
        *,
        section_number=None,
        previous_sections=None,
        sources=None,
    ):
        """
        Génère une section complète avec AIService.
        """

        system_prompt = (
            self.build_scientific_system_prompt()
        )

        section_prompt = self.build_section_prompt(
            section,
            section_number=section_number,
            previous_sections=previous_sections,
            sources=sources,
        )

        messages = [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": section_prompt,
            },
        ]

        logger.info(
            "Génération scientifique | section=%s | "
            "number=%s",
            section,
            section_number,
        )

        response = AIService.generate(
            messages
        )

        if response is None:
            raise ValueError(
                "Le moteur IA n'a retourné aucune réponse."
            )

        response = str(
            response
        ).strip()

        if not response:
            raise ValueError(
                f"Aucun contenu généré pour la section "
                f"'{section}'."
            )

        return response

    # =========================================================
    # GÉNÉRATION DU DOCUMENT
    # =========================================================

    def generate_document(
        self,
        *,
        sources=None,
        stop_on_error=True,
    ):
        """
        Génère le document section par section.

        IMPORTANT :
        Chaque section est générée séparément afin d'éviter
        l'envoi d'un énorme prompt contenant tout le document.
        """

        blueprint = self.build_blueprint()

        sources = sources or []

        generated_sections = []

        for section_data in blueprint[
            "sections"
        ]:

            section_title = section_data[
                "title"
            ]

            section_number = section_data[
                "number"
            ]

            logger.info(
                "Génération document | %s/%s | %s",
                section_number,
                len(blueprint["sections"]),
                section_title,
            )

            try:

                content = self.generate_section(
                    section_title,
                    section_number=section_number,
                    previous_sections=generated_sections,
                    sources=sources,
                )

                section_data[
                    "content"
                ] = content

                section_data[
                    "status"
                ] = "generated"

                generated_sections.append(
                    {
                        "number": section_number,
                        "title": section_title,
                        "content": content,
                    }
                )

            except Exception as exc:

                logger.exception(
                    "Erreur génération section '%s'",
                    section_title,
                )

                section_data[
                    "status"
                ] = "error"

                section_data[
                    "error"
                ] = str(exc)

                if stop_on_error:
                    raise

        blueprint[
            "sections"
        ] = generated_sections

        return blueprint

    # =========================================================
    # GÉNÉRATION D'UNE LISTE DE SECTIONS
    # =========================================================

    def generate_selected_sections(
        self,
        sections,
        *,
        sources=None,
    ):
        """
        Génère uniquement les sections demandées.
        """

        generated = []

        sources = sources or []

        for index, section in enumerate(
            sections,
            start=1,
        ):

            content = self.generate_section(
                section,
                section_number=index,
                previous_sections=generated,
                sources=sources,
            )

            generated.append(
                {
                    "number": index,
                    "title": section,
                    "content": content,
                    "status": "generated",
                }
            )

        return generated

    # =========================================================
    # VALIDATION BASIQUE
    # =========================================================

    @staticmethod
    def validate_generated_section(
        content,
    ):
        """
        Effectue quelques contrôles simples avant de
        considérer une section comme générée.

        Ce n'est PAS encore le validateur scientifique final.
        """

        issues = []

        content = (
            str(content).strip()
            if content is not None
            else ""
        )

        if not content:
            issues.append(
                "La section est vide."
            )

        forbidden_placeholders = [
            "Rédigez ici",
            "Écrivez ici",
            "À compléter",
            "[Votre texte ici]",
            "[Insérer",
        ]

        for placeholder in forbidden_placeholders:

            if placeholder.lower() in content.lower():

                issues.append(
                    f"Placeholder détecté : {placeholder}"
                )

        return {
            "valid": not issues,
            "issues": issues,
        }

    # =========================================================
    # EXPORT JSON
    # =========================================================

    @staticmethod
    def blueprint_to_json(
        blueprint,
    ):
        """
        Convertit un blueprint en JSON.
        """

        return json.dumps(
            blueprint,
            ensure_ascii=False,
            indent=2,
        )

    # =========================================================
    # POINT D'ENTRÉE RAPIDE
    # =========================================================

    @classmethod
    def create(
        cls,
        *,
        report=None,
        profile=None,
        generation_config=None,
    ):
        """
        Factory simple.
        """

        return cls(
            report=report,
            profile=profile,
            generation_config=generation_config,
        )