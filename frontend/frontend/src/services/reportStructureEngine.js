/**
 * MACEVO — REPORT STRUCTURE ENGINE
 * ------------------------------------------------------------
 *
 * Rôle :
 * Construire une structure académique recommandée à partir
 * du profil de création renseigné par l'utilisateur.
 *
 * Ce fichier ne gère PAS :
 * - l'éditeur
 * - TipTap
 * - le PDF
 * - l'IA
 * - les appels API
 * - la génération du contenu scientifique
 *
 * Il produit uniquement une structure logique exploitable
 * par NewReports.jsx, le backend et l'éditeur.
 *
 * Pipeline :
 * 1. Catalogue des modules
 * 2. Normalisation du profil
 * 3. Structure de base
 * 4. Règles du type de document
 * 5. Règles du type d'étude
 * 6. Règles du niveau académique
 * 7. Règles du domaine scientifique
 * 8. Règles de complexité
 * 9. Exigences explicites
 * 10. Nettoyage
 * 11. Déduplication
 * 12. Invariants
 * 13. Ordonnancement
 * 14. Validation
 */

/* ============================================================
 * 1. CATALOGUE DES MODULES
 * ============================================================ */

export const DOCUMENT_MODULES = {
  /* ---------------- FRONT MATTER ---------------- */

  "cover-page": {
    id: "cover-page",
    title: "Page de garde",
    category: "front_matter",
    kind: "section",
    required: true,
    removable: false,
    recommended: true,
    description:
      "Page d'identification du document, de l'auteur, de l'institution et de la formation.",
  },

  dedication: {
    id: "dedication",
    title: "Dédicace",
    category: "front_matter",
    kind: "section",
    required: false,
    removable: true,
    recommended: false,
    description: "Section personnelle facultative.",
  },

  acknowledgements: {
    id: "acknowledgements",
    title: "Remerciements",
    category: "front_matter",
    kind: "section",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Remerciements adressés aux personnes et institutions.",
  },

  abstract: {
    id: "abstract",
    title: "Résumé",
    category: "front_matter",
    kind: "section",
    required: false,
    removable: true,
    recommended: true,
    description:
      "Résumé synthétique du travail, de la méthode et des principaux résultats.",
  },

  "abstract-second-language": {
    id: "abstract-second-language",
    title: "Résumé en seconde langue",
    category: "front_matter",
    kind: "section",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Version du résumé dans une seconde langue lorsque cela est demandé.",
  },

  "table-of-contents": {
    id: "table-of-contents",
    title: "Table des matières",
    category: "front_matter",
    kind: "section",
    required: false,
    removable: true,
    recommended: true,
    description:
      "Table des matières générée automatiquement à partir de la hiérarchie.",
  },

  "list-of-figures": {
    id: "list-of-figures",
    title: "Liste des figures",
    category: "front_matter",
    kind: "section",
    required: false,
    removable: true,
    recommended: false,
    description: "Liste des figures utilisées dans le document.",
  },

  "list-of-tables": {
    id: "list-of-tables",
    title: "Liste des tableaux",
    category: "front_matter",
    kind: "section",
    required: false,
    removable: true,
    recommended: false,
    description: "Liste des tableaux utilisés dans le document.",
  },

  abbreviations: {
    id: "abbreviations",
    title: "Liste des abréviations",
    category: "front_matter",
    kind: "section",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Liste des sigles, acronymes et abréviations utilisés dans le document.",
  },

  glossary: {
    id: "glossary",
    title: "Glossaire",
    category: "front_matter",
    kind: "section",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Définition des termes techniques ou spécialisés.",
  },

  /* ---------------- SCIENTIFIC CORE ---------------- */

  introduction: {
    id: "introduction",
    title: "Introduction générale",
    category: "scientific_core",
    kind: "section",
    required: false,
    removable: true,
    recommended: true,
    description:
      "Présentation du contexte, du problème, des objectifs et de l'organisation du travail.",
  },

  "problem-statement": {
    id: "problem-statement",
    title: "Problématique",
    category: "scientific_core",
    kind: "section",
    required: false,
    removable: true,
    recommended: true,
    description:
      "Formulation structurée du problème scientifique ou professionnel.",
  },

  "research-questions": {
    id: "research-questions",
    title: "Questions de recherche",
    category: "scientific_core",
    kind: "section",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Questions auxquelles l'étude cherche à apporter une réponse.",
  },

  objectives: {
    id: "objectives",
    title: "Objectifs",
    category: "scientific_core",
    kind: "section",
    required: false,
    removable: true,
    recommended: true,
    description:
      "Objectif général et objectifs spécifiques du travail.",
  },

  hypotheses: {
    id: "hypotheses",
    title: "Hypothèses",
    category: "scientific_core",
    kind: "section",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Hypothèses formulées lorsque le protocole scientifique le justifie.",
  },

  "literature-review": {
    id: "literature-review",
    title: "Revue de littérature",
    category: "scientific_core",
    kind: "section",
    required: false,
    removable: true,
    recommended: true,
    description:
      "Synthèse critique des travaux scientifiques existants.",
  },

  "theoretical-framework": {
    id: "theoretical-framework",
    title: "Cadre théorique",
    category: "scientific_core",
    kind: "section",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Théories et concepts scientifiques mobilisés par le travail.",
  },

  "conceptual-framework": {
    id: "conceptual-framework",
    title: "Cadre conceptuel",
    category: "scientific_core",
    kind: "section",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Organisation des concepts, variables ou relations étudiées.",
  },

  methodology: {
    id: "methodology",
    title: "Méthodologie",
    category: "scientific_core",
    kind: "container",
    required: false,
    removable: true,
    recommended: true,
    description:
      "Méthodologie générale et sous-sections méthodologiques.",
  },

  results: {
    id: "results",
    title: "Résultats",
    category: "scientific_core",
    kind: "section",
    required: false,
    removable: true,
    recommended: true,
    description:
      "Présentation structurée des résultats obtenus.",
  },

  discussion: {
    id: "discussion",
    title: "Discussion",
    category: "scientific_core",
    kind: "section",
    required: false,
    removable: true,
    recommended: true,
    description:
      "Interprétation et mise en perspective des résultats.",
  },

  conclusion: {
    id: "conclusion",
    title: "Conclusion générale",
    category: "scientific_core",
    kind: "section",
    required: false,
    removable: true,
    recommended: true,
    description:
      "Synthèse finale, limites, recommandations et perspectives.",
  },

  /* ---------------- METHODOLOGY ---------------- */

  "research-design": {
    id: "research-design",
    title: "Design de recherche",
    category: "methodology",
    kind: "subsection",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Type et organisation générale de la recherche.",
  },

  "study-population": {
    id: "study-population",
    title: "Population et échantillon",
    category: "methodology",
    kind: "subsection",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Population cible, critères de sélection et échantillonnage.",
  },

  "data-collection": {
    id: "data-collection",
    title: "Collecte des données",
    category: "methodology",
    kind: "subsection",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Méthodes, instruments et procédures de collecte des données.",
  },

  "data-analysis": {
    id: "data-analysis",
    title: "Analyse des données",
    category: "methodology",
    kind: "subsection",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Méthodes et techniques utilisées pour analyser les données.",
  },

  "quantitative-methodology": {
    id: "quantitative-methodology",
    title: "Méthodologie quantitative",
    category: "methodology",
    kind: "subsection",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Éléments méthodologiques spécifiques à une approche quantitative.",
  },

  "qualitative-methodology": {
    id: "qualitative-methodology",
    title: "Méthodologie qualitative",
    category: "methodology",
    kind: "subsection",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Éléments méthodologiques spécifiques à une approche qualitative.",
  },

  "mixed-methodology": {
    id: "mixed-methodology",
    title: "Méthodologie mixte",
    category: "methodology",
    kind: "subsection",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Articulation des approches quantitatives et qualitatives.",
  },

  "experimental-methodology": {
    id: "experimental-methodology",
    title: "Méthodologie expérimentale",
    category: "methodology",
    kind: "subsection",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Protocole et procédures propres à une étude expérimentale.",
  },

  "case-study-methodology": {
    id: "case-study-methodology",
    title: "Méthodologie d'étude de cas",
    category: "methodology",
    kind: "subsection",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Méthodologie spécifique à une étude de cas.",
  },

  ethics: {
    id: "ethics",
    title: "Considérations éthiques",
    category: "methodology",
    kind: "subsection",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Aspects éthiques, consentement, confidentialité et protection des données.",
  },

  /* ---------------- BACK MATTER ---------------- */

  references: {
    id: "references",
    title: "Références bibliographiques",
    category: "back_matter",
    kind: "section",
    required: false,
    removable: true,
    recommended: true,
    description:
      "Sources bibliographiques utilisées dans le document.",
  },

  appendices: {
    id: "appendices",
    title: "Annexes",
    category: "back_matter",
    kind: "section",
    required: false,
    removable: true,
    recommended: false,
    description:
      "Documents, tableaux, instruments ou informations complémentaires.",
  },
};

/* ============================================================
 * 2. ALIASES
 * ============================================================ */

const REPORT_TYPE_ALIASES = {
  memoire: "memoire",
  mémoire: "memoire",
  "master thesis": "memoire",

  thesis: "these",
  thèse: "these",
  these: "these",
  phd: "these",
  doctorat: "these",

  article: "article_scientifique",
  "article scientifique": "article_scientifique",
  "scientific article": "article_scientifique",

  "rapport de stage": "rapport_stage",
  "internship report": "rapport_stage",
  stage: "rapport_stage",

  "rapport technique": "rapport_technique",
  "technical report": "rapport_technique",

  autre: "autre",
  other: "autre",
};

const ACADEMIC_LEVEL_ALIASES = {
  licence: "licence",
  bachelor: "licence",
  undergraduate: "licence",

  master: "master",
  graduate: "master",

  doctorat: "doctorat",
  doctorate: "doctorat",
  phd: "doctorat",
};

const STUDY_TYPE_ALIASES = {
  empirical: "empirical",
  empirique: "empirical",

  quantitative: "quantitative",
  quantitatif: "quantitative",

  qualitative: "qualitative",
  qualitatif: "qualitative",

  mixed: "mixed",
  mixte: "mixed",

  experimental: "experimental",
  expérimental: "experimental",
  expérimentale: "experimental",

  "case study": "case_study",
  "étude de cas": "case_study",
  "etude de cas": "case_study",

  theoretical: "theoretical",
  théorique: "theoretical",

  review: "review",
  revue: "review",
};

/* ============================================================
 * 3. STRUCTURES DE BASE
 * ============================================================ */

const BASE_STRUCTURES = {
  memoire: [
    "cover-page",
    "abstract",
    "table-of-contents",
    "introduction",
    "methodology",
    "results",
    "discussion",
    "conclusion",
    "references",
  ],

  these: [
    "cover-page",
    "abstract",
    "table-of-contents",
    "introduction",
    "methodology",
    "results",
    "discussion",
    "conclusion",
    "references",
  ],

  article_scientifique: [
    "cover-page",
    "abstract",
    "introduction",
    "methodology",
    "results",
    "discussion",
    "conclusion",
    "references",
  ],

  rapport_stage: [
    "cover-page",
    "abstract",
    "table-of-contents",
    "introduction",
    "objectives",
    "methodology",
    "results",
    "conclusion",
    "references",
  ],

  rapport_technique: [
    "cover-page",
    "abstract",
    "table-of-contents",
    "introduction",
    "methodology",
    "results",
    "discussion",
    "conclusion",
    "references",
  ],

  autre: [
    "cover-page",
    "abstract",
    "table-of-contents",
    "introduction",
    "methodology",
    "results",
    "discussion",
    "conclusion",
    "references",
  ],
};

/* ============================================================
 * 4. ORDRE CANONIQUE
 * ============================================================ */

const ROOT_MODULE_ORDER = {
  "cover-page": 10,
  dedication: 20,
  acknowledgements: 30,
  abstract: 40,
  "abstract-second-language": 50,
  "table-of-contents": 60,
  "list-of-figures": 70,
  "list-of-tables": 80,
  abbreviations: 90,
  glossary: 100,

  introduction: 200,
  "problem-statement": 210,
  "research-questions": 220,
  objectives: 230,
  hypotheses: 240,
  "literature-review": 250,
  "theoretical-framework": 260,
  "conceptual-framework": 270,
  methodology: 280,
  results: 290,
  discussion: 300,
  conclusion: 310,

  references: 400,
  appendices: 410,
};

const METHODOLOGY_MODULE_ORDER = {
  "research-design": 10,
  "study-population": 20,
  "data-collection": 30,
  "data-analysis": 40,
  "quantitative-methodology": 50,
  "qualitative-methodology": 60,
  "mixed-methodology": 70,
  "experimental-methodology": 80,
  "case-study-methodology": 90,
  ethics: 100,
};

/* ============================================================
 * 5. UTILITAIRES
 * ============================================================ */

export function getModuleById(moduleId) {
  return DOCUMENT_MODULES[moduleId] || null;
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeAlias(value, aliases, fallback = "") {
  const normalized = normalizeValue(value)
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (!normalized) {
    return fallback;
  }

  return aliases[normalized] || normalized;
}

function cloneChildren(children = []) {
  if (!Array.isArray(children)) {
    return [];
  }

  return children.map((child) => ({
    ...child,
    children: cloneChildren(child?.children),
  }));
}

function createInstanceId(moduleId, source = "engine") {
  const safeModuleId = normalizeValue(moduleId);

  const safeSource =
    normalizeValue(source)
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9_-]/g, "") || "engine";

  return `${safeModuleId}__${safeSource}`;
}

function instantiate(
  moduleId,
  source = "engine",
  children = []
) {
  const module = getModuleById(moduleId);

  if (!module) {
    return null;
  }

  return {
    ...module,
    instanceId: createInstanceId(module.id, source),
    source,
    order: 0,
    children: cloneChildren(children),
  };
}

/* ============================================================
 * 6. UTILITAIRES D'ARBRE
 * ============================================================ */

function structureContainsModule(structure, moduleId) {
  if (!Array.isArray(structure)) {
    return false;
  }

  return structure.some((item) => {
    if (!item) {
      return false;
    }

    if (item.id === moduleId) {
      return true;
    }

    return structureContainsModule(
      item.children,
      moduleId
    );
  });
}

export function hasModule(structure, moduleId) {
  return structureContainsModule(structure, moduleId);
}

function findModuleNode(structure, moduleId) {
  if (!Array.isArray(structure)) {
    return null;
  }

  for (const item of structure) {
    if (!item) {
      continue;
    }

    if (item.id === moduleId) {
      return item;
    }

    const nested = findModuleNode(
      item.children,
      moduleId
    );

    if (nested) {
      return nested;
    }
  }

  return null;
}

function addModule(
  structure,
  moduleId,
  source = "engine"
) {
  if (!Array.isArray(structure)) {
    return null;
  }

  if (structureContainsModule(structure, moduleId)) {
    return null;
  }

  const item = instantiate(
    moduleId,
    source
  );

  if (!item) {
    return null;
  }

  structure.push(item);

  return item;
}

function addModules(
  structure,
  moduleIds = [],
  source = "engine"
) {
  if (!Array.isArray(moduleIds)) {
    return structure;
  }

  moduleIds.forEach((moduleId) => {
    addModule(
      structure,
      moduleId,
      source
    );
  });

  return structure;
}

function addMethodologyChild(
  structure,
  moduleId,
  source = "study-rule"
) {
  const module = getModuleById(moduleId);

  if (!module) {
    return null;
  }

  if (
    module.category !== "methodology" ||
    module.kind !== "subsection"
  ) {
    return null;
  }

  const methodology = findModuleNode(
    structure,
    "methodology"
  );

  if (!methodology) {
    return null;
  }

  if (!Array.isArray(methodology.children)) {
    methodology.children = [];
  }

  if (
    structureContainsModule(
      methodology.children,
      moduleId
    )
  ) {
    return null;
  }

  const child = instantiate(
    moduleId,
    source
  );

  if (!child) {
    return null;
  }

  methodology.children.push(child);

  return child;
}

function removeModuleRecursively(
  structure,
  moduleId
) {
  if (!Array.isArray(structure)) {
    return [];
  }

  return structure
    .filter(
      (item) =>
        item &&
        item.id !== moduleId
    )
    .map((item) => ({
      ...item,
      children:
        removeModuleRecursively(
          item.children,
          moduleId
        ),
    }));
}

/* ============================================================
 * 7. NORMALISATION DU PROFIL
 * ============================================================ */

export function normalizeProfile(
  profile = {}
) {
  const reportType = normalizeAlias(
    profile.reportType ??
      profile.report_type,
    REPORT_TYPE_ALIASES,
    "autre"
  );

  const academicLevel = normalizeAlias(
    profile.academicLevel ??
      profile.academic_level,
    ACADEMIC_LEVEL_ALIASES,
    "master"
  );

  const studyType = normalizeAlias(
    profile.studyType ??
      profile.study_type,
    STUDY_TYPE_ALIASES,
    ""
  );

  return {
    reportType,

    academicLevel,

    scientificField: normalizeValue(
      profile.scientificField ??
        profile.scientific_field
    ),

    language:
      normalizeValue(profile.language) ||
      "fr",

    studyType,

    citationStyle:
      normalizeValue(
        profile.citationStyle ??
          profile.citation_style
      ) || "APA",

    country: normalizeValue(
      profile.country
    ),

    institution: normalizeValue(
      profile.institution
    ),

    faculty: normalizeValue(
      profile.faculty
    ),

    department: normalizeValue(
      profile.department
    ),

    program: normalizeValue(
      profile.program
    ),

    specialty: normalizeValue(
      profile.specialty
    ),

    academicYear: normalizeValue(
      profile.academicYear ??
        profile.academic_year
    ),

    supervisor: normalizeValue(
      profile.supervisor
    ),

    referenceLanguage: normalizeValue(
      profile.referenceLanguage ??
        profile.reference_language
    ),

    context: normalizeValue(
      profile.context
    ),

    institutionalRequirements:
      normalizeValue(
        profile.institutionalRequirements ??
          profile.institutional_requirements
      ),

    otherRequirements:
      normalizeValue(
        profile.otherRequirements ??
          profile.other_requirements
      ),
  };
}

/* ============================================================
 * 8. DETECTION DU CONTEXTE
 * ============================================================ */

function isLongAcademicDocument(profile) {
  return ["memoire", "these"].includes(
    profile.reportType
  );
}

function isEmpiricalStudy(profile) {
  return [
    "empirical",
    "quantitative",
    "qualitative",
    "mixed",
    "experimental",
    "case_study",
  ].includes(profile.studyType);
}

function isAdvancedAcademicLevel(profile) {
  return ["master", "doctorat"].includes(
    profile.academicLevel
  );
}

function detectFieldFamily(field = "") {
  const value = normalizeValue(field)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    /informatique|computer|software|cyber|data science|intelligence artificielle|\bia\b/.test(
      value
    )
  ) {
    return "computing";
  }

  if (
    /ingenierie|engineering|electronique|electrique|mecanique|civil|genie/.test(
      value
    )
  ) {
    return "engineering";
  }

  if (
    /medecine|medical|sante|health|pharmacie|nursing|biomedical/.test(
      value
    )
  ) {
    return "health";
  }

  if (
    /biologie|chimie|physique|geologie|sciences naturelles|natural science/.test(
      value
    )
  ) {
    return "experimental_science";
  }

  if (
    /droit|juridique|law|legal|criminologie|jurisprudence/.test(
      value
    )
  ) {
    return "law";
  }

  if (
    /economie|economics|gestion|management|finance|marketing|business|commerce/.test(
      value
    )
  ) {
    return "business_economics";
  }

  if (
    /sociologie|sociology|psychologie|psychology|education|pedagogie|communication|science politique|political science|anthropologie/.test(
      value
    )
  ) {
    return "social_sciences";
  }

  if (
    /agriculture|agronomie|environnement|environment|foresterie|climat/.test(
      value
    )
  ) {
    return "agriculture_environment";
  }

  if (
    /lettres|litterature|linguistique|histoire|geographie|philosophie|arts/.test(
      value
    )
  ) {
    return "humanities";
  }

  return "general";
}

export function getScientificFieldFamily(
  field = ""
) {
  return detectFieldFamily(field);
}

/* ============================================================
 * 9. RÈGLES DU TYPE DE DOCUMENT
 * ============================================================ */

function applyDocumentTypeRules(
  structure,
  profile
) {
  const { reportType } = profile;

  if (
    ["memoire", "these"].includes(
      reportType
    )
  ) {
    addModules(
      structure,
      [
        "dedication",
        "acknowledgements",
        "problem-statement",
        "objectives",
        "research-questions",
        "literature-review",
      ],
      "document-type-rule"
    );
  }

  if (reportType === "these") {
    addModules(
      structure,
      [
        "theoretical-framework",
        "abbreviations",
      ],
      "document-type-rule"
    );
  }

  if (
    reportType ===
    "article_scientifique"
  ) {
    addModules(
      structure,
      ["literature-review"],
      "document-type-rule"
    );
  }

  if (reportType === "rapport_stage") {
    addModules(
      structure,
      ["acknowledgements"],
      "document-type-rule"
    );
  }

  if (
    reportType ===
    "rapport_technique"
  ) {
    addModules(
      structure,
      [
        "problem-statement",
        "objectives",
      ],
      "document-type-rule"
    );
  }

  return structure;
}

/* ============================================================
 * 10. RÈGLES DU TYPE D'ÉTUDE
 * ============================================================ */

function applyStudyTypeRules(
  structure,
  profile
) {
  if (isEmpiricalStudy(profile)) {
    addModule(
      structure,
      "research-questions",
      "study-rule"
    );

    addMethodologyChild(
      structure,
      "research-design",
      "study-rule"
    );

    addMethodologyChild(
      structure,
      "study-population",
      "study-rule"
    );

    addMethodologyChild(
      structure,
      "data-collection",
      "study-rule"
    );

    addMethodologyChild(
      structure,
      "data-analysis",
      "study-rule"
    );

    addMethodologyChild(
      structure,
      "ethics",
      "study-rule"
    );
  }

  switch (profile.studyType) {
    case "quantitative":
      addModules(
        structure,
        [
          "hypotheses",
          "conceptual-framework",
        ],
        "study-rule"
      );

      addMethodologyChild(
        structure,
        "quantitative-methodology",
        "study-rule"
      );
      break;

    case "qualitative":
      addModule(
        structure,
        "conceptual-framework",
        "study-rule"
      );

      addMethodologyChild(
        structure,
        "qualitative-methodology",
        "study-rule"
      );
      break;

    case "mixed":
      addModules(
        structure,
        [
          "hypotheses",
          "conceptual-framework",
        ],
        "study-rule"
      );

      addMethodologyChild(
        structure,
        "mixed-methodology",
        "study-rule"
      );
      break;

    case "experimental":
      addModule(
        structure,
        "hypotheses",
        "study-rule"
      );

      addMethodologyChild(
        structure,
        "experimental-methodology",
        "study-rule"
      );
      break;

    case "case_study":
      addModule(
        structure,
        "conceptual-framework",
        "study-rule"
      );

      addMethodologyChild(
        structure,
        "case-study-methodology",
        "study-rule"
      );
      break;

    default:
      break;
  }

  return structure;
}

/* ============================================================
 * 11. RÈGLES DU NIVEAU ACADÉMIQUE
 * ============================================================ */

function applyAcademicLevelRules(
  structure,
  profile
) {
  if (
    isLongAcademicDocument(profile) &&
    isAdvancedAcademicLevel(profile)
  ) {
    addModule(
      structure,
      "theoretical-framework",
      "academic-level-rule"
    );
  }

  if (
    profile.reportType === "these" ||
    profile.academicLevel === "doctorat"
  ) {
    addModule(
      structure,
      "abbreviations",
      "academic-level-rule"
    );
  }

  return structure;
}

/* ============================================================
 * 12. RÈGLES DU DOMAINE SCIENTIFIQUE
 * ============================================================ */

function applyDomainRules(
  structure,
  profile
) {
  const fieldFamily =
    detectFieldFamily(
      profile.scientificField
    );

  switch (fieldFamily) {
    case "social_sciences":
    case "business_economics":
      if (
        isLongAcademicDocument(profile) &&
        isAdvancedAcademicLevel(profile)
      ) {
        addModules(
          structure,
          [
            "theoretical-framework",
            "conceptual-framework",
          ],
          "domain-rule"
        );
      }
      break;

    case "law":
      if (
        isLongAcademicDocument(profile)
      ) {
        addModule(
          structure,
          "theoretical-framework",
          "domain-rule"
        );
      }
      break;

    case "experimental_science":
    case "health":
    case "agriculture_environment":
      if (isEmpiricalStudy(profile)) {
        addMethodologyChild(
          structure,
          "ethics",
          "domain-rule"
        );
      }
      break;

    case "computing":
    case "engineering":
      if (isEmpiricalStudy(profile)) {
        addMethodologyChild(
          structure,
          "research-design",
          "domain-rule"
        );
      }
      break;

    default:
      break;
  }

  return structure;
}

/* ============================================================
 * 13. COMPLEXITÉ / LONGUEUR
 * ============================================================ */

function applyComplexityRules(
  structure,
  profile
) {
  if (
    isLongAcademicDocument(profile) ||
    profile.reportType === "rapport_stage" ||
    profile.reportType === "rapport_technique"
  ) {
    addModule(
      structure,
      "appendices",
      "complexity-rule"
    );
  }

  return structure;
}/* ============================================================
 * 14. EXIGENCES EXPLICITES DE L'UTILISATEUR
 * ============================================================ */

/**
 * Normalise un texte pour permettre une recherche robuste :
 * - minuscules
 * - suppression des accents
 * - espaces normalisés
 */
function normalizeRequirementText(value = "") {
  return normalizeValue(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Échappe correctement une chaîne destinée à une RegExp.
 *
 * IMPORTANT :
 * L'ancienne version contenait une expression régulière
 * mal échappée. Cette version est valide en JavaScript.
 */
function escapeRegex(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/**
 * Alias permettant à l'utilisateur de demander explicitement
 * l'ajout d'un module.
 */
const MODULE_REQUIREMENT_ALIASES = {
  "cover-page": [
    "page de garde",
    "page de couverture",
    "cover page",
    "cover",
  ],

  dedication: [
    "dedicace",
    "dédicace",
  ],

  acknowledgements: [
    "remerciements",
    "acknowledgements",
    "acknowledgments",
  ],

  abstract: [
    "resume",
    "résumé",
    "abstract",
    "summary",
  ],

  "abstract-second-language": [
    "resume en anglais",
    "résumé en anglais",
    "resume anglais",
    "résumé anglais",
    "abstract en anglais",
    "second language abstract",
  ],

  "table-of-contents": [
    "table des matieres",
    "table des matières",
    "sommaire",
    "table of contents",
    "toc",
  ],

  "list-of-figures": [
    "liste des figures",
    "list of figures",
  ],

  "list-of-tables": [
    "liste des tableaux",
    "list of tables",
  ],

  abbreviations: [
    "abreviations",
    "abréviations",
    "liste des abreviations",
    "liste des abréviations",
    "abbreviations",
  ],

  glossary: [
    "glossaire",
    "glossary",
  ],

  introduction: [
    "introduction",
    "introduction generale",
    "introduction générale",
  ],

  "problem-statement": [
    "problematique",
    "problématique",
    "problem statement",
    "probleme de recherche",
    "problème de recherche",
  ],

  "research-questions": [
    "questions de recherche",
    "question de recherche",
    "research questions",
  ],

  objectives: [
    "objectifs",
    "objectif general",
    "objectif général",
    "objectifs specifiques",
    "objectifs spécifiques",
    "objectifs de recherche",
  ],

  hypotheses: [
    "hypotheses",
    "hypothèses",
    "hypothese",
    "hypothèse",
    "research hypotheses",
  ],

  "literature-review": [
    "revue de litterature",
    "revue de littérature",
    "literature review",
    "etat de l'art",
    "état de l'art",
  ],

  "theoretical-framework": [
    "cadre theorique",
    "cadre théorique",
    "theoretical framework",
  ],

  "conceptual-framework": [
    "cadre conceptuel",
    "conceptual framework",
  ],

  methodology: [
    "methodologie",
    "méthodologie",
    "methodology",
  ],

  "research-design": [
    "design de recherche",
    "plan de recherche",
    "research design",
  ],

  "study-population": [
    "population et echantillon",
    "population et échantillon",
    "population et echantillonnage",
    "population et échantillonnage",
    "study population",
    "sample",
    "echantillon",
    "échantillon",
  ],

  "data-collection": [
    "collecte des donnees",
    "collecte des données",
    "collecte de donnees",
    "collecte de données",
    "data collection",
  ],

  "data-analysis": [
    "analyse des donnees",
    "analyse des données",
    "data analysis",
  ],

  "quantitative-methodology": [
    "methodologie quantitative",
    "méthodologie quantitative",
    "quantitative methodology",
  ],

  "qualitative-methodology": [
    "methodologie qualitative",
    "méthodologie qualitative",
    "qualitative methodology",
  ],

  "mixed-methodology": [
    "methodologie mixte",
    "méthodologie mixte",
    "mixed methodology",
    "mixed methods",
  ],

  "experimental-methodology": [
    "methodologie experimentale",
    "méthodologie expérimentale",
    "experimental methodology",
  ],

  "case-study-methodology": [
    "methodologie d'etude de cas",
    "méthodologie d'étude de cas",
    "case study methodology",
    "etude de cas",
    "étude de cas",
  ],

  ethics: [
    "ethique",
    "éthique",
    "considerations ethiques",
    "considérations éthiques",
    "ethical considerations",
  ],

  results: [
    "resultats",
    "résultats",
    "results",
  ],

  discussion: [
    "discussion",
    "discussion des resultats",
    "discussion des résultats",
  ],

  conclusion: [
    "conclusion",
    "conclusion generale",
    "conclusion générale",
    "general conclusion",
  ],

  references: [
    "references",
    "références",
    "references bibliographiques",
    "références bibliographiques",
    "bibliographie",
    "bibliography",
    "references",
  ],

  appendices: [
    "annexes",
    "annexe",
    "appendices",
    "appendix",
  ],
};

/**
 * Retourne tous les textes dans lesquels rechercher
 * les exigences de l'utilisateur.
 */
function getRequirementTexts(profile) {
  return [
    profile.institutionalRequirements,
    profile.otherRequirements,
    profile.context,
  ]
    .map(normalizeRequirementText)
    .filter(Boolean);
}

/**
 * Vérifie si l'utilisateur demande explicitement un module.
 */
function hasExplicitRequirement(
  texts,
  moduleId
) {
  const aliases =
    MODULE_REQUIREMENT_ALIASES[moduleId] || [];

  if (!aliases.length) {
    return false;
  }

  return texts.some((text) =>
    aliases.some((alias) =>
      text.includes(
        normalizeRequirementText(alias)
      )
    )
  );
}

/**
 * Vérifie si l'utilisateur demande explicitement
 * de ne PAS ajouter un module.
 *
 * Exemples reconnus :
 * - sans résumé
 * - pas de résumé
 * - aucun résumé
 * - without abstract
 * - no abstract
 * - ne pas ajouter de résumé
 * - ne pas inclure le résumé
 * - do not include abstract
 * - not include abstract
 */
function hasNegativeRequirement(
  texts,
  moduleId
) {
  const aliases =
    MODULE_REQUIREMENT_ALIASES[moduleId] || [];

  if (!aliases.length) {
    return false;
  }

  return texts.some((text) =>
    aliases.some((alias) => {
      const escaped = escapeRegex(
        normalizeRequirementText(alias)
      );

      const negativePattern =
        new RegExp(
          `(?:sans|pas\\s+de|aucun(?:e)?|without|no|ne\\s+pas\\s+(?:ajouter|inclure|mettre)|do\\s+not\\s+(?:include|add)|not\\s+(?:include|add))\\s+(?:le|la|les|un|une|des|the|a|an)?\\s*${escaped}(?:\\b|$)`,
          "iu"
        );

      return negativePattern.test(text);
    })
  );
}

/**
 * Applique les demandes explicites de l'utilisateur.
 *
 * Priorité :
 * exclusion explicite > ajout explicite > règle automatique.
 */
function applyExplicitRequirements(
  structure,
  profile
) {
  const texts =
    getRequirementTexts(profile);

  if (!texts.length) {
    return structure;
  }

  Object.keys(DOCUMENT_MODULES).forEach(
    (moduleId) => {
      const excluded =
        hasNegativeRequirement(
          texts,
          moduleId
        );

      const requested =
        hasExplicitRequirement(
          texts,
          moduleId
        );

      /*
       * Une exclusion explicite est prioritaire.
       */
      if (excluded) {
        structure =
          removeModuleRecursively(
            structure,
            moduleId
          );

        return;
      }

      /*
       * Ajout explicite.
       */
      if (requested) {
        const module =
          getModuleById(moduleId);

        if (
          module?.category ===
          "methodology"
        ) {
          addMethodologyChild(
            structure,
            moduleId,
            "explicit-requirement"
          );
        } else {
          addModule(
            structure,
            moduleId,
            "explicit-requirement"
          );
        }
      }
    }
  );

  return structure;
}

/* ============================================================
 * 15. NETTOYAGE
 * ============================================================ */

/**
 * Nettoyage récursif :
 * - supprime les éléments invalides
 * - vérifie l'existence du module
 * - garantit un tableau children
 * - reconstruit les métadonnées essentielles
 */
function cleanTree(
  structure,
  options = {}
) {
  if (!Array.isArray(structure)) {
    return [];
  }

  return structure
    .filter(
      (node) =>
        node &&
        typeof node === "object" &&
        typeof node.id === "string" &&
        getModuleById(node.id)
    )
    .map((node) => {
      const module =
        getModuleById(node.id);

      return {
        ...module,
        ...node,
        children: cleanTree(
          node.children,
          options
        ),
        instanceId:
          node.instanceId ||
          createInstanceId(
            node.id,
            node.source || "engine"
          ),
        source:
          node.source || "engine",
        order:
          Number.isInteger(node.order)
            ? node.order
            : 0,
      };
    });
}

/**
 * Garantit qu'un module ne peut apparaître qu'une seule fois
 * dans l'ensemble de l'arbre.
 *
 * Cela évite notamment :
 * - introduction répétée
 * - méthodologie répétée
 * - même sous-section méthodologique à plusieurs endroits
 */
function removeDuplicateModules(
  structure,
  seen = new Set()
) {
  if (!Array.isArray(structure)) {
    return [];
  }

  const result = [];

  for (const node of structure) {
    if (!node || !node.id) {
      continue;
    }

    if (seen.has(node.id)) {
      continue;
    }

    seen.add(node.id);

    result.push({
      ...node,
      children:
        removeDuplicateModules(
          node.children,
          seen
        ),
    });
  }

  return result;
}

/* ============================================================
 * 16. INVARIANTS
 * ============================================================ */

/**
 * Les modules obligatoires doivent toujours exister.
 */
function ensureRequiredModules(
  structure
) {
  const result = Array.isArray(
    structure
  )
    ? [...structure]
    : [];

  Object.values(
    DOCUMENT_MODULES
  ).forEach((module) => {
    if (!module.required) {
      return;
    }

    if (
      !structureContainsModule(
        result,
        module.id
      )
    ) {
      addModule(
        result,
        module.id,
        "required-module"
      );
    }
  });

  return result;
}

/**
 * Vérifie si un module est une sous-section
 * propre à la méthodologie.
 */
function isMethodologyChild(
  moduleId
) {
  const module =
    getModuleById(moduleId);

  return (
    module?.category ===
      "methodology" &&
    module?.kind === "subsection"
  );
}

/**
 * Normalise le placement de la méthodologie.
 *
 * Règles :
 * - methodology doit être au niveau racine ;
 * - les sous-sections méthodologiques doivent être
 *   uniquement dans methodology.children ;
 * - une sous-section trouvée ailleurs est récupérée ;
 * - si des sous-sections existent sans méthodologie,
 *   la méthodologie est créée automatiquement.
 */
function enforceMethodologyPlacement(
  structure
) {
  if (!Array.isArray(structure)) {
    return [];
  }

  let methodologyNode = null;
  const methodologyChildren = [];

  function extractFromNodes(
    nodes,
    insideMethodology = false
  ) {
    if (!Array.isArray(nodes)) {
      return [];
    }

    const cleaned = [];

    for (const node of nodes) {
      if (!node || !node.id) {
        continue;
      }

      /*
       * Le conteneur méthodologie doit rester
       * au niveau racine.
       */
      if (
        node.id === "methodology" &&
        !insideMethodology
      ) {
        if (!methodologyNode) {
          methodologyNode = {
            ...node,
            children: [],
          };
        }

        const children =
          Array.isArray(node.children)
            ? node.children
            : [];

        for (const child of children) {
          if (
            child &&
            isMethodologyChild(
              child.id
            )
          ) {
            methodologyChildren.push(
              child
            );
          }
        }

        continue;
      }

      /*
       * Une sous-section méthodologique trouvée
       * hors du conteneur doit être déplacée.
       */
      if (
        isMethodologyChild(node.id) &&
        !insideMethodology
      ) {
        methodologyChildren.push(
          node
        );
        continue;
      }

      /*
       * Si nous sommes dans le conteneur
       * méthodologique, seuls les vrais enfants
       * méthodologiques sont conservés.
       */
      if (
        insideMethodology &&
        !isMethodologyChild(node.id)
      ) {
        continue;
      }

      const children =
        extractFromNodes(
          node.children,
          insideMethodology ||
            node.id === "methodology"
        );

      cleaned.push({
        ...node,
        children,
      });
    }

    return cleaned;
  }

  let result =
    extractFromNodes(
      structure,
      false
    );

  /*
   * Si des enfants méthodologiques ont été trouvés
   * mais que le conteneur n'existe pas, on le crée.
   */
  if (
    methodologyChildren.length > 0 &&
    !methodologyNode
  ) {
    methodologyNode = instantiate(
      "methodology",
      "methodology-container"
    );
  }

  if (methodologyNode) {
    const existingChildren =
      Array.isArray(
        methodologyNode.children
      )
        ? methodologyNode.children
        : [];

    const merged = [
      ...existingChildren,
      ...methodologyChildren,
    ];

    /*
     * Déduplication locale des enfants.
     */
    const childSeen = new Set();

    methodologyNode.children =
      merged.filter((child) => {
        if (
          !child ||
          !isMethodologyChild(
            child.id
          )
        ) {
          return false;
        }

        if (
          childSeen.has(child.id)
        ) {
          return false;
        }

        childSeen.add(child.id);
        return true;
      });

    /*
     * La méthodologie est replacée à la racine.
     */
    result = result.filter(
      (node) =>
        node.id !== "methodology"
    );

    result.push(
      methodologyNode
    );
  }

  return result;
}

/**
 * Garantit la forme de l'arbre :
 *
 * racine
 * ├── sections normales
 * └── methodology
 *     ├── research-design
 *     ├── data-collection
 *     └── ...
 */
function enforceTreeShape(
  structure
) {
  if (!Array.isArray(structure)) {
    return [];
  }

  return structure.map((node) => {
    if (!node) {
      return null;
    }

    if (node.id === "methodology") {
      return {
        ...node,
        kind: "container",
        children: Array.isArray(
          node.children
        )
          ? node.children
              .filter(
                (child) =>
                  child &&
                  isMethodologyChild(
                    child.id
                  )
              )
              .map((child) => ({
                ...child,
                children: [],
              }))
          : [],
      };
    }

    /*
     * Les autres modules ne doivent pas posséder
     * de children.
     */
    return {
      ...node,
      children: [],
    };
  }).filter(Boolean);
}

/* ============================================================
 * 17. TRI CANONIQUE
 * ============================================================ */

function getModuleOrder(
  moduleId,
  isMethodologyChild = false
) {
  const map =
    isMethodologyChild
      ? METHODOLOGY_MODULE_ORDER
      : ROOT_MODULE_ORDER;

  return (
    map[moduleId] ??
    Number.MAX_SAFE_INTEGER
  );
}

function sortStructure(
  structure
) {
  if (!Array.isArray(structure)) {
    return [];
  }

  const sorted = [...structure].sort(
    (a, b) => {
      const orderA =
        getModuleOrder(a.id);

      const orderB =
        getModuleOrder(b.id);

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return String(a.id).localeCompare(
        String(b.id)
      );
    }
  );

  return sorted.map((node) => {
    if (
      node.id === "methodology"
    ) {
      return {
        ...node,
        children: [
          ...(node.children || []),
        ].sort((a, b) => {
          const orderA =
            getModuleOrder(
              a.id,
              true
            );

          const orderB =
            getModuleOrder(
              b.id,
              true
            );

          if (orderA !== orderB) {
            return orderA - orderB;
          }

          return String(
            a.id
          ).localeCompare(
            String(b.id)
          );
        }),
      };
    }

    return {
      ...node,
      children: [],
    };
  });
}

/* ============================================================
 * 18. ORDRE DES ÉLÉMENTS
 * ============================================================ */

/**
 * Attribue un ordre humainement exploitable.
 *
 * Exemple :
 *
 * 1 Page de garde
 * 2 Résumé
 * 3 Table des matières
 * 4 Introduction
 * 5 Méthodologie
 *    1 Design de recherche
 *    2 Collecte des données
 * 6 Résultats
 */
function applyOrder(
  structure
) {
  if (!Array.isArray(structure)) {
    return [];
  }

  return structure.map(
    (node, index) => {
      if (
        node.id === "methodology"
      ) {
        return {
          ...node,
          order: index + 1,
          children: (
            node.children || []
          ).map(
            (child, childIndex) => ({
              ...child,
              order:
                childIndex + 1,
              children: [],
            })
          ),
        };
      }

      return {
        ...node,
        order: index + 1,
        children: [],
      };
    }
  );
}/* ============================================================
 * 19. CONSTRUCTION DE LA STRUCTURE DE BASE
 * ============================================================ */

function buildBaseStructure(profile) {
  const base =
    BASE_STRUCTURES[
      profile.reportType
    ] || BASE_STRUCTURES.autre;

  return base
    .map((moduleId) =>
      instantiate(
        moduleId,
        "base-structure"
      )
    )
    .filter(Boolean);
}

/* ============================================================
 * 20. CONSTRUCTION DE LA STRUCTURE RECOMMANDÉE
 * ============================================================ */

/**
 * Fonction principale du moteur.
 *
 * Elle ne génère aucun texte scientifique.
 * Elle construit uniquement la structure logique
 * du document à partir des choix de l'utilisateur.
 */
export function buildRecommendedStructure(
  profile = {}
) {
  /*
   * 1. Normalisation
   */
  const normalizedProfile =
    normalizeProfile(profile);

  /*
   * 2. Structure de base
   */
  let structure =
    buildBaseStructure(
      normalizedProfile
    );

  /*
   * 3. Règles du type de document
   */
  structure =
    applyDocumentTypeRules(
      structure,
      normalizedProfile
    );

  /*
   * 4. Règles du type d'étude
   */
  structure =
    applyStudyTypeRules(
      structure,
      normalizedProfile
    );

  /*
   * 5. Règles du niveau académique
   */
  structure =
    applyAcademicLevelRules(
      structure,
      normalizedProfile
    );

  /*
   * 6. Règles du domaine scientifique
   */
  structure =
    applyDomainRules(
      structure,
      normalizedProfile
    );

  /*
   * 7. Règles de complexité
   */
  structure =
    applyComplexityRules(
      structure,
      normalizedProfile
    );

  /*
   * 8. Exigences explicites de l'utilisateur
   *
   * Les exclusions explicites sont prioritaires.
   */
  structure =
    applyExplicitRequirements(
      structure,
      normalizedProfile
    );

  /*
   * 9. Premier nettoyage
   */
  structure =
    cleanTree(structure);

  /*
   * 10. Déduplication
   */
  structure =
    removeDuplicateModules(
      structure
    );

  /*
   * 11. Garantie des modules obligatoires
   */
  structure =
    ensureRequiredModules(
      structure
    );

  /*
   * 12. Placement de la méthodologie
   *
   * Cette étape doit avoir lieu AVANT enforceTreeShape()
   * afin de ne pas perdre les sous-sections méthodologiques.
   */
  structure =
    enforceMethodologyPlacement(
      structure
    );

  /*
   * 13. Garantie de la forme de l'arbre
   */
  structure =
    enforceTreeShape(
      structure
    );

  /*
   * 14. Nettoyage final
   */
  structure =
    cleanTree(structure);

  /*
   * 15. Déduplication finale
   */
  structure =
    removeDuplicateModules(
      structure
    );

  /*
   * 16. Garantie finale du module obligatoire
   */
  structure =
    ensureRequiredModules(
      structure
    );

  /*
   * 17. Placement final de la méthodologie
   */
  structure =
    enforceMethodologyPlacement(
      structure
    );

  /*
   * 18. Forme finale
   */
  structure =
    enforceTreeShape(
      structure
    );

  /*
   * 19. Tri canonique
   */
  structure =
    sortStructure(
      structure
    );

  /*
   * 20. Numérotation logique
   */
  structure =
    applyOrder(
      structure
    );

  return structure;
}

/* ============================================================
 * 21. COMPTAGE DE LA STRUCTURE
 * ============================================================ */

/**
 * Compte tous les éléments de la structure,
 * y compris les sous-sections méthodologiques.
 */
export function countStructureItems(
  structure
) {
  if (!Array.isArray(structure)) {
    return 0;
  }

  return structure.reduce(
    (total, node) => {
      if (!node) {
        return total;
      }

      return (
        total +
        1 +
        countStructureItems(
          node.children
        )
      );
    },
    0
  );
}

/* ============================================================
 * 22. APLATISSEMENT DE LA STRUCTURE
 * ============================================================ */

/**
 * Transforme l'arbre en liste linéaire.
 *
 * Utile pour :
 * - aperçu
 * - résumé
 * - navigation
 * - génération de sommaire
 * - contrôle côté frontend
 */
export function flattenStructure(
  structure,
  options = {}
) {
  if (!Array.isArray(structure)) {
    return [];
  }

  const result = [];

  const includeChildren =
    options.includeChildren !== false;

  function visit(
    nodes,
    depth = 0,
    parentId = null
  ) {
    if (!Array.isArray(nodes)) {
      return;
    }

    nodes.forEach((node) => {
      if (!node) {
        return;
      }

      result.push({
        id: node.id,
        instanceId:
          node.instanceId || null,
        title:
          node.title ||
          getModuleById(node.id)
            ?.title ||
          node.id,
        category:
          node.category ||
          getModuleById(node.id)
            ?.category ||
          null,
        kind:
          node.kind ||
          getModuleById(node.id)
            ?.kind ||
          "section",
        depth,
        parentId,
        order:
          Number.isInteger(node.order)
            ? node.order
            : null,
        source:
          node.source || null,
      });

      if (
        includeChildren &&
        Array.isArray(node.children)
      ) {
        visit(
          node.children,
          depth + 1,
          node.instanceId ||
            node.id
        );
      }
    });
  }

  visit(structure);

  return result;
}

/* ============================================================
 * 23. VALIDATION
 * ============================================================ */

/**
 * Validation complète de la structure.
 *
 * Elle retourne toujours :
 *
 * {
 *   valid: boolean,
 *   errors: string[],
 *   warnings: string[]
 * }
 *
 * Elle ne modifie jamais la structure reçue.
 */
export function validateStructure(
  structure
) {
  const errors = [];
  const warnings = [];

  /*
   * ----------------------------------------------------------
   * Structure racine
   * ----------------------------------------------------------
   */

  if (!Array.isArray(structure)) {
    return {
      valid: false,
      errors: [
        "La structure doit être un tableau.",
      ],
      warnings: [],
    };
  }

  if (structure.length === 0) {
    return {
      valid: false,
      errors: [
        "La structure du document est vide.",
      ],
      warnings: [],
    };
  }

  /*
   * ----------------------------------------------------------
   * Détection des doublons
   * ----------------------------------------------------------
   */

  const moduleIds = new Set();
  const instanceIds = new Set();

  /*
   * ----------------------------------------------------------
   * Validation récursive
   * ----------------------------------------------------------
   */

  function validateNodes(
    nodes,
    parentId = null,
    parentKind = "root"
  ) {
    if (!Array.isArray(nodes)) {
      errors.push(
        `Les enfants de "${parentId || "racine"}" doivent être un tableau.`
      );

      return;
    }

    nodes.forEach((node, index) => {
      if (!node) {
        errors.push(
          `Élément invalide à la position ${index}.`
        );

        return;
      }

      /*
       * ID du module
       */
      if (
        typeof node.id !== "string" ||
        !node.id.trim()
      ) {
        errors.push(
          `Le module à la position ${index} ne possède pas d'identifiant valide.`
        );

        return;
      }

      /*
       * Module connu
       */
      const module =
        getModuleById(node.id);

      if (!module) {
        errors.push(
          `Module inconnu : "${node.id}".`
        );

        return;
      }

      /*
       * Doublon global de module
       */
      if (moduleIds.has(node.id)) {
        errors.push(
          `Le module "${node.id}" apparaît plusieurs fois dans la structure.`
        );
      } else {
        moduleIds.add(node.id);
      }

      /*
       * Instance ID
       */
      if (
        node.instanceId !== undefined &&
        node.instanceId !== null
      ) {
        if (
          typeof node.instanceId !==
            "string" ||
          !node.instanceId.trim()
        ) {
          errors.push(
            `L'instanceId du module "${node.id}" est invalide.`
          );
        } else if (
          instanceIds.has(
            node.instanceId
          )
        ) {
          errors.push(
            `L'instanceId "${node.instanceId}" est utilisé plusieurs fois.`
          );
        } else {
          instanceIds.add(
            node.instanceId
          );
        }
      }

      /*
       * Enfants
       */
      if (
        node.children !== undefined &&
        !Array.isArray(node.children)
      ) {
        errors.push(
          `Les enfants du module "${node.id}" doivent être un tableau.`
        );

        return;
      }

      const children =
        Array.isArray(node.children)
          ? node.children
          : [];

      /*
       * --------------------------------------------------------
       * Méthodologie
       * --------------------------------------------------------
       */

      if (
        node.id === "methodology"
      ) {
        /*
         * La méthodologie doit être à la racine.
         */
        if (parentId !== null) {
          errors.push(
            "Le module \"methodology\" doit être placé à la racine."
          );
        }

        /*
         * Elle doit être un container.
         */
        if (
          node.kind !== "container"
        ) {
          errors.push(
            "Le module \"methodology\" doit être de type \"container\"."
          );
        }

        /*
         * Tous ses enfants doivent être
         * des sous-sections méthodologiques.
         */
        children.forEach(
          (child) => {
            if (
              !child ||
              !isMethodologyChild(
                child.id
              )
            ) {
              errors.push(
                `Le module "${child?.id || "inconnu"}" n'est pas une sous-section méthodologique valide.`
              );
            }
          }
        );
      }

      /*
       * --------------------------------------------------------
       * Sous-section méthodologique
       * --------------------------------------------------------
       */

      if (
        isMethodologyChild(
          node.id
        )
      ) {
        if (
          parentId !== "methodology"
        ) {
          errors.push(
            `La sous-section "${node.id}" doit être placée dans "methodology".`
          );
        }

        if (
          children.length > 0
        ) {
          errors.push(
            `La sous-section méthodologique "${node.id}" ne doit pas avoir d'enfants.`
          );
        }
      }

      /*
       * --------------------------------------------------------
       * Sections normales
       * --------------------------------------------------------
       */

      if (
        node.id !== "methodology" &&
        !isMethodologyChild(
          node.id
        ) &&
        children.length > 0
      ) {
        errors.push(
          `Le module "${node.id}" ne peut pas contenir de sous-modules.`
        );
      }

      /*
       * Uniquement methodology peut être
       * un container dans notre modèle actuel.
       */
      if (
        node.kind === "container" &&
        node.id !== "methodology"
      ) {
        errors.push(
          `Le module "${node.id}" est déclaré comme container alors que seul "methodology" peut l'être.`
        );
      }

      /*
       * Vérification récursive.
       */
      if (children.length > 0) {
        validateNodes(
          children,
          node.id,
          node.kind
        );
      }
    });
  }

  validateNodes(structure);

  /*
   * ----------------------------------------------------------
   * Modules obligatoires
   * ----------------------------------------------------------
   */

  Object.values(
    DOCUMENT_MODULES
  ).forEach((module) => {
    if (!module.required) {
      return;
    }

    if (
      !moduleIds.has(module.id)
    ) {
      errors.push(
        `Le module obligatoire "${module.id}" est absent.`
      );
    }
  });

  /*
   * ----------------------------------------------------------
   * Page de garde
   * ----------------------------------------------------------
   */

  if (
    structure[0]?.id !==
    "cover-page"
  ) {
    errors.push(
      "La page de garde doit être le premier élément de la structure."
    );
  }

  /*
   * ----------------------------------------------------------
   * Sous-sections méthodologiques
   * à la racine
   * ----------------------------------------------------------
   */

  structure.forEach((node) => {
    if (
      node &&
      isMethodologyChild(
        node.id
      )
    ) {
      errors.push(
        `La sous-section "${node.id}" ne peut pas être placée directement à la racine.`
      );
    }
  });

  /*
   * ----------------------------------------------------------
   * Ordre
   * ----------------------------------------------------------
   */

  function validateOrder(
    nodes,
    parentLabel
  ) {
    if (!Array.isArray(nodes)) {
      return;
    }

    nodes.forEach((node) => {
      if (!node) {
        return;
      }

      if (
        node.order !== undefined &&
        !Number.isInteger(node.order)
      ) {
        warnings.push(
          `L'ordre du module "${node.id}" dans "${parentLabel}" n'est pas un entier.`
        );
      }

      validateOrder(
        node.children,
        node.id
      );
    });
  }

  validateOrder(
    structure,
    "racine"
  );

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/* ============================================================
 * 24. EXPORTS UTILITAIRES SUPPLÉMENTAIRES
 * ============================================================ */

/**
 * Retourne true si le module existe dans le catalogue.
 */
export function moduleExists(
  moduleId
) {
  return Boolean(
    getModuleById(moduleId)
  );
}

/**
 * Retourne la liste des modules disponibles
 * à la racine.
 */
export function getRootModules() {
  return Object.values(
    DOCUMENT_MODULES
  ).filter(
    (module) =>
      module.category !==
      "methodology"
  );
}

/**
 * Retourne les sous-modules disponibles
 * pour la méthodologie.
 */
export function getMethodologyModules() {
  return Object.values(
    DOCUMENT_MODULES
  ).filter(
    (module) =>
      module.category ===
      "methodology" &&
      module.kind === "subsection"
  );
}