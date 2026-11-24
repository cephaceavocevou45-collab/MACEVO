/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : RibbonDivider.jsx
 * Version : 1.0.0
 * Statut  : Stable
 * ==========================================================
 */

import React, { memo } from "react";

/* ==========================================================
   COMPOSANT
========================================================== */

function RibbonDivider({

    className = "",

}) {

    return (

        <div

            className={`
                flex
                items-stretch
                justify-center
                px-2
                ${className}
            `}

        >

            <div

                className="
                    w-px
                    bg-gray-300
                    rounded-full
                    my-2
                "

            />

        </div>

    );

}
export default memo(RibbonDivider);