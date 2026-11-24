/**
 * ===========================================================
 * MACEVO — ÉDITEUR SCIENTIFIQUE
 * -----------------------------------------------------------
 * Fichier : SpacingGroup.jsx
 * Version : 4.0.0
 * Statut  : Espacement du paragraphe courant
 * ===========================================================
 */

import {
    BetweenHorizontalStart,
    BetweenHorizontalEnd,
    Rows3,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

function SpacingGroup() {
    const { editor } = useEditorContext();

    if (!editor) {
        return null;
    }

    /**
     * ---------------------------------------------------------
     * APPLICATION DE L'ESPACEMENT
     * ---------------------------------------------------------
     *
     * On conserve l'API Tiptap déjà utilisée par MACEVO.
     * L'attribut "style" est appliqué au paragraphe courant.
     */

    const changeSpacing = (type) => {
        try {
            const currentStyle = editor.getAttributes("paragraph")?.style || "";
            const declarations = new Map(currentStyle.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
                const index = part.indexOf(":");
                return index < 0 ? ["", ""] : [part.slice(0, index).trim().toLowerCase(), part.slice(index + 1).trim()];
            }).filter(([key]) => key));
            switch (type) {
                case "before":
                    declarations.set("margin-top", "20px");
                    break;

                case "after":
                    declarations.set("margin-bottom", "20px");
                    break;

                case "line-height":
                    declarations.set("line-height", "2");
                    break;

                default:
                    break;
            }
            editor.chain().focus().updateAttributes("paragraph", {
                style: [...declarations].map(([key, value]) => `${key}: ${value}`).join("; "),
            }).run();
        } catch (error) {
            console.error(
                "[MACEVO Spacing] Erreur lors de l'application de l'espacement :",
                error
            );
        }
    };

    return (
        <RibbonGroup
            title="Espacement"
            width="w-[210px] min-w-[210px]"
        >
            <div className="grid w-full grid-cols-3 gap-1">
                {/* =================================================
                    ESPACEMENT AVANT
                   ================================================= */}

                <RibbonButton
                    icon={BetweenHorizontalStart}
                    label="Avant"
                    tooltip="Ajouter un espacement avant le paragraphe"
                    onClick={() =>
                        changeSpacing("before")
                    }
                />

                {/* =================================================
                    ESPACEMENT APRÈS
                   ================================================= */}

                <RibbonButton
                    icon={BetweenHorizontalEnd}
                    label="Après"
                    tooltip="Ajouter un espacement après le paragraphe"
                    onClick={() =>
                        changeSpacing("after")
                    }
                />

                {/* =================================================
                    INTERLIGNE
                   ================================================= */}

                <RibbonButton
                    icon={Rows3}
                    label="Interligne"
                    tooltip="Appliquer un interligne de 2"
                    onClick={() =>
                        changeSpacing("line-height")
                    }
                />
            </div>
        </RibbonGroup>
    );
}

export default SpacingGroup;
