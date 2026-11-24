/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : AccessibilityEngine.js
 * Description : Moteur de vérification et de correction
 *               de l'accessibilité des documents scientifiques.
 * Version : 2.0.0
 * Statut : Stable
 * ============================================================
 */

class AccessibilityEngine {
    constructor() {
        this.text = "";
        this.issues = [];
    }

    /* ======================================================
       ANALYSE PRINCIPALE
    ====================================================== */

    analyse(text = "") {
        this.text = typeof text === "string" ? text : "";
        this.issues = [];

        this.checkEmptyDocument();
        this.checkParagraphLength();
        this.checkSentenceLength();
        this.checkRepeatedSpaces();
        this.checkUppercaseWords();
        this.checkEmptyLines();

        return this.issues;
    }

    /* ======================================================
       VÉRIFICATION GLOBALE
       Utilisée par "Vérifier"
    ====================================================== */

    check(text = "") {
        const issues = this.analyse(text);

        const errors = issues.filter(
            (issue) => issue.type === "error"
        ).length;

        const warnings = issues.filter(
            (issue) => issue.type === "warning"
        ).length;

        const infos = issues.filter(
            (issue) => issue.type === "info"
        ).length;

        return {
            accessible: issues.length === 0,
            score: this.calculateScore(issues),
            total: issues.length,
            errors,
            warnings,
            infos,
            issues,
        };
    }

    /* ======================================================
       SCAN DÉTAILLÉ
       Utilisée par "Scanner"
    ====================================================== */

    scan(text = "") {
        return this.analyse(text);
    }

    /* ======================================================
       SCORE D'ACCESSIBILITÉ
    ====================================================== */

    calculateScore(issues = []) {
        if (!issues.length) {
            return 100;
        }

        let score = 100;

        issues.forEach((issue) => {
            switch (issue.type) {
                case "error":
                    score -= 25;
                    break;

                case "warning":
                    score -= 10;
                    break;

                case "info":
                    score -= 3;
                    break;

                default:
                    score -= 1;
            }
        });

        return Math.max(0, Math.min(100, score));
    }

    /* ======================================================
       DOCUMENT VIDE
    ====================================================== */

    checkEmptyDocument() {
        if (!this.text.trim()) {
            this.issues.push({
                type: "error",
                title: "Document vide",
                description:
                    "Le document ne contient aucun texte.",
            });
        }
    }

    /* ======================================================
       PARAGRAPHES
    ====================================================== */

    checkParagraphLength() {
        if (!this.text.trim()) {
            return;
        }

        const paragraphs = this.text.split(/\n\s*\n/);

        paragraphs.forEach((paragraph, index) => {
            const cleanParagraph = paragraph.trim();

            if (!cleanParagraph) {
                return;
            }

            if (cleanParagraph.length > 1500) {
                this.issues.push({
                    type: "warning",
                    title: "Paragraphe très long",
                    description:
                        `Le paragraphe ${index + 1} est très long (${cleanParagraph.length} caractères).`,
                });
            }
        });
    }

    /* ======================================================
       PHRASES
    ====================================================== */

    checkSentenceLength() {
        if (!this.text.trim()) {
            return;
        }

        const sentences = this.text
            .split(/[.!?]+/)
            .map((sentence) => sentence.trim())
            .filter(Boolean);

        sentences.forEach((sentence, index) => {
            const words = sentence
                .split(/\s+/)
                .filter(Boolean);

            if (words.length > 35) {
                this.issues.push({
                    type: "warning",
                    title: "Phrase longue",
                    description:
                        `La phrase ${index + 1} contient ${words.length} mots.`,
                });
            }
        });
    }

    /* ======================================================
       ESPACES MULTIPLES
    ====================================================== */

    checkRepeatedSpaces() {
        if (/\s{2,}/.test(this.text)) {
            this.issues.push({
                type: "info",
                title: "Espaces multiples",
                description:
                    "Le document contient plusieurs espaces successifs.",
            });
        }
    }

    /* ======================================================
       MAJUSCULES
    ====================================================== */

    checkUppercaseWords() {
        const words = this.text.match(
            /\b[A-ZÀ-Ü]{6,}\b/g
        );

        if (words && words.length) {
            this.issues.push({
                type: "warning",
                title: "Mots entièrement en majuscules",
                description:
                    `${words.length} mot(s) entièrement en majuscules détecté(s).`,
            });
        }
    }

    /* ======================================================
       LIGNES VIDES
    ====================================================== */

    checkEmptyLines() {
        if (/\n{3,}/.test(this.text)) {
            this.issues.push({
                type: "info",
                title: "Lignes vides",
                description:
                    "Plusieurs lignes vides successives ont été détectées.",
            });
        }
    }

    /* ======================================================
       CORRECTION AUTOMATIQUE
       Utilisée par "Corriger"
    ====================================================== */

    fix(text = "") {
        if (typeof text !== "string") {
            return "";
        }

        let correctedText = text;

        /* ----------------------------------------------
           1. Espaces multiples
        ---------------------------------------------- */

        correctedText = correctedText.replace(
            /[ \t]{2,}/g,
            " "
        );

        /* ----------------------------------------------
           2. Espaces avant ponctuation
        ---------------------------------------------- */

        correctedText = correctedText.replace(
            /\s+([,;:.!?])/g,
            "$1"
        );

        /* ----------------------------------------------
           3. Espaces après ponctuation
        ---------------------------------------------- */

        correctedText = correctedText.replace(
            /([,;:.!?])([^\s\n])/g,
            "$1 $2"
        );

        /* ----------------------------------------------
           4. Trop nombreuses lignes vides
        ---------------------------------------------- */

        correctedText = correctedText.replace(
            /\n{3,}/g,
            "\n\n"
        );

        /* ----------------------------------------------
           5. Espaces en début/fin de ligne
        ---------------------------------------------- */

        correctedText = correctedText
            .split("\n")
            .map((line) => line.trim())
            .join("\n");

        /* ----------------------------------------------
           6. Espaces début/fin du document
        ---------------------------------------------- */

        correctedText = correctedText.trim();

        return correctedText;
    }

    /* ======================================================
       RÉSULTATS
    ====================================================== */

    getIssues() {
        return this.issues;
    }

    count() {
        return this.issues.length;
    }

    hasIssues() {
        return this.issues.length > 0;
    }

    /* ======================================================
       RESET
    ====================================================== */

    reset() {
        this.text = "";
        this.issues = [];
    }
}

/* ============================================================
   INSTANCE UNIQUE
============================================================ */

const accessibilityEngine =
    new AccessibilityEngine();

export default accessibilityEngine;