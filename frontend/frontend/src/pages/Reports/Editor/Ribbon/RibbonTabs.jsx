/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : RibbonTabs.jsx
 * Description : Barre des onglets principale du ruban MACEVO
 *               avec présentation inspirée de Microsoft Word.
 * Version : 3.0.0
 * Statut  : Réorganisation interface
 * ==========================================================
 */

import {
    memo,
} from "react";

import {
    useRibbonContext,
} from "./RibbonContext";


/* ==========================================================
   ONGLETS
========================================================== */

const TABS = [

    {
        id: "home",
        label: "Accueil",
    },

    {
        id: "insert",
        label: "Insertion",
    },

    {
        id: "layout",
        label: "Mise en page",
    },

    {
        id: "references",
        label: "Références",
    },

    {
        id: "review",
        label: "Révision",
    },

    {
        id: "export",
        label: "Export",
    },

    // {
    //     id: "ai",
    //     label: "IA",
    // },

    {
        id: "latex",
        label: "LaTeX",
    },

];


/* ==========================================================
   COMPOSANT
========================================================== */

function RibbonTabs() {

    const {
        activeTab,
        setActiveTab,
    } = useRibbonContext();

    const focusTab = (index) => {
        const nextTab = TABS[(index + TABS.length) % TABS.length];
        setActiveTab(nextTab.id);
        requestAnimationFrame(() => {
            document.getElementById(`macevo-ribbon-tab-${nextTab.id}`)?.focus();
        });
    };


    /* ========================================================
       RENDU
    ======================================================== */

    return (

        <nav
            aria-label="Onglets du ruban"
            role="tablist"
            className="
                macevo-ribbon-tabs
                flex
                h-11
                w-full
                shrink-0

                items-stretch

                overflow-x-auto
                overflow-y-hidden

                bg-white

                px-2

                whitespace-nowrap

                scrollbar-thin
                scrollbar-thumb-slate-300
                scrollbar-track-transparent
            "
        >

            {TABS.map(
                (tab) => {

                    const isActive =
                        activeTab === tab.id;


                    return (

                        <button
                            key={tab.id}
                            id={`macevo-ribbon-tab-${tab.id}`}

                            type="button"

                            onClick={() =>
                                setActiveTab(
                                    tab.id
                                )
                            }

                            onKeyDown={(event) => {
                                const index = TABS.findIndex((item) => item.id === tab.id);
                                if (event.key === "ArrowRight") {
                                    event.preventDefault();
                                    focusTab(index + 1);
                                } else if (event.key === "ArrowLeft") {
                                    event.preventDefault();
                                    focusTab(index - 1);
                                } else if (event.key === "Home") {
                                    event.preventDefault();
                                    focusTab(0);
                                } else if (event.key === "End") {
                                    event.preventDefault();
                                    focusTab(TABS.length - 1);
                                }
                            }}

                            aria-selected={
                                isActive
                            }

                            role="tab"
                            aria-controls="macevo-ribbon-panel"
                            tabIndex={isActive ? 0 : -1}

                            className={`
                                relative

                                flex
                                h-full
                                shrink-0

                                items-center
                                justify-center

                                px-4

                                text-[13px]
                                font-medium

                                outline-none

                                transition-colors
                                duration-150

                                focus-visible:bg-slate-100

                                ${
                                    isActive

                                        ? `
                                            text-blue-700
                                            bg-blue-50/70
                                        `

                                        : `
                                            text-slate-600
                                            hover:bg-slate-100
                                            hover:text-slate-900
                                        `
                                }
                            `}
                        >

                            <span>
                                {tab.label}
                            </span>


                            {/* =====================================
                                INDICATEUR ONGLET ACTIF
                            ===================================== */}

                            <span
                                aria-hidden="true"
                                className={`
                                    absolute

                                    bottom-0
                                    left-2
                                    right-2

                                    h-[2px]

                                    rounded-t-sm

                                    transition-opacity
                                    duration-150

                                    ${
                                        isActive

                                            ? `
                                                bg-blue-600
                                                opacity-100
                                            `

                                            : `
                                                bg-transparent
                                                opacity-0
                                            `
                                    }
                                `}
                            />

                        </button>

                    );

                }
            )}

        </nav>

    );

}


/* ==========================================================
   EXPORT
========================================================== */

export default memo(
    RibbonTabs
);
