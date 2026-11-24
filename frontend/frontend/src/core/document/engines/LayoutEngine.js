/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : LayoutEngine.js
 * Description : Gestion de la mise en page.
 * Version : 2.0.0
 * Statut : Stable
 * ============================================================
 */

import { useRef } from "react";

export function useLayoutEngine() {

    const layout = useRef({

        margins: "normal",

        orientation: "portrait",

        pageSize: "A4",

        columns: 1,

    });

    /* ==========================================
       MARGES
    ========================================== */

    function setMargins(value) {

        layout.current.margins = value;

        console.log("Marges :", value);

    }

    /* ==========================================
       ORIENTATION
    ========================================== */

    function setOrientation(value) {

        layout.current.orientation = value;

        console.log("Orientation :", value);

    }

    /* ==========================================
       TAILLE DE PAGE
    ========================================== */

    function setPageSize(value) {

        layout.current.pageSize = value;

        console.log("Taille :", value);

    }

    /* ==========================================
       COLONNES
    ========================================== */

    function setColumns(value) {

        layout.current.columns = value;

        console.log("Colonnes :", value);

    }

    /* ==========================================
       ÉTAT COMPLET
    ========================================== */

    function getLayout() {

        return layout.current;

    }

    return {

        setMargins,

        setOrientation,

        setPageSize,

        setColumns,

        getLayout,

    };

}