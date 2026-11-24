/**
 * ===========================================================
 * MACEVO — ÉDITEUR SCIENTIFIQUE
 * -----------------------------------------------------------
 * Fichier : TableOfContentsGroup.jsx
 * Version : 6.0.0
 * Statut  : Table des matières scientifique
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
    ListTree,
    RefreshCw,
    Trash2,
    X,
    Sparkles,
    FileText,
    Check,
    Edit3,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

function TableOfContentsGroup({ editor }) {
    const [activeModal, setActiveModal] =
        useState(null);

    const [generationMode, setGenerationMode] =
        useState("auto");

    const [pastedContent, setPastedContent] =
        useState("");

    const [updateTextContent, setUpdateTextContent] =
        useState("");

    const [errorMessage, setErrorMessage] =
        useState("");

    if (!editor) {
        return null;
    }

    /**
     * ---------------------------------------------------------
     * FERMETURE DES MODALES AVEC ESCAPE
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

    /**
     * ---------------------------------------------------------
     * EXTRAIRE LES TITRES
     * ---------------------------------------------------------
     */

    const extractHeadings = () => {
        const headings = [];

        try {
            editor.state.doc.descendants(
                (node) => {
                    if (
                        node.type.name ===
                            "heading" &&
                        node.textContent?.trim()
                    ) {
                        headings.push({
                            level:
                                Number(
                                    node.attrs?.level
                                ) || 1,
                            text:
                                node.textContent.trim(),
                        });
                    }
                }
            );
        } catch (error) {
            console.error(
                "[MACEVO TOC] Erreur lors de l'extraction des titres :",
                error
            );
        }

        return headings;
    };

    /**
     * ---------------------------------------------------------
     * ÉCHAPPER LE HTML
     * ---------------------------------------------------------
     */

    const escapeHtml = (value) => {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    /**
     * ---------------------------------------------------------
     * CONSTRUIRE LA TABLE DES MATIÈRES
     * ---------------------------------------------------------
     */

    const buildTOCHtml = (items) => {
        if (!Array.isArray(items)) {
            items = [];
        }

        const listItems =
            items.length > 0
                ? items
                      .map((item, index) => {
                          const level =
                              Math.max(
                                  1,
                                  Number(
                                      item.level
                                  ) || 1
                              );

                          const indent =
                              Math.min(
                                  (level - 1) * 20,
                                  100
                              );

                          const weight =
                              level === 1
                                  ? "700"
                                  : "400";

                          return `
<li
    style="
        display:flex;
        align-items:baseline;
        gap:8px;
        margin-bottom:6px;
        padding-left:${indent}px;
        font-weight:${weight};
    "
>
    <span
        style="
            flex:0 1 auto;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
        "
    >
        ${escapeHtml(
            item.text
        )}
    </span>

    <span
        style="
            flex:1 1 auto;
            border-bottom:1px dotted #94a3b8;
            min-width:20px;
            height:1em;
        "
    ></span>

    <span
        style="
            flex:0 0 auto;
            color:#64748b;
            font-family:monospace;
        "
    >
        ${index + 1}
    </span>
</li>
`;
                      })
                      .join("")
                : `
<li
    style="
        list-style:none;
        color:#64748b;
        font-style:italic;
    "
>
    Aucun élément dans la table.
</li>
`;

        return `
<div
    class="macevo-toc"
    data-macevo-toc="true"
    contenteditable="false"
    style="
        border:1px solid #e2e8f0;
        padding:20px;
        border-radius:8px;
        background:#f8fafc;
        margin:20px 0;
    "
>
    <h2
        style="
            font-size:1.25rem;
            font-weight:700;
            margin:0 0 12px 0;
            color:#1e293b;
            border-bottom:2px solid #2563eb;
            padding-bottom:6px;
        "
    >
        Table des matières
    </h2>

    <ul
        style="
            list-style:none;
            padding:0;
            margin:10px 0;
        "
    >
        ${listItems}
    </ul>
</div>

<p></p>
`;
    };

    /**
     * ---------------------------------------------------------
     * INSÉRER LA TABLE DES MATIÈRES
     * ---------------------------------------------------------
     */

    const handleInsertSubmit = () => {
        setErrorMessage("");

        try {
            let items = [];

            if (generationMode === "auto") {
                items = extractHeadings();
            } else {
                items = pastedContent
                    .split(/\r?\n/)
                    .map((line) =>
                        line.trim()
                    )
                    .filter(Boolean)
                    .map((text) => ({
                        text,
                        level: 1,
                    }));
            }

            if (
                generationMode === "paste" &&
                items.length === 0
            ) {
                setErrorMessage(
                    "Veuillez saisir au moins un élément."
                );
                return;
            }

            const html =
                buildTOCHtml(items);

            const success =
                editor
                    .chain()
                    .focus()
                    .insertContent(html)
                    .run();

            if (!success) {
                throw new Error(
                    "Tiptap n'a pas pu insérer la table des matières."
                );
            }

            setActiveModal(null);
            setPastedContent("");
        } catch (error) {
            console.error(
                "[MACEVO TOC] Erreur lors de l'insertion :",
                error
            );

            setErrorMessage(
                error?.message ||
                    "Impossible d'insérer la table des matières."
            );
        }
    };

    /**
     * ---------------------------------------------------------
     * DÉTECTER UNE TABLE DES MATIÈRES
     * ---------------------------------------------------------
     */

    const getExistingTOC = () => {
        try {
            return editor.view.dom.querySelector(
                '[data-macevo-toc="true"], .macevo-toc'
            );
        } catch (error) {
            console.error(
                "[MACEVO TOC] Impossible de rechercher la table :",
                error
            );

            return null;
        }
    };

    /**
     * ---------------------------------------------------------
     * OUVRIR LA MISE À JOUR
     * ---------------------------------------------------------
     */

    const openUpdateModal = () => {
        setErrorMessage("");

        const existingToc =
            getExistingTOC();

        if (!existingToc) {
            setErrorMessage(
                "Aucune table des matières n'a été trouvée dans le document."
            );

            setActiveModal("update-error");
            return;
        }

        const headings =
            extractHeadings();

        setUpdateTextContent(
            headings
                .map((heading) => {
                    const prefix =
                        heading.level > 1
                            ? `${"  ".repeat(
                                  heading.level -
                                      1
                              )}`
                            : "";

                    return `${prefix}${heading.text}`;
                })
                .join("\n")
        );

        setActiveModal("update");
    };

    /**
     * ---------------------------------------------------------
     * SYNCHRONISER AVEC LE DOCUMENT
     * ---------------------------------------------------------
     */

    const handleReloadFromDoc = () => {
        const headings =
            extractHeadings();

        setUpdateTextContent(
            headings
                .map((heading) => {
                    const prefix =
                        heading.level > 1
                            ? `${"  ".repeat(
                                  heading.level -
                                      1
                              )}`
                            : "";

                    return `${prefix}${heading.text}`;
                })
                .join("\n")
        );

        setErrorMessage("");
    };

    /**
     * ---------------------------------------------------------
     * CONVERTIR LE TEXTE MODIFIÉ
     * EN ÉLÉMENTS DE TABLE
     * ---------------------------------------------------------
     */

    const parseManualItems = (value) => {
        return String(value || "")
            .split(/\r?\n/)
            .map((line) => line.replace(/\t/g, "    "))
            .map((line) => line.trimEnd())
            .filter((line) => line.trim())
            .map((line) => {
                const leadingSpaces =
                    line.length -
                    line.trimStart().length;

                const level = Math.min(
                    Math.max(
                        1,
                        Math.floor(
                            leadingSpaces / 2
                        ) + 1
                    ),
                    6
                );

                return {
                    text: line.trim(),
                    level,
                };
            });
    };

    /**
     * ---------------------------------------------------------
     * METTRE À JOUR
     * ---------------------------------------------------------
     */

    const handleUpdateSubmit = () => {
        setErrorMessage("");

        const existingToc =
            getExistingTOC();

        if (!existingToc) {
            setErrorMessage(
                "La table des matières n'existe plus dans le document."
            );
            return;
        }

        const items =
            parseManualItems(
                updateTextContent
            );

        if (items.length === 0) {
            setErrorMessage(
                "La table ne peut pas être vide."
            );
            return;
        }

        try {
            /**
             * Nous remplaçons le contenu de l'éditeur
             * via Tiptap plutôt que de supprimer
             * directement un nœud DOM.
             *
             * Pour éviter une mutation DOM hors Tiptap,
             * on reconstruit le document HTML à partir
             * de son état actuel.
             */

            const currentHTML =
                editor.getHTML();

            const tocIndex =
                currentHTML.indexOf(
                    '<div class="macevo-toc"'
                );

            const tocIndexData =
                currentHTML.indexOf(
                    'data-macevo-toc="true"'
                );

            let startIndex = -1;

            if (tocIndex !== -1) {
                startIndex = tocIndex;
            } else if (
                tocIndexData !== -1
            ) {
                startIndex =
                    currentHTML.lastIndexOf(
                        "<div",
                        tocIndexData
                    );
            }

            if (startIndex === -1) {
                setErrorMessage(
                    "Impossible de localiser la table des matières dans le contenu de l'éditeur."
                );
                return;
            }

            const tocEnd =
                currentHTML.indexOf(
                    "</div>",
                    startIndex
                );

            if (tocEnd === -1) {
                setErrorMessage(
                    "La structure de la table des matières est invalide."
                );
                return;
            }

            const endIndex =
                tocEnd + "</div>".length;

            const replacement =
                buildTOCHtml(items)
                    .replace(
                        "<p></p>",
                        ""
                    );

            const newHTML =
                currentHTML.slice(
                    0,
                    startIndex
                ) +
                replacement +
                currentHTML.slice(
                    endIndex
                );

            const success =
                editor.commands.setContent(
                    newHTML
                );

            if (!success) {
                throw new Error(
                    "Impossible de mettre à jour le contenu de l'éditeur."
                );
            }

            setActiveModal(null);
        } catch (error) {
            console.error(
                "[MACEVO TOC] Erreur lors de la mise à jour :",
                error
            );

            setErrorMessage(
                error?.message ||
                    "Impossible de mettre à jour la table des matières."
            );
        }
    };

    /**
     * ---------------------------------------------------------
     * SUPPRIMER LA TABLE
     * ---------------------------------------------------------
     */

    const removeTOC = () => {
        setErrorMessage("");

        const existingToc =
            getExistingTOC();

        if (!existingToc) {
            setErrorMessage(
                "Aucune table des matières n'a été trouvée dans le document."
            );
            setActiveModal("delete-error");
            return;
        }

        const confirmed =
            window.confirm(
                "Êtes-vous sûr de vouloir supprimer la table des matières ?"
            );

        if (!confirmed) {
            return;
        }

        try {
            const currentHTML =
                editor.getHTML();

            const tocStart =
                currentHTML.indexOf(
                    '<div class="macevo-toc"'
                );

            const dataStart =
                currentHTML.indexOf(
                    'data-macevo-toc="true"'
                );

            let startIndex =
                tocStart !== -1
                    ? tocStart
                    : dataStart !== -1
                    ? currentHTML.lastIndexOf(
                          "<div",
                          dataStart
                      )
                    : -1;

            if (startIndex === -1) {
                throw new Error(
                    "Table des matières introuvable dans le contenu."
                );
            }

            const tocEnd =
                currentHTML.indexOf(
                    "</div>",
                    startIndex
                );

            if (tocEnd === -1) {
                throw new Error(
                    "Structure de la table des matières invalide."
                );
            }

            const afterToc =
                tocEnd +
                "</div>".length;

            const newHTML =
                currentHTML.slice(
                    0,
                    startIndex
                ) +
                currentHTML.slice(
                    afterToc
                );

            const success =
                editor.commands.setContent(
                    newHTML
                );

            if (!success) {
                throw new Error(
                    "Impossible de supprimer la table des matières."
                );
            }
        } catch (error) {
            console.error(
                "[MACEVO TOC] Erreur lors de la suppression :",
                error
            );

            setErrorMessage(
                error?.message ||
                    "Impossible de supprimer la table des matières."
            );
        }
    };

    /**
     * ---------------------------------------------------------
     * FERMER UNE MODALE
     * ---------------------------------------------------------
     */

    const closeModal = () => {
        setActiveModal(null);
        setErrorMessage("");
    };

    /**
     * ---------------------------------------------------------
     * MODALE D'ERREUR
     * ---------------------------------------------------------
     */

    const errorModal =
        activeModal === "update-error" ||
        activeModal === "delete-error"
            ? createPortal(
                  <div
                      className="
                          fixed inset-0
                          z-[999999]
                          flex items-center
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
                              closeModal();
                          }
                      }}
                  >
                      <div
                          className="
                              w-[440px]
                              max-w-[95vw]
                              rounded-xl
                              border border-slate-300
                              bg-white
                              shadow-2xl
                          "
                          role="dialog"
                          aria-modal="true"
                      >
                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                  Table des matières
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

                          <div className="p-5">
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                                  {errorMessage}
                              </div>
                          </div>

                          <div className="flex justify-end border-t border-slate-200 px-5 py-3">
                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
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
     * MODALE INSERTION
     * ---------------------------------------------------------
     */

    const insertModal =
        activeModal === "insert"
            ? createPortal(
                  <div
                      className="
                          fixed inset-0 z-[999999]
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
                              closeModal();
                          }
                      }}
                  >
                      <div
                          className="
                              w-[540px]
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
                      >
                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                  <Sparkles className="h-4 w-4 text-blue-600" />
                                  Générateur de table des matières
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

                          <div className="overflow-y-auto bg-slate-50 p-5">
                              <p className="mb-4 text-xs text-slate-600">
                                  Choisissez la source
                                  utilisée pour générer la
                                  table des matières.
                              </p>

                              <div className="grid grid-cols-2 gap-3">
                                  <button
                                      type="button"
                                      onClick={() =>
                                          setGenerationMode(
                                              "auto"
                                          )
                                      }
                                      className={`
                                          rounded-lg border p-3
                                          text-left transition-all
                                          ${
                                              generationMode ===
                                              "auto"
                                                  ? "border-blue-600 bg-blue-50 text-blue-900"
                                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                          }
                                      `}
                                  >
                                      <div className="flex items-center gap-2">
                                          <ListTree className="h-4 w-4" />

                                          <span className="text-xs font-semibold">
                                              Automatique
                                          </span>
                                      </div>

                                      <span className="mt-1 block text-[10px] text-slate-500">
                                          Utiliser les titres H1
                                          à H6 du document
                                      </span>
                                  </button>

                                  <button
                                      type="button"
                                      onClick={() =>
                                          setGenerationMode(
                                              "paste"
                                          )
                                      }
                                      className={`
                                          rounded-lg border p-3
                                          text-left transition-all
                                          ${
                                              generationMode ===
                                              "paste"
                                                  ? "border-blue-600 bg-blue-50 text-blue-900"
                                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                          }
                                      `}
                                  >
                                      <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4" />

                                          <span className="text-xs font-semibold">
                                              Manuel
                                          </span>
                                      </div>

                                      <span className="mt-1 block text-[10px] text-slate-500">
                                          Fournir son propre
                                          plan
                                      </span>
                                  </button>
                              </div>

                              {generationMode ===
                              "auto" ? (
                                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                                      <span className="text-[11px] font-bold text-slate-700">
                                          Titres détectés
                                      </span>

                                      {extractHeadings()
                                          .length ===
                                      0 ? (
                                          <p className="mt-2 text-xs italic text-amber-600">
                                              Aucun titre
                                              H1–H6 n'a
                                              été trouvé.
                                          </p>
                                      ) : (
                                          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                                              {extractHeadings().map(
                                                  (
                                                      heading,
                                                      index
                                                  ) => (
                                                      <li
                                                          key={`${index}-${heading.text}`}
                                                          className="truncate text-xs text-slate-600"
                                                      >
                                                          <strong className="text-blue-600">
                                                              H
                                                              {
                                                                  heading.level
                                                              }
                                                          </strong>{" "}
                                                          {
                                                              heading.text
                                                          }
                                                      </li>
                                                  )
                                              )}
                                          </ul>
                                      )}
                                  </div>
                              ) : (
                                  <div className="mt-4">
                                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                          Sections
                                      </label>

                                      <textarea
                                          rows={7}
                                          value={
                                              pastedContent
                                          }
                                          onChange={(
                                              event
                                          ) =>
                                              setPastedContent(
                                                  event
                                                      .target
                                                      .value
                                              )
                                          }
                                          placeholder={
                                              "Introduction\n1. Cadre théorique\n2. Méthodologie\n  2.1 Collecte des données\n  2.2 Analyse\nConclusion"
                                          }
                                          className="
                                              w-full
                                              resize-none
                                              rounded-md
                                              border border-slate-300
                                              bg-white
                                              px-3 py-2
                                              text-xs text-slate-800
                                              outline-none
                                              focus:border-blue-600
                                              focus:ring-1
                                              focus:ring-blue-600
                                          "
                                      />
                                  </div>
                              )}

                              {errorMessage && (
                                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                      <span>
                                          {
                                              errorMessage
                                          }
                                      </span>
                                  </div>
                              )}
                          </div>

                          <div className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
                              >
                                  Annuler
                              </button>

                              <button
                                  type="button"
                                  onClick={
                                      handleInsertSubmit
                                  }
                                  className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
                              >
                                  <Check className="h-3.5 w-3.5" />
                                  Générer et insérer
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    /**
     * ---------------------------------------------------------
     * MODALE MISE À JOUR
     * ---------------------------------------------------------
     */

    const updateModal =
        activeModal === "update"
            ? createPortal(
                  <div
                      className="
                          fixed inset-0 z-[999999]
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
                              closeModal();
                          }
                      }}
                  >
                      <div
                          className="
                              w-[540px]
                              max-w-[95vw]
                              overflow-hidden
                              rounded-xl
                              border border-slate-300
                              bg-white
                              shadow-2xl
                          "
                          role="dialog"
                          aria-modal="true"
                      >
                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                  <Edit3 className="h-4 w-4 text-blue-600" />
                                  Mettre à jour la table
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

                          <div className="bg-slate-50 p-5">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                  <p className="text-xs text-slate-600">
                                      Modifiez les éléments
                                      ou synchronisez-les
                                      avec les titres du
                                      document.
                                  </p>

                                  <button
                                      type="button"
                                      onClick={
                                          handleReloadFromDoc
                                      }
                                      className="flex shrink-0 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                                  >
                                      <RefreshCw className="h-3 w-3" />
                                      Synchroniser
                                  </button>
                              </div>

                              <textarea
                                  rows={9}
                                  value={
                                      updateTextContent
                                  }
                                  onChange={(
                                      event
                                  ) =>
                                      setUpdateTextContent(
                                          event
                                              .target
                                              .value
                                      )
                                  }
                                  className="
                                      w-full
                                      resize-none
                                      rounded-md
                                      border border-slate-300
                                      bg-white
                                      px-3 py-2
                                      font-mono
                                      text-xs
                                      text-slate-800
                                      outline-none
                                      focus:border-blue-600
                                      focus:ring-1
                                      focus:ring-blue-600
                                  "
                              />

                              <p className="mt-2 text-[10px] text-slate-500">
                                  Utilisez deux espaces au
                                  début d'une ligne pour
                                  représenter un niveau
                                  inférieur.
                              </p>

                              {errorMessage && (
                                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                      <span>
                                          {
                                              errorMessage
                                          }
                                      </span>
                                  </div>
                              )}
                          </div>

                          <div className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
                              >
                                  Annuler
                              </button>

                              <button
                                  type="button"
                                  onClick={
                                      handleUpdateSubmit
                                  }
                                  className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
                              >
                                  <Check className="h-3.5 w-3.5" />
                                  Appliquer
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    return (
        <RibbonGroup
            title="Table des matières"
            width="w-[220px] min-w-[220px]"
        >
            <div className="grid w-full grid-cols-3 gap-1">
                <RibbonButton
                    icon={ListTree}
                    label="Insérer"
                    tooltip="Générer et insérer une table des matières"
                    onClick={() => {
                        setErrorMessage("");
                        setGenerationMode("auto");
                        setActiveModal("insert");
                    }}
                />

                <RibbonButton
                    icon={RefreshCw}
                    label="Mettre à jour"
                    tooltip="Mettre à jour la table des matières"
                    onClick={openUpdateModal}
                />

                <RibbonButton
                    icon={Trash2}
                    label="Supprimer"
                    tooltip="Supprimer la table des matières"
                    onClick={removeTOC}
                />
            </div>

            {insertModal}
            {updateModal}
            {errorModal}
        </RibbonGroup>
    );
}

export default TableOfContentsGroup;