/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : useExportEngine.js
 * Description : Gestion des exports du document.
 * Version : 1.0.0
 * Statut : Foundation
 * ===========================================================
 */

export function useExportEngine() {

    /* ======================================================
     * ÉTAT
     * ====================================================== */

    const state = {

        exporting: false,

        format: null,

        progress: 0,

        lastExport: null,

    };

    /* ======================================================
     * EXPORT PDF
     * ====================================================== */

    function exportPDF(options = {}) {

    }

    /* ======================================================
     * EXPORT WORD
     * ====================================================== */

    function exportWord(options = {}) {

    }

    /* ======================================================
     * EXPORT HTML
     * ====================================================== */

    function exportHTML(options = {}) {

    }

    /* ======================================================
     * EXPORT MARKDOWN
     * ====================================================== */

    function exportMarkdown(options = {}) {

    }

    /* ======================================================
     * EXPORT TEXTE
     * ====================================================== */

    function exportTXT(options = {}) {

    }

    /* ======================================================
     * EXPORT JSON
     * ====================================================== */

    function exportJSON(options = {}) {

    }

    /* ======================================================
     * IMPORT
     * ====================================================== */

    function importDocument(file) {

    }

    /* ======================================================
     * OPTIONS
     * ====================================================== */

    function setFileName(name) {

    }

    function setFormat(format) {

    }

    function setCompression(enabled) {

    }

    function setPassword(password) {

    }

    /* ======================================================
     * ÉTAT
     * ====================================================== */

    function cancelExport() {

    }

    function getProgress() {

        return state.progress;

    }

    function reset() {

    }

    /* ======================================================
     * API PUBLIQUE
     * ====================================================== */

    return {

        state,

        exportPDF,

        exportWord,

        exportHTML,

        exportMarkdown,

        exportTXT,

        exportJSON,

        importDocument,

        setFileName,

        setFormat,

        setCompression,

        setPassword,

        cancelExport,

        getProgress,

        reset,

    };

}