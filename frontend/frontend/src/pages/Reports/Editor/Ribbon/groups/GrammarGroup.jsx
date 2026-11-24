 /**
  * ===========================================================
  * MACEVO
  * -----------------------------------------------------------
  * Fichier : GrammarGroup.jsx
  * Version : 5.0.0
  * Statut  : Vérification grammaticale professionnelle
  * ===========================================================
  */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    Languages,
    RefreshCw,
    BookOpenCheck,
    X,
    Check,
    AlertTriangle,
    AlertCircle,
    Globe,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import grammarEngine from "../../../../../core/document/engines/language/GrammarEngine";
import languageEngine from "../../../../../core/document/engines/language/LanguageEngine";

const AVAILABLE_LANGUAGES = [
    {
        code: "fr",
        label: "Français",
        nativeLabel: "Français",
    },
    {
        code: "en",
        label: "Anglais",
        nativeLabel: "English",
    },
    {
        code: "es",
        label: "Espagnol",
        nativeLabel: "Español",
    },
    {
        code: "de",
        label: "Allemand",
        nativeLabel: "Deutsch",
    },
    {
        code: "it",
        label: "Italien",
        nativeLabel: "Italiano",
    },
    {
        code: "pt",
        label: "Portugais",
        nativeLabel: "Português",
    },
];

function normalizeLanguageCode(value) {
    if (!value || typeof value !== "string") {
        return "";
    }

    return value.trim().toLowerCase();
}

function isValidLanguageCode(value) {
    return /^[a-z]{2,3}(?:-[a-z]{2,4})?$/i.test(value);
}

function normalizeGrammarResult(result) {
    if (!result) {
        return [];
    }

    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result.errors)) {
        return result.errors;
    }

    if (Array.isArray(result.matches)) {
        return result.matches;
    }

    return [];
}

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
        "Le moteur grammatical n'a pas pu effectuer l'analyse."
    );
}

function GrammarGroup() {
    const { editor } = useEditorContext();

    const [activeModal, setActiveModal] = useState(null);
    const [grammarErrors, setGrammarErrors] = useState([]);
    const [isChecking, setIsChecking] = useState(false);
    const [analysisError, setAnalysisError] = useState("");
    const [selectedLanguage, setSelectedLanguage] =
        useState("fr");

    /* ======================================================
       FERMETURE AVEC ESCAPE
    ====================================================== */

    useEffect(() => {
        if (!activeModal) {
            return undefined;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape" && !isChecking) {
                setActiveModal(null);
                setAnalysisError("");
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
    }, [activeModal, isChecking]);

    if (!editor) {
        return null;
    }

    /* ======================================================
       FERMER
    ====================================================== */

    function closeModal() {
        if (isChecking) {
            return;
        }

        setActiveModal(null);
        setAnalysisError("");
    }

    /* ======================================================
       RÉCUPÉRER LA LANGUE
    ====================================================== */

    function getCurrentLanguage() {
        try {
            return (
                normalizeLanguageCode(
                    languageEngine.getLanguage()
                ) || "fr"
            );
        } catch (error) {
            console.error(
                "MACEVO : impossible de récupérer la langue.",
                error
            );

            return "fr";
        }
    }

    /* ======================================================
       VÉRIFIER LA GRAMMAIRE
    ====================================================== */

    async function verifyGrammar() {
        let text = "";

        try {
            text = editor.getText();
        } catch (error) {
            console.error(
                "MACEVO : impossible de récupérer le texte.",
                error
            );

            setAnalysisError(
                "Impossible de récupérer le contenu du document."
            );

            setActiveModal("grammarcheck");

            return;
        }

        if (!text.trim()) {
            setAnalysisError(
                "Le document est vide. Ajoutez du contenu avant de lancer la vérification grammaticale."
            );

            setGrammarErrors([]);
            setActiveModal("grammarcheck");

            return;
        }

        setIsChecking(true);
        setGrammarErrors([]);
        setAnalysisError("");
        setActiveModal("grammarcheck");

        try {
            const result =
                await grammarEngine.check(text);

            const errors =
                normalizeGrammarResult(result);

            setGrammarErrors(errors);
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de la vérification grammaticale.",
                error
            );

            setGrammarErrors([]);
            setAnalysisError(
                getErrorMessage(error)
            );
        } finally {
            setIsChecking(false);
        }
    }

    /* ======================================================
       RELANCER
    ====================================================== */

    async function restartGrammar() {
        try {
            if (
                typeof grammarEngine.reset ===
                "function"
            ) {
                grammarEngine.reset();
            }
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de la réinitialisation.",
                error
            );
        }

        await verifyGrammar();
    }

    /* ======================================================
       OUVRIR LANGUE
    ====================================================== */

    function openLanguageModal() {
        const currentLanguage =
            getCurrentLanguage();

        setSelectedLanguage(currentLanguage);
        setActiveModal("language");
    }

    /* ======================================================
       CHANGER LANGUE
    ====================================================== */

    function handleConfirmLanguage(value) {
        const languageCode =
            normalizeLanguageCode(value);

        if (!languageCode) {
            window.alert(
                "Veuillez saisir un code de langue."
            );

            return;
        }

        if (!isValidLanguageCode(languageCode)) {
            window.alert(
                "Code de langue invalide.\n\n" +
                "Exemples : fr, en, es, de, nl ou pt-br."
            );

            return;
        }

        try {
            languageEngine.setLanguage(
                languageCode
            );

            if (
                typeof grammarEngine.setLanguage ===
                "function"
            ) {
                grammarEngine.setLanguage(
                    languageCode
                );
            }

            setSelectedLanguage(languageCode);
            setActiveModal(null);
        } catch (error) {
            console.error(
                "MACEVO : impossible de changer la langue.",
                error
            );

            window.alert(
                "Impossible de modifier la langue de vérification."
            );
        }
    }

    /* ======================================================
       AFFICHAGE D'UNE ERREUR
    ====================================================== */

    function renderGrammarError(error, index) {
        if (!error) {
            return (
                <div
                    key={index}
                    className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600"
                >
                    Anomalie non spécifiée.
                </div>
            );
        }

        if (typeof error === "string") {
            return (
                <div
                    key={index}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />

                        <span>
                            Signalement #{index + 1}
                        </span>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-600">
                        {error}
                    </p>
                </div>
            );
        }

        const message =
            error.message ||
            error.description ||
            error.text ||
            error.context ||
            "Anomalie grammaticale détectée.";

        const suggestion =
            error.suggestion ||
            error.replacement ||
            error.replacements?.[0] ||
            "";

        const context =
            error.context ||
            error.sentence ||
            error.original ||
            "";

        return (
            <div
                key={index}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
                <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />

                        <span>
                            Erreur #{index + 1}
                        </span>
                    </div>

                    {suggestion && (
                        <span className="max-w-[55%] rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                            Suggestion : {suggestion}
                        </span>
                    )}
                </div>

                <p className="text-xs leading-relaxed text-slate-700">
                    {message}
                </p>

                {context && (
                    <div className="mt-3 rounded-md bg-slate-50 px-3 py-2">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Contexte
                        </span>

                        <p className="text-[11px] italic leading-relaxed text-slate-500">
                            {context}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    /* ======================================================
       MODALE GRAMMAIRE
    ====================================================== */

    const grammarModal =
        activeModal === "grammarcheck"
            ? createPortal(
                  <div
                      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
                      onMouseDown={(event) => {
                          if (
                              event.target ===
                              event.currentTarget &&
                              !isChecking
                          ) {
                              closeModal();
                          }
                      }}
                      role="presentation"
                  >
                      <div
                          className="flex max-h-[82vh] w-[620px] max-w-[95vw] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl"
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="macevo-grammar-title"
                          onMouseDown={(event) =>
                              event.stopPropagation()
                          }
                      >
                          {/* HEADER */}

                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                                      <BookOpenCheck className="h-5 w-5 text-emerald-600" />
                                  </div>

                                  <div>
                                      <h3
                                          id="macevo-grammar-title"
                                          className="text-sm font-bold text-slate-800"
                                      >
                                          Vérification grammaticale
                                      </h3>

                                      <p className="mt-0.5 text-[10px] text-slate-400">
                                          Analyse linguistique du
                                          document
                                      </p>
                                  </div>
                              </div>

                              <button
                                  type="button"
                                  onClick={closeModal}
                                  disabled={isChecking}
                                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  aria-label="Fermer"
                                  title="Fermer"
                              >
                                  <X className="h-5 w-5" />
                              </button>
                          </div>

                          {/* BODY */}

                          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5">
                              {isChecking ? (
                                  <div className="flex flex-col items-center justify-center py-16 text-center">
                                      <RefreshCw className="mb-4 h-8 w-8 animate-spin text-emerald-600" />

                                      <p className="text-xs font-semibold text-slate-700">
                                          Analyse grammaticale en
                                          cours...
                                      </p>

                                      <p className="mt-1 text-[10px] text-slate-400">
                                          Veuillez patienter pendant
                                          l'analyse du texte.
                                      </p>
                                  </div>
                              ) : analysisError ? (
                                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                      <div className="flex items-start gap-3">
                                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                                          <div>
                                              <p className="text-xs font-semibold text-red-800">
                                                  Analyse impossible
                                              </p>

                                              <p className="mt-1 text-xs leading-relaxed text-red-700">
                                                  {analysisError}
                                              </p>
                                          </div>
                                      </div>
                                  </div>
                              ) : grammarErrors.length ===
                                0 ? (
                                  <div className="flex flex-col items-center justify-center py-14 text-center">
                                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                                          <Check className="h-7 w-7 text-emerald-600" />
                                      </div>

                                      <h4 className="text-sm font-bold text-slate-800">
                                          Aucune anomalie détectée
                                      </h4>

                                      <p className="mt-2 max-w-[390px] text-xs leading-relaxed text-slate-500">
                                          Le moteur grammatical n'a
                                          signalé aucune anomalie dans
                                          le texte analysé.
                                      </p>
                                  </div>
                              ) : (
                                  <div className="space-y-3">
                                      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />

                                          <span className="text-xs font-semibold text-amber-800">
                                              {grammarErrors.length}{" "}
                                              anomalie
                                              {grammarErrors.length >
                                              1
                                                  ? "s"
                                                  : ""}{" "}
                                              détectée
                                              {grammarErrors.length >
                                              1
                                                  ? "s"
                                                  : ""}
                                          </span>
                                      </div>

                                      <div className="space-y-2">
                                          {grammarErrors.map(
                                              renderGrammarError
                                          )}
                                      </div>
                                  </div>
                              )}
                          </div>

                          {/* FOOTER */}

                          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
                              <button
                                  type="button"
                                  onClick={restartGrammar}
                                  disabled={isChecking}
                                  className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                  <RefreshCw
                                      className={`h-3.5 w-3.5 ${
                                          isChecking
                                              ? "animate-spin"
                                              : ""
                                      }`}
                                  />

                                  Relancer
                              </button>

                              <button
                                  type="button"
                                  onClick={closeModal}
                                  disabled={isChecking}
                                  className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                  Fermer
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    /* ======================================================
       MODALE LANGUE
    ====================================================== */

    const languageModal =
        activeModal === "language"
            ? createPortal(
                  <div
                      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
                      onMouseDown={(event) => {
                          if (
                              event.target ===
                              event.currentTarget
                          ) {
                              closeModal();
                          }
                      }}
                      role="presentation"
                  >
                      <div
                          className="w-[480px] max-w-[95vw] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl"
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="macevo-language-title"
                          onMouseDown={(event) =>
                              event.stopPropagation()
                          }
                      >
                          {/* HEADER */}

                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                                      <Globe className="h-5 w-5 text-emerald-600" />
                                  </div>

                                  <div>
                                      <h3
                                          id="macevo-language-title"
                                          className="text-sm font-bold text-slate-800"
                                      >
                                          Langue de vérification
                                      </h3>

                                      <p className="mt-0.5 text-[10px] text-slate-400">
                                          Langue utilisée par le moteur
                                          grammatical
                                      </p>
                                  </div>
                              </div>

                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                                  aria-label="Fermer"
                              >
                                  <X className="h-5 w-5" />
                              </button>
                          </div>

                          {/* BODY */}

                          <div className="bg-slate-50 p-5">
                              <p className="mb-4 text-xs leading-relaxed text-slate-600">
                                  Sélectionnez la langue principale
                                  utilisée pour l'analyse grammaticale
                                  du document.
                              </p>

                              <div className="grid grid-cols-2 gap-2">
                                  {AVAILABLE_LANGUAGES.map(
                                      (language) => {
                                          const selected =
                                              selectedLanguage ===
                                              language.code;

                                          return (
                                              <button
                                                  key={
                                                      language.code
                                                  }
                                                  type="button"
                                                  onClick={() =>
                                                      handleConfirmLanguage(
                                                          language.code
                                                      )
                                                  }
                                                  className={`flex min-h-[60px] items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
                                                      selected
                                                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm"
                                                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                                                  }`}
                                              >
                                                  <span className="flex min-w-0 flex-col">
                                                      <span className="text-xs font-semibold">
                                                          {
                                                              language.label
                                                          }
                                                      </span>

                                                      <span className="mt-0.5 text-[10px] text-slate-400">
                                                          {
                                                              language.nativeLabel
                                                          }
                                                      </span>
                                                  </span>

                                                  {selected && (
                                                      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                                                  )}
                                              </button>
                                          );
                                      }
                                  )}
                              </div>

                              <div className="mt-5 border-t border-slate-200 pt-4">
                                  <label
                                      htmlFor="macevo-grammar-language"
                                      className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                                  >
                                      Code de langue personnalisé
                                  </label>

                                  <div className="flex gap-2">
                                      <input
                                          id="macevo-grammar-language"
                                          type="text"
                                          value={
                                              selectedLanguage
                                          }
                                          onChange={(event) =>
                                              setSelectedLanguage(
                                                  event.target
                                                      .value
                                              )
                                          }
                                          onKeyDown={(event) => {
                                              if (
                                                  event.key ===
                                                  "Enter"
                                              ) {
                                                  handleConfirmLanguage(
                                                      selectedLanguage
                                                  );
                                              }
                                          }}
                                          placeholder="ex. fr, en, nl, pt-br"
                                          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                                      />

                                      <button
                                          type="button"
                                          onClick={() =>
                                              handleConfirmLanguage(
                                                  selectedLanguage
                                              )
                                          }
                                          className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
                                      >
                                          Appliquer
                                      </button>
                                  </div>
                              </div>
                          </div>

                          {/* FOOTER */}

                          <div className="flex justify-end border-t border-slate-200 bg-white px-5 py-4">
                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                              >
                                  Annuler
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    /* ======================================================
       RENDU
    ====================================================== */

    return (
        <>
            <RibbonGroup
                title="Grammaire"
                className="w-[215px] min-w-[215px]"
            >
                <div className="flex h-full items-center gap-1">
                    <RibbonButton
                        icon={BookOpenCheck}
                        label="Vérifier"
                        tooltip="Analyser la grammaire du document"
                        onClick={verifyGrammar}
                    />

                    <RibbonButton
                        icon={RefreshCw}
                        label="Relancer"
                        tooltip="Relancer l'analyse grammaticale"
                        onClick={restartGrammar}
                    />

                    <RibbonButton
                        icon={Languages}
                        label="Langue"
                        tooltip="Modifier la langue de vérification"
                        onClick={openLanguageModal}
                    />
                </div>
            </RibbonGroup>

            {grammarModal}
            {languageModal}
        </>
    );
}

export default GrammarGroup;