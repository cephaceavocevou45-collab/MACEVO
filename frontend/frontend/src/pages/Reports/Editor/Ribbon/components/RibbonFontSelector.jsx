/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : RibbonFontSelector.jsx
 * Version : 6.0.0
 * Statut  : Stable
 * Description :
 * - recherche partielle
 * - recherche insensible à la casse
 * - aperçu visuel des polices
 * - compteur dynamique
 * - polices récentes
 * - polices du thème
 * - toutes les polices
 * - menu déroulant libre comme Word
 * - menu positionné en fixed pour éviter le clipping
 * ==========================================================
 */

import {
    memo,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    ChevronDown,
    Search,
    Check,
} from "lucide-react";


/* ==========================================================
   POLICES
========================================================== */

const DEFAULT_FONTS = [

    {
        label: "Aptos",
        value: "Aptos",
        source: "Microsoft",
        category: "sans",
        theme: true,
    },

    {
        label: "Aptos Display",
        value: "Aptos Display",
        source: "Microsoft",
        category: "sans",
        theme: true,
    },

    {
        label: "Aptos Narrow",
        value: "Aptos Narrow",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Arial",
        value: "Arial",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Arial Black",
        value: "Arial Black",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Arial Narrow",
        value: "Arial Narrow",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Calibri",
        value: "Calibri",
        source: "Microsoft",
        category: "sans",
        theme: true,
    },

    {
        label: "Calibri Light",
        value: "Calibri Light",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Cambria",
        value: "Cambria",
        source: "Microsoft",
        category: "serif",
    },

    {
        label: "Cambria Math",
        value: "Cambria Math",
        source: "Microsoft",
        category: "serif",
    },

    {
        label: "Candara",
        value: "Candara",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Century Gothic",
        value: "Century Gothic",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Comic Sans MS",
        value: "Comic Sans MS",
        source: "Microsoft",
        category: "handwriting",
    },

    {
        label: "Consolas",
        value: "Consolas",
        source: "Microsoft",
        category: "mono",
    },

    {
        label: "Corbel",
        value: "Corbel",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Courier New",
        value: "Courier New",
        source: "Microsoft",
        category: "mono",
    },

    {
        label: "Franklin Gothic Medium",
        value: "Franklin Gothic Medium",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Gill Sans",
        value: "Gill Sans",
        source: "Classic",
        category: "sans",
    },

    {
        label: "Georgia",
        value: "Georgia",
        source: "Microsoft",
        category: "serif",
    },

    {
        label: "Garamond",
        value: "Garamond",
        source: "Microsoft",
        category: "serif",
    },

    {
        label: "Impact",
        value: "Impact",
        source: "Microsoft",
        category: "display",
    },

    {
        label: "Lucida Console",
        value: "Lucida Console",
        source: "Microsoft",
        category: "mono",
    },

    {
        label: "Lucida Sans",
        value: "Lucida Sans",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Lucida Handwriting",
        value: "Lucida Handwriting",
        source: "Microsoft",
        category: "handwriting",
    },

    {
        label: "Palatino Linotype",
        value: "Palatino Linotype",
        source: "Microsoft",
        category: "serif",
    },

    {
        label: "Segoe UI",
        value: "Segoe UI",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Segoe UI Light",
        value: "Segoe UI Light",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Segoe UI Semibold",
        value: "Segoe UI Semibold",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Tahoma",
        value: "Tahoma",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Times New Roman",
        value: "Times New Roman",
        source: "Microsoft",
        category: "serif",
    },

    {
        label: "Trebuchet MS",
        value: "Trebuchet MS",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Verdana",
        value: "Verdana",
        source: "Microsoft",
        category: "sans",
    },

    {
        label: "Baskerville",
        value: "Baskerville",
        source: "Classic",
        category: "serif",
    },

    {
        label: "Book Antiqua",
        value: "Book Antiqua",
        source: "Classic",
        category: "serif",
    },

    {
        label: "Bookman Old Style",
        value: "Bookman Old Style",
        source: "Classic",
        category: "serif",
    },

    {
        label: "Bodoni 72",
        value: "Bodoni 72",
        source: "Classic",
        category: "serif",
    },

    {
        label: "Copperplate",
        value: "Copperplate",
        source: "Classic",
        category: "display",
    },

    {
        label: "Perpetua",
        value: "Perpetua",
        source: "Classic",
        category: "serif",
    },

    {
        label: "Rockwell",
        value: "Rockwell",
        source: "Classic",
        category: "serif",
    },

    {
        label: "Rockwell Extra Bold",
        value: "Rockwell Extra Bold",
        source: "Classic",
        category: "serif",
    },

    {
        label: "Cascadia Code",
        value: "Cascadia Code",
        source: "Microsoft",
        category: "mono",
    },

    {
        label: "Cascadia Mono",
        value: "Cascadia Mono",
        source: "Microsoft",
        category: "mono",
    },

    {
        label: "Monaco",
        value: "Monaco",
        source: "Classic",
        category: "mono",
    },

    {
        label: "MS Gothic",
        value: "MS Gothic",
        source: "Microsoft",
        category: "mono",
    },

    {
        label: "MS Mincho",
        value: "MS Mincho",
        source: "Microsoft",
        category: "serif",
    },

    {
        label: "Inter",
        value: "Inter",
        source: "Google",
        category: "sans",
    },

    {
        label: "Lato",
        value: "Lato",
        source: "Google",
        category: "sans",
    },

    {
        label: "Libre Baskerville",
        value: "Libre Baskerville",
        source: "Google",
        category: "serif",
    },

    {
        label: "Merriweather",
        value: "Merriweather",
        source: "Google",
        category: "serif",
    },

    {
        label: "Montserrat",
        value: "Montserrat",
        source: "Google",
        category: "sans",
    },

    {
        label: "Nunito",
        value: "Nunito",
        source: "Google",
        category: "sans",
    },

    {
        label: "Nunito Sans",
        value: "Nunito Sans",
        source: "Google",
        category: "sans",
    },

    {
        label: "Open Sans",
        value: "Open Sans",
        source: "Google",
        category: "sans",
    },

    {
        label: "Oswald",
        value: "Oswald",
        source: "Google",
        category: "sans",
    },

    {
        label: "Playfair Display",
        value: "Playfair Display",
        source: "Google",
        category: "serif",
    },

    {
        label: "Poppins",
        value: "Poppins",
        source: "Google",
        category: "sans",
    },

    {
        label: "Raleway",
        value: "Raleway",
        source: "Google",
        category: "sans",
    },

    {
        label: "Roboto",
        value: "Roboto",
        source: "Google",
        category: "sans",
    },

    {
        label: "Roboto Slab",
        value: "Roboto Slab",
        source: "Google",
        category: "serif",
    },

    {
        label: "Source Sans 3",
        value: "Source Sans 3",
        source: "Google",
        category: "sans",
    },

    {
        label: "Source Serif 4",
        value: "Source Serif 4",
        source: "Google",
        category: "serif",
    },

];


/* ==========================================================
   UTILITAIRES
========================================================== */

function normalizeText(value) {

    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


/* ==========================================================
   COMPOSANT
========================================================== */

function RibbonFontSelector({

    value = "Calibri",

    fonts = DEFAULT_FONTS,

    placeholder = "Police",

    disabled = false,

    onChange,

}) {

    const [open, setOpen] =
        useState(false);

    const [search, setSearch] =
        useState("");

    const [recentFonts, setRecentFonts] =
        useState([]);

    const containerRef =
        useRef(null);

    const buttonRef =
        useRef(null);

    const searchRef =
        useRef(null);


    /* ======================================================
       POLICE ACTUELLE
    ====================================================== */

    const currentFont =
        fonts.find(
            font =>
                font.value === value
        ) || {

            label: value,

            value,

            source: "",

            category: "sans",

        };


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
                setSearch("");

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
       FERMETURE ESCAPE
    ====================================================== */

    useEffect(() => {

        function handleEscape(event) {

            if (event.key !== "Escape") {
                return;
            }

            setOpen(false);
            setSearch("");

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
       FOCUS RECHERCHE
    ====================================================== */

    useEffect(() => {

        if (!open) {
            return;
        }

        requestAnimationFrame(() => {

            searchRef.current?.focus();

        });

    }, [open]);


    /* ======================================================
       POLICES RÉCENTES
    ====================================================== */

    function updateRecentFonts(font) {

        setRecentFonts(previous => {

            const filtered =
                previous.filter(
                    item =>
                        item.value !==
                        font.value
                );

            return [
                font,
                ...filtered,
            ].slice(0, 8);

        });

    }


    /* ======================================================
       RECHERCHE
    ====================================================== */

    const normalizedSearch =
        normalizeText(search);


    const filteredFonts =
        useMemo(() => {

            if (!normalizedSearch) {
                return fonts;
            }

            return fonts.filter(font => {

                const name =
                    normalizeText(
                        font.label
                    );

                return name.includes(
                    normalizedSearch
                );

            });

        }, [
            fonts,
            normalizedSearch,
        ]);


    /* ======================================================
       GROUPES
    ====================================================== */

    const themeFonts =
        filteredFonts.filter(
            font => font.theme
        );


    const recentFiltered =
        recentFonts.filter(font => {

            if (!normalizedSearch) {
                return true;
            }

            return normalizeText(
                font.label
            ).includes(
                normalizedSearch
            );

        });


    /* ======================================================
       SÉLECTION
    ====================================================== */

    function selectFont(font) {

        if (!font) {
            return;
        }

        updateRecentFonts(font);

        onChange?.(font);

        setOpen(false);

        setSearch("");

    }


    /* ======================================================
       RENDU D'UNE POLICE
    ====================================================== */

    function renderFontItem(font) {

        const selected =
            value === font.value;

        return (

            <button

                key={font.value}

                type="button"

                onMouseDown={(event) => {

                    event.preventDefault();

                }}

                onClick={() => {

                    selectFont(font);

                }}

                className={`
                    w-full
                    flex
                    items-center
                    gap-2
                    px-3
                    py-2.5
                    text-left
                    transition-colors
                    duration-100
                    hover:bg-blue-50
                    ${
                        selected
                            ? "bg-blue-50"
                            : "bg-white"
                    }
                `}

            >

                <div
                    className="
                        min-w-0
                        flex-1
                    "
                >

                    <div

                        className="
                            text-[15px]
                            leading-6
                            truncate
                            text-gray-800
                        "

                        style={{
                            fontFamily:
                                `"${font.value}", sans-serif`,
                        }}

                    >

                        {font.label}

                    </div>

                </div>


                {font.source && (

                    <span
                        className="
                            shrink-0
                            text-[9px]
                            uppercase
                            tracking-wide
                            font-semibold
                            text-gray-400
                        "
                    >

                        {font.source}

                    </span>

                )}


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

    }


    /* ======================================================
       POSITIONNEMENT DU MENU
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

        const menuWidth = 340;

        const viewportPadding = 8;

        let left = rect.left;

        if (
            left + menuWidth >
            window.innerWidth - viewportPadding
        ) {

            left =
                window.innerWidth -
                menuWidth -
                viewportPadding;

        }

        left =
            Math.max(
                viewportPadding,
                left
            );


        const menuHeight = 500;

        let top =
            rect.bottom + 4;

        if (
            top + menuHeight >
            window.innerHeight -
            viewportPadding
        ) {

            top =
                rect.top -
                menuHeight -
                4;

        }

        top =
            Math.max(
                viewportPadding,
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
       RENDU
    ====================================================== */

    return (

        <div

            ref={containerRef}

            className="
                relative
                w-56
            "

        >

            {/* ==================================================
                BOUTON PRINCIPAL
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
                        min-w-0
                        flex-1
                        truncate
                        text-gray-800
                    "

                    style={{
                        fontFamily:
                            `"${currentFont.value}", sans-serif`,
                    }}

                >

                    {currentFont.label ||
                        placeholder}

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
                        width: "340px",
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

                    {/* ==========================================
                        RECHERCHE
                    ========================================== */}

                    <div
                        className="
                            p-2.5
                            border-b
                            border-gray-200
                            bg-white
                        "
                    >

                        <div
                            className="
                                relative
                            "
                        >

                            <Search

                                size={16}

                                className="
                                    absolute
                                    left-3
                                    top-1/2
                                    -translate-y-1/2
                                    text-gray-400
                                    pointer-events-none
                                "

                            />


                            <input

                                ref={searchRef}

                                type="search"

                                value={search}

                                onChange={(event) => {

                                    setSearch(
                                        event.target.value
                                    );

                                }}

                                placeholder="
                                    Rechercher une police...
                                "

                                className="
                                    w-full
                                    h-10
                                    rounded-md
                                    border
                                    border-gray-300
                                    bg-white
                                    pl-9
                                    pr-3
                                    text-sm
                                    text-gray-800
                                    outline-none
                                    placeholder:text-gray-400
                                    focus:border-blue-500
                                    focus:ring-2
                                    focus:ring-blue-500/20
                                "

                            />

                        </div>

                    </div>


                    {/* ==========================================
                        COMPTEUR
                    ========================================== */}

                    <div
                        className="
                            px-3
                            py-2
                            border-b
                            border-gray-100
                            text-[11px]
                            text-gray-500
                            bg-gray-50
                        "
                    >

                        {filteredFonts.length}{" "}

                        {filteredFonts.length <= 1
                            ? "police"
                            : "polices"
                        }

                    </div>


                    {/* ==========================================
                        LISTE
                    ========================================== */}

                    <div
                        className="
                            max-h-[430px]
                            overflow-y-auto
                            overscroll-contain
                        "
                    >

                        {normalizedSearch ? (

                            filteredFonts.length > 0 ? (

                                <div className="py-1">

                                    {filteredFonts.map(
                                        renderFontItem
                                    )}

                                </div>

                            ) : (

                                <div
                                    className="
                                        px-4
                                        py-8
                                        text-center
                                        text-sm
                                        text-gray-500
                                    "
                                >

                                    Aucune police trouvée.

                                </div>

                            )

                        ) : (

                            <>

                                {/* =================================
                                    THÈME
                                ================================= */}

                                {themeFonts.length > 0 && (

                                    <div>

                                        <div
                                            className="
                                                px-3
                                                pt-3
                                                pb-1.5
                                                text-[11px]
                                                font-bold
                                                uppercase
                                                tracking-wide
                                                text-gray-500
                                                bg-white
                                            "
                                        >

                                            Polices du thème

                                        </div>


                                        {themeFonts.map(
                                            renderFontItem
                                        )}

                                    </div>

                                )}


                                {/* =================================
                                    RÉCENTES
                                ================================= */}

                                {recentFiltered.length > 0 && (

                                    <div>

                                        <div
                                            className="
                                                mt-2
                                                px-3
                                                pt-3
                                                pb-1.5
                                                border-t
                                                border-gray-100
                                                text-[11px]
                                                font-bold
                                                uppercase
                                                tracking-wide
                                                text-gray-500
                                                bg-white
                                            "
                                        >

                                            Polices utilisées récemment

                                        </div>


                                        {recentFiltered.map(
                                            renderFontItem
                                        )}

                                    </div>

                                )}


                                {/* =================================
                                    TOUTES
                                ================================= */}

                                <div>

                                    <div
                                        className="
                                            mt-2
                                            px-3
                                            pt-3
                                            pb-1.5
                                            border-t
                                            border-gray-100
                                            text-[11px]
                                            font-bold
                                            uppercase
                                            tracking-wide
                                            text-gray-500
                                            bg-white
                                        "
                                    >

                                        Toutes les polices

                                    </div>


                                    {fonts.map(
                                        renderFontItem
                                    )}

                                </div>

                            </>

                        )}

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
    RibbonFontSelector
);