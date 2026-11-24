/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : TemplateEngine.js
 * Version : 1.0.0
 * Statut  : Architecture templates professionnelle
 * ----------------------------------------------------------
 * Rôle :
 *   - Moteur central de génération des modèles
 *   - Génération d'un document académique complet
 *   - Compatible avec l'éditeur Tiptap
 *   - Préserve l'identité visuelle et scientifique du modèle
 * ==========================================================
 */

import { renderScientificTemplate } from "./ScientificTemplate";
import { renderAcademicTemplate } from "./AcademicTemplate";
import { renderModernTemplate } from "./ModernTemplate";

/* ==========================================================
   UTILITAIRES
   ========================================================== */

/**
 * Échappe les caractères HTML dangereux.
 */
export function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Transforme un texte simple en HTML.
 */
export function textToHtml(value = "") {
  if (!value) return "";

  return escapeHtml(value)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => {
      const text = paragraph.trim();

      if (!text) return "";

      return `<p>${text.replace(/\n/g, "<br />")}</p>`;
    })
    .filter(Boolean)
    .join("");
}

/**
 * Vérifie si une chaîne semble déjà être du HTML.
 */
export function isHtmlContent(value = "") {
  if (!value || typeof value !== "string") {
    return false;
  }

  return /<\/?[a-z][\s\S]*>/i.test(value);
}

/**
 * Normalise un contenu provenant du rapport.
 */
export function normalizeContent(value = "") {
  if (!value) return "";

  if (typeof value !== "string") {
    return String(value);
  }

  return isHtmlContent(value)
    ? value
    : textToHtml(value);
}

/* ==========================================================
   IDENTIFICATION DU MODÈLE
   ========================================================== */

/**
 * Retourne l'identifiant normalisé du modèle.
 */
export function normalizeTemplateId(template) {
  if (!template) {
    return "";
  }

  if (typeof template === "string") {
    return template.trim().toLowerCase();
  }

  return String(
    template.id ||
    template.templateId ||
    template.slug ||
    template.code ||
    ""
  )
    .trim()
    .toLowerCase();
}

/**
 * Détermine le moteur de rendu à utiliser.
 *
 * L'objectif est de pouvoir ajouter de nouveaux modèles
 * sans modifier EditorContext.jsx.
 */
export function resolveTemplateEngine(template) {
  const id = normalizeTemplateId(template);

  const type = String(
    template?.type ||
    template?.category ||
    template?.style ||
    template?.layout ||
    ""
  ).toLowerCase();

  const combined = `${id} ${type}`;

  /*
   * Modèles explicitement scientifiques.
   */
  if (
    combined.includes("scientifique") ||
    combined.includes("scientific") ||
    combined.includes("science") ||
    combined.includes("recherche") ||
    combined.includes("thesis") ||
    combined.includes("doctorat") ||
    combined.includes("doctoral") ||
    combined.includes("article")
  ) {
    return "scientific";
  }

  /*
   * Modèles modernes.
   */
  if (
    combined.includes("moderne") ||
    combined.includes("modern") ||
    combined.includes("canva") ||
    combined.includes("creative") ||
    combined.includes("contemporain")
  ) {
    return "modern";
  }

  /*
   * Modèles académiques classiques.
   */
  return "academic";
}

/* ==========================================================
   NORMALISATION DES DONNÉES
   ========================================================== */

/**
 * Prépare toutes les informations nécessaires au moteur.
 */
export function normalizeTemplateData(template, data = {}) {
  const report = data.report || {};

  const normalized = {
    ...data,

    template,

    report,

    title:
      data.title ||
      report.title ||
      template?.name ||
      "Titre du rapport",

    author:
      data.author ||
      report.author_name ||
      report.author ||
      "Nom et prénom de l'auteur",

    institution:
      data.institution ||
      report.institution ||
      "Université / Institution",

    department:
      data.department ||
      report.department ||
      "Faculté / Département",

    supervisor:
      data.supervisor ||
      report.supervisor ||
      report.encadreur ||
      "Directeur / Encadreur",

    academicYear:
      data.academicYear ||
      report.academic_year ||
      report.academicYear ||
      `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,

    scientificField:
      data.scientificField ||
      report.scientific_field ||
      report.scientificField ||
      "",

    abstract:
      data.abstract ||
      report.abstract ||
      report.summary ||
      "",

    keywords:
      data.keywords ||
      report.keywords ||
      [],

    content:
      data.content ||
      report.content ||
      "",

    sections:
      data.sections ||
      template?.sections ||
      [],

    metadata: {
      ...(template?.metadata || {}),
      ...(data.metadata || {}),
    },
  };

  return normalized;
}

/* ==========================================================
   STRUCTURE DU DOCUMENT
   ========================================================== */

/**
 * Retourne une structure académique de secours.
 *
 * Elle n'est utilisée que lorsque le modèle ne fournit pas
 * sa propre structure.
 */
export function getDefaultStructure(template, data = {}) {
  const templateSections = template?.sections;

  if (Array.isArray(templateSections) && templateSections.length) {
    return templateSections;
  }

  const reportType = String(
    template?.type ||
    template?.category ||
    data.report?.type ||
    ""
  ).toLowerCase();

  /*
   * Structure scientifique / recherche.
   */
  if (
    reportType.includes("scientifique") ||
    reportType.includes("scientific") ||
    reportType.includes("recherche") ||
    reportType.includes("doctor")
  ) {
    return [
      {
        id: "cover",
        type: "cover",
        title: "Page de garde",
      },
      {
        id: "dedication",
        type: "preliminary",
        title: "Dédicace",
      },
      {
        id: "acknowledgements",
        type: "preliminary",
        title: "Remerciements",
      },
      {
        id: "abstract",
        type: "preliminary",
        title: "Résumé",
      },
      {
        id: "abstract-en",
        type: "preliminary",
        title: "Abstract",
      },
      {
        id: "toc",
        type: "toc",
        title: "Table des matières",
      },
      {
        id: "introduction",
        type: "chapter",
        title: "Introduction générale",
      },
      {
        id: "chapter-1",
        type: "chapter",
        title: "Chapitre 1 — Cadre théorique et revue de littérature",
      },
      {
        id: "chapter-2",
        type: "chapter",
        title: "Chapitre 2 — Méthodologie",
      },
      {
        id: "chapter-3",
        type: "chapter",
        title: "Chapitre 3 — Résultats",
      },
      {
        id: "chapter-4",
        type: "chapter",
        title: "Chapitre 4 — Discussion",
      },
      {
        id: "conclusion",
        type: "conclusion",
        title: "Conclusion générale",
      },
      {
        id: "references",
        type: "bibliography",
        title: "Références bibliographiques",
      },
      {
        id: "annexes",
        type: "annex",
        title: "Annexes",
      },
    ];
  }

  /*
   * Structure académique générale.
   */
  return [
    {
      id: "cover",
      type: "cover",
      title: "Page de garde",
    },
    {
      id: "dedication",
      type: "preliminary",
      title: "Dédicace",
    },
    {
      id: "acknowledgements",
      type: "preliminary",
      title: "Remerciements",
    },
    {
      id: "summary",
      type: "preliminary",
      title: "Résumé",
    },
    {
      id: "toc",
      type: "toc",
      title: "Table des matières",
    },
    {
      id: "introduction",
      type: "chapter",
      title: "Introduction",
    },
    {
      id: "chapter-1",
      type: "chapter",
      title: "Chapitre 1",
    },
    {
      id: "chapter-2",
      type: "chapter",
      title: "Chapitre 2",
    },
    {
      id: "chapter-3",
      type: "chapter",
      title: "Chapitre 3",
    },
    {
      id: "conclusion",
      type: "conclusion",
      title: "Conclusion",
    },
    {
      id: "references",
      type: "bibliography",
      title: "Références bibliographiques",
    },
    {
      id: "annexes",
      type: "annex",
      title: "Annexes",
    },
  ];
}

/* ==========================================================
   RENDU PRINCIPAL
   ========================================================== */

/**
 * Génère le HTML complet du modèle.
 *
 * Cette fonction est celle que EditorContext.jsx utilisera.
 *
 * Exemple :
 *
 * const html = generateTemplateHtml(template, {
 *   title: "...",
 *   author: "...",
 *   institution: "..."
 * });
 */
export function generateTemplateHtml(template, data = {}) {
  if (!template) {
    throw new Error(
      "TemplateEngine : aucun modèle n'a été fourni."
    );
  }

  const normalizedData = normalizeTemplateData(
    template,
    data
  );

  const structure =
    Array.isArray(template.sections) &&
    template.sections.length
      ? template.sections
      : getDefaultStructure(
          template,
          normalizedData
        );

  const engine = resolveTemplateEngine(template);

  const renderData = {
    ...normalizedData,
    structure,
  };

  let html = "";

  switch (engine) {
    case "scientific":
      html = renderScientificTemplate(
        template,
        renderData
      );
      break;

    case "modern":
      html = renderModernTemplate(
        template,
        renderData
      );
      break;

    case "academic":
    default:
      html = renderAcademicTemplate(
        template,
        renderData
      );
      break;
  }

  if (!html || typeof html !== "string") {
    throw new Error(
      `TemplateEngine : le moteur "${engine}" n'a retourné aucun contenu HTML valide.`
    );
  }

  return html.trim();
}

/* ==========================================================
   API SIMPLIFIÉE
   ========================================================== */

/**
 * Alias pratique pour EditorContext.
 */
export function generateTemplate(template, data = {}) {
  return generateTemplateHtml(template, data);
}

/**
 * Génération directement à partir d'un templateId.
 *
 * Cette fonction nécessite que le catalogue soit fourni
 * par l'appelant afin de ne pas créer de dépendance circulaire.
 */
export function generateTemplateFromId(
  templateId,
  templates,
  data = {}
) {
  if (!templateId) {
    throw new Error(
      "TemplateEngine : templateId manquant."
    );
  }

  if (!templates) {
    throw new Error(
      "TemplateEngine : catalogue des modèles manquant."
    );
  }

  let template = null;

  if (Array.isArray(templates)) {
    template = templates.find(
      (item) =>
        normalizeTemplateId(item) ===
        String(templateId).trim().toLowerCase()
    );
  } else if (typeof templates === "object") {
    template =
      templates[templateId] ||
      Object.values(templates).find(
        (item) =>
          normalizeTemplateId(item) ===
          String(templateId).trim().toLowerCase()
      );
  }

  if (!template) {
    throw new Error(
      `TemplateEngine : modèle introuvable "${templateId}".`
    );
  }

  return generateTemplateHtml(
    template,
    data
  );
}

/* ==========================================================
   EXPORT PAR DÉFAUT
   ========================================================== */

const TemplateEngine = {
  generateTemplateHtml,
  generateTemplate,
  generateTemplateFromId,
  normalizeTemplateId,
  normalizeTemplateData,
  resolveTemplateEngine,
  getDefaultStructure,
  normalizeContent,
  textToHtml,
  escapeHtml,
  isHtmlContent,
};

export default TemplateEngine;