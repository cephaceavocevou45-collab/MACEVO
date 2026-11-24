/**
 * ==========================================================
 * MACEVO — ÉDITEUR SCIENTIFIQUE
 * ----------------------------------------------------------
 * Fichier : PrintGroup.jsx
 * Version : 3.0.0
 * Statut  : Impression — stable
 * ==========================================================
 */

import { useState } from "react";

import {
    Printer,
    Eye,
    Settings,
    Loader2,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import printEngine from "../../../../../core/document/engines/export/PrintEngine";

function PrintGroup() {
    const { editor } = useEditorContext();

    const [loadingAction, setLoadingAction] = useState(null);
    const [error, setError] = useState("");

    if (!editor) {
        return null;
    }

    /**
     * ---------------------------------------------------------
     * Récupération du document
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
     * Exécution sécurisée d'une opération d'impression
     * ---------------------------------------------------------
     */

    const runPrintAction = async (action, operation, requiresDocument = true) => {
        if (loadingAction) {
            return;
        }

        setError("");
        setLoadingAction(action);

        try {
            let result;

            if (requiresDocument) {
                const html = getDocumentHTML();
                result = operation(html);
            } else {
                result = operation();
            }

            await Promise.resolve(result);
        } catch (err) {
            console.error(
                `[MACEVO Print] Erreur lors de l'opération "${action}" :`,
                err
            );

            setError(
                err?.message ||
                    "Une erreur est survenue lors du traitement de l'impression."
            );
        } finally {
            setLoadingAction(null);
        }
    };

    /**
     * ---------------------------------------------------------
     * Impression directe
     * ---------------------------------------------------------
     */

    const printDocument = () => {
        runPrintAction(
            "print",
            printEngine?.print
                ? (html) => printEngine.print(html)
                : () => {
                      throw new Error(
                          "Le moteur d'impression ne fournit pas la fonction print()."
                      );
                  }
        );
    };

    /**
     * ---------------------------------------------------------
     * Aperçu avant impression
     * ---------------------------------------------------------
     */

    const previewPrint = () => {
        runPrintAction(
            "preview",
            printEngine?.preview
                ? (html) => printEngine.preview(html)
                : () => {
                      throw new Error(
                          "Le moteur d'impression ne fournit pas la fonction preview()."
                      );
                  }
        );
    };

    /**
     * ---------------------------------------------------------
     * Options d'impression
     * ---------------------------------------------------------
     *
     * Les options sont volontairement exécutées sans HTML :
     * printEngine.settings() possède sa propre logique.
     */

    const settingsPrint = () => {
        runPrintAction(
            "settings",
            printEngine?.settings
                ? () => printEngine.settings()
                : () => {
                      throw new Error(
                          "Le moteur d'impression ne fournit pas la fonction settings()."
                      );
                  },
            false
        );
    };

    const isLoading = Boolean(loadingAction);

    return (
        <RibbonGroup title="Impression">
            <RibbonButton
                icon={
                    loadingAction === "print"
                        ? Loader2
                        : Printer
                }
                label="Imprimer"
                tooltip="Imprimer le document"
                onClick={printDocument}
                disabled={isLoading}
                className={
                    loadingAction === "print"
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
                tooltip="Afficher l'aperçu avant impression"
                onClick={previewPrint}
                disabled={isLoading}
                className={
                    loadingAction === "preview"
                        ? "animate-spin"
                        : undefined
                }
            />

            <RibbonButton
                icon={
                    loadingAction === "settings"
                        ? Loader2
                        : Settings
                }
                label="Options"
                tooltip="Configurer les options d'impression"
                onClick={settingsPrint}
                disabled={isLoading}
                className={
                    loadingAction === "settings"
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
                        max-w-[270px]
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

export default PrintGroup;