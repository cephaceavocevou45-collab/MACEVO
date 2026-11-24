/**
 * ============================================================
 * MACEVO
 *
 * Fichier : LatexLogParser.js
 * Description : Analyseur des logs de compilation LaTeX
 * Version : 3.0.0
 * ============================================================
 */

class LatexLogParser {


    /* ======================================================
       ANALYSE
    ====================================================== */

    parse(result = {}) {

        const logs = [];

        const now =
            new Date();


        /* ==================================================
           ECHEC
        ================================================== */

        if (!result?.success) {

            logs.push({

                type: "error",

                date: now,

                message:
                    "La compilation a échoué."

            });


            const validationErrors =
                result?.validation?.errors ?? [];


            validationErrors.forEach(

                error => {

                    logs.push({

                        type: "error",

                        date: now,

                        message:
                            error?.message ??
                            String(error)

                    });

                }

            );


            /*
             * Erreurs générales retournées
             * directement par le backend.
             */

            const errors =
                result?.errors ?? [];


            errors.forEach(

                error => {

                    const message =
                        error?.message ??
                        String(error);


                    if (

                        !logs.some(

                            log =>
                                log.message ===
                                message

                        )

                    ) {

                        logs.push({

                            type: "error",

                            date: now,

                            message

                        });

                    }

                }

            );


            return logs;

        }


        /* ==================================================
           SUCCES
        ================================================== */

        logs.push({

            type: "success",

            date: now,

            message:
                "Compilation terminée avec succès."

        });


        /* ==================================================
           STATISTIQUES
        ================================================== */

        if (result.statistics) {

            if (
                result.statistics.characters !==
                undefined
            ) {

                logs.push({

                    type: "info",

                    date: now,

                    message:
                        `Caractères : ${
                            result.statistics.characters
                        }`

                });

            }


            if (
                result.statistics.words !==
                undefined
            ) {

                logs.push({

                    type: "info",

                    date: now,

                    message:
                        `Mots : ${
                            result.statistics.words
                        }`

                });

            }


            if (
                result.statistics.paragraphs !==
                undefined
            ) {

                logs.push({

                    type: "info",

                    date: now,

                    message:
                        `Paragraphes : ${
                            result.statistics.paragraphs
                        }`

                });

            }

        }


        /* ==================================================
           TEMPS DE COMPILATION
        ================================================== */

        if (
            result.compilationTime !==
            undefined
        ) {

            logs.push({

                type: "info",

                date: now,

                message:
                    `Temps de compilation : ${
                        result.compilationTime
                    } ms`

            });

        }


        return logs;

    }

}


const latexLogParser =
    new LatexLogParser();


export default latexLogParser;