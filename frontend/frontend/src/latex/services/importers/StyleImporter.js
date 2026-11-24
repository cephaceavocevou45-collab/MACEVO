/**
 * ==========================================================
 * MACEVO
 *
 * Fichier : StyleImporter.js
 * Description : Import des styles LaTeX -> HTML
 * ==========================================================
 */

class StyleImporter {

    convert(source = "") {

        let result =
            String(source ?? "");


        /*
         * Taille du texte
         */

        result =
            result.replace(
                /\{\\fontsize\{([^{}]*)\}\{[^{}]*\}\\selectfont\s*([\s\S]*?)\}/g,
                '<span style="font-size:$1pt">$2</span>'
            );


        result =
            result.replace(
                /\\tiny\b/g,
                '<span style="font-size:8pt">'
            );


        result =
            result.replace(
                /\\small\b/g,
                '<span style="font-size:12pt">'
            );


        result =
            result.replace(
                /\\large\b/g,
                '<span style="font-size:16pt">'
            );


        result =
            result.replace(
                /\\Large\b/g,
                '<span style="font-size:20pt">'
            );


        /*
         * Accents et caractères LaTeX
         */

        result =
            result.replace(/\\%/g, "%");

        result =
            result.replace(/\\&/g, "&");

        result =
            result.replace(/\\#/g, "#");

        result =
            result.replace(/\\_/g, "_");

        result =
            result.replace(/\\\{/g, "{");

        result =
            result.replace(/\\\}/g, "}");


        /*
         * Guillemets
         */

        result =
            result.replace(/``/g, "“");

        result =
            result.replace(/''/g, "”");


        /*
         * Tirets
         */

        result =
            result.replace(/---/g, "—");

        result =
            result.replace(/--/g, "–");


        /*
         * Commandes accentuées courantes
         */

        result =
            result.replace(
                /\\"a/g,
                "ä"
            );

        result =
            result.replace(
                /\\"e/g,
                "ë"
            );

        result =
            result.replace(
                /\\"i/g,
                "ï"
            );

        result =
            result.replace(
                /\\"o/g,
                "ö"
            );

        result =
            result.replace(
                /\\"u/g,
                "ü"
            );


        return result;

    }

}


export default StyleImporter;