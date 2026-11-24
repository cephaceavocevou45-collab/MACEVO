/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : LanguageEngine.js
 * Description : Moteur linguistique central.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

/* ==========================================================
   CONFIGURATION
========================================================== */

const DEFAULT_CONFIGURATION = {

    language: "fr",

    autoDetect: true,

    endpoint: "https://api.languagetool.org/v2/check",

    timeout: 15000,

};

/* ==========================================================
   CLASSE
========================================================== */

class LanguageEngine {

    constructor() {

        this.configuration = {

            ...DEFAULT_CONFIGURATION,

        };

    }

    /* ======================================================
       CONFIGURATION
    ====================================================== */

    configure(options = {}) {

        this.configuration = {

            ...this.configuration,

            ...options,

        };

    }

    getConfiguration() {

        return this.configuration;

    }

    setLanguage(language) {

        this.configuration.language = language;

    }

    getLanguage() {

        return this.configuration.language;

    }

    /* ======================================================
       REQUÊTE
    ====================================================== */

    async request(text) {

        const body = new URLSearchParams({

            text,

            language: this.configuration.language,

        });

        const response = await fetch(

            this.configuration.endpoint,

            {

                method: "POST",

                body,

            }

        );

        if (!response.ok) {

            throw new Error(

                "Impossible de contacter le moteur linguistique."

            );

        }

        return await response.json();

    }

    /* ======================================================
       ORTHOGRAPHE
    ====================================================== */

    async checkSpelling(text) {

        const result = await this.request(text);

        return result.matches.filter(

            (match) =>

                match.rule.issueType === "misspelling"

        );

    }

    /* ======================================================
       GRAMMAIRE
    ====================================================== */

    async checkGrammar(text) {

        const result = await this.request(text);

        return result.matches.filter(

            (match) =>

                match.rule.issueType === "grammar"

        );

    }    /* ======================================================
       DICTIONNAIRE
    ====================================================== */

    async dictionary(word) {

        const result = await this.request(word);

        return result.matches;

    }

    /* ======================================================
       SYNONYMES
    ====================================================== */

    async synonyms(word) {

        const result = await this.request(word);

        const suggestions = [];

        result.matches.forEach((match) => {

            match.replacements.forEach((replacement) => {

                suggestions.push(

                    replacement.value

                );

            });

        });

        return [

            ...new Set(suggestions),

        ];

    }

    /* ======================================================
       TRADUCTION
    ====================================================== */

    async translate(text) {

        throw new Error(

            "Le moteur de traduction sera connecté ultérieurement."

        );

    }

    /* ======================================================
       DÉTECTION DE LANGUE
    ====================================================== */

    detectLanguage(text) {

        const french = [

            " le ",

            " la ",

            " les ",

            " de ",

            " des ",

            " est ",

            " une ",

        ];

        const lower =

            ` ${text.toLowerCase()} `;

        let score = 0;

        french.forEach((word) => {

            if (lower.includes(word)) {

                score++;

            }

        });

        return score >= 2

            ? "fr"

            : "en";

    }

    /* ======================================================
       LISIBILITÉ
    ====================================================== */

    readability(text) {

        const words =

            text.trim().split(/\s+/).length;

        const sentences =

            Math.max(

                1,

                text.split(/[.!?]/).length - 1

            );

        const average =

            words / sentences;

        return {

            words,

            sentences,

            averageSentenceLength: average,

        };

    }    /* ======================================================
       ANALYSE COMPLÈTE
    ====================================================== */

    async analyse(text) {

        const response = await this.request(text);

        return {

            language: this.getLanguage(),

            matches: response.matches,

            readability: this.readability(text),

        };

    }

    /* ======================================================
       CORRECTION D'UNE ERREUR
    ====================================================== */

    applySuggestion(text, match, suggestionIndex = 0) {

        if (!match.replacements.length) {

            return text;

        }

        const suggestion =

            match.replacements[suggestionIndex]?.value;

        if (!suggestion) {

            return text;

        }

        return (

            text.substring(0, match.offset) +

            suggestion +

            text.substring(match.offset + match.length)

        );

    }

    /* ======================================================
       CORRECTION DE TOUTES LES ERREURS
    ====================================================== */

    applyAllSuggestions(text, matches) {

        let result = text;

        let shift = 0;

        matches.forEach((match) => {

            if (!match.replacements.length) {

                return;

            }

            const replacement =

                match.replacements[0].value;

            const start =

                match.offset + shift;

            const end =

                start + match.length;

            result =

                result.substring(0, start) +

                replacement +

                result.substring(end);

            shift +=

                replacement.length -

                match.length;

        });

        return result;

    }

}

/* ==========================================================
   INSTANCE UNIQUE
========================================================== */

const languageEngine = new LanguageEngine();

/* ==========================================================
   EXPORT
========================================================== */

export default languageEngine;