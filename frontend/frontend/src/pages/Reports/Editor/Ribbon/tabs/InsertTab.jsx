/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : InsertTab.jsx
 * Version : 2.0.0
 * Statut  : Stable
 * ==========================================================
 */

import RibbonDivider from "../components/RibbonDivider";

import PagesGroup from "../groups/PagesGroup";
import TablesGroup from "../groups/TablesGroup";
import ImagesGroup from "../groups/ImagesGroup";
import ShapesGroup from "../groups/ShapesGroup";
import EquationGroup from "../groups/EquationGroup";

import LinksGroup from "../groups/LinksGroup";
import CommentsGroup from "../groups/CommentsGroup";

import { useEditorContext } from "../../EditorContext";

/* ==========================================================
   COMPOSANT
========================================================== */

function InsertTab() {

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

            {/* ==================== PAGES ==================== */}

            <PagesGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== TABLEAUX ==================== */}

            <TablesGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== IMAGES ==================== */}

            <ImagesGroup />

            <RibbonDivider />

            {/* ==================== FORMES ==================== */}

            <ShapesGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== ÉQUATIONS ==================== */}

            <EquationGroup editor={editor} />

            <RibbonDivider />

            

            {/* ==================== LIENS ==================== */}

            <LinksGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== EN-TÊTE / PIED ==================== */}


            {/* ==================== COMMENTAIRES ==================== */}

            <CommentsGroup />



        </div>

    );

}

/* ==========================================================
   EXPORT
========================================================== */

export default InsertTab;
