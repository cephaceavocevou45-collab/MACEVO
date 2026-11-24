/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : LayoutContext.jsx
 * Version : 2.0.0
 * Statut  : Stable
 * Description : Contexte partagé de la mise en page.
 * ============================================================
 */

import {
    createContext,
    useEffect,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";
import { useEditorContext } from "./EditorContext";
import { PAGE_SIZES } from "tiptap-pagination-plus";

/* ==========================================================
   CONTEXTE
========================================================== */

const LayoutContext = createContext(null);

const escapeXml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/\"/g, "&quot;");

function buildPageArtwork({ width, height, background, borders, watermark }) {
    const pageStep = height + 28;
    const border = borders && typeof borders === "object" ? borders : null;
    const stroke = border && border.style !== "none"
        ? `stroke=\"${escapeXml(border.color || "#334155")}\" stroke-width=\"${Math.max(1, Math.min(12, Number(border.width) || 1))}\" stroke-dasharray=\"${border.style === "dashed" ? "8 5" : border.style === "dotted" ? "1 5" : "none"}\"`
        : "";
    let mark = "";
    if (watermark?.watermarkType === "text" && watermark.textContent) {
        const size = Math.max(18, Math.min(140, 70 * (Number(watermark.scale) || 100) / 100));
        mark = `<text x=\"50%\" y=\"50%\" text-anchor=\"middle\" dominant-baseline=\"middle\" transform=\"rotate(${Number(watermark.rotation) || 0} ${width / 2} ${height / 2})\" fill=\"${escapeXml(watermark.textColor || "#666666")}\" fill-opacity=\"${Math.max(0.02, Math.min(0.8, Number(watermark.opacity) || 0.15))}\" font-family=\"Arial,sans-serif\" font-size=\"${size}\" font-weight=\"700\">${escapeXml(watermark.textContent)}</text>`;
    } else if (watermark?.watermarkType === "image" && /^data:image\//i.test(watermark.imageSrc || "")) {
        const size = Math.max(20, Math.min(100, Number(watermark.scale) || 100));
        const imageW = width * size / 100;
        const imageH = height * size / 100;
        mark = `<image href=\"${escapeXml(watermark.imageSrc)}\" x=\"${(width - imageW) / 2}\" y=\"${(height - imageH) / 2}\" width=\"${imageW}\" height=\"${imageH}\" preserveAspectRatio=\"xMidYMid meet\" opacity=\"${Math.max(0.02, Math.min(0.8, Number(watermark.opacity) || 0.15))}\" transform=\"rotate(${Number(watermark.rotation) || 0} ${width / 2} ${height / 2})\"/>`;
    }
    const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${width}\" height=\"${pageStep}\" viewBox=\"0 0 ${width} ${pageStep}\"><rect x=\"0.5\" y=\"0.5\" width=\"${Math.max(0, width - 1)}\" height=\"${Math.max(0, height - 1)}\" fill=\"${escapeXml(background || "#FFFFFF")}\" ${stroke}/>${mark}</svg>`;
    return { pageStep, image: `url(\"data:image/svg+xml,${encodeURIComponent(svg)}\")` };
}

/* ==========================================================
   PROVIDER
========================================================== */

function LayoutProvider({ children }) {

    const {
        reportId,
        currentDocument,
        getMacevoDocument,
        templateDesign,
        updatePageSettings,
        editor,
    } = useEditorContext();

    /* ==========================================
       ETAT DE LA MISE EN PAGE
    ========================================== */

    const [layout, setLayout] = useState({

        margins: { preset: "normal", top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },

        orientation: "portrait",

        pageSize: "A4",

        columns: 1,

        background: "#FFFFFF",

        watermark: null,

        borders: "none",

        lineNumbers: "disable",

    });

    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const lastPersistedLayout = useRef("");

    useEffect(() => {
        const model = getMacevoDocument?.();
        if (reportId && !currentDocument) return;
        const savedPage = model?.design?.page || {};
        const savedSettings = model?.settings || {};
        const templatePage = templateDesign?.page || {};
        const savedLayout = model?.design?.layout || {};
        const storageKey = `macevo:page-layout:${reportId || currentDocument?.id || "draft"}`;
        let local = null;

        try {
            local = JSON.parse(localStorage.getItem(storageKey) || "null");
        } catch {
            local = null;
        }

        const margins = savedSettings.margins || savedPage.margins || templatePage.margins || local?.margins;
        const resolved = {
            margins: margins && typeof margins === "object"
                ? { preset: margins.preset || "custom", ...margins }
                : { preset: "normal", top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
            pageSize: savedSettings.pageSize || savedPage.size || templatePage.size || local?.pageSize || "A4",
            orientation: savedSettings.orientation || savedPage.orientation || templatePage.orientation || local?.orientation || "portrait",
            columns: Number(model?.design?.layout?.columns || local?.columns || 1),
            background: savedSettings.background || savedPage.background || local?.background || "#FFFFFF",
            borders: savedSettings.borders || savedPage.borders || local?.borders || "none",
            watermark: Object.prototype.hasOwnProperty.call(savedSettings, "watermark") ? savedSettings.watermark : (Object.prototype.hasOwnProperty.call(savedPage, "watermark") ? savedPage.watermark : local?.watermark ?? null),
            headerFooter: savedSettings.headerFooter || savedPage.headerFooter || local?.headerFooter || {},
            lineNumbers: savedSettings.lineNumbers || savedLayout.lineNumbers || local?.lineNumbers || "disable",
        };
        setLayout((previous) => ({
            ...previous,
            ...resolved,
        }));
        lastPersistedLayout.current = JSON.stringify({
            pageSize: resolved.pageSize,
            orientation: resolved.orientation,
            margins: resolved.margins,
            columns: resolved.columns,
            background: resolved.background,
            borders: resolved.borders,
            watermark: resolved.watermark,
            headerFooter: resolved.headerFooter,
            lineNumbers: resolved.lineNumbers,
        });
        setSettingsLoaded(true);
    }, [reportId, currentDocument?.id, templateDesign]);

    useEffect(() => {
        if (!settingsLoaded) return undefined;

        const settingsSnapshot = {
            pageSize: layout.pageSize,
            orientation: layout.orientation,
            margins: layout.margins,
            columns: layout.columns,
            background: layout.background,
            borders: layout.borders,
            watermark: layout.watermark,
            headerFooter: layout.headerFooter,
            lineNumbers: layout.lineNumbers,
        };
        const serialized = JSON.stringify(settingsSnapshot);
        if (serialized === lastPersistedLayout.current) return undefined;

        const storageKey = `macevo:page-layout:${reportId || currentDocument?.id || "draft"}`;
        try {
            localStorage.setItem(storageKey, serialized);
        } catch {
            // Le réglage reste actif dans la session même si le stockage local est indisponible.
        }

        const timeout = window.setTimeout(() => {
            Promise.resolve(updatePageSettings?.(settingsSnapshot)).then(() => {
                lastPersistedLayout.current = serialized;
            }).catch((error) => {
                console.error("MACEVO : échec de sauvegarde des réglages de page.", error);
            });
        }, 700);

        return () => window.clearTimeout(timeout);
    }, [layout, settingsLoaded, reportId, currentDocument?.id, updatePageSettings]);

    useEffect(() => {
        if (!editor || !settingsLoaded) return;
        const base = PAGE_SIZES[String(layout.pageSize || "A4").toUpperCase()] || PAGE_SIZES.A4;
        const landscape = layout.orientation === "landscape";
        const margins = layout.margins || {};
        const toPixels = (value) => Math.max(0, Number(value ?? 25.4)) * 96 / 25.4;
        const page = {
            pageWidth: landscape ? base.pageHeight : base.pageWidth,
            pageHeight: landscape ? base.pageWidth : base.pageHeight,
            marginTop: toPixels(margins.top),
            marginRight: toPixels(margins.right),
            marginBottom: toPixels(margins.bottom),
            marginLeft: toPixels(margins.left),
        };

        if (typeof editor.commands.updatePageSize === "function") {
            editor.commands.updatePageSize(page);
        } else {
            editor.commands.updatePageWidth?.(page.pageWidth);
            editor.commands.updatePageHeight?.(page.pageHeight);
            editor.commands.updateMargins?.({
                top: page.marginTop,
                right: page.marginRight,
                bottom: page.marginBottom,
                left: page.marginLeft,
            });
        }
    }, [editor, settingsLoaded, layout.pageSize, layout.orientation, layout.margins]);

    useEffect(() => {
        if (!editor || !settingsLoaded) return;
        const base = PAGE_SIZES[String(layout.pageSize || "A4").toUpperCase()] || PAGE_SIZES.A4;
        const landscape = layout.orientation === "landscape";
        const width = landscape ? base.pageHeight : base.pageWidth;
        const height = landscape ? base.pageWidth : base.pageHeight;
        const { pageStep, image } = buildPageArtwork({
            width,
            height,
            background: layout.background,
            borders: layout.borders,
            watermark: layout.watermark,
        });
        const root = editor.view?.dom;
        if (!root) return;
        root.style.setProperty("--macevo-page-artwork", image);
        root.style.setProperty("--macevo-page-step", `${pageStep}px`);
        // PaginationPlus peut changer les classes du nœud paginé selon la version.
        // Appliquer la surface au vrai nœud ProseMirror garantit qu'il ne devient
        // pas transparent et conserve la couleur choisie dans Mise en page.
        root.style.setProperty("background-color", layout.background || "#FFFFFF", "important");
        root.style.setProperty("background-image", image, "important");
        root.style.setProperty("background-size", `${width}px ${pageStep}px`, "important");
        root.style.setProperty("background-repeat", "repeat-y", "important");
        root.style.setProperty("background-position", "top left", "important");
        root.dataset.macevoLineNumbers = layout.lineNumbers || "disable";
        root.style.setProperty("--macevo-line-number-color", "#94a3b8");

        const header = layout.headerFooter || {};
        editor.commands.updateHeaderContent?.(header.headerLeft || "", header.headerRight || "");
        const footerLeft = header.footerLeft || "";
        const footerRight = header.showPageNumber
            ? [header.footerRight, "Page {page}"].filter(Boolean).join(" · ")
            : (header.footerRight || "");
        editor.commands.updateFooterContent?.(footerLeft, footerRight);
    }, [editor, settingsLoaded, layout.pageSize, layout.orientation, layout.background, layout.borders, layout.watermark, layout.lineNumbers, layout.headerFooter]);

    /* ==========================================
       MARGES
    ========================================== */

    function setMargins(value) {

        setLayout((previous) => ({

            ...previous,

            margins: value,

        }));

    }

    /* ==========================================
       ORIENTATION
    ========================================== */

    function setOrientation(value) {

        setLayout((previous) => ({

            ...previous,

            orientation: value,

        }));

    }

    /* ==========================================
       TAILLE DE PAGE
    ========================================== */

    function setPageSize(value) {

        setLayout((previous) => ({

            ...previous,

            pageSize: value,

        }));

    }

    /* ==========================================
       COLONNES
    ========================================== */

    function setColumns(value) {

        setLayout((previous) => ({

            ...previous,

            columns: value,

        }));

    }

    /* ==========================================
       ARRIÈRE-PLAN
    ========================================== */

    function setBackground(value) {

        setLayout((previous) => ({

            ...previous,

            background: value,

        }));

    }

    /* ==========================================
       FILIGRANE
    ========================================== */

    function setWatermark(value) {

        setLayout((previous) => ({

            ...previous,

            watermark: value,

        }));

    }

    /* ==========================================
       BORDURES
    ========================================== */

    function setBorders(value) {

        setLayout((previous) => ({

            ...previous,

            borders: value,

        }));

    }

    /* ==========================================
       NUMÉROS DE LIGNE
    ========================================== */

    function setLineNumbers(value) {

        setLayout((previous) => ({

            ...previous,

            lineNumbers: value,

        }));

    }

    function setHeaderFooter(value) {
        setLayout((previous) => ({ ...previous, headerFooter: value }));
    }

    /* ==========================================
       VALEUR PARTAGÉE
    ========================================== */

    const value = useMemo(() => ({

        layout,

        setMargins,

        setOrientation,

        setPageSize,

        setColumns,

        setBackground,

        setWatermark,

        setBorders,

        setLineNumbers,
        setHeaderFooter,

    }), [layout]);

    return (

        <LayoutContext.Provider value={value}>

            {children}

        </LayoutContext.Provider>

    );

}

/* ==========================================================
   HOOK
========================================================== */

function useLayoutContext() {

    const context = useContext(LayoutContext);

    if (!context) {

        throw new Error(

            "useLayoutContext doit être utilisé dans LayoutProvider."

        );

    }

    return context;

}

/* ==========================================================
   EXPORTS
========================================================== */

export {

    LayoutProvider,

    useLayoutContext,

};
