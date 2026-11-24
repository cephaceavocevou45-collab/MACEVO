/**
 * ===========================================================
 * MACEVO Office Suite
 * -----------------------------------------------------------
 * Fichier : EquationEngine.js
 * Description : Gestion des équations mathématiques.
 * Version : 3.0.0
 * Statut : Foundation
 * ===========================================================
 */

export class EquationEngine {

    constructor(editor = null) {

        this.editor = editor;

        this.equations = [];

    }

    /* ======================================================
     * ÉQUATIONS
     * ====================================================== */

    insertEquation(latex) {

        if (!latex) {

            return false;

        }

        this.equations.push(latex);

        if (this.editor) {

            // Intégration Tiptap à venir

        }

        return true;

    }

    updateEquation(index, latex) {

        if (
            index < 0 ||
            index >= this.equations.length
        ) {

            return false;

        }

        this.equations[index] = latex;

        return true;

    }

    removeEquation(index) {

        if (
            index < 0 ||
            index >= this.equations.length
        ) {

            return false;

        }

        this.equations.splice(index, 1);

        return true;

    }

    clearEquations() {

        this.equations = [];

    }

    /* ======================================================
     * RÉCUPÉRATION
     * ====================================================== */

    getEquation(index) {

        return this.equations[index] ?? null;

    }

    getEquations() {

        return [...this.equations];

    }

    count() {

        return this.equations.length;

    }

    /* ======================================================
     * IMPORT / EXPORT
     * ====================================================== */

    exportJSON() {

        return JSON.stringify(this.equations);

    }

    importJSON(json) {

        try {

            this.equations = JSON.parse(json);

            return true;

        }

        catch {

            return false;

        }

    }

    /* ======================================================
     * LATEX
     * ====================================================== */

    exportLatex() {

        return this.equations.join("\n\n");

    }

    importLatex(content) {

        if (!content) {

            return false;

        }

        this.equations = content
            .split("\n\n")
            .filter(Boolean);

        return true;

    }

}