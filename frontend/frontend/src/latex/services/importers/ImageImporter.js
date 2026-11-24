/**
 * ==========================================================
 * MACEVO
 *
 * Fichier : ImageImporter.js
 * Description : Import des images LaTeX -> HTML
 * ==========================================================
 */

class ImageImporter {

    convert(source = "") {

        let result =
            String(source ?? "");


        /*
         * includegraphics
         */

        result =
            result.replace(
                /\\includegraphics(?:\[[^\]]*\])?\{([^{}]*)\}/g,
                '<img src="$1" alt="" />'
            );


        /*
         * Figure
         */

        result =
            result.replace(
                /\\begin\{figure\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{figure\}/g,
                (_, content) =>
                    `<figure>${content}</figure>`
            );


        /*
         * Caption
         */

        result =
            result.replace(
                /\\caption\{([\s\S]*?)\}/g,
                "<figcaption>$1</figcaption>"
            );


        return result;

    }

}


export default ImageImporter;