/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : RibbonSplitButton.jsx
 * Version : 1.0.0
 * Statut  : Stable
 * ==========================================================
 */

import React, { memo, useState, useRef, useEffect } from "react";

import { ChevronDown } from "lucide-react";

import RibbonButton from "./RibbonButton";

/* ==========================================================
   COMPOSANT
========================================================== */

function RibbonSplitButton({

    icon,

    label,

    tooltip = "",

    disabled = false,

    loading = false,

    badge = null,

    size = "medium",

    variant = "default",

    items = [],

    onClick,

}) {

    const [open, setOpen] = useState(false);

    const containerRef = useRef(null);

    const toggleMenu = () => {

        if (disabled || loading) return;

        setOpen((value) => !value);

    };

    const closeMenu = () => {

        setOpen(false);

    };

    useEffect(() => {

        const handleOutsideClick = (event) => {

            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {

                closeMenu();

            }

        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {

            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

        };

    }, []);
        return (

        <div

            ref={containerRef}

            className="relative inline-flex"

        >

            {/* =====================================
                BOUTON PRINCIPAL
            ====================================== */}

            <RibbonButton

                icon={icon}

                label={label}

                tooltip={tooltip}

                badge={badge}

                size={size}

                variant={variant}

                disabled={disabled}

                loading={loading}

                onClick={onClick}

            />

            {/* =====================================
                BOUTON MENU
            ====================================== */}

            <button

                type="button"

                onClick={toggleMenu}

                disabled={disabled || loading}

                className="

                    w-8

                    border

                    border-l-0

                    rounded-r-lg

                    bg-white

                    hover:bg-gray-100

                    transition-all

                    duration-150

                    flex

                    items-center

                    justify-center

                "

            >

                <ChevronDown size={16} />

            </button>

            {/* =====================================
                MENU
            ====================================== */}

            {open && (

                <div

                    className="

                        absolute

                        top-full

                        left-0

                        mt-1

                        min-w-[220px]

                        rounded-lg

                        border

                        bg-white

                        shadow-xl

                        z-50

                        overflow-hidden

                    "

                >

                    {items.map((item, index) => (

                        <button

                            key={index}

                            type="button"

                            className="

                                w-full

                                px-4

                                py-2

                                text-left

                                text-sm

                                hover:bg-blue-50

                                transition-colors

                            "

                            onClick={() => {

                                item.onClick?.();

                                closeMenu();

                            }}

                        >

                            {item.label}

                        </button>

                    ))}

                </div>

            )}

        </div>

    );

}
/* ==========================================================
   EXPORT
========================================================== */

export default memo(RibbonSplitButton);