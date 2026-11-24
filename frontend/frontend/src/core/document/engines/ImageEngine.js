/**
 * ============================================================
 * MACEVO
 *
 * ---
 * Fichier : ImageEngine.js
 * Version : 2.1.0
 * Statut : Stable
 * ============================================================
 */

import {
    useEditorContext,
} from "../../../pages/Reports/Editor/EditorContext";


/* ==========================================================
   HOOK
========================================================== */

export function useImageEngine() {

    const {
        editor,
    } = useEditorContext();


    /**
     * ==========================================
     * IMAGE DEPUIS LE PC
     * ==========================================
     */

    function openImage() {

        if (!editor) {
            return;
        }


        const input =
            document.createElement(
                "input"
            );


        input.type =
            "file";


        input.accept =
            "image/*";


        input.onchange = () => {

            const file =
                input.files?.[0];


            if (!file) {
                return;
            }


            const reader =
                new FileReader();


            reader.onload = () => {

                editor
                    .chain()
                    .focus()
                    .setImage({

                        src:
                            reader.result,

                    })
                    .run();

            };


            reader.readAsDataURL(
                file
            );

        };


        input.click();

    }


    /**
     * ==========================================
     * IMAGE PAR URL
     * ==========================================
     */

    function insertImageUrl() {

        if (!editor) {
            return;
        }


        const url =
            window.prompt(
                "URL de l'image"
            );


        if (!url) {
            return;
        }


        editor
            .chain()
            .focus()
            .setImage({

                src: url,

            })
            .run();

    }


    /**
     * ==========================================
     * API PUBLIQUE
     * ==========================================
     */

    return {

        openImage,

        insertImageUrl,

    };

}