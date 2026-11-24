import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  BookOpen,
  GraduationCap,
  FlaskConical,
  Layers3,
  Settings2,
  Palette,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  ArrowRight,
  Eye,
  Table2,
  Image as ImageIcon,
  Sigma,
  Quote,
  Library,
  Code2,
  Workflow,
  Paperclip,
  Save,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import api from "../../api/axios";
import {
  COUNTRIES,
  LANGUAGES as INTERNATIONAL_LANGUAGES,
} from "../../config/reportCreationConfig";
import { createInternationalDocument, getRegionalPageFormat } from "../../services/internationalDocumentFactory";
import { getAcademicStandardsGuidance } from "../../core/academic/academicStandards";

/* ============================================================
   DONNÉES DE CONFIGURATION
============================================================ */

const REPORT_TYPES = [
  "Document libre",
  "Mémoire de Licence",
  "Mémoire de Master",
  "Thèse",
  "Rapport de stage",
  "Projet de Fin d'Études",
  "Rapport technique",
  "Article scientifique",
  "Étude de cas",
  "Note de cours",
  "Autre",
];

const DISCIPLINES = [
  "Informatique",
  "Médecine",
  "Pharmacie",
  "Biologie",
  "Chimie",
  "Physique",
  "Mathématiques",
  "Sciences de l'ingénieur",
  "Sciences économiques",
  "Gestion",
  "Droit",
  "Sciences sociales",
  "Sciences politiques",
  "Agronomie",
  "Environnement",
  "Architecture",
  "Autre",
];

const ACADEMIC_LEVELS = [
  "Licence",
  "Master",
  "Doctorat",
  "Formation professionnelle",
  "Autre",
];

const LANGUAGES = INTERNATIONAL_LANGUAGES;

const LAYOUTS = [
  {
    id: "standard",
    title: "Standard",
    description: "Présentation claire et sobre.",
  },
  {
    id: "academique",
    title: "Académique",
    description: "Structure adaptée aux travaux universitaires.",
  },
  {
    id: "moderne",
    title: "Moderne",
    description: "Présentation scientifique contemporaine.",
  },
];

const RESEARCH_TYPES = [
  "Recherche bibliographique",
  "Recherche expérimentale",
  "Recherche clinique",
  "Recherche observationnelle",
  "Recherche qualitative",
  "Recherche quantitative",
  "Recherche mixte",
  "Étude de cas",
  "Revue systématique",
  "Projet technique",
  "Autre",
];

const CITATION_STYLES = [
  "APA 7",
  "Vancouver",
  "IEEE",
  "Chicago",
  "Harvard",
  "MLA",
  "À définir",
];

const PAGE_OPTIONS = [
  { value: "10", label: "10 pages environ" },
  { value: "20", label: "20 pages environ" },
  { value: "30", label: "30 pages environ" },
  { value: "40", label: "40 pages environ" },
  { value: "50", label: "50 pages environ" },
];

const SCIENTIFIC_ELEMENTS = [
  {
    id: "equations",
    label: "Équations",
    description: "Formules et expressions mathématiques.",
    icon: Sigma,
  },
  {
    id: "tables",
    label: "Tableaux",
    description: "Tableaux scientifiques structurés.",
    icon: Table2,
  },
  {
    id: "figures",
    label: "Figures",
    description: "Illustrations et graphiques.",
    icon: ImageIcon,
  },
  {
    id: "citations",
    label: "Citations",
    description: "Citations et références bibliographiques.",
    icon: Quote,
  },
  {
    id: "references",
    label: "Références",
    description: "Bibliographie structurée.",
    icon: Library,
  },
  {
    id: "algorithms",
    label: "Algorithmes",
    description: "Pseudo-code et algorithmes.",
    icon: Code2,
  },
  {
    id: "schemas",
    label: "Schémas",
    description: "Schémas et représentations conceptuelles.",
    icon: Workflow,
  },
  {
    id: "annexes",
    label: "Annexes",
    description: "Documents et éléments complémentaires.",
    icon: Paperclip,
  },
];

/* ============================================================
   STRUCTURES SCIENTIFIQUES
============================================================ */

/* ============================================================
   UTILITAIRES
============================================================ */

function getAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 9) {
    return `${year}-${year + 1}`;
  }

  return `${year - 1}-${year}`;
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeTitle(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isIntroductionTitle(title = "") {
  const normalized = normalizeTitle(title);

  return (
    normalized === "introduction" ||
    normalized === "introduction generale" ||
    normalized.startsWith("introduction generale")
  );
}

function isConclusionTitle(title = "") {
  const normalized = normalizeTitle(title);

  return (
    normalized === "conclusion" ||
    normalized === "conclusion generale" ||
    normalized.startsWith("conclusion generale") ||
    normalized.startsWith("synthese generale")
  );
}

/* ============================================================
   GÉNÉRATION DU DOCUMENT INITIAL
============================================================ */

function createSectionHtml(title, index, scientificProfile = {}) {
  const safeTitle = escapeHtml(title);
  const sectionNumber = index + 1;

  const researchQuestion =
    scientificProfile.researchQuestion?.trim() ||
    "La question de recherche sera précisée dans cette section.";

  const objective =
    scientificProfile.objective?.trim() ||
    "Les objectifs spécifiques seront détaillés en fonction du sujet étudié.";

  const methodology =
    scientificProfile.methodology?.trim() ||
    "La méthodologie sera précisée selon le type de recherche, le domaine scientifique et les données disponibles.";

  const normalized = normalizeTitle(title);

  let content = `
    <h1>${safeTitle}</h1>

    <p>
      Cette partie du document présente les éléments scientifiques nécessaires
      à l'étude du sujet. Le contenu définitif doit être développé à partir
      des données, sources et informations réellement disponibles.
    </p>
  `;

  if (normalized.includes("cadre") || normalized.includes("revue")) {
    content += `
      <h2>Présentation du cadre scientifique</h2>
      <p>
        Cette section est destinée à présenter les concepts fondamentaux,
        les travaux antérieurs et les connaissances scientifiques nécessaires
        à la compréhension du sujet.
      </p>

      <h2>État des connaissances</h2>
      <p>
        ${escapeHtml(
          "Les résultats de la recherche bibliographique devront être présentés ici, avec des citations vérifiables et des références correspondant réellement aux sources consultées."
        )}
      </p>

      <div class="scientific-placeholder">
        <strong>Zone scientifique à compléter</strong>
        <span>
          Ajouter ici les références, tableaux de synthèse, figures conceptuelles
          ou autres éléments nécessaires.
        </span>
      </div>
    `;
  } else if (
    normalized.includes("methodologie") ||
    normalized.includes("methodologie")
  ) {
    content += `
      <h2>Approche méthodologique</h2>
      <p>
        ${escapeHtml(methodology)}
      </p>

      <h2>Question de recherche</h2>
      <p>
        ${escapeHtml(researchQuestion)}
      </p>

      <h2>Objectifs de l'étude</h2>
      <p>
        ${escapeHtml(objective)}
      </p>

      <div class="scientific-placeholder">
        <strong>Éléments méthodologiques à compléter</strong>
        <span>
          Décrire précisément la population, les matériaux, les outils,
          les méthodes de collecte et les méthodes d'analyse réellement utilisés.
        </span>
      </div>
    `;
  } else if (
    normalized.includes("resultat") ||
    normalized.includes("analyse")
  ) {
    content += `
      <h2>Présentation des résultats</h2>
      <p>
        Cette section devra présenter uniquement les résultats effectivement
        obtenus à partir des données disponibles.
      </p>

      <div class="scientific-placeholder">
        <strong>Zone réservée aux résultats</strong>
        <span>
          Aucun résultat fictif n'est généré automatiquement par MACEVO.
          Les données réelles pourront être insérées dans l'éditeur.
        </span>
      </div>

      <h2>Analyse des résultats</h2>
      <p>
        L'analyse devra être construite à partir des résultats réellement
        observés et des méthodes d'analyse utilisées.
      </p>
    `;
  } else if (normalized.includes("discussion")) {
    content += `
      <h2>Interprétation</h2>
      <p>
        Cette partie est destinée à interpréter les résultats obtenus
        en les confrontant aux connaissances scientifiques disponibles.
      </p>

      <h2>Comparaison avec les travaux antérieurs</h2>
      <p>
        Les comparaisons devront s'appuyer sur des références réellement
        consultées et vérifiables.
      </p>

      <h2>Limites</h2>
      <p>
        Les principales limites méthodologiques, techniques ou scientifiques
        devront être identifiées de manière transparente.
      </p>
    `;
  } else if (normalized.includes("conception")) {
    content += `
      <h2>Analyse conceptuelle</h2>
      <p>
        Cette section présente les choix de conception retenus pour répondre
        à la problématique définie.
      </p>

      <div class="scientific-placeholder">
        <strong>Schéma de conception</strong>
        <span>
          Insérer ici le schéma, modèle ou diagramme correspondant au système étudié.
        </span>
      </div>
    `;
  } else if (
    normalized.includes("implementation") ||
    normalized.includes("implémentation")
  ) {
    content += `
      <h2>Réalisation</h2>
      <p>
        Présenter les technologies, méthodes, outils et procédures réellement
        utilisés lors de la réalisation.
      </p>

      <div class="scientific-placeholder">
        <strong>Élément technique</strong>
        <span>
          Insérer ici les extraits de code, captures, architectures ou
          résultats techniques pertinents.
        </span>
      </div>
    `;
  } else {
    content += `
      <h2>Présentation</h2>
      <p>
        Développer ici les notions et informations scientifiques directement
        liées au sujet du document.
      </p>

      <h2>Développement</h2>
      <p>
        Le contenu définitif doit être rédigé à partir des informations,
        données et sources réellement disponibles.
      </p>

      <div class="scientific-placeholder">
        <strong>Élément scientifique à insérer</strong>
        <span>
          Cette zone pourra accueillir un tableau, une figure, une équation,
          un schéma, un algorithme ou tout autre élément scientifique pertinent.
        </span>
      </div>
    `;
  }

  return `
    <section
      class="scientific-section"
      data-section-number="${sectionNumber}"
      data-section-title="${safeTitle}"
    >
      ${content}
    </section>
  `;
}

function generateBlankDocument({
  title,
  reportType,
  discipline,
  specialization,
  academicLevel,
  language,
  institution,
  department,
  supervisor,
  academicYear,
  generateToc,
  sections,
  researchType,
  objective,
  researchQuestion,
  methodology,
  hypotheses,
  citationStyle,
  targetPages,
  scientificElements,
  layout,
  blankStart = false,
}) {
  const safeTitle = escapeHtml(title || "Nouveau document scientifique");
  const safeReportType = escapeHtml(reportType);
  const safeDiscipline = escapeHtml(discipline);
  const safeSpecialization = escapeHtml(specialization);
  const safeAcademicLevel = escapeHtml(academicLevel);
  const safeLanguage = escapeHtml(language);
  const safeInstitution = escapeHtml(institution);
  const safeDepartment = escapeHtml(department);
  const safeSupervisor = escapeHtml(supervisor);
  const safeAcademicYear = escapeHtml(academicYear);
  const safeResearchType = escapeHtml(researchType);
  const safeObjective = escapeHtml(
    objective || "Objectif général à préciser dans l'éditeur."
  );
  const safeResearchQuestion = escapeHtml(
    researchQuestion || "Question de recherche à préciser dans l'éditeur."
  );
  const safeMethodology = escapeHtml(
    methodology || "Méthodologie à préciser dans l'éditeur."
  );
  const safeHypotheses = escapeHtml(
    hypotheses || "Hypothèses à préciser si elles sont nécessaires."
  );

  const validSections = sections
    .map((section) => section.title.trim())
    .filter(Boolean);

  if (blankStart) {
    const customSections = validSections
      .map((section) => `<section><h1>${escapeHtml(section)}</h1><p><br></p></section>`)
      .join("");

    return `
      <section class="scientific-cover">
        <div class="cover-institution">${safeInstitution}</div>
        <div class="cover-department">${safeDepartment}</div>
        <div class="cover-report-type">${safeReportType}</div>
        <div class="cover-title">${safeTitle}</div>
        <div class="cover-supervisor">${safeSupervisor}</div>
        <div class="cover-year">${safeAcademicYear}</div>
      </section>
      ${customSections || "<p><br></p>"}
    `;
  }

  const scientificElementLabels = scientificElements
    .map((id) => SCIENTIFIC_ELEMENTS.find((item) => item.id === id)?.label)
    .filter(Boolean);

  const tableOfContents = generateToc
    ? `
      <section class="scientific-toc">
        <h1>Table des matières</h1>
        <ol>
          <li>Introduction générale</li>
          ${validSections
            .filter(
              (section) =>
                !isIntroductionTitle(section) && !isConclusionTitle(section)
            )
            .map(
              (section) =>
                `<li>${escapeHtml(section)}</li>`
            )
            .join("")}
          <li>Conclusion générale</li>
          <li>Références bibliographiques</li>
          <li>Annexes</li>
        </ol>
      </section>
    `
    : "";

  const introduction = `
    <section class="scientific-introduction">
      <h1>Introduction générale</h1>

      <h2>Contexte de l'étude</h2>
      <p>
        Le présent document porte sur le sujet :
        <strong>${safeTitle}</strong>.
        L'étude est réalisée dans le domaine de
        <strong>${safeDiscipline}</strong>
        ${safeSpecialization ? `, avec une spécialisation en <strong>${safeSpecialization}</strong>` : ""}.
      </p>

      <p>
        Le contenu scientifique définitif devra être construit à partir
        des connaissances, données et sources effectivement disponibles.
      </p>

      <h2>Problématique</h2>
      <p>
        ${safeResearchQuestion}
      </p>

      <h2>Objectif général</h2>
      <p>
        ${safeObjective}
      </p>

      <h2>Hypothèses</h2>
      <p>
        ${safeHypotheses}
      </p>

      <h2>Organisation du document</h2>
      <p>
        Ce document est structuré selon le type de travail sélectionné,
        le niveau académique et la configuration scientifique définie lors
        de sa création.
      </p>
    </section>
  `;

  const mainSections = validSections
    .filter(
      (section) =>
        !isIntroductionTitle(section) && !isConclusionTitle(section)
    )
    .map((section, index) =>
      createSectionHtml(section, index, {
        objective,
        researchQuestion,
        methodology,
      })
    )
    .join("");

  const conclusion = `
    <section class="scientific-conclusion">
      <h1>Conclusion générale</h1>

      <p>
        Cette conclusion devra synthétiser les principaux éléments développés
        dans le document et répondre explicitement à la problématique définie.
      </p>

      <h2>Principaux enseignements</h2>
      <p>
        Présenter ici les principales conclusions réellement établies à partir
        des données, observations ou analyses réalisées.
      </p>

      <h2>Limites de l'étude</h2>
      <p>
        Présenter les limites méthodologiques, techniques, documentaires
        ou contextuelles identifiées au cours du travail.
      </p>

      <h2>Perspectives</h2>
      <p>
        Présenter les perspectives de recherche, d'amélioration ou
        d'application qui découlent réellement du travail.
      </p>
    </section>
  `;

  const references = `
    <section class="scientific-references">
      <h1>Références bibliographiques</h1>

      <p>
        Style bibliographique sélectionné :
        <strong>${escapeHtml(citationStyle)}</strong>.
      </p>

      <div class="scientific-placeholder">
        <strong>Aucune référence fictive n'a été ajoutée.</strong>
        <span>
          Les références devront correspondre à des sources réellement
          consultées et vérifiées.
        </span>
      </div>
    </section>
  `;

  const annexes = `
    <section class="scientific-annexes">
      <h1>Annexes</h1>

      <p>
        Les annexes regroupent les documents, données, questionnaires,
        tableaux complémentaires, captures ou autres éléments utiles
        mais trop volumineux pour être intégrés directement au corps du document.
      </p>

      <div class="scientific-placeholder">
        <strong>Zone réservée aux annexes</strong>
        <span>
          Les pièces complémentaires pourront être ajoutées depuis l'éditeur.
        </span>
      </div>
    </section>
  `;

  const cover = `
    <section class="scientific-cover">
      <div class="cover-top-line"></div>

      <div class="cover-institution">
        ${safeInstitution || "UNIVERSITÉ / INSTITUTION"}
      </div>

      <div class="cover-department">
        ${safeDepartment || "FACULTÉ / DÉPARTEMENT"}
      </div>

      <div class="cover-report-type">
        ${safeReportType}
      </div>

      <div class="cover-title">
        ${safeTitle}
      </div>

      ${
        safeSpecialization
          ? `<div class="cover-specialization">${safeSpecialization}</div>`
          : ""
      }

      <div class="cover-meta">
        <div>
          <span>Discipline</span>
          <strong>${safeDiscipline}</strong>
        </div>

        <div>
          <span>Niveau académique</span>
          <strong>${safeAcademicLevel}</strong>
        </div>

        <div>
          <span>Langue</span>
          <strong>${safeLanguage}</strong>
        </div>
      </div>

      <div class="cover-supervisor">
        <span>Directeur / Encadreur</span>
        <strong>${safeSupervisor || "À renseigner"}</strong>
      </div>

      <div class="cover-year">
        Année académique ${safeAcademicYear}
      </div>
    </section>
  `;

  const metadata = `
    <section class="scientific-metadata">
      <h1>Configuration scientifique</h1>

      <table>
        <tbody>
          <tr>
            <td>Type de recherche</td>
            <td>${safeResearchType}</td>
          </tr>
          <tr>
            <td>Volume cible</td>
            <td>${escapeHtml(targetPages)} pages environ</td>
          </tr>
          <tr>
            <td>Style bibliographique</td>
            <td>${escapeHtml(citationStyle)}</td>
          </tr>
          <tr>
            <td>Éléments scientifiques</td>
            <td>${escapeHtml(scientificElementLabels.join(", "))}</td>
          </tr>
          <tr>
            <td>Mise en page</td>
            <td>${escapeHtml(layout)}</td>
          </tr>
        </tbody>
      </table>

      <p class="metadata-note">
        Cette page constitue une configuration interne initiale du document.
        Elle pourra être adaptée ou retirée selon le modèle final utilisé.
      </p>

      <p>
        <strong>Méthodologie :</strong>
        ${safeMethodology}
      </p>
    </section>
  `;

  return `
    <article
      class="macevo-scientific-document"
      data-report-type="${escapeHtml(reportType)}"
      data-discipline="${escapeHtml(discipline)}"
      data-academic-level="${escapeHtml(academicLevel)}"
      data-language="${escapeHtml(language)}"
      data-layout="${escapeHtml(layout)}"
      data-target-pages="${escapeHtml(targetPages)}"
    >

      ${cover}

      ${tableOfContents}

      ${metadata}

      ${introduction}

      ${mainSections}

      ${conclusion}

      ${references}

      ${annexes}

    </article>
  `;
}

/* ============================================================
   COMPOSANTS UI
============================================================ */

function FieldLabel({ children, required = false }) {
  return (
    <label className="dv-field-label">
      {children}
      {required && <span className="dv-required">*</span>}
    </label>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}) {
  return (
    <div className="dv-select-wrap">
      <select value={value} onChange={onChange} disabled={disabled}>
        {placeholder && <option value="">{placeholder}</option>}

        {options.map((option) => {
          const normalized =
            typeof option === "string"
              ? { value: option, label: option }
              : option;

          return (
            <option key={normalized.value} value={normalized.value}>
              {normalized.label}
            </option>
          );
        })}
      </select>

      <ChevronDown size={15} className="dv-select-icon" />
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  open,
  onToggle,
}) {
  return (
    <button
      type="button"
      className="dv-section-header"
      onClick={onToggle}
    >
      <div className="dv-section-header-left">
        <div className="dv-section-icon">
          <Icon size={17} />
        </div>

        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="dv-section-chevron">
        {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </div>
    </button>
  );
}

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */

export default function DocumentVierge() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("Document libre");
  const [discipline, setDiscipline] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [academicLevel, setAcademicLevel] = useState("");
  const [language, setLanguage] = useState("fr");
  const [customLanguage, setCustomLanguage] = useState("");

  const [country, setCountry] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [institution, setInstitution] = useState("");
  const [institutionalRequirements, setInstitutionalRequirements] = useState("");
  const [institutionalRequirementsSource, setInstitutionalRequirementsSource] = useState("");
  const [department, setDepartment] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [academicYear, setAcademicYear] = useState(getAcademicYear());

  const [generateToc, setGenerateToc] = useState(false);

  const [sections, setSections] = useState([]);

  const [researchType, setResearchType] = useState("");

  const [objective, setObjective] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");
  const [methodology, setMethodology] = useState("");
  const [hypotheses, setHypotheses] = useState("");

  const [citationStyle, setCitationStyle] = useState("À définir");
  const [targetPages, setTargetPages] = useState("");

  const [scientificElements, setScientificElements] = useState([]);

  const [layout, setLayout] = useState("academique");

  const [openSections, setOpenSections] = useState({
    information: true,
    academic: true,
    structure: true,
    scientific: false,
    elements: false,
    layout: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeElementCount = scientificElements.length;

  const summaryTitle = title.trim() || "Nouveau document scientifique";
  const selectedCountryName = country === "other"
    ? customCountry.trim()
    : COUNTRIES.find((option) => option.value === country)?.label || country;
  const resolvedLanguage = language === "other" ? customLanguage.trim() : language;

  /* ==========================================================
     HANDLERS
  ========================================================== */

  function handleReportTypeChange(event) {
    setReportType(event.target.value);
  }

  function handleAddSection() {
    setSections((current) => [
      ...current,
      {
        id: createId(),
        title: "Nouvelle section",
      },
    ]);
  }

  function handleRemoveSection(id) {
    setSections((current) => {
      if (current.length <= 1) {
        return current;
      }

      return current.filter((section) => section.id !== id);
    });
  }

  function handleUpdateSection(id, value) {
    setSections((current) =>
      current.map((section) =>
        section.id === id
          ? {
              ...section,
              title: value,
            }
          : section
      )
    );
  }

  function toggleScientificElement(id) {
    setScientificElements((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function toggleSection(key) {
    setOpenSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function validateForm() {
    if (!title.trim()) {
      return "Veuillez renseigner le titre du document.";
    }

    if (!resolvedLanguage) {
      return "Veuillez sélectionner une langue pour le document.";
    }

    if (language === "other" && !customLanguage.trim()) {
      return "Veuillez préciser la langue du document.";
    }


    return null;
  }

  function extractApiError(error) {
    if (!error) {
      return "Une erreur inconnue est survenue.";
    }

    if (error.response?.data) {
      const data = error.response.data;

      if (typeof data === "string") {
        return data;
      }

      if (data.detail) {
        return data.detail;
      }

      if (data.message) {
        return data.message;
      }

      if (typeof data === "object") {
        const messages = Object.entries(data)
          .flatMap(([field, value]) => {
            if (Array.isArray(value)) {
              return value.map((message) => `${field} : ${message}`);
            }

            return [`${field} : ${value}`];
          })
          .filter(Boolean);

        if (messages.length > 0) {
          return messages.join(" — ");
        }
      }
    }

    if (error.request && !error.response) {
      return (
        "Impossible de contacter le serveur MACEVO. " +
        "Vérifiez que le backend Django est démarré et que l'URL de l'API est correcte."
      );
    }

    return error.message || "Impossible de créer le document.";
  }

  async function handleCreateReport() {
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);

    try {
      const validSections = sections
        .map((section) => ({
          id: section.id,
          title: section.title.trim(),
        }))
        .filter((section) => section.title);

      const countryName = country === "other"
        ? customCountry.trim()
        : COUNTRIES.find((option) => option.value === country)?.label || country;
      const reportStructure = validSections.map((section) => {
        const normalizedTitle = section.title
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        const type = /conclusion/.test(normalizedTitle)
          ? "conclusion"
          : /bibliographie|references/.test(normalizedTitle)
            ? "references"
            : /annexe/.test(normalizedTitle)
              ? "annexe"
              : "section";
        return { ...section, type, required: true };
      });
      const internationalDocument = createInternationalDocument({
        title: title.trim(),
        reportType,
        academicLevel,
        scientificField: discipline,
        specialization,
        language: resolvedLanguage,
        creationMode: "blank",
        country,
        countryName,
        institution,
        department,
        supervisor,
        academicYear,
        generateToc,
        structure: reportStructure,
        studyType: researchType,
        objective,
        researchQuestion,
        methodology,
        hypotheses,
        citationStyle,
        targetPages,
        institutionalRequirements,
        institutionalRequirementsSource,
        includeLists: scientificElements.includes("figures") || scientificElements.includes("tables"),
      });
      const content = internationalDocument.content || generateBlankDocument({
        title: title.trim(), reportType, discipline, specialization, academicLevel,
        language, institution, department, supervisor, academicYear, generateToc,
        sections: validSections, researchType, objective, researchQuestion,
        methodology, hypotheses, citationStyle, targetPages, scientificElements, layout, blankStart: true,
      });

      /*
       * IMPORTANT :
       * Seuls les champs réellement acceptés par ReportSerializer
       * sont envoyés au backend.
       */
      const payload = {
        title: title.trim(),
        summary: "",
        scientific_field: discipline.trim(),
        report_type: reportType.trim(),
        academic_level: academicLevel.trim(),
        language: resolvedLanguage,
        country: countryName,
        generate_toc: Boolean(generateToc),
        institution: institution.trim(),
        department: department.trim(),
        supervisor: supervisor.trim(),
        academic_year: academicYear.trim(),
        study_type: researchType,
        citation_style: citationStyle,
        institutional_requirements: institutionalRequirements,
        research_problem: "",
        research_questions: researchQuestion.trim()
          ? [researchQuestion.trim()]
          : [],
        general_objective: objective.trim(),
        specific_objectives: [],
        hypotheses: hypotheses
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean),
        methodology: methodology.trim(),
        template_key: internationalDocument.template.id,
        structure: internationalDocument.template.structure,
        macevo_document: internationalDocument.serializedDocument,
        content,
        status: "draft",
      };

      const response = await api.post("reports/", payload);

      const createdReport = response?.data;

      if (!createdReport?.id) {
        throw new Error(
          "Le serveur a créé le document mais aucun identifiant n'a été retourné."
        );
      }

      /*
       * Configuration complète conservée côté navigateur.
       * Elle sera récupérée par EditorContext.jsx.
       */
      const generationConfig = {
        reportType,
        discipline,
        specialization,
        academicLevel,
        language,
        institution,
        department,
        supervisor,
        academicYear,
        generateToc,
        sections: validSections,
        researchType,
        objective,
        researchQuestion,
        methodology,
        hypotheses,
        citationStyle,
        targetPages,
        scientificElements,
        layout,
      };

      const scientificProfile = {
        discipline,
        specialization,
        academicLevel,
        researchType,
        objective,
        researchQuestion,
        methodology,
        hypotheses,
        citationStyle,
        targetPages,
        scientificElements,
      };

      sessionStorage.setItem(
        "macevo_current_report",
        JSON.stringify({
          ...createdReport,
          reportId: createdReport.id,
          content,
        })
      );

      sessionStorage.setItem(
        "macevo_report_data",
        JSON.stringify({
          ...createdReport,
          reportId: createdReport.id,
          content,
        })
      );

      sessionStorage.setItem(
        "macevo_generation_config",
        JSON.stringify(generationConfig)
      );

      sessionStorage.setItem(
        "macevo_scientific_profile",
        JSON.stringify(scientificProfile)
      );

      setSuccessMessage(
        "Document créé avec succès. Ouverture de l'éditeur..."
      );

      /*
       * FLUX FINAL :
       *
       * Document vierge
       *       ↓
       * Création du brouillon
       *       ↓
       * Editorr.jsx
       *
       * Aucun passage par ScientificGenerator.
       * Aucun passage par MACEVO IA.
       */
      navigate(`/rapports/editeur/${createdReport.id}`, {
  state: {
    report: {
      ...createdReport,
      content,
      reportId: createdReport.id,
    },
    template: null,
    generationConfig,
    scientificProfile,
  },
});
    } catch (error) {
      console.error(
        "[MACEVO] Erreur lors de la création du document :",
        error
      );

      setErrorMessage(extractApiError(error));
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     RENDU
  ========================================================== */

  return (
    <div className="dv-page">
      <Navbar />

      <div className="dv-layout">
        <Sidebar />

        <main className="dv-main">
          <header className="dv-page-header">
            <div className="dv-header-left">
              <div className="dv-header-icon">
                <FileText size={23} />
              </div>

              <div>
                <div className="dv-breadcrumb">
                  Rapports <span>/</span> Nouveau document
                </div>

                <h1>Créer un nouveau document</h1>

                <p>
                  Configurez votre document scientifique avant
                  d'accéder directement à l'éditeur.
                </p>
              </div>
            </div>

            <div className="dv-header-badge">
              <FileText size={14} />
              Document vierge
            </div>
          </header>

          {errorMessage && (
            <div className="dv-alert dv-alert-error">
              <AlertCircle size={18} />

              <div>
                <strong>Impossible de créer le document</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="dv-alert dv-alert-success">
              <CheckCircle2 size={18} />

              <div>
                <strong>Document créé</strong>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          <div className="dv-content-grid">
            <div className="dv-form-column">
              {/* ==================================================
                  INFORMATIONS DU DOCUMENT
              ================================================== */}

              <section className="dv-card">
                <SectionHeader
                  icon={FileText}
                  title="Informations du document"
                  description="Définissez les informations principales du travail."
                  open={openSections.information}
                  onToggle={() => toggleSection("information")}
                />

                {openSections.information && (
                  <div className="dv-card-body">
                    <div className="dv-field">
                      <FieldLabel required>
                        Titre du document
                      </FieldLabel>

                      <input
                        type="text"
                        value={title}
                        onChange={(event) =>
                          setTitle(event.target.value)
                        }
                        placeholder="Ex. Analyse des systèmes intelligents..."
                      />
                    </div>

                    <div className="dv-grid-2">
                      <div className="dv-field">
                        <FieldLabel>
                          Type de document
                        </FieldLabel>

                        <SelectField
                          value={reportType}
                          onChange={handleReportTypeChange}
                          options={REPORT_TYPES}
                        />
                      </div>

                      <div className="dv-field">
                        <FieldLabel>
                          Domaine scientifique
                        </FieldLabel>

                        <SelectField
                          value={discipline}
                          onChange={(event) =>
                            setDiscipline(event.target.value)
                          }
                          options={DISCIPLINES}
                        />
                      </div>
                    </div>

                    <div className="dv-field">
                      <FieldLabel>
                        Spécialisation
                      </FieldLabel>

                      <input
                        type="text"
                        value={specialization}
                        onChange={(event) =>
                          setSpecialization(event.target.value)
                        }
                        placeholder="Ex. Intelligence artificielle, cardiologie, génie logiciel..."
                      />
                    </div>

                    <div className="dv-grid-2">
                      <div className="dv-field">
                        <FieldLabel>
                          Niveau académique
                        </FieldLabel>

                        <SelectField
                          value={academicLevel}
                          onChange={(event) =>
                            setAcademicLevel(event.target.value)
                          }
                          options={ACADEMIC_LEVELS}
                        />
                      </div>

                      <div className="dv-field">
                        <FieldLabel>
                          Langue
                        </FieldLabel>

                        <SelectField
                          value={language}
                          onChange={(event) =>
                            setLanguage(event.target.value)
                          }
                          options={LANGUAGES}
                        />
                        {language === "other" && (
                          <input type="text" value={customLanguage} onChange={(event) => setCustomLanguage(event.target.value)} placeholder="Précisez la langue" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* ==================================================
                  INFORMATIONS ACADÉMIQUES
              ================================================== */}

              <section className="dv-card">
                <SectionHeader
                  icon={GraduationCap}
                  title="Informations académiques"
                  description="Informations qui apparaîtront sur la page de garde."
                  open={openSections.academic}
                  onToggle={() => toggleSection("academic")}
                />

                {openSections.academic && (
                  <div className="dv-card-body">
                    <div className="dv-grid-2">
                      <div className="dv-field">
                        <FieldLabel>Pays</FieldLabel>
                        <SelectField
                          value={country}
                          onChange={(event) => setCountry(event.target.value)}
                          options={[{ value: "", label: "Choisir un pays" }, ...COUNTRIES]}
                        />
                        <small>Format proposé : {getRegionalPageFormat(country || "A4")} ; les règles de l'établissement priment.</small>
                      </div>
                      <div className="dv-field">
                        <FieldLabel>Autre pays</FieldLabel>
                        <input
                          type="text"
                          value={customCountry}
                          onChange={(event) => setCustomCountry(event.target.value)}
                          placeholder={country === "other" ? "Nom du pays" : "Facultatif"}
                          disabled={country !== "other"}
                        />
                      </div>
                    </div>

                    <div className="dv-field">
                      <FieldLabel>
                        Université / Institution
                      </FieldLabel>

                      <input
                        type="text"
                        value={institution}
                        onChange={(event) =>
                          setInstitution(event.target.value)
                        }
                        placeholder="Ex. Université d'Abomey-Calavi"
                      />
                    </div>

                    <div className="dv-field">
                      <FieldLabel>Exigences de l'établissement</FieldLabel>
                      <textarea
                        value={institutionalRequirements}
                        onChange={(event) => setInstitutionalRequirements(event.target.value)}
                        rows={3}
                        placeholder="Ordre des parties, marges, police, règles de jury, volume..."
                      />
                      <input
                        type="url"
                        value={institutionalRequirementsSource}
                        onChange={(event) => setInstitutionalRequirementsSource(event.target.value)}
                        placeholder="Lien vers les consignes officielles (facultatif)"
                      />
                      <small>{getAcademicStandardsGuidance(selectedCountryName, institution, institutionalRequirements, institutionalRequirementsSource)}</small>
                    </div>

                    <div className="dv-grid-2">
                      <div className="dv-field">
                        <FieldLabel>
                          Faculté / Département
                        </FieldLabel>

                        <input
                          type="text"
                          value={department}
                          onChange={(event) =>
                            setDepartment(event.target.value)
                          }
                          placeholder="Ex. Faculté des Sciences"
                        />
                      </div>

                      <div className="dv-field">
                        <FieldLabel>
                          Année académique
                        </FieldLabel>

                        <input
                          type="text"
                          value={academicYear}
                          onChange={(event) =>
                            setAcademicYear(event.target.value)
                          }
                          placeholder="2026-2027"
                        />
                      </div>
                    </div>

                    <div className="dv-field">
                      <FieldLabel>
                        Directeur / Encadreur
                      </FieldLabel>

                      <input
                        type="text"
                        value={supervisor}
                        onChange={(event) =>
                          setSupervisor(event.target.value)
                        }
                        placeholder="Nom et prénom de l'encadreur"
                      />
                    </div>

                    <div className="dv-info-box">
                      <GraduationCap size={17} />

                      <div>
                        <strong>
                          Informations de page de garde
                        </strong>

                        <p>
                          Ces informations seront utilisées pour construire
                          automatiquement la page de garde du document.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* ==================================================
                  STRUCTURE
              ================================================== */}

              <section className="dv-card">
                <SectionHeader
                  icon={Layers3}
                  title="Structure du document"
                  description="Organisez les parties principales de votre travail."
                  open={openSections.structure}
                  onToggle={() => toggleSection("structure")}
                />

                {openSections.structure && (
                  <div className="dv-card-body">
                    <div className="dv-info-box">
                      <Layers3 size={17} />

                      <div>
                        <strong>
                          Structure adaptée au document
                        </strong>

                        <p>
                          MACEVO propose une structure de départ selon
                          le type de travail sélectionné. Vous pouvez
                          ensuite la modifier.
                        </p>
                      </div>
                    </div>

                    <div className="dv-toggle-row">
                      <div className="dv-toggle-content">
                        <div className="dv-toggle-icon">
                          <BookOpen size={17} />
                        </div>

                        <div>
                          <strong>
                            Table des matières
                          </strong>

                          <span>
                            Générer automatiquement la structure du document.
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`dv-switch ${
                          generateToc ? "active" : ""
                        }`}
                        onClick={() =>
                          setGenerateToc((current) => !current)
                        }
                        aria-label="Activer ou désactiver la table des matières"
                      >
                        <span />
                      </button>
                    </div>

                    <div className="dv-subsection-title">
                      Sections du document
                    </div>

                    <div className="dv-sections-list">
                      {sections.map((section, index) => (
                        <div
                          className="dv-structure-item"
                          key={section.id}
                        >
                          <div className="dv-structure-number">
                            {index + 1}
                          </div>

                          <input
                            type="text"
                            value={section.title}
                            onChange={(event) =>
                              handleUpdateSection(
                                section.id,
                                event.target.value
                              )
                            }
                            aria-label={`Nom de la section ${
                              index + 1
                            }`}
                          />

                          <button
                            type="button"
                            className="dv-icon-button danger"
                            disabled={sections.length <= 1}
                            onClick={() =>
                              handleRemoveSection(section.id)
                            }
                            title="Supprimer la section"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="dv-structure-footer">
                      <span>
                        {sections.length} section
                        {sections.length > 1 ? "s" : ""}
                        configurée
                        {sections.length > 1 ? "s" : ""}
                      </span>

                      <button
                        type="button"
                        className="dv-secondary-button"
                        onClick={handleAddSection}
                      >
                        <Plus size={15} />
                        Ajouter une section
                      </button>
                    </div>

                    <div className="dv-template-hint">
                      Structure proposée :
                      <strong>
                        {sections.length}
                      </strong>
                      éléments.
                    </div>
                  </div>
                )}
              </section>

              {/* ==================================================
                  CONFIGURATION SCIENTIFIQUE
              ================================================== */}

              <section className="dv-card">
                <SectionHeader
                  icon={FlaskConical}
                  title="Configuration scientifique"
                  description="Définissez les paramètres scientifiques du travail."
                  open={openSections.scientific}
                  onToggle={() => toggleSection("scientific")}
                />

                {openSections.scientific && (
                  <div className="dv-card-body">
                    <div className="dv-field">
                      <FieldLabel>
                        Type de recherche
                      </FieldLabel>

                      <SelectField
                        value={researchType}
                        onChange={(event) =>
                          setResearchType(event.target.value)
                        }
                        options={RESEARCH_TYPES}
                      />
                    </div>

                    <div className="dv-field">
                      <FieldLabel>
                        Objectif général
                      </FieldLabel>

                      <textarea
                        value={objective}
                        onChange={(event) =>
                          setObjective(event.target.value)
                        }
                        rows={4}
                        placeholder="Décrivez l'objectif principal de votre travail..."
                      />
                    </div>

                    <div className="dv-field">
                      <FieldLabel>
                        Problématique / Question de recherche
                      </FieldLabel>

                      <textarea
                        value={researchQuestion}
                        onChange={(event) =>
                          setResearchQuestion(event.target.value)
                        }
                        rows={4}
                        placeholder="Quelle question scientifique votre travail cherche-t-il à résoudre ?"
                      />
                    </div>

                    <div className="dv-field">
                      <FieldLabel>
                        Méthodologie
                      </FieldLabel>

                      <textarea
                        value={methodology}
                        onChange={(event) =>
                          setMethodology(event.target.value)
                        }
                        rows={4}
                        placeholder="Décrivez brièvement l'approche méthodologique envisagée..."
                      />
                    </div>

                    <div className="dv-field">
                      <FieldLabel>
                        Hypothèses
                      </FieldLabel>

                      <textarea
                        value={hypotheses}
                        onChange={(event) =>
                          setHypotheses(event.target.value)
                        }
                        rows={4}
                        placeholder="Indiquez les hypothèses si votre recherche en nécessite..."
                      />
                    </div>

                    <div className="dv-grid-2">
                      <div className="dv-field">
                        <FieldLabel>
                          Style bibliographique
                        </FieldLabel>

                        <SelectField
                          value={citationStyle}
                          onChange={(event) =>
                            setCitationStyle(event.target.value)
                          }
                          options={CITATION_STYLES}
                        />
                      </div>

                      <div className="dv-field">
                        <FieldLabel>
                          Volume cible
                        </FieldLabel>

                        <SelectField
                          value={targetPages}
                          onChange={(event) =>
                            setTargetPages(event.target.value)
                          }
                          options={PAGE_OPTIONS}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* ==================================================
                  ÉLÉMENTS SCIENTIFIQUES
              ================================================== */}

              <section className="dv-card">
                <SectionHeader
                  icon={Sigma}
                  title="Éléments scientifiques"
                  description="Choisissez les éléments que vous souhaitez pouvoir utiliser."
                  open={openSections.elements}
                  onToggle={() => toggleSection("elements")}
                />

                {openSections.elements && (
                  <div className="dv-card-body">
                    <div className="dv-scientific-grid">
                      {SCIENTIFIC_ELEMENTS.map((item) => {
                        const Icon = item.icon;
                        const active = scientificElements.includes(
                          item.id
                        );

                        return (
                          <button
                            type="button"
                            key={item.id}
                            className={`dv-scientific-option ${
                              active ? "active" : ""
                            }`}
                            onClick={() =>
                              toggleScientificElement(item.id)
                            }
                          >
                            <div className="dv-scientific-icon">
                              <Icon size={16} />
                            </div>

                            <div className="dv-scientific-text">
                              <strong>{item.label}</strong>
                              <span>{item.description}</span>
                            </div>

                            {active && (
                              <div className="dv-check">
                                <CheckCircle2 size={16} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="dv-selection-count">
                      <CheckCircle2 size={14} />

                      {activeElementCount} élément
                      {activeElementCount > 1 ? "s" : ""} scientifique
                      {activeElementCount > 1 ? "s" : ""} sélectionné
                      {activeElementCount > 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </section>

              {/* ==================================================
                  MISE EN PAGE
              ================================================== */}

              <section className="dv-card">
                <SectionHeader
                  icon={Palette}
                  title="Mise en page"
                  description="Choisissez le style visuel initial du document."
                  open={openSections.layout}
                  onToggle={() => toggleSection("layout")}
                />

                {openSections.layout && (
                  <div className="dv-card-body">
                    <div className="dv-layout-options">
                      {LAYOUTS.map((option) => {
                        const active = layout === option.id;

                        return (
                          <button
                            type="button"
                            key={option.id}
                            className={`dv-layout-option ${
                              active ? "active" : ""
                            }`}
                            onClick={() =>
                              setLayout(option.id)
                            }
                          >
                            <div className="dv-layout-radio">
                              {active && <span />}
                            </div>

                            <div>
                              <strong>{option.title}</strong>
                              <span>{option.description}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* ==================================================
                  CRÉATION
              ================================================== */}

              <div className="dv-create-area">
                <button
                  type="button"
                  className="dv-create-button"
                  onClick={handleCreateReport}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={17}
                        className="dv-spin"
                      />
                      Création du document...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Créer et ouvrir l'éditeur
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                <p>
                  Votre document sera enregistré comme brouillon puis
                  ouvert directement dans l'éditeur scientifique.
                </p>
              </div>
            </div>

            {/* ====================================================
                COLONNE RÉSUMÉ
            ==================================================== */}

            <aside className="dv-summary-column">
              <div className="dv-summary-card">
                <div className="dv-summary-header">
                  <div className="dv-summary-header-icon">
                    <Eye size={17} />
                  </div>

                  <div>
                    <h3>Aperçu du document</h3>
                    <span>Configuration actuelle</span>
                  </div>
                </div>

                <div className="dv-summary-preview">
                  <div className="dv-preview-page">
                    <div className="dv-preview-top-line" />

                    <div className="dv-preview-small">
                      {institution ||
                        "UNIVERSITÉ / INSTITUTION"}
                    </div>

                    <div className="dv-preview-title">
                      {summaryTitle}
                    </div>

                    <div className="dv-preview-type">
                      {reportType}
                    </div>

                    <div className="dv-preview-lines">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>

                    <div className="dv-preview-footer">
                      {academicYear}
                    </div>
                  </div>
                </div>

                <div className="dv-summary-section">
                  <div className="dv-summary-section-title">
                    Document
                  </div>

                  <div className="dv-summary-row">
                    <span>Type</span>
                    <strong>{reportType}</strong>
                  </div>

                  <div className="dv-summary-row">
                    <span>Discipline</span>
                    <strong>{discipline}</strong>
                  </div>

                  <div className="dv-summary-row">
                    <span>Niveau</span>
                    <strong>{academicLevel}</strong>
                  </div>

                  <div className="dv-summary-row">
                    <span>Langue</span>
                    <strong>{language}</strong>
                  </div>
                </div>

                <div className="dv-summary-section">
                  <div className="dv-summary-section-title">
                    Structure
                  </div>

                  <div className="dv-summary-row">
                    <span>Sections</span>
                    <strong>{sections.length}</strong>
                  </div>

                  <div className="dv-summary-row">
                    <span>Table des matières</span>
                    <strong>
                      {generateToc ? "Oui" : "Non"}
                    </strong>
                  </div>
                </div>

                <div className="dv-summary-section">
                  <div className="dv-summary-section-title">
                    Recherche
                  </div>

                  <div className="dv-summary-row">
                    <span>Type</span>
                    <strong>{researchType}</strong>
                  </div>

                  <div className="dv-summary-row">
                    <span>Volume</span>
                    <strong>{targetPages} pages</strong>
                  </div>

                  <div className="dv-summary-row">
                    <span>Citations</span>
                    <strong>{citationStyle}</strong>
                  </div>
                </div>

                <div className="dv-summary-section">
                  <div className="dv-summary-section-title">
                    Éléments
                  </div>

                  <div className="dv-summary-row">
                    <span>Éléments scientifiques</span>
                    <strong>
                      {activeElementCount}
                    </strong>
                  </div>

                  <div className="dv-summary-row">
                    <span>Mise en page</span>
                    <strong>
                      {
                        LAYOUTS.find(
                          (item) => item.id === layout
                        )?.title
                      }
                    </strong>
                  </div>
                </div>

                <div className="dv-summary-note">
                  <Settings2 size={15} />

                  <p>
                    <strong>Document brouillon.</strong>{" "}
                    Après création, vous pourrez modifier directement
                    le contenu, la structure et la mise en forme
                    depuis l'éditeur scientifique.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* ============================================================
          STYLES
      ============================================================ */}

      <style>{`
        /* ================================================
           BASE
        ================================================ */

        .dv-page {
          min-height: 100vh;
          background: #f2f4f7;
          color: #172033;
        }

        .dv-page,
        .dv-page * {
          box-sizing: border-box;
        }

        .dv-layout {
          display: flex;
          min-height: calc(100vh - 64px);
        }

        .dv-main {
          flex: 1;
          min-width: 0;
          padding: 30px 34px 50px;
        }

        /* ================================================
           HEADER
        ================================================ */

        .dv-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 25px;
        }

        .dv-header-left {
          display: flex;
          align-items: center;
          gap: 15px;
          min-width: 0;
        }

        .dv-header-icon {
          width: 52px;
          height: 52px;
          flex: 0 0 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #dce7fa;
          border-radius: 13px;
          background: #eef4ff;
          color: #2563eb;
        }

        .dv-breadcrumb {
          margin-bottom: 5px;
          color: #8b95a6;
          font-size: 11px;
          font-weight: 600;
        }

        .dv-breadcrumb span {
          margin: 0 6px;
          color: #c1c7d1;
        }

        .dv-page-header h1 {
          margin: 0;
          color: #1d2738;
          font-size: 27px;
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .dv-page-header p {
          margin: 7px 0 0;
          color: #7d8799;
          font-size: 12px;
          line-height: 1.5;
        }

        .dv-header-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 34px;
          padding: 0 12px;
          border: 1px solid #dbe6fa;
          border-radius: 9px;
          background: #f8fbff;
          color: #2563eb;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        /* ================================================
           ALERTS
        ================================================ */

        .dv-alert {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 11px;
          font-size: 12px;
        }

        .dv-alert strong {
          display: block;
          font-size: 12px;
        }

        .dv-alert p {
          margin: 4px 0 0;
          line-height: 1.5;
        }

        .dv-alert-error {
          border: 1px solid #fecaca;
          background: #fff7f7;
          color: #dc2626;
        }

        .dv-alert-error p {
          color: #9f1239;
        }

        .dv-alert-success {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          color: #16a34a;
        }

        .dv-alert-success p {
          color: #166534;
        }

        /* ================================================
           GRID
        ================================================ */

        .dv-content-grid {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          align-items: start;
          gap: 22px;
        }

        .dv-form-column {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dv-summary-column {
          position: sticky;
          top: 20px;
          min-width: 0;
        }

        /* ================================================
           CARD
        ================================================ */

        .dv-card,
        .dv-summary-card {
          border: 1px solid #e5e9ef;
          border-radius: 13px;
          background: #fff;
          box-shadow: 0 3px 14px rgba(26, 39, 62, 0.035);
          overflow: hidden;
        }

        .dv-section-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 17px 18px;
          border: 0;
          border-bottom: 1px solid #edf0f4;
          background: #fff;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .dv-section-header:hover {
          background: #fbfcfe;
        }

        .dv-section-header-left {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .dv-section-icon {
          width: 35px;
          height: 35px;
          flex: 0 0 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #eef4ff;
          color: #2563eb;
        }

        .dv-section-header h2 {
          margin: 0;
          color: #273247;
          font-size: 13px;
          font-weight: 800;
        }

        .dv-section-header p {
          margin: 3px 0 0;
          color: #8a94a5;
          font-size: 10px;
          line-height: 1.4;
        }

        .dv-section-chevron {
          color: #8993a3;
        }

        .dv-card-body {
          padding: 19px 18px 20px;
        }

        /* ================================================
           FORMULAIRES
        ================================================ */

        .dv-field {
          margin-bottom: 17px;
        }

        .dv-field:last-child {
          margin-bottom: 0;
        }

        .dv-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .dv-field-label {
          display: block;
          margin-bottom: 7px;
          color: #455269;
          font-size: 11px;
          font-weight: 700;
        }

        .dv-required {
          margin-left: 3px;
          color: #ef4444;
        }

        .dv-page input,
        .dv-page select,
        .dv-page textarea {
          width: 100%;
          border: 1px solid #dfe4eb;
          border-radius: 9px;
          outline: none;
          background: #fff;
          color: #2c374b;
          font-family: inherit;
          font-size: 12px;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .dv-page input,
        .dv-page select {
          height: 40px;
          padding: 0 12px;
        }

        .dv-page textarea {
          min-height: 95px;
          padding: 11px 12px;
          resize: vertical;
          line-height: 1.55;
        }

        .dv-page input:focus,
        .dv-page select:focus,
        .dv-page textarea:focus {
          border-color: #8eb3f0;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .dv-page input::placeholder,
        .dv-page textarea::placeholder {
          color: #adb5c1;
        }

        .dv-select-wrap {
          position: relative;
        }

        .dv-select-wrap select {
          appearance: none;
          padding-right: 37px;
          cursor: pointer;
        }

        .dv-select-icon {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          pointer-events: none;
          color: #7f8999;
        }

        /* ================================================
           INFO BOX
        ================================================ */

        .dv-info-box {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-top: 18px;
          padding: 13px 14px;
          border: 1px solid #dce9ff;
          border-radius: 11px;
          background: #f6f9ff;
          color: #2563eb;
        }

        .dv-info-box strong {
          display: block;
          color: #26334b;
          font-size: 12px;
        }

        .dv-info-box p {
          margin: 4px 0 0;
          color: #788398;
          font-size: 11px;
          line-height: 1.5;
        }

        /* ================================================
           SWITCH
        ================================================ */

        .dv-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 18px;
          padding: 13px;
          border: 1px solid #edf0f4;
          border-radius: 11px;
          background: #fbfcfe;
        }

        .dv-toggle-content {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .dv-toggle-icon {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #eef4ff;
          color: #2563eb;
        }

        .dv-toggle-content strong {
          display: block;
          font-size: 12px;
          color: #273247;
        }

        .dv-toggle-content span {
          display: block;
          margin-top: 3px;
          color: #8b94a4;
          font-size: 11px;
        }

        .dv-switch {
          position: relative;
          width: 43px;
          height: 24px;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: #d7dce4;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .dv-switch span {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
          transition: transform 0.2s ease;
        }

        .dv-switch.active {
          background: #2563eb;
        }

        .dv-switch.active span {
          transform: translateX(19px);
        }

        /* ================================================
           STRUCTURE
        ================================================ */

        .dv-subsection-title {
          margin-top: 21px;
          margin-bottom: 9px;
          color: #30394a;
          font-size: 12px;
          font-weight: 700;
        }

        .dv-sections-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .dv-structure-item {
          display: grid;
          grid-template-columns: 31px minmax(0, 1fr) 36px;
          align-items: center;
          gap: 9px;
        }

        .dv-structure-number {
          width: 31px;
          height: 31px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #f1f5fb;
          color: #617089;
          font-size: 11px;
          font-weight: 700;
        }

        .dv-icon-button {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e9ef;
          border-radius: 9px;
          background: #fff;
          color: #768093;
          cursor: pointer;
        }

        .dv-icon-button:hover:not(:disabled) {
          background: #f8fafc;
        }

        .dv-icon-button.danger:hover:not(:disabled) {
          border-color: #fecaca;
          background: #fff5f5;
          color: #dc2626;
        }

        .dv-icon-button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .dv-structure-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 13px;
        }

        .dv-structure-footer > span {
          color: #929aaa;
          font-size: 11px;
        }

        .dv-secondary-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 37px;
          padding: 0 12px;
          border: 1px solid #dfe5ed;
          border-radius: 9px;
          background: #fff;
          color: #40516b;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .dv-secondary-button:hover {
          border-color: #bfd0ec;
          background: #f8fbff;
          color: #2563eb;
        }

        .dv-template-hint {
          margin-top: 13px;
          padding-top: 12px;
          border-top: 1px solid #eef1f4;
          color: #8d96a5;
          font-size: 11px;
        }

        .dv-template-hint strong {
          color: #52617a;
          margin: 0 3px;
        }

        /* ================================================
           ÉLÉMENTS SCIENTIFIQUES
        ================================================ */

        .dv-scientific-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .dv-scientific-option {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          border: 1px solid #e5e9ef;
          border-radius: 11px;
          background: #fff;
          text-align: left;
          cursor: pointer;
          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease;
        }

        .dv-scientific-option:hover {
          border-color: #c7d7f1;
          background: #fbfdff;
          transform: translateY(-1px);
        }

        .dv-scientific-option.active {
          border-color: #9cbcf3;
          background: #f5f9ff;
        }

        .dv-scientific-icon {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #f1f5fa;
          color: #65748a;
        }

        .dv-scientific-option.active .dv-scientific-icon {
          background: #e3edff;
          color: #2563eb;
        }

        .dv-scientific-text {
          min-width: 0;
          padding-right: 19px;
        }

        .dv-scientific-text strong {
          display: block;
          color: #293447;
          font-size: 12px;
        }

        .dv-scientific-text span {
          display: block;
          margin-top: 3px;
          color: #8a94a5;
          font-size: 10px;
          line-height: 1.45;
        }

        .dv-check {
          position: absolute;
          top: 11px;
          right: 10px;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
        }

        .dv-selection-count {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 13px;
          color: #728097;
          font-size: 11px;
        }

        .dv-selection-count svg {
          color: #16a34a;
        }

        /* ================================================
           LAYOUT
        ================================================ */

        .dv-layout-options {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .dv-layout-option {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          min-height: 86px;
          padding: 13px;
          border: 1px solid #e3e8ef;
          border-radius: 11px;
          background: #fff;
          text-align: left;
          cursor: pointer;
        }

        .dv-layout-option:hover {
          border-color: #c7d6ed;
          background: #fbfdff;
        }

        .dv-layout-option.active {
          border-color: #8eb2ef;
          background: #f5f9ff;
        }

        .dv-layout-radio {
          width: 18px;
          height: 18px;
          flex: 0 0 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
          border: 1.5px solid #b7c0ce;
          border-radius: 50%;
        }

        .dv-layout-option.active .dv-layout-radio {
          border-color: #2563eb;
        }

        .dv-layout-radio span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563eb;
        }

        .dv-layout-option strong {
          display: block;
          color: #2a3447;
          font-size: 12px;
        }

        .dv-layout-option span {
          display: block;
          margin-top: 4px;
          color: #8a94a5;
          font-size: 10px;
          line-height: 1.45;
        }

        /* ================================================
           BOUTON CRÉATION
        ================================================ */

        .dv-create-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 7px 0 10px;
        }

        .dv-create-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-width: 245px;
          min-height: 48px;
          padding: 0 20px;
          border: 0;
          border-radius: 11px;
          background: #2563eb;
          color: #fff;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 7px 18px rgba(37, 99, 235, 0.18);
          cursor: pointer;
          transition:
            background 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .dv-create-button:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 10px 23px rgba(37, 99, 235, 0.23);
        }

        .dv-create-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .dv-create-area p {
          max-width: 550px;
          margin: 9px 0 0;
          color: #929baa;
          font-size: 11px;
          text-align: center;
          line-height: 1.5;
        }

        .dv-spin {
          animation: dv-spin 1s linear infinite;
        }

        @keyframes dv-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ================================================
           RÉSUMÉ
        ================================================ */

        .dv-summary-header {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 16px;
          border-bottom: 1px solid #edf0f4;
        }

        .dv-summary-header-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #eef4ff;
          color: #2563eb;
        }

        .dv-summary-header h3 {
          margin: 0;
          color: #263043;
          font-size: 13px;
        }

        .dv-summary-header span {
          display: block;
          margin-top: 3px;
          color: #949cab;
          font-size: 10px;
        }

        .dv-summary-preview {
          padding: 17px;
          background: #f8fafc;
          border-bottom: 1px solid #edf0f4;
        }

        .dv-preview-page {
          position: relative;
          min-height: 250px;
          padding: 27px 22px 20px;
          border: 1px solid #e4e8ee;
          border-radius: 3px;
          background: #fff;
          box-shadow: 0 6px 18px rgba(23, 33, 51, 0.06);
          overflow: hidden;
          text-align: center;
        }

        .dv-preview-top-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: #2563eb;
        }

        .dv-preview-small {
          color: #6d788c;
          font-size: 7px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .dv-preview-title {
          margin-top: 44px;
          color: #1c2638;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .dv-preview-type {
          margin-top: 10px;
          color: #2563eb;
          font-size: 8px;
          font-weight: 700;
        }

        .dv-preview-lines {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-top: 37px;
        }

        .dv-preview-lines span {
          width: 80%;
          height: 3px;
          margin: auto;
          border-radius: 999px;
          background: #e8edf4;
        }

        .dv-preview-lines span:nth-child(2) {
          width: 64%;
        }

        .dv-preview-lines span:nth-child(3) {
          width: 72%;
        }

        .dv-preview-lines span:nth-child(4) {
          width: 45%;
        }

        .dv-preview-footer {
          position: absolute;
          bottom: 13px;
          left: 0;
          width: 100%;
          color: #9aa2b0;
          font-size: 7px;
        }

        .dv-summary-section {
          padding: 15px 16px;
          border-bottom: 1px solid #edf0f4;
        }

        .dv-summary-section-title {
          margin-bottom: 10px;
          color: #788398;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .dv-summary-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          margin-top: 8px;
        }

        .dv-summary-row span {
          color: #929bab;
          font-size: 11px;
        }

        .dv-summary-row strong {
          max-width: 160px;
          color: #39465b;
          font-size: 11px;
          font-weight: 700;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .dv-summary-note {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 14px 16px;
          background: #f8fbff;
          color: #52709e;
        }

        .dv-summary-note svg {
          flex: 0 0 auto;
          margin-top: 1px;
          color: #2563eb;
        }

        .dv-summary-note p {
          margin: 0;
          font-size: 10px;
          line-height: 1.55;
        }

        .dv-summary-note strong {
          color: #315b96;
        }

        /* ================================================
           STYLES DU DOCUMENT SCIENTIFIQUE
        ================================================ */

        .macevo-scientific-document {
          width: 100%;
          color: #202938;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          line-height: 1.7;
        }

        .macevo-scientific-document h1 {
          margin: 0 0 20px;
          color: #172033;
          font-size: 24px;
          line-height: 1.3;
        }

        .macevo-scientific-document h2 {
          margin: 27px 0 10px;
          color: #273247;
          font-size: 18px;
          line-height: 1.4;
        }

        .macevo-scientific-document p {
          margin: 0 0 13px;
          font-size: 14px;
          text-align: justify;
        }

        .macevo-scientific-document section {
          page-break-after: always;
          break-after: page;
        }

        .scientific-cover {
          position: relative;
          min-height: 1000px;
          padding: 100px 80px 70px;
          border: 1px solid #e4e8ef;
          background: #fff;
          text-align: center;
        }

        .cover-top-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 7px;
          background: #2563eb;
        }

        .cover-institution {
          color: #202a3b;
          font-family: Arial, sans-serif;
          font-size: 18px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .cover-department {
          margin-top: 8px;
          color: #657187;
          font-family: Arial, sans-serif;
          font-size: 13px;
          font-weight: 600;
        }

        .cover-report-type {
          margin-top: 105px;
          color: #2563eb;
          font-family: Arial, sans-serif;
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .cover-title {
          max-width: 760px;
          margin: 27px auto 0;
          color: #172033;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 31px;
          font-weight: 700;
          line-height: 1.35;
        }

        .cover-specialization {
          margin-top: 15px;
          color: #657187;
          font-size: 14px;
          font-style: italic;
        }

        .cover-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          max-width: 700px;
          margin: 100px auto 0;
          padding-top: 25px;
          border-top: 1px solid #e2e7ee;
        }

        .cover-meta div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .cover-meta span,
        .cover-supervisor span {
          color: #8a94a5;
          font-family: Arial, sans-serif;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .cover-meta strong,
        .cover-supervisor strong {
          color: #2d384b;
          font-size: 12px;
        }

        .cover-supervisor {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-top: 50px;
        }

        .cover-year {
          position: absolute;
          bottom: 40px;
          left: 0;
          width: 100%;
          color: #7f8999;
          font-family: Arial, sans-serif;
          font-size: 11px;
        }

        .scientific-toc,
        .scientific-metadata,
        .scientific-introduction,
        .scientific-section,
        .scientific-conclusion,
        .scientific-references,
        .scientific-annexes {
          padding: 70px 80px;
          background: #fff;
        }

        .scientific-toc ol {
          margin: 30px 0 0;
          padding-left: 25px;
        }

        .scientific-toc li {
          margin: 9px 0;
          font-size: 14px;
        }

        .scientific-metadata table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0 25px;
          font-family: Arial, sans-serif;
        }

        .scientific-metadata td {
          padding: 11px 13px;
          border: 1px solid #dfe4eb;
          font-size: 12px;
        }

        .scientific-metadata td:first-child {
          width: 35%;
          background: #f7f9fc;
          color: #536077;
          font-weight: 700;
        }

        .metadata-note {
          padding: 13px 15px;
          border-left: 4px solid #2563eb;
          background: #f6f9ff;
          color: #60708a;
          font-family: Arial, sans-serif;
          font-size: 12px !important;
          text-align: left !important;
        }

        .scientific-placeholder {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin: 25px 0;
          padding: 18px 20px;
          border: 1px dashed #aebbd0;
          border-radius: 8px;
          background: #f8fafc;
          color: #60708a;
          font-family: Arial, sans-serif;
        }

        .scientific-placeholder strong {
          color: #334155;
          font-size: 12px;
        }

        .scientific-placeholder span {
          font-size: 11px;
          line-height: 1.5;
        }

        /* ================================================
           RESPONSIVE
        ================================================ */

        @media (max-width: 1200px) {
          .dv-content-grid {
            grid-template-columns: minmax(0, 1fr) 285px;
          }

          .dv-layout-options {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 1050px) {
          .dv-content-grid {
            grid-template-columns: 1fr;
          }

          .dv-summary-column {
            position: static;
          }

          .dv-summary-card {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .dv-summary-header,
          .dv-summary-preview,
          .dv-summary-note {
            grid-column: 1 / -1;
          }

          .dv-summary-section {
            border-bottom: 0;
          }
        }

        @media (max-width: 760px) {
          .dv-main {
            padding: 22px 15px 35px;
          }

          .dv-page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .dv-header-badge {
            display: none;
          }

          .dv-page-header h1 {
            font-size: 23px;
          }

          .dv-grid-2,
          .dv-scientific-grid {
            grid-template-columns: 1fr;
          }

          .dv-card-body {
            padding-left: 15px;
            padding-right: 15px;
          }

          .dv-section-header {
            padding-left: 15px;
            padding-right: 15px;
          }

          .dv-summary-card {
            display: block;
          }

          .dv-summary-header,
          .dv-summary-preview,
          .dv-summary-section,
          .dv-summary-note {
            border-bottom: 1px solid #edf0f4;
          }

          .dv-structure-item {
            grid-template-columns: 29px minmax(0, 1fr) 34px;
            gap: 7px;
          }

          .dv-structure-number {
            width: 29px;
            height: 29px;
          }

          .dv-create-button {
            width: 100%;
          }

          .scientific-cover,
          .scientific-toc,
          .scientific-metadata,
          .scientific-introduction,
          .scientific-section,
          .scientific-conclusion,
          .scientific-references,
          .scientific-annexes {
            padding: 45px 25px;
          }

          .cover-title {
            font-size: 24px;
          }

          .cover-meta {
            grid-template-columns: 1fr;
            margin-top: 60px;
          }
        }

        @media (max-width: 480px) {
          .dv-header-left {
            gap: 11px;
          }

          .dv-header-icon {
            width: 45px;
            height: 45px;
            flex-basis: 45px;
          }

          .dv-page-header h1 {
            font-size: 20px;
          }

          .dv-page-header p {
            font-size: 12px;
          }

          .dv-scientific-option {
            padding: 10px;
          }

          .dv-toggle-row {
            align-items: flex-start;
          }

          .dv-structure-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .scientific-cover,
          .scientific-toc,
          .scientific-metadata,
          .scientific-introduction,
          .scientific-section,
          .scientific-conclusion,
          .scientific-references,
          .scientific-annexes {
            padding: 35px 18px;
          }

          .cover-report-type {
            margin-top: 70px;
          }

          .cover-title {
            font-size: 21px;
          }
        }
      `}</style>
    </div>
  );
}
