/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : CitationGroup.jsx
 * Version : 5.0.0
 * Statut  : Professionnel - Gestion des citations scientifiques
 * ===========================================================
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    Quote,
    Plus,
    Search,
    X,
    Sparkles,
    BookOpen,
    Trash2,
    Upload,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

function CitationGroup({ editor }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");

    /* =========================================================
       FORMULAIRE
    ========================================================= */

    const [author, setAuthor] = useState("");
    const [year, setYear] = useState("");
    const [title, setTitle] = useState("");

    /* =========================================================
       RECHERCHE
    ========================================================= */

    const [searchTerm, setSearchTerm] = useState("");

    /* =========================================================
       IMPORT
    ========================================================= */

    const fileInputRef = useRef(null);

    /* =========================================================
       SOURCES DU DOCUMENT
       
       Important :
       On ne met plus de fausses références par défaut.
    ========================================================= */

    const [sourcesList, setSourcesList] = useState([]);

    /* =========================================================
       FERMETURE AVEC ÉCHAP
    ========================================================= */

    useEffect(() => {
        if (!isModalOpen) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsModalOpen(false);
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
    }, [isModalOpen]);

    /* =========================================================
       INSÉRER UNE CITATION
    ========================================================= */

    const insertCitationText = (sourceItem) => {
        if (!editor || !sourceItem) {
            return;
        }

        const authorText =
            sourceItem.author?.trim() ||
            "Auteur inconnu";

        const yearText =
            sourceItem.year?.trim() ||
            "s.d.";

        const citationString =
            `(${authorText}, ${yearText})`;

        /*
         * La citation est insérée comme un span identifié
         * afin de permettre à MACEVO de la reconnaître
         * ultérieurement.
         */
        const html = `
            <span
                class="macevo-citation"
                data-citation="true"
                data-source-id="${String(
                    sourceItem.id
                )}"
                data-author="${escapeAttribute(
                    authorText
                )}"
                data-year="${escapeAttribute(
                    yearText
                )}"
                data-title="${escapeAttribute(
                    sourceItem.title || ""
                )}"
                style="
                    color:#2563eb;
                    font-weight:500;
                    cursor:pointer;
                "
            >
                ${escapeHtml(citationString)}
            </span>&nbsp;
        `;

        editor
            .chain()
            .focus()
            .insertContent(html)
            .run();
    };

    /* =========================================================
       ÉCHAPPEMENT HTML
    ========================================================= */

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

    /* =========================================================
       ENREGISTRER UNE SOURCE
    ========================================================= */

    const handleSaveSource = (event) => {
        event.preventDefault();

        const cleanAuthor = author.trim();
        const cleanYear = year.trim();
        const cleanTitle = title.trim();

        if (
            !cleanAuthor ||
            !cleanYear ||
            !cleanTitle
        ) {
            return;
        }

        const newSource = {
            id: Date.now(),
            author: cleanAuthor,
            year: cleanYear,
            title: cleanTitle,
        };

        setSourcesList((previous) => [
            ...previous,
            newSource,
        ]);

        insertCitationText(newSource);

        setAuthor("");
        setYear("");
        setTitle("");
        setIsModalOpen(false);
    };

    /* =========================================================
       IMPORTATION DE FICHIER
       
       Cette fonction enregistre le fichier comme source
       documentaire à partir de son nom.

       Elle ne prétend pas analyser le contenu PDF/DOCX.
       L'analyse réelle pourra être branchée au backend
       ultérieurement.
    ========================================================= */

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const fileNameWithoutExtension =
            file.name
                .replace(/\.[^/.]+$/, "")
                .replace(/[-_]+/g, " ")
                .trim();

        const currentYear =
            new Date()
                .getFullYear()
                .toString();

        const newSource = {
            id: Date.now(),
            author: "Auteur inconnu",
            year: currentYear,
            title:
                fileNameWithoutExtension ||
                file.name,
            fileName: file.name,
            fileType: file.type || "unknown",
        };

        setSourcesList((previous) => [
            ...previous,
            newSource,
        ]);

        insertCitationText(newSource);

        setIsModalOpen(false);

        /*
         * Permet de réimporter immédiatement
         * le même fichier.
         */
        event.target.value = "";
    };

    /* =========================================================
       SUPPRESSION SOURCE
    ========================================================= */

    const handleDeleteSource = (id) => {
        setSourcesList((previous) =>
            previous.filter(
                (source) => source.id !== id
            )
        );
    };

    /* =========================================================
       OUVERTURE MODALE
    ========================================================= */

    const handleOpenModal = (mode) => {
        setModalMode(mode);
        setSearchTerm("");
        setIsModalOpen(true);
    };

    /* =========================================================
       SOURCES FILTRÉES
    ========================================================= */

    const normalizedSearch =
        searchTerm.trim().toLowerCase();

    const filteredSources =
        normalizedSearch === ""
            ? sourcesList
            : sourcesList.filter((source) => {
                  const searchableText = [
                      source.author,
                      source.year,
                      source.title,
                  ]
                      .filter(Boolean)
                      .join(" ")
                      .toLowerCase();

                  return searchableText.includes(
                      normalizedSearch
                  );
              });

    /* =========================================================
       RENDU
    ========================================================= */

    if (!editor) {
        return null;
    }

    return (
        <RibbonGroup
            title="Citations"
            className="w-[220px] min-w-[220px]"
        >
            {/* =================================================
                INPUT FICHIER
            ================================================= */}

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.bib,.ris"
                onChange={handleFileChange}
            />

            {/* =================================================
                CITATION RAPIDE
            ================================================= */}

            <RibbonButton
                icon={Quote}
                label="Citation"
                tooltip={
                    sourcesList.length > 0
                        ? "Insérer la dernière source utilisée"
                        : "Ajouter une source avant d'insérer une citation"
                }
                onClick={() => {
                    if (sourcesList.length > 0) {
                        insertCitationText(
                            sourcesList[
                                sourcesList.length - 1
                            ]
                        );
                    } else {
                        handleOpenModal("add");
                    }
                }}
            />

            {/* =================================================
                NOUVELLE SOURCE
            ================================================= */}

            <RibbonButton
                icon={Plus}
                label="Nouvelle source"
                tooltip="Ajouter manuellement une source bibliographique"
                onClick={() =>
                    handleOpenModal("add")
                }
            />

            {/* =================================================
                GESTIONNAIRE
            ================================================= */}

            <RibbonButton
                icon={Search}
                label="Gérer"
                tooltip="Rechercher, insérer ou supprimer les sources"
                onClick={() =>
                    handleOpenModal("manage")
                }
            />

            {/* =================================================
                MODALE
            ================================================= */}

            {isModalOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
                        role="presentation"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setIsModalOpen(false);
                            }
                        }}
                    >
                        <div
                            className="flex max-h-[90vh] w-[520px] max-w-[95vw] flex-col overflow-hidden rounded-xl border border-gray-300 bg-white shadow-2xl"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="citation-dialog-title"
                        >
                            {/* =================================
                                HEADER
                            ================================= */}

                            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
                                <h3
                                    id="citation-dialog-title"
                                    className="flex items-center gap-2 text-sm font-bold text-gray-800"
                                >
                                    <Sparkles className="h-4 w-4 text-blue-600" />

                                    {modalMode ===
                                    "add"
                                        ? "Ajouter une source bibliographique"
                                        : "Gestionnaire des sources bibliographiques"}
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsModalOpen(
                                            false
                                        )
                                    }
                                    className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                                    title="Fermer"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* =================================
                                MODE AJOUT
                            ================================= */}

                            {modalMode ===
                            "add" ? (
                                <form
                                    onSubmit={
                                        handleSaveSource
                                    }
                                    className="flex flex-col gap-4 overflow-y-auto p-6"
                                >
                                    {/* AUTEUR */}

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                                            Auteur(s)
                                        </label>

                                        <input
                                            type="text"
                                            required
                                            value={
                                                author
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setAuthor(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="Ex. Dupont, J."
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* ANNÉE */}

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                                            Année de publication
                                        </label>

                                        <input
                                            type="text"
                                            required
                                            value={
                                                year
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setYear(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="Ex. 2026"
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* TITRE */}

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                                            Titre de l'ouvrage / article
                                        </label>

                                        <input
                                            type="text"
                                            required
                                            value={
                                                title
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setTitle(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="Titre complet de la référence"
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* INFO */}

                                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                                        <p className="text-[11px] leading-relaxed text-blue-700">
                                            La source sera enregistrée
                                            dans la session actuelle
                                            de l'éditeur et une citation
                                            auteur-date sera insérée à
                                            la position du curseur.
                                        </p>
                                    </div>

                                    {/* ACTIONS */}

                                    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className="flex items-center gap-1.5 rounded bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            Importer un fichier
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsModalOpen(
                                                        false
                                                    )
                                                }
                                                className="rounded bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                                            >
                                                Annuler
                                            </button>

                                            <button
                                                type="submit"
                                                className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                            >
                                                Enregistrer et insérer
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                /* =================================
                                   MODE GESTION
                                ================================= */

                                <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-6">
                                    {/* BARRE OUTILS */}

                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />

                                            <input
                                                type="text"
                                                value={
                                                    searchTerm
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setSearchTerm(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                placeholder="Rechercher une source..."
                                                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-8 pr-3 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className="flex shrink-0 items-center gap-1.5 rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            Importer
                                        </button>
                                    </div>

                                    {/* DESCRIPTION */}

                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                        <p className="text-[11px] leading-relaxed text-gray-500">
                                            Sélectionnez une source
                                            pour insérer sa citation
                                            dans le document. Les
                                            sources peuvent également
                                            être supprimées de la
                                            session actuelle.
                                        </p>
                                    </div>

                                    {/* LISTE */}

                                    {sourcesList.length ===
                                    0 ? (
                                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-10 text-center">
                                            <BookOpen className="mb-2 h-8 w-8 text-gray-300" />

                                            <p className="text-xs font-medium text-gray-500">
                                                Aucune source
                                                bibliographique
                                            </p>

                                            <p className="mt-1 max-w-[300px] text-[11px] text-gray-400">
                                                Ajoutez votre première
                                                référence manuellement
                                                ou importez un fichier.
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setModalMode(
                                                        "add"
                                                    )
                                                }
                                                className="mt-4 flex items-center gap-1.5 rounded bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Ajouter une source
                                            </button>
                                        </div>
                                    ) : filteredSources.length ===
                                      0 ? (
                                        <div className="py-8 text-center text-xs italic text-gray-400">
                                            Aucune source ne
                                            correspond à votre
                                            recherche.
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {filteredSources.map(
                                                (
                                                    source
                                                ) => (
                                                    <div
                                                        key={
                                                            source.id
                                                        }
                                                        className="group flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
                                                    >
                                                        <div className="flex min-w-0 items-start gap-2.5">
                                                            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                                                            <div className="flex min-w-0 flex-col">
                                                                <span className="truncate text-xs font-bold text-gray-800">
                                                                    {
                                                                        source.title
                                                                    }
                                                                </span>

                                                                <span className="mt-0.5 text-[11px] text-gray-500">
                                                                    {
                                                                        source.author
                                                                    }{" "}
                                                                    (
                                                                    {
                                                                        source.year
                                                                    }
                                                                    )
                                                                </span>

                                                                {source.fileName && (
                                                                    <span className="mt-0.5 truncate text-[10px] text-gray-400">
                                                                        Fichier :{" "}
                                                                        {
                                                                            source.fileName
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="ml-3 flex shrink-0 items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    insertCitationText(
                                                                        source
                                                                    );

                                                                    setIsModalOpen(
                                                                        false
                                                                    );
                                                                }}
                                                                className="rounded bg-blue-600 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-blue-700"
                                                            >
                                                                Insérer
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDeleteSource(
                                                                        source.id
                                                                    )
                                                                }
                                                                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                                title="Supprimer la source"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* FOOTER */}

                                    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setModalMode(
                                                    "add"
                                                )
                                            }
                                            className="flex items-center gap-1 rounded bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Ajouter manuellement
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsModalOpen(
                                                    false
                                                )
                                            }
                                            className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
        </RibbonGroup>
    );
}

export default CitationGroup;