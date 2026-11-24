/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : LatexBuilder.js
 * Description : Construction d'un document LaTeX complet.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

class LatexBuilder {

    constructor() {

        this.reset();

    }

    /* ======================================================
       CONFIGURATION
    ====================================================== */

    configure(options = {}) {

        this.configuration = {

            ...this.configuration,

            ...options

        };

    }

    reset() {

        this.configuration = {

            documentClass: "article",

            fontSize: "11pt",

            paperSize: "a4paper",

            title: "",

            author: "",

            date: "\\today",

            margin: "2.5cm",

            language: "french"

        };

    }

    /* ======================================================
       METADONNEES
    ====================================================== */

    setTitle(title = "") {

        this.configuration.title = title;

    }

    setAuthor(author = "") {

        this.configuration.author = author;

    }

    setDate(date = "\\today") {

        this.configuration.date = date;

    }

    /* ======================================================
       CONSTRUCTION
    ====================================================== */

    build({

        body = "",

        packages = []

    } = {}) {

        return [

            this.buildDocumentClass(),

            this.buildPackages(packages),

            this.buildGeometry(),

            this.buildMetadata(),

            this.beginDocument(),

            this.buildTitle(),

            body,

            this.endDocument()

        ]

        .filter(Boolean)

        .join("\n\n");

    }

    /* ======================================================
       DOCUMENT CLASS
    ====================================================== */

    buildDocumentClass() {

        return `\\documentclass[${this.configuration.fontSize},${this.configuration.paperSize}]{${this.configuration.documentClass}}`;

    }

    /* ======================================================
       PACKAGES
    ====================================================== */

    buildPackages(packages = []) {

        return packages

            .map(

                pkg => `\\usepackage{${pkg}}`

            )

            .join("\n");

    }

    /* ======================================================
       GEOMETRY
    ====================================================== */

    buildGeometry() {

        return `\\geometry{margin=${this.configuration.margin}}`;

    }

    /* ======================================================
       METADATA
    ====================================================== */

    buildMetadata() {

        return [

            `\\title{${this.configuration.title}}`,

            `\\author{${this.configuration.author}}`,

            `\\date{${this.configuration.date}}`

        ].join("\n");

    }

    /* ======================================================
       DOCUMENT
    ====================================================== */

    beginDocument() {

        return "\\begin{document}";

    }

    endDocument() {

        return "\\end{document}";

    }

    buildTitle() {

        if (

            !this.configuration.title &&

            !this.configuration.author

        ) {

            return "";

        }

        return "\\maketitle";

    }

    /* ======================================================
       EXPORT
    ====================================================== */

    toJSON() {

        return {

            ...this.configuration

        };

    }

}

export default LatexBuilder;