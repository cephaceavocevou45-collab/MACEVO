/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : LatexDownloader.js
 * Description : Téléchargement des documents LaTeX.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

import LatexUtils from "./LatexUtils";

class LatexDownloader {

    constructor() {

        this.defaultFileName = "document.tex";

        this.mimeType = "application/x-tex;charset=utf-8";

    }

    /* ======================================================
       CONFIGURATION
    ====================================================== */

    configure(options = {}) {

        if (options.fileName) {

            this.defaultFileName = options.fileName;

        }

        if (options.mimeType) {

            this.mimeType = options.mimeType;

        }

    }

    /* ======================================================
       TELECHARGEMENT
    ====================================================== */

    download(content, fileName = this.defaultFileName) {

        if (!content || !content.trim()) {

            return {

                success: false,

                message: "Le document LaTeX est vide."

            };

        }

        const blob = new Blob(

            [content],

            {

                type: this.mimeType

            }

        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = fileName;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        return {

            success: true,

            fileName,

            size: blob.size,

            downloadedAt: new Date()

        };

    }

    /* ======================================================
       EXPORT
    ====================================================== */

    export(content, fileName) {

        return this.download(

            content,

            fileName

        );

    }

    /* ======================================================
       ETAT
    ====================================================== */

    getConfiguration() {

        return {

            fileName: this.defaultFileName,

            mimeType: this.mimeType

        };

    }

    reset() {

        this.defaultFileName = "document.tex";

        this.mimeType = "application/x-tex;charset=utf-8";

    }

    /* ======================================================
       SERIALIZATION
    ====================================================== */

    toJSON() {

        return this.getConfiguration();

    }

}

export default LatexDownloader;