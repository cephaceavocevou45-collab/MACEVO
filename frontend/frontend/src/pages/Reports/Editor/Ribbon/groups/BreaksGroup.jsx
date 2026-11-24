/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : BreaksGroup.jsx
 * Version : 4.0.0
 * Statut  : Professionnel - Gestion des sauts
 * ===========================================================
 */

import {
    FilePlus2,
    Rows3,
    Columns2,
    CornerDownRight,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

function BreaksGroup() {
    const { editor } = useEditorContext();

    if (!editor) {
        return null;
    }

    /* ======================================================
       INSERTION DES DIFFÉRENTS SAUTS
    ====================================================== */

    function insertBreak(type) {
        if (!editor) {
            return;
        }

        if (type === "line") {
            editor.chain().focus().setHardBreak().run();
            return;
        }

        switch (type) {
            /* ==============================================
               SAUT DE PAGE
            ============================================== */

            case "page":
                editor.chain().focus().insertContent([{ type: "macevoBreak", attrs: { kind: "page" } }, { type: "paragraph" }]).run();
                break;

            /* ==============================================
               SAUT DE SECTION
               
               Pour le moment, on utilise une séparation
               visuelle structurée. Une véritable gestion
               de sections sera reliée au moteur de mise
               en page ultérieurement.
            ============================================== */

            case "section":
                editor.chain().focus().insertContent([{ type: "macevoBreak", attrs: { kind: "section" } }, { type: "paragraph" }]).run();
                break;

            /* ==============================================
               SAUT DE COLONNE
            ============================================== */

            case "column":
                editor.chain().focus().insertContent([{ type: "macevoBreak", attrs: { kind: "column" } }, { type: "paragraph" }]).run();
                break;

            /* ==============================================
               SAUT DE LIGNE
            ============================================== */

            case "line":
                editor.chain().focus().setHardBreak().run();
                break;

            default:
                break;
        }
    }

    /* ======================================================
       RENDU
    ====================================================== */

    return (
        <RibbonGroup
            title="Sauts"
            className="w-[220px] min-w-[220px]"
        >
            <div className="grid w-full grid-cols-4 gap-1">

                {/* ==========================================
                   SAUT DE PAGE
                ========================================== */}

                <RibbonButton
                    icon={FilePlus2}
                    label="Page"
                    tooltip="Insérer un saut de page"
                    onClick={() => insertBreak("page")}
                />

                {/* ==========================================
                   SAUT DE SECTION
                ========================================== */}

                <RibbonButton
                    icon={Rows3}
                    label="Section"
                    tooltip="Insérer un saut de section"
                    onClick={() => insertBreak("section")}
                />

                {/* ==========================================
                   SAUT DE COLONNE
                ========================================== */}

                <RibbonButton
                    icon={Columns2}
                    label="Colonne"
                    tooltip="Insérer un saut de colonne"
                    onClick={() => insertBreak("column")}
                />

                {/* ==========================================
                   SAUT DE LIGNE
                ========================================== */}

                <RibbonButton
                    icon={CornerDownRight}
                    label="Ligne"
                    tooltip="Insérer un saut de ligne"
                    onClick={() => insertBreak("line")}
                />

            </div>
        </RibbonGroup>
    );
}

export default BreaksGroup;
