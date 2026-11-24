/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : latex.config.js
 * Description : Configuration du moteur LaTeX
 * Version : 1.0.0
 * ==========================================================
 */

import fs from "fs";
import os from "os";
import path from "path";

/* ==========================================================
   CHEMIN MIKTEX
========================================================== */

function findPdfLatex() {

    const candidates = [

        /* Installation système MiKTeX */
        "C:\\Program Files\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe",

        /* Installation utilisateur MiKTeX */
        path.join(
            os.homedir(),
            "AppData",
            "Local",
            "Programs",
            "MiKTeX",
            "miktex",
            "bin",
            "x64",
            "pdflatex.exe"
        ),

    ];


    for (const candidate of candidates) {

        if (fs.existsSync(candidate)) {

            return candidate;

        }

    }


    /*
     * Si pdflatex est déjà disponible dans PATH,
     * on laisse Windows le résoudre.
     */

    return "pdflatex";

}


/* ==========================================================
   CONFIGURATION
========================================================== */

const latexConfig = {

    pdfLatex: process.env.MIKTEX_PDFLATEX || findPdfLatex(),

    workingDirectory: path.resolve(
        process.cwd(),
        "storage",
        "compilations"
    ),

    timeout: 30000,

    maxLatexLength: 1000000,

    maxLogLength: 50000,

};


export default latexConfig;