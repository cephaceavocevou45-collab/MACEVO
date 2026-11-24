import { COUNTRIES } from "../../config/reportCreationConfig";

const STANDARD_PRECEDENCE = [
  "institution",
  "faculty_or_department",
  "national_or_regional",
  "discipline",
  "macevo_default",
];

const clean = (value) => String(value || "").trim();

export function resolveAcademicCountryCode(value) {
  const candidate = clean(value);
  if (!candidate || candidate.toLowerCase() === "other") return "";

  const country = COUNTRIES.find((option) =>
    option.value.toUpperCase() === candidate.toUpperCase() ||
    option.label.localeCompare(candidate, "fr", { sensitivity: "base" }) === 0
  );

  return country?.value || "";
}

/**
 * Stores the jurisdiction and provenance that informed a document's format.
 * Academic thesis rules commonly differ by institution and programme, so a
 * country alone is never treated as proof of a local rule.
 */
export function createAcademicStandardsSnapshot({
  countryCode = "",
  countryName = "",
  institution = "",
  faculty = "",
  department = "",
  programme = "",
  requirements = "",
  sourceUrl = "",
  pageFormat = "",
  sourceTitle = "",
} = {}) {
  const source = clean(sourceUrl);
  const localRequirements = clean(requirements);

  return {
    schemaVersion: 1,
    jurisdiction: {
      countryCode: clean(countryCode).toUpperCase(),
      countryName: clean(countryName),
      institution: clean(institution),
      faculty: clean(faculty),
      department: clean(department),
      programme: clean(programme),
    },
    precedence: [...STANDARD_PRECEDENCE],
    pageFormat: clean(pageFormat) || null,
    requirements: localRequirements,
    provenance: source
      ? {
          status: "user-supplied-unverified",
          title: clean(sourceTitle),
          url: source,
          checkedAt: null,
        }
      : {
          status: localRequirements ? "user-supplied-no-source" : "institutional-rules-needed",
          title: "",
          url: "",
          checkedAt: null,
        },
    note:
      "Une règle de mise en forme n'est vérifiée que lorsqu'elle est liée à une source officielle applicable à l'établissement et au programme.",
  };
}

export function getAcademicStandardsGuidance(
  countryName,
  institution = "",
  requirements = "",
  sourceUrl = "",
) {
  const selectedCountry = clean(countryName);
  const selectedInstitution = clean(institution);
  const suppliedRequirements = clean(requirements);
  const suppliedSource = clean(sourceUrl);

  if (!selectedCountry) {
    return "Choisissez le pays de l’établissement pour indiquer le contexte des règles académiques.";
  }

  if (!selectedInstitution) {
    return `Pays enregistré : ${selectedCountry}. Les critères de mémoire et de thèse varient selon l’université, la faculté, le diplôme et la discipline. Le format de page proposé est indicatif ; indiquez l’établissement pour préciser les règles applicables.`;
  }

  if (!suppliedRequirements) {
    return `${selectedInstitution} (${selectedCountry}) est enregistré. Les exigences de l’établissement prévalent sur les réglages régionaux ; ajoutez son guide officiel pour appliquer ses règles plutôt que des valeurs génériques.`;
  }

  if (!suppliedSource) {
    return `Les exigences indiquées pour ${selectedInstitution} sont conservées avec le document, mais ne sont pas vérifiées faute de source officielle. Confirmez qu’elles s’appliquent à votre faculté et à votre programme.`;
  }

  return `Les exigences et le lien fournis pour ${selectedInstitution} (${selectedCountry}) sont conservés avec le document. Vérifiez que la source est officielle et concerne bien votre faculté, votre diplôme et l’année académique en cours.`;
}

export { STANDARD_PRECEDENCE };
