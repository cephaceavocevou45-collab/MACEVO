/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : LatexGroup.jsx
 * Version : 3.0.0
 * Statut  : Export LaTeX professionnel et robuste
 * ===========================================================
 */

import { useState } from "react";

import {
    FileCode2,
    Eye,
    Download,
    Loader2,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import latexEngine from "../../../../../core/document/engines/export/latex/LatexEngine";

/**
 * Échappe le contenu LaTeX lorsqu'il doit être affiché
 * comme texte dans la fenêtre d'aperçu HTML.
 *
 * Le code LaTeX ne doit jamais être interprété comme du HTML.
 */
function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function LatexGroup({ editor }) {
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState("");

    if (!editor) return null;

    /**
     * Récupère le HTML courant de l'éditeur.
     */
    const getDocumentHtml = () => {
        const html = editor.getHTML();

        if (!html || !html.trim()) {
            throw new Error("Le document est vide.");
        }

        return html;
    };

    /**
     * Exporte le document en fichier .tex.
     */
    const exportLatex = async () => {
        setError("");
        setLoading("export");

        try {
            const html = getDocumentHtml();

            const latex = await Promise.resolve(
                latexEngine.export(html)
            );

            if (
                latex === undefined ||
                latex === null ||
                String(latex).trim() === ""
            ) {
                throw new Error(
                    "Le moteur LaTeX n'a généré aucun contenu."
                );
            }

            const blob = new Blob(
                [String(latex)],
                {
                    type: "text/plain;charset=utf-8",
                }
            );

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;
            link.download = "document.tex";
            link.style.display = "none";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            /*
             * On laisse au navigateur le temps de commencer
             * le téléchargement avant de libérer l'URL.
             */
            window.setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
        } catch (err) {
            console.error(
                "[MACEVO] Erreur export LaTeX :",
                err
            );

            setError(
                err?.message ||
                    "Impossible d'exporter le document en LaTeX."
            );
        } finally {
            setLoading(null);
        }
    };

    /**
     * Affiche le code LaTeX généré dans une nouvelle fenêtre.
     */
    const previewLatex = async () => {
        setError("");
        setLoading("preview");

        /*
         * Ouverture immédiate afin d'éviter que le navigateur
         * bloque la nouvelle fenêtre après une opération async.
         */
        const win = window.open(
            "",
            "_blank",
            "noopener,noreferrer"
        );

        if (!win) {
            setLoading(null);
            setError(
                "La fenêtre d'aperçu a été bloquée par le navigateur."
            );
            return;
        }

        try {
            const html = getDocumentHtml();

            const latex = await Promise.resolve(
                latexEngine.preview(html)
            );

            if (
                latex === undefined ||
                latex === null ||
                String(latex).trim() === ""
            ) {
                throw new Error(
                    "Le moteur LaTeX n'a généré aucun contenu."
                );
            }

            const safeLatex = escapeHtml(latex);

            win.document.open();

            win.document.write(`
                <!DOCTYPE html>
                <html lang="fr">
                    <head>
                        <meta charset="UTF-8" />
                        <meta
                            name="viewport"
                            content="width=device-width, initial-scale=1.0"
                        />

                        <title>Aperçu LaTeX — MACEVO</title>

                        <style>
                            * {
                                box-sizing: border-box;
                            }

                            body {
                                margin: 0;
                                padding: 32px;
                                background: #f1f5f9;
                                color: #1e293b;
                                font-family:
                                    Inter,
                                    system-ui,
                                    -apple-system,
                                    BlinkMacSystemFont,
                                    "Segoe UI",
                                    sans-serif;
                            }

                            .container {
                                width: min(1200px, 100%);
                                margin: 0 auto;
                            }

                            .header {
                                background: white;
                                border: 1px solid #e2e8f0;
                                border-radius: 10px;
                                padding: 20px 24px;
                                margin-bottom: 16px;
                            }

                            h1 {
                                margin: 0 0 6px;
                                font-size: 20px;
                                font-weight: 700;
                            }

                            .subtitle {
                                margin: 0;
                                color: #64748b;
                                font-size: 13px;
                            }

                            .code-wrapper {
                                background: white;
                                border: 1px solid #e2e8f0;
                                border-radius: 10px;
                                overflow: hidden;
                            }

                            .code-header {
                                padding: 10px 16px;
                                border-bottom: 1px solid #e2e8f0;
                                background: #f8fafc;
                                color: #475569;
                                font-size: 12px;
                                font-weight: 600;
                            }

                            pre {
                                margin: 0;
                                padding: 24px;
                                overflow-x: auto;
                                white-space: pre-wrap;
                                word-break: break-word;
                                font-family:
                                    "Cascadia Code",
                                    "Fira Code",
                                    Consolas,
                                    Monaco,
                                    monospace;
                                font-size: 13px;
                                line-height: 1.65;
                                color: #0f172a;
                                background: white;
                            }
                        </style>
                    </head>

                    <body>
                        <main class="container">
                            <section class="header">
                                <h1>
                                    Code LaTeX
                                </h1>

                                <p class="subtitle">
                                    Code généré par MACEVO — Éditeur scientifique
                                </p>
                            </section>

                            <section class="code-wrapper">
                                <div class="code-header">
                                    document.tex
                                </div>

                                <pre>${safeLatex}</pre>
                            </section>
                        </main>
                    </body>
                </html>
            `);

            win.document.close();
        } catch (err) {
            console.error(
                "[MACEVO] Erreur aperçu LaTeX :",
                err
            );

            try {
                win.close();
            } catch {
                // Rien à faire si la fenêtre ne peut pas être fermée.
            }

            setError(
                err?.message ||
                    "Impossible de générer l'aperçu LaTeX."
            );
        } finally {
            setLoading(null);
        }
    };

    /**
     * Utilise le mécanisme de téléchargement existant
     * du LatexEngine.
     */
    const downloadLatex = async () => {
        setError("");
        setLoading("download");

        try {
            const html = getDocumentHtml();

            const result = await Promise.resolve(
                latexEngine.download(html)
            );

            if (!result) {
                throw new Error(
                    "Le moteur LaTeX n'a retourné aucun fichier."
                );
            }

            /*
             * L'API actuelle du LatexEngine retourne normalement
             * une URL exploitable par le navigateur.
             */
            if (typeof result === "string") {
                const opened = window.open(
                    result,
                    "_blank",
                    "noopener,noreferrer"
                );

                if (!opened) {
                    throw new Error(
                        "Le navigateur a bloqué le téléchargement."
                    );
                }

                return;
            }

            /*
             * Support défensif si le moteur retourne directement
             * un Blob.
             */
            if (result instanceof Blob) {
                const url = URL.createObjectURL(result);

                const link = document.createElement("a");

                link.href = url;
                link.download = "document.tex";
                link.style.display = "none";

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                window.setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 1000);

                return;
            }

            throw new Error(
                "Format de fichier retourné par le moteur LaTeX non pris en charge."
            );
        } catch (err) {
            console.error(
                "[MACEVO] Erreur téléchargement LaTeX :",
                err
            );

            setError(
                err?.message ||
                    "Impossible de télécharger le document LaTeX."
            );
        } finally {
            setLoading(null);
        }
    };

    const isLoading = Boolean(loading);

    return (
        <RibbonGroup title="LaTeX">
            <div className="flex items-center gap-1">
                <RibbonButton
                    icon={
                        loading === "export"
                            ? Loader2
                            : FileCode2
                    }
                    label="Exporter"
                    tooltip="Exporter le document complet en fichier LaTeX"
                    onClick={exportLatex}
                    disabled={isLoading}
                />

                <RibbonButton
                    icon={
                        loading === "preview"
                            ? Loader2
                            : Eye
                    }
                    label="Aperçu"
                    tooltip="Afficher le code LaTeX généré"
                    onClick={previewLatex}
                    disabled={isLoading}
                />

                <RibbonButton
                    icon={
                        loading === "download"
                            ? Loader2
                            : Download
                    }
                    label="Télécharger"
                    tooltip="Télécharger le fichier LaTeX généré"
                    onClick={downloadLatex}
                    disabled={isLoading}
                />
            </div>

            {error && (
                <div className="mt-1 flex items-start gap-1 px-1 text-[10px] leading-tight text-red-600">
                    <AlertCircle
                        size={12}
                        className="mt-[1px] shrink-0"
                    />

                    <span>
                        {error}
                    </span>
                </div>
            )}
        </RibbonGroup>
    );
}

export default LatexGroup;