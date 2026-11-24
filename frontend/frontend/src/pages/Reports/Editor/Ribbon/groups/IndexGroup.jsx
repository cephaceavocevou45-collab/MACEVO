/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : IndexGroup.jsx
 * Version : 5.0.0
 * Statut  : Index scientifique sécurisé et synchronisable
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    BookMarked,
    Plus,
    RefreshCw,
    X,
    Check,
    Layers,
    Tag,
    Trash2,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

/* ===========================================================
   UTILITAIRES
=========================================================== */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

function normalizeTerm(value) {
    return String(value ?? "")
        .replace(/\s+/g, " ")
        .trim();
}

function getIndexEntries(editor) {
    if (!editor) {
        return [];
    }

    const editorDOM = editor.view.dom;

    const elements = editorDOM.querySelectorAll(
        ".macevo-index-entry"
    );

    return Array.from(elements).map(
        (element, index) => {
            const term = normalizeTerm(
                element.getAttribute(
                    "data-index-term"
                ) ||
                    element.textContent
            );

            const sub = normalizeTerm(
                element.getAttribute(
                    "data-subindex-term"
                ) || ""
            );

            return {
                id: index,
                term,
                sub,
                display: sub
                    ? `${term} (${sub})`
                    : term,
            };
        }
    );
}

function getUniqueSortedEntries(editor) {
    const entries =
        getIndexEntries(editor);

    const map = new Map();

    entries.forEach((entry) => {
        const key = `${entry.term}|||${entry.sub}`;

        if (
            entry.term &&
            !map.has(key)
        ) {
            map.set(key, entry);
        }
    });

    return Array.from(map.values()).sort(
        (a, b) =>
            a.term.localeCompare(
                b.term,
                "fr",
                {
                    sensitivity: "base",
                }
            ) ||
            a.sub.localeCompare(
                b.sub,
                "fr",
                {
                    sensitivity: "base",
                }
            )
    );
}

/* ===========================================================
   COMPOSANT
=========================================================== */

function IndexGroup({ editor }) {
    const [activeModal, setActiveModal] =
        useState(null);

    const [indexTerm, setIndexTerm] =
        useState("");

    const [subIndexTerm, setSubIndexTerm] =
        useState("");

    const [previewTerms, setPreviewTerms] =
        useState([]);

    const [
        documentIndexEntries,
        setDocumentIndexEntries,
    ] = useState([]);

    /* ======================================================
       FERMETURE AVEC ESCAPE
    ====================================================== */

    useEffect(() => {
        if (!activeModal) {
            return undefined;
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                setActiveModal(null);
            }
        }

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

    /* ======================================================
       MARQUER UNE ENTRÉE
    ====================================================== */

    function openMarkModal() {
        const { from, to } =
            editor.state.selection;

        const selectedText =
            editor.state.doc.textBetween(
                from,
                to,
                " "
            );

        setIndexTerm(
            normalizeTerm(selectedText)
        );

        setSubIndexTerm("");
        setActiveModal("mark");
    }

    function handleConfirmMark(event) {
        event.preventDefault();

        const cleanTerm =
            normalizeTerm(indexTerm);

        const cleanSubTerm =
            normalizeTerm(subIndexTerm);

        if (!cleanTerm) {
            return;
        }

        const displayText = cleanSubTerm
            ? `${cleanTerm} (${cleanSubTerm})`
            : cleanTerm;

        const html = `
            <span
                class="macevo-index-entry"
                data-index-term="${escapeAttribute(
                    cleanTerm
                )}"
                data-subindex-term="${escapeAttribute(
                    cleanSubTerm
                )}"
                title="Entrée d'index : ${escapeAttribute(
                    displayText
                )}"
            >${escapeHtml(
                displayText
            )}</span>&nbsp;
        `;

        editor
            .chain()
            .focus()
            .insertContent(html)
            .run();

        setActiveModal(null);
    }

    /* ======================================================
       INSÉRER L'INDEX
    ====================================================== */

    function openInsertModal() {
        const entries =
            getUniqueSortedEntries(editor);

        setPreviewTerms(
            entries.map(
                (entry) => entry.display
            )
        );

        setActiveModal("insert");
    }

    function generateIndexHtml(
        entries = []
    ) {
        if (!entries.length) {
            return `
                <div
                    class="macevo-index-container"
                    data-index-container="true"
                >
                    <h2 class="macevo-index-title">
                        Index
                    </h2>

                    <p class="macevo-index-empty">
                        Aucune entrée d'index marquée
                        dans le document.
                    </p>
                </div>

                <p><br></p>
            `;
        }

        const itemsHtml = entries
            .map(
                (entry) => `
                    <p
                        class="macevo-index-item"
                        data-index-item="true"
                    >
                        <span
                            class="macevo-index-label"
                        >
                            ${escapeHtml(
                                entry.display
                            )}
                        </span>

                        <span
                            class="macevo-index-leader"
                            aria-hidden="true"
                        >
                            ........................................
                        </span>

                        <span
                            class="macevo-index-page"
                        >
                            —
                        </span>
                    </p>
                `
            )
            .join("");

        return `
            <div
                class="macevo-index-container"
                data-index-container="true"
            >
                <h2 class="macevo-index-title">
                    Index
                </h2>

                <div class="macevo-index-list">
                    ${itemsHtml}
                </div>
            </div>

            <p><br></p>
        `;
    }

    function handleConfirmInsertIndex() {
        const entries =
            getUniqueSortedEntries(editor);

        editor
            .chain()
            .focus()
            .insertContent(
                generateIndexHtml(entries)
            )
            .run();

        setActiveModal(null);
    }

    /* ======================================================
       METTRE À JOUR
    ====================================================== */

    function openUpdateModal() {
        const editorDOM = editor.view.dom;

        const indexContainer =
            editorDOM.querySelector(
                ".macevo-index-container"
            );

        if (!indexContainer) {
            alert(
                "Aucun bloc d'index actif n'a été trouvé dans le document."
            );
            return;
        }

        const entries =
            getUniqueSortedEntries(editor);

        setDocumentIndexEntries(entries);
        setActiveModal("update");
    }

    /* ======================================================
       SUPPRIMER UNE ENTRÉE
    ====================================================== */

    function handleDeleteIndexEntry(
        entryToDelete
    ) {
        const editorDOM = editor.view.dom;

        const elements =
            editorDOM.querySelectorAll(
                ".macevo-index-entry"
            );

        const target = Array.from(
            elements
        ).find((element) => {
            const term = normalizeTerm(
                element.getAttribute(
                    "data-index-term"
                )
            );

            const sub = normalizeTerm(
                element.getAttribute(
                    "data-subindex-term"
                )
            );

            return (
                term === entryToDelete.term &&
                sub === entryToDelete.sub
            );
        });

        if (!target) {
            return;
        }

        target.remove();

        /*
         * Supprime également l'espace inséré
         * juste après le marqueur lorsqu'il existe.
         */
        const nextSibling =
            target.nextSibling;

        if (
            nextSibling &&
            nextSibling.nodeType ===
                Node.TEXT_NODE &&
            nextSibling.textContent ===
                "\u00a0"
        ) {
            nextSibling.remove();
        }

        editor.commands.setContent(
            editorDOM.innerHTML,
            false
        );

        setDocumentIndexEntries(
            getUniqueSortedEntries(editor)
        );
    }

    /* ======================================================
       SYNCHRONISER L'INDEX
    ====================================================== */

    function handleConfirmUpdateIndex() {
        const editorDOM = editor.view.dom;

        const indexContainer =
            editorDOM.querySelector(
                ".macevo-index-container"
            );

        if (!indexContainer) {
            alert(
                "Le conteneur d'index est introuvable."
            );

            setActiveModal(null);
            return;
        }

        const entries =
            getUniqueSortedEntries(editor);

        const listContainer =
            indexContainer.querySelector(
                ".macevo-index-list"
            );

        if (!listContainer) {
            setActiveModal(null);
            return;
        }

        if (!entries.length) {
            listContainer.innerHTML = `
                <p class="macevo-index-empty">
                    Aucune entrée d'index marquée
                    dans le document.
                </p>
            `;
        } else {
            listContainer.innerHTML =
                entries
                    .map(
                        (entry) => `
                            <p
                                class="macevo-index-item"
                                data-index-item="true"
                            >
                                <span
                                    class="macevo-index-label"
                                >
                                    ${escapeHtml(
                                        entry.display
                                    )}
                                </span>

                                <span
                                    class="macevo-index-leader"
                                    aria-hidden="true"
                                >
                                    ........................................
                                </span>

                                <span
                                    class="macevo-index-page"
                                >
                                    —
                                </span>
                            </p>
                        `
                    )
                    .join("");
        }

        editor.commands.setContent(
            editorDOM.innerHTML,
            false
        );

        setActiveModal(null);
    }

    /* ======================================================
       MODALE : MARQUAGE
    ====================================================== */

    const markModal =
        activeModal === "mark"
            ? createPortal(
                  <div
                      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
                      onMouseDown={(event) => {
                          if (
                              event.target ===
                              event.currentTarget
                          ) {
                              setActiveModal(
                                  null
                              );
                          }
                      }}
                  >
                      <div
                          className="w-[500px] max-w-[95vw] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl"
                          onMouseDown={(event) =>
                              event.stopPropagation()
                          }
                      >
                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4 text-amber-600" />

                                  <h3 className="text-sm font-bold text-slate-800">
                                      Marquer une entrée d'index
                                  </h3>
                              </div>

                              <button
                                  type="button"
                                  onClick={() =>
                                      setActiveModal(
                                          null
                                      )
                                  }
                                  className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                  aria-label="Fermer"
                              >
                                  <X className="h-5 w-5" />
                              </button>
                          </div>

                          <form
                              onSubmit={
                                  handleConfirmMark
                              }
                              className="flex flex-col gap-4 p-6"
                          >
                              <div>
                                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                                      Entrée principale
                                  </label>

                                  <input
                                      type="text"
                                      required
                                      value={
                                          indexTerm
                                      }
                                      onChange={(
                                          event
                                      ) =>
                                          setIndexTerm(
                                              event
                                                  .target
                                                  .value
                                          )
                                      }
                                      placeholder="Ex. Intelligence artificielle"
                                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                                      autoFocus
                                  />
                              </div>

                              <div>
                                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                                      Sous-entrée
                                      <span className="ml-1 font-normal text-slate-400">
                                          (optionnelle)
                                      </span>
                                  </label>

                                  <input
                                      type="text"
                                      value={
                                          subIndexTerm
                                      }
                                      onChange={(
                                          event
                                      ) =>
                                          setSubIndexTerm(
                                              event
                                                  .target
                                                  .value
                                          )
                                      }
                                      placeholder="Ex. Réseaux de neurones"
                                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                                  />
                              </div>

                              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                                  <button
                                      type="button"
                                      onClick={() =>
                                          setActiveModal(
                                              null
                                          )
                                      }
                                      className="rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200"
                                  >
                                      Annuler
                                  </button>

                                  <button
                                      type="submit"
                                      className="flex items-center gap-1.5 rounded-md bg-amber-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-amber-700"
                                  >
                                      <Check className="h-3.5 w-3.5" />
                                      Marquer
                                  </button>
                              </div>
                          </form>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    /* ======================================================
       MODALE : INSERTION
    ====================================================== */

    const insertModal =
        activeModal === "insert"
            ? createPortal(
                  <div
                      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
                      onMouseDown={(event) => {
                          if (
                              event.target ===
                              event.currentTarget
                          ) {
                              setActiveModal(
                                  null
                              );
                          }
                      }}
                  >
                      <div
                          className="w-[520px] max-w-[95vw] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl"
                          onMouseDown={(event) =>
                              event.stopPropagation()
                          }
                      >
                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <div className="flex items-center gap-2">
                                  <BookMarked className="h-4 w-4 text-amber-600" />

                                  <h3 className="text-sm font-bold text-slate-800">
                                      Insérer la table d'index
                                  </h3>
                              </div>

                              <button
                                  type="button"
                                  onClick={() =>
                                      setActiveModal(
                                          null
                                      )
                                  }
                                  className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                  aria-label="Fermer"
                              >
                                  <X className="h-5 w-5" />
                              </button>
                          </div>

                          <div className="max-h-[55vh] overflow-y-auto bg-slate-50 p-5">
                              <p className="mb-3 text-xs text-slate-600">
                                  Entrées actuellement
                                  marquées :
                              </p>

                              <div className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-3">
                                  {previewTerms.length >
                                  0 ? (
                                      previewTerms.map(
                                          (
                                              term
                                          ) => (
                                              <div
                                                  key={
                                                      term
                                                  }
                                                  className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-slate-700"
                                              >
                                                  {term}
                                              </div>
                                          )
                                      )
                                  ) : (
                                      <p className="py-4 text-center text-xs italic text-slate-400">
                                          Aucune entrée
                                          marquée.
                                      </p>
                                  )}
                              </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
                              <button
                                  type="button"
                                  onClick={() =>
                                      setActiveModal(
                                          null
                                      )
                                  }
                                  className="rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200"
                              >
                                  Annuler
                              </button>

                              <button
                                  type="button"
                                  onClick={
                                      handleConfirmInsertIndex
                                  }
                                  className="flex items-center gap-1.5 rounded-md bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700"
                              >
                                  <Check className="h-3.5 w-3.5" />
                                  Insérer l'index
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    /* ======================================================
       MODALE : MISE À JOUR
    ====================================================== */

    const updateModal =
        activeModal === "update"
            ? createPortal(
                  <div
                      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
                      onMouseDown={(event) => {
                          if (
                              event.target ===
                              event.currentTarget
                          ) {
                              setActiveModal(
                                  null
                              );
                          }
                      }}
                  >
                      <div
                          className="w-[550px] max-w-[95vw] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl"
                          onMouseDown={(event) =>
                              event.stopPropagation()
                          }
                      >
                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <div className="flex items-center gap-2">
                                  <RefreshCw className="h-4 w-4 text-amber-600" />

                                  <h3 className="text-sm font-bold text-slate-800">
                                      Gestion de l'index
                                  </h3>
                              </div>

                              <button
                                  type="button"
                                  onClick={() =>
                                      setActiveModal(
                                          null
                                      )
                                  }
                                  className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                  aria-label="Fermer"
                              >
                                  <X className="h-5 w-5" />
                              </button>
                          </div>

                          <div className="max-h-[60vh] overflow-y-auto bg-slate-100 p-5">
                              <div className="rounded-lg border border-slate-200 bg-white p-4">
                                  <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-bold text-slate-500">
                                      <Layers className="h-4 w-4 text-amber-600" />

                                      <span>
                                          Entrées
                                          détectées (
                                          {
                                              documentIndexEntries.length
                                          }
                                          )
                                      </span>
                                  </div>

                                  <div className="space-y-2">
                                      {documentIndexEntries.length >
                                      0 ? (
                                          documentIndexEntries.map(
                                              (
                                                  entry
                                              ) => (
                                                  <div
                                                      key={`${entry.term}-${entry.sub}`}
                                                      className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-2.5"
                                                  >
                                                      <span className="text-xs font-medium text-slate-800">
                                                          {
                                                              entry.display
                                                          }
                                                      </span>

                                                      <button
                                                          type="button"
                                                          onClick={() =>
                                                              handleDeleteIndexEntry(
                                                                  entry
                                                              )
                                                          }
                                                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                          title="Supprimer cette entrée"
                                                          aria-label={`Supprimer ${entry.display}`}
                                                      >
                                                          <Trash2 className="h-4 w-4" />
                                                      </button>
                                                  </div>
                                              )
                                          )
                                      ) : (
                                          <p className="py-4 text-center text-xs italic text-slate-400">
                                              Aucune entrée
                                              d'index
                                              active.
                                          </p>
                                      )}
                                  </div>
                              </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
                              <button
                                  type="button"
                                  onClick={() =>
                                      setActiveModal(
                                          null
                                      )
                                  }
                                  className="rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200"
                              >
                                  Fermer
                              </button>

                              <button
                                  type="button"
                                  onClick={
                                      handleConfirmUpdateIndex
                                  }
                                  className="flex items-center gap-1.5 rounded-md bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700"
                              >
                                  <Check className="h-3.5 w-3.5" />
                                  Synchroniser
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
                title="Index"
                className="w-[210px] min-w-[210px]"
            >
                <div className="flex h-full items-center gap-1">
                    <RibbonButton
                        icon={Plus}
                        label="Marquer"
                        tooltip="Marquer une entrée pour l'index"
                        onClick={
                            openMarkModal
                        }
                    />

                    <RibbonButton
                        icon={BookMarked}
                        label="Insérer"
                        tooltip="Insérer la table d'index"
                        onClick={
                            openInsertModal
                        }
                    />

                    <RibbonButton
                        icon={RefreshCw}
                        label="Mettre à jour"
                        tooltip="Mettre à jour et synchroniser l'index"
                        onClick={
                            openUpdateModal
                        }
                    />
                </div>
            </RibbonGroup>

            {markModal}
            {insertModal}
            {updateModal}
        </>
    );
}

export default IndexGroup;