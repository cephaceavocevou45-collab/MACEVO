/**
 * ==========================================================
 * MACEVO
 *
 * Fichier : LatexPackageManager.js
 * Description : Gestion des packages LaTeX nécessaires
 * Version : 1.0.0
 * ==========================================================
 */

class LatexPackageManager {

    constructor() {

        this.packages = new Map();

        this.registerDefaults();
    }


    /**
     * Packages LaTeX utilisés par MACEVO
     */
    registerDefaults() {

        this.register(
            "inputenc",
            "\\usepackage[utf8]{inputenc}"
        );

        this.register(
            "fontenc",
            "\\usepackage[T1]{fontenc}"
        );

        this.register(
            "amsmath",
            "\\usepackage{amsmath}"
        );

        this.register(
            "amssymb",
            "\\usepackage{amssymb}"
        );

        this.register(
            "xcolor",
            "\\usepackage{xcolor}"
        );

        this.register(
            "hyperref",
            "\\usepackage{hyperref}"
        );

        this.register(
            "graphicx",
            "\\usepackage{graphicx}"
        );
    }


    /**
     * Enregistre un package
     */
    register(
        name,
        declaration
    ) {

        if (
            !name ||
            !declaration
        ) {
            return false;
        }

        this.packages.set(
            String(name),
            String(declaration)
        );

        return true;
    }


    /**
     * Supprime un package
     */
    remove(name) {

        return this.packages.delete(
            String(name)
        );
    }


    /**
     * Vérifie si un package existe
     */
    has(name) {

        return this.packages.has(
            String(name)
        );
    }


    /**
     * Récupère un package
     */
    get(name) {

        return (
            this.packages.get(
                String(name)
            ) ?? null
        );
    }


    /**
     * Liste les packages
     */
    list() {

        return Array.from(
            this.packages.keys()
        );
    }


    /**
     * Retourne les déclarations
     */
    declarations() {

        return Array.from(
            this.packages.values()
        );
    }


    /**
     * Génère les \usepackage
     */
    generate() {

        return this.declarations()
            .join("\n");
    }


    /**
     * Ajoute automatiquement les packages
     * nécessaires aux commandes détectées.
     */
    detectAndRegister(latex = "") {

        if (
            typeof latex !== "string"
        ) {
            return this;
        }

        if (
            /\\(?:textcolor|colorbox|color)\b/
                .test(latex)
        ) {
            this.register(
                "xcolor",
                "\\usepackage{xcolor}"
            );
        }

        if (
            /\\(?:includegraphics)\b/
                .test(latex)
        ) {
            this.register(
                "graphicx",
                "\\usepackage{graphicx}"
            );
        }

        if (
            /\\(?:href|url)\b/
                .test(latex)
        ) {
            this.register(
                "hyperref",
                "\\usepackage{hyperref}"
            );
        }

        if (
            /\\(?:frac|dfrac|tfrac|begin\{align)/.test(latex)
        ) {
            this.register(
                "amsmath",
                "\\usepackage{amsmath}"
            );
        }

        if (
            /\\(?:mathbb|mathfrak|mathcal)\b/
                .test(latex)
        ) {
            this.register(
                "amssymb",
                "\\usepackage{amssymb}"
            );
        }

        return this;
    }


    /**
     * Génère un préambule minimal
     */
    generatePreamble(
        documentClass = "article",
        latex = ""
    ) {

        this.detectAndRegister(
            latex
        );

        return (

            `\\documentclass{${documentClass}}\n\n` +

            this.generate() +

            "\n"
        );
    }


    /**
     * Réinitialise les packages
     */
    clear() {

        this.packages.clear();

        return this;
    }


    /**
     * Réinitialise puis remet les packages
     * standards MACEVO.
     */
    reset() {

        this.clear();

        this.registerDefaults();

        return this;
    }

}


const latexPackageManager =
    new LatexPackageManager();

export default latexPackageManager;