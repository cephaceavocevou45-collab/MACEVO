/**
 * ============================================================
 * MACEVO
 *
 * Fichier : LatexExportService.js
 * Description : Service central d'export LaTeX
 * Version : 1.0.0
 * ============================================================
 */

import latexConverter from "../../core/document/engines/export/latex/LatexConverter.js";
import htmlLatexExporter from "./exporters/HtmlLatexExporter";


class LatexExportService {

    constructor() {

        this.converter =
            latexConverter;

        this.htmlExporter =
            htmlLatexExporter;

    }


    /* ======================================================
       HTML -> LATEX
    ====================================================== */

    exportHtml(html = "") {

        if (
            typeof html !== "string" ||
            !html.trim()
        ) {

            return "";

        }

        try {

            return this.htmlExporter.export(
                html
            );

        } catch (error) {

            console.error(
                "Erreur export HTML -> LaTeX :",
                error
            );

            return "";

        }

    }


    /* ======================================================
       DOCUMENT -> LATEX
    ====================================================== */

    exportDocument(document) {

        if (document == null) {

            return "";

        }

        try {

            if (
                typeof document === "string"
            ) {

                return this.exportHtml(
                    document
                );

            }

            if (
                this.converter &&
                typeof this.converter
                    .documentToLatex ===
                    "function"
            ) {

                return this.converter
                    .documentToLatex(
                        document
                    );

            }

            return "";

        } catch (error) {

            console.error(
                "Erreur export document -> LaTeX :",
                error
            );

            return "";

        }

    }


    /* ======================================================
       CONVERSION GÉNÉRIQUE
    ====================================================== */

    convert(source, options = {}) {

        if (
            source == null
        ) {

            return "";

        }

        const type =
            options?.type ??
            "html";


        if (
            type === "html"
        ) {

            return this.exportHtml(
                source
            );

        }


        if (
            type === "document"
        ) {

            return this.exportDocument(
                source
            );

        }


        if (
            type === "latex"
        ) {

            return String(source);

        }


        return "";

    }


    /* ======================================================
       TÉLÉCHARGEMENT
    ====================================================== */

    download(
        source,
        filename = "document.tex",
        options = {}
    ) {

        const latex =
            this.convert(
                source,
                options
            );

        if (
            !latex
        ) {

            return false;

        }


        if (
            typeof window ===
            "undefined" ||
            typeof document ===
            "undefined"
        ) {

            return false;

        }


        const blob =
            new Blob(
                [latex],
                {
                    type:
                        "application/x-tex;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );

        link.href =
            url;

        link.download =
            filename.endsWith(".tex")
                ? filename
                : `${filename}.tex`;


        document.body.appendChild(
            link
        );

        link.click();

        link.remove();


        URL.revokeObjectURL(
            url
        );


        return true;

    }


    /* ======================================================
       VALIDATION
    ====================================================== */

    canExport(source) {

        if (
            source == null
        ) {

            return false;

        }

        if (
            typeof source ===
            "string"
        ) {

            return source.trim()
                .length > 0;

        }

        return true;

    }

}


const latexExportService =
    new LatexExportService();

export default latexExportService;

export {
    LatexExportService
};