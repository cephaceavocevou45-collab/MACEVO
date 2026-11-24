/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : RibbonTooltip.jsx
 * Version : 1.0.0
 * Statut  : Stable
 * ==========================================================
 */

import React, { memo } from "react";

/* ==========================================================
   COMPOSANT
========================================================== */

function RibbonTooltip({

    title,

    description = "",

    shortcut = "",

    children,

}) {

    return (

        <div className="relative group inline-flex">

            {children}

            {/* =====================================
                TOOLTIP
            ====================================== */}

            <div

                className="
                    absolute
                    left-1/2
                    top-full
                    mt-2
                    -translate-x-1/2

                    invisible
                    opacity-0

                    group-hover:visible
                    group-hover:opacity-100

                    transition-all
                    duration-150

                    z-50

                    min-w-[220px]
                    max-w-[280px]

                    rounded-lg
                    border
                    border-gray-200

                    bg-white

                    shadow-xl

                    p-3
                "

            ></div>
                            {/* =====================================
                    TITRE
                ====================================== */}

                <h4

                    className="
                        text-sm
                        font-semibold
                        text-gray-800
                    "

                >

                    {title}

                </h4>

                {/* =====================================
                    DESCRIPTION
                ====================================== */}

                {description && (

                    <p

                        className="
                            mt-1
                            text-xs
                            leading-5
                            text-gray-600
                        "

                    >

                        {description}

                    </p>

                )}

                {/* =====================================
                    RACCOURCI
                ====================================== */}

                {shortcut && (

                    <div

                        className="
                            mt-3
                            border-t
                            pt-2

                            text-[11px]

                            text-gray-500

                            font-medium
                        "

                    >

                        {shortcut}

                    </div>

                )}

            </div>


    );

}
/* ==========================================================
   EXPORT
========================================================== */

export default memo(RibbonTooltip);