/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : CommentContext.jsx
 * Description : Contexte global du moteur de commentaires.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

import React, {
    createContext,
    useContext,
} from "react";

import useCommentEngine from "../../../core/document/engines/CommentEngine";

/* ==========================================================
   CONTEXTE
========================================================== */

const CommentContext = createContext(null);

/* ==========================================================
   PROVIDER
========================================================== */

function CommentProvider({ children }) {

    const commentEngine = useCommentEngine();

    return (

        <CommentContext.Provider
            value={commentEngine}
        >

            {children}

        </CommentContext.Provider>

    );

}

/* ==========================================================
   HOOK
========================================================== */

function useCommentContext() {

    const context = useContext(CommentContext);

    if (!context) {

        throw new Error(

            "useCommentContext doit être utilisé à l'intérieur de CommentProvider."

        );

    }

    return context;

}

/* ==========================================================
   EXPORTS
========================================================== */

export {

    CommentProvider,

    useCommentContext,

};