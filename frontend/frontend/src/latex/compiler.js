/**
 * ============================================================
 * MACEVO - LaTeX Compiler
 * ------------------------------------------------------------
 * Ce fichier constitue le moteur principal du système LaTeX.
 *
 * Toutes les autres parties (équations, aperçu, export PDF,
 * templates, bibliographie...) passeront par ce compilateur.
 * ============================================================
 */

import { renderPreview } from "./preview";
import { validateLatex } from "./validator";

/**
 * Compile un document LaTeX.
 *
 * @param {string} latex
 * @returns {Object}
 */
export function compileLatex(latex = "") {

  const validation = validateLatex(latex);

  if (!validation.valid) {

    return {
      success: false,
      errors: validation.errors,
      preview: null,
    };

  }

  return {

    success: true,

    errors: [],

    preview: renderPreview(latex),

    source: latex,

  };

}

/**
 * Compile uniquement une équation.
 */
export function compileEquation(latex = "") {

  return compileLatex(`$$${latex}$$`);

}

/**
 * Compile un document complet.
 */
export function compileDocument(document) {

  return compileLatex(document);

}

/**
 * Recompile automatiquement
 * après chaque modification.
 */
export function recompile(latex) {

  return compileLatex(latex);

}

/**
 * Vérifie uniquement si le code est valide.
 */
export function checkLatex(latex) {

  return validateLatex(latex);

}

export default {

  compileLatex,

  compileEquation,

  compileDocument,

  recompile,

  checkLatex,

};