import { buildRecommendedStructure } from "./reportStructureEngine";
import { createMacevoDocument, serializeMacevoDocument } from "../core/document/macevoDocumentModel";
import { renderTemplateDocument } from "../core/document/templateDocumentRenderer";
import {
  createAcademicStandardsSnapshot,
  resolveAcademicCountryCode,
} from "../core/academic/academicStandards";

const LETTER_COUNTRIES = new Set([
  "CA",
  "CANADA",
  "MX",
  "MEXICO",
  "PH",
  "PHILIPPINES",
  "US",
  "UNITED STATES",
  "UNITED STATES OF AMERICA",
  "ÉTATS-UNIS",
  "ETATS-UNIS",
]);

const normalizeText = (value) => String(value || "").trim();

const slugify = (value) => normalizeText(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

export function getRegionalPageFormat(country) {
  const countryCode = normalizeText(country).toUpperCase();
  return LETTER_COUNTRIES.has(countryCode) ? "Letter" : "A4";
}

export function createInternationalDocument(profile = {}) {
  const country = normalizeText(profile.country);
  const reportType = normalizeText(profile.reportType || profile.report_type) || "document-academique";
  const academicLevel = normalizeText(profile.academicLevel || profile.academic_level);
  const language = normalizeText(profile.language) || "fr";
  const citationStyle = normalizeText(profile.citationStyle || profile.citation_style) || "APA";
  const countryName = normalizeText(profile.countryName) || country;
  const countryCode = resolveAcademicCountryCode(profile.countryCode || country);
  const blankStart = profile.creationMode === "blank";
  const format = profile.pageFormat || getRegionalPageFormat(country);
  const structure = Array.isArray(profile.structure)
    ? profile.structure
    : buildRecommendedStructure(profile);
  const id = normalizeText(profile.templateId) || [
    "custom",
    slugify(reportType),
    slugify(academicLevel),
    slugify(country || "international"),
  ].filter(Boolean).join("-").slice(0, 100);
  const isArticle = /article|publication/i.test(reportType);
  const isTechnical = /technique|stage|projet/i.test(reportType);
  const designId = isArticle ? "scientifique" : isTechnical ? "moderne" : "classique";

  const template = {
    id,
    name: normalizeText(profile.templateName) || reportType,
    title: normalizeText(profile.templateName) || reportType,
    type: reportType,
    category: reportType,
    country,
    countryCode,
    academicLevel,
    level: academicLevel,
    language,
    fields: [normalizeText(profile.scientificField || profile.discipline)].filter(Boolean),
    citationStyle,
    structureId: id,
    structure,
    frontMatter: blankStart
      ? { cover: true, tableOfContents: profile.generateToc === true }
      : {
          dedication: Boolean(profile.includeDedication),
          acknowledgements: Boolean(profile.includeAcknowledgements),
          abstract: true,
          tableOfContents: profile.generateToc !== false,
          listOfFigures: Boolean(profile.includeLists),
          listOfTables: Boolean(profile.includeLists),
          abbreviations: Boolean(profile.includeAbbreviations),
        },
    autoGenerateInitialContent: !blankStart,
    academicContext: {
      country: countryName,
      countryCode,
      institution: normalizeText(profile.institution),
      faculty: normalizeText(profile.faculty),
      department: normalizeText(profile.department),
      program: normalizeText(profile.program),
      specialty: normalizeText(profile.specialty || profile.specialization),
    },
    documentRules: {
      pageFormat: format,
      institutionalRequirements: normalizeText(profile.institutionalRequirements),
      otherRequirements: normalizeText(profile.otherRequirements),
      academicStandards: createAcademicStandardsSnapshot({
        countryCode,
        countryName,
        institution: profile.institution,
        faculty: profile.faculty,
        department: profile.department,
        programme: profile.program,
        requirements: profile.institutionalRequirements,
        sourceUrl: profile.institutionalRequirementsSource,
        sourceTitle: profile.institutionalRequirementsSourceTitle,
        pageFormat: format,
      }),
      targetPages: normalizeText(profile.targetPages),
      studyType: normalizeText(profile.studyType),
      referenceLanguage: normalizeText(profile.referenceLanguage),
      formattingNotice: "Le format régional est une proposition. Les consignes officielles de l'établissement prévalent.",
    },
    design: {
      id: designId,
      page: {
        size: format,
        orientation: "portrait",
        margins: { top: 25, right: 25, bottom: 25, left: 25 },
      },
      typography: {
        bodyFont: "Aptos, Calibri, Arial, sans-serif",
        bodySize: 12,
        lineHeight: 1.5,
        headingFont: "Aptos Display, Calibri, Arial, sans-serif",
      },
      colors: {
        primary: isArticle ? "#174A6E" : isTechnical ? "#176B5B" : "#243B53",
        secondary: "#F3F6F8",
        accent: isArticle ? "#C04B35" : isTechnical ? "#B76E2B" : "#2C7A7B",
        text: "#202124",
        muted: "#64748B",
        border: "#CBD5E1",
      },
      layout: { style: isArticle ? "scientific" : isTechnical ? "professional" : "academic" },
      cover: { showLogo: true, showBadge: true, showAccentLine: true },
    },
    version: "international-profile-1",
  };

  const author = [profile.authorFirstName, profile.authorLastName]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
  const document = createMacevoDocument(template, {
    title: normalizeText(profile.title) || template.name,
    metadata: {
      title: normalizeText(profile.title) || template.name,
      author,
      type: reportType,
      reportType,
      academicLevel,
      language,
      scientificField: normalizeText(profile.scientificField || profile.discipline),
      citationStyle,
      academicYear: normalizeText(profile.academicYear || profile.academic_year),
      supervisor: normalizeText(profile.supervisor || profile.director),
      studentId: normalizeText(profile.studentId || profile.student_id),
    },
    academicContext: {
      ...template.academicContext,
      supervisor: normalizeText(profile.supervisor || profile.director),
    },
    profile: {
      ...profile,
      title: normalizeText(profile.title) || template.name,
      institution: template.academicContext.institution,
      faculty: template.academicContext.faculty,
      department: template.academicContext.department,
      program: template.academicContext.program,
      academicSupervisor: normalizeText(profile.supervisor || profile.director),
      period: template.documentRules.targetPages,
    },
  });

  return {
    template,
    document,
    content: renderTemplateDocument(document, template),
    serializedDocument: serializeMacevoDocument(document),
  };
}
