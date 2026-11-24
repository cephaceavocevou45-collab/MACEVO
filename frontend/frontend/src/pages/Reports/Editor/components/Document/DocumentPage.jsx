/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : DocumentPage.jsx
 * Version : 2.0.0
 * Statut  : Stable
 * Description :
 * Conteneur principal de l'espace de travail de l'éditeur.
 *
 * IMPORTANT :
 * Le format A4 et la pagination sont désormais entièrement
 * gérés par PaginationPlus dans EditorContext.jsx.
 *
 * DocumentPage ne définit donc plus :
 * - w-[210mm]
 * - min-h-[297mm]
 * - px-[25mm]
 * - py-[25mm]
 *
 * afin d'éviter une double structure A4.
 * ============================================================
 */

export default function DocumentPage({

    children,

    format = "A4",

    orientation = "portrait",

    margin = "normal",

}) {

    return (

        <div
            className="
                flex
                justify-center

                w-full
                min-h-screen

                bg-slate-200

                py-10

                overflow-auto

                box-border
            "
        >

            <div
                className="
                    w-full

                    max-w-none

                    box-border

                    transition-all
                    duration-300

                    print:w-full
                    print:max-w-none

                    print:shadow-none
                    print:rounded-none
                "
            >

                {children}

            </div>

        </div>

    );

}