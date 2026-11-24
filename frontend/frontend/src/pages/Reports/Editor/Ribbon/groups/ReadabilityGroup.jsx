/**
 * ===========================================================
 * MACEVO — ÉDITEUR SCIENTIFIQUE
 * -----------------------------------------------------------
 * Fichier : ReadabilityGroup.jsx
 * Version : 4.0.0
 * Statut  : Analyse de lisibilité — stable
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
    BarChart3,
    Gauge,
    WandSparkles,
    X,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    FileText,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import readabilityEngine from "../../../../../core/document/engines/revision/ReadabilityEngine";

const MODALS = {
    ANALYSIS: "analysis-report",
    SCORE: "score-display",
    SUGGESTIONS: "suggestions-list",
    FEEDBACK: "feedback",
};

function ReadabilityGroup() {
    const { editor } = useEditorContext();

    const [activeModal, setActiveModal] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [analysisReport, setAnalysisReport] =
        useState(null);

    const [readabilityScore, setReadabilityScore] =
        useState(null);

    const [suggestionsList, setSuggestionsList] =
        useState([]);

    const [feedbackMessage, setFeedbackMessage] =
        useState("");

    const [errorMessage, setErrorMessage] =
        useState("");

    /**
     * ---------------------------------------------------------
     * Fermeture avec Escape
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (!activeModal) {
            return undefined;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setActiveModal(null);
                setErrorMessage("");
            }
        };

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [activeModal]);

    /**
     * ---------------------------------------------------------
     * Helpers
     * ---------------------------------------------------------
     */

    const closeModal = () => {
        if (isLoading) {
            return;
        }

        setActiveModal(null);
        setErrorMessage("");
    };

    const showFeedback = (message) => {
        setIsLoading(false);
        setErrorMessage("");
        setFeedbackMessage(message);
        setActiveModal(MODALS.FEEDBACK);
    };

    const getDocumentText = () => {
        if (!editor) {
            throw new Error(
                "L'éditeur n'est pas disponible."
            );
        }

        const text = editor.getText();

        if (!text || !text.trim()) {
            throw new Error("Le document est vide.");
        }

        return text;
    };

    const formatResult = (value) => {
        if (value === null || value === undefined) {
            return "Aucune donnée disponible.";
        }

        if (typeof value === "string") {
            return value;
        }

        if (
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            return String(value);
        }

        try {
            return JSON.stringify(
                value,
                null,
                2
            );
        } catch {
            return String(value);
        }
    };

    const normalizeSuggestions = (value) => {
        if (!value) {
            return [];
        }

        if (Array.isArray(value)) {
            return value;
        }

        return [value];
    };

    /**
     * ---------------------------------------------------------
     * Analyse
     * ---------------------------------------------------------
     */

    const analyzeDocument = async () => {
        if (isLoading) {
            return;
        }

        setErrorMessage("");
        setAnalysisReport(null);

        try {
            const text = getDocumentText();

            if (
                typeof readabilityEngine?.analyze !==
                "function"
            ) {
                throw new Error(
                    "Le moteur de lisibilité ne fournit pas analyze()."
                );
            }

            setActiveModal(MODALS.ANALYSIS);
            setIsLoading(true);

            const report =
                await readabilityEngine.analyze(
                    text
                );

            setAnalysisReport(report ?? {});
        } catch (error) {
            console.error(
                "[MACEVO Lisibilité] Analyse :",
                error
            );

            setAnalysisReport(null);

            setErrorMessage(
                error?.message ||
                    "Impossible d'analyser la lisibilité du document."
            );

            setActiveModal(MODALS.ANALYSIS);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * ---------------------------------------------------------
     * Score
     * ---------------------------------------------------------
     */

    const showScore = async () => {
        if (isLoading) {
            return;
        }

        setErrorMessage("");
        setReadabilityScore(null);

        try {
            const text = getDocumentText();

            if (
                typeof readabilityEngine?.getScore !==
                "function"
            ) {
                throw new Error(
                    "Le moteur de lisibilité ne fournit pas getScore()."
                );
            }

            setActiveModal(MODALS.SCORE);
            setIsLoading(true);

            const score =
                await readabilityEngine.getScore(
                    text
                );

            setReadabilityScore(
                score ?? "N/A"
            );
        } catch (error) {
            console.error(
                "[MACEVO Lisibilité] Score :",
                error
            );

            setReadabilityScore(null);

            setErrorMessage(
                error?.message ||
                    "Impossible de calculer le score de lisibilité."
            );

            setActiveModal(MODALS.SCORE);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * ---------------------------------------------------------
     * Suggestions
     * ---------------------------------------------------------
     */

    const improveDocument = async () => {
        if (isLoading) {
            return;
        }

        setErrorMessage("");
        setSuggestionsList([]);

        try {
            const text = getDocumentText();

            if (
                typeof readabilityEngine?.getSuggestions !==
                "function"
            ) {
                throw new Error(
                    "Le moteur de lisibilité ne fournit pas getSuggestions()."
                );
            }

            setActiveModal(
                MODALS.SUGGESTIONS
            );

            setIsLoading(true);

            const suggestions =
                await readabilityEngine.getSuggestions(
                    text
                );

            setSuggestionsList(
                normalizeSuggestions(suggestions)
            );
        } catch (error) {
            console.error(
                "[MACEVO Lisibilité] Suggestions :",
                error
            );

            setSuggestionsList([]);

            setErrorMessage(
                error?.message ||
                    "Impossible de récupérer les suggestions."
            );

            setActiveModal(
                MODALS.SUGGESTIONS
            );
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * ---------------------------------------------------------
     * Aucun éditeur
     * ---------------------------------------------------------
     */

    if (!editor) {
        return null;
    }

    /**
     * ---------------------------------------------------------
     * Composant contenu d'erreur
     * ---------------------------------------------------------
     */

    const ErrorMessage = () => {
        if (!errorMessage) {
            return null;
        }

        return (
            <div
                className="
                    flex
                    items-start
                    gap-2
                    p-3
                    text-[11px]
                    text-red-700
                    bg-red-50
                    border
                    border-red-200
                    rounded-lg
                "
                role="alert"
            >
                <AlertCircle
                    size={15}
                    className="shrink-0 mt-0.5"
                />

                <span>{errorMessage}</span>
            </div>
        );
    };

    /**
     * ---------------------------------------------------------
     * Modal wrapper
     * ---------------------------------------------------------
     */

    const ModalOverlay = ({
        children,
        labelledBy,
        width = "w-[580px]",
    }) => {
        return createPortal(
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
                        event.currentTarget &&
                        !isLoading
                    ) {
                        closeModal();
                    }
                }}
            >
                <div
                    className={`
                        bg-white
                        rounded-xl
                        shadow-2xl
                        border
                        border-slate-300
                        ${width}
                        max-w-[95vw]
                        max-h-[90vh]
                        overflow-hidden
                        flex
                        flex-col
                    `}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={labelledBy}
                    onMouseDown={(event) =>
                        event.stopPropagation()
                    }
                >
                    {children}
                </div>
            </div>,
            document.body
        );
    };

    /**
     * ---------------------------------------------------------
     * En-tête commun
     * ---------------------------------------------------------
     */

    const ModalHeader = ({
        id,
        icon: Icon,
        title,
    }) => (
        <div
            className="
                flex
                items-center
                justify-between
                px-6
                py-4
                border-b
                border-slate-200
                bg-slate-50
                shrink-0
            "
        >
            <h3
                id={id}
                className="
                    text-sm
                    font-bold
                    text-slate-800
                    flex
                    items-center
                    gap-2
                "
            >
                <Icon className="w-4 h-4 text-blue-600" />
                {title}
            </h3>

            <button
                type="button"
                onClick={closeModal}
                disabled={isLoading}
                className="
                    p-1
                    text-slate-400
                    hover:text-slate-700
                    disabled:opacity-40
                    rounded
                "
                aria-label="Fermer"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );

    /**
     * ---------------------------------------------------------
     * Pied commun
     * ---------------------------------------------------------
     */

    const ModalFooter = () => (
        <div
            className="
                flex
                items-center
                justify-end
                px-6
                py-4
                border-t
                border-slate-200
                bg-slate-50
                shrink-0
            "
        >
            <button
                type="button"
                onClick={closeModal}
                disabled={isLoading}
                className="
                    px-4
                    py-2
                    text-xs
                    font-medium
                    text-white
                    bg-blue-600
                    hover:bg-blue-700
                    disabled:bg-blue-300
                    rounded
                    shadow-sm
                "
            >
                Fermer
            </button>
        </div>
    );

    return (
        <>
            <RibbonGroup
                title="Lisibilité"
                className="w-[230px] min-w-[230px]"
            >
                <RibbonButton
                    icon={BarChart3}
                    label="Analyser"
                    tooltip="Analyser la lisibilité du document"
                    onClick={analyzeDocument}
                    disabled={isLoading}
                />

                <RibbonButton
                    icon={Gauge}
                    label="Score"
                    tooltip="Calculer le score de lisibilité"
                    onClick={showScore}
                    disabled={isLoading}
                />

                <RibbonButton
                    icon={WandSparkles}
                    label="Améliorer"
                    tooltip="Obtenir des suggestions d'amélioration"
                    onClick={improveDocument}
                    disabled={isLoading}
                />
            </RibbonGroup>

            {/* =================================================
                RAPPORT D'ANALYSE
               ================================================= */}

            {activeModal === MODALS.ANALYSIS && (
                <ModalOverlay
                    labelledBy="macevo-readability-analysis-title"
                >
                    <ModalHeader
                        id="macevo-readability-analysis-title"
                        icon={BarChart3}
                        title="Rapport d'analyse de lisibilité"
                    />

                    <div
                        className="
                            p-6
                            flex
                            flex-col
                            gap-4
                            max-h-[65vh]
                            overflow-y-auto
                            bg-white
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
                                    text-slate-500
                                    text-xs
                                "
                            >
                                <RefreshCw
                                    className="
                                        w-6
                                        h-6
                                        animate-spin
                                        text-blue-600
                                    "
                                />

                                <span>
                                    Analyse du document
                                    en cours...
                                </span>
                            </div>
                        ) : errorMessage ? (
                            <ErrorMessage />
                        ) : (
                            <>
                                <span
                                    className="
                                        text-[11px]
                                        font-semibold
                                        text-slate-500
                                        uppercase
                                        tracking-wider
                                    "
                                >
                                    Résultats de l'analyse
                                </span>

                                <div
                                    className="
                                        p-4
                                        bg-slate-50
                                        border
                                        border-slate-200
                                        rounded-lg
                                        text-xs
                                        font-mono
                                        text-slate-800
                                        whitespace-pre-wrap
                                        max-h-[45vh]
                                        overflow-y-auto
                                    "
                                >
                                    {formatResult(
                                        analysisReport
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <ModalFooter />
                </ModalOverlay>
            )}

            {/* =================================================
                SCORE
               ================================================= */}

            {activeModal === MODALS.SCORE && (
                <ModalOverlay
                    labelledBy="macevo-readability-score-title"
                    width="w-[440px]"
                >
                    <ModalHeader
                        id="macevo-readability-score-title"
                        icon={Gauge}
                        title="Score de lisibilité"
                    />

                    <div
                        className="
                            p-8
                            flex
                            flex-col
                            items-center
                            justify-center
                            text-center
                            gap-4
                            bg-white
                        "
                    >
                        {isLoading ? (
                            <div
                                className="
                                    flex
                                    flex-col
                                    items-center
                                    justify-center
                                    py-6
                                    gap-3
                                    text-slate-500
                                    text-xs
                                "
                            >
                                <RefreshCw
                                    className="
                                        w-6
                                        h-6
                                        animate-spin
                                        text-blue-600
                                    "
                                />

                                <span>
                                    Calcul du score...
                                </span>
                            </div>
                        ) : errorMessage ? (
                            <ErrorMessage />
                        ) : (
                            <>
                                <div
                                    className="
                                        w-24
                                        h-24
                                        rounded-full
                                        bg-blue-50
                                        border-4
                                        border-blue-600
                                        text-blue-700
                                        flex
                                        items-center
                                        justify-center
                                        text-2xl
                                        font-black
                                    "
                                >
                                    {formatResult(
                                        readabilityScore
                                    )}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span
                                        className="
                                            text-xs
                                            font-bold
                                            text-slate-800
                                        "
                                    >
                                        Indice global
                                    </span>

                                    <span
                                        className="
                                            text-[11px]
                                            text-slate-500
                                        "
                                    >
                                        Résultat fourni par le
                                        moteur d'analyse de
                                        lisibilité.
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    <ModalFooter />
                </ModalOverlay>
            )}

            {/* =================================================
                SUGGESTIONS
               ================================================= */}

            {activeModal === MODALS.SUGGESTIONS && (
                <ModalOverlay
                    labelledBy="macevo-readability-suggestions-title"
                >
                    <ModalHeader
                        id="macevo-readability-suggestions-title"
                        icon={WandSparkles}
                        title="Suggestions d'amélioration"
                    />

                    <div
                        className="
                            p-6
                            flex
                            flex-col
                            gap-4
                            max-h-[65vh]
                            overflow-y-auto
                            bg-white
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
                                    text-slate-500
                                    text-xs
                                "
                            >
                                <RefreshCw
                                    className="
                                        w-6
                                        h-6
                                        animate-spin
                                        text-blue-600
                                    "
                                />

                                <span>
                                    Recherche de suggestions...
                                </span>
                            </div>
                        ) : errorMessage ? (
                            <ErrorMessage />
                        ) : suggestionsList.length ===
                          0 ? (
                            <div
                                className="
                                    flex
                                    flex-col
                                    items-center
                                    justify-center
                                    py-10
                                    gap-2
                                    text-center
                                    text-slate-500
                                    text-xs
                                "
                            >
                                <CheckCircle2
                                    className="
                                        w-8
                                        h-8
                                        text-green-500
                                        mb-1
                                    "
                                />

                                <span>
                                    Aucune suggestion
                                    retournée par le moteur.
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <span
                                    className="
                                        text-[11px]
                                        font-semibold
                                        text-slate-500
                                        uppercase
                                        tracking-wider
                                    "
                                >
                                    {suggestionsList.length}{" "}
                                    suggestion
                                    {suggestionsList.length >
                                    1
                                        ? "s"
                                        : ""}{" "}
                                    identifiée
                                    {suggestionsList.length >
                                    1
                                        ? "s"
                                        : ""}
                                </span>

                                <div className="flex flex-col gap-2">
                                    {suggestionsList.map(
                                        (item, index) => {
                                            let content;

                                            if (
                                                typeof item ===
                                                "object"
                                            ) {
                                                content =
                                                    item?.message ??
                                                    item?.text ??
                                                    item?.suggestion ??
                                                    formatResult(
                                                        item
                                                    );
                                            } else {
                                                content =
                                                    String(
                                                        item
                                                    );
                                            }

                                            return (
                                                <div
                                                    key={`readability-suggestion-${index}`}
                                                    className="
                                                        bg-white
                                                        p-3
                                                        border
                                                        border-slate-200
                                                        rounded-lg
                                                        text-xs
                                                        flex
                                                        flex-col
                                                        gap-2
                                                        shadow-sm
                                                    "
                                                >
                                                    <div
                                                        className="
                                                            flex
                                                            items-center
                                                            gap-2
                                                            font-semibold
                                                            text-slate-800
                                                        "
                                                    >
                                                        <FileText
                                                            className="
                                                                w-3.5
                                                                h-3.5
                                                                text-blue-600
                                                            "
                                                        />

                                                        <span>
                                                            Suggestion #
                                                            {index +
                                                                1}
                                                        </span>
                                                    </div>

                                                    <p
                                                        className="
                                                            text-slate-600
                                                            leading-relaxed
                                                            whitespace-pre-wrap
                                                        "
                                                    >
                                                        {content}
                                                    </p>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <ModalFooter />
                </ModalOverlay>
            )}

            {/* =================================================
                FEEDBACK
               ================================================= */}

            {activeModal === MODALS.FEEDBACK && (
                <ModalOverlay
                    labelledBy="macevo-readability-feedback-title"
                    width="w-[420px]"
                >
                    <ModalHeader
                        id="macevo-readability-feedback-title"
                        icon={AlertCircle}
                        title="Information — Lisibilité"
                    />

                    <div
                        className="
                            p-6
                            flex
                            flex-col
                            items-center
                            justify-center
                            text-center
                            gap-3
                            bg-white
                        "
                    >
                        <div
                            className="
                                w-10
                                h-10
                                rounded-full
                                bg-blue-50
                                text-blue-600
                                flex
                                items-center
                                justify-center
                            "
                        >
                            <CheckCircle2 className="w-5 h-5" />
                        </div>

                        <p
                            className="
                                text-xs
                                text-slate-700
                                font-medium
                                leading-relaxed
                            "
                        >
                            {feedbackMessage}
                        </p>
                    </div>

                    <div
                        className="
                            flex
                            items-center
                            justify-end
                            px-6
                            py-4
                            border-t
                            border-slate-200
                            bg-slate-50
                        "
                    >
                        <button
                            type="button"
                            onClick={closeModal}
                            className="
                                px-4
                                py-2
                                text-xs
                                font-medium
                                text-white
                                bg-blue-600
                                hover:bg-blue-700
                                rounded
                                shadow-sm
                            "
                        >
                            OK
                        </button>
                    </div>
                </ModalOverlay>
            )}
        </>
    );
}

export default ReadabilityGroup;