/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : HomeTab.jsx
 * Version : 12.1.0
 * Statut  : Ruban Accueil (Débordement vertical autorisé pour les menus)
 * ===========================================================
 */

import DocumentGroup from "../groups/DocumentGroup";
import ClipboardGroup from "../groups/ClipboardGroup";
import HistoryGroup from "../groups/HistoryGroup";
import FontGroup from "../groups/FontGroup";
import ScienceGroup from "../groups/ScienceGroup";
import ParagraphGroup from "../groups/ParagraphGroup";

import RibbonDivider from "../components/RibbonDivider";
import { useEditorContext } from "../../EditorContext";

function HomeTab() {
    const { editor } = useEditorContext();

    if (!editor) {
        return null;
    }

    return (
        <div className="h-[108px] w-full min-w-0 bg-white select-none border-b border-slate-200 overflow-visible relative z-40">
            {/* Conteneur avec défilement horizontal fluide mais débordement vertical autorisé */}
            <div className="flex h-full w-full items-stretch overflow-x-auto overflow-y-visible px-1 py-1 scrollbar-thin">
                <div className="flex h-full min-w-max items-center gap-0 overflow-visible">

                    {/* 1. DOCUMENTS / OUTILS MACEVO */}
                    <DocumentGroup editor={editor} />
                    <RibbonDivider />

                    {/* 2. PRESSE-PAPIERS */}
                    <ClipboardGroup editor={editor} />
                    <RibbonDivider />

                    {/* 3. HISTORIQUE */}
                    <HistoryGroup editor={editor} />
                    <RibbonDivider />

                    {/* 4. POLICE (inclut les options de couleur) */}
                    <FontGroup editor={editor} />
                    <RibbonDivider />

                    {/* 5. SCIENCE & MATHS */}
                    <ScienceGroup editor={editor} />
                    <RibbonDivider />

                    {/* 6. PARAGRAPHE */}
                    <ParagraphGroup editor={editor} />

                </div>
            </div>
        </div>
    );
}

export default HomeTab;