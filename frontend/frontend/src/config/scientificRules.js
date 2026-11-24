// src/config/scientificRules.js

export const ACADEMIC_LEVEL_RULES = {
  Licence: {
    expectedDepth: "intermediate",
    minimumSections: 7,
    recommendedPages: "30-60",
    tone:
      "scientifique, clair, pédagogique et adapté à un travail universitaire de Licence",
    complexity:
      "Les concepts doivent être expliqués clairement sans surcharge théorique inutile.",
  },

  Master: {
    expectedDepth: "advanced",
    minimumSections: 9,
    recommendedPages: "50-100",
    tone:
      "scientifique, analytique, critique et adapté à un travail de recherche de Master",
    complexity:
      "Les concepts doivent être approfondis et mis en relation avec la littérature scientifique.",
  },

  Doctorat: {
    expectedDepth: "expert",
    minimumSections: 11,
    recommendedPages: "100+",
    tone:
      "hautement scientifique, critique, spécialisé et adapté à une recherche doctorale",
    complexity:
      "Les arguments doivent être approfondis, justifiés, comparés à la littérature et accompagnés d'une discussion scientifique.",
  },
};

export const RESEARCH_TYPE_RULES = {
  "Revue de littérature": {
    requires: [
      "question de recherche",
      "stratégie de recherche documentaire",
      "critères d'inclusion",
      "critères d'exclusion",
      "analyse critique des sources",
      "synthèse des résultats",
      "références",
    ],
    guidelines: ["PRISMA"],
    forbiddenClaims: [
      "inventer des résultats expérimentaux",
      "inventer un échantillon",
      "inventer des statistiques",
    ],
  },

  Expérimental: {
    requires: [
      "hypothèses",
      "variables",
      "matériels",
      "protocole expérimental",
      "conditions expérimentales",
      "résultats",
      "analyse",
      "discussion",
    ],
    guidelines: [],
    forbiddenClaims: [
      "inventer des mesures",
      "inventer des participants",
      "inventer des résultats",
      "inventer des valeurs expérimentales",
    ],
  },

  Observationnel: {
    requires: [
      "population",
      "échantillon",
      "critères d'inclusion",
      "critères d'exclusion",
      "méthode de collecte",
      "variables",
      "analyse statistique",
      "résultats",
    ],
    guidelines: ["STROBE"],
    forbiddenClaims: [
      "inventer la taille de l'échantillon",
      "inventer des statistiques",
      "inventer des observations",
    ],
  },

  Descriptif: {
    requires: [
      "population étudiée",
      "variables",
      "méthode de collecte",
      "analyse descriptive",
      "résultats",
    ],
    guidelines: [],
    forbiddenClaims: [
      "inventer des données",
      "inventer des statistiques",
    ],
  },

  Comparatif: {
    requires: [
      "critères de comparaison",
      "groupes ou objets comparés",
      "méthodologie",
      "résultats",
      "analyse comparative",
      "discussion",
    ],
    guidelines: [],
    forbiddenClaims: [
      "inventer les données des groupes",
    ],
  },

  "Étude de cas": {
    requires: [
      "présentation du cas",
      "contexte",
      "méthodologie",
      "analyse",
      "résultats",
      "discussion",
      "limites",
    ],
    guidelines: [],
    forbiddenClaims: [
      "inventer des faits concernant le cas",
    ],
  },

  Quantitatif: {
    requires: [
      "variables",
      "population",
      "échantillonnage",
      "instrument de mesure",
      "méthode statistique",
      "résultats",
      "discussion",
    ],
    guidelines: [],
    forbiddenClaims: [
      "inventer des valeurs statistiques",
      "inventer des p-values",
      "inventer des intervalles de confiance",
    ],
  },

  Qualitatif: {
    requires: [
      "cadre méthodologique",
      "population",
      "échantillonnage",
      "méthode de collecte",
      "méthode d'analyse",
      "résultats",
      "interprétation",
    ],
    guidelines: [],
    forbiddenClaims: [
      "inventer des entretiens",
      "inventer des participants",
      "inventer des verbatims",
    ],
  },

  Mixte: {
    requires: [
      "composante quantitative",
      "composante qualitative",
      "méthodologie d'intégration",
      "résultats quantitatifs",
      "résultats qualitatifs",
      "discussion",
    ],
    guidelines: [],
    forbiddenClaims: [
      "inventer des données",
      "inventer des entretiens",
      "inventer des statistiques",
    ],
  },

  "Recherche-développement": {
    requires: [
      "problématique",
      "besoins",
      "état de l'art",
      "spécifications",
      "conception",
      "développement",
      "tests",
      "validation",
    ],
    guidelines: [],
    forbiddenClaims: [
      "déclarer un système fonctionnel sans test",
      "inventer des résultats de validation",
    ],
  },

  Modélisation: {
    requires: [
      "hypothèses",
      "variables",
      "modèle",
      "équations",
      "conditions aux limites",
      "méthode de résolution",
      "résultats",
      "validation",
    ],
    guidelines: [],
    forbiddenClaims: [
      "inventer des paramètres",
      "inventer des résultats numériques",
    ],
  },

  "Simulation numérique": {
    requires: [
      "modèle mathématique",
      "paramètres",
      "conditions initiales",
      "méthode numérique",
      "algorithme",
      "résultats",
      "validation",
    ],
    guidelines: [],
    forbiddenClaims: [
      "inventer des simulations réellement exécutées",
      "inventer des résultats numériques",
    ],
  },

  "Conception/implémentation": {
    requires: [
      "analyse des besoins",
      "architecture",
      "conception",
      "implémentation",
      "tests",
      "validation",
      "limites",
    ],
    guidelines: [],
    forbiddenClaims: [
      "inventer des tests réalisés",
      "inventer des performances",
    ],
  },

  Autre: {
    requires: [
      "problématique",
      "objectifs",
      "méthodologie",
      "résultats ou analyse",
      "discussion",
      "conclusion",
    ],
    guidelines: [],
    forbiddenClaims: [
      "inventer des données",
      "inventer des références",
    ],
  },
};

export const CITATION_STYLE_RULES = {
  "APA 7": {
    type: "author-date",
    bibliography: "APA 7",
  },

  IEEE: {
    type: "numeric",
    bibliography: "IEEE",
  },

  Vancouver: {
    type: "numeric",
    bibliography: "Vancouver",
  },

  Harvard: {
    type: "author-date",
    bibliography: "Harvard",
  },

  Chicago: {
    type: "author-date-or-notes",
    bibliography: "Chicago",
  },
};

export const SCIENTIFIC_VALIDATION_RULES = [
  {
    id: "empty-sections",
    label: "Aucune section scientifique importante ne doit rester vide",
    severity: "error",
  },

  {
    id: "placeholder-content",
    label: "Aucun texte provisoire ne doit rester dans la version finale",
    severity: "error",
  },

  {
    id: "citation-resolution",
    label: "Chaque citation doit correspondre à une référence bibliographique",
    severity: "error",
  },

  {
    id: "reference-resolution",
    label: "Les références utilisées doivent être réellement citées",
    severity: "warning",
  },

  {
    id: "numbering",
    label:
      "Les figures, tableaux, équations et algorithmes doivent être numérotés de manière cohérente",
    severity: "error",
  },

  {
    id: "no-fabrication",
    label:
      "Aucune donnée, statistique, expérience ou référence ne doit être fabriquée",
    severity: "critical",
  },

  {
    id: "source-traceability",
    label:
      "Les affirmations importantes doivent pouvoir être reliées à une source ou à une justification",
    severity: "warning",
  },

  {
    id: "academic-level",
    label:
      "La profondeur scientifique doit correspondre au niveau académique sélectionné",
    severity: "warning",
  },

  {
    id: "methodology",
    label:
      "La méthodologie doit être suffisamment détaillée pour permettre la compréhension et, lorsque possible, la reproductibilité",
    severity: "warning",
  },

  {
    id: "discussion",
    label:
      "Les résultats doivent être interprétés et discutés, et non simplement énumérés",
    severity: "warning",
  },
];

export function getAcademicRules(level) {
  return (
    ACADEMIC_LEVEL_RULES[level] ||
    ACADEMIC_LEVEL_RULES.Licence
  );
}

export function getResearchRules(type) {
  return (
    RESEARCH_TYPE_RULES[type] ||
    RESEARCH_TYPE_RULES.Autre
  );
}

export function getCitationRules(style) {
  return (
    CITATION_STYLE_RULES[style] ||
    CITATION_STYLE_RULES["APA 7"]
  );
}