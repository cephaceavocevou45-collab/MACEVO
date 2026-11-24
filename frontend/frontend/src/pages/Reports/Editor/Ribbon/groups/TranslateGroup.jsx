/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : TranslateGroup.jsx
 * Version : 4.0.0
 * Statut  : Professionnel — traduction scientifique
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
    Languages,
    ArrowRightLeft,
    Globe,
    X,
    Check,
    Sparkles,
    FileText,
    RefreshCw,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import translateEngine from "../../../../../core/document/engines/language/TranslateEngine";


/* ===========================================================
   LANGUES DISPONIBLES
   =========================================================== */

const AVAILABLE_LANGUAGES = [
    { code: "fr", label: "Français" },
    { code: "en", label: "Anglais" },
    { code: "es", label: "Espagnol" },
    { code: "de", label: "Allemand" },
    { code: "it", label: "Italien" },
    { code: "pt", label: "Portugais" },
];


/* ===========================================================
   UTILITAIRES
   =========================================================== */

function normalizeLanguage(value, fallback) {
    const normalized = String(value ?? "")
        .trim()
        .toLowerCase();

    return normalized || fallback;
}


function normalizeTranslationResult(result) {
    if (typeof result === "string") {
        return result.trim();
    }

    if (result == null) {
        return "";
    }

    if (typeof result === "object") {
        if (typeof result.translation === "string") {
            return result.translation.trim();
        }

        if (typeof result.text === "string") {
            return result.text.trim();
        }

        if (typeof result.content === "string") {
            return result.content.trim();
        }

        if (
            result.message &&
            typeof result.message.content === "string"
        ) {
            return result.message.content.trim();
        }
    }

    return String(result).trim();
}


/* ===========================================================
   COMPOSANT
   =========================================================== */

function TranslateGroup() {
    const { editor } = useEditorContext();

    const [activeModal, setActiveModal] =
        useState(null);

    const [modalData, setModalData] = useState({
        title: "",
        sourceText: "",
        resultText: "",
    });

    const [isLoading, setIsLoading] =
        useState(false);

    const [sourceLang, setSourceLang] =
        useState("fr");

    const [targetLang, setTargetLang] =
        useState("en");

    const [languageError, setLanguageError] =
        useState("");


    /* =======================================================
       FERMETURE AVEC ESC
    ======================================================= */

    useEffect(() => {
        if (!activeModal) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                if (!isLoading) {
                    setActiveModal(null);
                    setLanguageError("");
                }
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


    /* =======================================================
       OBTENIR LES LANGUES ACTUELLES
    ======================================================= */

    const getConfiguredLanguages = () => {
        let source = "fr";
        let target = "en";

        try {
            if (
                typeof translateEngine?.getSourceLanguage ===
                "function"
            ) {
                source =
                    translateEngine.getSourceLanguage() ||
                    "fr";
            }

            if (
                typeof translateEngine?.getTargetLanguage ===
                "function"
            ) {
                target =
                    translateEngine.getTargetLanguage() ||
                    "en";
            }
        } catch (error) {
            console.error(
                "MACEVO — lecture de la configuration des langues impossible :",
                error
            );
        }

        return {
            source: normalizeLanguage(source, "fr"),
            target: normalizeLanguage(target, "en"),
        };
    };


    /* =======================================================
       TRADUCTION GÉNÉRIQUE
    ======================================================= */

    const runTranslation = async ({
        text,
        title,
        sourcePreview,
    }) => {
        if (!editor || !text?.trim()) {
            return;
        }

        if (
            typeof translateEngine?.translate !==
            "function"
        ) {
            setModalData({
                title,
                sourceText: sourcePreview,
                resultText:
                    "Le moteur de traduction n'est pas disponible.",
            });

            setActiveModal("translate-result");

            return;
        }

        setIsLoading(true);

        setModalData({
            title,
            sourceText: sourcePreview,
            resultText: "",
        });

        setActiveModal("translate-result");

        try {
            const result =
                await translateEngine.translate(
                    text
                );

            const translated =
                normalizeTranslationResult(result);

            setModalData({
                title,
                sourceText: sourcePreview,
                resultText:
                    translated ||
                    "Aucune traduction disponible.",
            });
        } catch (error) {
            console.error(
                "MACEVO — erreur lors de la traduction :",
                error
            );

            setModalData({
                title,
                sourceText: sourcePreview,
                resultText:
                    error?.message ||
                    "Une erreur est survenue pendant la traduction.",
            });
        } finally {
            setIsLoading(false);
        }
    };


    /* =======================================================
       TRADUIRE LA SÉLECTION
    ======================================================= */

    const translateSelection = async () => {
        if (!editor) {
            return;
        }

        const { from, to } =
            editor.state.selection;

        const text =
            editor.state.doc
                .textBetween(
                    from,
                    to,
                    " "
                )
                .trim();

        if (!text) {
            setModalData({
                title: "Traduction de la sélection",
                sourceText: "",
                resultText:
                    "Veuillez sélectionner un texte dans le document avant de lancer la traduction.",
            });

            setActiveModal("translate-result");

            return;
        }

        await runTranslation({
            text,
            title: "Traduction de la sélection",
            sourcePreview: text,
        });
    };


    /* =======================================================
       TRADUIRE LE DOCUMENT
    ======================================================= */

    const translateDocument = async () => {
        if (!editor) {
            return;
        }

        const text =
            editor.getText().trim();

        if (!text) {
            setModalData({
                title: "Traduction complète du document",
                sourceText: "",
                resultText:
                    "Le document est vide. Ajoutez du contenu avant de lancer la traduction.",
            });

            setActiveModal("translate-result");

            return;
        }

        const preview =
            text.length > 500
                ? `${text.slice(0, 500)}…`
                : text;

        await runTranslation({
            text,
            title:
                "Traduction complète du document",
            sourcePreview: preview,
        });
    };


    /* =======================================================
       CONFIGURATION DES LANGUES
    ======================================================= */

    const openLanguagesModal = () => {
        const configured =
            getConfiguredLanguages();

        setSourceLang(configured.source);
        setTargetLang(configured.target);
        setLanguageError("");
        setActiveModal("languages-config");
    };


    /* =======================================================
       ENREGISTRER LES LANGUES
    ======================================================= */

    const handleConfirmLanguages = () => {
        const source =
            normalizeLanguage(
                sourceLang,
                ""
            );

        const target =
            normalizeLanguage(
                targetLang,
                ""
            );

        if (!source || !target) {
            setLanguageError(
                "Les deux langues doivent être renseignées."
            );

            return;
        }

        if (source === target) {
            setLanguageError(
                "La langue source et la langue cible doivent être différentes."
            );

            return;
        }

        if (
            typeof translateEngine?.configure !==
            "function"
        ) {
            setLanguageError(
                "La configuration du moteur de traduction n'est pas disponible."
            );

            return;
        }

        try {
            translateEngine.configure({
                sourceLanguage: source,
                targetLanguage: target,
            });

            setSourceLang(source);
            setTargetLang(target);
            setLanguageError("");
            setActiveModal(null);
        } catch (error) {
            console.error(
                "MACEVO — impossible de configurer les langues :",
                error
            );

            setLanguageError(
                error?.message ||
                    "Impossible d'enregistrer la configuration des langues."
            );
        }
    };


    /* =======================================================
       DOCUMENT NON DISPONIBLE
    ======================================================= */

    if (!editor) {
        return null;
    }


    /* =======================================================
       RENDU
    ======================================================= */

    return (
        <RibbonGroup
            title="Traduction"
            className="w-[210px] min-w-[210px]"
        >

            {/* =================================================
                SÉLECTION
            ================================================= */}

            <RibbonButton
                icon={Languages}
                label="Sélection"
                tooltip="Traduire le texte sélectionné"
                onClick={translateSelection}
            />


            {/* =================================================
                DOCUMENT
            ================================================= */}

            <RibbonButton
                icon={ArrowRightLeft}
                label="Document"
                tooltip="Traduire le document complet"
                onClick={translateDocument}
            />


            {/* =================================================
                LANGUES
            ================================================= */}

            <RibbonButton
                icon={Globe}
                label="Langues"
                tooltip="Configurer les langues source et cible"
                onClick={openLanguagesModal}
            />


            {/* =================================================
                MODALE DE TRADUCTION
            ================================================= */}

            {activeModal ===
                "translate-result" &&
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
                            aria-labelledby="macevo-translation-title"
                        >

                            {/* HEADER */}

                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">

                                <h3
                                    id="macevo-translation-title"
                                    className="text-sm font-bold text-gray-800 flex items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4 text-blue-600" />

                                    {modalData.title}
                                </h3>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isLoading) {
                                            setActiveModal(null);
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

                            <div className="p-6 flex flex-col gap-5 max-h-[65vh] overflow-y-auto bg-slate-50">

                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-500 text-xs">

                                        <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />

                                        <span className="font-medium">
                                            Traduction en cours…
                                        </span>

                                        <span className="text-[11px] text-gray-400">
                                            Le moteur analyse le contenu scientifique.
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        {/* ORIGINAL */}

                                        {modalData.sourceText && (
                                            <div className="flex flex-col gap-1.5">

                                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                    Texte source
                                                </span>

                                                <div className="p-3 bg-white border border-gray-200 rounded-md text-xs text-gray-600 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">
                                                    {modalData.sourceText}
                                                </div>

                                            </div>
                                        )}


                                        {/* TRADUCTION */}

                                        <div className="flex flex-col gap-1.5">

                                            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">

                                                <FileText className="w-3.5 h-3.5" />

                                                Résultat traduit
                                            </span>

                                            <div
                                                className={`p-4 border rounded-lg text-xs leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto ${
                                                    modalData.resultText?.startsWith(
                                                        "Erreur"
                                                    ) ||
                                                    modalData.resultText?.includes(
                                                        "n'est pas disponible"
                                                    )
                                                        ? "bg-red-50 border-red-200 text-red-700"
                                                        : "bg-blue-50/40 border-blue-200 text-gray-800"
                                                }`}
                                            >
                                                {modalData.resultText ||
                                                    "Aucun résultat."}
                                            </div>

                                        </div>
                                    </>
                                )}

                            </div>


                            {/* FOOTER */}

                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">

                                <div className="text-[10px] text-gray-400">
                                    {sourceLang.toUpperCase()} →{" "}
                                    {targetLang.toUpperCase()}
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
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


            {/* =================================================
                MODALE CONFIGURATION LANGUES
            ================================================= */}

            {activeModal ===
                "languages-config" &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setActiveModal(null);
                                setLanguageError("");
                            }
                        }}
                    >
                        <div
                            className="bg-white rounded-xl shadow-2xl border border-gray-300 w-[500px] max-w-[95vw] overflow-hidden flex flex-col"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="macevo-language-title"
                        >

                            {/* HEADER */}

                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">

                                <h3
                                    id="macevo-language-title"
                                    className="text-sm font-bold text-gray-800 flex items-center gap-2"
                                >
                                    <Globe className="w-4 h-4 text-blue-600" />

                                    Configuration des langues
                                </h3>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveModal(null);
                                        setLanguageError("");
                                    }}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded"
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                            </div>


                            {/* CONTENU */}

                            <div className="p-6 flex flex-col gap-5 bg-slate-50">

                                {/* SOURCE */}

                                <div className="flex flex-col gap-2">

                                    <label
                                        htmlFor="macevo-source-language"
                                        className="text-xs font-bold text-gray-700"
                                    >
                                        Langue source
                                    </label>

                                    <select
                                        id="macevo-source-language"
                                        value={sourceLang}
                                        onChange={(event) =>
                                            setSourceLang(
                                                event.target.value
                                            )
                                        }
                                        className="px-3 py-2.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    >
                                        {AVAILABLE_LANGUAGES.map(
                                            (language) => (
                                                <option
                                                    key={`source-${language.code}`}
                                                    value={
                                                        language.code
                                                    }
                                                >
                                                    {language.label}{" "}
                                                    (
                                                    {
                                                        language.code
                                                    }
                                                    )
                                                </option>
                                            )
                                        )}
                                    </select>

                                </div>


                                {/* CIBLE */}

                                <div className="flex flex-col gap-2">

                                    <label
                                        htmlFor="macevo-target-language"
                                        className="text-xs font-bold text-gray-700"
                                    >
                                        Langue cible
                                    </label>

                                    <select
                                        id="macevo-target-language"
                                        value={targetLang}
                                        onChange={(event) =>
                                            setTargetLang(
                                                event.target.value
                                            )
                                        }
                                        className="px-3 py-2.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    >
                                        {AVAILABLE_LANGUAGES.map(
                                            (language) => (
                                                <option
                                                    key={`target-${language.code}`}
                                                    value={
                                                        language.code
                                                    }
                                                >
                                                    {language.label}{" "}
                                                    (
                                                    {
                                                        language.code
                                                    }
                                                    )
                                                </option>
                                            )
                                        )}
                                    </select>

                                </div>


                                {/* CODES PERSONNALISÉS */}

                                <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">

                                    <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                                        Codes personnalisés
                                    </label>

                                    <div className="grid grid-cols-2 gap-2">

                                        <input
                                            type="text"
                                            value={sourceLang}
                                            onChange={(event) =>
                                                setSourceLang(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="ex. fr"
                                            className="px-3 py-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                            aria-label="Code de langue source"
                                        />

                                        <input
                                            type="text"
                                            value={targetLang}
                                            onChange={(event) =>
                                                setTargetLang(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="ex. en"
                                            className="px-3 py-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                            aria-label="Code de langue cible"
                                        />

                                    </div>

                                    <p className="text-[10px] text-gray-400">
                                        Utilisez un code compatible
                                        avec le moteur de traduction
                                        pour une langue personnalisée.
                                    </p>

                                </div>


                                {/* ERREUR */}

                                {languageError && (
                                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">

                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

                                        <span>
                                            {languageError}
                                        </span>

                                    </div>
                                )}

                            </div>


                            {/* FOOTER */}

                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveModal(null);
                                        setLanguageError("");
                                    }}
                                    className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                >
                                    Annuler
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleConfirmLanguages
                                    }
                                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors flex items-center gap-1.5"
                                >
                                    <Check className="w-3.5 h-3.5" />

                                    Enregistrer
                                </button>

                            </div>

                        </div>
                    </div>,
                    document.body
                )}

        </RibbonGroup>
    );
}

export default TranslateGroup;