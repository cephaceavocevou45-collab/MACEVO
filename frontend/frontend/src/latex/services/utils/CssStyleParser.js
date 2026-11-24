/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : CssStyleParser.js
 * Description : Analyseur des styles CSS inline
 * Version : 2.0.0
 * ==========================================================
 */

class CssStyleParser {

    /* ======================================================
       PARSER CSS
    ====================================================== */

    parse(style = "") {

        if (

            typeof style !== "string" ||

            !style.trim()

        ) {

            return {};

        }

        const properties = {};

        style

            .split(";")

            .forEach(rule => {

                const separator =

                    rule.indexOf(":");

                if (separator === -1) {

                    return;

                }

                const property =

                    rule

                        .substring(

                            0,

                            separator

                        )

                        .trim();

                const value =

                    rule

                        .substring(

                            separator + 1

                        )

                        .trim();

                if (

                    !property ||

                    !value

                ) {

                    return;

                }

                properties[

                    this.camelCase(

                        property

                    )

                ] = value;

            });

        return properties;

    }

    /* ======================================================
       PARSER DEPUIS UN ELEMENT HTML
    ====================================================== */

    fromElement(element) {

        if (!element) {

            return {};

        }

        /*
         * HTMLElement
         */

        if (

            typeof element.getAttribute ===

            "function"

        ) {

            return this.parse(

                element.getAttribute(

                    "style"

                ) ?? ""

            );

        }

        /*
         * Objet contenant directement style
         */

        if (

            typeof element.style ===

            "string"

        ) {

            return this.parse(

                element.style

            );

        }

        return {};

    }

    /* ======================================================
       CAMEL CASE
    ====================================================== */

    camelCase(property = "") {

        return String(property)

            .trim()

            .toLowerCase()

            .replace(

                /-([a-z])/g,

                (_, letter) =>

                    letter.toUpperCase()

            );

    }

    /* ======================================================
       ACCÈS GÉNÉRIQUE
    ====================================================== */

    get(

        styles,

        property,

        defaultValue = null

    ) {

        if (!styles) {

            return defaultValue;

        }

        return (

            styles[property] ??

            defaultValue

        );

    }

    /* ======================================================
       EXISTENCE
    ====================================================== */

    has(

        styles,

        property

    ) {

        if (!styles) {

            return false;

        }

        return Object.prototype

            .hasOwnProperty

            .call(

                styles,

                property

            );

    }

    /* ======================================================
       COULEUR
    ====================================================== */

    getColor(styles) {

        return this.get(

            styles,

            "color"

        );

    }

    /* ======================================================
       ARRIÈRE-PLAN
    ====================================================== */

    getBackground(styles) {

        return (

            this.get(

                styles,

                "backgroundColor"

            )

            ??

            this.get(

                styles,

                "background"

            )

        );

    }

    /* ======================================================
       TAILLE
    ====================================================== */

    getFontSize(styles) {

        return this.get(

            styles,

            "fontSize"

        );

    }

    /* ======================================================
       POLICE
    ====================================================== */

    getFontFamily(styles) {

        return this.get(

            styles,

            "fontFamily"

        );

    }

    /* ======================================================
       ALIGNEMENT
    ====================================================== */

    getTextAlign(styles) {

        return this.get(

            styles,

            "textAlign"

        );

    }

    /* ======================================================
       GRAS
    ====================================================== */

    getFontWeight(styles) {

        return this.get(

            styles,

            "fontWeight"

        );

    }

    /* ======================================================
       ITALIQUE
    ====================================================== */

    getFontStyle(styles) {

        return this.get(

            styles,

            "fontStyle"

        );

    }

    /* ======================================================
       DÉCORATION
    ====================================================== */

    getTextDecoration(styles) {

        return this.get(

            styles,

            "textDecoration"

        );

    }

    /* ======================================================
       OPACITÉ
    ====================================================== */

    getOpacity(styles) {

        return this.get(

            styles,

            "opacity"

        );

    }

    /* ======================================================
       ESPACEMENT DES LETTRES
    ====================================================== */

    getLetterSpacing(styles) {

        return this.get(

            styles,

            "letterSpacing"

        );

    }

    /* ======================================================
       ESPACEMENT DES MOTS
    ====================================================== */

    getWordSpacing(styles) {

        return this.get(

            styles,

            "wordSpacing"

        );

    }

    /* ======================================================
       HAUTEUR DE LIGNE
    ====================================================== */

    getLineHeight(styles) {

        return this.get(

            styles,

            "lineHeight"

        );

    }

    /* ======================================================
       TRANSFORMATION DU TEXTE
    ====================================================== */

    getTextTransform(styles) {

        return this.get(

            styles,

            "textTransform"

        );

    }

    /* ======================================================
       STYLE COMPLET
    ====================================================== */

    getTextStyles(styles) {

        if (!styles) {

            return {};

        }

        return {

            color:

                this.getColor(

                    styles

                ),

            background:

                this.getBackground(

                    styles

                ),

            fontSize:

                this.getFontSize(

                    styles

                ),

            fontFamily:

                this.getFontFamily(

                    styles

                ),

            fontWeight:

                this.getFontWeight(

                    styles

                ),

            fontStyle:

                this.getFontStyle(

                    styles

                ),

            textDecoration:

                this.getTextDecoration(

                    styles

                ),

            textAlign:

                this.getTextAlign(

                    styles

                ),

            opacity:

                this.getOpacity(

                    styles

                ),

            letterSpacing:

                this.getLetterSpacing(

                    styles

                ),

            wordSpacing:

                this.getWordSpacing(

                    styles

                ),

            lineHeight:

                this.getLineHeight(

                    styles

                ),

            textTransform:

                this.getTextTransform(

                    styles

                ),

        };

    }

}

const cssStyleParser =

    new CssStyleParser();

export default cssStyleParser;