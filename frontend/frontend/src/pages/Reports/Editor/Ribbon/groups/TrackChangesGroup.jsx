 /**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : TrackChangesGroup.jsx
 * Version : 4.0.0
 * Statut  : Professionnel — suivi des modifications
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
    FilePenLine,
    Check,
    X,
    History,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import trackChangesEngine from "../../../../../core/document/engines/revision/TrackChangesEngine";


/* ===========================================================
   UTILITAIRES
   =========================================================== */

function normalizeHistory(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    return history;
}


function getHistoryDescription(item) {
    if (!item || typeof item !== "object") {
        return String(item ?? "");
    }

    if (item.description) {
        return String(item.description);
    }

    if (item.text) {
        return String(item.text);
    }

    if (item.message) {
        return String(item.message);
    }

    if (item.action) {
        return String(item.action);
    }

    return "Modification enregistrée.";
}


function getHistoryTimestamp(item) {
    if (!item || typeof item !== "object") {
        return "";
    }

    return (
        item.timestamp ||
        item.date ||
        item.createdAt ||
        item.created_at ||
        ""
    );
}


/* ===========================================================
   COMPOSANT
   =========================================================== */

function TrackChangesGroup() {
    const { editor } = useEditorContext();

    const [isTrackingEnabled, setIsTrackingEnabled] =
        useState(false);

    const [activeModal, setActiveModal] =
        useState(null);

    const [historyList, setHistoryList] =
        useState([]);

    const [feedbackMessage, setFeedbackMessage] =
        useState("");

    const [feedbackType, setFeedbackType] =
        useState("success");


    /* =======================================================
       SYNCHRONISATION INITIALE
    ======================================================= */

    useEffect(() => {
        if (
            typeof trackChangesEngine?.isEnabled ===
            "function"
        ) {
            try {
                setIsTrackingEnabled(
                    Boolean(
                        trackChangesEngine.isEnabled()
                    )
                );
            } catch (error) {
                console.error(
                    "MACEVO — lecture de l'état du suivi impossible :",
                    error
                );

                setIsTrackingEnabled(false);
            }
        }
    }, []);


    /* =======================================================
       FERMETURE AVEC ESC
    ======================================================= */

    useEffect(() => {
        if (!activeModal) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setActiveModal(null);
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [activeModal]);


    /* =======================================================
       FEEDBACK
    ======================================================= */

    const showFeedback = (
        message,
        type = "success"
    ) => {
        setFeedbackMessage(message);
        setFeedbackType(type);
        setActiveModal("action-feedback");
    };


    /* =======================================================
       ACTIVER / DÉSACTIVER LE SUIVI
    ======================================================= */

    const toggleTracking = () => {
        if (
            typeof trackChangesEngine?.isEnabled !==
            "function"
        ) {
            showFeedback(
                "Le moteur de suivi des modifications n'est pas disponible.",
                "error"
            );

            return;
        }

        try {
            const currentlyEnabled =
                Boolean(
                    trackChangesEngine.isEnabled()
                );

            if (currentlyEnabled) {
                if (
                    typeof trackChangesEngine.disable !==
                    "function"
                ) {
                    throw new Error(
                        "La désactivation du suivi n'est pas disponible."
                    );
                }

                trackChangesEngine.disable();

                setIsTrackingEnabled(false);

                showFeedback(
                    "Le suivi des modifications a été désactivé."
                );
            } else {
                if (
                    typeof trackChangesEngine.enable !==
                    "function"
                ) {
                    throw new Error(
                        "L'activation du suivi n'est pas disponible."
                    );
                }

                trackChangesEngine.enable();

                setIsTrackingEnabled(true);

                showFeedback(
                    "Le suivi des modifications a été activé."
                );
            }
        } catch (error) {
            console.error(
                "MACEVO — erreur du suivi des modifications :",
                error
            );

            showFeedback(
                error?.message ||
                    "Impossible de modifier l'état du suivi.",
                "error"
            );
        }
    };


    /* =======================================================
       ACCEPTER LES MODIFICATIONS
    ======================================================= */

    const acceptChanges = () => {
        if (
            typeof trackChangesEngine?.acceptAll !==
            "function"
        ) {
            showFeedback(
                "La fonction d'acceptation des modifications n'est pas disponible.",
                "error"
            );

            return;
        }

        try {
            const result =
                trackChangesEngine.acceptAll();

            const count =
                Number.isFinite(Number(result))
                    ? Number(result)
                    : 0;

            showFeedback(
                count > 0
                    ? `${count} modification(s) acceptée(s) avec succès.`
                    : "Aucune modification à accepter."
            );
        } catch (error) {
            console.error(
                "MACEVO — erreur lors de l'acceptation :",
                error
            );

            showFeedback(
                error?.message ||
                    "Impossible d'accepter les modifications.",
                "error"
            );
        }
    };


    /* =======================================================
       REFUSER LES MODIFICATIONS
    ======================================================= */

    const rejectChanges = () => {
        if (
            typeof trackChangesEngine?.rejectAll !==
            "function"
        ) {
            showFeedback(
                "La fonction de refus des modifications n'est pas disponible.",
                "error"
            );

            return;
        }

        try {
            const result =
                trackChangesEngine.rejectAll();

            const count =
                Number.isFinite(Number(result))
                    ? Number(result)
                    : 0;

            showFeedback(
                count > 0
                    ? `${count} modification(s) refusée(s).`
                    : "Aucune modification à refuser."
            );
        } catch (error) {
            console.error(
                "MACEVO — erreur lors du refus :",
                error
            );

            showFeedback(
                error?.message ||
                    "Impossible de refuser les modifications.",
                "error"
            );
        }
    };


    /* =======================================================
       HISTORIQUE
    ======================================================= */

    const showHistory = () => {
        if (
            typeof trackChangesEngine?.getHistory !==
            "function"
        ) {
            showFeedback(
                "L'historique du suivi des modifications n'est pas disponible.",
                "error"
            );

            return;
        }

        try {
            const history =
                trackChangesEngine.getHistory();

            setHistoryList(
                normalizeHistory(history)
            );

            setActiveModal("history");
        } catch (error) {
            console.error(
                "MACEVO — erreur lors de la lecture de l'historique :",
                error
            );

            showFeedback(
                error?.message ||
                    "Impossible de récupérer l'historique.",
                "error"
            );
        }
    };


    /* =======================================================
       SÉCURITÉ ÉDITEUR
    ======================================================= */

    if (!editor) {
        return null;
    }


    /* =======================================================
       RENDU
    ======================================================= */

    return (
        <RibbonGroup
            title="Suivi"
            className="w-[250px] min-w-[250px]"
        >

            {/* =================================================
                ACTIVER / DÉSACTIVER
            ================================================= */}

            <RibbonButton
                icon={FilePenLine}
                label={
                    isTrackingEnabled
                        ? "Désactiver"
                        : "Activer"
                }
                tooltip={
                    isTrackingEnabled
                        ? "Désactiver le suivi des modifications"
                        : "Activer le suivi des modifications"
                }
                onClick={toggleTracking}
                active={isTrackingEnabled}
            />


            {/* =================================================
                ACCEPTER
            ================================================= */}

            <RibbonButton
                icon={Check}
                label="Accepter"
                tooltip="Accepter toutes les modifications"
                onClick={acceptChanges}
            />


            {/* =================================================
                REFUSER
            ================================================= */}

            <RibbonButton
                icon={X}
                label="Refuser"
                tooltip="Refuser toutes les modifications"
                onClick={rejectChanges}
            />


            {/* =================================================
                HISTORIQUE
            ================================================= */}

            <RibbonButton
                icon={History}
                label="Historique"
                tooltip="Afficher l'historique des modifications"
                onClick={showHistory}
            />


            {/* =================================================
                MODALE HISTORIQUE
            ================================================= */}

            {activeModal === "history" &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setActiveModal(null);
                            }
                        }}
                    >
                        <div
                            className="bg-white rounded-xl shadow-2xl border border-gray-300 w-[580px] max-w-[95vw] overflow-hidden flex flex-col"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="macevo-track-history-title"
                        >

                            {/* HEADER */}

                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3
                                    id="macevo-track-history-title"
                                    className="text-sm font-bold text-gray-800 flex items-center gap-2"
                                >
                                    <History className="w-4 h-4 text-blue-600" />

                                    Historique du suivi des modifications
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded"
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>


                            {/* CONTENU */}

                            <div className="p-6 flex flex-col gap-4 max-h-[65vh] overflow-y-auto bg-slate-50">

                                {historyList.length ===
                                0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center text-gray-500 text-xs">
                                        <Clock className="w-8 h-8 text-gray-300 mb-1" />

                                        <span className="font-medium">
                                            Aucune modification
                                            enregistrée.
                                        </span>

                                        <span className="text-[11px] text-gray-400 max-w-[320px]">
                                            Les modifications détectées
                                            apparaîtront ici lorsque le
                                            suivi sera actif.
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">

                                        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                            {
                                                historyList.length
                                            }{" "}
                                            événement(s)
                                            consigné(s)
                                        </div>

                                        <div className="flex flex-col gap-2">

                                            {historyList.map(
                                                (
                                                    item,
                                                    index
                                                ) => {
                                                    const description =
                                                        getHistoryDescription(
                                                            item
                                                        );

                                                    const timestamp =
                                                        getHistoryTimestamp(
                                                            item
                                                        );

                                                    return (
                                                        <div
                                                            key={
                                                                item?.id ??
                                                                item?.timestamp ??
                                                                index
                                                            }
                                                            className="bg-white p-3 border border-gray-200 rounded-lg text-xs flex flex-col gap-2 shadow-sm"
                                                        >

                                                            <div className="flex items-center justify-between gap-3">

                                                                <div className="flex items-center gap-2 font-semibold text-gray-800 min-w-0">

                                                                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                                        {index +
                                                                            1}
                                                                    </span>

                                                                    <span className="truncate">
                                                                        Modification{" "}
                                                                        #
                                                                        {index +
                                                                            1}
                                                                    </span>
                                                                </div>

                                                                {timestamp && (
                                                                    <span className="text-[10px] text-gray-400 shrink-0">
                                                                        {String(
                                                                            timestamp
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <p className="text-gray-600 leading-relaxed pl-8">
                                                                {
                                                                    description
                                                                }
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                            )}

                                        </div>
                                    </div>
                                )}

                            </div>


                            {/* FOOTER */}

                            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors"
                                >
                                    Fermer
                                </button>
                            </div>

                        </div>
                    </div>,
                    document.body
                )}


            {/* =================================================
                MODALE FEEDBACK
            ================================================= */}

            {activeModal === "action-feedback" &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setActiveModal(null);
                            }
                        }}
                    >
                        <div
                            className="bg-white rounded-xl shadow-2xl border border-gray-300 w-[420px] max-w-[95vw] overflow-hidden flex flex-col"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="macevo-track-feedback-title"
                        >

                            {/* HEADER */}

                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3
                                    id="macevo-track-feedback-title"
                                    className="text-sm font-bold text-gray-800 flex items-center gap-2"
                                >
                                    {feedbackType ===
                                    "success" ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-600" />
                                    )}

                                    Suivi des modifications
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded"
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>


                            {/* CONTENU */}

                            <div className="p-6 flex flex-col items-center justify-center text-center gap-3 bg-slate-50">

                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        feedbackType ===
                                        "success"
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-red-50 text-red-600"
                                    }`}
                                >
                                    {feedbackType ===
                                    "success" ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5" />
                                    )}
                                </div>

                                <p
                                    className={`text-xs font-medium leading-relaxed ${
                                        feedbackType ===
                                        "success"
                                            ? "text-gray-700"
                                            : "text-red-700"
                                    }`}
                                >
                                    {feedbackMessage}
                                </p>
                            </div>


                            {/* FOOTER */}

                            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className={`px-4 py-2 text-xs font-medium text-white rounded shadow-sm transition-colors ${
                                        feedbackType ===
                                        "success"
                                            ? "bg-blue-600 hover:bg-blue-700"
                                            : "bg-red-600 hover:bg-red-700"
                                    }`}
                                >
                                    OK
                                </button>
                            </div>

                        </div>
                    </div>,
                    document.body
                )}

        </RibbonGroup>
    );
}

export default TrackChangesGroup;