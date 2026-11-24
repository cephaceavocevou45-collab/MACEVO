/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : HTMLGroup.jsx
 * Version : 3.0.0
 * Statut  : Export HTML professionnel
 * ===========================================================
 */

import { useState } from "react";
import {
    Globe,
    Eye,
    Download,
    Loader2,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import htmlEngine from "../../../../../core/document/engines/export/HtmlEngine";

function getErrorMessage(error) {
    if (!error) {
        return "Une erreur inconnue est survenue.";
    }

    if (typeof error === "string") {
        return error;
    }

    return (
        error.message ||
        error.detail ||
        error.error ||
        "L'opération HTML a échoué."
    );
}

function HTMLGroup() {
    const { editor } = useEditorContext();

    const [activeAction, setActiveAction] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    if (!editor) {
        return null;
    }

    /* ======================================================
       RÉCUPÉRER LE CONTENU
    ====================================================== */

    function getDocumentHtml() {
        const html = editor.getHTML();

        if (!html || !html.trim()) {
            setErrorMessage(
                "Le document est vide. Ajoutez du contenu avant de poursuivre."
            );

            return null;
        }

        return html;
    }

    /* ======================================================
       EXPORT HTML
    ====================================================== */

    async function exportHTML() {
        const html = getDocumentHtml();

        if (!html) {
            return;
        }

        setActiveAction("export");
        setErrorMessage("");

        try {
            await htmlEngine.export(html);
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de l'export HTML.",
                error
            );

            setErrorMessage(
                getErrorMessage(error)
            );
        } finally {
            setActiveAction(null);
        }
    }

    /* ======================================================
       APERÇU HTML
    ====================================================== */

    async function previewHTML() {
        const html = getDocumentHtml();

        if (!html) {
            return;
        }

        setActiveAction("preview");
        setErrorMessage("");

        try {
            const result =
                await htmlEngine.preview(html);

            if (!result) {
                setErrorMessage(
                    "Aucun aperçu HTML n'a été généré."
                );

                return;
            }

            /*
             * L'engine peut retourner directement une chaîne
             * HTML. On l'affiche dans une nouvelle fenêtre.
             */
            const previewWindow = window.open(
                "",
                "_blank",
                "noopener,noreferrer"
            );

            if (!previewWindow) {
                setErrorMessage(
                    "Le navigateur a bloqué la fenêtre d'aperçu."
                );

                return;
            }

            previewWindow.document.open();

            previewWindow.document.write(`
                <!doctype html>
                <html lang="fr">
                    <head>
                        <meta charset="utf-8" />
                        <meta
                            name="viewport"
                            content="width=device-width, initial-scale=1"
                        />
                        <title>Aperçu HTML — MACEVO</title>
                    </head>

                    <body>
                        ${String(result)}
                    </body>
                </html>
            `);

            previewWindow.document.close();
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de l'aperçu HTML.",
                error
            );

            setErrorMessage(
                getErrorMessage(error)
            );
        } finally {
            setActiveAction(null);
        }
    }

    /* ======================================================
       TÉLÉCHARGEMENT HTML
    ====================================================== */

    async function downloadHTML() {
        const html = getDocumentHtml();

        if (!html) {
            return;
        }

        setActiveAction("download");
        setErrorMessage("");

        try {
            await htmlEngine.download(html);
        } catch (error) {
            console.error(
                "MACEVO : erreur lors du téléchargement HTML.",
                error
            );

            setErrorMessage(
                getErrorMessage(error)
            );
        } finally {
            setActiveAction(null);
        }
    }

    const isBusy = Boolean(activeAction);

    return (
        <RibbonGroup
            title="HTML"
            className="w-[205px] min-w-[205px]"
        >
            <div className="flex h-full items-center gap-1">
                <RibbonButton
                    icon={
                        activeAction === "export"
                            ? Loader2
                            : Globe
                    }
                    label="Exporter"
                    tooltip="Exporter le document au format HTML"
                    onClick={exportHTML}
                    disabled={isBusy}
                />

                <RibbonButton
                    icon={
                        activeAction === "preview"
                            ? Loader2
                            : Eye
                    }
                    label="Aperçu"
                    tooltip="Prévisualiser le document HTML"
                    onClick={previewHTML}
                    disabled={isBusy}
                />

                <RibbonButton
                    icon={
                        activeAction === "download"
                            ? Loader2
                            : Download
                    }
                    label="Télécharger"
                    tooltip="Télécharger le document HTML"
                    onClick={downloadHTML}
                    disabled={isBusy}
                />
            </div>

            {errorMessage && (
                <div className="mt-1 flex items-start gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[9px] leading-tight text-red-700">
                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />

                    <span>{errorMessage}</span>
                </div>
            )}
        </RibbonGroup>
    );
}

export default HTMLGroup;