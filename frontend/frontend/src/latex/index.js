/**
 * ============================================================
 * MACEVO - LaTeX Engine
 * ------------------------------------------------------------
 * Point d'entrée officiel du moteur LaTeX.
 *
 * Toutes les fonctionnalités LaTeX doivent être importées
 * depuis ce fichier.
 * ============================================================
 */

/* ===========================================================
 * Compiler
 * =========================================================== */

export {
  compileLatex,
  compileEquation,
  compileDocument,
  recompile,
  checkLatex,
} from "./compiler";

/* ===========================================================
 * Validator
 * =========================================================== */

export {
  validateLatex,
} from "./validator";

/* ===========================================================
 * Preview
 * =========================================================== */

export {
  renderPreview,
  renderInlinePreview,
  canPreview,
} from "./preview";

/* ===========================================================
 * Parser
 * =========================================================== */

export {
  parseLatex,
  extractSections,
  extractSubsections,
  extractFigures,
  extractTables,
  extractEquations,
  extractCitations,
  extractLabels,
  extractReferences,
} from "./parser";

/* ===========================================================
 * Equation Engine
 * =========================================================== */

export {
  renderEquation,
  renderInlineEquation,
  createEquation,
  createAlignedEquation,
  createEquationStar,
  numberEquation,
  normalizeEquation,
  isEmptyEquation,
} from "./equation";

/* ===========================================================
 * Bibliography
 * =========================================================== */

export {
  createCitation,
  createPageCitation,
  createBibliography,
  createBibEntry,
  validateCitationKey,
  extractCitationKeys,
  uniqueCitations,
} from "./bibliography";

/* ===========================================================
 * Templates
 * =========================================================== */

export {
  LATEX_TEMPLATES,
  getTemplates,
  getTemplate,
  generatePreamble,
  generateEnding,
  createDocument,
} from "./templates";

/* ===========================================================
 * Export Engine
 * =========================================================== */

export {
  prepareExport,
  exportPDF,
  exportTex,
  exportHTML,
  exportDOCX,
  getAvailableFormats,
} from "./exporter";

/* ===========================================================
 * Commands
 * =========================================================== */

export {
  LATEX_COMMANDS,
  getCommand,
  getCommands,
  hasCommand,
} from "./commands";