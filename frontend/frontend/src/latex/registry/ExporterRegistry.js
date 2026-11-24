/**
 * ==========================================================
 * MACEVO
 *
 * ---
 * Fichier : ExporterRegistry.js
 * Description : Registre central des exporteurs HTML -> LaTeX
 * Version : 2.1.0
 * ==========================================================
 */

class ExporterRegistry {

    constructor() {

        this.exporters =
            new Map();

    }


    /* ======================================================
       NORMALISATION TAG
    ====================================================== */

    normalizeTagName(tagName) {

        if (
            tagName === null ||
            tagName === undefined
        ) {
            return "";
        }


        return String(tagName)
            .trim()
            .toLowerCase();

    }


    /* ======================================================
       ENREGISTRER
    ====================================================== */

    register(
        tagName,
        handler
    ) {

        const normalizedTag =
            this.normalizeTagName(
                tagName
            );


        if (
            !normalizedTag ||
            typeof handler !== "function"
        ) {
            return false;
        }


        this.exporters.set(
            normalizedTag,
            handler
        );


        return true;

    }


    /* ======================================================
       ENREGISTRER PLUSIEURS
    ====================================================== */

    registerMany(
        exporters = {}
    ) {

        if (
            !exporters ||
            typeof exporters !== "object" ||
            Array.isArray(exporters)
        ) {
            return false;
        }


        Object.entries(exporters)
            .forEach(
                ([tagName, handler]) => {

                    this.register(
                        tagName,
                        handler
                    );

                }
            );


        return true;

    }


    /* ======================================================
       REMPLACER
    ====================================================== */

    replace(
        tagName,
        handler
    ) {

        const normalizedTag =
            this.normalizeTagName(
                tagName
            );


        if (
            !normalizedTag ||
            typeof handler !== "function"
        ) {
            return false;
        }


        if (
            !this.exporters.has(
                normalizedTag
            )
        ) {
            return false;
        }


        this.exporters.set(
            normalizedTag,
            handler
        );


        return true;

    }


    /* ======================================================
       SUPPRIMER
    ====================================================== */

    unregister(tagName) {

        const normalizedTag =
            this.normalizeTagName(
                tagName
            );


        if (!normalizedTag) {
            return false;
        }


        return this.exporters.delete(
            normalizedTag
        );

    }


    /* ======================================================
       RECHERCHE
    ====================================================== */

    get(tagName) {

        const normalizedTag =
            this.normalizeTagName(
                tagName
            );


        if (!normalizedTag) {
            return null;
        }


        return (
            this.exporters.get(
                normalizedTag
            ) ?? null
        );

    }


    /* ======================================================
       EXISTE
    ====================================================== */

    has(tagName) {

        const normalizedTag =
            this.normalizeTagName(
                tagName
            );


        if (!normalizedTag) {
            return false;
        }


        return this.exporters.has(
            normalizedTag
        );

    }


    /* ======================================================
       EXPORTER D'UN NŒUD
    ====================================================== */

    export(node) {

        if (!node) {
            return "";
        }


        const tagName =
            node.tagName;


        const handler =
            this.get(tagName);


        if (!handler) {
            return null;
        }


        return handler(node);

    }


    /* ======================================================
       EXECUTION SECURISEE
    ====================================================== */

    execute(
        tagName,
        node
    ) {

        const handler =
            this.get(tagName);


        if (!handler) {
            return null;
        }


        return handler(node);

    }


    /* ======================================================
       LISTE DES BALISES
    ====================================================== */

    keys() {

        return Array.from(
            this.exporters.keys()
        );

    }


    /* ======================================================
       LISTE DES HANDLERS
    ====================================================== */

    values() {

        return Array.from(
            this.exporters.values()
        );

    }


    /* ======================================================
       ENTREES
    ====================================================== */

    entries() {

        return Array.from(
            this.exporters.entries()
        );

    }


    /* ======================================================
       TAILLE
    ====================================================== */

    size() {

        return this.exporters.size;

    }


    /* ======================================================
       VIDAGE
    ====================================================== */

    clear() {

        this.exporters.clear();

    }


    /* ======================================================
       ETAT
    ====================================================== */

    isEmpty() {

        return (
            this.exporters.size === 0
        );

    }


    /* ======================================================
       DEBUG
    ====================================================== */

    describe() {

        return {

            size: this.size(),

            tags: this.keys(),

        };

    }

}


export default ExporterRegistry;