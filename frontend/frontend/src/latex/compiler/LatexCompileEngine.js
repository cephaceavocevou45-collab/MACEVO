/**
 * ============================================================
 * MACEVO
 *
 * Fichier : LatexCompileEngine.js
 * Description : Moteur principal de compilation LaTeX
 * Version : 6.0.0
 * ============================================================
 */

import latexApi from "./LatexApi";
import latexLogParser from "./LatexLogParser";


class LatexCompileEngine {


    /* ======================================================
       VALIDATION
    ====================================================== */

    validate(latex = "") {

        const errors = [];


        if (
            typeof latex !== "string" ||
            !latex.trim()
        ) {

            errors.push({

                message:
                    "Le document LaTeX est vide."

            });

        }


        return {

            success:
                errors.length === 0,

            errors

        };

    }


    /* ======================================================
       RESULTAT D'ERREUR
    ====================================================== */

    buildError(validation) {

        return {

            success: false,

            latex: "",

            pdf: null,

            statistics: {},

            compilationId: null,

            validation,

            logs:
                latexLogParser.parse({

                    success: false,

                    validation

                })

        };

    }


    /* ======================================================
       RESULTAT DE SUCCES
    ====================================================== */

    buildSuccess(result, latex) {

        const compilationId =
            result?.compilationId ?? null;


        const pdf =
            result?.pdf ??
            (
                compilationId
                    ? latexApi.getPdfUrl(
                        compilationId
                    )
                    : null
            );


        return {

            success: true,

            latex,

            pdf,

            statistics:
                result?.statistics ?? {},

            compilationId,

            validation: {

                success: true,

                errors: []

            },

            logs:
                latexLogParser.parse({

                    ...result,

                    success: true,

                    statistics:
                        result?.statistics ?? {},

                    compilationId

                })

        };

    }


    /* ======================================================
       COMPILATION
    ====================================================== */

    async compile(latex = "", assets = []) {

        const source =
            String(latex ?? "");


        const validation =
            this.validate(
                source
            );


        if (!validation.success) {

            return this.buildError(
                validation
            );

        }


        try {

            const result =
                await latexApi.compile(
                    source,
                    assets
                );


            if (!result?.success) {

                return {

                    success: false,

                    latex: source,

                    pdf: null,

                    statistics:
                        result?.statistics ?? {},

                    compilationId: null,

                    validation:
                        result?.validation ?? {

                            success: false,

                            errors:
                                result?.errors ?? []

                        },

                    logs:
                        latexLogParser.parse(

                            result ?? {

                                success: false,

                                validation:
                                    result?.validation

                            }

                        )

                };

            }


            return this.buildSuccess(

                result,

                source

            );

        }

        catch (error) {

            const validationError = {

                success: false,

                errors: [

                    {

                        message:
                            error?.message ??
                            "Impossible de contacter le serveur."

                    }

                ]

            };


            return this.buildError(

                validationError

            );

        }

    }

}


const latexCompileEngine =
    new LatexCompileEngine();


export default latexCompileEngine;
