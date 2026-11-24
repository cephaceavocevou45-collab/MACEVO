/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : SpellingContext.jsx
 * Description : Context du moteur d'orthographe.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

import React, {
    createContext,
    useContext,
    useState,
} from "react";

import spellingEngine from "../../../core/document/engines/language/SpellingEngine";

/* ==========================================================
   CONTEXT
========================================================== */

const SpellingContext = createContext(null);

/* ==========================================================
   PROVIDER
========================================================== */

export function SpellingProvider({ children }) {

    const [errors, setErrors] = useState([]);

    const [language, setLanguage] = useState(

        spellingEngine.getLanguage()

    );

    /* ======================================================
       ANALYSER
    ====================================================== */

    async function check(text) {

        const result = await spellingEngine.check(text);

        setErrors(result);

        return result;

    }

    /* ======================================================
       CORRIGER TOUT
    ====================================================== */

    function applyAll() {

        return spellingEngine.applyAll();

    }

    /* ======================================================
       SUGGESTIONS
    ====================================================== */

    function suggestions(index) {

        return spellingEngine.getSuggestions(index);

    }

    /* ======================================================
       LANGUE
    ====================================================== */

    function changeLanguage(lang) {

        spellingEngine.setLanguage(lang);

        setLanguage(lang);

    }

    /* ======================================================
       RESET
    ====================================================== */

    function reset() {

        spellingEngine.reset();

        setErrors([]);

    }

    /* ======================================================
       API
    ====================================================== */

    const value = {

        errors,

        language,

        check,

        applyAll,

        suggestions,

        changeLanguage,

        reset,

    };

    return (

        <SpellingContext.Provider value={value}>

            {children}

        </SpellingContext.Provider>

    );

}

/* ==========================================================
   HOOK
========================================================== */

export function useSpellingContext() {

    const context = useContext(

        SpellingContext

    );

    if (!context) {

        throw new Error(

            "useSpellingContext doit être utilisé dans SpellingProvider."

        );

    }

    return context;

}