/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : RibbonToggleButton.jsx
 * Version : 1.0.0
 * Statut  : Stable
 * ==========================================================
 */

import React, { memo } from "react";

import RibbonButton from "./RibbonButton";

/* ==========================================================
   COMPOSANT
========================================================== */

function RibbonToggleButton({

    pressed = false,

    onToggle,

    ...props

}) {

    const handleToggle = (event) => {

        if (typeof onToggle === "function") {

            onToggle(!pressed, event);

        }

    };
        return (

        <RibbonButton

            {...props}

            active={pressed}

            aria-pressed={pressed}

            onClick={handleToggle}

        />

    );

}
/* ==========================================================
   EXPORT
========================================================== */

export default memo(RibbonToggleButton);