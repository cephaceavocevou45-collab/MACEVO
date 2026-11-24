/**
 * ============================================================
 * MACEVO - LaTeX Templates Engine
 * ------------------------------------------------------------
 * Gestion des modèles LaTeX.
 *
 * Utilisé par :
 * - NewReport.jsx
 * - TemplateEngine
 * - ExportEngine
 * - AI Assistant
 * ============================================================
 */

/**
 * Tous les modèles disponibles.
 */
export const LATEX_TEMPLATES = {

  article: {
    id: "article",
    name: "Article",
    documentClass: "article",
    packages: [
      "amsmath",
      "amssymb",
      "graphicx",
      "geometry" // Ajout de geometry
    ]
  },

  report: {
    id: "report",
    name: "Rapport",
    documentClass: "report",
    packages: [
      "amsmath",
      "graphicx",
      "geometry"
    ]
  },

  book: {
    id: "book",
    name: "Livre",
    documentClass: "book",
    packages: [
      "amsmath",
      "graphicx",
      "geometry"
    ]
  },

  thesis: {
    id: "thesis",
    name: "Thèse",
    documentClass: "report",
    packages: [
      "amsmath",
      "graphicx",
      "setspace",
      "geometry",
      "biblatex"
    ]
  },

  memoir: {
    id: "memoir",
    name: "Mémoire",
    documentClass: "report",
    packages: [
      "amsmath",
      "graphicx",
      "geometry"
    ]
  },

  ieee: {
    id: "ieee",
    name: "IEEE",
    documentClass: "IEEEtran",
    packages: [
      "amsmath",
      "graphicx",
      "cite"
    ]
  },

  acm: {
    id: "acm",
    name: "ACM",
    documentClass: "acmart",
    packages: [
      "amsmath",
      "graphicx"
    ]
  },

  springer: {
    id: "springer",
    name: "Springer",
    documentClass: "svjour3",
    packages: [
      "amsmath",
      "graphicx"
    ]
  },

  elsevier: {
    id: "elsevier",
    name: "Elsevier",
    documentClass: "elsarticle",
    packages: [
      "amsmath",
      "graphicx"
    ]
  }

};

/**
 * Retourne tous les modèles.
 */
export function getTemplates() {
  return Object.values(LATEX_TEMPLATES);
}

/**
 * Recherche un modèle.
 */
export function getTemplate(id) {
  return LATEX_TEMPLATES[id] ?? null;
}

/**
 * Génère le préambule LaTeX.
 * Inclus automatiquement les marges de 1.5cm pour geometry.
 */
export function generatePreamble(id) {

  const template = getTemplate(id);

  if (!template) return "";

  const packages = template.packages
    .map(pkg => {
      // Configuration des marges identiques au document MACEVO
      if (pkg === "geometry") {
        return `\\usepackage[a4paper, margin=1.5cm]{geometry}`;
      }
      return `\\usepackage{${pkg}}`;
    })
    .join("\n");

  return `\\documentclass{${template.documentClass}}

${packages}

\\begin{document}
`;
}

/**
 * Ferme un document.
 */
export function generateEnding() {
  return `
\\end{document}
`;
}

/**
 * Crée un document complet.
 */
export function createDocument(id, content = "") {
  return (
    generatePreamble(id) +
    content +
    generateEnding()
  );
}

export default {
  LATEX_TEMPLATES,
  getTemplates,
  getTemplate,
  generatePreamble,
  generateEnding,
  createDocument,
};