/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : HtmlLatexMapper.js
 * Description : Synchronisation HTML <-> LaTeX
 * Version : 1.0.0
 * ==========================================================
 */

import htmlLatexExporter from "./HtmlLatexExporter";
import latexHtmlImporter from "./LatexHtmlImporter";

class HtmlLatexMapper {

    /* ======================================================
       HTML -> LATEX
    ====================================================== */

    documentToLatex(html = "") {

        return htmlLatexExporter.export(

            html

        );

    }

    /* ======================================================
       LATEX -> HTML
    ====================================================== */

    latexToDocument(latex = "") {

        return latexHtmlImporter.import(

            latex

        );

    }

    /* ======================================================
       NORMALISATION HTML
    ====================================================== */

    normalizeHtml(html = "") {

        return String(html)

            .replace(/\r\n/g, "\n")

            .trim();

    }

    /* ======================================================
       NORMALISATION LATEX
    ====================================================== */

    normalizeLatex(latex = "") {

        return String(latex)

            .replace(/\r\n/g, "\n")

            .trim();

    }

    /* ======================================================
       COMPARAISON HTML
    ====================================================== */

    isHtmlChanged(previous, current) {

        return (

            this.normalizeHtml(previous)

            !==

            this.normalizeHtml(current)

        );

    }

    /* ======================================================
       COMPARAISON LATEX
    ====================================================== */

    isLatexChanged(previous, current) {

        return (

            this.normalizeLatex(previous)

            !==

            this.normalizeLatex(current)

        );

    }

    /* ======================================================
       VALIDATION HTML
    ====================================================== */

    validateHtml(html) {

        return typeof html === "string";

    }

    /* ======================================================
       VALIDATION LATEX
    ====================================================== */

    validateLatex(latex) {

        return typeof latex === "string";

    }

}

const htmlLatexMapper = new HtmlLatexMapper();

export default htmlLatexMapper;