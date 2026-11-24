/**
 * ============================================================
 * MACEVO — ÉDITEUR SCIENTIFIQUE
 *
 * ------------------------------------------------------------
 * Fichier : PDFGroup.jsx
 * Version : 3.0.0
 * Statut  : Export PDF — stable
 * ============================================================
 */

import { useState } from "react";

import {
    FileText,
    Download,
    Eye,
    Loader2,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";
import { useLayoutContext } from "../../LayoutContext";


function PDFGroup() {
    const { editor, currentDocument, documentTitle } = useEditorContext();
    const { layout } = useLayoutContext();

    const [loadingAction, setLoadingAction] = useState(null);
    const [error, setError] = useState("");

    if (!editor) {
        return null;
    }

    /**
     * ---------------------------------------------------------
     * Préparation du document
     * ---------------------------------------------------------
     */

    const getDocumentHTML = () => {
        const html = editor.getHTML();

        if (!html || !html.trim()) {
            throw new Error("Le document est vide.");
        }

        return html;
    };

    /**
     * ---------------------------------------------------------
     * Exécution sécurisée d'une opération PDF
     * ---------------------------------------------------------
     */

    const runPDFAction = async (action, method) => {
        if (loadingAction) {
            return;
        }

        setError("");
        setLoadingAction(action);

        try {
            const html = getDocumentHTML();

            const { default: pdfEngine } = await import("../../../../../core/document/engines/export/PdfEngine");
            const operation = pdfEngine?.[method];

            if (typeof operation !== "function") {
                throw new Error(
                    "Le moteur PDF ne fournit pas cette opération."
                );
            }

            const pageMargins = layout?.margins || {};
            pdfEngine.configure({
                pageSize: String(layout?.pageSize || "A4").toLowerCase(),
                orientation: layout?.orientation || "portrait",
                margins: {
                    top: Number(pageMargins.top ?? 25.4),
                    right: Number(pageMargins.right ?? 25.4),
                    bottom: Number(pageMargins.bottom ?? 25.4),
                    left: Number(pageMargins.left ?? 25.4),
                },
                fileName: `${(currentDocument?.title || documentTitle || "document-scientifique")
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-zA-Z0-9-_]+/g, "-")
                    .replace(/^-+|-+$/g, "") || "document-scientifique"}.pdf`,
            });

            await Promise.resolve(operation.call(pdfEngine, html));
        } catch (err) {
            console.error(
                `[MACEVO PDF] Erreur lors de l'opération "${action}" :`,
                err
            );

            setError(
                err?.message ||
                    "Une erreur est survenue lors du traitement du PDF."
            );
        } finally {
            setLoadingAction(null);
        }
    };

    /**
     * ---------------------------------------------------------
     * Export PDF
     * ---------------------------------------------------------
     */

    const exportPDF = () => {
        runPDFAction("export", "export");
    };

    /**
     * ---------------------------------------------------------
     * Aperçu PDF
     * ---------------------------------------------------------
     */

    const previewPDF = () => {
        runPDFAction("preview", "preview");
    };

    /**
     * ---------------------------------------------------------
     * Téléchargement PDF
     * ---------------------------------------------------------
     */

    const downloadPDF = () => {
        runPDFAction("download", "download");
    };

    const isLoading = Boolean(loadingAction);

    return (
        <RibbonGroup title="PDF">
            <RibbonButton
                icon={
                    loadingAction === "export"
                        ? Loader2
                        : FileText
                }
                label="Exporter"
                tooltip="Exporter le document au format PDF"
                onClick={exportPDF}
                disabled={isLoading}
                className={
                    loadingAction === "export"
                        ? "animate-spin"
                        : undefined
                }
            />

            <RibbonButton
                icon={
                    loadingAction === "preview"
                        ? Loader2
                        : Eye
                }
                label="Aperçu"
                tooltip="Afficher un aperçu du document PDF"
                onClick={previewPDF}
                disabled={isLoading}
                className={
                    loadingAction === "preview"
                        ? "animate-spin"
                        : undefined
                }
            />

            <RibbonButton
                icon={
                    loadingAction === "download"
                        ? Loader2
                        : Download
                }
                label="Télécharger"
                tooltip="Télécharger le document au format PDF"
                onClick={downloadPDF}
                disabled={isLoading}
                className={
                    loadingAction === "download"
                        ? "animate-spin"
                        : undefined
                }
            />

            {error && (
                <div
                    className="
                        absolute
                        mt-[70px]
                        flex
                        items-center
                        gap-1
                        max-w-[260px]
                        px-2
                        py-1
                        text-[10px]
                        text-red-600
                        bg-red-50
                        border
                        border-red-200
                        rounded
                        shadow-sm
                        z-50
                    "
                    role="alert"
                >
                    <AlertCircle
                        size={12}
                        className="shrink-0"
                    />

                    <span>{error}</span>
                </div>
            )}
        </RibbonGroup>
    );
}

export default PDFGroup;
