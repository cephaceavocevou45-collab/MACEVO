/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : GrammarCustomGroup.jsx
 * Version : 2.0.0
 * Statut  : Vérification grammaticale — moteur unifié
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    BookOpenCheck,
    RefreshCw,
    X,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import grammarEngine from "../../../../../core/document/engines/language/GrammarEngine";

function GrammarCustomGroup({ editor }) {
    const [activeModal, setActiveModal] = useState(null);
    const [grammarErrors, setGrammarErrors] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    if (!editor) return null;

    /* ======================================================
       FERMETURE
    ====================================================== */

    const closeModal = () => {
        if (isLoading) return;

        setActiveModal(null);
        setErrorMessage("");
    };

    useEffect(() => {
        if (!activeModal) return undefined;

        const handleEscape = (event) => {
            if (event.key === "Escape" && !isLoading) {
                closeModal();
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [activeModal, isLoading]);

    /* ======================================================
       NORMALISATION DES RÉSULTATS
    ====================================================== */

    const normalizeErrors = (result) => {
        if (!result) return [];

        if (Array.isArray(result)) {
            return result;
        }

        /*
         * Certains moteurs peuvent retourner un objet
         * contenant directement les erreurs.
         */
        if (Array.isArray(result.errors)) {
            return result.errors;
        }

        if (Array.isArray(result.matches)) {
            return result.matches;
        }

        return [];
    };

    const getErrorMessage = (error) => {
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
    };

    /* ======================================================
       VÉRIFICATION GRAMMATICALE
    ====================================================== */

    const checkGrammar = async () => {
        if (!editor) return;

        let text = "";

        try {
            text = editor.getText();
        } catch (error) {
            console.error(
                "MACEVO : impossible de récupérer le texte.",
                error
            );

            setErrorMessage(
                "Impossible de récupérer le contenu du document."
            );

            setActiveModal("error");
            return;
        }

        if (!text.trim()) {
            setErrorMessage(
                "Le document est vide. Ajoutez du contenu avant de lancer l'analyse grammaticale."
            );

            setActiveModal("error");
            return;
        }

        setGrammarErrors([]);
        setErrorMessage("");
        setIsLoading(true);
        setActiveModal("grammar");

        try {
            const result = await grammarEngine.check(text);

            const errors = normalizeErrors(result);

            setGrammarErrors(errors);
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de l'analyse grammaticale.",
                error
            );

            setGrammarErrors([]);
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    /* ======================================================
       RELANCER L'ANALYSE
    ====================================================== */

    const restartGrammar = async () => {
        try {
            if (typeof grammarEngine.reset === "function") {
                grammarEngine.reset();
            }
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de la réinitialisation du moteur grammatical.",
                error
            );
        }

        await checkGrammar();
    };

    /* ======================================================
       FORMATAGE D'UNE ERREUR
    ====================================================== */

    const renderError = (item, index) => {
        if (!item) {
            return (
                <div
                    key={index}
                    className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600"
                >
                    Erreur non spécifiée.
                </div>
            );
        }

        if (typeof item === "string") {
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
                        {item}
                    </p>
                </div>
            );
        }

        const message =
            item.message ||
            item.description ||
            item.text ||
            item.context ||
            "Anomalie grammaticale détectée.";

        const suggestion =
            item.suggestion ||
            item.replacement ||
            item.replacements?.[0] ||
            "";

        const context =
            item.context ||
            item.sentence ||
            item.original ||
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
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
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
    };

    /* ======================================================
       MODALE PRINCIPALE
    ====================================================== */

    const grammarModal =
        activeModal === "grammar"
            ? createPortal(
                  <div
                      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
                      onMouseDown={(event) => {
                          if (
                              event.target ===
                              event.currentTarget &&
                              !isLoading
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
                          aria-labelledby="macevo-grammar-custom-title"
                          onMouseDown={(event) =>
                              event.stopPropagation()
                          }
                      >
                          {/* HEADER */}

                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <div className="flex items-center gap-2">
                                  <BookOpenCheck className="h-5 w-5 text-emerald-600" />

                                  <div>
                                      <h3
                                          id="macevo-grammar-custom-title"
                                          className="text-sm font-bold text-slate-800"
                                      >
                                          Analyse grammaticale
                                      </h3>

                                      <p className="mt-0.5 text-[10px] text-slate-400">
                                          Vérification du document
                                      </p>
                                  </div>
                              </div>

                              <button
                                  type="button"
                                  onClick={closeModal}
                                  disabled={isLoading}
                                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  aria-label="Fermer"
                                  title="Fermer"
                              >
                                  <X className="h-5 w-5" />
                              </button>
                          </div>

                          {/* CONTENU */}

                          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5">
                              {isLoading ? (
                                  <div className="flex flex-col items-center justify-center py-16 text-center">
                                      <RefreshCw className="mb-4 h-8 w-8 animate-spin text-emerald-600" />

                                      <p className="text-xs font-semibold text-slate-700">
                                          Analyse grammaticale en
                                          cours...
                                      </p>

                                      <p className="mt-1 text-[10px] text-slate-400">
                                          Le moteur linguistique analyse
                                          le document.
                                      </p>
                                  </div>
                              ) : errorMessage ? (
                                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                      <div className="flex items-start gap-3">
                                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                                          <div>
                                              <p className="text-xs font-semibold text-red-800">
                                                  Analyse impossible
                                              </p>

                                              <p className="mt-1 text-xs leading-relaxed text-red-700">
                                                  {errorMessage}
                                              </p>
                                          </div>
                                      </div>
                                  </div>
                              ) : grammarErrors.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-14 text-center">
                                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                                          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                                      </div>

                                      <h4 className="text-sm font-bold text-slate-800">
                                          Aucune anomalie détectée
                                      </h4>

                                      <p className="mt-2 max-w-[380px] text-xs leading-relaxed text-slate-500">
                                          Le moteur grammatical n'a
                                          signalé aucune erreur dans le
                                          texte analysé.
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
                                              renderError
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
                                  disabled={isLoading}
                                  className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                  <RefreshCw
                                      className={`h-3.5 w-3.5 ${
                                          isLoading
                                              ? "animate-spin"
                                              : ""
                                      }`}
                                  />

                                  Relancer
                              </button>

                              <button
                                  type="button"
                                  onClick={closeModal}
                                  disabled={isLoading}
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
       MODALE ERREUR / DOCUMENT VIDE
    ====================================================== */

    const errorModal =
        activeModal === "error"
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
                          className="w-[440px] max-w-[95vw] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl"
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="macevo-grammar-error-title"
                          onMouseDown={(event) =>
                              event.stopPropagation()
                          }
                      >
                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <h3
                                  id="macevo-grammar-error-title"
                                  className="flex items-center gap-2 text-sm font-bold text-slate-800"
                              >
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                  Analyse grammaticale
                              </h3>

                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                  aria-label="Fermer"
                              >
                                  <X className="h-5 w-5" />
                              </button>
                          </div>

                          <div className="bg-slate-50 px-5 py-6">
                              <p className="text-xs leading-relaxed text-slate-700">
                                  {errorMessage}
                              </p>
                          </div>

                          <div className="flex justify-end border-t border-slate-200 bg-white px-5 py-4">
                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                              >
                                  OK
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    return (
        <>
            <RibbonGroup
                title="Grammaire"
                className="w-[150px] min-w-[150px]"
            >
                <RibbonButton
                    icon={BookOpenCheck}
                    label="Vérifier"
                    tooltip="Analyser la grammaire du document"
                    onClick={checkGrammar}
                />
            </RibbonGroup>

            {grammarModal}
            {errorModal}
        </>
    );
}

export default GrammarCustomGroup;