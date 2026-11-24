/**
 * ==========================================================
 * MACEVO
 *
 * Fichier : LatexHtmlImporter.js
 * Description : Importeur principal LaTeX -> HTML
 * Version : 1.0.0
 * ==========================================================
 */

import BlockImporter from "./BlockImporter";
import InlineImporter from "./InlineImporter";
import StyleImporter from "./StyleImporter";
import TableImporter from "./TableImporter";
import ImageImporter from "./ImageImporter";


class LatexHtmlImporter {

    constructor() {

        this.blockImporter =
            new BlockImporter(this);

        this.inlineImporter =
            new InlineImporter(this);

        this.styleImporter =
            new StyleImporter(this);

        this.tableImporter =
            new TableImporter(this);

        this.imageImporter =
            new ImageImporter(this);

    }


    /**
     * ======================================================
     * IMPORT PRINCIPAL
     * ======================================================
     */

    import(latex = "") {

        if (
            typeof latex !== "string" ||
            !latex.trim()
        ) {

            return "";

        }

        let source =
            latex
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n");


        /*
         * Retirer le wrapper LaTeX.
         */

        source =
            this.removeDocumentWrapper(source);


        /*
         * Protéger les blocs verbatim.
         */

        const protectedBlocks = [];

        source =
            source.replace(
                /\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g,
                (_, content) => {

                    const index =
                        protectedBlocks.length;

                    protectedBlocks.push(
                        `<pre><code>${this.escapeHtml(content)}</code></pre>`
                    );

                    return `@@MACEVO_VERBATIM_${index}@@`;

                }
            );


        /*
         * Tables.
         */

        source =
            this.tableImporter.convert(source);


        /*
         * Images.
         */

        source =
            this.imageImporter.convert(source);


        /*
         * Blocs.
         */

        source =
            this.blockImporter.convert(source);


        /*
         * Inline.
         */

        source =
            this.inlineImporter.convert(source);


        /*
         * Styles.
         */

        source =
            this.styleImporter.convert(source);


        /*
         * Commandes LaTeX restantes.
         */

        source =
            this.removeUnsupportedCommands(source);


        /*
         * Paragraphes.
         */

        source =
            this.convertParagraphs(source);


        /*
         * Restaurer verbatim.
         */

        protectedBlocks.forEach(
            (html, index) => {

                source =
                    source.replace(
                        `@@MACEVO_VERBATIM_${index}@@`,
                        html
                    );

            }
        );


        return source.trim();

    }


    /**
     * ======================================================
     * WRAPPER DOCUMENT
     * ======================================================
     */

    removeDocumentWrapper(source) {

        return String(source ?? "")
            .replace(
                /\\documentclass(?:\[[^\]]*\])?\{[^{}]*\}/g,
                ""
            )
            .replace(
                /\\usepackage(?:\[[^\]]*\])?\{[^{}]*\}/g,
                ""
            )
            .replace(
                /\\begin\{document\}/g,
                ""
            )
            .replace(
                /\\end\{document\}/g,
                ""
            );

    }


    /**
     * ======================================================
     * PARAGRAPHES
     * ======================================================
     */

    convertParagraphs(source) {

        let result =
            String(source ?? "")
                .replace(/[ \t]+\n/g, "\n");


        const blocks =
            result
                .split(/\n\s*\n+/)
                .map(
                    block => block.trim()
                )
                .filter(Boolean);


        return blocks
            .map(block => {

                if (
                    /^<(h[1-6]|p|ul|ol|table|figure|blockquote|pre|hr|div|img)/i
                    .test(block)
                ) {

                    return block;

                }

                return `<p>${block}</p>`;

            })
            .join("\n");

    }


    /**
     * ======================================================
     * COMMANDES INCONNUES
     * ======================================================
     */

    removeUnsupportedCommands(source) {

        return String(source ?? "")
            .replace(
                /\\(?:centering|raggedright|raggedleft|noindent|maketitle)\b/g,
                ""
            )
            .replace(
                /\\label\{[^{}]*\}/g,
                ""
            )
            .replace(
                /\\ref\{([^{}]*)\}/g,
                "$1"
            )
            .replace(
                /\\cite\{([^{}]*)\}/g,
                "[$1]"
            );

    }


    /**
     * ======================================================
     * ESCAPE HTML
     * ======================================================
     */

    escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

}


const latexHtmlImporter =
    new LatexHtmlImporter();


export default latexHtmlImporter;