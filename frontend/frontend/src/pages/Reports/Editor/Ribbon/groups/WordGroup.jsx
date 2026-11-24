/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : WordGroup.jsx
 * Version : 3.0.0
 * Statut : Professionnel — Export DOCX robuste
 * ============================================================
 */

import { useState } from "react";
import {
    FileType,
    Download,
    Eye,
    Loader2,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import docxEngine from "../../../../../core/document/engines/export/DocxEngine";

function WordGroup() {
    const { editor } = useEditorContext();

    const [loadingAction, setLoadingAction] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    if (!editor) return null;

    function getDocumentHTML() {
        try {
            return editor.getHTML?.() || "";
        } catch (error) {
            console.error("MACEVO — Impossible de récupérer le contenu DOCX :", error);
            return "";
        }
    }

    async function runWordAction(action, engineMethod) {
        if (loadingAction) return;

        setErrorMessage("");

        const html = getDocumentHTML();

        if (!html.trim()) {
            setErrorMessage("Le document est vide. Ajoutez du contenu avant l’export Word.");
            return;
        }

        if (typeof docxEngine?.[engineMethod] !== "function") {
            setErrorMessage(
                `L'opération Word « ${action} » n'est pas disponible dans le moteur DOCX.`
            );
            console.error(
                `MACEVO — docxEngine.${engineMethod}() est introuvable.`
            );
            return;
        }

        setLoadingAction(action);

        try {
            await Promise.resolve(docxEngine[engineMethod](html));
        } catch (error) {
            console.error(
                `MACEVO — Erreur lors de l'opération Word « ${action} » :`,
                error
            );

            setErrorMessage(
                error?.message ||
                    `Une erreur est survenue pendant ${action.toLowerCase()}.`
            );
        } finally {
            setLoadingAction(null);
        }
    }

    function exportWord() {
        return runWordAction("Exportation", "export");
    }

    function previewWord() {
        return runWordAction("Aperçu", "preview");
    }

    function downloadWord() {
        return runWordAction("Téléchargement", "download");
    }

    const isLoading = Boolean(loadingAction);

    return (
        <RibbonGroup
            title="Word"
            className="w-[150px] min-w-[150px]"
        >
            <div className="flex items-center justify-center gap-1 w-full">
                <RibbonButton
                    icon={
                        loadingAction === "Exportation"
                            ? Loader2
                            : FileType
                    }
                    label="Exporter"
                    tooltip="Exporter le document au format Word (.docx)"
                    onClick={exportWord}
                    disabled={isLoading}
                    className={
                        loadingAction === "Exportation"
                            ? "animate-pulse"
                            : ""
                    }
                />

                <RibbonButton
                    icon={
                        loadingAction === "Aperçu"
                            ? Loader2
                            : Eye
                    }
                    label="Aperçu"
                    tooltip="Prévisualiser le document Word"
                    onClick={previewWord}
                    disabled={isLoading}
                    className={
                        loadingAction === "Aperçu"
                            ? "animate-pulse"
                            : ""
                    }
                />

                <RibbonButton
                    icon={
                        loadingAction === "Téléchargement"
                            ? Loader2
                            : Download
                    }
                    label="Télécharger"
                    tooltip="Télécharger le document Word (.docx)"
                    onClick={downloadWord}
                    disabled={isLoading}
                    className={
                        loadingAction === "Téléchargement"
                            ? "animate-pulse"
                            : ""
                    }
                />
            </div>

            {errorMessage && (
                <div
                    className="mt-1 flex items-start gap-1.5 px-1 text-[10px] leading-tight text-red-600"
                    role="alert"
                >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                    <span>{errorMessage}</span>
                </div>
            )}
        </RibbonGroup>
    );
}

export default WordGroup;