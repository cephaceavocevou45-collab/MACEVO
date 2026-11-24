/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : ExportEngine.js
 * Description : Moteur principal des exportations.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

import pdfEngine from "./PdfEngine";
import latexEngine from "./LatexEngine";
import docxEngine from "./DocxEngine";

class ExportEngine {

    constructor() {

        this.history = [];

    }

    /* ======================================================
       PDF
    ====================================================== */

    async exportPDF(document) {

        const result = await pdfEngine.export(document);

        this.addHistory("PDF");

        return result;

    }

    /* ======================================================
       LATEX
    ====================================================== */

    async exportLatex(document) {

        const result = await latexEngine.export(document);

        this.addHistory("LATEX");

        return result;

    }

    /* ======================================================
       DOCX
    ====================================================== */

    async exportDocx(document) {

        const result = await docxEngine.export(document);

        this.addHistory("DOCX");

        return result;

    }

    /* ======================================================
       HISTORIQUE
    ====================================================== */

    addHistory(format) {

        this.history.push({

            format,

            date: new Date(),

        });

    }

    getHistory() {

        return this.history;

    }

    clearHistory() {

        this.history = [];

    }

    count() {

        return this.history.length;

    }

}

const exportEngine = new ExportEngine();

export default exportEngine;