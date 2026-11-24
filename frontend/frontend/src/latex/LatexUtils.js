/**
 * ==========================================================
 * MACEVO
 *
 * Fichier : LatexUtils.js
 * Description : Utilitaires généraux LaTeX
 * Version : 1.0.0
 * ==========================================================
 */

class LatexUtils {

    /**
     * Normalise les retours à la ligne
     */
    normalize(latex = "") {

        return String(latex ?? "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");
    }


    /**
     * Supprime les espaces inutiles en début/fin
     */
    trim(latex = "") {

        return this.normalize(
            latex
        ).trim();
    }


    /**
     * Vérifie si le contenu est vide
     */
    isEmpty(latex = "") {

        return !String(latex ?? "")
            .trim();
    }


    /**
     * Échappe les caractères spéciaux LaTeX
     */
    escape(text = "") {

        return String(text ?? "")
            .replace(/\\/g, "\\textbackslash{}")
            .replace(/([#$%&_{}])/g, "\\$1")
            .replace(/\^/g, "\\textasciicircum{}")
            .replace(/~/g, "\\textasciitilde{}");
    }


    /**
     * Déséchappe les caractères LaTeX courants
     */
    unescape(text = "") {

        return String(text ?? "")
            .replace(
                /\\textbackslash\{\}/g,
                "\\"
            )
            .replace(
                /\\textasciicircum\{\}/g,
                "^"
            )
            .replace(
                /\\textasciitilde\{\}/g,
                "~"
            )
            .replace(
                /\\([#$%&_{}])/g,
                "$1"
            );
    }


    /**
     * Construit une commande LaTeX
     *
     * Exemple :
     * command("textbf", "Bonjour")
     * => \textbf{Bonjour}
     */
    command(
        name,
        content = "",
        options = null
    ) {

        if (!name) {
            return "";
        }

        const optionString =
            options
                ? `[${options}]`
                : "";

        return (
            `\\${name}` +
            optionString +
            `{${content}}`
        );
    }


    /**
     * Construit un environnement
     */
    environment(
        name,
        content = "",
        options = null
    ) {

        if (!name) {
            return "";
        }

        const optionString =
            options
                ? `[${options}]`
                : "";

        return (

            `\\begin{${name}}` +
            optionString +
            "\n" +

            content +

            `\n\\end{${name}}`
        );
    }


    /**
     * Extrait le contenu d'une commande
     *
     * Exemple :
     * \section{Introduction}
     * => Introduction
     */
    extractCommand(
        latex,
        command
    ) {

        if (
            typeof latex !== "string" ||
            !command
        ) {
            return [];
        }

        const expression =
            new RegExp(
                `\\\\${command}(?:\\*)?\\{([^{}]*)\\}`,
                "g"
            );

        return [
            ...latex.matchAll(
                expression
            )
        ].map(
            match => match[1]
        );
    }


    /**
     * Extrait le contenu d'un environnement
     */
    extractEnvironment(
        latex,
        environment
    ) {

        if (
            typeof latex !== "string" ||
            !environment
        ) {
            return [];
        }

        const expression =
            new RegExp(
                `\\\\begin\\{${environment}\\}([\\s\\S]*?)\\\\end\\{${environment}\\}`,
                "g"
            );

        return [
            ...latex.matchAll(
                expression
            )
        ].map(
            match => match[1].trim()
        );
    }


    /**
     * Vérifie si une commande existe
     */
    hasCommand(
        latex,
        command
    ) {

        if (
            typeof latex !== "string" ||
            !command
        ) {
            return false;
        }

        return new RegExp(
            `\\\\${command}(?:\\*)?\\b`
        ).test(latex);
    }


    /**
     * Vérifie si un environnement existe
     */
    hasEnvironment(
        latex,
        environment
    ) {

        if (
            typeof latex !== "string" ||
            !environment
        ) {
            return false;
        }

        return new RegExp(
            `\\\\begin\\{${environment}\\}`
        ).test(latex);
    }


    /**
     * Ajoute une ligne
     */
    line(content = "") {

        return `${content}\n`;
    }


    /**
     * Ajoute deux lignes
     */
    blankLine(content = "") {

        return `${content}\n\n`;
    }


    /**
     * Nettoie les lignes vides multiples
     */
    collapseBlankLines(latex = "") {

        return this.normalize(
            latex
        ).replace(
            /\n{3,}/g,
            "\n\n"
        );
    }


    /**
     * Supprime les commentaires LaTeX
     */
    removeComments(latex = "") {

        return String(latex ?? "")
            .replace(
                /(^|[^\\])%.*$/gm,
                "$1"
            );
    }


    /**
     * Récupère le nom de fichier sans extension
     */
    fileNameWithoutExtension(
        filename = ""
    ) {

        return String(filename)
            .replace(
                /\.[^/.]+$/,
                ""
            );
    }


    /**
     * Force une extension .tex
     */
    ensureTexExtension(
        filename = "document"
    ) {

        const name =
            String(filename)
                .trim() || "document";

        if (
            name
                .toLowerCase()
                .endsWith(".tex")
        ) {
            return name;
        }

        return `${name}.tex`;
    }


    /**
     * Construit un document LaTeX complet
     */
    createDocument(
        content = "",
        options = {}
    ) {

        const documentClass =
            options.documentClass
            || "article";

        const packages =
            Array.isArray(
                options.packages
            )
                ? options.packages
                : [
                    "\\usepackage[utf8]{inputenc}",
                    "\\usepackage[T1]{fontenc}",
                    "\\usepackage{amsmath}",
                    "\\usepackage{amssymb}",
                    "\\usepackage{xcolor}",
                    "\\usepackage{hyperref}",
                    "\\usepackage{graphicx}"
                ];

        return (

            `\\documentclass{${documentClass}}\n\n` +

            packages.join("\n") +

            "\n\n\\begin{document}\n\n" +

            String(content ?? "").trim() +

            "\n\n\\end{document}"
        );
    }


    /**
     * Vérifie rapidement l'équilibre des accolades
     */
    balancedBraces(latex = "") {

        let level = 0;

        for (
            const char of String(latex)
        ) {

            if (char === "{") {
                level++;
            }

            if (char === "}") {
                level--;

                if (level < 0) {
                    return false;
                }
            }
        }

        return level === 0;
    }


    /**
     * Vérifie rapidement l'équilibre des dollars
     */
    balancedMathDelimiters(
        latex = ""
    ) {

        const source =
            String(latex)
                .replace(
                    /\\\$/g,
                    ""
                );

        const count =
            (
                source.match(
                    /\$/g
                ) || []
            ).length;

        return count % 2 === 0;
    }


    /**
     * Validation basique
     */
    isStructurallyValid(
        latex = ""
    ) {

        return (
            typeof latex === "string" &&
            !this.isEmpty(latex) &&
            this.balancedBraces(latex) &&
            this.balancedMathDelimiters(
                latex
            )
        );
    }

}


const latexUtils =
    new LatexUtils();

export default latexUtils;