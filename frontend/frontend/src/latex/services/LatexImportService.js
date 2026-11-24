/**
 * ==========================================================
 * MACEVO
 *
 * ----------------------------------------------------------
 * Fichier : LatexImportService.js
 * Description : Import LaTeX -> HTML pour le document MACEVO
 * Version : 7.0.0
 * Statut : Stable
 * ==========================================================
 */

class LatexImportService {

    /* ======================================================
       CONVERSION PRINCIPALE
    ====================================================== */

    async import(latex = "") {

        if (
            typeof latex !== "string" ||
            !latex.trim()
        ) {

            return "";

        }

        try {

            return this.convertLatexToHtml(
                latex
            );

        }

        catch (error) {

            console.error(
                "Erreur import LaTeX -> HTML :",
                error
            );

            return "";

        }

    }


    /* ======================================================
       CONVERSION LATEX -> HTML
    ====================================================== */

    convertLatexToHtml(latex) {

        let source =
            String(latex ?? "")
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n");


        /* ==================================================
           EXTRACTION DU DOCUMENT
        ================================================== */

        source =
            this.removeDocumentWrapper(
                source
            );


        /* ==================================================
           PROTECTION DES BLOCS DE CODE
        ================================================== */

        const protectedBlocks = [];

        source =
            source.replace(

                /\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g,

                (_, content) => {

                    const index =
                        protectedBlocks.length;

                    protectedBlocks.push(

                        `<pre><code>${
                            this.escapeHtml(content)
                        }</code></pre>`

                    );

                    return `@@MACEVO_VERBATIM_${index}@@`;

                }

            );


        /* ==================================================
           ENVIRONNEMENTS
        ================================================== */

        source =
            this.convertEnvironments(
                source
            );


        /* ==================================================
           COMMANDES DE TITRES
        ================================================== */

        source =
            source.replace(

                /\\section\*?\{([\s\S]*?)\}/g,

                "<h1>$1</h1>"

            );

        source =
            source.replace(

                /\\subsection\*?\{([\s\S]*?)\}/g,

                "<h2>$1</h2>"

            );

        source =
            source.replace(

                /\\subsubsection\*?\{([\s\S]*?)\}/g,

                "<h3>$1</h3>"

            );

        source =
            source.replace(

                /\\paragraph\*?\{([\s\S]*?)\}/g,

                "<h4>$1</h4>"

            );

        source =
            source.replace(

                /\\subparagraph\*?\{([\s\S]*?)\}/g,

                "<h5>$1</h5>"

            );


        /* ==================================================
           COMMANDES HORIZONTALES
        ================================================== */

        source =
            source.replace(

                /\\hrulefill/g,

                "<hr>"

            );


        /* ==================================================
           LIENS
        ================================================== */

        source =
            source.replace(

                /\\href\{([^{}]*)\}\{([\s\S]*?)\}/g,

                '<a href="$1">$2</a>'

            );


        /* ==================================================
           IMAGES
        ================================================== */

        source =
            source.replace(

                /\\includegraphics(?:\[[^\]]*\])?\{([^{}]*)\}/g,

                '<img src="$1" />'

            );


        /* ==================================================
           MISE EN FORME
        ================================================== */

        source =
            source.replace(

                /\\textbf\{([\s\S]*?)\}/g,

                "<strong>$1</strong>"

            );

        source =
            source.replace(

                /\\textit\{([\s\S]*?)\}/g,

                "<em>$1</em>"

            );

        source =
            source.replace(

                /\\underline\{([\s\S]*?)\}/g,

                "<u>$1</u>"

            );

        source =
            source.replace(

                /\\texttt\{([\s\S]*?)\}/g,

                "<code>$1</code>"

            );

        source =
            source.replace(

                /\\textsuperscript\{([\s\S]*?)\}/g,

                "<sup>$1</sup>"

            );

        source =
            source.replace(

                /\\textsubscript\{([\s\S]*?)\}/g,

                "<sub>$1</sub>"

            );


        /* ==================================================
           COULEUR
        ================================================== */

        source =
            source.replace(

                /\\textcolor\{([^{}]*)\}\{([\s\S]*?)\}/g,

                '<span style="color:$1">$2</span>'

            );


        /* ==================================================
           TAILLE DE TEXTE
        ================================================== */

        source =
            source.replace(

                /\{\\fontsize\{([^{}]*)\}\{[^{}]*\}\\selectfont\s*([\s\S]*?)\}/g,

                '<span style="font-size:$1pt">$2</span>'

            );


        /* ==================================================
           LISTES
        ================================================== */

        source =
            source.replace(

                /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,

                (_, content) => {

                    const items =
                        this.convertListItems(
                            content
                        );

                    return `<ul>${items}</ul>`;

                }

            );


        source =
            source.replace(

                /\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,

                (_, content) => {

                    const items =
                        this.convertListItems(
                            content
                        );

                    return `<ol>${items}</ol>`;

                }

            );


        /* ==================================================
           RETOUR À LA LIGNE
        ================================================== */

        source =
            source.replace(

                /\\\\/g,

                "<br>"

            );


        /* ==================================================
           CARACTÈRES LATEX
        ================================================== */

        source =
            this.convertLatexCharacters(
                source
            );


        /* ==================================================
           PARAGRAPHES
        ================================================== */

        source =
            this.convertParagraphs(
                source
            );


        /* ==================================================
           RESTAURATION DES BLOCS PROTÉGÉS
        ================================================== */

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


    /* ======================================================
       DOCUMENT WRAPPER
    ====================================================== */

    removeDocumentWrapper(source) {

        let result =
            String(source ?? "");


        result =
            result.replace(

                /\\documentclass(?:\[[^\]]*\])?\{[^{}]*\}/g,

                ""

            );


        result =
            result.replace(

                /\\usepackage(?:\[[^\]]*\])?\{[^{}]*\}/g,

                ""

            );


        result =
            result.replace(

                /\\begin\{document\}/g,

                ""

            );


        result =
            result.replace(

                /\\end\{document\}/g,

                ""

            );


        return result;

    }


    /* ======================================================
       ENVIRONNEMENTS
    ====================================================== */

    convertEnvironments(source) {

        let result = source;


        /* ==================================================
           QUOTE
        ================================================== */

        result =
            result.replace(

                /\\begin\{quote\}([\s\S]*?)\\end\{quote\}/g,

                "<blockquote>$1</blockquote>"

            );


        /* ==================================================
           FIGURE
        ================================================== */

        result =
            result.replace(

                /\\begin\{figure\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{figure\}/g,

                (_, content) => {

                    return `<figure>${content}</figure>`;

                }

            );


        /* ==================================================
           CENTERING
        ================================================== */

        result =
            result.replace(

                /\\centering/g,

                ""

            );


        /* ==================================================
           TABULAR
        ================================================== */

        result =
            result.replace(

                /\\begin\{tabular\}\{[^{}]*\}([\s\S]*?)\\end\{tabular\}/g,

                (_, content) => {

                    return this.convertTable(
                        content
                    );

                }

            );


        return result;

    }


    /* ======================================================
       LISTE
    ====================================================== */

    convertListItems(content) {

        return String(content ?? "")

            .split(/\\item\s+/)

            .slice(1)

            .map(

                item => {

                    return `<li>${item.trim()}</li>`;

                }

            )

            .join("");

    }


    /* ======================================================
       TABLEAU
    ====================================================== */

    convertTable(content) {

        const rows =
            String(content ?? "")
                .split(/\\\\/)
                .map(
                    row => row.trim()
                )
                .filter(Boolean);


        let html =
            "<table><tbody>";


        rows.forEach(

            row => {

                const cells =
                    row
                        .split("&")
                        .map(
                            cell =>
                                cell.trim()
                        )
                        .filter(Boolean);


                if (!cells.length) {
                    return;
                }


                html += "<tr>";


                cells.forEach(

                    cell => {

                        html +=
                            `<td>${cell}</td>`;

                    }

                );


                html += "</tr>";

            }

        );


        html += "</tbody></table>";


        return html;

    }


    /* ======================================================
       CARACTÈRES LATEX
    ====================================================== */

    convertLatexCharacters(source) {

        let result =
            String(source ?? "");


        result =
            result.replace(
                /\\%/g,
                "%"
            );

        result =
            result.replace(
                /\\&/g,
                "&"
            );

        result =
            result.replace(
                /\\#/g,
                "#"
            );

        result =
            result.replace(
                /\\_/g,
                "_"
            );

        result =
            result.replace(
                /\\\{/g,
                "{"
            );

        result =
            result.replace(
                /\\\}/g,
                "}"
            );

        result =
            result.replace(
                /``/g,
                "“"
            );

        result =
            result.replace(
                /''/g,
                "”"
            );


        /*
         * Les espaces insécables LaTeX.
         */

        result =
            result.replace(
                /~/g,
                " "
            );


        return result;

    }


    /* ======================================================
       PARAGRAPHES HTML
    ====================================================== */

    convertParagraphs(source) {

        const blocks =
            String(source ?? "")
                .split(/\n\s*\n/);


        return blocks

            .map(

                block => {

                    const value =
                        block.trim();


                    if (!value) {

                        return "";

                    }


                    /*
                     * Les éléments HTML déjà créés
                     * restent tels quels.
                     */

                    if (
                        /^<(h[1-6]|ul|ol|li|blockquote|pre|figure|table|hr|div|p|img|section|article|header|footer|aside|main)/i
                            .test(value)
                    ) {

                        return value;

                    }


                    return `<p>${value}</p>`;

                }

            )

            .filter(Boolean)

            .join("\n");

    }


    /* ======================================================
       HTML ESCAPE
    ====================================================== */

    escapeHtml(value) {

        return String(value ?? "")

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }

}


/* ==========================================================
   INSTANCE UNIQUE
========================================================== */

const latexImportService =
    new LatexImportService();


export default latexImportService;