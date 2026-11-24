/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : FootnotesGroup.jsx
 * Version : 4.0.0
 * Statut  : Notes de bas de page — numérotation dynamique
 *           et synchronisation sécurisée
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    ScrollText,
    Plus,
    RefreshCw,
    X,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

function FootnotesGroup({ editor }) {
    const [activeModal, setActiveModal] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("");

    if (!editor) return null;

    /* ======================================================
       UTILITAIRES
    ====================================================== */

    const escapeHtml = (value) => {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const getEditorHTML = () => {
        try {
            return editor.getHTML();
        } catch (error) {
            console.error(
                "MACEVO : impossible de récupérer le contenu du document.",
                error
            );
            return "";
        }
    };

    const getFootnoteRefs = (root) => {
        if (!root) return [];

        return Array.from(
            root.querySelectorAll(".macevo-footnote-ref")
        );
    };

    const getFootnoteItems = (root) => {
        if (!root) return [];

        return Array.from(
            root.querySelectorAll(".macevo-footnote-item")
        );
    };

    const getFootnotesContainer = (root) => {
        if (!root) return null;

        return root.querySelector(".macevo-footnotes-container");
    };

    const cleanFootnoteText = (text) => {
        return String(text ?? "")
            .replace(/^\[\d+\]\s*/, "")
            .trim();
    };

    const getNextFootnoteIndex = (root) => {
        const items = getFootnoteItems(root);
        const refs = getFootnoteRefs(root);

        return Math.max(items.length, refs.length) + 1;
    };

    const updateEditorContent = (root) => {
        if (!root) return false;

        try {
            editor.commands.setContent(root.innerHTML);
            return true;
        } catch (error) {
            console.error(
                "MACEVO : impossible de synchroniser les notes de bas de page.",
                error
            );
            return false;
        }
    };

    /* ======================================================
       MODALE / FEEDBACK
    ====================================================== */

    const closeModal = () => {
        if (isProcessing) return;

        setActiveModal(null);
        setFeedbackMessage("");
    };

    const showFeedback = (message) => {
        setFeedbackMessage(message);
        setActiveModal("feedback");
    };

    useEffect(() => {
        if (!activeModal) return undefined;

        const handleEscape = (event) => {
            if (event.key === "Escape" && !isProcessing) {
                setActiveModal(null);
                setFeedbackMessage("");
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [activeModal, isProcessing]);

    const handleOverlayMouseDown = (event) => {
        if (
            event.target === event.currentTarget &&
            !isProcessing
        ) {
            closeModal();
        }
    };

    /* ======================================================
       INSÉRER UNE NOTE DE BAS DE PAGE
    ====================================================== */

    const insertFootnote = () => {
        if (!editor) return;

        const noteText = window.prompt(
            "Entrer le texte de la note de bas de page :"
        );

        if (!noteText || !noteText.trim()) {
            return;
        }

        const cleanedText = noteText.trim();
        const currentHTML = getEditorHTML();

        if (!currentHTML) {
            showFeedback(
                "Impossible d'insérer la note : le contenu du document est inaccessible."
            );
            return;
        }

        const parser = new DOMParser();
        const documentFragment = parser.parseFromString(
            currentHTML,
            "text/html"
        );

        const root = documentFragment.body;

        const nextIndex = getNextFootnoteIndex(root);

        /*
         * Marqueur de note.
         *
         * data-footnote-ref permet d'identifier proprement
         * le marqueur lors des synchronisations futures.
         */
        const referenceHtml = `
            <sup
                class="macevo-footnote-ref"
                data-footnote-ref="${nextIndex}"
                style="
                    color:#2563eb;
                    font-weight:700;
                    cursor:pointer;
                    margin-left:2px;
                "
            >[${nextIndex}]</sup>
        `;

        try {
            editor
                .chain()
                .focus()
                .insertContent(referenceHtml)
                .run();
        } catch (error) {
            console.error(
                "MACEVO : erreur lors de l'insertion du marqueur de note.",
                error
            );

            showFeedback(
                "La note de bas de page n'a pas pu être insérée."
            );

            return;
        }

        /*
         * On relit le DOM après l'insertion afin d'éviter
         * de travailler sur une ancienne représentation.
         */
        const updatedHTML = getEditorHTML();

        const updatedDocument = parser.parseFromString(
            updatedHTML,
            "text/html"
        );

        const updatedRoot = updatedDocument.body;

        let container = getFootnotesContainer(updatedRoot);

        /*
         * Création du conteneur global si nécessaire.
         */
        if (!container) {
            container = updatedDocument.createElement("div");

            container.className =
                "macevo-footnotes-container";

            container.setAttribute(
                "data-footnotes",
                "true"
            );

            container.style.cssText = `
                margin-top:40px;
                border-top:1px solid #cbd5e1;
                padding-top:15px;
                font-family:inherit;
            `;

            const title =
                updatedDocument.createElement("h4");

            title.className =
                "macevo-footnotes-title";

            title.textContent =
                "Notes de bas de page";

            title.style.cssText = `
                font-size:0.9rem;
                font-weight:700;
                color:#334155;
                margin:0 0 10px 0;
            `;

            const list =
                updatedDocument.createElement("div");

            list.className =
                "macevo-footnotes-list";

            container.appendChild(title);
            container.appendChild(list);

            updatedRoot.appendChild(container);
        }

        let list =
            container.querySelector(
                ".macevo-footnotes-list"
            );

        if (!list) {
            list = updatedDocument.createElement("div");

            list.className =
                "macevo-footnotes-list";

            container.appendChild(list);
        }

        const item =
            updatedDocument.createElement("p");

        item.className =
            "macevo-footnote-item";

        item.setAttribute(
            "data-footnote-index",
            String(nextIndex)
        );

        item.style.cssText = `
            font-size:11px;
            line-height:1.5;
            color:#475569;
            margin:0 0 5px 0;
        `;

        item.innerHTML = `
            <span
                class="macevo-footnote-number"
                style="font-weight:700;color:#1e293b;"
            >[${nextIndex}]</span>
            ${escapeHtml(cleanedText)}
        `;

        list.appendChild(item);

        /*
         * Synchronisation finale avec Tiptap.
         */
        const synchronized = updateEditorContent(
            updatedRoot
        );

        if (!synchronized) {
            showFeedback(
                "La note a été préparée mais le document n'a pas pu être synchronisé."
            );

            return;
        }

        showFeedback(
            `Note de bas de page ${nextIndex} insérée avec succès.`
        );
    };

    /* ======================================================
       ALIAS NOUVELLE NOTE
    ====================================================== */

    const addFootnote = () => {
        insertFootnote();
    };

    /* ======================================================
       SYNCHRONISER / RÉINDEXER
    ====================================================== */

    const updateFootnotes = () => {
        if (!editor) return;

        const currentHTML = getEditorHTML();

        if (!currentHTML) {
            showFeedback(
                "Impossible d'analyser les notes de bas de page."
            );
            return;
        }

        const parser = new DOMParser();

        const parsedDocument =
            parser.parseFromString(
                currentHTML,
                "text/html"
            );

        const root = parsedDocument.body;

        const refs = getFootnoteRefs(root);
        const items = getFootnoteItems(root);

        if (refs.length === 0 && items.length === 0) {
            showFeedback(
                "Aucune note de bas de page à synchroniser dans ce document."
            );

            return;
        }

        /*
         * Réindexation des appels de notes.
         */
        refs.forEach((ref, index) => {
            const number = index + 1;

            ref.textContent = `[${number}]`;

            ref.setAttribute(
                "data-footnote-ref",
                String(number)
            );
        });

        /*
         * Réindexation des notes.
         */
        items.forEach((item, index) => {
            const number = index + 1;

            const numberElement =
                item.querySelector(
                    ".macevo-footnote-number"
                );

            if (numberElement) {
                numberElement.textContent =
                    `[${number}]`;
            } else {
                const cleaned =
                    cleanFootnoteText(
                        item.textContent
                    );

                item.innerHTML = `
                    <span
                        class="macevo-footnote-number"
                        style="font-weight:700;color:#1e293b;"
                    >[${number}]</span>
                    ${escapeHtml(cleaned)}
                `;
            }

            item.setAttribute(
                "data-footnote-index",
                String(number)
            );
        });

        /*
         * Si le document possède des appels mais aucun
         * bloc de notes, on informe plutôt que de fabriquer
         * des notes vides.
         */
        if (refs.length > 0 && items.length === 0) {
            showFeedback(
                `${refs.length} appel(s) de note détecté(s), mais aucune note associée n'a été trouvée.`
            );

            return;
        }

        const synchronized =
            updateEditorContent(root);

        if (!synchronized) {
            showFeedback(
                "La renumérotation n'a pas pu être enregistrée."
            );

            return;
        }

        showFeedback(
            `Numérotation synchronisée : ${Math.max(
                refs.length,
                items.length
            )} note(s).`
        );
    };

    /* ======================================================
       MODALE FEEDBACK
    ====================================================== */

    const feedbackModal =
        activeModal === "feedback"
            ? createPortal(
                  <div
                      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4"
                      onMouseDown={handleOverlayMouseDown}
                      role="presentation"
                  >
                      <div
                          className="w-[440px] max-w-[95vw] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl"
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="macevo-footnote-feedback-title"
                          onMouseDown={(event) =>
                              event.stopPropagation()
                          }
                      >
                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <h3
                                  id="macevo-footnote-feedback-title"
                                  className="flex items-center gap-2 text-sm font-bold text-slate-800"
                              >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  Notes de bas de page
                              </h3>

                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                                  aria-label="Fermer"
                                  title="Fermer"
                              >
                                  <X className="h-5 w-5" />
                              </button>
                          </div>

                          <div className="bg-slate-50 px-5 py-6">
                              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                                  <p className="text-xs leading-relaxed text-emerald-900">
                                      {feedbackMessage}
                                  </p>
                              </div>
                          </div>

                          <div className="flex justify-end border-t border-slate-200 bg-white px-5 py-4">
                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                              >
                                  OK
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    /* ======================================================
       MODALE D'INFORMATION / ERREUR
    ====================================================== */

    const processingModal =
        activeModal === "processing"
            ? createPortal(
                  <div
                      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4"
                      role="presentation"
                  >
                      <div
                          className="w-[420px] max-w-[95vw] rounded-xl border border-slate-300 bg-white p-6 shadow-2xl"
                          role="dialog"
                          aria-modal="true"
                      >
                          <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />

                              <div>
                                  <h3 className="text-sm font-bold text-slate-800">
                                      Traitement des notes
                                  </h3>

                                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                      {isProcessing
                                          ? "Synchronisation des notes de bas de page en cours..."
                                          : "Traitement terminé."}
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    return (
        <>
            <RibbonGroup
                title="Notes de bas de page"
                className="w-[215px] min-w-[215px]"
            >
                <div className="flex h-full items-center gap-1">
                    <RibbonButton
                        icon={ScrollText}
                        label="Insérer"
                        tooltip="Insérer une note de bas de page à la position du curseur"
                        onClick={insertFootnote}
                    />

                    <RibbonButton
                        icon={Plus}
                        label="Nouvelle"
                        tooltip="Créer une nouvelle note de bas de page"
                        onClick={addFootnote}
                    />

                    <RibbonButton
                        icon={RefreshCw}
                        label="Mettre à jour"
                        tooltip="Renuméroter et synchroniser les notes de bas de page"
                        onClick={updateFootnotes}
                    />
                </div>
            </RibbonGroup>

            {feedbackModal}
            {processingModal}
        </>
    );
}

export default FootnotesGroup;