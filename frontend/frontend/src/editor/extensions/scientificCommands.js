/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Commandes d'insertion des blocs scientifiques
 * ============================================================
 */

export function insertEquation(editor, equation = "") {
    if (!editor) return false;

    return editor
        .chain()
        .focus()
        .insertContent({
            type: "scientificEquation",
            attrs: {
                latex: equation || "E = mc^2",
                title: "",
                label: "",
                numbering: true,
            },
        })
        .run();
}


export function insertFigure(editor, options = {}) {
    if (!editor) return false;

    return editor
        .chain()
        .focus()
        .insertContent({
            type: "scientificFigure",
            attrs: {
                src: options.src || "",
                alt: options.alt || "Figure scientifique",
                caption: options.caption || "",
                label: options.label || "",
                source: options.source || "",
                numbering: options.numbering !== false,
            },
        })
        .run();
}


export function insertScientificTable(editor, options = {}) {
    if (!editor) return false;

    return editor
        .chain()
        .focus()
        .insertContent({
            type: "scientificTable",
            attrs: {
                caption: options.caption || "",
                label: options.label || "",
                source: options.source || "",
                numbering: options.numbering !== false,
                columns: options.columns || 3,
                rows: options.rows || 3,
            },
        })
        .run();
}


export function insertTheorem(editor, options = {}) {
    if (!editor) return false;

    return editor
        .chain()
        .focus()
        .insertContent({
            type: "scientificTheorem",
            attrs: {
                title: options.title || "Théorème",
                content:
                    options.content ||
                    "Énoncé du théorème.",
                label: options.label || "",
                numbering: options.numbering !== false,
            },
        })
        .run();
}


export function insertDefinition(editor, options = {}) {
    if (!editor) return false;

    return editor
        .chain()
        .focus()
        .insertContent({
            type: "scientificDefinition",
            attrs: {
                title: options.title || "Définition",
                content:
                    options.content ||
                    "Définition scientifique.",
                label: options.label || "",
                numbering: options.numbering !== false,
            },
        })
        .run();
}


export function insertAlgorithm(editor, options = {}) {
    if (!editor) return false;

    return editor
        .chain()
        .focus()
        .insertContent({
            type: "scientificAlgorithm",
            attrs: {
                title: options.title || "Algorithme",
                code: options.code || "",
                language: options.language || "pseudocode",
                label: options.label || "",
                numbering: options.numbering !== false,
            },
        })
        .run();
}


export function insertCode(editor, options = {}) {
    if (!editor) return false;

    return editor
        .chain()
        .focus()
        .insertContent({
            type: "scientificCode",
            attrs: {
                language: options.language || "javascript",
                code: options.code || "",
                caption: options.caption || "",
                label: options.label || "",
                numbering: options.numbering !== false,
            },
        })
        .run();
}


export function insertCitation(editor, options = {}) {
    if (!editor) return false;

    return editor
        .chain()
        .focus()
        .insertContent({
            type: "scientificCitation",
            attrs: {
                citationKey:
                    options.citationKey || "",
                text:
                    options.text || "[Référence à fournir]",
            },
        })
        .run();
}


export function insertCrossReference(editor, options = {}) {
    if (!editor) return false;

    return editor
        .chain()
        .focus()
        .insertContent({
            type: "scientificCrossReference",
            attrs: {
                target: options.target || "",
                text: options.text || "Voir la référence",
            },
        })
        .run();
}


export function insertScientificNote(editor, options = {}) {
    if (!editor) return false;

    return editor
        .chain()
        .focus()
        .insertContent({
            type: "scientificNote",
            attrs: {
                type: options.type || "note",
                title: options.title || "",
                content:
                    options.content ||
                    "Note scientifique.",
            },
        })
        .run();
}