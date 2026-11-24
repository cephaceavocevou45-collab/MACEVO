/**
 * ===========================================================
 * MACEVO Office Suite
 * -----------------------------------------------------------
 * Fichier : PrintEngine.js
 * Description : Gestion de l'impression des documents.
 * Version : 3.0.0
 * Statut : Foundation
 * ===========================================================
 */

export class PrintEngine {

    constructor(editor = null) {

        this.editor = editor;

        this.previewEnabled = false;

        this.settings = {

            paperSize: "A4",

            orientation: "portrait",

            margins: {

                top: 25,

                right: 25,

                bottom: 25,

                left: 25,

            },

            copies: 1,

            color: true,

            duplex: false,

            scale: 100,

        };

    }

    /* ======================================================
     * IMPRESSION
     * ====================================================== */

    print() {

        if (typeof window !== "undefined") {

            window.print();

        }

    }

    printSelection() {

        // Implémentation future

    }

    cancelPrint() {

        // Implémentation future

    }

    /* ======================================================
     * APERÇU
     * ====================================================== */

    openPreview() {

        this.previewEnabled = true;

    }

    closePreview() {

        this.previewEnabled = false;

    }

    isPreviewOpened() {

        return this.previewEnabled;

    }

    /* ======================================================
     * CONFIGURATION
     * ====================================================== */

    setPaperSize(size) {

        this.settings.paperSize = size;

    }

    setOrientation(orientation) {

        this.settings.orientation = orientation;

    }

    setMargins(margins) {

        this.settings.margins = margins;

    }

    setCopies(copies) {

        this.settings.copies = copies;

    }

    setScale(scale) {

        this.settings.scale = scale;

    }

    enableColor(enabled = true) {

        this.settings.color = enabled;

    }

    enableDuplex(enabled = true) {

        this.settings.duplex = enabled;

    }

    getSettings() {

        return {

            ...this.settings,

        };

    }

    resetSettings() {

        this.settings = {

            paperSize: "A4",

            orientation: "portrait",

            margins: {

                top: 25,

                right: 25,

                bottom: 25,

                left: 25,

            },

            copies: 1,

            color: true,

            duplex: false,

            scale: 100,

        };

    }

}