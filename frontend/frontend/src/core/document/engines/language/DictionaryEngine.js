/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : DictionaryEngine.js
 * Description : Moteur du dictionnaire.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

import languageEngine from "./LanguageEngine";

/* ==========================================================
   CLASSE
========================================================== */

class DictionaryEngine {

    constructor() {

        this.word = "";

        this.definition = "";

        this.synonyms = [];

        this.antonyms = [];

        this.examples = [];

    }

    /* ======================================================
       RECHERCHE
    ====================================================== */

    async search(word) {

        this.word = word.trim();

        const result = await languageEngine.dictionary(this.word);

        this.definition = result;

        return result;

    }

    /* ======================================================
       MOT COURANT
    ====================================================== */

    getWord() {

        return this.word;

    }

    /* ======================================================
       DEFINITION
    ====================================================== */

    getDefinition() {

        return this.definition;

    }

    /* ======================================================
       SYNONYMES
    ====================================================== */

    async loadSynonyms(word = this.word) {

        this.synonyms =

            await languageEngine.synonyms(word);

        return this.synonyms;

    }

    getSynonyms() {

        return this.synonyms;

    }

    /* ======================================================
       ANTONYMES
    ====================================================== */

    async loadAntonyms() {

        this.antonyms = [];

        return this.antonyms;

    }

    getAntonyms() {

        return this.antonyms;

    }

    /* ======================================================
       EXEMPLES
    ====================================================== */

    async loadExamples() {

        this.examples = [];

        return this.examples;

    }

    getExamples() {

        return this.examples;

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

        this.word = "";

        this.definition = "";

        this.synonyms = [];

        this.antonyms = [];

        this.examples = [];

    }

}

/* ==========================================================
   INSTANCE UNIQUE
========================================================== */

const dictionaryEngine = new DictionaryEngine();

/* ==========================================================
   EXPORT
========================================================== */

export default dictionaryEngine;