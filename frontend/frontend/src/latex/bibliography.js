/**
 * ============================================================
 * MACEVO - Bibliography Engine
 * ------------------------------------------------------------
 * Gestion des citations et de la bibliographie.
 *
 * Utilisé par :
 * - CitationManager
 * - DocumentEngine
 * - Export PDF
 * - Export LaTeX
 * ============================================================
 */

/**
 * Crée une citation LaTeX.
 *
 * Exemple :
 * createCitation("einstein1905")
 * -> \cite{einstein1905}
 */
export function createCitation(key = "") {

  return `\\cite{${key}}`;

}

/**
 * Crée une citation avec numéro de page.
 *
 * Exemple :
 * \cite[p.25]{einstein1905}
 */
export function createPageCitation(key = "", page = "") {

  if (!page) {

    return createCitation(key);

  }

  return `\\cite[p.${page}]{${key}}`;

}

/**
 * Crée une référence bibliographique.
 */
export function createBibliography(style = "plain") {

  return `
\\bibliographystyle{${style}}
\\bibliography{references}
`;

}

/**
 * Crée une entrée BibTeX vide.
 */
export function createBibEntry(type = "article") {

  return `@${type}{,
  author = {},
  title = {},
  journal = {},
  year = {},
}`;

}

/**
 * Vérifie si une clé BibTeX est valide.
 */
export function validateCitationKey(key = "") {

  return /^[a-zA-Z0-9:_-]+$/.test(key);

}

/**
 * Extrait toutes les citations d'un document.
 */
export function extractCitationKeys(latex = "") {

  return [...latex.matchAll(/\\cite(?:\[[^\]]*\])?\{(.*?)\}/g)]
    .map(match => match[1]);

}

/**
 * Supprime les doublons.
 */
export function uniqueCitations(keys = []) {

  return [...new Set(keys)];

}

export default {

  createCitation,

  createPageCitation,

  createBibliography,

  createBibEntry,

  validateCitationKey,

  extractCitationKeys,

  uniqueCitations,

};