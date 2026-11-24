/**
 * ===========================================================
 * MACEVO — ÉDITEUR SCIENTIFIQUE
 * -----------------------------------------------------------
 * Fichier      : ShapeGeneratorModal.jsx
 * Version      : 4.0.0
 * Statut       : Générateur de formes scientifiques
 * Description  : Générateur interactif de formes personnalisées
 * ===========================================================
 */

import { useEffect, useMemo, useState } from "react";

import {
    X,
    Check,
    RefreshCw,
    Sliders,
    Palette,
    Square,
} from "lucide-react";

export default function ShapeGeneratorModal({
    isOpen,
    onClose,
    onInsert,
}) {
    /**
     * ---------------------------------------------------------
     * ÉTAT DE LA FORME
     * ---------------------------------------------------------
     */

    const [borderRadius, setBorderRadius] = useState({
        tl1: 30,
        tl2: 70,
        tr1: 70,
        tr2: 30,
        br1: 30,
        br2: 70,
        bl1: 70,
        bl2: 30,
    });

    const [shapeColor, setShapeColor] =
        useState("#3b82f6");

    const [borderColor, setBorderColor] =
        useState("#1e293b");

    const [borderWidth, setBorderWidth] =
        useState(3);

    const [shapeLabel, setShapeLabel] =
        useState("Schéma 1");

    /**
     * ---------------------------------------------------------
     * FERMETURE AVEC ESCAPE
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };

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
    }, [isOpen, onClose]);

    /**
     * ---------------------------------------------------------
     * BORDER RADIUS CSS
     * ---------------------------------------------------------
     */

    const radiusCss = useMemo(() => {
        return (
            `${borderRadius.tl1}% ` +
            `${borderRadius.tl2}% ` +
            `${borderRadius.tr1}% ` +
            `${borderRadius.tr2}% / ` +
            `${borderRadius.bl1}% ` +
            `${borderRadius.bl2}% ` +
            `${borderRadius.br1}% ` +
            `${borderRadius.br2}%`
        );
    }, [borderRadius]);

    /**
     * ---------------------------------------------------------
     * MODAL FERMÉE
     * ---------------------------------------------------------
     */

    if (!isOpen) {
        return null;
    }

    /**
     * ---------------------------------------------------------
     * HELPERS
     * ---------------------------------------------------------
     */

    const updateRadius = (key, value) => {
        const numericValue = Math.max(
            10,
            Math.min(90, Number(value) || 10)
        );

        setBorderRadius((current) => ({
            ...current,
            [key]: numericValue,
        }));
    };

    const randomValue = () =>
        Math.floor(
            Math.random() * 61
        ) + 20;

    /**
     * ---------------------------------------------------------
     * FORME ALÉATOIRE
     * ---------------------------------------------------------
     */

    const handleRandomize = () => {
        setBorderRadius({
            tl1: randomValue(),
            tl2: randomValue(),
            tr1: randomValue(),
            tr2: randomValue(),
            br1: randomValue(),
            br2: randomValue(),
            bl1: randomValue(),
            bl2: randomValue(),
        });
    };

    /**
     * ---------------------------------------------------------
     * RÉINITIALISATION
     * ---------------------------------------------------------
     */

    const handleReset = () => {
        setBorderRadius({
            tl1: 30,
            tl2: 70,
            tr1: 70,
            tr2: 30,
            br1: 30,
            br2: 70,
            bl1: 70,
            bl2: 30,
        });

        setShapeColor("#3b82f6");
        setBorderColor("#1e293b");
        setBorderWidth(3);
        setShapeLabel("Schéma 1");
    };

    /**
     * ---------------------------------------------------------
     * ÉCHAPPEMENT HTML
     * ---------------------------------------------------------
     *
     * Le libellé vient de l'utilisateur.
     * Il ne doit jamais être injecté brut dans le HTML.
     * ---------------------------------------------------------
     */

    const escapeHtml = (value) => {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    /**
     * ---------------------------------------------------------
     * INSERTION DANS TIPTAP
     * ---------------------------------------------------------
     *
     * On génère uniquement la forme.
     * Aucun onclick inline ni script n'est injecté.
     * ---------------------------------------------------------
     */

    const handleImport = () => {
        const safeLabel =
            escapeHtml(
                shapeLabel.trim() ||
                    "Schéma scientifique"
            );

        const safeShapeColor =
            /^#[0-9a-fA-F]{6}$/.test(
                shapeColor
            )
                ? shapeColor
                : "#3b82f6";

        const safeBorderColor =
            /^#[0-9a-fA-F]{6}$/.test(
                borderColor
            )
                ? borderColor
                : "#1e293b";

        const safeBorderWidth = Math.max(
            0,
            Math.min(
                20,
                Number(borderWidth) || 0
            )
        );

        const shapeHtml = `
            <div
                class="custom-scientific-shape"
                data-shape-type="scientific"
                data-shape-label="${safeLabel}"
                contenteditable="false"
                style="
                    display:inline-block;
                    margin:12px 0;
                    padding:16px;
                    text-align:center;
                    vertical-align:middle;
                "
            >
                <div
                    style="
                        width:180px;
                        height:140px;
                        background-color:${safeShapeColor};
                        border:${safeBorderWidth}px solid ${safeBorderColor};
                        border-radius:${radiusCss};
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        box-sizing:border-box;
                        box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.10);
                    "
                >
                    <span
                        style="
                            color:#ffffff;
                            font-weight:700;
                            font-size:12px;
                            line-height:1.3;
                            text-shadow:0 1px 2px rgba(0,0,0,0.5);
                            padding:0 8px;
                            word-break:break-word;
                        "
                    >
                        ${safeLabel}
                    </span>
                </div>
            </div>
            <p></p>
        `;

        if (typeof onInsert === "function") {
            onInsert(shapeHtml);
        }

        onClose?.();
    };

    /**
     * ---------------------------------------------------------
     * RAYON
     * ---------------------------------------------------------
     */

    const radiusControls = [
        {
            key: "tl1",
            label: "Haut gauche — H",
        },
        {
            key: "tl2",
            label: "Haut gauche — V",
        },
        {
            key: "tr1",
            label: "Haut droit — H",
        },
        {
            key: "tr2",
            label: "Haut droit — V",
        },
        {
            key: "br1",
            label: "Bas droit — H",
        },
        {
            key: "br2",
            label: "Bas droit — V",
        },
        {
            key: "bl1",
            label: "Bas gauche — H",
        },
        {
            key: "bl2",
            label: "Bas gauche — V",
        },
    ];

    /**
     * ---------------------------------------------------------
     * RENDU
     * ---------------------------------------------------------
     */

    return (
        <div
            className="
                fixed
                inset-0
                z-[99999]
                flex
                items-center
                justify-center
                bg-slate-900/60
                backdrop-blur-sm
                p-4
            "
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose?.();
                }
            }}
        >
            <div
                className="
                    bg-white
                    rounded-xl
                    shadow-2xl
                    w-full
                    max-w-3xl
                    max-h-[92vh]
                    overflow-hidden
                    border
                    border-slate-200
                    flex
                    flex-col
                "
                role="dialog"
                aria-modal="true"
                aria-labelledby="macevo-shape-generator-title"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                {/* =================================================
                    HEADER
                   ================================================= */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        px-6
                        py-4
                        bg-slate-900
                        text-white
                        shrink-0
                    "
                >
                    <div className="flex items-center gap-2">
                        <Sliders
                            size={18}
                            className="text-blue-400"
                        />

                        <div>
                            <h3
                                id="macevo-shape-generator-title"
                                className="
                                    font-semibold
                                    text-sm
                                "
                            >
                                Générateur de formes
                                scientifiques
                            </h3>

                            <p
                                className="
                                    text-[10px]
                                    text-slate-400
                                    mt-0.5
                                "
                            >
                                Création de schémas
                                personnalisés
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            p-1.5
                            rounded
                            text-slate-400
                            hover:text-white
                            hover:bg-white/10
                        "
                        aria-label="Fermer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* =================================================
                    BODY
                   ================================================= */}

                <div
                    className="
                        flex-1
                        overflow-y-auto
                        p-6
                    "
                >
                    <div
                        className="
                            grid
                            grid-cols-1
                            lg:grid-cols-2
                            gap-6
                        "
                    >
                        {/* =========================================
                            APERÇU
                           ========================================= */}

                        <div
                            className="
                                flex
                                flex-col
                                items-center
                                justify-center
                                bg-slate-50
                                border
                                border-slate-200
                                rounded-xl
                                p-8
                                min-h-[310px]
                            "
                        >
                            <div
                                className="
                                    text-[10px]
                                    uppercase
                                    tracking-wider
                                    font-bold
                                    text-slate-400
                                    mb-5
                                "
                            >
                                Aperçu
                            </div>

                            <div
                                style={{
                                    width: "180px",
                                    height: "140px",
                                    backgroundColor:
                                        shapeColor,
                                    border: `${borderWidth}px solid ${borderColor}`,
                                    borderRadius:
                                        radiusCss,
                                    transition:
                                        "border-radius 0.15s ease-in-out",
                                    boxSizing:
                                        "border-box",
                                }}
                                className="
                                    flex
                                    items-center
                                    justify-center
                                    shadow-lg
                                    relative
                                    overflow-hidden
                                "
                            >
                                <span
                                    className="
                                        text-white
                                        text-xs
                                        font-bold
                                        drop-shadow
                                        px-3
                                        text-center
                                        break-words
                                    "
                                >
                                    {shapeLabel ||
                                        "Schéma scientifique"}
                                </span>
                            </div>

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    mt-6
                                "
                            >
                                <button
                                    type="button"
                                    onClick={
                                        handleRandomize
                                    }
                                    className="
                                        flex
                                        items-center
                                        gap-1.5
                                        text-xs
                                        text-blue-600
                                        bg-blue-50
                                        hover:bg-blue-100
                                        px-3
                                        py-1.5
                                        rounded-lg
                                        border
                                        border-blue-200
                                    "
                                >
                                    <RefreshCw size={12} />

                                    Aléatoire
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleReset
                                    }
                                    className="
                                        text-xs
                                        text-slate-600
                                        bg-white
                                        hover:bg-slate-100
                                        px-3
                                        py-1.5
                                        rounded-lg
                                        border
                                        border-slate-200
                                    "
                                >
                                    Réinitialiser
                                </button>
                            </div>
                        </div>

                        {/* =========================================
                            RÉGLAGES
                           ========================================= */}

                        <div className="flex flex-col gap-5">
                            {/* Libellé */}

                            <div>
                                <label
                                    htmlFor="macevo-shape-label"
                                    className="
                                        block
                                        text-[11px]
                                        font-semibold
                                        text-slate-700
                                        mb-1.5
                                    "
                                >
                                    Libellé du schéma
                                </label>

                                <input
                                    id="macevo-shape-label"
                                    type="text"
                                    value={shapeLabel}
                                    maxLength={100}
                                    onChange={(event) =>
                                        setShapeLabel(
                                            event.target
                                                .value
                                        )
                                    }
                                    className="
                                        w-full
                                        h-9
                                        px-3
                                        rounded-lg
                                        border
                                        border-slate-300
                                        text-xs
                                        text-slate-700
                                        focus:outline-none
                                        focus:border-blue-500
                                        focus:ring-1
                                        focus:ring-blue-500/20
                                    "
                                    placeholder="Schéma 1"
                                />
                            </div>

                            {/* Couleurs */}

                            <div>
                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                        text-[10px]
                                        font-bold
                                        uppercase
                                        tracking-wider
                                        text-slate-500
                                        mb-2
                                    "
                                >
                                    <Palette size={13} />

                                    Apparence
                                </div>

                                <div
                                    className="
                                        grid
                                        grid-cols-2
                                        gap-3
                                    "
                                >
                                    <div>
                                        <label
                                            htmlFor="macevo-shape-color"
                                            className="
                                                block
                                                text-[11px]
                                                text-slate-600
                                                mb-1
                                            "
                                        >
                                            Fond
                                        </label>

                                        <div className="flex gap-2">
                                            <input
                                                id="macevo-shape-color"
                                                type="color"
                                                value={
                                                    shapeColor
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setShapeColor(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className="
                                                    w-10
                                                    h-8
                                                    rounded
                                                    border
                                                    border-slate-300
                                                    cursor-pointer
                                                    bg-white
                                                "
                                            />

                                            <input
                                                type="text"
                                                value={
                                                    shapeColor
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setShapeColor(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className="
                                                    flex-1
                                                    h-8
                                                    px-2
                                                    rounded
                                                    border
                                                    border-slate-300
                                                    text-[11px]
                                                    font-mono
                                                "
                                                maxLength={7}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="macevo-border-color"
                                            className="
                                                block
                                                text-[11px]
                                                text-slate-600
                                                mb-1
                                            "
                                        >
                                            Bordure
                                        </label>

                                        <div className="flex gap-2">
                                            <input
                                                id="macevo-border-color"
                                                type="color"
                                                value={
                                                    borderColor
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setBorderColor(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className="
                                                    w-10
                                                    h-8
                                                    rounded
                                                    border
                                                    border-slate-300
                                                    cursor-pointer
                                                    bg-white
                                                "
                                            />

                                            <input
                                                type="text"
                                                value={
                                                    borderColor
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setBorderColor(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className="
                                                    flex-1
                                                    h-8
                                                    px-2
                                                    rounded
                                                    border
                                                    border-slate-300
                                                    text-[11px]
                                                    font-mono
                                                "
                                                maxLength={7}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Épaisseur */}

                            <div>
                                <div
                                    className="
                                        flex
                                        justify-between
                                        text-[11px]
                                        text-slate-500
                                        mb-1
                                    "
                                >
                                    <span>
                                        Épaisseur de bordure
                                    </span>

                                    <span>
                                        {borderWidth}px
                                    </span>
                                </div>

                                <input
                                    type="range"
                                    min="0"
                                    max="12"
                                    step="1"
                                    value={
                                        borderWidth
                                    }
                                    onChange={(event) =>
                                        setBorderWidth(
                                            Number(
                                                event
                                                    .target
                                                    .value
                                            )
                                        )
                                    }
                                    className="
                                        w-full
                                        accent-blue-600
                                        cursor-pointer
                                    "
                                />
                            </div>

                            {/* Rayons */}

                            <div>
                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                        text-[10px]
                                        font-bold
                                        uppercase
                                        tracking-wider
                                        text-slate-500
                                        mb-3
                                    "
                                >
                                    <Square size={13} />

                                    Rayons de courbure
                                </div>

                                <div
                                    className="
                                        grid
                                        grid-cols-1
                                        sm:grid-cols-2
                                        gap-x-4
                                        gap-y-3
                                        max-h-[260px]
                                        overflow-y-auto
                                        pr-1
                                    "
                                >
                                    {radiusControls.map(
                                        (control) => (
                                            <div
                                                key={
                                                    control.key
                                                }
                                            >
                                                <div
                                                    className="
                                                        flex
                                                        justify-between
                                                        text-[10px]
                                                        text-slate-500
                                                        mb-1
                                                    "
                                                >
                                                    <span>
                                                        {
                                                            control.label
                                                        }
                                                    </span>

                                                    <span>
                                                        {
                                                            borderRadius[
                                                                control
                                                                    .key
                                                            ]
                                                        }
                                                        %
                                                    </span>
                                                </div>

                                                <input
                                                    type="range"
                                                    min="10"
                                                    max="90"
                                                    value={
                                                        borderRadius[
                                                            control
                                                                .key
                                                        ]
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateRadius(
                                                            control.key,
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    className="
                                                        w-full
                                                        accent-blue-600
                                                        cursor-pointer
                                                    "
                                                />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =================================================
                    FOOTER
                   ================================================= */}

                <div
                    className="
                        flex
                        items-center
                        justify-end
                        gap-2
                        px-6
                        py-4
                        bg-slate-50
                        border-t
                        border-slate-200
                        shrink-0
                    "
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            px-4
                            py-2
                            text-xs
                            font-medium
                            text-slate-600
                            hover:bg-slate-200
                            rounded-lg
                        "
                    >
                        Annuler
                    </button>

                    <button
                        type="button"
                        onClick={handleImport}
                        className="
                            flex
                            items-center
                            gap-1.5
                            px-4
                            py-2
                            text-xs
                            font-medium
                            text-white
                            bg-blue-600
                            hover:bg-blue-700
                            rounded-lg
                            shadow
                        "
                    >
                        <Check size={14} />

                        Insérer dans le document
                    </button>
                </div>
            </div>
        </div>
    );
}