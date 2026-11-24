/**
 * ==========================================================
 * MACEVO
 *
 * Fichier : LatexStatistics.js
 * Description : Statistiques d'un document LaTeX
 * Version : 1.0.0
 * ==========================================================
 */

class LatexStatistics {

    /**
     * Analyse complète
     */
    analyze(latex = "") {

        const source =
            this.normalize(latex);

        return {

            characters:
                this.countCharacters(source),

            charactersNoSpaces:
                this.countCharactersNoSpaces(source),

            words:
                this.countWords(source),

            lines:
                this.countLines(source),

            paragraphs:
                this.countParagraphs(source),

            sections:
                this.countCommand(
                    source,
                    "section"
                ),

            subsections:
                this.countCommand(
                    source,
                    "subsection"
                ),

            subsubsections:
                this.countCommand(
                    source,
                    "subsubsection"
                ),

            figures:
                this.countEnvironment(
                    source,
                    "figure"
                ),

            tables:
                this.countEnvironment(
                    source,
                    "table"
                ),

            equations:
                this.countEnvironment(
                    source,
                    "equation"
                ),

            alignments:
                this.countEnvironment(
                    source,
                    "align"
                ),

            itemize:
                this.countEnvironment(
                    source,
                    "itemize"
                ),

            enumerate:
                this.countEnvironment(
                    source,
                    "enumerate"
                ),

            citations:
                this.countCommand(
                    source,
                    "cite"
                ),

            labels:
                this.countCommand(
                    source,
                    "label"
                ),

            references:
                this.countCommand(
                    source,
                    "ref"
                ),

            commands:
                this.countCommands(source),

            comments:
                this.countComments(source)

        };
    }


    /**
     * Normalisation
     */
    normalize(latex = "") {

        return String(latex ?? "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");
    }


    /**
     * Nombre total de caractères
     */
    countCharacters(latex) {

        return String(latex).length;
    }


    /**
     * Nombre de caractères sans espaces
     */
    countCharactersNoSpaces(latex) {

        return String(latex)
            .replace(/\s/g, "")
            .length;
    }


    /**
     * Nombre de mots
     */
    countWords(latex) {

        const text =
            this.removeComments(
                String(latex)
            );

        const matches =
            text.match(
                /\b[\p{L}\p{N}_]+\b/gu
            );

        return matches
            ? matches.length
            : 0;
    }


    /**
     * Nombre de lignes
     */
    countLines(latex) {

        if (!latex) {
            return 0;
        }

        return String(latex)
            .split("\n")
            .length;
    }


    /**
     * Nombre de paragraphes
     */
    countParagraphs(latex) {

        const text =
            String(latex)
                .replace(
                    /%.*$/gm,
                    ""
                )
                .trim();

        if (!text) {
            return 0;
        }

        return text
            .split(/\n\s*\n/)
            .filter(
                paragraph =>
                    paragraph.trim()
            )
            .length;
    }


    /**
     * Compte une commande LaTeX
     */
    countCommand(
        latex,
        command
    ) {

        const expression =
            new RegExp(
                `\\\\${command}(?:\\*)?\\b`,
                "g"
            );

        return (
            latex.match(expression)
            || []
        ).length;
    }


    /**
     * Compte un environnement
     */
    countEnvironment(
        latex,
        environment
    ) {

        const expression =
            new RegExp(
                `\\\\begin\\{${environment}\\}`,
                "g"
            );

        return (
            latex.match(expression)
            || []
        ).length;
    }


    /**
     * Nombre de commandes LaTeX
     */
    countCommands(latex) {

        const matches =
            String(latex)
                .match(
                    /\\[a-zA-Z@]+[*]?/g
                );

        return matches
            ? matches.length
            : 0;
    }


    /**
     * Nombre de commentaires
     */
    countComments(latex) {

        return (
            String(latex)
                .match(
                    /(^|[^\\])%.*$/gm
                )
                || []
        ).length;
    }


    /**
     * Supprime les commentaires
     */
    removeComments(latex) {

        return String(latex)
            .replace(
                /(^|[^\\])%.*$/gm,
                "$1"
            );
    }


    /**
     * Retourne uniquement les statistiques
     */
    get(latex = "") {

        return this.analyze(
            latex
        );
    }


    /**
     * Vérifie si le document contient du contenu
     */
    isEmpty(latex = "") {

        return !String(latex)
            .trim();
    }

}


const latexStatistics =
    new LatexStatistics();

export default latexStatistics;