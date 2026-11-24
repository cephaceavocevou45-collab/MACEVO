import React from "react";

/**
 * ==========================================================
 * MACEVO RibbonLabel
 * ----------------------------------------------------------
 * Affiche le texte d'un bouton du Ribbon.
 * Tous les boutons utilisent ce composant afin de garder
 * exactement la même typographie.
 * ==========================================================
 */

export default function RibbonLabel({

    children,

    className = "",

    lines = 2,

}) {

    return (

        <span

            className={`
                text-[11px]
                leading-tight
                font-medium
                text-gray-700
                text-center
                select-none
                overflow-hidden
                break-words
                ${className}
            `}

            style={{

                display: "-webkit-box",

                WebkitLineClamp: lines,

                WebkitBoxOrient: "vertical",

            }}

        >

            {children}

        </span>

    );

}