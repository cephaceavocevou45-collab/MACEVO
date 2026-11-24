/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : latex.controller.js
 * Description : Contrôleur HTTP de compilation LaTeX
 * Version : 1.0.0
 * ==========================================================
 */

import latexService from "../services/latex.service.js";


class LatexController {


    /* ======================================================
       COMPILATION
    ====================================================== */

    async compile(req, res) {

        try {

            const latex =
                req.body?.latex ?? "";


            const result =
                await latexService.compile(

                    latex

                );


            return res.status(

                result.success

                    ? 200
                    : 422

            ).json(result);

        }

        catch (error) {

            console.error(

                "Erreur compilation LaTeX:",

                error

            );


            return res.status(500).json({

                success: false,

                latex: "",

                pdf: null,

                statistics: {},

                compilationId: null,

                validation: {

                    success: false,

                    errors: [

                        {

                            message:
                                error?.message ??
                                "Erreur interne du serveur.",

                        },

                    ],

                },

                logs: [],

            });

        }

    }


    /* ======================================================
       PDF
    ====================================================== */

    async pdf(req, res) {

        try {

            const id =
                req.params.id;


            const pdfPath =
                await latexService.getPdf(

                    id

                );


            if (!pdfPath) {

                return res.status(404).json({

                    success: false,

                    message:
                        "PDF introuvable.",

                });

            }


            return res.sendFile(

                pdfPath

            );

        }

        catch (error) {

            console.error(

                "Erreur récupération PDF:",

                error

            );


            return res.status(500).json({

                success: false,

                message:
                    "Impossible de récupérer le PDF.",

            });

        }

    }


    /* ======================================================
       LOGS
    ====================================================== */

    async logs(req, res) {

        try {

            const id =
                req.params.id;


            const logs =
                await latexService.getLogs(

                    id

                );


            if (!logs) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Logs introuvables.",

                });

            }


            return res.json({

                success: true,

                logs,

            });

        }

        catch (error) {

            console.error(

                "Erreur récupération logs:",

                error

            );


            return res.status(500).json({

                success: false,

                message:
                    "Impossible de récupérer les logs.",

            });

        }

    }


    /* ======================================================
       PING
    ====================================================== */

    async ping(req, res) {

        return res.json({

            success: true,

            service: "MACEVO LaTeX Backend",

            pdflatex: true,

        });

    }

}


const latexController =
    new LatexController();


export default latexController;