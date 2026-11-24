/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : TranslateEngine.js
 * Description : Moteur de traduction.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

import languageEngine from "./LanguageEngine";

/* ==========================================================
   CLASSE
========================================================== */

class TranslateEngine {

    constructor() {

        this.sourceLanguage = "fr";

        this.targetLanguage = "en";

        this.lastSourceText = "";

        this.lastTranslation = "";

    }

    /* ======================================================
       LANGUES
    ====================================================== */

    setSourceLanguage(language) {

        this.sourceLanguage = language;

    }

    getSourceLanguage() {

        return this.sourceLanguage;

    }

    setTargetLanguage(language) {

        this.targetLanguage = language;

    }

    getTargetLanguage() {

        return this.targetLanguage;

    }

    swapLanguages() {

        const temp = this.sourceLanguage;

        this.sourceLanguage = this.targetLanguage;

        this.targetLanguage = temp;

    }

    /* ======================================================
       TRADUCTION
    ====================================================== */

    async translate(text) {

        this.lastSourceText = text;

        this.lastTranslation = await languageEngine.translate({

            text,

            source: this.sourceLanguage,

            target: this.targetLanguage,

        });

        return this.lastTranslation;

    }

    /* ======================================================
       RÉSULTATS
    ====================================================== */

    getSourceText() {

        return this.lastSourceText;

    }

    getTranslation() {

        return this.lastTranslation;

    }

    hasTranslation() {

        return this.lastTranslation !== "";

    }

    /* ======================================================
       HISTORIQUE
    ====================================================== */

    clear() {

        this.lastSourceText = "";

        this.lastTranslation = "";

    }

    /* ======================================================
       CONFIGURATION
    ====================================================== */

    configure(options = {}) {

        if (options.sourceLanguage) {

            this.sourceLanguage = options.sourceLanguage;

        }

        if (options.targetLanguage) {

            this.targetLanguage = options.targetLanguage;

        }

    }

    getConfiguration() {

        return {

            sourceLanguage: this.sourceLanguage,

            targetLanguage: this.targetLanguage,

        };

    }

}

/* ==========================================================
   INSTANCE UNIQUE
========================================================== */

const translateEngine = new TranslateEngine();

/* ==========================================================
   EXPORT
========================================================== */

export default translateEngine;