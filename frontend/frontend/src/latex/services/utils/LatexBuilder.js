/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexBuilder.js
 * Description : Constructeur central de commandes LaTeX
 * Version : 2.0.0
 * ==========================================================
 */

class LatexBuilder {

    /* ======================================================
       COMMANDE
    ====================================================== */

    command(

        name,

        content = "",

        options = null

    ) {

        if (!name) {

            return "";

        }

        const normalizedOptions =

            this.normalizeOptions(

                options

            );

        const opts =

            normalizedOptions

                ? `[${normalizedOptions}]`

                : "";

        return `\\${name}${opts}{${content}}`;

    }

    /* ======================================================
       COMMANDE AVEC OPTIONS
    ====================================================== */

    commandWithOptions(

        name,

        options = "",

        content = ""

    ) {

        return this.command(

            name,

            content,

            options

        );

    }

    /* ======================================================
       ENVIRONNEMENT
    ====================================================== */

    environment(

        name,

        content = ""

    ) {

        if (!name) {

            return "";

        }

        return (

            `\\begin{${name}}\n` +

            `${content}\n` +

            `\\end{${name}}`

        );

    }

    /* ======================================================
       ENVIRONNEMENT AVEC OPTIONS
    ====================================================== */

    environmentWithOptions(

        name,

        options = "",

        content = ""

    ) {

        if (!name) {

            return "";

        }

        const normalizedOptions =

            this.normalizeOptions(

                options

            );

        const opts =

            normalizedOptions

                ? `[${normalizedOptions}]`

                : "";

        return (

            `\\begin{${name}}${opts}\n` +

            `${content}\n` +

            `\\end{${name}}`

        );

    }

    /* ======================================================
       WRAP
    ====================================================== */

    wrap(

        command,

        content = ""

    ) {

        return this.command(

            command,

            content

        );

    }

    /* ======================================================
       FONT SIZE
    ====================================================== */

    fontSize(

        size,

        baseline,

        content = ""

    ) {

        return (

            `{\\fontsize{${size}}{${baseline}}` +

            `\\selectfont ${content}}`

        );

    }

    /* ======================================================
       FONT FAMILY
    ====================================================== */

    fontFamily(

        family,

        content = ""

    ) {

        return (

            `{\\fontfamily{${family}}` +

            `\\selectfont ${content}}`

        );

    }

    /* ======================================================
       COULEUR
    ====================================================== */

    color(

        color,

        content = ""

    ) {

        return (

            `\\textcolor{${color}}{${content}}`

        );

    }

    /* ======================================================
       HIGHLIGHT
    ====================================================== */

    highlight(

        color,

        content = ""

    ) {

        return (

            `\\colorbox{${color}}{${content}}`

        );

    }

    /* ======================================================
       IMAGE
    ====================================================== */

    image(

        source,

        options = ""

    ) {

        return this.command(

            "includegraphics",

            source,

            options

        );

    }

    /* ======================================================
       LIEN
    ====================================================== */

    href(

        url,

        label = ""

    ) {

        return (

            `\\href{${url}}{${label}}`

        );

    }

    /* ======================================================
       ITEM
    ====================================================== */

    item(

        content = ""

    ) {

        return `\\item ${content}`;

    }

    /* ======================================================
       SECTION
    ====================================================== */

    section(

        level,

        title = ""

    ) {

        const commands = {

            1: "section",

            2: "subsection",

            3: "subsubsection",

            4: "paragraph",

            5: "subparagraph",

        };

        const command =

            commands[level] ||

            "section";

        return this.command(

            command,

            title

        );

    }

    /* ======================================================
       TABLEAU
    ====================================================== */

    table(

        specification,

        content = ""

    ) {

        return (

            `\\begin{tabular}{${specification}}\n` +

            `${content}\n` +

            `\\end{tabular}`

        );

    }

    /* ======================================================
       LIGNE DE TABLEAU
    ====================================================== */

    tableRow(

        cells = []

    ) {

        if (!Array.isArray(cells)) {

            return "";

        }

        return (

            cells.join(" & ") +

            " \\\\"

        );

    }

    /* ======================================================
       CELLULE
    ====================================================== */

    tableCell(

        content = ""

    ) {

        return String(

            content

        );

    }

    /* ======================================================
       SAUT DE LIGNE
    ====================================================== */

    lineBreak() {

        return "\\\\";

    }

    /* ======================================================
       NOUVEAU PARAGRAPHE
    ====================================================== */

    paragraph() {

        return "\n\n";

    }

    /* ======================================================
       ESPACE
    ====================================================== */

    space() {

        return " ";

    }

    /* ======================================================
       CONCATENER
    ====================================================== */

    concat(

        ...parts

    ) {

        return parts

            .filter(

                part =>

                    part !== null &&

                    part !== undefined &&

                    part !== ""

            )

            .join("");

    }

    /* ======================================================
       CONCATENER AVEC SAUT DE LIGNE
    ====================================================== */

    joinLines(

        ...parts

    ) {

        return parts

            .filter(

                part =>

                    part !== null &&

                    part !== undefined &&

                    part !== ""

            )

            .join("\n");

    }

    /* ======================================================
       OPTIONS
    ====================================================== */

    normalizeOptions(

        options

    ) {

        if (

            options === null ||

            options === undefined ||

            options === ""

        ) {

            return "";

        }

        if (Array.isArray(options)) {

            return options

                .filter(Boolean)

                .join(",");

        }

        if (

            typeof options === "object"

        ) {

            return Object.entries(

                options

            )

                .filter(

                    ([, value]) =>

                        value !== null &&

                        value !== undefined &&

                        value !== false

                )

                .map(

                    ([key, value]) => {

                        if (value === true) {

                            return key;

                        }

                        return `${key}=${value}`;

                    }

                )

                .join(",");

        }

        return String(options);

    }

}

/* ==========================================================
   INSTANCE UNIQUE
========================================================== */

const latexBuilder = new LatexBuilder();

export default latexBuilder;