/**
 * ===========================================================
 * MACEVO Office Suite
 * -----------------------------------------------------------
 * Fichier : BibliographyEngine.js
 * Description : Gestion des références bibliographiques.
 * Version : 3.0.0
 * Statut : Foundation
 * ===========================================================
 */

export class BibliographyEngine {

    constructor(editor = null) {

        this.editor = editor;

        this.references = [];

        this.style = "APA";

    }

    /* ======================================================
     * REFERENCES
     * ====================================================== */

    addReference(reference) {

        this.references.push(reference);

        return reference;

    }

    updateReference(index, reference) {

        if (index < 0 || index >= this.references.length) {

            return false;

        }

        this.references[index] = reference;

        return true;

    }

    removeReference(index) {

        if (index < 0 || index >= this.references.length) {

            return false;

        }

        this.references.splice(index, 1);

        return true;

    }

    clearReferences() {

        this.references = [];

    }

    getReferences() {

        return [...this.references];

    }

    /* ======================================================
     * CITATIONS
     * ====================================================== */

    insertCitation(reference) {

        if (!this.editor) return false;

        // Implémentation à venir

        return true;

    }

    insertBibliography() {

        if (!this.editor) return false;

        // Implémentation à venir

        return true;

    }

    /* ======================================================
     * STYLE
     * ====================================================== */

    setStyle(style) {

        this.style = style;

    }

    getStyle() {

        return this.style;

    }

    /* ======================================================
     * IMPORT / EXPORT
     * ====================================================== */

    exportReferences() {

        return JSON.stringify(this.references);

    }

    importReferences(json) {

        try {

            this.references = JSON.parse(json);

            return true;

        }

        catch {

            return false;

        }

    }

}