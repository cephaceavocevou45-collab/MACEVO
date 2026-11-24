/**
 * ============================================================
 * MACEVO - Equation Engine
 * ------------------------------------------------------------
 * Gestion centralisée des équations LaTeX.
 *
 * Utilisé par :
 * - EquationBlock.jsx
 * - InlineEquation.jsx
 * - EquationEditor.jsx
 * - LatexPreview.jsx
 * ============================================================
 */

import katex from "katex";

/**
 * Génère une équation en mode bloc.
 */
export function renderEquation(latex = "") {

  try {

    return katex.renderToString(latex, {

      throwOnError: false,

      displayMode: true,

      strict: "ignore",

      trust: true,

    });

  } catch (error) {

    return `
      <span class="text-red-600">
        ${error.message}
      </span>
    `;

  }

}

/**
 * Génère une équation en ligne.
 */
export function renderInlineEquation(latex = "") {

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
 * Encadre une équation avec l'environnement equation.
 */
export function createEquation(latex = "") {

  return `\\begin{equation}
${latex}
\\end{equation}`;

}

/**
 * Encadre une équation avec align.
 */
export function createAlignedEquation(latex = "") {

  return `\\begin{align}
${latex}
\\end{align}`;

}

/**
 * Encadre une équation non numérotée.
 */
export function createEquationStar(latex = "") {

  return `\\begin{equation*}
${latex}
\\end{equation*}`;

}

/**
 * Vérifie si une équation est vide.
 */
export function isEmptyEquation(latex = "") {

  return latex.trim().length === 0;

}

/**
 * Numérote une équation.
 */
export function numberEquation(latex = "", label = "") {

  if (!label) return createEquation(latex);

  return `\\begin{equation}
${latex}
\\label{${label}}
\\end{equation}`;

}

/**
 * Supprime les espaces inutiles.
 */
export function normalizeEquation(latex = "") {

  return latex.replace(/\s+/g, " ").trim();

}

export default {

  renderEquation,

  renderInlineEquation,

  createEquation,

  createAlignedEquation,

  createEquationStar,

  numberEquation,

  normalizeEquation,

  isEmptyEquation,

};