/**
 * ==========================================================
 * MACEVO
 *
 * ---
 * Fichier : ImageExporter.js
 * Description : Export des images HTML vers LaTeX
 * Version : 3.1.0
 * ==========================================================
 */

import latexBuilder from "../utils/LatexBuilder";

class ImageExporter {

    constructor(exporter) {

        this.exporter = exporter;

    }


    /* ======================================================
       EXPORT IMAGE
    ====================================================== */

    export(node) {

        if (!node) {
            return "";
        }


        const src =
            node.getAttribute("src");


        if (
            !src ||
            !src.trim()
        ) {
            return "";
        }


        const dimensions =
            this.getDimensions(node);


        const options =
            this.buildOptions(
                dimensions
            );


        const image =
            this.buildImage(
                src,
                options
            );


        /*
         * IMPORTANT :
         *
         * Le <figure> est maintenant géré
         * exclusivement par BlockExporter.
         *
         * Une image située dans une figure
         * retourne donc simplement son
         * \includegraphics.
         */

        return latexBuilder.concat(
            image,
            "\n"
        );

    }


    /* ======================================================
       CONSTRUIRE IMAGE
    ====================================================== */

    buildImage(
        source,
        options = ""
    ) {

        return latexBuilder.commandWithOptions(
            "includegraphics",
            options,
            this.escapePath(source)
        );

    }


    /* ======================================================
       DIMENSIONS
    ====================================================== */

    getDimensions(node) {

        if (!node) {

            return {
                width: null,
                height: null,
            };

        }


        let width =
            node.getAttribute(
                "width"
            );

        let height =
            node.getAttribute(
                "height"
            );


        /*
         * Fallback vers le style inline.
         */

        if (
            !width ||
            !height
        ) {

            const style =
                node.getAttribute(
                    "style"
                ) || "";


            const parsed =
                this.parseStyleDimensions(
                    style
                );


            if (!width) {
                width = parsed.width;
            }


            if (!height) {
                height = parsed.height;
            }

        }


        return {
            width,
            height,
        };

    }


    /* ======================================================
       STYLE DIMENSIONS
    ====================================================== */

    parseStyleDimensions(
        style = ""
    ) {

        const result = {
            width: null,
            height: null,
        };


        if (!style) {
            return result;
        }


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
                        .trim()
                        .toLowerCase();


                const value =
                    rule
                        .substring(
                            separator + 1
                        )
                        .trim();


                if (
                    property === "width"
                ) {
                    result.width = value;
                }


                if (
                    property === "height"
                ) {
                    result.height = value;
                }

            });


        return result;

    }


    /* ======================================================
       OPTIONS LATEX
    ====================================================== */

    buildOptions({
        width = null,
        height = null,
    } = {}) {

        const options = [];


        if (width) {

            const latexWidth =
                this.convertDimension(
                    width
                );


            if (latexWidth) {

                options.push(
                    `width=${latexWidth}`
                );

            }

        }


        if (height) {

            const latexHeight =
                this.convertDimension(
                    height
                );


            if (latexHeight) {

                options.push(
                    `height=${latexHeight}`
                );

            }

        }


        return options.join(",");

    }


    /* ======================================================
       DIMENSION CSS / HTML
    ====================================================== */

    convertDimension(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return null;
        }


        const normalized =
            String(value)
                .trim()
                .toLowerCase();


        if (!normalized) {
            return null;
        }


        /* ----------------------------------------------
           POURCENTAGE
        ---------------------------------------------- */

        if (
            normalized.endsWith("%")
        ) {

            const number =
                parseFloat(
                    normalized
                );


            if (
                Number.isNaN(number) ||
                number <= 0
            ) {
                return null;
            }


            return (
                `${number / 100}\\linewidth`
            );

        }


        /* ----------------------------------------------
           PIXELS
        ---------------------------------------------- */

        if (
            normalized.endsWith("px")
        ) {

            const number =
                parseFloat(
                    normalized
                );


            if (
                Number.isNaN(number) ||
                number <= 0
            ) {
                return null;
            }


            const pt =
                number * 0.75;


            return (
                `${this.formatNumber(pt)}pt`
            );

        }


        /* ----------------------------------------------
           UNITÉS LATEX
        ---------------------------------------------- */

        if (
            /^(?:\d+(?:\.\d+)?|\.\d+)(pt|pc|in|cm|mm|em|ex|bp|dd|cc|sp|mu)$/
                .test(normalized)
        ) {

            return normalized;

        }


        /* ----------------------------------------------
           NOMBRE SIMPLE
        ---------------------------------------------- */

        if (
            /^\d+(?:\.\d+)?$/
                .test(normalized)
        ) {

            const number =
                parseFloat(
                    normalized
                );


            if (
                Number.isNaN(number) ||
                number <= 0
            ) {
                return null;
            }


            const pt =
                number * 0.75;


            return (
                `${this.formatNumber(pt)}pt`
            );

        }


        return null;

    }


    /* ======================================================
       FORMAT NOMBRE
    ====================================================== */

    formatNumber(value) {

        if (
            typeof value !== "number"
        ) {
            return value;
        }

        return Number(
            value.toFixed(2)
        ).toString();

    }


    /* ======================================================
       CHEMIN
    ====================================================== */

    escapePath(path) {

        if (
            path === null ||
            path === undefined
        ) {
            return "";
        }


        return String(path)

            .replace(
                /\\/g,
                "/"
            )

            .replace(
                /([%#{}])/g,
                "\\$1"
            );

    }


    /* ======================================================
       TEXTE
    ====================================================== */

    escapeText(text) {

        if (
            text === null ||
            text === undefined
        ) {
            return "";
        }


        if (
            !this.exporter ||
            !this.exporter.escaper
        ) {
            return String(text);
        }


        return this.exporter.escaper.escape(
            String(text)
        );

    }

}


export default ImageExporter;