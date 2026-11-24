/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : ExportTab.jsx
 * Version : 2.1.0
 * Statut  : Stable
 * ===========================================================
 */

import RibbonDivider from "../components/RibbonDivider";

import PDFGroup from "../groups/PDFGroup";
import WordGroup from "../groups/WordGroup";
import HTMLGroup from "../groups/HTMLGroup";
import MarkdownGroup from "../groups/MarkdownGroup";
import PrintGroup from "../groups/PrintGroup";
import ShareGroup from "../groups/ShareGroup";
import CloudGroup from "../groups/CloudGroup";
import SignatureGroup from "../groups/SignatureGroup";
import LatexGroup from "../groups/LatexGroup";

import { useEditorContext } from "../../EditorContext";

/* ==========================================================
    COMPOSANT
========================================================== */

function ExportTab() {
    const { editor } = useEditorContext();

    if (!editor) {
        return null;
    }

    return (
        <div
            className="
                flex
                items-stretch
                overflow-x-auto
                px-2
                py-1
                bg-white
            "
        >
            {/* ==================== PDF ==================== */}
            <PDFGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== WORD ==================== */}
            <WordGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== HTML ==================== */}
            <HTMLGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== MARKDOWN ==================== */}
            <MarkdownGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== IMPRESSION ==================== */}
            <PrintGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== PARTAGE ==================== */}
            <ShareGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== CLOUD ==================== */}
            <CloudGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== SIGNATURE ==================== */}
            <SignatureGroup editor={editor} />
        
            <RibbonDivider />

            {/* ==================== LATEX ==================== */}
            <LatexGroup editor={editor} />
        </div>
    );
}

export default ExportTab;