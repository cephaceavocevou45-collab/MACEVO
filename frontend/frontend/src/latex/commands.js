/**
 * ============================================================
 * MACEVO - LaTeX Commands Library
 * ------------------------------------------------------------
 * Bibliothèque centralisée des commandes LaTeX.
 *
 * Utilisé par :
 * - Ribbon
 * - Toolbar
 * - Assistant IA
 * - Editor
 * ============================================================
 */

export const LATEX_COMMANDS = {

  // ===========================================
  // Structure
  // ===========================================

  section: "\\section{}",

  subsection: "\\subsection{}",

  subsubsection: "\\subsubsection{}",

  paragraph: "\\paragraph{}",

  chapter: "\\chapter{}",

  // ===========================================
  // Texte
  // ===========================================

  bold: "\\textbf{}",

  italic: "\\textit{}",

  underline: "\\underline{}",

  emphasis: "\\emph{}",

  quote: "\\begin{quote}\n\n\\end{quote}",

  // ===========================================
  // Mathématiques
  // ===========================================

  equation: "\\begin{equation}\n\n\\end{equation}",

  align: "\\begin{align}\n\n\\end{align}",

  matrix: "\\begin{bmatrix}\n\n\\end{bmatrix}",

  cases: "\\begin{cases}\n\n\\end{cases}",

  fraction: "\\frac{}{}",

  sqrt: "\\sqrt{}",

  integral: "\\int_{}^{}",

  summation: "\\sum_{}^{}",

  limit: "\\lim_{}",

  // ===========================================
  // Figures
  // ===========================================

  figure: `
\\begin{figure}[h]
\\centering

\\caption{}

\\label{}

\\end{figure}
`,

  // ===========================================
  // Tableaux
  // ===========================================

  table: `
\\begin{table}[h]
\\centering

\\caption{}

\\label{}

\\end{table}
`,

  tabular: `
\\begin{tabular}{|c|c|}
\\hline

& \\\\
\\hline

\\end{tabular}
`,

  // ===========================================
  // Listes
  // ===========================================

  itemize: `
\\begin{itemize}

\\item

\\end{itemize}
`,

  enumerate: `
\\begin{enumerate}

\\item

\\end{enumerate}
`,

  // ===========================================
  // Références
  // ===========================================

  label: "\\label{}",

  reference: "\\ref{}",

  citation: "\\cite{}",

  bibliography: `
\\bibliographystyle{plain}

\\bibliography{references}
`,

};

/**
 * Retourne une commande.
 */
export function getCommand(name) {

  return LATEX_COMMANDS[name] ?? "";

}

/**
 * Liste des commandes.
 */
export function getCommands() {

  return Object.keys(LATEX_COMMANDS);

}

/**
 * Vérifie l'existence d'une commande.
 */
export function hasCommand(name) {

  return name in LATEX_COMMANDS;

}

export default {

  LATEX_COMMANDS,

  getCommand,

  getCommands,

  hasCommand,

};