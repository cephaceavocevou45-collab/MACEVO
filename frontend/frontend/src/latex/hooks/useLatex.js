/**
 * ============================================================
 * MACEVO
 *
 * ---
 * Fichier : useLatex.js
 * Description : Hook central du module LaTeX
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

import { useContext } from "react";

import LatexContext from "../context/LatexContext";


/* ==========================================================
   HOOK
========================================================== */

function useLatex() {

    const context =
        useContext(LatexContext);


    if (!context) {

        throw new Error(
            "useLatex doit être utilisé à l'intérieur de LatexProvider."
        );

    }


    return context;

}


export default useLatex;