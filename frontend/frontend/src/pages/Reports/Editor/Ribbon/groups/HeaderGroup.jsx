/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : HeaderGroup.jsx
 * Version : 5.0.0
 * Statut  : En-tête et pied de page scientifiques
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    PanelTop,
    PanelBottom,
    Hash,
    X,
    Check,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";
import { useLayoutContext } from "../../LayoutContext";

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

function HeaderGroup() {
    const { editor } = useEditorContext();
    const { layout, setHeaderFooter } = useLayoutContext();
    const headerFooter = layout.headerFooter || {};

    const [activeModal, setActiveModal] = useState(null);

    const [headerText, setHeaderText] = useState("");
    const [footerText, setFooterText] = useState("");

    const [showPageNumber, setShowPageNumber] =
        useState(Boolean(headerFooter.showPageNumber));

    useEffect(() => {
        if (!activeModal) {
            return undefined;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setActiveModal(null);
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

    function closeModal() {
        setActiveModal(null);
    }

    /**
     * -------------------------------------------------------
     * RÉCUPÉRATION DE LA PAGE ACTIVE
     * -------------------------------------------------------
     *
     * On cherche uniquement les structures connues de MACEVO.
     * Aucun nouveau moteur de pagination n'est créé ici.
     */

    function getEditorPage() {
        const root = editor?.view?.dom;

        if (!root) {
            return null;
        }

        return (
            root.closest(".macevo-pagination-page") ||
            root.closest("#macevo-page") ||
            root.querySelector(".macevo-pagination-page") ||
            root.querySelector("#macevo-page")
        );
    }

    /**
     * -------------------------------------------------------
     * TROUVER / CRÉER L'EN-TÊTE
     * -------------------------------------------------------
     */

    function getHeaderElement(page) {
        if (!page) {
            return null;
        }

        return (
            page.querySelector(
                '[data-macevo-header="true"]'
            ) ||
            page.querySelector(".macevo-page-header")
        );
    }

    function getFooterElement(page) {
        if (!page) {
            return null;
        }

        return (
            page.querySelector(
                '[data-macevo-footer="true"]'
            ) ||
            page.querySelector(".macevo-page-footer")
        );
    }

    /**
     * -------------------------------------------------------
     * CRÉATION D'UNE STRUCTURE
     * -------------------------------------------------------
     */

    function createHeaderHtml(text) {
        return `
            <div
                class="macevo-page-header"
                data-macevo-header="true"
                contenteditable="false"
                data-header-text="${escapeAttribute(text)}"
            >
                <span class="macevo-header-content">
                    ${escapeHtml(text)}
                </span>
            </div>
        `;
    }

    function createFooterHtml(text) {
        return `
            <div
                class="macevo-page-footer"
                data-macevo-footer="true"
                contenteditable="false"
                data-footer-text="${escapeAttribute(text)}"
            >
                <span class="macevo-footer-content">
                    ${escapeHtml(text)}
                </span>
            </div>
        `;
    }

    /**
     * -------------------------------------------------------
     * INSÉRER / METTRE À JOUR EN-TÊTE
     * -------------------------------------------------------
     */

    function applyHeader() {
        const value = headerText.trim();
        editor.commands.updateHeaderContent?.(value, "");
        setHeaderFooter({ ...headerFooter, headerLeft: value, headerRight: "" });
        closeModal();
    }

    /**
     * -------------------------------------------------------
     * INSÉRER / METTRE À JOUR PIED DE PAGE
     * -------------------------------------------------------
     */

    function applyFooter() {
        const value = footerText.trim();
        const right = showPageNumber ? "Page {page}" : "";
        editor.commands.updateFooterContent?.(value, right);
        setHeaderFooter({ ...headerFooter, footerLeft: value, footerRight: "", showPageNumber });
        closeModal();
    }

    /**
     * -------------------------------------------------------
     * NUMÉROTATION
     * -------------------------------------------------------
     *
     * La pagination réelle de MACEVO reste responsable du
     * numéro de page. Ici, on ne force jamais "Page 1".
     */

    function applyPageNumber() {
        const right = showPageNumber ? "Page {page}" : "";
        editor.commands.updateFooterContent?.(footerText.trim(), right);
        setHeaderFooter({ ...headerFooter, footerLeft: footerText.trim(), footerRight: "", showPageNumber });
        closeModal();
    }

    /**
     * -------------------------------------------------------
     * SYNCHRONISATION TIPTAP
     * -------------------------------------------------------
     */

    function syncEditor() {
        const root = editor?.view?.dom;

        if (!root) {
            return;
        }

        const html = root.innerHTML;

        editor.commands.setContent(html, false);
    }

    /**
     * -------------------------------------------------------
     * OUVERTURE EN-TÊTE
     * -------------------------------------------------------
     */

    function openHeaderModal() {
        setHeaderText(headerFooter.headerLeft || "");
        setActiveModal("header");
    }

    /**
     * -------------------------------------------------------
     * OUVERTURE PIED DE PAGE
     * -------------------------------------------------------
     */

    function openFooterModal() {
        setFooterText(headerFooter.footerLeft || "");
        setShowPageNumber(Boolean(headerFooter.showPageNumber));
        setActiveModal("footer");
    }

    /**
     * -------------------------------------------------------
     * OUVERTURE NUMÉROTATION
     * -------------------------------------------------------
     */

    function openPageNumberModal() {
        setFooterText(headerFooter.footerLeft || "");
        setShowPageNumber(Boolean(headerFooter.showPageNumber));
        setActiveModal("page-number");
    }

    /**
     * -------------------------------------------------------
     * MODALE TEXTE
     * -------------------------------------------------------
     */

    function renderTextModal({
        title,
        value,
        setValue,
        onConfirm,
        placeholder,
        description,
    }) {
        return createPortal(
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
                    className="w-[500px] max-w-[95vw] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl"
                    role="dialog"
                    aria-modal="true"
                    onMouseDown={(event) =>
                        event.stopPropagation()
                    }
                >
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">
                                {title}
                            </h3>

                            <p className="mt-1 text-[10px] text-slate-400">
                                {description}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                            aria-label="Fermer"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="bg-slate-50 p-5">
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Contenu
                        </label>

                        <input
                            type="text"
                            value={value}
                            onChange={(event) =>
                                setValue(
                                    event.target.value
                                )
                            }
                            onKeyDown={(event) => {
                                if (
                                    event.key ===
                                    "Enter"
                                ) {
                                    onConfirm();
                                }
                            }}
                            placeholder={placeholder}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            autoFocus
                        />

                        <p className="mt-2 text-[10px] text-slate-400">
                            Laissez le champ vide pour
                            supprimer l'élément existant.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Annuler
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                        >
                            <Check className="h-3.5 w-3.5" />
                            Appliquer
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    /**
     * -------------------------------------------------------
     * MODALE NUMÉROTATION
     * -------------------------------------------------------
     */

    const pageNumberModal =
        activeModal === "page-number"
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
                          onMouseDown={(event) =>
                              event.stopPropagation()
                          }
                      >
                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                                      <Hash className="h-5 w-5 text-blue-600" />
                                  </div>

                                  <div>
                                      <h3 className="text-sm font-bold text-slate-800">
                                          Numérotation des pages
                                      </h3>

                                      <p className="mt-1 text-[10px] text-slate-400">
                                          Gestion de l'affichage du
                                          numéro de page
                                      </p>
                                  </div>
                              </div>

                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                  aria-label="Fermer"
                              >
                                  <X className="h-5 w-5" />
                              </button>
                          </div>

                          <div className="bg-slate-50 p-5">
                              <button
                                  type="button"
                                  onClick={() =>
                                      setShowPageNumber(
                                          (value) =>
                                              !value
                                      )
                                  }
                                  className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition ${
                                      showPageNumber
                                          ? "border-blue-300 bg-blue-50"
                                          : "border-slate-200 bg-white"
                                  }`}
                              >
                                  <div>
                                      <div className="text-xs font-semibold text-slate-800">
                                          Afficher le numéro de
                                          page
                                      </div>

                                      <div className="mt-1 text-[10px] text-slate-400">
                                          La valeur numérique est
                                          fournie par le système de
                                          pagination MACEVO.
                                      </div>
                                  </div>

                                  <div
                                      className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${
                                          showPageNumber
                                              ? "bg-blue-600"
                                              : "bg-slate-300"
                                      }`}
                                  >
                                      <div
                                          className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                              showPageNumber
                                                  ? "translate-x-4"
                                                  : "translate-x-0"
                                          }`}
                                      />
                                  </div>
                              </button>
                          </div>

                          <div className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                              >
                                  Annuler
                              </button>

                              <button
                                  type="button"
                                  onClick={applyPageNumber}
                                  className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                              >
                                  Appliquer
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    const headerModal =
        activeModal === "header"
            ? renderTextModal({
                  title: "En-tête",
                  value: headerText,
                  setValue: setHeaderText,
                  onConfirm: applyHeader,
                  placeholder:
                      "Ex. MACEVO — Rapport scientifique",
                  description:
                      "Texte affiché dans la partie supérieure de la page.",
              })
            : null;

    const footerModal =
        activeModal === "footer"
            ? renderTextModal({
                  title: "Pied de page",
                  value: footerText,
                  setValue: setFooterText,
                  onConfirm: applyFooter,
                  placeholder:
                      "Ex. Université — Département scientifique",
                  description:
                      "Texte affiché dans la partie inférieure de la page.",
              })
            : null;

    return (
        <>
            <RibbonGroup
                title="En-tête & Pied de page"
                className="w-[245px] min-w-[245px]"
            >
                <div className="flex h-full items-center gap-1">
                    <RibbonButton
                        icon={PanelTop}
                        label="En-tête"
                        tooltip="Insérer ou modifier l'en-tête"
                        onClick={openHeaderModal}
                    />

                    <RibbonButton
                        icon={PanelBottom}
                        label="Pied"
                        tooltip="Insérer ou modifier le pied de page"
                        onClick={openFooterModal}
                    />

                    <RibbonButton
                        icon={Hash}
                        label="Pages"
                        tooltip="Configurer la numérotation des pages"
                        onClick={openPageNumberModal}
                    />
                </div>
            </RibbonGroup>

            {headerModal}
            {footerModal}
            {pageNumberModal}
        </>
    );
}

export default HeaderGroup;
