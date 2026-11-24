/**
 * ============================================================
 * MACEVO - Export Engine
 * ------------------------------------------------------------
 * Gestion centralisée des exportations.
 *
 * Utilisé par :
 * - Export PDF
 * - Export LaTeX
 * - Export DOCX
 * - Export HTML
 * - AI Assistant
 * ============================================================
 */

import { compileLatex } from "./compiler";

/**
 * Prépare un document avant export.
 */
export function prepareExport(latex = "") {

  const result = compileLatex(latex);

  if (!result.success) {

    throw new Error(
      result.errors.join("\n")
    );

  }

  return result.source;

}

/**
 * Export TEX
 */
export function exportTex(latex = "") {

  return {

    filename: "document.tex",

    mime: "text/x-tex",

    content: prepareExport(latex),

  };

}

/**
 * Export PDF
 *
 * Pour le moment nous préparons
 * simplement les données.
 *
 * Le vrai moteur PDF sera connecté
 * plus tard (LaTeX Workshop,
 * Tectonic, Docker, etc.)
 */
export function exportPDF(latex = "") {

  return {

    filename: "document.pdf",

    mime: "application/pdf",

    source: prepareExport(latex),

  };

}

/**
 * Export HTML
 */
export function exportHTML(html = "") {

  return {

    filename: "document.html",

    mime: "text/html",

    content: html,

  };

}

/**
 * Export DOCX
 *
 * Le convertisseur sera branché
 * plus tard.
 */
export function exportDOCX(content = "") {

  return {

    filename: "document.docx",

    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    content,

  };

}

/**
 * Retourne les formats disponibles.
 */
export function getAvailableFormats() {

  return [

    "pdf",

    "tex",

    "docx",

    "html",

  ];

}

export default {

  prepareExport,

  exportPDF,

  exportTex,

  exportHTML,

  exportDOCX,

  getAvailableFormats,

};