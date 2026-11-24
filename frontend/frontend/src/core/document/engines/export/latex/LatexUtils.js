/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : LatexUtils.js
 * Description : Fonctions utilitaires du moteur LaTeX.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

const SPECIAL_CHARACTERS = {
    "\\": "\\textbackslash{}",
    "&": "\\&",
    "%": "\\%",
    "$": "\\$",
    "#": "\\#",
    "_": "\\_",
    "{": "\\{",
    "}": "\\}",
    "~": "\\textasciitilde{}",
    "^": "\\textasciicircum{}",
};

/* ======================================================
   TEXTE
====================================================== */

function isString(value) {
    return typeof value === "string";
}

function isObject(value) {
    return value !== null && typeof value === "object";
}

function isEmpty(value) {

    if (value === null || value === undefined) {
        return true;
    }

    if (isString(value)) {
        return value.trim().length === 0;
    }

    if (Array.isArray(value)) {
        return value.length === 0;
    }

    if (isObject(value)) {
        return Object.keys(value).length === 0;
    }

    return false;
}

function normalizeText(text = "") {

    return String(text)
        .replace(/\r\n/g, "\n")
        .replace(/\t/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

}

function sanitizeText(text = "") {

    return normalizeText(text)
        .replace(/\u00A0/g, " ")
        .replace(/\u200B/g, "");

}

/* ======================================================
   LATEX
====================================================== */

function escapeLatex(text = "") {

    return String(text).replace(/[\\&%$#_{}~^]/g, character => {

        return SPECIAL_CHARACTERS[character] || character;

    });

}

function unescapeLatex(text = "") {

    return String(text)
        .replace(/\\&/g, "&")
        .replace(/\\%/g, "%")
        .replace(/\\\$/g, "$")
        .replace(/\\#/g, "#")
        .replace(/\\_/g, "_")
        .replace(/\\{/g, "{")
        .replace(/\\}/g, "}");

}

/* ======================================================
   IDENTIFIANTS
====================================================== */

let counter = 0;

function generateId(prefix = "latex") {

    counter++;

    return `${prefix}_${counter.toString().padStart(6, "0")}`;

}

/* ======================================================
   DATE
====================================================== */

function today() {

    return new Date();

}

function formatDate(date = new Date()) {

    return date.toLocaleDateString("fr-FR");

}

/* ======================================================
   OBJETS
====================================================== */

function clone(value) {

    return structuredClone(value);

}

/* ======================================================
   TELECHARGEMENT
====================================================== */

function createBlob(content, type = "text/plain;charset=utf-8") {

    return new Blob([content], { type });

}

function createObjectURL(blob) {

    return URL.createObjectURL(blob);

}

function revokeObjectURL(url) {

    URL.revokeObjectURL(url);

}

function download(filename, content) {

    const blob = createBlob(content);

    const url = createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    revokeObjectURL(url);

}

/* ======================================================
   EXPORT
====================================================== */

const LatexUtils = {

    isString,

    isObject,

    isEmpty,

    normalizeText,

    sanitizeText,

    escapeLatex,

    unescapeLatex,

    generateId,

    today,

    formatDate,

    clone,

    createBlob,

    createObjectURL,

    revokeObjectURL,

    download,

};

export default Object.freeze(LatexUtils);