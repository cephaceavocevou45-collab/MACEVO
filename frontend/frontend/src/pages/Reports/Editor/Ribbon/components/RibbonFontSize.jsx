/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : RibbonFontSize.jsx
 * Version : 4.0.0
 * Statut  : Stable
 * Description :
 * - liste professionnelle des tailles
 * - menu déroulant flottant
 * - positionnement libre comme Word
 * - défilement indépendant
 * - fermeture avec Escape
 * ==========================================================
 */

import {
    memo,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    ChevronDown,
    Check,
} from "lucide-react";


/* ==========================================================
   TAILLES PROFESSIONNELLES
========================================================== */

const DEFAULT_SIZES = [

    8,
    9,
    10,
    11,
    12,
    14,
    16,
    18,
    20,
    22,
    24,
    26,
    28,
    30,
    32,
    36,
    40,
    44,
    48,
    54,
    60,
    66,
    72,
    80,
    88,
    96,
    108,
    120,
    132,
    144,
    156,
    168,
    180,
    192,
    200,

].map(size => ({

    label: String(size),

    value: size,

}));


/* ==========================================================
   COMPOSANT
========================================================== */

function RibbonFontSize({

    value = 12,

    sizes = DEFAULT_SIZES,

    placeholder = "Taille",

    disabled = false,

    onChange,

}) {

    const [open, setOpen] =
        useState(false);

    const containerRef =
        useRef(null);

    const buttonRef =
        useRef(null);


    /* ======================================================
       FERMETURE EXTERNE
    ====================================================== */

    useEffect(() => {

        function handleOutsideClick(event) {

            if (
                containerRef.current &&
                !containerRef.current.contains(
                    event.target
                )
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

    }, []);


    /* ======================================================
       ESCAPE
    ====================================================== */

    useEffect(() => {

        function handleEscape(event) {

            if (event.key === "Escape") {

                setOpen(false);

            }

        }

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {

            document.removeEventListener(
                "keydown",
                handleEscape
            );

        };

    }, []);


    /* ======================================================
       POSITIONNEMENT
    ====================================================== */

    function getMenuPosition() {

        const button =
            buttonRef.current;

        if (!button) {

            return {
                top: 0,
                left: 0,
            };

        }

        const rect =
            button.getBoundingClientRect();

        const menuWidth = 112;

        const menuHeight = 360;

        const padding = 8;


        let left =
            rect.left;

        let top =
            rect.bottom + 4;


        /* -----------------------------------------------
           ÉVITER LE DÉBORDEMENT HORIZONTAL
        ----------------------------------------------- */

        if (
            left + menuWidth >
            window.innerWidth - padding
        ) {

            left =
                window.innerWidth -
                menuWidth -
                padding;

        }


        left =
            Math.max(
                padding,
                left
            );


        /* -----------------------------------------------
           SI PAS ASSEZ DE PLACE EN BAS
        ----------------------------------------------- */

        if (
            top + menuHeight >
            window.innerHeight - padding
        ) {

            top =
                rect.top -
                menuHeight -
                4;

        }


        top =
            Math.max(
                padding,
                top
            );


        return {
            top,
            left,
        };

    }


    /* ======================================================
       OUVERTURE
    ====================================================== */

    function toggleDropdown(event) {

        event.preventDefault();

        if (disabled) {
            return;
        }

        setOpen(
            previous => !previous
        );

    }


    /* ======================================================
       SÉLECTION
    ====================================================== */

    function selectSize(size) {

        if (!size) {
            return;
        }

        onChange?.(size);

        setOpen(false);

    }


    /* ======================================================
       RENDU
    ====================================================== */

    return (

        <div

            ref={containerRef}

            className="
                relative
                w-28
            "

        >

            {/* ==================================================
                BOUTON
            ================================================== */}

            <button

                ref={buttonRef}

                type="button"

                disabled={disabled}

                onMouseDown={toggleDropdown}

                className="
                    w-full
                    h-10
                    flex
                    items-center
                    justify-between
                    gap-2
                    rounded-md
                    border
                    border-gray-300
                    bg-white
                    px-3
                    text-left
                    text-sm
                    outline-none
                    transition-all
                    duration-150
                    hover:border-blue-400
                    focus:border-blue-500
                    disabled:bg-gray-100
                    disabled:cursor-not-allowed
                "

            >

                <span
                    className="
                        flex-1
                        truncate
                        text-gray-800
                    "
                >

                    {value ?? placeholder}

                </span>


                <ChevronDown

                    size={16}

                    className={`
                        shrink-0
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
                MENU FLOTTANT
            ================================================== */}

            {open && (

                <div

                    style={{
                        position: "fixed",
                        zIndex: 99999,
                        ...getMenuPosition(),
                        width: "112px",
                    }}

                    className="
                        rounded-lg
                        border
                        border-gray-200
                        bg-white
                        shadow-2xl
                        overflow-hidden
                    "

                    onMouseDown={(event) => {

                        event.stopPropagation();

                    }}

                >

                    <div
                        className="
                            max-h-[360px]
                            overflow-y-auto
                            overscroll-contain
                            py-1
                        "
                    >

                        {sizes.map(size => {

                            const selected =
                                Number(value) ===
                                Number(size.value);

                            return (

                                <button

                                    key={size.value}

                                    type="button"

                                    onMouseDown={(event) => {

                                        event.preventDefault();

                                    }}

                                    onClick={() => {

                                        selectSize(size);

                                    }}

                                    className={`
                                        w-full
                                        h-9
                                        flex
                                        items-center
                                        justify-between
                                        gap-2
                                        px-3
                                        text-left
                                        text-sm
                                        transition-colors
                                        duration-100
                                        hover:bg-blue-50
                                        ${
                                            selected
                                                ? "bg-blue-50 text-blue-700"
                                                : "bg-white text-gray-800"
                                        }
                                    `}

                                >

                                    <span>

                                        {size.label}

                                    </span>


                                    {selected && (

                                        <Check

                                            size={15}

                                            className="
                                                shrink-0
                                                text-blue-600
                                            "

                                        />

                                    )}

                                </button>

                            );

                        })}

                    </div>

                </div>

            )}

        </div>

    );

}


/* ==========================================================
   EXPORT
========================================================== */

export default memo(
    RibbonFontSize
);