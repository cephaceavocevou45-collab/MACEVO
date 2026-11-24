/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : LinksGroup.jsx
 * Version : 3.0.0
 * Statut  : Liens scientifiques, signets et recherche Web
 * ===========================================================
 */

import { useEffect, useState } from "react";

import {
    Link2,
    Unlink,
    Bookmark,
    Globe,
    X,
    Check,
    AlertCircle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

/**
 * Validation simple et sûre d'une URL.
 */
function isValidUrl(value) {
    if (!value || typeof value !== "string") {
        return false;
    }

    try {
        const url = new URL(value);

        return (
            url.protocol === "http:" ||
            url.protocol === "https:" ||
            url.protocol === "mailto:"
        );
    } catch {
        return false;
    }
}

/**
 * Normalise une URL saisie sans protocole.
 *
 * Exemple :
 * example.com
 * devient :
 * https://example.com
 */
function normalizeUrl(value) {
    const trimmed = String(value || "").trim();

    if (!trimmed) {
        return "";
    }

    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("mailto:")
    ) {
        return trimmed;
    }

    return `https://${trimmed}`;
}

/**
 * Nettoyage du nom d'un signet.
 */
function normalizeBookmarkName(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .replace(/^[-_]+|[-_]+$/g, "")
        .slice(0, 80);
}

export default function LinksGroup({ editor }) {
    const [isLinkModalOpen, setIsLinkModalOpen] =
        useState(false);

    const [isBookmarkModalOpen, setIsBookmarkModalOpen] =
        useState(false);

    const [urlInput, setUrlInput] = useState("");

    const [bookmarkName, setBookmarkName] =
        useState("");

    const [error, setError] = useState("");

    if (!editor) {
        return null;
    }

    const linkIsActive = editor.isActive("link");

    /**
     * Ferme les modales avec Escape.
     */
    useEffect(() => {
        if (
            !isLinkModalOpen &&
            !isBookmarkModalOpen
        ) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key !== "Escape") {
                return;
            }

            setIsLinkModalOpen(false);
            setIsBookmarkModalOpen(false);
            setError("");
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [
        isLinkModalOpen,
        isBookmarkModalOpen,
    ]);

    /**
     * Ouvre la boîte de dialogue du lien.
     */
    const handleOpenLinkModal = () => {
        setError("");

        const attributes =
            editor.getAttributes("link");

        setUrlInput(attributes?.href || "");

        setIsLinkModalOpen(true);
    };

    /**
     * Applique ou supprime le lien.
     */
    const handleSaveLink = () => {
        const value = normalizeUrl(urlInput);

        /*
         * Champ vide = suppression du lien.
         */
        if (!value) {
            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .unsetLink()
                .run();

            setIsLinkModalOpen(false);
            setUrlInput("");
            setError("");

            return;
        }

        /*
         * Refus des URL invalides.
         */
        if (!isValidUrl(value)) {
            setError(
                "Adresse URL invalide. Utilisez une adresse http://, https:// ou mailto:."
            );

            return;
        }

        const applied = editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({
                href: value,
                target: "_blank",
                rel: "noopener noreferrer",
            })
            .run();

        if (!applied) {
            setError(
                "Impossible d'appliquer le lien à la sélection."
            );

            return;
        }

        setIsLinkModalOpen(false);
        setUrlInput("");
        setError("");
    };

    /**
     * Supprime le lien courant.
     */
    const handleRemoveLink = () => {
        if (!editor.isActive("link")) {
            return;
        }

        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .unsetLink()
            .run();

        setError("");
    };

    /**
     * Ouvre la fenêtre de création d'un signet.
     */
    const handleOpenBookmarkModal = () => {
        setError("");
        setBookmarkName("");
        setIsBookmarkModalOpen(true);
    };

    /**
     * Insère un signet interne.
     *
     * Le signet est représenté par une balise span avec
     * un identifiant stable. Le contenu utilisateur est
     * échappé avant insertion.
     */
    const handleSaveBookmark = () => {
        const normalizedName =
            normalizeBookmarkName(bookmarkName);

        if (!normalizedName) {
            setError(
                "Veuillez saisir un nom de signet valide."
            );

            return;
        }

        const bookmarkId =
            `bookmark-${normalizedName}`;

        /*
         * Vérification des identifiants déjà présents.
         */
        const existingBookmark =
            editor.view.dom.querySelector(
                `[id="${CSS.escape(bookmarkId)}"]`
            );

        if (existingBookmark) {
            setError(
                "Ce signet existe déjà dans le document."
            );

            return;
        }

        const inserted = editor
            .chain()
            .focus()
            .insertContent({
                type: "text",
                text: `[${normalizedName}]`,
            })
            .run();

        if (!inserted) {
            setError(
                "Impossible d'insérer le signet."
            );

            return;
        }

        /*
         * On conserve le document Tiptap comme source
         * principale. L'identifiant DOM est ajouté après
         * l'insertion au nœud texte correspondant.
         *
         * Cette partie reste volontairement limitée au
         * marqueur créé par cette action.
         */
        const textNodes =
            editor.view.dom.querySelectorAll(
                "span.macevo-bookmark"
            );

        /*
         * Si une extension dédiée aux signets est ajoutée
         * ultérieurement, cette partie pourra être remplacée
         * sans modifier l'interface du groupe.
         */
        if (textNodes.length === 0) {
            const paragraphs =
                editor.view.dom.querySelectorAll(
                    "p, h1, h2, h3, h4, h5, h6"
                );

            const lastParagraph =
                paragraphs[paragraphs.length - 1];

            if (lastParagraph) {
                const walker =
                    document.createTreeWalker(
                        lastParagraph,
                        NodeFilter.SHOW_TEXT
                    );

                let node;

                while (
                    (node = walker.nextNode())
                ) {
                    if (
                        node.textContent?.includes(
                            `[${normalizedName}]`
                        )
                    ) {
                        const parent =
                            node.parentElement;

                        if (
                            parent &&
                            !parent.closest(
                                ".macevo-bookmark"
                            )
                        ) {
                            const span =
                                document.createElement(
                                    "span"
                                );

                            span.className =
                                "macevo-bookmark";

                            span.id = bookmarkId;

                            span.dataset.bookmark =
                                normalizedName;

                            span.title =
                                `Signet : ${normalizedName}`;

                            span.style.scrollMarginTop =
                                "20px";

                            parent.replaceWith(span);

                            span.appendChild(node);

                            break;
                        }
                    }
                }
            }
        }

        setIsBookmarkModalOpen(false);
        setBookmarkName("");
        setError("");
    };

    /**
     * Recherche la sélection sur le Web.
     */
    const handleOpenInternet = () => {
        const { from, to } =
            editor.state.selection;

        const selection =
            editor.state.doc.textBetween(
                from,
                to,
                " "
            );

        const query =
            selection.trim() ||
            "MACEVO scientific platform";

        const url =
            `https://www.google.com/search?q=${encodeURIComponent(
                query
            )}`;

        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );
    };

    return (
        <div className="flex items-center gap-4">
            <RibbonGroup
                title="Liens"
                width="w-auto"
            >
                <div className="flex items-center gap-1 h-full px-1">
                    <RibbonButton
                        icon={Link2}
                        label="Lien"
                        tooltip={
                            linkIsActive
                                ? "Modifier le lien sélectionné"
                                : "Insérer un lien hypertexte"
                        }
                        active={linkIsActive}
                        onClick={
                            handleOpenLinkModal
                        }
                    />

                    <RibbonButton
                        icon={Unlink}
                        label="Supprimer"
                        tooltip="Supprimer le lien sélectionné"
                        disabled={!linkIsActive}
                        onClick={
                            handleRemoveLink
                        }
                    />

                    <RibbonButton
                        icon={Bookmark}
                        label="Signet"
                        tooltip="Ajouter un signet interne"
                        onClick={
                            handleOpenBookmarkModal
                        }
                    />

                    <RibbonButton
                        icon={Globe}
                        label="Internet"
                        tooltip="Rechercher la sélection sur le Web"
                        onClick={
                            handleOpenInternet
                        }
                    />
                </div>
            </RibbonGroup>

            {/* =====================================================
                MODALE LIEN
               ===================================================== */}

            {isLinkModalOpen && (
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setIsLinkModalOpen(false);
                            setError("");
                        }
                    }}
                >
                    <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between bg-slate-900 px-5 py-3 text-white">
                            <h3 className="flex items-center gap-2 text-xs font-semibold">
                                <Link2
                                    size={16}
                                    className="text-blue-400"
                                />

                                Insérer un lien hypertexte
                            </h3>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsLinkModalOpen(
                                        false
                                    );
                                    setError("");
                                }}
                                className="cursor-pointer text-slate-400 transition hover:text-white"
                                title="Fermer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 p-5 text-xs">
                            <label className="font-semibold text-slate-600">
                                Adresse URL cible :
                            </label>

                            <input
                                type="url"
                                placeholder="https://exemple.com"
                                value={urlInput}
                                onChange={(event) => {
                                    setUrlInput(
                                        event.target.value
                                    );
                                    setError("");
                                }}
                                onKeyDown={(event) => {
                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {
                                        event.preventDefault();
                                        handleSaveLink();
                                    }
                                }}
                                className="h-9 w-full rounded-lg border border-slate-300 px-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                autoFocus
                            />

                            {error && (
                                <div className="flex items-start gap-1.5 rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-600">
                                    <AlertCircle
                                        size={13}
                                        className="mt-0.5 shrink-0"
                                    />

                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLinkModalOpen(
                                        false
                                    );
                                    setError("");
                                }}
                                className="cursor-pointer rounded-lg px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                            >
                                Annuler
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleSaveLink
                                }
                                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow transition hover:bg-blue-700"
                            >
                                <Check size={14} />

                                Appliquer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================
                MODALE SIGNET
               ===================================================== */}

            {isBookmarkModalOpen && (
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setIsBookmarkModalOpen(
                                false
                            );
                            setError("");
                        }
                    }}
                >
                    <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between bg-slate-900 px-5 py-3 text-white">
                            <h3 className="flex items-center gap-2 text-xs font-semibold">
                                <Bookmark
                                    size={16}
                                    className="text-blue-400"
                                />

                                Insérer un signet
                            </h3>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsBookmarkModalOpen(
                                        false
                                    );
                                    setError("");
                                }}
                                className="cursor-pointer text-slate-400 transition hover:text-white"
                                title="Fermer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 p-5 text-xs">
                            <label className="font-semibold text-slate-600">
                                Nom du signet :
                            </label>

                            <input
                                type="text"
                                placeholder="ex: section_methodologie"
                                value={bookmarkName}
                                onChange={(event) => {
                                    setBookmarkName(
                                        normalizeBookmarkName(
                                            event.target
                                                .value
                                        )
                                    );
                                    setError("");
                                }}
                                onKeyDown={(event) => {
                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {
                                        event.preventDefault();
                                        handleSaveBookmark();
                                    }
                                }}
                                className="h-9 w-full rounded-lg border border-slate-300 px-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                autoFocus
                            />

                            <p className="text-[10px] text-slate-500">
                                Utilisez un nom court, sans
                                espace ni caractère spécial.
                            </p>

                            {error && (
                                <div className="flex items-start gap-1.5 rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-600">
                                    <AlertCircle
                                        size={13}
                                        className="mt-0.5 shrink-0"
                                    />

                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsBookmarkModalOpen(
                                        false
                                    );
                                    setError("");
                                }}
                                className="cursor-pointer rounded-lg px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                            >
                                Annuler
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleSaveBookmark
                                }
                                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow transition hover:bg-blue-700"
                            >
                                <Check size={14} />

                                Ajouter le signet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}