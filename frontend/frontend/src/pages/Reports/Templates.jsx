import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import api from "../../api/axios";
import {
  reportTemplates,
  getTemplateById,
  getTemplateDesign,
  ACADEMIC_LEVELS,
  DOCUMENT_LANGUAGES,
  CITATION_STYLES,
} from "../../config/reportTemplates";
import { COUNTRIES as COUNTRY_OPTIONS } from "../../config/reportCreationConfig";
import {
  createMacevoDocument,
  serializeMacevoDocument,
} from "../../core/document/macevoDocumentModel";
import { renderTemplateDocument } from "../../core/document/templateDocumentRenderer";
import { getRegionalPageFormat } from "../../services/internationalDocumentFactory";
import {
  createAcademicStandardsSnapshot,
  getAcademicStandardsGuidance,
} from "../../core/academic/academicStandards";
import {
  GraduationCap,
  Search,
  SlidersHorizontal,
  Heart,
  Sparkles,
  ArrowRight,
  X,
  Eye,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Languages,
  Palette,
  Quote,
} from "lucide-react";

/* ============================================================
   OUTILS GÉNÉRAUX & NORMALISATION INTERNATIONALE
============================================================ */
const labelFromValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return (
    value.label ||
    value.name ||
    value.title ||
    value.value ||
    value.id ||
    ""
  );
};

const valuesFromRegistry = (registry) => {
  if (!registry) return [];
  if (Array.isArray(registry)) {
    return registry.map(labelFromValue).filter(Boolean);
  }
  if (typeof registry === "object") {
    return Object.values(registry).map(labelFromValue).filter(Boolean);
  }
  return [];
};

const LEVEL_LABELS = {
  secondary: "Secondaire",
  undergraduate: "Premier cycle",
  licence: "Licence",
  bachelor: "Bachelor",
  master: "Master",
  doctorate: "Doctorat",
  postdoctorate: "Postdoctorat",
  professional: "Professionnel",
  research: "Recherche",
  other: "Autre",
};

const LANGUAGE_LABELS = {
  fr: "Français",
  en: "English",
  es: "Español",
  pt: "Português",
  de: "Deutsch",
  it: "Italiano",
  ar: "العربية",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
};

const CITATION_LABELS = {
  apa: "APA",
  ieee: "IEEE",
  vancouver: "Vancouver",
  chicago: "Chicago",
  harvard: "Harvard",
  mla: "MLA",
};

const FIELD_OPTIONS = [
  "Informatique",
  "Ingénierie",
  "Mathématiques",
  "Physique",
  "Chimie",
  "Biologie",
  "Médecine",
  "Pharmacie",
  "Économie",
  "Gestion",
  "Droit",
  "Sciences sociales",
  "Sciences humaines",
  "Éducation",
  "Sciences de l'environnement",
  "Agriculture",
  "Communication",
  "Toutes les disciplines",
];

const fieldSearchAliases = {
  Informatique: ["informatique", "computer", "software", "programming", "technologie", "technology", "technique"],
  Ingénierie: ["ingenierie", "engineering"],
  Mathématiques: ["mathematique", "mathématiques", "mathematics"],
  Physique: ["physique", "physics"],
  Chimie: ["chimie", "chemistry"],
  Biologie: ["biologie", "biology"],
  Médecine: ["médecine", "medicine"],
  Pharmacie: ["pharmacie", "pharmacy"],
  Économie: ["économie", "economics"],
  Gestion: ["gestion", "management"],
  Droit: ["droit", "law"],
  "Sciences sociales": ["sciences sociales", "social sciences"],
  "Sciences humaines": ["sciences humaines", "humanities"],
  Éducation: ["éducation", "education"],
  "Sciences de l'environnement": ["environnement", "environment"],
  Agriculture: ["agriculture"],
  Communication: ["communication"],
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getLevelLabel = (value) => {
  const raw = labelFromValue(value);
  return LEVEL_LABELS[raw] || raw;
};

const getLanguageLabel = (value) => {
  const raw = labelFromValue(value);
  return LANGUAGE_LABELS[raw] || raw;
};

const getCitationLabel = (value) => {
  const raw = labelFromValue(value);
  return CITATION_LABELS[raw] || raw;
};

const normalizeCategory = (category) => {
  const value = labelFromValue(category);
  const normalized = normalizeText(value);
  const map = {
    memoires: "Mémoires",
    "rapports de stage": "Rapports de stage",
    "articles scientifiques": "Articles scientifiques",
    "projets de fin detudes": "Projets de fin d'études",
    theses: "Thèses",
    autres: "Autres",
  };
  return map[normalized] || value || "Autres";
};

const getTemplateName = (template) =>
  template?.name || template?.label || template?.title || "Modèle académique international";

const getTemplateDescription = (template) =>
  template?.description || "Modèle académique professionnel complet de A à Z, personnalisable et conforme aux standards internationaux dans MACEVO.";

const getTemplateLevels = (template) => {
  const values = Array.isArray(template?.level)
    ? template.level
    : template?.level
    ? [template.level]
    : [];
  return values.map(getLevelLabel).filter(Boolean);
};

const getTemplateLevel = (template) => {
  if (template?.academicLevel) return getLevelLabel(template.academicLevel);
  return getTemplateLevels(template).join("/") || "Tous les niveaux";
};

const getTemplateLanguages = (template) => {
  const values = Array.isArray(template?.language)
    ? template.language
    : template?.language
    ? [template.language]
    : [];
  return values.map(getLanguageLabel).filter(Boolean);
};

const getTemplateLanguage = (template) =>
  getTemplateLanguages(template).join("/") || "Français";

const getTemplateTags = (template) =>
  Array.isArray(template?.tags) ? template.tags.map(labelFromValue).filter(Boolean) : [];

const getTemplateFields = (template) => {
  if (Array.isArray(template?.fields)) {
    return template.fields.map(labelFromValue).filter(Boolean);
  }
  if (template?.field) {
    return [labelFromValue(template.field)].filter(Boolean);
  }
  if (template?.discipline) {
    return [labelFromValue(template.discipline)].filter(Boolean);
  }
  return [];
};

const getTemplateCitationStyle = (template) =>
  getCitationLabel(template?.citationStyle || template?.citation) || "APA";

const getDesignName = (template) => {
  if (!template) return "Standard";
  if (typeof template.design === "string") return getTemplateDesign(template)?.name || template.design;
  const design = getTemplateDesign(template);
  return design?.name || template.design?.label || template.design?.id || "Standard";
};

const getDesignColors = (template) => {
  const design = getTemplateDesign(template) || {};
  return {
    primary: design.primary || design.headingColor || "#1f3b57",
    secondary: design.secondary || design.coverBackground || "#f1f5f9",
    accent: design.accent || design.accentColor || "#52718d",
  };
};

function createTemplateMacevoDocument(template, profile = {}) {
  const templateName = getTemplateName(template);
  const templateCategory = normalizeCategory(template.category);
  const fields = getTemplateFields(template);
  const level = getTemplateLevel(template);
  const language = getTemplateLanguage(template);
  const citationStyle = getTemplateCitationStyle(template);
  const country = profile.country || template.academicContext?.country || "";
  const countryName = profile.countryName || country;
  const registryDesign = getTemplateDesign(template) || {};
  const templateWithProfile = {
    ...template,
    academicContext: {
      ...(template.academicContext || {}),
      country: countryName,
      institution: profile.institution || template.academicContext?.institution || "",
      faculty: profile.faculty || template.academicContext?.faculty || "",
      department: profile.department || template.academicContext?.department || "",
      program: profile.program || template.academicContext?.program || "",
    },
    documentRules: {
      ...(template.documentRules || {}),
      institutionalRequirements: profile.institutionalRequirements || "",
      institutionalRequirementsSource: profile.institutionalRequirementsSource || "",
      academicStandards: createAcademicStandardsSnapshot({
        countryCode: profile.country,
        countryName,
        institution: profile.institution,
        requirements: profile.institutionalRequirements,
        sourceUrl: profile.institutionalRequirementsSource,
        pageFormat: profile.pageFormat || getRegionalPageFormat(country),
      }),
      otherRequirements: profile.otherRequirements || "",
      formattingNotice: "Le format régional est une proposition. Les consignes officielles de l'établissement prévalent.",
    },
    design: {
      id: typeof template.design === "string" ? template.design : registryDesign.id,
      page: {
        size: profile.pageFormat || getRegionalPageFormat(country),
        orientation: "portrait",
        margins: { top: 25, right: 25, bottom: 25, left: 25 },
      },
      typography: {
        bodyFont: registryDesign.fontFamily || "Arial, sans-serif",
        bodySize: registryDesign.bodyFontSize || 12,
        lineHeight: registryDesign.lineSpacing || 1.5,
        headingFont: registryDesign.headingFontFamily || registryDesign.fontFamily || "Arial, sans-serif",
      },
      colors: {
        primary: registryDesign.headingColor || "#243B53",
        secondary: registryDesign.secondary || registryDesign.coverBackground || "#F1F5F9",
        accent: registryDesign.accentColor || "#2C7A7B",
        text: "#202124",
        muted: "#64748B",
        border: "#CBD5E1",
      },
      cover: { showLogo: true, showBadge: true, showAccentLine: true },
    },
  };

  return createMacevoDocument(templateWithProfile, {
    metadata: {
      title: templateName,
      description: getTemplateDescription(template),
      templateId: template.id,
      templateName,
      templateCategory,
      reportType: template.type || template.id,
      academicLevel: level,
      language,
      citationStyle,
      country: countryName,
      institution: templateWithProfile.academicContext.institution,
      faculty: templateWithProfile.academicContext.faculty,
      department: templateWithProfile.academicContext.department,
      program: templateWithProfile.academicContext.program,
      supervisor: profile.supervisor || "",
      academicYear: profile.academicYear || "",
      scientificField: fields[0] || "",
      academicProfileId: template.academicProfileId || null,
      minimumBodyPages: template.minimumBodyPages || 30,
      minimumBodyWords: template.minimumBodyWords || 8000,
    },
    academicContext: {
      ...templateWithProfile.academicContext,
    },
  });
}

/* ============================================================
   STRUCTURE COMPLÈTE DE A À Z (ZÉRO RÉSUMÉ)
============================================================ */
const flattenStructure = (nodes, result = []) => {
  if (!nodes) return result;
  if (Array.isArray(nodes)) {
    nodes.forEach((node) => {
      if (typeof node === "string") {
        result.push(node);
        return;
      }
      if (!node || typeof node !== "object") return;
      const title = node.title || node.name || node.label;
      if (title) {
        result.push(title);
      }
      if (node.sections) flattenStructure(node.sections, result);
      if (node.chapters) flattenStructure(node.chapters, result);
      if (node.subsections) flattenStructure(node.subsections, result);
      if (node.children) flattenStructure(node.children, result);
    });
  } else if (typeof nodes === "object") {
    const title = nodes.title || nodes.name || nodes.label;
    if (title) result.push(title);
    if (nodes.sections) flattenStructure(nodes.sections, result);
    if (nodes.chapters) flattenStructure(nodes.chapters, result);
    if (nodes.children) flattenStructure(nodes.children, result);
  }
  return result;
};

const getStructureLabels = (template) => flattenStructure(template?.structure || []);

const getPageEstimate = (template) => {
  const minimum = Number(
    template?.minimumBodyPages ||
    template?.contentArchitecture?.minimumBodyPages ||
    template?.documentRules?.minimumBodyPages ||
    30
  );
  return `Volume cible indicatif : ${minimum} pages`;
};

const getSearchableTemplateText = (template) => {
  return [
    getTemplateName(template),
    getTemplateDescription(template),
    normalizeCategory(template?.category),
    template?.type,
    ...getTemplateLevels(template),
    ...getTemplateLanguages(template),
    getTemplateCitationStyle(template),
    ...getTemplateTags(template),
    ...getTemplateFields(template),
  ]
    .filter(Boolean)
    .join(" ");
};

/* ============================================================
   COMPOSANT APERÇU CARTE
============================================================ */
function DocumentPreview({ template }) {
  const design = getDesignColors(template);
  const category = normalizeCategory(template?.category);
  const renderedDocument = useMemo(() => {
    const document = createTemplateMacevoDocument(template);
    return renderTemplateDocument(document, template);
  }, [template]);

  return (
    <div
      className="relative h-[280px] w-full overflow-hidden rounded-2xl border bg-white shadow-inner"
      style={{ borderColor: design.accent }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/2 w-[794px] origin-top"
          style={{ transform: "translateX(-50%) scale(0.35)" }}
          dangerouslySetInnerHTML={{ __html: renderedDocument }}
        />
      </div>
      <div
        className="absolute bottom-2 left-2 rounded px-2 py-1 text-[9px] font-bold shadow-sm"
        style={{ color: design.primary, backgroundColor: design.secondary }}
      >
        {category}
      </div>
    </div>
  );
}

/* ============================================================
   APERÇU DÉTAILLÉ DU DOCUMENT (INTÉGRAL DE A À Z)
============================================================ */
function DocumentPagePreview({ template, document }) {
  const canonicalDocument = useMemo(() => {
    if (!template) return null;
    try {
      return document || createTemplateMacevoDocument(template);
    } catch (error) {
      console.warn("MACEVO: impossible de construire l'aperçu canonique.", error);
      return null;
    }
  }, [template, document]);

  const renderedDocument = useMemo(() => {
    if (!canonicalDocument) return "";
    try {
      return renderTemplateDocument(canonicalDocument, template);
    } catch (error) {
      console.warn("MACEVO: impossible de rendre l'aperçu canonique.", error);
      return "";
    }
  }, [canonicalDocument, template]);

  if (!renderedDocument) {
    return (
      <div className="mx-auto w-full max-w-[900px] min-h-[900px] bg-white text-slate-900 shadow-xl rounded-sm p-10 md:p-14">
        <div className="text-center text-sm text-slate-500">
          Aperçu temporairement indisponible.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[900px] overflow-x-auto rounded-sm bg-slate-200 shadow-xl">
      <div
        className="min-h-[900px] bg-white text-slate-900"
        dangerouslySetInnerHTML={{ __html: renderedDocument }}
      />
    </div>
  );
}

/* ============================================================
   PAGE PRINCIPALE
============================================================ */
export default function Templates() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("Tous");
  const [sortBy, setSortBy] = useState("Les plus populaires");
  const [selectedLevel, setSelectedLevel] = useState("Tous les niveaux");
  const [selectedField, setSelectedField] = useState("Toutes les disciplines");
  const [selectedLanguage, setSelectedLanguage] = useState("Toutes les langues");
  const [selectedCitation, setSelectedCitation] = useState("Toutes les normes");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedDesign, setSelectedDesign] = useState("Tous les styles");
  const [favorites, setFavorites] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [contextCountry, setContextCountry] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [contextInstitution, setContextInstitution] = useState("");
  const [institutionalRequirements, setInstitutionalRequirements] = useState("");
  const [institutionalRequirementsSource, setInstitutionalRequirementsSource] = useState("");
  const effectiveCountry = contextCountry === "other" ? customCountry.trim() : contextCountry;
  const countryName = contextCountry === "other"
    ? customCountry.trim()
    : COUNTRY_OPTIONS.find((option) => option.value === contextCountry)?.label || effectiveCountry;
  const documentContext = useMemo(() => ({
    country: effectiveCountry,
    countryName,
    institution: contextInstitution,
    institutionalRequirements,
    institutionalRequirementsSource,
  }), [effectiveCountry, countryName, contextInstitution, institutionalRequirements, institutionalRequirementsSource]);
  const previewDocument = useMemo(
    () => selectedTemplate ? createTemplateMacevoDocument(selectedTemplate, documentContext) : null,
    [selectedTemplate, documentContext]
  );

  const categories = useMemo(() => {
    const counts = {};
    reportTemplates.forEach((template) => {
      const category = normalizeCategory(template.category);
      counts[category] = (counts[category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, []);

  const tabs = useMemo(() => ["Tous", ...categories.map((item) => item.name)], [categories]);

  const levelOptions = useMemo(() => {
    const values = valuesFromRegistry(ACADEMIC_LEVELS);
    return ["Tous les niveaux", ...values.map(getLevelLabel)];
  }, []);

  const levelCounts = useMemo(() => Object.fromEntries(
    levelOptions.slice(1).map((level) => [
      level,
      reportTemplates.filter((template) => getTemplateLevels(template).some((value) => normalizeText(value) === normalizeText(level))).length,
    ])
  ), [levelOptions]);

  const fieldOptions = useMemo(() => FIELD_OPTIONS, []);

  const languageOptions = useMemo(() => {
    const values = valuesFromRegistry(DOCUMENT_LANGUAGES);
    return ["Toutes les langues", ...values.map(getLanguageLabel)];
  }, []);

  const citationOptions = useMemo(() => {
    const values = valuesFromRegistry(CITATION_STYLES);
    return ["Toutes les normes", ...values.map(getCitationLabel)];
  }, []);

  const designOptions = useMemo(() => [
    "Tous les styles",
    ...Array.from(new Set(reportTemplates.map(getDesignName))),
  ], []);

  const filteredTemplates = useMemo(() => {
    let result = [...reportTemplates];
    const query = normalizeText(searchQuery);

    result = result.filter((template) => {
      const searchableText = normalizeText(getSearchableTemplateText(template));
      const category = normalizeCategory(template.category);
      const levels = getTemplateLevels(template);
      const languages = getTemplateLanguages(template);
      const citation = getTemplateCitationStyle(template);

      const matchesSearch = !query || searchableText.includes(query);
      const matchesCategory = selectedTab === "Tous" || category === selectedTab;
      const matchesLevel =
        selectedLevel === "Tous les niveaux" ||
        levels.some((level) => normalizeText(level) === normalizeText(selectedLevel));
      const matchesLanguage =
        selectedLanguage === "Toutes les langues" ||
        languages.some((language) => normalizeText(language) === normalizeText(selectedLanguage));
      const matchesCitation =
        selectedCitation === "Toutes les normes" ||
        normalizeText(citation) === normalizeText(selectedCitation);
      const templateCountry = template.countryCode || template.academicContext?.countryCode || template.country || template.academicContext?.country || "";
      const selectedCountryLabel = COUNTRY_OPTIONS.find((option) => option.value === selectedCountry)?.label || selectedCountry;
      const matchesCountry = !selectedCountry || !templateCountry ||
        normalizeText(templateCountry) === normalizeText(selectedCountry) ||
        normalizeText(templateCountry) === normalizeText(selectedCountryLabel);
      const matchesDesign = selectedDesign === "Tous les styles" || getDesignName(template) === selectedDesign;

      let matchesField = selectedField === "Toutes les disciplines";
      if (!matchesField) {
        const aliases = fieldSearchAliases[selectedField] || [selectedField];
        matchesField = aliases.some((alias) => searchableText.includes(normalizeText(alias)));
      }

      return matchesSearch && matchesCategory && matchesLevel && matchesField && matchesLanguage && matchesCitation && matchesCountry && matchesDesign;
    });

    if (sortBy === "Les plus populaires") {
      result.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    } else if (sortBy === "Récents") {
      result.sort((a, b) => String(b.version || "").localeCompare(String(a.version || "")));
    } else if (sortBy === "Structure") {
      result.sort((a, b) => getStructureLabels(b).length - getStructureLabels(a).length);
    }

    return result;
  }, [searchQuery, selectedTab, selectedLevel, selectedField, selectedLanguage, selectedCitation, selectedCountry, selectedDesign, sortBy]);

  const toggleFavorite = (id, event) => {
    event.stopPropagation();
    setFavorites((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedTab("Tous");
    setSelectedLevel("Tous les niveaux");
    setSelectedField("Toutes les disciplines");
    setSelectedLanguage("Toutes les langues");
    setSelectedCitation("Toutes les normes");
    setSelectedCountry("");
    setSelectedDesign("Tous les styles");
    setSortBy("Les plus populaires");
  };

  /* ============================================================
     GÉNÉRATION ET OUVERTURE DU DOCUMENT COMPLET DE A À Z
  ============================================================ */
  const handleUseTemplate = async (template, existingDocument = null) => {
    if (isCreating || !template?.id) return;
    setIsCreating(true);

    try {
      const centralTemplate = getTemplateById(template.id) || template;
      const templateName = getTemplateName(centralTemplate);
      const templateCategory = normalizeCategory(centralTemplate.category);
      const fields = getTemplateFields(centralTemplate);
      const level = getTemplateLevel(centralTemplate);
      const language = getTemplateLanguage(centralTemplate);
      const citationStyle = getTemplateCitationStyle(centralTemplate);

      const profile = selectedTemplate?.id === centralTemplate.id ? documentContext : {};
      const macevoDocument = existingDocument || createTemplateMacevoDocument(centralTemplate, profile);
      const snapshot = macevoDocument.template?.snapshot || centralTemplate;

      const serializedDocument = serializeMacevoDocument(macevoDocument);

      const response = await api.post("reports/", {
        title: templateName,
        report_type: centralTemplate.type || centralTemplate.id,
        summary: getTemplateDescription(centralTemplate),
        status: "En cours",
        author: "Utilisateur MACEVO International",
        country: macevoDocument.academicContext?.country || "",
        institution: macevoDocument.academicContext?.institution || "",
        faculty: macevoDocument.academicContext?.faculty || "",
        department: macevoDocument.academicContext?.department || "",
        supervisor: macevoDocument.metadata?.supervisor || "",
        academic_year: String(new Date().getFullYear()),
        template_key: centralTemplate.id,
        scientific_field: fields[0] || "",
        academic_level: centralTemplate.academicLevel || level,
        language,
        citation_style: citationStyle,
        institutional_requirements: institutionalRequirements,
        other_requirements: profile.otherRequirements || "",
        structure: snapshot.structure || centralTemplate.structure,
        // Compatibilité avec le backend historique : le champ content
        // reçoit toujours le HTML éditorial, jamais le JSON du modèle.
        content: renderTemplateDocument(macevoDocument, centralTemplate),
        // Source canonique du document. Le backend doit conserver cet objet.
        macevo_document: serializedDocument,
      });

      const reportId = response?.data?.id ?? response?.data?.pk ?? response?.data?.report_id ?? null;

      if (reportId === null || reportId === undefined) {
        throw new Error("Le serveur n'a pas retourné l'identifiant du rapport créé.");
      }

      const design = getDesignColors(centralTemplate);
      const currentReport = {
        reportId,
        templateId: centralTemplate.id,
        templateName,
        templateCategory,
        templateStyle: getDesignName(centralTemplate),
        template: { ...snapshot },
        macevoDocument,
        documentModelVersion: macevoDocument.modelVersion,
        design,
      };

      sessionStorage.setItem("macevo_current_report", JSON.stringify(currentReport));
      sessionStorage.setItem("macevo_template_needs_initialization", "true");

      navigate(`/rapports/editeur/${reportId}`);
    } catch (error) {
      console.error("MACEVO Erreur lors de la création du document:", error);
      const serverErrors = error?.response?.data ? JSON.stringify(error.response.data, null, 2) : error?.message || "Erreur inconnue.";
      alert(`Erreur lors de la création du rapport:\n\n${serverErrors}`);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedSections = getStructureLabels(selectedTemplate);
  const selectedTemplateDesign = selectedTemplate ? getDesignColors(selectedTemplate) : null;
  // Le renderer canonique produit le document complet. On ne simule plus une
  // pagination en transformant chaque élément de structure en "page".
  const safePreviewPage = 1;

  return (
    <div className="macevo-premium-canvas flex h-screen text-slate-900 dark:text-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="mx-auto max-w-[1600px] space-y-7 pb-20">
            <section className="rounded-[28px] border border-indigo-100 bg-[#eeedff] px-6 py-7 dark:border-indigo-900/60 dark:bg-[#191a31] md:px-9 md:py-9">
              <div className="mx-auto max-w-3xl text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-3 py-1.5 text-[10px] font-bold tracking-[.12em] text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"><Sparkles size={13} /> BIBLIOTH&Egrave;QUE MACEVO</span>
                <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl">Trouvez le mod&egrave;le de votre recherche</h1>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Parcourez les structures de m&eacute;moires, th&egrave;ses et rapports, puis adaptez-les aux consignes de votre &eacute;tablissement.</p>
                <div className="relative mt-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                  <input type="search" aria-label="Rechercher un mod&egrave;le" placeholder="Ex. m&eacute;moire en informatique, th&egrave;se en biologie..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="w-full rounded-2xl border border-white bg-white py-4 pl-12 pr-4 text-sm text-slate-900 shadow-md shadow-indigo-900/5 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-200/60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-950" />
                </div>
                <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{filteredTemplates.length} mod&egrave;le{filteredTemplates.length > 1 ? "s" : ""} disponible{filteredTemplates.length > 1 ? "s" : ""}</span>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">Trier par
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      <option>Les plus populaires</option><option>R&eacute;cents</option><option>Structure</option>
                    </select>
                  </label>
                </div>
              </div>
            </section>

            <section aria-label="Parcourir les modèles par niveau" className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xs font-bold uppercase tracking-[.12em] text-slate-500 dark:text-slate-400">Parcourir par niveau</h2>
                <span className="text-[11px] text-slate-400">{levelOptions.length - 1} niveaux</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {levelOptions.map((level) => {
                  const isAllLevels = level === "Tous les niveaux";
                  const count = isAllLevels ? reportTemplates.length : levelCounts[level] || 0;
                  return <button key={level} onClick={() => setSelectedLevel(level)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${selectedLevel === level ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}>
                    <span>{level}</span><span className={`rounded-md px-1.5 py-0.5 text-[10px] ${selectedLevel === level ? "bg-white/15 dark:bg-slate-200" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{count}</span>
                  </button>;
                })}
              </div>
            </section>

            {/* ONGLETS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedTab === tab
                      ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                      : "border border-slate-200 bg-white/75 text-slate-600 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* CONTENU & GRILLE */}
            <div className="flex flex-col-reverse gap-6">
              <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template) => {
                    const name = getTemplateName(template);
                    const fields = getTemplateFields(template);
                    return (
                      <div
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template);
                        }}
                        className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="space-y-4">
                          <div className="relative">
                            <button
                              onClick={(event) => toggleFavorite(template.id, event)}
                              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur flex items-center justify-center text-slate-500 hover:text-rose-500 shadow-md transition"
                            >
                              <Heart size={16} className={favorites[template.id] ? "fill-rose-500 text-rose-500" : ""} />
                            </button>
                            <DocumentPreview template={template} />
                            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-3 px-1 font-medium">
                              <span>{getPageEstimate(template)}</span>
                              <span className="font-semibold" style={{ color: getDesignColors(template).primary }}>
                                {getDesignName(template)}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2 pt-1">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                              {getTemplateDescription(template)}
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              <span className="text-[9px] px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
                                {getTemplateLevel(template)}
                              </span>
                              <span className="text-[9px] px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
                                Cible {Number(template?.minimumBodyPages || 30)} p.
                              </span>
                              <span className="text-[9px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {getTemplateLanguage(template)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {(fields.length > 0 ? fields : getTemplateTags(template)).slice(0, 2).map((field) => (
                                <span
                                  key={field}
                                  className="text-[9px] px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-300"
                                >
                                  {field}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="mt-6 grid grid-cols-2 gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedTemplate(template);
                                }}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold py-3 rounded-2xl transition flex items-center justify-center gap-2"
                          >
                            <Eye size={15} />
                            Aperçu
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleUseTemplate(template);
                            }}
                            disabled={isCreating}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold py-3 rounded-2xl transition shadow-sm flex items-center justify-center gap-2"
                          >
                            {isCreating ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                            Utiliser
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-24 text-center">
                    <Search size={35} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Aucun modèle trouvé</p>
                    <button onClick={resetFilters} className="mt-4 text-xs text-blue-600 hover:underline font-semibold">
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}
              </div>

              {/* FILTRES LATÉRAUX */}
              <div className="w-full space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                      <SlidersHorizontal size={16} className="text-blue-600" />
                      Affiner les mod&egrave;les
                    </span>
                    <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline font-semibold">
                      Réinitialiser
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Style de présentation</label>
                      <select value={selectedDesign} onChange={(event) => setSelectedDesign(event.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs">
                        {designOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Discipline / Domaine</label>
                      <select
                        value={selectedField}
                        onChange={(event) => setSelectedField(event.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs"
                      >
                        {fieldOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Langue</label>
                      <select
                        value={selectedLanguage}
                        onChange={(event) => setSelectedLanguage(event.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs"
                      >
                        {languageOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pays</label>
                      <select value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs">
                        <option value="">Tous les pays</option>
                        {COUNTRY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Norme bibliographique</label>
                      <select
                        value={selectedCitation}
                        onChange={(event) => setSelectedCitation(event.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs"
                      >
                        {citationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL APERÇU DE A À Z */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[1500px] max-h-[95vh] overflow-hidden bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
                  <CheckCircle2 size={12} />
                  APERÇU DU MODÈLE CANONIQUE
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">{getTemplateName(selectedTemplate)}</h2>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_330px] gap-6">
                <aside className="hidden xl:block max-h-[70vh] overflow-y-auto pr-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers3 size={16} className="text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Structure Intégrale</h4>
                  </div>
                  <div className="space-y-1.5">
                    {selectedSections.length > 0 ? (
                      selectedSections.map((section, index) => (
                        <button
                          key={`${section}-${index}`}
                          onClick={() => { /* navigation structure future: renderer unique */ }}
                          className={`w-full text-left flex items-start gap-2 p-2 rounded-xl transition ${
                            safePreviewPage === index + 1 ? "bg-blue-50 dark:bg-blue-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-900"
                          }`}
                        >
                          <span
                            className="w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[9px] font-bold"
                            style={{ color: selectedTemplateDesign.primary, backgroundColor: selectedTemplateDesign.secondary }}
                          >
                            {index + 1}
                          </span>
                          <span className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">{section}</span>
                        </button>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400">Structure personnalisable</div>
                    )}
                  </div>
                </aside>

                <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 md:p-6 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <button
                      disabled
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold disabled:opacity-30"
                    >
                      <ChevronLeft size={15} className="inline" /> Précédente
                    </button>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-300">
                      Document complet · rendu canonique
                    </div>
                    <button
                      disabled
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold disabled:opacity-30"
                    >
                      Suivante <ChevronRight size={15} className="inline" />
                    </button>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto px-1 md:px-3">
                    <DocumentPagePreview template={selectedTemplate} document={previewDocument} />
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{getTemplateName(selectedTemplate)}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                      {getTemplateDescription(selectedTemplate)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                    <strong>Scénario de démonstration</strong>
                    <p className="mt-1">Les textes d’exemple et les valeurs des graphiques illustrent la structure du modèle. Ils ne constituent pas des résultats vérifiés d’une recherche réelle.</p>
                  </div>
                  {selectedTemplate.reportingGuidelines?.length > 0 && (
                    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Guide de rapport applicable</h4>
                      {selectedTemplate.reportingGuidelines.map((guide) => (
                        <a key={guide.id} href={guide.url} target="_blank" rel="noreferrer" className="mt-2 block text-xs font-semibold text-blue-700 underline dark:text-blue-300">
                          {guide.title}
                          <span className="mt-1 block font-normal no-underline text-slate-500 dark:text-slate-400">{guide.applicability}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Pays
                      <select
                        value={contextCountry}
                        onChange={(event) => setContextCountry(event.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <option value="">Sans préférence régionale</option>
                        {COUNTRY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    {contextCountry === "other" && (
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Nom du pays
                        <input
                          value={customCountry}
                          onChange={(event) => setCustomCountry(event.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        />
                      </label>
                    )}
                    <div className="text-[11px] text-slate-500">
                      Format de page proposé : {getRegionalPageFormat(effectiveCountry)}. Les consignes officielles de l’établissement restent prioritaires.
                    </div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Université / établissement
                      <input
                        value={contextInstitution}
                        onChange={(event) => setContextInstitution(event.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Exigences institutionnelles
                      <textarea
                        value={institutionalRequirements}
                        onChange={(event) => setInstitutionalRequirements(event.target.value)}
                        rows={3}
                        placeholder="Ordre des parties, marges, police, pagination..."
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Lien vers les consignes officielles
                      <input type="url" value={institutionalRequirementsSource} onChange={(event) => setInstitutionalRequirementsSource(event.target.value)} placeholder="https://..." className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    </label>
                    <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {getAcademicStandardsGuidance(effectiveCountry, contextInstitution, institutionalRequirements, institutionalRequirementsSource)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <GraduationCap size={13} /> Niveau
                      </div>
                      <div className="text-xs font-semibold mt-2">{getTemplateLevel(selectedTemplate)}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Languages size={13} /> Langue
                      </div>
                      <div className="text-xs font-semibold mt-2">{getTemplateLanguage(selectedTemplate)}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Palette size={13} /> Design
                      </div>
                      <div className="text-xs font-semibold mt-2">{getDesignName(selectedTemplate)}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Quote size={13} /> Norme
                      </div>
                      <div className="text-xs font-semibold mt-2">{getTemplateCitationStyle(selectedTemplate)}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUseTemplate(selectedTemplate, previewDocument)}
                    disabled={isCreating}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3.5 rounded-2xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 size={17} className="animate-spin" /> Création du document complet...
                      </>
                    ) : (
                      <>
                        <ArrowRight size={17} /> Utiliser ce modèle (A - Z)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
