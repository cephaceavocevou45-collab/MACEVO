/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : LatexPackageManager.js
 * Description : Gestionnaire des packages LaTeX.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

class LatexPackageManager {

    constructor() {

        this.defaultPackages = [

            "inputenc",
            "fontenc",
            "babel",
            "geometry",
            "graphicx",
            "hyperref",
            "amsmath",
            "amssymb",
            "booktabs",
            "array",
            "longtable",
            "xcolor",
            "float"

        ];

        this.reset();

    }

    /* ======================================================
       PACKAGES
    ====================================================== */

    loadDefault() {

        this.packages = [...this.defaultPackages];

    }

    addPackage(name) {

        if (!name) return;

        if (!this.packages.includes(name)) {

            this.packages.push(name);

        }

    }

    removePackage(name) {

        this.packages = this.packages.filter(

            pkg => pkg !== name

        );

    }

    hasPackage(name) {

        return this.packages.includes(name);

    }

    togglePackage(name) {

        if (this.hasPackage(name)) {

            this.removePackage(name);

        } else {

            this.addPackage(name);

        }

    }

    clear() {

        this.packages = [];

    }

    reset() {

        this.loadDefault();

    }

    /* ======================================================
       GETTERS
    ====================================================== */

    getPackages() {

        return [...this.packages];

    }

    getPackagesAsString() {

        return this.packages

            .map(

                pkg => `\\usepackage{${pkg}}`

            )

            .join("\n");

    }

    count() {

        return this.packages.length;

    }

    /* ======================================================
       IMPORT / EXPORT
    ====================================================== */

    import(packages = []) {

        this.clear();

        packages.forEach(

            pkg => this.addPackage(pkg)

        );

    }

    export() {

        return [...this.packages];

    }

    /* ======================================================
       SERIALIZATION
    ====================================================== */

    toJSON() {

        return {

            packages: this.export()

        };

    }

}

export default LatexPackageManager;