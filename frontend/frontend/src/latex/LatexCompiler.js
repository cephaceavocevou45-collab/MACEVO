/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexCompiler.js
 * Description : Service de compilation LaTeX
 * Version : 3.0.0
 * ==========================================================
 */

import latexEngine from "./compiler/LatexCompileEngine";

class LatexCompiler {

    compile(project) {

        /* ======================================================
           RECHERCHE DU FICHIER PRINCIPAL
        ====================================================== */

        const mainFile = project.files.find(

            file => file.id === "main"

        );

        if (!mainFile) {

            return {

                success: false,

                message: "Le fichier main.tex est introuvable.",

                logs: [

                    {

                        type: "error",

                        message: "main.tex introuvable."

                    }

                ]

            };

        }

        /* ======================================================
           EXPORT LATEX
        ====================================================== */

        const result = latexEngine.export(

            mainFile.content

        );

        if (!result.success) {

            return {

                success: false,

                message: "La compilation a échoué.",

                statistics: {},

                pdf: null,

                latex: "",

                logs: [

                    {

                        type: "error",

                        message: "Erreur durant la compilation."

                    }

                ],

                validation: result.validation

            };

        }

        /* ======================================================
           SUCCÈS
        ====================================================== */

        return {

            success: true,

            latex: result.content,

            pdf: result.pdf ?? null,

            statistics: result.statistics ?? {},

            compiledAt: new Date(),

            project,

            logs: [

                {

                    type: "success",

                    message: "Compilation terminée."

                }

            ]

        };

    }

}

const latexCompiler = new LatexCompiler();

export default latexCompiler;