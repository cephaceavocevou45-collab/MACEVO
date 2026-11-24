/**
 * ============================================================
 * MACEVO
 *
 * Fichier : ImporterRegistry.js
 * Description : Registre central des importeurs LaTeX -> HTML
 * Version : 1.0.0
 * ============================================================
 */

class ImporterRegistry {

    constructor() {

        this.importers = new Map();

    }


    /* ======================================================
       ENREGISTRER
    ====================================================== */

    register(name, importer) {

        if (
            typeof name !== "string" ||
            !name.trim()
        ) {

            return false;

        }

        if (
            typeof importer !== "function"
        ) {

            return false;

        }

        this.importers.set(
            name.trim().toLowerCase(),
            importer
        );

        return true;

    }


    /* ======================================================
       ENREGISTRER PLUSIEURS
    ====================================================== */

    registerMany(importers = {}) {

        if (
            !importers ||
            typeof importers !== "object"
        ) {

            return this;

        }

        Object.entries(importers).forEach(
            ([name, importer]) => {

                this.register(
                    name,
                    importer
                );

            }
        );

        return this;

    }


    /* ======================================================
       RÉCUPÉRER
    ====================================================== */

    get(name) {

        if (
            typeof name !== "string"
        ) {

            return undefined;

        }

        return this.importers.get(
            name.trim().toLowerCase()
        );

    }


    /* ======================================================
       EXISTENCE
    ====================================================== */

    has(name) {

        if (
            typeof name !== "string"
        ) {

            return false;

        }

        return this.importers.has(
            name.trim().toLowerCase()
        );

    }


    /* ======================================================
       SUPPRIMER
    ====================================================== */

    unregister(name) {

        if (
            typeof name !== "string"
        ) {

            return false;

        }

        return this.importers.delete(
            name.trim().toLowerCase()
        );

    }


    /* ======================================================
       VIDER
    ====================================================== */

    clear() {

        this.importers.clear();

    }


    /* ======================================================
       TAILLE
    ====================================================== */

    size() {

        return this.importers.size;

    }


    /* ======================================================
       NOMS
    ====================================================== */

    keys() {

        return Array.from(
            this.importers.keys()
        );

    }


    /* ======================================================
       VALEURS
    ====================================================== */

    values() {

        return Array.from(
            this.importers.values()
        );

    }


    /* ======================================================
       ENTRÉES
    ====================================================== */

    entries() {

        return Array.from(
            this.importers.entries()
        );

    }


    /* ======================================================
       EXPORTER UN CONTENU
    ====================================================== */

    export(source, context = {}) {

        if (
            typeof source !== "string"
        ) {

            return "";

        }

        let result = source;


        this.importers.forEach(
            importer => {

                try {

                    const imported =
                        importer(
                            result,
                            context
                        );

                    if (
                        typeof imported ===
                        "string"
                    ) {

                        result = imported;

                    }

                } catch (error) {

                    console.error(
                        "Erreur dans un importeur LaTeX :",
                        error
                    );

                }

            }
        );


        return result;

    }

}


const importerRegistry =
    new ImporterRegistry();

export default importerRegistry;

export {
    ImporterRegistry
};