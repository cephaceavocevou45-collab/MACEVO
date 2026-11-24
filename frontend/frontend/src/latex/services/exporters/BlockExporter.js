/**
 * ==========================================================
 * MACEVO
 *
 * ---
 * Fichier : BlockExporter.js
 * Description : Export des blocs HTML vers LaTeX
 * Version : 8.1.0
 * ==========================================================
 */

import latexBuilder from "../utils/LatexBuilder";

class BlockExporter {

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
       PARAGRAPHE
    ====================================================== */

    exportParagraph(node) {

        const content =
            this.content(node).trim();

        if (!content) {
            return "";
        }

        // Les modèles MACEVO portent déjà leur numérotation dans le texte HTML.
        // La laisser dans \section ferait apparaître, par exemple, « 1 1 Introduction ».
        return latexBuilder.concat(
            content,
            latexBuilder.paragraph()
        );

    }


    /* ======================================================
       TITRES
    ====================================================== */

    exportHeading(
        node,
        level = 1
    ) {

        const content =
            this.content(node).trim();

        if (!content) {
            return "";
        }

        // Les modèles MACEVO portent déjà leur numérotation dans le texte HTML.
        // La laisser dans \section ferait apparaître, par exemple, « 1 1 Introduction ».
        const headingContent = content.replace(/^\s*\d+(?:\.\d+)*\.?\s+/, "");

        const safeLevel =
            Math.min(
                6,
                Math.max(
                    1,
                    Number(level) || 1
                )
            );

        return latexBuilder.concat(
            latexBuilder.section(
                safeLevel,
                headingContent
            ),
            latexBuilder.paragraph()
        );

    }


    /* ======================================================
       CITATION
    ====================================================== */

    exportBlockquote(node) {

        const content =
            this.content(node).trim();

        if (!content) {
            return "";
        }

        return latexBuilder.concat(
            latexBuilder.environment(
                "quote",
                content
            ),
            latexBuilder.paragraph()
        );

    }


    /* ======================================================
       BLOC DE CODE
    ====================================================== */

    exportCodeBlock(node) {

        if (!node) {
            return "";
        }

        const content =
            node.textContent ?? "";

        if (!content.trim()) {
            return "";
        }

        return latexBuilder.concat(
            latexBuilder.environment(
                "verbatim",
                content
            ),
            latexBuilder.paragraph()
        );

    }


    /* ======================================================
       LISTE À PUCES
    ====================================================== */

    exportBulletList(node) {

        if (!node) {
            return "";
        }

        const items =
            this.exportListItems(node);

        if (!items.trim()) {
            return "";
        }

        return latexBuilder.concat(
            latexBuilder.environment(
                "itemize",
                items
            ),
            latexBuilder.paragraph()
        );

    }


    /* ======================================================
       LISTE NUMÉROTÉE
    ====================================================== */

    exportOrderedList(node) {

        if (!node) {
            return "";
        }

        const items =
            this.exportListItems(node);

        if (!items.trim()) {
            return "";
        }

        return latexBuilder.concat(
            latexBuilder.environment(
                "enumerate",
                items
            ),
            latexBuilder.paragraph()
        );

    }


    /* ======================================================
       ELEMENTS DE LISTE
    ====================================================== */

    exportListItems(node) {

        if (
            !node ||
            !node.childNodes
        ) {
            return "";
        }

        let output = "";

        node.childNodes.forEach(
            child => {

                if (
                    !child ||
                    child.nodeType !== 1
                ) {
                    return;
                }

                const tagName =
                    child.tagName
                        ?.toLowerCase();

                if (tagName !== "li") {
                    return;
                }

                output +=
                    this.exporter.exportNode(
                        child
                    );

            }
        );

        return output;

    }


    /* ======================================================
       ITEM DE LISTE
    ====================================================== */

    exportListItem(node) {

        if (!node) {
            return "";
        }

        let content = "";

        const nestedLists = [];


        node.childNodes.forEach(
            child => {

                if (!child) {
                    return;
                }

                if (
                    child.nodeType === 1
                ) {

                    const tagName =
                        child.tagName
                            ?.toLowerCase();

                    if (
                        tagName === "ul" ||
                        tagName === "ol"
                    ) {

                        nestedLists.push(
                            child
                        );

                        return;

                    }

                }

                content +=
                    this.exporter.exportNode(
                        child
                    );

            }
        );


        content =
            content.trim();


        if (
            !content &&
            nestedLists.length === 0
        ) {
            return "";
        }


        let output =
            latexBuilder.item(
                content
            );


        if (nestedLists.length) {

            output += "\n";

            nestedLists.forEach(
                list => {

                    output +=
                        this.exporter.exportNode(
                            list
                        );

                }
            );

        }


        return output + "\n";

    }


    /* ======================================================
       LIGNE HORIZONTALE
    ====================================================== */

    exportHorizontalRule() {

        return latexBuilder.concat(
            "\\hrulefill",
            latexBuilder.paragraph()
        );

    }


    /* ======================================================
       DIV
    ====================================================== */

    exportDiv(node) {
        const classes = String(node?.getAttribute?.("class") || "").split(/\s+/);
        if (classes.includes("macevo-page-break") || classes.includes("rm-page-break") || node?.hasAttribute?.("data-macevo-page-break")) {
            return "\\clearpage\n";
        }
        if (classes.includes("macevo-cover") || classes.includes("macevo-title-page")) {
            return `\\thispagestyle{empty}\n${this.content(node)}\\clearpage\n`;
        }
        return this.content(node);
    }


    /* ======================================================
       SECTION HTML
    ====================================================== */

    exportSection(node) {
        return this.content(node);
    }


    /* ======================================================
       ARTICLE
    ====================================================== */

    exportArticle(node) {
        return this.content(node);
    }


    /* ======================================================
       HEADER
    ====================================================== */

    exportHeader(node) {
        return this.content(node);
    }


    /* ======================================================
       FOOTER
    ====================================================== */

    exportFooter(node) {
        return this.content(node);
    }


    /* ======================================================
       ASIDE
    ====================================================== */

    exportAside(node) {
        return this.content(node);
    }


    /* ======================================================
       MAIN
    ====================================================== */

    exportMain(node) {
        return this.content(node);
    }


    /* ======================================================
       FIGURE
    ====================================================== */

    exportFigure(node) {

        if (!node) {
            return "";
        }


        let imageContent = "";

        let captionContent = "";


        Array.from(
            node.children
        ).forEach(
            child => {

                const tagName =
                    child.tagName
                        ?.toLowerCase();


                if (
                    tagName ===
                    "figcaption"
                ) {

                    captionContent =
                        this.content(
                            child
                        ).trim();

                    return;

                }


                /*
                 * On exporte les autres éléments
                 * normalement.
                 *
                 * L'ImageExporter ne génère plus
                 * de figure lorsqu'il rencontre une
                 * image à l'intérieur d'une figure.
                 */

                imageContent +=
                    this.exporter.exportNode(
                        child
                    );

            }
        );


        imageContent =
            imageContent.trim();


        if (!imageContent) {
            return "";
        }


        let content =
            "\\centering\n" +
            imageContent;


        if (captionContent) {

            content +=
                "\n" +
                latexBuilder.command(
                    "caption",
                    captionContent
                );

        }


        return latexBuilder.concat(
            latexBuilder.environmentWithOptions(
                "figure",
                "htbp",
                content
            ),
            latexBuilder.paragraph()
        );

    }


    /* ======================================================
       FIGCAPTION
    ====================================================== */

    exportFigCaption(node) {

        if (!node) {
            return "";
        }

        const content =
            this.content(node).trim();

        if (!content) {
            return "";
        }

        /*
         * Une figcaption est normalement consommée
         * par exportFigure().
         *
         * Cette méthode reste disponible pour les
         * figcaption isolés.
         */

        return latexBuilder.command(
            "caption",
            content
        ) + "\n";

    }

}


export default BlockExporter;
