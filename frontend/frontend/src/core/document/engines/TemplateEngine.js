/**
 * ===========================================================
 * MACEVO Office Suite
 * -----------------------------------------------------------
 * Fichier : TemplateEngine.js
 * Description : Gestion des modèles de documents.
 * Version : 3.0.0
 * Statut : Foundation
 * ===========================================================
 */

export class TemplateEngine {

    constructor(editor = null) {

        this.editor = editor;

        this.templates = [];

        this.currentTemplate = null;

    }

    /* ======================================================
     * MODÈLES
     * ======================================================
     */

    addTemplate(template) {

        if (!template) {

            return false;

        }

        this.templates.push(template);

        return true;

    }

    updateTemplate(index, template) {

        if (
            index < 0 ||
            index >= this.templates.length
        ) {

            return false;

        }

        this.templates[index] = template;

        return true;

    }

    removeTemplate(index) {

        if (
            index < 0 ||
            index >= this.templates.length
        ) {

            return false;

        }

        this.templates.splice(index, 1);

        return true;

    }

    clearTemplates() {

        this.templates = [];

    }

    /* ======================================================
     * APPLICATION
     * ======================================================
     */

    applyTemplate(index) {

        if (
            index < 0 ||
            index >= this.templates.length
        ) {

            return false;

        }

        this.currentTemplate = this.templates[index];

        if (this.editor) {

            // Application au document
            // Implémentation future

        }

        return true;

    }

    getCurrentTemplate() {

        return this.currentTemplate;

    }

    /* ======================================================
     * RECHERCHE
     * ======================================================
     */

    getTemplate(index) {

        return this.templates[index] ?? null;

    }

    getTemplates() {

        return [...this.templates];

    }

    findByName(name) {

        return this.templates.find(
            template => template.name === name
        );

    }

    count() {

        return this.templates.length;

    }

    /* ======================================================
     * IMPORT / EXPORT
     * ======================================================
     */

    exportJSON() {

        return JSON.stringify(this.templates);

    }

    importJSON(json) {

        try {

            this.templates = JSON.parse(json);

            return true;

        }

        catch {

            return false;

        }

    }

    /* ======================================================
     * RÉINITIALISATION
     * ======================================================
     */

    reset() {

        this.currentTemplate = null;

    }

}