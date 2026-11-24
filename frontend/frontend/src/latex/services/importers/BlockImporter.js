/**
 * ==========================================================
 * MACEVO
 *
 * Fichier : BlockImporter.js
 * Description : Import des blocs LaTeX -> HTML
 * ==========================================================
 */

class BlockImporter {

    constructor(importer = null) {

        this.importer = importer;

    }


    convert(source = "") {

        let result =
            String(source ?? "");


        /*
         * Sections
         */

        result =
            result.replace(
                /\\section\*?\{([\s\S]*?)\}/g,
                "<h1>$1</h1>"
            );


        result =
            result.replace(
                /\\subsection\*?\{([\s\S]*?)\}/g,
                "<h2>$1</h2>"
            );


        result =
            result.replace(
                /\\subsubsection\*?\{([\s\S]*?)\}/g,
                "<h3>$1</h3>"
            );


        result =
            result.replace(
                /\\paragraph\*?\{([\s\S]*?)\}/g,
                "<h4>$1</h4>"
            );


        result =
            result.replace(
                /\\subparagraph\*?\{([\s\S]*?)\}/g,
                "<h5>$1</h5>"
            );


        /*
         * Quote
         */

        result =
            result.replace(
                /\\begin\{quote\}([\s\S]*?)\\end\{quote\}/g,
                "<blockquote>$1</blockquote>"
            );


        /*
         * Code
         */

        result =
            result.replace(
                /\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g,
                (_, content) =>
                    `<pre><code>${this.escapeHtml(content)}</code></pre>`
            );


        /*
         * Itemize
         */

        result =
            result.replace(
                /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
                (_, content) =>
                    `<ul>${this.convertItems(content)}</ul>`
            );


        /*
         * Enumerate
         */

        result =
            result.replace(
                /\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,
                (_, content) =>
                    `<ol>${this.convertItems(content)}</ol>`
            );


        /*
         * Horizontal rule
         */

        result =
            result.replace(
                /\\hrulefill/g,
                "<hr>"
            );


        /*
         * Sauts de ligne LaTeX
         */

        result =
            result.replace(
                /\\\\/g,
                "<br>"
            );


        return result;

    }


    convertItems(content) {

        return String(content ?? "")
            .split(/\\item\s*/)
            .slice(1)
            .map(
                item =>
                    `<li>${item.trim()}</li>`
            )
            .join("");

    }


    escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    }

}


export default BlockImporter;