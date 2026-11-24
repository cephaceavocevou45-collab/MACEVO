/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : CompilerService.js
 * Description : Gestionnaire des compilateurs LaTeX.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

class CompilerService {

    constructor() {

        this.compilers = new Map();

        this.defaultCompiler = null;

    }

    /* ======================================================
       ENREGISTREMENT
    ====================================================== */

    register(name, compiler) {

        this.compilers.set(name, compiler);

        if (!this.defaultCompiler) {

            this.defaultCompiler = name;

        }

    }

    unregister(name) {

        this.compilers.delete(name);

    }

    /* ======================================================
       COMPILATEURS
    ====================================================== */

    get(name) {

        return this.compilers.get(name);

    }

    getAll() {

        return [...this.compilers.keys()];

    }

    has(name) {

        return this.compilers.has(name);

    }

    /* ======================================================
       COMPILATEUR PAR DÉFAUT
    ====================================================== */

    setDefault(name) {

        if (!this.has(name)) {

            throw new Error(

                `Le compilateur "${name}" n'existe pas.`

            );

        }

        this.defaultCompiler = name;

    }

    getDefault() {

        return this.get(this.defaultCompiler);

    }

    getDefaultName() {

        return this.defaultCompiler;

    }

    /* ======================================================
       COMPILATION
    ====================================================== */

    async compile(latex) {

        const compiler = this.getDefault();

        if (!compiler) {

            throw new Error(

                "Aucun compilateur enregistré."

            );

        }

        return await compiler.compile(latex);

    }

    /* ======================================================
       RESET
    ====================================================== */

    clear() {

        this.compilers.clear();

        this.defaultCompiler = null;

    }

}

const compilerService = new CompilerService();

export default compilerService;