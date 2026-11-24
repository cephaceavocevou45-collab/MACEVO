/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : pageLayout.js
 * Description : Calcul de l'apparence de la feuille.
 * Version : 2.0.0
 * Statut : Stable
 * ============================================================
 */

/* ==========================================================
MARGES
========================================================== */

function getMarginsClass(margins) {

    switch (margins) {

        case "narrow":
            return "p-10";

        case "wide":
            return "p-32";

        case "custom":
            return "p-20";

        default:
            return "p-20";

    }

}

/* ==========================================================
ORIENTATION
========================================================== */

function getOrientationClass(orientation) {

    switch (orientation) {

        case "landscape":

            return {

                width: "w-[1123px]",

                height: "min-h-[794px]",

            };

        default:

            return {

                width: "w-[794px]",

                height: "min-h-[1123px]",

            };

    }

}

/* ==========================================================
TAILLE DE PAGE
========================================================== */

function getPageSizeClass(pageSize) {

    switch (pageSize) {

        case "A3":

            return {

                width: "w-[1123px]",

                height: "min-h-[1587px]",

            };

        case "A5":

            return {

                width: "w-[559px]",

                height: "min-h-[794px]",

            };

        default:

            return {

                width: "w-[794px]",

                height: "min-h-[1123px]",

            };

    }

}

/* ==========================================================
COLONNES
========================================================== */

function getColumnsClass(columns) {

    switch (columns) {

        case 2:
            return "columns-2";

        case 3:
            return "columns-3";

        default:
            return "";

    }

}

/* ==========================================================
ARRIÈRE-PLAN
========================================================== */

function getBackgroundClass(background) {

    switch (background) {

        case "gray":
            return "bg-gray-100";

        case "yellow":
            return "bg-yellow-50";

        case "blue":
            return "bg-blue-50";

        default:
            return "bg-white";

    }

}

/* ==========================================================
FILIGRANE
========================================================== */

function getWatermarkClass(watermark) {

    if (!watermark) {

        return "";

    }

    return "macevo-watermark";

}

/* ==========================================================
BORDURES
========================================================== */

function getBordersClass(borders) {

    switch (borders) {

        case "page":
            return "border-4 border-gray-700";

        case "paragraph":
            return "border-2 border-gray-500";

        case "table":
            return "border-2 border-dashed border-gray-500";

        default:
            return "border border-gray-200";

    }

}

/* ==========================================================
NUMÉROS DE LIGNE
========================================================== */

function getLineNumbersClass(lineNumbers) {

    switch (lineNumbers) {

        case "enable":
            return "macevo-line-numbers";

        case "continuous":
            return "macevo-line-numbers";

        default:
            return "";

    }

}

/* ==========================================================
CALCUL GLOBAL
========================================================== */

export function getPageLayout(layout) {

    const page = getPageSizeClass(layout.pageSize);

    const orientation = getOrientationClass(layout.orientation);

    return {

        width:

            layout.orientation === "landscape"

                ? orientation.width

                : page.width,

        height:

            layout.orientation === "landscape"

                ? orientation.height

                : page.height,

        margins: getMarginsClass(layout.margins),

        columns: getColumnsClass(layout.columns),

        background: getBackgroundClass(layout.background),

        watermark: getWatermarkClass(layout.watermark),

        borders: getBordersClass(layout.borders),

        lineNumbers: getLineNumbersClass(layout.lineNumbers),

    };

}