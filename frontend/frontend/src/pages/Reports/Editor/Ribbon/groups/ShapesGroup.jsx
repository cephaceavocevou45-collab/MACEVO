/**
 * ===========================================================
 * MACEVO — ÉDITEUR SCIENTIFIQUE
 * -----------------------------------------------------------
 * Fichier      : ShapesGroup.jsx
 * Version      : 4.0.0
 * Statut       : Formes scientifiques — stable
 * Description  : Catalogue de formes + générateur personnalisé
 * ===========================================================
 */

import { useEffect, useRef, useState } from "react";

import {
    Shapes,
    ChevronDown,
    Sliders,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";

import ShapeGeneratorModal from "./ShapeGeneratorModal";

export default function ShapesGroup({ editor }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] =
        useState(false);

    const [coords, setCoords] = useState({
        top: 0,
        left: 0,
    });

    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    /**
     * ---------------------------------------------------------
     * CATALOGUE DES FORMES
     * ---------------------------------------------------------
     */

    const shapeCategories = [
        {
            title: "Récemment utilisées",
            shapes: [
                {
                    name: "Rectangle",
                    symbol: "▭",
                    type: "rectangle",
                },
                {
                    name: "Cercle",
                    symbol: "◯",
                    type: "ellipse",
                },
                {
                    name: "Triangle",
                    symbol: "△",
                    type: "triangle",
                },
                {
                    name: "Losange",
                    symbol: "◇",
                    type: "losange",
                },
                {
                    name: "Ligne",
                    symbol: "╱",
                    type: "ligne",
                },
                {
                    name: "Flèche",
                    symbol: "➔",
                    type: "fleche_droite",
                },
            ],
        },

        {
            title: "Traits",
            shapes: [
                {
                    name: "Ligne",
                    symbol: "╱",
                    type: "ligne",
                },
                {
                    name: "Flèche simple",
                    symbol: "➔",
                    type: "fleche_droite",
                },
                {
                    name: "Flèche double",
                    symbol: "↔",
                    type: "fleche_double",
                },
                {
                    name: "Ligne coudée",
                    symbol: "⬎",
                    type: "ligne_coudee",
                },
            ],
        },

        {
            title: "Rectangles",
            shapes: [
                {
                    name: "Rectangle",
                    symbol: "▭",
                    type: "rectangle",
                },
                {
                    name: "Rectangle arrondi",
                    symbol: "⬭",
                    type: "rectangle_rounded",
                },
                {
                    name: "Rectangle coin coupé",
                    symbol: "▰",
                    type: "rectangle_cut",
                },
                {
                    name: "Boîte de flux",
                    symbol: "▢",
                    type: "boite_flux",
                },
            ],
        },

        {
            title: "Formes de base",
            shapes: [
                {
                    name: "Ellipse / Cercle",
                    symbol: "◯",
                    type: "ellipse",
                },
                {
                    name: "Triangle",
                    symbol: "△",
                    type: "triangle",
                },
                {
                    name: "Losange",
                    symbol: "◇",
                    type: "losange",
                },
                {
                    name: "Pentagone",
                    symbol: "⬠",
                    type: "pentagone",
                },
                {
                    name: "Hexagone",
                    symbol: "⬡",
                    type: "hexagone",
                },
                {
                    name: "Cylindre",
                    symbol: "🛢",
                    type: "cylindre",
                },
                {
                    name: "Étoile",
                    symbol: "★",
                    type: "etoile",
                },
                {
                    name: "Cœur",
                    symbol: "♥",
                    type: "coeur",
                },
            ],
        },

        {
            title: "Flèches pleines",
            shapes: [
                {
                    name: "Flèche droite",
                    symbol: "➡",
                    type: "fleche_droite",
                },
                {
                    name: "Flèche gauche",
                    symbol: "⬅",
                    type: "fleche_gauche",
                },
                {
                    name: "Flèche haut",
                    symbol: "⬆",
                    type: "fleche_haut",
                },
                {
                    name: "Flèche bas",
                    symbol: "⬇",
                    type: "fleche_bas",
                },
                {
                    name: "Flèche bidirectionnelle",
                    symbol: "⮀",
                    type: "fleche_bidirectionnelle",
                },
            ],
        },

        {
            title: "Formes d'équation",
            shapes: [
                {
                    name: "Plus",
                    symbol: "➕",
                    type: "plus",
                },
                {
                    name: "Moins",
                    symbol: "➖",
                    type: "moins",
                },
                {
                    name: "Multiplication",
                    symbol: "✖",
                    type: "multiplication",
                },
                {
                    name: "Division",
                    symbol: "➗",
                    type: "division",
                },
                {
                    name: "Égal",
                    symbol: "🟰",
                    type: "egal",
                },
            ],
        },

        {
            title: "Organigrammes",
            shapes: [
                {
                    name: "Processus",
                    symbol: "▢",
                    type: "boite_flux",
                },
                {
                    name: "Décision",
                    symbol: "◇",
                    type: "losange",
                },
                {
                    name: "Données",
                    symbol: "▰",
                    type: "rectangle",
                },
                {
                    name: "Base de données",
                    symbol: "🛢",
                    type: "cylindre",
                },
                {
                    name: "Document",
                    symbol: "📄",
                    type: "document",
                },
            ],
        },
    ];

    /**
     * ---------------------------------------------------------
     * POSITIONNEMENT DU MENU
     * ---------------------------------------------------------
     */

    const updateMenuPosition = () => {
        if (!buttonRef.current) {
            return;
        }

        const rect =
            buttonRef.current.getBoundingClientRect();

        const menuWidth = 340;
        const menuHeight = 520;

        let left = rect.left;
        let top = rect.bottom + 4;

        if (
            left + menuWidth >
            window.innerWidth - 8
        ) {
            left =
                window.innerWidth -
                menuWidth -
                8;
        }

        if (
            top + menuHeight >
            window.innerHeight - 8
        ) {
            top =
                rect.top -
                menuHeight -
                4;
        }

        left = Math.max(8, left);
        top = Math.max(8, top);

        setCoords({
            top,
            left,
        });
    };

    /**
     * ---------------------------------------------------------
     * OUVERTURE / FERMETURE
     * ---------------------------------------------------------
     */

    const toggleMenu = () => {
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        updateMenuPosition();
        setIsOpen(true);
    };

    /**
     * ---------------------------------------------------------
     * FERMETURE EXTERNE + ESCAPE
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            const target = event.target;

            if (
                dropdownRef.current?.contains(
                    target
                ) ||
                buttonRef.current?.contains(target)
            ) {
                return;
            }

            setIsOpen(false);
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        const handleReposition = () => {
            updateMenuPosition();
        };

        document.addEventListener(
            "mousedown",
            handlePointerDown
        );

        document.addEventListener(
            "keydown",
            handleEscape
        );

        window.addEventListener(
            "resize",
            handleReposition
        );

        window.addEventListener(
            "scroll",
            handleReposition,
            true
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handlePointerDown
            );

            document.removeEventListener(
                "keydown",
                handleEscape
            );

            window.removeEventListener(
                "resize",
                handleReposition
            );

            window.removeEventListener(
                "scroll",
                handleReposition,
                true
            );
        };
    }, [isOpen]);

    /**
     * ---------------------------------------------------------
     * INSERTION D'UNE FORME
     * ---------------------------------------------------------
     */

    const handleInsertShape = (shapeType) => {
        if (!editor || !shapeType) {
            return;
        }

        try {
            editor
                .chain()
                .focus()
                .insertContent({
                    type: "scientificShape",
                    attrs: {
                        shapeType,
                        htmlContent:
                            shapeType === "boite_flux"
                                ? "Processus"
                                : "",
                        x: 120,
                        y: 150,
                        width: 180,
                        height: 120,
                    },
                })
                .run();

            setIsOpen(false);
        } catch (error) {
            console.error(
                "[MACEVO Shapes] Erreur d'insertion :",
                error
            );
        }
    };

    /**
     * ---------------------------------------------------------
     * INSERTION D'UNE FORME PERSONNALISÉE
     * ---------------------------------------------------------
     */

    const handleInsertCustomShape = (
        shapeHtml
    ) => {
        if (!editor || !shapeHtml) {
            return;
        }

        try {
            editor
                .chain()
                .focus()
                .insertContent({
                    type: "scientificShape",
                    attrs: {
                        shapeType: "custom",
                        htmlContent: shapeHtml,
                        x: 120,
                        y: 150,
                        width: 200,
                        height: 140,
                    },
                })
                .run();
        } catch (error) {
            console.error(
                "[MACEVO Shapes] Erreur de forme personnalisée :",
                error
            );
        }
    };

    /**
     * ---------------------------------------------------------
     * ÉDITEUR INDISPONIBLE
     * ---------------------------------------------------------
     */

    if (!editor) {
        return null;
    }

    /**
     * ---------------------------------------------------------
     * RENDU
     * ---------------------------------------------------------
     */

    return (
        <RibbonGroup
            title="Formes"
            width="w-[90px]"
        >
            <div className="flex flex-col items-center justify-center h-full relative">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={toggleMenu}
                    className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        p-1
                        hover:bg-slate-100
                        rounded
                        border
                        border-transparent
                        hover:border-slate-300
                        transition-all
                        focus:outline-none
                        focus:ring-2
                        focus:ring-blue-500/30
                        w-full
                        cursor-pointer
                    "
                    title="Formes géométriques et schémas scientifiques"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                >
                    <div className="flex items-center gap-1">
                        <Shapes
                            size={20}
                            className="text-blue-600"
                        />

                        <ChevronDown
                            size={10}
                            className={`
                                text-slate-500
                                transition-transform
                                ${
                                    isOpen
                                        ? "rotate-180"
                                        : ""
                                }
                            `}
                        />
                    </div>

                    <span className="text-[11px] text-slate-700 mt-1">
                        Formes
                    </span>
                </button>

                {/* =================================================
                    CATALOGUE
                   ================================================= */}

                {isOpen && (
                    <div
                        ref={dropdownRef}
                        style={{
                            position: "fixed",
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                        }}
                        className="
                            w-[340px]
                            max-h-[520px]
                            overflow-y-auto
                            bg-white
                            border
                            border-slate-300
                            rounded-lg
                            shadow-2xl
                            z-[99999]
                            p-2
                            text-xs
                            scrollbar-thin
                        "
                        role="menu"
                        aria-label="Catalogue des formes"
                    >
                        {/* =========================================
                            GÉNÉRATEUR
                           ========================================= */}

                        <div className="mb-2 pb-2 border-b border-slate-200">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsGeneratorOpen(
                                        true
                                    );
                                    setIsOpen(false);
                                }}
                                className="
                                    w-full
                                    flex
                                    items-center
                                    justify-center
                                    gap-1.5
                                    py-2
                                    px-3
                                    bg-blue-50
                                    hover:bg-blue-100
                                    text-blue-700
                                    font-semibold
                                    rounded-lg
                                    border
                                    border-blue-200
                                    transition-colors
                                    cursor-pointer
                                "
                            >
                                <Sliders size={14} />

                                Générateur personnalisé
                            </button>
                        </div>

                        {/* =========================================
                            CATÉGORIES
                           ========================================= */}

                        {shapeCategories.map(
                            (category) => (
                                <div
                                    key={
                                        category.title
                                    }
                                    className="mb-3 last:mb-0"
                                >
                                    <div
                                        className="
                                            text-[10px]
                                            font-bold
                                            text-slate-500
                                            uppercase
                                            px-2
                                            py-1
                                            bg-slate-100
                                            rounded
                                        "
                                    >
                                        {category.title}
                                    </div>

                                    <div
                                        className="
                                            grid
                                            grid-cols-6
                                            gap-1
                                            mt-1
                                        "
                                    >
                                        {category.shapes.map(
                                            (shape) => (
                                                <button
                                                    key={`${category.title}-${shape.name}-${shape.type}`}
                                                    type="button"
                                                    onClick={() =>
                                                        handleInsertShape(
                                                            shape.type
                                                        )
                                                    }
                                                    className="
                                                        flex
                                                        flex-col
                                                        items-center
                                                        justify-center
                                                        p-2
                                                        rounded
                                                        hover:bg-blue-50
                                                        hover:border-blue-300
                                                        border
                                                        border-transparent
                                                        cursor-pointer
                                                        transition-colors
                                                    "
                                                    title={
                                                        shape.name
                                                    }
                                                    role="menuitem"
                                                >
                                                    <span
                                                        className="
                                                            text-base
                                                            leading-none
                                                            text-slate-700
                                                            hover:text-blue-600
                                                        "
                                                    >
                                                        {
                                                            shape.symbol
                                                        }
                                                    </span>
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* =================================================
                    GÉNÉRATEUR PERSONNALISÉ
                   ================================================= */}

                <ShapeGeneratorModal
                    isOpen={
                        isGeneratorOpen
                    }
                    onClose={() =>
                        setIsGeneratorOpen(
                            false
                        )
                    }
                    onInsert={
                        handleInsertCustomShape
                    }
                />
            </div>
        </RibbonGroup>
    );
}