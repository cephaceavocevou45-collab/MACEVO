/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : HtmlEngine.js
 * Version : 1.0.0
 * Statut : Fonctionnel
 * ============================================================
 */

class HtmlEngine {
    constructor() {}

    async export(html) {
        try {
            console.log("Exportation du document en HTML...");
            await new Promise((resolve) => setTimeout(resolve, 600));

            const fullHtml = this.wrapHtmlDocument(html);
            this.downloadFile(fullHtml, "document.html", "text/html");

            alert("Document exporté en HTML avec succès !");
            return true;
        } catch (error) {
            console.error("Erreur lors de l'export HTML :", error);
            alert("Échec de l'exportation en HTML.");
            return false;
        }
    }

    async preview(html) {
        try {
            console.log("Génération de l'aperçu HTML...");
            const previewWindow = window.open("", "_blank", "noopener,noreferrer");

            if (!previewWindow) {
                alert("Le navigateur a bloqué la fenêtre d’aperçu.");
                return false;
            }

            previewWindow.document.open();
            previewWindow.document.write(this.wrapHtmlDocument(html));
            previewWindow.document.close();
            return true;
        } catch (error) {
            console.error("Erreur lors de l'aperçu HTML :", error);
            alert("Impossible d'afficher l'aperçu HTML.");
            return false;
        }
    }

    async download(html) {
        return this.export(html);
    }

    wrapHtmlDocument(content) {
        return `<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document Macevo</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            color: #1f2937;
            line-height: 1.6;
            background-color: #f9fafb;
        }
        .document-container {
            background: #ffffff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        h1, h2, h3, h4, h5, h6 {
            color: #111827;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        p {
            margin-bottom: 1em;
        }
    </style>
</head>
<body>
    <div class="document-container">
        ${content}
    </div>
</body>
</html>`;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

const htmlEngine = new HtmlEngine();
export default htmlEngine;