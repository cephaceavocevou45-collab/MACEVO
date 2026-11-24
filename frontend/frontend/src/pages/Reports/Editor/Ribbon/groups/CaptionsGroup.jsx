/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : CaptionsGroup.jsx
 * Version : 7.0.0
 * Statut  : Professionnel - Légendes scientifiques
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    ImagePlus,
    ListOrdered,
    RefreshCw,
    X,
    Sparkles,
    Trash2,
    Check,
    Plus,
    Minus,
    FileText,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

/* ===========================================================
   UTILITAIRES
=========================================================== */

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value = "") {
    return escapeHtml(value);
}

function getElements(editor) {
    if (!editor?.view?.dom) {
        return [];
    }

    return Array.from(
        editor.view.dom.querySelectorAll(".macevo-labeled-item")
    );
}

function getPrefix(el) {
    return el?.getAttribute("data-prefix") || "Figure";
}

function getNextIndex(elements, prefix) {
    return (
        elements.filter(
            (element) => getPrefix(element) === prefix
        ).length + 1
    );
}

function renumberElements(editor) {
    const elements = getElements(editor);

    const counters = {
        Figure: 0,
        Tableau: 0,
        Annexe: 0,
        Équation: 0,
    };

    elements.forEach((element) => {
        const prefix = getPrefix(element);

        counters[prefix] = (counters[prefix] || 0) + 1;

        const number = counters[prefix];

        /* -----------------------------------------
           TABLEAU
        ----------------------------------------- */
        if (prefix === "Tableau") {
            const title = element.querySelector(
                ".macevo-caption-title"
            );

            if (title) {
                const current =
                    title.getAttribute("data-caption-text") ||
                    "";

                title.textContent =
                    `Tableau ${number} — ${current}`;

                title.setAttribute(
                    "data-caption-text",
                    current
                );
            }

            return;
        }

        /* -----------------------------------------
           ANNEXE
        ----------------------------------------- */
        if (prefix === "Annexe") {
            const title = element.querySelector(
                ".macevo-caption-title"
            );

            if (title) {
                const current =
                    title.getAttribute("data-caption-text") ||
                    "";

                title.textContent =
                    `Annexe ${number} — ${current}`;

                title.setAttribute(
                    "data-caption-text",
                    current
                );
            }

            return;
        }

        /* -----------------------------------------
           ÉQUATION
        ----------------------------------------- */
        if (prefix === "Équation") {
            const badge = element.querySelector(
                ".macevo-equation-number"
            );

            if (badge) {
                badge.textContent = `(${number})`;
            }

            return;
        }

        /* -----------------------------------------
           FIGURE
        ----------------------------------------- */
        const title = element.querySelector(
            ".macevo-caption-title"
        );

        if (title) {
            const current =
                title.getAttribute("data-caption-text") ||
                "";

            title.textContent =
                `Figure ${number} — ${current}`;

            title.setAttribute(
                "data-caption-text",
                current
            );
        }
    });

    editor.commands.setContent(editor.view.dom.innerHTML);
}

/* ===========================================================
   COMPOSANT
=========================================================== */

function CaptionsGroup({ editor }) {
    const [activeModal, setActiveModal] = useState(null);

    const [captionPrefix, setCaptionPrefix] =
        useState("Figure");

    const [tableRows, setTableRows] = useState(2);
    const [tableCols, setTableCols] = useState(2);

    const [tableData, setTableData] = useState([
        ["", ""],
        ["", ""],
    ]);

    const [equationText, setEquationText] = useState("");
    const [simpleLegendText, setSimpleLegendText] =
        useState("");

    const [documentCaptions, setDocumentCaptions] =
        useState([]);

    /* =========================================================
       FERMETURE AVEC ÉCHAP
    ========================================================= */

    useEffect(() => {
        if (!activeModal) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setActiveModal(null);
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

    /* =========================================================
       TABLEAU DYNAMIQUE
    ========================================================= */

    const handleRowsChange = (newRows) => {
        const rows = Math.max(
            1,
            Math.min(10, Number(newRows) || 1)
        );

        setTableRows(rows);

        setTableData((previous) => {
            const updated = previous.map((row) => [
                ...row,
            ]);

            while (updated.length < rows) {
                updated.push(
                    new Array(tableCols).fill("")
                );
            }

            while (updated.length > rows) {
                updated.pop();
            }

            return updated;
        });
    };

    const handleColsChange = (newCols) => {
        const cols = Math.max(
            1,
            Math.min(10, Number(newCols) || 1)
        );

        setTableCols(cols);

        setTableData((previous) =>
            previous.map((row) => {
                const updated = [...row];

                while (updated.length < cols) {
                    updated.push("");
                }

                while (updated.length > cols) {
                    updated.pop();
                }

                return updated;
            })
        );
    };

    const handleCellChange = (
        rowIndex,
        columnIndex,
        value
    ) => {
        setTableData((previous) =>
            previous.map((row, currentRow) => {
                if (currentRow !== rowIndex) {
                    return row;
                }

                return row.map(
                    (cell, currentColumn) =>
                        currentColumn === columnIndex
                            ? value
                            : cell
                );
            })
        );
    };

    /* =========================================================
       GÉNÉRATION DU TABLEAU
    ========================================================= */

    const generateTableHtml = (number) => {
        let rowsHtml = "";

        tableData.forEach((row, rowIndex) => {
            rowsHtml += "<tr>";

            row.forEach((cell, columnIndex) => {
                const tag =
                    rowIndex === 0 ? "th" : "td";

                const style =
                    rowIndex === 0
                        ? [
                              "border:1px solid #cbd5e1",
                              "background:#f1f5f9",
                              "padding:8px 12px",
                              "font-weight:700",
                              "text-align:left",
                              "font-size:13px",
                          ].join(";")
                        : [
                              "border:1px solid #cbd5e1",
                              "padding:8px 12px",
                              "text-align:left",
                              "font-size:13px",
                          ].join(";");

                const fallback =
                    rowIndex === 0
                        ? `En-tête ${columnIndex + 1}`
                        : "Cellule";

                const content =
                    cell.trim() !== ""
                        ? escapeHtml(cell)
                        : fallback;

                rowsHtml += `
                    <${tag} style="${style}">
                        ${content}
                    </${tag}>
                `;
            });

            rowsHtml += "</tr>";
        });

        return `
            <div
                class="macevo-labeled-item"
                data-prefix="Tableau"
                style="margin:25px 0;"
            >
                <p
                    class="macevo-caption-title"
                    data-caption-text="${escapeAttribute(
                        simpleLegendText.trim() ||
                            "Tableau sans titre"
                    )}"
                    style="
                        font-weight:700;
                        font-size:13px;
                        color:#1e293b;
                        margin-bottom:8px;
                        text-align:center;
                    "
                >
                    Tableau ${number} —
                    ${escapeHtml(
                        simpleLegendText.trim() ||
                            "Tableau sans titre"
                    )}
                </p>

                <table
                    style="
                        width:100%;
                        border-collapse:collapse;
                        margin-bottom:10px;
                    "
                >
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>

            <p><br></p>
        `;
    };

    /* =========================================================
       GÉNÉRATION ÉQUATION
    ========================================================= */

    const generateEquationHtml = (number) => {
        const latex =
            equationText.trim() || "E = mc^2";

        return `
            <div
                class="macevo-labeled-item"
                data-prefix="Équation"
                data-latex="${escapeAttribute(latex)}"
                style="
                    margin:25px 0;
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    background:#f8fafc;
                    padding:12px 18px;
                    border-left:4px solid #2563eb;
                    border-radius:6px;
                "
            >
                <div
                    class="macevo-equation-content"
                    data-latex="${escapeAttribute(latex)}"
                    style="
                        font-family:'Cambria Math',serif;
                        font-style:italic;
                        font-size:15px;
                        width:100%;
                        text-align:center;
                        color:#0f172a;
                    "
                >
                    ${escapeHtml(latex)}
                </div>

                <div
                    class="macevo-equation-number"
                    style="
                        font-size:13px;
                        font-weight:700;
                        color:#475569;
                        white-space:nowrap;
                        margin-left:15px;
                    "
                >
                    (${number})
                </div>
            </div>

            <p><br></p>
        `;
    };

    /* =========================================================
       GÉNÉRATION ANNEXE
    ========================================================= */

    const generateAnnexHtml = (number) => {
        const text =
            simpleLegendText.trim() ||
            "Document d'annexe";

        return `
            <div
                class="macevo-labeled-item"
                data-prefix="Annexe"
                style="
                    margin:25px 0;
                    border:1px dashed #64748b;
                    padding:18px;
                    border-radius:8px;
                    background:#f8fafc;
                "
            >
                <p
                    class="macevo-caption-title"
                    data-caption-text="${escapeAttribute(
                        text
                    )}"
                    style="
                        font-weight:700;
                        font-size:13px;
                        color:#1e293b;
                        margin-bottom:8px;
                    "
                >
                    Annexe ${number} —
                    ${escapeHtml(text)}
                </p>

                <p
                    style="
                        font-size:13px;
                        color:#475569;
                    "
                >
                    [Contenu de l'annexe]
                </p>
            </div>

            <p><br></p>
        `;
    };

    /* =========================================================
       GÉNÉRATION FIGURE
    ========================================================= */

    const generateFigureHtml = (number) => {
        const text =
            simpleLegendText.trim() ||
            "Illustration";

        return `
            <div
                class="macevo-labeled-item"
                data-prefix="Figure"
                style="
                    margin:25px 0;
                    text-align:center;
                "
            >
                <div
                    style="
                        border:2px dashed #cbd5e1;
                        padding:35px;
                        background:#f8fafc;
                        border-radius:8px;
                        color:#64748b;
                        font-size:12px;
                        margin-bottom:8px;
                    "
                >
                    [Espace réservé pour
                    l'illustration / Figure]
                </div>

                <p
                    class="macevo-caption-title"
                    data-caption-text="${escapeAttribute(
                        text
                    )}"
                    style="
                        font-size:13px;
                        color:#475569;
                        font-style:italic;
                    "
                >
                    Figure ${number} —
                    ${escapeHtml(text)}
                </p>
            </div>

            <p><br></p>
        `;
    };

    /* =========================================================
       INSERTION
    ========================================================= */

    const handleConfirmInsert = (event) => {
        event.preventDefault();

        if (!editor) {
            return;
        }

        const elements = getElements(editor);

        const nextIndex = getNextIndex(
            elements,
            captionPrefix
        );

        let generatedHTML = "";

        if (captionPrefix === "Tableau") {
            generatedHTML =
                generateTableHtml(nextIndex);
        } else if (captionPrefix === "Équation") {
            generatedHTML =
                generateEquationHtml(nextIndex);
        } else if (captionPrefix === "Annexe") {
            generatedHTML =
                generateAnnexHtml(nextIndex);
        } else {
            generatedHTML =
                generateFigureHtml(nextIndex);
        }

        editor
            .chain()
            .focus()
            .insertContent(generatedHTML)
            .run();

        setSimpleLegendText("");
        setEquationText("");

        setActiveModal(null);
    };

    /* =========================================================
       OUVERTURE NUMÉROTATION
    ========================================================= */

    const openNumberingModal = () => {
        if (!editor) {
            return;
        }

        const elements = getElements(editor);

        if (elements.length === 0) {
            alert(
                "Aucun élément étiqueté trouvé dans le document."
            );
            return;
        }

        const extracted = elements.map(
            (element, index) => ({
                id: index,
                prefix: getPrefix(element),
                previewText: element.textContent
                    .trim()
                    .substring(0, 70),
            })
        );

        setDocumentCaptions(extracted);
        setActiveModal("numbering");
    };

    /* =========================================================
       NUMÉROTATION
    ========================================================= */

    const handleConfirmNumbering = () => {
        if (!editor) {
            return;
        }

        renumberElements(editor);

        const elements = getElements(editor);

        const extracted = elements.map(
            (element, index) => ({
                id: index,
                prefix: getPrefix(element),
                previewText: element.textContent
                    .trim()
                    .substring(0, 70),
            })
        );

        setDocumentCaptions(extracted);
        setActiveModal(null);
    };

    /* =========================================================
       OUVERTURE MISE À JOUR
    ========================================================= */

    const openUpdateModal = () => {
        if (!editor) {
            return;
        }

        const elements = getElements(editor);

        if (elements.length === 0) {
            alert(
                "Aucun élément étiqueté n'a été trouvé dans le document."
            );
            return;
        }

        const extracted = elements.map(
            (element, index) => ({
                id: index,
                prefix: getPrefix(element),
                text: element.textContent
                    .trim()
                    .substring(0, 70),
            })
        );

        setDocumentCaptions(extracted);
        setActiveModal("update");
    };

    /* =========================================================
       SUPPRESSION
    ========================================================= */

    const handleDeleteElement = (indexToDelete) => {
        if (!editor) {
            return;
        }

        const elements = getElements(editor);
        const element = elements[indexToDelete];

        if (!element) {
            return;
        }

        element.remove();

        /*
         * Supprime également le paragraphe vide
         * directement associé lorsque présent.
         */
        const nextSibling = element.nextElementSibling;

        if (
            nextSibling &&
            nextSibling.tagName === "P" &&
            nextSibling.textContent.trim() === ""
        ) {
            nextSibling.remove();
        }

        renumberElements(editor);

        const remaining = getElements(editor);

        const extracted = remaining.map(
            (currentElement, index) => ({
                id: index,
                prefix: getPrefix(currentElement),
                text: currentElement.textContent
                    .trim()
                    .substring(0, 70),
            })
        );

        setDocumentCaptions(extracted);

        if (extracted.length === 0) {
            setActiveModal(null);
        }
    };

    /* =========================================================
       MISE À JOUR
    ========================================================= */

    const handleConfirmUpdate = () => {
        if (!editor) {
            return;
        }

        renumberElements(editor);

        const elements = getElements(editor);

        const extracted = elements.map(
            (element, index) => ({
                id: index,
                prefix: getPrefix(element),
                text: element.textContent
                    .trim()
                    .substring(0, 70),
            })
        );

        setDocumentCaptions(extracted);
    };

    /* =========================================================
       RENDU
    ========================================================= */

    if (!editor) {
        return null;
    }

    return (
        <RibbonGroup
            title="Légendes"
            className="w-[210px] min-w-[210px]"
        >
            {/* =================================================
                BOUTONS DU RUBAN
            ================================================= */}

            <RibbonButton
                icon={ImagePlus}
                label="Légende"
                tooltip="Insérer une figure, un tableau, une équation ou une annexe"
                onClick={() => {
                    setActiveModal("insert");
                }}
            />

            <RibbonButton
                icon={ListOrdered}
                label="Numéroter"
                tooltip="Numéroter automatiquement les éléments scientifiques"
                onClick={openNumberingModal}
            />

            <RibbonButton
                icon={RefreshCw}
                label="Mettre à jour"
                tooltip="Réindexer les figures, tableaux, équations et annexes"
                onClick={openUpdateModal}
            />

            {/* =================================================
                MODALE INSERTION
            ================================================= */}

            {activeModal === "insert" &&
                createPortal(
                    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px]">
                        <div className="flex max-h-[90vh] w-[560px] max-w-[95vw] flex-col overflow-hidden rounded-xl border border-gray-300 bg-white shadow-2xl">

                            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
                                    <Sparkles className="h-4 w-4 text-blue-600" />
                                    Insérer un élément et sa légende
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                                    title="Fermer"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form
                                onSubmit={
                                    handleConfirmInsert
                                }
                                className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto p-6"
                            >
                                {/* TYPE */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                                        Type d'élément
                                    </label>

                                    <select
                                        value={
                                            captionPrefix
                                        }
                                        onChange={(event) =>
                                            setCaptionPrefix(
                                                event.target
                                                    .value
                                            )
                                        }
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Figure">
                                            Figure — Illustration / Image
                                        </option>

                                        <option value="Tableau">
                                            Tableau — Données structurées
                                        </option>

                                        <option value="Équation">
                                            Équation — Formule scientifique
                                        </option>

                                        <option value="Annexe">
                                            Annexe — Document complémentaire
                                        </option>
                                    </select>
                                </div>

                                {/* TABLEAU */}
                                {captionPrefix ===
                                    "Tableau" && (
                                    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">

                                        <span className="text-xs font-bold text-gray-700">
                                            Configuration du tableau
                                        </span>

                                        <div className="flex flex-wrap items-center gap-5">

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-600">
                                                    Lignes :
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRowsChange(
                                                            tableRows -
                                                                1
                                                        )
                                                    }
                                                    className="rounded border bg-white p-1 hover:bg-gray-100"
                                                    title="Retirer une ligne"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>

                                                <span className="w-5 text-center text-xs font-bold">
                                                    {
                                                        tableRows
                                                    }
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRowsChange(
                                                            tableRows +
                                                                1
                                                        )
                                                    }
                                                    className="rounded border bg-white p-1 hover:bg-gray-100"
                                                    title="Ajouter une ligne"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-600">
                                                    Colonnes :
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleColsChange(
                                                            tableCols -
                                                                1
                                                        )
                                                    }
                                                    className="rounded border bg-white p-1 hover:bg-gray-100"
                                                    title="Retirer une colonne"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>

                                                <span className="w-5 text-center text-xs font-bold">
                                                    {
                                                        tableCols
                                                    }
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleColsChange(
                                                            tableCols +
                                                                1
                                                        )
                                                    }
                                                    className="rounded border bg-white p-1 hover:bg-gray-100"
                                                    title="Ajouter une colonne"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-700">
                                                Titre / légende
                                            </label>

                                            <input
                                                type="text"
                                                required
                                                value={
                                                    simpleLegendText
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setSimpleLegendText(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                placeholder="Ex. Résultats comparatifs des performances"
                                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div className="max-h-40 overflow-x-auto rounded border border-gray-300 bg-white p-2">
                                            <table className="w-full border-collapse">
                                                <tbody>
                                                    {tableData.map(
                                                        (
                                                            row,
                                                            rowIndex
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    rowIndex
                                                                }
                                                            >
                                                                {row.map(
                                                                    (
                                                                        cell,
                                                                        columnIndex
                                                                    ) => (
                                                                        <td
                                                                            key={
                                                                                columnIndex
                                                                            }
                                                                            className="border border-gray-200 p-1"
                                                                        >
                                                                            <input
                                                                                type="text"
                                                                                value={
                                                                                    cell
                                                                                }
                                                                                onChange={(
                                                                                    event
                                                                                ) =>
                                                                                    handleCellChange(
                                                                                        rowIndex,
                                                                                        columnIndex,
                                                                                        event
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                placeholder={
                                                                                    rowIndex ===
                                                                                    0
                                                                                        ? `En-tête ${
                                                                                              columnIndex +
                                                                                              1
                                                                                          }`
                                                                                        : "Cellule"
                                                                                }
                                                                                className="w-full bg-transparent px-1.5 py-1 text-xs outline-none"
                                                                            />
                                                                        </td>
                                                                    )
                                                                )}
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* ÉQUATION */}
                                {captionPrefix ===
                                    "Équation" && (
                                    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">

                                        <span className="text-xs font-bold text-gray-700">
                                            Éditeur d'équation scientifique
                                        </span>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-gray-700">
                                                Expression LaTeX
                                            </label>

                                            <input
                                                type="text"
                                                required
                                                value={
                                                    equationText
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setEquationText(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                placeholder="Ex. \int_{0}^{\infty} e^{-x^2} dx"
                                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                            />

                                            <p className="mt-1 text-[10px] text-gray-500">
                                                Exemple : \frac{"{"}a{"}"}{"{"}b{"}"} ou \sqrt{"{"}x{"}"} ou \sum_{"{"}i=1{"}"}^{"{"}n{"}"} x_i
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* FIGURE / ANNEXE */}
                                {(captionPrefix ===
                                    "Figure" ||
                                    captionPrefix ===
                                        "Annexe") && (
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                                            Texte de la légende
                                        </label>

                                        <input
                                            type="text"
                                            required
                                            value={
                                                simpleLegendText
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setSimpleLegendText(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder={
                                                captionPrefix ===
                                                "Figure"
                                                    ? "Ex. Architecture générale du système"
                                                    : "Ex. Cahier des charges technique"
                                            }
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                {/* ACTIONS */}
                                <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-3">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveModal(
                                                null
                                            )
                                        }
                                        className="rounded bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        type="submit"
                                        className="flex items-center gap-1.5 rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                        Insérer dans la page
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}

            {/* =================================================
                MODALE NUMÉROTATION
            ================================================= */}

            {activeModal === "numbering" &&
                createPortal(
                    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px]">
                        <div className="flex max-h-[90vh] w-[550px] max-w-[95vw] flex-col overflow-hidden rounded-xl border border-gray-300 bg-white shadow-2xl">

                            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
                                    <ListOrdered className="h-4 w-4 text-blue-600" />
                                    Numérotation automatique
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="max-h-[65vh] overflow-y-auto bg-slate-100 p-6">

                                <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">

                                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2 text-xs font-bold text-gray-500">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        <span>
                                            Éléments détectés
                                        </span>
                                    </div>

                                    {documentCaptions.map(
                                        (caption) => (
                                            <div
                                                key={
                                                    caption.id
                                                }
                                                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2.5"
                                            >
                                                <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                                                    {
                                                        caption.prefix
                                                    }
                                                </span>

                                                <span className="ml-3 flex-1 truncate text-xs italic text-gray-600">
                                                    {
                                                        caption.previewText
                                                    }
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(
                                            null
                                        )
                                    }
                                    className="rounded bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200"
                                >
                                    Annuler
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleConfirmNumbering
                                    }
                                    className="flex items-center gap-1.5 rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    Appliquer la numérotation
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* =================================================
                MODALE MISE À JOUR
            ================================================= */}

            {activeModal === "update" &&
                createPortal(
                    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px]">
                        <div className="flex max-h-[90vh] w-[580px] max-w-[95vw] flex-col overflow-hidden rounded-xl border border-gray-300 bg-white shadow-2xl">

                            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">

                                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
                                    <RefreshCw className="h-4 w-4 text-blue-600" />
                                    Gestionnaire des éléments
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="max-h-[65vh] overflow-y-auto bg-slate-100 p-6">

                                <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">

                                    <div className="mb-1 flex items-center gap-2 border-b border-gray-100 pb-2 text-xs font-bold text-gray-500">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        <span>
                                            Éléments actifs
                                        </span>
                                    </div>

                                    {documentCaptions.map(
                                        (caption, index) => (
                                            <div
                                                key={
                                                    caption.id
                                                }
                                                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2.5"
                                            >
                                                <div className="flex min-w-0 flex-1 items-center gap-2">

                                                    <span className="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                                                        {
                                                            caption.prefix
                                                        }
                                                    </span>

                                                    <span className="truncate text-xs italic text-gray-600">
                                                        {
                                                            caption.text
                                                        }
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteElement(
                                                            index
                                                        )
                                                    }
                                                    className="ml-2 shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                    title="Supprimer cet élément"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="rounded bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200"
                                >
                                    Fermer
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleConfirmUpdate
                                    }
                                    className="flex items-center gap-1.5 rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    Tout réindexer
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </RibbonGroup>
    );
}

export default CaptionsGroup;