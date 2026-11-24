/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : ClipboardGroup.jsx
 * Description : Groupe Presse-papiers du ruban MACEVO.
 * Version : 7.0.0
 * Statut  : Fonctionnel — frontend autonome
 * ==========================================================
 */

import {
    Clipboard,
    Copy,
    Scissors,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";


/* ==========================================================
   UTILITAIRES
   ========================================================== */

/**
 * Récupère le texte de la sélection Tiptap.
 */
function getSelectedText(editor) {

    const {
        from,
        to,
    } = editor.state.selection;

    if (from === to) {
        return "";
    }

    return editor.state.doc.textBetween(
        from,
        to,
        "\n"
    );
}


/**
 * Récupère le HTML de la sélection depuis le DOM.
 *
 * Cela permet de conserver le formatage lors d'une copie
 * vers une autre application compatible HTML.
 */
function getSelectedHTML() {

    const selection =
        window.getSelection();

    if (
        !selection ||
        selection.rangeCount === 0
    ) {
        return "";
    }

    try {

        const range =
            selection.getRangeAt(0);

        const fragment =
            range.cloneContents();

        const container =
            document.createElement("div");

        container.appendChild(
            fragment
        );

        return container.innerHTML;

    } catch (error) {

        console.warn(
            "MACEVO : impossible de récupérer le HTML sélectionné.",
            error
        );

        return "";
    }
}


/**
 * Copie du texte dans un textarea temporaire.
 *
 * Fallback pour les navigateurs qui ne supportent pas
 * Clipboard API / ClipboardItem.
 */
function fallbackCopyText(text) {

    const textarea =
        document.createElement("textarea");

    textarea.value = text;

    textarea.setAttribute(
        "readonly",
        ""
    );

    textarea.style.position =
        "fixed";

    textarea.style.left =
        "-9999px";

    textarea.style.top =
        "0";

    textarea.style.opacity =
        "0";

    document.body.appendChild(
        textarea
    );

    textarea.focus();
    textarea.select();

    let success = false;

    try {

        success =
            document.execCommand(
                "copy"
            );

    } catch (error) {

        console.error(
            "MACEVO : fallback copie échoué.",
            error
        );

    }

    document.body.removeChild(
        textarea
    );

    return success;
}


/**
 * Copie texte + HTML dans le presse-papiers.
 */
async function writeClipboard({
    text,
    html,
}) {

    /*
     * ------------------------------------------------------
     * Clipboard API moderne
     * ------------------------------------------------------
     */

    if (
        navigator.clipboard &&
        window.ClipboardItem &&
        navigator.clipboard.write
    ) {

        const clipboardData = {
            "text/plain": new Blob(
                [text || ""],
                {
                    type:
                        "text/plain",
                }
            ),
        };


        /*
         * Le HTML est ajouté uniquement lorsqu'il
         * existe réellement.
         */

        if (html) {

            clipboardData[
                "text/html"
            ] =
                new Blob(
                    [html],
                    {
                        type:
                            "text/html",
                    }
                );
        }


        const item =
            new ClipboardItem(
                clipboardData
            );


        await navigator.clipboard.write(
            [item]
        );

        return true;
    }


    /*
     * ------------------------------------------------------
     * Fallback texte brut
     * ------------------------------------------------------
     */

    return fallbackCopyText(
        text || ""
    );
}


/* ==========================================================
   CLIPBOARD GROUP
   ========================================================== */

function ClipboardGroup({ editor }) {

    if (!editor) {
        return null;
    }


    /* ======================================================
       COLLER
       ====================================================== */

    const handlePaste = async () => {

        try {

            /*
             * --------------------------------------------------
             * API Clipboard moderne
             * --------------------------------------------------
             */

            if (
                navigator.clipboard &&
                navigator.clipboard.read
            ) {

                try {

                    const items =
                        await navigator.clipboard.read();


                    for (const item of items) {

                        /*
                         * ----------------------------------------
                         * HTML
                         * ----------------------------------------
                         */

                        if (
                            item.types.includes(
                                "text/html"
                            )
                        ) {

                            const blob =
                                await item.getType(
                                    "text/html"
                                );

                            const html =
                                await blob.text();


                            if (html) {

                                const success =
                                    editor
                                        .chain()
                                        .focus()
                                        .insertContent(
                                            html
                                        )
                                        .run();

                                if (success) {
                                    return;
                                }
                            }
                        }
                    }

                } catch (error) {

                    /*
                     * Certains navigateurs bloquent
                     * clipboard.read() sans permission.
                     */

                    console.warn(
                        "MACEVO : lecture HTML du presse-papiers indisponible.",
                        error
                    );
                }
            }


            /*
             * --------------------------------------------------
             * Texte brut
             * --------------------------------------------------
             */

            if (
                navigator.clipboard &&
                navigator.clipboard.readText
            ) {

                const text =
                    await navigator.clipboard.readText();


                if (!text) {
                    return;
                }


                editor
                    .chain()
                    .focus()
                    .insertContent(
                        text
                            .replace(
                                /&/g,
                                "&amp;"
                            )
                            .replace(
                                /</g,
                                "&lt;"
                            )
                            .replace(
                                />/g,
                                "&gt;"
                            )
                            .replace(
                                /\r\n/g,
                                "\n"
                            )
                            .replace(
                                /\r/g,
                                "\n"
                            )
                            .replace(
                                /\n/g,
                                "<br>"
                            )
                    )
                    .run();

                return;
            }


            window.alert(
                "Le navigateur ne permet pas l'accès au presse-papiers."
            );

        } catch (error) {

            console.error(
                "MACEVO : impossible de coller.",
                error
            );

            window.alert(
                "Impossible de coller le contenu du presse-papiers."
            );
        }
    };


    /* ======================================================
       COPIER
       ====================================================== */

    const handleCopy = async () => {

        const {
            from,
            to,
        } = editor.state.selection;


        /*
         * Aucune sélection.
         */

        if (from === to) {

            window.alert(
                "Sélectionnez d'abord le contenu à copier."
            );

            return;
        }


        try {

            const text =
                getSelectedText(
                    editor
                );


            const html =
                getSelectedHTML();


            const copied =
                await writeClipboard({
                    text,
                    html,
                });


            if (!copied) {

                throw new Error(
                    "La copie a échoué."
                );
            }

        } catch (error) {

            console.error(
                "MACEVO : impossible de copier.",
                error
            );

            window.alert(
                "Impossible de copier la sélection."
            );
        }
    };


    /* ======================================================
       COUPER
       ====================================================== */

    const handleCut = async () => {

        const {
            from,
            to,
        } = editor.state.selection;


        /*
         * Aucune sélection.
         */

        if (from === to) {

            window.alert(
                "Sélectionnez d'abord le contenu à couper."
            );

            return;
        }


        try {

            /*
             * --------------------------------------------------
             * Récupération de la sélection
             * --------------------------------------------------
             */

            const text =
                getSelectedText(
                    editor
                );


            const html =
                getSelectedHTML();


            /*
             * --------------------------------------------------
             * Copie
             * --------------------------------------------------
             */

            const copied =
                await writeClipboard({
                    text,
                    html,
                });


            if (!copied) {

                throw new Error(
                    "Impossible de copier avant suppression."
                );
            }


            /*
             * --------------------------------------------------
             * Suppression
             * --------------------------------------------------
             */

            editor
                .chain()
                .focus()
                .deleteSelection()
                .run();

        } catch (error) {

            console.error(
                "MACEVO : impossible de couper.",
                error
            );

            window.alert(
                "Impossible de couper la sélection."
            );
        }
    };


    /* ======================================================
       RENDU
       ====================================================== */

    return (

        <RibbonGroup title="Presse-papiers">

            <div
                className="
                    flex
                    items-center
                    gap-1
                    h-full
                "
            >

                {/* ==========================================
                    COLLER
                   ========================================== */}

                <RibbonButton
                    icon={Clipboard}
                    label="Coller"
                    tooltip="Coller le contenu du presse-papiers"
                    onClick={
                        handlePaste
                    }
                />


                {/* ==========================================
                    COPIER
                   ========================================== */}

                <RibbonButton
                    icon={Copy}
                    label="Copier"
                    tooltip="Copier la sélection"
                    onClick={
                        handleCopy
                    }
                />


                {/* ==========================================
                    COUPER
                   ========================================== */}

                <RibbonButton
                    icon={Scissors}
                    label="Couper"
                    tooltip="Couper la sélection"
                    onClick={
                        handleCut
                    }
                />

            </div>

        </RibbonGroup>

    );
}


export default ClipboardGroup;