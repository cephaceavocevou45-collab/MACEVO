/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : ReferencesTab.jsx
 * Version : 2.0.0
 * Statut  : Stable
 * ==========================================================
 */

import RibbonDivider from "../components/RibbonDivider";

import TableOfContentsGroup from "../groups/TableOfContentsGroup";
import FootnotesGroup from "../groups/FootnotesGroup";
import CitationsGroup from "../groups/CitationsGroup";
import BibliographyGroup from "../groups/BibliographyGroup";
import CaptionsGroup from "../groups/CaptionsGroup";
import CrossReferencesGroup from "../groups/CrossReferencesGroup";
import IndexGroup from "../groups/IndexGroup";
import TableOfFiguresGroup from "../groups/TableOfFiguresGroup";

import { useEditorContext } from "../../EditorContext";


/* ==========================================================
   COMPOSANT
========================================================== */

function ReferencesTab() {

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

            {/* ==================== TABLE DES MATIÈRES ==================== */}

            <TableOfContentsGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== NOTES ==================== */}

            <FootnotesGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== CITATIONS ==================== */}

            <CitationsGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== BIBLIOGRAPHIE ==================== */}

            <BibliographyGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== LÉGENDES ==================== */}

            <CaptionsGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== RENVOIS ==================== */}

            <CrossReferencesGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== INDEX ==================== */}

            <IndexGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== TABLES ==================== */}

            <TableOfFiguresGroup editor={editor} />

        </div>

    );

}

export default ReferencesTab;