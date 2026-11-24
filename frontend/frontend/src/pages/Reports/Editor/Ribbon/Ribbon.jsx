/**
 * ===========================================================
 * MACEVO
 *
 * -----------------------------------------------------------
 * Fichier : Ribbon.jsx
 * Description : Contenu principal du ruban MACEVO
 * Version : 5.0.1
 * Statut  : Stabilisation
 * ===========================================================
 */

import { lazy, Suspense } from "react";
import { useRibbonContext } from "./RibbonContext";

const TAB_COMPONENTS = {
    home: lazy(() => import("./tabs/HomeTab")),
    insert: lazy(() => import("./tabs/InsertTab")),
    layout: lazy(() => import("./tabs/LayoutTab")),
    references: lazy(() => import("./tabs/ReferencesTab")),
    review: lazy(() => import("./tabs/ReviewTab")),
    export: lazy(() => import("./tabs/ExportTab")),
    latex: lazy(() => import("./tabs/LatexTab")),
};


function Ribbon() {

    const { activeTab } = useRibbonContext();
    const ActiveTab = TAB_COMPONENTS[activeTab] || TAB_COMPONENTS.home;
    const tabLabel = {
        home: "Accueil",
        insert: "Insertion",
        layout: "Mise en page",
        references: "Références",
        review: "Révision",
        export: "Export",
        latex: "LaTeX",
    }[activeTab] || "Accueil";

    return (

        <div
            id="macevo-ribbon-panel"
            role="tabpanel"
            aria-labelledby={`macevo-ribbon-tab-${activeTab}`}
            className={`macevo-ribbon-panel w-full bg-white ${activeTab === "latex" ? "is-workspace" : ""}`}
        >

            <Suspense fallback={<div className="macevo-ribbon-content min-h-[96px] px-5 py-4 text-xs text-slate-500" role="status">Chargement des outils…</div>}>
                <div className="macevo-ribbon-content" data-ribbon-section={tabLabel}>
                    <ActiveTab />
                </div>
            </Suspense>

        </div>

    );

}


export default Ribbon;
