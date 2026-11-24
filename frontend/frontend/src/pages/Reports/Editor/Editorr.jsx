/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : Editorr.jsx
 * Description : Espace principal de l'éditeur MACEVO
 * Version : 12.0.0 — ÉDITEUR A4 CENTRÉ / STYLE WORD
 * ============================================================
 */

import { lazy, Suspense, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FileText, Check, Minus, Plus, PanelRightClose, PanelRightOpen } from "lucide-react";
import { EditorContent } from "@tiptap/react";

import RibbonContainer from "./Ribbon/RibbonContainer";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import { SpellingProvider } from "./SpellingContext";
import { EditorProvider, useEditorContext } from "./EditorContext";
import { LayoutProvider } from "./LayoutContext";
import { RibbonProvider, useRibbonContext } from "./Ribbon/RibbonContext";
import { useLayoutContext } from "./LayoutContext";

import "./MACEVO_Editor_A4.css";

const LatexWorkspace = lazy(() => import("../../../latex/LatexWorkspace"));

const EDITOR_PAGE_SIZES = {
    A3: { width: 1123, height: 1591 },
    A4: { width: 794, height: 1123 },
    A5: { width: 419, height: 794 },
    LETTER: { width: 818, height: 1060 },
    LEGAL: { width: 818, height: 1404 },
};

function getEditorPageMetrics(layout = {}) {
    const size = EDITOR_PAGE_SIZES[String(layout.pageSize || "A4").toUpperCase()] || EDITOR_PAGE_SIZES.A4;
    const landscape = layout.orientation === "landscape";
    const width = landscape ? size.height : size.width;
    const height = landscape ? size.width : size.height;
    const margins = layout.margins || {};

    return {
        width,
        height,
        margins: {
            top: Number(margins.top ?? 25.4),
            right: Number(margins.right ?? 25.4),
            bottom: Number(margins.bottom ?? 25.4),
            left: Number(margins.left ?? 25.4),
        },
        columns: Math.max(1, Math.min(3, Number(layout.columns) || 1)),
    };
}

function getPaginationContainers(editor) {
    const root = editor?.view?.dom;
    if (!root) return [];

    const containers = [];

    if (root.matches?.("[data-tiptap-pagination]")) {
        containers.push(root);
    }

    root.querySelectorAll?.("[data-tiptap-pagination]").forEach((node) => {
        if (!containers.includes(node)) containers.push(node);
    });

    return containers;
}

function getEditorPages(editor) {
    const root = editor?.view?.dom;
    if (!root) return [];

    const pages = [];
    const seen = new Set();

    const addPages = (nodes) => {
        Array.from(nodes || []).forEach((node) => {
            if (!seen.has(node)) {
                seen.add(node);
                pages.push(node);
            }
        });
    };

    /*
     * PaginationPlus 3.x crée un .tiptap-page-break pour chaque page.
     * Le conteneur [data-tiptap-pagination] peut être le ProseMirror
     * lui-même selon la version/initialisation : on couvre les deux cas.
     */
    getPaginationContainers(editor).forEach((pagination) => {
        addPages(pagination.querySelectorAll(".tiptap-page-break"));
    });

    /* Secours : recherche globale dans le DOM de l'éditeur. */
    if (!pages.length) {
        addPages(root.querySelectorAll(".tiptap-page-break"));
    }

    /*
     * Certaines versions peuvent exposer directement des éléments de page.
     * On ne les utilise que si PaginationPlus n'a pas fourni ses page-breaks.
     */
    if (!pages.length) {
        [
            ".tiptap-page",
            ".pagination-page",
            "[data-page]",
        ].some((selector) => {
            const nodes = root.querySelectorAll(selector);
            if (nodes.length) {
                addPages(nodes);
                return true;
            }
            return false;
        });
    }

    return pages;
}

function getEditorPageCount(editor, pageHeight = 1123) {
    const pages = getEditorPages(editor);

    /*
     * PaginationPlus crée un page-break par page déjà calculée.
     * C'est la source la plus fiable lorsqu'elle existe.
     */
    if (pages.length > 0) {
        return pages.length;
    }

    const root = editor?.view?.dom;
    if (!root) return 1;

    /*
     * Secours géométrique : le ProseMirror peut être plus haut que la
     * première page même lorsque les décorations de PaginationPlus ne
     * sont pas encore apparues dans le DOM.
     *
     * 1123 px = A4 à 96 dpi. On ajoute le gap visuel de 28 px.
     */
    const PAGE_GAP = 28;
    const height = Math.max(
        Number(root.scrollHeight) || 0,
        Number(root.offsetHeight) || 0
    );

    if (height <= pageHeight) return 1;

    return Math.max(
        1,
        Math.ceil(height / (pageHeight + PAGE_GAP))
    );
}

function usePageState(editor, pageHeight = 1123) {
    const [state, setState] = useState({
        currentPage: 1,
        pageCount: 1,
    });

    useEffect(() => {
        if (!editor?.view?.dom) {
            setState({ currentPage: 1, pageCount: 1 });
            return undefined;
        }

        const root = editor.view.dom;
        const scrollContainer = document.getElementById("macevo-editor-scroll");

        let frame = 0;
        let lastPageCount = 1;

        const update = () => {
            cancelAnimationFrame(frame);

            frame = requestAnimationFrame(() => {
                const pages = getEditorPages(editor);
                const pageCount = Math.max(1, getEditorPageCount(editor, pageHeight));

                let currentPage = 1;

                if (pages.length) {
                    const containerRect = (
                        scrollContainer ||
                        root.parentElement ||
                        root
                    ).getBoundingClientRect();

                    const referenceTop = containerRect.top + 90;

                    let bestIndex = 0;
                    let bestDistance = Infinity;

                    pages.forEach((page, index) => {
                        const rect = page.getBoundingClientRect();
                        const distance = Math.abs(rect.top - referenceTop);

                        if (
                            rect.top <= referenceTop + 140 &&
                            distance < bestDistance
                        ) {
                            bestIndex = index;
                            bestDistance = distance;
                        }
                    });

                    if (bestDistance === Infinity) {
                        const visible = pages.findIndex((page) => {
                            const rect = page.getBoundingClientRect();
                            return rect.bottom > referenceTop;
                        });

                        bestIndex = visible >= 0 ? visible : pages.length - 1;
                    }

                    currentPage = Math.min(
                        Math.max(1, bestIndex + 1),
                        pageCount
                    );
                } else if (scrollContainer) {
                    /*
                     * Si PaginationPlus n'a pas encore publié ses
                     * page-breaks, le défilement réel permet quand même
                     * d'afficher le bon numéro.
                     */
                    const PAGE_GAP = 28;
                    const scrollUnit = pageHeight + PAGE_GAP;

                    currentPage = Math.min(
                        pageCount,
                        Math.max(
                            1,
                            Math.floor(scrollContainer.scrollTop / scrollUnit) + 1
                        )
                    );
                }

                lastPageCount = pageCount;
                setState((previous) => {
                    if (
                        previous.currentPage === currentPage &&
                        previous.pageCount === pageCount
                    ) {
                        return previous;
                    }

                    return {
                        currentPage,
                        pageCount,
                    };
                });
            });
        };

        update();

        editor.on("update", update);
        window.addEventListener("resize", update);
        scrollContainer?.addEventListener("scroll", update, { passive: true });

        const observer = new MutationObserver(update);
        observer.observe(root, {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true,
        });

        /*
         * PaginationPlus calcule parfois ses pages après le premier rendu.
         * Quelques recalculs différés rendent le compteur fiable sans
         * ralentir l'éditeur.
         */
        const timers = [50, 150, 300, 600, 1000].map((delay) =>
            window.setTimeout(update, delay)
        );

        return () => {
            cancelAnimationFrame(frame);
            editor.off("update", update);
            window.removeEventListener("resize", update);
            scrollContainer?.removeEventListener("scroll", update);
            observer.disconnect();
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, [editor, pageHeight]);

    return state;
}

function getLanguageLabel(language) {
    const normalized = String(language ?? "").trim().toLowerCase();

    const labels = {
        fr: "Français",
        français: "Français",
        french: "Français",
        en: "English",
        anglais: "English",
        english: "English",
        es: "Español",
        espagnol: "Español",
        spanish: "Español",
        de: "Deutsch",
        allemand: "Deutsch",
        german: "Deutsch",
        pt: "Português",
        portugais: "Português",
        portuguese: "Português",
        other: "Autre",
    };

    return labels[normalized] || language || "Français";
}

/* ============================================================
   MINIATURES DE PAGES
============================================================ */

function getThumbnailPageStarts(editor) {
    const root = editor?.view?.dom;
    if (!root) return [];

    const starts = [];
    const breaks = Array.from(
        root.querySelectorAll?.(".tiptap-page-break") || []
    );

    if (breaks.length) {
        const rootRect = root.getBoundingClientRect();

        breaks.forEach((node) => {
            const rect = node.getBoundingClientRect();
            if (Number.isFinite(rect.top)) {
                starts.push(rect.top - rootRect.top);
            }
        });
    }

    /*
     * Si PaginationPlus expose directement ses pages, leurs positions
     * sont encore plus précises.
     */
    if (!starts.length) {
        const pageNodes = Array.from(
            root.querySelectorAll?.(".tiptap-page, .pagination-page, [data-page]") || []
        );

        if (pageNodes.length) {
            const rootRect = root.getBoundingClientRect();

            pageNodes.forEach((node) => {
                const rect = node.getBoundingClientRect();
                if (Number.isFinite(rect.top)) {
                    starts.push(rect.top - rootRect.top);
                }
            });
        }
    }

    return starts.sort((a, b) => a - b);
}

function buildExactPageThumbnails(editor, pageCount, pageWidth = 794, pageHeight = 1123) {
    const root = editor?.view?.dom;
    if (!root) return [];

    /*
     * SOURCE DE VÉRITÉ : la vraie feuille A4 affichée par Tiptap.
     *
     * Avant, nous reconstruisions chaque miniature en récupérant les blocs
     * un par un puis en les repositionnant. Cela créait un DEUXIÈME rendu
     * du document. Le panneau pouvait donc diverger de la feuille réelle.
     *
     * Désormais, chaque miniature est une copie visuelle du DOM réel de
     * l'éditeur, déplacée verticalement pour ne laisser voir qu'une seule
     * feuille A4. Aucun texte, bloc ou contenu n'est régénéré ici.
     */
    const PAGE_GAP = 28;
    const PAGE_UNIT = pageHeight + PAGE_GAP;
    const totalPages = Math.max(1, Number(pageCount) || getEditorPageCount(editor, pageHeight));
    const thumbnailScale = 150 / pageWidth;

    const result = [];

    for (let index = 0; index < totalPages; index += 1) {
        const clone = root.cloneNode(true);
        const pageStart = index * PAGE_UNIT;

        /* Le clone doit conserver exactement les mêmes classes que la vraie feuille. */
        clone.classList.add("macevo-thumbnail-live-document");

        /*
         * Le clone représente tout le document mais nous le décalons pour
         * afficher uniquement la tranche correspondant à la page demandée.
         */
        clone.style.width = `${pageWidth}px`;
        clone.style.minWidth = `${pageWidth}px`;
        clone.style.maxWidth = `${pageWidth}px`;
        clone.style.height = `${Math.max(pageHeight, root.scrollHeight || pageHeight)}px`;
        clone.style.minHeight = `${Math.max(pageHeight, root.scrollHeight || pageHeight)}px`;
        clone.style.margin = "0";
        clone.style.transform = `translateY(-${pageStart}px)`;
        clone.style.transformOrigin = "top left";
        clone.style.boxShadow = "none";
        clone.style.border = "0";
        clone.style.overflow = "visible";
        clone.setAttribute("contenteditable", "false");
        clone.removeAttribute("id");

        /*
         * Le curseur, la sélection et les marqueurs techniques ne doivent
         * jamais apparaître dans une miniature. On ne touche pas au contenu.
         */
        clone.querySelectorAll?.(".tiptap-page-break, .tiptap-pagination-gap").forEach((node) => {
            node.style.visibility = "hidden";
        });

        clone.querySelectorAll?.("[contenteditable='true']").forEach((node) => {
            node.setAttribute("contenteditable", "false");
        });

        const shell = document.createElement("div");
        shell.className = "macevo-pagination-editor macevo-thumbnail-page-shell";
        shell.style.width = `${pageWidth}px`;
        shell.style.height = `${Math.max(pageHeight, root.scrollHeight || pageHeight)}px`;
        shell.style.minHeight = `${Math.max(pageHeight, root.scrollHeight || pageHeight)}px`;
        shell.style.margin = "0";
        shell.style.padding = "0";
        shell.style.position = "absolute";
        shell.style.top = "0";
        shell.style.left = "0";
        shell.style.transform = `scale(${thumbnailScale}) translateY(-${pageStart}px)`;
        shell.style.transformOrigin = "top left";
        shell.style.overflow = "visible";
        shell.style.background = "#ffffff";
        shell.appendChild(clone);

        result.push({
            index,
            html: shell.outerHTML,
        });
    }

    return result;
}

function PageRail({ editor, pageCount, currentPage, pageWidth, pageHeight, open, onToggle }) {
    const [pages, setPages] = useState([]);

    useEffect(() => {
        if (!editor) return undefined;

        let frame = 0;

        const refresh = () => {
            cancelAnimationFrame(frame);

            frame = requestAnimationFrame(() => {
                const actualPageCount = Math.max(
                    pageCount || 1,
                    getEditorPageCount(editor, pageHeight)
                );

                setPages(
                    buildExactPageThumbnails(editor, actualPageCount, pageWidth, pageHeight)
                );
            });
        };

        refresh();
        editor.on("update", refresh);
        window.addEventListener("resize", refresh);

        const observer = new MutationObserver(refresh);

        if (editor.view?.dom) {
            observer.observe(editor.view.dom, {
                subtree: true,
                childList: true,
                characterData: true,
                attributes: true,
            });
        }

        /*
         * PaginationPlus peut recalculer les positions quelques instants
         * après une modification. Ces rafraîchissements garantissent que
         * la miniature reste synchronisée avec la vraie page.
         */
        const timers = [50, 150, 300, 600, 1000].map((delay) =>
            window.setTimeout(refresh, delay)
        );

        return () => {
            cancelAnimationFrame(frame);
            editor.off("update", refresh);
            window.removeEventListener("resize", refresh);
            observer.disconnect();
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, [editor, pageCount, pageWidth, pageHeight]);

    if (!open) {
        return (
            <button
                type="button"
                className="macevo-pages-open-button"
                onClick={onToggle}
                title="Afficher les pages"
                aria-label="Afficher les pages"
            >
                <PanelRightOpen size={17} />
            </button>
        );
    }

    const scrollToPage = (index) => {
        const pagesInEditor = getEditorPages(editor);
        const page = pagesInEditor[index];

        if (page) {
            page.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
            return;
        }

        const scrollContainer = document.getElementById("macevo-editor-scroll");

        if (scrollContainer) {
            const PAGE_GAP = 28;

            scrollContainer.scrollTo({
                top: index * (pageHeight + PAGE_GAP),
                behavior: "smooth",
            });
        }
    };

    const totalPages = Math.max(
        pageCount || 1,
        pages.length || 1
    );

    return (
        <aside className="macevo-pages-rail" aria-label="Pages du document">
            <div className="macevo-pages-rail-header">
                <span>Pages</span>
                <button
                    type="button"
                    onClick={onToggle}
                    title="Masquer les pages"
                    aria-label="Masquer les pages"
                >
                    <PanelRightClose size={16} />
                </button>
            </div>

            <div className="macevo-pages-list">
                {Array.from({ length: totalPages }, (_, index) => {
                    const page = pages[index];

                    return (
                        <button
                            key={index}
                            type="button"
                            className={`macevo-page-thumbnail ${
                                index + 1 === currentPage ? "is-active" : ""
                            }`}
                            onClick={() => scrollToPage(index)}
                            title={`Aller à la page ${index + 1}`}
                        >
                            <span className="macevo-page-thumbnail-number">
                                {index + 1}
                            </span>

                            <span
                                className="macevo-page-thumbnail-paper"
                                style={{
                                    "--macevo-thumbnail-page-width": `${pageWidth}px`,
                                    "--macevo-thumbnail-page-height": `${pageHeight}px`,
                                    height: `${150 * pageHeight / pageWidth}px`,
                                }}
                            >
                                <span
                                    className="macevo-page-thumbnail-content"
                                    dangerouslySetInnerHTML={{
                                        __html: page?.html || "",
                                    }}
                                />
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="macevo-pages-footer">
                Page {currentPage} sur {pageCount}
            </div>
        </aside>
    );
}

/* ============================================================
   ESPACE DOCUMENT
============================================================ */

function EditorWorkspace({ zoom = 100, pageMetrics }) {
    const { editor } = useEditorContext();

    if (!editor) {
        return (
            <main className="macevo-editor-workspace flex flex-1 min-h-0 items-center justify-center">
                <div className="rounded-lg border border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 shadow-sm">
                    Chargement de l'éditeur...
                </div>
            </main>
        );
    }

    const zoomFactor = zoom / 100;

    return (
        <main
            id="macevo-editor-workspace"
            className="macevo-editor-workspace flex flex-1 min-h-0 min-w-0 overflow-hidden"
        >
            <div
                id="macevo-editor-scroll"
                className="macevo-editor-scroll relative flex-1 min-h-0 min-w-0 overflow-auto"
            >
                <div
                    className="macevo-editor-canvas"
                    style={{
                        "--macevo-editor-zoom": zoomFactor,
                        "--macevo-page-width": `${pageMetrics.width}px`,
                        "--macevo-page-height": `${pageMetrics.height}px`,
                        "--macevo-page-margin-top": `${pageMetrics.margins.top}mm`,
                        "--macevo-page-margin-right": `${pageMetrics.margins.right}mm`,
                        "--macevo-page-margin-bottom": `${pageMetrics.margins.bottom}mm`,
                        "--macevo-page-margin-left": `${pageMetrics.margins.left}mm`,
                        "--macevo-columns": pageMetrics.columns,
                    }}
                >
                    <div
                        className="macevo-pagination-editor"
                        style={{
                            zoom: zoomFactor,
                        }}
                    >
                        <EditorContent
                            editor={editor}
                            className="macevo-editor-content"
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}

/* ============================================================
   BARRE D'ÉTAT
============================================================ */

function EditorStatusBar({ zoom = 100, onZoomChange, currentPage = 1, pageCount = 1 }) {
    const {
        editor,
        wordsCount,
        charactersCount,
        saveState,
        documentState,
    } = useEditorContext();

    const [statistics, setStatistics] = useState({
        words: Number(wordsCount) || 0,
        characters: Number(charactersCount) || 0,
    });

    useEffect(() => {
        if (!editor) return undefined;

        const updateStatistics = () => {
            const text = editor.state.doc.textContent || "";
            const trimmed = text.trim();

            setStatistics({
                words: trimmed ? trimmed.split(/\s+/).length : 0,
                characters: text.length,
            });
        };

        updateStatistics();
        editor.on("update", updateStatistics);

        return () => editor.off("update", updateStatistics);
    }, [editor]);

    const displayedWords = Number.isFinite(Number(wordsCount))
        ? Number(wordsCount)
        : statistics.words;

    const displayedCharacters = Number.isFinite(Number(charactersCount))
        ? Number(charactersCount)
        : statistics.characters;

    const isSaved =
        saveState?.isSaved !== false &&
        saveState?.isSaving !== true;

    const language = getLanguageLabel(
        documentState?.currentDocument?.language ||
        documentState?.currentDocument?.lang ||
        "fr"
    );

    return (
        <footer className="macevo-status-bar">
            <div className="macevo-status-left">
                <span className="macevo-status-item">
                    <FileText size={13} />
                    Page {currentPage} sur {pageCount}
                </span>

                <span className="macevo-status-divider" />

                <span className="macevo-status-item">
                    {displayedWords} mot{displayedWords !== 1 ? "s" : ""}
                </span>

                <span className="macevo-status-item">
                    {displayedCharacters} caractère{displayedCharacters !== 1 ? "s" : ""}
                </span>

                <span className="macevo-status-divider" />

                <span className="macevo-status-item">{language}</span>
            </div>

            <div className="macevo-status-save">
                <span className={`macevo-save-dot ${isSaved ? "is-saved" : ""}`}>
                    <Check size={12} />
                </span>

                <span>
                    {saveState?.isSaving
                        ? "Enregistrement..."
                        : isSaved
                            ? "Enregistré"
                            : "Modifications non enregistrées"}
                </span>
            </div>

            <div className="macevo-status-zoom">
                <button
                    type="button"
                    onClick={() => onZoomChange?.(Math.max(50, zoom - 10))}
                    disabled={zoom <= 50}
                    title="Réduire le zoom"
                >
                    <Minus size={13} />
                </button>

                <button
                    type="button"
                    className="macevo-zoom-value"
                    onClick={() => onZoomChange?.(100)}
                    title="Réinitialiser le zoom"
                >
                    {zoom}%
                </button>

                <button
                    type="button"
                    onClick={() => onZoomChange?.(Math.min(200, zoom + 10))}
                    disabled={zoom >= 200}
                    title="Augmenter le zoom"
                >
                    <Plus size={13} />
                </button>
            </div>
        </footer>
    );
}

/* ============================================================
   PONT ROUTE → PROVIDER
============================================================ */

function EditorRouteBridge({ children }) {
    const { id } = useParams();
    const [ready, setReady] = useState(false);
    const [routeError, setRouteError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const rawId = String(id ?? "").trim();
        const numericId = Number(rawId);

        if (!rawId || !Number.isInteger(numericId) || numericId <= 0) {
            setRouteError("Identifiant de rapport invalide.");
            setReady(false);

            return () => {
                cancelled = true;
            };
        }

        try {
            let current = {};

            const stored = sessionStorage.getItem("macevo_current_report");

            if (stored) {
                try {
                    const parsed = JSON.parse(stored);

                    if (parsed && typeof parsed === "object") {
                        current = parsed;
                    }
                } catch {
                    current = {};
                }
            }

            if (Number(current.reportId) !== numericId) {
                current = {};
                sessionStorage.removeItem("macevo_template_needs_initialization");
            }

            sessionStorage.setItem(
                "macevo_current_report",
                JSON.stringify({
                    ...current,
                    reportId: numericId,
                })
            );

            if (!cancelled) {
                setRouteError("");
                setReady(true);
            }
        } catch (error) {
            console.error(
                "MACEVO : impossible de préparer la session du rapport :",
                error
            );

            if (!cancelled) {
                setRouteError(
                    "Impossible d'initialiser le rapport dans l'éditeur."
                );
                setReady(false);
            }
        }

        return () => {
            cancelled = true;
        };
    }, [id]);

    if (!ready) {
        return (
            <main className="flex h-screen w-full items-center justify-center bg-slate-200">
                <div className="rounded-xl border border-slate-200 bg-white px-7 py-5 text-center shadow-sm">
                    {routeError ? (
                        <>
                            <div className="mb-1 text-sm font-semibold text-red-600">
                                Éditeur MACEVO
                            </div>
                            <div className="text-sm text-slate-600">
                                {routeError}
                            </div>
                        </>
                    ) : (
                        <div className="text-sm text-slate-500">
                            Initialisation de l'éditeur...
                        </div>
                    )}
                </div>
            </main>
        );
    }

    return (
        <EditorProvider key={`macevo-editor-${id}`}>
            {children}
        </EditorProvider>
    );
}

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */

function EditorWorkspaceShell() {
    // La référence Word fournie est affichée à 90 %. Le zoom de l'éditeur
    // reste indépendant du format A4, mais adopte ce même cadrage à l'ouverture.
    const [zoom, setZoom] = useState(90);
    const [pagesOpen, setPagesOpen] = useState(true);
    const { editor, documentState } = useEditorContext();
    const { activeTab } = useRibbonContext();
    const { layout } = useLayoutContext();
    const pageMetrics = getEditorPageMetrics(layout);

    const { currentPage, pageCount } = usePageState(editor, pageMetrics.height);

    useEffect(() => {
        const media = window.matchMedia("(max-width: 850px)");
        const syncPageRail = () => setPagesOpen(!media.matches);
        syncPageRail();
        media.addEventListener?.("change", syncPageRail);
        return () => media.removeEventListener?.("change", syncPageRail);
    }, []);

    return (
                <div className="macevo-editor-shell flex h-screen w-full overflow-hidden bg-[#e7e9ed]">
                    <Sidebar />

                    <div className="macevo-editor-main flex min-w-0 flex-1 flex-col overflow-hidden">
                        <Navbar
                            title={
                                documentState?.currentDocument?.title ||
                                documentState?.currentDocument?.name ||
                                "Document scientifique"
                            }
                            subtitle="Espace de rédaction scientifique"
                        />
                        <RibbonContainer />

                        {activeTab === "latex" ? (
                            <section className="macevo-latex-workspace min-h-0 min-w-0 flex-1 overflow-hidden" aria-label="Atelier LaTeX">
                                <Suspense fallback={<div className="grid h-full place-items-center text-sm text-slate-500" role="status">Chargement de l’atelier LaTeX…</div>}>
                                    <LatexWorkspace />
                                </Suspense>
                            </section>
                        ) : (
                            <>
                                <div className="macevo-editor-document-row flex min-h-0 flex-1">
                                    <EditorWorkspace zoom={zoom} pageMetrics={pageMetrics} />

                                    <PageRail
                                        editor={editor}
                                        pageCount={pageCount}
                                        currentPage={currentPage}
                                        pageWidth={pageMetrics.width}
                                        pageHeight={pageMetrics.height}
                                        open={pagesOpen}
                                        onToggle={() => setPagesOpen((value) => !value)}
                                    />
                                </div>

                                <EditorStatusBar
                                    zoom={zoom}
                                    onZoomChange={setZoom}
                                    currentPage={currentPage}
                                    pageCount={pageCount}
                                />
                            </>
                        )}
                    </div>
                </div>
    );
}

function EditorAppContent() {
    return (
        <LayoutProvider>
            <SpellingProvider>
                <RibbonProvider>
                    <EditorWorkspaceShell />
                </RibbonProvider>
            </SpellingProvider>
        </LayoutProvider>
    );
}

export default function Editorr() {
    return (
        <EditorRouteBridge>
            <EditorAppContent />
        </EditorRouteBridge>
    );
}
