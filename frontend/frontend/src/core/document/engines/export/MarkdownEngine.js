/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : MarkdownEngine.js
 * Version : 1.0.0
 * Statut : Fonctionnel
 * ============================================================
 */

class MarkdownEngine {
    constructor() {
        this.turndownService = null; // Prêt pour une intégration avec turndown ou un convertisseur équivalent
    }

    async export(html) {
        try {
            console.log("Exportation du document en Markdown...");
            await new Promise((resolve) => setTimeout(resolve, 800));

            const markdownContent = this.htmlToMarkdown(html);
            this.downloadFile(markdownContent, "document.md", "text/markdown");

            alert("Document exporté en Markdown avec succès !");
            return true;
        } catch (error) {
            console.error("Erreur lors de l'export Markdown :", error);
            alert("Échec de l'exportation en Markdown.");
            return false;
        }
    }

    async preview(html) {
        try {
            console.log("Génération de l'aperçu Markdown...");
            const markdownContent = this.htmlToMarkdown(html);

            const previewWindow = window.open("", "_blank", "noopener,noreferrer");

            if (!previewWindow) {
                alert("Le navigateur a bloqué la fenêtre d’aperçu.");
                return false;
            }

            previewWindow.document.open();
            previewWindow.document.write(`
                <!doctype html>
                <html lang="fr">
                <head>
                    <meta charset="utf-8" />
                    <title>Aperçu Markdown - Macevo</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 32px;
                            background: #0f172a;
                            color: #e2e8f0;
                            font-family: Consolas, "Courier New", monospace;
                            line-height: 1.6;
                        }
                        pre {
                            white-space: pre-wrap;
                            word-break: break-word;
                            background: #1e293b;
                            padding: 20px;
                            border-radius: 8px;
                            border: 1px solid #334155;
                        }
                    </style>
                </head>
                <body>
                    <pre>${this.escapeHtml(markdownContent)}</pre>
                </body>
                </html>
            `);
            previewWindow.document.close();
            return true;
        } catch (error) {
            console.error("Erreur lors de l'aperçu Markdown :", error);
            alert("Impossible d'afficher l'aperçu Markdown.");
            return false;
        }
    }

    async download(html) {
        return this.export(html);
    }

    htmlToMarkdown(html) {
        // Conversion basique robuste (peut être remplacée par une librairie dédiée si besoin)
        let md = html;
        md = md.replace(/<h1>(.*?)<\/h1>/gi, "# $1\n\n");
        md = md.replace(/<h2>(.*?)<\/h2>/gi, "## $1\n\n");
        md = md.replace(/<h3>(.*?)<\/h3>/gi, "### $1\n\n");
        md = md.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
        md = md.replace(/<b>(.*?)<\/b>/gi, "**$1**");
        md = md.replace(/<em>(.*?)<\/em>/gi, "*$1*");
        md = md.replace(/<i>(.*?)<\/i>/gi, "*$1*");
        md = md.replace(/<p>(.*?)<\/p>/gi, "$1\n\n");
        md = md.replace(/<br\s*[\/]?>/gi, "\n");
        
        // Nettoyage des balises HTML résiduelles restantes
        const tmp = document.createElement("DIV");
        tmp.innerHTML = md;
        return tmp.textContent || tmp.innerText || "";
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

    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

const markdownEngine = new MarkdownEngine();
export default markdownEngine;