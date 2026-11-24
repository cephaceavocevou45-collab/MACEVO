/**
 * ==========================================================
 * MACEVO
 *
 * Fichier : LatexMapper.js
 * Description : Conversion bidirectionnelle HTML <-> LaTeX
 * Version : 2.0.0
 * ==========================================================
 */

import latexConverter from "../../core/document/engines/export/latex/LatexConverter.js";
import validateLatex from "./validator";


class LatexMapper {

    /**
     * ======================================================
     * HTML -> LATEX
     * ======================================================
     */

    documentToLatex(document) {

        if (
            document == null
        ) {

            return "";

        }


        if (
            typeof document !== "string"
        ) {

            return "";

        }


        return latexConverter.htmlToLatex(
            document
        );

    }


    /**
     * ======================================================
     * LATEX -> HTML
     * ======================================================
     */

    latexToDocument(latex) {

        if (
            typeof latex !== "string"
        ) {

            return "";

        }


        return latexConverter.latexToHtml(
            latex
        );

    }


    /**
     * ======================================================
     * NORMALISATION LATEX
     * ======================================================
     */

    normalizeLatex(latex) {

        if (
            typeof latex !== "string"
        ) {

            return "";

        }


        return latex
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .trim();

    }


    /**
     * ======================================================
     * NORMALISATION DOCUMENT
     * ======================================================
     */

    normalizeDocument(document) {

        if (
            typeof document !== "string"
        ) {

            return "";

        }


        return document
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .trim();

    }


    /**
     * ======================================================
     * COMPARAISON LATEX
     * ======================================================
     */

    isLatexChanged(
        previousLatex,
        nextLatex
    ) {

        return (

            this.normalizeLatex(
                previousLatex
            )

            !==

            this.normalizeLatex(
                nextLatex
            )

        );

    }


    /**
     * ======================================================
     * COMPARAISON DOCUMENT
     * ======================================================
     */

    isDocumentChanged(
        previousDocument,
        nextDocument
    ) {

        return (

            this.normalizeDocument(
                previousDocument
            )

            !==

            this.normalizeDocument(
                nextDocument
            )

        );

    }


    /**
     * ======================================================
     * VALIDATION LATEX
     * ======================================================
     */

    validateLatex(latex) {

        return validateLatex(
            latex
        );

    }


    /**
     * ======================================================
     * VALIDATION DOCUMENT
     * ======================================================
     */

    validateDocument(document) {

        return (
            typeof document === "string"
        );

    }

}


const latexMapper =
    new LatexMapper();


export default latexMapper;