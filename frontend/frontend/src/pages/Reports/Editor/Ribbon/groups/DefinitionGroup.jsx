/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : DefinitionGroup.jsx
 * Description : Consultation des définitions scientifiques.
 * Version : 2.0.0
 * Statut : Professionnel — aucune fausse définition
 * ============================================================
 */

import {
    useEffect,
    useState,
} from "react";

import { createPortal } from "react-dom";

import {
    BookOpen,
    X,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import accessibilityEngine from "../../../../../core/document/engines/revision/AccessibilityEngine";


function DefinitionGroup({
    editor,
}) {
    const [
        activeModal,
        setActiveModal,
    ] = useState(null);

    const [
        isLoading,
        setIsLoading,
    ] = useState(false);

    const [
        modalData,
        setModalData,
    ] = useState(null);

    const [
        feedbackMessage,
        setFeedbackMessage,
    ] = useState("");


    /* ======================================================
       ESCAPE
       ====================================================== */

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setActiveModal(null);
            }
        }

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
    }, []);


    if (!editor) {
        return null;
    }


    /* ======================================================
       FEEDBACK
       ====================================================== */

    function showFeedback(message) {
        setFeedbackMessage(message);
        setActiveModal("feedback");
    }


    /* ======================================================
       TEXTE CIBLE
       ====================================================== */

    function getDefinitionTarget() {
        const {
            from,
            to,
            empty,
        } = editor.state.selection;

        if (!empty && from !== to) {
            return editor.state.doc.textBetween(
                from,
                to,
                " "
            ).trim();
        }

        return editor
            .getText()
            .trim();
    }


    /* ======================================================
       DÉFINITION
       ====================================================== */

    async function checkDefinition() {
        const text =
            getDefinitionTarget();

        if (!text) {
            showFeedback(
                "Veuillez sélectionner un mot ou saisir du contenu dans le document."
            );

            return;
        }

        /*
         * Une définition scientifique nécessite
         * un moteur de définition réel.
         *
         * AccessibilityEngine n'est pas utilisé
         * comme faux moteur de définition.
         */

        if (
            typeof accessibilityEngine
                ?.getDefinition !==
            "function"
        ) {
            setModalData({
                term: text,
                definition: null,
                available: false,
            });

            setActiveModal(
                "definition"
            );

            return;
        }

        setIsLoading(true);
        setModalData(null);
        setActiveModal(
            "definition"
        );

        try {
            const result =
                await accessibilityEngine.getDefinition(
                    text
                );

            if (!result) {
                throw new Error(
                    "Aucune définition retournée."
                );
            }

            setModalData({
                term: text,
                definition:
                    typeof result ===
                    "object"
                        ? result.definition ||
                          result.text ||
                          JSON.stringify(
                              result,
                              null,
                              2
                          )
                        : String(
                              result
                          ),
                available: true,
            });
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de la récupération de la définition.",
                error
            );

            setModalData({
                term: text,
                definition: null,
                available: false,
                error: true,
            });
        } finally {
            setIsLoading(false);
        }
    }


    /* ======================================================
       RENDU
       ====================================================== */

    return (
        <>
            <RibbonGroup
                title="Définition"
                className="w-[130px] min-w-[130px]"
            >
                <RibbonButton
                    icon={BookOpen}
                    label="Définition"
                    tooltip="Obtenir la définition scientifique du texte sélectionné"
                    onClick={
                        checkDefinition
                    }
                />
            </RibbonGroup>


            {/* ==================================================
               MODALE DÉFINITION
               ================================================== */}

            {activeModal ===
                "definition" &&
                createPortal(
                    <div
                        className="
                            fixed
                            inset-0
                            z-[999999]
                            flex
                            items-center
                            justify-center
                            bg-black/60
                            backdrop-blur-[3px]
                            p-4
                        "
                    >
                        <div
                            className="
                                w-[580px]
                                max-w-full
                                bg-white
                                rounded-xl
                                shadow-2xl
                                border
                                border-slate-300
                                overflow-hidden
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    px-5
                                    py-3
                                    border-b
                                    border-slate-200
                                    bg-slate-50
                                "
                            >
                                <h3
                                    className="
                                        text-sm
                                        font-bold
                                        text-slate-800
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >
                                    <BookOpen className="
                                        w-4
                                        h-4
                                        text-blue-600
                                    " />

                                    Définition scientifique
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(
                                            null
                                        )
                                    }
                                    className="
                                        p-1
                                        rounded
                                        text-slate-400
                                        hover:text-slate-700
                                        hover:bg-slate-200
                                    "
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>


                            <div
                                className="
                                    p-5
                                    bg-slate-50
                                    max-h-[65vh]
                                    overflow-y-auto
                                "
                            >

                                {isLoading ? (
                                    <div
                                        className="
                                            flex
                                            flex-col
                                            items-center
                                            justify-center
                                            py-12
                                            gap-3
                                            text-xs
                                            text-slate-500
                                        "
                                    >
                                        <RefreshCw
                                            className="
                                                w-6
                                                h-6
                                                text-blue-600
                                                animate-spin
                                            "
                                        />

                                        Recherche de la
                                        définition...
                                    </div>
                                ) : (
                                    <div
                                        className="
                                            bg-white
                                            border
                                            border-slate-200
                                            rounded-lg
                                            p-4
                                        "
                                    >

                                        {modalData?.term && (
                                            <div className="
                                                mb-3
                                                text-[10px]
                                                uppercase
                                                tracking-wide
                                                font-bold
                                                text-blue-600
                                            ">
                                                Terme / contenu
                                            </div>
                                        )}

                                        {modalData?.term && (
                                            <div className="
                                                mb-4
                                                px-3
                                                py-2
                                                bg-blue-50
                                                border
                                                border-blue-100
                                                rounded-lg
                                                text-xs
                                                font-semibold
                                                text-slate-700
                                            ">
                                                {
                                                    modalData.term
                                                }
                                            </div>
                                        )}


                                        {modalData?.available &&
                                        modalData.definition ? (
                                            <p className="
                                                text-xs
                                                text-slate-700
                                                leading-relaxed
                                                whitespace-pre-wrap
                                            ">
                                                {
                                                    modalData.definition
                                                }
                                            </p>
                                        ) : (
                                            <div className="
                                                flex
                                                flex-col
                                                items-center
                                                text-center
                                                gap-3
                                                py-6
                                            ">
                                                <AlertCircle className="
                                                    w-8
                                                    h-8
                                                    text-amber-500
                                                " />

                                                <p className="
                                                    text-xs
                                                    font-medium
                                                    text-slate-700
                                                    leading-relaxed
                                                ">
                                                    Le moteur de
                                                    définition
                                                    scientifique
                                                    n'est pas encore
                                                    connecté à cet
                                                    éditeur.
                                                </p>

                                                <p className="
                                                    text-[10px]
                                                    text-slate-500
                                                    leading-relaxed
                                                ">
                                                    Aucun résultat
                                                    artificiel n'est
                                                    affiché afin de
                                                    préserver la
                                                    fiabilité
                                                    scientifique de
                                                    MACEVO.
                                                </p>
                                            </div>
                                        )}

                                    </div>
                                )}

                            </div>


                            <div
                                className="
                                    flex
                                    justify-end
                                    px-5
                                    py-3
                                    border-t
                                    border-slate-200
                                    bg-slate-50
                                "
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(
                                            null
                                        )
                                    }
                                    className="
                                        px-4
                                        py-1.5
                                        text-xs
                                        font-medium
                                        text-white
                                        bg-blue-600
                                        hover:bg-blue-700
                                        rounded-lg
                                    "
                                >
                                    Fermer
                                </button>
                            </div>

                        </div>
                    </div>,
                    document.body
                )}


            {/* ==================================================
               FEEDBACK
               ================================================== */}

            {activeModal ===
                "feedback" &&
                createPortal(
                    <div
                        className="
                            fixed
                            inset-0
                            z-[100000]
                            flex
                            items-center
                            justify-center
                            bg-black/60
                            backdrop-blur-[3px]
                            p-4
                        "
                    >
                        <div
                            className="
                                w-[420px]
                                max-w-full
                                bg-white
                                rounded-xl
                                shadow-2xl
                                border
                                border-slate-300
                                overflow-hidden
                            "
                        >
                            <div className="
                                flex
                                items-center
                                justify-between
                                px-5
                                py-3
                                border-b
                                border-slate-200
                                bg-slate-50
                            ">
                                <h3 className="
                                    text-sm
                                    font-bold
                                    text-slate-800
                                    flex
                                    items-center
                                    gap-2
                                ">
                                    <AlertCircle className="
                                        w-4
                                        h-4
                                        text-blue-600
                                    " />

                                    Information
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(
                                            null
                                        )
                                    }
                                    className="
                                        p-1
                                        rounded
                                        text-slate-400
                                        hover:bg-slate-200
                                    "
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="
                                p-6
                                flex
                                flex-col
                                items-center
                                text-center
                                gap-3
                                bg-slate-50
                            ">
                                <div className="
                                    w-10
                                    h-10
                                    rounded-full
                                    bg-blue-50
                                    text-blue-600
                                    flex
                                    items-center
                                    justify-center
                                ">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>

                                <p className="
                                    text-xs
                                    text-slate-700
                                    leading-relaxed
                                ">
                                    {
                                        feedbackMessage
                                    }
                                </p>
                            </div>

                            <div className="
                                flex
                                justify-end
                                px-5
                                py-3
                                border-t
                                border-slate-200
                                bg-slate-50
                            ">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(
                                            null
                                        )
                                    }
                                    className="
                                        px-4
                                        py-1.5
                                        text-xs
                                        font-medium
                                        text-white
                                        bg-blue-600
                                        hover:bg-blue-700
                                        rounded-lg
                                    "
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}


export default DefinitionGroup;