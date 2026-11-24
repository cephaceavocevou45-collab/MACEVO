/**
 * ============================================================
 * MACEVO - LaTeX Validator
 *
 * Vérifie la structure élémentaire du code LaTeX.
 * ============================================================
 */


/**
 * Vérification des environnements.
 */

function validateEnvironment(
    latex,
    environment,
    errors
) {

    const beginRegex =
        new RegExp(
            `\\\\begin\\{${environment}\\}`,
            "g"
        );

    const endRegex =
        new RegExp(
            `\\\\end\\{${environment}\\}`,
            "g"
        );


    const begins =
        (latex.match(beginRegex) || []).length;


    const ends =
        (latex.match(endRegex) || []).length;


    if (begins !== ends) {

        errors.push({

            message:
                `Nombre différent entre \\begin{${environment}} (${begins}) et \\end{${environment}} (${ends}).`

        });

    }

}


/**
 * Vérification des accolades.
 */

function validateBrackets(
    latex,
    errors
) {

    let count = 0;


    for (const char of latex) {

        if (char === "{") {

            count++;

        }


        if (char === "}") {

            count--;

        }


        if (count < 0) {

            errors.push({

                message:
                    "Une accolade fermante '}' est mal placée."

            });

            return;

        }

    }


    if (count !== 0) {

        errors.push({

            message:
                "Les accolades '{ }' sont déséquilibrées."

        });

    }

}


/**
 * Vérification des délimiteurs mathématiques.
 */

function validateMath(
    latex,
    errors
) {

    /*
     * On retire les \$ échappés.
     */

    const clean =
        latex.replace(
            /\\\$/g,
            ""
        );


    const dollars =
        (clean.match(/\$/g) || []).length;


    if (dollars % 2 !== 0) {

        errors.push({

            message:
                "Délimiteurs mathématiques '$' non équilibrés."

        });

    }

}


/**
 * Validation principale.
 */

export function validateLatex(
    latex = ""
) {

    const errors = [];


    if (
        typeof latex !== "string"
    ) {

        errors.push({

            message:
                "Le contenu LaTeX doit être une chaîne de caractères."

        });

        return {

            valid: false,

            success: false,

            errors,

        };

    }


    validateBrackets(
        latex,
        errors
    );


    validateMath(
        latex,
        errors
    );


    const environments = [

        "equation",
        "equation*",
        "align",
        "align*",
        "table",
        "figure",
        "itemize",
        "enumerate",
        "quote",
        "verbatim",
        "tabular"

    ];


    environments.forEach(
        environment => {

            validateEnvironment(
                latex,
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

        errors,

    };

}


export default validateLatex;