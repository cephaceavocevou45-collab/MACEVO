/**
 * ==========================================================
 * MACEVO — ÉDITEUR SCIENTIFIQUE
 * ----------------------------------------------------------
 * Fichier : ShareGroup.jsx
 * Version : 3.0.0
 * Statut  : Partage professionnel
 * ==========================================================
 */

import { useState } from "react";

import {
    Share2,
    Mail,
    Link,
    Loader2,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import shareEngine from "../../../../../core/document/engines/export/ShareEngine";

function ShareGroup() {
    const { editor } = useEditorContext();

    const [loadingAction, setLoadingAction] =
        useState(null);

    const [errorMessage, setErrorMessage] =
        useState("");

    if (!editor) {
        return null;
    }

    /**
     * ---------------------------------------------------------
     * RÉCUPÉRER LE DOCUMENT
     * ---------------------------------------------------------
     */

    const getDocumentHTML = () => {
        try {
            return editor.getHTML() || "";
        } catch (error) {
            console.error(
                "[MACEVO Share] Impossible de lire le document :",
                error
            );

            return "";
        }
    };

    /**
     * ---------------------------------------------------------
     * EXÉCUTER UNE ACTION DE PARTAGE
     * ---------------------------------------------------------
     */

    const runShareAction = async (
        action,
        engineMethod
    ) => {
        if (loadingAction) {
            return;
        }

        setErrorMessage("");

        const html = getDocumentHTML();

        if (!html.trim()) {
            setErrorMessage(
                "Le document est vide. Ajoutez du contenu avant de le partager."
            );
            return;
        }

        if (
            !shareEngine ||
            typeof shareEngine[engineMethod] !==
                "function"
        ) {
            setErrorMessage(
                `L'action « ${action} » n'est pas disponible dans le moteur de partage.`
            );
            return;
        }

        setLoadingAction(action);

        try {
            await Promise.resolve(
                shareEngine[engineMethod](html)
            );
        } catch (error) {
            console.error(
                `[MACEVO Share] Erreur lors de l'action "${action}" :`,
                error
            );

            setErrorMessage(
                error?.message ||
                    `Impossible d'exécuter l'action « ${action} ».`
            );
        } finally {
            setLoadingAction(null);
        }
    };

    /**
     * ---------------------------------------------------------
     * ACTIONS
     * ---------------------------------------------------------
     */

    const shareDocument = () =>
        runShareAction(
            "Partager",
            "share"
        );

    const emailDocument = () =>
        runShareAction(
            "E-mail",
            "email"
        );

    const linkDocument = () =>
        runShareAction(
            "Lien",
            "link"
        );

    const isBusy = Boolean(
        loadingAction
    );

    return (
        <RibbonGroup
            title="Partage"
            width="w-[150px] min-w-[150px]"
        >
            <div className="flex items-center justify-center gap-1 w-full">
                {/* =================================================
                    PARTAGER
                   ================================================= */}

                <RibbonButton
                    icon={
                        loadingAction ===
                        "Partager"
                            ? Loader2
                            : Share2
                    }
                    label="Partager"
                    tooltip="Partager le document"
                    onClick={
                        shareDocument
                    }
                    active={
                        loadingAction ===
                        "Partager"
                    }
                    disabled={isBusy}
                    className={
                        loadingAction ===
                        "Partager"
                            ? "animate-pulse"
                            : ""
                    }
                />

                {/* =================================================
                    E-MAIL
                   ================================================= */}

                <RibbonButton
                    icon={
                        loadingAction ===
                        "E-mail"
                            ? Loader2
                            : Mail
                    }
                    label="E-mail"
                    tooltip="Envoyer le document par e-mail"
                    onClick={
                        emailDocument
                    }
                    active={
                        loadingAction ===
                        "E-mail"
                    }
                    disabled={isBusy}
                    className={
                        loadingAction ===
                        "E-mail"
                            ? "animate-pulse"
                            : ""
                    }
                />

                {/* =================================================
                    LIEN
                   ================================================= */}

                <RibbonButton
                    icon={
                        loadingAction ===
                        "Lien"
                            ? Loader2
                            : Link
                    }
                    label="Lien"
                    tooltip="Créer un lien de partage"
                    onClick={
                        linkDocument
                    }
                    active={
                        loadingAction ===
                        "Lien"
                    }
                    disabled={isBusy}
                    className={
                        loadingAction ===
                        "Lien"
                            ? "animate-pulse"
                            : ""
                    }
                />
            </div>

            {/* =====================================================
                ERREUR
               ===================================================== */}

            {errorMessage && (
                <div
                    className="
                        mt-1
                        mx-1
                        flex
                        items-start
                        gap-1.5
                        rounded
                        border
                        border-red-200
                        bg-red-50
                        px-2
                        py-1.5
                        text-[10px]
                        leading-tight
                        text-red-700
                    "
                    role="alert"
                >
                    <AlertCircle
                        size={12}
                        className="mt-[1px] shrink-0"
                    />

                    <span>
                        {errorMessage}
                    </span>
                </div>
            )}
        </RibbonGroup>
    );
}

export default ShareGroup;