/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : BordersGroup.jsx
 * Version : 7.0.0
 * Statut  : Professionnel - Bordures de page
 * ===========================================================
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    Square,
    Trash2,
    X,
    Sparkles,
    Eye,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";
import { useLayoutContext } from "../../LayoutContext";

function BordersGroup() {
    const layoutContext = useLayoutContext() || {};

    const {
        layout,
        setBorders,
    } = layoutContext;

    const currentBorders = layout?.borders || "none";

    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const [borderStyle, setBorderStyle] = useState("solid");
    const [borderWidth, setBorderWidth] = useState(2);
    const [borderColor, setBorderColor] = useState("#2563eb");

    const modalRef = useRef(null);

    useEffect(() => {
        if (currentBorders && typeof currentBorders === "object") {
            setBorderStyle(currentBorders.style || "solid");
            setBorderWidth(Number(currentBorders.width) || 2);
            setBorderColor(currentBorders.color || "#2563eb");
        }
    }, [currentBorders]);

    /* ======================================================
       RÉCUPÉRATION DE LA PAGE MACEVO
    ====================================================== */

    function getPageElement() {
        return (
            document.getElementById("macevo-page") ||
            document.querySelector(
                ".macevo-pagination-page"
            ) ||
            document.querySelector(
                ".bg-white.shadow-\\[0_2px_12px_rgba\\(15\\,23\\,42\\,0\\.15\\)\\]"
            ) ||
            document.querySelector(
                ".bg-white.shadow-lg"
            ) ||
            document.querySelector(
                ".bg-white.shadow-md"
            )
        );
    }

    /* ======================================================
       APPLICATION DE LA BORDURE
    ====================================================== */

    function applyBorderStyle() {
        setBorders?.({ style: borderStyle, width: Number(borderWidth), color: borderColor });

        setIsConfigOpen(false);
    }

    /* ======================================================
       SUPPRESSION DE LA BORDURE
    ====================================================== */

    function removeBorders() {
        setBorders?.("none");

        setIsConfigOpen(false);
    }

    /* ======================================================
       OUVERTURE DE LA CONFIGURATION
    ====================================================== */

    function openConfiguration() {
        setIsConfigOpen(true);
    }

    /* ======================================================
       FERMETURE AVEC ÉCHAP
    ====================================================== */

    useEffect(() => {
        if (!isConfigOpen) {
            return undefined;
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setIsConfigOpen(false);
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
    }, [isConfigOpen]);

    /* ======================================================
       FERMETURE PAR CLIC EXTÉRIEUR
    ====================================================== */

    useEffect(() => {
        if (!isConfigOpen) {
            return undefined;
        }

        function handleMouseDown(event) {
            if (
                modalRef.current &&
                !modalRef.current.contains(event.target)
            ) {
                setIsConfigOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleMouseDown
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleMouseDown
            );
        };
    }, [isConfigOpen]);

    /* ======================================================
       RENDU
    ====================================================== */

    return (
        <RibbonGroup
            title="Bordures de page"
            className="w-[160px] min-w-[160px]"
        >
            <div className="grid w-full grid-cols-2 gap-1">

                {/* ================= PAGE ================= */}

                <RibbonButton
                    icon={Square}
                    label="Page"
                    tooltip="Configurer la bordure de page"
                    active={Boolean(currentBorders && typeof currentBorders === "object" && currentBorders.style !== "none")}
                    onClick={openConfiguration}
                />

                {/* ================= AUCUNE ================= */}

                <RibbonButton
                    icon={Trash2}
                    label="Aucune"
                    tooltip="Supprimer la bordure de page"
                    active={currentBorders === "none"}
                    onClick={removeBorders}
                />

            </div>

            {/* =================================================
                MODALE DE CONFIGURATION
            ================================================= */}

            {isConfigOpen &&
                createPortal(
                    <div
                        className="
                            fixed inset-0
                            z-[999999]
                            flex items-center justify-center
                            bg-black/60
                            backdrop-blur-[3px]
                            p-4
                        "
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="macevo-border-title"
                    >
                        <div
                            ref={modalRef}
                            className="
                                bg-white
                                rounded-xl
                                shadow-2xl
                                border border-gray-300
                                w-[440px]
                                max-w-[95vw]
                                overflow-hidden
                                flex flex-col
                            "
                        >

                            {/* ==============================
                                EN-TÊTE
                            ============================== */}

                            <div
                                className="
                                    flex items-center
                                    justify-between
                                    px-6 py-4
                                    border-b border-gray-200
                                    bg-gray-50
                                "
                            >
                                <div className="flex items-center gap-2">

                                    <div
                                        className="
                                            w-8 h-8
                                            rounded-lg
                                            bg-blue-50
                                            text-blue-600
                                            flex items-center
                                            justify-center
                                        "
                                    >
                                        <Square className="w-4 h-4" />
                                    </div>

                                    <div>
                                        <h3
                                            id="macevo-border-title"
                                            className="
                                                text-sm
                                                font-bold
                                                text-gray-800
                                            "
                                        >
                                            Bordure de page
                                        </h3>

                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                            Configuration scientifique du cadre
                                        </p>
                                    </div>

                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsConfigOpen(false)
                                    }
                                    className="
                                        text-gray-400
                                        hover:text-gray-600
                                        hover:bg-gray-100
                                        p-1.5
                                        rounded-md
                                        transition-colors
                                    "
                                    title="Fermer"
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                            </div>

                            {/* ==============================
                                CONTENU
                            ============================== */}

                            <div className="p-6 flex flex-col gap-5">

                                {/* ==========================
                                    STYLE
                                ========================== */}

                                <div>

                                    <label
                                        htmlFor="macevo-border-style"
                                        className="
                                            block
                                            text-xs
                                            font-semibold
                                            text-gray-700
                                            mb-1.5
                                        "
                                    >
                                        Style du trait
                                    </label>

                                    <select
                                        id="macevo-border-style"
                                        value={borderStyle}
                                        onChange={(event) =>
                                            setBorderStyle(
                                                event.target.value
                                            )
                                        }
                                        className="
                                            w-full
                                            px-3 py-2
                                            text-xs
                                            border border-gray-300
                                            rounded-md
                                            bg-white
                                            text-gray-800
                                            focus:ring-2
                                            focus:ring-blue-500
                                            focus:border-blue-500
                                            outline-none
                                        "
                                    >
                                        <option value="solid">
                                            Ligne continue
                                        </option>

                                        <option value="dashed">
                                            Tirets
                                        </option>

                                        <option value="dotted">
                                            Pointillés
                                        </option>

                                        <option value="double">
                                            Double ligne
                                        </option>
                                    </select>

                                </div>

                                {/* ==========================
                                    ÉPAISSEUR
                                ========================== */}

                                <div>

                                    <div className="flex items-center justify-between mb-1.5">

                                        <label
                                            htmlFor="macevo-border-width"
                                            className="
                                                text-xs
                                                font-semibold
                                                text-gray-700
                                            "
                                        >
                                            Épaisseur
                                        </label>

                                        <span
                                            className="
                                                text-xs
                                                font-mono
                                                font-medium
                                                text-gray-500
                                            "
                                        >
                                            {borderWidth} px
                                        </span>

                                    </div>

                                    <input
                                        id="macevo-border-width"
                                        type="range"
                                        min="1"
                                        max="12"
                                        step="1"
                                        value={borderWidth}
                                        onChange={(event) =>
                                            setBorderWidth(
                                                Number(
                                                    event.target.value
                                                )
                                            )
                                        }
                                        className="
                                            w-full
                                            cursor-pointer
                                            accent-blue-600
                                        "
                                    />

                                    <div className="flex justify-between mt-1">

                                        <span className="text-[9px] text-gray-400">
                                            1 px
                                        </span>

                                        <span className="text-[9px] text-gray-400">
                                            12 px
                                        </span>

                                    </div>

                                </div>

                                {/* ==========================
                                    COULEUR
                                ========================== */}

                                <div>

                                    <label
                                        htmlFor="macevo-border-color"
                                        className="
                                            block
                                            text-xs
                                            font-semibold
                                            text-gray-700
                                            mb-1.5
                                        "
                                    >
                                        Couleur
                                    </label>

                                    <div
                                        className="
                                            flex items-center
                                            gap-3
                                            border
                                            border-gray-200
                                            rounded-lg
                                            p-2
                                            bg-gray-50
                                        "
                                    >

                                        <input
                                            id="macevo-border-color"
                                            type="color"
                                            value={borderColor}
                                            onChange={(event) =>
                                                setBorderColor(
                                                    event.target.value
                                                )
                                            }
                                            className="
                                                w-10 h-9
                                                rounded
                                                border
                                                border-gray-300
                                                cursor-pointer
                                                p-0.5
                                                bg-white
                                            "
                                        />

                                        <div className="flex flex-col">

                                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                                                Valeur
                                            </span>

                                            <span className="text-xs font-mono font-medium text-gray-700">
                                                {borderColor.toUpperCase()}
                                            </span>

                                        </div>

                                    </div>

                                </div>

                                {/* ==========================
                                    APERÇU
                                ========================== */}

                                <div className="flex flex-col gap-2">

                                    <div
                                        className="
                                            text-[11px]
                                            font-bold
                                            text-gray-500
                                            uppercase
                                            tracking-wider
                                            flex items-center
                                            gap-1.5
                                        "
                                    >
                                        <Eye className="w-3.5 h-3.5 text-blue-600" />

                                        Aperçu
                                    </div>

                                    <div
                                        className="
                                            h-[110px]
                                            bg-gray-100
                                            rounded-lg
                                            border border-gray-200
                                            flex items-center
                                            justify-center
                                            p-4
                                        "
                                    >

                                        <div
                                            className="
                                                relative
                                                w-[125px]
                                                h-[82px]
                                                bg-white
                                                shadow-sm
                                                flex items-center
                                                justify-center
                                            "
                                            style={{
                                                border: `${borderWidth}px ${borderStyle} ${borderColor}`,
                                            }}
                                        >

                                            <span
                                                className="
                                                    text-[9px]
                                                    text-gray-400
                                                    text-center
                                                    px-2
                                                "
                                            >
                                                Aperçu de la page
                                            </span>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* ==============================
                                PIED DE MODALE
                            ============================== */}

                            <div
                                className="
                                    flex items-center
                                    justify-between
                                    px-6 py-4
                                    border-t border-gray-200
                                    bg-gray-50
                                "
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsConfigOpen(false)
                                    }
                                    className="
                                        px-3 py-2
                                        text-xs
                                        font-medium
                                        text-gray-600
                                        bg-gray-100
                                        hover:bg-gray-200
                                        rounded-md
                                        transition-colors
                                    "
                                >
                                    Annuler
                                </button>

                                <div className="flex items-center gap-2">

                                    <button
                                        type="button"
                                        onClick={removeBorders}
                                        className="
                                            px-3 py-2
                                            text-xs
                                            font-medium
                                            text-gray-600
                                            bg-white
                                            border
                                            border-gray-300
                                            hover:bg-gray-50
                                            rounded-md
                                            transition-colors
                                            flex items-center gap-1.5
                                        "
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />

                                        Aucune
                                    </button>

                                    <button
                                        type="button"
                                        onClick={applyBorderStyle}
                                        className="
                                            px-4 py-2
                                            text-xs
                                            font-medium
                                            text-white
                                            bg-blue-600
                                            hover:bg-blue-700
                                            rounded-md
                                            shadow-sm
                                            transition-colors
                                            flex items-center gap-1.5
                                        "
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />

                                        Appliquer
                                    </button>

                                </div>

                            </div>

                        </div>
                    </div>,
                    document.body
                )}
        </RibbonGroup>
    );
}

export default BordersGroup;
