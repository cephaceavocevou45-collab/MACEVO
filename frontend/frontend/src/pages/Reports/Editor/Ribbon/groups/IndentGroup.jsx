/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : IndentGroup.jsx
 * Version : 4.0.0
 * Statut  : Retraits scientifiques et académiques
 * ===========================================================
 */

import {
    IndentIncrease,
    IndentDecrease,
    MoveHorizontal,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

function IndentGroup() {
    const { editor } = useEditorContext();

    if (!editor) {
        return null;
    }

    /* ======================================================
       OUTILS
    ====================================================== */

    function getCurrentParagraphElement() {
        const { from } = editor.state.selection;

        let paragraphElement = null;

        editor.state.doc.nodesBetween(
            from,
            from,
            (node) => {
                if (
                    node.type.name === "paragraph" &&
                    !paragraphElement
                ) {
                    paragraphElement = node;
                }
            }
        );

        return paragraphElement;
    }

    function getCurrentIndent() {
        const { from } = editor.state.selection;
        const domAtPos =
            editor.view.domAtPos(from);

        let element = domAtPos.node;

        if (
            element &&
            element.nodeType === Node.TEXT_NODE
        ) {
            element = element.parentElement;
        }

        const paragraph =
            element?.closest?.("p");

        if (!paragraph) {
            return 0;
        }

        const marginLeft =
            parseFloat(
                window
                    .getComputedStyle(paragraph)
                    .marginLeft
            ) || 0;

        return marginLeft;
    }

    function applyParagraphStyle(style) {
        const { from, to } =
            editor.state.selection;

        /*
         * Nous ciblons uniquement le paragraphe
         * actuellement sélectionné/courant.
         *
         * L'attribut style doit être supporté par le
         * schéma Tiptap pour être réellement persisté.
         */
        const paragraphNode =
            getCurrentParagraphElement();

        if (!paragraphNode) {
            return false;
        }

        const currentStyle = editor.getAttributes("paragraph")?.style || "";
        const declarations = new Map(currentStyle.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
            const index = part.indexOf(":");
            return index < 0 ? ["", ""] : [part.slice(0, index).trim().toLowerCase(), part.slice(index + 1).trim()];
        }).filter(([key]) => key));
        const requested = String(style || "").split(";").map((part) => part.trim()).filter(Boolean);
        requested.forEach((part) => {
            const index = part.indexOf(":");
            if (index < 0) return;
            const key = part.slice(0, index).trim().toLowerCase();
            const value = part.slice(index + 1).trim();
            if (value) declarations.set(key, value); else declarations.delete(key);
        });
        return editor
            .chain()
            .focus()
            .setTextSelection({
                from,
                to,
            })
            .updateAttributes("paragraph", {
                style: [...declarations].map(([key, value]) => `${key}: ${value}`).join("; "),
            })
            .run();
    }

    /* ======================================================
       AUGMENTER LE RETRAIT
    ====================================================== */

    function increaseIndent() {
        const currentIndent =
            getCurrentIndent();

        const nextIndent =
            Math.min(
                currentIndent + 40,
                240
            );

        applyParagraphStyle(
            `margin-left: ${nextIndent}px;`
        );
    }

    /* ======================================================
       DIMINUER LE RETRAIT
    ====================================================== */

    function decreaseIndent() {
        const currentIndent =
            getCurrentIndent();

        const nextIndent =
            Math.max(
                currentIndent - 40,
                0
            );

        if (nextIndent === 0) {
            applyParagraphStyle("margin-left:");
            return;
        }

        applyParagraphStyle(
            `margin-left: ${nextIndent}px;`
        );
    }

    /* ======================================================
       PREMIÈRE LIGNE
    ====================================================== */

    function firstLineIndent() {
        const paragraph =
            getCurrentParagraphElement();

        if (!paragraph) {
            return;
        }

        /*
         * Lecture du style actuel afin de permettre
         * un comportement de bascule.
         */
        const { from } =
            editor.state.selection;

        const domAtPos =
            editor.view.domAtPos(from);

        let element = domAtPos.node;

        if (
            element &&
            element.nodeType === Node.TEXT_NODE
        ) {
            element = element.parentElement;
        }

        const paragraphElement =
            element?.closest?.("p");

        if (!paragraphElement) {
            return;
        }

        const currentIndent =
            parseFloat(
                window
                    .getComputedStyle(
                        paragraphElement
                    )
                    .textIndent
            ) || 0;

        const nextIndent =
            currentIndent > 0
                ? 0
                : 40;

        applyParagraphStyle(`text-indent: ${nextIndent === 0 ? "" : `${nextIndent}px`};`);
    }

    return (
        <RibbonGroup
            title="Retraits"
            className="w-[205px] min-w-[205px]"
        >
            <div className="grid w-full grid-cols-3 gap-1">
                <RibbonButton
                    icon={IndentDecrease}
                    label="Diminuer"
                    tooltip="Diminuer le retrait du paragraphe"
                    onClick={decreaseIndent}
                />

                <RibbonButton
                    icon={IndentIncrease}
                    label="Augmenter"
                    tooltip="Augmenter le retrait du paragraphe"
                    onClick={increaseIndent}
                />

                <RibbonButton
                    icon={MoveHorizontal}
                    label="1ère ligne"
                    tooltip="Ajouter ou retirer un retrait de première ligne"
                    onClick={firstLineIndent}
                />
            </div>
        </RibbonGroup>
    );
}

export default IndentGroup;
