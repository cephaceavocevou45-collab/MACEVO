/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : PrintEngine.js
 * Version : 1.0.0
 * Statut : Fonctionnel
 * ============================================================
 */

class PrintEngine {
    constructor() {
        this.options = {
            orientation: "portrait",
            margins: "default",
            color: true,
        };
    }

    async print(html) {
        try {
            console.log("Préparation de l'impression...");
            const printWindow = window.open("", "_blank", "noopener,noreferrer");

            if (!printWindow) {
                alert("Le navigateur a bloqué la fenêtre d'impression.");
                return false;
            }

            printWindow.document.open();
            printWindow.document.write(`
                <!doctype html>
                <html lang="fr">
                <head>
                    <meta charset="utf-8" />
                    <title>Impression - Macevo</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            color: #000;
                            background: #fff;
                            line-height: 1.5;
                        }
                        @media print {
                            body {
                                margin: 0;
                            }
                        }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
                </html>
            `);
            printWindow.document.close();

            // Attendre le chargement des ressources avant de lancer l'impression
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            };

            return true;
        } catch (error) {
            console.error("Erreur lors de l'impression :", error);
            alert("Impossible de lancer l'impression du document.");
            return false;
        }
    }

    async preview(html) {
        try {
            console.log("Génération de l'aperçu avant impression...");
            const previewWindow = window.open("", "_blank", "noopener,noreferrer");

            if (!previewWindow) {
                alert("Le navigateur a bloqué la fenêtre d'aperçu.");
                return false;
            }

            previewWindow.document.open();
            previewWindow.document.write(`
                <!doctype html>
                <html lang="fr">
                <head>
                    <meta charset="utf-8" />
                    <title>Aperçu avant impression - Macevo</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            max-width: 800px;
                            margin: 40px auto;
                            padding: 40px;
                            color: #333;
                            background: #f3f4f6;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        .page-container {
                            background: #fff;
                            padding: 40px;
                            min-height: 100vh;
                        }
                    </style>
                </head>
                <body>
                    <div class="page-container">
                        ${html}
                    </div>
                </body>
                </html>
            `);
            previewWindow.document.close();
            return true;
        } catch (error) {
            console.error("Erreur lors de l'aperçu avant impression :", error);
            alert("Impossible d'afficher l'aperçu.");
            return false;
        }
    }

    async settings() {
        try {
            console.log("Ouverture des options d'impression...");
            // Simulation d'une modale ou d'un panneau de configuration des options d'impression
            alert("Options d'impression : Configuration par défaut active (Orientation : Portrait, Marges : Standard).");
            return this.options;
        } catch (error) {
            console.error("Erreur lors de l'ouverture des options :", error);
            alert("Impossible d'ouvrir les options d'impression.");
            return null;
        }
    }
}

const printEngine = new PrintEngine();
export default printEngine;