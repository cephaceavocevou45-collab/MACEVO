/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : CompareEngine.js
 * Description : Comparaison de deux documents.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

class CompareEngine {

    constructor() {

        this.originalDocument = "";

        this.revisedDocument = "";

        this.differences = [];

    }

    /* ======================================================
       DOCUMENTS
    ====================================================== */

    setOriginal(document) {

        this.originalDocument = document;

    }

    setRevised(document) {

        this.revisedDocument = document;

    }

    getOriginal() {

        return this.originalDocument;

    }

    getRevised() {

        return this.revisedDocument;

    }

    /* ======================================================
       COMPARAISON
    ====================================================== */

    compare() {

        this.differences = [];

        const originalLines =

            this.originalDocument.split("\n");

        const revisedLines =

            this.revisedDocument.split("\n");

        const max = Math.max(

            originalLines.length,

            revisedLines.length

        );

        for (let i = 0; i < max; i++) {

            const original =

                originalLines[i] ?? "";

            const revised =

                revisedLines[i] ?? "";

            if (original !== revised) {

                this.differences.push({

                    line: i + 1,

                    original,

                    revised,

                });

            }

        }

        return this.differences;

    }

    /* ======================================================
       RESULTATS
    ====================================================== */

    getDifferences() {

        return this.differences;

    }

    hasDifferences() {

        return this.differences.length > 0;

    }

    count() {

        return this.differences.length;

    }

    /* ======================================================
       EXPORT
    ====================================================== */

    export() {

        return JSON.stringify(

            this.differences,

            null,

            2

        );

    }

    /* ======================================================
       RESET
    ====================================================== */

    reset() {

        this.originalDocument = "";

        this.revisedDocument = "";

        this.differences = [];

    }

}

const compareEngine = new CompareEngine();

export default compareEngine;