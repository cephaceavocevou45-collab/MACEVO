/**
 * ==========================================================
 * MACEVO
 *
 * Fichier : LatexConverter.js
 * Description : Convertisseur central HTML <-> LaTeX
 * Version : 1.0.0
 * ==========================================================
 */

import htmlLatexExporter from "./services/exporters/HtmlLatexExporter";
import latexHtmlImporter from "./services/importers/LatexHtmlImporter";


class LatexConverter {

    /**
     * ======================================================
     * HTML -> LATEX
     * ======================================================
     */

    htmlToLatex(html = "") {

        if (
            typeof html !== "string" ||
            !html.trim()
        ) {
            return "";
        }

        try {

            return htmlLatexExporter.export(html);

        }
        catch (error) {

            console.error(
                "LatexConverter : erreur HTML -> LaTeX",
                error
            );

            return "";

        }

    }


    /**
     * ======================================================
     * LATEX -> HTML
     * ======================================================
     */

    latexToHtml(latex = "") {

        if (
            typeof latex !== "string" ||
            !latex.trim()
        ) {
            return "";
        }

        try {

            return latexHtmlImporter.import(latex);

        }
        catch (error) {

            console.error(
                "LatexConverter : erreur LaTeX -> HTML",
                error
            );

            return "";

        }

    }


    /**
     * ======================================================
     * COMPATIBILITÉ
     * ======================================================
     */

    convertHTMLToLatex(html = "") {

        return this.htmlToLatex(html);

    }


    convertLatexToHTML(latex = "") {

        return this.latexToHtml(latex);

    }


    convertLatexToHtml(latex = "") {

        return this.latexToHtml(latex);

    }

}


const latexConverter =
    new LatexConverter();


export default latexConverter;