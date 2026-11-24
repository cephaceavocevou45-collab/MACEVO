/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : RibbonLineHeight.jsx
 * Version : 5.0.0
 * Statut  : Stable
 * Description :
 * Sélecteur d'interligne intégré au Ruban MACEVO.
 *
 * - Bouton vertical : icône + libellé
 * - Menu flottant
 * - Positionnement fixed
 * - Simple
 * - 1,15
 * - 1,5
 * - Double
 * - 2,5
 * - 3,0
 * - Synchronisation avec Tiptap
 * - Conservation de la sélection Tiptap
 * ==========================================================
 */

import {
    memo,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    AlignJustify,
    ChevronDown,
    Check,
} from "lucide-react";


/* ==========================================================
   VALEURS D'INTERLIGNE
========================================================== */

const LINE_HEIGHTS = [
    {
        label: "Simple",
        value: "1",
    },
    {
        label: "1,15",
        value: "1.15",
    },
    {
        label: "1,5",
        value: "1.5",
    },
    {
        label: "Double",
        value: "2",
    },
    {
        label: "2,5",
        value: "2.5",
    },
    {
        label: "3,0",
        value: "3",
    },
];


/* ==========================================================
   COMPOSANT
========================================================== */

function RibbonLineHeight({
    editor,
    disabled = false,
}) {
    const [open, setOpen] = useState(false);
    const [currentValue, setCurrentValue] = useState("1");

    const containerRef = useRef(null);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    /*
     * Sélection Tiptap mémorisée avant toute interaction
     * avec le ruban.
     */
    const selectionRef = useRef(null);

    const [menuPosition, setMenuPosition] = useState({
        top: 0,
        left: 0,
        width: 170,
    });


    /* ======================================================
       MÉMORISER LA SÉLECTION
    ====================================================== */

    const rememberSelection = useCallback(() => {
        if (!editor) {
            return;
        }

        const { from, to } = editor.state.selection;

        selectionRef.current = {
            from,
            to,
        };
    }, [editor]);


    /* ======================================================
       RESTAURER LA SÉLECTION
    ====================================================== */

    const restoreSelection = useCallback(() => {
        if (!editor || !selectionRef.current) {
            return;
        }

        const { from, to } = selectionRef.current;
        const maxPosition = editor.state.doc.content.size;

        const safeFrom = Math.max(
            1,
            Math.min(from, maxPosition)
        );

        const safeTo = Math.max(
            safeFrom,
            Math.min(to, maxPosition)
        );

        try {
            editor.commands.setTextSelection({
                from: safeFrom,
                to: safeTo,
            });
        } catch (error) {
            console.warn(
                "MACEVO : impossible de restaurer la sélection pour l'interligne.",
                error
            );
        }
    }, [editor]);


    /* ======================================================
       LIRE L'INTERLIGNE ACTUEL
    ====================================================== */

    const updateCurrentValue = useCallback(() => {
        if (!editor) {
            return;
        }

        const parent = editor.state.selection.$from.parent;

        const lineHeight =
            parent?.attrs?.lineHeight;

        if (!lineHeight) {
            setCurrentValue("1");
            return;
        }

        const normalized = String(lineHeight)
            .replace(",", ".")
            .replace(/px$/i, "")
            .trim();

        const matching = LINE_HEIGHTS.find(
            (item) => item.value === normalized
        );

        setCurrentValue(
            matching
                ? matching.value
                : normalized
        );
    }, [editor]);


    /* ======================================================
       SYNCHRONISATION AVEC TIPTAP
    ====================================================== */

    useEffect(() => {
        if (!editor) {
            return undefined;
        }

        updateCurrentValue();

        editor.on(
            "selectionUpdate",
            updateCurrentValue
        );

        editor.on(
            "transaction",
            updateCurrentValue
        );

        return () => {
            editor.off(
                "selectionUpdate",
                updateCurrentValue
            );

            editor.off(
                "transaction",
                updateCurrentValue
            );
        };
    }, [
        editor,
        updateCurrentValue,
    ]);


    /* ======================================================
       POSITION DU MENU
    ====================================================== */

    const updateMenuPosition = useCallback(() => {
        if (!buttonRef.current) {
            return;
        }

        const rect =
            buttonRef.current.getBoundingClientRect();

        const menuWidth = 170;

        const menuHeight = Math.min(
            LINE_HEIGHTS.length * 42 + 42,
            290
        );

        const spacing = 4;

        let top =
            rect.bottom + spacing;

        if (
            top + menuHeight >
            window.innerHeight - 8
        ) {
            top =
                rect.top -
                menuHeight -
                spacing;
        }

        let left = rect.left;

        if (
            left + menuWidth >
            window.innerWidth - 8
        ) {
            left =
                window.innerWidth -
                menuWidth -
                8;
        }

        if (left < 8) {
            left = 8;
        }

        if (top < 8) {
            top = 8;
        }

        setMenuPosition({
            top,
            left,
            width: menuWidth,
        });
    }, []);


    /* ======================================================
       OUVRIR LE MENU
    ====================================================== */

    const openMenu = useCallback(() => {
        if (
            disabled ||
            !editor
        ) {
            return;
        }

        rememberSelection();
        updateMenuPosition();
        setOpen(true);
    }, [
        disabled,
        editor,
        rememberSelection,
        updateMenuPosition,
    ]);


    /* ======================================================
       FERMER LE MENU
    ====================================================== */

    const closeMenu = useCallback(() => {
        setOpen(false);
    }, []);


    /* ======================================================
       SYNCHRONISATION POSITION
    ====================================================== */

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const frame =
            requestAnimationFrame(() => {
                updateMenuPosition();
            });

        function handleViewportChange() {
            updateMenuPosition();
        }

        window.addEventListener(
            "resize",
            handleViewportChange
        );

        window.addEventListener(
            "scroll",
            handleViewportChange,
            true
        );

        return () => {
            cancelAnimationFrame(frame);

            window.removeEventListener(
                "resize",
                handleViewportChange
            );

            window.removeEventListener(
                "scroll",
                handleViewportChange,
                true
            );
        };
    }, [
        open,
        updateMenuPosition,
    ]);


    /* ======================================================
       FERMETURE CLIC EXTÉRIEUR
    ====================================================== */

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function handleOutsideClick(event) {
            const target = event.target;

            if (
                containerRef.current &&
                containerRef.current.contains(target)
            ) {
                return;
            }

            if (
                menuRef.current &&
                menuRef.current.contains(target)
            ) {
                return;
            }

            closeMenu();
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
    }, [
        open,
        closeMenu,
    ]);


    /* ======================================================
       ESCAPE
    ====================================================== */

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function handleKeyDown(event) {
            if (event.key !== "Escape") {
                return;
            }

            closeMenu();

            if (editor) {
                restoreSelection();
                editor.commands.focus();
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
    }, [
        open,
        closeMenu,
        editor,
        restoreSelection,
    ]);


    /* ======================================================
       APPLIQUER L'INTERLIGNE
    ====================================================== */

    const handleSelect = useCallback(
        (lineHeight) => {
            if (
                !editor ||
                !lineHeight
            ) {
                return;
            }

            /*
             * La sélection est restaurée avant l'application
             * de la commande Tiptap.
             */
            restoreSelection();

            const success = editor
                .chain()
                .focus()
                .setLineHeight(lineHeight)
                .run();

            if (success) {
                setCurrentValue(lineHeight);
            }

            setOpen(false);
        },
        [
            editor,
            restoreSelection,
        ]
    );


    /* ======================================================
       ÉDITEUR NON DISPONIBLE
    ====================================================== */

    if (!editor) {
        return null;
    }


    /* ======================================================
       RENDU
    ====================================================== */

    return (
        <div
            ref={containerRef}
            className="relative shrink-0"
        >

            {/* ==================================================
                BOUTON RUBAN
            ================================================== */}

            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onMouseDown={(event) => {
                    /*
                     * Empêche le navigateur de déplacer le focus
                     * vers le bouton et de perturber la sélection.
                     */
                    event.preventDefault();

                    if (!disabled) {
                        rememberSelection();
                    }
                }}
                onClick={() => {
                    if (disabled) {
                        return;
                    }

                    if (open) {
                        closeMenu();
                    } else {
                        openMenu();
                    }
                }}
                title="Interligne"
                aria-label="Interligne"
                aria-haspopup="menu"
                aria-expanded={open}
                className={`
                    relative
                    flex
                    flex-col
                    items-center
                    justify-center
                    w-20
                    h-20
                    gap-1
                    rounded-lg
                    border
                    transition-all
                    duration-150
                    ease-in-out
                    select-none

                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-blue-500
                    focus-visible:ring-offset-2

                    ${
                        open
                            ? `
                                bg-blue-100
                                border-blue-500
                                text-blue-700
                            `
                            : `
                                bg-white
                                border-transparent
                                text-gray-700
                                hover:bg-gray-100
                                hover:shadow-md
                                hover:-translate-y-[1px]
                            `
                    }

                    ${
                        disabled
                            ? `
                                opacity-50
                                cursor-not-allowed
                            `
                            : `
                                cursor-pointer
                            `
                    }
                `}
            >

                <div className="
                    flex
                    items-center
                    justify-center
                ">
                    <AlignJustify
                        size={22}
                        strokeWidth={1.8}
                    />
                </div>

                <div className="
                    flex
                    items-center
                    justify-center
                    gap-1
                    text-[11px]
                    leading-none
                    font-medium
                    whitespace-nowrap
                ">
                    <span>
                        Interligne
                    </span>

                    <ChevronDown
                        size={12}
                        className={`
                            transition-transform
                            duration-150
                            ${open ? "rotate-180" : ""}
                        `}
                    />
                </div>

            </button>


            {/* ==================================================
                MENU
            ================================================== */}

            {open && (
                <div
                    ref={menuRef}
                    role="menu"
                    aria-label="Choisir l'interligne"
                    style={{
                        position: "fixed",
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                        width: `${menuPosition.width}px`,
                    }}
                    className="
                        z-[999999]
                        max-h-[290px]
                        overflow-y-auto
                        overscroll-contain
                        rounded-lg
                        border
                        border-gray-200
                        bg-white
                        shadow-2xl
                        py-1
                        ring-1
                        ring-black/5
                    "
                >

                    <div className="
                        px-3
                        py-2
                        border-b
                        border-gray-100
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-wide
                        text-gray-400
                        select-none
                    ">
                        Interligne
                    </div>


                    {LINE_HEIGHTS.map((item) => {
                        const selected =
                            item.value === currentValue;

                        return (
                            <button
                                key={item.value}
                                type="button"
                                role="menuitem"
                                aria-current={
                                    selected
                                        ? "true"
                                        : undefined
                                }
                                onMouseDown={(event) => {
                                    /*
                                     * Le menu ne doit pas prendre
                                     * le focus à la place de l'éditeur.
                                     */
                                    event.preventDefault();
                                }}
                                onClick={() => {
                                    handleSelect(
                                        item.value
                                    );
                                }}
                                className={`
                                    w-full
                                    min-h-[42px]
                                    flex
                                    items-center
                                    justify-between
                                    px-3
                                    text-left
                                    text-sm
                                    transition-colors
                                    duration-100

                                    ${
                                        selected
                                            ? `
                                                bg-blue-50
                                                text-blue-700
                                                font-medium
                                            `
                                            : `
                                                bg-white
                                                text-gray-700
                                            `
                                    }

                                    hover:bg-blue-50
                                    hover:text-blue-700
                                `}
                            >
                                <span>
                                    {item.label}
                                </span>

                                {selected && (
                                    <Check
                                        size={16}
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
            )}

        </div>
    );
}


export default memo(RibbonLineHeight);