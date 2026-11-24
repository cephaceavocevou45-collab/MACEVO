/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : DictionaryGroup.jsx
 * Version : 4.0.0
 * Statut  : Dictionnaire scientifique — définitions,
 *           synonymes et gestion de la langue
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    BookOpen,
    Search,
    Languages,
    X,
    Check,
    Globe,
    Sparkles,
    Info,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import dictionaryEngine from "../../../../../core/document/engines/language/DictionaryEngine";
import languageEngine from "../../../../../core/document/engines/language/LanguageEngine";

/* ===========================================================
   LANGUES DISPONIBLES
=========================================================== */

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

/* ===========================================================
   OUTILS
=========================================================== */

/**
 * Récupère le texte actuellement sélectionné.
 */
function getSelectionText(editor) {
    if (!editor) {
        return "";
    }

    try {
        return editor.state.doc
            .textBetween(
                editor.state.selection.from,
                editor.state.selection.to,
                " "
            )
            .trim();
    } catch (error) {
        console.error(
            "MACEVO : impossible de récupérer la sélection.",
            error
        );

        return "";
    }
}

/**
 * Transforme différents formats de résultats
 * possibles en texte affichable.
 *
 * L'engine actuel retourne normalement une chaîne
 * ou un tableau de résultats.
 */
function normalizeDefinitionResult(result) {
    if (!result) {
        return "";
    }

    if (typeof result === "string") {
        return result.trim();
    }

    if (Array.isArray(result)) {
        return result
            .map((item) => {
                if (typeof item === "string") {
                    return item;
                }

                if (item && typeof item === "object") {
                    return (
                        item.definition ||
                        item.meaning ||
                        item.description ||
                        item.message ||
                        item.text ||
                        ""
                    );
                }

                return "";
            })
            .filter(Boolean)
            .join("\n\n")
            .trim();
    }

    if (typeof result === "object") {
        return (
            result.definition ||
            result.meaning ||
            result.description ||
            result.message ||
            result.text ||
            ""
        ).toString().trim();
    }

    return String(result).trim();
}

/**
 * Normalise une liste de synonymes.
 */
function normalizeSynonyms(result) {
    if (!result) {
        return [];
    }

    const source = Array.isArray(result)
        ? result
        : [result];

    return [
        ...new Set(
            source
                .map((item) => {
                    if (typeof item === "string") {
                        return item.trim();
                    }

                    if (item && typeof item === "object") {
                        return (
                            item.replacement ||
                            item.word ||
                            item.synonym ||
                            item.value ||
                            item.text ||
                            ""
                        )
                            .toString()
                            .trim();
                    }

                    return "";
                })
                .filter(Boolean)
        ),
    ];
}

/**
 * Normalise un code de langue.
 */
function normalizeLanguageCode(value) {
    if (!value || typeof value !== "string") {
        return "";
    }

    return value.trim().toLowerCase();
}

/**
 * Vérifie un code de langue de type ISO simple.
 *
 * Exemples acceptés :
 * fr
 * en
 * nl
 * pt-br
 */
function isValidLanguageCode(value) {
    return /^[a-z]{2,3}(?:-[a-z]{2,4})?$/i.test(value);
}

/* ===========================================================
   COMPOSANT
=========================================================== */

function DictionaryGroup() {
    const { editor } = useEditorContext();

    const [activeModal, setActiveModal] = useState(null);
    const [modalData, setModalData] = useState({
        selection: "",
        content: "",
        list: [],
        error: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("fr");

    /* =======================================================
       FERMETURE ÉCHAP
    ======================================================= */

    useEffect(() => {
        if (!activeModal) {
            return undefined;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setActiveModal(null);
                setIsLoading(false);
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

    if (!editor) {
        return null;
    }

    /* =======================================================
       FERMETURE MODALE
    ======================================================= */

    function closeModal() {
        setActiveModal(null);
        setIsLoading(false);
    }

    /* =======================================================
       DÉFINITION
    ======================================================= */

    async function searchDefinition() {
        const selection = getSelectionText(editor);

        if (!selection) {
            window.alert(
                "Veuillez sélectionner un mot ou un terme dans le document."
            );
            return;
        }

        setIsLoading(true);

        setModalData({
            selection,
            content: "",
            list: [],
            error: "",
        });

        setActiveModal("definition");

        try {
            const result =
                await dictionaryEngine.search(
                    selection
                );

            const content =
                normalizeDefinitionResult(result);

            setModalData({
                selection,
                content:
                    content ||
                    "Aucune définition trouvée pour ce terme.",
                list: [],
                error: "",
            });
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de la recherche de définition.",
                error
            );

            setModalData({
                selection,
                content: "",
                list: [],
                error:
                    "Le dictionnaire n'a pas pu fournir de définition pour ce terme.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    /* =======================================================
       SYNONYMES
    ======================================================= */

    async function searchSynonyms() {
        const selection = getSelectionText(editor);

        if (!selection) {
            window.alert(
                "Veuillez sélectionner un mot ou un terme dans le document."
            );
            return;
        }

        setIsLoading(true);

        setModalData({
            selection,
            content: "",
            list: [],
            error: "",
        });

        setActiveModal("synonyms");

        try {
            const result =
                await dictionaryEngine.loadSynonyms(
                    selection
                );

            const synonyms =
                normalizeSynonyms(result);

            setModalData({
                selection,
                content: "",
                list: synonyms,
                error: "",
            });
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de la recherche de synonymes.",
                error
            );

            setModalData({
                selection,
                content: "",
                list: [],
                error:
                    "Le service de synonymes n'a pas pu répondre.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    /* =======================================================
       LANGUE
    ======================================================= */

    function openLanguageModal() {
        let currentLanguage = "fr";

        try {
            currentLanguage =
                normalizeLanguageCode(
                    languageEngine.getLanguage()
                ) || "fr";
        } catch (error) {
            console.error(
                "MACEVO : impossible de récupérer la langue actuelle.",
                error
            );
        }

        setSelectedLanguage(currentLanguage);
        setActiveModal("language");
    }

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

            dictionaryEngine.setLanguage(
                languageCode
            );

            setSelectedLanguage(
                languageCode
            );

            setActiveModal(null);
        } catch (error) {
            console.error(
                "MACEVO : impossible de changer la langue du dictionnaire.",
                error
            );

            window.alert(
                "Impossible de modifier la langue du dictionnaire."
            );
        }
    }

    /* =======================================================
       CLIC EXTÉRIEUR
    ======================================================= */

    function handleOverlayClick(event) {
        if (event.target === event.currentTarget) {
            closeModal();
        }
    }

    /* =======================================================
       MODALE DÉFINITION
    ======================================================= */

    const definitionModal =
        activeModal === "definition"
            ? createPortal(
                  <div
                      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4"
                      onMouseDown={handleOverlayClick}
                      role="presentation"
                  >
                      <div
                          className="w-[520px] max-w-[95vw] max-h-[80vh] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl flex flex-col"
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="macevo-definition-title"
                          onMouseDown={(event) =>
                              event.stopPropagation()
                          }
                      >
                          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
                              <h3
                                  id="macevo-definition-title"
                                  className="text-sm font-bold text-slate-800 flex items-center gap-2 min-w-0"
                              >
                                  <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />

                                  <span className="truncate">
                                      Définition :
                                  </span>

                                  <span className="text-blue-600 italic truncate">
                                      «{" "}
                                      {modalData.selection}
                                      {" " }»
                                  </span>
                              </h3>

                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
                                  aria-label="Fermer"
                                  title="Fermer"
                              >
                                  <X className="w-5 h-5" />
                              </button>
                          </div>

                          <div className="p-5 overflow-y-auto bg-slate-50">
                              {isLoading ? (
                                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500 text-xs">
                                      <Search className="w-6 h-6 animate-spin text-blue-600" />

                                      <span>
                                          Recherche de la définition
                                          en cours...
                                      </span>
                                  </div>
                              ) : modalData.error ? (
                                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-start gap-3">
                                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

                                      <span>
                                          {modalData.error}
                                      </span>
                                  </div>
                              ) : (
                                  <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                                      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
                                          <Info className="w-4 h-4 text-blue-600" />

                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                              Résultat du dictionnaire
                                          </span>
                                      </div>

                                      <div className="p-4">
                                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                                              {modalData.content}
                                          </p>
                                      </div>
                                  </div>
                              )}
                          </div>

                          <div className="flex justify-end px-5 py-4 border-t border-slate-200 bg-slate-50">
                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                              >
                                  Fermer
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    /* =======================================================
       MODALE SYNONYMES
    ======================================================= */

    const synonymsModal =
        activeModal === "synonyms"
            ? createPortal(
                  <div
                      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4"
                      onMouseDown={handleOverlayClick}
                      role="presentation"
                  >
                      <div
                          className="w-[520px] max-w-[95vw] max-h-[80vh] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl flex flex-col"
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="macevo-synonyms-title"
                          onMouseDown={(event) =>
                              event.stopPropagation()
                          }
                      >
                          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
                              <h3
                                  id="macevo-synonyms-title"
                                  className="text-sm font-bold text-slate-800 flex items-center gap-2 min-w-0"
                              >
                                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />

                                  <span className="truncate">
                                      Synonymes de :
                                  </span>

                                  <span className="text-emerald-600 italic truncate">
                                      «{" "}
                                      {modalData.selection}
                                      {" " }»
                                  </span>
                              </h3>

                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
                                  aria-label="Fermer"
                                  title="Fermer"
                              >
                                  <X className="w-5 h-5" />
                              </button>
                          </div>

                          <div className="p-5 overflow-y-auto bg-slate-50">
                              {isLoading ? (
                                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500 text-xs">
                                      <Search className="w-6 h-6 animate-spin text-emerald-600" />

                                      <span>
                                          Recherche des synonymes
                                          en cours...
                                      </span>
                                  </div>
                              ) : modalData.error ? (
                                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-start gap-3">
                                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

                                      <span>
                                          {modalData.error}
                                      </span>
                                  </div>
                              ) : modalData.list.length ===
                                0 ? (
                                  <div className="flex flex-col items-center justify-center py-12 text-center">
                                      <Sparkles className="w-7 h-7 text-slate-300 mb-3" />

                                      <p className="text-xs text-slate-500">
                                          Aucun synonyme trouvé
                                          pour ce terme.
                                      </p>
                                  </div>
                              ) : (
                                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                                          Suggestions
                                      </div>

                                      <div className="flex flex-wrap gap-2">
                                          {modalData.list.map(
                                              (synonym, index) => (
                                                  <span
                                                      key={`${synonym}-${index}`}
                                                      className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium"
                                                  >
                                                      {synonym}
                                                  </span>
                                              )
                                          )}
                                      </div>
                                  </div>
                              )}
                          </div>

                          <div className="flex justify-end px-5 py-4 border-t border-slate-200 bg-slate-50">
                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-colors"
                              >
                                  Fermer
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    /* =======================================================
       MODALE LANGUE
    ======================================================= */

    const languageModal =
        activeModal === "language"
            ? createPortal(
                  <div
                      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4"
                      onMouseDown={handleOverlayClick}
                      role="presentation"
                  >
                      <div
                          className="w-[470px] max-w-[95vw] rounded-xl border border-slate-300 bg-white shadow-2xl overflow-hidden"
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="macevo-language-title"
                          onMouseDown={(event) =>
                              event.stopPropagation()
                          }
                      >
                          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
                              <h3
                                  id="macevo-language-title"
                                  className="text-sm font-bold text-slate-800 flex items-center gap-2"
                              >
                                  <Globe className="w-4 h-4 text-blue-600" />

                                  Langue du dictionnaire
                              </h3>

                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                                  aria-label="Fermer"
                                  title="Fermer"
                              >
                                  <X className="w-5 h-5" />
                              </button>
                          </div>

                          <div className="p-5 bg-slate-50">
                              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                                  Sélectionnez la langue de
                                  référence utilisée par le
                                  dictionnaire et le moteur
                                  linguistique de MACEVO.
                              </p>

                              <div className="grid grid-cols-2 gap-2">
                                  {AVAILABLE_LANGUAGES.map(
                                      (language) => {
                                          const isSelected =
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
                                                  className={`
                                                      min-h-[58px]
                                                      px-3
                                                      py-2.5
                                                      rounded-lg
                                                      border
                                                      text-left
                                                      flex
                                                      items-center
                                                      justify-between
                                                      gap-2
                                                      transition-all
                                                      ${
                                                          isSelected
                                                              ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
                                                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                                                      }
                                                  `}
                                              >
                                                  <span className="flex flex-col min-w-0">
                                                      <span className="text-xs font-semibold truncate">
                                                          {
                                                              language.label
                                                          }
                                                      </span>

                                                      <span className="text-[10px] text-slate-400 truncate">
                                                          {
                                                              language.nativeLabel
                                                          }
                                                      </span>
                                                  </span>

                                                  {isSelected && (
                                                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                                                  )}
                                              </button>
                                          );
                                      }
                                  )}
                              </div>

                              <div className="mt-5 pt-4 border-t border-slate-200">
                                  <label
                                      htmlFor="macevo-language-code"
                                      className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2"
                                  >
                                      Code de langue personnalisé
                                  </label>

                                  <div className="flex gap-2">
                                      <input
                                          id="macevo-language-code"
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
                                          className="flex-1 min-w-0 px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      />

                                      <button
                                          type="button"
                                          onClick={() =>
                                              handleConfirmLanguage(
                                                  selectedLanguage
                                              )
                                          }
                                          className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                                      >
                                          Appliquer
                                      </button>
                                  </div>
                              </div>
                          </div>

                          <div className="flex justify-end px-5 py-4 border-t border-slate-200 bg-slate-50">
                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors"
                              >
                                  Annuler
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    /* =======================================================
       RENDU
    ======================================================= */

    return (
        <>
            <RibbonGroup
                title="Dictionnaire"
                className="w-[210px] min-w-[210px]"
            >
                <div className="flex items-center gap-1 h-full">
                    <RibbonButton
                        icon={BookOpen}
                        label="Définition"
                        tooltip="Consulter la définition du terme sélectionné"
                        onClick={searchDefinition}
                    />

                    <RibbonButton
                        icon={Search}
                        label="Synonymes"
                        tooltip="Rechercher des synonymes du terme sélectionné"
                        onClick={searchSynonyms}
                    />

                    <RibbonButton
                        icon={Languages}
                        label="Langues"
                        tooltip="Changer la langue du dictionnaire"
                        onClick={openLanguageModal}
                    />
                </div>
            </RibbonGroup>

            {definitionModal}
            {synonymsModal}
            {languageModal}
        </>
    );
}

export default DictionaryGroup;