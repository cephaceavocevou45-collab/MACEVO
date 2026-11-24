/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : BibliographyGroup.jsx
 * Version : 6.0.0
 * Statut  : Professionnel / Fonctionnel
 *
 * Description :
 * Gestion de la bibliographie scientifique :
 * - insertion d'une bibliographie
 * - ajout de références
 * - import de fichier
 * - gestion des références
 * - suppression
 * - réindexation
 * - interface modale via Portal
 * ===========================================================
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
    BookOpen,
    Plus,
    RefreshCw,
    X,
    Sparkles,
    Upload,
    Trash2,
    Check,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

/* ===========================================================
   CONSTANTES
=========================================================== */

const DEFAULT_REFERENCES = [
    "Dupont, J. <em>Introduction aux architectures logicielles</em>. Éditions MACEVO, 2026.",
    "Martin, S. <em>Les standards des éditeurs de texte web</em>. Tech Press, 2024.",
];

/* ===========================================================
   OUTILS
=========================================================== */

/**
 * Échappe le HTML pour les textes provenant d'une source
 * non HTML.
 */
function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Nettoie une référence avant insertion.
 *
 * On autorise quelques balises de mise en forme simples
 * utiles à la bibliographie scientifique.
 */
function sanitizeReferenceHtml(value) {
    if (!value) {
        return "";
    }

    return String(value)
        .replace(
            /<(?!\/?(?:em|i|strong|b|u|sup|sub)\b)[^>]*>/gi,
            ""
        )
        .trim();
}

/**
 * Supprime le numéro [1], [2], etc. situé au début
 * d'une référence.
 */
function removeReferenceNumber(html) {
    if (!html) {
        return "";
    }

    return String(html)
        .replace(
            /^\s*\[\s*\d+\s*\]\s*/,
            ""
        )
        .trim();
}

/**
 * Génère le HTML complet de la bibliographie.
 */
function generateBibliographyHtml(references) {
    const safeReferences = Array.isArray(references)
        ? references.filter(
              (reference) =>
                  String(reference ?? "").trim() !== ""
          )
        : [];

    const itemsHtml = safeReferences
        .map((reference, index) => {
            const cleanReference =
                sanitizeReferenceHtml(reference);

            return `
                <p
                    class="macevo-biblio-item"
                    data-biblio-index="${index + 1}"
                    style="
                        font-size: 12px;
                        color: #374151;
                        margin-bottom: 8px;
                        padding-left: 24px;
                        text-indent: -24px;
                    "
                >
                    [${index + 1}] ${cleanReference}
                </p>
            `;
        })
        .join("");

    return `
        <div
            class="macevo-bibliography"
            data-macevo-bibliography="true"
            style="
                border: 1px solid #e5e7eb;
                padding: 20px;
                border-radius: 8px;
                background-color: #f9fafb;
                margin: 20px 0;
            "
        >
            <h2
                style="
                    font-size: 1.25rem;
                    font-weight: bold;
                    margin-bottom: 12px;
                    color: #1f2937;
                    border-bottom: 2px solid #3b82f6;
                    padding-bottom: 6px;
                "
            >
                Bibliographie
            </h2>

            <div class="macevo-biblio-list">
                ${itemsHtml}
            </div>
        </div>

        <p><br /></p>
    `;
}

/**
 * Recherche le conteneur de bibliographie dans
 * le DOM de l'éditeur.
 */
function findBibliographyContainer(editor) {
    if (!editor?.view?.dom) {
        return null;
    }

    return (
        editor.view.dom.querySelector(
            ".macevo-bibliography"
        ) ||
        editor.view.dom.querySelector(
            '[data-macevo-bibliography="true"]'
        )
    );
}

/* ===========================================================
   COMPOSANT
=========================================================== */

function BibliographyGroup({ editor }) {
    /* ========================================================
       ÉTATS
    ======================================================== */

    const [activeModal, setActiveModal] =
        useState(null);

    const [referenceText, setReferenceText] =
        useState("");

    const [defaultRefs, setDefaultRefs] =
        useState(DEFAULT_REFERENCES);

    const [newDefaultRefText, setNewDefaultRefText] =
        useState("");

    const [currentBiblioItems, setCurrentBiblioItems] =
        useState([]);

    const [feedbackMessage, setFeedbackMessage] =
        useState("");

    const [feedbackType, setFeedbackType] =
        useState("info");

    const fileInputRef = useRef(null);

    /* ========================================================
       FERMETURE AVEC ÉCHAP
    ======================================================== */

    useEffect(() => {
        if (!activeModal) {
            return;
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

    /* ========================================================
       FEEDBACK
    ======================================================== */

    function showFeedback(message, type = "info") {
        setFeedbackMessage(message);
        setFeedbackType(type);
        setActiveModal("feedback");
    }

    /* ========================================================
       VÉRIFICATION ÉDITEUR
    ======================================================== */

    function ensureEditor() {
        if (!editor) {
            showFeedback(
                "L'éditeur MACEVO n'est pas disponible.",
                "error"
            );

            return false;
        }

        return true;
    }

    /* ========================================================
       1. INSERTION INITIALE
    ======================================================== */

    function handleConfirmInsert(event) {
        event.preventDefault();

        if (!ensureEditor()) {
            return;
        }

        const references = defaultRefs.filter(
            (reference) =>
                String(reference ?? "").trim() !== ""
        );

        if (references.length === 0) {
            showFeedback(
                "Aucune référence n'est disponible pour créer la bibliographie.",
                "error"
            );

            return;
        }

        try {
            editor
                .chain()
                .focus()
                .insertContent(
                    generateBibliographyHtml(
                        references
                    )
                )
                .run();

            setActiveModal(null);

            showFeedback(
                "La bibliographie a été insérée dans le document.",
                "success"
            );
        } catch (error) {
            console.error(
                "Erreur lors de l'insertion de la bibliographie :",
                error
            );

            showFeedback(
                "Impossible d'insérer la bibliographie.",
                "error"
            );
        }
    }

    /* ========================================================
       2. AJOUT D'UNE RÉFÉRENCE
    ======================================================== */

    function handleSaveReference(event) {
        event.preventDefault();

        if (!ensureEditor()) {
            return;
        }

        const cleanReference =
            referenceText.trim();

        if (!cleanReference) {
            return;
        }

        appendReferenceToEditor(
            sanitizeReferenceHtml(
                cleanReference
            )
        );

        setReferenceText("");
        setActiveModal(null);
    }

    /* ========================================================
       AJOUT DANS L'ÉDITEUR
    ======================================================== */

    function appendReferenceToEditor(
        cleanReference
    ) {
        if (!editor) {
            return;
        }

        const reference =
            sanitizeReferenceHtml(
                cleanReference
            );

        if (!reference) {
            return;
        }

        const bibliography =
            findBibliographyContainer(
                editor
            );

        /* ----------------------------------------------------
           Aucune bibliographie existante
        ---------------------------------------------------- */

        if (!bibliography) {
            editor
                .chain()
                .focus()
                .insertContent(
                    generateBibliographyHtml([
                        reference,
                    ])
                )
                .run();

            showFeedback(
                "La référence a été ajoutée à une nouvelle bibliographie.",
                "success"
            );

            return;
        }

        /* ----------------------------------------------------
           Bibliographie existante
        ---------------------------------------------------- */

        const list =
            bibliography.querySelector(
                ".macevo-biblio-list"
            );

        if (!list) {
            console.warn(
                "MACEVO : liste bibliographique introuvable."
            );

            return;
        }

        const existingItems =
            list.querySelectorAll(
                ".macevo-biblio-item"
            );

        const nextIndex =
            existingItems.length + 1;

        const newParagraph =
            document.createElement("p");

        newParagraph.className =
            "macevo-biblio-item";

        newParagraph.setAttribute(
            "data-biblio-index",
            String(nextIndex)
        );

        newParagraph.style.cssText = `
            font-size: 12px;
            color: #374151;
            margin-bottom: 8px;
            padding-left: 24px;
            text-indent: -24px;
        `;

        newParagraph.innerHTML =
            `[${nextIndex}] ${reference}`;

        list.appendChild(newParagraph);

        /*
         * Synchronisation avec Tiptap.
         *
         * On réinjecte le HTML de l'éditeur afin que
         * ProseMirror connaisse la modification.
         */
        try {
            editor.commands.setContent(
                editor.view.dom.innerHTML
            );

            showFeedback(
                "La référence a été ajoutée à la bibliographie.",
                "success"
            );
        } catch (error) {
            console.error(
                "Erreur lors de la synchronisation de la bibliographie :",
                error
            );
        }
    }

    /* ========================================================
       3. IMPORT DE FICHIER
    ======================================================== */

    function handleFileChange(event) {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const fileName =
                file.name
                    .replace(
                        /\.[^/.]+$/,
                        ""
                    )
                    .replace(/[-_]+/g, " ")
                    .trim();

            const formattedReference = `
                Auteur inconnu.
                <em>${escapeHtml(
                    fileName
                )}</em>.
                Document importé,
                ${new Date().getFullYear()}.
            `;

            appendReferenceToEditor(
                formattedReference
            );

            setActiveModal(null);
        } catch (error) {
            console.error(
                "Erreur lors de l'import du fichier :",
                error
            );

            showFeedback(
                "Impossible d'importer ce fichier.",
                "error"
            );
        } finally {
            /*
             * Permet de sélectionner à nouveau le même
             * fichier ultérieurement.
             */
            event.target.value = "";
        }
    }

    /* ========================================================
       4. OUVRIR LE GESTIONNAIRE
    ======================================================== */

    function openUpdateModal() {
        if (!ensureEditor()) {
            return;
        }

        const bibliography =
            findBibliographyContainer(
                editor
            );

        if (!bibliography) {
            showFeedback(
                "Aucune bibliographie active n'a été trouvée dans le document.",
                "error"
            );

            return;
        }

        const items =
            bibliography.querySelectorAll(
                ".macevo-biblio-item"
            );

        const extracted =
            Array.from(items).map(
                (item, index) => {
                    const originalHtml =
                        item.innerHTML || "";

                    const cleanText =
                        removeReferenceNumber(
                            originalHtml
                        );

                    return {
                        id: index,
                        html: originalHtml,
                        cleanText,
                    };
                }
            );

        if (extracted.length === 0) {
            showFeedback(
                "La bibliographie ne contient actuellement aucune référence.",
                "error"
            );

            return;
        }

        setCurrentBiblioItems(
            extracted
        );

        setActiveModal("update");
    }

    /* ========================================================
       5. RÉINDEXATION
    ======================================================== */

    function handleConfirmUpdate() {
        if (!ensureEditor()) {
            return;
        }

        const bibliography =
            findBibliographyContainer(
                editor
            );

        if (!bibliography) {
            showFeedback(
                "La bibliographie n'existe plus dans le document.",
                "error"
            );

            setActiveModal(null);

            return;
        }

        const items =
            bibliography.querySelectorAll(
                ".macevo-biblio-item"
            );

        items.forEach(
            (item, index) => {
                const cleanText =
                    removeReferenceNumber(
                        item.innerHTML
                    );

                const newIndex =
                    index + 1;

                item.setAttribute(
                    "data-biblio-index",
                    String(newIndex)
                );

                item.innerHTML =
                    `[${newIndex}] ${cleanText}`;
            }
        );

        try {
            editor.commands.setContent(
                editor.view.dom.innerHTML
            );

            const updatedItems =
                Array.from(
                    items
                ).map(
                    (item, index) => ({
                        id: index,
                        html: item.innerHTML,
                        cleanText:
                            removeReferenceNumber(
                                item.innerHTML
                            ),
                    })
                );

            setCurrentBiblioItems(
                updatedItems
            );

            setActiveModal(null);

            showFeedback(
                "La bibliographie a été réindexée avec succès.",
                "success"
            );
        } catch (error) {
            console.error(
                "Erreur lors de la réindexation :",
                error
            );

            showFeedback(
                "Une erreur est survenue pendant la réindexation.",
                "error"
            );
        }
    }

    /* ========================================================
       6. SUPPRESSION D'UNE RÉFÉRENCE
    ======================================================== */

    function handleDeleteItemFromUpdateModal(
        indexToDelete
    ) {
        if (!ensureEditor()) {
            return;
        }

        const bibliography =
            findBibliographyContainer(
                editor
            );

        if (!bibliography) {
            return;
        }

        const items =
            bibliography.querySelectorAll(
                ".macevo-biblio-item"
            );

        const target =
            items[indexToDelete];

        if (!target) {
            return;
        }

        target.remove();

        const remainingItems =
            bibliography.querySelectorAll(
                ".macevo-biblio-item"
            );

        const updatedExtracted = [];

        remainingItems.forEach(
            (item, index) => {
                const newIndex =
                    index + 1;

                const cleanText =
                    removeReferenceNumber(
                        item.innerHTML
                    );

                item.setAttribute(
                    "data-biblio-index",
                    String(newIndex)
                );

                item.innerHTML =
                    `[${newIndex}] ${cleanText}`;

                updatedExtracted.push({
                    id: index,
                    html: item.innerHTML,
                    cleanText,
                });
            }
        );

        try {
            editor.commands.setContent(
                editor.view.dom.innerHTML
            );
        } catch (error) {
            console.error(
                "Erreur lors de la synchronisation après suppression :",
                error
            );
        }

        setCurrentBiblioItems(
            updatedExtracted
        );

        if (
            updatedExtracted.length === 0
        ) {
            setActiveModal(null);

            showFeedback(
                "La dernière référence a été supprimée. La bibliographie est maintenant vide.",
                "success"
            );

            return;
        }
    }

    /* ========================================================
       7. SUPPRIMER UNE RÉFÉRENCE INITIALE
    ======================================================== */

    function removeDefaultReference(
        index
    ) {
        setDefaultRefs(
            (previous) =>
                previous.filter(
                    (_, itemIndex) =>
                        itemIndex !== index
                )
        );
    }

    /* ========================================================
       8. AJOUTER UNE RÉFÉRENCE INITIALE
    ======================================================== */

    function addDefaultReference() {
        const reference =
            newDefaultRefText.trim();

        if (!reference) {
            return;
        }

        setDefaultRefs(
            (previous) => [
                ...previous,
                sanitizeReferenceHtml(
                    reference
                ),
            ]
        );

        setNewDefaultRefText("");
    }

    /* ========================================================
       9. RENDU
    ======================================================== */

    if (!editor) {
        return null;
    }

    return (
        <>
            {/* ==================================================
               GROUPE BIBLIOGRAPHIE
            ================================================== */}

            <RibbonGroup
                title="Bibliographie"
                className="w-[210px] min-w-[210px]"
            >
                {/* ------------------------------------------------
                   INPUT FICHIER CACHÉ
                ------------------------------------------------ */}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.bib,.ris"
                    onChange={
                        handleFileChange
                    }
                    className="hidden"
                />

                {/* ------------------------------------------------
                   INSÉRER
                ------------------------------------------------ */}

                <RibbonButton
                    icon={BookOpen}
                    label="Bibliographie"
                    tooltip="Insérer une section bibliographique scientifique"
                    onClick={() =>
                        setActiveModal(
                            "insert"
                        )
                    }
                />

                {/* ------------------------------------------------
                   AJOUTER
                ------------------------------------------------ */}

                <RibbonButton
                    icon={Plus}
                    label="Ajouter"
                    tooltip="Ajouter une référence bibliographique"
                    onClick={() =>
                        setActiveModal(
                            "add"
                        )
                    }
                />

                {/* ------------------------------------------------
                   METTRE À JOUR
                ------------------------------------------------ */}

                <RibbonButton
                    icon={RefreshCw}
                    label="Mettre à jour"
                    tooltip="Gérer et réindexer les références"
                    onClick={
                        openUpdateModal
                    }
                />
            </RibbonGroup>

            {/* ==================================================
               MODALE : INSERTION
            ================================================== */}

            {activeModal ===
                "insert" &&
                createPortal(
                    <div
                        className="
                            fixed inset-0
                            z-[999999]
                            flex items-center justify-center
                            bg-black/60
                            backdrop-blur-[3px]
                            p-4
                        "
                    >
                        <div
                            className="
                                bg-white
                                rounded-xl
                                shadow-2xl
                                border border-gray-300
                                w-[520px]
                                max-w-[95vw]
                                max-h-[90vh]
                                overflow-hidden
                                flex flex-col
                            "
                        >
                            {/* HEADER */}

                            <div
                                className="
                                    flex items-center justify-between
                                    px-6 py-4
                                    border-b border-gray-200
                                    bg-gray-50
                                "
                            >
                                <h3
                                    className="
                                        text-sm
                                        font-bold
                                        text-gray-800
                                        flex items-center gap-2
                                    "
                                >
                                    <Sparkles className="w-4 h-4 text-blue-600" />

                                    Insérer la bibliographie
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(
                                            null
                                        )
                                    }
                                    className="
                                        text-gray-400
                                        hover:text-gray-700
                                        p-1
                                        rounded
                                        transition-colors
                                    "
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* CONTENU */}

                            <form
                                onSubmit={
                                    handleConfirmInsert
                                }
                                className="
                                    p-6
                                    flex flex-col
                                    gap-4
                                    overflow-y-auto
                                "
                            >
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Cette action insère une
                                    section bibliographique
                                    structurée dans votre
                                    document scientifique.
                                </p>

                                {/* LISTE */}

                                <div
                                    className="
                                        flex flex-col
                                        gap-2
                                        max-h-[35vh]
                                        overflow-y-auto
                                        bg-gray-50
                                        p-3
                                        rounded-lg
                                        border border-gray-200
                                    "
                                >
                                    {defaultRefs.length ===
                                    0 ? (
                                        <div
                                            className="
                                                py-6
                                                text-center
                                                text-xs
                                                text-gray-400
                                                italic
                                            "
                                        >
                                            Aucune référence
                                            initiale.
                                        </div>
                                    ) : (
                                        defaultRefs.map(
                                            (
                                                reference,
                                                index
                                            ) => (
                                                <div
                                                    key={
                                                        index
                                                    }
                                                    className="
                                                        flex
                                                        items-start
                                                        justify-between
                                                        gap-2
                                                        text-xs
                                                        text-gray-700
                                                        bg-white
                                                        p-2.5
                                                        rounded
                                                        border border-gray-200
                                                    "
                                                >
                                                    <div className="flex-1 leading-relaxed">
                                                        <strong>
                                                            [
                                                            {index +
                                                                1}
                                                            ]
                                                        </strong>{" "}
                                                        <span
                                                            dangerouslySetInnerHTML={{
                                                                __html:
                                                                    sanitizeReferenceHtml(
                                                                        reference
                                                                    ),
                                                            }}
                                                        />
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeDefaultReference(
                                                                index
                                                            )
                                                        }
                                                        className="
                                                            text-gray-400
                                                            hover:text-red-600
                                                            p-1
                                                            rounded
                                                            shrink-0
                                                        "
                                                        title="Supprimer cette référence"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )
                                        )
                                    )}
                                </div>

                                {/* AJOUT RÉFÉRENCE */}

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={
                                            newDefaultRefText
                                        }
                                        onChange={(event) =>
                                            setNewDefaultRefText(
                                                event.target
                                                    .value
                                            )
                                        }
                                        placeholder="Ajouter une référence initiale..."
                                        className="
                                            flex-1
                                            px-3 py-2
                                            text-xs
                                            border border-gray-300
                                            rounded-md
                                            bg-white
                                            text-gray-800
                                            outline-none
                                            focus:ring-2
                                            focus:ring-blue-500
                                        "
                                    />

                                    <button
                                        type="button"
                                        onClick={
                                            addDefaultReference
                                        }
                                        className="
                                            px-3 py-2
                                            bg-gray-100
                                            hover:bg-gray-200
                                            text-gray-700
                                            text-xs
                                            font-medium
                                            rounded
                                            shrink-0
                                        "
                                    >
                                        Ajouter
                                    </button>
                                </div>

                                {/* ACTIONS */}

                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-end
                                        gap-2
                                        pt-3
                                        border-t border-gray-200
                                    "
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveModal(
                                                null
                                            )
                                        }
                                        className="
                                            px-3 py-2
                                            text-xs
                                            font-medium
                                            text-gray-600
                                            bg-gray-100
                                            hover:bg-gray-200
                                            rounded
                                        "
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        type="submit"
                                        className="
                                            px-4 py-2
                                            text-xs
                                            font-medium
                                            text-white
                                            bg-blue-600
                                            hover:bg-blue-700
                                            rounded
                                            shadow-sm
                                            transition-colors
                                            flex items-center gap-1.5
                                        "
                                    >
                                        <Check className="w-3.5 h-3.5" />

                                        Insérer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}

            {/* ==================================================
               MODALE : AJOUTER
            ================================================== */}

            {activeModal ===
                "add" &&
                createPortal(
                    <div
                        className="
                            fixed inset-0
                            z-[999999]
                            flex items-center justify-center
                            bg-black/60
                            backdrop-blur-[3px]
                            p-4
                        "
                    >
                        <div
                            className="
                                bg-white
                                rounded-xl
                                shadow-2xl
                                border border-gray-300
                                w-[500px]
                                max-w-[95vw]
                                overflow-hidden
                                flex flex-col
                            "
                        >
                            {/* HEADER */}

                            <div
                                className="
                                    flex items-center justify-between
                                    px-6 py-4
                                    border-b border-gray-200
                                    bg-gray-50
                                "
                            >
                                <h3
                                    className="
                                        text-sm
                                        font-bold
                                        text-gray-800
                                        flex items-center gap-2
                                    "
                                >
                                    <Plus className="w-4 h-4 text-blue-600" />

                                    Ajouter une référence
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(
                                            null
                                        )
                                    }
                                    className="
                                        text-gray-400
                                        hover:text-gray-700
                                        p-1
                                        rounded
                                    "
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* FORM */}

                            <form
                                onSubmit={
                                    handleSaveReference
                                }
                                className="
                                    p-6
                                    flex flex-col
                                    gap-4
                                "
                            >
                                <div>
                                    <label
                                        htmlFor="macevo-reference-text"
                                        className="
                                            block
                                            text-xs
                                            font-semibold
                                            text-gray-700
                                            mb-1.5
                                        "
                                    >
                                        Référence
                                        bibliographique
                                    </label>

                                    <textarea
                                        id="macevo-reference-text"
                                        rows={4}
                                        required
                                        value={
                                            referenceText
                                        }
                                        onChange={(event) =>
                                            setReferenceText(
                                                event.target
                                                    .value
                                            )
                                        }
                                        placeholder="Ex. Nom, P. (2026). Titre de l'ouvrage. Éditeur."
                                        className="
                                            w-full
                                            px-3 py-2
                                            text-xs
                                            border border-gray-300
                                            rounded-md
                                            bg-white
                                            text-gray-800
                                            outline-none
                                            resize-none
                                            focus:ring-2
                                            focus:ring-blue-500
                                        "
                                    />

                                    <p className="mt-1.5 text-[10px] text-gray-400">
                                        Les balises simples
                                        &lt;em&gt;,
                                        &lt;strong&gt;,
                                        &lt;u&gt;,
                                        &lt;sup&gt; et
                                        &lt;sub&gt; sont
                                        acceptées.
                                    </p>
                                </div>

                                {/* ACTIONS */}

                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        gap-3
                                        pt-3
                                        border-t border-gray-200
                                    "
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="
                                            px-3 py-2
                                            text-xs
                                            font-medium
                                            text-blue-700
                                            bg-blue-50
                                            hover:bg-blue-100
                                            rounded
                                            flex
                                            items-center
                                            gap-1.5
                                        "
                                    >
                                        <Upload className="w-3.5 h-3.5" />

                                        Importer
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveModal(
                                                    null
                                                )
                                            }
                                            className="
                                                px-3 py-2
                                                text-xs
                                                font-medium
                                                text-gray-600
                                                bg-gray-100
                                                hover:bg-gray-200
                                                rounded
                                            "
                                        >
                                            Annuler
                                        </button>

                                        <button
                                            type="submit"
                                            className="
                                                px-4 py-2
                                                text-xs
                                                font-medium
                                                text-white
                                                bg-blue-600
                                                hover:bg-blue-700
                                                rounded
                                                shadow-sm
                                            "
                                        >
                                            Ajouter
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}

            {/* ==================================================
               MODALE : GESTION
            ================================================== */}

            {activeModal ===
                "update" &&
                createPortal(
                    <div
                        className="
                            fixed inset-0
                            z-[999999]
                            flex items-center justify-center
                            bg-black/60
                            backdrop-blur-[3px]
                            p-4
                        "
                    >
                        <div
                            className="
                                bg-white
                                rounded-xl
                                shadow-2xl
                                border border-gray-300
                                w-[560px]
                                max-w-[95vw]
                                max-h-[90vh]
                                overflow-hidden
                                flex flex-col
                            "
                        >
                            {/* HEADER */}

                            <div
                                className="
                                    flex items-center justify-between
                                    px-6 py-4
                                    border-b border-gray-200
                                    bg-gray-50
                                "
                            >
                                <h3
                                    className="
                                        text-sm
                                        font-bold
                                        text-gray-800
                                        flex items-center gap-2
                                    "
                                >
                                    <RefreshCw className="w-4 h-4 text-blue-600" />

                                    Gestion de la
                                    bibliographie
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(
                                            null
                                        )
                                    }
                                    className="
                                        text-gray-400
                                        hover:text-gray-700
                                        p-1
                                        rounded
                                    "
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* CONTENU */}

                            <div
                                className="
                                    p-6
                                    flex flex-col
                                    gap-4
                                    overflow-y-auto
                                "
                            >
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Gérez les références
                                    présentes dans votre
                                    bibliographie. La
                                    numérotation sera
                                    automatiquement
                                    réorganisée.
                                </p>

                                <div className="flex flex-col gap-2">
                                    {currentBiblioItems.map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                className="
                                                    flex
                                                    items-center
                                                    justify-between
                                                    gap-3
                                                    p-3
                                                    bg-gray-50
                                                    border border-gray-200
                                                    rounded-lg
                                                "
                                            >
                                                <div
                                                    className="
                                                        flex
                                                        items-start
                                                        gap-2
                                                        min-w-0
                                                    "
                                                >
                                                    <span
                                                        className="
                                                            font-bold
                                                            text-blue-600
                                                            text-xs
                                                            shrink-0
                                                        "
                                                    >
                                                        [
                                                        {index +
                                                            1}
                                                        ]
                                                    </span>

                                                    <span
                                                        className="
                                                            text-xs
                                                            text-gray-800
                                                            leading-relaxed
                                                            break-words
                                                        "
                                                        dangerouslySetInnerHTML={{
                                                            __html:
                                                                sanitizeReferenceHtml(
                                                                    item.cleanText
                                                                ),
                                                        }}
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteItemFromUpdateModal(
                                                            index
                                                        )
                                                    }
                                                    className="
                                                        p-1.5
                                                        text-gray-400
                                                        hover:text-red-600
                                                        rounded
                                                        shrink-0
                                                    "
                                                    title="Supprimer cette référence"
                                                    aria-label={`Supprimer la référence ${index + 1}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* FOOTER */}

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    px-6 py-4
                                    border-t border-gray-200
                                    bg-gray-50
                                "
                            >
                                <span className="text-[10px] text-gray-400">
                                    {
                                        currentBiblioItems.length
                                    }{" "}
                                    référence(s)
                                </span>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveModal(
                                                null
                                            )
                                        }
                                        className="
                                            px-3 py-2
                                            text-xs
                                            font-medium
                                            text-gray-600
                                            bg-gray-100
                                            hover:bg-gray-200
                                            rounded
                                        "
                                    >
                                        Fermer
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleConfirmUpdate
                                        }
                                        className="
                                            px-4 py-2
                                            text-xs
                                            font-medium
                                            text-white
                                            bg-blue-600
                                            hover:bg-blue-700
                                            rounded
                                            shadow-sm
                                            flex
                                            items-center
                                            gap-1.5
                                        "
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />

                                        Réindexer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* ==================================================
               MODALE : FEEDBACK
            ================================================== */}

            {activeModal ===
                "feedback" &&
                createPortal(
                    <div
                        className="
                            fixed inset-0
                            z-[999999]
                            flex items-center justify-center
                            bg-black/60
                            backdrop-blur-[3px]
                            p-4
                        "
                    >
                        <div
                            className="
                                bg-white
                                rounded-xl
                                shadow-2xl
                                border border-gray-300
                                w-[420px]
                                max-w-[95vw]
                                overflow-hidden
                            "
                        >
                            <div
                                className="
                                    flex items-center justify-between
                                    px-6 py-4
                                    border-b border-gray-200
                                    bg-gray-50
                                "
                            >
                                <h3
                                    className="
                                        text-sm
                                        font-bold
                                        text-gray-800
                                        flex items-center gap-2
                                    "
                                >
                                    <AlertCircle
                                        className={`w-4 h-4 ${
                                            feedbackType ===
                                            "error"
                                                ? "text-red-600"
                                                : feedbackType ===
                                                    "success"
                                                  ? "text-green-600"
                                                  : "text-blue-600"
                                        }`}
                                    />

                                    Bibliographie
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(
                                            null
                                        )
                                    }
                                    className="
                                        text-gray-400
                                        hover:text-gray-700
                                        p-1
                                    "
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div
                                className="
                                    p-6
                                    flex
                                    flex-col
                                    items-center
                                    text-center
                                    gap-3
                                "
                            >
                                <div
                                    className={`
                                        w-11 h-11
                                        rounded-full
                                        flex
                                        items-center
                                        justify-center
                                        ${
                                            feedbackType ===
                                            "error"
                                                ? "bg-red-50 text-red-600"
                                                : feedbackType ===
                                                    "success"
                                                  ? "bg-green-50 text-green-600"
                                                  : "bg-blue-50 text-blue-600"
                                        }
                                    `}
                                >
                                    {feedbackType ===
                                    "success" ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5" />
                                    )}
                                </div>

                                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                                    {
                                        feedbackMessage
                                    }
                                </p>
                            </div>

                            <div
                                className="
                                    flex
                                    justify-end
                                    px-6 py-4
                                    border-t border-gray-200
                                    bg-gray-50
                                "
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(
                                            null
                                        )
                                    }
                                    className="
                                        px-4 py-2
                                        text-xs
                                        font-medium
                                        text-white
                                        bg-blue-600
                                        hover:bg-blue-700
                                        rounded
                                    "
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}

export default BibliographyGroup;