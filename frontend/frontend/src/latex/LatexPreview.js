/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexPreview.jsx
 * Description : Aperçu de la compilation LaTeX
 * Version : 2.0.0
 * ==========================================================
 */

import { FileOutput } from "lucide-react";

import useLatex from "./hooks/useLatex";

function LatexPreview() {

    const {

        latex,

        pdf,

    } = useLatex();

    return (

        <div
            className="
                flex
                flex-col
                h-full
                bg-gray-100
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
                    border-gray-300

                    bg-white
                "
            >

                <FileOutput size={18} />

                <span className="font-semibold">

                    Aperçu

                </span>

            </header>

            {/* ======================================================
                CONTENU
            ====================================================== */}

            <div
                className="
                    flex-1
                    overflow-auto
                    p-5
                "
            >

                {

                    pdf

                        ? (

                            <iframe

                                title="pdf"

                                src={pdf}

                                className="w-full h-full"

                            />

                        )

                        : (

                            <pre
                                className="
                                    whitespace-pre-wrap

                                    font-mono
                                    text-sm

                                    text-gray-800
                                "
                            >

                                {

                                    latex ||

                                    "Cliquez sur « Compiler » pour générer le document."

                                }

                            </pre>

                        )

                }

            </div>

        </div>

    );

}

export default LatexPreview;