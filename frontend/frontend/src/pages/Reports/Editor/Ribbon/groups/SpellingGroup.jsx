/**
 * ===========================================================
 * MACEVO — ÉDITEUR SCIENTIFIQUE
 * -----------------------------------------------------------
 * Fichier : SpellingGroup.jsx
 * Version : 5.0.0
 * Statut  : Vérification orthographique et gestion de langue
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
    SpellCheck,
    RefreshCw,
    Languages,
    X,
    Check,
    AlertTriangle,
    Globe,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import spellingEngine from "../../../../../core/document/engines/language/SpellingEngine";
import languageEngine from "../../../../../core/document/engines/language/LanguageEngine";

const LANGUAGES = [
    { code: "fr", label: "Français" },
    { code: "en", label: "Anglais (English)" },
    { code: "es", label: "Espagnol (Español)" },
    { code: "de", label: "Allemand (Deutsch)" },
    { code: "it", label: "Italien (Italiano)" },
    { code: "pt", label: "Portugais (Português)" },
];

function SpellingGroup() {
    const { editor } = useEditorContext();

    const [activeModal, setActiveModal] =
        useState(null);

    const [spellingErrors, setSpellingErrors] =
        useState([]);

    const [isChecking, setIsChecking] =
        useState(false);

    const [selectedLanguage, setSelectedLanguage] =
        useState("fr");

    const [errorMessage, setErrorMessage] =
        useState("");

    /**
     * ---------------------------------------------------------
     * FERMETURE AVEC ESCAPE
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (!activeModal) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setActiveModal(null);
                setErrorMessage("");
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

    if (!editor) {
        return null;
    }

    /**
     * ---------------------------------------------------------
     * OUVRIR LA MODALE D'ORTHOGRAPHE
     * ---------------------------------------------------------
     */

    const verifySpelling = async () => {
        if (isChecking) {
            return;
        }

        setErrorMessage("");

        let text = "";

        try {
            text = editor.getText() || "";
        } catch (error) {
            console.error(
                "[MACEVO Spelling] Impossible de lire le document :",
                error
            );

            setErrorMessage(
                "Impossible de récupérer le contenu du document."
            );

            setActiveModal("spellcheck");
            return;
        }

        if (!text.trim()) {
            setSpellingErrors([]);
            setErrorMessage(
                "Le document est vide. Ajoutez du texte avant de lancer la vérification."
            );
            setActiveModal("spellcheck");
            return;
        }

        if (
            !spellingEngine ||
            typeof spellingEngine.check !==
                "function"
        ) {
            setSpellingErrors([]);
            setErrorMessage(
                "Le moteur de vérification orthographique n'est pas disponible."
            );
            setActiveModal("spellcheck");
            return;
        }

        setActiveModal("spellcheck");
        setIsChecking(true);

        try {
            const result =
                await spellingEngine.check(text);

            const errors = Array.isArray(result)
                ? result
                : [];

            setSpellingErrors(errors);
        } catch (error) {
            console.error(
                "[MACEVO Spelling] Erreur de vérification :",
                error
            );

            setSpellingErrors([]);

            setErrorMessage(
                error?.message ||
                    "Une erreur est survenue pendant la vérification orthographique."
            );
        } finally {
            setIsChecking(false);
        }
    };

    /**
     * ---------------------------------------------------------
     * RELANCER
     * ---------------------------------------------------------
     */

    const restartVerification = async () => {
        setErrorMessage("");

        try {
            if (
                spellingEngine &&
                typeof spellingEngine.reset ===
                    "function"
            ) {
                spellingEngine.reset();
            }
        } catch (error) {
            console.error(
                "[MACEVO Spelling] Erreur lors de la réinitialisation :",
                error
            );
        }

        await verifySpelling();
    };

    /**
     * ---------------------------------------------------------
     * LANGUE
     * ---------------------------------------------------------
     */

    const openLanguageModal = () => {
        setErrorMessage("");

        try {
            const current =
                typeof languageEngine?.getLanguage ===
                "function"
                    ? languageEngine.getLanguage()
                    : "fr";

            setSelectedLanguage(
                current || "fr"
            );
        } catch (error) {
            console.error(
                "[MACEVO Language] Impossible de récupérer la langue :",
                error
            );

            setSelectedLanguage("fr");
        }

        setActiveModal("language");
    };

    /**
     * ---------------------------------------------------------
     * APPLIQUER LA LANGUE
     * ---------------------------------------------------------
     */

    const handleConfirmLanguage = (
        langCode
    ) => {
        const trimmed =
            String(langCode || "").trim();

        if (!trimmed) {
            setErrorMessage(
                "Veuillez indiquer un code de langue."
            );
            return;
        }

        setErrorMessage("");

        try {
            if (
                !languageEngine ||
                typeof languageEngine.setLanguage !==
                    "function"
            ) {
                throw new Error(
                    "Le moteur de langue n'est pas disponible."
                );
            }

            languageEngine.setLanguage(
                trimmed
            );

            if (
                spellingEngine &&
                typeof spellingEngine.setLanguage ===
                    "function"
            ) {
                spellingEngine.setLanguage(
                    trimmed
                );
            }

            setSelectedLanguage(trimmed);
            setActiveModal(null);
        } catch (error) {
            console.error(
                "[MACEVO Language] Erreur lors du changement de langue :",
                error
            );

            setErrorMessage(
                error?.message ||
                    "Impossible d'appliquer cette langue."
            );
        }
    };

    /**
     * ---------------------------------------------------------
     * MODALE ORTHOGRAPHE
     * ---------------------------------------------------------
     */

    const spellcheckModal =
        activeModal === "spellcheck"
            ? createPortal(
                  <div
                      className="
                          fixed inset-0
                          z-[999999]
                          flex items-center justify-center
                          bg-black/60
                          backdrop-blur-[3px]
                          p-4
                      "
                      onMouseDown={(event) => {
                          if (
                              event.target ===
                              event.currentTarget
                          ) {
                              setActiveModal(null);
                              setErrorMessage("");
                          }
                      }}
                  >
                      <div
                          className="
                              w-[560px]
                              max-w-[95vw]
                              max-h-[85vh]
                              overflow-hidden
                              flex flex-col
                              rounded-xl
                              border border-slate-300
                              bg-white
                              shadow-2xl
                          "
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="macevo-spelling-title"
                      >
                          <div
                              className="
                                  flex items-center justify-between
                                  border-b border-slate-200
                                  bg-slate-50
                                  px-5 py-4
                              "
                          >
                              <h3
                                  id="macevo-spelling-title"
                                  className="
                                      flex items-center gap-2
                                      text-sm font-bold
                                      text-slate-800
                                  "
                              >
                                  <SpellCheck
                                      className="h-4 w-4 text-blue-600"
                                  />
                                  Vérification orthographique
                              </h3>

                              <button
                                  type="button"
                                  onClick={() => {
                                      setActiveModal(
                                          null
                                      );
                                      setErrorMessage("");
                                  }}
                                  className="
                                      rounded-md p-1.5
                                      text-slate-400
                                      transition-colors
                                      hover:bg-slate-200
                                      hover:text-slate-700
                                  "
                                  aria-label="Fermer"
                              >
                                  <X className="h-5 w-5" />
                              </button>
                          </div>

                          <div
                              className="
                                  flex-1
                                  overflow-y-auto
                                  bg-slate-50
                                  p-5
                              "
                          >
                              {errorMessage && (
                                  <div
                                      className="
                                          mb-4
                                          flex items-start gap-2
                                          rounded-lg
                                          border border-red-200
                                          bg-red-50
                                          px-3 py-2.5
                                          text-xs text-red-700
                                      "
                                      role="alert"
                                  >
                                      <AlertCircle
                                          className="
                                              mt-0.5
                                              h-4 w-4
                                              shrink-0
                                          "
                                      />

                                      <span>
                                          {errorMessage}
                                      </span>
                                  </div>
                              )}

                              {isChecking ? (
                                  <div
                                      className="
                                          flex flex-col
                                          items-center
                                          justify-center
                                          gap-3 py-12
                                          text-center
                                          text-xs text-slate-500
                                      "
                                  >
                                      <RefreshCw
                                          className="
                                              h-7 w-7
                                              animate-spin
                                              text-blue-600
                                          "
                                      />

                                      <span>
                                          Analyse du document
                                          en cours...
                                      </span>
                                  </div>
                              ) : !errorMessage &&
                                spellingErrors.length ===
                                    0 ? (
                                  <div
                                      className="
                                          flex flex-col
                                          items-center
                                          justify-center
                                          gap-2
                                          py-12
                                          text-center
                                      "
                                  >
                                      <div
                                          className="
                                              flex h-12 w-12
                                              items-center
                                              justify-center
                                              rounded-full
                                              bg-emerald-50
                                              text-emerald-600
                                          "
                                      >
                                          <Check className="h-6 w-6" />
                                      </div>

                                      <h4 className="text-sm font-bold text-slate-800">
                                          Aucune anomalie détectée
                                      </h4>

                                      <p className="max-w-sm text-xs text-slate-500">
                                          Le moteur
                                          orthographique n'a
                                          retourné aucune
                                          anomalie pour le texte
                                          analysé.
                                      </p>
                                  </div>
                              ) : spellingErrors.length >
                                0 ? (
                                  <div className="flex flex-col gap-3">
                                      <div
                                          className="
                                              flex items-center gap-2
                                              rounded-lg
                                              border border-amber-200
                                              bg-amber-50
                                              px-3 py-2.5
                                              text-xs font-semibold
                                              text-amber-700
                                          "
                                      >
                                          <AlertTriangle className="h-4 w-4 shrink-0" />

                                          <span>
                                              {
                                                  spellingErrors.length
                                              }{" "}
                                              anomalie
                                              {spellingErrors.length >
                                              1
                                                  ? "s"
                                                  : ""}{" "}
                                              détectée
                                              {spellingErrors.length >
                                              1
                                                  ? "s"
                                                  : ""}.
                                          </span>
                                      </div>

                                      <div className="flex flex-col gap-2">
                                          {spellingErrors.map(
                                              (
                                                  error,
                                                  index
                                              ) => {
                                                  const message =
                                                      error?.message ||
                                                      error?.context ||
                                                      error?.word ||
                                                      "Anomalie non spécifiée";

                                                  return (
                                                      <div
                                                          key={`${index}-${message}`}
                                                          className="
                                                              rounded-lg
                                                              border border-slate-200
                                                              bg-white
                                                              p-3
                                                              shadow-sm
                                                          "
                                                      >
                                                          <div
                                                              className="
                                                                  flex
                                                                  items-center
                                                                  justify-between
                                                                  gap-2
                                                              "
                                                          >
                                                              <span
                                                                  className="
                                                                      text-xs
                                                                      font-semibold
                                                                      text-slate-800
                                                                  "
                                                              >
                                                                  Anomalie #
                                                                  {index +
                                                                      1}
                                                              </span>

                                                              {error?.suggestion && (
                                                                  <span
                                                                      className="
                                                                          rounded
                                                                          bg-blue-50
                                                                          px-2 py-1
                                                                          text-[11px]
                                                                          font-medium
                                                                          text-blue-700
                                                                      "
                                                                  >
                                                                      Suggestion :{" "}
                                                                      {
                                                                          error.suggestion
                                                                      }
                                                                  </span>
                                                              )}
                                                          </div>

                                                          <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                                              {message}
                                                          </p>
                                                      </div>
                                                  );
                                              }
                                          )}
                                      </div>
                                  </div>
                              ) : null}
                          </div>

                          <div
                              className="
                                  flex items-center
                                  justify-between
                                  gap-2
                                  border-t border-slate-200
                                  bg-white
                                  px-5 py-3
                              "
                          >
                              <button
                                  type="button"
                                  onClick={
                                      restartVerification
                                  }
                                  disabled={isChecking}
                                  className="
                                      flex items-center gap-1.5
                                      rounded-md
                                      border border-slate-300
                                      bg-white
                                      px-3 py-2
                                      text-xs font-medium
                                      text-slate-700
                                      transition-colors
                                      hover:bg-slate-100
                                      disabled:cursor-not-allowed
                                      disabled:opacity-50
                                  "
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
                                  onClick={() => {
                                      setActiveModal(null);
                                      setErrorMessage("");
                                  }}
                                  className="
                                      rounded-md
                                      bg-blue-600
                                      px-4 py-2
                                      text-xs font-medium
                                      text-white
                                      shadow-sm
                                      transition-colors
                                      hover:bg-blue-700
                                  "
                              >
                                  Fermer
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    /**
     * ---------------------------------------------------------
     * MODALE LANGUE
     * ---------------------------------------------------------
     */

    const languageModal =
        activeModal === "language"
            ? createPortal(
                  <div
                      className="
                          fixed inset-0
                          z-[999999]
                          flex items-center justify-center
                          bg-black/60
                          backdrop-blur-[3px]
                          p-4
                      "
                      onMouseDown={(event) => {
                          if (
                              event.target ===
                              event.currentTarget
                          ) {
                              setActiveModal(null);
                              setErrorMessage("");
                          }
                      }}
                  >
                      <div
                          className="
                              w-[470px]
                              max-w-[95vw]
                              overflow-hidden
                              rounded-xl
                              border border-slate-300
                              bg-white
                              shadow-2xl
                          "
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="macevo-language-title"
                      >
                          <div
                              className="
                                  flex items-center justify-between
                                  border-b border-slate-200
                                  bg-slate-50
                                  px-5 py-4
                              "
                          >
                              <h3
                                  id="macevo-language-title"
                                  className="
                                      flex items-center gap-2
                                      text-sm font-bold
                                      text-slate-800
                                  "
                              >
                                  <Globe className="h-4 w-4 text-blue-600" />
                                  Langue du document
                              </h3>

                              <button
                                  type="button"
                                  onClick={() => {
                                      setActiveModal(null);
                                      setErrorMessage("");
                                  }}
                                  className="
                                      rounded-md p-1.5
                                      text-slate-400
                                      hover:bg-slate-200
                                      hover:text-slate-700
                                  "
                                  aria-label="Fermer"
                              >
                                  <X className="h-5 w-5" />
                              </button>
                          </div>

                          <div className="bg-slate-50 p-5">
                              <p className="mb-4 text-xs leading-relaxed text-slate-600">
                                  Sélectionnez la langue
                                  principale utilisée pour la
                                  correction orthographique du
                                  document.
                              </p>

                              <div className="grid grid-cols-2 gap-2">
                                  {LANGUAGES.map(
                                      (language) => (
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
                                              className={`
                                                  flex items-center
                                                  justify-between
                                                  rounded-lg
                                                  border p-3
                                                  text-left text-xs
                                                  font-medium
                                                  transition-all
                                                  ${
                                                      selectedLanguage ===
                                                      language.code
                                                          ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
                                                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                                  }
                                              `}
                                          >
                                              <span>
                                                  {
                                                      language.label
                                                  }
                                              </span>

                                              {selectedLanguage ===
                                                  language.code && (
                                                  <Check className="h-3.5 w-3.5 text-blue-600" />
                                              )}
                                          </button>
                                      )
                                  )}
                              </div>

                              <div
                                  className="
                                      mt-5
                                      border-t border-slate-200
                                      pt-4
                                  "
                              >
                                  <label
                                      htmlFor="macevo-custom-language"
                                      className="
                                          mb-1.5 block
                                          text-[11px]
                                          font-semibold
                                          uppercase
                                          tracking-wider
                                          text-slate-600
                                      "
                                  >
                                      Code de langue
                                  </label>

                                  <div className="flex gap-2">
                                      <input
                                          id="macevo-custom-language"
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
                                          onKeyDown={(
                                              event
                                          ) => {
                                              if (
                                                  event.key ===
                                                  "Enter"
                                              ) {
                                                  handleConfirmLanguage(
                                                      selectedLanguage
                                                  );
                                              }
                                          }}
                                          placeholder="ex. fr, en, nl..."
                                          autoComplete="off"
                                          className="
                                              min-w-0 flex-1
                                              rounded-md
                                              border border-slate-300
                                              bg-white
                                              px-3 py-2
                                              text-xs
                                              outline-none
                                              focus:border-blue-600
                                              focus:ring-1
                                              focus:ring-blue-600
                                          "
                                      />

                                      <button
                                          type="button"
                                          onClick={() =>
                                              handleConfirmLanguage(
                                                  selectedLanguage
                                              )
                                          }
                                          className="
                                              rounded-md
                                              bg-blue-600
                                              px-4 py-2
                                              text-xs
                                              font-medium
                                              text-white
                                              shadow-sm
                                              hover:bg-blue-700
                                          "
                                      >
                                          Appliquer
                                      </button>
                                  </div>

                                  {errorMessage && (
                                      <div
                                          className="
                                              mt-3
                                              flex items-start gap-2
                                              rounded-md
                                              border border-red-200
                                              bg-red-50
                                              px-3 py-2
                                              text-xs text-red-700
                                          "
                                          role="alert"
                                      >
                                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                                          <span>
                                              {
                                                  errorMessage
                                              }
                                          </span>
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div
                              className="
                                  flex justify-end
                                  border-t border-slate-200
                                  bg-white
                                  px-5 py-3
                              "
                          >
                              <button
                                  type="button"
                                  onClick={() => {
                                      setActiveModal(null);
                                      setErrorMessage("");
                                  }}
                                  className="
                                      rounded-md
                                      bg-slate-100
                                      px-4 py-2
                                      text-xs font-medium
                                      text-slate-700
                                      hover:bg-slate-200
                                  "
                              >
                                  Annuler
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    return (
        <RibbonGroup
            title="Orthographe"
            width="w-[210px] min-w-[210px]"
        >
            <div className="grid w-full grid-cols-3 gap-1">
                <RibbonButton
                    icon={
                        isChecking
                            ? RefreshCw
                            : SpellCheck
                    }
                    label="Vérifier"
                    tooltip="Vérifier l'orthographe du document"
                    onClick={verifySpelling}
                    disabled={isChecking}
                    className={
                        isChecking
                            ? "animate-spin"
                            : ""
                    }
                />

                <RibbonButton
                    icon={RefreshCw}
                    label="Reprendre"
                    tooltip="Relancer la vérification orthographique"
                    onClick={restartVerification}
                    disabled={isChecking}
                />

                <RibbonButton
                    icon={Languages}
                    label="Langue"
                    tooltip="Définir la langue du document"
                    onClick={openLanguageModal}
                    disabled={isChecking}
                />
            </div>

            {spellcheckModal}
            {languageModal}
        </RibbonGroup>
    );
}

export default SpellingGroup;