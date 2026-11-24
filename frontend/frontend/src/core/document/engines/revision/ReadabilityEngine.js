/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : ReadabilityEngine.js
 * Description : Analyse de la lisibilité du document.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

class ReadabilityEngine {

    constructor() {

        this.text = "";

        this.analysis = {};

    }

    /* ======================================================
       ANALYSE
    ====================================================== */

    analyse(text) {

        this.text = text;

        const words = this.countWords(text);

        const sentences = this.countSentences(text);

        const paragraphs = this.countParagraphs(text);

        const characters = this.countCharacters(text);

        const averageWordsPerSentence =
            sentences === 0 ? 0 : words / sentences;

        const averageCharactersPerWord =
            words === 0 ? 0 : characters / words;

        this.analysis = {

            words,

            sentences,

            paragraphs,

            characters,

            averageWordsPerSentence,

            averageCharactersPerWord,

            readabilityScore: this.computeScore(

                averageWordsPerSentence,

                averageCharactersPerWord

            ),

        };

        return this.analysis;

    }

    /* ======================================================
       CALCULS
    ====================================================== */

    countWords(text) {

        return text
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;

    }

    countSentences(text) {

        const result = text.match(/[.!?]+/g);

        return result ? result.length : 0;

    }

    countParagraphs(text) {

        return text
            .split(/\n\s*\n/)
            .filter(Boolean).length;

    }

    countCharacters(text) {

        return text.replace(/\s/g, "").length;

    }

    computeScore(wordsSentence, charsWord) {

        let score = 100;

        score -= wordsSentence * 2;

        score -= charsWord * 3;

        if (score < 0) score = 0;

        if (score > 100) score = 100;

        return Math.round(score);

    }

    /* ======================================================
       RESULTATS
    ====================================================== */

    getAnalysis() {

        return this.analysis;

    }

    getScore() {

        return this.analysis.readabilityScore ?? 0;

    }

    /* ======================================================
       NIVEAU
    ====================================================== */

    getLevel() {

        const score = this.getScore();

        if (score >= 90) {

            return "Très facile";

        }

        if (score >= 75) {

            return "Facile";

        }

        if (score >= 60) {

            return "Moyen";

        }

        if (score >= 40) {

            return "Difficile";

        }

        return "Très difficile";

    }

    /* ======================================================
       RESET
    ====================================================== */

    reset() {

        this.text = "";

        this.analysis = {};

    }

}

const readabilityEngine =

    new ReadabilityEngine();

export default readabilityEngine;