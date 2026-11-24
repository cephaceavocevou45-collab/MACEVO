/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : GrammarEngine.js
 * Description : Moteur de grammaire.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

import languageEngine from "./LanguageEngine";

/* ==========================================================
   CLASSE
========================================================== */

class GrammarEngine {

    constructor() {

        this.errors = [];

        this.lastText = "";

    }

    /* ======================================================
       ANALYSE
    ====================================================== */

    async check(text) {

        this.lastText = text;

        this.errors = await languageEngine.checkGrammar(text);

        return this.errors;

    }

    /* ======================================================
       RÉSULTATS
    ====================================================== */

    getErrors() {

        return this.errors;

    }

    count() {

        return this.errors.length;

    }

    hasErrors() {

        return this.errors.length > 0;

    }

    /* ======================================================
       ERREUR
    ====================================================== */

    getError(index) {

        return this.errors[index] ?? null;

    }

    /* ======================================================
       SUGGESTIONS
    ====================================================== */

    getSuggestions(index) {

        const error = this.getError(index);

        if (!error) {

            return [];

        }

        return error.replacements;

    }

    /* ======================================================
       CORRECTION
    ====================================================== */

    applySuggestion(index, suggestion = 0) {

        const error = this.getError(index);

        if (!error) {

            return this.lastText;

        }

        return languageEngine.applySuggestion(

            this.lastText,

            error,

            suggestion

        );

    }

    applyAll() {

        return languageEngine.applyAllSuggestions(

            this.lastText,

            this.errors

        );

    }

    /* ======================================================
       LANGUE
    ====================================================== */

    setLanguage(language) {

        languageEngine.setLanguage(language);

    }

    getLanguage() {

        return languageEngine.getLanguage();

    }

    /* ======================================================
       RESET
    ====================================================== */

    reset() {

        this.errors = [];

        this.lastText = "";

    }

}

/* ==========================================================
   INSTANCE UNIQUE
========================================================== */

const grammarEngine = new GrammarEngine();

/* ==========================================================
   EXPORT
========================================================== */

export default grammarEngine;