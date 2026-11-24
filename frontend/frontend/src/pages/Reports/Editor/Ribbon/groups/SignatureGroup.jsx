 /**
  * ==========================================================
  * MACEVO — ÉDITEUR SCIENTIFIQUE
  * ----------------------------------------------------------
  * Fichier : SignatureGroup.jsx
  * Version : 3.0.0
  * Statut  : Signature professionnelle
  * ==========================================================
  */

import { useState } from "react";

import {
    Signature,
    PenTool,
    ShieldCheck,
    Loader2,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import signatureEngine from "../../../../../core/document/engines/export/SignatureEngine";

function SignatureGroup() {
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
                "[MACEVO Signature] Impossible de lire le document :",
                error
            );

            return "";
        }
    };

    /**
     * ---------------------------------------------------------
     * EXÉCUTER UNE ACTION
     * ---------------------------------------------------------
     */

    const runSignatureAction = async (
        action,
        engineMethod,
        requiresDocument = true
    ) => {
        if (loadingAction) {
            return;
        }

        setErrorMessage("");

        let html = "";

        if (requiresDocument) {
            html = getDocumentHTML();

            if (!html.trim()) {
                setErrorMessage(
                    "Le document est vide. Ajoutez du contenu avant de continuer."
                );
                return;
            }
        }

        if (
            !signatureEngine ||
            typeof signatureEngine[engineMethod] !==
                "function"
        ) {
            setErrorMessage(
                `L'action « ${action} » n'est pas disponible dans le moteur de signature.`
            );
            return;
        }

        setLoadingAction(action);

        try {
            if (requiresDocument) {
                await Promise.resolve(
                    signatureEngine[engineMethod](html)
                );
            } else {
                await Promise.resolve(
                    signatureEngine[engineMethod]()
                );
            }
        } catch (error) {
            console.error(
                `[MACEVO Signature] Erreur lors de l'action "${action}" :`,
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
     * SIGNER
     * ---------------------------------------------------------
     */

    const signDocument = () =>
        runSignatureAction(
            "Signer",
            "sign",
            true
        );

    /**
     * ---------------------------------------------------------
     * CRÉER UNE SIGNATURE
     * ---------------------------------------------------------
     */

    const createSignature = () =>
        runSignatureAction(
            "Créer",
            "create",
            false
        );

    /**
     * ---------------------------------------------------------
     * VÉRIFIER
     * ---------------------------------------------------------
     */

    const verifySignature = () =>
        runSignatureAction(
            "Vérifier",
            "verify",
            true
        );

    const isBusy = Boolean(
        loadingAction
    );

    return (
        <RibbonGroup
            title="Signature"
            width="w-[150px] min-w-[150px]"
        >
            <div className="flex items-center justify-center gap-1 w-full">
                {/* =================================================
                    SIGNER
                   ================================================= */}

                <RibbonButton
                    icon={
                        loadingAction === "Signer"
                            ? Loader2
                            : Signature
                    }
                    label="Signer"
                    tooltip="Signer le document"
                    onClick={signDocument}
                    active={
                        loadingAction === "Signer"
                    }
                    disabled={isBusy}
                    className={
                        loadingAction === "Signer"
                            ? "animate-spin"
                            : ""
                    }
                />

                {/* =================================================
                    CRÉER
                   ================================================= */}

                <RibbonButton
                    icon={
                        loadingAction === "Créer"
                            ? Loader2
                            : PenTool
                    }
                    label="Créer"
                    tooltip="Créer une signature"
                    onClick={createSignature}
                    active={
                        loadingAction === "Créer"
                    }
                    disabled={isBusy}
                    className={
                        loadingAction === "Créer"
                            ? "animate-spin"
                            : ""
                    }
                />

                {/* =================================================
                    VÉRIFIER
                   ================================================= */}

                <RibbonButton
                    icon={
                        loadingAction === "Vérifier"
                            ? Loader2
                            : ShieldCheck
                    }
                    label="Vérifier"
                    tooltip="Vérifier la signature du document"
                    onClick={verifySignature}
                    active={
                        loadingAction === "Vérifier"
                    }
                    disabled={isBusy}
                    className={
                        loadingAction === "Vérifier"
                            ? "animate-spin"
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

export default SignatureGroup;