/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : SpellingEngine.js
 * Description : Moteur d'orthographe.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

import SpellingGroup from "../../../../pages/Reports/Editor/Ribbon/groups/SpellingGroup";

import languageEngine from "./LanguageEngine";
/* ==========================================================
   CLASSE
========================================================== */

class SpellingEngine {

    constructor() {

        this.errors = [];

        this.lastText = "";

    }

    /* ======================================================
       ANALYSE
    ====================================================== */

    async check(text) {

        this.lastText = text;

        this.errors = await languageEngine.checkSpelling(text);

        return this.errors;

    }

    /* ======================================================
       RÉCUPÉRATION
    ====================================================== */

    getErrors() {

        return this.errors;

    }

    hasErrors() {

        return this.errors.length > 0;

    }

    count() {

        return this.errors.length;

    }

    /* ======================================================
       SUGGESTIONS
    ====================================================== */

    getSuggestions(index) {

        if (!this.errors[index]) {

            return [];

        }

        return this.errors[index].replacements;

    }

    /* ======================================================
       CORRECTION
    ====================================================== */

    applySuggestion(index, suggestion = 0) {

        if (!this.errors[index]) {

            return this.lastText;

        }

        return languageEngine.applySuggestion(

            this.lastText,

            this.errors[index],

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
       RÉINITIALISATION
    ====================================================== */

    reset() {

        this.errors = [];

        this.lastText = "";

    }

}

/* ==========================================================
   INSTANCE UNIQUE
========================================================== */

const spellingEngine = new SpellingEngine();

/* ==========================================================
   EXPORT
========================================================== */

export default spellingEngine;