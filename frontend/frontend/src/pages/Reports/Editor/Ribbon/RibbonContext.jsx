/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : RibbonContext.jsx
 * Version : 2.0.0
 * Statut  : Stable
 * ==========================================================
 */

import {

    createContext,

    useCallback,

    useContext,

    useMemo,

    useState,

} from "react";

/* ==========================================================
   CONTEXTE
========================================================== */

const RibbonContext = createContext(null);

/* ==========================================================
   PROVIDER
========================================================== */

function RibbonProvider({

    children,

}) {

    const [activeTab, setActiveTab] = useState("home");

    const [collapsed, setCollapsed] = useState(false);

    const [quickAccess, setQuickAccess] = useState([]);

    const changeTab = useCallback((tab) => {

        setActiveTab(tab);

    }, []);

    const toggleCollapsed = useCallback(() => {

        setCollapsed((state) => !state);

    }, []);    const value = useMemo(() => ({

        activeTab,

        setActiveTab: changeTab,

        collapsed,

        toggleCollapsed,

        quickAccess,

        setQuickAccess,

    }), [

        activeTab,

        changeTab,

        collapsed,

        toggleCollapsed,

        quickAccess,

    ]);

    return (

        <RibbonContext.Provider

            value={value}

        >

            {children}

        </RibbonContext.Provider>

    );

}/* ==========================================================
   HOOK
========================================================== */

function useRibbonContext() {

    const context = useContext(RibbonContext);

    if (!context) {

        throw new Error(

            "useRibbonContext doit être utilisé dans RibbonProvider."

        );

    }

    return context;

}

/* ==========================================================
   EXPORTS
========================================================== */

export {

    RibbonProvider,

    useRibbonContext,

};