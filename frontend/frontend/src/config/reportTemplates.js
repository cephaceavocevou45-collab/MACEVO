/*
 * ============================================================
 * MACEVO
 * REGISTRE CENTRAL DES MODÈLES ACADÉMIQUES ET SCIENTIFIQUES
 * ============================================================
 *
 * Version : 5.0.0
 *
 * RESPONSABILITÉS
 * ------------------------------------------------------------
 * Ce fichier définit :
 * - les types de documents ;
 * - les niveaux académiques ;
 * - les langues ;
 * - les domaines scientifiques ;
 * - les normes bibliographiques ;
 * - les contextes académiques ;
 * - les structures documentaires ;
 * - les éléments préliminaires ;
 * - les règles de mise en page ;
 * - les designs visuels ;
 * - les modèles MACEVO ;
 * - la création d'une instance de document ;
 * - la validation et la recherche des modèles.
 *
 * CE FICHIER NE CONTIENT PAS :
 * - de logique React ;
 * - de logique TipTap ;
 * - d'appels API ;
 * - de navigation ;
 * - de logique d'interface ;
 * - de génération IA.
 *
 * PRINCIPLE ARCHITECTURAL
 * ------------------------------------------------------------
 *
 * CONTEXTE
 *   Pays
 *   Institution
 *   Faculté
 *   Département
 *   Domaine
 *   Niveau
 *   Langue
 *   Norme
 *
 *              ↓
 *
 * TYPE DE DOCUMENT
 *   Mémoire
 *   Article
 *   Thèse
 *   Rapport de stage
 *   Projet
 *   Rapport technique
 *
 *              ↓
 *
 * STRUCTURE
 *
 *              +
 *
 * DESIGN
 *
 *              ↓
 *
 * MODÈLE MACEVO
 *
 *              ↓
 *
 * DOCUMENT UTILISATEUR
 * ============================================================
 */

export const MACEVO_TEMPLATE_VERSION = "5.0.0";

/* ============================================================
   1. TYPES DE DOCUMENT
   ============================================================ */

export const DOCUMENT_TYPES = Object.freeze({
  MEMOIRE: "memoire",
  RAPPORT_STAGE: "rapport-stage",
  ARTICLE_SCIENTIFIQUE: "article-scientifique",
  THESE: "these",
  PROJET_FIN_ETUDES: "projet-fin-etudes",
  RAPPORT_TECHNIQUE: "rapport-technique",
  PROJET_RECHERCHE: "projet-recherche",
  RAPPORT_RECHERCHE: "rapport-recherche",
  RAPPORT_LABORATOIRE: "rapport-laboratoire",
  DOCUMENT_ACADEMIQUE: "document-academique",
  DOCUMENT_LIBRE: "document-libre",
});

/* ============================================================
   2. CATÉGORIES
   ============================================================ */

export const TEMPLATE_CATEGORIES = Object.freeze({
  MEMOIRES: "Mémoires",
  RAPPORTS_STAGE: "Rapports de stage",
  ARTICLES: "Articles scientifiques",
  THESES: "Thèses",
  PROJETS: "Projets",
  RAPPORTS_TECHNIQUES: "Rapports techniques",
  RECHERCHE: "Recherche scientifique",
  AUTRES: "Autres",
});

/* ============================================================
   3. NIVEAUX ACADÉMIQUES
   ============================================================ */

/*
 * IMPORTANT :
 *
 * Les identifiants sont normalisés.
 *
 * Un modèle MACEVO concret doit cibler UN SEUL niveau
 * académique.
 *
 * Si deux niveaux nécessitent des structures différentes,
 * deux modèles distincts doivent être créés.
 */

export const ACADEMIC_LEVELS = Object.freeze({
  SECONDARY: "secondary",

  UNDERGRADUATE: "undergraduate",

  LICENCE: "licence",

  BACHELOR: "bachelor",

  MASTER: "master",

  DOCTORATE: "doctorate",

  POSTDOCTORATE: "postdoctorate",

  PROFESSIONAL: "professional",

  RESEARCH: "research",

  OTHER: "other",
});

/* ============================================================
   4. LANGUES
   ============================================================ */

export const DOCUMENT_LANGUAGES = Object.freeze({
  FR: "fr",
  EN: "en",
  ES: "es",
  PT: "pt",
  DE: "de",
  IT: "it",
  AR: "ar",
  ZH: "zh",
  JA: "ja",
  KO: "ko",
});

/* ============================================================
   5. DOMAINES SCIENTIFIQUES
   ============================================================ */

export const SCIENTIFIC_FIELDS = Object.freeze({
  COMPUTER_SCIENCE: "computer-science",
  ENGINEERING: "engineering",
  MATHEMATICS: "mathematics",
  PHYSICS: "physics",
  CHEMISTRY: "chemistry",
  BIOLOGY: "biology",
  MEDICINE: "medicine",
  PHARMACY: "pharmacy",
  ECONOMICS: "economics",
  MANAGEMENT: "management",
  LAW: "law",
  SOCIAL_SCIENCES: "social-sciences",
  HUMANITIES: "humanities",
  EDUCATION: "education",
  ENVIRONMENTAL_SCIENCES: "environmental-sciences",
  AGRICULTURE: "agriculture",
  COMMUNICATION: "communication",
  OTHER: "other",
});

/* ============================================================
   6. NORMES BIBLIOGRAPHIQUES
   ============================================================ */

export const CITATION_STYLES = Object.freeze({
  APA: "apa",
  IEEE: "ieee",
  VANCOUVER: "vancouver",
  CHICAGO: "chicago",
  HARVARD: "harvard",
  MLA: "mla",
});

/* ============================================================
   7. DESIGNS VISUELS
   ============================================================ */

/*
 * Le design est volontairement indépendant de la structure.
 */

export const TEMPLATE_DESIGNS = Object.freeze({
  CLASSIQUE: {
    id: "classique",
    name: "Classique",
    description:
      "Présentation académique traditionnelle, sobre et adaptée aux documents universitaires.",
    fontFamily: "Times New Roman",
    bodyFontSize: 12,
    headingFontFamily: "Times New Roman",
    headingColor: "#000000",
    accentColor: "#1F4E79",
    lineSpacing: 1.5,
    alignment: "justify",
  },

  SCIENTIFIQUE: {
    id: "scientifique",
    name: "Scientifique",
    description:
      "Présentation destinée aux travaux scientifiques et expérimentaux.",
    fontFamily: "Times New Roman",
    bodyFontSize: 12,
    headingFontFamily: "Times New Roman",
    headingColor: "#000000",
    accentColor: "#1F4E79",
    lineSpacing: 1.5,
    alignment: "justify",
  },

  MODERNE: {
    id: "moderne",
    name: "Moderne",
    description:
      "Présentation contemporaine avec une hiérarchie visuelle renforcée.",
    fontFamily: "Aptos",
    bodyFontSize: 11,
    headingFontFamily: "Aptos Display",
    headingColor: "#1F2937",
    accentColor: "#2563EB",
    lineSpacing: 1.5,
    alignment: "justify",
  },

  ELEGANT: {
    id: "elegant",
    name: "Élégant",
    description:
      "Présentation élégante destinée aux documents académiques formels.",
    fontFamily: "Georgia",
    bodyFontSize: 11.5,
    headingFontFamily: "Georgia",
    headingColor: "#1F2937",
    accentColor: "#7C3AED",
    lineSpacing: 1.5,
    alignment: "justify",
  },

  MINIMALISTE: {
    id: "minimaliste",
    name: "Minimaliste",
    description:
      "Présentation épurée mettant l'accent sur le contenu scientifique.",
    fontFamily: "Arial",
    bodyFontSize: 11,
    headingFontFamily: "Arial",
    headingColor: "#111827",
    accentColor: "#374151",
    lineSpacing: 1.5,
    alignment: "justify",
  },

  INSTITUTIONNEL: {
    id: "institutionnel",
    name: "Institutionnel",
    description:
      "Présentation destinée aux documents institutionnels et universitaires.",
    fontFamily: "Times New Roman",
    bodyFontSize: 12,
    headingFontFamily: "Times New Roman",
    headingColor: "#000000",
    accentColor: "#7F1D1D",
    lineSpacing: 1.5,
    alignment: "justify",
  },

  TECHNIQUE: {
    id: "technique",
    name: "Technique",
    description:
      "Présentation adaptée aux projets techniques, logiciels et travaux d'ingénierie.",
    fontFamily: "Arial",
    bodyFontSize: 11,
    headingFontFamily: "Arial",
    headingColor: "#111827",
    accentColor: "#0F766E",
    lineSpacing: 1.5,
    alignment: "left",
  },

  EDITORIAL: {
    id: "editorial",
    name: "Editorial",
    description: "Couverture typographique et mise en page de type revue acad\u00e9mique.",
    fontFamily: "Georgia",
    bodyFontSize: 11.5,
    headingFontFamily: "Georgia",
    headingColor: "#653B36",
    accentColor: "#A6634C",
    secondary: "#FBF7F0",
    lineSpacing: 1.55,
    alignment: "justify",
  },

  GEOMETRIQUE: {
    id: "geometrique",
    name: "G\u00e9om\u00e9trique",
    description: "Composition contemporaine avec panneaux color\u00e9s et titres affirm\u00e9s.",
    fontFamily: "Aptos",
    bodyFontSize: 11,
    headingFontFamily: "Aptos Display",
    headingColor: "#40387E",
    accentColor: "#675BC7",
    secondary: "#EDEBFF",
    lineSpacing: 1.5,
    alignment: "left",
  },

  CLINIQUE: {
    id: "clinique",
    name: "Clinique",
    description: "Hi\u00e9rarchie claire pour les travaux de sant\u00e9 et de laboratoire.",
    fontFamily: "Arial",
    bodyFontSize: 11,
    headingFontFamily: "Arial",
    headingColor: "#115E59",
    accentColor: "#159A8C",
    secondary: "#E6F5F1",
    lineSpacing: 1.5,
    alignment: "left",
  },

  TERRAIN: {
    id: "terrain",
    name: "Terrain",
    description: "Palette naturelle pour les recherches de terrain et sciences sociales.",
    fontFamily: "Georgia",
    bodyFontSize: 11.5,
    headingFontFamily: "Georgia",
    headingColor: "#40543A",
    accentColor: "#72845A",
    secondary: "#F1F0E8",
    lineSpacing: 1.55,
    alignment: "justify",
  },

  EXECUTIF: {
    id: "executif",
    name: "Ex\u00e9cutif",
    description: "Pr\u00e9sentation structur\u00e9e pour les dossiers professionnels et strat\u00e9giques.",
    fontFamily: "Aptos",
    bodyFontSize: 11,
    headingFontFamily: "Aptos Display",
    headingColor: "#203B53",
    accentColor: "#416A87",
    secondary: "#EAF0F5",
    lineSpacing: 1.45,
    alignment: "left",
  },

  MONOCHROME: {
    id: "monochrome",
    name: "Monochrome",
    description: "Traitement noir et blanc concentr\u00e9 sur la structure et la lisibilit\u00e9.",
    fontFamily: "Arial",
    bodyFontSize: 11,
    headingFontFamily: "Arial",
    headingColor: "#27272A",
    accentColor: "#52525B",
    secondary: "#F4F4F5",
    lineSpacing: 1.5,
    alignment: "justify",
  },

  DONNEES: {
    id: "donnees",
    name: "Donn\u00e9es & graphiques",
    description: "Rep\u00e8res visuels pour les projets centr\u00e9s sur les r\u00e9sultats et les donn\u00e9es.",
    fontFamily: "Arial",
    bodyFontSize: 11,
    headingFontFamily: "Aptos Display",
    headingColor: "#155E75",
    accentColor: "#0891B2",
    secondary: "#E7F4F6",
    lineSpacing: 1.5,
    alignment: "left",
  },
});

/* ============================================================
   8. CONTEXTE ACADÉMIQUE PAR DÉFAUT
   ============================================================ */

export const DEFAULT_ACADEMIC_CONTEXT = Object.freeze({
  country: null,
  institution: null,
  faculty: null,
  department: null,
  program: null,
});

/* ============================================================
   9. ÉLÉMENTS PRÉLIMINAIRES
   ============================================================ */

export const DEFAULT_FRONT_MATTER = Object.freeze({
  cover: true,
  titlePage: true,

  declaration: false,

  dedication: false,

  acknowledgements: true,

  abstract: true,

  summary: true,

  keywords: true,

  tableOfContents: true,

  listOfFigures: true,

  listOfTables: true,

  listOfAlgorithms: false,

  listOfAbbreviations: false,

  listOfSymbols: false,
});

/* ============================================================
   10. RÈGLES DU DOCUMENT
   ============================================================ */

export const DEFAULT_DOCUMENT_RULES = Object.freeze({
  pageFormat: "A4",

  margins: {
    top: 25,
    right: 25,
    bottom: 25,
    left: 30,
    unit: "mm",
  },

  lineSpacing: 1.5,

  paragraphSpacing: {
    before: 0,
    after: 6,
    unit: "pt",
  },

  firstLineIndent: 1.25,

  numbering: {
    chapters: true,
    sections: true,
    subsections: true,
    figures: true,
    tables: true,
    equations: true,
    appendices: true,
  },
});

/* ============================================================
   11. CRÉATION D'UNE SECTION
   ============================================================ */

export function createSection({
  id,
  title,
  type = "section",
  level = 1,
  number = null,
  required = true,
  description = "",
  children = [],
  blocks = [],
} = {}) {
  return {
    id:
      id ||
      `section-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    type,

    title,

    level,

    number,

    required,

    description,

    children: Array.isArray(children) ? children : [],

    blocks: Array.isArray(blocks) ? blocks : [],
  };
}

export function createSubsection(options = {}) {
  return createSection({
    ...options,
    type: "subsection",
    level: 2,
  });
}

export function createChapter(options = {}) {
  return createSection({
    ...options,
    type: "chapter",
    level: 1,
  });
}

/* ============================================================
   12. CONTENU PAR DÉFAUT
   ============================================================ */

export const DEFAULT_SECTION_CONTENT = Object.freeze({
  introduction: {
    title: "Introduction générale",
    blocks: [
      {
        type: "paragraph",
        text: "",
      },
    ],
  },

  literatureReview: {
    title: "Revue de littérature",
    blocks: [
      {
        type: "paragraph",
        text: "",
      },
    ],
  },

  methodology: {
    title: "Méthodologie",
    blocks: [
      {
        type: "paragraph",
        text: "",
      },
    ],
  },

  results: {
    title: "Résultats",
    blocks: [
      {
        type: "paragraph",
        text: "",
      },
    ],
  },

  discussion: {
    title: "Discussion",
    blocks: [
      {
        type: "paragraph",
        text: "",
      },
    ],
  },

  conclusion: {
    title: "Conclusion générale",
    blocks: [
      {
        type: "paragraph",
        text: "",
      },
    ],
  },
});

/* ============================================================
   13. STRUCTURES ACADÉMIQUES
   ============================================================ */

/*
 * IMPORTANT :
 *
 * Une structure n'est PAS un modèle.
 *
 * Une structure décrit l'organisation académique.
 *
 * Le design, la langue, la norme et le contexte sont définis
 * séparément.
 */
/* ============================================================
   13. STRUCTURES ACADÉMIQUES MACEVO
   ============================================================ */

/*
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * Une structure décrit l'organisation scientifique du document.
 *
 * Elle ne doit pas être confondue avec :
 *
 * - le niveau académique ;
 * - le design graphique ;
 * - la langue ;
 * - la norme bibliographique ;
 * - le contenu scientifique généré.
 *
 * MACEVO distingue volontairement :
 *
 * LICENCE
 *   → apprentissage de la démarche universitaire
 *   → analyse d'un problème délimité
 *   → méthodologie plus simple
 *   → résultats et discussion proportionnés
 *
 * MASTER
 *   → problématique scientifique plus approfondie
 *   → état de l'art structuré
 *   → cadre théorique/conceptuel
 *   → méthodologie de recherche détaillée
 *   → analyse et discussion scientifiques
 *
 * DOCTORAT
 *   → contribution scientifique originale
 *   → état de l'art approfondi
 *   → cadre théorique
 *   → méthodologie avancée
 *   → résultats originaux
 *   → discussion scientifique générale
 *   → limites et perspectives de recherche
 *
 * Le contenu réel sera ensuite produit par reportContentEngine.js
 * en fonction de l'identifiant sémantique de chaque nœud.
 */

export const ACADEMIC_STRUCTURES = Object.freeze({

  /* ==========================================================
     13.1 MÉMOIRE DE LICENCE
     ========================================================== */

  MEMOIRE_LICENCE: [

    createChapter({
      id: "introduction",
      title: "Introduction générale",

      children: [

        createSubsection({
          id: "context",
          title: "Contexte de l'étude",
        }),

        createSubsection({
          id: "problem",
          title: "Problématique",
        }),

        createSubsection({
          id: "objectives",
          title: "Objectifs de l'étude",
          children: [

            createSubsection({
              id: "general-objective",
              title: "Objectif général",
            }),

            createSubsection({
              id: "specific-objectives",
              title: "Objectifs spécifiques",
            }),

          ],
        }),

        createSubsection({
          id: "questions",
          title: "Questions de recherche",
          children: [

            createSubsection({
              id: "main-question",
              title: "Question principale",
            }),

            createSubsection({
              id: "secondary-questions",
              title: "Questions secondaires",
            }),

          ],
        }),

        createSubsection({
          id: "hypotheses",
          title: "Hypothèses",
          required: false,
        }),

        createSubsection({
          id: "methodological-overview",
          title: "Aperçu de la méthodologie",
        }),

        createSubsection({
          id: "document-organization",
          title: "Organisation du document",
        }),

      ],
    }),

    createChapter({
      id: "literature",
      title: "Revue de littérature",

      children: [

        createSubsection({
          id: "conceptual-definitions",
          title: "Définition des concepts",
        }),

        createSubsection({
          id: "previous-studies",
          title: "Travaux antérieurs",
        }),

        createSubsection({
          id: "literature-synthesis",
          title: "Synthèse de la littérature",
        }),

        createSubsection({
          id: "research-gap",
          title: "Positionnement de l'étude",
        }),

      ],
    }),

    createChapter({
      id: "methodology",
      title: "Méthodologie",

      children: [

        createSubsection({
          id: "research-design",
          title: "Type et démarche de recherche",
        }),

        createSubsection({
          id: "study-setting",
          title: "Cadre de l'étude",
        }),

        createSubsection({
          id: "population",
          title: "Population et échantillon",
        }),

        createSubsection({
          id: "data-collection",
          title: "Techniques de collecte des données",
        }),

        createSubsection({
          id: "data-analysis",
          title: "Méthodes d'analyse des données",
        }),

        createSubsection({
          id: "ethical-considerations",
          title: "Considérations éthiques",
          required: false,
        }),

      ],
    }),

    createChapter({
      id: "results",
      title: "Présentation et analyse des résultats",

      children: [

        createSubsection({
          id: "sample-description",
          title: "Présentation des données",
        }),

        createSubsection({
          id: "descriptive-results",
          title: "Résultats descriptifs",
        }),

        createSubsection({
          id: "analytical-results",
          title: "Résultats de l'analyse",
        }),

        createSubsection({
          id: "hypothesis-results",
          title: "Vérification des hypothèses",
          required: false,
        }),

      ],
    }),

    createChapter({
      id: "discussion",
      title: "Discussion des résultats",

      children: [

        createSubsection({
          id: "result-interpretation",
          title: "Interprétation des résultats",
        }),

        createSubsection({
          id: "comparison-literature",
          title: "Comparaison avec les travaux antérieurs",
        }),

        createSubsection({
          id: "practical-implications",
          title: "Implications pratiques",
        }),

        createSubsection({
          id: "limitations",
          title: "Limites de l'étude",
          required: false,
        }),

      ],
    }),

    createChapter({
      id: "recommendations",
      title: "Recommandations",

      children: [

        createSubsection({
          id: "academic-recommendations",
          title: "Recommandations académiques",
          required: false,
        }),

        createSubsection({
          id: "professional-recommendations",
          title: "Recommandations professionnelles",
        }),

      ],
    }),

    createChapter({
      id: "conclusion",
      title: "Conclusion générale",

      children: [

        createSubsection({
          id: "main-findings",
          title: "Synthèse des principaux résultats",
        }),

        createSubsection({
          id: "answer-research-question",
          title: "Réponse à la problématique",
        }),

        createSubsection({
          id: "perspectives",
          title: "Perspectives",
        }),

      ],
    }),

  ],

  /* ==========================================================
     13.2 MÉMOIRE DE MASTER
     ========================================================== */

  MEMOIRE_MASTER: [

    createChapter({
      id: "introduction",
      title: "Introduction générale",

      children: [

        createSubsection({
          id: "research-context",
          title: "Contexte scientifique et institutionnel",
        }),

        createSubsection({
          id: "research-problem",
          title: "Problématique de recherche",
        }),

        createSubsection({
          id: "research-question",
          title: "Question principale de recherche",
        }),

        createSubsection({
          id: "research-objectives",
          title: "Objectifs de la recherche",
          children: [

            createSubsection({
              id: "general-objective",
              title: "Objectif général",
            }),

            createSubsection({
              id: "specific-objectives",
              title: "Objectifs spécifiques",
            }),

          ],
        }),

        createSubsection({
          id: "research-hypotheses",
          title: "Hypothèses de recherche",
          required: false,
        }),

        createSubsection({
          id: "scientific-contribution",
          title: "Intérêt et contribution de la recherche",
        }),

        createSubsection({
          id: "methodological-overview",
          title: "Approche méthodologique générale",
        }),

        createSubsection({
          id: "thesis-organization",
          title: "Organisation du mémoire",
        }),

      ],
    }),

    createChapter({
      id: "theoretical-framework",
      title: "Cadre théorique et conceptuel",

      children: [

        createSubsection({
          id: "concept-definition",
          title: "Définition et clarification des concepts",
        }),

        createSubsection({
          id: "theoretical-foundations",
          title: "Fondements théoriques",
        }),

        createSubsection({
          id: "conceptual-model",
          title: "Modèle conceptuel",
        }),

        createSubsection({
          id: "theoretical-propositions",
          title: "Propositions théoriques",
          required: false,
        }),

      ],
    }),

    createChapter({
      id: "state-of-art",
      title: "État de l'art et revue critique de littérature",

      children: [

        createSubsection({
          id: "international-literature",
          title: "Travaux internationaux",
        }),

        createSubsection({
          id: "regional-literature",
          title: "Travaux régionaux",
          required: false,
        }),

        createSubsection({
          id: "national-literature",
          title: "Travaux nationaux",
          required: false,
        }),

        createSubsection({
          id: "empirical-studies",
          title: "Études empiriques",
        }),

        createSubsection({
          id: "comparative-analysis",
          title: "Analyse comparative des travaux",
        }),

        createSubsection({
          id: "research-gap",
          title: "Lacunes identifiées dans la littérature",
        }),

        createSubsection({
          id: "research-positioning",
          title: "Positionnement de la recherche",
        }),

      ],
    }),

    createChapter({
      id: "methodology",
      title: "Méthodologie de recherche",

      children: [

        createSubsection({
          id: "research-paradigm",
          title: "Paradigme et posture de recherche",
        }),

        createSubsection({
          id: "research-approach",
          title: "Approche de recherche",
        }),

        createSubsection({
          id: "research-design",
          title: "Design de recherche",
        }),

        createSubsection({
          id: "study-area",
          title: "Cadre et terrain de recherche",
        }),

        createSubsection({
          id: "population",
          title: "Population d'étude",
        }),

        createSubsection({
          id: "sampling",
          title: "Échantillonnage",
        }),

        createSubsection({
          id: "data-sources",
          title: "Sources des données",
        }),

        createSubsection({
          id: "data-collection",
          title: "Techniques et instruments de collecte",
        }),

        createSubsection({
          id: "variables",
          title: "Variables et indicateurs",
        }),

        createSubsection({
          id: "analysis-methods",
          title: "Méthodes d'analyse",
        }),

        createSubsection({
          id: "validity-reliability",
          title: "Validité et fiabilité",
          required: false,
        }),

        createSubsection({
          id: "ethical-considerations",
          title: "Considérations éthiques",
        }),

      ],
    }),

    createChapter({
      id: "results",
      title: "Résultats de la recherche",

      children: [

        createSubsection({
          id: "data-description",
          title: "Description des données",
        }),

        createSubsection({
          id: "sample-characteristics",
          title: "Caractéristiques de l'échantillon",
        }),

        createSubsection({
          id: "descriptive-analysis",
          title: "Analyse descriptive",
        }),

        createSubsection({
          id: "inferential-analysis",
          title: "Analyse explicative ou inférentielle",
          required: false,
        }),

        createSubsection({
          id: "model-results",
          title: "Résultats du modèle d'analyse",
          required: false,
        }),

        createSubsection({
          id: "hypothesis-testing",
          title: "Test des hypothèses",
          required: false,
        }),

        createSubsection({
          id: "scientific-results",
          title: "Synthèse des résultats scientifiques",
        }),

      ],
    }),

    createChapter({
      id: "discussion",
      title: "Discussion générale",

      children: [

        createSubsection({
          id: "interpretation",
          title: "Interprétation des résultats",
        }),

        createSubsection({
          id: "literature-comparison",
          title: "Confrontation avec la littérature",
        }),

        createSubsection({
          id: "theoretical-implications",
          title: "Implications théoriques",
        }),

        createSubsection({
          id: "practical-implications",
          title: "Implications managériales ou pratiques",
        }),

        createSubsection({
          id: "unexpected-results",
          title: "Résultats inattendus et explications",
          required: false,
        }),

        createSubsection({
          id: "limitations",
          title: "Limites de la recherche",
        }),

      ],
    }),

    createChapter({
      id: "conclusion",
      title: "Conclusion générale",

      children: [

        createSubsection({
          id: "research-summary",
          title: "Synthèse de la recherche",
        }),

        createSubsection({
          id: "answer-main-question",
          title: "Réponse à la question de recherche",
        }),

        createSubsection({
          id: "theoretical-contribution",
          title: "Contribution théorique",
          required: false,
        }),

        createSubsection({
          id: "practical-contribution",
          title: "Contribution pratique",
          required: false,
        }),

        createSubsection({
          id: "recommendations",
          title: "Recommandations",
        }),

        createSubsection({
          id: "future-research",
          title: "Perspectives de recherche",
        }),

      ],
    }),

  ],

  /* ==========================================================
     13.3 ARTICLE SCIENTIFIQUE — IMRaD
     ========================================================== */

  ARTICLE_IMRAD: [

    createSection({
      id: "introduction",
      title: "Introduction",
      type: "section",
      level: 1,

      children: [

        createSubsection({
          id: "background",
          title: "Contexte scientifique",
        }),

        createSubsection({
          id: "problem",
          title: "Problématique",
        }),

        createSubsection({
          id: "objective",
          title: "Objectif de l'étude",
        }),

        createSubsection({
          id: "hypothesis",
          title: "Hypothèse",
          required: false,
        }),

      ],
    }),

    createSection({
      id: "methodology",
      title: "Méthodes",
      type: "section",
      level: 1,

      children: [

        createSubsection({
          id: "study-design",
          title: "Design de l'étude",
        }),

        createSubsection({
          id: "materials",
          title: "Matériel",
          required: false,
        }),

        createSubsection({
          id: "participants",
          title: "Participants ou données",
        }),

        createSubsection({
          id: "procedure",
          title: "Procédure",
        }),

        createSubsection({
          id: "analysis",
          title: "Méthodes d'analyse",
        }),

      ],
    }),

    createSection({
      id: "results",
      title: "Résultats",
      type: "section",
      level: 1,

      children: [

        createSubsection({
          id: "main-results",
          title: "Résultats principaux",
        }),

        createSubsection({
          id: "secondary-results",
          title: "Résultats secondaires",
          required: false,
        }),

        createSubsection({
          id: "statistical-results",
          title: "Analyse statistique",
          required: false,
        }),

      ],
    }),

    createSection({
      id: "discussion",
      title: "Discussion",
      type: "section",
      level: 1,

      children: [

        createSubsection({
          id: "interpretation",
          title: "Interprétation",
        }),

        createSubsection({
          id: "comparison",
          title: "Comparaison avec les travaux antérieurs",
        }),

        createSubsection({
          id: "implications",
          title: "Implications",
        }),

        createSubsection({
          id: "limitations",
          title: "Limites",
          required: false,
        }),

      ],
    }),

    createSection({
      id: "conclusion",
      title: "Conclusion",
      type: "section",
      level: 1,
    }),

  ],

  /* ==========================================================
     13.4 RAPPORT DE STAGE
     ========================================================== */

  RAPPORT_STAGE: [

    createChapter({
      id: "introduction",
      title: "Introduction",

      children: [

        createSubsection({
          id: "stage-context",
          title: "Contexte et justification du stage",
        }),

        createSubsection({
          id: "stage-objectives",
          title: "Objectifs du stage",
        }),

        createSubsection({
          id: "document-organization",
          title: "Organisation du rapport",
        }),

      ],
    }),

    createChapter({
      id: "organization",
      title: "Présentation de la structure d'accueil",

      children: [

        createSubsection({
          id: "history",
          title: "Historique et évolution",
        }),

        createSubsection({
          id: "missions",
          title: "Missions et activités",
        }),

        createSubsection({
          id: "organization-chart",
          title: "Organisation et fonctionnement",
        }),

        createSubsection({
          id: "department",
          title: "Présentation du service d'accueil",
        }),

      ],
    }),

    createChapter({
      id: "activities",
      title: "Déroulement du stage",

      children: [

        createSubsection({
          id: "integration",
          title: "Accueil et intégration",
        }),

        createSubsection({
          id: "planning",
          title: "Planification des activités",
        }),

        createSubsection({
          id: "tasks",
          title: "Activités réalisées",
        }),

      ],
    }),

    createChapter({
      id: "work",
      title: "Travaux réalisés",

      children: [

        createSubsection({
          id: "missions-completed",
          title: "Missions réalisées",
        }),

        createSubsection({
          id: "methods-used",
          title: "Méthodes et outils utilisés",
        }),

        createSubsection({
          id: "technical-work",
          title: "Travaux techniques",
          required: false,
        }),

        createSubsection({
          id: "professional-contributions",
          title: "Contributions personnelles",
        }),

      ],
    }),

    createChapter({
      id: "results",
      title: "Résultats et analyse",

      children: [

        createSubsection({
          id: "achievements",
          title: "Résultats obtenus",
        }),

        createSubsection({
          id: "skills",
          title: "Compétences acquises",
        }),

        createSubsection({
          id: "professional-learning",
          title: "Apports professionnels",
        }),

      ],
    }),

    createChapter({
      id: "recommendations",
      title: "Recommandations",

      children: [

        createSubsection({
          id: "organization-recommendations",
          title: "Recommandations pour la structure d'accueil",
          required: false,
        }),

        createSubsection({
          id: "academic-recommendations",
          title: "Recommandations académiques",
          required: false,
        }),

      ],

      required: false,
    }),

    createChapter({
      id: "conclusion",
      title: "Conclusion générale",
    }),

  ],

  /* ==========================================================
     13.5 RAPPORT TECHNIQUE
     ========================================================== */

  RAPPORT_TECHNIQUE: [

    createChapter({
      id: "introduction",
      title: "Introduction",

      children: [

        createSubsection({
          id: "technical-context",
          title: "Contexte du projet",
        }),

        createSubsection({
          id: "problem",
          title: "Problématique technique",
        }),

        createSubsection({
          id: "objectives",
          title: "Objectifs",
        }),

        createSubsection({
          id: "scope",
          title: "Périmètre du projet",
        }),

      ],
    }),

    createChapter({
      id: "context",
      title: "Contexte et analyse des besoins",

      children: [

        createSubsection({
          id: "existing-system",
          title: "État de l'existant",
        }),

        createSubsection({
          id: "stakeholders",
          title: "Parties prenantes",
        }),

        createSubsection({
          id: "functional-needs",
          title: "Besoins fonctionnels",
        }),

        createSubsection({
          id: "non-functional-needs",
          title: "Besoins non fonctionnels",
        }),

      ],
    }),

    createChapter({
      id: "requirements",
      title: "Cahier des charges",

      children: [

        createSubsection({
          id: "functional-requirements",
          title: "Exigences fonctionnelles",
        }),

        createSubsection({
          id: "technical-requirements",
          title: "Exigences techniques",
        }),

        createSubsection({
          id: "constraints",
          title: "Contraintes et hypothèses",
        }),

      ],
    }),

    createChapter({
      id: "architecture",
      title: "Architecture et conception",

      children: [

        createSubsection({
          id: "architecture-overview",
          title: "Architecture générale",
        }),

        createSubsection({
          id: "data-model",
          title: "Modèle de données",
        }),

        createSubsection({
          id: "components",
          title: "Architecture des composants",
        }),

        createSubsection({
          id: "interfaces",
          title: "Interfaces et flux",
        }),

        createSubsection({
          id: "security",
          title: "Sécurité",
          required: false,
        }),

      ],
    }),

    createChapter({
      id: "implementation",
      title: "Implémentation",

      children: [

        createSubsection({
          id: "environment",
          title: "Environnement technique",
        }),

        createSubsection({
          id: "technologies",
          title: "Technologies utilisées",
        }),

        createSubsection({
          id: "implementation-details",
          title: "Détails d'implémentation",
        }),

        createSubsection({
          id: "integration",
          title: "Intégration des composants",
        }),

      ],
    }),

    createChapter({
      id: "testing",
      title: "Tests et validation",

      children: [

        createSubsection({
          id: "test-strategy",
          title: "Stratégie de test",
        }),

        createSubsection({
          id: "unit-tests",
          title: "Tests unitaires",
          required: false,
        }),

        createSubsection({
          id: "integration-tests",
          title: "Tests d'intégration",
          required: false,
        }),

        createSubsection({
          id: "functional-tests",
          title: "Tests fonctionnels",
        }),

        createSubsection({
          id: "performance-tests",
          title: "Tests de performance",
          required: false,
        }),

        createSubsection({
          id: "validation-results",
          title: "Résultats de validation",
        }),

      ],
    }),

    createChapter({
      id: "limitations",
      title: "Limites et difficultés",

      children: [

        createSubsection({
          id: "technical-limitations",
          title: "Limites techniques",
        }),

        createSubsection({
          id: "project-difficulties",
          title: "Difficultés rencontrées",
        }),

        createSubsection({
          id: "solutions",
          title: "Solutions apportées",
        }),

      ],

      required: false,
    }),

    createChapter({
      id: "conclusion",
      title: "Conclusion et perspectives",

      children: [

        createSubsection({
          id: "technical-summary",
          title: "Synthèse technique",
        }),

        createSubsection({
          id: "future-improvements",
          title: "Améliorations futures",
        }),

      ],
    }),

  ],

  /* ==========================================================
     13.6 THÈSE DE DOCTORAT
     ========================================================== */

  THESE_SCIENTIFIQUE: [

    createChapter({
      id: "introduction",
      title: "Introduction générale",

      children: [

        createSubsection({
          id: "research-context",
          title: "Contexte général de la recherche",
        }),

        createSubsection({
          id: "scientific-problem",
          title: "Problème scientifique",
        }),

        createSubsection({
          id: "research-question",
          title: "Question centrale de recherche",
        }),

        createSubsection({
          id: "objectives",
          title: "Objectifs de la recherche",
        }),

        createSubsection({
          id: "hypotheses",
          title: "Hypothèses et propositions",
          required: false,
        }),

        createSubsection({
          id: "originality",
          title: "Originalité et contribution attendue",
        }),

        createSubsection({
          id: "methodology-overview",
          title: "Vue d'ensemble de la méthodologie",
        }),

        createSubsection({
          id: "thesis-organization",
          title: "Organisation de la thèse",
        }),

      ],
    }),

    createChapter({
      id: "theoretical-framework",
      title: "Cadre théorique",

      children: [

        createSubsection({
          id: "theoretical-concepts",
          title: "Concepts fondamentaux",
        }),

        createSubsection({
          id: "theoretical-models",
          title: "Modèles théoriques",
        }),

        createSubsection({
          id: "theoretical-debate",
          title: "Débats théoriques",
        }),

        createSubsection({
          id: "conceptual-framework",
          title: "Cadre conceptuel",
        }),

      ],
    }),

    createChapter({
      id: "state-of-art",
      title: "État de l'art",

      children: [

        createSubsection({
          id: "historical-development",
          title: "Évolution du domaine",
        }),

        createSubsection({
          id: "major-approaches",
          title: "Principales approches scientifiques",
        }),

        createSubsection({
          id: "empirical-literature",
          title: "Littérature empirique",
        }),

        createSubsection({
          id: "critical-review",
          title: "Analyse critique de la littérature",
        }),

        createSubsection({
          id: "scientific-gap",
          title: "Lacune scientifique",
        }),

        createSubsection({
          id: "research-positioning",
          title: "Positionnement de la thèse",
        }),

      ],
    }),

    createChapter({
      id: "methodology",
      title: "Méthodologie de recherche",

      children: [

        createSubsection({
          id: "epistemological-position",
          title: "Positionnement épistémologique",
        }),

        createSubsection({
          id: "research-strategy",
          title: "Stratégie de recherche",
        }),

        createSubsection({
          id: "research-design",
          title: "Design de recherche",
        }),

        createSubsection({
          id: "data-sources",
          title: "Sources et nature des données",
        }),

        createSubsection({
          id: "sampling",
          title: "Échantillonnage",
          required: false,
        }),

        createSubsection({
          id: "experimental-protocol",
          title: "Protocole expérimental ou analytique",
          required: false,
        }),

        createSubsection({
          id: "analysis-methods",
          title: "Méthodes d'analyse",
        }),

        createSubsection({
          id: "validity",
          title: "Validité, robustesse et reproductibilité",
        }),

        createSubsection({
          id: "ethics",
          title: "Considérations éthiques",
        }),

      ],
    }),

    createChapter({
      id: "results",
      title: "Résultats scientifiques",

      children: [

        createSubsection({
          id: "dataset",
          title: "Description des données ou observations",
        }),

        createSubsection({
          id: "primary-results",
          title: "Résultats principaux",
        }),

        createSubsection({
          id: "secondary-results",
          title: "Résultats complémentaires",
          required: false,
        }),

        createSubsection({
          id: "quantitative-analysis",
          title: "Analyse quantitative",
          required: false,
        }),

        createSubsection({
          id: "qualitative-analysis",
          title: "Analyse qualitative",
          required: false,
        }),

        createSubsection({
          id: "model-validation",
          title: "Validation des résultats",
          required: false,
        }),

      ],
    }),

    createChapter({
      id: "general-discussion",
      title: "Discussion générale",

      children: [

        createSubsection({
          id: "scientific-interpretation",
          title: "Interprétation scientifique",
        }),

        createSubsection({
          id: "comparison",
          title: "Comparaison avec les travaux antérieurs",
        }),

        createSubsection({
          id: "theoretical-contribution",
          title: "Contribution théorique",
        }),

        createSubsection({
          id: "methodological-contribution",
          title: "Contribution méthodologique",
          required: false,
        }),

        createSubsection({
          id: "practical-contribution",
          title: "Contribution pratique",
          required: false,
        }),

        createSubsection({
          id: "limitations",
          title: "Limites scientifiques",
        }),

        createSubsection({
          id: "future-work",
          title: "Perspectives de recherche",
        }),

      ],
    }),

    createChapter({
      id: "conclusion",
      title: "Conclusion générale",

      children: [

        createSubsection({
          id: "research-synthesis",
          title: "Synthèse des travaux",
        }),

        createSubsection({
          id: "main-contributions",
          title: "Contributions principales",
        }),

        createSubsection({
          id: "scientific-implications",
          title: "Implications scientifiques",
        }),

        createSubsection({
          id: "final-perspectives",
          title: "Perspectives finales",
        }),

      ],
    }),

  ],

});


/* ============================================================
   13.7 ALIAS DE COMPATIBILITÉ
   ============================================================ */

/*
 * Ces alias évitent de casser immédiatement les composants
 * existants qui utilisent encore les anciens identifiants.
 *
 * MAIS les modèles MACEVO eux-mêmes doivent utiliser les
 * structures correspondant à leur niveau.
 */

export const STRUCTURES = ACADEMIC_STRUCTURES;


/*
 * Ancien nom :
 * MEMOIRE_CLASSIQUE
 *
 * Nouveau sens :
 * mémoire de Licence.
 */

/*
 * Ancien nom :
 * MEMOIRE_SCIENTIFIQUE
 *
 * Nouveau sens :
 * mémoire de Master.
 */

/* ============================================================
   14. PROFILS DE CONTEXTE
   ============================================================ */

export const ACADEMIC_CONTEXT_PROFILES = Object.freeze({
  GENERIC_UNIVERSITY: {
    id: "generic-university",
    country: null,
    institution: null,
    faculty: null,
    department: null,
    program: null,
  },

  RESEARCH: {
    id: "research",
    country: null,
    institution: null,
    faculty: null,
    department: null,
    program: null,
  },
});/* ============================================================
   15. REGISTRE DES MODÈLES
   ============================================================ */

/*
 * IMPORTANT :
 *
 * Chaque modèle combine :
 *
 * - identité
 * - contexte
 * - type
 * - niveau
 * - langue
 * - domaine
 * - structure
 * - norme
 * - front matter
 * - règles
 * - design
 *
 * Le modèle reste indépendant du document créé par l'utilisateur.
 */

export const REPORT_TEMPLATES = [
  /* ----------------------------------------------------------
     MÉMOIRES
     ---------------------------------------------------------- */

  {
    id: "memoire-classique",

    name: "Mémoire Classique",

    label: "Mémoire Classique",

    description:
      "Structure académique classique adaptée aux travaux universitaires de niveau undergraduate et master.",

    type: DOCUMENT_TYPES.MEMOIRE,

    category: TEMPLATE_CATEGORIES.MEMOIRES,

    academicContext: {
      country: null,
      institution: null,
      faculty: null,
      department: null,
      program: null,
    },

    fields: [
      SCIENTIFIC_FIELDS.COMPUTER_SCIENCE,
      SCIENTIFIC_FIELDS.ENGINEERING,
      SCIENTIFIC_FIELDS.ECONOMICS,
      SCIENTIFIC_FIELDS.MANAGEMENT,
      SCIENTIFIC_FIELDS.SOCIAL_SCIENCES,
      SCIENTIFIC_FIELDS.HUMANITIES,
      SCIENTIFIC_FIELDS.EDUCATION,
      SCIENTIFIC_FIELDS.OTHER,
    ],

    // Ce modèle est exclusivement destiné au niveau Licence.
    level: ACADEMIC_LEVELS.LICENCE,

    language: [
      DOCUMENT_LANGUAGES.FR,
      DOCUMENT_LANGUAGES.EN,
    ],

    structureId: "memoire-classique",

    structure: ACADEMIC_STRUCTURES.MEMOIRE_LICENCE,

    design: "classique",

    frontMatter: {
      ...DEFAULT_FRONT_MATTER,
      dedication: true,
    },

    documentRules: DEFAULT_DOCUMENT_RULES,

    citationStyle: CITATION_STYLES.APA,

    tags: [
      "mémoire",
      "classique",
      "universitaire",
      "académique",
    ],

    featured: true,

    version: MACEVO_TEMPLATE_VERSION,
  },

  {
    id: "memoire-scientifique",

    name: "Mémoire Scientifique",

    label: "Mémoire Scientifique",

    description:
      "Structure orientée vers les travaux de recherche scientifique et les sciences expérimentales.",

    type: DOCUMENT_TYPES.MEMOIRE,

    category: TEMPLATE_CATEGORIES.MEMOIRES,

    academicContext: {
      country: null,
      institution: null,
      faculty: null,
      department: null,
      program: null,
    },

    fields: [
      SCIENTIFIC_FIELDS.COMPUTER_SCIENCE,
      SCIENTIFIC_FIELDS.ENGINEERING,
      SCIENTIFIC_FIELDS.MATHEMATICS,
      SCIENTIFIC_FIELDS.PHYSICS,
      SCIENTIFIC_FIELDS.CHEMISTRY,
      SCIENTIFIC_FIELDS.BIOLOGY,
      SCIENTIFIC_FIELDS.MEDICINE,
      SCIENTIFIC_FIELDS.PHARMACY,
      SCIENTIFIC_FIELDS.ENVIRONMENTAL_SCIENCES,
      SCIENTIFIC_FIELDS.AGRICULTURE,
    ],

    // Ce modèle est exclusivement destiné au niveau Master.
    level: ACADEMIC_LEVELS.MASTER,

    language: [
      DOCUMENT_LANGUAGES.FR,
      DOCUMENT_LANGUAGES.EN,
    ],

    structureId: "memoire-scientifique",

    structure: ACADEMIC_STRUCTURES.MEMOIRE_MASTER,

    design: "scientifique",

    frontMatter: {
      ...DEFAULT_FRONT_MATTER,

      listOfFigures: true,

      listOfTables: true,

      listOfAbbreviations: true,
    },

    documentRules: DEFAULT_DOCUMENT_RULES,

    citationStyle: CITATION_STYLES.APA,

    tags: [
      "scientifique",
      "recherche",
      "expérimental",
      "mémoire",
    ],

    featured: true,

    version: MACEVO_TEMPLATE_VERSION,
  },

  {
    id: "memoire-moderne",

    name: "Mémoire Moderne",

    label: "Mémoire Moderne",

    description:
      "Structure académique classique associée à une présentation visuelle contemporaine.",

    type: DOCUMENT_TYPES.MEMOIRE,

    category: TEMPLATE_CATEGORIES.MEMOIRES,

    academicContext: {
      country: null,
      institution: null,
      faculty: null,
      department: null,
      program: null,
    },

    fields: [
      SCIENTIFIC_FIELDS.COMPUTER_SCIENCE,
      SCIENTIFIC_FIELDS.ENGINEERING,
      SCIENTIFIC_FIELDS.ECONOMICS,
      SCIENTIFIC_FIELDS.MANAGEMENT,
      SCIENTIFIC_FIELDS.SOCIAL_SCIENCES,
      SCIENTIFIC_FIELDS.OTHER,
    ],

    // Ce modèle est exclusivement destiné au niveau Licence.
    level: ACADEMIC_LEVELS.LICENCE,

    language: [
      DOCUMENT_LANGUAGES.FR,
      DOCUMENT_LANGUAGES.EN,
    ],

    structureId: "memoire-classique",

    structure: ACADEMIC_STRUCTURES.MEMOIRE_LICENCE,

    design: "moderne",

    frontMatter: DEFAULT_FRONT_MATTER,

    documentRules: DEFAULT_DOCUMENT_RULES,

    citationStyle: CITATION_STYLES.APA,

    tags: [
      "moderne",
      "contemporain",
      "mémoire",
    ],

    featured: true,

    version: MACEVO_TEMPLATE_VERSION,
  },

  {
    id: "memoire-minimaliste",

    name: "Mémoire Minimaliste",

    label: "Mémoire Minimaliste",

    description:
      "Présentation épurée mettant l'accent sur le contenu scientifique et académique.",

    type: DOCUMENT_TYPES.MEMOIRE,

    category: TEMPLATE_CATEGORIES.MEMOIRES,

    academicContext: {
      country: null,
      institution: null,
      faculty: null,
      department: null,
      program: null,
    },

    fields: [
      SCIENTIFIC_FIELDS.COMPUTER_SCIENCE,
      SCIENTIFIC_FIELDS.ENGINEERING,
      SCIENTIFIC_FIELDS.ECONOMICS,
      SCIENTIFIC_FIELDS.SOCIAL_SCIENCES,
      SCIENTIFIC_FIELDS.HUMANITIES,
      SCIENTIFIC_FIELDS.OTHER,
    ],

    // Ce modèle est exclusivement destiné au niveau Licence.
    level: ACADEMIC_LEVELS.LICENCE,

    language: [
      DOCUMENT_LANGUAGES.FR,
      DOCUMENT_LANGUAGES.EN,
    ],

    structureId: "memoire-classique",

    structure: ACADEMIC_STRUCTURES.MEMOIRE_LICENCE,

    design: "minimaliste",

    frontMatter: DEFAULT_FRONT_MATTER,

    documentRules: DEFAULT_DOCUMENT_RULES,

    citationStyle: CITATION_STYLES.APA,

    tags: [
      "minimaliste",
      "sobre",
      "mémoire",
    ],

    version: MACEVO_TEMPLATE_VERSION,
  },

  /* ----------------------------------------------------------
     RAPPORTS DE STAGE
     ---------------------------------------------------------- */

  {
    id: "stage-classique",

    name: "Rapport de Stage Classique",

    label: "Rapport de Stage Classique",

    description:
      "Structure générale pour présenter une expérience de stage académique ou professionnelle.",

    type: DOCUMENT_TYPES.RAPPORT_STAGE,

    category: TEMPLATE_CATEGORIES.RAPPORTS_STAGE,

    academicContext: {
      country: null,
      institution: null,
      faculty: null,
      department: null,
      program: null,
    },

    fields: [
      SCIENTIFIC_FIELDS.COMPUTER_SCIENCE,
      SCIENTIFIC_FIELDS.ENGINEERING,
      SCIENTIFIC_FIELDS.ECONOMICS,
      SCIENTIFIC_FIELDS.MANAGEMENT,
      SCIENTIFIC_FIELDS.COMMUNICATION,
      SCIENTIFIC_FIELDS.OTHER,
    ],

    // Ce modèle est exclusivement destiné au niveau Licence.
    level: ACADEMIC_LEVELS.LICENCE,

    language: [
      DOCUMENT_LANGUAGES.FR,
      DOCUMENT_LANGUAGES.EN,
    ],

    structureId: "rapport-stage",

    structure: ACADEMIC_STRUCTURES.RAPPORT_STAGE,

    design: "classique",

    frontMatter: DEFAULT_FRONT_MATTER,

    documentRules: DEFAULT_DOCUMENT_RULES,

    citationStyle: CITATION_STYLES.APA,

    tags: [
      "stage",
      "rapport",
      "universitaire",
    ],

    featured: true,

    version: MACEVO_TEMPLATE_VERSION,
  },

  {
    id: "stage-informatique",

    name: "Rapport de Stage Informatique",

    label: "Rapport de Stage Informatique",

    description:
      "Structure adaptée aux stages réalisés dans le domaine de l'informatique et des technologies.",

    type: DOCUMENT_TYPES.RAPPORT_STAGE,

    category: TEMPLATE_CATEGORIES.RAPPORTS_STAGE,

    academicContext: {
      country: null,
      institution: null,
      faculty: null,
      department: null,
      program: null,
    },

    fields: [
      SCIENTIFIC_FIELDS.COMPUTER_SCIENCE,
      SCIENTIFIC_FIELDS.ENGINEERING,
    ],

    // Ce modèle est exclusivement destiné au niveau Licence.
    level: ACADEMIC_LEVELS.LICENCE,

    language: [
      DOCUMENT_LANGUAGES.FR,
      DOCUMENT_LANGUAGES.EN,
    ],

    structureId: "rapport-stage",

    structure: ACADEMIC_STRUCTURES.RAPPORT_STAGE,

    design: "technique",

    frontMatter: DEFAULT_FRONT_MATTER,

    documentRules: DEFAULT_DOCUMENT_RULES,

    citationStyle: CITATION_STYLES.IEEE,

    tags: [
      "informatique",
      "technologie",
      "stage",
      "technique",
    ],

    featured: true,

    version: MACEVO_TEMPLATE_VERSION,
  },

  /* ----------------------------------------------------------
     ARTICLES SCIENTIFIQUES
     ---------------------------------------------------------- */

  {
    id: "article-scientifique",

    name: "Article Scientifique",

    label: "Article Scientifique",

    description:
      "Structure scientifique basée sur le modèle IMRaD : Introduction, Méthodes, Résultats et Discussion.",

    type: DOCUMENT_TYPES.ARTICLE_SCIENTIFIQUE,

    category: TEMPLATE_CATEGORIES.ARTICLES,

    academicContext: {
      country: null,
      institution: null,
      faculty: null,
      department: null,
      program: null,
    },

    fields: [
      SCIENTIFIC_FIELDS.COMPUTER_SCIENCE,
      SCIENTIFIC_FIELDS.ENGINEERING,
      SCIENTIFIC_FIELDS.MATHEMATICS,
      SCIENTIFIC_FIELDS.PHYSICS,
      SCIENTIFIC_FIELDS.CHEMISTRY,
      SCIENTIFIC_FIELDS.BIOLOGY,
      SCIENTIFIC_FIELDS.MEDICINE,
      SCIENTIFIC_FIELDS.PHARMACY,
      SCIENTIFIC_FIELDS.ENVIRONMENTAL_SCIENCES,
      SCIENTIFIC_FIELDS.AGRICULTURE,
    ],

    // Ce modèle est exclusivement destiné au niveau Master.
    level: ACADEMIC_LEVELS.MASTER,

    language: [
      DOCUMENT_LANGUAGES.FR,
      DOCUMENT_LANGUAGES.EN,
    ],

    structureId: "article-imrad",

    structure: ACADEMIC_STRUCTURES.ARTICLE_IMRAD,

    design: "scientifique",

    frontMatter: {
      cover: false,
      titlePage: false,
      declaration: false,
      dedication: false,
      acknowledgements: false,
      abstract: true,
      summary: false,
      keywords: true,
      tableOfContents: false,
      listOfFigures: false,
      listOfTables: false,
      listOfAlgorithms: false,
      listOfAbbreviations: false,
      listOfSymbols: false,
    },

    documentRules: DEFAULT_DOCUMENT_RULES,

    citationStyle: CITATION_STYLES.IEEE,

    tags: [
      "article",
      "scientifique",
      "recherche",
      "IMRaD",
    ],

    featured: true,

    version: MACEVO_TEMPLATE_VERSION,
  },

  /* ----------------------------------------------------------
     THÈSES
     ---------------------------------------------------------- */

  {
    id: "these-scientifique",

    name: "Thèse Scientifique",

    label: "Thèse Scientifique",

    description:
      "Structure de base destinée aux travaux de recherche doctorale.",

    type: DOCUMENT_TYPES.THESE,

    category: TEMPLATE_CATEGORIES.THESES,

    academicContext: {
      country: null,
      institution: null,
      faculty: null,
      department: null,
      program: null,
    },

    fields: [
      SCIENTIFIC_FIELDS.COMPUTER_SCIENCE,
      SCIENTIFIC_FIELDS.ENGINEERING,
      SCIENTIFIC_FIELDS.MATHEMATICS,
      SCIENTIFIC_FIELDS.PHYSICS,
      SCIENTIFIC_FIELDS.CHEMISTRY,
      SCIENTIFIC_FIELDS.BIOLOGY,
      SCIENTIFIC_FIELDS.MEDICINE,
      SCIENTIFIC_FIELDS.PHARMACY,
      SCIENTIFIC_FIELDS.ECONOMICS,
      SCIENTIFIC_FIELDS.SOCIAL_SCIENCES,
      SCIENTIFIC_FIELDS.HUMANITIES,
      SCIENTIFIC_FIELDS.OTHER,
    ],

    // Ce modèle est exclusivement destiné au niveau Doctorat.
    level: ACADEMIC_LEVELS.DOCTORATE,

    language: [
      DOCUMENT_LANGUAGES.FR,
      DOCUMENT_LANGUAGES.EN,
    ],

    structureId: "these-scientifique",

    structure: ACADEMIC_STRUCTURES.THESE_SCIENTIFIQUE,

    design: "scientifique",

    frontMatter: {
      ...DEFAULT_FRONT_MATTER,

      declaration: true,

      listOfFigures: true,

      listOfTables: true,

      listOfAlgorithms: true,

      listOfAbbreviations: true,

      listOfSymbols: true,
    },

    documentRules: DEFAULT_DOCUMENT_RULES,

    citationStyle: CITATION_STYLES.APA,

    tags: [
      "thèse",
      "doctorat",
      "recherche",
      "scientifique",
    ],

    featured: true,

    version: MACEVO_TEMPLATE_VERSION,
  },

  /* ----------------------------------------------------------
     RAPPORT TECHNIQUE
     ---------------------------------------------------------- */

  {
    id: "rapport-technique",

    name: "Rapport Technique",

    label: "Rapport Technique",

    description:
      "Structure adaptée aux projets techniques, logiciels, systèmes et travaux d'ingénierie.",

    type: DOCUMENT_TYPES.RAPPORT_TECHNIQUE,

    category: TEMPLATE_CATEGORIES.RAPPORTS_TECHNIQUES,

    academicContext: {
      country: null,
      institution: null,
      faculty: null,
      department: null,
      program: null,
    },

    fields: [
      SCIENTIFIC_FIELDS.COMPUTER_SCIENCE,
      SCIENTIFIC_FIELDS.ENGINEERING,
      SCIENTIFIC_FIELDS.MATHEMATICS,
      SCIENTIFIC_FIELDS.OTHER,
    ],

    // Ce modèle est exclusivement destiné au niveau professionnel.
    level: ACADEMIC_LEVELS.PROFESSIONAL,

    language: [
      DOCUMENT_LANGUAGES.FR,
      DOCUMENT_LANGUAGES.EN,
    ],

    structureId: "rapport-technique",

    structure: ACADEMIC_STRUCTURES.RAPPORT_TECHNIQUE,

    design: "technique",

    frontMatter: DEFAULT_FRONT_MATTER,

    documentRules: DEFAULT_DOCUMENT_RULES,

    citationStyle: CITATION_STYLES.IEEE,

    tags: [
      "technique",
      "informatique",
      "ingénierie",
      "projet",
    ],

    featured: true,

    version: MACEVO_TEMPLATE_VERSION,
  },
];

const additionalChapter = (id, title, subsections = []) => createChapter({
  id,
  title,
  children: subsections.map(([childId, childTitle]) => createSubsection({ id: childId, title: childTitle })),
});

// Plans distincts pour les modèles ajoutés : leur niveau et leur usage
// déterminent les parties attendues, au lieu de recycler un plan générique.
const ADDITIONAL_TEMPLATE_STRUCTURES = {
  "secondaire-projet-scolaire": [
    additionalChapter("introduction", "Présentation du projet", [["context", "Contexte et besoin observé"], ["objectives", "Objectifs du projet"], ["project-scope", "Périmètre et bénéficiaires"]]),
    additionalChapter("diagnostic", "Diagnostic de la situation", [["initial-observation", "Observations initiales"], ["constraints", "Contraintes et ressources disponibles"]]),
    additionalChapter("project-design", "Conception de l’action", [["action-plan", "Actions et calendrier"], ["roles", "Organisation de l’équipe"], ["indicators", "Critères de suivi"]]),
    additionalChapter("implementation", "Mise en œuvre", [["activities", "Activités réalisées"], ["adjustments", "Ajustements apportés"]]),
    additionalChapter("evaluation", "Évaluation du projet", [["outputs", "Réalisations observables"], ["outcomes", "Effets constatés"], ["limitations", "Limites de l’évaluation"]]),
    additionalChapter("conclusion", "Bilan et perspectives", [["lessons", "Enseignements tirés"], ["continuation", "Poursuite de l’action"]]),
  ],
  "secondaire-enquete": [
    additionalChapter("introduction", "Cadre de l’enquête", [["context", "Contexte et question"], ["objectives", "Objectifs de l’enquête"], ["terms", "Notions utiles"]]),
    additionalChapter("methodology", "Organisation de l’enquête", [["participants", "Participants et consentement"], ["questionnaire", "Outil de collecte"], ["procedure", "Déroulement et anonymat"]]),
    additionalChapter("results", "Résultats descriptifs", [["respondents", "Description des réponses"], ["themes", "Tendances observées"], ["limits", "Limites de l’enquête"]]),
    additionalChapter("discussion", "Interprétation", [["interpretation", "Mise en perspective"], ["recommendations", "Pistes d’action adaptées"]]),
    additionalChapter("conclusion", "Conclusion", [["summary", "Synthèse des constats"], ["perspectives", "Perspectives"]]),
  ],
  "undergraduate-research-paper": [
    additionalChapter("introduction", "Introduction", [["background", "Contexte du sujet"], ["research-question", "Question directrice"], ["thesis", "Thèse défendue et annonce du plan"]]),
    additionalChapter("literature", "Cadre documentaire", [["key-concepts", "Concepts et définitions"], ["sources", "Corpus et critères de sélection"], ["positions", "Courants et positions du débat"]]),
    additionalChapter("analysis", "Analyse argumentée", [["argument-one", "Premier axe d’analyse"], ["argument-two", "Deuxième axe d’analyse"], ["counterargument", "Limites et contre-arguments"]]),
    additionalChapter("discussion", "Discussion", [["synthesis", "Synthèse des arguments"], ["contribution", "Portée de l’analyse"]]),
    additionalChapter("conclusion", "Conclusion", [["answer", "Réponse à la question"], ["perspectives", "Pistes de prolongement"]]),
  ],
  "undergraduate-capstone": [
    additionalChapter("introduction", "Cadrage du projet", [["context", "Contexte et besoin"], ["requirements", "Besoins des utilisateurs"], ["objectives", "Objectifs et critères d’acceptation"]]),
    additionalChapter("analysis", "Analyse et conception", [["existing-state", "État de l’existant"], ["functional-design", "Conception fonctionnelle"], ["technical-design", "Choix techniques justifiés"]]),
    additionalChapter("implementation", "Réalisation", [["architecture", "Architecture de la solution"], ["components", "Composants réalisés"], ["security", "Sécurité et accessibilité"]]),
    additionalChapter("validation", "Vérification et évaluation", [["test-plan", "Plan de tests"], ["test-results", "Résultats des tests"], ["acceptance", "Évaluation selon les critères"]]),
    additionalChapter("conclusion", "Conclusion et suites", [["deliverables", "Bilan des livrables"], ["limits", "Limites et améliorations futures"]]),
  ],
  "licence-humanities": [
    additionalChapter("introduction", "Introduction générale", [["context", "Contexte historique et critique"], ["problem", "Problématique"], ["corpus", "Corpus et délimitation"], ["method", "Démarche d’analyse"]]),
    additionalChapter("framework", "Cadre conceptuel et état de la recherche", [["concepts", "Concepts opératoires"], ["previous-studies", "Travaux critiques antérieurs"], ["positioning", "Positionnement de l’étude"]]),
    additionalChapter("analysis-part-one", "Première partie — Formes et représentations", [["themes", "Thèmes structurants"], ["narration", "Voix, formes et procédés"]]),
    additionalChapter("analysis-part-two", "Deuxième partie — Contextes et tensions", [["contextual-reading", "Lecture contextualisée"], ["comparative-reading", "Analyse comparative"]]),
    additionalChapter("discussion", "Synthèse critique", [["findings", "Résultats de l’analyse"], ["limits", "Limites du corpus et de l’interprétation"]]),
    additionalChapter("conclusion", "Conclusion générale", [["answer", "Réponse à la problématique"], ["perspectives", "Perspectives de recherche"]]),
  ],
  "licence-field-study": [
    additionalChapter("introduction", "Introduction", [["context", "Contexte territorial"], ["problem", "Problématique et objectifs"], ["study-area", "Délimitation du terrain"]]),
    additionalChapter("literature", "Repères conceptuels et empiriques", [["concepts", "Concepts clés"], ["prior-research", "Études antérieures"], ["analytical-frame", "Cadre d’analyse"]]),
    additionalChapter("methodology", "Méthodologie de terrain", [["site-selection", "Choix des sites"], ["participants", "Participants et recrutement"], ["collection", "Entretiens et observations"], ["ethics", "Consentement et protection des données"]]),
    additionalChapter("results", "Résultats de l’enquête", [["profiles", "Profils et situations décrites"], ["themes", "Résultats par thème"], ["variations", "Variations entre sites"]]),
    additionalChapter("discussion", "Discussion", [["interpretation", "Interprétation des résultats"], ["comparison", "Comparaison avec les travaux antérieurs"], ["limits", "Limites du terrain"]]),
    additionalChapter("conclusion", "Conclusion et recommandations", [["summary", "Réponse à la question"], ["recommendations", "Recommandations fondées sur les résultats"]]),
  ],
  "bachelor-empirical-thesis": [
    additionalChapter("introduction", "Introduction", [["context", "Contexte économique"], ["problem", "Question et hypothèses"], ["contribution", "Contribution attendue"]]),
    additionalChapter("literature", "Cadre théorique", [["theory", "Fondements théoriques"], ["evidence", "Résultats empiriques antérieurs"], ["hypotheses", "Modèle et hypothèses"]]),
    additionalChapter("methodology", "Données et méthode", [["sample", "Population et échantillon"], ["variables", "Définition des variables"], ["model", "Spécification du modèle"], ["estimation", "Méthode d’estimation et vérifications"]]),
    additionalChapter("results", "Résultats empiriques", [["descriptive", "Statistiques descriptives"], ["main-estimates", "Estimations principales"], ["robustness", "Vérifications de robustesse"]]),
    additionalChapter("discussion", "Discussion", [["interpretation", "Interprétation économique"], ["limits", "Limites d’identification et de données"]]),
    additionalChapter("conclusion", "Conclusion", [["summary", "Résultats principaux"], ["implications", "Implications et recherches futures"]]),
  ],
  "bachelor-honours-project": [
    additionalChapter("introduction", "Cadrage et exigences", [["need", "Problème traité"], ["stakeholders", "Utilisateurs et parties prenantes"], ["requirements", "Exigences fonctionnelles et non fonctionnelles"]]),
    additionalChapter("design", "Conception de la solution", [["architecture", "Architecture logicielle"], ["data-model", "Modèle de données"], ["security", "Sécurité et droits d’accès"]]),
    additionalChapter("implementation", "Implémentation", [["environment", "Environnement technique"], ["components", "Composants et interfaces"], ["decisions", "Décisions de conception"]]),
    additionalChapter("verification", "Tests et validation", [["test-strategy", "Stratégie de tests"], ["test-results", "Résultats reproductibles"], ["evaluation", "Évaluation des exigences"]]),
    additionalChapter("conclusion", "Conclusion", [["deliverables", "Bilan technique"], ["limits", "Limites et évolutions"]]),
  ],
  "master-applied-study": [
    additionalChapter("introduction", "Introduction et mandat", [["organizational-context", "Contexte organisationnel"], ["diagnosis-question", "Problème de gestion"], ["objectives", "Objectifs et périmètre"]]),
    additionalChapter("framework", "Diagnostic et cadre d’analyse", [["process-map", "Cartographie du processus"], ["stakeholders", "Parties prenantes"], ["criteria", "Critères d’évaluation"]]),
    additionalChapter("methodology", "Méthode de recherche appliquée", [["case-design", "Étude de cas et sources"], ["collection", "Collecte et triangulation"], ["analysis", "Analyse des écarts"]]),
    additionalChapter("findings", "Diagnostic des résultats", [["baseline", "Situation de référence"], ["causes", "Causes des écarts"], ["validation", "Validation des constats"]]),
    additionalChapter("recommendations", "Plan d’amélioration", [["options", "Options comparées"], ["roadmap", "Feuille de route"], ["metrics", "Indicateurs de suivi et risques"]]),
    additionalChapter("conclusion", "Conclusion et conditions de mise en œuvre", [["summary", "Synthèse"], ["limits", "Limites et suites"]]),
  ],
  "master-clinical-study": [
    additionalChapter("introduction", "Introduction", [["clinical-context", "Contexte clinique et justification"], ["question", "Question et objectif"], ["design", "Type d’étude"]]),
    additionalChapter("methods", "Méthodes", [["setting", "Cadre et période"], ["participants", "Participants et critères d’éligibilité"], ["variables", "Critères de jugement et variables"], ["data", "Collecte et gestion des données"], ["ethics", "Éthique et autorisations"]]),
    additionalChapter("results", "Résultats", [["flow", "Flux des participants"], ["baseline", "Caractéristiques initiales"], ["outcomes", "Résultats par critère"], ["safety", "Événements et données manquantes"]]),
    additionalChapter("discussion", "Discussion", [["principal-findings", "Résultats principaux"], ["evidence", "Mise en perspective"], ["bias", "Biais et limites"], ["implications", "Implications cliniques prudentes"]]),
    additionalChapter("conclusion", "Conclusion", [["summary", "Conclusion au regard des données"], ["research", "Suites de recherche"]]),
  ],
  "master-literature-review": [
    additionalChapter("introduction", "Introduction de la revue", [["rationale", "Justification de la revue"], ["question", "Question et objectifs"], ["scope", "Périmètre et concepts"]]),
    additionalChapter("methods", "Méthode de recherche documentaire", [["eligibility", "Critères d’éligibilité"], ["sources", "Bases et sources consultées"], ["search", "Stratégie de recherche"], ["selection", "Sélection et extraction"], ["quality", "Évaluation critique des études"]]),
    additionalChapter("results", "Résultats de la revue", [["flow", "Sélection des références"], ["study-characteristics", "Caractéristiques des études"], ["synthesis", "Synthèse thématique"], ["certainty", "Limites et certitude des éléments"]]),
    additionalChapter("discussion", "Discussion", [["summary", "Synthèse des preuves"], ["gaps", "Lacunes de recherche"], ["limitations", "Limites de la revue"]]),
    additionalChapter("conclusion", "Conclusion", [["implications", "Implications prudentes"], ["future-work", "Priorités de recherche"]]),
  ],
  "doctorate-monograph": [
    additionalChapter("introduction", "Introduction générale", [["research-context", "Contexte scientifique"], ["research-problem", "Problématique et lacune"], ["questions", "Questions et propositions"], ["contributions", "Contributions originales"], ["thesis-map", "Organisation de la thèse"]]),
    additionalChapter("theory", "Cadre théorique et état critique", [["concepts", "Concepts opératoires"], ["debates", "Débats théoriques"], ["model", "Cadre analytique"]]),
    additionalChapter("methods", "Positionnement et méthodes", [["epistemology", "Positionnement épistémologique"], ["case-selection", "Choix des cas et sources"], ["analysis", "Procédures d’analyse"], ["reflexivity", "Réflexivité, éthique et limites"]]),
    additionalChapter("analysis-one", "Résultats — Axe I", [["evidence-one", "Matériaux et constats"], ["interpretation-one", "Analyse de l’axe"]]),
    additionalChapter("analysis-two", "Résultats — Axe II", [["evidence-two", "Matériaux et constats"], ["interpretation-two", "Analyse comparative"]]),
    additionalChapter("general-discussion", "Discussion générale", [["contributions", "Contributions à la littérature"], ["synthesis", "Synthèse transversale"], ["limits", "Limites et portée"]]),
    additionalChapter("conclusion", "Conclusion générale", [["answers", "Réponses aux questions"], ["contributions", "Apports et perspectives"]]),
  ],
  "doctorate-by-publications": [
    additionalChapter("introduction", "Introduction du programme de recherche", [["rationale", "Contexte et justification du format"], ["coherence", "Question commune et cohérence des articles"], ["contributions", "Contributions personnelles"]]),
    additionalChapter("framework", "Cadre intégrateur", [["state-of-art", "État de la recherche"], ["shared-methods", "Approches et méthodes communes"]]),
    additionalChapter("article-one", "Article I — Présentation et contribution", [["citation-one", "Référence et statut de publication"], ["contribution-one", "Question, méthode et résultat principal"]]),
    additionalChapter("article-two", "Article II — Présentation et contribution", [["citation-two", "Référence et statut de publication"], ["contribution-two", "Question, méthode et résultat principal"]]),
    additionalChapter("article-three", "Article III — Présentation et contribution", [["citation-three", "Référence et statut de publication"], ["contribution-three", "Question, méthode et résultat principal"]]),
    additionalChapter("synthesis", "Discussion intégrative", [["cross-results", "Résultats transversaux"], ["originality", "Originalité et limites"], ["future-work", "Perspectives"]]),
    additionalChapter("conclusion", "Conclusion générale", [["contributions", "Bilan des contributions"], ["outlook", "Ouverture scientifique"]]),
  ],
  "doctorate-laboratory": [
    additionalChapter("introduction", "Introduction et objectifs", [["context", "Contexte scientifique"], ["gap", "Lacune de connaissance"], ["objectives", "Objectifs et hypothèses"]]),
    additionalChapter("literature", "État de l’art et fondements", [["materials", "Matériaux et mécanismes connus"], ["methods-review", "Méthodes de caractérisation"], ["hypotheses", "Cadre d’hypothèses"]]),
    additionalChapter("methods", "Matériels et méthodes expérimentales", [["synthesis", "Préparation des matériaux"], ["characterization", "Protocoles de caractérisation"], ["analysis", "Traitement des mesures et incertitudes"], ["reproducibility", "Répétabilité et traçabilité"]]),
    additionalChapter("results", "Résultats expérimentaux", [["composition", "Composition et propriétés"], ["performance", "Performance catalytique"], ["stability", "Stabilité et cycles"], ["uncertainty", "Variabilité des mesures"]]),
    additionalChapter("discussion", "Discussion mécanistique", [["relations", "Relations structure–propriété"], ["comparison", "Comparaison à la littérature"], ["limits", "Limites expérimentales"]]),
    additionalChapter("conclusion", "Conclusion et perspectives", [["findings", "Conclusions étayées"], ["next-steps", "Expériences futures"]]),
  ],
  "postdoc-project-report": [
    additionalChapter("executive-summary", "Synthèse du programme", [["objectives", "Objectifs et jalons"], ["results", "Résultats consolidés"], ["outputs", "Livrables et diffusion"]]),
    additionalChapter("programme", "Contexte et gouvernance scientifique", [["background", "Contexte et consortium"], ["work-packages", "Lots de travail"], ["method", "Approches et gestion des données"]]),
    additionalChapter("findings", "Résultats et contributions", [["scientific-results", "Résultats scientifiques"], ["technical-results", "Résultats techniques"], ["validation", "Validation et reproductibilité"]]),
    additionalChapter("impact", "Impact, limites et suites", [["impact", "Impact observé et potentiel"], ["limitations", "Risques et limites"], ["roadmap", "Feuille de route de recherche"]]),
    additionalChapter("conclusion", "Conclusion", [["summary", "Bilan du programme"], ["dissemination", "Diffusion et réutilisation"]]),
  ],
  "postdoc-fellowship-proposal": [
    additionalChapter("summary", "Résumé scientifique du projet", [["case", "Problème et importance"], ["aims", "Objectifs et hypothèses"], ["novelty", "Originalité et contribution"]]),
    additionalChapter("state-of-art", "État de l’art et lacune", [["evidence", "État des connaissances"], ["gap", "Lacune visée"], ["innovation", "Avancée proposée"]]),
    additionalChapter("workplan", "Programme de travail", [["design", "Conception scientifique"], ["work-packages", "Lots et jalons"], ["risks", "Risques et solutions de repli"]]),
    additionalChapter("resources", "Faisabilité et environnement", [["team", "Compétences et encadrement"], ["facilities", "Infrastructures et ressources"], ["data-plan", "Gestion et partage des données"]]),
    additionalChapter("impact", "Résultats attendus et impact", [["outputs", "Résultats et livrables attendus"], ["dissemination", "Diffusion"], ["ethics", "Éthique et responsabilité"]]),
  ],
  "professional-expertise": [
    additionalChapter("executive-summary", "Synthèse exécutive", [["mandate", "Mandat et périmètre"], ["key-findings", "Constats déterminants"], ["priorities", "Décisions prioritaires"]]),
    additionalChapter("context", "Contexte et méthode du diagnostic", [["organization", "Environnement de l’organisation"], ["sources", "Sources et entretiens"], ["criteria", "Critères d’évaluation"]]),
    additionalChapter("diagnosis", "Diagnostic étayé", [["processes", "Processus examinés"], ["strengths", "Atouts et pratiques robustes"], ["gaps", "Écarts, causes et risques"]]),
    additionalChapter("recommendations", "Recommandations et mise en œuvre", [["options", "Options évaluées"], ["roadmap", "Plan d’action priorisé"], ["governance", "Responsables et suivi"]]),
    additionalChapter("conclusion", "Conclusion", [["decision", "Décisions proposées"], ["limits", "Hypothèses et limites du diagnostic"]]),
  ],
  "professional-placement": [
    additionalChapter("introduction", "Cadre du stage", [["organization", "Entreprise et service d’accueil"], ["mission", "Mission confiée"], ["objectives", "Objectifs professionnels"]]),
    additionalChapter("organization", "Environnement industriel", [["equipment", "Équipements et processus"], ["safety", "Organisation de la sécurité"], ["maintenance-policy", "Politique de maintenance"]]),
    additionalChapter("methods", "Diagnostic de maintenance", [["baseline", "État initial et historiques"], ["failure-modes", "Pannes et criticité"], ["indicators", "Indicateurs de disponibilité"]]),
    additionalChapter("work", "Travaux réalisés", [["actions", "Interventions et livrables"], ["validation", "Vérification des actions"], ["skills", "Compétences mobilisées"]]),
    additionalChapter("recommendations", "Plan d’amélioration", [["priorities", "Actions prioritaires"], ["schedule", "Calendrier et ressources"], ["follow-up", "Indicateurs de suivi"]]),
    additionalChapter("conclusion", "Bilan du stage", [["learning", "Acquis professionnels"], ["limits", "Limites et suites proposées"]]),
  ],
  "professional-consulting": [
    additionalChapter("executive-summary", "Synthèse de mission", [["objective", "Objectif et périmètre"], ["diagnosis", "Constats clés"], ["decisions", "Décisions proposées"]]),
    additionalChapter("diagnosis", "Analyse de la situation", [["process", "Parcours et processus actuels"], ["data", "Données et sources"], ["root-causes", "Causes des délais et irritants"]]),
    additionalChapter("options", "Scénarios d’amélioration", [["options", "Options comparées"], ["impact", "Impacts, coûts et risques"], ["recommendation", "Option recommandée et justification"]]),
    additionalChapter("implementation", "Plan de déploiement", [["roadmap", "Étapes et jalons"], ["governance", "Responsabilités"], ["metrics", "Mesure des bénéfices"]]),
    additionalChapter("conclusion", "Conclusion et conditions de réussite", [["summary", "Synthèse de la mission"], ["assumptions", "Hypothèses et limites"]]),
  ],
  "research-protocol": [
    additionalChapter("summary", "Résumé du protocole", [["question", "Question et objectifs"], ["design", "Type de recherche"], ["population", "Population visée"]]),
    additionalChapter("rationale", "Justification scientifique", [["background", "État des connaissances"], ["gap", "Justification de l’étude"], ["hypotheses", "Objectifs et hypothèses préspécifiés"]]),
    additionalChapter("methods", "Plan expérimental ou observationnel", [["setting", "Cadre et calendrier"], ["eligibility", "Éligibilité et recrutement"], ["intervention", "Intervention ou exposition"], ["outcomes", "Critères de jugement"], ["analysis", "Plan d’analyse"]]),
    additionalChapter("operations", "Gestion opérationnelle", [["data", "Gestion et qualité des données"], ["ethics", "Éthique, consentement et autorisations"], ["monitoring", "Suivi, sécurité et écarts"]]),
    additionalChapter("dissemination", "Diffusion et transparence", [["registration", "Enregistrement et accès au protocole"], ["sharing", "Partage des résultats et données"]]),
  ],
  "research-systematic-review": [
    additionalChapter("introduction", "Introduction", [["rationale", "Justification de la revue"], ["question", "Question structurée et objectifs"]]),
    additionalChapter("methods", "Méthodes de la revue systématique", [["eligibility", "Critères d’éligibilité"], ["sources", "Sources d’information"], ["search-strategy", "Stratégies de recherche reproductibles"], ["selection", "Sélection et dédoublonnage"], ["extraction", "Extraction des données"], ["risk-of-bias", "Évaluation du risque de biais"], ["synthesis-method", "Méthode de synthèse"]]),
    additionalChapter("results", "Résultats de la recherche", [["selection-results", "Flux de sélection PRISMA"], ["included-studies", "Caractéristiques des études incluses"], ["bias-results", "Risque de biais"], ["synthesis-results", "Résultats de synthèse"]]),
    additionalChapter("discussion", "Discussion", [["summary", "Synthèse des preuves"], ["certainty", "Certitude et limites des preuves"], ["implications", "Implications pour la recherche et la pratique"]]),
    additionalChapter("conclusion", "Conclusion", [["conclusions", "Conclusions en lien avec les données"], ["registration", "Enregistrement, protocole et transparence"]]),
  ],
  "research-laboratory-report": [
    additionalChapter("introduction", "Introduction", [["scientific-context", "Contexte et principe"], ["objective", "Objectif expérimental"]]),
    additionalChapter("methods", "Matériel et protocole", [["materials", "Matériel, réactifs et sécurité"], ["procedure", "Protocole expérimental"], ["measurements", "Mesures, témoins et répétitions"], ["calculations", "Calculs et incertitudes"]]),
    additionalChapter("results", "Résultats", [["raw-data", "Observations et données"], ["analysis", "Traitement des résultats"], ["figures", "Graphiques et tableaux"]]),
    additionalChapter("discussion", "Discussion", [["interpretation", "Interprétation physico-chimique"], ["uncertainty", "Incertitudes et limites"], ["comparison", "Comparaison aux références"]]),
    additionalChapter("conclusion", "Conclusion", [["summary", "Bilan expérimental"], ["improvements", "Améliorations du protocole"]]),
  ],
  "other-academic-portfolio": [
    additionalChapter("profile", "Profil académique", [["objectives", "Objectifs du parcours"], ["areas", "Domaines de compétence"]]),
    additionalChapter("evidence", "Réalisations sélectionnées", [["projects", "Projets et productions"], ["methods", "Démarches et outils mobilisés"], ["outcomes", "Résultats et preuves associées"]]),
    additionalChapter("reflection", "Analyse réflexive", [["skills", "Compétences démontrées"], ["development", "Progression et apprentissages"], ["limits", "Axes de développement"]]),
    additionalChapter("conclusion", "Synthèse du parcours", [["alignment", "Cohérence avec le projet académique"], ["next-steps", "Prochaines étapes"]]),
  ],
  "other-project-report": [
    additionalChapter("executive-summary", "Synthèse du projet", [["purpose", "Finalité et bénéficiaires"], ["results", "Résultats principaux"], ["decisions", "Suites proposées"]]),
    additionalChapter("framing", "Cadrage et planification", [["needs", "Besoins et objectifs"], ["scope", "Périmètre et contraintes"], ["plan", "Organisation, jalons et risques"]]),
    additionalChapter("implementation", "Réalisation", [["approach", "Démarche retenue"], ["deliverables", "Livrables produits"], ["changes", "Écarts et décisions de pilotage"]]),
    additionalChapter("evaluation", "Évaluation du projet", [["criteria", "Critères et preuves"], ["outcomes", "Résultats observés"], ["lessons", "Enseignements et limites"]]),
    additionalChapter("conclusion", "Conclusion et recommandations", [["summary", "Bilan"], ["continuation", "Conditions de poursuite"]]),
  ],
};

const ADDITIONAL_TEMPLATE_SPECS = [
  { id: "secondaire-projet-scolaire", name: "Dossier de projet scolaire", level: ACADEMIC_LEVELS.SECONDARY, type: DOCUMENT_TYPES.PROJET_FIN_ETUDES, category: TEMPLATE_CATEGORIES.PROJETS, structure: "RAPPORT_STAGE", design: "geometrique", coverLayout: "blocks", field: SCIENTIFIC_FIELDS.EDUCATION, pages: 12, citation: CITATION_STYLES.MLA },
  { id: "secondaire-enquete", name: "Dossier d'enqu\u00eate et d'observation", level: ACADEMIC_LEVELS.SECONDARY, type: DOCUMENT_TYPES.PROJET_RECHERCHE, category: TEMPLATE_CATEGORIES.RECHERCHE, structure: "MEMOIRE_LICENCE", design: "terrain", coverLayout: "field", field: SCIENTIFIC_FIELDS.SOCIAL_SCIENCES, pages: 15, citation: CITATION_STYLES.APA },
  { id: "undergraduate-research-paper", name: "Research paper \u2014 Undergraduate", level: ACADEMIC_LEVELS.UNDERGRADUATE, type: DOCUMENT_TYPES.ARTICLE_SCIENTIFIQUE, category: TEMPLATE_CATEGORIES.ARTICLES, structure: "ARTICLE_IMRAD", design: "editorial", coverLayout: "editorial", field: SCIENTIFIC_FIELDS.HUMANITIES, pages: 18, citation: CITATION_STYLES.MLA },
  { id: "undergraduate-capstone", name: "Undergraduate capstone project", level: ACADEMIC_LEVELS.UNDERGRADUATE, type: DOCUMENT_TYPES.PROJET_FIN_ETUDES, category: TEMPLATE_CATEGORIES.PROJETS, structure: "RAPPORT_TECHNIQUE", design: "executif", coverLayout: "rail", field: SCIENTIFIC_FIELDS.ENGINEERING, pages: 25, citation: CITATION_STYLES.IEEE },
  { id: "licence-humanities", name: "M\u00e9moire de licence \u2014 Sciences humaines", level: ACADEMIC_LEVELS.LICENCE, type: DOCUMENT_TYPES.MEMOIRE, category: TEMPLATE_CATEGORIES.MEMOIRES, structure: "MEMOIRE_LICENCE", design: "editorial", coverLayout: "editorial", field: SCIENTIFIC_FIELDS.HUMANITIES, pages: 35, citation: CITATION_STYLES.CHICAGO },
  { id: "licence-field-study", name: "M\u00e9moire de licence \u2014 Enqu\u00eate de terrain", level: ACADEMIC_LEVELS.LICENCE, type: DOCUMENT_TYPES.MEMOIRE, category: TEMPLATE_CATEGORIES.MEMOIRES, structure: "MEMOIRE_LICENCE", design: "terrain", coverLayout: "field", field: SCIENTIFIC_FIELDS.SOCIAL_SCIENCES, pages: 35, citation: CITATION_STYLES.APA },
  { id: "bachelor-empirical-thesis", name: "Bachelor thesis \u2014 Empirical study", level: ACADEMIC_LEVELS.BACHELOR, type: DOCUMENT_TYPES.MEMOIRE, category: TEMPLATE_CATEGORIES.MEMOIRES, structure: "MEMOIRE_MASTER", design: "donnees", coverLayout: "data", field: SCIENTIFIC_FIELDS.ECONOMICS, pages: 40, citation: CITATION_STYLES.HARVARD },
  { id: "bachelor-honours-project", name: "Bachelor honours project", level: ACADEMIC_LEVELS.BACHELOR, type: DOCUMENT_TYPES.PROJET_FIN_ETUDES, category: TEMPLATE_CATEGORIES.PROJETS, structure: "RAPPORT_TECHNIQUE", design: "geometrique", coverLayout: "blocks", field: SCIENTIFIC_FIELDS.COMPUTER_SCIENCE, pages: 30, citation: CITATION_STYLES.IEEE },
  { id: "master-applied-study", name: "M\u00e9moire de master \u2014 Recherche appliqu\u00e9e", level: ACADEMIC_LEVELS.MASTER, type: DOCUMENT_TYPES.MEMOIRE, category: TEMPLATE_CATEGORIES.MEMOIRES, structure: "MEMOIRE_MASTER", design: "executif", coverLayout: "split", field: SCIENTIFIC_FIELDS.MANAGEMENT, pages: 55, citation: CITATION_STYLES.APA },
  { id: "master-clinical-study", name: "M\u00e9moire de master \u2014 \u00c9tude clinique", level: ACADEMIC_LEVELS.MASTER, type: DOCUMENT_TYPES.MEMOIRE, category: TEMPLATE_CATEGORIES.MEMOIRES, structure: "MEMOIRE_MASTER", design: "clinique", coverLayout: "clinical", field: SCIENTIFIC_FIELDS.MEDICINE, pages: 60, citation: CITATION_STYLES.VANCOUVER },
  { id: "master-literature-review", name: "M\u00e9moire de master \u2014 Revue de litt\u00e9rature", level: ACADEMIC_LEVELS.MASTER, type: DOCUMENT_TYPES.ARTICLE_SCIENTIFIQUE, category: TEMPLATE_CATEGORIES.RECHERCHE, structure: "ARTICLE_IMRAD", design: "monochrome", coverLayout: "minimal", field: SCIENTIFIC_FIELDS.EDUCATION, pages: 45, citation: CITATION_STYLES.APA },
  { id: "doctorate-monograph", name: "Th\u00e8se doctorale \u2014 Monographie", level: ACADEMIC_LEVELS.DOCTORATE, type: DOCUMENT_TYPES.THESE, category: TEMPLATE_CATEGORIES.THESES, structure: "THESE_SCIENTIFIQUE", design: "institutionnel", coverLayout: "institutional", field: SCIENTIFIC_FIELDS.HUMANITIES, pages: 120, citation: CITATION_STYLES.CHICAGO },
  { id: "doctorate-by-publications", name: "Th\u00e8se par articles", level: ACADEMIC_LEVELS.DOCTORATE, type: DOCUMENT_TYPES.THESE, category: TEMPLATE_CATEGORIES.THESES, structure: "THESE_SCIENTIFIQUE", design: "editorial", coverLayout: "journal", field: SCIENTIFIC_FIELDS.BIOLOGY, pages: 100, citation: CITATION_STYLES.VANCOUVER },
  { id: "doctorate-laboratory", name: "Th\u00e8se doctorale \u2014 Sciences exp\u00e9rimentales", level: ACADEMIC_LEVELS.DOCTORATE, type: DOCUMENT_TYPES.THESE, category: TEMPLATE_CATEGORIES.THESES, structure: "THESE_SCIENTIFIQUE", design: "donnees", coverLayout: "data", field: SCIENTIFIC_FIELDS.CHEMISTRY, pages: 140, citation: CITATION_STYLES.IEEE },
  { id: "postdoc-project-report", name: "Rapport de recherche postdoctoral", level: ACADEMIC_LEVELS.POSTDOCTORATE, type: DOCUMENT_TYPES.RAPPORT_RECHERCHE, category: TEMPLATE_CATEGORIES.RECHERCHE, structure: "THESE_SCIENTIFIQUE", design: "executif", coverLayout: "split", field: SCIENTIFIC_FIELDS.ENGINEERING, pages: 45, citation: CITATION_STYLES.IEEE },
  { id: "postdoc-fellowship-proposal", name: "Dossier de projet postdoctoral", level: ACADEMIC_LEVELS.POSTDOCTORATE, type: DOCUMENT_TYPES.PROJET_RECHERCHE, category: TEMPLATE_CATEGORIES.RECHERCHE, structure: "ARTICLE_IMRAD", design: "editorial", coverLayout: "journal", field: SCIENTIFIC_FIELDS.BIOLOGY, pages: 30, citation: CITATION_STYLES.APA },
  { id: "professional-expertise", name: "Rapport d'expertise professionnelle", level: ACADEMIC_LEVELS.PROFESSIONAL, type: DOCUMENT_TYPES.RAPPORT_TECHNIQUE, category: TEMPLATE_CATEGORIES.RAPPORTS_TECHNIQUES, structure: "RAPPORT_TECHNIQUE", design: "executif", coverLayout: "rail", field: SCIENTIFIC_FIELDS.MANAGEMENT, pages: 25, citation: CITATION_STYLES.HARVARD },
  { id: "professional-placement", name: "Rapport de stage professionnel", level: ACADEMIC_LEVELS.PROFESSIONAL, type: DOCUMENT_TYPES.RAPPORT_STAGE, category: TEMPLATE_CATEGORIES.RAPPORTS_STAGE, structure: "RAPPORT_STAGE", design: "technique", coverLayout: "technical", field: SCIENTIFIC_FIELDS.ENGINEERING, pages: 25, citation: CITATION_STYLES.IEEE },
  { id: "professional-consulting", name: "Dossier de mission et recommandations", level: ACADEMIC_LEVELS.PROFESSIONAL, type: DOCUMENT_TYPES.RAPPORT_TECHNIQUE, category: TEMPLATE_CATEGORIES.RAPPORTS_TECHNIQUES, structure: "RAPPORT_TECHNIQUE", design: "geometrique", coverLayout: "blocks", field: SCIENTIFIC_FIELDS.ECONOMICS, pages: 20, citation: CITATION_STYLES.APA },
  { id: "research-protocol", name: "Protocole de recherche", level: ACADEMIC_LEVELS.RESEARCH, type: DOCUMENT_TYPES.PROJET_RECHERCHE, category: TEMPLATE_CATEGORIES.RECHERCHE, structure: "MEMOIRE_MASTER", design: "scientifique", coverLayout: "scientific", field: SCIENTIFIC_FIELDS.MEDICINE, pages: 25, citation: CITATION_STYLES.VANCOUVER },
  { id: "research-systematic-review", name: "Revue syst\u00e9matique de la litt\u00e9rature", level: ACADEMIC_LEVELS.RESEARCH, type: DOCUMENT_TYPES.ARTICLE_SCIENTIFIQUE, category: TEMPLATE_CATEGORIES.ARTICLES, structure: "ARTICLE_IMRAD", design: "donnees", coverLayout: "data", field: SCIENTIFIC_FIELDS.PHARMACY, pages: 35, citation: CITATION_STYLES.VANCOUVER },
  { id: "research-laboratory-report", name: "Rapport de laboratoire", level: ACADEMIC_LEVELS.RESEARCH, type: DOCUMENT_TYPES.RAPPORT_LABORATOIRE, category: TEMPLATE_CATEGORIES.RECHERCHE, structure: "ARTICLE_IMRAD", design: "clinique", coverLayout: "clinical", field: SCIENTIFIC_FIELDS.CHEMISTRY, pages: 18, citation: CITATION_STYLES.IEEE },
  { id: "other-academic-portfolio", name: "Portfolio acad\u00e9mique libre", level: ACADEMIC_LEVELS.OTHER, type: DOCUMENT_TYPES.DOCUMENT_LIBRE, category: TEMPLATE_CATEGORIES.AUTRES, structure: "RAPPORT_STAGE", design: "minimaliste", coverLayout: "minimal", field: SCIENTIFIC_FIELDS.OTHER, pages: 15, citation: CITATION_STYLES.APA },
  { id: "other-project-report", name: "Rapport de projet polyvalent", level: ACADEMIC_LEVELS.OTHER, type: DOCUMENT_TYPES.DOCUMENT_ACADEMIQUE, category: TEMPLATE_CATEGORIES.AUTRES, structure: "RAPPORT_TECHNIQUE", design: "monochrome", coverLayout: "editorial", field: SCIENTIFIC_FIELDS.OTHER, pages: 20, citation: CITATION_STYLES.CHICAGO },
];

const REPORTING_GUIDELINES_BY_TEMPLATE = {
  "master-clinical-study": [{ id: "STROBE", title: "STROBE — études observationnelles", url: "https://www.strobe-statement.org/checklists/", applicability: "À utiliser si le devis retenu est une étude observationnelle." }],
  "master-literature-review": [{ id: "PRISMA 2020", title: "PRISMA 2020 — revue systématique", url: "https://www.bmj.com/content/372/bmj.n71.long", applicability: "À utiliser si la revue suit une méthode systématique." }],
  "research-systematic-review": [{ id: "PRISMA 2020", title: "PRISMA 2020 — revue systématique", url: "https://www.bmj.com/content/372/bmj.n71.long", applicability: "Guide de rapport pour les revues systématiques et méta-analyses." }],
};

REPORT_TEMPLATES.forEach((template) => {
  template.contentStatus = "illustrative-scenario";
});

REPORT_TEMPLATES.push(...ADDITIONAL_TEMPLATE_SPECS.map((spec) => ({
  id: spec.id,
  name: spec.name,
  label: spec.name,
  description: `Plan conçu pour ${spec.name.toLowerCase()}, avec des parties adaptées à son niveau et à son objectif. Les résultats et valeurs du scénario sont des exemples de démonstration.`,
  type: spec.type,
  category: spec.category,
  academicContext: { ...DEFAULT_ACADEMIC_CONTEXT },
  fields: [spec.field],
  level: spec.level,
  language: [DOCUMENT_LANGUAGES.FR, DOCUMENT_LANGUAGES.EN],
  structureId: spec.id,
  structure: ADDITIONAL_TEMPLATE_STRUCTURES[spec.id] || ACADEMIC_STRUCTURES[spec.structure],
  design: spec.design,
  coverLayout: spec.coverLayout,
  minimumBodyPages: spec.pages,
  frontMatter: spec.type === DOCUMENT_TYPES.ARTICLE_SCIENTIFIQUE
    ? { ...DEFAULT_FRONT_MATTER, cover: false, titlePage: false, tableOfContents: false }
    : { ...DEFAULT_FRONT_MATTER },
  documentRules: { ...DEFAULT_DOCUMENT_RULES, reportingGuidelines: REPORTING_GUIDELINES_BY_TEMPLATE[spec.id] || [] },
  reportingGuidelines: REPORTING_GUIDELINES_BY_TEMPLATE[spec.id] || [],
  contentStatus: "illustrative-scenario",
  citationStyle: spec.citation,
  tags: [spec.level, spec.field, spec.design],
  featured: false,
  version: MACEVO_TEMPLATE_VERSION,
})));

/* ============================================================
   16. REGISTRES
   ============================================================ */

export const reportTemplates = REPORT_TEMPLATES;

export const templates = REPORT_TEMPLATES;

export const templateRegistry = Object.freeze(
  REPORT_TEMPLATES.reduce((registry, template) => {
    registry[template.id] = template;
    return registry;
  }, {})
);

/* ============================================================
   17. RECHERCHE PAR ID
   ============================================================ */

export function getTemplateById(id) {
  if (!id) {
    return null;
  }

  return templateRegistry[id] || null;
}

/*
 * Compatibilité avec l'ancien système.
 */

export function getReportTemplate(id) {
  return getTemplateById(id);
}

/* ============================================================
   18. LISTE DES MODÈLES
   ============================================================ */

export function getTemplates() {
  return [...REPORT_TEMPLATES];
}

/* ============================================================
   19. FILTRE PAR CATÉGORIE
   ============================================================ */

export function getTemplatesByCategory(category) {
  return REPORT_TEMPLATES.filter(
    (template) => template.category === category
  );
}

/* ============================================================
   20. FILTRE PAR TYPE
   ============================================================ */

export function getTemplatesByType(type) {
  return REPORT_TEMPLATES.filter(
    (template) => template.type === type
  );
}

/* ============================================================
   21. FILTRE PAR NIVEAU
   ============================================================ */

function normalizeLevels(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value) return [value];
  return [];
}

function normalizeLanguages(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value) return [value];
  return [];
}

function normalizeFields(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value) return [value];
  return [];
}

export function getTemplatesByLevel(level) {
  return REPORT_TEMPLATES.filter((template) =>
    normalizeLevels(template.level).includes(level)
  );
}

/* ============================================================
   22. FILTRE PAR LANGUE
   ============================================================ */

export function getTemplatesByLanguage(language) {
  return REPORT_TEMPLATES.filter((template) =>
    normalizeLanguages(template.language).includes(language)
  );
}

/* ============================================================
   23. FILTRE PAR DOMAINE
   ============================================================ */

export function getTemplatesByField(field) {
  return REPORT_TEMPLATES.filter((template) =>
    normalizeFields(template.fields).includes(field)
  );
}

/* ============================================================
   24. FILTRE PAR NORME
   ============================================================ */

export function getTemplatesByCitationStyle(citationStyle) {
  return REPORT_TEMPLATES.filter(
    (template) => template.citationStyle === citationStyle
  );
}

/* ============================================================
   25. FILTRE PAR DESIGN
   ============================================================ */

export function getTemplatesByDesign(design) {
  return REPORT_TEMPLATES.filter(
    (template) => template.design === design
  );
}

/* ============================================================
   26. RECHERCHE TEXTUELLE
   ============================================================ */

export function searchTemplates(query = "") {
  const normalized = String(query)
    .trim()
    .toLowerCase();

  if (!normalized) {
    return getTemplates();
  }

  return REPORT_TEMPLATES.filter((template) => {
    const searchable = [
      template.id,
      template.name,
      template.label,
      template.description,
      template.type,
      template.category,
      template.structureId,
      template.design,

      ...(template.tags || []),

      ...(template.fields || []),

      ...normalizeLevels(template.level),

      ...normalizeLanguages(template.language),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(normalized);
  });
}

/* ============================================================
   27. RECHERCHE AVANCÉE
   ============================================================ */

/*
 * Exemple :
 *
 * findTemplates({
 *   type: "memoire",
 *   level: "master",
 *   field: "computer-science",
 *   language: "fr",
 * })
 */

export function findTemplates({
  type = null,
  category = null,
  level = null,
  language = null,
  field = null,
  citationStyle = null,
  design = null,
  featured = null,
} = {}) {
  return REPORT_TEMPLATES.filter((template) => {
    if (type && template.type !== type) {
      return false;
    }

    if (category && template.category !== category) {
      return false;
    }

    if (
      level &&
      !normalizeLevels(template.level).includes(level)
    ) {
      return false;
    }

    if (
      language &&
      !normalizeLanguages(template.language).includes(language)
    ) {
      return false;
    }

    if (
      field &&
      !normalizeFields(template.fields).includes(field)
    ) {
      return false;
    }

    if (
      citationStyle &&
      template.citationStyle !== citationStyle
    ) {
      return false;
    }

    if (
      design &&
      template.design !== design
    ) {
      return false;
    }

    if (
      featured !== null &&
      template.featured !== featured
    ) {
      return false;
    }

    return true;
  });
}/* ============================================================
   28. DESIGN D'UN MODÈLE
   ============================================================ */

export function getTemplateDesign(templateOrId) {
  const template =
    typeof templateOrId === "string"
      ? getTemplateById(templateOrId)
      : templateOrId;

  if (!template) {
    return TEMPLATE_DESIGNS.CLASSIQUE;
  }

  const designId =
    String(template.design || "classique").toUpperCase();

  return (
    TEMPLATE_DESIGNS[designId] ||
    TEMPLATE_DESIGNS.CLASSIQUE
  );
}

/* ============================================================
   29. CLONAGE
   ============================================================ */

function clone(value) {
  if (value === undefined || value === null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

/* ============================================================
   30. ID DOCUMENT
   ============================================================ */

function createDocumentId() {
  return `doc-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/* ============================================================
   31. DOCUMENT MACEVO VIDE
   ============================================================ */

export function createEmptyMacevoDocument(options = {}) {
  const now = new Date().toISOString();

  return {
    schema: "macevo-scientific-document",

    version: "2.0.0",

    id: options.id || createDocumentId(),

    metadata: {
      title: options.title || "",

      subtitle: options.subtitle || "",

      author: options.author || "",

      institution: options.institution || "",

      faculty: options.faculty || "",

      department: options.department || "",

      program: options.program || "",

      country: options.country || "",

      language:
        options.language ||
        DOCUMENT_LANGUAGES.FR,

      documentType:
        options.documentType || "",

      academicLevel:
        options.academicLevel || "",

      scientificField:
        options.scientificField || "",

      templateId:
        options.templateId || null,

      templateVersion:
        options.templateVersion || null,

      citationStyle:
        options.citationStyle ||
        CITATION_STYLES.APA,

      createdAt:
        options.createdAt || now,

      updatedAt:
        options.updatedAt || now,
    },

    academicContext: {
      country:
        options.country || null,

      institution:
        options.institution || null,

      faculty:
        options.faculty || null,

      department:
        options.department || null,

      program:
        options.program || null,
    },

    frontMatter: {
      cover: null,

      titlePage: null,

      declaration: null,

      dedication: null,

      acknowledgements: null,

      abstract: null,

      summary: null,

      keywords: [],

      tableOfContents: true,

      listOfFigures: true,

      listOfTables: true,

      listOfAlgorithms: false,

      listOfAbbreviations: false,

      listOfSymbols: false,
    },

    chapters: [],

    appendices: [],

    bibliography: {
      style:
        options.citationStyle ||
        CITATION_STYLES.APA,

      entries: [],

      citedKeys: [],
    },

    glossary: [],

    abbreviations: [],

    scientificRegistry: {
      equations: [],

      figures: [],

      tables: [],

      algorithms: [],

      crossReferences: [],
    },

    settings: {
      numbering: clone(
        DEFAULT_DOCUMENT_RULES.numbering
      ),

      pageFormat:
        DEFAULT_DOCUMENT_RULES.pageFormat,

      margins: clone(
        DEFAULT_DOCUMENT_RULES.margins
      ),

      lineSpacing:
        DEFAULT_DOCUMENT_RULES.lineSpacing,

      paragraphSpacing: clone(
        DEFAULT_DOCUMENT_RULES.paragraphSpacing
      ),

      firstLineIndent:
        DEFAULT_DOCUMENT_RULES.firstLineIndent,
    },

    presentation: {
      designId: "classique",

      design: clone(
        TEMPLATE_DESIGNS.CLASSIQUE
      ),
    },

    editor: {
      engine: "tiptap",

      editable: true,

      autosave: true,

      collaboration: false,
    },
  };
}

/* ============================================================
   32. CRÉATION D'UN DOCUMENT À PARTIR D'UN MODÈLE
   ============================================================ */

export function createDocumentFromTemplate(
  templateOrId,
  options = {}
) {
  const template =
    typeof templateOrId === "string"
      ? getTemplateById(templateOrId)
      : templateOrId;

  if (!template) {
    throw new Error(
      `Modèle MACEVO introuvable : ${templateOrId}`
    );
  }

  const design =
    getTemplateDesign(template);

  const academicLevel =
    options.academicLevel ||
    normalizeLevels(template.level)[0] ||
    ACADEMIC_LEVELS.OTHER;

  const language =
    options.language ||
    normalizeLanguages(template.language)[0] ||
    DOCUMENT_LANGUAGES.FR;

  const document =
    createEmptyMacevoDocument({
      ...options,

      templateId:
        template.id,

      templateVersion:
        template.version,

      documentType:
        options.documentType ||
        template.type,

      academicLevel,

      language,

      scientificField:
        options.scientificField ||
        normalizeFields(template.fields)[0] ||
        SCIENTIFIC_FIELDS.OTHER,

      citationStyle:
        options.citationStyle ||
        template.citationStyle,
    });

  /*
   * Informations sur le modèle.
   */

  document.metadata.template = {
    id: template.id,

    version: template.version,

    name: template.name,
  };

  /*
   * Contexte académique.
   */

  document.academicContext = {
    ...clone(
      DEFAULT_ACADEMIC_CONTEXT
    ),

    ...(template.academicContext || {}),

    ...(options.academicContext || {}),
  };

  /*
   * Présentation.
   */

  document.presentation = {
    designId: design.id,

    design: clone(design),
  };

  /*
   * Règles documentaires.
   */

  document.settings = {
    ...document.settings,

    documentRules: clone(
      template.documentRules
    ),
  };

  /*
   * Front matter.
   */

  document.frontMatter = {
    ...document.frontMatter,

    ...clone(template.frontMatter),
  };

  /*
   * Structure.
   *
   * On clone toujours la structure.
   *
   * Le document utilisateur devient une instance indépendante.
   */

  document.chapters = clone(
    template.structure || []
  );

  document.chapters =
    document.chapters.map(
      (chapter, index) => ({
        ...chapter,

        id:
          chapter.id ||
          `chapter-${index + 1}`,

        number:
          chapter.number ||
          String(index + 1),

        blocks:
          Array.isArray(chapter.blocks)
            ? chapter.blocks
            : [],

        children:
          Array.isArray(chapter.children)
            ? chapter.children
            : [],
      })
    );

  return document;
}

/* ============================================================
   33. NORMALISATION D'UN MODÈLE
   ============================================================ */

export function normalizeTemplate(template) {
  if (
    !template ||
    typeof template !== "object"
  ) {
    return null;
  }

  return {
    ...template,

    id:
      String(template.id || "").trim(),

    name:
      template.name ||
      template.label ||
      "Modèle sans nom",

    label:
      template.label ||
      template.name ||
      "Modèle sans nom",

    description:
      template.description || "",

    type:
      template.type ||
      DOCUMENT_TYPES.DOCUMENT_LIBRE,

    category:
      template.category ||
      TEMPLATE_CATEGORIES.AUTRES,

    academicContext: {
      ...DEFAULT_ACADEMIC_CONTEXT,

      ...(template.academicContext || {}),
    },

    fields:
      normalizeFields(template.fields),

    level:
      normalizeLevels(template.level)[0] ||
      ACADEMIC_LEVELS.OTHER,

    language:
      normalizeLanguages(template.language)[0] ||
      DOCUMENT_LANGUAGES.FR,

    structureId:
      template.structureId ||
      null,

    design:
      template.design ||
      "classique",

    structure:
      Array.isArray(template.structure)
        ? template.structure
        : [],

    frontMatter: {
      ...DEFAULT_FRONT_MATTER,

      ...(template.frontMatter || {}),
    },

    documentRules: {
      ...DEFAULT_DOCUMENT_RULES,

      ...(template.documentRules || {}),
    },

    tags:
      Array.isArray(template.tags)
        ? template.tags
        : [],

    featured:
      Boolean(template.featured),

    version:
      template.version ||
      MACEVO_TEMPLATE_VERSION,
  };
}/* ============================================================
   34. VALIDATION
   ============================================================ */

export function validateTemplate(template) {
  const errors = [];

  if (
    !template ||
    typeof template !== "object"
  ) {
    return {
      valid: false,

      errors: [
        "Le modèle est invalide.",
      ],
    };
  }

  if (!template.id) {
    errors.push(
      "Le modèle doit posséder un id."
    );
  }

  if (
    !template.name &&
    !template.label
  ) {
    errors.push(
      "Le modèle doit posséder un nom."
    );
  }

  if (!template.type) {
    errors.push(
      "Le modèle doit posséder un type."
    );
  }

  if (!template.category) {
    errors.push(
      "Le modèle doit posséder une catégorie."
    );
  }

  if (!template.design) {
    errors.push(
      "Le modèle doit posséder un design."
    );
  }

  if (
    template.design &&
    !Object.values(
      TEMPLATE_DESIGNS
    ).some(
      (design) =>
        design.id === template.design
    )
  ) {
    errors.push(
      `Design inconnu : ${template.design}`
    );
  }

  if (
    !Array.isArray(template.structure)
  ) {
    errors.push(
      "La structure du modèle doit être un tableau."
    );
  }

  if (normalizeLevels(template.level).length !== 1) {
    errors.push(
      "Un modèle MACEVO doit cibler un seul niveau académique."
    );
  }

  if (!normalizeLevels(template.level).length) {
    errors.push(
      "Le modèle doit posséder un niveau académique."
    );
  }

  if (!normalizeLanguages(template.language).length) {
    errors.push(
      "Le modèle doit posséder au moins une langue."
    );
  }

  if (!normalizeFields(template.fields).length) {
    errors.push(
      "Le modèle doit posséder au moins un domaine scientifique."
    );
  }

  return {
    valid: errors.length === 0,

    errors,
  };
}

/* ============================================================
   35. STATISTIQUES
   ============================================================ */

export function getTemplateStatistics(
  templateOrId
) {
  const template =
    typeof templateOrId === "string"
      ? getTemplateById(templateOrId)
      : templateOrId;

  if (!template) {
    return {
      chapters: 0,
      sections: 0,
      subsections: 0,
      totalNodes: 0,
    };
  }

  let chapters = 0;

  let sections = 0;

  let subsections = 0;

  function walk(nodes) {
    if (!Array.isArray(nodes)) {
      return;
    }

    nodes.forEach((node) => {
      if (node.type === "chapter") {
        chapters++;
      } else if (
        node.type === "subsection"
      ) {
        subsections++;
      } else {
        sections++;
      }

      walk(node.children);
    });
  }

  walk(template.structure);

  return {
    chapters,

    sections,

    subsections,

    totalNodes:
      chapters +
      sections +
      subsections,
  };
}

/* ============================================================
   36. MODÈLES MIS EN AVANT
   ============================================================ */

export function getFeaturedTemplates() {
  return REPORT_TEMPLATES.filter(
    (template) =>
      template.featured === true
  );
}

/* ============================================================
   37. COMPATIBILITÉ ANCIEN REGISTRE
   ============================================================ */

export function createAcademicTemplate(
  config = {}
) {
  const normalized =
    normalizeTemplate({
      ...config,

      id: config.id,

      name:
        config.name ||
        config.label,

      label:
        config.label ||
        config.name,

      structure:
        config.structure ||
        config.chapters ||
        [],

      design:
        typeof config.design === "string"
          ? config.design
          : config.design?.id ||
            "classique",
    });

  return normalized;
}

/* ============================================================
   38. EXPORTS COMPATIBLES
   ============================================================ */

export const designs =
  TEMPLATE_DESIGNS;

export const numberingRules =
  DEFAULT_DOCUMENT_RULES.numbering;

export const bibliographyRules = {
  APA: {
    id: CITATION_STYLES.APA,
    name: "APA",
  },

  IEEE: {
    id: CITATION_STYLES.IEEE,
    name: "IEEE",
  },

  Vancouver: {
    id: CITATION_STYLES.VANCOUVER,
    name: "Vancouver",
  },

  Chicago: {
    id: CITATION_STYLES.CHICAGO,
    name: "Chicago",
  },

  Harvard: {
    id: CITATION_STYLES.HARVARD,
    name: "Harvard",
  },

  MLA: {
    id: CITATION_STYLES.MLA,
    name: "MLA",
  },
};

export const academicFrontMatter =
  DEFAULT_FRONT_MATTER;

export const documentRules =
  DEFAULT_DOCUMENT_RULES;

/* ============================================================
   39. REGISTRE DES DOMAINES
   ============================================================ */

export const scientificFields =
  SCIENTIFIC_FIELDS;

/* ============================================================
   40. REGISTRE DES CONTEXTES
   ============================================================ */

export const academicContextProfiles =
  ACADEMIC_CONTEXT_PROFILES;

/* ============================================================
   41. EXPORT PAR DÉFAUT
   ============================================================ */

export default REPORT_TEMPLATES;
