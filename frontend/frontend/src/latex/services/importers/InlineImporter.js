/**
 * ==========================================================
 * MACEVO
 *
 * Fichier : InlineImporter.js
 * Description : Import des commandes inline LaTeX -> HTML
 * ==========================================================
 */

class InlineImporter {

    convert(source = "") {

        let result =
            String(source ?? "");


        result =
            result.replace(
                /\\textbf\{([\s\S]*?)\}/g,
                "<strong>$1</strong>"
            );


        result =
            result.replace(
                /\\textit\{([\s\S]*?)\}/g,
                "<em>$1</em>"
            );


        result =
            result.replace(
                /\\underline\{([\s\S]*?)\}/g,
                "<u>$1</u>"
            );


        result =
            result.replace(
                /\\texttt\{([\s\S]*?)\}/g,
                "<code>$1</code>"
            );


        result =
            result.replace(
                /\\textsuperscript\{([\s\S]*?)\}/g,
                "<sup>$1</sup>"
            );


        result =
            result.replace(
                /\\textsubscript\{([\s\S]*?)\}/g,
                "<sub>$1</sub>"
            );


        result =
            result.replace(
                /\\emph\{([\s\S]*?)\}/g,
                "<em>$1</em>"
            );


        result =
            result.replace(
                /\\textsc\{([\s\S]*?)\}/g,
                "<span style=\"font-variant:small-caps\">$1</span>"
            );


        result =
            result.replace(
                /\\href\{([^{}]*)\}\{([\s\S]*?)\}/g,
                '<a href="$1">$2</a>'
            );


        result =
            result.replace(
                /\\url\{([^{}]*)\}/g,
                '<a href="$1">$1</a>'
            );


        result =
            result.replace(
                /\\textcolor\{([^{}]*)\}\{([\s\S]*?)\}/g,
                '<span style="color:$1">$2</span>'
            );


        return result;

    }

}


export default InlineImporter;