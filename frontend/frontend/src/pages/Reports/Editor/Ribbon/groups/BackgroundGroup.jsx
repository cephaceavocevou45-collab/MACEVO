/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : BackgroundGroup.jsx
 * Version : 4.0.1
 * Statut  : Professionnel / Fonctionnel
 * Description :
 * Gestion de l'arrière-plan des pages du document scientifique.
 * Menu de couleurs affiché via React Portal.
 * ===========================================================
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
    PaintBucket,
    Palette,
    Eraser,
    Check,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";
import { useLayoutContext } from "../../LayoutContext";

/* ===========================================================
   PALETTE DE COULEURS MACEVO
=========================================================== */

const COLOR_PALETTE = [
    [
        "#000000",
        "#333333",
        "#555555",
        "#777777",
        "#999999",
        "#BBBBBB",
        "#DDDDDD",
        "#EEEEEE",
        "#F5F5F5",
        "#FFFFFF",
    ],
    [
        "#800000",
        "#FF0000",
        "#FF8000",
        "#FFFF00",
        "#00FF00",
        "#00FFFF",
        "#4169E1",
        "#0000FF",
        "#8A2BE2",
        "#FF00FF",
    ],
    [
        "#F5DEB3",
        "#FFC0CB",
        "#FFE4C4",
        "#FFFACD",
        "#E0EEE0",
        "#E0EEEE",
        "#E6F2FF",
        "#EAEAEA",
        "#E6E6FA",
        "#FFF0F5",
    ],
    [
        "#E9967A",
        "#FA8072",
        "#FFDAB9",
        "#FFEE8C",
        "#CCD9C7",
        "#B0C4DE",
        "#B0E0E6",
        "#ADD8E6",
        "#C6C2ED",
        "#D8BFD8",
    ],
    [
        "#CD5C5C",
        "#F08080",
        "#FFB347",
        "#FFE66F",
        "#A2D9A2",
        "#8FBC8F",
        "#87CEEB",
        "#6495ED",
        "#9370DB",
        "#BC8F8F",
    ],
    [
        "#A52A2A",
        "#D2143A",
        "#E67E22",
        "#F1C40F",
        "#58D68D",
        "#48929B",
        "#3498DB",
        "#1B4F72",
        "#2E1A47",
        "#5B2C6F",
    ],
    [
        "#4A0000",
        "#5C0606",
        "#654321",
        "#808000",
        "#273E0C",
        "#0B383B",
        "#1A3263",
        "#08203E",
        "#171035",
        "#380226",
    ],
];

/* ===========================================================
   THÈMES D'ARRIÈRE-PLAN
=========================================================== */

const BACKGROUND_THEMES = {
    white: "#FFFFFF",
    scientific: "#F8FAFC",
    soft: "#F3F4F6",
};

/* ===========================================================
   RECHERCHE DE LA PAGE MACEVO
=========================================================== */

/* ===========================================================
   COMPOSANT PRINCIPAL
=========================================================== */

function BackgroundGroup() {
    const { layout, setBackground } = useLayoutContext();
    const [isOpen, setIsOpen] = useState(false);

    const [customColor, setCustomColor] =
        useState("#FFFFFF");

    const [currentColor, setCurrentColor] = useState(layout.background || "#FFFFFF");

    const [dropdownStyles, setDropdownStyles] =
        useState({});

    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        setCurrentColor(layout.background || "#FFFFFF");
        setCustomColor(layout.background || "#FFFFFF");
    }, [layout.background]);

    /* ======================================================
       POSITION DU MENU
    ====================================================== */

    useEffect(() => {
        if (!isOpen || !buttonRef.current) {
            return;
        }

        function updatePosition() {
            if (!buttonRef.current) {
                return;
            }

            const rect =
                buttonRef.current.getBoundingClientRect();

            const menuWidth = 260;
            const margin = 8;

            let left = rect.left;

            /* Éviter que le menu sorte de l'écran */

            if (
                left + menuWidth >
                window.innerWidth - margin
            ) {
                left =
                    window.innerWidth -
                    menuWidth -
                    margin;
            }

            if (left < margin) {
                left = margin;
            }

            setDropdownStyles({
                position: "fixed",
                top: `${rect.bottom + 6}px`,
                left: `${left}px`,
                zIndex: 999999,
            });
        }

        updatePosition();

        window.addEventListener(
            "resize",
            updatePosition
        );

        window.addEventListener(
            "scroll",
            updatePosition,
            true
        );

        return () => {
            window.removeEventListener(
                "resize",
                updatePosition
            );

            window.removeEventListener(
                "scroll",
                updatePosition,
                true
            );
        };
    }, [isOpen]);

    /* ======================================================
       FERMETURE PAR CLIC EXTÉRIEUR
    ====================================================== */

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleClickOutside(event) {
            const clickedButton =
                buttonRef.current?.contains(
                    event.target
                );

            const clickedMenu =
                dropdownRef.current?.contains(
                    event.target
                );

            if (
                !clickedButton &&
                !clickedMenu
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, [isOpen]);

    /* ======================================================
       FERMETURE AVEC ÉCHAP
    ====================================================== */

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setIsOpen(false);
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
    }, [isOpen]);

    /* ======================================================
       APPLICATION DE LA COULEUR
    ====================================================== */

    function applyBackground(color) {
        if (!color) {
            return;
        }

        setBackground(color);
        setCurrentColor(color);
        setCustomColor(color);

        setIsOpen(false);
    }

    /* ======================================================
       COULEUR PERSONNALISÉE
    ====================================================== */

    function handleCustomColorChange(event) {
        const color = event.target.value;

        setCustomColor(color);
        applyBackground(color);
    }

    /* ======================================================
       THÈME SCIENTIFIQUE
    ====================================================== */

    function applyScientificTheme() {
        applyBackground(
            BACKGROUND_THEMES.scientific
        );
    }

    /* ======================================================
       RÉTABLIR LE BLANC
    ====================================================== */

    function resetBackground() {
        applyBackground(
            BACKGROUND_THEMES.white
        );
    }

    /* ======================================================
       ICÔNE DE SÉLECTION
    ====================================================== */

    function isSelectedColor(hex) {
        return (
            currentColor.toLowerCase() ===
            hex.toLowerCase()
        );
    }

    /* ======================================================
       RENDU
    ====================================================== */

    return (
        <>
            {/* ==================================================
               GROUPE RUBAN
            ================================================== */}

            <RibbonGroup
                title="Arrière-plan"
                className="w-[210px] min-w-[210px]"
            >
                <div className="grid w-full grid-cols-3 gap-1">

                    {/* ==================================================
                       COULEUR
                    ================================================== */}

                    <div
                        ref={buttonRef}
                        className="flex flex-col items-center"
                    >
                        <RibbonButton
                            icon={PaintBucket}
                            label="Couleur"
                            tooltip="Modifier la couleur d'arrière-plan de la page"
                            onClick={() =>
                                setIsOpen(
                                    (value) => !value
                                )
                            }
                        />
                    </div>

                    {/* ==================================================
                       THÈME
                    ================================================== */}

                    <RibbonButton
                        icon={Palette}
                        label="Thème"
                        tooltip="Appliquer le thème scientifique MACEVO"
                        onClick={
                            applyScientificTheme
                        }
                    />

                    {/* ==================================================
                       EFFACER
                    ================================================== */}

                    <RibbonButton
                        icon={Eraser}
                        label="Effacer"
                        tooltip="Rétablir l'arrière-plan blanc"
                        onClick={
                            resetBackground
                        }
                    />

                </div>
            </RibbonGroup>

            {/* ======================================================
               MENU DE COULEURS
               HORS DU RIBBON GROUP
               ====================================================== */}

            {isOpen &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        style={dropdownStyles}
                        className="
                            bg-white
                            border border-gray-300
                            shadow-2xl
                            rounded-lg
                            p-3
                            w-[260px]
                            select-none
                        "
                    >
                        {/* ==================================================
                           EN-TÊTE
                        ================================================== */}

                        <div className="flex items-center justify-between mb-3">

                            <div>
                                <div className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
                                    Arrière-plan
                                </div>

                                <div className="text-[10px] text-gray-400 mt-0.5">
                                    Couleur de la page
                                </div>
                            </div>

                            <div
                                className="w-6 h-6 rounded border border-gray-300 shadow-sm"
                                style={{
                                    backgroundColor:
                                        currentColor,
                                }}
                                title={
                                    currentColor
                                }
                            />
                        </div>

                        {/* ==================================================
                           PALETTE
                        ================================================== */}

                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Couleurs
                        </div>

                        <div className="flex flex-col gap-1.5">

                            {COLOR_PALETTE.map(
                                (
                                    row,
                                    rowIndex
                                ) => (
                                    <div
                                        key={
                                            rowIndex
                                        }
                                        className="flex justify-between gap-1"
                                    >

                                        {row.map(
                                            (
                                                hex,
                                                colIndex
                                            ) => (
                                                <button
                                                    key={
                                                        colIndex
                                                    }
                                                    type="button"
                                                    aria-label={`Choisir la couleur ${hex}`}
                                                    title={
                                                        hex
                                                    }
                                                    onClick={() =>
                                                        applyBackground(
                                                            hex
                                                        )
                                                    }
                                                    className="
                                                        relative
                                                        w-5
                                                        h-5
                                                        rounded-[3px]
                                                        border
                                                        border-gray-300
                                                        hover:scale-110
                                                        hover:border-gray-700
                                                        transition-transform
                                                        cursor-pointer
                                                    "
                                                    style={{
                                                        backgroundColor:
                                                            hex,
                                                    }}
                                                >
                                                    {isSelectedColor(
                                                        hex
                                                    ) && (
                                                        <Check
                                                            className="
                                                                absolute
                                                                inset-0
                                                                m-auto
                                                                w-3
                                                                h-3
                                                                text-white
                                                                drop-shadow
                                                            "
                                                        />
                                                    )}
                                                </button>
                                            )
                                        )}

                                    </div>
                                )
                            )}

                        </div>

                        {/* ==================================================
                           SÉPARATEUR
                        ================================================== */}

                        <div className="border-t border-gray-200 my-3" />

                        {/* ==================================================
                           COULEUR PERSONNALISÉE
                        ================================================== */}

                        <div className="flex items-center justify-between">

                            <div>
                                <div className="text-xs font-medium text-gray-700">
                                    Personnalisée
                                </div>

                                <div className="text-[10px] text-gray-400">
                                    Choisir une couleur
                                </div>
                            </div>

                            <input
                                type="color"
                                value={
                                    customColor
                                }
                                onChange={
                                    handleCustomColorChange
                                }
                                className="
                                    w-8
                                    h-8
                                    rounded
                                    border
                                    border-gray-300
                                    cursor-pointer
                                    p-0
                                    bg-transparent
                                "
                                title="Choisir une couleur personnalisée"
                            />

                        </div>

                        {/* ==================================================
                           ACTIONS RAPIDES
                        ================================================== */}

                        <div className="border-t border-gray-200 mt-3 pt-2 flex gap-2">

                            <button
                                type="button"
                                onClick={
                                    applyScientificTheme
                                }
                                className="
                                    flex-1
                                    px-2
                                    py-1.5
                                    text-[10px]
                                    font-medium
                                    text-gray-700
                                    bg-slate-50
                                    hover:bg-slate-100
                                    border
                                    border-gray-200
                                    rounded
                                    transition-colors
                                "
                            >
                                Scientifique
                            </button>

                            <button
                                type="button"
                                onClick={
                                    resetBackground
                                }
                                className="
                                    flex-1
                                    px-2
                                    py-1.5
                                    text-[10px]
                                    font-medium
                                    text-gray-700
                                    bg-white
                                    hover:bg-gray-50
                                    border
                                    border-gray-200
                                    rounded
                                    transition-colors
                                "
                            >
                                Blanc
                            </button>

                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}

export default BackgroundGroup;
