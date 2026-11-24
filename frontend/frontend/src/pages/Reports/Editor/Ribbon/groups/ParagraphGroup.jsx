/**
 * ===========================================================
 * MACEVO — ÉDITEUR SCIENTIFIQUE
 * -----------------------------------------------------------
 * Fichier      : ParagraphGroup.jsx
 * Version      : 4.0.0
 * Statut       : Paragraphe scientifique — stable
 * Description  :
 * Alignement, listes, retraits, interlignes et marques
 * ===========================================================
 */

import React, { useEffect, useRef, useState } from "react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered,
    IndentDecrease,
    IndentIncrease,
    Pilcrow,
    Paintbrush,
    ChevronDown,
} from "lucide-react";

const LINE_HEIGHTS = [
    { label: "1,0", value: "1" },
    { label: "1,15", value: "1.15" },
    { label: "1,5", value: "1.5" },
    { label: "2,0", value: "2" },
    { label: "2,5", value: "2.5" },
    { label: "3,0", value: "3" },
];

function ParagraphGroup({ editor }) {
    const [isSpacingOpen, setIsSpacingOpen] = useState(false);
    const [spacingCoords, setSpacingCoords] = useState({
        top: 0,
        left: 0,
    });
    const [showParagraphMarks, setShowParagraphMarks] = useState(false);

    const spacingBtnRef = useRef(null);
    const spacingDropdownRef = useRef(null);

    /**
     * ---------------------------------------------------------
     * Menu interligne
     * ---------------------------------------------------------
     */

    const toggleSpacingMenu = () => {
        if (!isSpacingOpen && spacingBtnRef.current) {
            const rect =
                spacingBtnRef.current.getBoundingClientRect();

            setSpacingCoords({
                top: rect.bottom + 4,
                left: rect.left,
            });
        }

        setIsSpacingOpen((previous) => !previous);
    };

    useEffect(() => {
        if (!isSpacingOpen) {
            return undefined;
        }

        const handleOutsideClick = (event) => {
            const target = event.target;

            if (
                spacingDropdownRef.current &&
                spacingDropdownRef.current.contains(target)
            ) {
                return;
            }

            if (
                spacingBtnRef.current &&
                spacingBtnRef.current.contains(target)
            ) {
                return;
            }

            setIsSpacingOpen(false);
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsSpacingOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [isSpacingOpen]);

    /**
     * Repositionne le menu lors du scroll ou du resize.
     */
    useEffect(() => {
        if (!isSpacingOpen) {
            return undefined;
        }

        const updatePosition = () => {
            if (!spacingBtnRef.current) {
                return;
            }

            const rect =
                spacingBtnRef.current.getBoundingClientRect();

            setSpacingCoords({
                top: rect.bottom + 4,
                left: rect.left,
            });
        };

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

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
    }, [isSpacingOpen]);

    /**
     * ---------------------------------------------------------
     * Marques de paragraphe
     * ---------------------------------------------------------
     */

    const toggleParagraphMarks = () => {
        if (!editor?.view?.dom) {
            return;
        }

        setShowParagraphMarks((previous) => {
            const next = !previous;

            editor.view.dom.classList.toggle(
                "show-paragraph-marks",
                next
            );

            return next;
        });
    };

    /**
     * ---------------------------------------------------------
     * Retraits
     * ---------------------------------------------------------
     *
     * Dans une liste :
     *   - augmenter = imbriquer la liste
     *   - diminuer = sortir de la liste
     *
     * Hors liste :
     *   - on conserve le système d'attribut "indent"
     *     déjà utilisé par MACEVO.
     */

    const handleIncreaseIndent = () => {
        if (!editor) {
            return;
        }

        const chain = editor.chain().focus();

        if (
            editor.can().sinkListItem("listItem")
        ) {
            chain.sinkListItem("listItem").run();
            return;
        }

        const attributes =
            editor.getAttributes("paragraph") || {};

        const currentIndent = Number.parseInt(
            attributes.indent ?? "0",
            10
        );

        const safeIndent = Number.isFinite(currentIndent)
            ? currentIndent
            : 0;

        const nextIndent = Math.min(
            240,
            safeIndent + 20
        );

        chain
            .updateAttributes("paragraph", {
                indent: nextIndent,
            })
            .run();
    };

    const handleDecreaseIndent = () => {
        if (!editor) {
            return;
        }

        const chain = editor.chain().focus();

        if (
            editor.can().liftListItem("listItem")
        ) {
            chain.liftListItem("listItem").run();
            return;
        }

        const attributes =
            editor.getAttributes("paragraph") || {};

        const currentIndent = Number.parseInt(
            attributes.indent ?? "0",
            10
        );

        const safeIndent = Number.isFinite(currentIndent)
            ? currentIndent
            : 0;

        const nextIndent = Math.max(
            0,
            safeIndent - 20
        );

        chain
            .updateAttributes("paragraph", {
                indent: nextIndent,
            })
            .run();
    };

    /**
     * ---------------------------------------------------------
     * Interligne
     * ---------------------------------------------------------
     */

    const handleSetLineHeight = (height) => {
        if (!editor) {
            return;
        }

        editor
            .chain()
            .focus()
            .updateAttributes("paragraph", {
                lineHeight: height,
            })
            .run();

        setIsSpacingOpen(false);
    };

    /**
     * ---------------------------------------------------------
     * Espacement avant
     * ---------------------------------------------------------
     */

    const addSpaceBefore = () => {
        if (!editor) {
            return;
        }

        editor
            .chain()
            .focus()
            .updateAttributes("paragraph", {
                spaceBefore: "12px",
            })
            .run();

        setIsSpacingOpen(false);
    };

    /**
     * ---------------------------------------------------------
     * Espacement après
     * ---------------------------------------------------------
     */

    const removeSpaceAfter = () => {
        if (!editor) {
            return;
        }

        editor
            .chain()
            .focus()
            .updateAttributes("paragraph", {
                spaceAfter: "0px",
            })
            .run();

        setIsSpacingOpen(false);
    };

    /**
     * ---------------------------------------------------------
     * Trame de fond
     * ---------------------------------------------------------
     *
     * On ne suppose pas l'existence d'une commande Tiptap
     * non vérifiée.
     *
     * Le contrôle est donc préparé pour une future extension
     * de paragraphe, sans provoquer d'erreur actuellement.
     */

    const handleParagraphBackground = (event) => {
        const value = event.target.value;

        if (!editor || !value) {
            return;
        }

        if (
            typeof editor.commands?.setParagraphBackground ===
            "function"
        ) {
            editor
                .chain()
                .focus()
                .setParagraphBackground(value)
                .run();
        }
    };

    /**
     * Aucun éditeur = aucun ruban.
     */
    if (!editor) {
        return null;
    }

    return (
        <RibbonGroup
            title="Paragraphe"
            width="w-[310px]"
            hasDialogLauncher={true}
        >
            {/* =================================================
                LIGNE 1
                Listes / Retraits / Marques / Trame
               ================================================= */}

            <div className="flex items-center gap-0.5 w-full mb-1">
                <RibbonButton
                    size="small"
                    icon={List}
                    active={editor.isActive("bulletList")}
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .toggleBulletList()
                            .run()
                    }
                    tooltip="Liste à puces"
                />

                <RibbonButton
                    size="small"
                    icon={ListOrdered}
                    active={editor.isActive("orderedList")}
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .toggleOrderedList()
                            .run()
                    }
                    tooltip="Liste numérotée"
                />

                <div className="h-4 w-px bg-slate-200 mx-0.5" />

                <RibbonButton
                    size="small"
                    icon={IndentDecrease}
                    onClick={handleDecreaseIndent}
                    tooltip="Diminuer le retrait"
                />

                <RibbonButton
                    size="small"
                    icon={IndentIncrease}
                    onClick={handleIncreaseIndent}
                    tooltip="Augmenter le retrait"
                />

                <div className="h-4 w-px bg-slate-200 mx-0.5" />

                <RibbonButton
                    size="small"
                    icon={Pilcrow}
                    active={showParagraphMarks}
                    onClick={toggleParagraphMarks}
                    tooltip="Afficher ou masquer les marques de paragraphe"
                />

                <div className="h-4 w-px bg-slate-200 mx-0.5" />

                <div className="relative flex items-center justify-center">
                    <input
                        type="color"
                        aria-label="Couleur de fond du paragraphe"
                        className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleParagraphBackground}
                    />

                    <RibbonButton
                        size="small"
                        icon={Paintbrush}
                        tooltip="Trame de fond du paragraphe"
                    />
                </div>
            </div>

            {/* =================================================
                LIGNE 2
                Alignement / Interligne
               ================================================= */}

            <div className="flex items-center gap-0.5">
                <RibbonButton
                    size="small"
                    icon={AlignLeft}
                    active={editor.isActive({
                        textAlign: "left",
                    })}
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .setTextAlign("left")
                            .run()
                    }
                    tooltip="Aligner à gauche"
                />

                <RibbonButton
                    size="small"
                    icon={AlignCenter}
                    active={editor.isActive({
                        textAlign: "center",
                    })}
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .setTextAlign("center")
                            .run()
                    }
                    tooltip="Centrer"
                />

                <RibbonButton
                    size="small"
                    icon={AlignRight}
                    active={editor.isActive({
                        textAlign: "right",
                    })}
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .setTextAlign("right")
                            .run()
                    }
                    tooltip="Aligner à droite"
                />

                <RibbonButton
                    size="small"
                    icon={AlignJustify}
                    active={editor.isActive({
                        textAlign: "justify",
                    })}
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .setTextAlign("justify")
                            .run()
                    }
                    tooltip="Justifier"
                />

                <div className="h-4 w-px bg-slate-200 mx-1" />

                {/* Interligne */}

                <div className="relative">
                    <button
                        ref={spacingBtnRef}
                        type="button"
                        onClick={toggleSpacingMenu}
                        className="
                            h-[22px]
                            px-2
                            text-xs
                            border
                            border-slate-300
                            rounded
                            bg-white
                            flex
                            items-center
                            gap-1
                            hover:border-slate-400
                            hover:bg-slate-50
                            focus:outline-none
                            focus:ring-1
                            focus:ring-blue-300
                        "
                        title="Modifier l'interligne"
                        aria-haspopup="menu"
                        aria-expanded={isSpacingOpen}
                    >
                        <span className="text-[11px]">
                            Interligne
                        </span>

                        <ChevronDown
                            size={11}
                            className="text-slate-500"
                        />
                    </button>

                    {isSpacingOpen && (
                        <div
                            ref={spacingDropdownRef}
                            role="menu"
                            style={{
                                position: "fixed",
                                top: `${spacingCoords.top}px`,
                                left: `${spacingCoords.left}px`,
                            }}
                            className="
                                bg-white
                                border
                                border-slate-300
                                rounded
                                shadow-2xl
                                z-[99999]
                                py-1
                                w-[260px]
                                text-xs
                                text-slate-700
                            "
                        >
                            {LINE_HEIGHTS.map(
                                ({ label, value }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        role="menuitem"
                                        onClick={() =>
                                            handleSetLineHeight(
                                                value
                                            )
                                        }
                                        className="
                                            w-full
                                            text-left
                                            px-4
                                            py-1.5
                                            hover:bg-blue-50
                                            hover:text-blue-600
                                            cursor-pointer
                                        "
                                    >
                                        {label}
                                    </button>
                                )
                            )}

                            <div className="border-t border-slate-200 my-1" />

                            <button
                                type="button"
                                role="menuitem"
                                onClick={() =>
                                    setIsSpacingOpen(false)
                                }
                                className="
                                    w-full
                                    text-left
                                    px-4
                                    py-1.5
                                    hover:bg-slate-100
                                    cursor-pointer
                                "
                            >
                                Options d'interligne...
                            </button>

                            <div className="border-t border-slate-200 my-1" />

                            <button
                                type="button"
                                role="menuitem"
                                onClick={addSpaceBefore}
                                className="
                                    w-full
                                    text-left
                                    px-4
                                    py-1.5
                                    hover:bg-slate-100
                                    cursor-pointer
                                "
                            >
                                Ajouter de l'espace avant
                            </button>

                            <button
                                type="button"
                                role="menuitem"
                                onClick={removeSpaceAfter}
                                className="
                                    w-full
                                    text-left
                                    px-4
                                    py-1.5
                                    hover:bg-slate-100
                                    cursor-pointer
                                "
                            >
                                Supprimer l'espace après
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </RibbonGroup>
    );
}

export default ParagraphGroup;