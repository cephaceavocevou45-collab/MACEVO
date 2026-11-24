/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : LatexEngine.js
 * Description : Moteur principal d'export LaTeX.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

import LatexBuilder from "./LatexBuilder";
import { LatexConverter } from "./LatexConverter";
import LatexDownloader from "./LatexDownloader";
import LatexPackageManager from "./LatexPackageManager";
import LatexPreview from "./LatexPreview";
import LatexStatistics from "./LatexStatistics";
import LatexValidator from "./LatexValidator";

class LatexEngine {

    constructor() {

        this.builder = new LatexBuilder();

        this.converter = new LatexConverter();

        this.downloader = new LatexDownloader();

        this.packageManager = new LatexPackageManager();

        this.previewer = new LatexPreview();

        this.validator = new LatexValidator();

        this.statistics = new LatexStatistics();

        this.lastLatex = "";

        this.lastHtml = "";

    }

    /* ======================================================
        CONFIGURATION
    ====================================================== */

    configure(options = {}) {

        if (options.builder) {

            this.builder.configure(options.builder);

        }

        if (options.packages) {

            this.packageManager.import(options.packages);

        }

        if (options.downloader) {

            this.downloader.configure(options.downloader);

        }

        if (options.preview) {

            this.previewer.configure(options.preview);

        }

        if (options.converter) {

            this.converter.configure(options.converter);

        }

    }

    /* ======================================================
        EXPORT
    ====================================================== */

    export(html = "") {

        const validation = this.validator.validate(html);

        if (!validation.valid) {

            return {

                success: false,

                validation

            };

        }

        const body = this.converter.convert(html);

        const latex = this.builder.build({

            body,

            packages: this.packageManager.getPackages()

        });

        this.lastHtml = html;

        this.lastLatex = latex;

        return {

            success: true,

            format: "latex",

            content: latex,

            statistics: this.statistics.compute(html),

            validation

        };

    }

    /* ======================================================
        APERCU
    ====================================================== */

    preview(html = "") {

        if (html) {

            const result = this.export(html);

            if (!result.success) {

                return result;

            }

        }

        return this.previewer.open(

            this.lastLatex

        );

    }

    /* ======================================================
        TELECHARGEMENT
    ====================================================== */

    download(html = "", fileName = "document.tex") {

        if (html) {

            const result = this.export(html);

            if (!result.success) {

                return result;

            }

        }

        return this.downloader.download(

            this.lastLatex,

            fileName

        );

    }

    /* ======================================================
        GETTERS
    ====================================================== */

    getLatex() {

        return this.lastLatex;

    }

    getHTML() {

        return this.lastHtml;

    }

    getStatistics() {

        return this.statistics.getStatistics();

    }

    getPackages() {

        return this.packageManager.getPackages();

    }

    /* ======================================================
        RESET
    ====================================================== */

    reset() {

        this.lastLatex = "";

        this.lastHtml = "";

        this.validator.reset();

        this.statistics.reset();

        if (typeof this.converter.clear === 'function') {
            this.converter.clear();
        } else if (typeof this.converter.reset === 'function') {
            this.converter.reset();
        }

    }

    /* ======================================================
        SERIALIZATION
    ====================================================== */

    toJSON() {

        return {

            html: this.lastHtml,

            latex: this.lastLatex,

            packages: this.getPackages(),

            statistics: this.getStatistics()

        };

    }

}

const latexEngine = new LatexEngine();

export default latexEngine;