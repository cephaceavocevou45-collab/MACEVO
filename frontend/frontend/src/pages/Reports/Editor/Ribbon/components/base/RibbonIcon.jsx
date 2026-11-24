import React from "react";

/**
 * ==========================================================
 * MACEVO RibbonIcon
 * ----------------------------------------------------------
 * Composant chargé d'afficher une icône dans le Ribbon.
 * Ce composant est volontairement indépendant de Lucide,
 * HeroIcons ou toute autre bibliothèque.
 * ==========================================================
 */

export default function RibbonIcon({

    icon: Icon,

    size = 22,

    color = "currentColor",

    className = "",

}) {

    if (!Icon) return null;

    return (

        <div

            className={`
                flex
                items-center
                justify-center
                pointer-events-none
                ${className}
            `}

            aria-hidden="true"

        >

            <Icon

                size={size}

                color={color}

                strokeWidth={1.8}

            />

        </div>

    );

}