/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexPdfView.jsx
 * Description : Aperçu PDF LaTeX
 * Version : 1.0.0
 * Statut : Développement
 * ==========================================================
 */

import { FileOutput } from "lucide-react";

import useLatex from "../hooks/useLatex";

function LatexPdfView() {
    const {

    pdf,

} = useLatex();

    return (

        <div
            className="
                flex
                flex-col
                h-full
                bg-white
            "
        >

            {/* ======================================================
                EN-TÊTE
            ====================================================== */}

            <header
                className="
                    flex
                    items-center
                    gap-2

                    px-4
                    py-3

                    border-b
                    border-gray-200

                    bg-gray-50
                "
            >

                <FileOutput size={18} />

                <span className="font-medium">

                    Aperçu PDF

                </span>

            </header>

            {/* ======================================================
                CONTENU
            ====================================================== */}

            <div
                className="
                    flex-1

                    flex
                    items-center
                    justify-center

                    bg-gray-100
                "
            >

                <div
                    className="
                        w-[210mm]
                        h-[297mm]

                        bg-white

                        shadow-xl

                        border
                        border-gray-300

                        flex
                        items-center
                        justify-center

                        text-gray-400
                    "
                >

                    Le PDF apparaîtra ici après compilation.

                </div>

            </div>

        </div>

    );

}

export default LatexPdfView;