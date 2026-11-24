/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : LatexStatistics.js
 * Description : Statistiques du document LaTeX.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

class LatexStatistics {

    constructor() {

        this.reset();

    }

    /* ======================================================
       RESET
    ====================================================== */

    reset() {

        this.statistics = {

            characters: 0,

            charactersWithoutSpaces: 0,

            words: 0,

            paragraphs: 0,

            headings: 0,

            images: 0,

            tables: 0,

            lists: 0,

            links: 0,

            codeBlocks: 0,

            estimatedPages: 0,

            readingTime: 0

        };

    }

    /* ======================================================
       CALCUL
    ====================================================== */

    compute(html = "") {

        this.reset();

        if (!html) {

            return this.getStatistics();

        }

        const parser = new DOMParser();

        const document = parser.parseFromString(

            html,

            "text/html"

        );

        const text = document.body.textContent || "";

        this.statistics.characters = text.length;

        this.statistics.charactersWithoutSpaces =

            text.replace(/\s/g, "").length;

        this.statistics.words =

            text

                .trim()

                .split(/\s+/)

                .filter(Boolean)

                .length;

        this.statistics.paragraphs =

            document.querySelectorAll("p").length;

        this.statistics.headings =

            document.querySelectorAll(

                "h1,h2,h3,h4,h5,h6"

            ).length;

        this.statistics.images =

            document.querySelectorAll("img").length;

        this.statistics.tables =

            document.querySelectorAll("table").length;

        this.statistics.lists =

            document.querySelectorAll("ul,ol").length;

        this.statistics.links =

            document.querySelectorAll("a").length;

        this.statistics.codeBlocks =

            document.querySelectorAll("pre,code").length;

        this.statistics.estimatedPages =

            this.calculatePages();

        this.statistics.readingTime =

            this.calculateReadingTime();

        return this.getStatistics();

    }

    /* ======================================================
       ESTIMATION
    ====================================================== */

    calculatePages() {

        const WORDS_PER_PAGE = 500;

        return Math.max(

            1,

            Math.ceil(

                this.statistics.words /

                WORDS_PER_PAGE

            )

        );

    }

    calculateReadingTime() {

        const WORDS_PER_MINUTE = 200;

        return Math.max(

            1,

            Math.ceil(

                this.statistics.words /

                WORDS_PER_MINUTE

            )

        );

    }

    /* ======================================================
       GETTERS
    ====================================================== */

    getStatistics() {

        return {

            ...this.statistics

        };

    }

    /* ======================================================
       EXPORT
    ====================================================== */

    toJSON() {

        return this.getStatistics();

    }

}

export default LatexStatistics;