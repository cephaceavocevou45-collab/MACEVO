/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : WatermarkGroup.jsx
 * Version : 10.0.0
 * Statut  : Studio Pro — Filigrane scientifique
 * ===========================================================
 */

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { createPortal } from "react-dom";

import {
    Stamp,
    Type,
    Image as ImageIcon,
    Trash2,
    X,
    Eye,
    Download,
    Upload,
    Wand2,
    Palette,
    Square,
    Circle,
    Maximize2,
    Sparkles,
    FileText,
    RefreshCw,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";
import { useLayoutContext } from "../../LayoutContext";


/* ===========================================================
   CONSTANTES
   =========================================================== */

const DEFAULT_PRESET = {
    watermarkType: "text",
    textContent: "CONFIDENTIEL",
    imageSrc: "",
    imageDisplayMode: "watermark",

    opacity: 0.15,
    brightness: 100,
    contrast: 100,

    rotation: -35,
    scale: 100,

    textColor: "#666666",
    hasShadow: false,

    removeBgColor: false,
    bgTolerance: 30,

    blendMode: "normal",
    maskShape: "none",

    imageFilter: "none",
    duotoneColor: "#2563eb",

    borderStyle: "none",
    borderColor: "#1e40af",
    borderWidth: 2,

    repeatFrequency: 3,
};


const VALID_DISPLAY_MODES = [
    "watermark",
    "cover",
    "contain",
    "grid",
];


const VALID_FILTERS = [
    "none",
    "grayscale",
    "sepia",
    "invert",
    "duotone",
];


const VALID_BORDER_STYLES = [
    "none",
    "solid",
    "dashed",
    "double",
];


const VALID_MASKS = [
    "none",
    "circle",
    "rounded",
    "square",
];


const VALID_BLEND_MODES = [
    "normal",
    "multiply",
    "screen",
    "overlay",
];


const VALID_TYPES = [
    "text",
    "image",
];


/* ===========================================================
   UTILITAIRES
   =========================================================== */

function clamp(value, min, max) {
    return Math.min(
        max,
        Math.max(min, value)
    );
}


function normalizePreset(data) {
    if (!data || typeof data !== "object") {
        return { ...DEFAULT_PRESET };
    }

    const result = {
        ...DEFAULT_PRESET,
    };

    if (VALID_TYPES.includes(data.watermarkType)) {
        result.watermarkType =
            data.watermarkType;
    }

    if (typeof data.textContent === "string") {
        result.textContent =
            data.textContent.slice(0, 200);
    }

    if (typeof data.imageSrc === "string") {
        result.imageSrc = data.imageSrc;
    }

    if (
        VALID_DISPLAY_MODES.includes(
            data.imageDisplayMode
        )
    ) {
        result.imageDisplayMode =
            data.imageDisplayMode;
    }

    if (Number.isFinite(data.opacity)) {
        result.opacity = clamp(
            Number(data.opacity),
            0.05,
            1
        );
    }

    if (Number.isFinite(data.brightness)) {
        result.brightness = clamp(
            Number(data.brightness),
            20,
            180
        );
    }

    if (Number.isFinite(data.contrast)) {
        result.contrast = clamp(
            Number(data.contrast),
            20,
            200
        );
    }

    if (Number.isFinite(data.rotation)) {
        result.rotation = clamp(
            Number(data.rotation),
            -90,
            90
        );
    }

    if (Number.isFinite(data.scale)) {
        result.scale = clamp(
            Number(data.scale),
            40,
            200
        );
    }

    if (
        typeof data.textColor === "string" &&
        /^#[0-9a-f]{6}$/i.test(data.textColor)
    ) {
        result.textColor =
            data.textColor;
    }

    if (typeof data.hasShadow === "boolean") {
        result.hasShadow =
            data.hasShadow;
    }

    if (typeof data.removeBgColor === "boolean") {
        result.removeBgColor =
            data.removeBgColor;
    }

    if (Number.isFinite(data.bgTolerance)) {
        result.bgTolerance = clamp(
            Number(data.bgTolerance),
            5,
            80
        );
    }

    if (
        VALID_BLEND_MODES.includes(
            data.blendMode
        )
    ) {
        result.blendMode =
            data.blendMode;
    }

    if (
        VALID_MASKS.includes(
            data.maskShape
        )
    ) {
        result.maskShape =
            data.maskShape;
    }

    if (
        VALID_FILTERS.includes(
            data.imageFilter
        )
    ) {
        result.imageFilter =
            data.imageFilter;
    }

    if (
        typeof data.duotoneColor === "string" &&
        /^#[0-9a-f]{6}$/i.test(
            data.duotoneColor
        )
    ) {
        result.duotoneColor =
            data.duotoneColor;
    }

    if (
        VALID_BORDER_STYLES.includes(
            data.borderStyle
        )
    ) {
        result.borderStyle =
            data.borderStyle;
    }

    if (
        typeof data.borderColor === "string" &&
        /^#[0-9a-f]{6}$/i.test(
            data.borderColor
        )
    ) {
        result.borderColor =
            data.borderColor;
    }

    if (Number.isFinite(data.borderWidth)) {
        result.borderWidth = clamp(
            Number(data.borderWidth),
            1,
            10
        );
    }

    if (Number.isFinite(data.repeatFrequency)) {
        result.repeatFrequency = clamp(
            Math.round(
                Number(data.repeatFrequency)
            ),
            2,
            4
        );
    }

    return result;
}


function findPageElements() {
    const selectors = [
        "#macevo-page",
        ".macevo-pagination-page",
        ".macevo-editor-page",
        "[data-macevo-page]",
    ];

    const pages = [];

    selectors.forEach((selector) => {
        document
            .querySelectorAll(selector)
            .forEach((element) => {
                if (!pages.includes(element)) {
                    pages.push(element);
                }
            });
    });

    return pages;
}


function createFilterString({
    opacity,
    brightness,
    contrast,
    hasShadow,
}) {
    const filters = [
        `opacity(${opacity})`,
        `brightness(${brightness}%)`,
        `contrast(${contrast}%)`,
    ];

    if (hasShadow) {
        filters.push(
            "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))"
        );
    }

    return filters.join(" ");
}


function applyMaskStyle(element, shape) {
    if (!element) {
        return;
    }

    if (shape === "circle") {
        element.style.borderRadius = "50%";
    } else if (shape === "rounded") {
        element.style.borderRadius = "16px";
    } else {
        element.style.borderRadius = "0";
    }
}


function applyBorderStyle(element, {
    borderStyle,
    borderColor,
    borderWidth,
}) {
    if (!element) {
        return;
    }

    element.style.border =
        "none";

    element.style.boxSizing =
        "border-box";

    if (borderStyle === "none") {
        return;
    }

    if (borderStyle === "double") {
        element.style.border =
            `${borderWidth}px double ${borderColor}`;
        return;
    }

    element.style.border =
        `${borderWidth}px ${
            borderStyle === "dashed"
                ? "dashed"
                : "solid"
        } ${borderColor}`;
}


/* ===========================================================
   COMPOSANT
   =========================================================== */

function WatermarkGroup() {
    const { layout, setWatermark } = useLayoutContext();
    const [isConfigOpen, setIsConfigOpen] =
        useState(false);

    const [watermarkType, setWatermarkType] =
        useState("text");

    const [textContent, setTextContent] =
        useState("CONFIDENTIEL");

    const [imageSrc, setImageSrc] =
        useState("");

    const [imageDisplayMode, setImageDisplayMode] =
        useState("watermark");

    const [opacity, setOpacity] =
        useState(0.15);

    const [brightness, setBrightness] =
        useState(100);

    const [contrast, setContrast] =
        useState(100);

    const [rotation, setRotation] =
        useState(-35);

    const [scale, setScale] =
        useState(100);

    const [textColor, setTextColor] =
        useState("#666666");

    const [hasShadow, setHasShadow] =
        useState(false);

    const [removeBgColor, setRemoveBgColor] =
        useState(false);

    const [bgTolerance, setBgTolerance] =
        useState(30);

    const [blendMode, setBlendMode] =
        useState("normal");

    const [maskShape, setMaskShape] =
        useState("none");

    const [imageFilter, setImageFilter] =
        useState("none");

    const [duotoneColor, setDuotoneColor] =
        useState("#2563eb");

    const [borderStyle, setBorderStyle] =
        useState("none");

    const [borderColor, setBorderColor] =
        useState("#1e40af");

    const [borderWidth, setBorderWidth] =
        useState(2);

    const [repeatFrequency, setRepeatFrequency] =
        useState(3);

    const [processedPreviewSrc, setProcessedPreviewSrc] =
        useState("");

    const [isProcessing, setIsProcessing] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const fileInputRef =
        useRef(null);

    const importPresetRef =
        useRef(null);

    const processingIdRef =
        useRef(0);


    /* =======================================================
       APPLIQUER UN PRESET
       ======================================================= */

    const applyPresetState = useCallback(
        (preset) => {
            const normalized =
                normalizePreset(preset);

            setWatermarkType(
                normalized.watermarkType
            );

            setTextContent(
                normalized.textContent
            );

            setImageSrc(
                normalized.imageSrc
            );

            setImageDisplayMode(
                normalized.imageDisplayMode
            );

            setOpacity(
                normalized.opacity
            );

            setBrightness(
                normalized.brightness
            );

            setContrast(
                normalized.contrast
            );

            setRotation(
                normalized.rotation
            );

            setScale(
                normalized.scale
            );

            setTextColor(
                normalized.textColor
            );

            setHasShadow(
                normalized.hasShadow
            );

            setRemoveBgColor(
                normalized.removeBgColor
            );

            setBgTolerance(
                normalized.bgTolerance
            );

            setBlendMode(
                normalized.blendMode
            );

            setMaskShape(
                normalized.maskShape
            );

            setImageFilter(
                normalized.imageFilter
            );

            setDuotoneColor(
                normalized.duotoneColor
            );

            setBorderStyle(
                normalized.borderStyle
            );

            setBorderColor(
                normalized.borderColor
            );

            setBorderWidth(
                normalized.borderWidth
            );

            setRepeatFrequency(
                normalized.repeatFrequency
            );
        },
        []
    );


    /* =======================================================
       TRAITEMENT IMAGE
       ======================================================= */

    const processImageAdvanced = useCallback(
        async (sourceSrc) => {
            if (!sourceSrc) {
                return "";
            }

            const currentId =
                ++processingIdRef.current;

            setIsProcessing(true);

            return new Promise((resolve) => {
                const img =
                    new window.Image();

                img.onload = () => {
                    try {
                        const canvas =
                            document.createElement(
                                "canvas"
                            );

                        canvas.width =
                            img.naturalWidth ||
                            img.width;

                        canvas.height =
                            img.naturalHeight ||
                            img.height;

                        const ctx =
                            canvas.getContext(
                                "2d",
                                {
                                    willReadFrequently:
                                        true,
                                }
                            );

                        if (!ctx) {
                            throw new Error(
                                "Canvas indisponible."
                            );
                        }

                        ctx.drawImage(
                            img,
                            0,
                            0
                        );


                        /* ---------------------------------
                           SUPPRESSION DU FOND
                        --------------------------------- */

                        if (removeBgColor) {
                            const imageData =
                                ctx.getImageData(
                                    0,
                                    0,
                                    canvas.width,
                                    canvas.height
                                );

                            const data =
                                imageData.data;

                            const refR =
                                data[0];

                            const refG =
                                data[1];

                            const refB =
                                data[2];

                            const threshold =
                                bgTolerance *
                                4.4;

                            for (
                                let i = 0;
                                i < data.length;
                                i += 4
                            ) {
                                const r =
                                    data[i];

                                const g =
                                    data[i + 1];

                                const b =
                                    data[i + 2];

                                const distance =
                                    Math.sqrt(
                                        Math.pow(
                                            r -
                                                refR,
                                            2
                                        ) +
                                        Math.pow(
                                            g -
                                                refG,
                                            2
                                        ) +
                                        Math.pow(
                                            b -
                                                refB,
                                            2
                                        )
                                    );

                                if (
                                    distance <=
                                    threshold
                                ) {
                                    data[i + 3] =
                                        0;
                                }
                            }

                            ctx.putImageData(
                                imageData,
                                0,
                                0
                            );
                        }


                        /* ---------------------------------
                           FILTRES
                        --------------------------------- */

                        if (
                            imageFilter !==
                                "none" &&
                            imageFilter !==
                                "duotone"
                        ) {
                            const imageData =
                                ctx.getImageData(
                                    0,
                                    0,
                                    canvas.width,
                                    canvas.height
                                );

                            const data =
                                imageData.data;

                            for (
                                let i = 0;
                                i < data.length;
                                i += 4
                            ) {
                                const r =
                                    data[i];

                                const g =
                                    data[i + 1];

                                const b =
                                    data[i + 2];

                                const a =
                                    data[i + 3];

                                if (a === 0) {
                                    continue;
                                }

                                if (
                                    imageFilter ===
                                    "grayscale"
                                ) {
                                    const gray =
                                        0.299 * r +
                                        0.587 * g +
                                        0.114 * b;

                                    data[i] =
                                        gray;

                                    data[i + 1] =
                                        gray;

                                    data[i + 2] =
                                        gray;
                                }

                                if (
                                    imageFilter ===
                                    "sepia"
                                ) {
                                    data[i] =
                                        Math.min(
                                            255,
                                            r * 0.393 +
                                                g *
                                                    0.769 +
                                                b *
                                                    0.189
                                        );

                                    data[i + 1] =
                                        Math.min(
                                            255,
                                            r * 0.349 +
                                                g *
                                                    0.686 +
                                                b *
                                                    0.168
                                        );

                                    data[i + 2] =
                                        Math.min(
                                            255,
                                            r * 0.272 +
                                                g *
                                                    0.534 +
                                                b *
                                                    0.131
                                        );
                                }

                                if (
                                    imageFilter ===
                                    "invert"
                                ) {
                                    data[i] =
                                        255 - r;

                                    data[i + 1] =
                                        255 - g;

                                    data[i + 2] =
                                        255 - b;
                                }
                            }

                            ctx.putImageData(
                                imageData,
                                0,
                                0
                            );
                        }


                        /* ---------------------------------
                           DUOTONE
                        --------------------------------- */

                        if (
                            imageFilter ===
                            "duotone"
                        ) {
                            const imageData =
                                ctx.getImageData(
                                    0,
                                    0,
                                    canvas.width,
                                    canvas.height
                                );

                            const data =
                                imageData.data;

                            const hex =
                                duotoneColor.replace(
                                    "#",
                                    ""
                                );

                            const targetR =
                                parseInt(
                                    hex.slice(
                                        0,
                                        2
                                    ),
                                    16
                                );

                            const targetG =
                                parseInt(
                                    hex.slice(
                                        2,
                                        4
                                    ),
                                    16
                                );

                            const targetB =
                                parseInt(
                                    hex.slice(
                                        4,
                                        6
                                    ),
                                    16
                                );

                            for (
                                let i = 0;
                                i < data.length;
                                i += 4
                            ) {
                                const r =
                                    data[i];

                                const g =
                                    data[i + 1];

                                const b =
                                    data[i + 2];

                                const luminance =
                                    (
                                        0.299 * r +
                                        0.587 * g +
                                        0.114 * b
                                    ) / 255;

                                data[i] =
                                    targetR *
                                    luminance;

                                data[i + 1] =
                                    targetG *
                                    luminance;

                                data[i + 2] =
                                    targetB *
                                    luminance;
                            }

                            ctx.putImageData(
                                imageData,
                                0,
                                0
                            );
                        }


                        /* ---------------------------------
                           BORDURE
                        --------------------------------- */

                        if (
                            borderStyle !==
                            "none"
                        ) {
                            ctx.save();

                            ctx.strokeStyle =
                                borderColor;

                            ctx.lineWidth =
                                borderWidth *
                                Math.max(
                                    1,
                                    canvas.width /
                                        400
                                );

                            if (
                                borderStyle ===
                                "dashed"
                            ) {
                                ctx.setLineDash([
                                    15,
                                    10,
                                ]);

                                ctx.strokeRect(
                                    ctx.lineWidth /
                                        2,
                                    ctx.lineWidth /
                                        2,
                                    canvas.width -
                                        ctx.lineWidth,
                                    canvas.height -
                                        ctx.lineWidth
                                );
                            } else if (
                                borderStyle ===
                                "double"
                            ) {
                                const outer =
                                    ctx.lineWidth /
                                    2;

                                const inner =
                                    ctx.lineWidth *
                                    2;

                                ctx.strokeRect(
                                    outer,
                                    outer,
                                    canvas.width -
                                        outer * 2,
                                    canvas.height -
                                        outer * 2
                                );

                                ctx.strokeRect(
                                    inner,
                                    inner,
                                    canvas.width -
                                        inner * 2,
                                    canvas.height -
                                        inner * 2
                                );
                            } else {
                                ctx.strokeRect(
                                    ctx.lineWidth /
                                        2,
                                    ctx.lineWidth /
                                        2,
                                    canvas.width -
                                        ctx.lineWidth,
                                    canvas.height -
                                        ctx.lineWidth
                                );
                            }

                            ctx.restore();
                        }

                        const result =
                            canvas.toDataURL(
                                "image/png"
                            );

                        if (
                            currentId ===
                            processingIdRef.current
                        ) {
                            setProcessedPreviewSrc(
                                result
                            );
                        }

                        resolve(result);
                    } catch (error) {
                        console.error(
                            "MACEVO — traitement image :",
                            error
                        );

                        resolve("");
                    } finally {
                        if (
                            currentId ===
                            processingIdRef.current
                        ) {
                            setIsProcessing(false);
                        }
                    }
                };

                img.onerror = () => {
                    if (
                        currentId ===
                        processingIdRef.current
                    ) {
                        setIsProcessing(false);
                    }

                    resolve("");
                };

                /*
                 * Les images locales DataURL ne nécessitent
                 * pas de crossOrigin.
                 */
                if (
                    !sourceSrc.startsWith(
                        "data:"
                    )
                ) {
                    img.crossOrigin =
                        "anonymous";
                }

                img.src = sourceSrc;
            });
        },
        [
            removeBgColor,
            bgTolerance,
            imageFilter,
            duotoneColor,
            borderStyle,
            borderColor,
            borderWidth,
        ]
    );


    /* =======================================================
       APERÇU IMAGE
       ======================================================= */

    useEffect(() => {
        if (
            watermarkType !== "image" ||
            !imageSrc
        ) {
            processingIdRef.current += 1;
            setProcessedPreviewSrc("");
            setIsProcessing(false);
            return;
        }

        processImageAdvanced(
            imageSrc
        );
    }, [
        watermarkType,
        imageSrc,
        processImageAdvanced,
    ]);


    /* =======================================================
       APPLICATION SUR LES PAGES
       ======================================================= */

    const applyWatermarkToAll = useCallback(async () => {
        setErrorMessage("");
        let processedSrc = processedPreviewSrc;
        if (watermarkType === "image" && imageSrc) processedSrc = await processImageAdvanced(imageSrc);
        if (watermarkType === "image" && !processedSrc) { setErrorMessage("Choisissez une image avant d'appliquer le filigrane."); return; }
        setWatermark({ watermarkType, textContent: textContent || "MACEVO", imageSrc: processedSrc || imageSrc, imageDisplayMode, opacity, brightness, contrast, rotation, scale, textColor, hasShadow, blendMode, maskShape, repeatFrequency });
        setIsConfigOpen(false);
    }, [setWatermark, watermarkType, textContent, imageSrc, imageDisplayMode, opacity, brightness, contrast, rotation, scale, textColor, hasShadow, blendMode, maskShape, repeatFrequency, processedPreviewSrc, processImageAdvanced]);


    /* =======================================================
       SUPPRESSION
       ======================================================= */

    const removeWatermark = () => {
        document
            .querySelectorAll(
                ".macevo-watermark-container"
            )
            .forEach((element) =>
                element.remove()
            );
    };


    /* =======================================================
       IMAGE LOCALE
       ======================================================= */

    const handleImageFileChange =
        (event) => {
            const file =
                event.target.files?.[0];

            if (!file) {
                return;
            }

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {
                setErrorMessage(
                    "Le fichier sélectionné n'est pas une image."
                );

                return;
            }

            const reader =
                new FileReader();

            reader.onload = (
                loadEvent
            ) => {
                const result =
                    loadEvent.target?.result;

                if (
                    typeof result !==
                    "string"
                ) {
                    return;
                }

                setImageSrc(result);
                setWatermarkType(
                    "image"
                );
                setErrorMessage("");
                setIsConfigOpen(true);
            };

            reader.onerror = () => {
                setErrorMessage(
                    "Impossible de lire l'image."
                );
            };

            reader.readAsDataURL(
                file
            );

            event.target.value = "";
        };


    /* =======================================================
       EXPORT CANVAS
       ======================================================= */

    const generateExportCanvas =
        async () => {
            const canvas =
                document.createElement(
                    "canvas"
                );

            canvas.width = 1200;
            canvas.height = 1700;

            const ctx =
                canvas.getContext(
                    "2d"
                );

            if (!ctx) {
                throw new Error(
                    "Canvas indisponible."
                );
            }

            ctx.fillStyle =
                "#FFFFFF";

            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            ctx.globalAlpha =
                opacity;

            ctx.globalCompositeOperation =
                blendMode === "multiply"
                    ? "multiply"
                    : blendMode === "screen"
                    ? "screen"
                    : blendMode ===
                      "overlay"
                    ? "overlay"
                    : "source-over";

            ctx.filter =
                `brightness(${brightness}%) contrast(${contrast}%)`;

            if (hasShadow) {
                ctx.shadowColor =
                    "rgba(0,0,0,0.3)";

                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 5;
                ctx.shadowOffsetY = 5;
            }


            /* -----------------------------------------
               TEXTE
            ----------------------------------------- */

            if (
                watermarkType ===
                "text"
            ) {
                ctx.save();

                ctx.translate(
                    canvas.width / 2,
                    canvas.height / 2
                );

                ctx.rotate(
                    (rotation *
                        Math.PI) /
                        180
                );

                ctx.font =
                    `bold ${Math.round(
                        90 *
                            (scale /
                                100)
                    )}px Arial`;

                ctx.fillStyle =
                    textColor;

                ctx.textAlign =
                    "center";

                ctx.textBaseline =
                    "middle";

                ctx.fillText(
                    textContent ||
                        "MACEVO",
                    0,
                    0
                );

                ctx.restore();

                return canvas;
            }


            /* -----------------------------------------
               IMAGE
            ----------------------------------------- */

            if (
                watermarkType ===
                    "image" &&
                imageSrc
            ) {
                const processed =
                    await processImageAdvanced(
                        imageSrc
                    );

                if (!processed) {
                    throw new Error(
                        "Impossible de traiter l'image."
                    );
                }

                const image =
                    await new Promise(
                        (
                            resolve,
                            reject
                        ) => {
                            const img =
                                new window.Image();

                            img.onload = () =>
                                resolve(img);

                            img.onerror = () =>
                                reject(
                                    new Error(
                                        "Impossible de charger l'image exportée."
                                    )
                                );

                            img.src =
                                processed;
                        }
                    );


                /* -------------------------------------
                   GRILLE
                ------------------------------------- */

                if (
                    imageDisplayMode ===
                    "grid"
                ) {
                    const cellWidth =
                        canvas.width /
                        repeatFrequency;

                    const cellHeight =
                        canvas.height /
                        repeatFrequency;

                    for (
                        let row = 0;
                        row <
                        repeatFrequency;
                        row += 1
                    ) {
                        for (
                            let col = 0;
                            col <
                            repeatFrequency;
                            col += 1
                        ) {
                            ctx.save();

                            const centerX =
                                col *
                                    cellWidth +
                                cellWidth /
                                    2;

                            const centerY =
                                row *
                                    cellHeight +
                                cellHeight /
                                    2;

                            ctx.translate(
                                centerX,
                                centerY
                            );

                            ctx.rotate(
                                (rotation *
                                    Math.PI) /
                                    180
                            );

                            const ratio =
                                Math.min(
                                    (cellWidth *
                                        0.7) /
                                        image.width,
                                    (cellHeight *
                                        0.7) /
                                        image.height
                                ) *
                                (scale /
                                    100);

                            const width =
                                image.width *
                                ratio;

                            const height =
                                image.height *
                                ratio;

                            ctx.drawImage(
                                image,
                                -width / 2,
                                -height / 2,
                                width,
                                height
                            );

                            ctx.restore();
                        }
                    }

                    return canvas;
                }


                /* -------------------------------------
                   COVER
                ------------------------------------- */

                if (
                    imageDisplayMode ===
                    "cover"
                ) {
                    ctx.drawImage(
                        image,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    return canvas;
                }


                /* -------------------------------------
                   CONTAIN
                ------------------------------------- */

                if (
                    imageDisplayMode ===
                    "contain"
                ) {
                    const ratio =
                        Math.min(
                            canvas.width /
                                image.width,
                            canvas.height /
                                image.height
                        ) *
                        (scale /
                            100);

                    const width =
                        image.width *
                        ratio;

                    const height =
                        image.height *
                        ratio;

                    const x =
                        (canvas.width -
                            width) /
                        2;

                    const y =
                        (canvas.height -
                            height) /
                        2;

                    ctx.drawImage(
                        image,
                        x,
                        y,
                        width,
                        height
                    );

                    return canvas;
                }


                /* -------------------------------------
                   WATERMARK
                ------------------------------------- */

                ctx.save();

                ctx.translate(
                    canvas.width / 2,
                    canvas.height / 2
                );

                ctx.rotate(
                    (rotation *
                        Math.PI) /
                        180
                );

                const maxWidth =
                    700 *
                    (scale / 100);

                const maxHeight =
                    700 *
                    (scale / 100);

                const ratio =
                    Math.min(
                        maxWidth /
                            image.width,
                        maxHeight /
                            image.height
                    );

                const width =
                    image.width *
                    ratio;

                const height =
                    image.height *
                    ratio;

                ctx.drawImage(
                    image,
                    -width / 2,
                    -height / 2,
                    width,
                    height
                );

                ctx.restore();
            }

            return canvas;
        };


    /* =======================================================
       TÉLÉCHARGEMENT
       ======================================================= */

    const handleDownload =
        async (format) => {
            try {
                setErrorMessage("");

                const canvas =
                    await generateExportCanvas();

                const mime =
                    format === "jpeg"
                        ? "image/jpeg"
                        : "image/png";

                const extension =
                    format === "jpeg"
                        ? "jpg"
                        : "png";

                const dataUrl =
                    canvas.toDataURL(
                        mime,
                        0.95
                    );

                const link =
                    document.createElement(
                        "a"
                    );

                link.href =
                    dataUrl;

                link.download =
                    `macevo-filigrane-${watermarkType}.${extension}`;

                document.body.appendChild(
                    link
                );

                link.click();

                link.remove();
            } catch (error) {
                console.error(
                    "MACEVO — export filigrane :",
                    error
                );

                setErrorMessage(
                    error?.message ||
                        "Impossible de générer l'image."
                );
            }
        };


    /* =======================================================
       EXPORT PRESET
       ======================================================= */

    const handleExportPreset =
        () => {
            const preset = {
                watermarkType,
                textContent,
                imageSrc,
                imageDisplayMode,
                opacity,
                brightness,
                contrast,
                rotation,
                scale,
                textColor,
                hasShadow,
                removeBgColor,
                bgTolerance,
                blendMode,
                maskShape,
                imageFilter,
                duotoneColor,
                borderStyle,
                borderColor,
                borderWidth,
                repeatFrequency,
            };

            const blob =
                new Blob(
                    [
                        JSON.stringify(
                            preset,
                            null,
                            2
                        ),
                    ],
                    {
                        type:
                            "application/json",
                    }
                );

            const url =
                URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement(
                    "a"
                );

            link.href = url;

            link.download =
                "macevo-watermark-preset.json";

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            URL.revokeObjectURL(url);
        };


    /* =======================================================
       IMPORT PRESET
       ======================================================= */

    const handleImportPreset =
        (event) => {
            const file =
                event.target.files?.[0];

            if (!file) {
                return;
            }

            const reader =
                new FileReader();

            reader.onload = (
                loadEvent
            ) => {
                try {
                    const parsed =
                        JSON.parse(
                            loadEvent
                                .target
                                ?.result
                        );

                    applyPresetState(
                        parsed
                    );

                    setErrorMessage("");
                    setIsConfigOpen(
                        true
                    );
                } catch (error) {
                    console.error(
                        "MACEVO — import preset :",
                        error
                    );

                    setErrorMessage(
                        "Le preset sélectionné est invalide."
                    );
                }
            };

            reader.onerror = () => {
                setErrorMessage(
                    "Impossible de lire le preset."
                );
            };

            reader.readAsText(
                file
            );

            event.target.value = "";
        };


    /* =======================================================
       PRESET STANDARD
       ======================================================= */

    const applyStandard = () => {
        setWatermarkType("text"); setTextContent("MACEVO"); setOpacity(0.15); setBrightness(100); setContrast(100); setRotation(-35); setScale(100); setTextColor("#666666"); setHasShadow(false); setBlendMode("normal");
        setWatermark({ watermarkType: "text", textContent: "MACEVO", opacity: 0.15, rotation: -35, scale: 100, textColor: "#666666", hasShadow: false, blendMode: "normal" });
        setErrorMessage("");
    };


    /* =======================================================
       RENDU
       ======================================================= */

    return (
        <RibbonGroup
            title="Filigrane Pro"
            className="w-[220px] min-w-[220px]"
        >
            <div className="grid w-full grid-cols-4 gap-1">

                <RibbonButton
                    icon={Stamp}
                    label="Standard"
                    tooltip="Appliquer le filigrane MACEVO standard"
                    onClick={
                        applyStandard
                    }
                />

                <RibbonButton
                    icon={Type}
                    label="Texte"
                    tooltip="Configurer un filigrane texte"
                    onClick={() => {
                        setWatermarkType(
                            "text"
                        );
                        setIsConfigOpen(
                            true
                        );
                    }}
                />

                <RibbonButton
                    icon={ImageIcon}
                    label="Image"
                    tooltip="Importer une image comme filigrane"
                    onClick={() =>
                        fileInputRef.current?.click()
                    }
                />

                <RibbonButton
                    icon={Trash2}
                    label="Effacer"
                    tooltip="Supprimer tous les filigranes"
                    onClick={
                        removeWatermark
                    }
                />

            </div>


            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={
                    handleImageFileChange
                }
                className="hidden"
            />

            <input
                ref={importPresetRef}
                type="file"
                accept=".json,application/json"
                onChange={
                    handleImportPreset
                }
                className="hidden"
            />


            {/* =================================================
                STUDIO PRO
            ================================================= */}

            {isConfigOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] p-4"
                        onMouseDown={(
                            event
                        ) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setIsConfigOpen(
                                    false
                                );

                                setErrorMessage(
                                    ""
                                );
                            }
                        }}
                    >
                        <div
                            className="bg-white rounded-xl shadow-2xl border border-gray-300 w-[960px] max-w-[95vw] max-h-[92vh] overflow-hidden flex flex-col"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="macevo-watermark-title"
                        >

                            {/* HEADER */}

                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">

                                <h3
                                    id="macevo-watermark-title"
                                    className="text-sm font-bold text-gray-800 flex items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4 text-blue-600" />

                                    Studio Pro MACEVO —
                                    Filigrane scientifique
                                </h3>

                                <div className="flex items-center gap-2">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            importPresetRef.current?.click()
                                        }
                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 shadow-sm"
                                    >
                                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                                        Importer
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleExportPreset
                                        }
                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 shadow-sm"
                                    >
                                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                        Sauvegarder
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsConfigOpen(
                                                false
                                            );
                                            setErrorMessage(
                                                ""
                                            );
                                        }}
                                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded"
                                        aria-label="Fermer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                </div>

                            </div>


                            {/* ERREUR */}

                            {errorMessage && (
                                <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>
                                        {errorMessage}
                                    </span>
                                </div>
                            )}


                            <div className="flex flex-col md:flex-row flex-1 min-h-0">

                                {/* =================================
                                    PANNEAU CONFIGURATION
                                ================================= */}

                                <form
                                    onSubmit={async (
                                        event
                                    ) => {
                                        event.preventDefault();

                                        await applyWatermarkToAll();

                                        if (
                                            !errorMessage
                                        ) {
                                            setIsConfigOpen(
                                                false
                                            );
                                        }
                                    }}
                                    className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto border-r border-gray-200"
                                >

                                    {/* TYPE TEXTE */}

                                    {watermarkType ===
                                        "text" && (
                                        <div className="grid grid-cols-3 gap-3 items-end">

                                            <div className="col-span-2">

                                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                    Texte du filigrane
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        textContent
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setTextContent(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    maxLength={
                                                        200
                                                    }
                                                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                                                    required
                                                />

                                            </div>

                                            <div>

                                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                    Couleur
                                                </label>

                                                <div className="flex items-center gap-2">

                                                    <input
                                                        type="color"
                                                        value={
                                                            textColor
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setTextColor(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        className="w-9 h-8 rounded border border-gray-300 cursor-pointer p-0.5 bg-white"
                                                    />

                                                    <span className="text-[11px] font-mono text-gray-500">
                                                        {
                                                            textColor
                                                        }
                                                    </span>

                                                </div>

                                            </div>

                                        </div>
                                    )}


                                    {/* TYPE IMAGE */}

                                    {watermarkType ===
                                        "image" && (
                                        <div className="flex flex-col gap-3">

                                            <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg">

                                                <div className="flex items-center gap-3">

                                                    {imageSrc ? (
                                                        <img
                                                            src={
                                                                imageSrc
                                                            }
                                                            alt="Image source"
                                                            className="w-10 h-10 object-contain bg-white border border-gray-200 rounded"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-white border border-gray-200 rounded flex items-center justify-center">
                                                            <ImageIcon className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    )}

                                                    <span className="text-xs font-medium text-gray-700">
                                                        Image du filigrane
                                                    </span>

                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        fileInputRef.current?.click()
                                                    }
                                                    className="text-xs text-blue-600 hover:underline font-semibold"
                                                >
                                                    Remplacer
                                                </button>

                                            </div>


                                            {/* FOND */}

                                            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg flex flex-col gap-2.5">

                                                <div className="flex items-center justify-between">

                                                    <div className="flex items-center gap-2">

                                                        <Wand2 className="w-4 h-4 text-blue-600" />

                                                        <span className="text-xs font-bold text-blue-900">
                                                            Suppression du fond
                                                        </span>

                                                    </div>

                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            removeBgColor
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setRemoveBgColor(
                                                                event
                                                                    .target
                                                                    .checked
                                                            )
                                                        }
                                                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                    />

                                                </div>

                                                {removeBgColor && (
                                                    <div className="pt-2 border-t border-blue-200/60">

                                                        <div className="flex justify-between text-[11px] text-gray-600 font-medium mb-1">

                                                            <span>
                                                                Tolérance
                                                            </span>

                                                            <span>
                                                                {
                                                                    bgTolerance
                                                                }
                                                            </span>

                                                        </div>

                                                        <input
                                                            type="range"
                                                            min="5"
                                                            max="80"
                                                            value={
                                                                bgTolerance
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setBgTolerance(
                                                                    Number(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                )
                                                            }
                                                            className="w-full accent-blue-600"
                                                        />

                                                    </div>
                                                )}

                                            </div>


                                            {/* FILTRE */}

                                            <div className="grid grid-cols-2 gap-3">

                                                <div>

                                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                        Filtre
                                                    </label>

                                                    <select
                                                        value={
                                                            imageFilter
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setImageFilter(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white"
                                                    >
                                                        <option value="none">
                                                            Aucun
                                                        </option>
                                                        <option value="grayscale">
                                                            Noir & blanc
                                                        </option>
                                                        <option value="sepia">
                                                            Sépia
                                                        </option>
                                                        <option value="duotone">
                                                            Duotone
                                                        </option>
                                                        <option value="invert">
                                                            Inversé
                                                        </option>
                                                    </select>

                                                </div>

                                                {imageFilter ===
                                                    "duotone" && (
                                                    <div>

                                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                            Teinte
                                                        </label>

                                                        <div className="flex items-center gap-2">

                                                            <input
                                                                type="color"
                                                                value={
                                                                    duotoneColor
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setDuotoneColor(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-9 h-7 rounded border border-gray-300 cursor-pointer p-0.5 bg-white"
                                                            />

                                                            <span className="text-[11px] font-mono text-gray-500">
                                                                {
                                                                    duotoneColor
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>
                                                )}

                                            </div>


                                            {/* BORDURE */}

                                            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-2">

                                                <div className="flex items-center justify-between">

                                                    <span className="text-xs font-bold text-gray-800">
                                                        Bordure
                                                    </span>

                                                    <select
                                                        value={
                                                            borderStyle
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setBorderStyle(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        className="px-2 py-1 text-[11px] border border-gray-300 rounded bg-white"
                                                    >
                                                        <option value="none">
                                                            Aucune
                                                        </option>
                                                        <option value="solid">
                                                            Continue
                                                        </option>
                                                        <option value="dashed">
                                                            Pointillée
                                                        </option>
                                                        <option value="double">
                                                            Double
                                                        </option>
                                                    </select>

                                                </div>

                                                {borderStyle !==
                                                    "none" && (
                                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">

                                                        <div className="flex items-center gap-2">

                                                            <input
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
                                                                className="w-7 h-6 rounded border border-gray-300 cursor-pointer p-0.5 bg-white"
                                                            />

                                                            <span className="text-[11px] text-gray-600">
                                                                Couleur
                                                            </span>

                                                        </div>

                                                        <div className="flex items-center gap-2">

                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="10"
                                                                value={
                                                                    borderWidth
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setBorderWidth(
                                                                        Number(
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                                className="w-full accent-blue-600"
                                                            />

                                                            <span className="text-[10px] text-gray-500">
                                                                {
                                                                    borderWidth
                                                                }
                                                                px
                                                            </span>

                                                        </div>

                                                    </div>
                                                )}

                                            </div>

                                        </div>
                                    )}


                                    {/* MODE IMAGE */}

                                    {watermarkType ===
                                        "image" && (
                                        <div>

                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                Mode d'affichage
                                            </label>

                                            <div className="grid grid-cols-4 gap-1.5">

                                                {[
                                                    [
                                                        "watermark",
                                                        "Oblique",
                                                    ],
                                                    [
                                                        "cover",
                                                        "Plein écran",
                                                    ],
                                                    [
                                                        "contain",
                                                        "Centré",
                                                    ],
                                                    [
                                                        "grid",
                                                        "Grille",
                                                    ],
                                                ].map(
                                                    ([
                                                        value,
                                                        label,
                                                    ]) => (
                                                        <button
                                                            key={
                                                                value
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                                setImageDisplayMode(
                                                                    value
                                                                )
                                                            }
                                                            className={`px-2 py-2 text-[10px] font-medium rounded border ${
                                                                imageDisplayMode ===
                                                                value
                                                                    ? "border-blue-600 bg-blue-50 text-blue-700"
                                                                    : "border-gray-200 bg-white text-gray-600"
                                                            }`}
                                                        >
                                                            {
                                                                label
                                                            }
                                                        </button>
                                                    )
                                                )}

                                            </div>

                                        </div>
                                    )}


                                    {/* GRILLE */}

                                    {watermarkType ===
                                        "image" &&
                                        imageDisplayMode ===
                                            "grid" && (
                                            <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg">

                                                <span className="text-xs font-medium text-gray-700">
                                                    Densité
                                                </span>

                                                <select
                                                    value={
                                                        repeatFrequency
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setRepeatFrequency(
                                                            Number(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        )
                                                    }
                                                    className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                                                >
                                                    <option value="2">
                                                        2 × 2
                                                    </option>
                                                    <option value="3">
                                                        3 × 3
                                                    </option>
                                                    <option value="4">
                                                        4 × 4
                                                    </option>
                                                </select>

                                            </div>
                                        )}


                                    {/* MASQUE */}

                                    {watermarkType ===
                                        "image" && (
                                        <div>

                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                Forme / Sceau
                                            </label>

                                            <div className="grid grid-cols-4 gap-2">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setMaskShape(
                                                            "none"
                                                        )
                                                    }
                                                    className={`px-2 py-1.5 text-[11px] rounded border flex items-center justify-center gap-1 ${
                                                        maskShape ===
                                                        "none"
                                                            ? "border-blue-600 bg-blue-50 text-blue-700"
                                                            : "border-gray-200 bg-white"
                                                    }`}
                                                >
                                                    <Maximize2 className="w-3 h-3" />
                                                    Standard
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setMaskShape(
                                                            "circle"
                                                        )
                                                    }
                                                    className={`px-2 py-1.5 text-[11px] rounded border flex items-center justify-center gap-1 ${
                                                        maskShape ===
                                                        "circle"
                                                            ? "border-blue-600 bg-blue-50 text-blue-700"
                                                            : "border-gray-200 bg-white"
                                                    }`}
                                                >
                                                    <Circle className="w-3 h-3" />
                                                    Rond
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setMaskShape(
                                                            "rounded"
                                                        )
                                                    }
                                                    className={`px-2 py-1.5 text-[11px] rounded border flex items-center justify-center gap-1 ${
                                                        maskShape ===
                                                        "rounded"
                                                            ? "border-blue-600 bg-blue-50 text-blue-700"
                                                            : "border-gray-200 bg-white"
                                                    }`}
                                                >
                                                    <Square className="w-3 h-3" />
                                                    Arrondi
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setMaskShape(
                                                            "square"
                                                        )
                                                    }
                                                    className={`px-2 py-1.5 text-[11px] rounded border flex items-center justify-center gap-1 ${
                                                        maskShape ===
                                                        "square"
                                                            ? "border-blue-600 bg-blue-50 text-blue-700"
                                                            : "border-gray-200 bg-white"
                                                    }`}
                                                >
                                                    <Square className="w-3 h-3" />
                                                    Carré
                                                </button>

                                            </div>

                                        </div>
                                    )}


                                    {/* PARAMÈTRES GÉNÉRAUX */}

                                    <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">

                                        {/* OPACITÉ */}

                                        <div>

                                            <div className="flex justify-between items-center mb-1">

                                                <label className="text-xs font-semibold text-gray-700">
                                                    Opacité
                                                </label>

                                                <span className="text-xs font-mono text-gray-500">
                                                    {
                                                        Math.round(
                                                            opacity *
                                                                100
                                                        )
                                                    }
                                                    %
                                                </span>

                                            </div>

                                            <input
                                                type="range"
                                                min="0.05"
                                                max="1"
                                                step="0.01"
                                                value={
                                                    opacity
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setOpacity(
                                                        Number(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    )
                                                }
                                                className="w-full accent-blue-600"
                                            />

                                        </div>


                                        {/* ROTATION */}

                                        {(watermarkType ===
                                            "text" ||
                                            imageDisplayMode ===
                                                "watermark" ||
                                            imageDisplayMode ===
                                                "grid") && (
                                            <div>

                                                <div className="flex justify-between items-center mb-1">

                                                    <label className="text-xs font-semibold text-gray-700">
                                                        Rotation
                                                    </label>

                                                    <span className="text-xs font-mono text-gray-500">
                                                        {
                                                            rotation
                                                        }
                                                        °
                                                    </span>

                                                </div>

                                                <input
                                                    type="range"
                                                    min="-90"
                                                    max="90"
                                                    value={
                                                        rotation
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setRotation(
                                                            Number(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        )
                                                    }
                                                    className="w-full accent-blue-600"
                                                />

                                            </div>
                                        )}


                                        {/* ÉCHELLE */}

                                        <div>

                                            <div className="flex justify-between items-center mb-1">

                                                <label className="text-xs font-semibold text-gray-700">
                                                    Taille / échelle
                                                </label>

                                                <span className="text-xs font-mono text-gray-500">
                                                    {
                                                        scale
                                                    }
                                                    %
                                                </span>

                                            </div>

                                            <input
                                                type="range"
                                                min="40"
                                                max="200"
                                                value={
                                                    scale
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setScale(
                                                        Number(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    )
                                                }
                                                className="w-full accent-blue-600"
                                            />

                                        </div>


                                        {/* BLEND */}

                                        <div>

                                            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-1.5">
                                                <Palette className="w-3.5 h-3.5 text-blue-600" />
                                                Mode de fusion
                                            </label>

                                            <select
                                                value={
                                                    blendMode
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setBlendMode(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md bg-white"
                                            >
                                                <option value="normal">
                                                    Normal
                                                </option>
                                                <option value="multiply">
                                                    Produit
                                                </option>
                                                <option value="screen">
                                                    Superposition
                                                </option>
                                                <option value="overlay">
                                                    Incrustation
                                                </option>
                                            </select>

                                        </div>


                                        {/* IMAGE CORRECTIONS */}

                                        {watermarkType ===
                                            "image" && (
                                            <div className="grid grid-cols-2 gap-3">

                                                <div>

                                                    <div className="flex justify-between items-center mb-1">

                                                        <label className="text-xs font-semibold text-gray-700">
                                                            Luminosité
                                                        </label>

                                                        <span className="text-xs font-mono text-gray-500">
                                                            {
                                                                brightness
                                                            }
                                                            %
                                                        </span>

                                                    </div>

                                                    <input
                                                        type="range"
                                                        min="20"
                                                        max="180"
                                                        value={
                                                            brightness
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setBrightness(
                                                                Number(
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                        className="w-full accent-blue-600"
                                                    />

                                                </div>


                                                <div>

                                                    <div className="flex justify-between items-center mb-1">

                                                        <label className="text-xs font-semibold text-gray-700">
                                                            Contraste
                                                        </label>

                                                        <span className="text-xs font-mono text-gray-500">
                                                            {
                                                                contrast
                                                            }
                                                            %
                                                        </span>

                                                    </div>

                                                    <input
                                                        type="range"
                                                        min="20"
                                                        max="200"
                                                        value={
                                                            contrast
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setContrast(
                                                                Number(
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                        className="w-full accent-blue-600"
                                                    />

                                                </div>

                                            </div>
                                        )}


                                        {/* OMBRE */}

                                        <label className="flex items-center gap-2 pt-1 cursor-pointer">

                                            <input
                                                type="checkbox"
                                                checked={
                                                    hasShadow
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setHasShadow(
                                                        event
                                                            .target
                                                            .checked
                                                    )
                                                }
                                                className="w-4 h-4 accent-blue-600"
                                            />

                                            <span className="text-xs font-medium text-gray-700">
                                                Ajouter une ombre portée
                                            </span>

                                        </label>

                                    </div>


                                    {/* FOOTER FORMULAIRE */}

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto gap-2">

                                        <div className="flex items-center gap-1.5">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDownload(
                                                        "jpeg"
                                                    )
                                                }
                                                className="flex items-center gap-1 px-2.5 py-2 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                JPEG
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDownload(
                                                        "png"
                                                    )
                                                }
                                                className="flex items-center gap-1 px-2.5 py-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                PNG
                                            </button>

                                        </div>

                                        <div className="flex gap-2">

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsConfigOpen(
                                                        false
                                                    );
                                                    setErrorMessage(
                                                        ""
                                                    );
                                                }}
                                                className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                                            >
                                                Annuler
                                            </button>

                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm flex items-center gap-1.5"
                                            >
                                                <CheckIcon />
                                                Appliquer
                                            </button>

                                        </div>

                                    </div>

                                </form>


                                {/* =================================
                                    APERÇU
                                ================================= */}

                                <div className="w-full md:w-[340px] bg-gray-100 p-6 flex flex-col items-center justify-center relative border-t md:border-t-0 md:border-l border-gray-200">

                                    <div className="absolute top-3 left-4 flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">

                                        <Eye className="w-3.5 h-3.5 text-blue-600" />

                                        Aperçu en direct

                                    </div>


                                    <div className="w-[200px] h-[280px] bg-white shadow-lg border border-gray-300 rounded relative overflow-hidden flex items-center justify-center mt-4">

                                        <div className="absolute inset-4 flex flex-col gap-1.5 opacity-20 pointer-events-none">

                                            <div className="w-3/4 h-2 bg-gray-800 rounded" />
                                            <div className="w-full h-1.5 bg-gray-600 rounded" />
                                            <div className="w-5/6 h-1.5 bg-gray-600 rounded" />
                                            <div className="w-full h-1.5 bg-gray-600 rounded" />

                                        </div>


                                        {watermarkType ===
                                            "text" ? (
                                            <div
                                                className="absolute pointer-events-none flex items-center justify-center"
                                                style={{
                                                    top:
                                                        "50%",
                                                    left:
                                                        "50%",
                                                    transform:
                                                        `translate(-50%, -50%) rotate(${rotation}deg)`,
                                                    filter:
                                                        createFilterString(
                                                            {
                                                                opacity,
                                                                brightness: 100,
                                                                contrast: 100,
                                                                hasShadow,
                                                            }
                                                        ),
                                                    mixBlendMode:
                                                        blendMode,
                                                }}
                                            >
                                                <span
                                                    className="font-bold whitespace-nowrap"
                                                    style={{
                                                        fontSize:
                                                            `${Math.round(
                                                                18 *
                                                                    (scale /
                                                                        100)
                                                            )}px`,
                                                        color:
                                                            textColor,
                                                    }}
                                                >
                                                    {
                                                        textContent ||
                                                            "MACEVO"
                                                    }
                                                </span>
                                            </div>
                                        ) : processedPreviewSrc ? (
                                            <div
                                                className="absolute pointer-events-none flex items-center justify-center"
                                                style={{
                                                    ...(imageDisplayMode ===
                                                    "cover"
                                                        ? {
                                                              inset:
                                                                  "0",
                                                              width:
                                                                  "100%",
                                                              height:
                                                                  "100%",
                                                          }
                                                        : imageDisplayMode ===
                                                          "contain"
                                                        ? {
                                                              inset:
                                                                  "0",
                                                              display:
                                                                  "flex",
                                                              alignItems:
                                                                  "center",
                                                              justifyContent:
                                                                  "center",
                                                          }
                                                        : {
                                                              top:
                                                                  "50%",
                                                              left:
                                                                  "50%",
                                                              transform:
                                                                  `translate(-50%, -50%) rotate(${rotation}deg)`,
                                                          }),
                                                    filter:
                                                        createFilterString(
                                                            {
                                                                opacity,
                                                                brightness: 100,
                                                                contrast: 100,
                                                                hasShadow,
                                                            }
                                                        ),
                                                    mixBlendMode:
                                                        blendMode,
                                                }}
                                            >

                                                {imageDisplayMode ===
                                                "grid" ? (
                                                    <div
                                                        className="grid gap-2 p-2"
                                                        style={{
                                                            gridTemplateColumns:
                                                                `repeat(${repeatFrequency}, 1fr)`,
                                                        }}
                                                    >
                                                        {Array.from(
                                                            {
                                                                length:
                                                                    repeatFrequency *
                                                                    repeatFrequency,
                                                            }
                                                        ).map(
                                                            (
                                                                _,
                                                                index
                                                            ) => (
                                                                <img
                                                                    key={
                                                                        index
                                                                    }
                                                                    src={
                                                                        processedPreviewSrc
                                                                    }
                                                                    alt=""
                                                                    className="object-contain"
                                                                    style={{
                                                                        width:
                                                                            `${Math.round(
                                                                                42 *
                                                                                    (scale /
                                                                                        100)
                                                                            )}px`,
                                                                        height:
                                                                            `${Math.round(
                                                                                42 *
                                                                                    (scale /
                                                                                        100)
                                                                            )}px`,
                                                                        borderRadius:
                                                                            maskShape ===
                                                                            "circle"
                                                                                ? "50%"
                                                                                : maskShape ===
                                                                                  "rounded"
                                                                                ? "8px"
                                                                                : "0",
                                                                    }}
                                                                />
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={
                                                            processedPreviewSrc
                                                        }
                                                        alt="Aperçu du filigrane"
                                                        style={{
                                                            ...(imageDisplayMode ===
                                                            "cover"
                                                                ? {
                                                                      width:
                                                                          "100%",
                                                                      height:
                                                                          "100%",
                                                                      objectFit:
                                                                          "cover",
                                                                  }
                                                                : imageDisplayMode ===
                                                                  "contain"
                                                                ? {
                                                                      maxWidth:
                                                                          `${Math.round(
                                                                              80 *
                                                                                  (scale /
                                                                                      100)
                                                                          )}%`,
                                                                      maxHeight:
                                                                          `${Math.round(
                                                                              80 *
                                                                                  (scale /
                                                                                      100)
                                                                          )}%`,
                                                                      objectFit:
                                                                          "contain",
                                                                  }
                                                                : {
                                                                      maxWidth:
                                                                          `${Math.round(
                                                                              120 *
                                                                                  (scale /
                                                                                      100)
                                                                          )}px`,
                                                                      maxHeight:
                                                                          `${Math.round(
                                                                              120 *
                                                                                  (scale /
                                                                                      100)
                                                                          )}px`,
                                                                      objectFit:
                                                                          "contain",
                                                                  }),
                                                            borderRadius:
                                                                maskShape ===
                                                                "circle"
                                                                    ? "50%"
                                                                    : maskShape ===
                                                                      "rounded"
                                                                    ? "8px"
                                                                    : "0",
                                                        }}
                                                    />
                                                )}

                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-gray-400">

                                                {isProcessing ? (
                                                    <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                                                ) : (
                                                    <ImageIcon className="w-6 h-6" />
                                                )}

                                                <span className="text-[10px] italic">
                                                    {isProcessing
                                                        ? "Traitement…"
                                                        : "Aucune image"}
                                                </span>

                                            </div>
                                        )}

                                    </div>


                                    <span className="text-[10px] text-gray-400 mt-3 text-center">
                                        Studio interactif MACEVO actif.
                                    </span>

                                </div>

                            </div>

                        </div>
                    </div>,
                    document.body
                )}

        </RibbonGroup>
    );
}


/* ===========================================================
   PETIT COMPOSANT LOCAL
   =========================================================== */

function CheckIcon() {
    return (
        <svg
            viewBox="0 0 20 20"
            fill="none"
            className="w-3.5 h-3.5"
            aria-hidden="true"
        >
            <path
                d="M4 10.5 8 14l8-9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}


export default WatermarkGroup;