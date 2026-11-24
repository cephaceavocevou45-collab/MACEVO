/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : CompareGroup.jsx
 * Description : Comparaison et fusion de documents.
 * Version : 4.0.0
 * Statut : Professionnel — frontend sécurisé
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
    GitCompareArrows,
    FileSearch,
    Files,
    X,
    Check,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import compareEngine from "../../../../../core/document/engines/revision/CompareEngine";


function CompareGroup() {
    const { editor } = useEditorContext();

    const [activeModal, setActiveModal] = useState(null);

    const [otherDocumentText, setOtherDocumentText] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(false);

    const [comparisonResult, setComparisonResult] =
        useState(null);

    const [differencesList, setDifferencesList] =
        useState([]);

    const [feedbackMessage, setFeedbackMessage] =
        useState("");


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
       COMPARAISON
       ====================================================== */

    function openCompareModal() {
        const currentDocument =
            editor.getText();

        if (!currentDocument.trim()) {
            showFeedback(
                "Le document actuel est vide."
            );
            return;
        }

        setOtherDocumentText("");
        setComparisonResult(null);
        setActiveModal("compare-input");
    }


    async function executeComparison() {
        const currentDocument =
            editor.getText();

        const secondDocument =
            otherDocumentText.trim();

        if (!secondDocument) {
            showFeedback(
                "Veuillez fournir le second document."
            );
            return;
        }

        setIsLoading(true);
        setComparisonResult(null);
        setActiveModal("compare-result");

        try {
            const result =
                await compareEngine.compare(
                    currentDocument,
                    secondDocument
                );

            setComparisonResult(
                result ?? []
            );
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de la comparaison.",
                error
            );

            setComparisonResult({
                error:
                    "La comparaison des documents a échoué.",
            });
        } finally {
            setIsLoading(false);
        }
    }


    /* ======================================================
       DIFFÉRENCES
       ====================================================== */

    function showDifferences() {
        try {
            const differences =
                typeof compareEngine.getDifferences ===
                "function"
                    ? compareEngine.getDifferences()
                    : [];

            setDifferencesList(
                Array.isArray(differences)
                    ? differences
                    : []
            );

            setActiveModal("differences");
        } catch (error) {
            console.error(
                "MACEVO : impossible de récupérer les différences.",
                error
            );

            showFeedback(
                "Impossible de récupérer les différences."
            );
        }
    }


    /* ======================================================
       FUSION
       ====================================================== */

    function openMergeModal() {
        const currentDocument =
            editor.getText();

        if (!currentDocument.trim()) {
            showFeedback(
                "Le document actuel est vide."
            );
            return;
        }

        setOtherDocumentText("");
        setActiveModal("merge-input");
    }


    async function executeMerge() {
        const secondDocument =
            otherDocumentText.trim();

        if (!secondDocument) {
            showFeedback(
                "Veuillez fournir le document à fusionner."
            );
            return;
        }

        setIsLoading(true);

        try {
            const merged =
                await compareEngine.merge(
                    editor.getText(),
                    secondDocument
                );

            if (
                merged === null ||
                merged === undefined
            ) {
                throw new Error(
                    "Le moteur de fusion n'a retourné aucun contenu."
                );
            }

            const mergedText =
                typeof merged === "string"
                    ? merged
                    : JSON.stringify(
                          merged,
                          null,
                          2
                      );

            editor
                .chain()
                .focus()
                .setContent(
                    `<pre>${escapeHtml(
                        mergedText
                    )}</pre>`
                )
                .run();

            setActiveModal(null);

            showFeedback(
                "Fusion des documents terminée avec succès."
            );
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de la fusion.",
                error
            );

            showFeedback(
                "Erreur lors de la fusion des documents."
            );
        } finally {
            setIsLoading(false);
        }
    }


    /* ======================================================
       UTILITAIRE HTML
       ====================================================== */

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* ======================================================
       AFFICHAGE D'UN RÉSULTAT
       ====================================================== */

    function renderComparisonResult() {
        if (
            comparisonResult === null ||
            comparisonResult === undefined
        ) {
            return "Aucun résultat.";
        }

        if (
            typeof comparisonResult ===
            "string"
        ) {
            return comparisonResult;
        }

        try {
            return JSON.stringify(
                comparisonResult,
                null,
                2
            );
        } catch {
            return String(
                comparisonResult
            );
        }
    }


    /* ======================================================
       RENDU
       ====================================================== */

    return (
        <>
            <RibbonGroup
                title="Comparaison"
                className="w-[230px] min-w-[230px]"
            >
                <RibbonButton
                    icon={GitCompareArrows}
                    label="Comparer"
                    tooltip="Comparer deux documents"
                    onClick={
                        openCompareModal
                    }
                />

                <RibbonButton
                    icon={FileSearch}
                    label="Différences"
                    tooltip="Afficher les différences"
                    onClick={
                        showDifferences
                    }
                />

                <RibbonButton
                    icon={Files}
                    label="Fusionner"
                    tooltip="Fusionner deux documents"
                    onClick={
                        openMergeModal
                    }
                />
            </RibbonGroup>


            {/* ==================================================
               MODALE COMPARAISON
               ================================================== */}

            {activeModal ===
                "compare-input" &&
                createPortal(
                    <ModalShell
                        title="Comparer des documents"
                        icon={GitCompareArrows}
                        onClose={() =>
                            setActiveModal(null)
                        }
                    >
                        <label className="text-xs font-bold text-slate-700">
                            Second document
                        </label>

                        <textarea
                            value={
                                otherDocumentText
                            }
                            onChange={(event) =>
                                setOtherDocumentText(
                                    event.target.value
                                )
                            }
                            placeholder="Collez ici le contenu du second document..."
                            rows={8}
                            autoFocus
                            className="
                                w-full
                                p-3
                                text-xs
                                border
                                border-slate-300
                                rounded-lg
                                resize-y
                                outline-none
                                focus:border-blue-500
                                focus:ring-2
                                focus:ring-blue-100
                            "
                        />

                        <ModalActions
                            onCancel={() =>
                                setActiveModal(
                                    null
                                )
                            }
                            onConfirm={
                                executeComparison
                            }
                            disabled={
                                !otherDocumentText.trim() ||
                                isLoading
                            }
                            loading={
                                isLoading
                            }
                            confirmLabel="Lancer la comparaison"
                        />
                    </ModalShell>,
                    document.body
                )}


            {/* ==================================================
               RÉSULTAT
               ================================================== */}

            {activeModal ===
                "compare-result" &&
                createPortal(
                    <ModalShell
                        title="Résultat de la comparaison"
                        icon={GitCompareArrows}
                        width="w-[650px]"
                        onClose={() =>
                            setActiveModal(null)
                        }
                    >
                        {isLoading ? (
                            <LoadingState
                                text="Analyse comparative en cours..."
                            />
                        ) : (
                            <pre
                                className="
                                    whitespace-pre-wrap
                                    break-words
                                    bg-white
                                    border
                                    border-slate-200
                                    rounded-lg
                                    p-4
                                    text-[11px]
                                    leading-relaxed
                                    font-mono
                                    text-slate-700
                                    max-h-[55vh]
                                    overflow-auto
                                "
                            >
                                {
                                    renderComparisonResult()
                                }
                            </pre>
                        )}

                        <ModalActions
                            onCancel={() =>
                                setActiveModal(
                                    null
                                )
                            }
                            confirmLabel="Fermer"
                            hideCancel
                        />
                    </ModalShell>,
                    document.body
                )}


            {/* ==================================================
               DIFFÉRENCES
               ================================================== */}

            {activeModal ===
                "differences" &&
                createPortal(
                    <ModalShell
                        title="Différences détectées"
                        icon={FileSearch}
                        width="w-[650px]"
                        onClose={() =>
                            setActiveModal(null)
                        }
                    >
                        {differencesList.length ===
                        0 ? (
                            <div
                                className="
                                    flex
                                    flex-col
                                    items-center
                                    justify-center
                                    py-12
                                    text-center
                                    text-slate-500
                                "
                            >
                                <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />

                                <p className="text-xs">
                                    Aucune différence
                                    détectée.
                                </p>
                            </div>
                        ) : (
                            <div
                                className="
                                    flex
                                    flex-col
                                    gap-2
                                    max-h-[55vh]
                                    overflow-y-auto
                                "
                            >
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                    {
                                        differencesList.length
                                    }{" "}
                                    différence(s)
                                </div>

                                {differencesList.map(
                                    (
                                        difference,
                                        index
                                    ) => (
                                        <div
                                            key={
                                                index
                                            }
                                            className="
                                                bg-white
                                                border
                                                border-slate-200
                                                rounded-lg
                                                p-3
                                            "
                                        >
                                            <div className="text-[10px] font-bold text-blue-600 mb-1">
                                                Différence{" "}
                                                {index +
                                                    1}
                                            </div>

                                            <pre
                                                className="
                                                    whitespace-pre-wrap
                                                    break-words
                                                    text-[11px]
                                                    font-mono
                                                    text-slate-600
                                                "
                                            >
                                                {typeof difference ===
                                                "object"
                                                    ? JSON.stringify(
                                                          difference,
                                                          null,
                                                          2
                                                      )
                                                    : String(
                                                          difference
                                                      )}
                                            </pre>
                                        </div>
                                    )
                                )}
                            </div>
                        )}

                        <ModalActions
                            onCancel={() =>
                                setActiveModal(
                                    null
                                )
                            }
                            confirmLabel="Fermer"
                            hideCancel
                        />
                    </ModalShell>,
                    document.body
                )}


            {/* ==================================================
               FUSION
               ================================================== */}

            {activeModal ===
                "merge-input" &&
                createPortal(
                    <ModalShell
                        title="Fusionner des documents"
                        icon={Files}
                        onClose={() =>
                            setActiveModal(null)
                        }
                    >
                        <label className="text-xs font-bold text-slate-700">
                            Document à fusionner
                        </label>

                        <textarea
                            value={
                                otherDocumentText
                            }
                            onChange={(event) =>
                                setOtherDocumentText(
                                    event.target.value
                                )
                            }
                            placeholder="Collez ici le contenu du document à fusionner..."
                            rows={8}
                            autoFocus
                            className="
                                w-full
                                p-3
                                text-xs
                                border
                                border-slate-300
                                rounded-lg
                                resize-y
                                outline-none
                                focus:border-blue-500
                                focus:ring-2
                                focus:ring-blue-100
                            "
                        />

                        <ModalActions
                            onCancel={() =>
                                setActiveModal(
                                    null
                                )
                            }
                            onConfirm={
                                executeMerge
                            }
                            disabled={
                                !otherDocumentText.trim() ||
                                isLoading
                            }
                            loading={
                                isLoading
                            }
                            confirmLabel="Fusionner"
                        />
                    </ModalShell>,
                    document.body
                )}


            {/* ==================================================
               FEEDBACK
               ================================================== */}

            {activeModal ===
                "feedback" &&
                createPortal(
                    <ModalShell
                        title="Information — Comparaison"
                        icon={AlertCircle}
                        width="w-[420px]"
                        onClose={() =>
                            setActiveModal(
                                null
                            )
                        }
                    >
                        <div className="flex flex-col items-center text-center gap-3 py-4">
                            <div className="
                                w-11
                                h-11
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

                        <ModalActions
                            onCancel={() =>
                                setActiveModal(
                                    null
                                )
                            }
                            confirmLabel="OK"
                            hideCancel
                        />
                    </ModalShell>,
                    document.body
                )}
        </>
    );
}


/* ==========================================================
   COMPOSANTS INTERNES
   ========================================================== */

function ModalShell({
    title,
    icon: Icon,
    width = "w-[540px]",
    onClose,
    children,
}) {
    return (
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
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <div
                className={`
                    ${width}
                    max-w-full
                    bg-white
                    rounded-xl
                    shadow-2xl
                    border
                    border-slate-300
                    overflow-hidden
                `}
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
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
                        <Icon className="w-4 h-4 text-blue-600" />
                        {title}
                    </h3>

                    <button
                        type="button"
                        onClick={onClose}
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

                <div className="
                    p-5
                    flex
                    flex-col
                    gap-3
                    max-h-[70vh]
                    overflow-y-auto
                    bg-slate-50
                ">
                    {children}
                </div>
            </div>
        </div>
    );
}


function ModalActions({
    onCancel,
    onConfirm,
    disabled = false,
    loading = false,
    confirmLabel,
    hideCancel = false,
}) {
    return (
        <div className="
            flex
            items-center
            justify-end
            gap-2
            pt-3
            border-t
            border-slate-200
        ">
            {!hideCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="
                        px-3
                        py-1.5
                        text-xs
                        text-slate-600
                        rounded-lg
                        hover:bg-slate-200
                    "
                >
                    Annuler
                </button>
            )}

            <button
                type="button"
                onClick={onConfirm}
                disabled={
                    disabled
                }
                className="
                    px-4
                    py-1.5
                    text-xs
                    font-medium
                    text-white
                    bg-blue-600
                    hover:bg-blue-700
                    disabled:bg-slate-300
                    disabled:cursor-not-allowed
                    rounded-lg
                    flex
                    items-center
                    gap-1.5
                "
            >
                {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Check className="w-3.5 h-3.5" />
                )}

                {confirmLabel}
            </button>
        </div>
    );
}


function LoadingState({ text }) {
    return (
        <div className="
            flex
            flex-col
            items-center
            justify-center
            py-12
            gap-3
            text-xs
            text-slate-500
        ">
            <RefreshCw className="
                w-6
                h-6
                text-blue-600
                animate-spin
            " />

            {text}
        </div>
    );
}


export default CompareGroup;