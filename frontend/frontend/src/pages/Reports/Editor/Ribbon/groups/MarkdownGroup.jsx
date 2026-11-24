/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : MarkdownGroup.jsx
 * Version : 3.0.0
 * Statut  : Export Markdown robuste
 * ==========================================================
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

import { useEditorContext } from "../../EditorContext";

import markdownEngine from "../../../../../core/document/engines/export/MarkdownEngine";

function MarkdownGroup() {
    const { editor } = useEditorContext();

    const [loading, setLoading] = useState(null);
    const [error, setError] = useState("");

    if (!editor) return null;

    /**
     * Récupère le contenu courant.
     */
    const getDocumentHtml = () => {
        const html = editor.getHTML();

        if (!html || !html.trim()) {
            throw new Error("Le document est vide.");
        }

        return html;
    };

    /**
     * EXPORT MARKDOWN
     */
    const exportMarkdown = async () => {
        setError("");
        setLoading("export");

        try {
            const html = getDocumentHtml();

            const result = await Promise.resolve(
                markdownEngine.export(html)
            );

            /*
             * Certains moteurs effectuent directement
             * le téléchargement/export et ne retournent rien.
             * On ne considère donc pas l'absence de résultat
             * comme une erreur.
             */
            return result;
        } catch (err) {
            console.error(
                "[MACEVO] Erreur export Markdown :",
                err
            );

            setError(
                err?.message ||
                    "Impossible d'exporter le document en Markdown."
            );
        } finally {
            setLoading(null);
        }
    };

    /**
     * APERÇU MARKDOWN
     */
    const previewMarkdown = async () => {
        setError("");
        setLoading("preview");

        try {
            const html = getDocumentHtml();

            await Promise.resolve(
                markdownEngine.preview(html)
            );
        } catch (err) {
            console.error(
                "[MACEVO] Erreur aperçu Markdown :",
                err
            );

            setError(
                err?.message ||
                    "Impossible de générer l'aperçu Markdown."
            );
        } finally {
            setLoading(null);
        }
    };

    /**
     * TÉLÉCHARGEMENT MARKDOWN
     */
    const downloadMarkdown = async () => {
        setError("");
        setLoading("download");

        try {
            const html = getDocumentHtml();

            await Promise.resolve(
                markdownEngine.download(html)
            );
        } catch (err) {
            console.error(
                "[MACEVO] Erreur téléchargement Markdown :",
                err
            );

            setError(
                err?.message ||
                    "Impossible de télécharger le fichier Markdown."
            );
        } finally {
            setLoading(null);
        }
    };

    const isLoading = Boolean(loading);

    return (
        <RibbonGroup title="Markdown">
            <div className="flex items-center gap-1">
                <RibbonButton
                    icon={
                        loading === "export"
                            ? Loader2
                            : FileCode2
                    }
                    label="Exporter"
                    tooltip="Exporter le document en Markdown"
                    onClick={exportMarkdown}
                    disabled={isLoading}
                />

                <RibbonButton
                    icon={
                        loading === "preview"
                            ? Loader2
                            : Eye
                    }
                    label="Aperçu"
                    tooltip="Prévisualiser le document Markdown"
                    onClick={previewMarkdown}
                    disabled={isLoading}
                />

                <RibbonButton
                    icon={
                        loading === "download"
                            ? Loader2
                            : Download
                    }
                    label="Télécharger"
                    tooltip="Télécharger le fichier Markdown"
                    onClick={downloadMarkdown}
                    disabled={isLoading}
                />
            </div>

            {error && (
                <div className="mt-1 flex items-start gap-1.5 px-1 text-[10px] leading-tight text-red-600">
                    <AlertCircle
                        size={12}
                        className="mt-[1px] shrink-0"
                    />

                    <span>{error}</span>
                </div>
            )}
        </RibbonGroup>
    );
}

export default MarkdownGroup;