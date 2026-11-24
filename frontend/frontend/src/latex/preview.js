/**
 * ============================================================
 * MACEVO - LaTeX Preview Engine
 * ------------------------------------------------------------
 * Génère un aperçu HTML à partir du code LaTeX.
 *
 * Ce fichier est utilisé par :
 * - compiler.js
 * - EquationBlock.jsx
 * - LatexPreview.jsx
 * - Editor
 * ============================================================
 */

import katex from "katex";

/**
 * Génère un aperçu HTML.
 *
 * @param {string} latex
 * @returns {string}
 */
export function renderPreview(latex = "") {

  if (!latex.trim()) {
    return "";
  }

  try {

    return katex.renderToString(latex, {

      throwOnError: false,

      displayMode: true,

      strict: "ignore",

      trust: true,

      output: "html",

    });

  } catch (error) {

    return `
      <div class="text-red-600 font-medium">
        ${error.message}
      </div>
    `;

  }

}

/**
 * Aperçu en ligne
 */
export function renderInlinePreview(latex = "") {

  try {

    return katex.renderToString(latex, {

      throwOnError: false,

      displayMode: false,

      strict: "ignore",

      trust: true,

    });

  } catch {

    return latex;

  }

}

/**
 * Vérifie si l'aperçu peut être généré.
 */
export function canPreview(latex = "") {

  try {

    katex.renderToString(latex);

    return true;

  } catch {

    return false;

  }

}

export default {

  renderPreview,

  renderInlinePreview,

  canPreview,

};