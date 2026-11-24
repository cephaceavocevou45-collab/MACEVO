/**
 * ============================================================
 * MACEVO - LaTeX Validator
 *
 * Fichier : LatexValidator.js
 * Description : Vérification de la structure LaTeX
 * Version : 3.0.0
 * ============================================================
 */

/**
 * Vérifie qu'un environnement LaTeX est correctement fermé.
 */
function validateEnvironment(latex, environment, errors) {

    const beginRegex = new RegExp(
        String.raw`\\begin\{${environment}\}`,
        "g"
    );

    const endRegex = new RegExp(
        String.raw`\\end\{${environment}\}`,
        "g"
    );

    const begins =
        (latex.match(beginRegex) || []).length;

    const ends =
        (latex.match(endRegex) || []).length;

    if (begins !== ends) {

        errors.push(
            `Nombre différent entre \\begin{${environment}} (${begins}) et \\end{${environment}} (${ends}).`
        );
    }
}


/**
 * Vérifie les accolades.
 */
function validateBrackets(latex, errors) {

    let count = 0;
    let escaped = false;

    for (const char of latex) {

        if (char === "\\" && !escaped) {

            escaped = true;

            continue;
        }

        if (!escaped) {

            if (char === "{") {

                count++;
            }

            if (char === "}") {

                count--;

                if (count < 0) {

                    errors.push(
                        "Une accolade fermante '}' est mal placée."
                    );

                    return;
                }
            }
        }

        escaped = false;
    }

    if (count !== 0) {

        errors.push(
            "Les accolades '{ }' sont déséquilibrées."
        );
    }
}


/**
 * Vérifie les délimiteurs mathématiques $...$.
 */
function validateMath(latex, errors) {

    let dollarCount = 0;
    let escaped = false;

    for (const char of latex) {

        if (char === "\\" && !escaped) {

            escaped = true;

            continue;
        }

        if (
            char === "$" &&
            !escaped
        ) {

            dollarCount++;
        }

        escaped = false;
    }

    if (dollarCount % 2 !== 0) {

        errors.push(
            "Délimiteurs mathématiques '$' non équilibrés."
        );
    }
}


/**
 * Supprime les commentaires LaTeX.
 *
 * Une ligne comme :
 *
 * % commentaire
 *
 * est supprimée.
 *
 * Le caractère \% est conservé.
 */
function removeComments(latex) {

    return String(latex ?? "")
        .replace(
            /(^|[^\\])%.*$/gm,
            "$1"
        );
}


/**
 * Vérifie la structure générale du document.
 *
 * Les fragments LaTeX sont acceptés.
 */
function validateDocumentStructure(latex, errors) {

    const hasDocumentClass =
        /\\documentclass(?:\[[^\]]*\])?\{[^{}]+\}/
            .test(latex);

    const beginDocument =
        /\\begin\{document\}/
            .test(latex);

    const endDocument =
        /\\end\{document\}/
            .test(latex);


    /*
     * Si \begin{document} existe,
     * \end{document} doit exister.
     */
    if (
        beginDocument &&
        !endDocument
    ) {

        errors.push(
            "\\begin{document} est présent mais \\end{document} est absent."
        );
    }


    /*
     * Si \end{document} existe,
     * \begin{document} doit exister.
     */
    if (
        endDocument &&
        !beginDocument
    ) {

        errors.push(
            "\\end{document} est présent mais \\begin{document} est absent."
        );
    }


    /*
     * documentclass devient obligatoire
     * lorsqu'un environnement document est utilisé.
     */
    if (
        beginDocument &&
        !hasDocumentClass
    ) {

        errors.push(
            "\\begin{document} est présent sans \\documentclass."
        );
    }
}


/**
 * Vérification principale.
 */
export function validateLatex(latex = "") {

    const errors = [];


    /*
     * Vérification du type.
     */
    if (
        typeof latex !== "string"
    ) {

        errors.push(
            "Le contenu LaTeX doit être une chaîne de caractères."
        );

        return {

            valid: false,

            success: false,

            errors
        };
    }


    /*
     * Vérification du contenu.
     */
    if (!latex.trim()) {

        errors.push(
            "Le document LaTeX est vide."
        );

        return {

            valid: false,

            success: false,

            errors
        };
    }


    /*
     * Les commentaires ne doivent pas
     * perturber les vérifications.
     */
    const source =
        removeComments(latex);


    /*
     * Accolades.
     */
    validateBrackets(
        source,
        errors
    );


    /*
     * Mathématiques.
     */
    validateMath(
        source,
        errors
    );


    /*
     * Structure du document.
     */
    validateDocumentStructure(
        source,
        errors
    );


    /*
     * Environnements courants.
     */
    const environments = [

        "equation",
        "equation*",

        "align",
        "align*",

        "alignat",
        "alignat*",

        "gather",
        "gather*",

        "multline",
        "multline*",

        "table",
        "table*",

        "figure",
        "figure*",

        "itemize",
        "enumerate",

        "description",

        "quote",
        "quotation",
        "verse",

        "verbatim",

        "tabular",
        "tabular*"
    ];


    environments.forEach(
        environment => {

            validateEnvironment(
                source,
                environment,
                errors
            );
        }
    );


    return {

        valid:
            errors.length === 0,

        success:
            errors.length === 0,

        errors
    };
}


export default validateLatex;