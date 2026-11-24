/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : RibbonDropdown.jsx
 * Version : 7.0.0
 * Statut  : Correction menu déroulant
 * Description :
 * Menu déroulant personnalisé avec affichage libre
 * au-dessus de la Ribbon et défilement vertical.
 * ==========================================================
 */

import {
    memo,
    useEffect,
    useRef,
    useState,
} from "react";

import { createPortal } from "react-dom";

import {
    ChevronDown,
    Check,
} from "lucide-react";


/* ==========================================================
   COMPOSANT
========================================================== */

function RibbonDropdown({

    value,

    items = [],

    placeholder = "Sélectionner",

    disabled = false,

    className = "",

    onChange,

}) {

    /* ======================================================
       ÉTAT
    ====================================================== */

    const [open, setOpen] =
        useState(false);

    const [menuPosition, setMenuPosition] =
        useState(null);


    /* ======================================================
       RÉFÉRENCES
    ====================================================== */

    const containerRef =
        useRef(null);

    const buttonRef =
        useRef(null);

    const menuRef =
        useRef(null);


    /* ======================================================
       ÉLÉMENT SÉLECTIONNÉ
    ====================================================== */

    const selectedItem =
        items.find(
            item =>
                String(item.value) ===
                String(value)
        ) || null;


    /* ======================================================
       POSITION DU MENU
    ====================================================== */

    function updateMenuPosition() {

        if (!buttonRef.current) {
            return;
        }

        const rect =
            buttonRef.current.getBoundingClientRect();


        const menuWidth =
            rect.width;


        /*
         * Hauteur maximale du menu.
         *
         * On laisse toujours un espace
         * raisonnable en bas de l'écran.
         */

        const availableHeight =
            Math.max(
                180,
                window.innerHeight -
                rect.bottom -
                16
            );


        /*
         * Par défaut :
         * ouverture vers le bas.
         */

        let top =
            rect.bottom + 4;


        /*
         * Si le menu ne tient pas
         * suffisamment en dessous,
         * on l'ouvre vers le haut.
         */

        const estimatedMenuHeight =
            Math.min(
                420,
                items.length * 44 + 8
            );


        if (
            rect.bottom +
            estimatedMenuHeight >
            window.innerHeight - 16
        ) {

            top =
                rect.top -
                Math.min(
                    estimatedMenuHeight,
                    window.innerHeight - 32
                ) -
                4;

        }


        /*
         * Empêche le menu de sortir
         * de l'écran.
         */

        top =
            Math.max(
                8,
                Math.min(
                    top,
                    window.innerHeight -
                    Math.min(
                        estimatedMenuHeight,
                        availableHeight
                    ) -
                    8
                )
            );


        setMenuPosition({

            top,

            left: rect.left,

            width: menuWidth,

            maxHeight:
                Math.min(
                    420,
                    availableHeight
                ),

        });

    }


    /* ======================================================
       OUVERTURE / FERMETURE
    ====================================================== */

    function toggleDropdown() {

        if (disabled) {
            return;
        }

        setOpen(
            previous => !previous
        );

    }


    /* ======================================================
       POSITION APRÈS OUVERTURE
    ====================================================== */

    useEffect(() => {

        if (!open) {

            setMenuPosition(null);

            return;

        }


        /*
         * Position initiale.
         */

        requestAnimationFrame(() => {

            updateMenuPosition();

        });


        /*
         * Repositionnement si la fenêtre
         * change de taille.
         */

        function handleResize() {

            updateMenuPosition();

        }


        /*
         * La page peut défiler.
         *
         * Le menu étant en position fixed,
         * il faut suivre le bouton.
         */

        function handleScroll() {

            updateMenuPosition();

        }


        window.addEventListener(
            "resize",
            handleResize
        );

        window.addEventListener(
            "scroll",
            handleScroll,
            true
        );


        return () => {

            window.removeEventListener(
                "resize",
                handleResize
            );

            window.removeEventListener(
                "scroll",
                handleScroll,
                true
            );

        };

    }, [
        open,
        items.length,
    ]);


    /* ======================================================
       FERMETURE EXTÉRIEURE
    ====================================================== */

    useEffect(() => {

        if (!open) {
            return;
        }


        function handleOutsideClick(event) {

            const target =
                event.target;


            const insideContainer =
                containerRef.current &&
                containerRef.current.contains(
                    target
                );


            const insideMenu =
                menuRef.current &&
                menuRef.current.contains(
                    target
                );


            if (
                !insideContainer &&
                !insideMenu
            ) {

                setOpen(false);

            }

        }


        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );


        return () => {

            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

        };

    }, [open]);


    /* ======================================================
       ESC
    ====================================================== */

    useEffect(() => {

        function handleKeyDown(event) {

            if (
                event.key === "Escape" &&
                open
            ) {

                setOpen(false);

            }

        }


        document.addEventListener(
            "keydown",
            handleKeyDown
        );


        return () => {

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

        };

    }, [open]);


    /* ======================================================
       SÉLECTION
    ====================================================== */

    function handleSelect(item) {

        if (disabled || !item) {
            return;
        }


        if (onChange) {

            onChange(item);

        }


        setOpen(false);

    }


    /* ======================================================
       MENU
    ====================================================== */

    const menu = (

        <div

            ref={menuRef}

            className="
                fixed
                z-[99999]

                overflow-y-auto
                overscroll-contain

                rounded-lg

                border
                border-gray-200

                bg-white

                shadow-2xl

                py-1
            "

            style={{

                top:
                    menuPosition?.top ??
                    0,

                left:
                    menuPosition?.left ??
                    0,

                width:
                    menuPosition?.width ??
                    224,

                maxHeight:
                    menuPosition?.maxHeight ??
                    420,

            }}

        >

            {items.length === 0 ? (

                <div
                    className="
                        px-4
                        py-3
                        text-sm
                        text-gray-500
                    "
                >

                    Aucun élément

                </div>

            ) : (

                items.map((item) => {

                    const isSelected =
                        String(item.value) ===
                        String(value);


                    return (

                        <button

                            key={
                                String(
                                    item.value
                                )
                            }

                            type="button"

                            onMouseDown={(
                                event
                            ) => {

                                /*
                                 * Empêche Tiptap
                                 * de perdre sa sélection.
                                 */

                                event.preventDefault();

                            }}

                            onClick={() => {

                                handleSelect(
                                    item
                                );

                            }}

                            className={`

                                group

                                flex
                                items-center
                                justify-between

                                w-full

                                px-4
                                py-2.5

                                text-left

                                transition-colors
                                duration-100

                                ${
                                    isSelected
                                        ? "bg-blue-50"
                                        : "bg-white"
                                }

                                hover:bg-blue-50

                            `}

                        >

                            <span

                                className="
                                    min-w-0
                                    flex-1
                                    truncate
                                    text-[16px]
                                    text-gray-800
                                "

                                style={{

                                    fontFamily:
                                        `"${item.value}", sans-serif`,

                                }}

                            >

                                {item.label}

                            </span>


                            {isSelected && (

                                <Check

                                    size={17}

                                    className="
                                        ml-3
                                        shrink-0
                                        text-blue-600
                                    "

                                />

                            )}

                        </button>

                    );

                })

            )}

        </div>

    );


    /* ======================================================
       RENDU
    ====================================================== */

    return (

        <div

            ref={containerRef}

            className={`
                relative
                w-56
                ${className}
            `}

        >

            {/* ==================================================
                BOUTON
            ================================================== */}

            <button

                ref={buttonRef}

                type="button"

                disabled={disabled}

                onMouseDown={(event) => {

                    /*
                     * Empêche la Ribbon de prendre
                     * le focus de l'éditeur Tiptap.
                     */

                    event.preventDefault();

                }}

                onClick={toggleDropdown}

                className="
                    flex
                    items-center
                    justify-between

                    w-full
                    min-h-10

                    rounded-md

                    border
                    border-gray-300

                    bg-white

                    px-3
                    py-2

                    text-sm
                    text-gray-800

                    outline-none

                    transition-all
                    duration-150

                    hover:border-blue-400

                    focus:border-blue-500

                    focus:ring-2
                    focus:ring-blue-500/20

                    disabled:bg-gray-100
                    disabled:text-gray-400
                    disabled:cursor-not-allowed
                "

            >

                <span

                    className="
                        min-w-0
                        flex-1
                        truncate
                        text-left
                        text-[15px]
                    "

                    style={{

                        fontFamily:
                            selectedItem?.value
                                ? `"${selectedItem.value}", sans-serif`
                                : undefined,

                    }}

                >

                    {selectedItem?.label ||
                        placeholder}

                </span>


                <ChevronDown

                    size={16}

                    className={`

                        shrink-0

                        ml-2

                        text-gray-500

                        transition-transform
                        duration-150

                        ${
                            open
                                ? "rotate-180"
                                : ""
                        }

                    `}

                />

            </button>


            {/* ==================================================
                MENU PORTAL
            ================================================== */}

            {open &&
                menuPosition &&
                typeof document !== "undefined" &&
                createPortal(
                    menu,
                    document.body
                )
            }

        </div>

    );

}


/* ==========================================================
   EXPORT
========================================================== */

export default memo(
    RibbonDropdown
);