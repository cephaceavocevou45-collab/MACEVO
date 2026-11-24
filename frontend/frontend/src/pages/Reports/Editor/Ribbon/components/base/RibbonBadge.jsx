import React from "react";

/**
 * ==========================================================
 * MACEVO RibbonBadge
 * ----------------------------------------------------------
 * Badge universel du Ribbon.
 *
 * Utilisé pour afficher :
 *  • IA
 *  • Nouveau
 *  • Bêta
 *  • Premium
 *  • Compteurs
 *
 * Ce composant est totalement indépendant
 * du RibbonButton.
 * ==========================================================
 */

const variants = {

    primary:
        "bg-blue-600 text-white",

    success:
        "bg-green-600 text-white",

    warning:
        "bg-yellow-500 text-white",

    danger:
        "bg-red-600 text-white",

    purple:
        "bg-purple-600 text-white",

    gray:
        "bg-gray-500 text-white",

};

export default function RibbonBadge({

    children,

    variant = "primary",

    className = "",

}) {

    if (!children) return null;

    return (

        <span

            className={`
                inline-flex
                items-center
                justify-center

                min-w-[18px]
                h-[18px]

                px-2

                rounded-full

                text-[10px]

                font-semibold

                whitespace-nowrap

                select-none

                shadow-sm

                ${variants[variant]}

                ${className}
            `}

        >

            {children}

        </span>

    );

}