 /**
  * ============================================================
  * MACEVO
  *
  * ------------------------------------------------------------
  * Fichier : VocabGroup.jsx
  * Version : 2.0.0
  * Statut : Professionnel — analyse du vocabulaire
  * ============================================================
  */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
    Sparkles,
    X,
    RefreshCw,
    CheckCircle2,
    ShieldAlert,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import accessibilityEngine from "../../../../../core/document/engines/revision/AccessibilityEngine";


/* ============================================================
   UTILITAIRES
   ============================================================ */

function normalizeReport(report) {
    if (report == null) {
        return [];
    }

    if (Array.isArray(report)) {
        return report;
    }

    if (Array.isArray(report.issues)) {
        return report.issues;
    }

    if (Array.isArray(report.suggestions)) {
        return report.suggestions;
    }

    if (Array.isArray(report.results)) {
        return report.results;
    }

    return [report];
}


function getItemMessage(item) {
    if (item == null) {
        return "";
    }

    if (typeof item === "string") {
        return item;
    }

    if (typeof item === "number" || typeof item === "boolean") {
        return String(item);
    }

    if (typeof item === "object") {
        return (
            item.message ||
            item.description ||
            item.suggestion ||
            item.text ||
            item.issue ||
            "Élément détecté."
        );
    }

    return String(item);
}


/* ============================================================
   COMPOSANT
   ============================================================ */

function VocabGroup({ editor }) {
    const [activeModal, setActiveModal] = useState(null);

    const [isLoading, setIsLoading] = useState(false);

    const [modalData, setModalData] = useState([]);

    const [feedbackMessage, setFeedbackMessage] =
        useState("");

    const [feedbackType, setFeedbackType] =
        useState("info");


    /* ========================================================
       FERMETURE AVEC ESC
    ======================================================== */

    useEffect(() => {
        if (!activeModal) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape" && !isLoading) {
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
    }, [activeModal, isLoading]);


    /* ========================================================
       FEEDBACK
    ======================================================== */

    const showFeedback = (
        message,
        type = "info"
    ) => {
        setFeedbackMessage(message);
        setFeedbackType(type);
        setActiveModal("feedback");
    };


    /* ========================================================
       ANALYSE DU VOCABULAIRE
       IMPORTANT :
       AccessibilityEngine connu = analyse(text)
    ======================================================== */

    const checkVocabulary = async () => {
        if (!editor) {
            return;
        }

        const text =
            editor.getText().trim();

        if (!text) {
            showFeedback(
                "Le document est vide. Ajoutez du contenu avant de lancer l'analyse.",
                "info"
            );

            return;
        }

        if (
            typeof accessibilityEngine?.analyse !==
            "function"
        ) {
            showFeedback(
                "Le moteur d'analyse du vocabulaire n'est pas disponible.",
                "error"
            );

            return;
        }

        setIsLoading(true);
        setModalData([]);
        setActiveModal("vocabulary");

        try {
            const report =
                await accessibilityEngine.analyse(
                    text
                );

            const normalized =
                normalizeReport(report);

            setModalData(normalized);
        } catch (error) {
            console.error(
                "MACEVO — erreur lors de l'analyse du vocabulaire :",
                error
            );

            setModalData([]);

            showFeedback(
                error?.message ||
                    "Une erreur est survenue pendant l'analyse du vocabulaire.",
                "error"
            );
        } finally {
            setIsLoading(false);
        }
    };


    /* ========================================================
       RÉINITIALISER L'ANALYSE
    ======================================================== */

    const resetAnalysis = () => {
        try {
            if (
                typeof accessibilityEngine?.reset ===
                "function"
            ) {
                accessibilityEngine.reset();
            }
        } catch (error) {
            console.error(
                "MACEVO — erreur lors de la réinitialisation :",
                error
            );
        }

        setModalData([]);
        setActiveModal(null);
    };


    /* ========================================================
       SI ÉDITEUR ABSENT
    ======================================================== */

    if (!editor) {
        return null;
    }


    /* ========================================================
       RENDU
    ======================================================== */

    return (
        <RibbonGroup
            title="Vocabulaire"
            className="w-[150px] min-w-[150px]"
        >

            <RibbonButton
                icon={Sparkles}
                label="Vocabulaire"
                tooltip="Analyser le vocabulaire scientifique"
                onClick={checkVocabulary}
            />


            {/* ==================================================
                MODALE VOCABULAIRE
            ================================================== */}

            {activeModal === "vocabulary" &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget &&
                                !isLoading
                            ) {
                                setActiveModal(null);
                            }
                        }}
                    >
                        <div
                            className="bg-white rounded-xl shadow-2xl border border-gray-300 w-[600px] max-w-[95vw] overflow-hidden flex flex-col"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="macevo-vocabulary-title"
                        >

                            {/* HEADER */}

                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">

                                <h3
                                    id="macevo-vocabulary-title"
                                    className="text-sm font-bold text-gray-800 flex items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4 text-blue-600" />

                                    Analyse du vocabulaire scientifique
                                </h3>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isLoading) {
                                            setActiveModal(
                                                null
                                            );
                                        }
                                    }}
                                    disabled={isLoading}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded disabled:opacity-40"
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                            </div>


                            {/* CONTENU */}

                            <div className="p-6 max-h-[65vh] overflow-y-auto bg-slate-50">

                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-500 text-xs">

                                        <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />

                                        <span className="font-medium">
                                            Analyse en cours…
                                        </span>

                                        <span className="text-[11px] text-gray-400 text-center max-w-sm">
                                            Analyse du contenu textuel
                                            du document.
                                        </span>

                                    </div>
                                ) : modalData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">

                                        <CheckCircle2 className="w-9 h-9 text-green-500" />

                                        <p className="text-xs font-medium text-gray-700">
                                            Aucune suggestion ou anomalie
                                            détectée.
                                        </p>

                                        <p className="text-[11px] text-gray-400 max-w-sm">
                                            L'analyse ne retourne actuellement
                                            aucun élément exploitable.
                                        </p>

                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">

                                        <div className="flex items-center justify-between">

                                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                {modalData.length} élément
                                                {modalData.length > 1
                                                    ? "s"
                                                    : ""}{" "}
                                                détecté
                                                {modalData.length > 1
                                                    ? "s"
                                                    : ""}
                                            </span>

                                            <span className="text-[10px] text-gray-400">
                                                Analyse MACEVO
                                            </span>

                                        </div>


                                        {modalData.map(
                                            (item, index) => (
                                                <div
                                                    key={`vocab-${index}`}
                                                    className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm"
                                                >

                                                    <div className="flex items-center gap-2 mb-2">

                                                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />

                                                        <span className="text-xs font-semibold text-gray-800">
                                                            Élément #
                                                            {index + 1}
                                                        </span>

                                                    </div>

                                                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                                                        {getItemMessage(
                                                            item
                                                        )}
                                                    </p>

                                                </div>
                                            )
                                        )}

                                    </div>
                                )}

                            </div>


                            {/* FOOTER */}

                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">

                                <button
                                    type="button"
                                    onClick={
                                        resetAnalysis
                                    }
                                    disabled={isLoading}
                                    className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                                >
                                    Réinitialiser
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(
                                            null
                                        )
                                    }
                                    disabled={isLoading}
                                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors disabled:opacity-50"
                                >
                                    Fermer
                                </button>

                            </div>

                        </div>
                    </div>,
                    document.body
                )}


            {/* ==================================================
                MODALE FEEDBACK
            ================================================== */}

            {activeModal === "feedback" &&
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
                            className="bg-white rounded-xl shadow-2xl border border-gray-300 w-[440px] max-w-[95vw] overflow-hidden flex flex-col"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="macevo-vocabulary-feedback-title"
                        >

                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">

                                <h3
                                    id="macevo-vocabulary-feedback-title"
                                    className="text-sm font-bold text-gray-800 flex items-center gap-2"
                                >
                                    <AlertCircle className="w-4 h-4 text-blue-600" />

                                    Information — Vocabulaire
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


                            <div className="p-6 flex flex-col items-center justify-center text-center gap-3 bg-slate-50">

                                <div
                                    className={`w-11 h-11 rounded-full flex items-center justify-center ${
                                        feedbackType ===
                                        "error"
                                            ? "bg-red-50 text-red-600"
                                            : "bg-blue-50 text-blue-600"
                                    }`}
                                >
                                    {feedbackType ===
                                    "error" ? (
                                        <AlertCircle className="w-5 h-5" />
                                    ) : (
                                        <CheckCircle2 className="w-5 h-5" />
                                    )}
                                </div>

                                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                                    {feedbackMessage}
                                </p>

                            </div>


                            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors"
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

export default VocabGroup;