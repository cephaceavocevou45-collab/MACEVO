/**
 * ============================================================
 * MACEVO - LaTeX Parser
 *
 * Fichier : parser.js
 * Description : Analyse et extraction de la structure LaTeX
 * Version : 3.0.0
 * ============================================================
 */


/**
 * Analyse complète d'un document LaTeX.
 */
export function parseLatex(latex = "") {

    if (
        typeof latex !== "string"
    ) {

        return {

            documentClass: null,

            packages: [],

            sections: [],
            subsections: [],
            subsubsections: [],

            figures: [],
            tables: [],
            tabulars: [],

            equations: [],
            alignments: [],

            citations: [],
            labels: [],
            references: [],

            commands: []
        };
    }


    return {

        documentClass:
            extractDocumentClass(latex),

        packages:
            extractPackages(latex),

        sections:
            extractSections(latex),

        subsections:
            extractSubsections(latex),

        subsubsections:
            extractSubsubsections(latex),

        figures:
            extractFigures(latex),

        tables:
            extractTables(latex),

        tabulars:
            extractTabulars(latex),

        equations:
            extractEquations(latex),

        alignments:
            extractAlignments(latex),

        citations:
            extractCitations(latex),

        labels:
            extractLabels(latex),

        references:
            extractReferences(latex),

        commands:
            extractCommands(latex)
    };
}


/* ===========================================================
   SECTIONS
=========================================================== */

export function extractSections(latex = "") {

    return [

        ...latex.matchAll(
            /\\section\*?\{([\s\S]*?)\}/g
        )

    ].map(
        match => match[1]
    );
}


/* ===========================================================
   SUBSECTIONS
=========================================================== */

export function extractSubsections(latex = "") {

    return [

        ...latex.matchAll(
            /\\subsection\*?\{([\s\S]*?)\}/g
        )

    ].map(
        match => match[1]
    );
}


/* ===========================================================
   SUBSUBSECTIONS
=========================================================== */

export function extractSubsubsections(latex = "") {

    return [

        ...latex.matchAll(
            /\\subsubsection\*?\{([\s\S]*?)\}/g
        )

    ].map(
        match => match[1]
    );
}


/* ===========================================================
   FIGURES
=========================================================== */

export function extractFigures(latex = "") {

    return [

        ...latex.matchAll(

            /\\begin\{figure\*?\}(?:\[([^\]]*)\])?([\s\S]*?)\\end\{figure\*?\}/g

        )

    ].map(
        match => ({

            options:
                match[1] ?? "",

            content:
                match[2]?.trim() ?? ""
        })
    );
}


/* ===========================================================
   TABLES
=========================================================== */

export function extractTables(latex = "") {

    return [

        ...latex.matchAll(

            /\\begin\{table\*?\}(?:\[([^\]]*)\])?([\s\S]*?)\\end\{table\*?\}/g

        )

    ].map(
        match => ({

            options:
                match[1] ?? "",

            content:
                match[2]?.trim() ?? ""
        })
    );
}


/* ===========================================================
   TABULAR
=========================================================== */

export function extractTabulars(latex = "") {

    return [

        ...latex.matchAll(

            /\\begin\{tabular\*?\}(?:\{([^{}]*)\})?([\s\S]*?)\\end\{tabular\*?\}/g

        )

    ].map(
        match => ({

            columns:
                match[1] ?? "",

            content:
                match[2]?.trim() ?? ""
        })
    );
}


/* ===========================================================
   EQUATIONS
=========================================================== */

export function extractEquations(latex = "") {

    return [

        ...latex.matchAll(

            /\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g

        )

    ].map(
        match =>
            match[1].trim()
    );
}


/* ===========================================================
   ALIGN
=========================================================== */

export function extractAlignments(latex = "") {

    return [

        ...latex.matchAll(

            /\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g

        )

    ].map(
        match =>
            match[1].trim()
    );
}


/* ===========================================================
   CITATIONS
=========================================================== */

export function extractCitations(latex = "") {

    return [

        ...latex.matchAll(

            /\\cite(?:\[[^\]]*\])?\{([^{}]*)\}/g

        )

    ].flatMap(
        match =>

            match[1]
                .split(",")
                .map(
                    citation =>
                        citation.trim()
                )
                .filter(Boolean)
    );
}


/* ===========================================================
   LABELS
=========================================================== */

export function extractLabels(latex = "") {

    return [

        ...latex.matchAll(

            /\\label\{([^{}]*)\}/g

        )

    ].map(
        match =>
            match[1].trim()
    );
}


/* ===========================================================
   REFERENCES
=========================================================== */

export function extractReferences(latex = "") {

    return [

        ...latex.matchAll(

            /\\(?:ref|pageref)\{([^{}]*)\}/g

        )

    ].map(
        match =>
            match[1].trim()
    );
}


/* ===========================================================
   COMMANDES
=========================================================== */

export function extractCommands(latex = "") {

    return [

        ...latex.matchAll(

            /\\([a-zA-Z@]+)\*?/g

        )

    ].map(
        match =>
            match[1]
    );
}


/* ===========================================================
   DOCUMENT CLASS
=========================================================== */

export function extractDocumentClass(latex = "") {

    const match =
        latex.match(

            /\\documentclass(?:\[([^\]]*)\])?\{([^{}]*)\}/

        );


    if (!match) {

        return null;
    }


    return {

        options:
            match[1] ?? "",

        class:
            match[2]
    };
}


/* ===========================================================
   PACKAGES
=========================================================== */

export function extractPackages(latex = "") {

    return [

        ...latex.matchAll(

            /\\usepackage(?:\[([^\]]*)\])?\{([^{}]*)\}/g

        )

    ].flatMap(
        match => {

            return match[2]

                .split(",")

                .map(
                    packageName => ({

                        name:
                            packageName.trim(),

                        options:
                            match[1] ?? ""
                    })
                )

                .filter(
                    item =>
                        item.name
                );
        }
    );
}


/* ===========================================================
   EXPORT
=========================================================== */

export default {

    parseLatex,

    extractSections,

    extractSubsections,

    extractSubsubsections,

    extractFigures,

    extractTables,

    extractTabulars,

    extractEquations,

    extractAlignments,

    extractCitations,

    extractLabels,

    extractReferences,

    extractCommands,

    extractDocumentClass,

    extractPackages
};