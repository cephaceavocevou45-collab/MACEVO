 /**
  * ===========================================================
  * MACEVO
  * -----------------------------------------------------------
  * Fichier : HistoryGroup.jsx
  * Version : 6.0.0
  * Statut  : Historique et gestion des versions
  * ===========================================================
  */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    Undo2,
    Redo2,
    History,
    X,
    RotateCcw,
    Clock3,
    Check,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

function HistoryGroup() {
    const { editor } = useEditorContext();

    const [activeModal, setActiveModal] = useState(null);
    const [versions, setVersions] = useState([]);
    const [error, setError] = useState("");

    if (!editor) {
        return null;
    }

    /* ======================================================
       MODALE
    ====================================================== */

    function closeModal() {
        setActiveModal(null);
        setError("");
    }

    /* ======================================================
       ESCAPE
    ====================================================== */

    useEffect(() => {
        if (!activeModal) {
            return undefined;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                closeModal();
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

    /* ======================================================
       ANNULER
    ====================================================== */

    function undo() {
        if (!editor.can().undo()) {
            return;
        }

        editor.chain().focus().undo().run();
    }

    /* ======================================================
       RÉTABLIR
    ====================================================== */

    function redo() {
        if (!editor.can().redo()) {
            return;
        }

        editor.chain().focus().redo().run();
    }

    /* ======================================================
       HISTORIQUE TIPTAP
    ====================================================== */

    function openHistory() {
        setError("");

        try {
            const undoAvailable =
                editor.can().undo();

            const redoAvailable =
                editor.can().redo();

            setVersions([
                {
                    id: "undo",
                    title: "Dernière modification",
                    description:
                        undoAvailable
                            ? "Une modification précédente peut être annulée."
                            : "Aucune modification précédente disponible.",
                    type: "undo",
                    available: undoAvailable,
                },
                {
                    id: "redo",
                    title: "Modification annulée",
                    description:
                        redoAvailable
                            ? "Une modification annulée peut être rétablie."
                            : "Aucune modification à rétablir.",
                    type: "redo",
                    available: redoAvailable,
                },
            ]);
        } catch (err) {
            console.error(
                "MACEVO : impossible de lire l'historique.",
                err
            );

            setVersions([]);
            setError(
                "Impossible de récupérer l'état actuel de l'historique."
            );
        }

        setActiveModal("history");
    }

    /* ======================================================
       ACTION HISTORIQUE
    ====================================================== */

    function executeHistoryAction(type) {
        if (type === "undo") {
            undo();
        }

        if (type === "redo") {
            redo();
        }

        closeModal();
    }

    /* ======================================================
       MODALE HISTORIQUE
    ====================================================== */

    const historyModal =
        activeModal === "history"
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
                          className="w-[520px] max-w-[95vw] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl"
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="macevo-history-title"
                          onMouseDown={(event) =>
                              event.stopPropagation()
                          }
                      >
                          {/* HEADER */}

                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                                      <History className="h-5 w-5 text-slate-600" />
                                  </div>

                                  <div>
                                      <h3
                                          id="macevo-history-title"
                                          className="text-sm font-bold text-slate-800"
                                      >
                                          Historique
                                      </h3>

                                      <p className="mt-0.5 text-[10px] text-slate-400">
                                          État des modifications du
                                          document
                                      </p>
                                  </div>
                              </div>

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

                          {/* BODY */}

                          <div className="max-h-[55vh] overflow-y-auto bg-slate-50 p-5">
                              {error ? (
                                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                      <div className="flex items-start gap-3">
                                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                                          <p className="text-xs leading-relaxed text-red-700">
                                              {error}
                                          </p>
                                      </div>
                                  </div>
                              ) : versions.length ===
                                0 ? (
                                  <div className="py-10 text-center">
                                      <Clock3 className="mx-auto mb-3 h-8 w-8 text-slate-300" />

                                      <p className="text-xs font-semibold text-slate-600">
                                          Aucun historique disponible
                                      </p>
                                  </div>
                              ) : (
                                  <div className="space-y-2">
                                      {versions.map(
                                          (version) => (
                                              <button
                                                  key={
                                                      version.id
                                                  }
                                                  type="button"
                                                  disabled={
                                                      !version.available
                                                  }
                                                  onClick={() =>
                                                      executeHistoryAction(
                                                          version.type
                                                      )
                                                  }
                                                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                                                      version.available
                                                          ? "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                                                          : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
                                                  }`}
                                              >
                                                  <div
                                                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                                          version.available
                                                              ? "bg-blue-50 text-blue-600"
                                                              : "bg-slate-200 text-slate-400"
                                                      }`}
                                                  >
                                                      {version.type ===
                                                      "undo" ? (
                                                          <RotateCcw className="h-4 w-4" />
                                                      ) : (
                                                          <Redo2 className="h-4 w-4" />
                                                      )}
                                                  </div>

                                                  <div className="min-w-0 flex-1">
                                                      <div className="text-xs font-semibold text-slate-800">
                                                          {
                                                              version.title
                                                          }
                                                      </div>

                                                      <div className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
                                                          {
                                                              version.description
                                                          }
                                                      </div>
                                                  </div>

                                                  {version.available && (
                                                      <Check className="h-4 w-4 shrink-0 text-blue-600" />
                                                  )}
                                              </button>
                                          )
                                      )}
                                  </div>
                              )}
                          </div>

                          {/* FOOTER */}

                          <div className="flex justify-end border-t border-slate-200 bg-white px-5 py-4">
                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
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
       RENDU
    ====================================================== */

    return (
        <>
            <RibbonGroup
                title="Historique"
                className="w-[185px] min-w-[185px]"
            >
                <div className="flex h-full items-center gap-1">
                    <RibbonButton
                        icon={Undo2}
                        label="Annuler"
                        tooltip="Annuler la dernière modification"
                        onClick={undo}
                        disabled={!editor.can().undo()}
                    />

                    <RibbonButton
                        icon={Redo2}
                        label="Rétablir"
                        tooltip="Rétablir la modification annulée"
                        onClick={redo}
                        disabled={!editor.can().redo()}
                    />

                    <RibbonButton
                        icon={History}
                        label="Historique"
                        tooltip="Afficher l'état de l'historique"
                        onClick={openHistory}
                    />
                </div>
            </RibbonGroup>

            {historyModal}
        </>
    );
}

export default HistoryGroup;