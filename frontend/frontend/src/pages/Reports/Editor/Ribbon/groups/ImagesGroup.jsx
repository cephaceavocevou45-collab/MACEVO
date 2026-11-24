/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : ImagesGroup.jsx
 * Version : 3.0.0
 * Statut  : Insertion d'images scientifique
 * ===========================================================
 */

import { useState } from "react";
import {
    Image as ImageIcon,
    Link2,
    FolderOpen,
    Loader2,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useImageEngine } from "../../../../../core/document/engines/ImageEngine";

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
        "Impossible d'insérer l'image."
    );
}

function ImagesGroup() {
    const imageEngine = useImageEngine();

    const [activeAction, setActiveAction] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    /*
     * Le moteur d'images reste la source de vérité.
     * On ne recrée aucune logique d'insertion ici.
     */
    if (!imageEngine) {
        return null;
    }

    /* ======================================================
       IMAGE DEPUIS L'ORDINATEUR
    ====================================================== */

    async function handleOpenImage() {
        if (
            typeof imageEngine.openImage !==
            "function"
        ) {
            setErrorMessage(
                "La fonction d'ouverture d'image n'est pas disponible."
            );
            return;
        }

        setActiveAction("file");
        setErrorMessage("");

        try {
            await imageEngine.openImage();
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de l'ouverture d'une image.",
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
       IMAGE DEPUIS UNE URL
    ====================================================== */

    async function handleInsertImageUrl() {
        if (
            typeof imageEngine.insertImageUrl !==
            "function"
        ) {
            setErrorMessage(
                "La fonction d'insertion d'image par URL n'est pas disponible."
            );
            return;
        }

        setActiveAction("url");
        setErrorMessage("");

        try {
            await imageEngine.insertImageUrl();
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de l'insertion d'une image par URL.",
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
            title="Images"
            className="w-[210px] min-w-[210px]"
        >
            <div className="flex h-full items-center gap-1">
                <RibbonButton
                    icon={
                        activeAction === "file"
                            ? Loader2
                            : ImageIcon
                    }
                    label="Image"
                    tooltip="Insérer une image dans le document"
                    onClick={handleOpenImage}
                    disabled={isBusy}
                />

                <RibbonButton
                    icon={FolderOpen}
                    label="Depuis PC"
                    tooltip="Choisir une image depuis votre ordinateur"
                    onClick={handleOpenImage}
                    disabled={isBusy}
                />

                <RibbonButton
                    icon={
                        activeAction === "url"
                            ? Loader2
                            : Link2
                    }
                    label="Depuis URL"
                    tooltip="Insérer une image à partir d'une URL"
                    onClick={handleInsertImageUrl}
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

export default ImagesGroup;