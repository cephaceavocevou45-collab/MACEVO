// src/config/reportCreationConfig.js

/*
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : reportCreationConfig.js
 *
 * Description :
 * Configuration centrale du parcours "Nouveau rapport".
 *
 * Principes :
 * - Les champs que l'utilisateur doit pouvoir renseigner
 *   restent accessibles.
 * - Aucune visibilité ne dépend de la valeur du champ
 *   lui-même.
 * - Le pays est sélectionné dans une liste complète.
 * - "Autre pays" permet une saisie libre.
 * ============================================================
 */


/* ============================================================
   ÉTAPES DE CRÉATION
============================================================ */

export const CREATION_STEPS = [
  {
    id: "information",
    label: "Informations",
    description: "Votre document",
  },
  {
    id: "context",
    label: "Contexte",
    description: "Votre environnement",
  },
  {
    id: "preferences",
    label: "Préférences",
    description: "Normes et contraintes",
  },
  {
    id: "structure",
    label: "Structure",
    description: "Proposition MACEVO",
  },
  {
    id: "review",
    label: "Vérification",
    description: "Dernière étape",
  },
];


/* ============================================================
   TYPES DE DOCUMENT
============================================================ */

export const DOCUMENT_TYPES = [
  {
    value: "memoire",
    label: "Mémoire",
  },
  {
    value: "these",
    label: "Thèse",
  },
  {
    value: "rapport_stage",
    label: "Rapport de stage",
  },
  {
    value: "article_scientifique",
    label: "Article scientifique",
  },
  {
    value: "rapport_technique",
    label: "Rapport technique",
  },
  {
    value: "autre",
    label: "Autre",
  },
];


/* ============================================================
   NIVEAUX ACADÉMIQUES
============================================================ */

export const ACADEMIC_LEVELS = [
  {
    value: "undergraduate",
    label: "Licence / Undergraduate",
  },
  {
    value: "master",
    label: "Master",
  },
  {
    value: "doctorate",
    label: "Doctorat",
  },
  {
    value: "other",
    label: "Autre",
  },
];


/* ============================================================
   LANGUES
============================================================ */

export const LANGUAGES = [
  {
    value: "fr",
    label: "Français",
  },
  {
    value: "en",
    label: "English",
  },
  {
    value: "es",
    label: "Español",
  },
  {
    value: "de",
    label: "Deutsch",
  },
  {
    value: "pt",
    label: "Português",
  },
  {
    value: "other",
    label: "Autre",
  },
];


/* ============================================================
   STYLES DE CITATION
============================================================ */

export const CITATION_STYLES = [
  {
    value: "apa",
    label: "APA",
  },
  {
    value: "ieee",
    label: "IEEE",
  },
  {
    value: "vancouver",
    label: "Vancouver",
  },
  {
    value: "chicago",
    label: "Chicago",
  },
  {
    value: "harvard",
    label: "Harvard",
  },
  {
    value: "mla",
    label: "MLA",
  },
  {
    value: "institutional",
    label: "Norme institutionnelle",
  },
  {
    value: "other",
    label: "Autre",
  },
  {
    value: "unknown",
    label: "Je ne sais pas encore",
  },
];


/* ============================================================
   TYPES D'ÉTUDE
============================================================ */

export const STUDY_TYPES = [
  {
    value: "empirical",
    label: "Étude empirique",
  },
  {
    value: "quantitative",
    label: "Étude quantitative",
  },
  {
    value: "qualitative",
    label: "Étude qualitative",
  },
  {
    value: "mixed",
    label: "Étude mixte",
  },
  {
    value: "experimental",
    label: "Étude expérimentale",
  },
  {
    value: "case_study",
    label: "Étude de cas",
  },
  {
    value: "review",
    label: "Revue de littérature",
  },
  {
    value: "theoretical",
    label: "Étude théorique",
  },
  {
    value: "technical",
    label: "Étude technique",
  },
  {
    value: "unknown",
    label: "Je ne sais pas encore",
  },
];


/* ============================================================
   PAYS
============================================================ */

/*
 * Codes ISO 3166-1 alpha-2.
 *
 * Les noms sont générés par Intl.DisplayNames en français.
 * Cela permet d'avoir une liste internationale sans devoir
 * maintenir manuellement tous les noms dans plusieurs langues.
 *
 * "Autre pays" est ajouté explicitement à la fin.
 */

const COUNTRY_CODES = [
  "AF",
  "AL",
  "DZ",
  "AD",
  "AO",
  "AG",
  "AR",
  "AM",
  "AU",
  "AT",
  "AZ",
  "BS",
  "BH",
  "BD",
  "BB",
  "BY",
  "BE",
  "BZ",
  "BJ",
  "BT",
  "BO",
  "BA",
  "BW",
  "BR",
  "BN",
  "BG",
  "BF",
  "BI",
  "CV",
  "KH",
  "CM",
  "CA",
  "CF",
  "TD",
  "CL",
  "CN",
  "CO",
  "KM",
  "CG",
  "CD",
  "CR",
  "CI",
  "HR",
  "CU",
  "CY",
  "CZ",
  "DK",
  "DJ",
  "DM",
  "DO",
  "EC",
  "EG",
  "SV",
  "GQ",
  "ER",
  "EE",
  "SZ",
  "ET",
  "FJ",
  "FI",
  "FR",
  "GA",
  "GM",
  "GE",
  "DE",
  "GH",
  "GR",
  "GD",
  "GT",
  "GN",
  "GW",
  "GY",
  "HT",
  "HN",
  "HU",
  "IS",
  "IN",
  "ID",
  "IR",
  "IQ",
  "IE",
  "IL",
  "IT",
  "JM",
  "JP",
  "JO",
  "KZ",
  "KE",
  "KI",
  "KP",
  "KR",
  "KW",
  "KG",
  "LA",
  "LV",
  "LB",
  "LS",
  "LR",
  "LY",
  "LI",
  "LT",
  "LU",
  "MG",
  "MW",
  "MY",
  "MV",
  "ML",
  "MT",
  "MH",
  "MR",
  "MU",
  "MX",
  "FM",
  "MD",
  "MC",
  "MN",
  "ME",
  "MA",
  "MZ",
  "MM",
  "NA",
  "NR",
  "NP",
  "NL",
  "NZ",
  "NI",
  "NE",
  "NG",
  "MK",
  "NO",
  "OM",
  "PK",
  "PW",
  "PS",
  "PA",
  "PG",
  "PY",
  "PE",
  "PH",
  "PL",
  "PT",
  "QA",
  "RO",
  "RU",
  "RW",
  "KN",
  "LC",
  "VC",
  "WS",
  "SM",
  "ST",
  "SA",
  "SN",
  "RS",
  "SC",
  "SL",
  "SG",
  "SK",
  "SI",
  "SB",
  "SO",
  "ZA",
  "SS",
  "ES",
  "LK",
  "SD",
  "SR",
  "SE",
  "CH",
  "SY",
  "TJ",
  "TZ",
  "TH",
  "TL",
  "TG",
  "TO",
  "TT",
  "TN",
  "TR",
  "TM",
  "TV",
  "UG",
  "UA",
  "AE",
  "GB",
  "US",
  "UY",
  "UZ",
  "VU",
  "VA",
  "VE",
  "VN",
  "YE",
  "ZM",
  "ZW",

  /* Territoires et régions couramment reconnus par
     Intl.DisplayNames lorsqu'ils sont disponibles. */
  "AX",
  "AS",
  "AW",
  "BM",
  "BQ",
  "BV",
  "CC",
  "CK",
  "CW",
  "CX",
  "EH",
  "FK",
  "FO",
  "GF",
  "GG",
  "GI",
  "GL",
  "GP",
  "GU",
  "HK",
  "HM",
  "IM",
  "IO",
  "JE",
  "KY",
  "MO",
  "MP",
  "MQ",
  "MS",
  "NC",
  "NF",
  "NU",
  "PF",
  "PG",
  "PM",
  "PN",
  "PR",
  "RE",
  "SH",
  "SJ",
  "SX",
  "TC",
  "TF",
  "TK",
  "UM",
  "VI",
  "VG",
  "WF",
  "YT",
];


/**
 * Construit la liste des pays.
 */
function createCountryOptions() {
  let displayNames = null;

  try {
    if (
      typeof Intl !== "undefined" &&
      typeof Intl.DisplayNames === "function"
    ) {
      displayNames = new Intl.DisplayNames(
        ["fr"],
        {
          type: "region",
        }
      );
    }
  } catch {
    displayNames = null;
  }

  const uniqueCodes = [
    ...new Set(COUNTRY_CODES),
  ];

  const options = uniqueCodes
    .map((code) => {
      const label =
        displayNames?.of(code) || code;

      return {
        value: code,
        label,
      };
    })
    .filter(
      (item) =>
        item.label &&
        item.label !== item.value
    )
    .sort((a, b) =>
      a.label.localeCompare(
        b.label,
        "fr",
        {
          sensitivity: "base",
        }
      )
    );

  options.push({
    value: "other",
    label: "Autre pays",
  });

  return options;
}


/*
 * Liste publique utilisée par NewReports.jsx.
 */
export const COUNTRIES =
  createCountryOptions();


/* ============================================================
   CHAMPS DU CONTEXTE
============================================================ */

export const CONTEXT_FIELDS = [
  {
    id: "country",
    label: "Pays",
    required: false,
    visibility: "always",
  },
  {
    id: "institution",
    label: "Université / institution",
    required: false,
    visibility: "always",
  },
  {
    id: "faculty",
    label: "Faculté / école / institut",
    required: false,
    visibility: "always",
  },
  {
    id: "department",
    label: "Département",
    required: false,
    visibility: "always",
  },
  {
    id: "laboratory",
    label: "Laboratoire / centre de recherche",
    required: false,
    visibility: "always",
  },
  {
    id: "program",
    label: "Filière / programme",
    required: false,
    visibility: "always",
  },
  {
    id: "specialty",
    label: "Spécialité",
    required: false,
    visibility: "always",
  },
  {
    id: "academicYear",
    label: "Année académique",
    required: false,
    visibility: "always",
  },
  {
    id: "supervisor",
    label: "Encadreur",
    required: false,
    visibility: "always",
  },
];


/* ============================================================
   VISIBILITÉ
============================================================ */

/*
 * IMPORTANT :
 *
 * On ne doit surtout pas avoir :
 *
 * institution => Boolean(context.institution)
 *
 * car cela crée un cercle :
 *
 * institution vide
 *       ↓
 * champ caché
 *       ↓
 * impossible de renseigner institution
 *       ↓
 * institution reste vide
 *
 * Tous les champs importants du contexte restent donc
 * accessibles.
 */

export const VISIBILITY_RULES = {
  always: () => true,

  institution: () => true,

  academic: () => true,

  supervised: () => true,
};


function normalizeVisibilityValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim()
    .replace(/\s+/g, " ");
}


export function createVisibilityContext(form = {}) {
  return {
    reportType:
      normalizeVisibilityValue(
        form.reportType
      ),

    academicLevel:
      normalizeVisibilityValue(
        form.academicLevel
      ),

    institution:
      normalizeVisibilityValue(
        form.institution
      ),

    studyType:
      normalizeVisibilityValue(
        form.studyType
      ),

    citationStyle:
      normalizeVisibilityValue(
        form.citationStyle
      ),
  };
}


export function getVisibleContextFields(
  form = {}
) {
  const context =
    createVisibilityContext(
      form
    );

  return CONTEXT_FIELDS
    .filter((field) => {
      const rule =
        VISIBILITY_RULES[
          field.visibility
        ] ||
        VISIBILITY_RULES.always;

      return Boolean(
        rule(context)
      );
    })
    .map(
      (field) => field.id
    );
}


/* ============================================================
   GETTERS
============================================================ */

export function getDocumentType(value) {
  return DOCUMENT_TYPES.find(
    (item) =>
      item.value === value
  );
}


export function getAcademicLevel(value) {
  return ACADEMIC_LEVELS.find(
    (item) =>
      item.value === value
  );
}


export function getLanguage(value) {
  return LANGUAGES.find(
    (item) =>
      item.value === value
  );
}


export function getCitationStyle(value) {
  return CITATION_STYLES.find(
    (item) =>
      item.value === value
  );
}


export function getStudyType(value) {
  return STUDY_TYPES.find(
    (item) =>
      item.value === value
  );
}


/* ============================================================
   VALIDATION
============================================================ */

export function isValidDocumentType(value) {
  return DOCUMENT_TYPES.some(
    (item) =>
      item.value === value
  );
}


export function isValidAcademicLevel(value) {
  return ACADEMIC_LEVELS.some(
    (item) =>
      item.value === value
  );
}


export function isValidLanguage(value) {
  return LANGUAGES.some(
    (item) =>
      item.value === value
  );
}


export function isValidCitationStyle(value) {
  return CITATION_STYLES.some(
    (item) =>
      item.value === value
  );
}


export function isValidStudyType(value) {
  return STUDY_TYPES.some(
    (item) =>
      item.value === value
  );
}


/* ============================================================
   VALIDATION DU FORMULAIRE
============================================================ */

export function validateCreationForm(
  form = {}
) {
  const errors = {};

  if (
    !String(form.title || "").trim()
  ) {
    errors.title =
      "Le titre du document est obligatoire.";
  }

  if (
    !isValidDocumentType(
      form.reportType
    )
  ) {
    errors.reportType =
      "Le type de document est obligatoire.";
  }

  if (
    !String(
      form.scientificField || ""
    ).trim()
  ) {
    errors.scientificField =
      "Le domaine ou la discipline est obligatoire.";
  }

  if (
    !isValidAcademicLevel(
      form.academicLevel
    )
  ) {
    errors.academicLevel =
      "Le niveau académique est obligatoire.";
  }

  if (
    !isValidLanguage(
      form.language
    )
  ) {
    errors.language =
      "La langue du document est obligatoire.";
  }

  if (
    form.country === "other" &&
    !String(
      form.customCountry || ""
    ).trim()
  ) {
    errors.customCountry =
      "Veuillez renseigner votre pays.";
  }

  return {
    valid:
      Object.keys(errors)
        .length === 0,

    errors,
  };
}


/* ============================================================
   EXPORT PAR DÉFAUT
============================================================ */

export default {
  CREATION_STEPS,
  DOCUMENT_TYPES,
  ACADEMIC_LEVELS,
  LANGUAGES,
  CITATION_STYLES,
  STUDY_TYPES,
  COUNTRIES,
  CONTEXT_FIELDS,
  VISIBILITY_RULES,
  getVisibleContextFields,
  validateCreationForm,
};