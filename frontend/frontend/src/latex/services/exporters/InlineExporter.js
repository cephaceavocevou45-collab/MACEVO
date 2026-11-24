/**
 * ==========================================================
 * MACEVO
 *
 * ---
 * Fichier : InlineExporter.js
 * Description : Export des éléments inline HTML vers LaTeX
 * Version : 9.1.0
 * ==========================================================
 */

import latexBuilder from "../utils/LatexBuilder";

class InlineExporter {

    constructor(exporter) {

        this.exporter = exporter;

    }


    /* ======================================================
       CONTENU
    ====================================================== */

    content(node) {

        if (
            !node ||
            !this.exporter
        ) {
            return "";
        }

        return this.exporter.exportChildren(
            node
        );

    }


    /* ======================================================
       CONTENU NON VIDE
    ====================================================== */

    contentTrimmed(node) {

        return this.content(node).trim();

    }


    /* ======================================================
       GRAS
    ====================================================== */

    exportBold(node) {

        const content =
            this.content(node);

        if (!content) {
            return "";
        }

        return latexBuilder.command(
            "textbf",
            content
        );

    }


    /* ======================================================
       ITALIQUE
    ====================================================== */

    exportItalic(node) {

        const content =
            this.content(node);

        if (!content) {
            return "";
        }

        return latexBuilder.command(
            "textit",
            content
        );

    }


    /* ======================================================
       SOULIGNÉ
    ====================================================== */

    exportUnderline(node) {

        const content =
            this.content(node);

        if (!content) {
            return "";
        }

        return latexBuilder.command(
            "underline",
            content
        );

    }


    /* ======================================================
       BARRÉ
    ====================================================== */

    exportStrike(node) {

        const content =
            this.content(node);

        if (!content) {
            return "";
        }

        return latexBuilder.command(
            "sout",
            content
        );

    }


    /* ======================================================
       CODE INLINE
    ====================================================== */

    exportInlineCode(node) {

        if (!node) {
            return "";
        }

        const rawContent =
            node.textContent ?? "";

        if (!rawContent) {
            return "";
        }

        /*
         * Le contenu du code reste du texte littéral.
         */

        const content =
            this.exporter?.escaper
                ?.escape(rawContent)
            ?? rawContent;

        return latexBuilder.command(
            "texttt",
            content
        );

    }


    /* ======================================================
       LIEN
    ====================================================== */

    exportLink(node) {

        if (!node) {
            return "";
        }

        const href =
            node.getAttribute(
                "href"
            ) ?? "";

        const label =
            this.content(node);


        if (!href.trim()) {
            return label;
        }


        const visibleLabel =
            label.trim()
                ? label
                : this.escapeUrl(href);


        return latexBuilder.href(
            this.escapeUrl(href),
            visibleLabel
        );

    }


    /* ======================================================
       SPAN
    ====================================================== */

    exportSpan(node) {

        if (
            !this.exporter ||
            !this.exporter.styleExporter
        ) {
            return this.content(node);
        }

        return this.exporter
            .styleExporter
            .exportSpan(node);

    }


    /* ======================================================
       EXPOSANT
    ====================================================== */

    exportSup(node) {

        const content =
            this.content(node);

        if (!content) {
            return "";
        }

        return latexBuilder.command(
            "textsuperscript",
            content
        );

    }


    /* ======================================================
       INDICE
    ====================================================== */

    exportSub(node) {

        const content =
            this.content(node);

        if (!content) {
            return "";
        }

        return latexBuilder.command(
            "textsubscript",
            content
        );

    }


    /* ======================================================
       SURLIGNAGE
    ====================================================== */

    exportMark(node) {

        if (
            !this.exporter ||
            !this.exporter.styleExporter
        ) {
            return this.content(node);
        }

        return this.exporter
            .styleExporter
            .exportHighlight(node);

    }


    /* ======================================================
       PETITE TAILLE
    ====================================================== */

    exportSmall(node) {

        return this.wrapSize(
            "small",
            node
        );

    }


    /* ======================================================
       GRANDE TAILLE
    ====================================================== */

    exportBig(node) {

        return this.wrapSize(
            "Large",
            node
        );

    }


    /* ======================================================
       TAILLE
    ====================================================== */

    wrapSize(size, node) {

        const content =
            this.content(node);

        if (
            !content ||
            !size
        ) {
            return "";
        }

        return `{\\${size} ${content}}`;

    }


    /* ======================================================
       CITATION
    ====================================================== */

    exportCitation(node) {

        const content =
            this.content(node);

        if (!content) {
            return "";
        }

        return latexBuilder.command(
            "textit",
            content
        );

    }


    /* ======================================================
       VARIABLE
    ====================================================== */

    exportVariable(node) {

        const content =
            this.content(node);

        if (!content) {
            return "";
        }

        return latexBuilder.command(
            "textit",
            content
        );

    }


    /* ======================================================
       CLAVIER
    ====================================================== */

    exportKeyboard(node) {

        const content =
            this.content(node);

        if (!content) {
            return "";
        }

        return latexBuilder.command(
            "texttt",
            content
        );

    }


    /* ======================================================
       ABBRÉVIATION
    ====================================================== */

    exportAbbreviation(node) {

        return this.content(node);

    }


    /* ======================================================
       BDI
    ====================================================== */

    exportBDI(node) {

        return this.content(node);

    }


    /* ======================================================
       BDO
    ====================================================== */

    exportBDO(node) {

        return this.content(node);

    }


    /* ======================================================
       URL
    ====================================================== */

    escapeUrl(url) {

        if (
            url === null ||
            url === undefined
        ) {
            return "";
        }

        const value =
            String(url);

        if (!value) {
            return "";
        }


        /*
         * Important :
         * les substitutions sont faites
         * sans repasser par LatexEscaper,
         * afin d'éviter les doubles échappements.
         */

        return value

            .replace(
                /\\/g,
                "\\textbackslash{}"
            )

            .replace(
                /([{}])/g,
                "\\$1"
            )

            .replace(
                /([%#&_^])/g,
                "\\$1"
            )

            .replace(
                /\$/g,
                "\\$"
            )

            .replace(
                /~/g,
                "\\textasciitilde{}"
            );

    }

}


export default InlineExporter;