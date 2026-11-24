/**
 * ==========================================================
 * MACEVO
 *
 * Fichier : LatexDownloader.js
 * Description : Téléchargement des documents LaTeX et PDF
 * Version : 1.0.0
 * ==========================================================
 */

class LatexDownloader {

    /**
     * Télécharge du code LaTeX sous forme de fichier .tex
     */
    downloadLatex(latex = "", filename = "document.tex") {

        if (
            typeof latex !== "string" ||
            !latex.trim()
        ) {
            return false;
        }

        const blob = new Blob(
            [latex],
            {
                type: "application/x-tex;charset=utf-8"
            }
        );

        return this.downloadBlob(
            blob,
            this.ensureExtension(filename, ".tex")
        );
    }


    /**
     * Télécharge un contenu texte sous forme de fichier
     */
    downloadText(content = "", filename = "document.txt") {

        if (
            typeof content !== "string"
        ) {
            return false;
        }

        const blob = new Blob(
            [content],
            {
                type: "text/plain;charset=utf-8"
            }
        );

        return this.downloadBlob(
            blob,
            this.ensureExtension(filename, ".txt")
        );
    }


    /**
     * Télécharge un PDF à partir d'une URL
     */
    downloadPdfFromUrl(
        url,
        filename = "document.pdf"
    ) {

        if (
            typeof url !== "string" ||
            !url.trim()
        ) {
            return false;
        }

        const link =
            document.createElement("a");

        link.href = url;
        link.download =
            this.ensureExtension(
                filename,
                ".pdf"
            );

        link.target = "_blank";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        return true;
    }


    /**
     * Télécharge un Blob
     */
    downloadBlob(blob, filename) {

        if (!blob) {
            return false;
        }

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        setTimeout(
            () => URL.revokeObjectURL(url),
            1000
        );

        return true;
    }


    /**
     * Télécharge une réponse HTTP contenant un fichier
     */
    async downloadResponse(
        response,
        filename = "document"
    ) {

        if (
            !response ||
            !response.ok
        ) {
            return false;
        }

        const blob =
            await response.blob();

        return this.downloadBlob(
            blob,
            filename
        );
    }


    /**
     * Vérifie et ajoute une extension
     */
    ensureExtension(
        filename,
        extension
    ) {

        let name =
            String(
                filename || "document"
            ).trim();

        if (!name) {
            name = "document";
        }

        if (
            !name
                .toLowerCase()
                .endsWith(
                    extension.toLowerCase()
                )
        ) {
            name += extension;
        }

        return name;
    }

}


const latexDownloader =
    new LatexDownloader();

export default latexDownloader;