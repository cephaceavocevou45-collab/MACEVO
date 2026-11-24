// src/pages/Reports/NewReports.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  FolderOpen,
  GraduationCap,
  Image as ImageIcon,
  Info,
  Languages,
  Loader2,
  Settings2,
  Sparkles,
  Trash2,
  University,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import api from "../../api/axios";

import {
  ACADEMIC_LEVELS,
  CITATION_STYLES,
  DOCUMENT_TYPES,
  LANGUAGES,
  STUDY_TYPES,
  CREATION_STEPS,
  getVisibleContextFields,
} from "../../config/reportCreationConfig";
import { getAcademicStandardsGuidance } from "../../core/academic/academicStandards";

import {
  buildRecommendedStructure,
  getModuleById,
} from "../../services/reportStructureEngine";
import { createInternationalDocument } from "../../services/internationalDocumentFactory";

import "./NewReports.css";


/* ============================================================
   PAYS
============================================================ */

const COUNTRIES = [
  { value: "Afghanistan", label: "Afghanistan" },
  { value: "Afrique du Sud", label: "Afrique du Sud" },
  { value: "Albanie", label: "Albanie" },
  { value: "Algérie", label: "Algérie" },
  { value: "Allemagne", label: "Allemagne" },
  { value: "Andorre", label: "Andorre" },
  { value: "Angola", label: "Angola" },
  { value: "Antigua-et-Barbuda", label: "Antigua-et-Barbuda" },
  { value: "Arabie saoudite", label: "Arabie saoudite" },
  { value: "Argentine", label: "Argentine" },
  { value: "Arménie", label: "Arménie" },
  { value: "Australie", label: "Australie" },
  { value: "Autriche", label: "Autriche" },
  { value: "Azerbaïdjan", label: "Azerbaïdjan" },
  { value: "Bahamas", label: "Bahamas" },
  { value: "Bahreïn", label: "Bahreïn" },
  { value: "Bangladesh", label: "Bangladesh" },
  { value: "Barbade", label: "Barbade" },
  { value: "Belgique", label: "Belgique" },
  { value: "Belize", label: "Belize" },
  { value: "Bénin", label: "Bénin" },
  { value: "Bhoutan", label: "Bhoutan" },
  { value: "Biélorussie", label: "Biélorussie" },
  { value: "Bolivie", label: "Bolivie" },
  { value: "Bosnie-Herzégovine", label: "Bosnie-Herzégovine" },
  { value: "Botswana", label: "Botswana" },
  { value: "Brésil", label: "Brésil" },
  { value: "Brunei", label: "Brunei" },
  { value: "Bulgarie", label: "Bulgarie" },
  { value: "Burkina Faso", label: "Burkina Faso" },
  { value: "Burundi", label: "Burundi" },
  { value: "Cambodge", label: "Cambodge" },
  { value: "Cameroun", label: "Cameroun" },
  { value: "Canada", label: "Canada" },
  { value: "Cap-Vert", label: "Cap-Vert" },
  { value: "Chili", label: "Chili" },
  { value: "Chine", label: "Chine" },
  { value: "Chypre", label: "Chypre" },
  { value: "Colombie", label: "Colombie" },
  { value: "Comores", label: "Comores" },
  { value: "Congo", label: "Congo" },
  {
    value: "Congo (République démocratique du)",
    label: "Congo (République démocratique du)",
  },
  { value: "Corée du Nord", label: "Corée du Nord" },
  { value: "Corée du Sud", label: "Corée du Sud" },
  { value: "Costa Rica", label: "Costa Rica" },
  { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
  { value: "Croatie", label: "Croatie" },
  { value: "Cuba", label: "Cuba" },
  { value: "Danemark", label: "Danemark" },
  { value: "Djibouti", label: "Djibouti" },
  { value: "Dominique", label: "Dominique" },
  { value: "Égypte", label: "Égypte" },
  { value: "Émirats arabes unis", label: "Émirats arabes unis" },
  { value: "Équateur", label: "Équateur" },
  { value: "Érythrée", label: "Érythrée" },
  { value: "Espagne", label: "Espagne" },
  { value: "Estonie", label: "Estonie" },
  { value: "Eswatini", label: "Eswatini" },
  { value: "États-Unis", label: "États-Unis" },
  { value: "Éthiopie", label: "Éthiopie" },
  { value: "Fidji", label: "Fidji" },
  { value: "Finlande", label: "Finlande" },
  { value: "France", label: "France" },
  { value: "Gabon", label: "Gabon" },
  { value: "Gambie", label: "Gambie" },
  { value: "Géorgie", label: "Géorgie" },
  { value: "Ghana", label: "Ghana" },
  { value: "Grèce", label: "Grèce" },
  { value: "Grenade", label: "Grenade" },
  { value: "Guatemala", label: "Guatemala" },
  { value: "Guinée", label: "Guinée" },
  { value: "Guinée-Bissau", label: "Guinée-Bissau" },
  { value: "Guinée équatoriale", label: "Guinée équatoriale" },
  { value: "Guyana", label: "Guyana" },
  { value: "Haïti", label: "Haïti" },
  { value: "Honduras", label: "Honduras" },
  { value: "Hongrie", label: "Hongrie" },
  { value: "Inde", label: "Inde" },
  { value: "Indonésie", label: "Indonésie" },
  { value: "Irak", label: "Irak" },
  { value: "Iran", label: "Iran" },
  { value: "Irlande", label: "Irlande" },
  { value: "Islande", label: "Islande" },
  { value: "Israël", label: "Israël" },
  { value: "Italie", label: "Italie" },
  { value: "Jamaïque", label: "Jamaïque" },
  { value: "Japon", label: "Japon" },
  { value: "Jordanie", label: "Jordanie" },
  { value: "Kazakhstan", label: "Kazakhstan" },
  { value: "Kenya", label: "Kenya" },
  { value: "Kirghizistan", label: "Kirghizistan" },
  { value: "Kiribati", label: "Kiribati" },
  { value: "Koweït", label: "Koweït" },
  { value: "Laos", label: "Laos" },
  { value: "Lesotho", label: "Lesotho" },
  { value: "Lettonie", label: "Lettonie" },
  { value: "Liban", label: "Liban" },
  { value: "Libéria", label: "Libéria" },
  { value: "Libye", label: "Libye" },
  { value: "Liechtenstein", label: "Liechtenstein" },
  { value: "Lituanie", label: "Lituanie" },
  { value: "Luxembourg", label: "Luxembourg" },
  { value: "Macédoine du Nord", label: "Macédoine du Nord" },
  { value: "Madagascar", label: "Madagascar" },
  { value: "Malaisie", label: "Malaisie" },
  { value: "Malawi", label: "Malawi" },
  { value: "Maldives", label: "Maldives" },
  { value: "Mali", label: "Mali" },
  { value: "Malte", label: "Malte" },
  { value: "Maroc", label: "Maroc" },
  { value: "Marshall", label: "Îles Marshall" },
  { value: "Maurice", label: "Maurice" },
  { value: "Mauritanie", label: "Mauritanie" },
  { value: "Mexique", label: "Mexique" },
  { value: "Micronésie", label: "Micronésie" },
  { value: "Moldavie", label: "Moldavie" },
  { value: "Monaco", label: "Monaco" },
  { value: "Mongolie", label: "Mongolie" },
  { value: "Monténégro", label: "Monténégro" },
  { value: "Mozambique", label: "Mozambique" },
  { value: "Myanmar", label: "Myanmar" },
  { value: "Namibie", label: "Namibie" },
  { value: "Nauru", label: "Nauru" },
  { value: "Népal", label: "Népal" },
  { value: "Nicaragua", label: "Nicaragua" },
  { value: "Niger", label: "Niger" },
  { value: "Nigéria", label: "Nigéria" },
  { value: "Norvège", label: "Norvège" },
  { value: "Nouvelle-Zélande", label: "Nouvelle-Zélande" },
  { value: "Oman", label: "Oman" },
  { value: "Ouganda", label: "Ouganda" },
  { value: "Ouzbékistan", label: "Ouzbékistan" },
  { value: "Pakistan", label: "Pakistan" },
  { value: "Palaos", label: "Palaos" },
  { value: "Panama", label: "Panama" },
  { value: "Papouasie-Nouvelle-Guinée", label: "Papouasie-Nouvelle-Guinée" },
  { value: "Paraguay", label: "Paraguay" },
  { value: "Pays-Bas", label: "Pays-Bas" },
  { value: "Pérou", label: "Pérou" },
  { value: "Philippines", label: "Philippines" },
  { value: "Pologne", label: "Pologne" },
  { value: "Portugal", label: "Portugal" },
  { value: "Qatar", label: "Qatar" },
  { value: "République centrafricaine", label: "République centrafricaine" },
  { value: "République dominicaine", label: "République dominicaine" },
  { value: "Roumanie", label: "Roumanie" },
  { value: "Royaume-Uni", label: "Royaume-Uni" },
  { value: "Russie", label: "Russie" },
  { value: "Rwanda", label: "Rwanda" },
  { value: "Saint-Kitts-et-Nevis", label: "Saint-Kitts-et-Nevis" },
  { value: "Sainte-Lucie", label: "Sainte-Lucie" },
  { value: "Saint-Marin", label: "Saint-Marin" },
  { value: "Saint-Vincent-et-les-Grenadines", label: "Saint-Vincent-et-les-Grenadines" },
  { value: "Salomon", label: "Îles Salomon" },
  { value: "Salvador", label: "El Salvador" },
  { value: "Samoa", label: "Samoa" },
  { value: "São Tomé-et-Príncipe", label: "São Tomé-et-Príncipe" },
  { value: "Sénégal", label: "Sénégal" },
  { value: "Serbie", label: "Serbie" },
  { value: "Seychelles", label: "Seychelles" },
  { value: "Sierra Leone", label: "Sierra Leone" },
  { value: "Singapour", label: "Singapour" },
  { value: "Slovaquie", label: "Slovaquie" },
  { value: "Slovénie", label: "Slovénie" },
  { value: "Somalie", label: "Somalie" },
  { value: "Soudan", label: "Soudan" },
  { value: "Soudan du Sud", label: "Soudan du Sud" },
  { value: "Sri Lanka", label: "Sri Lanka" },
  { value: "Suède", label: "Suède" },
  { value: "Suisse", label: "Suisse" },
  { value: "Suriname", label: "Suriname" },
  { value: "Syrie", label: "Syrie" },
  { value: "Tadjikistan", label: "Tadjikistan" },
  { value: "Tanzanie", label: "Tanzanie" },
  { value: "Tchad", label: "Tchad" },
  { value: "Tchéquie", label: "Tchéquie" },
  { value: "Thaïlande", label: "Thaïlande" },
  { value: "Timor oriental", label: "Timor oriental" },
  { value: "Togo", label: "Togo" },
  { value: "Tonga", label: "Tonga" },
  { value: "Trinité-et-Tobago", label: "Trinité-et-Tobago" },
  { value: "Tunisie", label: "Tunisie" },
  { value: "Turkménistan", label: "Turkménistan" },
  { value: "Turquie", label: "Turquie" },
  { value: "Tuvalu", label: "Tuvalu" },
  { value: "Ukraine", label: "Ukraine" },
  { value: "Uruguay", label: "Uruguay" },
  { value: "Vanuatu", label: "Vanuatu" },
  { value: "Vatican", label: "Vatican" },
  { value: "Venezuela", label: "Venezuela" },
  { value: "Viêt Nam", label: "Viêt Nam" },
  { value: "Yémen", label: "Yémen" },
  { value: "Zambie", label: "Zambie" },
  { value: "Zimbabwe", label: "Zimbabwe" },
  { value: "Autre", label: "Autre" },
];


/* ============================================================
   FORMULAIRE INITIAL
============================================================ */

const EMPTY_FORM = {
  title: "",
  reportType: "",
  scientificField: "",
  academicLevel: "",
  language: "fr",
  diploma: "",

  authorFirstName: "",
  authorLastName: "",
  studentId: "",

  country: "",
  customCountry: "",
  institution: "",
  faculty: "",
  department: "",
  laboratory: "",
  program: "",
  specialty: "",
  academicYear: "",

  director: "",
  coDirector: "",
  supervisor: "",
  coSupervisor: "",

  juryPresident: "",
  juryRapporteur: "",
  juryExaminer: "",
  juryMembers: "",

  studyType: "",
  citationStyle: "",
  referenceLanguage: "",

  institutionalRequirements: "",
  institutionalRequirementsSource: "",
  otherRequirements: "",

  generateToc: true,

  logoFile: null,
};


/* ============================================================
   UTILITAIRES
============================================================ */

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .trim()
    .replace(/\s+/g, " ");
}


function normalizeTitle(value) {
  return normalizeValue(value);
}


function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function createInitialContent(title) {
  const safeTitle =
    title || "Nouveau document";

  return `
    <h1>${escapeHtml(safeTitle)}</h1>
  `.trim();
}


function getOptionLabel(options, value) {
  const option = options.find(
    (item) => item.value === value
  );

  return (
    option?.label ||
    value ||
    "Non renseigné"
  );
}


function getEffectiveCountry(form) {
  if (form.country === "Autre") {
    return normalizeValue(form.customCountry);
  }

  return normalizeValue(form.country);
}


function parseJuryMembers(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLines(value) {
  const items = Array.isArray(value)
    ? value
    : String(value || "").split(/\r?\n/);

  return items
    .map((item) => normalizeValue(item))
    .filter(Boolean);
}


/* ============================================================
   CONSTRUCTION DU DOCUMENT
============================================================ */

function buildReportPayload(form, structure) {
  const title = normalizeTitle(form.title);
  const country = getEffectiveCountry(form);

  return {

    title,

    summary: "",

    scientific_field:
      normalizeValue(
        form.scientificField
      ),

    report_type:
      normalizeValue(
        form.reportType
      ),

    academic_level:
      normalizeValue(
        form.academicLevel
      ),

    language:
      normalizeValue(
        form.language
      ) || "fr",

    diploma:
      normalizeValue(
        form.diploma
      ),

    author_first_name:
      normalizeValue(
        form.authorFirstName
      ),

    author_last_name:
      normalizeValue(
        form.authorLastName
      ),

    student_id:
      normalizeValue(
        form.studentId
      ),

    country,

    institution:
      normalizeValue(
        form.institution
      ),

    faculty:
      normalizeValue(
        form.faculty
      ),

    department:
      normalizeValue(
        form.department
      ),

    laboratory:
      normalizeValue(
        form.laboratory
      ),

    program:
      normalizeValue(
        form.program
      ),

    specialty:
      normalizeValue(
        form.specialty
      ),

    academic_year:
      normalizeValue(
        form.academicYear
      ),

    director:
      normalizeValue(
        form.director
      ),

    co_director:
      normalizeValue(
        form.coDirector
      ),

    supervisor:
      normalizeValue(
        form.supervisor
      ),

    co_supervisor:
      normalizeValue(
        form.coSupervisor
      ),

    jury_president:
      normalizeValue(
        form.juryPresident
      ),

    jury_rapporteur:
      normalizeValue(
        form.juryRapporteur
      ),

    jury_examiner:
      normalizeValue(
        form.juryExaminer
      ),

    jury_members:
      parseJuryMembers(
        form.juryMembers
      ),

    study_type:
      normalizeValue(
        form.studyType
      ),

    research_problem:
      normalizeValue(
        form.researchProblem || form.problemStatement
      ),

    research_questions:
      parseLines(form.researchQuestions || form.researchQuestion),

    general_objective:
      normalizeValue(
        form.generalObjective || form.objective
      ),

    specific_objectives:
      parseLines(form.specificObjectives || form.objectives),

    hypotheses:
      parseLines(form.hypotheses),

    methodology:
      normalizeValue(form.methodology),

    supervisor_instructions:
      normalizeValue(form.supervisorInstructions),

    citation_style:
      normalizeValue(
        form.citationStyle
      ),

    reference_language:
      normalizeValue(
        form.referenceLanguage
      ),

    institutional_requirements:
      normalizeValue(
        form.institutionalRequirements
      ),

    other_requirements:
      normalizeValue(
        form.otherRequirements
      ),

    generate_toc:
      Boolean(form.generateToc),

    structure:
      Array.isArray(structure)
        ? structure
        : [],

    content:
      createInitialContent(title),

    status: "draft",
  };
}


/* ============================================================
   VALIDATION FINALE
============================================================ */

function validateFinalReport(
  form,
  structure
) {
  const errors = [];

  if (!normalizeValue(form.title)) {
    errors.push(
      "Le titre du document est obligatoire."
    );
  }

  if (!normalizeValue(form.reportType)) {
    errors.push(
      "Le type de document est obligatoire."
    );
  }

  if (
    !normalizeValue(
      form.scientificField
    )
  ) {
    errors.push(
      "Le domaine ou la discipline est obligatoire."
    );
  }

  if (
    !normalizeValue(
      form.academicLevel
    )
  ) {
    errors.push(
      "Le niveau académique est obligatoire."
    );
  }

  if (!normalizeValue(form.language)) {
    errors.push(
      "La langue du document est obligatoire."
    );
  }

  if (
    !Array.isArray(structure) ||
    structure.length === 0
  ) {
    errors.push(
      "La structure du document est vide."
    );
  }

  if (
    !structure.some(
      (item) =>
        item?.id === "cover-page"
    )
  ) {
    errors.push(
      "La page de garde est obligatoire."
    );
  }

  if (
    form.country === "Autre" &&
    !normalizeValue(
      form.customCountry
    )
  ) {
    errors.push(
      "Veuillez renseigner le nom du pays."
    );
  }

  return errors;
}


/* ============================================================
   COMPOSANTS UI
============================================================ */

function StepIndicator({
  currentStep,
}) {
  return (
    <div className="macevo-stepper">
      {CREATION_STEPS.map(
        (step, index) => {
          const stepNumber =
            index + 1;

          const active =
            currentStep ===
            stepNumber;

          const completed =
            currentStep >
            stepNumber;

          return (
            <React.Fragment
              key={step.id}
            >
              <div
                className={[
                  "macevo-step",
                  active
                    ? "is-active"
                    : "",
                  completed
                    ? "is-completed"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="macevo-step__number">
                  {completed ? (
                    <Check size={16} />
                  ) : (
                    stepNumber
                  )}
                </div>

                <div className="macevo-step__content">
                  <span className="macevo-step__label">
                    {step.label}
                  </span>

                  <span className="macevo-step__description">
                    {step.description}
                  </span>
                </div>
              </div>

              {index <
                CREATION_STEPS.length -
                  1 && (
                <div
                  className={[
                    "macevo-stepper__line",
                    currentStep >
                    stepNumber
                      ? "is-completed"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
              )}
            </React.Fragment>
          );
        }
      )}
    </div>
  );
}


function FieldLabel({
  children,
  required = false,
  hint,
}) {
  return (
    <div className="macevo-field__label-row">
      <label className="macevo-field__label">
        {children}

        {required && (
          <span
            className="macevo-required"
            aria-label="Champ obligatoire"
          >
            *
          </span>
        )}
      </label>

      {hint && (
        <span className="macevo-field__hint">
          {hint}
        </span>
      )}
    </div>
  );
}


function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  hint,
  disabled = false,
}) {
  return (
    <div className="macevo-field">
      <FieldLabel
        required={required}
        hint={hint}
      >
        {label}
      </FieldLabel>

      <input
        type="text"
        className="macevo-input"
        value={value || ""}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}


function SelectInput({
  label,
  value,
  onChange,
  options,
  required = false,
  hint,
}) {
  return (
    <div className="macevo-field">
      <FieldLabel
        required={required}
        hint={hint}
      >
        {label}
      </FieldLabel>

      <div className="macevo-select-wrapper">
        <select
          className="macevo-input macevo-select"
          value={value || ""}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
        >
          <option value="">
            Sélectionner...
          </option>

          {options.map(
            (option) => (
              <option
                key={option.value}
                value={
                  option.value
                }
              >
                {option.label}
              </option>
            )
          )}
        </select>

        <ChevronDown size={17} />
      </div>
    </div>
  );
}


function TextareaInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  hint,
  rows = 4,
}) {
  return (
    <div className="macevo-field">
      <FieldLabel
        required={required}
        hint={hint}
      >
        {label}
      </FieldLabel>

      <textarea
        className="macevo-input macevo-textarea"
        value={value || ""}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}


function SummaryItem({
  label,
  value,
}) {
  return (
    <div className="macevo-summary-item">
      <span>{label}</span>

      <strong>
        {value ||
          "Non renseigné"}
      </strong>
    </div>
  );
}


/* ============================================================
   RÉSUMÉ
============================================================ */

function SummaryPanel({
  form,
  structure,
  currentStep,
}) {
  const documentType =
    getOptionLabel(
      DOCUMENT_TYPES,
      form.reportType
    );

  const academicLevel =
    getOptionLabel(
      ACADEMIC_LEVELS,
      form.academicLevel
    );

  const language =
    getOptionLabel(
      LANGUAGES,
      form.language
    );

  const citationStyle =
    getOptionLabel(
      CITATION_STYLES,
      form.citationStyle
    );

  const country =
    getEffectiveCountry(form);

  return (
    <aside className="macevo-summary">
      <div className="macevo-summary__header">
        <div className="macevo-summary__icon">
          <FileText size={18} />
        </div>

        <div>
          <h3>
            Résumé du document
          </h3>

          <p>
            Votre configuration actuelle
          </p>
        </div>
      </div>

      <div className="macevo-summary__body">
        <SummaryItem
          label="Titre"
          value={form.title}
        />

        <SummaryItem
          label="Type"
          value={documentType}
        />

        <SummaryItem
          label="Domaine"
          value={
            form.scientificField
          }
        />

        <SummaryItem
          label="Niveau"
          value={academicLevel}
        />

        <SummaryItem
          label="Langue"
          value={language}
        />

        <SummaryItem
          label="Pays"
          value={country}
        />

        <SummaryItem
          label="Institution"
          value={form.institution}
        />

        <SummaryItem
          label="Filière"
          value={form.program}
        />

        <SummaryItem
          label="Type d'étude"
          value={getOptionLabel(
            STUDY_TYPES,
            form.studyType
          )}
        />

        <SummaryItem
          label="Norme"
          value={citationStyle}
        />

        {structure.length >
          0 && (
          <div className="macevo-summary__structure">
            <div className="macevo-summary__structure-title">
              <span>
                Structure
              </span>

              <strong>
                {structure.length} éléments
              </strong>
            </div>

            <ol>
              {structure
                .slice(0, 8)
                .map(
                  (item) => (
                    <li
                      key={
                        item.instanceId
                      }
                    >
                      {item.title}
                    </li>
                  )
                )}

              {structure.length >
                8 && (
                <li className="macevo-summary__more">
                  +{" "}
                  {structure.length -
                    8}{" "}
                  autres éléments
                </li>
              )}
            </ol>
          </div>
        )}
      </div>

      <div className="macevo-summary__footer">
        <div className="macevo-progress-mini">
          <div className="macevo-progress-mini__header">
            <span>
              Progression
            </span>

            <strong>
              {currentStep}/5
            </strong>
          </div>

          <div className="macevo-progress-mini__track">
            <div
              className="macevo-progress-mini__value"
              style={{
                width: `${
                  (currentStep / 5) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}


/* ============================================================
   ÉTAPE 1
============================================================ */

function EssentialInformationStep({
  form,
  updateField,
}) {
  return (
    <section className="macevo-panel">
      <div className="macevo-panel__intro">
        <div className="macevo-panel__icon">
          <FileText size={21} />
        </div>

        <div>
          <h1>
            Définissons votre document
          </h1>

          <p>
            Commencez par les informations
            essentielles. MACEVO utilisera
            ensuite ces informations pour
            proposer une structure adaptée.
          </p>
        </div>
      </div>

      <div className="macevo-form-grid">
        <div className="macevo-form-grid__full">
          <TextInput
            label="Titre du document"
            required
            value={form.title}
            onChange={(value) =>
              updateField(
                "title",
                value
              )
            }
            placeholder="Ex. Analyse de la performance des réseaux..."
            hint="Vous pourrez le modifier plus tard dans l’éditeur."
          />
        </div>

        <SelectInput
          label="Type de document"
          required
          value={form.reportType}
          onChange={(value) =>
            updateField(
              "reportType",
              value
            )
          }
          options={
            DOCUMENT_TYPES
          }
        />

        <TextInput
          label="Domaine / discipline"
          required
          value={
            form.scientificField
          }
          onChange={(value) =>
            updateField(
              "scientificField",
              value
            )
          }
          placeholder="Ex. Informatique, droit, économie..."
        />

        <SelectInput
          label="Niveau académique"
          required
          value={
            form.academicLevel
          }
          onChange={(value) =>
            updateField(
              "academicLevel",
              value
            )
          }
          options={
            ACADEMIC_LEVELS
          }
        />

        <SelectInput
          label="Langue du document"
          required
          value={form.language}
          onChange={(value) =>
            updateField(
              "language",
              value
            )
          }
          options={LANGUAGES}
        />

        <TextInput
          label="Diplôme / grade"
          value={form.diploma}
          onChange={(value) =>
            updateField(
              "diploma",
              value
            )
          }
          placeholder="Ex. Master en informatique"
        />
      </div>

      <div className="macevo-info-box">
        <Info size={18} />

        <div>
          <strong>
            Architecture internationale
          </strong>

          <p>
            Les informations institutionnelles,
            l'encadrement, le jury et les
            préférences seront renseignés dans
            les étapes suivantes.
          </p>
        </div>
      </div>
    </section>
  );
}


/* ============================================================
   ÉTAPE 2
============================================================ */

function ContextStep({
  form,
  updateField,
  logoPreview,
  logoInputRef,
  handleLogoChange,
  removeLogo,
}) {
  const visibleFields =
    useMemo(
      () =>
        getVisibleContextFields(
          form
        ),
      [form]
    );

  return (
    <section className="macevo-panel">

      <div className="macevo-panel__intro">
        <div className="macevo-panel__icon">
          <University size={21} />
        </div>

        <div>
          <h1>
            Contexte académique
          </h1>

          <p>
            Renseignez l'identité,
            l'institution, la formation,
            l'encadrement et le jury.
          </p>
        </div>
      </div>


      {/* ======================================================
          AUTEUR
      ====================================================== */}

      <div className="macevo-section-heading">
        <div>
          <h2>
            Identité de l'auteur
          </h2>

          <p>
            Ces informations pourront être
            utilisées directement sur la page
            de garde.
          </p>
        </div>
      </div>

      <div className="macevo-form-grid">
        <TextInput
          label="Prénom"
          value={
            form.authorFirstName
          }
          onChange={(value) =>
            updateField(
              "authorFirstName",
              value
            )
          }
          placeholder="Prénom"
        />

        <TextInput
          label="Nom"
          value={
            form.authorLastName
          }
          onChange={(value) =>
            updateField(
              "authorLastName",
              value
            )
          }
          placeholder="Nom"
        />

        <TextInput
          label="Identifiant étudiant"
          value={
            form.studentId
          }
          onChange={(value) =>
            updateField(
              "studentId",
              value
            )
          }
          placeholder="Matricule"
        />

        <TextInput
          label="Année académique"
          value={
            form.academicYear
          }
          onChange={(value) =>
            updateField(
              "academicYear",
              value
            )
          }
          placeholder="Ex. 2026-2027"
        />
      </div>


      {/* ======================================================
          INSTITUTION
      ====================================================== */}

      <div className="macevo-section-heading macevo-section-heading--spaced">
        <div>
          <h2>
            Institution et formation
          </h2>

          <p>
            Ces informations serviront à
            construire l'identité institutionnelle
            du document.
          </p>
        </div>
      </div>

      <div className="macevo-form-grid">

        {visibleFields.includes(
          "country"
        ) && (
          <div className="macevo-field">
            <FieldLabel>
              Pays
            </FieldLabel>

            <div className="macevo-select-wrapper">
              <select
                className="macevo-input macevo-select"
                value={
                  form.country
                }
                onChange={(event) => {
                  updateField(
                    "country",
                    event.target.value
                  );

                  if (
                    event.target
                      .value !==
                    "Autre"
                  ) {
                    updateField(
                      "customCountry",
                      ""
                    );
                  }
                }}
              >
                <option value="">
                  Sélectionner un pays...
                </option>

                {COUNTRIES.map(
                  (country) => (
                    <option
                      key={
                        country.value
                      }
                      value={
                        country.value
                      }
                    >
                      {country.label}
                    </option>
                  )
                )}
              </select>

              <ChevronDown size={17} />
            </div>

            {form.country ===
              "Autre" && (
              <div
                style={{
                  marginTop:
                    "10px",
                }}
              >
                <TextInput
                  label="Nom du pays"
                  value={
                    form.customCountry
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "customCountry",
                      value
                    )
                  }
                  placeholder="Saisissez le nom du pays"
                />
              </div>
            )}
          </div>
        )}

        {visibleFields.includes(
          "institution"
        ) && (
          <TextInput
            label="Université / institution"
            value={
              form.institution
            }
            onChange={(value) =>
              updateField(
                "institution",
                value
              )
            }
            placeholder="Ex. Université..."
          />
        )}

        {visibleFields.includes(
          "faculty"
        ) && (
          <TextInput
            label="Faculté / école"
            value={form.faculty}
            onChange={(value) =>
              updateField(
                "faculty",
                value
              )
            }
            placeholder="Ex. Faculté des sciences"
          />
        )}

        {visibleFields.includes(
          "department"
        ) && (
          <TextInput
            label="Département"
            value={
              form.department
            }
            onChange={(value) =>
              updateField(
                "department",
                value
              )
            }
            placeholder="Ex. Informatique"
          />
        )}

        <TextInput
          label="Laboratoire / centre de recherche"
          value={
            form.laboratory
          }
          onChange={(value) =>
            updateField(
              "laboratory",
              value
            )
          }
          placeholder="Optionnel"
        />

        {visibleFields.includes(
          "program"
        ) && (
          <TextInput
            label="Filière / programme"
            value={form.program}
            onChange={(value) =>
              updateField(
                "program",
                value
              )
            }
            placeholder="Ex. Génie logiciel"
          />
        )}

        {visibleFields.includes(
          "specialty"
        ) && (
          <TextInput
            label="Spécialité"
            value={
              form.specialty
            }
            onChange={(value) =>
              updateField(
                "specialty",
                value
              )
            }
            placeholder="Optionnel"
          />
        )}
      </div>


      {/* ======================================================
          ENCADREMENT
      ====================================================== */}

      <div className="macevo-section-heading macevo-section-heading--spaced">
        <div>
          <h2>
            Direction et encadrement
          </h2>

          <p>
            Renseignez les personnes qui
            participent à l'encadrement du travail.
          </p>
        </div>
      </div>

      <div className="macevo-form-grid">

        <TextInput
          label="Directeur"
          value={form.director}
          onChange={(value) =>
            updateField(
              "director",
              value
            )
          }
          placeholder="Nom et prénom"
        />

        <TextInput
          label="Co-directeur"
          value={
            form.coDirector
          }
          onChange={(value) =>
            updateField(
              "coDirector",
              value
            )
          }
          placeholder="Optionnel"
        />

        {visibleFields.includes(
          "supervisor"
        ) && (
          <TextInput
            label="Encadreur"
            value={
              form.supervisor
            }
            onChange={(value) =>
              updateField(
                "supervisor",
                value
              )
            }
            placeholder="Nom et prénom"
          />
        )}

        <TextInput
          label="Co-encadreur"
          value={
            form.coSupervisor
          }
          onChange={(value) =>
            updateField(
              "coSupervisor",
              value
            )
          }
          placeholder="Optionnel"
        />
      </div>


      {/* ======================================================
          JURY
      ====================================================== */}

      <div className="macevo-section-heading macevo-section-heading--spaced">
        <div>
          <h2>
            Jury
          </h2>

          <p>
            Informations optionnelles pour
            la page institutionnelle et la page
            de garde.
          </p>
        </div>
      </div>

      <div className="macevo-form-grid">

        <TextInput
          label="Président du jury"
          value={
            form.juryPresident
          }
          onChange={(value) =>
            updateField(
              "juryPresident",
              value
            )
          }
          placeholder="Nom et prénom"
        />

        <TextInput
          label="Rapporteur"
          value={
            form.juryRapporteur
          }
          onChange={(value) =>
            updateField(
              "juryRapporteur",
              value
            )
          }
          placeholder="Nom et prénom"
        />

        <TextInput
          label="Examinateur"
          value={
            form.juryExaminer
          }
          onChange={(value) =>
            updateField(
              "juryExaminer",
              value
            )
          }
          placeholder="Nom et prénom"
        />

        <div className="macevo-form-grid__full">
          <TextareaInput
            label="Autres membres du jury"
            value={
              form.juryMembers
            }
            onChange={(value) =>
              updateField(
                "juryMembers",
                value
              )
            }
            placeholder="Un membre par ligne..."
            rows={4}
          />
        </div>
      </div>


      {/* ======================================================
          LOGO PROFESSIONNEL
      ====================================================== */}

      <div className="macevo-section-heading macevo-section-heading--spaced">
        <div>
          <h2>
            Logo institutionnel
          </h2>

          <p>
            Ajoutez le logo officiel de votre
            établissement pour la page de garde.
          </p>
        </div>
      </div>

      <div className="macevo-logo-upload">

        <input
          ref={logoInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={
            handleLogoChange
          }
          hidden
        />

        {!logoPreview ? (
          <button
            type="button"
            className="macevo-logo-dropzone"
            onClick={() =>
              logoInputRef.current?.click()
            }
          >
            <span className="macevo-logo-dropzone__icon">
              <ImageIcon size={28} />
            </span>

            <span className="macevo-logo-dropzone__title">
              Importer le logo de votre institution
            </span>

            <span className="macevo-logo-dropzone__description">
              Ajoutez le logo officiel qui
              apparaîtra sur votre document.
            </span>

            <span className="macevo-logo-dropzone__formats">
              PNG, JPG, JPEG, WEBP ou SVG
              <span>•</span>
              Taille maximale : 5 Mo
            </span>

            <span className="macevo-logo-dropzone__button">
              <FolderOpen size={17} />
              Choisir un fichier
            </span>
          </button>
        ) : (
          <div className="macevo-logo-preview">

            <div className="macevo-logo-preview__image">
              <img
                src={logoPreview}
                alt="Aperçu du logo institutionnel"
              />
            </div>

            <div className="macevo-logo-preview__content">

              <div>
                <strong>
                  Logo institutionnel sélectionné
                </strong>

                <p>
                  Le logo sera envoyé avec le
                  rapport lors de sa création.
                </p>
              </div>

              <div className="macevo-logo-actions">

                <button
                  type="button"
                  className="macevo-secondary-button"
                  onClick={() =>
                    logoInputRef.current?.click()
                  }
                >
                  <Upload size={16} />
                  Remplacer
                </button>

                <button
                  type="button"
                  className="macevo-secondary-button macevo-secondary-button--danger"
                  onClick={
                    removeLogo
                  }
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>

              </div>
            </div>
          </div>
        )}
      </div>

      <div className="macevo-info-box">
        <Info size={18} />

        <div>
          <strong>
            Utilisation du logo
          </strong>

          <p>
            Le logo sélectionné sera transmis
            à Django et pourra être utilisé sur
            la page de garde et dans les éléments
            institutionnels du document.
          </p>
        </div>
      </div>

    </section>
  );
}


/* ============================================================
   ÉTAPE 3
============================================================ */

function PreferencesStep({
  form,
  updateField,
}) {
  return (
    <section className="macevo-panel">

      <div className="macevo-panel__intro">

        <div className="macevo-panel__icon">
          <Settings2 size={21} />
        </div>

        <div>
          <h1>
            Préférences et normes
          </h1>

          <p>
            Indiquez les règles connues pour
            votre document.
          </p>
        </div>

      </div>

      <div className="macevo-form-grid">

        <SelectInput
          label="Type d'étude"
          value={
            form.studyType
          }
          onChange={(value) =>
            updateField(
              "studyType",
              value
            )
          }
          options={STUDY_TYPES}
        />

        <SelectInput
          label="Style de citation"
          value={
            form.citationStyle
          }
          onChange={(value) =>
            updateField(
              "citationStyle",
              value
            )
          }
          options={
            CITATION_STYLES
          }
        />

        <SelectInput
          label="Langue des références"
          value={
            form.referenceLanguage
          }
          onChange={(value) =>
            updateField(
              "referenceLanguage",
              value
            )
          }
          options={LANGUAGES}
        />

        <div className="macevo-form-grid__full">
          <TextareaInput
            label="Exigences institutionnelles"
            value={
              form.institutionalRequirements
            }
            onChange={(value) =>
              updateField(
                "institutionalRequirements",
                value
              )
            }
            placeholder="Ex. police imposée, nombre de pages, ordre des parties..."
            hint="Facultatif."
          />
        </div>

        <div className="macevo-form-grid__full">
          <TextInput
            label="Lien vers les consignes officielles"
            value={form.institutionalRequirementsSource}
            onChange={(value) =>
              updateField("institutionalRequirementsSource", value)
            }
            placeholder="https://universite.example/guide-memoire.pdf"
            hint="Facultatif. Le lien sera conservé avec le document pour retrouver la source des règles."
          />
          <div className="macevo-info-box">
            <Info size={16} />
            <div>
              <p>
                {getAcademicStandardsGuidance(
                  getEffectiveCountry(form),
                  form.institution,
                  form.institutionalRequirements,
                  form.institutionalRequirementsSource
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="macevo-form-grid__full">
          <TextareaInput
            label="Autres contraintes"
            value={
              form.otherRequirements
            }
            onChange={(value) =>
              updateField(
                "otherRequirements",
                value
              )
            }
            placeholder="Autres informations utiles..."
          />
        </div>

      </div>

      <label
        className="macevo-toggle-field"
        htmlFor="generate-toc"
      >
        <span className="macevo-toggle-field__content">
          <strong>
            Générer automatiquement
            la table des matières
          </strong>

          <small>
            Elle sera construite à partir
            de la structure réelle du document.
          </small>
        </span>

        <span className="macevo-toggle">
          <input
            id="generate-toc"
            type="checkbox"
            checked={
              Boolean(
                form.generateToc
              )
            }
            onChange={(event) =>
              updateField(
                "generateToc",
                event.target.checked
              )
            }
          />

          <span className="macevo-toggle__track">
            <span className="macevo-toggle__thumb" />
          </span>
        </span>
      </label>

      <div className="macevo-info-box macevo-info-box--neutral">

        <Languages size={18} />

        <div>
          <strong>
            Vous ne connaissez pas
            encore la norme ?
          </strong>

          <p>
            Ce n'est pas bloquant. La structure
            peut être créée avant de définir
            précisément la norme bibliographique.
          </p>
        </div>

      </div>

    </section>
  );
}


/* ============================================================
   ÉTAPE 4
============================================================ */

function StructureStep({
  structure,
  setStructure,
}) {
  const moduleInstanceCounter = useRef(0);
  const [
    showAddModule,
    setShowAddModule,
  ] = useState(false);

  const availableModules = [
    "dedication",
    "acknowledgements",
    "abstract",
    "abstract-second-language",
    "table-of-contents",
    "list-of-figures",
    "list-of-tables",
    "abbreviations",
    "glossary",
    "problem-statement",
    "research-questions",
    "objectives",
    "hypotheses",
    "theoretical-framework",
    "conceptual-framework",
    "appendices",
  ];

  function removeItem(
    instanceId
  ) {
    setStructure(
      (current) =>
        current.filter(
          (item) =>
            item.instanceId !==
            instanceId
        )
    );
  }

  function moveItem(
    instanceId,
    direction
  ) {
    setStructure(
      (current) => {
        const index =
          current.findIndex(
            (item) =>
              item.instanceId ===
              instanceId
          );

        if (index === -1) {
          return current;
        }

        const targetIndex =
          direction === "up"
            ? index - 1
            : index + 1;

        if (
          targetIndex < 0 ||
          targetIndex >=
            current.length
        ) {
          return current;
        }

        const copy = [
          ...current,
        ];

        [
          copy[index],
          copy[targetIndex],
        ] = [
          copy[targetIndex],
          copy[index],
        ];

        return copy;
      }
    );
  }

  function addModule(
    moduleId
  ) {
    const module =
      getModuleById(
        moduleId
      );

    if (!module) {
      return;
    }

    const newItem = {
      ...module,
      instanceId:
        `${module.id}-${++moduleInstanceCounter.current}`,
      source: "user",
    };

    setStructure(
      (current) => [
        ...current,
        newItem,
      ]
    );

    setShowAddModule(
      false
    );
  }

  return (
    <section className="macevo-panel">

      <div className="macevo-panel__intro">

        <div className="macevo-panel__icon">
          <WandSparkles size={21} />
        </div>

        <div>
          <h1>
            Votre structure recommandée
          </h1>

          <p>
            MACEVO a construit une première
            proposition à partir de vos choix.
          </p>
        </div>

      </div>

      <div className="macevo-structure-notice">

        <Sparkles size={18} />

        <div>
          <strong>
            Structure proposée par MACEVO
          </strong>

          <p>
            Cette structure est déterministe.
            Elle repose sur le type de document,
            le niveau, le domaine et le contexte.
          </p>
        </div>

      </div>

      <div className="macevo-structure-list">

        {structure.map(
          (item, index) => (
            <div
              className="macevo-structure-item"
              key={
                item.instanceId
              }
            >

              <div className="macevo-structure-item__number">
                {index + 1}
              </div>

              <div className="macevo-structure-item__main">

                <div className="macevo-structure-item__title">
                  {item.title}
                </div>

                <div className="macevo-structure-item__meta">
                  {item.required
                    ? "Élément recommandé"
                    : "Élément optionnel"}
                </div>

              </div>

              <div className="macevo-structure-item__actions">

                <button
                  type="button"
                  className="macevo-icon-button"
                  title="Monter"
                  disabled={
                    index === 0
                  }
                  onClick={() =>
                    moveItem(
                      item.instanceId,
                      "up"
                    )
                  }
                >
                  <ChevronUp
                    size={17}
                  />
                </button>

                <button
                  type="button"
                  className="macevo-icon-button"
                  title="Descendre"
                  disabled={
                    index ===
                    structure.length -
                      1
                  }
                  onClick={() =>
                    moveItem(
                      item.instanceId,
                      "down"
                    )
                  }
                >
                  <ChevronDown
                    size={17}
                  />
                </button>

                {!item.required && (
                  <button
                    type="button"
                    className="macevo-icon-button macevo-icon-button--danger"
                    title="Supprimer"
                    onClick={() =>
                      removeItem(
                        item.instanceId
                      )
                    }
                  >
                    <Trash2
                      size={17}
                    />
                  </button>
                )}

              </div>

            </div>
          )
        )}

      </div>

      <div className="macevo-add-module">

        <button
          type="button"
          className="macevo-secondary-button"
          onClick={() =>
            setShowAddModule(
              (value) => !value
            )
          }
        >
          <span>+</span>
          Ajouter un élément
        </button>

        {showAddModule && (
          <div className="macevo-module-picker">

            {availableModules.map(
              (moduleId) => {
                const module =
                  getModuleById(
                    moduleId
                  );

                if (!module) {
                  return null;
                }

                return (
                  <button
                    type="button"
                    key={
                      module.id
                    }
                    onClick={() =>
                      addModule(
                        module.id
                      )
                    }
                    className="macevo-module-option"
                  >
                    <span>
                      {module.title}
                    </span>

                    <span>
                      +
                    </span>
                  </button>
                );
              }
            )}

          </div>
        )}

      </div>

    </section>
  );
}


/* ============================================================
   ÉTAPE 5
============================================================ */

function ReviewStep({
  form,
  structure,
}) {
  const documentType =
    getOptionLabel(
      DOCUMENT_TYPES,
      form.reportType
    );

  const level =
    getOptionLabel(
      ACADEMIC_LEVELS,
      form.academicLevel
    );

  const language =
    getOptionLabel(
      LANGUAGES,
      form.language
    );

  const citationStyle =
    getOptionLabel(
      CITATION_STYLES,
      form.citationStyle
    );

  const studyType =
    getOptionLabel(
      STUDY_TYPES,
      form.studyType
    );

  const country =
    getEffectiveCountry(form);

  return (
    <section className="macevo-panel">

      <div className="macevo-panel__intro">

        <div className="macevo-panel__icon">
          <CheckCircle2 size={21} />
        </div>

        <div>
          <h1>
            Vérifiez votre document
          </h1>

          <p>
            Vérifiez les informations avant
            de créer votre document.
          </p>
        </div>

      </div>


      <div className="macevo-review-grid">

        <div className="macevo-review-card">
          <div className="macevo-review-card__icon">
            <FileText size={18} />
          </div>

          <div>
            <span>
              Titre
            </span>

            <strong>
              {form.title ||
                "Non renseigné"}
            </strong>
          </div>
        </div>

        <div className="macevo-review-card">
          <div className="macevo-review-card__icon">
            <BookOpen size={18} />
          </div>

          <div>
            <span>
              Type
            </span>

            <strong>
              {documentType}
            </strong>
          </div>
        </div>

        <div className="macevo-review-card">
          <div className="macevo-review-card__icon">
            <GraduationCap size={18} />
          </div>

          <div>
            <span>
              Niveau
            </span>

            <strong>
              {level}
            </strong>
          </div>
        </div>

        <div className="macevo-review-card">
          <div className="macevo-review-card__icon">
            <Languages size={18} />
          </div>

          <div>
            <span>
              Langue
            </span>

            <strong>
              {language}
            </strong>
          </div>
        </div>

      </div>


      <div className="macevo-review-section">

        <div className="macevo-review-section__header">
          <div>
            <h2>
              Auteur
            </h2>
          </div>
        </div>

        <div className="macevo-review-details">

          <SummaryItem
            label="Prénom"
            value={
              form.authorFirstName
            }
          />

          <SummaryItem
            label="Nom"
            value={
              form.authorLastName
            }
          />

          <SummaryItem
            label="Matricule"
            value={
              form.studentId
            }
          />

          <SummaryItem
            label="Diplôme"
            value={
              form.diploma
            }
          />

        </div>

      </div>


      <div className="macevo-review-section">

        <div className="macevo-review-section__header">
          <div>
            <h2>
              Contexte académique
            </h2>
          </div>
        </div>

        <div className="macevo-review-details">

          <SummaryItem
            label="Domaine"
            value={
              form.scientificField
            }
          />

          <SummaryItem
            label="Pays"
            value={country}
          />

          <SummaryItem
            label="Institution"
            value={
              form.institution
            }
          />

          <SummaryItem
            label="Faculté"
            value={
              form.faculty
            }
          />

          <SummaryItem
            label="Département"
            value={
              form.department
            }
          />

          <SummaryItem
            label="Laboratoire"
            value={
              form.laboratory
            }
          />

          <SummaryItem
            label="Filière"
            value={
              form.program
            }
          />

          <SummaryItem
            label="Spécialité"
            value={
              form.specialty
            }
          />

          <SummaryItem
            label="Année académique"
            value={
              form.academicYear
            }
          />

        </div>

      </div>


      <div className="macevo-review-section">

        <div className="macevo-review-section__header">
          <div>
            <h2>
              Encadrement
            </h2>
          </div>
        </div>

        <div className="macevo-review-details">

          <SummaryItem
            label="Directeur"
            value={
              form.director
            }
          />

          <SummaryItem
            label="Co-directeur"
            value={
              form.coDirector
            }
          />

          <SummaryItem
            label="Encadreur"
            value={
              form.supervisor
            }
          />

          <SummaryItem
            label="Co-encadreur"
            value={
              form.coSupervisor
            }
          />

        </div>

      </div>


      <div className="macevo-review-section">

        <div className="macevo-review-section__header">
          <div>
            <h2>
              Jury
            </h2>
          </div>
        </div>

        <div className="macevo-review-details">

          <SummaryItem
            label="Président"
            value={
              form.juryPresident
            }
          />

          <SummaryItem
            label="Rapporteur"
            value={
              form.juryRapporteur
            }
          />

          <SummaryItem
            label="Examinateur"
            value={
              form.juryExaminer
            }
          />

          <SummaryItem
            label="Autres membres"
            value={
              parseJuryMembers(
                form.juryMembers
              ).join(", ")
            }
          />

        </div>

      </div>


      <div className="macevo-review-section">

        <div className="macevo-review-section__header">
          <div>
            <h2>
              Préférences
            </h2>
          </div>
        </div>

        <div className="macevo-review-details">

          <SummaryItem
            label="Type d'étude"
            value={studyType}
          />

          <SummaryItem
            label="Norme"
            value={
              citationStyle
            }
          />

          <SummaryItem
            label="Langue des références"
            value={getOptionLabel(
              LANGUAGES,
              form.referenceLanguage
            )}
          />

          <SummaryItem
            label="Table des matières"
            value={
              form.generateToc
                ? "Oui"
                : "Non"
            }
          />

        </div>

      </div>


      <div className="macevo-review-section">

        <div className="macevo-review-section__header">

          <div>
            <h2>
              Structure finale
            </h2>

            <p>
              {structure.length}{" "}
              éléments seront créés.
            </p>
          </div>

        </div>

        <ol className="macevo-review-structure">

          {structure.map(
            (item) => (
              <li
                key={
                  item.instanceId
                }
              >
                {item.title}
              </li>
            )
          )}

        </ol>

      </div>


      <div className="macevo-final-notice">

        <CheckCircle2 size={20} />

        <div>

          <strong>
            Prêt à créer votre document
          </strong>

          <p>
            MACEVO va créer le document
            structuré puis ouvrir l'espace
            d'édition. Aucun contenu scientifique
            artificiel ne sera généré à cette étape.
          </p>

        </div>

      </div>

    </section>
  );
}


/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */

export default function NewReports() {

  const navigate =
    useNavigate();


  const [
    currentStep,
    setCurrentStep,
  ] = useState(1);


  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM
  );


  const [
    structure,
    setStructure,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    created,
    setCreated,
  ] = useState(false);


  const logoInputRef =
    useRef(null);


  const [
    logoPreview,
    setLogoPreview,
  ] = useState("");


  /* ==========================================================
     NETTOYAGE APERÇU
  ========================================================== */

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(
          logoPreview
        );
      }
    };
  }, [logoPreview]);


  /* ==========================================================
     LOGO
  ========================================================== */

  function handleLogoChange(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/svg+xml",
    ];

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    const allowedExtensions = [
      "png",
      "jpg",
      "jpeg",
      "webp",
      "svg",
    ];

    if (
      !allowedTypes.includes(
        file.type
      ) &&
      !allowedExtensions.includes(
        extension
      )
    ) {
      setError(
        "Format de logo non pris en charge. Utilisez PNG, JPG, JPEG, WEBP ou SVG."
      );

      event.target.value = "";

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Le logo ne doit pas dépasser 5 Mo."
      );

      event.target.value = "";

      return;
    }

    if (logoPreview) {
      URL.revokeObjectURL(
        logoPreview
      );
    }

    const previewUrl =
      URL.createObjectURL(
        file
      );

    updateField(
      "logoFile",
      file
    );

    setLogoPreview(
      previewUrl
    );

    setError("");
  }


  function removeLogo() {
    if (logoPreview) {
      URL.revokeObjectURL(
        logoPreview
      );
    }

    setLogoPreview("");

    updateField(
      "logoFile",
      null
    );

    if (
      logoInputRef.current
    ) {
      logoInputRef.current.value =
        "";
    }
  }


  /* ==========================================================
     CHAMP
  ========================================================== */

  function updateField(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    setError("");
  }


  /* ==========================================================
     VALIDATION ÉTAPE 1
  ========================================================== */

  function validateStepOne() {

    if (
      !normalizeValue(
        form.title
      )
    ) {
      return (
        "Le titre du document est obligatoire."
      );
    }

    if (!form.reportType) {
      return (
        "Veuillez sélectionner le type de document."
      );
    }

    if (
      !normalizeValue(
        form.scientificField
      )
    ) {
      return (
        "Veuillez renseigner le domaine ou la discipline."
      );
    }

    if (
      !form.academicLevel
    ) {
      return (
        "Veuillez sélectionner le niveau académique."
      );
    }

    if (!form.language) {
      return (
        "Veuillez sélectionner la langue du document."
      );
    }

    return "";
  }


  /* ==========================================================
     STRUCTURE
  ========================================================== */

  function prepareStructure() {

    const recommended =
      buildRecommendedStructure({
        reportType:
          form.reportType,

        academicLevel:
          form.academicLevel,

        scientificField:
          form.scientificField,

        language:
          form.language,

        studyType:
          form.studyType,

        citationStyle:
          form.citationStyle,

        country:
          getEffectiveCountry(
            form
          ),

        institution:
          form.institution,

        faculty:
          form.faculty,

        department:
          form.department,

        program:
          form.program,

        specialty:
          form.specialty,

        academicYear:
          form.academicYear,

        supervisor:
          form.supervisor,

        institutionalRequirements:
          form.institutionalRequirements,

        institutionalRequirementsSource:
          form.institutionalRequirementsSource,

        otherRequirements:
          form.otherRequirements,
      });

    setStructure(
      recommended
    );
  }


  /* ==========================================================
     SUIVANT
  ========================================================== */

  function handleNext() {

    setError("");

    if (
      currentStep === 1
    ) {
      const validationError =
        validateStepOne();

      if (validationError) {
        setError(
          validationError
        );

        return;
      }
    }

    if (
      currentStep === 3
    ) {
      prepareStructure();
    }

    setCurrentStep(
      (step) =>
        Math.min(
          step + 1,
          5
        )
    );
  }


  /* ==========================================================
     RETOUR
  ========================================================== */

  function handleBack() {

    setError("");

    setCurrentStep(
      (step) =>
        Math.max(
          step - 1,
          1
        )
    );
  }


  /* ==========================================================
     CRÉATION DU RAPPORT
  ========================================================== */

  async function handleCreateReport() {

    if (
      loading ||
      created
    ) {
      return;
    }

    setError("");

    const validationErrors =
      validateFinalReport(
        form,
        structure
      );

    if (
      validationErrors.length
    ) {
      setError(
        validationErrors[0]
      );

      return;
    }

    setLoading(true);

    try {

      const payload =
        buildReportPayload(
          form,
          structure
        );

      const country = getEffectiveCountry(form);
      const internationalDocument = createInternationalDocument({
        title: normalizeTitle(form.title),
        reportType: form.reportType,
        academicLevel: form.academicLevel,
        scientificField: form.scientificField,
        language: form.language,
        studyType: form.studyType,
        citationStyle: form.citationStyle,
        referenceLanguage: form.referenceLanguage,
        country,
        countryName: country,
        institution: form.institution,
        faculty: form.faculty,
        department: form.department,
        program: form.program,
        specialty: form.specialty,
        academicYear: form.academicYear,
        authorFirstName: form.authorFirstName,
        authorLastName: form.authorLastName,
        studentId: form.studentId,
        supervisor: form.supervisor || form.director,
        director: form.director,
        institutionalRequirements: form.institutionalRequirements,
        institutionalRequirementsSource: form.institutionalRequirementsSource,
        otherRequirements: form.otherRequirements,
        generateToc: form.generateToc,
        structure,
      });

      payload.template_key = internationalDocument.template.id;
      payload.macevo_document = internationalDocument.serializedDocument;
      payload.content = internationalDocument.content;


      /*
       * IMPORTANT :
       *
       * Le logo est un fichier.
       * Nous envoyons donc toutes les
       * données dans FormData afin que
       * Django puisse recevoir :
       *
       * - les champs texte ;
       * - la structure JSON ;
       * - le fichier image.
       */

      const formData =
        new FormData();


      Object.entries(
        payload
      ).forEach(
        ([key, value]) => {

          if (
            key ===
            "structure"
          ) {
            formData.append(
              key,
              JSON.stringify(
                value
              )
            );

            return;
          }

          if (
            key ===
            "jury_members"
          ) {
            formData.append(
              key,
              JSON.stringify(
                value
              )
            );

            return;
          }

          if (
            [
              "research_questions",
              "specific_objectives",
              "hypotheses",
            ].includes(key)
          ) {
            formData.append(
              key,
              JSON.stringify(
                Array.isArray(value) ? value : []
              )
            );

            return;
          }

          if (
            value === null ||
            value === undefined
          ) {
            return;
          }

          formData.append(
            key,
            String(value)
          );
        }
      );


      if (
        form.logoFile
      ) {
        formData.append(
          "institution_logo",
          form.logoFile
        );
      }


      const response =
        await api.post(
          "reports/",
          formData
        );


      const createdReport =
        response?.data ||
        {};


      const reportId =
        createdReport.id ??
        createdReport.pk ??
        createdReport.report_id;


      if (!reportId) {
        throw new Error(
          "Le serveur a créé le document mais n'a retourné aucun identifiant."
        );
      }


      setCreated(true);


      navigate(
        `/rapports/editeur/${reportId}`,
        {
          state: {
            reportId,
            source:
              "new-report",
          },
        }
      );

    } catch (
      requestError
    ) {

      console.error(
        "[MACEVO] Création du rapport échouée :",
        requestError
      );


      const responseData =
        requestError?.response
          ?.data;


      let backendMessage =
        responseData?.detail ||
        responseData?.message ||
        responseData?.error;


      /*
       * DRF peut retourner :
       *
       * {
       *   "institution_logo": [
       *      "..."
       *   ]
       * }
       *
       * ou :
       *
       * {
       *   "title": [
       *      "..."
       *   ]
       * }
       */

      if (
        !backendMessage &&
        responseData &&
        typeof responseData ===
          "object"
      ) {

        const firstError =
          Object.entries(
            responseData
          )[0];

        if (firstError) {

          const [
            field,
            messages,
          ] =
            firstError;

          backendMessage =
            `${field} : ${
              Array.isArray(
                messages
              )
                ? messages.join(
                    ", "
                  )
                : messages
            }`;
        }
      }


      setError(
        backendMessage ||
          requestError?.message ||
          "Impossible de créer le document. Vérifiez votre connexion et réessayez."
      );

    } finally {

      setLoading(false);

    }
  }


  /* ==========================================================
     RENDU DE L'ÉTAPE
  ========================================================== */

  function renderCurrentStep() {

    switch (
      currentStep
    ) {

      case 1:
        return (
          <EssentialInformationStep
            form={form}
            updateField={
              updateField
            }
          />
        );


      case 2:
        return (
          <ContextStep
            form={form}
            updateField={
              updateField
            }
            logoPreview={
              logoPreview
            }
            logoInputRef={
              logoInputRef
            }
            handleLogoChange={
              handleLogoChange
            }
            removeLogo={
              removeLogo
            }
          />
        );


      case 3:
        return (
          <PreferencesStep
            form={form}
            updateField={
              updateField
            }
          />
        );


      case 4:
        return (
          <StructureStep
            structure={
              structure
            }
            setStructure={
              setStructure
            }
          />
        );


      case 5:
        return (
          <ReviewStep
            form={form}
            structure={
              structure
            }
          />
        );


      default:
        return null;
    }
  }


  /* ==========================================================
     INTERFACE
  ========================================================== */

  return (
    <div className="macevo-page">
      <Sidebar />

      <div className="macevo-page__main">
        <Navbar />

        <main className="macevo-new-report">

          {/* ==================================================
              EN-TÊTE
          ================================================== */}

          <div className="macevo-new-report__header">

            <div>

              <div className="macevo-breadcrumb">

                <span>
                  Rapports
                </span>

                <span>
                  /
                </span>

                <strong>
                  Nouveau rapport
                </strong>

              </div>

              <h1>
                Créer un nouveau rapport
              </h1>

              <p>
                Construisez votre document étape
                par étape. MACEVO vous accompagne
                dans la définition de sa structure
                avant son ouverture dans l’éditeur.
              </p>

            </div>

            <div className="macevo-header-badge">

              <Sparkles
                size={16}
              />

              Création guidée

            </div>

          </div>


          {/* ==================================================
              STEPPER
          ================================================== */}

          <StepIndicator
            currentStep={
              currentStep
            }
          />


          {/* ==================================================
              CONTENU
          ================================================== */}

          <div className="macevo-new-report__layout">

            <div className="macevo-new-report__content">

              {error && (
                <div className="macevo-error">

                  <X size={18} />

                  <span>
                    {error}
                  </span>

                </div>
              )}


              {renderCurrentStep()}


              {/* ==================================================
                  NAVIGATION
              ================================================== */}

              <div className="macevo-navigation">

                <button
                  type="button"
                  className="macevo-secondary-button"
                  onClick={
                    handleBack
                  }
                  disabled={
                    currentStep ===
                      1 ||
                    loading
                  }
                >

                  <ArrowLeft
                    size={17}
                  />

                  Précédent

                </button>


                {currentStep <
                5 ? (
                  <button
                    type="button"
                    className="macevo-primary-button"
                    onClick={
                      handleNext
                    }
                    disabled={
                      loading
                    }
                  >

                    Continuer

                    <ArrowRight
                      size={17}
                    />

                  </button>
                ) : (
                  <button
                    type="button"
                    className="macevo-primary-button macevo-primary-button--create"
                    onClick={
                      handleCreateReport
                    }
                    disabled={
                      loading ||
                      created
                    }
                  >

                    {loading ? (
                      <>
                        <Loader2
                          size={17}
                          className="macevo-spin"
                        />

                        Création...
                      </>
                    ) : (
                      <>
                        <Check
                          size={17}
                        />

                        Créer mon rapport
                      </>
                    )}

                  </button>
                )}

              </div>

            </div>


            {/* ==================================================
                RÉSUMÉ
            ================================================== */}

            <SummaryPanel
              form={form}
              structure={
                structure
              }
              currentStep={
                currentStep
              }
            />

          </div>

        </main>

      </div>

    </div>
  );
}
