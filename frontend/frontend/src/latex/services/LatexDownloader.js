/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexDownloader.js
 * Description : Téléchargement des documents LaTeX
 * Version : 1.0.0
 * ==========================================================
 */

class LatexDownloader {

    /* ======================================================
       TELECHARGER TEX
    ====================================================== */

    downloadTex(

        latex,

        filename = "document.tex"

    ) {

        if (!latex) {

            return;

        }

        const blob = new Blob(

            [

                latex

            ],

            {

                type: "text/plain"

            }

        );

        const url = URL.createObjectURL(

            blob

        );

        const link = document.createElement(

            "a"

        );

        link.href = url;

        link.download = filename;

        link.click();

        URL.revokeObjectURL(

            url

        );

    }

    /* ======================================================
       TELECHARGER PDF
    ====================================================== */

    downloadPdf(

        pdf,

        filename = "document.pdf"

    ) {

        if (!pdf) {

            return;

        }

        const link = document.createElement(

            "a"

        );

        link.href = pdf;

        link.download = filename;

        link.click();

    }

}

const latexDownloader = new LatexDownloader();

export default latexDownloader;