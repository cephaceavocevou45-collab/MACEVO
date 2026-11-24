/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LineHeight.js
 * Version : 3.0.0
 * Statut  : Stable
 * Description :
 * Extension Tiptap pour gérer l'interligne
 * sur les paragraphes et les titres.
 * ==========================================================
 */

import { Extension } from "@tiptap/core";


const LineHeight = Extension.create({

    name: "lineHeight",


    /* ======================================================
       ATTRIBUTS GLOBAUX
    ====================================================== */

    addGlobalAttributes() {

        return [

            {

                types: [
                    "paragraph",
                    "heading",
                ],

                attributes: {

                    lineHeight: {

                        default: null,


                        /* ==================================
                           LECTURE HTML
                        ================================== */

                        parseHTML: element => {

                            return (
                                element.style.lineHeight ||
                                null
                            );

                        },


                        /* ==================================
                           RENDU HTML
                        ================================== */

                        renderHTML: attributes => {

                            if (
                                !attributes.lineHeight
                            ) {

                                return {};

                            }

                            return {

                                style:
                                    `line-height: ${attributes.lineHeight}`,

                            };

                        },

                    },

                },

            },

        ];

    },


    /* ======================================================
       COMMANDES
    ====================================================== */

    addCommands() {

        return {

            /* ==============================================
               DÉFINIR L'INTERLIGNE
            ============================================== */

            setLineHeight:
                lineHeight =>
                    ({ state, dispatch }) => {

                        const {
                            selection,
                            tr,
                        } = state;


                        const {
                            from,
                            to,
                        } = selection;


                        let updated = false;


                        /*
                         * Parcourt uniquement les nœuds
                         * réellement concernés par la sélection.
                         */

                        state.doc.nodesBetween(
                            from,
                            to,
                            (node, pos) => {

                                /*
                                 * Paragraphes
                                 */

                                if (
                                    node.type.name ===
                                    "paragraph"
                                ) {

                                    tr.setNodeMarkup(

                                        pos,

                                        undefined,

                                        {
                                            ...node.attrs,

                                            lineHeight,

                                        }

                                    );

                                    updated = true;

                                }


                                /*
                                 * Titres
                                 */

                                if (
                                    node.type.name ===
                                    "heading"
                                ) {

                                    tr.setNodeMarkup(

                                        pos,

                                        undefined,

                                        {
                                            ...node.attrs,

                                            lineHeight,

                                        }

                                    );

                                    updated = true;

                                }

                            }

                        );


                        /*
                         * Si aucun nœud n'a été modifié,
                         * on applique l'interligne au
                         * paragraphe parent courant.
                         */

                        if (!updated) {

                            const parent =
                                selection.$from.parent;


                            const parentPos =
                                selection.$from.before();


                            if (
                                parent.type.name ===
                                    "paragraph" ||
                                parent.type.name ===
                                    "heading"
                            ) {

                                tr.setNodeMarkup(

                                    parentPos,

                                    undefined,

                                    {
                                        ...parent.attrs,

                                        lineHeight,

                                    }

                                );

                                updated = true;

                            }

                        }


                        if (
                            updated &&
                            dispatch
                        ) {

                            dispatch(tr);

                        }


                        return updated;

                    },


            /* ==============================================
               SUPPRIMER L'INTERLIGNE
            ============================================== */

            unsetLineHeight:
                () =>
                    ({ state, dispatch }) => {

                        const {
                            selection,
                            tr,
                        } = state;


                        const {
                            from,
                            to,
                        } = selection;


                        let updated = false;


                        state.doc.nodesBetween(

                            from,

                            to,

                            (node, pos) => {

                                if (
                                    node.type.name ===
                                        "paragraph" ||
                                    node.type.name ===
                                        "heading"
                                ) {

                                    tr.setNodeMarkup(

                                        pos,

                                        undefined,

                                        {
                                            ...node.attrs,

                                            lineHeight: null,

                                        }

                                    );

                                    updated = true;

                                }

                            }

                        );


                        if (!updated) {

                            const parent =
                                selection.$from.parent;


                            const parentPos =
                                selection.$from.before();


                            if (
                                parent.type.name ===
                                    "paragraph" ||
                                parent.type.name ===
                                    "heading"
                            ) {

                                tr.setNodeMarkup(

                                    parentPos,

                                    undefined,

                                    {
                                        ...parent.attrs,

                                        lineHeight: null,

                                    }

                                );

                                updated = true;

                            }

                        }


                        if (
                            updated &&
                            dispatch
                        ) {

                            dispatch(tr);

                        }


                        return updated;

                    },

        };

    },

});


export default LineHeight;