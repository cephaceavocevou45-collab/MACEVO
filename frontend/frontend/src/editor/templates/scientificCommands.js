// src/editor/scientificCommands.js

/**
 * Commandes d'insertion des éléments scientifiques MACEVO
 */

const insertNode = (editor, type, attrs = {}) => {
    if (!editor) return false;

    return editor
        .chain()
        .focus()
        .insertContent({
            type,
            attrs,
        })
        .run();
};

/* =========================================================
   TEXTE
========================================================= */

export const insertParagraph = (editor) =>
    insertNode(editor, "paragraph");

export const insertQuote = (editor, text = "Citation à compléter.") =>
    insertNode(editor, "scientificQuote", {
        text,
    });

export const insertNote = (editor, text = "Note à compléter.") =>
    insertNode(editor, "scientificNote", {
        text,
    });

export const insertWarning = (
    editor,
    text = "Attention : information importante à compléter."
) =>
    insertNode(editor, "scientificWarning", {
        text,
    });

/* =========================================================
   MATHÉMATIQUES
========================================================= */

export const insertEquation = (
    editor,
    latex = "E = mc^2"
) =>
    insertNode(editor, "scientificEquation", {
        latex,
        label: "",
        number: "",
    });

export const insertEquationSystem = (
    editor,
    equations = [
        "x + y = 10",
        "2x - y = 5",
    ]
) =>
    insertNode(editor, "scientificEquationSystem", {
        equations,
        label: "",
        number: "",
    });

export const insertMatrix = (
    editor,
    matrix = [
        ["1", "0"],
        ["0", "1"],
    ]
) =>
    insertNode(editor, "scientificMatrix", {
        matrix,
        label: "",
        number: "",
    });

/* =========================================================
   DONNÉES SCIENTIFIQUES
========================================================= */

export const insertFigure = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificFigure", {
        src: attrs.src || "",
        alt: attrs.alt || "Figure scientifique",
        caption: attrs.caption || "Légende de la figure",
        label: attrs.label || "",
        number: attrs.number || "",
        width: attrs.width || "100%",
    });

export const insertTable = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificTable", {
        headers:
            attrs.headers || [
                "Variable",
                "Valeur",
            ],
        rows:
            attrs.rows || [
                ["Variable 1", "Valeur 1"],
                ["Variable 2", "Valeur 2"],
            ],
        caption:
            attrs.caption || "Légende du tableau",
        label: attrs.label || "",
        number: attrs.number || "",
    });

export const insertChart = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificChart", {
        chartType:
            attrs.chartType || "bar",
        title:
            attrs.title || "Titre du graphique",
        labels:
            attrs.labels || [
                "A",
                "B",
                "C",
            ],
        datasets:
            attrs.datasets || [],
        caption:
            attrs.caption || "Légende du graphique",
        label: attrs.label || "",
        number: attrs.number || "",
    });

/* =========================================================
   DÉMONSTRATIONS / MATHÉMATIQUES
========================================================= */

export const insertTheorem = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificTheorem", {
        title:
            attrs.title || "Théorème",
        content:
            attrs.content ||
            "Énoncé du théorème à compléter.",
        label: attrs.label || "",
        number: attrs.number || "",
    });

export const insertDefinition = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificDefinition", {
        title:
            attrs.title || "Définition",
        content:
            attrs.content ||
            "Définition à compléter.",
        label: attrs.label || "",
        number: attrs.number || "",
    });

export const insertLemma = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificLemma", {
        title:
            attrs.title || "Lemme",
        content:
            attrs.content ||
            "Énoncé du lemme à compléter.",
        label: attrs.label || "",
        number: attrs.number || "",
    });

export const insertProposition = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificProposition", {
        title:
            attrs.title || "Proposition",
        content:
            attrs.content ||
            "Énoncé de la proposition à compléter.",
        label: attrs.label || "",
        number: attrs.number || "",
    });

export const insertCorollary = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificCorollary", {
        title:
            attrs.title || "Corollaire",
        content:
            attrs.content ||
            "Énoncé du corollaire à compléter.",
        label: attrs.label || "",
        number: attrs.number || "",
    });

export const insertRemark = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificRemark", {
        title:
            attrs.title || "Remarque",
        content:
            attrs.content ||
            "Remarque scientifique à compléter.",
        label: attrs.label || "",
        number: attrs.number || "",
    });

export const insertExample = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificExample", {
        title:
            attrs.title || "Exemple",
        content:
            attrs.content ||
            "Exemple à compléter.",
        label: attrs.label || "",
        number: attrs.number || "",
    });

export const insertProof = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificProof", {
        content:
            attrs.content ||
            "Démonstration à compléter.",
        label: attrs.label || "",
        number: attrs.number || "",
    });

/* =========================================================
   INFORMATIQUE / INGÉNIERIE
========================================================= */

export const insertAlgorithm = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificAlgorithm", {
        title:
            attrs.title || "Algorithme",
        content:
            attrs.content ||
            "Début\n    // Étapes de l'algorithme\nFin",
        caption:
            attrs.caption ||
            "Description de l'algorithme",
        label: attrs.label || "",
        number: attrs.number || "",
    });

export const insertCode = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificCode", {
        language:
            attrs.language || "javascript",
        code:
            attrs.code ||
            "// Code à compléter",
        caption:
            attrs.caption ||
            "Extrait de code",
        label: attrs.label || "",
        number: attrs.number || "",
    });

/* =========================================================
   RÉFÉRENCES
========================================================= */

export const insertCitation = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificCitation", {
        citationKey:
            attrs.citationKey || "",
        text:
            attrs.text ||
            "[Référence à fournir]",
        style:
            attrs.style || "author-year",
    });

export const insertCrossReference = (
    editor,
    attrs = {}
) =>
    insertNode(editor, "scientificCrossReference", {
        target:
            attrs.target || "",
        type:
            attrs.type || "section",
        text:
            attrs.text ||
            "Voir la référence",
    });

/* =========================================================
   EXPORT CENTRALISÉ
========================================================= */

export const scientificCommands = {
    insertParagraph,
    insertQuote,
    insertNote,
    insertWarning,

    insertEquation,
    insertEquationSystem,
    insertMatrix,

    insertFigure,
    insertTable,
    insertChart,

    insertTheorem,
    insertDefinition,
    insertLemma,
    insertProposition,
    insertCorollary,
    insertRemark,
    insertExample,
    insertProof,

    insertAlgorithm,
    insertCode,

    insertCitation,
    insertCrossReference,
};

export default scientificCommands;