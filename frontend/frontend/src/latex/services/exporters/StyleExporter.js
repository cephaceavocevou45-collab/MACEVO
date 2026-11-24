/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : StyleExporter.js
 * Description : Export des styles CSS vers LaTeX
 * Version : 7.0.0
 * ==========================================================
 */

import latexBuilder from "../utils/LatexBuilder";
import cssStyleParser from "../utils/CssStyleParser";

class StyleExporter {

    constructor(exporter) {

        this.exporter = exporter;

    }

    /* ======================================================
       SPAN
    ====================================================== */

    exportSpan(node) {

        if (!node) {

            return "";

        }

        const styles =

            cssStyleParser.fromElement(node);

        let content =

            this.exporter.exportChildren(node);

        if (!content) {

            return "";

        }

        /*
         * L'ordre est volontaire :
         *
         * 1. taille
         * 2. police
         * 3. couleur
         * 4. arrière-plan
         * 5. graisse
         * 6. style
         * 7. décoration
         */

        content = this.applyFontSize(

            styles,

            content

        );

        content = this.applyFontFamily(

            styles,

            content

        );

        content = this.applyColor(

            styles,

            content

        );

        content = this.applyBackground(

            styles,

            content

        );

        content = this.applyFontWeight(

            styles,

            content

        );

        content = this.applyFontStyle(

            styles,

            content

        );

        content = this.applyDecoration(

            styles,

            content

        );

        return content;

    }

    /* ======================================================
       HIGHLIGHT
    ====================================================== */

    exportHighlight(node) {

        if (!node) {

            return "";

        }

        const styles =

            cssStyleParser.fromElement(node);

        const color =

            cssStyleParser.getBackground(

                styles

            ) || "yellow";

        const content =

            this.exporter.exportChildren(node);

        if (!content) {

            return "";

        }

        return latexBuilder.highlight(

            this.normalizeColor(color),

            content

        );

    }

    /* ======================================================
       COULEUR
    ====================================================== */

    applyColor(

        styles,

        content

    ) {

        const color =

            cssStyleParser.getColor(

                styles

            );

        if (!color) {

            return content;

        }

        return latexBuilder.color(

            this.normalizeColor(color),

            content

        );

    }

    /* ======================================================
       ARRIÈRE-PLAN
    ====================================================== */

    applyBackground(

        styles,

        content

    ) {

        const background =

            cssStyleParser.getBackground(

                styles

            );

        if (!background) {

            return content;

        }

        return latexBuilder.highlight(

            this.normalizeColor(background),

            content

        );

    }

    /* ======================================================
       TAILLE DE POLICE
    ====================================================== */

    applyFontSize(

        styles,

        content

    ) {

        const size =

            cssStyleParser.getFontSize(

                styles

            );

        if (!size) {

            return content;

        }

        const parsed =

            this.parseFontSize(size);

        if (!parsed) {

            return content;

        }

        return latexBuilder.fontSize(

            parsed.size,

            parsed.baseline,

            content

        );

    }

    /* ======================================================
       POLICE
    ====================================================== */

    applyFontFamily(

        styles,

        content

    ) {

        const family =

            cssStyleParser.getFontFamily(

                styles

            );

        if (!family) {

            return content;

        }

        const normalized =

            this.normalizeFontFamily(

                family

            );

        if (!normalized) {

            return content;

        }

        return latexBuilder.fontFamily(

            normalized,

            content

        );

    }

    /* ======================================================
       GRAS
    ====================================================== */

    applyFontWeight(

        styles,

        content

    ) {

        const weight =

            cssStyleParser.getFontWeight(

                styles

            );

        if (!weight) {

            return content;

        }

        const normalized =

            String(weight)

                .trim()

                .toLowerCase();

        const isBold =

            normalized === "bold" ||

            normalized === "700" ||

            normalized === "800" ||

            normalized === "900";

        if (!isBold) {

            return content;

        }

        return latexBuilder.command(

            "textbf",

            content

        );

    }

    /* ======================================================
       ITALIQUE
    ====================================================== */

    applyFontStyle(

        styles,

        content

    ) {

        const style =

            cssStyleParser.getFontStyle(

                styles

            );

        if (!style) {

            return content;

        }

        const normalized =

            String(style)

                .trim()

                .toLowerCase();

        if (

            normalized !== "italic" &&

            normalized !== "oblique"

        ) {

            return content;

        }

        return latexBuilder.command(

            "textit",

            content

        );

    }

    /* ======================================================
       DÉCORATION
    ====================================================== */

    applyDecoration(

        styles,

        content

    ) {

        const decoration =

            cssStyleParser.getTextDecoration(

                styles

            );

        if (!decoration) {

            return content;

        }

        const normalized =

            String(decoration)

                .trim()

                .toLowerCase();

        /*
         * Soulignement
         */

        if (

            normalized.includes(

                "underline"

            )

        ) {

            content =

                latexBuilder.command(

                    "underline",

                    content

                );

        }

        /*
         * Barré
         */

        if (

            normalized.includes(

                "line-through"

            )

        ) {

            content =

                latexBuilder.command(

                    "sout",

                    content

                );

        }

        return content;

    }

    /* ======================================================
       PARSING TAILLE
    ====================================================== */

    parseFontSize(value) {

        if (!value) {

            return null;

        }

        const normalized =

            String(value)

                .trim()

                .toLowerCase();

        /*
         * px
         */

        if (

            normalized.endsWith("px")

        ) {

            const px =

                parseFloat(

                    normalized

                );

            if (Number.isNaN(px)) {

                return null;

            }

            /*
             * Conversion approximative :
             *
             * 1px ≈ 0.75pt
             */

            const pt =

                px * 0.75;

            return {

                size:

                    this.formatNumber(pt) +

                    "pt",

                baseline:

                    this.formatNumber(

                        pt * 1.2

                    ) +

                    "pt",

            };

        }

        /*
         * pt
         */

        if (

            normalized.endsWith("pt")

        ) {

            const pt =

                parseFloat(

                    normalized

                );

            if (Number.isNaN(pt)) {

                return null;

            }

            return {

                size:

                    this.formatNumber(pt) +

                    "pt",

                baseline:

                    this.formatNumber(

                        pt * 1.2

                    ) +

                    "pt",

            };

        }

        /*
         * rem
         */

        if (

            normalized.endsWith("rem")

        ) {

            const rem =

                parseFloat(

                    normalized

                );

            if (Number.isNaN(rem)) {

                return null;

            }

            const pt =

                rem * 12;

            return {

                size:

                    this.formatNumber(pt) +

                    "pt",

                baseline:

                    this.formatNumber(

                        pt * 1.2

                    ) +

                    "pt",

            };

        }

        /*
         * em
         */

        if (

            normalized.endsWith("em")

        ) {

            const em =

                parseFloat(

                    normalized

                );

            if (Number.isNaN(em)) {

                return null;

            }

            const pt =

                em * 12;

            return {

                size:

                    this.formatNumber(pt) +

                    "pt",

                baseline:

                    this.formatNumber(

                        pt * 1.2

                    ) +

                    "pt",

            };

        }

        /*
         * Nombre brut
         */

        const number =

            parseFloat(

                normalized

            );

        if (Number.isNaN(number)) {

            return null;

        }

        return {

            size:

                this.formatNumber(number) +

                "pt",

            baseline:

                this.formatNumber(

                    number * 1.2

                ) +

                "pt",

        };

    }

    /* ======================================================
       POLICE
    ====================================================== */

    normalizeFontFamily(

        family

    ) {

        if (!family) {

            return "";

        }

        const value =

            String(family)

                .split(",")

                [0]

                .trim()

                .replace(

                    /^['"]|['"]$/g,

                    ""

                )

                .toLowerCase();

        /*
         * Correspondances LaTeX classiques.
         */

        const mappings = {

            serif: "ptm",

            "times new roman": "ptm",

            times: "ptm",

            sans: "phv",

            "sans-serif": "phv",

            arial: "phv",

            helvetica: "phv",

            monospace: "pcr",

            "courier new": "pcr",

            courier: "pcr",

        };

        return (

            mappings[value] ||

            value

        );

    }

    /* ======================================================
       COULEUR
    ====================================================== */

    normalizeColor(

        color

    ) {

        if (!color) {

            return "";

        }

        return String(color)

            .trim();

    }

    /* ======================================================
       FORMAT NOMBRE
    ====================================================== */

    formatNumber(value) {

        if (

            typeof value !==

            "number"

        ) {

            return value;

        }

        return Number(

            value.toFixed(2)

        ).toString();

    }

}

export default StyleExporter;