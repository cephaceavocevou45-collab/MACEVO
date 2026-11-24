import React from "react";

/**
 * ==========================================================
 * MACEVO RibbonShortcut
 * ----------------------------------------------------------
 * Affiche les raccourcis clavier dans le Ribbon.
 *
 * Exemples :
 *
 * Ctrl + S
 * Ctrl + B
 * Ctrl + Shift + P
 * Alt + Entrée
 *
 * Utilisé dans :
 *  • RibbonTooltip
 *  • RibbonDropdown
 *  • RibbonMenu
 *  • RibbonButton
 *
 * ==========================================================
 */

export default function RibbonShortcut({

    keys = [],

    className = "",

}) {

    if (!keys || keys.length === 0) return null;

    return (

        <div

            className={`
                flex
                items-center
                gap-1
                flex-wrap
                justify-center
                select-none
                ${className}
            `}

        >

            {keys.map((key, index) => (

                <React.Fragment key={index}>

                    <kbd

                        className="
                            px-2
                            py-1
                            rounded-md
                            border
                            border-gray-300
                            bg-gray-100
                            text-[10px]
                            font-semibold
                            text-gray-700
                            shadow-sm
                        "

                    >

                        {key}

                    </kbd>

                    {index < keys.length - 1 && (

                        <span

                            className="
                                text-gray-400
                                text-[10px]
                                font-semibold
                            "

                        >

                            +

                        </span>

                    )}

                </React.Fragment>

            ))}

        </div>

    );

}