/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : TableOfFiguresGroup.jsx
 * Version : 5.0.0
 * Statut  : Professionnel — tables des illustrations et tableaux
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
    Image,
    Table,
    RefreshCw,
    X,
    Check,
    ListTree,
    Trash2,
    FileSpreadsheet,
    AlertTriangle,
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


function normalizeCaption(text) {
    return String(text ?? "")
        .replace(
            /^(Figure|Tableau|Illustration)\s*\d+\s*[—–-]\s*/i,
            ""
        )
        .replace(/\s+/g, " ")
        .trim();
}


/* ===========================================================
   COMPOSANT
   =========================================================== */

function TableOfFiguresGroup({ editor }) {
    const [activeModal, setActiveModal] = useState(null);
    const [previewItems, setPreviewItems] = useState([]);
    const [documentTofContainers, setDocumentTofContainers] = useState([]);
    const [feedback, setFeedback] = useState(null);


    /* =======================================================
       FERMETURE AVEC ESC
    ======================================================= */

    useEffect(() => {
        if (!activeModal) return;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setActiveModal(null);
                setFeedback(null);
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [activeModal]);


    /* =======================================================
       EXTRACTION DES LÉGENDES
    ======================================================= */

    const extractItems = (type) => {
        if (!editor?.view?.dom) {
            return [];
        }

        const root = editor.view.dom;

        let selector;

        if (type === "figures") {
            selector =
                ".macevo-caption, [data-caption-type='figure'], [data-caption-type='illustration']";
        } else {
            selector =
                ".macevo-table-caption, [data-table-caption], [data-caption-type='table']";
        }

        const elements = Array.from(root.querySelectorAll(selector));

        return elements
            .map((element) => normalizeCaption(element.textContent))
            .filter(Boolean);
    };


    /* =======================================================
       GÉNÉRATION DU HTML
    ======================================================= */

    const generateTableHtml = (type, items = []) => {
        const isFigures = type === "figures";

        const title = isFigures
            ? "Table des illustrations"
            : "Liste des tableaux";

        const itemLabel = isFigures
            ? "Figure"
            : "Tableau";

        const accentColor = isFigures
            ? "#3b82f6"
            : "#10b981";

        const safeItems = Array.isArray(items)
            ? items.filter(Boolean)
            : [];

        let itemsHtml;

        if (safeItems.length === 0) {
            itemsHtml = `
                <p
                    class="macevo-tof-empty"
                    style="
                        font-size:12px;
                        color:#9ca3af;
                        font-style:italic;
                        margin:8px 0;
                    "
                >
                    Aucun élément correspondant trouvé dans le document.
                </p>
            `;
        } else {
            itemsHtml = safeItems
                .map((item, index) => {
                    const safeItem = escapeHtml(item);

                    return `
                        <p
                            class="macevo-tof-item"
                            data-tof-index="${index}"
                            style="
                                font-size:12px;
                                color:#374151;
                                margin:0 0 7px 0;
                                display:flex;
                                align-items:baseline;
                                gap:8px;
                                line-height:1.5;
                            "
                        >
                            <span
                                style="
                                    font-weight:500;
                                    flex:0 1 auto;
                                    min-width:0;
                                "
                            >
                                ${itemLabel} ${index + 1} — ${safeItem}
                            </span>

                            <span
                                aria-hidden="true"
                                style="
                                    flex:1 1 auto;
                                    border-bottom:1px dotted #9ca3af;
                                    min-width:20px;
                                    height:1px;
                                    transform:translateY(-2px);
                                "
                            ></span>

                            <span
                                class="macevo-tof-page"
                                style="
                                    font-weight:600;
                                    color:#4b5563;
                                    flex:0 0 auto;
                                "
                            >
                                —
                            </span>
                        </p>
                    `;
                })
                .join("");
        }

        return `
            <div
                class="macevo-tof-container"
                data-tof-type="${isFigures ? "figures" : "tables"}"
                style="
                    border:1px solid #e5e7eb;
                    padding:20px;
                    border-radius:8px;
                    background-color:#f9fafb;
                    margin:20px 0;
                "
            >
                <h2
                    style="
                        font-size:1.25rem;
                        font-weight:700;
                        margin:0 0 12px 0;
                        color:#1f2937;
                        border-bottom:2px solid ${accentColor};
                        padding-bottom:6px;
                    "
                >
                    ${title}
                </h2>

                <div class="macevo-tof-list">
                    ${itemsHtml}
                </div>
            </div>

            <p><br></p>
        `;
    };


    /* =======================================================
       INSÉRER UNE TABLE
    ======================================================= */

    const openTableModal = (type) => {
        if (!editor) return;

        const items = extractItems(type);

        setPreviewItems(items);
        setFeedback(null);
        setActiveModal(type);
    };


    const handleConfirmInsert = (type) => {
        if (!editor) return;

        const html = generateTableHtml(type, previewItems);

        try {
            const success = editor
                .chain()
                .focus()
                .insertContent(html)
                .run();

            if (!success) {
                throw new Error(
                    "L'éditeur n'a pas pu insérer la table."
                );
            }

            setActiveModal(null);
            setFeedback(null);
        } catch (error) {
            console.error(
                "Erreur lors de l'insertion de la table :",
                error
            );

            setFeedback(
                "Impossible d'insérer cette table dans le document."
            );
        }
    };


    /* =======================================================
       DÉTECTION DES TABLES EXISTANTES
    ======================================================= */

    const getExistingTables = () => {
        if (!editor?.view?.dom) {
            return [];
        }

        const containers = Array.from(
            editor.view.dom.querySelectorAll(
                ".macevo-tof-container"
            )
        );

        return containers.map((container, index) => {
            const type =
                container.getAttribute("data-tof-type") ||
                "figures";

            const titleNode = container.querySelector("h2");

            return {
                id: index,
                type,
                title:
                    titleNode?.textContent?.trim() ||
                    (
                        type === "figures"
                            ? "Table des illustrations"
                            : "Liste des tableaux"
                    ),
            };
        });
    };


    /* =======================================================
       OUVRIR LA GESTION
    ======================================================= */

    const openUpdateModal = () => {
        if (!editor) return;

        const tables = getExistingTables();

        if (tables.length === 0) {
            setFeedback(
                "Aucune table des illustrations ou liste des tableaux n'a été trouvée."
            );
            setActiveModal("feedback");
            return;
        }

        setDocumentTofContainers(tables);
        setFeedback(null);
        setActiveModal("update");
    };


    /* =======================================================
       SUPPRIMER UNE TABLE
    ======================================================= */

    const handleDeleteTofContainer = (indexToDelete) => {
        if (!editor?.view?.dom) return;

        const root = editor.view.dom;

        const containers = Array.from(
            root.querySelectorAll(
                ".macevo-tof-container"
            )
        );

        const target = containers[indexToDelete];

        if (!target) {
            return;
        }

        /*
         * Le paragraphe vide ajouté après la table est supprimé
         * également lorsqu'il se trouve juste après le conteneur.
         */
        const nextSibling = target.nextElementSibling;

        target.remove();

        if (
            nextSibling?.tagName === "P" &&
            nextSibling.textContent.trim() === ""
        ) {
            nextSibling.remove();
        }

        try {
            editor.commands.setContent(root.innerHTML);

            const remaining = getExistingTables();

            setDocumentTofContainers(remaining);

            if (remaining.length === 0) {
                setActiveModal(null);
            }
        } catch (error) {
            console.error(
                "Erreur lors de la suppression de la table :",
                error
            );

            setFeedback(
                "La suppression de la table n'a pas pu être enregistrée."
            );
        }
    };


    /* =======================================================
       ACTUALISER TOUTES LES TABLES
    ======================================================= */

    const handleConfirmUpdateAll = () => {
        if (!editor?.view?.dom) return;

        const root = editor.view.dom;

        const containers = Array.from(
            root.querySelectorAll(
                ".macevo-tof-container"
            )
        );

        if (containers.length === 0) {
            setActiveModal(null);
            return;
        }

        try {
            containers.forEach((container) => {
                const type =
                    container.getAttribute("data-tof-type") ||
                    "figures";

                const items = extractItems(type);

                const listContainer =
                    container.querySelector(
                        ".macevo-tof-list"
                    );

                if (!listContainer) {
                    return;
                }

                /*
                 * On reconstruit uniquement le contenu de la liste.
                 * Le titre et le conteneur sont conservés.
                 */
                const isFigures = type === "figures";

                const itemLabel = isFigures
                    ? "Figure"
                    : "Tableau";

                if (items.length === 0) {
                    listContainer.replaceChildren();

                    const empty = document.createElement("p");

                    empty.className =
                        "macevo-tof-empty";

                    empty.style.cssText =
                        "font-size:12px;color:#9ca3af;font-style:italic;margin:8px 0;";

                    empty.textContent =
                        "Aucun élément correspondant trouvé dans le document.";

                    listContainer.appendChild(empty);

                    return;
                }

                listContainer.replaceChildren();

                items.forEach((item, index) => {
                    const paragraph =
                        document.createElement("p");

                    paragraph.className =
                        "macevo-tof-item";

                    paragraph.dataset.tofIndex =
                        String(index);

                    paragraph.style.cssText =
                        "font-size:12px;color:#374151;margin:0 0 7px 0;display:flex;align-items:baseline;gap:8px;line-height:1.5;";

                    const label =
                        document.createElement("span");

                    label.style.cssText =
                        "font-weight:500;flex:0 1 auto;min-width:0;";

                    label.textContent =
                        `${itemLabel} ${index + 1} — ${item}`;

                    const dots =
                        document.createElement("span");

                    dots.setAttribute(
                        "aria-hidden",
                        "true"
                    );

                    dots.style.cssText =
                        "flex:1 1 auto;border-bottom:1px dotted #9ca3af;min-width:20px;height:1px;transform:translateY(-2px);";

                    const page =
                        document.createElement("span");

                    page.className =
                        "macevo-tof-page";

                    page.style.cssText =
                        "font-weight:600;color:#4b5563;flex:0 0 auto;";

                    /*
                     * Le moteur de pagination pourra remplacer ce
                     * placeholder par le numéro réel ultérieurement.
                     */
                    page.textContent = "—";

                    paragraph.appendChild(label);
                    paragraph.appendChild(dots);
                    paragraph.appendChild(page);

                    listContainer.appendChild(paragraph);
                });
            });

            editor.commands.setContent(
                root.innerHTML
            );

            setDocumentTofContainers(
                getExistingTables()
            );

            setActiveModal(null);
        } catch (error) {
            console.error(
                "Erreur lors de la mise à jour des tables :",
                error
            );

            setFeedback(
                "La synchronisation des tables a échoué."
            );
        }
    };


    /* =======================================================
       RENDU
    ======================================================= */

    return (
        <RibbonGroup
            title="Tables"
            className="w-[210px] min-w-[210px]"
        >
            <RibbonButton
                icon={Image}
                label="Illustr."
                tooltip="Insérer une table des illustrations"
                onClick={() =>
                    openTableModal("figures")
                }
            />

            <RibbonButton
                icon={Table}
                label="Tableaux"
                tooltip="Insérer une liste des tableaux"
                onClick={() =>
                    openTableModal("tables")
                }
            />

            <RibbonButton
                icon={RefreshCw}
                label="Actualiser"
                tooltip="Mettre à jour et synchroniser les tables"
                onClick={openUpdateModal}
            />


            {/* =================================================
                MODALE INSERTION
            ================================================= */}

            {(activeModal === "figures" ||
                activeModal === "tables") &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setActiveModal(null);
                            }
                        }}
                    >
                        <div
                            className="bg-white rounded-xl shadow-2xl border border-gray-300 w-[520px] max-w-[95vw] overflow-hidden flex flex-col"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="macevo-tof-title"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3
                                    id="macevo-tof-title"
                                    className="text-sm font-bold text-gray-800 flex items-center gap-2"
                                >
                                    {activeModal ===
                                    "figures" ? (
                                        <Image className="w-4 h-4 text-blue-600" />
                                    ) : (
                                        <Table className="w-4 h-4 text-emerald-600" />
                                    )}

                                    {activeModal ===
                                    "figures"
                                        ? "Insérer la table des illustrations"
                                        : "Insérer la liste des tableaux"}
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded"
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>


                            <div className="p-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto bg-slate-50">
                                <div className="flex items-start gap-2 text-xs text-gray-600">
                                    <ListTree className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />

                                    <p>
                                        Les éléments sont détectés
                                        automatiquement à partir des
                                        légendes présentes dans le
                                        document.
                                    </p>
                                </div>


                                <div className="bg-white p-3 border border-gray-200 rounded-md flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                                    {previewItems.length >
                                    0 ? (
                                        previewItems.map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <div
                                                    key={`${item}-${index}`}
                                                    className="text-xs text-gray-800 font-medium px-2.5 py-1.5 bg-gray-50 rounded border border-gray-200 flex items-center gap-2"
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            activeModal ===
                                                            "figures"
                                                                ? "bg-blue-500"
                                                                : "bg-emerald-500"
                                                        }`}
                                                    />

                                                    <span className="truncate">
                                                        {item}
                                                    </span>
                                                </div>
                                            )
                                        )
                                    ) : (
                                        <div className="flex items-center gap-2 py-4 text-xs text-gray-400 italic">
                                            <AlertTriangle className="w-4 h-4" />
                                            Aucune légende détectée.
                                        </div>
                                    )}
                                </div>
                            </div>


                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                >
                                    Annuler
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleConfirmInsert(
                                            activeModal
                                        )
                                    }
                                    className={`px-4 py-2 text-xs font-medium text-white rounded shadow-sm transition-colors flex items-center gap-1.5 ${
                                        activeModal ===
                                        "figures"
                                            ? "bg-blue-600 hover:bg-blue-700"
                                            : "bg-emerald-600 hover:bg-emerald-700"
                                    }`}
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Insérer la table
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}


            {/* =================================================
                MODALE GESTION / ACTUALISATION
            ================================================= */}

            {activeModal === "update" &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setActiveModal(null);
                            }
                        }}
                    >
                        <div
                            className="bg-white rounded-xl shadow-2xl border border-gray-300 w-[550px] max-w-[95vw] overflow-hidden flex flex-col"
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 text-blue-600" />
                                    Gestion et mise à jour des tables
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded"
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>


                            <div className="p-6 flex flex-col gap-4 max-h-[65vh] overflow-y-auto bg-slate-100">
                                <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-lg flex flex-col gap-2">
                                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-xs font-bold text-gray-500">
                                        <FileSpreadsheet className="w-4 h-4 text-blue-600" />

                                        <span>
                                            Tables actives détectées (
                                            {
                                                documentTofContainers.length
                                            }
                                            )
                                        </span>
                                    </div>


                                    <div className="flex flex-col gap-2 pt-1">
                                        {documentTofContainers.map(
                                            (container) => (
                                                <div
                                                    key={`${container.type}-${container.id}`}
                                                    className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-md"
                                                >
                                                    <div className="flex items-center gap-2 overflow-hidden text-xs text-gray-800 flex-1">
                                                        <FileSpreadsheet
                                                            className={`w-4 h-4 shrink-0 ${
                                                                container.type ===
                                                                "figures"
                                                                    ? "text-blue-600"
                                                                    : "text-emerald-600"
                                                            }`}
                                                        />

                                                        <span className="font-semibold truncate">
                                                            {
                                                                container.title
                                                            }
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDeleteTofContainer(
                                                                container.id
                                                            )
                                                        }
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded shrink-0 ml-2 transition-colors"
                                                        title="Supprimer cette table"
                                                        aria-label={`Supprimer ${container.title}`}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>


                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                >
                                    Fermer
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleConfirmUpdateAll
                                    }
                                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors flex items-center gap-1.5"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Synchroniser toutes les tables
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}


            {/* =================================================
                MODALE FEEDBACK
            ================================================= */}

            {activeModal === "feedback" &&
                feedback &&
                createPortal(
                    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4">
                        <div
                            className="bg-white rounded-xl shadow-2xl border border-gray-300 w-[420px] max-w-[95vw] overflow-hidden"
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    Information
                                </h3>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveModal(null);
                                        setFeedback(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="px-5 py-6 text-xs text-gray-600">
                                {feedback}
                            </div>

                            <div className="flex justify-end px-5 py-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveModal(null);
                                        setFeedback(null);
                                    }}
                                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </RibbonGroup>
    );
}


export default TableOfFiguresGroup;