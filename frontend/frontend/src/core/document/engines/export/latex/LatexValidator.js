/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : LatexValidator.js
 * Description : Validation des documents avant export LaTeX.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

class LatexValidator {

    constructor() {

        this.reset();

    }

    /* ======================================================
       RESET
    ====================================================== */

    reset() {

        this.errors = [];

        this.warnings = [];

    }

    /* ======================================================
       VALIDATION
    ====================================================== */

    validate(html = "") {

        this.reset();

        this.validateDocument(html);

        this.validateImages(html);

        this.validateTables(html);

        this.validateLinks(html);

        return {

            valid: this.errors.length === 0,

            errors: [...this.errors],

            warnings: [...this.warnings]

        };

    }

    /* ======================================================
       DOCUMENT
    ====================================================== */

    validateDocument(html) {

        if (!html || !html.trim()) {

            this.errors.push(

                "Le document est vide."

            );

        }

    }

    /* ======================================================
       IMAGES
    ====================================================== */

    validateImages(html) {

        const parser = new DOMParser();

        const document = parser.parseFromString(

            html,

            "text/html"

        );

        document

            .querySelectorAll("img")

            .forEach(image => {

                const src = image.getAttribute("src");

                const alt = image.getAttribute("alt");

                if (!src) {

                    this.errors.push(

                        "Une image ne possède pas de source."

                    );

                }

                if (!alt) {

                    this.warnings.push(

                        "Une image ne possède pas de texte alternatif."

                    );

                }

            });

    }

    /* ======================================================
       TABLEAUX
    ====================================================== */

    validateTables(html) {

        const parser = new DOMParser();

        const document = parser.parseFromString(

            html,

            "text/html"

        );

        document

            .querySelectorAll("table")

            .forEach(table => {

                if (table.rows.length === 0) {

                    this.warnings.push(

                        "Un tableau est vide."

                    );

                }

            });

    }

    /* ======================================================
       LIENS
    ====================================================== */

    validateLinks(html) {

        const parser = new DOMParser();

        const document = parser.parseFromString(

            html,

            "text/html"

        );

        document

            .querySelectorAll("a")

            .forEach(link => {

                const href = link.getAttribute("href");

                if (!href) {

                    this.warnings.push(

                        "Un lien ne possède pas d'adresse."

                    );

                }

            });

    }

    /* ======================================================
       GETTERS
    ====================================================== */

    getErrors() {

        return [...this.errors];

    }

    getWarnings() {

        return [...this.warnings];

    }

    hasErrors() {

        return this.errors.length > 0;

    }

    hasWarnings() {

        return this.warnings.length > 0;

    }

    /* ======================================================
       EXPORT
    ====================================================== */

    toJSON() {

        return {

            errors: this.getErrors(),

            warnings: this.getWarnings()

        };

    }

}

export default LatexValidator;