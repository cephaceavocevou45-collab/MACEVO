/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : latex.service.js
 * Description : Service réel de compilation LaTeX
 * Version : 1.0.0
 * ==========================================================
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { spawn } from "child_process";

import latexConfig from "../config/latex.config.js";


class LatexService {


    /* ======================================================
       INITIALISATION
    ====================================================== */

    constructor() {

        this.baseDirectory =
            latexConfig.workingDirectory;

    }


    /* ======================================================
       PREPARATION DU DOSSIER
    ====================================================== */

    async initialize() {

        await fs.mkdir(

            this.baseDirectory,

            {
                recursive: true,
            }

        );

    }


    /* ======================================================
       ID DE COMPILATION
    ====================================================== */

    createCompilationId() {

        return [

            Date.now().toString(36),

            crypto
                .randomBytes(6)
                .toString("hex"),

        ].join("-");

    }


    /* ======================================================
       CHEMIN DE COMPILATION
    ====================================================== */

    getCompilationDirectory(id) {

        return path.join(

            this.baseDirectory,

            id

        );

    }


    /* ======================================================
       VALIDATION
    ====================================================== */

    validateLatex(latex) {

        const errors = [];


        if (

            typeof latex !== "string" ||

            !latex.trim()

        ) {

            errors.push({

                message:
                    "Le document LaTeX est vide.",

            });

            return {

                success: false,

                errors,

            };

        }


        if (

            latex.length >

            latexConfig.maxLatexLength

        ) {

            errors.push({

                message:
                    "Le document LaTeX est trop volumineux.",

            });

        }


        return {

            success:
                errors.length === 0,

            errors,

        };

    }


    /* ======================================================
       STATISTIQUES
    ====================================================== */

    extractStatistics(log, latex) {

        const statistics = {};


        /*
         * Nombre de pages.
         */

        const pageMatch =

            log.match(

                /Output written on .*?\((\d+)\s+page(?:s)?/

            );


        if (pageMatch) {

            statistics.pages =
                Number(pageMatch[1]);

        }


        /*
         * Nombre de caractères LaTeX.
         */

        statistics.characters =
            latex.length;


        /*
         * Nombre de lignes.
         */

        statistics.lines =
            latex.split(/\r?\n/).length;


        /*
         * Nombre approximatif de mots.
         */

        statistics.words =

            latex.trim()

                ? latex
                    .trim()
                    .split(/\s+/)
                    .length

                : 0;


        return statistics;

    }


    /* ======================================================
       EXTRACTION DES ERREURS
    ====================================================== */

    extractErrors(log) {

        if (!log) {

            return [];

        }


        const errors = [];


        const lines =
            log.split(/\r?\n/);


        for (const line of lines) {

            if (

                line.startsWith("!")

            ) {

                errors.push({

                    message:
                        line.substring(1).trim(),

                });

            }

        }


        return errors;

    }


    /* ======================================================
       EXECUTION PDFLATEX
    ====================================================== */

    runPdfLatex(directory) {

        return new Promise(

            (resolve, reject) => {

                const args = [

                    "-interaction=nonstopmode",

                    "-halt-on-error",

                    "-file-line-error",

                    "main.tex",

                ];


                const processHandle =

                    spawn(

                        latexConfig.pdfLatex,

                        args,

                        {

                            cwd: directory,

                            windowsHide: true,

                        }

                    );


                let stdout = "";

                let stderr = "";


                processHandle.stdout.on(

                    "data",

                    data => {

                        stdout +=
                            data.toString();

                    }

                );


                processHandle.stderr.on(

                    "data",

                    data => {

                        stderr +=
                            data.toString();

                    }

                );


                let finished = false;


                const timer =

                    setTimeout(

                        () => {

                            if (finished) {

                                return;

                            }

                            finished = true;


                            try {

                                processHandle.kill();

                            }

                            catch {

                                /* rien */

                            }


                            reject(

                                new Error(

                                    "La compilation LaTeX a dépassé le délai autorisé."

                                )

                            );

                        },

                        latexConfig.timeout

                    );


                processHandle.on(

                    "error",

                    error => {

                        if (finished) {

                            return;

                        }


                        finished = true;

                        clearTimeout(timer);

                        reject(error);

                    }

                );


                processHandle.on(

                    "close",

                    code => {

                        if (finished) {

                            return;

                        }


                        finished = true;

                        clearTimeout(timer);


                        resolve({

                            code,

                            stdout,

                            stderr,

                        });

                    }

                );

            }

        );

    }


    /* ======================================================
       COMPILATION
    ====================================================== */

    async compile(latex) {

        const validation =
            this.validateLatex(latex);


        if (!validation.success) {

            return {

                success: false,

                latex,

                pdf: null,

                statistics: {},

                compilationId: null,

                validation,

                logs: validation.errors,

            };

        }


        await this.initialize();


        const compilationId =
            this.createCompilationId();


        const directory =
            this.getCompilationDirectory(

                compilationId

            );


        await fs.mkdir(

            directory,

            {
                recursive: true,
            }

        );


        const texPath =
            path.join(

                directory,

                "main.tex"

            );


        const pdfPath =
            path.join(

                directory,

                "main.pdf"

            );


        const logPath =
            path.join(

                directory,

                "main.log"

            );


        try {

            /*
             * Écriture du fichier LaTeX.
             */

            await fs.writeFile(

                texPath,

                latex,

                {
                    encoding: "utf8",
                }

            );


            /*
             * Première compilation.
             */

            const first =
                await this.runPdfLatex(

                    directory

                );


            /*
             * Deuxième compilation :
             * utile notamment pour les références,
             * tables des matières, etc.
             */

            if (

                first.code === 0 &&

                await this.fileExists(pdfPath)

            ) {

                await this.runPdfLatex(

                    directory

                );

            }


            const log =

                await this.readFileSafe(

                    logPath

                );


            const pdfExists =

                await this.fileExists(

                    pdfPath

                );


            if (

                first.code !== 0 ||

                !pdfExists

            ) {

                const errors =
                    this.extractErrors(

                        log || first.stderr

                    );


                return {

                    success: false,

                    latex,

                    pdf: null,

                    statistics: {},

                    compilationId,

                    validation: {

                        success: false,

                        errors:

                            errors.length

                                ? errors

                                : [

                                    {

                                        message:
                                            "La compilation LaTeX a échoué.",

                                    },

                                ],

                    },

                    logs: {

                        stdout:
                            first.stdout,

                        stderr:
                            first.stderr,

                        latex:
                            log,

                    },

                };

            }


            const statistics =

                this.extractStatistics(

                    log,

                    latex

                );


            return {

                success: true,

                latex,

                pdf:
                    `/api/latex/pdf/${compilationId}`,

                statistics,

                compilationId,

                validation: {

                    success: true,

                    errors: [],

                },

                logs: {

                    stdout:
                        first.stdout,

                    stderr:
                        first.stderr,

                    latex:
                        log,

                },

            };

        }

        catch (error) {

            return {

                success: false,

                latex,

                pdf: null,

                statistics: {},

                compilationId,

                validation: {

                    success: false,

                    errors: [

                        {

                            message:
                                error?.message ??
                                "Erreur pendant la compilation LaTeX.",

                        },

                    ],

                },

                logs: {

                    error:
                        error?.message ?? "",

                },

            };

        }

    }


    /* ======================================================
       PDF
    ====================================================== */

    async getPdf(id) {

        const directory =
            this.getCompilationDirectory(id);


        const pdfPath =
            path.join(

                directory,

                "main.pdf"

            );


        if (

            !await this.fileExists(

                pdfPath

            )

        ) {

            return null;

        }


        return pdfPath;

    }


    /* ======================================================
       LOGS
    ====================================================== */

    async getLogs(id) {

        const directory =
            this.getCompilationDirectory(id);


        const logPath =
            path.join(

                directory,

                "main.log"

            );


        return this.readFileSafe(

            logPath

        );

    }


    /* ======================================================
       UTILITAIRES
    ====================================================== */

    async fileExists(filePath) {

        try {

            await fs.access(

                filePath

            );

            return true;

        }

        catch {

            return false;

        }

    }


    async readFileSafe(filePath) {

        try {

            const content =
                await fs.readFile(

                    filePath,

                    "utf8"

                );


            return content.substring(

                0,

                latexConfig.maxLogLength

            );

        }

        catch {

            return "";

        }

    }

}


const latexService =
    new LatexService();


export default latexService;