/**
 * ==========================================================
 * MACEVO
 *
 * ---
 * Fichier : LatexEscaper.js
 * Description : Echappement robuste des caractères réservés
 * LaTeX
 * Version : 2.1.0
 * ==========================================================
 */

class LatexEscaper {

    constructor() {

        /*
         * Les caractères sont traités en une seule passe
         * afin d'éviter les doubles échappements.
         */

        this.characters = {

            "\\": "\\textbackslash{}",

            "{": "\\{",

            "}": "\\}",

            "$": "\\$",

            "&": "\\&",

            "%": "\\%",

            "#": "\\#",

            "_": "\\_",

            "^": "\\textasciicircum{}",

            "~": "\\textasciitilde{}",

        };

    }


    /* ======================================================
       ECHAPPEMENT COMPLET
    ====================================================== */

    escape(text = "") {

        if (
            text === null ||
            text === undefined
        ) {
            return "";
        }


        const value =
            String(text);


        if (!value) {
            return "";
        }


        return value.replace(
            /[\\{}$&#_%^~]/g,
            character =>
                this.characters[character]
        );

    }


    /* ======================================================
       ECHAPPEMENT D'UNE LIGNE
    ====================================================== */

    escapeLine(line = "") {

        return this.escape(
            line
        );

    }


    /* ======================================================
       ECHAPPEMENT D'UN TABLEAU
    ====================================================== */

    escapeArray(values = []) {

        if (
            !Array.isArray(values)
        ) {
            return [];
        }


        return values.map(
            value =>
                this.escape(value)
        );

    }


    /* ======================================================
       ECHAPPEMENT D'UN OBJET
    ====================================================== */

    escapeObject(object = {}) {

        if (
            !object ||
            typeof object !== "object" ||
            Array.isArray(object)
        ) {
            return {};
        }


        const escaped = {};


        Object.entries(object)
            .forEach(
                ([key, value]) => {

                    escaped[key] =
                        typeof value === "string"
                            ? this.escape(value)
                            : value;

                }
            );


        return escaped;

    }


    /* ======================================================
       NORMALISATION DES ESPACES
    ====================================================== */

    normalize(text = "") {

        if (
            text === null ||
            text === undefined
        ) {
            return "";
        }


        return String(text)

            .replace(
                /\r\n/g,
                "\n"
            )

            .replace(
                /\r/g,
                "\n"
            )

            .replace(
                /\t/g,
                " "
            )

            /*
             * On ne détruit pas les retours à la ligne.
             */

            .replace(
                /[ ]{2,}/g,
                " "
            )

            .trim();

    }


    /* ======================================================
       NORMALISATION COMPLETE
    ====================================================== */

    sanitize(text = "") {

        return this.escape(
            this.normalize(text)
        );

    }


    /* ======================================================
       VERIFICATION
    ====================================================== */

    hasReservedCharacter(text = "") {

        if (
            text === null ||
            text === undefined
        ) {
            return false;
        }


        return /[\\{}$&#_%^~]/
            .test(
                String(text)
            );

    }


    /* ======================================================
       TEXTE VIDE
    ====================================================== */

    isEmpty(text = "") {

        return (
            text === null ||
            text === undefined ||
            String(text).trim() === ""
        );

    }


    /* ======================================================
       NORMALISATION SANS ECHAPPEMENT
    ====================================================== */

    normalizeLine(text = "") {

        return this.normalize(
            text
        );

    }

}


const latexEscaper =
    new LatexEscaper();


export default latexEscaper;