// src/pages/Reports/ScientificGenerator/ScientificGenerator.jsx

import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  FlaskConical,
  GraduationCap,
  Layers3,
  Microscope,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
  Target,
} from "lucide-react";

import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import api from "../../../api/axios";

import {
  getGenerationProfile,
} from "../../../config/generationProfiles";

import {
  getAcademicRules,
  getCitationRules,
  getResearchRules,
} from "../../../config/scientificRules";
import { getRegionalPageFormat } from "../../../services/internationalDocumentFactory";
import {
  createAcademicStandardsSnapshot,
  resolveAcademicCountryCode,
} from "../../../core/academic/academicStandards";

const RESEARCH_TYPES = [
  "Revue de littérature",
  "Expérimental",
  "Observationnel",
  "Descriptif",
  "Comparatif",
  "Étude de cas",
  "Quantitatif",
  "Qualitatif",
  "Mixte",
  "Recherche-développement",
  "Modélisation",
  "Simulation numérique",
  "Conception/implémentation",
  "Autre",
];

const PAGE_OPTIONS = [
  { value: "automatic", label: "Automatique selon le niveau et le sujet" },
  { value: "10-15", label: "10 – 15 pages" },
  { value: "15-20", label: "15 – 20 pages" },
  { value: "20-30", label: "20 – 30 pages" },
  { value: "30-50", label: "30 – 50 pages" },
  { value: "50+", label: "50 pages et plus" },
];

const CITATION_STYLES = [
  "APA 7",
  "IEEE",
  "Vancouver",
  "Harvard",
  "Chicago",
];

function getStoredReport() {
  try {
    const raw = sessionStorage.getItem("macevo_current_report");

    if (!raw) return null;

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getStoredGenerationConfig() {
  try {
    const raw = sessionStorage.getItem("macevo_generation_config");

    if (!raw) return null;

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildSections(profile, researchRules) {
  const sections = [...profile.sections];

  researchRules.requires.forEach((requiredSection) => {
    const exists = sections.some(
      (section) =>
        section.toLowerCase() === requiredSection.toLowerCase()
    );

    if (!exists) {
      sections.push(requiredSection);
    }
  });

  return sections.map((title, index) => ({
    id: `section-${index + 1}`,
    number: index + 1,
    title,
    status: "planned",
    generated: false,
    content: "",
  }));
}

function resolvePageTarget(value) {
  if (value === "50+") return 50;
  if (value === "30-50") return 40;
  if (value === "20-30") return 25;
  if (value === "15-20") return 18;
  if (value === "10-15") return 13;
  return null;
}

function allocateSectionPages(sections, target) {
  if (!target || !sections.length) return sections;
  const weightFor = (title) => {
    const key = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (/litterature|etat de l.art|cadre theorique/.test(key)) return 2.1;
    if (/method|protocole|materiel|donnees et method/.test(key)) return 1.8;
    if (/resultat|analyse empirique|presentation des resultats/.test(key)) return 1.8;
    if (/discussion|interpretation/.test(key)) return 1.5;
    if (/introduction|problematique/.test(key)) return 1.2;
    if (/conclusion|perspective/.test(key)) return 0.8;
    return 1;
  };
  const weights = sections.map((section) => weightFor(section.title));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const exact = weights.map((weight) => (target * weight) / totalWeight);
  const pages = exact.map((value) => Math.floor(value));
  const remaining = target - pages.reduce((sum, value) => sum + value, 0);
  const remainders = exact
    .map((value, index) => ({ index, remainder: value - pages[index] }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let index = 0; index < remaining; index += 1) pages[remainders[index].index] += 1;
  return sections.map((section, index) => ({ ...section, targetPages: pages[index] }));
}

function createBlueprintTemplate(blueprint, report = {}) {
  const slug = String(blueprint.document.title || "recherche")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const structure = blueprint.sections.map((section) => {
    const isBibliography = /bibliograph|r[eé]f[eé]rences|references/i.test(section.title);
    const isAppendix = /annexe|appendix/i.test(section.title);
    return {
      id: section.id,
      type: isBibliography ? "bibliography" : isAppendix ? "appendix" : "chapter",
      title: section.title,
      metadata: {
        pageTarget: section.targetPages || null,
        generatedFromBlueprint: true,
      },
      children: (section.children || []).map((child) => ({
        id: child.id,
        type: "section",
        title: child.title,
        purpose: child.purpose || "",
        content: child.content || "",
        metadata: { generatedFromBlueprint: true },
        children: [],
      })),
    };
  });
  const selected = blueprint.scientificElements || {};
  const citation = String(blueprint.citation.style || "APA 7").split(/\s+/)[0].toLowerCase();
  const country = report.country || report.country_name || report.countryName || report.country_code || "";
  const countryCode = report.country_code || resolveAcademicCountryCode(country);
  const countryName = report.country_name || report.countryName || country;
  const pageFormat = getRegionalPageFormat(countryCode || country);
  const institutionalRequirements = report.institutional_requirements || report.institutionalRequirements || "";
  const institutionalRequirementsSource = report.institutional_requirements_source || report.institutionalRequirementsSource || "";

  return {
    id: `blueprint-${slug || "recherche"}`,
    name: blueprint.document.title,
    label: blueprint.document.title,
    type: blueprint.document.reportType || "rapport-recherche",
    category: "Recherche scientifique",
    level: blueprint.document.academicLevel,
    language: ["fr"],
    fields: [blueprint.document.discipline],
    academicContext: {
      country: countryName || null,
      countryCode: countryCode || null,
      institution: report.institution || null,
      faculty: report.faculty || null,
      department: report.department || null,
      program: report.program || null,
    },
    structureId: "scientific-blueprint",
    structure,
    design: "scientifique",
    frontMatter: {
      cover: true,
      abstract: true,
      keywords: true,
      tableOfContents: true,
      listOfFigures: Boolean(selected.figures || selected.charts),
      listOfTables: Boolean(selected.tables),
      listOfAlgorithms: Boolean(selected.algorithms),
      listOfAbbreviations: Boolean(selected.definitions),
      listOfSymbols: Boolean(selected.equations),
    },
    documentRules: {
      citationStyle: citation,
      pageFormat,
      institutionalRequirements,
      institutionalRequirementsSource,
      academicStandards: createAcademicStandardsSnapshot({
        countryCode,
        countryName,
        institution: report.institution,
        faculty: report.faculty,
        department: report.department,
        programme: report.program,
        requirements: institutionalRequirements,
        sourceUrl: institutionalRequirementsSource,
        pageFormat,
      }),
      formattingNotice: "Le format régional est une proposition. Les consignes officielles de l’établissement prévalent.",
      page: { size: pageFormat, orientation: "portrait" },
    },
    citationStyle: citation,
    scientificBlueprint: blueprint,
    contentStatus: "scientific-blueprint",
    autoGenerateInitialContent: true,
  };
}

function buildBlueprint({
  report,
  generationConfig,
  researchType,
  researchObjective,
  researchQuestion,
  hypotheses,
  methodology,
  targetPages,
  citationStyle,
  selectedElements,
  specialization,
}) {
  const academicLevel = report?.academic_level || "Licence";
  const discipline = report?.scientific_field || "Informatique";

  const profile = getGenerationProfile(discipline);
  const academicRules = getAcademicRules(academicLevel);
  const researchRules = getResearchRules(researchType);
  const citationRules = getCitationRules(citationStyle);

  const requestedPages = resolvePageTarget(targetPages);
  const sections = allocateSectionPages(
    buildSections(profile, researchRules),
    requestedPages
  );

  return {
    version: "1.0",
    createdAt: new Date().toISOString(),

    document: {
      id: report?.id || null,
      title: report?.title || "Document scientifique sans titre",
      reportType: report?.report_type || "Mémoire",
      academicLevel,
      discipline,
      specialization,
      language: report?.language || "Français",
      layout: report?.layout || "standard",
    },

    research: {
      type: researchType,
      objective: researchObjective,
      question: researchQuestion,
      hypotheses,
      methodology,
    },

    length: {
      target: targetPages,
      recommended: academicRules.recommendedPages,
      developmentPageTarget: requestedPages,
      allocationBasis: requestedPages
        ? "Répartition indicative entre les sections du développement ; hors préliminaires et références."
        : "Automatique : aucune cible de pages n’a été répartie.",
    },

    citation: {
      style: citationStyle,
      type: citationRules.type,
      bibliography: citationRules.bibliography,
    },

    scientificElements: selectedElements,

    academicRules: {
      depth: academicRules.expectedDepth,
      tone: academicRules.tone,
      complexity: academicRules.complexity,
      minimumSections: academicRules.minimumSections,
    },

    researchRules: {
      requiredComponents: researchRules.requires,
      guidelines: researchRules.guidelines,
      forbiddenClaims: researchRules.forbiddenClaims,
    },

    sections,

    workflow: [
      {
        id: "blueprint",
        label: "Blueprint scientifique",
        status: "completed",
      },
      {
        id: "research",
        label: "Recherche documentaire",
        status: "pending",
      },
      {
        id: "sources",
        label: "Sélection des sources",
        status: "pending",
      },
      {
        id: "plan",
        label: "Plan scientifique",
        status: "completed",
      },
      {
        id: "generation",
        label: "Génération section par section",
        status: "pending",
      },
      {
        id: "validation",
        label: "Validation scientifique",
        status: "pending",
      },
      {
        id: "editor",
        label: "Éditeur scientifique",
        status: "pending",
      },
    ],

    generationConfig: generationConfig || {},
  };
}

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => {
          const item =
            typeof option === "string"
              ? {
                  value: option,
                  label: option,
                }
              : option;

          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700">
        {label}
      </label>

      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function SectionCard({ number, title, targetPages }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">
        {number}
      </div>

      <div className="min-w-0">
        <p className="font-medium text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Section prévue dans le plan scientifique
        </p>
        {Number.isFinite(targetPages) && (
          <p className="mt-1 text-xs font-semibold text-blue-700">
            Budget indicatif : {targetPages} page{targetPages > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <Check className="ml-auto h-5 w-5 text-emerald-500" />
    </div>
  );
}

export default function ScientificGenerator() {
  const navigate = useNavigate();
  const location = useLocation();

  const storedReport = useMemo(
    () => getStoredReport(),
    []
  );

  const storedConfig = useMemo(
    () => getStoredGenerationConfig(),
    []
  );

  const report = useMemo(
    () => location.state?.report || storedReport || {},
    [location.state?.report, storedReport]
  );

  const generationConfig = useMemo(
    () => location.state?.generationConfig || storedConfig || {},
    [location.state?.generationConfig, storedConfig]
  );

  const [step, setStep] = useState(1);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generationError, setGenerationError] = useState("");

  const [researchType, setResearchType] = useState(
    generationConfig.researchType ||
      "Revue de littérature"
  );

  const [researchObjective, setResearchObjective] =
    useState(
      generationConfig.researchObjective || ""
    );

  const [researchQuestion, setResearchQuestion] =
    useState(
      generationConfig.researchQuestion || ""
    );

  const [hypotheses, setHypotheses] = useState(
    generationConfig.hypotheses || ""
  );

  const [methodology, setMethodology] = useState(
    generationConfig.methodology || ""
  );

  const [targetPages, setTargetPages] = useState(
    generationConfig.targetPages || "automatic"
  );

  const [citationStyle, setCitationStyle] =
    useState(
      generationConfig.citationStyle || "APA 7"
    );

  const [specialization, setSpecialization] =
    useState(
      report?.scientificProfile?.specialization ||
        ""
    );

  const initialElements =
    generationConfig.elements ||
    {};

  const [selectedElements, setSelectedElements] =
    useState({
      equations:
        initialElements.equations !== false,

      tables:
        initialElements.tables !== false,

      figures:
        initialElements.figures !== false,

      charts:
        initialElements.charts !== false,

      diagrams:
        initialElements.diagrams !== false,

      images:
        initialElements.images !== false,

      citations:
        initialElements.citations !== false,

      references:
        initialElements.references !== false,

      code:
        initialElements.code === true,

      algorithms:
        initialElements.algorithms === true,

      definitions:
        initialElements.definitions === true,

      theorems:
        initialElements.theorems === true,

      appendices:
        initialElements.appendices !== false,
    });

  const discipline =
    report?.scientific_field ||
    "Informatique";

  const academicLevel =
    report?.academic_level ||
    "Licence";

  const profile = useMemo(
    () => getGenerationProfile(discipline),
    [discipline]
  );

  const academicRules = useMemo(
    () => getAcademicRules(academicLevel),
    [academicLevel]
  );

  const researchRules = useMemo(
    () => getResearchRules(researchType),
    [researchType]
  );

  const blueprint = useMemo(
    () =>
      buildBlueprint({
        report,
        generationConfig,
        researchType,
        researchObjective,
        researchQuestion,
        hypotheses,
        methodology,
        targetPages,
        citationStyle,
        selectedElements,
        specialization,
      }),
    [
      report,
      generationConfig,
      researchType,
      researchObjective,
      researchQuestion,
      hypotheses,
      methodology,
      targetPages,
      citationStyle,
      selectedElements,
      specialization,
    ]
  );

  const toggleElement = (key) => {
    setSelectedElements((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const handleContinue = async () => {
    if (step < 3) {
      setStep((previous) => previous + 1);
      return;
    }

    const projectId = report?.scientific_project;
    if (!projectId) {
      setGenerationError(
        "Ce rapport n’est pas encore associé à un projet scientifique. Créez ou enregistrez d’abord le rapport, puis relancez la génération."
      );
      return;
    }

    setIsGeneratingPlan(true);
    setGenerationError("");
    let generatedPlan;
    try {
      const response = await api.post(
        `/projects/${projectId}/generate/plan/`,
        {
          study_type: researchType,
          chapter_count: Math.max(3, Math.min(12, blueprint.sections.length)),
        }
      );
      generatedPlan = response.data?.plan;
      if (!Array.isArray(generatedPlan?.chapters) || generatedPlan.chapters.length === 0) {
        throw new Error("Le service n’a pas retourné de plan exploitable.");
      }
    } catch (error) {
      setGenerationError(
        error.response?.data?.detail ||
          error.message ||
          "La génération a échoué. Vérifiez que MACEVO_IA est démarré, puis réessayez."
      );
      setIsGeneratingPlan(false);
      return;
    }

    const generatedSections = generatedPlan.chapters.flatMap((chapter, chapterIndex) => {
      const chapterTitle = String(chapter.title || `Chapitre ${chapterIndex + 1}`).trim();
      const chapterSection = {
        id: `generated-chapter-${chapterIndex + 1}`,
        number: chapterIndex + 1,
        title: chapterTitle,
        status: "planned",
        generated: false,
        content: "",
        objective: chapter.objective || "",
        children: (chapter.sections || []).map((section, sectionIndex) => ({
          id: `generated-chapter-${chapterIndex + 1}-section-${sectionIndex + 1}`,
          number: `${chapterIndex + 1}.${sectionIndex + 1}`,
          title: String(section.title || "").trim(),
          purpose: section.purpose || "",
          status: "planned",
          generated: false,
          content: "",
        })),
      };
      return [chapterSection];
    });
    const completedBlueprint = {
      ...blueprint,
      sections: generatedSections,
      researchPlan: generatedPlan,
      planStatus: "needs_review",
      workflow: blueprint.workflow.map((item) =>
        item.id === "plan" ? { ...item, status: "completed" } : item
      ),
    };

    sessionStorage.setItem(
      "macevo_scientific_blueprint",
      JSON.stringify(completedBlueprint)
    );

    const template = createBlueprintTemplate(completedBlueprint, report);

    navigate("/rapports/editeur/", {
      state: {
        report,
        blueprint: completedBlueprint,
        template,
        generationConfig,
        fromScientificGenerator: true,
        planStatus: "needs_review",
      },
    });
    setIsGeneratingPlan(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/rapports/document-vierge"
                  )
                }
                className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au document vierge
              </button>

              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Générateur scientifique MACEVO
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Préparer votre document scientifique
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    MACEVO transforme vos paramètres en un
                    blueprint scientifique structuré avant la
                    génération du contenu.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-400">
                    Document
                  </p>

                  <p className="mt-1 max-w-xs truncate font-semibold text-slate-800">
                    {report?.title ||
                      "Document sans titre"}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {academicLevel}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {discipline}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="mb-8 grid gap-3 md:grid-cols-3">
              {[
                {
                  id: 1,
                  title: "Recherche",
                  description:
                    "Définir la problématique et la méthodologie",
                  icon: Search,
                },
                {
                  id: 2,
                  title: "Structure",
                  description:
                    "Construire le plan scientifique",
                  icon: Layers3,
                },
                {
                  id: 3,
                  title: "Validation",
                  description:
                    "Vérifier les règles avant l'édition",
                  icon: ShieldCheck,
                },
              ].map((item) => {
                const Icon = item.icon;

                const active = step === item.id;
                const completed = step > item.id;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 transition ${
                      active
                        ? "border-blue-200 bg-blue-50"
                        : completed
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          active
                            ? "bg-blue-600 text-white"
                            : completed
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {completed ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.title}
                        </p>

                        <p className="text-xs text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
              {/* Main */}
              <section className="space-y-6">
                {step === 1 && (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-6 flex items-start gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Target className="h-5 w-5" />
                        </div>

                        <div>
                          <h2 className="text-lg font-bold text-slate-900">
                            Définir la recherche
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            Ces informations servent à déterminer
                            la logique scientifique du document.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <SelectField
                          label="Type de recherche"
                          value={researchType}
                          onChange={setResearchType}
                          options={RESEARCH_TYPES}
                        />

                        <SelectField
                          label="Spécialité"
                          value={specialization}
                          onChange={setSpecialization}
                          options={[
                            "",
                            ...profile.defaultSpecializations,
                          ].map((value) =>
                            value === ""
                              ? {
                                  value: "",
                                  label:
                                    "Sélectionner une spécialité",
                                }
                              : value
                          )}
                        />
                      </div>

                      <div className="mt-5 space-y-5">
                        <TextAreaField
                          label="Objectif principal"
                          value={researchObjective}
                          onChange={setResearchObjective}
                          placeholder="Ex. Analyser les facteurs qui influencent..."
                          rows={3}
                        />

                        <TextAreaField
                          label="Question de recherche"
                          value={researchQuestion}
                          onChange={setResearchQuestion}
                          placeholder="Ex. Dans quelle mesure..."
                          rows={3}
                        />

                        <TextAreaField
                          label="Hypothèses"
                          value={hypotheses}
                          onChange={setHypotheses}
                          placeholder="Présentez les hypothèses si votre étude en nécessite."
                          rows={3}
                        />

                        <TextAreaField
                          label="Méthodologie envisagée"
                          value={methodology}
                          onChange={setMethodology}
                          placeholder="Décrivez brièvement la méthode, les données, la population, les outils ou le protocole envisagé."
                          rows={5}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <div className="flex gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                        <div>
                          <p className="font-semibold text-amber-900">
                            Principe scientifique
                          </p>

                          <p className="mt-1 text-sm leading-6 text-amber-800">
                            MACEVO ne doit pas inventer les données,
                            statistiques, expériences ou observations
                            manquantes. Les éléments absents seront
                            identifiés comme informations à fournir
                            ou comme contenu nécessitant une source.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-6 flex items-start gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                          <Layers3 className="h-5 w-5" />
                        </div>

                        <div>
                          <h2 className="text-lg font-bold text-slate-900">
                            Architecture du document
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            Le plan est adapté à votre discipline,
                            votre niveau et votre type de recherche.
                          </p>
                        </div>
                      </div>

                      <p className="mb-4 rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-900">
                        {blueprint.length.developmentPageTarget
                          ? `Objectif de développement : ${blueprint.length.developmentPageTarget} pages. Répartition indicative, hors préliminaires et références ; elle sert à planifier la rédaction et ne représente pas le nombre de pages déjà rédigées.`
                          : "La longueur finale dépend des consignes de l’établissement et du contenu réellement documenté."}
                      </p>

                      <div className="space-y-3">
                        {blueprint.sections.map(
                          (section) => (
                            <SectionCard
                              key={section.id}
                              number={section.number}
                              title={section.title}
                            targetPages={section.targetPages}
                            />
                          )
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-5 flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />

                        <div>
                          <h3 className="font-bold text-slate-900">
                            Exigences méthodologiques
                          </h3>

                          <p className="text-xs text-slate-500">
                            Composants identifiés pour ce type
                            d'étude
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {researchRules.requires.map(
                          (item) => (
                            <span
                              key={item}
                              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                            >
                              {item}
                            </span>
                          )
                        )}
                      </div>

                      {researchRules.guidelines.length >
                        0 && (
                        <div className="mt-5 rounded-xl bg-blue-50 p-4">
                          <p className="text-sm font-semibold text-blue-900">
                            Référentiels à prendre en compte
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {researchRules.guidelines.map(
                              (guideline) => (
                                <span
                                  key={guideline}
                                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-700"
                                >
                                  {guideline}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-6 flex items-start gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <ShieldCheck className="h-5 w-5" />
                        </div>

                        <div>
                          <h2 className="text-lg font-bold text-slate-900">
                            Vérification du blueprint
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            Vérifiez les paramètres avant de passer
                            à l'éditeur scientifique.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <SummaryCard
                          icon={FileText}
                          label="Type"
                          value={
                            report?.report_type ||
                            "Mémoire"
                          }
                        />

                        <SummaryCard
                          icon={GraduationCap}
                          label="Niveau"
                          value={academicLevel}
                        />

                        <SummaryCard
                          icon={Microscope}
                          label="Domaine"
                          value={discipline}
                        />

                        <SummaryCard
                          icon={FlaskConical}
                          label="Recherche"
                          value={researchType}
                        />

                        <SummaryCard
                          icon={BookOpen}
                          label="Citation"
                          value={citationStyle}
                        />

                        <SummaryCard
                          icon={Table2}
                          label="Longueur"
                          value={
                            PAGE_OPTIONS.find(
                              (item) =>
                                item.value === targetPages
                            )?.label ||
                            targetPages
                          }
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="font-bold text-slate-900">
                        Éléments scientifiques
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Ces éléments seront disponibles dans
                        l'éditeur scientifique.
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {profile.scientificElements.map(
                          (element) => {
                            return (
                              <div
                                key={element}
                                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
                              >
                                <Check className="h-4 w-4 text-emerald-500" />

                                <span className="text-sm text-slate-700">
                                  {element}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                      <div className="flex gap-3">
                        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                        <div>
                          <p className="font-semibold text-blue-900">
                            Prêt pour l'étape suivante
                          </p>

                          <p className="mt-1 text-sm leading-6 text-blue-800">
                            Le blueprint sera transmis à l’éditeur comme plan de travail. La cible de pages répartit le volume souhaité entre les sections ; elle ne génère pas ce volume automatiquement. Les pages finales doivent s’appuyer sur votre sujet, vos sources et vos données réelles.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </section>

              {/* Sidebar */}
              <aside className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900">
                    Paramètres scientifiques
                  </h3>

                  <div className="mt-5 space-y-5">
                    <SelectField
                      label="Longueur souhaitée"
                      value={targetPages}
                      onChange={setTargetPages}
                      options={PAGE_OPTIONS}
                    />

                    <SelectField
                      label="Style bibliographique"
                      value={citationStyle}
                      onChange={setCitationStyle}
                      options={CITATION_STYLES}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900">
                    Éléments à générer
                  </h3>

                  <div className="mt-4 space-y-2">
                    {[
                      ["equations", "Équations"],
                      ["tables", "Tableaux"],
                      ["figures", "Figures"],
                      ["charts", "Graphiques"],
                      ["diagrams", "Schémas"],
                      ["images", "Images"],
                      ["citations", "Citations"],
                      ["references", "Références"],
                      ["code", "Code"],
                      ["algorithms", "Algorithmes"],
                      ["definitions", "Définitions"],
                      ["theorems", "Théorèmes"],
                      ["appendices", "Annexes"],
                    ].map(([key, label]) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={
                            Boolean(
                              selectedElements[key]
                            )
                          }
                          onChange={() =>
                            toggleElement(key)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />

                        <span className="text-sm text-slate-700">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 shrink-0 text-blue-600" />

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Niveau : {academicLevel}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {academicRules.complexity}
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            {/* Bottom actions */}
            <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  if (step > 1) {
                    setStep((previous) => previous - 1);
                  } else {
                    navigate(
                      "/rapports/document-vierge"
                    );
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                {step === 1 ? "Modifier le document" : "Précédent"}
              </button>

              <button
                type="button"
                onClick={handleContinue}
                disabled={isGeneratingPlan}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                {isGeneratingPlan
                  ? "Génération du plan…"
                  : step === 3
                  ? "Ouvrir l'éditeur scientifique"
                  : "Continuer"}

                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {generationError && (
              <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {generationError}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-slate-400">
            {label}
          </p>

          <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
