/**
 * ==========================================================
 * MACEVO
 *
 * Fichier : LatexCompiler.js
 * Description : Point d'entrée du compilateur LaTeX
 * Version : 1.0.1
 * ==========================================================
 */

import latexCompilerEngine
    from "../../latex/compiler/LatexCompileEngine";


class LatexCompiler {

    /**
     * ======================================================
     * COMPILATION
     * ======================================================
     */

    async compile(latex = "", assets = []) {

        return await latexCompilerEngine.compile(
            latex,
            assets
        );

    }


    /**
     * ======================================================
     * PDF
     * ======================================================
     */

    async compilePdf(latex = "") {

        const result =
            await this.compile(latex);

        return result?.pdf ?? null;

    }


    /**
     * ======================================================
     * STATISTIQUES
     * ======================================================
     */

    async compileStatistics(latex = "") {

        const result =
            await this.compile(latex);

        return result?.statistics ?? {};

    }


    /**
     * ======================================================
     * LOGS
     * ======================================================
     */

    async compileLogs(latex = "") {

        const result =
            await this.compile(latex);

        return result?.logs ?? [];

    }


    /**
     * ======================================================
     * VALIDITÉ
     * ======================================================
    */

    async isValid(latex = "") {

        const result =
            await this.compile(latex);

        return Boolean(
            result?.success
        );

    }

}


const latexCompiler =
    new LatexCompiler();


export default latexCompiler;
