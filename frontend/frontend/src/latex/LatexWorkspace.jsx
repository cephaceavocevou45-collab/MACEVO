/**
 * ============================================================
 * MACEVO
 *
 * ---
 * Fichier : LatexWorkspace.jsx
 * Description : Workspace LaTeX avec barre d'état non fixe (défilement naturel)
 * Version : 9.7.0
 * ============================================================
 */

import { useEffect, useRef, useState } from "react";
import { Code2, Eye, TerminalSquare } from "lucide-react";
import {
    Group as PanelGroup,
    Panel,
    Separator as PanelResizeHandle,
} from "react-resizable-panels";

import { LatexProvider } from "./context/LatexContext";
import useLatex from "./hooks/useLatex";
import { useEditorContext } from "../pages/Reports/Editor/EditorContext";
import { useLayoutContext } from "../pages/Reports/Editor/LayoutContext";

import LatexToolbar from "./components/LatexToolbar";
import LatexEditor from "./components/LatexEditor";
import LatexPreview from "./components/LatexPreview";
import LatexConsole from "./components/LatexConsole";
import LatexPackageModal from "./components/LatexPackageModal";
import LatexSettingsModal from "./components/LatexSettingsModal";
import latexWorkspaceController from "./controllers/LatexWorkspaceController";

function WorkspaceContent() {
    const { editor } = useEditorContext();
    const { layout } = useLayoutContext();
    const context = useLatex();
    const initialized = useRef(false);
    const [wordCount, setWordCount] = useState(0);

    const [packageModalOpen, setPackageModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [compactPane, setCompactPane] = useState("code");
    const [compactLayout, setCompactLayout] = useState(false);

    useEffect(() => {
        const media = window.matchMedia("(max-width: 1024px)");
        const update = () => setCompactLayout(media.matches);
        update();
        media.addEventListener?.("change", update);
        return () => media.removeEventListener?.("change", update);
    }, []);

    useEffect(() => {
        if (!editor || initialized.current) return;
        initialized.current = true;

            latexWorkspaceController.synchronize({
            ...context,
            editor,
                layout,
        });
    }, [editor]);

    useEffect(() => {
        if (!editor) return;

        const updateWordCount = () => {
            const text = editor.state.doc.textContent.trim();
            setWordCount(text ? text.split(/\s+/).length : 0);
        };

        const handleUpdate = () => {
            const html = editor.getHTML();
            updateWordCount();
            latexWorkspaceController.updateDocument(html, {
                ...context,
                editor,
            });
        };

        handleUpdate();
        editor.on("update", handleUpdate);

        return () => {
            editor.off("update", handleUpdate);
        };
    }, [editor]);

    return (
        <div className="macevo-latex-workspace-inner flex h-full min-h-0 w-full flex-col overflow-hidden bg-gray-100">
            
            {/* 1. BARRE D'OUTILS EN HAUT */}
            <header className="border-b border-gray-200 bg-white">
                <LatexToolbar
                    compiling={context.compiling}
                    onCompile={() => latexWorkspaceController.compile({ ...context, editor, layout })}
                    onCopy={() => latexWorkspaceController.copyLatex({ ...context, editor, layout })}
                    onDownloadTex={() => latexWorkspaceController.downloadTex({ ...context, editor, layout })}
                    onDownloadPdf={() => latexWorkspaceController.downloadPdf({ ...context, editor })}
                    onPackages={() => setPackageModalOpen(true)}
                    onSettings={() => setSettingsModalOpen(true)}
                />
            </header>

            {/* La zone mobile/tablette affiche un panneau à la fois pour
                conserver une largeur de code et un aperçu réellement lisibles. */}
            {compactLayout ? (
                <main className="macevo-latex-compact flex min-h-0 w-full flex-1 flex-col">
                    <nav className="macevo-latex-pane-tabs" aria-label="Panneaux de l’atelier LaTeX">
                        {[
                            { id: "code", label: "Code", Icon: Code2 },
                            { id: "preview", label: "Aperçu PDF", Icon: Eye },
                            { id: "console", label: "Console", Icon: TerminalSquare },
                        ].map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                type="button"
                                aria-pressed={compactPane === id}
                                className={compactPane === id ? "is-active" : ""}
                                onClick={() => setCompactPane(id)}
                            >
                                <Icon size={15} aria-hidden="true" />
                                {label}
                            </button>
                        ))}
                    </nav>
                    <section className="macevo-latex-compact-pane min-h-0 flex-1" aria-live="polite">
                        {compactPane === "code" && <LatexEditor />}
                        {compactPane === "preview" && <LatexPreview />}
                        {compactPane === "console" && <LatexConsole />}
                    </section>
                </main>
            ) : (
                <main className="macevo-latex-desktop flex min-h-0 w-full flex-1 flex-col">
                    <PanelGroup orientation="vertical" className="macevo-latex-panel-group w-full min-h-0 flex-1">
                        <Panel defaultSize="78%" minSize="40%">
                            <PanelGroup orientation="horizontal" className="macevo-latex-columns h-full w-full">
                                <Panel defaultSize="50%" minSize="32%">
                                    <section className="macevo-latex-pane h-full w-full bg-white">
                                        <LatexEditor />
                                    </section>
                                </Panel>

                                <PanelResizeHandle className="macevo-latex-separator macevo-latex-separator-x" aria-label="Redimensionner l’aperçu PDF" />

                                <Panel defaultSize="50%" minSize="32%">
                                    <aside className="macevo-latex-pane h-full w-full bg-gray-100">
                                        <LatexPreview />
                                    </aside>
                                </Panel>
                            </PanelGroup>
                        </Panel>

                        <PanelResizeHandle className="macevo-latex-separator macevo-latex-separator-y" aria-label="Redimensionner la console" />

                        <Panel defaultSize="22%" minSize="14%" maxSize="40%">
                            <div className="macevo-latex-pane h-full w-full bg-white">
                                <LatexConsole />
                            </div>
                        </Panel>
                    </PanelGroup>
                </main>
            )}

            {/* État de synchronisation réel, sans statistiques fictives. */}
            <footer className="macevo-latex-status flex h-8 shrink-0 items-center justify-between border-t border-gray-200 bg-white px-3 text-[11px] text-gray-500 sm:px-4">
                <span>{wordCount.toLocaleString("fr-FR")} mots dans le document source</span>
                <span className="ml-3 inline-flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${context.dirty ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <span className="truncate font-medium text-gray-600">
                        {context.compiling ? "Compilation en cours" : context.dirty ? "Code LaTeX modifié" : "Source synchronisée"}
                    </span>
                </span>
            </footer>

            {/* MODALES */}
            <LatexPackageModal
                isOpen={packageModalOpen}
                onClose={() => setPackageModalOpen(false)}
            />
            <LatexSettingsModal
                isOpen={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
            />

        </div>
    );
}

function LatexWorkspace() {
    return (
        <LatexProvider>
            <WorkspaceContent />
        </LatexProvider>
    );
}

export default LatexWorkspace;
